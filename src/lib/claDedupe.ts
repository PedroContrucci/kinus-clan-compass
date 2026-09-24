// Dedupe da indicação ao clã — antes de inserir, o nome é comparado (normalizado pela
// mesma regra de identidade do gerador) contra o catálogo da cidade e contra as
// indicações pendentes. Pura: recebe o catálogo e as pendentes como argumento.
import { normalizePlaceName } from '@/lib/placeIdentity';

export type DuplicateMatch =
  | { kind: 'catalog'; name: string }
  | { kind: 'suggested'; name: string; suggestionId: string };

export function findDuplicate(
  name: string,
  catalog: { name: string }[],
  pending: { id: string; name: string; status: string }[]
): DuplicateMatch | null {
  const key = normalizePlaceName(name);
  if (!key) return null;
  const inCatalog = catalog.find((a) => normalizePlaceName(a.name) === key);
  if (inCatalog) return { kind: 'catalog', name: inCatalog.name };
  const sug = pending.find((s) => s.status === 'pending' && normalizePlaceName(s.name) === key);
  if (sug) return { kind: 'suggested', name: sug.name, suggestionId: sug.id };
  return null;
}
