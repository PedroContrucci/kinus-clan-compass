# STEP1 — DRAFT-TRUTH (o rascunho É o roteiro)

## Achados que mudam o plano
1. **convertTripDaysToItinerary (GIS:83) não serve como está.** Adivinha `timeSlot` pela hora/categoria
   e chama `Math.random` (~:157). Ele recalcula o breakdown somando `estimatedCost` por `type` (:150–170),
   ou seja, é mais um componente fazendo soma própria. Proposta: o motor devolve `ItineraryDay[]` (com o
   `timeSlot` tipado) e o rascunho guarda esse formato em `trip.days`, com os campos de `TripDay` preenchidos
   mais `timeSlot`/`type` como campos extras. A conversão vira só um mapeamento 1:1, sem adivinhar e sem
   `Math.random`. Os dias antigos, sem `timeSlot`, continuam passando pela inferência atual.
2. **Os baldes do createTrip e os do motor são diferentes.** O createTrip tem 5 baldes (`transport` vem de
   `sumCostsByCategory('transporte')`), `× tierMultiplier` e voo da tabela. O `computeBuckets` do motor tem 4
   (voo, hotel, alimentação, passeios), e transfer/trânsito caem em passeios. Proposta: `finances.categories`
   passa a vir só de `computeBuckets`, com `transport.planned = 0`. **Isso muda os números**: o voo deixa de
   vir da tabela e passa a ser preço da estimativa × viajantes, e transfer passa a ir para passeios.
3. **plannedFlightToSelected depende de `trip.flights`.** O buildDraftTrip monta `trip.flights.outbound/return`
   depois dos dias. A ordem nova fica: horários → `flights` planejados → `plannedFlightToSelected` → motor.
   Esses horários continuam vindo da regra atual (direção/duração + `calculateArrivalTime`).
4. **O motor usa `budget` para escolher o nível de preço** (`findBestPriceLevel` quando falta tier). O tier
   sempre existe no buildDraftTrip, então o `priceLevel` é passado direto e o `budget` só entra no percentual.
   Para o envelope no build: rodar o motor → `followPlanEnvelope` (`RESERVE_RATE` já existe).
5. **O hotel curado ainda não chega ao motor.** O input `hotel?` foi deixado para "o próximo passo", e é este.
   Passar `{ name: curated.name, nightlyTotal }` faz o check-in mostrar o curado e o balde de hotel usar o
   override (é o mesmo `hotelPlannedOverride` que o stage já usa).
6. **Somadores próprios hoje:** GIS (computeEngineBuckets por recompute + o breakdown do convert),
   DraftCockpit:485–496 (soma voo + baldes do stage no Ativar), onboardingFlow.kinuDidLines (lê
   `finances.categories`, ok), KinuAnalysisCard (recebe o breakdown do stage). Financeiro e Budget chip leem
   `finances` (ok, só confirmar no APLICAR).

## Diff proposto
- **NOVO `src/lib/flightModel.ts`:** `plannedFlightToSelected` (com o parse decimal atual) mais
  `buildPlannedFlights(...)`. O DraftCockpit passa a importar de lá, com reexport para não quebrar os testes.
- **NOVO `src/lib/draftItinerary.ts`** (puro): `buildItineraryForTrip(trip, { outbound, return })` →
  `{ days, finances }`. É o motor mais `computeBuckets` mais `followPlanEnvelope`. Quem usa: o build, o
  "Regerar", a troca de voo e o Ativar.
- **`src/lib/createTrip.ts`:** o buildDraftTrip passa a usar o `draftItinerary`. Grava `outboundFlight`/
  `returnFlight` (source 'estimate'), `flightsSelected: false`, `days` e `finances`. Remove `generateDays`,
  `makeActivity`, `sumCostsByCategory`, `catId` e os helpers que ficarem órfãos (confirmado com rg antes).
- **`GeneratedItineraryStage.tsx`:** com `existingDays` não vazio, renderiza pela conversão e não gera nada
  na montagem. Ganha o botão "Regerar roteiro" (chama `onRegenerate`). O recompute de baldes passa a ler
  `trip.finances` em vez de somar. Comentário: "edições manuais se perdem ao regerar — preservar é passo futuro".
- **`DraftCockpit.tsx`:** quando o usuário escolhe outro voo no step 06, chama `buildItineraryForTrip` com os
  voos novos e salva. O Ativar usa `trip.finances` (remove a soma :485–496). `applyEstimatedFlights` fica só
  como migração (rascunho sem voo escolhido), e o rascunho migrado também ganha dias pelo motor.
- **`KinuAnalysisCard` / Resumo:** recebem os baldes vindos de `trip.finances`.
- **Testes:**
  - (a) novo `draftTruth.test.ts`: buildDraftTrip == `generateItinerary` + `computeBuckets` com os mesmos
    inputs, para 4 cidades.
  - (b) baldes de `kinuDidLines` == baldes que o stage recebe.
  - (c) `generatorDayIds.test.ts` passa a valer contra os dias do buildDraftTrip, com as regras do motor
    (`slot-`, `michelin-`).
  - (d) troca de voo (saída 23:00 → 08:00, volta 22:00 → 10:00) muda o dia 1 e o último dia.
  - A fixture do motor fica intocada.

## Decisões abertas
- **A. Números mudam** (achado 2): ok o voo da estimativa × viajantes e o fim do balde `transport` nos rascunhos novos?
- **B. Rascunhos já salvos com dias antigos** (`day-N-<id>`/slot do generateDays): renderizar como estão (proposta)
  ou regerar no próximo open?
- **C. Escopo:** são uns 9 arquivos. Dividir em 2 commits: (1) flightModel + draftItinerary + createTrip,
  (2) stage, cockpit e leitores?
- **D. "Regerar roteiro":** pedir confirmação ("suas trocas manuais serão perdidas") ou executar direto?
