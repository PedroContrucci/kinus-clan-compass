# Relatório — F3 / Arco 4a: ids de viagem em uuid v4 + migração one-shot

**Data:** 19/ago/2026 · **Natureza:** 100% local. Nenhuma chamada de rede, nenhum toque em
`src/integrations/`, `supabase/`, `src/data/`, `hotelZones`, `michelinData` ou
`types/trip.ts`.
**Base:** `RELATORIO-RECON-ARCO4.md` §1.4, §2.1 (opção A), §6.1, §9 risco 2, §10.1.
**Avais do arquiteto aplicados:** escrita direta na migração (Opção 3, exceção
documentada) · chamada no escopo de módulo em `App.tsx` · viagem sem `id` também migra.

---

## 0. O que mudou

| Arquivo | Natureza | Linhas |
|---|---|---|
| `src/lib/tripStore.ts` | novo export `newTripId()`; `addTrip` passa a usá-lo | +27 / −1 |
| `src/lib/createTrip.ts` | `trip-${Date.now()}` → `newTripId()` | +2 / −1 |
| `src/lib/tripIdMigration.ts` | **novo** — migração one-shot dos ids legados | +86 |
| `src/App.tsx` | chama a migração no boot, fora do render | +6 |
| `src/test/tripStore.test.ts` | regex de uuid no teste do `addTrip` + 3 testes novos | +32 / −1 |
| `src/test/tripIdMigration.test.ts` | **novo** — 9 testes | +165 |

Uma única mudança funcional dentro do `tripStore`, como o recon §1.4 previu: o gerador de
id. O funil continua síncrono, hermético e sem saber que existe banco.

---

## 1. `newTripId()` — a identidade das duas pontas

`trips.id` no kinu-beta é `uuid`. Um `trip-1755000000000` não entra na coluna: o insert
morre com `22P02 invalid input syntax for type uuid`. Adotada a **opção A** do recon §2.1 —
o id local **é** o id do banco, uma identidade só. Isso dá dedupe e idempotência de graça
no `upsert` do Arco 4c, sem tabela de mapeamento em localStorage.

```ts
export function newTripId(): string {
  const native = globalThis.crypto?.randomUUID?.();
  if (native) return native;

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
```

Sem dependência nova. Os dois pontos de geração passam a chamar isto:
`tripStore.addTrip` (fallback) e `createTrip.buildDraftTrip:43` (o caminho real de
produção — é ele que sempre entrega o id hoje).

### 1.1 Ambiente de teste — resposta ao §10.1 item 1 do recon

Medido com sonda descartável rodando sob o vitest real do projeto (`environment: jsdom`,
`vitest@3.2.4`, `jsdom@20.0.3`):

```
typeof globalThis.crypto            = object
typeof crypto.randomUUID            = function     ← EXISTE
typeof crypto.getRandomValues       = function
window.crypto === globalThis.crypto = true
sample = 91868bba-23bc-472c-ad8b-1a664fd67f58
```

**Achado, contrário à suposição do recon §2.1:** o teste **não** roda com o `Crypto` do
jsdom. O vitest 3 monta o ambiente jsdom sobre o global do Node e não substitui
`globalThis.crypto` — então `randomUUID` está lá, é o webcrypto do Node, e `window.crypto`
é o mesmo objeto.

Isso **não** derruba o fallback, porque o jsdom nunca foi o único motivo dele:

- no browser, `randomUUID` é *secure-context only* e **some** em origem não-segura (http
  num IP de LAN — cenário real do beta aberto no celular). `getRandomValues` não é
  secure-context e permanece;
- protege contra qualquer troca futura de runner/ambiente.

Efeito colateral do achado: por padrão os testes exercitariam **só** o caminho nativo. Por
isso o teste do fallback **força a ausência** (`crypto.randomUUID = undefined`, restaurado
no `finally`) e valida 100 ids: todos casam o regex v4, todos distintos. Os dois casos do
§10.1 passam a ser cobertos de verdade.

---

## 2. A migração one-shot — `src/lib/tripIdMigration.ts`

Os navegadores do beta já têm viagens gravadas com id legado. Elas precisam sobreviver e
caber na coluna `uuid`. Risco 2 do recon §9.

```
1. lê kinu_trips com loadJson (nunca lança)
2. mapeia: id que não casa uuid v4 → newTripId(); guarda {de, para}
3. se nada mudou → RETORNA SEM ESCREVER          ← a idempotência
4. UM setItem em kinu_trips
5. só então renomeia kinu_price_history_<antigo> → kinu_price_history_<novo>
```

### 2.1 Por que escrita direta, e não o funil do store

A pergunta da missão era como escrever sem disparar o sino N vezes. A resposta escolhida
não é sobre o sino:

> `updateTrip` entrega ao updater a viagem **normalizada** (`tripStore.ts:345`) e grava o
> retorno. `normalizeTrip` reconstrói `days[]`, inventa id de atividade faltante, preenche
> `time`/`duration`/`category`, e `syncTripFlightPlannedFinances` **muta `finances`**.
> Uma migração de *id* passaria a reescrever o payload inteiro de toda viagem antiga do
> beta, em silêncio, no boot — justo antes de esse payload ir para o banco.

Descartada também a alternativa de expor um `writeAll` no store: instalaria
permanentemente na API pública a assinatura que a regra de ouro do Arco 1 proíbe
(`tripStore.ts:6-8` — "nenhuma função aqui aceita o array inteiro de fora"), que é o padrão
que produziu a perda silenciosa do recon §4.1/§4.2.

O que ficou: `{ ...trip, id: novo }` num spread raso — preserva **todos** os campos,
inclusive os 6 que `SavedTrip` não declara — e **um** `setItem`. Uma escrita é atômica: a
lista migra inteira ou não migra, sem estado "metade em uuid". Zero emits por construção,
então a correção não depende da ordem de boot (a *invisibilidade* depende, e é garantida
pelo ponto de chamada). O `tripStore` fica com uma mudança funcional só.

**Custo declarado:** a regra de ouro do Arco 1 ganha uma exceção. Ela está escrita no
cabeçalho do módulo, com o porquê. É um passo de migração — categoria em que escrever no
formato bruto é a prática correta —, chamado num lugar só, descartável quando o beta virar.

### 2.2 Ordem 4→5, de propósito

Se um rename falhar depois do `setItem`, sobra histórico órfão: chave **sem consumidor em
produção** (`getPriceHistory`/`pushPriceSnapshot` têm zero chamadores; `TripPanel.tsx:155-174`
duplica a leitura crua — recon §2.5 e §1.1). Na ordem inversa, um `setItem` estourado
renomearia históricos para ids que nunca passariam a existir: perda real. Escolhido o modo
de falha barato.

### 2.3 Casos de borda cobertos

| Caso | Comportamento | Teste |
|---|---|---|
| `trip-…` e `trip_…` | viram uuid v4 distintos, resto do payload intacto | 1 |
| histórico de preços do id legado | renomeado, conteúdo idêntico, chave antiga removida | 2 |
| segunda execução | `{migrated: 0}`, storage **byte a byte** igual | 3 |
| viagem já em uuid | objeto idêntico, sem escrita nenhuma | 4 |
| lista mista | só a legada muda; ordem preservada | 5 |
| viagem **sem** `id` | ganha uuid (aval do arquiteto), sem rename | 6 |
| storage vazio / JSON corrompido / não-array | no-op, sem escrita, sem exceção | 7 |
| `null` e número dentro do array | preservados como estão | 8 |

Duas viagens legadas com o mesmo id: cada uma ganha um uuid distinto e o histórico segue a
primeira (na segunda, a chave antiga já não existe). Declarado, não é cenário observado.

### 2.4 Ponto de chamada

```tsx
import { migrateLegacyTripIds } from "@/lib/tripIdMigration";

// Boot, no escopo do módulo: roda uma vez na avaliação de App.tsx, portanto ANTES do
// `createRoot(...).render()` do main.tsx — nenhum componente que lê trips chegou a montar.
migrateLegacyTripIds();
```

A garantia "antes de qualquer render" vem da ordem de avaliação de módulo, não de um
`useEffect` — que rodaria **depois** do primeiro render de `Viagens`/`Dashboard`.

---

## 3. Verificação

| Passo | Resultado |
|---|---|
| `npx tsc --noEmit -p tsconfig.app.json` | **4 erros — exatamente o baseline**, todos pré-existentes em `GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108, `TS2339`). Nenhum erro novo |
| `npx vitest run` | **46 passando / 46** (4 arquivos). Baseline era 34 — +3 no `tripStore` (`newTripId`) e +9 no arquivo novo |
| `npm run build` | ✓ built in 22.05s, sem erro |

Saída do vitest:

```
 ✓ src/test/tripStore.test.ts (31 tests) 28ms
 ✓ src/test/tripIdMigration.test.ts (9 tests) 11ms
 ✓ src/test/flight-fallback.test.tsx (5 tests) 362ms
 ✓ src/test/example.test.ts (1 test) 2ms

 Test Files  4 passed (4)
      Tests  46 passed (46)
```

Os 28 testes originais do `tripStore` continuam válidos; **um** mudou, o previsto pelo
recon §6.1 (`tripStore.test.ts:165`, `/^trip_\d+$/` → regex de uuid v4). O canário do
`kinu_user` segue intocado.

---

## 4. Efeito para o usuário

Por fora, o app é idêntico. Nenhuma tela lê o formato do id, e o deep-link `?trip=` nem é
lido hoje (pendência §4.11 do Arco 1). Viagens antigas sobrevivem com id novo. Numa aba já
aberta durante a migração — cenário que exige duas abas e um reload em uma delas — o sino
do Arco 1 derruba a seleção órfã (`Viagens.tsx:266`), comportamento que já existia.

**O que este arco NÃO faz:** nada de rede, `kinuBeta`, outbox, adoção ou hidratação — isso
é 4b/4c. O histórico de preços continua local e não espelhado (dívida do recon §2.5 /
risco 12); a duplicação crua em `TripPanel.tsx:155-174` não foi tocada, mas se beneficia do
rename, já que monta a mesma string `kinu_price_history_<id>`.

**Pré-requisito entregue:** todo id de viagem agora cabe na coluna `uuid` do kinu-beta —
é o que destrava o 4c.

---

## 5. Commit e push

**Commit:** `763279b` — `feat(f3): arco 4a - ids de viagem em uuid v4 + migracao one-shot
dos ids legados (pre-requisito do espelho)`
`main` fica com **um** commit para o arco inteiro, como pedido — mas isso exige emendar o
commit para caber a saída do push dentro dele. A sequência real, em três gravações:

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   76a03ca..763279b  main -> main

$ git commit --amend   # relatório passa a conter a saída acima
$ git push --force-with-lease origin main
To https://github.com/PedroContrucci/kinus-clan-compass
 + 763279b...0e91816  main -> main (forced update)

$ git commit --amend   # relatório passa a conter a saída acima
$ git push --force-with-lease origin main
```

O hash final é o do commit que carrega este arquivo (`git log -1`) — um relatório não pode
citar o próprio hash sem regressão infinita, então a corrente para aqui. O
`--force-with-lease` só reescreveu porque o remoto estava, a cada passo, exatamente no
commit que acabáramos de empurrar; nenhum commit de terceiro foi sobrescrito.

Arquivos do commit:

```
RELATORIO-F3-ARCO4A-UUID.md    (novo)
src/App.tsx                    +6  −0
src/lib/createTrip.ts          +2  −1
src/lib/tripIdMigration.ts     (novo, 86 linhas)
src/lib/tripStore.ts           +27 −1
src/test/tripIdMigration.test.ts (novo, 165 linhas)
src/test/tripStore.test.ts     +32 −1
```

`STEP1-ARCO4A.md` deletado antes do commit — não entrou no repositório em momento nenhum.
