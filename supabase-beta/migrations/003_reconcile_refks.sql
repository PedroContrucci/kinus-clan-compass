-- 003_reconcile_refks.sql
-- kinu-beta · F3/Arco 2 v2 · religa as tabelas legadas na trips NOVA.
--
-- ORDEM: rodar DEPOIS de 001 (a trips nova precisa existir).
-- O 000 soltou estas FKs porque elas apontavam para a trips antiga, que foi
-- derrubada. Este arquivo as recria apontando para a nova.
--
-- POLÍTICA DE DELETE, decidida por tabela:
--   price_alerts   -> CASCADE.  Um alerta é uma INSTRUÇÃO ATIVA ("vigie o
--                    preço desta viagem"). Sem a viagem, é um job apontando
--                    para o nada, que notifica sobre viagem descartada.
--                    Assinatura sem objeto é lixo.
--   monitor_offers -> SET NULL. Uma offer é uma OBSERVAÇÃO ("no dia X isto
--                    custava Y"). É verdadeira sobre o mundo mesmo sem a
--                    viagem, é inerte (nada dispara a partir dela), e é a
--                    única série histórica de preço que o produto tem.
--
-- NÃO toca em curated_activities, curated_hotels, events nem feedback.
-- Idempotente: drop constraint if exists + add.

-- =====================================================================
-- 1. price_alerts.trip_id -> trips(id) ON DELETE CASCADE
-- =====================================================================
do $$
declare
  col_type text;
begin
  if to_regclass('public.price_alerts') is null then
    raise notice 'public.price_alerts nao existe - pulando.';
    return;
  end if;

  select a.atttypid::regtype::text into col_type
    from pg_attribute a
   where a.attrelid = 'public.price_alerts'::regclass
     and a.attname  = 'trip_id'
     and a.attnum > 0 and not a.attisdropped;

  if col_type is null then
    raise notice 'price_alerts.trip_id nao existe - pulando.';
    return;
  end if;

  if col_type <> 'uuid' then
    raise exception 'ABORTADO: price_alerts.trip_id e % (esperado uuid). FK nao criada.', col_type;
  end if;

  alter table public.price_alerts drop constraint if exists price_alerts_trip_id_fkey;
  alter table public.price_alerts
    add constraint price_alerts_trip_id_fkey
    foreign key (trip_id) references public.trips (id) on delete cascade;
  raise notice 'price_alerts.trip_id -> trips(id) ON DELETE CASCADE: ok';
end $$;

-- Índice na coluna filha: sem ele, cada DELETE em trips faz seq scan aqui.
create index if not exists price_alerts_trip_id_idx on public.price_alerts (trip_id);

-- =====================================================================
-- 2. monitor_offers.trip_id -> trips(id) ON DELETE SET NULL
--    O drop not null vem antes por obrigação: um "set null" numa coluna
--    NOT NULL não falha agora — falha meses depois, no primeiro delete real.
-- =====================================================================
do $$
declare
  col_type text;
  is_nn    boolean;
  n_fk     int;
begin
  if to_regclass('public.monitor_offers') is null then
    raise notice 'public.monitor_offers nao existe - pulando.';
    return;
  end if;

  select a.atttypid::regtype::text, a.attnotnull into col_type, is_nn
    from pg_attribute a
   where a.attrelid = 'public.monitor_offers'::regclass
     and a.attname  = 'trip_id'
     and a.attnum > 0 and not a.attisdropped;

  if col_type is null then
    raise notice 'monitor_offers.trip_id nao existe - pulando.';
    return;
  end if;

  if col_type <> 'uuid' then
    raise exception 'ABORTADO: monitor_offers.trip_id e % (esperado uuid). FK nao criada.', col_type;
  end if;

  if is_nn then
    raise notice 'monitor_offers.trip_id era NOT NULL - soltando (exigencia do ON DELETE SET NULL).';
    alter table public.monitor_offers alter column trip_id drop not null;
  end if;

  alter table public.monitor_offers drop constraint if exists monitor_offers_trip_id_fkey;
  alter table public.monitor_offers
    add constraint monitor_offers_trip_id_fkey
    foreign key (trip_id) references public.trips (id) on delete set null;
  raise notice 'monitor_offers.trip_id -> trips(id) ON DELETE SET NULL: ok';

  -- Caveat do STEP1 §2.2: se monitor_offers também pendurar em
  -- price_alerts com cascade, o set null acima não salva linha nenhuma —
  -- o alerta cai por cascade e leva as offers junto.
  select count(*) into n_fk
    from pg_constraint con
    join pg_class ref on ref.oid = con.confrelid
   where con.contype = 'f'
     and con.conrelid = 'public.monitor_offers'::regclass
     and ref.relname = 'price_alerts'
     and con.confdeltype = 'c';

  if n_fk > 0 then
    raise notice 'ATENCAO: monitor_offers tem FK CASCADE para price_alerts. O SET NULL acima nao preserva as offers - decisao volta para o arquiteto.';
  end if;
end $$;

create index if not exists monitor_offers_trip_id_idx on public.monitor_offers (trip_id);

-- =====================================================================
-- 3. Conferência
-- =====================================================================
select
  child.relname   as tabela,
  con.conname     as constraint_name,
  ref.relname     as aponta_para,
  case con.confdeltype
    when 'a' then 'no action' when 'r' then 'restrict'
    when 'c' then 'cascade'  when 'n' then 'set null'
    when 'd' then 'set default'
  end             as on_delete
from pg_constraint con
join pg_class child on child.oid = con.conrelid
join pg_class ref   on ref.oid   = con.confrelid
where con.contype = 'f'
  and child.relname in ('price_alerts', 'monitor_offers')
order by child.relname, con.conname;
