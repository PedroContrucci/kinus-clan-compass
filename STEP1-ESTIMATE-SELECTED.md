# STEP1-ESTIMATE-SELECTED — estimativa de voo conta como selecionada

## Achados que mudam o plano
- Condição exata (DraftCockpit.tsx:350-368): `isKinuCreated = trip.createdVia === 'kinu'`.
  Ela decide (a) estágio inicial `itinerary`, (b) `plannedFlightToSelected` em ida/volta,
  (c) `canSkipFlightSelection` (:463). FirstTripFlow grava `createdVia = 'onboarding'`
  (FirstTripFlow.tsx:54) → cai no passo 06 Voo.
- **Não** reusar `createdVia = 'kinu'`: esse valor também é a origem nos eventos
  (`trackTripCreated`/tripEvents) e mistura "criada pelo KINU AI" com onboarding. Proposta:
  alargar o predicado — `usesPlannedFlights = createdVia === 'kinu' || createdVia === 'onboarding'`.
  Mesmo efeito, sem falsificar a origem. (Decisão A abaixo.)
- `SelectedFlight` está em `FlightSelectionStage.tsx:46` (não em types/trip.ts) e **não tem
  index signature**. Opções: campo opcional `source?: 'estimate' | 'search'` ali (adição,
  arquivo não intocável), ou `(sf as any).source`. (Decisão B.)
- Orçamento: `getSelectedFlightPlannedTotal` já soma `outboundFlight.option.price` +
  `returnFlight.option.price` × travelers — a estimativa entra sozinha se for persistida
  em `trip.outboundFlight/returnFlight`. Hoje o cockpit só segura em estado local; precisa
  persistir no mount (uma vez, se `!trip.outboundFlight`), via `onSave` +
  `syncTripFlightPlannedFinances`. O valor deve bater com `finances.categories.flights.planned`
  do gerador (mesmo preço) → delta ~0.
- `flightsSelected` continua `false` com estimativa; o sufixo " · fecha ao escolher o voo"
  do card (STEP1-FLIGHTLINE) passa a usar `source === 'estimate'` como gatilho.
- Escolha real em `handleFlightsSelected` grava `source: 'search'` e sobrescreve.

## Diff proposto
1. **src/components/cockpit/FlightSelectionStage.tsx** — `SelectedFlight` ganha
   `source?: 'estimate' | 'search'` (só adição); `onFlightsSelected` marca `'search'`.
2. **src/components/cockpit/DraftCockpit.tsx**
   - predicado `usesPlannedFlights` (kinu | onboarding) nos 3 pontos.
   - `plannedFlightToSelected` retorna `{ option, date, source: 'estimate' }`.
   - `useEffect` de mount: se estimativa e `!trip.outboundFlight` → persiste ida/volta +
     `syncTripFlightPlannedFinances` + `onSave` (idempotente pela marca na viagem).
   - prop `openFlightsSignal` (do STEP1-FLIGHTLINE) → `setStage('flights')`.
   - pílula 06 Voo: rótulo "estimado" quando `selectedOutbound?.source === 'estimate'`.
3. **src/components/cockpit/GeneratedItineraryStage.tsx** — item de voo da trilha e
   bloco Resumo: sufixo "· estimado" quando `source === 'estimate'` (só texto).
4. **src/lib/onboardingFlow.ts** — `kinuDidLines`: linha de voo/orçamento usam
   `trip.outboundFlight?.source === 'estimate'` (absorve o STEP1-FLIGHTLINE).
5. **src/components/onboarding/KinuDidCard.tsx** + **src/pages/Viagens.tsx** — "trocar"
   do voo → `onOpenFlights` → sinal ao cockpit (igual STEP1-FLIGHTLINE).
6. **src/test/estimateSelected.test.ts** (novo): `plannedFlightToSelected` marca
   `estimate`; total de voo da estimativa = (ida+volta)×travelers; linha do card.

Nenhum intocável tocado.

## Decisões abertas
- **A.** Predicado alargado (proposto) ou gravar `createdVia='kinu'` no FirstTripFlow?
- **B.** Campo opcional `source` em `SelectedFlight` (proposto) ou `as any`?
- **C.** Este STEP1 absorve o STEP1-FLIGHTLINE (aplico os dois juntos e deleto ambos)?
- **D.** Drafts antigos `onboarding` já salvos também ganham a estimativa ao abrir? (proposto: sim)

## Validação
vitest inteiro → tsc app → build → eslint nos tocados. Pull ff-only, commit `feat:`,
push literal, RELATORIO em `docs:` separado, deletar STEP1.
