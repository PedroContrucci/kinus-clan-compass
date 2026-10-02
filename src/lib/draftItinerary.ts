// draftItinerary — o rascunho É o roteiro. Puro (sem React).
// buildItineraryForTrip roda o motor único (itineraryEngine) com os voos e o hotel da viagem e
// devolve os dias já no formato de trip.days (com `timeSlot`/`kind` do motor gravados) + as
// finanças dos 4 baldes do motor. Quem usa: buildDraftTrip, "Regerar roteiro", troca de voo.
import { addDays } from 'date-fns';
import type { PriceLevel } from '@/lib/activityPricing';
import type { TripDay, TripFinances } from '@/types/trip';
import {
  runItineraryEngine,
  type FinanceBuckets,
  type ItineraryActivity,
  type ItineraryDay,
  type JetLagSeverity,
  type SelectedFlight,
} from '@/lib/itineraryEngine';
import { followPlanEnvelope } from '@/lib/planTotals';

/** Item de trip.days com os campos do motor gravados por fora do tipo. */
export type EngineTripActivity = TripDay['activities'][number] & {
  timeSlot?: ItineraryActivity['timeSlot'];
  kind?: ItineraryActivity['type'];
};

const TIER_TO_PRICE: Record<string, PriceLevel> = {
  backpacker: 'budget', economic: 'budget', budget: 'budget',
  comfort: 'midrange', midrange: 'midrange', luxury: 'luxury',
};

export interface DraftLike {
  destination: string;
  origin?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  travelers?: number;
  travelInterests?: string[];
  jetLagSeverity?: JetLagSeverity | string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accommodation?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finances?: any;
  priceLevel?: unknown;
  budgetType?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** ItineraryDay[] do motor → trip.days. Cópia 1:1, com timeSlot/kind preservados. */
export function itineraryToTripDays(source: ItineraryDay[]): TripDay[] {
  const mapCat = (a: ItineraryActivity): string => {
    const t = a.type;
    if (t === 'flight') return 'voo';
    if (t === 'hotel' || t === 'checkin') return 'hotel';
    if (t === 'transport' || t === 'checkout') return 'transporte';
    if (t === 'breakfast' || t === 'lunch' || t === 'dinner') return 'comida';
    const slot = a.timeSlot;
    if (slot === 'flight') return 'voo';
    if (slot === 'hotel') return 'hotel';
    if (slot === 'breakfast' || slot === 'lunch' || slot === 'dinner') return 'comida';
    return 'passeio';
  };
  return source.map((d) => ({
    day: d.dayNumber,
    date: d.date instanceof Date ? d.date.toISOString() : (d.date as unknown as string),
    title: d.label,
    icon: (d.theme || '').split(' ')[0] || '',
    activities: d.activities.map((a) => {
      const cat = mapCat(a);
      const item: EngineTripActivity = {
        id: a.id,
        time: a.time || '',
        name: a.name,
        description: (a.tips && a.tips[0]) || '',
        duration: a.duration || '',
        cost: Math.round(a.estimatedCost || 0),
        type: cat,
        category: cat as EngineTripActivity['category'],
        status: a.status === 'pending' ? 'cancelled' : 'planned',
        timeSlot: a.timeSlot,
        kind: a.type,
      };
      return item;
    }),
  }));
}

/**
 * trip.days → ItineraryDay[] para a tela. Itens com `timeSlot` (gravados pelo motor) são cópia
 * direta; dias antigos sem `timeSlot` passam pela inferência por hora/categoria (sem sorteio).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tripDaysToItinerary(existingDays: any[], departureDate: Date, travelers: number): ItineraryDay[] {
  const inferTimeSlot = (time: string | undefined, category?: string, type?: string): ItineraryActivity['timeSlot'] => {
    const cat = (category || '').toLowerCase();
    const t = (type || '').toLowerCase();
    if (cat === 'voo' || t.includes('voo') || t.includes('flight')) return 'flight';
    if (cat === 'hotel' || t.includes('hotel') || t.includes('check')) return 'hotel';
    const h = parseInt((time || '12:00').split(':')[0], 10) || 12;
    if (cat === 'comida') {
      if (h < 10) return 'breakfast';
      if (h < 15) return 'lunch';
      return 'dinner';
    }
    if (h < 11) return 'morning';
    if (h < 14) return 'lunch';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'dinner';
    return 'night';
  };
  const mapType = (category?: string, timeSlot?: ItineraryActivity['timeSlot']): ItineraryActivity['type'] => {
    const c = (category || '').toLowerCase();
    if (c === 'voo') return 'flight';
    if (c === 'hotel') return 'hotel';
    if (c === 'comida') return (timeSlot as ItineraryActivity['type']) || 'lunch';
    if (c === 'transporte') return 'transport';
    return 'experience';
  };
  const mapStatus = (s: string): ItineraryActivity['status'] => {
    if (s === 'confirmed') return 'defined';
    if (s === 'cancelled') return 'pending';
    return 'suggestion';
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return existingDays.map((d: any, idx: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities: ItineraryActivity[] = (d.activities || []).map((a: any, j: number) => {
      const timeSlot: ItineraryActivity['timeSlot'] = a.timeSlot || inferTimeSlot(a.time, a.category, a.type);
      const cost = Number(a.cost) || 0;
      return {
        id: a.id || `day-${d.day ?? idx + 1}-slot-legacy-${j}`,
        name: a.name || 'Atividade',
        type: a.kind || mapType(a.category, timeSlot),
        timeSlot,
        estimatedCost: cost,
        costPerPerson: travelers > 0 ? cost / travelers : cost,
        time: a.time,
        duration: a.duration,
        location: a.location,
        status: mapStatus(a.status),
        tips: a.description ? [a.description] : undefined,
        source: 'kinu',
      } as ItineraryActivity;
    });
    const parsedDate = d.date ? new Date(d.date) : addDays(departureDate, idx);
    return {
      dayNumber: d.day ?? idx + 1,
      date: isNaN(parsedDate.getTime()) ? addDays(departureDate, idx) : parsedDate,
      label: d.title || `Dia ${idx + 1}`,
      theme: [d.icon, d.title].filter(Boolean).join(' ').trim(),
      activities,
      totalCost: activities.reduce((s, a) => s + (a.estimatedCost || 0), 0),
    };
  });
}

/** Ids de todos os itens de um conjunto de dias (trip.days ou ItineraryDay[]). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function itemIdsOf(days: any[] | undefined | null): string[] {
  if (!Array.isArray(days)) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return days.flatMap((d: any) => (Array.isArray(d?.activities) ? d.activities.map((a: any) => String(a?.id ?? '')) : []));
}

/**
 * Trocas manuais desde a última geração: itens que saíram + itens que entraram, com troca
 * (um sai, outro entra) contando como 1. Sem `engineItemIds` gravado → 0.
 */
export function countManualEdits(engineItemIds: unknown, currentIds: string[]): number {
  if (!Array.isArray(engineItemIds)) return 0;
  const engine = new Set(engineItemIds.map(String));
  const current = new Set(currentIds);
  let removed = 0;
  let added = 0;
  engine.forEach((id) => { if (!current.has(id)) removed++; });
  current.forEach((id) => { if (!engine.has(id)) added++; });
  return Math.max(removed, added);
}

export function priceLevelFor(trip: DraftLike): PriceLevel | undefined {
  if (typeof trip.priceLevel === 'string' && ['budget', 'midrange', 'luxury'].includes(trip.priceLevel)) {
    return trip.priceLevel as PriceLevel;
  }
  return typeof trip.budgetType === 'string' ? TIER_TO_PRICE[trip.budgetType] : undefined;
}

/** Baldes do motor → TripFinances (transport/shopping planejados 0; confirmado/lance preservados). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function financesFromBuckets(buckets: FinanceBuckets, budget: number, prev?: any): TripFinances {
  const prevCats = prev?.categories || {};
  const cat = (name: string, planned: number) => ({
    planned,
    confirmed: prevCats[name]?.confirmed || 0,
    bidding: prevCats[name]?.bidding || 0,
  });
  const confirmed = prev?.confirmed || 0;
  const bidding = prev?.bidding || 0;
  const total = budget || buckets.totalPlanned;
  return {
    total,
    confirmed,
    bidding,
    planned: buckets.totalPlanned,
    available: Math.max(0, total - buckets.totalPlanned - confirmed - bidding),
    categories: {
      flights: cat('flights', buckets.flightsPlanned),
      accommodation: cat('accommodation', buckets.hotelPlanned),
      tours: cat('tours', buckets.toursPlanned),
      food: cat('food', buckets.foodPlanned),
      transport: cat('transport', 0),
      shopping: cat('shopping', 0),
    },
  } as TripFinances;
}

export interface DraftItineraryResult {
  days: TripDay[];
  finances: TripFinances;
  budget: number;
  buckets: FinanceBuckets;
  engineItemIds: string[];
  michelinCount: number;
}

/** Motor + baldes + envelope para uma viagem com os voos dados. */
export function buildItineraryForTrip(
  trip: DraftLike,
  flights: { outbound: SelectedFlight; return: SelectedFlight },
  opts: { priceLevel?: PriceLevel } = {},
): DraftItineraryResult {
  const departureDate = new Date(trip.startDate);
  const returnDate = new Date(trip.endDate);
  const acc = trip.accommodation;
  const hotelPlannedOverride = acc?.curatedHotelId
    ? Math.round(Number(acc.totalPrice) || 0) || undefined
    : undefined;
  const sev = trip.jetLagSeverity;
  const jetLagSeverity = sev === 'BAIXO' || sev === 'MODERADO' || sev === 'ALTO' || sev === 'SEVERO' ? sev : undefined;

  const r = runItineraryEngine({
    departureDate,
    returnDate,
    destination: trip.destination,
    origin: trip.origin || 'São Paulo',
    outboundFlight: flights.outbound,
    returnFlight: flights.return,
    budget: Number(trip.budget) || 1,
    travelers: Math.max(1, Number(trip.travelers) || 1),
    interests: trip.travelInterests || [],
    jetLagSeverity,
    priceLevel: opts.priceLevel ?? priceLevelFor(trip),
    hotel: acc?.name ? { label: String(acc.name) } : undefined,
    hotelPlannedOverride,
  });

  const days = itineraryToTripDays(r.days);
  const finances = financesFromBuckets(r.buckets, Number(trip.budget) || 0, trip.finances);
  const followed = followPlanEnvelope({ ...trip, finances });
  return {
    days,
    finances: followed.finances,
    budget: Number(followed.budget) || finances.total,
    buckets: r.buckets,
    engineItemIds: itemIdsOf(days),
    michelinCount: r.meta.michelinCount,
  };
}
