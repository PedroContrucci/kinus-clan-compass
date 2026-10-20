import type { TripActivity } from '@/types/trip';
import type { RouteLeg } from '@/components/cockpit/DailyRouteMap';
import { itemCoord, logisticsLine } from '@/lib/itineraryEngine';
import { catalogIdOf } from '@/lib/localAchievements';
import { buildCloseLinks, type CloseLink } from '@/lib/offersLinks';
import { CURATED_BOOKING, type BookingMode } from '@/data/generated/booking';

// C.5b — regras da aba Roteiro em blocos: tipo do item, ações que se aplicam e o
// deslocamento entre itens (real > estimado). Puras; a UI fica em RoteiroDia.tsx.

export type RoteiroKind = 'logistica' | 'incluido' | 'restaurante' | 'passeio';
export type RoteiroAction = 'trocar' | 'confirmar';

const lower = (a: TripActivity) => (a.name || '').toLowerCase();

/** Mesmo critério de logística que o cartão antigo usava (voo, check-in/out do hotel, transfer). */
export function roteiroKind(a: TripActivity): RoteiroKind {
  const n = lower(a);
  if (
    a.isHeroItem ||
    a.category === 'voo' ||
    (a.category === 'hotel' && (n.includes('check-in') || n.includes('check-out'))) ||
    n.includes('check-in aeroporto') ||
    n.includes('transfer')
  ) return 'logistica';
  if (n.includes('café da manhã') || n.includes('room service') || a.category === 'hotel') return 'incluido';
  if (a.category === 'comida' || a.type === 'food') return 'restaurante';
  return 'passeio';
}

/** Só as ações que fazem sentido para o tipo — nunca os 3 botões fixos. */
export function roteiroActions(a: TripActivity): RoteiroAction[] {
  if (a.status === 'confirmed' || a.status === 'cancelled') return [];
  const kind = roteiroKind(a);
  if (kind === 'logistica') {
    const n = lower(a);
    // D2: o check-in representa a hospedagem; check-out e transfer não têm ação.
    const isFlight = a.category === 'voo';
    const isHotelCheckin = a.category === 'hotel' && n.includes('check-in') && !n.includes('aeroporto');
    return isFlight || isHotelCheckin ? ['confirmar'] : [];
  }
  if (kind === 'incluido') return [];
  // C.5d: reservar não é mais ação genérica — vem do catálogo, por item (roteiroBooking).
  return ['trocar'];
}

/** C.5d — como o item se fecha, dito pelo catálogo. `null` = o KINU não sabe: nenhuma ação, nenhum texto. */
export type RoteiroBooking =
  | { type: 'link'; label: 'Reservar com parceiro' | 'Reservar no site'; url: string }
  | { type: 'tel'; phone: string }
  | { type: 'text'; text: string };

export function roteiroBooking(a: TripActivity): RoteiroBooking | null {
  if (a.status === 'confirmed' || a.status === 'cancelled') return null;
  const kind = roteiroKind(a);
  if (kind === 'logistica' || kind === 'incluido') return null;
  const b = CURATED_BOOKING[catalogIdOf(a.id)];
  if (!b) return null;
  switch (b.mode) {
    case 'partner':
    case 'online':
      return b.url ? { type: 'link', label: b.mode === 'partner' ? 'Reservar com parceiro' : 'Reservar no site', url: b.url } : null;
    case 'phone':
      return b.phone ? { type: 'tel', phone: b.phone } : { type: 'text', text: 'Reserva por telefone · número a cadastrar' };
    case 'walk_in':
      // A note do catálogo já diz o "sem reserva" do lugar; nunca os dois textos.
      return { type: 'text', text: b.note || 'Sem reserva · ordem de chegada' };
    default:
      return null;
  }
}

/** C.8 — modo de fechar do catálogo (logística/incluído não têm). `null` = o KINU não sabe. */
export function bookingModeOf(a: TripActivity): BookingMode | null {
  const kind = roteiroKind(a);
  if (kind === 'logistica' || kind === 'incluido') return null;
  return CURATED_BOOKING[catalogIdOf(a.id)]?.mode ?? null;
}

/** C.8 — regra dentro/fora: só online/partner/phone se "fecham"; walk_in/included/null ficam fora. */
export function requiresBooking(a: TripActivity): boolean {
  const m = bookingModeOf(a);
  return m === 'online' || m === 'partner' || m === 'phone';
}

/** C.8 — Prontidão = (voo + hotel + itens que exigem reserva) confirmados / total desses. Checklist fora. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prontidao(trip: any): { done: number; total: number; pct: number } {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const items: TripActivity[] = days
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((d: any) => (Array.isArray(d?.activities) ? d.activities : []))
    .filter((a: TripActivity) => a.status !== 'cancelled' && requiresBooking(a));
  const total = 2 + items.length;
  const done = (trip?.flights?.outbound?.status === 'confirmed' ? 1 : 0)
    + (trip?.accommodation?.status === 'confirmed' ? 1 : 0)
    + items.filter((a) => a.status === 'confirmed').length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

/** C.8 — "Onde fechar ▸" do passeio pago em aberto: site oficial do catálogo primeiro, depois buscas. */
export function passeioCloseLinks(a: TripActivity, city: string, date?: Date, pax?: number): CloseLink[] {
  if (a.status === 'confirmed' || a.status === 'cancelled') return [];
  if (roteiroKind(a) !== 'passeio' || !(Number(a.cost) > 0)) return [];
  const b = CURATED_BOOKING[catalogIdOf(a.id)];
  return buildCloseLinks('passeio', { city, name: a.name, mode: b?.mode ?? null, bookingUrl: b?.url, start: date, pax });
}

export interface RoteiroLeg {
  text: string;
  minutes: number;
  source: 'osrm' | 'estimativa';
}

/** Deslocamento entre dois itens. Real > estimado: OSRM do mapa quando ele já calculou o trecho;
 *  senão `logisticsLine` do motor. Uma fonte só por trecho — nunca as duas. */
export function legBetween(
  prev: TripActivity,
  curr: TripActivity,
  liveLegs: RouteLeg[] | null | undefined,
  destination: string,
): RoteiroLeg | null {
  const live = liveLegs?.find((l) => l.fromName === prev.name && l.toName === curr.name);
  if (live) {
    // Mesma conta que o conector antigo fazia sobre o OSRM.
    const walk = live.durationMin <= 45;
    const minutes = walk ? live.durationMin : Math.max(8, Math.round(parseFloat(live.distanceKm) * 2.5));
    return { text: `~${minutes} min ${walk ? 'a pé' : 'de táxi'}`, minutes, source: 'osrm' };
  }
  const line = logisticsLine(itemCoord(prev, destination), itemCoord(curr, destination));
  if (!line) return null;
  const minutes = Number(line.match(/~(\d+)/)?.[1] ?? 0);
  return { text: line, minutes, source: 'estimativa' };
}
