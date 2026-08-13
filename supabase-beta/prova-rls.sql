-- prova-rls.sql
-- kinu-beta · F3/Arco 2 · prova de que o RLS e os triggers funcionam.
--
-- COMO RODAR: SQL Editor do painel do kinu-beta, UM BLOCO POR VEZ (A, B, C).
-- O editor só mostra o resultado do último select de cada execução.
--
-- Usuários fake com UUID fixo e e-mail @kinu-teste.local. O bloco C apaga tudo.
-- Rodar depois de 001 e 002.


-- =====================================================================
-- BLOCO A — setup + prova do trigger de signup
-- Esperado: 2 linhas. nome preenchido (trigger de profile pegou),
-- destination/status preenchidos (colunas geradas), atualizado_em_andou
-- = true para o Teste A e false para o Teste B.
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
   '{"nome":"Teste A"}'::jsonb,
   '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'authenticated', 'authenticated', 'b@kinu-teste.local', '',
   now(), now(), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"nome":"Teste B"}'::jsonb,
   '', '', '', '');

-- 1 trip para cada (inserido como postgres; o INSERT sob RLS é testado no bloco B)
insert into public.trips (id, user_id, payload) values
  ('11111111-1111-4111-8111-111111111111',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '{"status":"active","destination":"Lisboa","country":"Portugal"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '{"status":"draft","destination":"Cartagena","country":"Colômbia"}'::jsonb);

insert into public.kinu_sessoes (user_id, trip_id, mensagens) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '11111111-1111-4111-8111-111111111111',
   '[{"role":"user","content":"oi"}]'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '22222222-2222-4222-8222-222222222222',
   '[{"role":"user","content":"ola"}]'::jsonb);

-- prova do UPDATE trigger: atualizado_em tem de andar
update public.trips
   set payload = payload || '{"destination":"Lisboa e Porto"}'::jsonb
 where id = '11111111-1111-4111-8111-111111111111';

commit;

select
  p.id, p.nome, p.criado_em,
  t.destination as trip_destination,
  t.status      as trip_status,
  (t.atualizado_em > t.criado_em) as atualizado_em_andou
from public.profiles p
left join public.trips t on t.user_id = p.id
where p.id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
               'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
order by p.nome;


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

  -- 10. kinu_sessoes: A so ve a propria sessao
  select count(*) into n_int from public.kinu_sessoes;
  insert into prova_rls values (10, 'A ve N sessoes', '1', n_int::text,
    case when n_int = 1 then 'PASSA' else 'FALHA' end);

  -- 11. e a trip de B continua intacta? (volta a ser postgres para olhar)
  perform set_config('role', 'postgres', true);
  select payload ->> 'destination' into txt from public.trips where id = trip_b;
  insert into prova_rls values (11, 'trip de B intacta', 'Cartagena', coalesce(txt, '(sumiu)'),
    case when txt = 'Cartagena' then 'PASSA' else 'FALHA' end);
end $$;

select * from prova_rls order by n;


-- =====================================================================
-- BLOCO C — limpeza
-- Esperado: 0, 0, 0 nas três primeiras colunas (prova do cascade);
-- price_alerts e events com a contagem que você já tinha (prova de que
-- esta missão não encostou nelas).
-- =====================================================================
delete from auth.users where email like '%@kinu-teste.local';

select
  (select count(*) from public.profiles
     where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) as profiles_restantes,
  (select count(*) from public.trips
     where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) as trips_restantes,
  (select count(*) from public.kinu_sessoes
     where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')) as sessoes_restantes,
  (select count(*) from public.price_alerts) as price_alerts_intacta,
  (select count(*) from public.events)       as events_intacta;
