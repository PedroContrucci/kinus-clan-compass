import { airfarePaxOf } from './pax';

export function getSelectedFlightPlannedTotal(trip: any): number | null {
  const outboundPrice = Number(trip?.outboundFlight?.option?.price);
  const returnPrice = Number(trip?.returnFlight?.option?.price);

  if (!Number.isFinite(outboundPrice) || !Number.isFinite(returnPrice)) {
    return null;
  }

  // M20b: preço de referência = 1 adulto; multiplica por pagante (adultos + crianças), bebê de colo fora.
  // Viagem sem pax por idade: payers = travelers, como sempre.
  return Math.round((outboundPrice + returnPrice) * airfarePaxOf(trip).payers);
}

export function getFlightPlannedTotal(trip: any): number {
  const selectedFlightTotal = getSelectedFlightPlannedTotal(trip);
  if (selectedFlightTotal != null) return selectedFlightTotal;
  return Math.round(Number(trip?.finances?.categories?.flights?.planned || 0));
}

export function syncTripFlightPlannedFinances<T extends { finances?: any; budget?: number; [key: string]: any }>(trip: T): T {
  if (!trip?.finances?.categories?.flights) return trip;

  const selectedFlightTotal = getSelectedFlightPlannedTotal(trip);
  if (selectedFlightTotal == null) return trip;

  const previousFlightPlanned = Number(trip.finances.categories.flights.planned || 0);
  const delta = selectedFlightTotal - previousFlightPlanned;

  trip.finances.categories.flights.planned = selectedFlightTotal;
  trip.finances.planned = Math.max(0, Math.round(Number(trip.finances.planned || 0) + delta));
  trip.finances.available = Math.max(
    0,
    Math.round(
      Number(trip.finances.total || trip.budget || 0)
      - Number(trip.finances.planned || 0)
      - Number(trip.finances.bidding || 0)
      - Number(trip.finances.confirmed || 0),
    ),
  );

  return trip;
}