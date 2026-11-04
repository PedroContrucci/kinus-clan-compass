import { CATALOG_VERIFIED_AT } from '@/data/generated/catalogVerified';
import { resolveCity } from '@/lib/localAchievements';

const STALE_DAYS = 60;
const DAY_MS = 86_400_000;

/**
 * "Lugares verificados no Google em dd/mm/aaaa" para a cidade do app, ou `null` se o catálogo
 * não tem data para ela. Passados mais de 60 dias, acrescenta " · reconferência em breve".
 */
export function catalogVerifiedLabel(city: unknown, today: Date = new Date()): string | null {
  const canonical = resolveCity(city);
  const iso = canonical ? CATALOG_VERIFIED_AT[canonical] : undefined;
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const at = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const label = `Lugares verificados no Google em ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  return (now - at) / DAY_MS > STALE_DAYS ? `${label} · reconferência em breve` : label;
}
