-- 001_profiles_trips_sessoes.sql
-- kinu-beta · F3/Arco 2 · esquema base da migração do tripStore para o banco.
-- Ordem de aplicação: este arquivo PRIMEIRO, depois 002_rls.sql.
-- Idempotente: pode ser rodado mais de uma vez sem erro.
-- NÃO toca em price_alerts nem events.

-- =====================================================================
-- 1. profiles — espelho de auth.users com os dados do app
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome          text,
  criado_em     timestamptz not null default now(),
  preferencias  jsonb       not null default '{}'::jsonb
);

comment on table  public.profiles is 'Perfil do usuário do Kinu; 1:1 com auth.users. Criado automaticamente no signup.';
comment on column public.profiles.preferencias is 'Preferências livres do usuário (jsonb aberto, sem schema fixo por ora).';

-- =====================================================================
-- 2. trips — payload cru do SavedTrip (o funil hermético do Arco 1)
--    O app continua dono do formato; o banco só projeta 2 colunas
--    geradas (status, destination) para índice/filtro barato.
-- =====================================================================
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  payload         jsonb not null,
  schema_version  int  not null default 1,
  status          text generated always as (payload ->> 'status') stored,
  destination     text generated always as (payload ->> 'destination') stored,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

comment on table  public.trips is 'Uma viagem = um SavedTrip do app, guardado cru em payload. schema_version versiona o formato do payload.';
comment on column public.trips.status is 'Coluna GERADA de payload->>status (draft|active|ongoing|completed). Somente leitura: escreva no payload.';
comment on column public.trips.destination is 'Coluna GERADA de payload->>destination. Somente leitura: escreva no payload.';

create index if not exists trips_user_id_atualizado_em_idx
  on public.trips (user_id, atualizado_em desc);

-- =====================================================================
-- 3. atualizado_em — carimbo automático no UPDATE
-- =====================================================================
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_trips_atualizado_em on public.trips;
create trigger trg_trips_atualizado_em
  before update on public.trips
  for each row execute function public.set_atualizado_em();

-- =====================================================================
-- 4. kinu_sessoes — histórico de conversa do Kinu AI
-- =====================================================================
create table if not exists public.kinu_sessoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  trip_id    uuid references public.trips (id) on delete set null,
  mensagens  jsonb not null default '[]'::jsonb,
  criado_em  timestamptz not null default now()
);

comment on table public.kinu_sessoes is 'Sessão de conversa com o Kinu AI. trip_id é opcional e vira NULL se a viagem for apagada (a conversa sobrevive).';

-- Índices de apoio: o de trip_id evita seq scan no "set null" quando uma trip é apagada.
create index if not exists kinu_sessoes_user_id_criado_em_idx
  on public.kinu_sessoes (user_id, criado_em desc);
create index if not exists kinu_sessoes_trip_id_idx
  on public.kinu_sessoes (trip_id);

-- =====================================================================
-- 5. Auto-criação do profile no signup (padrão Supabase)
--    security definer + search_path fixado: a função roda como dona,
--    e não como o usuário recém-criado.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nome',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
