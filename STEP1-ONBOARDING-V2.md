# STEP1 — ONBOARDING v2 ("o produto se explica")

## Achados que mudam o plano
1. `buildDraftTrip` (src/lib/createTrip.ts) exige `originCity` e `budgetAmount`. O fluxo não pergunta
   origem nem valor → precisamos de defaults (decisões A e B abaixo).
2. Os ids de tier do wizard vivem em `BUDGET_TIERS` (4 tiers). Os chips pedidos são 3:
   Econômico→`budget`, Conforto→`comfort`, Alto padrão→`luxury` (o 4º, backpacker, fica só no wizard).
3. `LANDMARKS[cidade].tiers` tem exatamente o item `icon` por cidade → `iconIdOf(city)` puro,
   lido do gerado (só leitura). Sem icon → DestinationImage via fallback do PlacePhoto.
4. O país da cidade sai de `src/data/destinationCatalog.ts` (só leitura).
5. Rascunho abre em `/viagens?trip=<id>` → `DraftCockpit` (Viagens.tsx:1472). O card entra
   ACIMA do DraftCockpit, só quando `status === 'draft'`; ativou → some sozinho.
6. HintBalloon aparece em Viagens (4x), TripPanel, Conta e KinuAIChat. Para contas novas o
   jeito menos invasivo é um gate único: `HintBalloon` retorna null quando
   `onboarding_v2` está ativo no prefs (marcado ao renderizar o fluxo). Nenhum call-site muda.
7. `onboarding.activated` deve sair no Ativar do card E no Ativar do cockpit; idempotência pela
   marca `onboardingActivatedAt` na viagem (index signature do StoredTrip), não pelo dedupe.

## Diff proposto
NOVOS
- `src/lib/onboardingFlow.ts` — `iconIdOf(city)`, `countryOf(city)`, `defaultDraftInput(city, tier,
  dates, travelers)`, `kinuDidLines(trip)` (3 linhas: hotel via `rankHotelsForTrip(...).reasons`
  do hotel atual; voo via horário de saída + `calculateArrivalTime` → "saída HH:MM porque chega
  no mesmo dia/no dia seguinte"; roteiro "N dias com X atividades do catálogo" contando itens
  `day-N-<id>` cujo id existe no catálogo). Puro, testável.
- `src/components/onboarding/FirstTripFlow.tsx` — passo 1 grade 21 cidades (PlacePhoto + nome +
  país, 2/3/4 colunas); passo 2 desliza na mesma tela: datas (próximo mês, 5 noites, editável),
  viajantes (2 adultos / 0 crianças, steppers), chips de tier (default Conforto), botão
  "Montar minha viagem" → `buildDraftTrip` → navega para o rascunho. Eventos:
  `welcome_shown` (montagem), `destination_picked {city}`, `trip_built {city, tier}`.
- `src/components/onboarding/KinuDidCard.tsx` — "O que o KINU fez": 3 linhas, cada uma leva à
  aba/bloco onde se troca (hotel → HotelSwapModal, voo → bloco de voo, roteiro → aba roteiro);
  botão primário Ativar (mesmo handler do cockpit) + `onboarding.activated {trip_id}`.
- `src/test/onboardingFlow.test.ts` — iconIdOf nas 21 cidades, kinuDidLines, tiers mapeados.

ALTERADOS
- `src/pages/Dashboard.tsx` — zero viagens → renderiza SÓ `<FirstTripFlow/>`. Remove
  WelcomeOverlay, EmptyStateHero e OnboardingProgressStrip do render. ≥1 viagem: igual a hoje.
- `src/pages/Viagens.tsx` — `<KinuDidCard/>` acima do DraftCockpit (só rascunho).
- `src/pages/Conta.tsx` — "Rever o guia do KINU" navega para `/dashboard?guia=1`, que força o fluxo.
- `src/components/onboarding/HintBalloon.tsx` — gate de retorno null (achado 6).
- Botão "Nova viagem" do dashboard → `/dashboard?guia=1` (decisão C).

APAGADOS (sem outro uso): WelcomeOverlay.tsx, EmptyStateHero.tsx, OnboardingChecklist.tsx,
OnboardingProgressStrip.tsx (o tipo `OnboardingStep` sai junto).

Não tocados: src/data/*, hotelZones, michelinData, types/trip.ts, gerador, edge functions.

## Contagem de toques (conta zero viagens)
1 cidade → 2 "Montar minha viagem" → rascunho com o card. **2 toques** (≤3).

## Decisões abertas
A. Origem: usar a cidade de casa do perfil quando existir, senão **São Paulo (GRU)**? (proposto)
B. `budgetAmount`: valor por tier × pessoas × noites tirado do próprio `BUDGET_TIERS`? (proposto)
C. "Nova viagem" para quem já tem viagem: abrir este fluxo (proposto) ou manter o wizard
   completo em /planejar e o fluxo só via "Rever o guia"?
D. HintBalloon: desligar só para contas novas (proposto) ou remover de todo o app?

Aguardando "APLICAR".
