# STEP1 — R13–R16 no validador + matriz 21×3 no /smoke

## Achados que mudam o plano
1. **O /smoke hoje não usa o rascunho.** Ele chama `generateItinerary` com voos montados à mão (`buildFlight`, preço fixo 1200). A missão pede "SP, voos estimados": proposta é rodar a matriz nova via `buildDraftTrip` (mesmo caminho do "Montar minha viagem": estimativa por rota/tier, hotel curado, `interestsFor` já aplicado). Os TESTS atuais (R1–R10) ficam como estão.
2. **Item de catálogo é reconhecido pelo id**, não pelo nome: `catalogIdOf(id)` + lookup em `getDestinationActivities(city)`. Exclui `day-N-slot-*`, `day-N-michelin-*`, `__free__-*`. Daí saem `styleTags`, `category` e `durationHours` (o item do roteiro só tem `duration: "Nh"` em texto).
3. **R14 conta `day-N-michelin-*`** (namespace do motor). Cidade "tem Michelin" = `getMichelinCountForCity(city) > 0` (só leitura de michelinData). Restaurante Michelin que exista também no catálogo entra como `day-N-<id>` e não conta — reportado no detalhe, não corrigido (motor intocado).
4. **Coordenadas:** `curatedCoordOf(id)` de `routeCoords.ts` (já casa por id). Cobertura do coords.ts é parcial → muitos "sem coords"; o relatório mostra `n/total com coords`.
5. **Doméstico vs internacional (R16):** não existe flag no voo. Proposta: doméstico quando o destino está no Brasil (`destinationCatalog` país === 'Brasil'). Origem é sempre SP na matriz.
6. **Chegada no dia 1:** `trip.outboundFlight` (estimate) → `calculateArrivalTime` (regra da casa: nunca assumida). Se a chegada cair no dia 2 (voo longo), a janela do dia 1 é 0 h e o dia com a chegada usa chegada→22:00.
7. Interesses: ids dos chips (`gastronomy`, `culture`, `beach`, `family`, `adventure`). Perfis com interesse que a cidade não oferece (ex. Gramado sem `beach`) usam só os oferecidos, como o produto; R13 é SKIP se sobrar zero.

## Regras (todas WARN ou PASS; nunca FAIL; SKIP quando não se aplica)
- **R13 PRIORIDADE** — dias de exploração (não 1º, não último, não recuperação), slots morning/afternoon/night, só itens de catálogo, fora refeições. Ratio = itens com `matchesPriority(item, i)` para algum interesse / total. PASS ≥ 0,5. Detalhe: `7/11 (64%)`.
- **R14 MICHELIN** — aplica se `gastronomy` ∈ interesses usados e cidade tem Michelin. PASS ≥ 1. Detalhe: `count=N`.
- **R15 GEO** — por dia, pares consecutivos de catálogo (ordem por `time`), pulando itens com `durationHours ≥ 5` e slots flight/hotel. Haversine. PASS se todo salto ≤ 8 km. Detalhe: `pior 12,4 km dia 3: A → B · sem coords 5/18`.
- **R16 TEMPO** — por dia: Σ durationHours (itens com duração; slots usam o `duration` do item quando houver) + 0,5 h × saltos ≤ janela. Janelas: exploração 08–22 (14 h); dia 1 chegada→22; último 08→(partida − 3 h intl / − 2 h dom). Detalhe: pior dia `dia 7: 9,5/6,0 h`.

## Diff proposto
- `src/lib/itineraryValidator.ts` — **adição**: `validatePlanRules(days, ctx)` com R13–R16, `ctx = { destination, interests, arrivalTime, returnDepartureTime, domestic }`. Helpers puros: `haversineKm`, `catalogItemOf`, `dayWindowHours`. `validateItinerary` (R1–R10) intocado.
- `src/lib/smokeMatrix.ts` (novo, puro) — `SMOKE_PROFILES` (3 perfis: gastronomy+culture/comfort, beach+family/budget(Econômico), culture+adventure/luxury), `runSmokeMatrix()` → 63 linhas `{city, profile, results[]}` via `buildDraftTrip` (GRU, 7 noites, partida = hoje+30d fixo por execução); `summarize()` → pass rate por regra (SKIP fora do denominador).
- `src/pages/SmokeTest.tsx` — nova seção "R13–R16 · 21 cidades × 3 perfis": tabela cidade × perfil com 4 badges + detalhe, e linha de resumo `R13 x/63 · R14 x/n · R15 x/63 · R16 x/63`.
- `src/test/planRules.test.ts` (novo) — roda as 63 combinações; para cada uma afirma 4 resultados com `rule` ∈ {R13..R16}, `status` ∈ {PASS, WARN, SKIP} e `detail` string. Unitários: haversine (conhecido), janela do último dia intl vs dom, R13 SKIP sem interesses, R15 ignora day trip e "sem coords" não é violação.

## Não tocado
Motor (`itineraryEngine.ts`), gerador, `src/data/*`, `hotelZones.ts`, `michelinData.ts` (só leitura), `types/trip.ts`.

## Decisões abertas
- **A.** Matriz via `buildDraftTrip` (recomendo, é o caminho real) ou via `generateItinerary` com voos à mão como o /smoke atual?
- **B.** Adicionar status `SKIP` ao `ValidationResult` (recomendo) ou reportar não-aplicável como PASS com detalhe "n/a"?
- **C.** Doméstico = destino no Brasil — ok?
- **D.** 63 drafts no teste: se passar de ~10 s, rodar 1 perfil × 21 no vitest padrão e as 63 atrás de `describe.skipIf(!process.env.SMOKE_FULL)`? (Missão pede 63 — só aciono se ficar lento.)
