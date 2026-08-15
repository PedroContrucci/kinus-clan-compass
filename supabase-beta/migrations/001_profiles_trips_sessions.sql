-- 001_profiles_trips_sessions.sql
-- kinu-beta · F3/Arco 2 v2 · esquema base da migração do tripStore para o banco.
--
-- ORDEM: rodar DEPOIS de 000_reconcile.sql.
-- Idempotente: pode ser rodado mais de uma vez sem erro.
-- Vocabulário em INGLÊS, alinhado ao que já existe no kinu-beta.
-- NÃO toca em curated_activities, curated_hotels, events, feedback,
-- price_alerts nem monitor_offers.

-- =====================================================================
-- 1. profiles — espelho 1:1 de auth.users com os dados do app
--    id é PK *e* FK: apagou o usuário no Auth, o perfil vai junto,
--    e atrás dele as trips e as sessions.
-- =====================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  name         text,
  created_at   timestamptz not null default now(),
  preferences  jsonb       not null default '{}'::jsonb
);

comment on table  public.profiles is 'Perfil do usuário do Kinu; 1:1 com auth.users. Criado automaticamente no signup.';
comment on column public.profiles.preferences is 'Preferências livres do usuário (jsonb aberto, sem schema fixo por ora).';

-- =====================================================================
-- 2. trips — payload cru do SavedTrip (o funil hermético do Arco 1)
--    O app continua dono do formato; o banco só projeta 2 colunas GERADAS
--    (status, destination) para índice/filtro barato. Coluna gerada não
--    pode divergir do payload: o Postgres recalcula e recusa escrita direta.
-- =====================================================================
create table if not exists public.trips (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  payload         jsonb not null,
  schema_version  int   not null default 1,
  status          text generated always as (payload ->> 'status') stored,
  destination     text generated always as (payload ->> 'destination') stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.trips is 'Uma viagem = um SavedTrip do app, guardado cru em payload. schema_version versiona o formato do payload.';
comment on column public.trips.status is 'Coluna GERADA de payload->>status (draft|active|ongoing|completed). Somente leitura: escreva no payload.';
comment on column public.trips.destination is 'Coluna GERADA de payload->>destination. Somente leitura: escreva no payload.';

create index if not exists trips_user_id_updated_at_idx
  on public.trips (user_id, updated_at desc);

-- =====================================================================
-- 3. updated_at — carimbo automático no UPDATE
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_trips_updated_at on public.trips;
create trigger trg_trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. kinu_sessions — histórico de conversa do Kinu AI
--    trip_id é opcional e vira NULL se a viagem for apagada: a conversa
--    sobrevive à viagem.
-- =====================================================================
create table if not exists public.kinu_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  trip_id     uuid references public.trips (id) on delete set null,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.kinu_sessions is 'Sessão de conversa com o Kinu AI. trip_id é opcional e vira NULL se a viagem for apagada (a conversa sobrevive).';

-- O índice de trip_id não é luxo: sem ele, o "set null" do cascade faz
-- seq scan na tabela inteira a cada trip apagada.
create index if not exists kinu_sessions_user_id_created_at_idx
  on public.kinu_sessions (user_id, created_at desc);
create index if not exists kinu_sessions_trip_id_idx
  on public.kinu_sessions (trip_id);

-- =====================================================================
-- 5. Auto-criação do profile no signup (padrão Supabase)
--    security definer + search_path fixado: a função roda como dona, e o
--    search_path vazio impede sequestro por schema plantado no caminho.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nome'
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

-- =====================================================================
-- 6. BACKFILL — o trigger só pega quem nascer daqui pra frente.
--    Sem isto, todo usuário que JÁ existe no Auth ficaria sem profile e,
--    como trips.user_id -> profiles, não conseguiria salvar viagem nenhuma.
-- =====================================================================
insert into public.profiles (id, name, created_at)
select
  u.id,
  coalesce(
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'full_name',
    u.raw_user_meta_data ->> 'nome'
  ),
  u.created_at
from auth.users u
on conflict (id) do nothing;

-- Conferência: quantos usuários existem e quantos têm profile (devem bater).
select
  (select count(*) from auth.users)       as auth_users,
  (select count(*) from public.profiles)  as profiles;
