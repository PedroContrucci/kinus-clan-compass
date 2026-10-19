// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// B.3.1 (R18) — em que dias da semana o item existe, da coluna `days_of_week` de
// `curated_activities` no kinu-beta (0=dom…6=sáb). Id ausente = qualquer dia. Dado do catálogo,
// nunca inferência. Mesma ponte de `booking.ts` (`SuggestedActivity` é intocável).
// Consumidores: `pickActivity`/`swapCandidates` (motor) e `validateDaysOfWeek` (R18).

/** Chaveado pelo id do catálogo (`for-caranguejada-iate`). */
export const CURATED_DAYS_OF_WEEK: Record<string, number[]> = {
  'for-caranguejada-iate': [4],
};
