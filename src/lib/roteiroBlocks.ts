import type { TripActivity } from '@/types/trip';
import type { RouteLeg } from '@/components/cockpit/DailyRouteMap';
import { itemCoord, logisticsLine } from '@/lib/itineraryEngine';

// C.5b — regras da aba Roteiro em blocos: tipo do item, ações que se aplicam e o
// deslocamento entre itens (real > estimado). Puras; a UI fica em RoteiroDia.tsx.

export type RoteiroKind = 'logistica' | 'incluido' | 'restaurante' | 'passeio';
export type RoteiroAction = 'reservar' | 'trocar' | 'confirmar';

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
  // Restaurante: não há link de parceiro por restaurante (OffersModal é genérico de atividade).
  if (kind === 'restaurante') return ['trocar'];
  return a.cost > 0 ? ['reservar', 'trocar'] : ['trocar'];
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
