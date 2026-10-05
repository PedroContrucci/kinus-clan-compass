// flightModel — voos planejados (estimativa) e a conversão para SelectedFlight.
// Puro: usado pelo buildDraftTrip (antes do motor rodar) e pelo DraftCockpit.
import { addDays } from 'date-fns';
import { calculateArrivalTime } from '@/types/trip';
import type { ActivityStatus } from '@/types/trip';
import type { FlightOption, SelectedFlight } from '@/lib/itineraryEngine';

export interface PlannedFlight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  status: ActivityStatus;
}

/** Voo planejado (como o buildDraftTrip grava em trip.flights) → SelectedFlight (source 'estimate'). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function plannedFlightToSelected(flight: any, date: Date): SelectedFlight {
  const route = `${flight.origin} → ${flight.destination}`;
  const duration = flight.duration || '0h';
  const durationMinutes = (() => {
    const m = duration.match(/(\d+(?:\.\d+)?)\s*h/);
    if (!m) return 0;
    return Math.round(parseFloat(m[1]) * 60);
  })();

  const option: FlightOption = {
    id: flight.id,
    airline: flight.airline,
    route,
    isDirect: flight.stops === 0,
    duration,
    durationMinutes,
    price: flight.price,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    segments: [{
      departure: { iataCode: flight.origin, at: flight.departureDate },
      arrival: { iataCode: flight.destination, at: flight.arrivalDate },
    }],
  };

  const selected: SelectedFlight = { option, date, source: 'estimate' };
  // priceSource fora do tipo (index signature), como source.
  if (flight.priceSource) (selected as unknown as Record<string, unknown>).priceSource = flight.priceSource;
  return selected;
}

export interface PlannedFlightsInput {
  originCode: string;
  destinationCode: string;
  departureDate: Date;
  returnDate: Date;
  departureTime: string;
  arrivalTime: string;
  arrivalDaysLater: number;
  flightHours: number;
  tzDiff: number;
  hasDirectFlight?: boolean;
  /** Preço por trecho, por pessoa. */
  legPrice: number;
  /** Preço da volta, quando difere da ida (estimativa por rota). Default = legPrice. */
  returnLegPrice?: number;
  /** 'route' (tabela de rotas) | 'tier' (número genérico do perfil). */
  priceSource?: 'route' | 'tier';
}

/** Ida e volta planejadas (estimativa). Horários vêm da regra de direção/duração + calculateArrivalTime. */
export function buildPlannedFlights(i: PlannedFlightsInput): { outbound: PlannedFlight & { priceSource?: string }; return: PlannedFlight & { priceSource?: string } } {
  const stops = i.hasDirectFlight ? 0 : 1;
  return {
    outbound: {
      id: 'flight-outbound',
      airline: 'A confirmar',
      flightNumber: '---',
      origin: i.originCode,
      destination: i.destinationCode,
      departureDate: i.departureDate.toISOString(),
      departureTime: i.departureTime,
      arrivalDate: addDays(i.departureDate, i.arrivalDaysLater).toISOString(),
      arrivalTime: i.arrivalTime,
      duration: `${i.flightHours}h`,
      stops,
      price: i.legPrice,
      status: 'planned',
      ...(i.priceSource ? { priceSource: i.priceSource } : {}),
    },
    return: {
      id: 'flight-return',
      airline: 'A confirmar',
      flightNumber: '---',
      origin: i.destinationCode,
      destination: i.originCode,
      departureDate: i.returnDate.toISOString(),
      departureTime: '14:00',
      arrivalDate: i.returnDate.toISOString(),
      arrivalTime: calculateArrivalTime('14:00', i.returnDate, i.flightHours, -i.tzDiff).arrivalTime,
      duration: `${i.flightHours}h`,
      stops,
      price: i.returnLegPrice ?? i.legPrice,
      status: 'planned',
      ...(i.priceSource ? { priceSource: i.priceSource } : {}),
    },
  };
}
