// Foto real do lugar (Google Places) servida pela function place-photo, por id do catálogo.
import { catalogIdOf } from '@/lib/localAchievements';

export type PlacePhotoWidth = 320 | 640 | 960 | 1280;

const BASE = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/place-photo`;

/** URL da foto do lugar; `null` quando não há id de catálogo. Tira o prefixo `day-N-`. */
export function placePhotoUrl(catalogId: unknown, w: PlacePhotoWidth = 640): string | null {
  const id = catalogIdOf(catalogId);
  if (!id) return null;
  return `${BASE}?id=${encodeURIComponent(id)}&w=${w}`;
}

const missing = new Set<string>();
export const markPlacePhotoMissing = (id: string) => { missing.add(catalogIdOf(id)); };
export const isPlacePhotoMissing = (id: unknown) => missing.has(catalogIdOf(id));

const attribution = new Map<string, Promise<string | null>>();

/** Crédito exigido pelo Google (header x-kinu-attribution). Só nos drawers. Nunca lança. */
export function fetchPlacePhotoAttribution(catalogId: unknown): Promise<string | null> {
  const url = placePhotoUrl(catalogId, 640);
  if (!url) return Promise.resolve(null);
  const cached = attribution.get(url);
  if (cached) return cached;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) return null;
      const raw = r.headers.get('x-kinu-attribution');
      if (!raw) return null;
      try { return decodeURIComponent(raw).trim() || null; } catch { return raw; }
    })
    .catch(() => null);
  attribution.set(url, p);
  return p;
}
