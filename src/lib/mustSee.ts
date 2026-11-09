// M19g — essencial "classe Louvre" do catálogo (coluna `must_see` no kinu-beta, via sync).
import { CURATED_MUST_SEE } from '@/data/generated/mustSee';

const MUST_SEE = new Set(CURATED_MUST_SEE);

/** O id do catálogo é must_see (marcado à mão no kinu-beta). Dado, nunca inferência. */
export function isMustSee(catalogId: string): boolean {
  return MUST_SEE.has(catalogId);
}
