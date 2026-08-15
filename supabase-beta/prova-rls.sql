-- prova-rls.sql
-- kinu-beta · F3/Arco 2 v2 · prova de que o RLS, os triggers e as FKs funcionam
-- — e de que o catálogo curado saiu intacto.
--
-- COMO RODAR: SQL Editor do painel do kinu-beta, UM BLOCO POR VEZ (A, B, C).
-- O editor só mostra o resultado do último select de cada execução.
--
-- Usuários fake com UUID fixo e e-mail @kinu-teste.local. O bloco C apaga tudo.
-- Rodar depois de 000, 001, 002 e 003.

-- =====================================================================
-- BLOCO A — setup + prova dos triggers
-- Esperado: 2 linhas. name preenchido (trigger de signup pegou),
-- preferences = {} (default), destination/status preenchidos (colunas
-- geradas), updated_at_andou = true para o Teste A e false para o Teste B.
-- =====================================================================
begin;

-- limpeza defensiva (caso o bloco C não tenha rodado antes)
delete from auth.users where email like '%@kinu-teste.local';

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'authenticated', 'authenticated', 'a@kinu-teste.local', '',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Teste A"}'::jsonb,
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'authenticated', 'authenticated', 'b@kinu-teste.local', '',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Teste B"}'::jsonb,
   '', '', '', '');

-- 1 trip para cada (inserida como postgres; o INSERT sob RLS é o teste 8)
insert into public.trips (id, user_id, payload) values
  ('11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '{"status":"active","destination":"Lisboa","country":"Portugal"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '{"status":"draft","destination":"Cartagena","country":"Colômbia"}'::jsonb);

insert into public.kinu_sessions (user_id, trip_id, messages) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111',
   '[{"role":"user","content":"oi"}]'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '22222222-2222-4222-8222-222222222222',
   '[{"role":"user","content":"ola"}]'::jsonb);

-- prova do trigger de UPDATE: updated_at tem de andar
update public.trips
   set payload = payload || '{"destination":"Lisboa e Porto"}'::jsonb
 where id = '11111111-1111-4111-8111-111111111111';

commit;

select
  p.id, p.name, p.created_at, p.preferences,
  t.destination as trip_destination,
  t.status      as trip_status,
  (t.updated_at > t.created_at) as updated_at_andou
from public.profiles p
left join public.trips t on t.user_id = p.id
where p.id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
               'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
order by p.name;

-- =====================================================================
-- BLOCO B — prova do RLS (A não vê, não muda, não apaga e não doa nada de B)
-- Esperado: 11 linhas, todas PASSA.
--
-- O "set role authenticated" é essencial: como postgres você tem BYPASSRLS
-- e todos os testes passariam falsamente.
-- =====================================================================
drop table if exists prova_rls;
create temp table prova_rls (n int, teste text, esperado text, obtido text, veredito text);

do $$
declare
  uid_a  constant uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b  constant uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  trip_b constant uuid := '22222222-2222-4222-8222-222222222222';
  n_int  int;
  txt    text;
begin
  -- vira o usuário A
  perform set_config('request.jwt.claims',
                     json_build_object('sub', uid_a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  -- 1. auth.uid() é mesmo A?
  select auth.uid()::text into txt;
  insert into prova_rls values (1, 'auth.uid() = A', uid_a::text, txt,
    case when txt = uid_a::text then 'PASSA' else 'FALHA' end);

  -- 2. A enxerga exatamente 1 trip (a dele)
  select count(*) into n_int from public.trips;
  insert into prova_rls values (2, 'A ve N trips', '1', n_int::text,
    case when n_int = 1 then 'PASSA' else 'FALHA' end);

  -- 3. A NAO enxerga a trip de B nem pedindo pelo id
  select count(*) into n_int from public.trips where id = trip_b;
  insert into prova_rls values (3, 'A ve a trip de B por id', '0', n_int::text,
    case when n_int = 0 then 'PASSA' else 'FALHA' end);

  -- 4. A nao consegue ALTERAR a trip de B (0 linhas afetadas, sem erro)
  update public.trips set payload = payload || '{"destination":"INVADIDO"}'::jsonb
   where id = trip_b;
  get diagnostics n_int = row_count;
  insert into prova_rls values (4, 'UPDATE de A na trip de B', '0 linhas', n_int || ' linhas',
    case when n_int = 0 then 'PASSA' else 'FALHA' end);

  -- 5. A nao consegue APAGAR a trip de B
  delete from public.trips where id = trip_b;
  get diagnostics n_int = row_count;
  insert into prova_rls values (5, 'DELETE de A na trip de B', '0 linhas', n_int || ' linhas',
    case when n_int = 0 then 'PASSA' else 'FALHA' end);

  -- 6. A nao consegue INSERIR trip no nome de B (tem de dar erro 42501)
  begin
    insert into public.trips (user_id, payload)
    values (uid_b, '{"status":"draft","destination":"Forjada"}'::jsonb);
    insert into prova_rls values (6, 'INSERT de A com user_id=B', 'erro 42501', 'inseriu!', 'FALHA');
  exception when insufficient_privilege then
    insert into prova_rls values (6, 'INSERT de A com user_id=B', 'erro 42501', 'erro 42501', 'PASSA');
  end;

  -- 7. A nao consegue DOAR a propria trip para B (with check no update)
  begin
    update public.trips set user_id = uid_b where user_id = uid_a;
    get diagnostics n_int = row_count;
    insert into prova_rls values (7, 'A doa a propria trip para B', 'erro 42501',
      n_int || ' linhas movidas', 'FALHA');
  exception when insufficient_privilege then
    insert into prova_rls values (7, 'A doa a propria trip para B', 'erro 42501', 'erro 42501', 'PASSA');
  end;

  -- 8. A insere trip para si mesmo: TEM de funcionar (RLS nao pode matar o caso feliz)
  begin
    insert into public.trips (user_id, payload)
    values (uid_a, '{"status":"draft","destination":"Propria"}'::jsonb);
    insert into prova_rls values (8, 'A insere trip propria', 'insere', 'inseriu', 'PASSA');
  exception when others then
    insert into prova_rls values (8, 'A insere trip propria', 'insere', sqlerrm, 'FALHA');
  end;

  -- 9. profiles: A so ve o proprio
  select count(*) into n_int from public.profiles;
  insert into prova_rls values (9, 'A ve N profiles', '1', n_int::text,
    case when n_int = 1 then 'PASSA' else 'FALHA' end);

  -- 10. kinu_sessions: A so ve a propria sessao
  select count(*) into n_int from public.kinu_sessions;
  insert into prova_rls values (10, 'A ve N sessions', '1', n_int::text,
    case when n_int = 1 then 'PASSA' else 'FALHA' end);

  -- 11. e a trip de B continua intacta? (volta a ser postgres para olhar)
  perform set_config('role', 'postgres', true);
  select payload ->> 'destination' into txt from public.trips where id = trip_b;
  insert into prova_rls values (11, 'trip de B intacta', 'Cartagena', coalesce(txt, '(sumiu)'),
    case when txt = 'Cartagena' then 'PASSA' else 'FALHA' end);
end $$;

select * from prova_rls order by n;

-- =====================================================================
-- BLOCO C — limpeza + prova de que nada além do escopo foi tocado
-- =====================================================================
delete from auth.users where email like '%@kinu-teste.local';

-- C.1 — cascade: as 3 primeiras colunas têm de vir 0 (apagou o usuário no
-- Auth, foram junto o profile, as trips e as sessions).
-- curated_activities = 883 e curated_hotels = 132: o catálogo VIVO,
-- intacto, exatamente como estava antes da missão.
select
  (select count(*) from public.profiles
     where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))      as profiles_restantes,
  (select count(*) from public.trips
     where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) as trips_restantes,
  (select count(*) from public.kinu_sessions
     where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) as sessions_restantes,
  (select count(*) from public.curated_activities) as curated_activities_esperado_883,
  (select count(*) from public.curated_hotels)     as curated_hotels_esperado_132,
  (select count(*) from public.price_alerts)       as price_alerts_esperado_0,
  (select count(*) from public.monitor_offers)     as monitor_offers_esperado_0,
  (select count(*) from public.events)             as events_esperado_0,
  (select count(*) from public.feedback)           as feedback_esperado_0;

-- C.2 — as FKs recriadas pelo 003 estão no lugar e com a política certa.
-- Esperado: price_alerts_trip_id_fkey -> trips / cascade
--           monitor_offers_trip_id_fkey -> trips / set null
select
  child.relname as tabela,
  con.conname   as constraint_name,
  ref.relname   as aponta_para,
  case con.confdeltype
    when 'a' then 'no action' when 'r' then 'restrict'
    when 'c' then 'cascade'  when 'n' then 'set null'
    when 'd' then 'set default'
  end           as on_delete
from pg_constraint con
join pg_class child on child.oid = con.conrelid
join pg_class ref   on ref.oid   = con.confrelid
where con.contype = 'f'
  and child.relname in ('price_alerts', 'monitor_offers', 'events', 'feedback',
                        'trips', 'kinu_sessions', 'profiles')
order by child.relname, con.conname;
