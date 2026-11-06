// aviasalesLink — link de busca viva da Aviasales com o marker de afiliado do KINU (M10-0) e o
// formato "visto em" do preço de referência.
// Formato do deep link (por CONVENÇÃO — a doc da Travelpayouts devolveu 403 na conferência):
//   https://www.aviasales.com/search/{ORIG}{DDMM}{DEST}{DDMM}{adultos}{crianças}{bebês}?marker=…
// Pax: um dígito por categoria, sem zeros à direita (3 adultos + 1 criança = "31"; 2 adultos = "2").
import { TRAVELPAYOUTS_MARKER } from '@/lib/offersLinks';
import { airfarePaxOf } from '@/lib/pax';

const ddmm = (iso: unknown): string | null => {
  const m = String(iso ?? '').match(/^\d{4}-(\d{2})-(\d{2})/);
  return m ? `${m[2]}${m[1]}` : null;
};

/** "31", "2", "201": adultos+crianças+bebês, sem zeros à direita. */
export function aviasalesPaxCode(pax: { adults: number; children: number; infants: number }): string {
  return `${pax.adults}${pax.children}${pax.infants}`.replace(/0+$/, '');
}

interface LinkInput {
  origin: string;
  destination: string;
  /** yyyy-MM-dd (ou ISO). */
  startDate: string;
  /** Sem volta (só ida) → link sem a perna de volta. */
  endDate?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip?: any;
}

export function buildAviasalesSearchLink({ origin, destination, startDate, endDate, trip }: LinkInput): string | null {
  const o = String(origin || '').toUpperCase();
  const d = String(destination || '').toUpperCase();
  const out = ddmm(startDate);
  if (!o || !d || !out) return null;
  const back = ddmm(endDate);
  const code = aviasalesPaxCode(airfarePaxOf(trip ?? {}));
  const path = `${o}${out}${back ? `${d}${back}` : d}${code}`;
  return `https://www.aviasales.com/search/${path}?marker=${TRAVELPAYOUTS_MARKER}`;
}

function parts(iso: unknown) {
  if (typeof iso !== 'string' || !iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return { dm: `${p(d.getDate())}/${p(d.getMonth() + 1)}`, hm: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

/** "visto em DD/MM às HH:MM" (fuso do navegador); ilegível → null. */
export function formatFoundAt(iso: unknown): string | null {
  const x = parts(iso);
  return x ? `visto em ${x.dm} às ${x.hm}` : null;
}

/** "consultado em DD/MM às HH:MM" (fuso do navegador); ilegível → null. */
export function formatConsultedAt(iso: unknown): string | null {
  const x = parts(iso);
  return x ? `consultado em ${x.dm} às ${x.hm}` : null;
}

/**
 * Carimbo honesto do preço de referência: found_at ("visto em") quando a fonte informa;
 * senão a hora da consulta (searchedAt) — "consultado em". Nenhum → null.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tripReferenceStamp(trip: any): { kind: 'seen' | 'consulted'; text: string; dm: string } | null {
  const seenIso = tripFoundAt(trip);
  if (seenIso) return { kind: 'seen', text: formatFoundAt(seenIso)!, dm: formatFoundAtDate(seenIso)! };
  const q = trip?.kinuFlightSearch?.searchedAt;
  const text = formatConsultedAt(q);
  return text ? { kind: 'consulted', text, dm: formatFoundAtDate(q)! } : null;
}

/** "DD/MM" (fuso do navegador); ilegível → null. */
export function formatFoundAtDate(iso: unknown): string | null {
  return parts(iso)?.dm ?? null;
}

/** Visto mais antigo entre as pernas (o mais conservador); nenhuma → null. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tripFoundAt(trip: any): string | null {
  const c = [trip?.outboundFlight?.foundAt, trip?.returnFlight?.foundAt]
    .filter((v): v is string => typeof v === 'string' && !Number.isNaN(new Date(v).getTime()));
  if (!c.length) return null;
  return c.reduce((a, b) => (new Date(a) <= new Date(b) ? a : b));
}
