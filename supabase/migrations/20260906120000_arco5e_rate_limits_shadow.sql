-- Arco 5.e — contador persistente de rate limit + telemetria da sombra do 5.d.
--
-- Base: RELATORIO-RECON-ARCO5.md §5.3 (o banco do Lovable é o lugar certo),
--       §5.5 (RPC atômica ou nada) · RELATORIO-F3-ARCO5D.md §6 (o que a sombra
--       precisa dizer para o 5.f poder apertar).
--
-- PROJETO: Lovable Cloud (SERVIÇOS). NÃO é o kinu-beta — a regra dos dois bancos
-- vale aqui (supabase-beta/README.md): identidade lá, serviços aqui.
--
-- ESTE ARCO SÓ REGISTRA. Nenhum limite é aplicado por este SQL nem pelas
-- functions que o chamam. `bump_rate` devolve `hits` porque no 5.f o retorno vira
-- a decisão; no 5.e ninguém lê o retorno.
--
-- IDEMPOTENTE DE PONTA A PONTA, e aqui isso não é higiene: o painel do Supabase
-- do projeto Lovable é inacessível (RELATORIO-F3-ARCO5C.md), então esta migração
-- chega em produção por prompt ao Lovable — que vai criar o arquivo DELE com o
-- mesmo DDL. Rodar duas vezes tem que ser inócuo.

-- ---------------------------------------------------------------------------
-- 1. Contador de rate limit — o insumo do 5.f
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket_key   text        not null,   -- 'user:<uuid>' | 'ip:<16 hex>' | 'ip:unknown'
  fn           text        not null,
  window_start timestamptz not null,   -- janela FIXA de 1 hora (date_trunc)
  hits         integer     not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (bucket_key, fn, window_start)
);

comment on table public.rate_limits is
  'Arco 5.e: contagem de requisições por chave opaca e janela de 1h. Chave é '
  'pseudônima (user:<uuid> do kinu-beta ou ip:<sha256 salgado e truncado>) — '
  'contar não exige saber quem é. Faxina em bump_rate: 7 dias.';

-- Sustenta a faxina por janela; sem ele o delete do bump_rate seria seq scan.
create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

-- ---------------------------------------------------------------------------
-- 2. Telemetria diária da sombra — o TELÊMETRO do 5.f
-- ---------------------------------------------------------------------------
-- Sem isto, o critério do 5.d §6.2 ("identified estável por 7 dias corridos" e
-- "motivos de bug < 1% das requisições QUE VIERAM COM HEADER") é imensurável:
-- a leitura de logs pelo Lovable retém só o boot atual, então console.log não é
-- observação.
create table if not exists public.shadow_daily (
  day     date   not null,
  fn      text   not null,
  outcome text   not null,             -- 'identified' | reason do 5.d, já em balde
  hits    bigint not null default 0,
  primary key (day, fn, outcome)
);

comment on table public.shadow_daily is
  'Arco 5.e: agregado diário dos vereditos do modo sombra (5.d). Zero dado '
  'ligável a pessoa — é contagem por (dia, função, desfecho). Sem retenção: '
  'são ~6 linhas por função por dia, e é o registro histórico que o 5.f lê.';

-- ---------------------------------------------------------------------------
-- 3. RLS deny-all: liga o RLS e NÃO cria policy nenhuma
-- ---------------------------------------------------------------------------
alter table public.rate_limits  enable row level security;
alter table public.shadow_daily enable row level security;

-- Segundo cadeado, mesma disciplina do Arco 2 §3 item 2: o Supabase concede
-- privilégio de tabela a anon/authenticated por default no schema public. Sem o
-- revoke, a requisição ainda chegaria a ser avaliada pelo RLS; com ele, nem isso.
revoke all on public.rate_limits  from anon, authenticated;
revoke all on public.shadow_daily from anon, authenticated;
grant  all on public.rate_limits  to service_role;
grant  all on public.shadow_daily to service_role;

-- ---------------------------------------------------------------------------
-- 4. Balde de desfecho — a defesa contra inflação da telemetria
-- ---------------------------------------------------------------------------
-- `alg` vem do HEADER do token, que o verificador lê ANTES de conferir a
-- assinatura (verifyKinuBetaJwt.ts:176) — é string CONTROLADA PELO ATACANTE.
-- Sem allowlist, quem mandar 100 mil `alg` distintos escreve 100 mil linhas em
-- shadow_daily: a tabela de telemetria vira amplificador de escrita.
--
-- A allowlist mora no SQL de propósito: corrigir a lista não exige redeploy de
-- function nenhuma — e redeploy aqui custa um prompt ao Lovable.
--
-- `role:*` NÃO é controlado pelo atacante (a claim só é lida depois da
-- assinatura conferir), mas ganha balde próprio porque o critério do 5.f conta
-- `role:*` como motivo de bug: colapsar em 'other' faria o critério subcontar.
create or replace function public.shadow_outcome_bucket(p_outcome text)
returns text
language sql
immutable
set search_path = pg_temp
as $$
  select case
    when p_outcome is null or p_outcome = '' then 'unknown'
    when p_outcome in (
      'identified','no-header','malformed','expired','not-yet-valid',
      'bad-iss','bad-aud','no-sub','no-kid','unknown-kid','bad-jwk',
      'bad-signature','bad-sig-format','jwks-unavailable',
      'verifier-crashed','shadow-crashed',
      'alg:none','alg:HS256','alg:RS256',
      'role:anon','role:service_role','role:none'
    ) then p_outcome
    when p_outcome like 'alg:%'  then 'alg:other'
    when p_outcome like 'role:%' then 'role:other'
    else 'other'
  end;
$$;

-- ---------------------------------------------------------------------------
-- 5. bump_rate — upsert ATÔMICO, uma instrução (recon §5.5)
-- ---------------------------------------------------------------------------
-- Um `select` seguido de `update` perderia a corrida exatamente na rajada que o
-- 5.f vai querer conter. É por isso que isto é RPC e não duas chamadas REST.
--
-- Janela de 1 HORA: a rajada já é contida em memória pelo burst guard do 5.c
-- (12/10s na kinu-ai, 3/10s na feedback-notify). O que falta ao 5.f é QUOTA, e
-- quota se escreve em hora ou em dia — hora é a granularidade mais fina que
-- ainda agrega para dia sem perda (soma das 24 linhas), e max(hits) dá o pico
-- horário do usuário mais pesado, que é o número de calibração.
create or replace function public.bump_rate(p_key text, p_fn text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_hits   integer;
begin
  if p_key is null or p_fn is null then
    return null;
  end if;

  insert into public.rate_limits (bucket_key, fn, window_start, hits, updated_at)
  values (left(p_key, 80), left(p_fn, 40), v_window, 1, now())
  on conflict (bucket_key, fn, window_start)
  do update set hits = public.rate_limits.hits + 1, updated_at = now()
  returning hits into v_hits;

  -- Faxina oportunista: ~1 em 200 chamadas. Sem pg_cron (não sabemos se está
  -- disponível neste projeto e não há painel para conferir) e sem depender de
  -- alguém lembrar. O índice em window_start faz o delete ser barato.
  if random() < 0.005 then
    delete from public.rate_limits where window_start < now() - interval '7 days';
  end if;

  return v_hits;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. record_shadow
-- ---------------------------------------------------------------------------
create or replace function public.record_shadow(p_fn text, p_outcome text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.shadow_daily (day, fn, outcome, hits)
  values (
    current_date,
    left(coalesce(p_fn, 'unknown'), 40),
    public.shadow_outcome_bucket(p_outcome),
    1
  )
  on conflict (day, fn, outcome)
  do update set hits = public.shadow_daily.hits + 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. record_request — as duas escritas em UM round-trip
-- ---------------------------------------------------------------------------
-- As functions chamam SÓ esta. Uma chamada de rede por requisição em vez de
-- duas, e as duas escritas na mesma transação. `bump_rate` e `record_shadow`
-- continuam existindo sozinhas porque o 5.f vai precisar do retorno de
-- `bump_rate` de forma síncrona, sem escrever telemetria de novo.
create or replace function public.record_request(p_fn text, p_outcome text, p_key text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  perform public.record_shadow(p_fn, p_outcome);
  v_hits := public.bump_rate(p_key, p_fn);
  return v_hits;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. rate_metrics — a leitura agregada que o PostgREST não sabe fazer
-- ---------------------------------------------------------------------------
-- max_hits_hour de kind='user' é O número que o critério 3 do 5.d §6.2 pede:
-- "limite por usuário calibrado com número medido".
create or replace function public.rate_metrics(p_days integer default 7)
returns table (
  day            date,
  fn             text,
  kind           text,
  buckets        bigint,
  reqs           bigint,
  max_hits_hour  integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    window_start::date,
    fn,
    case when bucket_key like 'user:%' then 'user' else 'ip' end,
    count(distinct bucket_key),
    sum(hits)::bigint,
    max(hits)
  from public.rate_limits
  where window_start >= (current_date - greatest(coalesce(p_days, 7), 1))
  group by 1, 2, 3
  order by 1 desc, 2, 3;
$$;

-- ---------------------------------------------------------------------------
-- 9. Grants — no Postgres, função nasce com EXECUTE para PUBLIC
-- ---------------------------------------------------------------------------
-- O revoke abaixo é o que de fato protege. `security definer` sozinho não fecha
-- nada: ele desacopla o privilégio da função do privilégio de quem chama. Sem o
-- revoke, a anon key (que viaja em todo bundle do browser) poderia inflar os
-- contadores — o insumo do 5.f nasceria forjável.
revoke execute on function public.shadow_outcome_bucket(text)      from public;
revoke execute on function public.bump_rate(text, text)            from public;
revoke execute on function public.record_shadow(text, text)        from public;
revoke execute on function public.record_request(text, text, text) from public;
revoke execute on function public.rate_metrics(integer)            from public;

grant execute on function public.record_request(text, text, text) to service_role;
grant execute on function public.bump_rate(text, text)            to service_role;
grant execute on function public.record_shadow(text, text)        to service_role;
grant execute on function public.rate_metrics(integer)            to service_role;
