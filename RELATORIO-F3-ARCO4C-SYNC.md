# Relatório — F3 / Arco 4c: o espelho de escrita (`tripSync.ts`)

**Data:** 19/ago/2026 · **Missão:** outbox + diff + flush — localStorage → kinu-beta.
**Base:** `RELATORIO-RECON-ARCO4.md` §0, §1.3, §2.2, §2.3, §3.3, §4.3, §4.4, §5, §6.2,
§9 (riscos 3, 4, 8, 9, 10, 13) · `session.ts` (4b) · `tripStore.ts` (4a, `newTripId`).

**Arquivos:**

| Arquivo | Status | Linhas |
|---|---|---|
| `src/lib/tripSync.ts` | **novo** | 587 |
| `src/test/tripSync.test.ts` | **novo** | 448 (17 testes) |
| `src/App.tsx` | +6 linhas (liga o espelho no boot) | — |

`tripStore.ts`, `session.ts`, `useAuth.ts`, `src/data/`, `hotelZones`, `michelinData`,
`types/trip.ts`, `supabase/` e `src/integrations/*` **não foram tocados**.

---

## 1. O que ficou de pé

```
startTripSync()                        # idempotente, uma vez no App.tsx após startSession()
  ├── semeia o snapshot (id -> hash)   # SEM enfileirar: subir o passado é ADOÇÃO (4e)
  ├── subscribeTrips(handleLocalChange)
  │      └── diff(listTrips() vs snapshot) -> {upserts, deletes}
  │           ├── sem sessão -> atualiza o snapshot e PARA (zero chamadas, risco 9)
  │           └── com sessão -> enqueue(outbox, uid) -> flush()
  ├── subscribeSession(uid => uid && flush())
  ├── window 'online' -> flush()
  └── document 'visibilitychange' (visible) -> flush()

flush()   # um por vez (inFlight); lotes de 5; item sai do outbox SÓ após sucesso
  upserts -> kinuBeta.from('trips').upsert(rows, {onConflict:'id'})
  deletes -> kinuBeta.from('trips').delete().eq('id', id)
  rows    -> toRow(): { id, user_id, payload, schema_version: 1 } e NADA MAIS
```

Exports: `startTripSync`, `flush`, `toRow`, `getOutboxLength`, `getLastFlushError`,
`OUTBOX_KEY`, `SCHEMA_VERSION` e os tipos `OutboxEntry` / `OutboxOp` / `TripRow` /
`FlushError`.

### As cinco invariantes que o módulo promete

1. **Sem sessão resolvida com `userId` → zero chamadas a `kinuBeta`.** O guard usa
   `isSessionResolved()` **e** `getCurrentUserId()`: no boot o `null` significa "ainda não
   sei", não "anônimo". O `/planejar` anônimo não muda de comportamento e não gera 401
   (risco 9, teste 1).
2. **O snapshot é semeado sem enfileirar.** Consequência declarada: **escrita feita antes do
   login não sobe — nem depois.** O handler atualiza o snapshot mesmo sem sessão, então o
   primeiro login não vê o passado como novidade. Sem essa regra, o diff viraria adoção
   silenciosa das viagens de quem quer que tenha usado aquele navegador (risco 1). Quem
   traz o passado é a 4e, perguntando antes (teste 14).
3. **Item sai do outbox só após sucesso, e a remoção casa `(id, seq)`.** Uma escrita nova
   durante o voo não é engolida pela resposta do lote antigo — a regra de ouro do Arco 1
   aplicada ao outbox (teste 15).
4. **`toRow` é o único construtor de linha:** `{ id, user_id, payload, schema_version: 1 }`.
   Nenhum `...trip` no topo. `status` e `destination` continuam indo ao banco **dentro do
   payload**, que é de onde as colunas geradas os projetam (risco 4, teste 6).
5. **Uma op nunca é drenada sob a sessão de outro dono** (ver §2).

---

## 2. A decisão que mudou a forma do outbox — `uid` na entrada (Q1 = B)

A missão fixava `{op, id, seq}`. O STEP 1 levantou uma janela estreita e real:

> A edita uma viagem **offline** → a op fica no outbox → A faz logout → **B** loga no mesmo
> navegador → a rede volta → o flush drena o outbox **sob o JWT de B** → a viagem de A nasce
> na conta de B.

Isso é adoção silenciosa pela porta de trás — o que a 4e vai gatear com consentimento. A
forma aprovada é:

```ts
export interface OutboxEntry {
  op: OutboxOp;
  id: string;
  seq: number;
  uid: string;        // quem enfileirou — o flush só drena o que é seu
  blocked?: boolean;  // recusado pela policy (42501): registrado e NÃO retentado
}
```

Três consequências práticas:

- `enqueue(ops, uid)` grava o dono; o `uid` sai sempre de `activeUserId()`, e nesse ponto ele
  é garantidamente non-null (o handler já passou pelo guard).
- o `flush()` filtra `entry.uid === userId`. Op de outro dono **fica parada** e continua
  visível em `getOutboxLength()` — a 4e decide o destino dela (teste 17).
- `isEntry()` **exige** `uid`: a chave nasce neste arco, não existe entrada legada sem dono
  para preservar. Entrada sem `uid` é entrada torta, descartada com aviso — e portanto nunca
  drenada sob a sessão de quem estiver logado no momento.

O `seq` continua saindo do **máximo do outbox lido agora**, nunca de um contador em memória:
duas abas compartilham a chave e nenhuma conhece o contador da outra (risco 10).

---

## 3. Os dois desvios do STEP 1 (e por que)

### 3.1 `Outcome` deixou de ser união discriminada

O código proposto usava `type Outcome = { ok: true } | { ok: false; code; message }`. O `tsc`
recusou com **5 × TS2339**: `tsconfig.app.json` roda com `strict: false`, e sem
`strictNullChecks` o TS não estreita a união pelo literal booleano. Virou um tipo só com
campos opcionais — `{ ok: boolean; code?: string | null; message?: string }`. Custa menos que
cinco casts e o comentário no arquivo registra o motivo.

### 3.2 Um item `blocked` **mantém** o erro aceso — o teste 8 pegou um erro de contrato meu

O STEP 1 dizia que `lastFlushError` é limpo quando a fila drena, e ao mesmo tempo que um item
`blocked` não mantém o erro aceso. As duas coisas não podem valer juntas: um item marcado por
`42501` **sai do `pending` na mesma volta em que foi marcado**, então o `flush` chegava a
"fila vazia" e apagava o `42501` que ele mesmo tinha acabado de registrar. O painel da 4d
veria "1 pendente" e nenhuma razão na tela.

A regra virou precisa: **o erro só é apagado quando não sobrou NADA do dono atual na fila —
nem pendente, nem `blocked`.**

```ts
const mine = readOutbox().filter((entry) => entry.uid === userId);
const pending = mine.filter((entry) => !entry.blocked).sort((a, b) => a.seq - b.seq);

if (pending.length === 0) {
  if (mine.length === 0) lastFlushError = null;
  return;
}
```

Foi o teste 8 que derrubou a versão anterior, antes de qualquer commit.

---

## 4. Tratamento de erro, um código por vez

| Código | O que é | O que o espelho faz |
|---|---|---|
| **rede** (promessa rejeita) | aba offline, DNS, CORS | mantém no outbox, registra em `getLastFlushError()`, **para a drenagem**; o próximo gatilho reenvia (teste 7) |
| **42501** | policy recusou (id colidindo com linha de outro dono, §3.4c) | num lote de 5 o erro não diz **qual** linha: reenvia **uma a uma** para isolar, e só a culpada recebe `blocked`. Sem retry — 42501 não melhora com repetição (teste 8) |
| **23503** | FK de `profiles` ausente (trigger `handle_new_user` falhou) | `insert into profiles {id, name: null}` **uma vez por sessão** e repete o lote. `name` vai `null` porque `session.ts` só carrega o id e a coluna é nullable (teste 13) |
| **outros** | o que não foi previsto | mantém no outbox e para; nada é perdido |

O `delete` não filtra por `user_id`: `trips_delete_own` já restringe o alcance, e apagar linha
que não é sua afeta 0 linhas sem erro — idempotente.

**Trava de segurança:** o laço de drenagem tem `MAX_ROUNDS = 200`. Toda volta tem de tirar
um item do outbox, marcá-lo ou sair; se um bug futuro quebrar essa invariante, isto é o que
evita travar a aba num laço infinito de requests.

---

## 5. Custo do diff, registrado (item 3 da missão)

Por toque do sino: um `listTrips()` (1 `JSON.parse` da chave + N `normalizeTrip`) — que o app
**já paga 4×**, um por assinante do Arco 1 — mais **N `JSON.stringify`, um por viagem**, para
os hashes. O espelho acrescenta ~1 serialização da lista por escrita. Numa lista de 5 viagens
× ~40 KB de payload, é da ordem de 1 ms em V8: irrelevante no volume do beta, e é o preço de
não tocar em `tripStore.ts` (recon §4.3 opção 1 — a única que também funciona para o evento
`storage` de outra aba, onde não existe delta para o store informar). O `flush()` faz um
`listTrips()` adicional para montar as linhas.

**Hash:** djb2-xor de 32 bits sobre `JSON.stringify(trip)`, concatenado com o comprimento
(`"1a2b3c:41822"`) — determinístico, sem dependência nova, e o comprimento derruba a chance
de colisão do djb2 puro. Colisão produziria um upsert **a menos**; ordem de chaves diferente
para a mesma viagem produziria um upsert **a mais** — idempotente, inofensivo.

**Medição pendente:** o tamanho real de um payload de viagem de 10-15 dias (recon §10.3), que
é o que confirma se lote 5 é o número certo. Um `JSON.stringify(listTrips()).length` no
console do beta resolve.

---

## 6. Testes — 17/17, e a suíte inteira em 76/76

`vi.mock('@/integrations/kinu-beta/client')`, como o recon §6.2 recomendou: `client.ts:36`
roda `createClient` **no import** e lança sem as `VITE_KINU_BETA_*` — sem `.env` (CI) a suíte
morreria antes do primeiro `it`. **Pendência §10.2 do recon fechada:** o mock é obrigatório,
e é ele que permite roteirizar respostas do PostgREST sem rede.

O `session.ts` **não** é mockado: os testes usam o módulo real por cima de um GoTrue falso, o
que exercita o par 4b+4c de verdade. Cada teste reimporta os três módulos
(`vi.resetModules()`), porque `startSession`/`startTripSync` são idempotentes por design.

| # | Cenário | Resultado |
|---|---|---|
| 1 | sem sessão | ✅ zero chamadas; a escrita local funciona igual |
| 2 | `addTrip` | ✅ 1 linha, `{onConflict:'id'}`, outbox esvazia |
| 3 | `updateTrip` | ✅ 2ª chamada leva o `payload` novo |
| 4 | `deleteTrip` | ✅ `.delete().eq('id', A)` |
| 5 | `clearTrips` | ✅ um delete por id conhecido |
| 6 | **forma da linha** | ✅ chaves exatamente `id, payload, schema_version, user_id`; `status`/`destination` só dentro do payload |
| 7 | rede caída | ✅ fica no outbox; 2º flush reenvia; erro volta a `null` |
| 8 | `42501` | ✅ `blocked: true`, motivo legível, **zero** tentativas novas |
| 9 | merge do outbox | ✅ delete>upsert e upsert>delete, uma entrada só |
| 10 | dois flushes concorrentes | ✅ um só roda |
| 11 | lote de 7 | ✅ 2 chamadas: 5 + 2 |
| 12 | logout no meio do flush | ✅ 1 lote enviado, 2 preservados, flush seguinte no-op |
| 13 | `23503` | ✅ insert em `profiles` uma vez + repete |
| 14 | **seed não adota** | ✅ 2 viagens no boot → zero chamadas; depois, só a editada sobe |
| 15 | escrita durante o voo | ✅ a edição não é engolida (`settle` por `(id, seq)`) |
| 16 | gatilhos + idempotência | ✅ `online` e `visibilitychange` registrados; 2ª chamada no-op |
| 17 | **op de outro dono** | ✅ só o `uid` logado é drenado; a do outro fica parada |

Os testes 13-17 vão além dos 12 pedidos. Os três que valem o nome: **14** (a prova de que o
espelho não adota — o erro mais caro que este arquivo poderia cometer), **15** (perda
silenciosa de escrita, a classe de bug que o Arco 1 matou) e **17** (a decisão Q1).

O 16 verifica o **registro** dos listeners em vez de disparar `online`: instâncias de módulo
zumbis do `vi.resetModules()` continuam ouvindo `window`, e um `dispatchEvent` real faria
essas instâncias mandarem requests, deixando a contagem de chamadas flaky.

### Saída

```
✓ src/test/tripSync.test.ts        (17 tests) 248ms
✓ src/test/flight-fallback.test.tsx (5 tests) 533ms
✓ src/test/session.test.ts         (13 tests)  46ms
✓ src/test/tripStore.test.ts       (31 tests)  35ms
✓ src/test/tripIdMigration.test.ts  (9 tests)  14ms
✓ src/test/example.test.ts          (1 test)    3ms

Test Files  6 passed (6)
     Tests  76 passed (76)
```

**`tsc`:** `npx tsc --noEmit -p tsconfig.app.json` → **4 erros**, os mesmos quatro de
`GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108). Baseline intacto.
**`build`:** `✓ built in 21.85s` (o aviso de chunk > 500 kB é pré-existente).

### O que estes testes NÃO provam (recon §6.3)

RLS de verdade, trigger de `updated_at`, coluna gerada recusando escrita, FK de `profiles`.
Isso é prova contra o banco real, com dois usuários — um `supabase-beta/prova-espelho.md` no
formato do `prova-rls.sql` do Arco 2. A service key não entra em CI e a anon key sozinha não
monta o cenário de dois usuários.

---

## 7. O que muda no beta a partir do próximo deploy (Q2 = sim)

`App.tsx` agora chama `startTripSync()` logo depois de `startSession()`, na mesma ordem de
boot: migração de ids (4a) → sessão (4b) → espelho (4c).

**Passa a acontecer:** toda escrita local feita **depois do login** sobe para `trips` no
kinu-beta, em background, com retomada por outbox.

**Não passa a acontecer:** nada é lido do banco (4f), nada do que já estava no navegador é
adotado (4e), e o `/planejar` anônimo é byte por byte o que era antes.

---

## 8. Riscos endereçados

| Risco | Onde | Como |
|---|---|---|
| **3** escrita perdida por consistência eventual | outbox em localStorage | reenvia no boot, no `online`, no `visible`. Só se perde se aquele navegador nunca mais for aberto — **limitação declarada** |
| **4** `status`/`destination`/`created_at` na linha (`428C9`) | `toRow` | único construtor + teste 6 |
| **8** FK `profiles` (`23503`) | `ensureProfile` | insert defensivo uma vez por sessão + repete o lote (teste 13) |
| **9** 401 no `/planejar` anônimo | `activeUserId()` | `isSessionResolved()` **e** `userId`; no-op total (teste 1) |
| **10** duas abas no mesmo outbox | `enqueue`/`settle`/`markBlocked` | read-modify-write a cada volta; op mais recente por id vence; `seq` do máximo lido (teste 9) |
| **13** payload gordo | diff por snapshot | só o id alterado vai ao banco (teste 14) |
| **1** adoção indevida | seed do snapshot + `uid` na entrada | o espelho não sobe o passado e não drena op de outro dono (testes 14 e 17) |

**Limitação aceita e declarada (risco 6):** multi-dispositivo na Fase B é last-write-wins com
o documento inteiro como unidade — a mesma semântica que o localStorage já tem hoje.

---

## 9. Pendências que atravessam para a 4d/4e/4f

1. **Prova de runtime da 4a** segue pendente no navegador de produção (storage com viagens
   reais, ids legados virando uuid). Herdada do 4b §7.
2. **`prova-espelho.md`** contra o banco real, dois usuários — RLS, trigger de `updated_at`,
   coluna gerada, FK (§6.3).
3. **Ops órfãs de outro dono** ficam no outbox por tempo indeterminado. Quem decide o destino
   delas é a 4e, junto com o `kinu_trips_owner`.
4. **`getOutboxLength()` conta os três casos juntos** — pendente, `blocked` (42501) e de outro
   dono. O painel da 4d precisa separá-los; hoje o número sozinho não distingue.
5. **`schema_version != 1` ignorado com aviso** (§2.3) é regra de LEITURA — nasce na 4f. A 4c
   só escreve `1`.
6. **Ordem `created_at asc`** na hidratação (§2.4, risco 5): a "última da lista" é a viagem
   ativa do `/cla` e do `FeedbackButton`. A 4c não reordena nada; a 4f tem de garantir isso.
7. **`clearTrips()` agora apaga o banco** (risco 7): o texto do modal "Reiniciar jornada"
   (`Viagens.tsx:493`) ainda não avisa que a exclusão virou permanente e multi-dispositivo.
   Revisão de texto antes da Fase C.
8. **Tamanho real do payload** (§10.3) — confirma se lote 5 é o número certo.
9. **Histórico de preços não espelhado** (§2.5, risco 12): `kinu_price_history_*` se perde ao
   trocar de dispositivo. Dívida registrada, fora do escopo do Arco 4.

---

## 10. Commit e push

**Commit:** `07ad92a` — `feat(f3): arco 4c - tripSync: espelho de escrita localStorage→kinu-beta (outbox + diff + flush)`

```
 RELATORIO-F3-ARCO4C-SYNC.md | 297 ++++++++++++++++++++++
 src/App.tsx                 |  12 +-
 src/lib/tripSync.ts         | 587 ++++++++++++++++++++++++++++++++++++++++++++
 src/test/tripSync.test.ts   | 448 +++++++++++++++++++++++++++++++++
 4 files changed, 1341 insertions(+), 3 deletions(-)
```

**Push** (`git push origin main`):

```
To https://github.com/PedroContrucci/kinus-clan-compass
   c9ffeac..07ad92a  main -> main
```

Sem `--amend` depois do push, sem `--force` — a regra da casa foi respeitada: esta linha
entra num commit `docs:` separado, em cima do commit do código.
