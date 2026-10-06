# STEP1-INTERESTS-FOR (não commitar)

## Achados que mudam o plano
1. **Existem dois mapeamentos de interesse, não um.** Os chips usam `matchesPriority`
   (`src/lib/claChips.ts`: styleTag == id; gastronomia também pega refeições; noite pega a categoria
   `night`; praia também pega a tag `praia`). O motor (`itineraryEngine.ts:385`) usa `interestToTheme`
   (interesse → tema do dia). Proposta: `interestsFor` usa `matchesPriority`, que já é o recorte que o
   usuário vê no Clã. O motor continua ordenando por tema, mas **recebe só os interesses filtrados**.
2. **Os chips do assistente ficam em `WizardStep3Budget.tsx:118`**, não no `NewPlanningWizard`. O destino
   já está em `data.destinationCity` (passo 1).
3. **Clã (`Cla.tsx:251`) já filtra, mas com ≥1 item** (e Gastronomia sobe sozinha quando a cidade tem
   Michelin). Passa a ser ≥5 via `interestsFor`. Decisão D abaixo sobre o Michelin.
4. **Outros lugares não são listas de escolha:** `WizardStep4Summary` e `Viagens.tsx:1442` só exibem o
   que foi salvo; `KinuAIContext:440` extrai interesses do texto; o primeiro fluxo (FirstTripFlow) grava
   `travelInterests: []`. Nenhum desses vira filtro de chip.
5. **Rio de Janeiro perde Praia (3 itens) e Cartagena também (2).** Praia passa do corte só em Fortaleza (6),
   Salvador (5) e Porto Seguro (13). É o catálogo de hoje, não um defeito do filtro — mas muda o
   que o usuário vê no Rio. Decisão C.

## Contagem por cidade (itens ≥5 → chip oferecido)
Usa `getDestinationActivities` + `matchesPriority`. ✔ = oferecido.
| Cidade | Chips | Oferecidos (n) |
|---|---|---|
| Paris | 7 | gastro 26, noite 10, família 8, história 13, arte 8, cultura 33, compras 6 |
| Fortaleza | 6 | gastro 36, praia 6, noite 8, família 11, cultura 17, relax 12 |
| Rio de Janeiro | 7 | gastro 39, noite 11, família 14, história 8, arte 5, cultura 29, natureza 8 (praia 3 ✗) |
| Lisboa | 5 | gastro 20, família 8, história 9, arte 5, cultura 23 |
| Orlando | 5 | gastro 19, família 28, cultura 5, compras 5, natureza 5 |
| Tóquio | 7 | gastro 23, noite 8, família 13, cultura 27, relax 6, compras 6, natureza 8 |
| Roma | 6 | gastro 26, noite 5, família 8, história 9, arte 5, cultura 18 |
| Salvador | 7 | gastro 35, praia 5, noite 7, família 14, história 7, cultura 38, relax 9 |
| Buenos Aires | 6 | gastro 20, noite 6, família 6, história 5, arte 7, cultura 26 |
| Cartagena | 6 | gastro 22, noite 6, família 12, história 6, cultura 18, relax 6 (praia 2 ✗) |
| Nova York | 6 | gastro 17, noite 6, família 19, história 7, arte 6, cultura 17 |
| Gramado | 4 | gastro 23, família 24, cultura 9, natureza 7 (praia 0 ✗) |
| Londres | 4 | gastro 18, família 16, história 8, cultura 23 |
| Barcelona | 6 | gastro 18, família 15, história 7, arte 9, cultura 20, natureza 5 |
| Porto Seguro | 5 | gastro 21, praia 13, família 14, cultura 15, natureza 6 |
| Dubai | 4 | gastro 15, noite 6, família 23, cultura 18 |
| Cidade do Cabo | 4 | gastro 17, família 11, cultura 9, natureza 7 |
| Istambul | 3 | gastro 18, história 9, cultura 17 |
| Bangkok | 4 | gastro 16, família 8, história 8, cultura 15 |
| Marrakech | 4 | gastro 17, história 7, cultura 14, natureza 5 |
| Singapura | 5 | gastro 15, família 14, história 5, cultura 11, natureza 5 |

Aventura e Inverno/Neve não passam em nenhuma cidade → nunca aparecem.

## Diff proposto
- **novo `src/lib/interestsFor.ts`** (puro): `MIN_INTEREST_ITEMS = 5`; `interestCounts(city)`;
  `interestsFor(city)` → chips de `PRIORITY_CHIPS` com ≥5; `splitInterests(city, stored)` →
  `{ used, ignored }`. Cidade fora do catálogo → `[]` (nenhum chip).
- **`WizardStep3Budget.tsx`**: mapear `interestsFor(data.destinationCity)` no lugar de `TRAVEL_INTERESTS`;
  ao trocar de destino, remover da seleção o que deixou de ser oferecido.
- **`Cla.tsx:251`**: `priorityChips` = `interestsFor(city)` (+ regra do Michelin, decisão D).
- **`src/lib/draftItinerary.ts` (`buildItineraryForTrip`)**: passa ao motor só `splitInterests(...).used`.
  É o único ponto de entrada do motor (build, Regerar, troca de voo) → sem mexer no motor.
- **`onboardingFlow.ts` `kinuDidLines`**: com `ignored` não vazio, a linha do roteiro vira
  "N dias com X atividades do catálogo · montei por Gastronomia, Cultura — Praia não tem catálogo em Gramado"
  (sem interesse usado: "montei pelo catálogo da cidade — …").
- **novo `src/test/interestsFor.test.ts`**: (a) 21 cidades: todo chip oferecido tem ≥5 itens que casam;
  (b) Gramado sem `beach`; Fortaleza com `beach`; (c) viagem Gramado com `['beach','gastronomy']` →
  linha explicativa e motor recebe só `gastronomy`.

## Decisões abertas
- **A.** Ficar com `matchesPriority` como o mapeamento único (recomendo) em vez do `interestToTheme` do motor?
- **B.** Cidade digitada fora das 21 no assistente: nenhum chip (proposta) ou todos, como hoje?
- **C.** Aceitar Rio e Cartagena sem Praia até o catálogo crescer, ou baixar o mínimo só para Praia?
  (Recomendo manter 5 e ir completando o catálogo.)
- **D.** Clã: Gastronomia continua aparecendo por Michelin mesmo abaixo de 5? (Hoje todas as cidades
  passam de 15, então só importa para cidades novas.)
