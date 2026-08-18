# Relatório — Recon do Arco 4: espelho localStorage↔banco + adoção

**Data:** 17/ago/2026 · **Natureza:** SOMENTE LEITURA — nenhum arquivo do repo foi
modificado, nenhum teste rodado, nenhuma query enviada ao kinu-beta.
**Base lida:** `src/lib/tripStore.ts` (392 linhas) · os 9 arquivos que importam o store ·
`src/lib/createTrip.ts` · `src/hooks/useAuth.ts` · `src/integrations/kinu-beta/client.ts` ·
`src/test/tripStore.test.ts` · `supabase-beta/migrations/001` e `002` ·
`src/pages/SmokeTest.tsx` · `vitest.config.ts` ·
`RELATORIO-ARCO1-ENCERRAMENTO.md` · `RELATORIO-ARCO2-ENCERRAMENTO.md` ·
`RELATORIO-F3-ARCO3B-LOGIN.md` · `RELATORIO-ARCO0-GATE-F3.md`.

---

## 0. Sumário executivo — a recomendação em uma tela

> **O `tripStore.ts` não deve virar assíncrono, e não deve saber que existe banco.**

O desenho recomendado para a Fase B é **núcleo síncrono + espelho assíncrono ao lado**:

| Camada | Arquivo | Natureza | Muda? |
|---|---|---|---|
| Funil local (Arco 1) | `src/lib/tripStore.ts` | síncrono, localStorage, hermético | **quase nada** (só o gerador de id) |
| Sessão sem React | `src/lib/session.ts` (**novo**) | 1 assinatura GoTrue, `getCurrentUserId()` síncrono | — |
| Espelho | `src/lib/tripSync.ts` (**novo**) | assíncrono, outbox, adoção, hidratação | — |

O espelho **assina o sino do Arco 1** (`subscribeTrips`) para descobrir escritas locais,
mantém um **outbox** persistente em localStorage e empurra para o banco em background.
A "leitura do banco com fallback local" da Fase B é feita por **hidratação** (puxa do
banco para o localStorage quando a sessão resolve), não por tornar `listTrips()` async.

**Consequências diretas:**
- Os **28 pontos de acesso migrados no Arco 1 não são tocados** — zero refactor de React.
- Os **28 testes do tripStore continuam válidos sem uma linha de mudança** (§6).
- O "modo só local" não precisa ser inventado: ele é o comportamento padrão quando
  `tripSync` nunca é iniciado.
- O funil continua hermético: o banco entra por **uma segunda porta**, não por dentro da
  primeira.

As cinco decisões pedidas, resumidas:

| Pergunta | Recomendação | §  |
|---|---|---|
| Assíncrono vs síncrono+background | **Síncrono + background** (outbox). Assíncrono custaria 14 refactors não triviais | §1 |
| Formato de id | **uuid v4 local**, `trips.id = SavedTrip.id`. Missão própria, antes do espelho | §2 |
| Algoritmo de adoção | Marcador `kinu_trips_owner` + **semear o outbox** com todos os ids; confirmação explícita do usuário | §3 |
| Sessão no store | **Módulo `session.ts` observável**, nem parâmetro nem `getSession()` por operação | §4 |
| Testes | tripStore intocado; suíte nova só para `tripSync` com `vi.mock` do módulo do cliente | §6 |

---

## 1. O tripStore hoje — mapa e impacto

### 1.1 As 12 exports e o que cada uma exige do espelho

| # | Export | Assinatura hoje | Retorno usado? | O que o espelho precisa |
|---|---|---|---|---|
| 1 | `TRIPS_KEY` | const | — | nada |
| 2 | `PRICE_HISTORY_PREFIX` | const | — | nada |
| 3 | `StoredTrip` / `PriceSnapshot` | tipos | — | nada |
| 4 | `normalizeTrip(trip)` | síncrona, pura | sim (Viagens:1093) | nada — roda igual na hidratação |
| 5 | `subscribeTrips(fn)` | síncrona, devolve unsubscribe | sim (4 assinantes) | **é o gatilho do espelho** |
| 6 | `listTrips()` | síncrona → `StoredTrip[]` | **sim, 7 chamadas** | hidratação escreve local; leitura segue síncrona |
| 7 | `getTrip(id)` | síncrona → `StoredTrip \| null` | **zero chamadores** hoje | nada |
| 8 | `getActiveTrip()` | síncrona → `StoredTrip \| null` | sim (2) | **sensível à ORDEM da lista** — ver §2.4 |
| 9 | `addTrip(trip)` | síncrona → `StoredTrip`; **muta o argumento** | retorno ignorado, mas `trip.id` é lido depois | enfileirar upsert |
| 10 | `updateTrip(id, updater)` | síncrona → `StoredTrip \| null` | **sim, 14 de 15 chamadas** | enfileirar upsert |
| 11 | `deleteTrip(id)` | síncrona → void | — | enfileirar delete + apagar histórico |
| 12 | `clearTrips()` | síncrona → void | — | enfileirar delete de **todos** os ids |
| 13 | `getPriceHistory` / `pushPriceSnapshot` | síncronas | **zero chamadores em produção** | fora de escopo (§2.5) |

### 1.2 Quem depende do retorno síncrono — a conta exata

**`updateTrip`: 15 chamadas em 2 arquivos. 14 dependem do retorno síncrono.**

Todas as 14 estão em `src/pages/Viagens.tsx`, todas no mesmo formato:

```ts
const stored = updateTrip(selectedTrip.id, (trip) => { ... });
if (stored) setSelectedTrip(stored);
```

Linhas: `331`, `396`, `424`, `451`, `470`, `533`, `590`, `650`, `728`, `773`, `783`,
`1070`, `1093`, `2644`.

Uma delas vai além do `setSelectedTrip` e **lê o objeto na linha seguinte**:

```ts
// src/pages/Viagens.tsx:409
const dayDate = (stored ?? selectedTrip).days[dayIndex]?.date;
```

A 15ª chamada — `GeneratedItineraryStage.tsx:1097` — ignora o retorno (é o recompute de
finanças, que só persiste).

**`listTrips`: 7 chamadas em 4 arquivos**, todas com o retorno consumido na mesma
expressão:

| Local | Uso |
|---|---|
| `Dashboard.tsx:39` | `setLocalTrips(listTrips())` no efeito de guard |
| `Dashboard.tsx:45` | dentro do callback do sino |
| `Conta.tsx:29` | calcula estatísticas (países, atividades) no efeito de mount |
| `Cla.tsx:79` | `setMyTrips(...)` dentro do `load` do sino |
| `Viagens.tsx:252` | mount |
| `Viagens.tsx:261` | dentro do callback do sino — **re-deriva a seleção** |
| `Viagens.tsx:518` | logo após `deleteTrip`, para promover a próxima viagem |

**`getActiveTrip`: 2** (`Cla.tsx:81`, `FeedbackButton.tsx:26`) — ambas dentro de callbacks
do sino. **`addTrip`: 2** (`KinuAIContext.tsx:385`, `NewPlanningWizard.tsx:153`) — retorno
ignorado, **mas** os dois leem `trip.id` na linha seguinte (navegação e
`pendingNavigation`), o que só funciona porque `addTrip` **muta o argumento**.

### 1.3 O que custaria tornar as funções assíncronas

| Função | Chamadas | Custo de virar `Promise` |
|---|---|---|
| `updateTrip` | 15 | **14 handlers de `Viagens.tsx` viram `async`**. Um deles (`:409`) usa o resultado no fluxo seguinte. Handlers de `onClick` viram async → erros passam a ser rejeições silenciosas, não exceções |
| `listTrips` | 7 | 4 estão **dentro de callbacks do sino** (`subscribeTrips`), que hoje é síncrono. Um `await` ali abre janela de reordenação entre dois emits — exatamente o tipo de corrida que o Arco 1 matou |
| `getActiveTrip` | 2 | idem, dentro do sino |
| `addTrip` | 2 | baixo, mas `trip.id` passaria a ter que vir do retorno |

**Veredito: síncrono + escrita em background.** O ganho de tornar async é zero para o
usuário (o app já mostra o resultado imediato do localStorage) e o custo é reabrir, num
arco de banco de dados, o mesmo tipo de corrida que o Arco 1 fechou. Além disso, o
espelho assíncrono **precisa** de fila persistente de qualquer forma (aba fechada, rede
caída) — e, tendo a fila, o `await` no chamador não compra nada.

**Preço declarado da escolha:** consistência eventual. Uma escrita local pode não estar no
banco no instante seguinte. O outbox (§4.3) é o que impede que ela se perca.

### 1.4 A única mudança dentro do `tripStore.ts`

`addTrip` (linha 289) gera `trip_${Date.now()}` como fallback. Vira `newTripId()` (uuid).
Nada mais. O resto do arco vive fora do arquivo.

---

## 2. O contrato do payload

### 2.1 O id — o problema é real

| Ponta | Formato | Origem |
|---|---|---|
| App (produção) | `trip-1755...` | `src/lib/createTrip.ts:42` — `` `trip-${Date.now()}` `` |
| App (fallback) | `trip_1755...` | `src/lib/tripStore.ts:289` — `` `trip_${Date.now()}` `` (**underscore**, divergente; hoje só o teste `:165` o exercita, porque `buildDraftTrip` sempre entrega um id) |
| Banco | `uuid` | `trips.id uuid primary key default gen_random_uuid()` |

`'trip-1755000000000'` **não** é um uuid: o insert falha com `22P02 invalid input syntax
for type uuid`. Confirmado por leitura do DDL — a coluna não é `text`.

**Três opções avaliadas:**

**(A) Passar o id local para uuid — RECOMENDADA.**
`SavedTrip.id` vira `crypto.randomUUID()`; `trips.id = SavedTrip.id`. Uma identidade só,
das duas pontas.
- Dedupe/idempotência de graça: `upsert` sobre a chave primária.
- Nada de tabela de mapeamento em localStorage (que seria mais um estado a corromper).
- Custo: os ids que **já existem** nos navegadores do beta precisam ser reescritos uma vez.

  O que referencia o id de uma viagem hoje:
  | Referência | Persistente? | Ação |
  |---|---|---|
  | `kinu_price_history_<id>` | **sim** | renomear a chave junto |
  | `navigate('/viagens?trip=' + id)` | não (URL efêmera; o parâmetro **nem é lido** hoje — pendência §4.11 do Arco 1) | nada |
  | `pendingNavigation.tripId` (KinuAI) | não (estado React) | nada |
  | `selectedTrip.id` numa aba aberta | não | o sino já derruba seleção órfã (`Viagens.tsx:266`) |

  Ou seja: a reescrita é **contida em duas chaves de localStorage**. É uma missão atômica,
  100% local, testável sem rede.

**(B) Id do banco independente + id do app dentro do payload.** Exige migration nova
(coluna gerada `app_id text generated always as (payload->>'id') stored` + índice único
`(user_id, app_id)`) e depende de o PostgREST aceitar `on_conflict` sobre coluna gerada —
o que precisaria ser provado antes. Mantém os ids locais intactos, mas adiciona uma
migration e uma incerteza a um arco que já tem muitas peças. **Reserva**, caso (A) seja
recusada.

**(C) uuid derivado determinístico** (v5 do id local). `crypto.subtle.digest` é assíncrono
e não há dependência de uuid no `package.json` — introduz criptografia num caminho de
escrita síncrono. **Descartada.**

> ⚠️ **Achado verificado:** `jsdom@20.0.3` (o instalado) **não implementa
> `crypto.randomUUID`** — só `getRandomValues`. Portanto `newTripId()` precisa ser
> `crypto.randomUUID?.() ?? uuidV4FromGetRandomValues()`. O fallback também cobre origem
> não-segura (http em IP de LAN), onde `randomUUID` some no browser. São ~6 linhas, sem
> dependência nova.

### 2.2 Colunas geradas — o app usa exatamente as chaves certas

| Coluna gerada | Expressão | Chave no `SavedTrip` | Confere? |
|---|---|---|---|
| `status` | `payload ->> 'status'` | `SavedTrip.status: TripStatus` (`src/types/trip.ts:119`), valores `'draft' \| 'active' \| 'ongoing' \| 'completed'` | ✅ topo do objeto, nome idêntico |
| `destination` | `payload ->> 'destination'` | `SavedTrip.destination: string` (`:120`) | ✅ |

Não há colisão: as atividades também têm `status`, mas aninhado em
`days[].activities[].status` — `->>` só olha o topo.

Dois cuidados:

1. **Nunca enviar `status`/`destination` na linha.** Coluna gerada recusa escrita direta
   (`428C9 cannot insert a non-DEFAULT value into column`). A linha enviada deve ser
   **exatamente** `{ id, user_id, payload, schema_version }`. Um `...trip` espalhado por
   engano no objeto da linha quebra toda escrita — é o erro mais fácil de cometer neste
   arco.
2. **Viagem sem `status`** (fixtures antigas, payload parcial) gera coluna `NULL`. Não é
   erro, mas some de qualquer filtro por status no banco. Hoje só afetaria consultas
   futuras, não a hidratação (que lê o payload).

### 2.3 `schema_version`

`int not null default 1`, sem leitor em lugar nenhum ainda. Recomendação:

- O espelho **sempre grava `1`** explicitamente (não confia no default).
- A hidratação **ignora, com aviso, linhas cujo `schema_version` seja diferente de 1** — e
  as mantém fora do localStorage sem apagá-las do banco. Sem essa regra, um cliente velho
  (aba não recarregada, PWA em cache) leria um payload de formato futuro, normalizaria por
  cima e regravaria destruído. É a proteção mais barata do arco.
- Bump de versão só quando o formato do `SavedTrip` mudar de forma incompatível.

### 2.4 ⚠️ A ordem da lista é semântica — armadilha da hidratação

`getActiveTrip()` (`tripStore.ts:278`) tem como fallback **"a última da lista"**:

```ts
return trips.length > 0 ? trips[trips.length - 1] : null;
```

Hoje a lista é **ordem de inserção** (`addTrip` faz `push`). O índice do banco é
`trips (user_id, updated_at desc)` — se a hidratação usar essa ordem "natural", a última
da lista passa a ser **a menos recentemente atualizada**, e a viagem ativa do `/cla` e do
`FeedbackButton` muda sozinha. O mesmo vale para a ordem visível dos cards em
`/dashboard` e `/viagens`, e para a promoção da "primeira restante" após um delete
(`Viagens.tsx:518`).

**Regra obrigatória: a hidratação ordena por `created_at asc`** — só assim reproduz a
ordem de inserção local. Vale um comentário no código, porque é invisível na revisão.

### 2.5 O que **não** vai para o banco na Fase B (declarado)

| Chave | Situação | Decisão sugerida |
|---|---|---|
| `kinu_price_history_<id>` | fica local; **não é hermética** — `TripPanel.tsx:155-174` duplica `getPriceHistory`/`savePriceSnapshot` lendo a chave crua, e os dois exports do store têm **zero chamadores em produção** | fora do escopo do Arco 4; anotar como dívida (o histórico se perde ao trocar de dispositivo) |
| `kinu_saved_activities` | órfã (pendência do Arco 1) | fora |
| `kinu_tester_name`, `kinu_feedback` | ferramentas de beta | fora |
| `kinu_trip_panel_sections` | preferência de UI | fora |
| `kinu_user` | morta (Arco 3c) | fora |

---

## 3. A adoção

### 3.1 Estado novo em localStorage (fora do payload)

Duas chaves novas. **Nenhum marcador vai dentro do payload** — o payload é o documento do
app e viaja verbatim para o banco; metadado de sincronização ali seria devolvido na
hidratação e viraria lixo permanente no `SavedTrip`.

```
kinu_trips_owner   = { "userId": "<uuid>", "adoptedAt": "<iso>" }
kinu_trips_outbox  = [ { "op": "upsert"|"delete", "id": "<uuid>", "seq": 17 }, ... ]
```

### 3.2 Algoritmo, no momento em que a sessão resolve

```
onSession(session):
  se session == null:                      # anônimo (/planejar)
      espelho DESLIGADO. Tudo local. Fim.

  uid   = session.user.id
  owner = leOwner()

  1) owner existe e owner.userId == uid            -> operação normal (hidrata + espelha)
  2) owner existe e owner.userId != uid            -> TROCA DE DONO
        NÃO adota nada. Limpa kinu_trips e o outbox
        (as viagens do dono anterior já estão no banco dele),
        grava owner = {uid}, hidrata do banco do novo dono.
  3) owner não existe e listTrips() == []          -> grava owner = {uid}; hidrata. Nada a adotar.
  4) owner não existe e listTrips() != []          -> ADOÇÃO
        a. pergunta ao usuário (§3.4)
        b. se sim: enfileira { op:'upsert', id } para TODOS os ids locais
        c. flush do outbox (em lotes)
        d. só quando o outbox drenar por completo: grava owner = {uid}
        e. hidrata
```

### 3.3 Idempotência, retomada e conflito

- **Dedupe:** a chave é o `id` da viagem, que é a **primary key** de `trips`. Escrita é
  `upsert` (`insert ... on conflict (id) do update set payload = excluded.payload,
  schema_version = 1`). Rodar duas vezes grava as mesmas linhas — não há duplicata
  possível. O trigger `trg_trips_updated_at` cuida do `updated_at` no ramo de update.
- **Retomada de falha parcial ("subiu 3 de 5"):** resolvida **por construção**, porque a
  adoção não é um passo especial — ela apenas **semeia o outbox**. Se 3 subiram e 2
  falharam, os 2 continuam no outbox e o próximo flush (próximo boot, evento `online`,
  próxima escrita) reenvia. O marcador `owner` só é gravado quando o outbox esvazia, então
  uma adoção interrompida é retomada na sessão seguinte, sem estado intermediário próprio.
- **Lotes:** payloads de viagem são gordos (dias × atividades + opções de voo). Enviar
  tudo num único `upsert` é atômico, mas arrisca estourar limite de request. Recomendação:
  **lotes de 5**, com o outbox como registro de progresso. Não há "meia viagem": a unidade
  é a linha.
- **Conflito após a migração:** "banco vence". Concretamente — a hidratação sobrescreve o
  localStorage com o que veio do banco, **exceto** ids que ainda estão pendentes no outbox
  (esses são escritas locais que o banco ainda não viu; sobrescrevê-las seria perder a
  edição do usuário). Regra de uma linha: *hidrata tudo, menos o que está no outbox.*

### 3.4 Riscos da adoção

**(a) Navegador compartilhado.** A primeira conta que logar adota as viagens que estiverem
ali. O ramo (2) do algoritmo já cobre o caso comum — o computador da família, onde alguém
já logou antes: o segundo usuário **não** adota nada, porque o `owner` está gravado. A
janela real de risco é estreita e única: um navegador com viagens anônimas pré-existentes,
no primeiríssimo login.

**Mitigação recomendada (barata):** transformar a adoção silenciosa em adoção
**consentida** — um diálogo único:

> "Encontramos N viagens salvas neste navegador. Trazer para a sua conta?"
> **[Trazer para minha conta]** · **[Deixar só neste navegador]**

Se recusar: grava `owner` com um marcador de recusa (`{ userId, adoptedAt: null }`), não
pergunta de novo, e as viagens locais seguem locais e não espelhadas. Custo: um modal.
Ganho: uma apropriação silenciosa de dados alheios vira uma decisão do usuário — e é a
diferença entre um bug de privacidade e um comportamento documentado.

**(b) Falha no meio.** Coberta pelo outbox (§3.3).

**(c) Colisão de uuid num `on conflict` com linha de outro usuário.** Se por absurdo o id
já existir sob outro `user_id`, o `do update` bate na policy `trips_update_own` e o
`upsert` falha (`42501`). Probabilidade desprezível com uuid v4; a consequência é o item
ficar preso no outbox, o que é visível na observabilidade (§7). Nenhuma ação preventiva
necessária — só não tratar `42501` como retry infinito.

**(d) `clearTrips()` no mundo espelhado.** O "Reiniciar jornada" (`Viagens.tsx:493`) hoje
apaga o localStorage. Com espelho, ele passa a **apagar as viagens do usuário no banco**.
Isso é o comportamento correto, mas o modal atual não avisa que a exclusão agora é
permanente e multi-dispositivo. **Exige revisão de texto** antes da Fase C.

---

## 4. Leitura com fallback e a sessão no store

### 4.1 As três opções pedidas

| Opção | Veredito |
|---|---|
| **(a) Receber `user_id` por parâmetro** | ❌ Envenena a assinatura de `listTrips`, `addTrip`, `updateTrip`, `deleteTrip` — e com ela os 28 pontos migrados no Arco 1. Empurra a responsabilidade de auth para dentro de handlers de UI que não têm nada com isso |
| **(b) Módulo de sessão observável** | ✅ **RECOMENDADA** |
| **(c) `kinuBeta.auth.getSession()` direto no store** | ❌ É `async`: não serve a um `listTrips()` síncrono. Além disso faria uma chamada por operação e acoplaria o funil ao cliente do banco, matando o "modo só local" dos testes |

### 4.2 O desenho recomendado

`src/lib/session.ts` — módulo puro, sem React, com **uma** assinatura do GoTrue:

```ts
export function startSession(): void          // idempotente; chamado uma vez no boot
export function getCurrentUserId(): string | null   // SÍNCRONO, do cache
export function subscribeSession(fn): () => void
```

Ele mantém `currentUserId` em memória, atualizado por `kinuBeta.auth.onAuthStateChange` +
um `getSession()` inicial — exatamente o padrão já provado em `useAuth.ts:77-108`. O
`useAuth` **não precisa mudar no Arco 4** (a assinatura duplicada do GoTrue é o aviso
inofensivo `Multiple GoTrueClient instances` já registrado na 3a); unificar os dois é
melhoria opcional de um arco posterior.

### 4.3 Onde mora o espelho: `src/lib/tripSync.ts`

```
startTripSync()          # chamado uma vez no App.tsx, junto com startSession()
  ├── assina subscribeSession  -> dispara o algoritmo do §3.2
  ├── assina subscribeTrips    -> DETECTA escritas locais (o sino do Arco 1)
  ├── outbox (kinu_trips_outbox, read-modify-write — a regra de ouro do Arco 1 vale aqui)
  └── flush()  em: escrita local · sessão obtida · evento 'online' · visibilitychange
```

**Como o espelho sabe *o que* mudou?** O sino do Arco 1 avisa *que* mudou, não *o quê*.
Duas saídas:

1. **Diff por snapshot (recomendada para a Fase B).** O `tripSync` guarda em memória um
   mapa `id → hash(JSON do payload)` e, a cada emit, compara com o `listTrips()` atual →
   produz `adicionados`, `alterados`, `removidos`. **Zero mudança no `tripStore.ts`**, e é
   o único mecanismo que funciona também para o evento `storage` de **outra aba** (onde
   não há como o store informar o delta).
   Custo: um `JSON.stringify` da lista por escrita. Com o volume do beta (unidades de
   viagens), irrelevante.
2. **Sino com detalhe** (`TripsListener = (change?: {changed, removed}) => void`). Mais
   barato e preciso, retrocompatível (os 4 assinantes atuais ignoram argumentos), mas toca
   o `tripStore.ts` e seus testes — e ainda precisaria do diff da opção 1 como fallback
   cross-tab. **Otimização para depois**, se o custo do stringify aparecer.

### 4.4 "Lê do banco com fallback local", concretamente

Na Fase B a leitura **continua sendo `listTrips()` do localStorage**, síncrona. O que
muda é que o localStorage passa a ser **alimentado pelo banco**:

| Situação | Comportamento |
|---|---|
| Com sessão, hidratação OK | banco → localStorage (ordenado por `created_at asc`, §2.4) → o sino acorda as 4 telas → o app mostra o que veio do banco |
| Com sessão, hidratação falha (rede/401) | localStorage intacto → **fallback local**, o app não pisca |
| Sem sessão (`/planejar` anônimo) | espelho desligado, tudo local — idêntico a hoje |

Isso satisfaz o contrato da Fase B **sem** tornar nada assíncrono para o React, e é o
mesmo mecanismo que a Fase C promove a fonte única: no corte, o localStorage deixa de ser
verdade e vira cache do que o banco mandou.

---

## 5. RLS e o cliente — confirmações

Lido em `002_rls.sql` e `001_profiles_trips_sessions.sql`:

1. **O `user_id` tem de ir explícito na linha do insert. Confirmado, e por dois motivos
   independentes:**
   - `trips.user_id uuid not null` **sem `default`** → omitir dá `23502 null value in
     column "user_id"` antes mesmo de a policy ser avaliada;
   - a policy `trips_insert_own` exige `with check (user_id = (select auth.uid()))` → um
     valor errado dá `42501 new row violates row-level security policy`.
   - *Melhoria opcional de uma migration futura:* `alter table public.trips alter column
     user_id set default auth.uid()`. Cinto e suspensório; não é pré-requisito.
2. **De onde o store tira o id:** `session.getCurrentUserId()` (§4.2). Nunca de prop, nunca
   de parâmetro, nunca do `payload`.
3. **O JWT vai sozinho.** `kinuBeta` persiste a sessão em `localStorage` sob
   `kinu-beta-auth` com `autoRefreshToken: true` (`client.ts:36-47`); todo `.from('trips')`
   já sai com o `Authorization` do usuário. Não há nada a fazer no espelho além de **não
   chamar sem sessão**.
4. **Sem sessão o banco é parede, não porta.** `002_rls.sql:30-32` revoga tudo de `anon`
   nas três tabelas — uma chamada anônima leva `permission denied`, não uma lista vazia.
   Por isso o guard "sem sessão → espelho desligado" é obrigatório, senão o console do
   `/planejar` anônimo vira um muro de 401.
5. **Update também precisa do `user_id` na linha.** `trips_update_own` tem `using` **e**
   `with check` (proteção contra doação de linha, provada no teste 7 do Arco 2). O
   `upsert` envia a linha inteira, então isso já está coberto — mas um `update` "parcial"
   que omitisse `user_id` num `on conflict` mal montado quebraria.
6. **A FK aponta para `profiles`, não para `auth.users`.** `trips.user_id references
   public.profiles(id)`. O perfil nasce pelo trigger `handle_new_user` (inclusive no
   primeiro login por Google, que também insere em `auth.users`) e o backfill do Arco 2
   cobriu quem já existia. **Ainda assim**, um `23503 foreign key violation` é possível se
   o trigger tiver falhado. Tratamento defensivo recomendado, uma vez por sessão: ao ver
   `23503`, tentar `insert into profiles (id, name)` — a policy `profiles_insert_own`
   permite exatamente isso — e repetir o flush.
7. **Nunca enviar `status`, `destination`, `created_at` na linha** (§2.2). Só
   `{ id, user_id, payload, schema_version }`.

---

## 6. Testes

### 6.1 Os 28 testes do tripStore continuam valendo — sem "modo só local"

Esse é o dividendo do desenho do §0: como o `tripStore.ts` **não passa a conhecer o
banco**, `src/test/tripStore.test.ts` não muda uma linha. "Modo só local" não é um modo:
é o que acontece quando `startTripSync()` nunca é chamado — e num teste unitário do store
ele nunca é.

Única exceção prevista: o teste `addTrip > gera id e createdAt quando faltam`
(`tripStore.test.ts:165`) afirma `expect(created.id).toMatch(/^trip_\d+$/)`. Com o id uuid
(§2.1) essa asserção vira o regex de uuid v4. **Um teste alterado, na missão do id.**

O canário do `kinu_user` (`:247`) segue intocado.

### 6.2 A suíte nova: `src/test/tripSync.test.ts`

**Estratégia: `vi.mock('@/integrations/kinu-beta/client')`**, não mock de rede. Motivo
técnico verificado: `client.ts:36` roda `createClient(URL, KEY)` **no import do módulo** —
sem as variáveis `VITE_KINU_BETA_*`, `createClient` lança e a suíte inteira morre antes do
primeiro `it`. Mockar o módulo elimina a dependência de `.env` no ambiente de teste (e em
qualquer CI futuro).

O duplo mock:

```ts
vi.mock('@/integrations/kinu-beta/client', () => ({ kinuBeta: fakeKinuBeta }))
```

com `fakeKinuBeta` expondo `auth.onAuthStateChange`, `auth.getSession` e um
`from('trips')` encadeável (`upsert` / `select` / `delete` / `eq` / `order`) que devolve
`{ data, error }` roteirizados e **registra as chamadas**.

Matriz mínima (12 testes):

| # | Cenário | Asserção principal |
|---|---|---|
| 1 | sem sessão | **zero** chamadas a `from('trips')`; escrita local funciona igual |
| 2 | adoção de 3 viagens | 1 `upsert` com 3 linhas, cada uma com `user_id` correto |
| 3 | idempotência | rodar a adoção 2× → mesmo conjunto de ids, nenhuma linha nova |
| 4 | falha no meio | `upsert` rejeita → `kinu_trips_owner` **não** gravado; ids seguem no outbox; 2ª tentativa reenvia |
| 5 | dono diferente | `owner.userId != uid` → **não adota**, limpa local, hidrata |
| 6 | hidratação feliz | 2 linhas no banco → `listTrips()` devolve 2, normalizadas |
| 7 | hidratação falha | localStorage **intacto** (o fallback local do §4.4) |
| 8 | espelho de update | `updateTrip` local → outbox com `upsert` do id → flush envia o payload novo |
| 9 | espelho de delete | `deleteTrip` → outbox com `delete` → `.delete().eq('id', ...)` |
| 10 | `clearTrips` | enfileira `delete` de **todos** os ids conhecidos |
| 11 | **forma da linha** | o objeto passado ao `upsert` **não** tem `status`, `destination` nem `created_at`; tem `schema_version: 1` |
| 12 | **ordem** | hidratação pede `order('created_at', {ascending:true})` e `getActiveTrip()` mantém o mesmo resultado de antes (§2.4) |

Os testes 11 e 12 são os que pegam os dois erros mais caros e mais silenciosos do arco.

### 6.3 O que teste unitário não cobre

RLS de verdade, trigger de `updated_at`, coluna gerada, FK de `profiles`. Isso é prova
contra o banco real. Recomendação: um `supabase-beta/prova-espelho.md` — checklist manual
com dois usuários, no formato do `prova-rls.sql` do Arco 2 — em vez de tentar CI (a service
key não entra em CI, e a anon key sozinha não monta o cenário de dois usuários).

---

## 7. Critério de corte da Fase C

### 7.1 O problema: hoje não há como medir "sem 🔴"

`/smoke` (`src/pages/SmokeTest.tsx`, 571 linhas) valida **geração de roteiro** —
`generateItinerary` + `validateItinerary` + `validateOfferLinks`. Ele **não encosta no
`tripStore`, nem no localStorage de viagens, nem em auth**. Os 319/320 do Arco 0 não dizem
nada sobre persistência. Portanto o critério "2 execuções sem 🔴" precisa de superfície
nova.

### 7.2 A observabilidade mínima (pré-requisito do soak)

Dentro do `tripSync`:

- `kinu_sync_log` — anel de 50 eventos `{ ts, op, id, ok, code }` em localStorage;
- `getSyncStatus()` → `{ ownerUserId, outboxLength, lastFlushAt, errors24h }`.

### 7.3 O painel `/smoke` § "Espelho" (novo)

Com sessão ativa, compara as duas pontas e mostra:

| Métrica | Verde quando |
|---|---|
| Outbox | vazio |
| Só no local (ids) | ∅ |
| Só no banco (ids) | ∅ |
| Payload divergente (hash local × hash banco) | ∅ |
| Erros no `kinu_sync_log` | 0 |
| Ordem: `listTrips()` × `order by created_at asc` | idêntica |

Mais um botão **"forçar flush"** e um **"recarregar do banco"**. Sem esse painel, "sem 🔴"
é opinião.

### 7.4 A checklist da "execução completa"

Uma execução = a sequência abaixo, num navegador de storage virgem, logado, **terminando
com o painel §7.3 todo verde**:

| # | Passo | O que prova |
|---|---|---|
| 1 | wizard → cria rascunho → aparece em `/viagens` | `addTrip` → upsert |
| 2 | cockpit do rascunho → editar roteiro → salvar | `handleSaveDraft` → upsert |
| 3 | ativar → `status` vira `active` → aparece no `/dashboard` | coluna gerada `status` acompanha |
| 4 | confirmar atividade (finanças), toggle de checklist, editar orçamento, swap de atividade | os 14 `updateTrip` do `Viagens.tsx` |
| 5 | chat do KINU cria viagem → aparece na lista **sem reload** | sino + `addTrip` → upsert |
| 6 | deletar uma viagem | delete espelhado |
| 7 | F5 | nada se perde |
| 8 | **outra aba anônima / outro navegador, mesma conta** | vê exatamente as mesmas viagens — **a prova de que o banco é a fonte** |
| 9 | logout → login | mesmas viagens |
| 10 | deslogado em `/planejar` cria viagem → login → adoção | ramo (4) do §3.2 |
| 11 | (uma vez, à parte) segundo usuário no mesmo navegador | ramo (2): **não** adota nada |

**Critério do corte:** a checklist inteira **duas vezes**, em dias diferentes, com o painel
§7.3 verde ao fim de cada uma e `errors24h == 0`. O passo 8 é o que de fato autoriza a
Fase C — se ele passa, o localStorage já é redundante.

---

## 8. Faseamento sugerido — missões atômicas

| Missão | Entrega | Rede? | Prova |
|---|---|---|---|
| **4a — id uuid** | `newTripId()` no store (com fallback `getRandomValues`), `createTrip.ts:42` usando-o, migração one-shot dos ids locais + renomeação de `kinu_price_history_*`, 1 teste alterado + 3 novos | **não** | vitest verde; app idêntico; viagens antigas sobrevivem com id novo |
| **4b — `session.ts`** | módulo de sessão observável, `startSession()` no `App.tsx`, `getCurrentUserId()` síncrono | sim (leitura) | login/logout refletem no módulo; `useAuth` intocado |
| **4c — espelho de escrita** | `tripSync.ts`: outbox + diff por snapshot + flush + upsert/delete. **Ainda não lê do banco** | sim | banco começa a encher; app não muda em nada; testes 1, 8, 9, 10, 11 |
| **4d — observabilidade** | `kinu_sync_log`, `getSyncStatus()`, painel §"Espelho" no `/smoke` | sim | o critério do §7 passa a existir |
| **4e — adoção** | marcador `kinu_trips_owner`, semeadura do outbox, diálogo de consentimento, ramo do dono diferente | sim | testes 2, 3, 4, 5 + passos 10 e 11 da checklist |
| **4f — hidratação** | pull ordenado por `created_at asc`, "banco vence menos o que está no outbox", `schema_version != 1` ignorado. **Fecha a Fase B** | sim | testes 6, 7, 12 + passo 8 da checklist |
| **— soak —** | 2 execuções completas da checklist §7.4 | — | painel verde 2× |
| **4g — corte (Fase C)** | banco como fonte única, localStorage rebaixado a cache, revisão do texto do "Reiniciar jornada" (§3.4d), possível remoção do `legacyAuth.ts` | sim | checklist §7.4 uma 3ª vez, pós-corte |

Racional da ordem: **4a** é 100% local e destrava tudo; **4c antes de 4e** porque a
adoção reutiliza a máquina de flush em vez de ter uma sua; **4d antes de 4e/4f** porque o
soak precisa de instrumento; **4f por último na Fase B** porque hidratar antes de haver o
que hidratar não prova nada.

---

## 9. Riscos, em ordem

| # | Risco | Gravidade | Mitigação |
|---|---|---|---|
| 1 | **Adoção indevida em navegador compartilhado** (primeiro login com viagens anônimas de outra pessoa) | 🔴 | Diálogo de consentimento (§3.4a) + ramo do `owner` diferente. Janela residual: única, no primeiro login de um navegador |
| 2 | **Reescrita de id quebrando referências** — `kinu_price_history_*` órfão, seleção aberta em outra aba | 🔴 | Migração one-shot no boot, antes de qualquer render; renomear as chaves de histórico junto; o sino já derruba seleção órfã |
| 3 | **Escrita perdida por consistência eventual** — usuário edita e fecha a aba antes do flush | 🔴 | Outbox persistente em localStorage; reenvia no próximo boot. Só se perde se aquele navegador nunca mais for aberto — **limitação declarada** |
| 4 | **`status`/`destination`/`created_at` enviados na linha** (`428C9`) — quebra 100% das escritas | 🔴 | Uma função `toRow(trip, uid)` como único construtor de linha + teste 11 |
| 5 | **Ordem da lista mudando na hidratação** — muda a viagem "ativa" do `/cla` e do FeedbackButton, silenciosamente | 🟠 | `order by created_at asc` + teste 12 (§2.4) |
| 6 | **Conflito multi-dispositivo com last-write-wins mudo** — dois dispositivos editam a mesma viagem, um vence sem aviso | 🟠 | Aceito na Fase B (documento inteiro = unidade, igual à semântica local de hoje). Comparar `updated_at` antes de gravar é melhoria de arco futuro |
| 7 | **`clearTrips()` passa a apagar o banco** — "Reiniciar jornada" vira destrutivo e multi-dispositivo | 🟠 | Revisar o texto do modal antes da Fase C (§3.4d) |
| 8 | **FK `profiles` ausente (`23503`)** para usuário sem perfil | 🟠 | Fallback: `insert into profiles` uma vez e repetir o flush (§5.6) |
| 9 | **401 barulhento no `/planejar` anônimo** se o espelho ligar sem sessão | 🟠 | Guard explícito "sem sessão → no-op" + teste 1 |
| 10 | **Duas abas fazendo flush do mesmo outbox** — upsert duplicado (inofensivo) ou delete revivido por reordenação | 🟡 | Outbox em read-modify-write (regra de ouro do Arco 1); op mais recente por id vence; `seq` monotônico |
| 11 | **Cliente velho lendo payload de formato futuro** | 🟡 | `schema_version != 1` → ignora com aviso, não regrava (§2.3) |
| 12 | **Histórico de preços não espelhado** — some ao trocar de dispositivo; e a chave **não é hermética** (`TripPanel.tsx:155-174` a acessa cru, duplicando dois exports sem consumidor do store) | 🟡 | Fora de escopo; anotar como dívida do Arco 4 |
| 13 | **Payload gordo** — upsert da lista inteira a cada escrita | 🟡 | Só o id alterado vai ao banco (é o que o diff do §4.3 entrega) |
| 14 | `Multiple GoTrueClient instances` ganha uma terceira assinatura | 🟡 | Já registrado na 3a; unificar `useAuth` + `session.ts` é melhoria opcional |

---

## 10. Verificações pendentes (o que leitura não prova)

1. **`crypto.randomUUID` no ambiente de teste.** Verificado que `jsdom@20.0.3` **não o
   implementa** (só `getRandomValues`); o Node do Codespace tem `globalThis.crypto.
   randomUUID`. Qual dos dois o vitest expõe precisa ser confirmado **na missão 4a** — o
   fallback recomendado torna a resposta irrelevante, mas o teste tem de passar nos dois.
2. **`vi.mock` do `client.ts` é obrigatório?** `createClient` roda no import e lança sem as
   `VITE_KINU_BETA_*`. O Vite carrega `.env` também no modo de teste, então **hoje**
   provavelmente passaria — e quebraria no primeiro CI sem `.env`. Mockar o módulo resolve
   os dois casos; confirmar na 4c.
3. **Tamanho real do payload** de uma viagem de 10-15 dias (com `outboundFlight.option`) —
   define o tamanho do lote do §3.3. Medível com um `JSON.stringify(listTrips()).length`
   no console, sem tocar em código.
4. **`on_conflict` do PostgREST sobre coluna gerada** — só importa se a opção (B) do §2.1
   for escolhida em vez da (A).
5. **Tipos gerados do kinu-beta** (pendência 3 do Arco 3b): sem eles, todas as queries de
   `trips` vêm `any`. Não bloqueia o arco, mas o teste 11 (forma da linha) passa a ser a
   única rede de segurança sobre o formato — mais um motivo para ele existir.

---

## Encerramento

Nada foi modificado. O arquivo entregue é este relatório.

A tese central para a decisão do arquiteto: **a Fase B não precisa que o funil vire
assíncrono.** O Arco 1 entregou um núcleo síncrono, hermético e com um sino — e é
exatamente isso que permite pendurar o banco ao lado dele em vez de dentro dele. O custo
dessa escolha é consistência eventual, paga com um outbox de 40 linhas; o custo da escolha
oposta seria reabrir 14 handlers de edição e os quatro callbacks do sino num arco cuja
superfície de risco já é a rede, a RLS e a identidade.
