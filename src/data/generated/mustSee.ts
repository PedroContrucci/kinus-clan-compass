// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// M19g — essenciais "classe Louvre": a coluna `must_see` de `curated_activities` no kinu-beta,
// marcada à mão. Dado do catálogo, nunca inferência. Mesma ponte de `daysOfWeek.ts`.
// Consumidores: `pickActivity`/`tierPlanFor` (motor) e `validateMustSee` (R17 OBRIGATÓRIO), via `isMustSee`.

/** Ids do catálogo (`paris-louvre`). */
export const CURATED_MUST_SEE: readonly string[] = [
  'bcn-casa-batllo',
  'bcn-park-guell',
  'bue-plaza-mayo',
  'bue-teatro-colon',
  'ctg-castillo',
  'igu-parque-das-aves',
  'ist-cisterna',
  'ist-mesquita-azul',
  'lis-castelo-sao-jorge',
  'lis-jeronimos',
  'lon-london-eye',
  'lon6-tower',
  'mad-prado',
  'mad-retiro',
  'nyc-central-park',
  'nyc-met',
  'paris-louvre',
  'paris-orsay',
  'rio-museu-amanha',
  'rome-pantheon-centro',
  'rome-vaticano',
  'tokyo-meiji-shrine',
  'tokyo-senso-ji',
];
