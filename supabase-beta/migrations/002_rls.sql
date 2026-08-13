-- 002_rls.sql
-- kinu-beta · F3/Arco 2 · Row Level Security nas 3 tabelas do app.
-- Ordem de aplicação: rodar DEPOIS de 001_profiles_trips_sessoes.sql.
-- Idempotente: drop policy if exists + create policy.
--
-- REGRA, SEM EXCEÇÃO: cada linha pertence a um usuário e só ele a enxerga.
--   profiles     -> id      = auth.uid()
--   trips        -> user_id = auth.uid()
--   kinu_sessoes -> user_id = auth.uid()
-- Não há policy de bypass, não há "somente leitura pública", não há exceção
-- para service_role escrita aqui. (service_role tem BYPASSRLS por atributo de
-- role no Postgres — é um poder do backend, não uma policy: qualquer uso dele
-- é acesso administrativo consciente e fora do app cliente.)
-- NÃO toca em price_alerts nem events.

-- =====================================================================
-- 1. Ligar RLS
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.trips        enable row level security;
alter table public.kinu_sessoes enable row level security;

-- Segundo cadeado: anon não tem nada a fazer nestas tabelas. Sem privilégio
-- de tabela, a requisição nem chega a ser avaliada pelas policies.
revoke all on public.profiles     from anon;
revoke all on public.trips        from anon;
revoke all on public.kinu_sessoes from anon;

grant select, insert, update, delete on public.profiles     to authenticated;
grant select, insert, update, delete on public.trips        to authenticated;
grant select, insert, update, delete on public.kinu_sessoes to authenticated;

-- =====================================================================
-- 2. profiles — a chave é o próprio id
-- =====================================================================
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (id = (select auth.uid()));

-- =====================================================================
-- 3. trips
-- =====================================================================
drop policy if exists trips_select_own on public.trips;
create policy trips_select_own on public.trips
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists trips_insert_own on public.trips;
create policy trips_insert_own on public.trips
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- using + with check: a linha tem de ser dele ANTES e DEPOIS do update.
-- Sem o with check, A poderia trocar user_id para B (doação de linha).
drop policy if exists trips_update_own on public.trips;
create policy trips_update_own on public.trips
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists trips_delete_own on public.trips;
create policy trips_delete_own on public.trips
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- =====================================================================
-- 4. kinu_sessoes
-- =====================================================================
drop policy if exists kinu_sessoes_select_own on public.kinu_sessoes;
create policy kinu_sessoes_select_own on public.kinu_sessoes
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists kinu_sessoes_insert_own on public.kinu_sessoes;
create policy kinu_sessoes_insert_own on public.kinu_sessoes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists kinu_sessoes_update_own on public.kinu_sessoes;
create policy kinu_sessoes_update_own on public.kinu_sessoes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists kinu_sessoes_delete_own on public.kinu_sessoes;
create policy kinu_sessoes_delete_own on public.kinu_sessoes
  for delete to authenticated
  using (user_id = (select auth.uid()));
