# Relatório — F3 / Arco 1 / Fase 1a: `src/lib/tripStore.ts`

**Data:** 2026-08-11
**Commit:** `c4bb752` — *feat(f3): tripStore - funil unico de trips sobre localStorage (fase 1a, sem consumidores)*
**Push:** `2fb60af..c4bb752  main -> main` ✅
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §6, §7, §8
**Protocolo:** STEP1 (`STEP1-TRIPSTORE-1A.md`) revisado e aprovado antes da aplicação; deletado após.

---

## TL;DR

Fundação no ar. **`src/lib/tripStore.ts` criado com 391 linhas e 12 exports.**
`Viagens.tsx` encolheu **97 linhas** e ganhou 4 — o único ponto de contato desta fase é a
`normalizeTrip`, que mudou de casa.

`tsc --noEmit`, `vitest run` (6/6) e `vite build` passaram os três.

**Ninguém consome o store ainda** — era o escopo. As 18 operações de storage da `Viagens`
seguem exatamente como estavam, até a fase 1d.

**Limite honesto:** dos 12 exports, **só a `normalizeTrip` roda em produção hoje**. Os
outros 11 compilam e nunca foram chamados. Detalhe em §6.

---

## 1. O que entrou — `src/lib/tripStore.ts`

12 exports públicos: os 10 da interface aprovada (§7 do recon) mais os 2 de histórico de
preço, pela decisão "opção (a)" do arquiteto.

| Export | Papel |
|---|---|
| `TRIPS_KEY` / `PRICE_HISTORY_PREFIX` | Constantes das chaves |
| `StoredTrip` (tipo) | `SavedTrip & { [key: string]: any }` — §2 |
| `PriceSnapshot` (tipo) | `{ price, timestamp }` |
| `listTrips()` | Array garantido, cada item normalizado |
| `getTrip(id)` | Busca por id |
| `getActiveTrip()` | Heurística única de "viagem ativa" |
| `addTrip(trip)` | Append com read-modify-write |
| `updateTrip(id, updater)` | **O carro-chefe** — §3 |
| `deleteTrip(id)` | Remove a viagem **e** o `kinu_price_history_<id>` |
| `clearTrips()` | Zera tudo, incluindo históricos órfãos |
| `normalizeTrip(trip)` | Movida de `Viagens.tsx:194` |
| `subscribeTrips(fn)` | Notifica esta aba e outras; devolve unsubscribe |
| `getPriceHistory(id)` / `pushPriceSnapshot(id, price)` | Histórico trip-scoped |

Privadas (não exportadas): as 5 auxiliares de normalização que vieram junto, mais
`readRaw`, `writeAll`, `emit`, `handleStorageEvent`, `describeShape`, `priceHistoryKey`.

---

## 2. A correção de rumo na tipagem

O STEP1 travou numa decisão que precisou ser revista antes de qualquer código:
**`SavedTrip & Record<string, unknown>`, aprovado na §8 do recon, não compila.**

Testei num probe isolado antes de escrever o store:

```
TS2345: Argument of type 'SavedTrip' is not assignable to parameter of type
  'SavedTrip & Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'SavedTrip'.
```

Causa: `SavedTrip` é uma `interface`, e interfaces do TypeScript **não recebem index
signature implícita** (type aliases recebem). Na prática, `addTrip()` recusaria a viagem
que o `buildDraftTrip` produz.

**O erro era meu** — escrevi `Record<string, unknown>` na §8 do recon sem testar.
Corrigido para `SavedTrip & { [key: string]: any }`, aprovado por você, que passa nos dois
sentidos de atribuição.

**O custo, declarado:** `{ [key: string]: any }` desliga a checagem de typo em propriedades
novas dentro do store — `trip.destinaton` não acusa. `Record<string, unknown>` teria dado
esse erro útil, mas não é uma opção porque não compila. O `any` sai quando `src/types/trip.ts`
for corrigido para declarar os 6 campos reais (`outboundFlight`, `lastPriceCheck`,
`createdVia`, `returnFlight`, `packing`, `accommodation.mealPlan`) — arco futuro.

---

## 3. A regra de ouro, implementada

A §6 do recon pedia uma coisa só:

> Toda escrita é read-modify-write contra o `localStorage`, nunca contra o estado React.

Como ficou em `updateTrip`, a função que sozinha vai absorver 15 das 16 escritas da
`Viagens` mais a do `GeneratedItineraryStage`:

```ts
export function updateTrip(id, updater) {
  const trips = readRaw();                                  // relê AGORA
  const index = trips.findIndex((trip) => trip && trip.id === id);

  if (index === -1) {
    console.warn(`[tripStore] updateTrip: viagem "${id}" não existe no storage — nada gravado`);
    return null;
  }

  const updated = updater(normalizeTrip(trips[index]));     // patch pontual
  trips[index] = updated;
  writeAll(trips);

  return updated;
}
```

O ponto: as **outras** viagens do array nunca são reconstruídas a partir de memória. É isso
que desarma os dois cenários de perda silenciosa do recon — §4.1 (`GeneratedItineraryStage`
× `Viagens`) e §4.2 (`KinuAIContext` × `Viagens`).

`addTrip` e `deleteTrip` seguem a mesma disciplina: `readRaw()` no momento da operação,
nunca um array recebido de fora.

**Ressalva importante:** a regra está implementada, **não em vigor**. Enquanto os
consumidores não migrarem (fases 1b-1d), os dois bugs continuam vivos exatamente como
antes. Esta fase construiu a ferramenta; não consertou nada em produção.

---

## 4. O move da normalização

`normalizeSavedTrip` era a ponta de um bloco contíguo de 93 linhas em `Viagens.tsx:111-203`.
As outras cinco funções tinham **exatamente um chamador cada, dentro do próprio bloco** —
verificado por `grep` em todo o `src/`. Foram junto, como privadas:

| Função | Era | Virou |
|---|---|---|
| `normalizeSavedTrip` | `Viagens.tsx:194` | `normalizeTrip` (export) |
| `normalizeTripDays` | `Viagens.tsx:150` | privada |
| `inferDayIcon` | `Viagens.tsx:111` | privada |
| `normalizeActivityCategory` | `Viagens.tsx:124` | privada |
| `normalizeActivityStatus` | `Viagens.tsx:136` | privada |
| `isJetLagFriendlyActivity` | `Viagens.tsx:141` | privada |

**Lógica idêntica, sem uma vírgula alterada** — incluindo o detalhe de que
`syncTripFlightPlannedFinances` **muta** `trip.finances` no lugar, e o spread da
`normalizeTrip` é raso, então o objeto `finances` continua compartilhado com a entrada.
Documentado no JSDoc da função para quem for mexer depois. A operação é idempotente
(delta 0 na segunda passada), o que a torna segura para rodar em toda leitura — foi essa
propriedade que permitiu `listTrips` e `updateTrip` normalizarem sem risco.

---

## 5. Diff da `Viagens.tsx` — **+4 / −97**

Quatro pontos, todos consequência mecânica do move:

```diff
-import { getFlightPlannedTotal, syncTripFlightPlannedFinances } from '@/lib/flightFinance';
+import { getFlightPlannedTotal } from '@/lib/flightFinance';
+import { normalizeTrip } from '@/lib/tripStore';
```

```diff
-function inferDayIcon(...)            ← bloco 111-203 inteiro, 93 linhas
-...
-function normalizeSavedTrip(...)
```

```diff
-    const normalizedTrips = rawTrips.map((trip: any) => normalizeSavedTrip(trip));
+    const normalizedTrips = rawTrips.map((trip: any) => normalizeTrip(trip));
```

```diff
-    const normalizedTrip = normalizeSavedTrip(updatedTrip);
+    const normalizedTrip = normalizeTrip(updatedTrip);
```

`syncTripFlightPlannedFinances` saiu do import porque a linha 202 era seu único uso;
`getFlightPlannedTotal` ficou (3 usos). Confirmado por `grep` que `SavedTrip`,
`TripActivity`, `ActivityStatus`, `ChecklistItem` e `contextualTips` continuam todos em uso
fora do bloco removido.

**As 16 `setItem`, a `removeItem` e a leitura de mount: intocadas.**
`Viagens.tsx` foi de **2907 para 2814 linhas**.

---

## 6. Verificação — e o que ela não prova

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, zero erros |
| `npx vitest run` | ✅ **6 testes, 2 arquivos, todos passando** (10.05s) |
| `npx vite build` | ✅ built in 22.43s |

O aviso de chunk >500 kB é **pré-existente** e não tem relação com esta fase.

**Cobertura de teste — declaração honesta.** A suíte do projeto continua com os mesmos 6
testes (`flight-fallback`, `example`) e **nenhum deles toca o `tripStore`**. Os três
comandos provam que compila, tipa e não quebrou nada. **Não provam que o store funciona.**

Concretamente: das 12 funções exportadas, **uma** roda em produção hoje — a `normalizeTrip`,
pelos dois pontos da `Viagens.tsx`. As outras 11 são código que compila e ninguém chamou
ainda. `updateTrip`, `deleteTrip`, `clearTrips`, `subscribeTrips` e a dupla de price history
**nunca executaram**, nem em teste nem em runtime.

A prova real disponível nesta fase é estreita e vale ser dita com precisão: **se a `/viagens`
abre, lista as viagens com os dias corretos e ativa um rascunho, a normalização sobreviveu
à mudança de casa.** Nada além disso foi verificado.

**Teste do store é pendência declarada da fase 1b** — não foi esquecimento, foi escopo.

---

## 7. Escolhas de implementação que ficam registradas

| # | Escolha | Por quê |
|---|---|---|
| 1 | **`setItem` não é capturado** — `QuotaExceededError` propaga | Preserva o comportamento dos 19 `setItem` de hoje, que também não capturam. Capturar mudaria as assinaturas da §7 e faria `addTrip` devolver uma viagem que talvez não esteja no storage — pior que o erro visível. |
| 2 | **Sem guarda de SSR** | SPA Vite + `vitest` em `jsdom`: `window` e `localStorage` existem nos dois. Guarda aqui seria ramo morto e não testável. |
| 3 | **O updater recebe a viagem normalizada; a saída é gravada crua** | Normalizar a saída reescreveria em silêncio a decisão do chamador. Toda leitura normaliza de qualquer forma. |
| 4 | **`listTrips` descarta entradas não-objeto, com aviso** | É a **única diferença de comportamento** em relação ao código de hoje. Escolhida porque a §4.3 do recon mostrou que storage torto derruba o mount. Sem consumidor nesta fase, o risco é zero. |
| 5 | **`pushPriceSnapshot` não notifica `subscribeTrips`** | A assinatura é sobre a lista de viagens; histórico de preço tem outro ciclo de vida. |
| 6 | **Listener de `window` só existe com assinante** | Nesta fase ninguém assina — listener global permanente seria peso morto. Anexa no primeiro `subscribeTrips`, solta quando o último sai. |
| 7 | **`clearTrips` coleta as chaves antes de apagar** | `removeItem` reindexa o storage; apagar dentro do laço pularia chaves. Bug real evitado. |

---

## 8. Duplicação temporária consciente

`getPriceHistory` e `savePriceSnapshot` **continuam vivas** em `TripPanel.tsx:148-168` — o
escopo proibia tocar naquele arquivo. São duas implementações da mesma coisa até a fase de
migração do consumidor.

Não divergem em comportamento: mesma chave, mesmo formato, mesmo teto de 10 registros. A
única diferença é `while (length > 10) shift()` no store contra `if (length > 10) shift()`
no `TripPanel` — equivalente na prática (a lista nunca cresce mais de 1 por chamada), e mais
robusto se um histórico legado chegar com 15 itens.

Registrado para não ser descoberto como surpresa.

---

## 9. Conformidade de escopo

Arquivos tocados — exatamente os 2 autorizados:

```
src/lib/tripStore.ts       (criado, 391 linhas)
src/pages/Viagens.tsx      (+4 / −97)
```

Não tocados, conforme proibição: `src/data/`, `src/lib/hotelZones.ts`,
`src/lib/michelinData.ts`, `src/types/trip.ts` — e também `src/components/cockpit/TripPanel.tsx`,
`src/lib/safeStorage.ts` e `src/lib/flightFinance.ts`, que o store apenas consome.

O rascunho `STEP1-TRIPSTORE-1A.md` foi deletado após a aplicação e nunca entrou em commit.

---

## 10. Pendências e próximo passo

**Da fase 1a:**
- **Teste do `tripStore`** — 11 das 12 funções nunca executaram (§6). É a lacuna real desta
  fase e o primeiro item da 1b.

**Do Arco 1, ainda abertas (recon §8):**
- **`GeneratedItineraryStage` não conhece o `id` da viagem** — busca por destino+datas e
  falha em silêncio. Para usar `updateTrip(id, ...)`, o `id` precisa descer como prop via
  `DraftCockpit`. Sem isso, o §4.1 não fecha, e é trabalho fora do `tripStore.ts`.
- **Os 28 pontos de acesso continuam intocados.** Os bugs §4.1 e §4.2 seguem vivos até a
  migração dos consumidores.

**Próximo passo sugerido — fase 1b:** teste do store (jsdom já está configurado, então
`localStorage` está disponível na suíte) + migração dos 4 leitores puros (`Cla`, `Dashboard`,
`Conta`, `FeedbackButton`) para `listTrips`/`getActiveTrip`. São 4 arquivos, 1 operação cada,
risco baixo — e já eliminam a duplicação da heurística de viagem ativa.

---

## 11. Estado do repositório

```
c4bb752  feat(f3): tripStore - funil unico de trips sobre localStorage (fase 1a, sem consumidores)
2fb60af  docs: relatorio do Arco 0 - gate de entrada da F3
```

`main` = `origin/main`. Working tree limpo, exceto 4 relatórios não commitados na raiz:
`RELATORIO-CANDIDATAS-SALVADOR.md`, `RELATORIO-PATCH-ONERROR-COVERS.md`,
`RELATORIO-RECON-TRIPSTORE.md` e este. Aguardando sua decisão sobre commitá-los.
