// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// M19g — essenciais "classe Louvre": a coluna `must_see` de `curated_activities` no kinu-beta,
// marcada à mão. Dado do catálogo, nunca inferência. Mesma ponte de `daysOfWeek.ts`.
// Consumidores: `pickActivity`/`tierPlanFor` (motor) e `validateMustSee` (R17 OBRIGATÓRIO), via `isMustSee`.

/** Ids do catálogo (`paris-louvre`). */
export const CURATED_MUST_SEE: readonly string[] = [
  'paris-louvre',
  'paris-orsay',
];
