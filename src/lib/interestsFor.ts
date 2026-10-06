// interestsFor — um interesse só é oferecido numa cidade se o catálogo curado tem ≥5 itens dele lá.
// Mapeamento único: matchesPriority (o mesmo dos chips do Clã). Só LÊ src/data.
import { destinationActivities, getDestinationActivities, getDestinationThemes, type SuggestedActivity } from '@/data/destinationActivities';
import { PRIORITY_CHIPS, matchesPriority } from '@/lib/claChips';

export const MIN_INTEREST_ITEMS = 5;
export type InterestChip = (typeof PRIORITY_CHIPS)[number];

// Sentinela: getDestinationThemes devolve o mesmo array genérico para qualquer cidade sem tema curado.
const GENERIC = getDestinationThemes('xqzkinusemcatalogoxqz');

/** Atividades curadas da cidade; [] quando a cidade não tem catálogo nenhum. */
export function catalogFor(city: string): SuggestedActivity[] {
  const c = (city ?? '').trim();
  if (!c) return [];
  if (destinationActivities[c]) return destinationActivities[c].activities;
  if (getDestinationThemes(c) === GENERIC) return [];
  return getDestinationActivities(c);
}

export function hasCatalog(city: string): boolean {
  return catalogFor(city).length > 0;
}

export function interestCountsFrom(acts: SuggestedActivity[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const chip of PRIORITY_CHIPS) out[chip.id] = acts.filter((a) => matchesPriority(a, chip.id)).length;
  return out;
}

export function interestCounts(city: string): Record<string, number> {
  return interestCountsFrom(catalogFor(city));
}

/** Chips oferecidos a partir de uma lista de atividades (o Clã já tem a lista em mãos). */
export function interestsFromActivities(acts: SuggestedActivity[]): InterestChip[] {
  const counts = interestCountsFrom(acts);
  return PRIORITY_CHIPS.filter((c) => counts[c.id] >= MIN_INTEREST_ITEMS);
}

export function interestsFor(city: string): InterestChip[] {
  return interestsFromActivities(catalogFor(city));
}

/** Separa os interesses salvos entre os que a cidade oferece e os ignorados. */
export function splitInterests(city: string, stored: unknown): { used: string[]; ignored: string[] } {
  const list = Array.isArray(stored) ? stored.map(String) : [];
  const offered = new Set(interestsFor(city).map((c) => c.id));
  return { used: list.filter((i) => offered.has(i)), ignored: list.filter((i) => !offered.has(i)) };
}

export function interestLabel(id: string): string {
  return PRIORITY_CHIPS.find((c) => c.id === id)?.label.replace(/^\S+\s/, '') ?? id;
}
