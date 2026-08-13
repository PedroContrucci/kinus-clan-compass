# Relatório — F3/Arco 2: migrations do kinu-beta (profiles, trips, kinu_sessoes + RLS)

**Data:** 13/ago/2026 · **Status:** ✅ ARQUIVOS ENTREGUES — aplicação no banco pendente (é do fundador, pelo painel)
**Alvo:** Supabase **kinu-beta** (projeto próprio do fundador, São Paulo)
**Base:** blueprint F3 (RELATORIO-ARCO0-GATE-F3.md) · RELATORIO-ARCO1-ENCERRAMENTO.md

---

## 1. O que este arco entrega

O Arco 1 fechou o funil hermético no cliente: `src/lib/tripStore.ts` é a única porta
de leitura/escrita de viagens, sobre `localStorage`. O Arco 2 constrói **o outro lado
da ponte** — o esquema no banco que esse funil vai passar a alimentar. Nenhuma linha
do app mudou nesta missão: o banco existe, ainda sem ninguém falando com ele.

| Arquivo | Papel |
|---|---|
| `supabase-beta/README.md` | Regra dos dois bancos: `supabase/` é do Lovable Cloud, `supabase-beta/` é do kinu-beta. Não misturar |
| `supabase-beta/migrations/001_profiles_trips_sessoes.sql` | 3 tabelas, colunas geradas, índices, trigger de `atualizado_em`, auto-criação do profile no signup |
| `supabase-beta/migrations/002_rls.sql` | RLS ligado nas 3 tabelas + 12 policies |
| `supabase-beta/prova-rls.sql` | Prova em 3 blocos: 2 usuários fake, 11 testes de isolamento, limpeza |

**Não tocado, como manda a missão:** `supabase/` (Lovable Cloud), `price_alerts`,
`events`, e todo o `src/`.

---

## 2. O esquema, em uma frase cada

**`profiles`** — espelho 1:1 de `auth.users`. `id` é a PK *e* a FK (`on delete cascade`):
apagou o usuário no Auth, o perfil vai junto, e atrás dele as viagens e as sessões.

**`trips`** — o `SavedTrip` inteiro guardado cru em `payload jsonb`. O app continua
dono do formato; `schema_version` versiona esse formato para migrações futuras.
O banco só projeta duas colunas **geradas** (`status`, `destination`) para filtro e
índice barato — elas são somente leitura, derivadas do payload.

**`kinu_sessoes`** — conversa do Kinu AI. `trip_id` é opcional e `on delete set null`:
apagar a viagem não apaga a conversa.

### Por que colunas geradas em vez de colunas normais

Coluna normal duplicaria a verdade: o app teria de lembrar de escrever `status` nos
dois lugares, e um dia esqueceria. Coluna gerada não pode divergir do payload — o
Postgres recalcula a cada escrita e **recusa** qualquer tentativa de escrever nela
direto. É a mesma disciplina do Arco 1 (uma fonte, uma porta), agora imposta pelo banco
em vez de por convenção. O §4.5 do recon (normalização assimétrica) não tem como
renascer aqui.

Confirmado contra `src/types/trip.ts:118` — `SavedTrip.status` é
`draft | active | ongoing | completed` e `destination` é `string`, então
`payload->>'status'` e `payload->>'destination'` batem com o que o app já produz.

---

## 3. RLS: a regra, sem exceção

| Tabela | Policy |
|---|---|
| `profiles` | `id = auth.uid()` |
| `trips` | `user_id = auth.uid()` |
| `kinu_sessoes` | `user_id = auth.uid()` |

Quatro policies por tabela (`select`, `insert`, `update`, `delete`), 12 no total.
Nenhuma policy de bypass, nenhuma leitura pública, nenhuma exceção.

Três detalhes que valem mais que a regra:

1. **`update` leva `using` e `with check`.** Só com `using`, o usuário A poderia dar
   `update` na *própria* viagem trocando `user_id` para B — doação de linha, um vazamento
   que passa despercebido em revisão. Com os dois, a linha tem de ser dele antes **e**
   depois. É o teste 7 da prova.
2. **`revoke all ... from anon`.** O RLS sozinho já barraria o anônimo (`auth.uid()`
   nulo não casa com policy nenhuma). O revoke é o segundo cadeado: sem privilégio de
   tabela, a requisição nem chega a ser avaliada.
3. **`service_role` não tem policy aqui — e não pode ter.** `BYPASSRLS` é atributo de
   role no Postgres, não policy; nenhuma migration remove isso. O que está sob nosso
   controle é não *depender* dele: nada no caminho do app cliente usa service_role.
   Todo uso dele é acesso administrativo consciente, pelo painel ou por backend.

---

## 4. Como aplicar — passo a passo no SQL Editor do kinu-beta

> **Antes de colar qualquer coisa:** confira o nome do projeto no topo do painel.
> Tem de ser **kinu-beta**. Se estiver no projeto do Lovable Cloud, pare.

### Passo 1 — `001_profiles_trips_sessoes.sql`

Abra `supabase-beta/migrations/001_profiles_trips_sessoes.sql`, copie o arquivo
**inteiro**, cole no SQL Editor, `Run`.

- **Esperado:** `Success. No rows returned.`
- Se der erro de permissão no `create trigger ... on auth.users`: você não está no SQL
  Editor do painel (só ele roda como `postgres`). Não dá para fazer esse trigger pelo
  cliente JS.

### Passo 2 — `002_rls.sql`

Mesmo ritual com `supabase-beta/migrations/002_rls.sql`.

- **Esperado:** `Success. No rows returned.`
- Se der `relation "public.profiles" does not exist`, o passo 1 não rodou. Volte.

### Passo 3 — conferência rápida no painel

`Database → Tables`: as 3 tabelas aparecem com o cadeado de **RLS enabled**.
`Database → Policies`: 12 policies, 4 por tabela.

### Passo 4 — a prova, bloco A

Abra `supabase-beta/prova-rls.sql`. Copie **só o BLOCO A** (do `begin;` até o `select`
que termina em `order by p.nome;`), cole, `Run`.

**Esperado — 2 linhas:**

| campo | Teste A | Teste B | prova o quê |
|---|---|---|---|
| `nome` | `Teste A` | `Teste B` | **trigger de signup** — ninguém inseriu profile à mão |
| `trip_destination` | `Lisboa e Porto` | `Cartagena` | **coluna gerada** acompanhando o payload |
| `trip_status` | `active` | `draft` | **coluna gerada** |
| `atualizado_em_andou` | `true` | `false` | **trigger de `atualizado_em`** (só A sofreu update) |

Se `nome` vier vazio ou faltar linha, o trigger `on_auth_user_created` não pegou —
pare e me avise antes de seguir.

### Passo 5 — a prova, bloco B (o teste que importa)

Copie **só o BLOCO B** (do `drop table if exists prova_rls;` até o
`select * from prova_rls order by n;`), cole, `Run`.

**Esperado: 11 linhas, coluna `veredito` = `PASSA` em todas.**

| # | Teste | O que prova |
|---|---|---|
| 1 | `auth.uid()` = A | A personificação funcionou (sem isso os outros 10 não valem nada) |
| 2 | A vê 1 trip | Vê a própria |
| 3 | A vê 0 trips de B por id | **Não vê a de B nem pedindo pelo id** |
| 4 | `update` de A na trip de B → 0 linhas | Não altera o que não é dele |
| 5 | `delete` de A na trip de B → 0 linhas | Não apaga o que não é dele |
| 6 | `insert` com `user_id` = B → erro 42501 | Não forja linha no nome de outro |
| 7 | A doa a própria trip para B → erro 42501 | O `with check` do update segura |
| 8 | A insere trip própria → funciona | **O RLS não matou o caso feliz** |
| 9 | A vê 1 profile | Isolamento em `profiles` |
| 10 | A vê 1 sessão | Isolamento em `kinu_sessoes` |
| 11 | trip de B intacta (`Cartagena`) | Nada dos testes 4-7 vazou |

Qualquer `FALHA` = RLS furado. Não seguimos para o Arco 3 sem 11/11.

**Por que o bloco B é um bloco só:** ele personifica o usuário A com
`set role authenticated` + claim JWT, e isso vale por transação. Rodar pedaço por
pedaço quebra a personificação — e aí você estaria testando como `postgres`, que tem
`BYPASSRLS` e faria **todos os testes passarem falsamente**. Essa é a armadilha clássica
de teste de RLS: o teste verde que não testou nada.

### Passo 6 — a prova, bloco C (limpeza)

Copie o **BLOCO C**, `Run`.

**Esperado:** `profiles_restantes`, `trips_restantes`, `sessoes_restantes` = `0, 0, 0`
(prova do cascade a partir de `auth.users`), e `price_alerts_intacta` / `events_intacta`
com a contagem que você já tinha — prova de que esta missão não encostou nelas.

### O que me mandar de volta

A tabela do bloco A, a tabela de 11 linhas do bloco B e a linha do bloco C. Com isso
o Arco 2 fecha e eu registro a prova no encerramento.

---

## 5. Decisões de projeto registradas

1. **`kinu_sessoes.trip_id` é `on delete set null`** — a conversa sobrevive à viagem
   apagada. É deliberadamente o oposto do §4.9 do recon (vazamento de `price_history`,
   morto no Arco 1): histórico de conversa não é lixo órfão, é registro.
2. **`status`/`destination` somente leitura.** Se o app um dia tentar escrever nelas
   direto, o banco recusa. É o comportamento desejado: `payload` é a fonte única.
3. **Sem `check` constraint em `status`.** Um check sobre coluna gerada rejeitaria o
   `payload` inteiro quando surgisse um status novo — trava a evolução do app por um
   ganho pequeno. Fica para migration futura, se o conjunto estabilizar.
4. **`encrypted_password` vazio nos usuários fake.** Eles nunca fazem login; existem só
   como linhas para o RLS morder.
5. **Índice em `kinu_sessoes(trip_id)`** — sem ele, todo `delete` de viagem faria seq
   scan em `kinu_sessoes` para aplicar o `set null`.
6. **`(select auth.uid())` nas policies** em vez de `auth.uid()` cru. Semanticamente
   idêntico; é a forma documentada pelo Supabase, com o planner avaliando uma vez
   (initPlan) em vez de por linha. Sem isso o índice `(user_id, atualizado_em)` rende menos.
7. **Idempotência em tudo** (`if not exists`, `or replace`, `drop ... if exists`):
   rodar duas vezes não quebra. Migration que só funciona uma vez é armadilha para o
   próximo que abrir o painel.

---

## 6. Lacuna de verificação — declarada

**Este SQL não foi executado em lugar nenhum.** Não há Postgres no Codespace
(`which psql` vazio, `/usr/lib/postgresql` inexistente) e o kinu-beta é acesso do
fundador. Portanto:

- O que está **provado**: as colunas geradas batem com o tipo real do app
  (`src/types/trip.ts:118`, lido e conferido).
- O que está **apenas revisado, não executado**: a sintaxe SQL e o comportamento dos
  triggers e policies.
- O que **fecha a lacuna**: a execução dos passos 1-6 acima. A prova é o gate do arco,
  não uma formalidade — sem as 11 linhas `PASSA` do bloco B, este arco não está fechado.

Risco residual conhecido: o `insert` direto em `auth.users` do bloco A depende do
esquema do GoTrue da sua instância. Se der erro de coluna `NOT NULL`, me mande a
mensagem — ajusto o insert. Isso afetaria só o script de prova, não as migrations.

---

## 7. Estado do repo

Commit desta entrega: _(hash registrado no commit seguinte, após o push)_
Arquivos: 4 novos em `supabase-beta/` + este relatório. Zero modificações em arquivos
existentes — `git show --stat` confirma só adições.

---

## 8. Saída do push

```
(colada abaixo após o push)
```

---

## 9. Próximo passo — Arco 3

Com o esquema de pé e o RLS provado, o Arco 3 é a **ponte**: fazer o `tripStore` do
Arco 1 falar com estas tabelas em vez do `localStorage` — com auth, migração dos dados
que já existem no navegador do beta, e a decisão de produto sobre o que acontece com
quem usa o app sem estar logado.

Pendências herdadas do Arco 1 continuam de pé (limbo do draft, deep-link `?trip=`,
divergência do cost no swap, `kinu_saved_activities` órfã) — nenhuma delas bloqueia o
Arco 3.
