# STEP1-ENGINE — um motor de roteiro, zero mudança de comportamento

## Achados que mudam o plano
1. **Não há sorteio no gerador.** `generateItinerary` (GIS:249–998) não chama `Math.random`
   (o único está em `convertTripDaysToItinerary`:157, fora do escopo). A ordem vem de sort
   determinístico + `placeIdentity`. O `rng` entra como parâmetro com default `Math.random`,
   mas hoje ninguém o consome — o snapshot já é estável sem semente. Fica pronto para o próximo passo.
2. **O gerador não recebe hotel.** Ele chama `getHotelRecommendation` (hotelZones) por dentro
   (:471/534/591) para o nome do check-in; o hotel curado só entra no `computeBuckets` via
   `hotelPlannedOverride`. Proposta: input `hotel?: { name; nightlyTotal? }` opcional —
   ausente = comportamento atual (zona); `computeBuckets(days, breakdown, hotelPlannedOverride)`.
3. **`budget` é input real** (`findBestPriceLevel` quando não há tier; `percent` do breakdown).
   Fica na assinatura, ao lado de `priceLevel`.
4. **`computeBuckets` é closure** sobre `breakdown` e `hotelPlannedOverride` — vira função pura
   com esses dois como argumentos; os 4 call sites do stage (1115/1120/1218/1223) passam os mesmos.
5. **Ids sintéticos de hoje** (`day-N-free-morning`, `-checkin`, `-flight-out`, `-flight-return`,
   `-dinner-michelin`, `-breakfast-hotel`, `-ambient-walk`, `-walk`, `-rest`, `-transit`,
   `-checkout`, `-transfer`). Leitores por texto: só comentários (localAchievements:44,
   DailyRouteMap:34) e fixtures (routeCoords.test:70, achievementsLocal.test:211) — nenhum
   código casa esses sufixos. Viagens salvas mantêm os ids antigos.
6. Recuperação hoje: `isRecoveryDay = MODERADO||ALTO||SEVERO` (:520), BAIXO = sem recuperação.

## Diff proposto
**Novo `src/lib/itineraryEngine.ts`** (sem React/hooks/components):
- move tipos `ItineraryActivity`, `ItineraryDay`, `BudgetBreakdown` (GIS reexporta p/ não quebrar imports);
- move `convertToItineraryActivity`, `generateItinerary` (corpo idêntico) e `computeBuckets` pura;
- `export function runItineraryEngine(input: EngineInput): { days; breakdown; meta; buckets }`
  com `EngineInput = { departureDate, returnDate, destination, origin, travelers, interests,
  budget, priceLevel?, jetLagSeverity?, outboundFlight, returnFlight, hotel?, rng? }`;
- `RECOVERY_BY_SEVERITY: Record<Severity, boolean> = { BAIXO:false, MODERADO:true, ALTO:true, SEVERO:true }`;
- helper `assignDayIds(days)`: mapeia ids sintéticos → `day-N-slot-<slug>`
  (`checkin`, `breakfast`, `flight-out`, `flight-back`, `free-morning`/`free-afternoon`,
  `walk`, `ambient-walk`, `rest`, `transit`, `checkout`, `transfer`); Michelin →
  `day-N-michelin-<slug do nome>`; catálogo segue `day-N-<catalogId>`; colisão no dia →
  `day-N-slot-dup-<k>` + `console.warn`. Aplicado nos ids gerados direto na fonte (não pós-processo).
- `SelectedFlight` importado como **tipo** de `FlightSelectionStage` (import type, apagado no build)
  — ou movido para o engine e reexportado lá. Recomendo mover (motor não importa de components).

**`GeneratedItineraryStage.tsx`**: `useMemo` chama `runItineraryEngine`; `computeBuckets`
local vira wrapper de 1 linha. Render, handlers, `addActivity` (:1284), custom (:1739) intocados.

**Teste `src/test/itineraryEngine.test.ts`** + fixture `src/test/__snapshots__/` :
- snapshot capturado **antes** da extração, pelo `generateItinerary` atual exportado do GIS,
  para Cartagena, Lisboa, Tóquio (SEVERO), Fortaleza — 7 noites, comfort, [gastronomia, cultura],
  voos estimados fixos, datas fixas;
- depois: saída do motor == snapshot com o mapa de renomeação de ids aplicado; buckets iguais;
- unitários: RECOVERY_BY_SEVERITY, colisão → dup + warn, Michelin slug, rng injetado aceito.
- fixtures atualizadas só no comentário/ids de exemplo (routeCoords, achievementsLocal) se quebrarem.

## Arquivos
Novos: `src/lib/itineraryEngine.ts`, `src/test/itineraryEngine.test.ts`, snapshot JSON.
Editados: `src/components/cockpit/GeneratedItineraryStage.tsx`, `FlightSelectionStage.tsx`
(só se `SelectedFlight` mudar de casa, com reexport).
Fora: createTrip.ts, handleActivate, generateBasicDays, intocáveis.

## Decisões abertas
A. `SelectedFlight`: mover para o engine com reexport (recomendado) ou `import type` do component?
B. Hotel input: aceitar `hotel?` opcional (só nome/custo) agora, ou deixar só `hotelPlannedOverride`?
C. `rng` sem consumidor hoje — ok entrar como parâmetro dormente?
D. Slugs: `flight-back` (pedido) substitui `flight-return`; `breakfast-hotel` → `slot-breakfast`. Confirmar.
