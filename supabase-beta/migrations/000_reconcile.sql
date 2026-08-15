-- 000_reconcile.sql
-- kinu-beta · F3/Arco 2 v2 · reconciliação com o estado REAL do banco.
--
-- ORDEM DE APLICAÇÃO: 000 -> 001 -> 002 -> 003 -> prova-rls.sql
--
-- O que este arquivo faz: derruba os ESQUELETOS VAZIOS que conflitam com o
-- schema novo (public.trips no formato colunar e public.profiles em 3 colunas),
-- soltando antes as FKs que estão presas neles.
--
-- O que este arquivo NÃO faz, em nenhuma hipótese:
--   * não encosta em curated_activities nem em curated_hotels (dados vivos);
--   * não apaga tabela com linha dentro — aborta se encontrar (seção 1);
--   * não usa DROP ... CASCADE cego: as FKs caem uma a uma, com log.
--
-- Idempotente: rodar duas vezes é inofensivo (a segunda vez não acha nada).

-- =====================================================================
-- 1. GUARDAS — este bloco é a diferença entre uma migration e um acidente
-- =====================================================================
do $$
declare
  n bigint;
begin
  -- 1a. Fingerprint do banco: curated_* só existem no kinu-beta.
  -- Se este script for colado por engano no SQL Editor do Lovable Cloud,
  -- ele para AQUI, antes de qualquer DDL.
  if to_regclass('public.curated_activities') is null
     or to_regclass('public.curated_hotels') is null then
    raise exception
      'ABORTADO: curated_activities/curated_hotels nao encontradas. Este script e do kinu-beta - voce esta no banco certo?';
  end if;

  -- 1b. Só derruba esqueleto. Uma linha que seja e a migration para.
  if to_regclass('public.trips') is not null then
    execute 'select count(*) from public.trips' into n;
    if n > 0 then
      raise exception 'ABORTADO: public.trips tem % linha(s). Esta migration so derruba tabela vazia.', n;
    end if;
  end if;

  if to_regclass('public.profiles') is not null then
    execute 'select count(*) from public.profiles' into n;
    if n > 0 then
      raise exception 'ABORTADO: public.profiles tem % linha(s). Esta migration so derruba tabela vazia.', n;
    end if;
  end if;

  -- 1c. Resto de uma aplicação parcial da versão em português.
  if to_regclass('public.kinu_sessoes') is not null then
    execute 'select count(*) from public.kinu_sessoes' into n;
    if n > 0 then
      raise exception 'ABORTADO: public.kinu_sessoes tem % linha(s) - investigar antes de derrubar.', n;
    end if;
  end if;

  raise notice 'guardas OK: banco e o kinu-beta e as tabelas alvo estao vazias.';
end $$;

-- =====================================================================
-- 2. Soltar as FKs presas nas tabelas que vão cair
--    (price_alerts.trip_id e monitor_offers.trip_id, hoje -> trips antiga).
--    Uma a uma, com log, em vez de DROP CASCADE: se amanhã existir uma FK
--    que ninguém mapeou, ela aparece no output em vez de sumir calada.
-- =====================================================================
do $$
declare
  r record;
begin
  for r in
    select con.conname, child.relname as child_table
      from pg_constraint con
      join pg_class     child on child.oid = con.conrelid
      join pg_class     ref   on ref.oid   = con.confrelid
      join pg_namespace nref  on nref.oid  = ref.relnamespace
     where con.contype = 'f'
       and nref.nspname = 'public'
       and ref.relname in ('trips', 'profiles', 'kinu_sessoes')
  loop
    raise notice 'soltando FK % (em public.%)', r.conname, r.child_table;
    execute format('alter table public.%I drop constraint %I', r.child_table, r.conname);
  end loop;
end $$;

-- =====================================================================
-- 3. Derrubar os esqueletos
--    SEM cascade de propósito: se sobrou alguma view/dependência que o
--    diagnóstico não viu, o comando FALHA e você fica sabendo. Um cascade
--    aqui apagaria essa dependência em silêncio.
-- =====================================================================
drop table if exists public.kinu_sessoes;  -- resto da versão em português
drop table if exists public.trips;         -- formato colunar antigo, vazio
drop table if exists public.profiles;      -- 3 colunas, sem preferences, vazio

-- Funções/triggers da versão em português, se a aplicação parcial as criou.
drop function if exists public.set_atualizado_em() cascade;

-- =====================================================================
-- 4. Conferência (o SQL Editor mostra o resultado deste select)
--    Esperado: as 3 primeiras colunas NULL, curated_* com 883 e 132.
-- =====================================================================
select
  to_regclass('public.profiles')::text        as profiles_ainda_existe,
  to_regclass('public.trips')::text           as trips_ainda_existe,
  to_regclass('public.kinu_sessoes')::text    as kinu_sessoes_ainda_existe,
  (select count(*) from public.curated_activities) as curated_activities,
  (select count(*) from public.curated_hotels)     as curated_hotels;
