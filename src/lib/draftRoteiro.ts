// draftRoteiro — edições do roteiro do rascunho (C.5e). Puro (sem React).
// É a lógica de handleRemoveActivity / handlePickSwap / recomputeAndPersistFinances do
// GeneratedItineraryStage, levada sem mudança de comportamento: trip.days → ItineraryDay[]
// (tripDaysToItinerary) → edição → trip.days (itineraryToTripDays), como o commitDays já fazia.
import { format } from 'date-fns';
import type { TripFinances } from '@/types/trip';
import {
  computeBuckets,
  convertToItineraryActivity,
  swapCandidates,
  type BudgetBreakdown,
  type ItineraryDay,
  type SwapCandidate,
} from '@/lib/itineraryEngine';
import { itineraryToTripDays, tripDaysToItinerary } from '@/lib/draftItinerary';
import { followPlanEnvelope } from '@/lib/planTotals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DraftLike = Record<string, any>;

const travelersOf = (trip: DraftLike): number => trip.travelers || 1;

function itineraryOf(trip: DraftLike): ItineraryDay[] {
  const days = Array.isArray(trip.days) ? trip.days : [];
  return tripDaysToItinerary(days, new Date(trip.startDate), travelersOf(trip));
}

/** Mesmo recorte do `swapTrip()` do stage. */
function swapTripOf(trip: DraftLike, days: ItineraryDay[]) {
  return {
    destination: trip.destination,
    outboundFlight: trip.outboundFlight,
    returnFlight: trip.returnFlight,
    travelInterests: trip.travelInterests ?? [],
    days: days.map((d) => ({
      day: d.dayNumber,
      date: d.date instanceof Date && !Number.isNaN(d.date.getTime()) ? format(d.date, 'yyyy-MM-dd') : undefined,
      activities: d.activities,
    })),
  };
}

/** ↻: alternativas do catálogo que cabem no slot. Nada é sorteado. */
export function draftSwapCandidates(trip: DraftLike, dayNumber: number, activityId: string): SwapCandidate[] {
  const days = itineraryOf(trip);
  const dayIndex = days.findIndex((d) => d.dayNumber === dayNumber);
  if (dayIndex < 0) return [];
  return swapCandidates(swapTripOf(trip, days), dayIndex, activityId);
}

/**
 * Baldes recalculados sobre os dias atuais (a mesma conta do stage): voo e hotel planejados
 * vêm de trip.finances; o hotel curado (`accommodation.totalPrice`) manda sobre o balde.
 */
export function recomputeDraftFinances<T extends DraftLike>(trip: T): T {
  const days = itineraryOf(trip);
  const prevFinances: Partial<TripFinances> = trip.finances || {};
  const prevCats: Partial<TripFinances['categories']> = prevFinances.categories || {};
  const est = (amount: number) => ({ amount, percent: 0, status: 'estimated' as const });
  const breakdown: BudgetBreakdown = {
    flights: { amount: Math.round(prevCats.flights?.planned || 0), percent: 0, status: 'defined' },
    hotel: est(Math.round(prevCats.accommodation?.planned || 0)),
    experiences: est(0), food: est(0), total: 0, available: 0, trustZonePercent: 0,
  };
  const hotelOverride = Math.round(Number(trip.accommodation?.totalPrice) || 0) || undefined;
  const { flightsPlanned, hotelPlanned, foodPlanned, toursPlanned, totalPlanned } = computeBuckets(days, breakdown, hotelOverride);
  const cat = (name: string) => ({
    planned: 0,
    confirmed: prevCats[name]?.confirmed || 0,
    bidding: prevCats[name]?.bidding || 0,
  });
  const total = trip.budget || prevFinances.total || totalPlanned;
  const confirmed = prevFinances.confirmed || 0;
  const bidding = prevFinances.bidding || 0;
  return followPlanEnvelope({
    ...trip,
    finances: {
      total,
      confirmed,
      bidding,
      planned: totalPlanned,
      available: total - totalPlanned - confirmed,
      categories: {
        flights: { ...cat('flights'), planned: flightsPlanned },
        accommodation: { ...cat('accommodation'), planned: hotelPlanned },
        tours: { ...cat('tours'), planned: toursPlanned },
        food: { ...cat('food'), planned: foodPlanned },
        transport: cat('transport'),
        shopping: cat('shopping'),
      },
    },
  });
}

function commit<T extends DraftLike>(trip: T, days: ItineraryDay[]): T {
  return recomputeDraftFinances({ ...trip, days: itineraryToTripDays(days) });
}

/** 🗑: tira o item do roteiro e recalcula os baldes. */
export function removeDraftItem<T extends DraftLike>(trip: T, activityId: string): T {
  const days = itineraryOf(trip).map((d) => ({
    ...d,
    activities: d.activities.filter((a) => a.id !== activityId),
  }));
  return commit(trip, days);
}

/** A troca entra com a duração da candidata, na hora do slot, sem empurrar o item seguinte. */
export function swapDraftItem<T extends DraftLike>(trip: T, dayNumber: number, activityId: string, cand: SwapCandidate): T {
  const days = itineraryOf(trip);
  const current = days.find((d) => d.dayNumber === dayNumber)?.activities.find((a) => a.id === activityId);
  if (!current) return trip;
  const next = convertToItineraryActivity(cand.activity, dayNumber - 1, current.timeSlot, current.time ?? '', travelersOf(trip));
  return commit(trip, days.map((d) => d.dayNumber !== dayNumber ? d : {
    ...d,
    activities: d.activities.map((a) => (a.id === activityId ? next : a)),
  }));
}
