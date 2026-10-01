# STEP1-BUDGET-TRUTH — o card, a Análise e o chip falam o mesmo número

## Achados (onde cada número nasce)
1. **R$ 13.856 (card + chip):** `onboardingFlow.ts:estimateBudget` (calculateTripEstimate × multiplicador do tier)
   → `buildFlowInput.budgetAmount` → `createTrip.ts:120` `budgetTotal = input.budgetAmount` → `trip.budget`.
   O card (`kinuDidLines`, linha budget) lê `trip.budget`; o chip Budget (`DraftCockpit.tsx:253`) também.
2. **R$ 15.690 (Análise):** `GeneratedItineraryStage.tsx:1085 computeBuckets(days)` = voo (`breakdown.flights`)
   + hotel (`hotelPlannedOverride` curado, senão breakdown) + comida + passeios **dos dias que a etapa regenera**
   (ela ignora `trip.days`). A Análise compara isso com `budget={trip.budget}` → "Orçamento Insuficiente".
3. **A etapa já persiste a verdade:** o effect `:1169` chama `recomputeAndPersistFinances(days)` a cada mudança
   de dias e grava `trip.finances.categories.{flights,accommodation,tours,food}.planned` + `finances.planned`.
   Mas mantém `finances.total = trip.budget` (o número da tabela). Ou seja: o total real já está salvo na
   viagem; só o envelope e as leituras estão erradas.
4. Como onboarding abre no passo 07 (STEP1-ESTIMATE-SELECTED), a etapa monta logo no open e grava as finanças
   antes do usuário ler o card. Antes disso (1º render), `trip.finances` é o do `buildDraftTrip` (tabela).
5. **Não existe regra de reserva real.** "Guardei 15% para emergências" na Análise é só texto
   (`KinuAnalysisCard.tsx:68`); o 15% de `budget.ts:62` é fatia de transporte. Nada reserva dinheiro.

## Diff proposto
- **Novo `src/lib/planTotals.ts`** (puro): `planBreakdown(trip)` → `{ flights, hotel, activities, total }`
  lendo `trip.finances.categories` (atividades = tours + food; transport/shopping entram no total se > 0,
  mesmo critério do `finances.planned`). Única fonte para card e envelope.
- **`GeneratedItineraryStage.tsx` (`recomputeAndPersistFinances`)**: se a viagem segue o plano
  (`budgetFollowsPlan(trip)`, abaixo), grava `trip.budget = finances.total = totalPlanned` (+ reserva se
  decidido em B) e `available` coerente. Senão, comportamento de hoje, byte a byte.
- **`budgetFollowsPlan(trip)`** em `planTotals.ts`: `createdVia === 'onboarding'` && status rascunho &&
  `budgetSource !== 'user'`. `budgetSource` é campo novo fora do tipo (index signature do StoredTrip).
- **`onboardingFlow.ts`**: `kinuDidLines.budget` →
  `R$ T — custo estimado: voo R$ X · hotel R$ Y · atividades R$ Z` (+ `· voo estimado` enquanto
  `source === 'estimate'`, mantendo a regra de transparência). `buildFlowInput` deixa de mandar a tabela:
  `budgetAmount: 0` → `createTrip.ts:120` já cai em `totalPlanned` (sem tocar o gerador).
  `estimateBudget` fica (o teste existente usa; FirstTripFlow pode mostrar como prévia, se quiser).
- **Chip Budget**: sem mudança de código — lê `trip.budget`, que passa a ser o total do plano.
- **Drafts já salvos** (D do arco anterior): o mesmo `recomputeAndPersistFinances` corrige no próximo open,
  idempotente (grava só se o valor muda).
- **Testes novos `src/test/budgetTruth.test.ts`**: (1) `planBreakdown` soma = `finances.planned`;
  (2) draft onboarding Cartagena: `trip.budget === finances.planned` após o recompute; Análise não
  insuficiente (`total ≤ budget`); (3) linha do card no formato pedido, X+Y+Z = T; (4) viagem do
  assistente com budget digitado: envelope intocado; (5) `budgetSource: 'user'` congela o envelope.

## Arquivos
Novo: `src/lib/planTotals.ts`, `src/test/budgetTruth.test.ts`.
Editados: `src/lib/onboardingFlow.ts`, `src/components/cockpit/GeneratedItineraryStage.tsx`,
`src/test/onboardingFlow.test.ts` (o caso "orçamento pela tabela" muda de expectativa).
Talvez: `src/components/cockpit/KinuAnalysisCard.tsx` (só se B = sem reserva, ver abaixo).
Intocáveis: nada em src/data/, hotelZones, michelinData, types/trip.ts.

## Decisões abertas
- **A. Quem trava o envelope?** Proposta: só ação explícita do usuário sobre o orçamento grava
  `budgetSource: 'user'`. Hoje o "trocar" do budget leva a /planejar (assistente novo, outra viagem) —
  não há edição de orçamento no rascunho, então na prática o envelope segue o plano até Ativar. Ok?
- **B. Reserva:** não existe. Opções: (1) envelope = total exato e a Análise troca "Guardei 15%" por texto
  honesto ("sem folga — o envelope é o custo do plano"); (2) envelope = total × 1,15 e o texto passa a ser
  verdade. Recomendo (2): o card mostra T do custo e "envelope R$ E com 15% de reserva".
- **C. Após Ativar** o envelope congela (status sai de rascunho). Trocas de hotel/voo depois disso
  aparecem como estouro honesto, não reajuste silencioso. Ok?
- **D.** "atividades" = passeios + refeições (como a Análise soma). Separar "comida" numa 4ª parcela?
