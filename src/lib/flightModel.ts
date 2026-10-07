// flightModel — voos planejados (estimativa) e a conversão para SelectedFlight.
// Puro: usado pelo buildDraftTrip (antes do motor rodar) e pelo DraftCockpit.
import { addDays } from 'date-fns';
import type { ActivityStatus } from '@/types/trip';
import type { FlightOption, SelectedFlight } from '@/lib/itineraryEngine';
import { computeArrival, airportCity, cityTimezone, dateKey } from '@/lib/timezone';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';

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

  // Planejado gravado por write-through (writeFlightsThrough) carrega a fonte real; o resto é estimativa.
  const source: SelectedFlight['source'] = flight.source === 'reference' || flight.source === 'confirmed' ? flight.source : 'estimate';
  const selected: SelectedFlight = { option, date, source };
  if (flight.priceSource) selected.priceSource = flight.priceSource;
  if (flight.chosenBy === 'kinu' || flight.chosenBy === 'user') selected.chosenBy = flight.chosenBy;
  // Fuso/duração/internacional: só quando o planejado declara (viagens antigas não têm).
  if (typeof flight.tzKnown === 'boolean') selected.tzKnown = flight.tzKnown;
  if (typeof flight.durationKnown === 'boolean') selected.durationKnown = flight.durationKnown;
  if (typeof flight.international === 'boolean') selected.international = flight.international;
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
  /** IANA da origem e do destino (null = desconhecido). A volta é calculada com eles. */
  originTz?: string | null;
  destinationTz?: string | null;
  /** false → horário de chegada "a confirmar" (R-V6). */
  tzKnown?: boolean;
  /** false → duração "a confirmar" (estimativa conservadora, não medida). */
  durationKnown?: boolean;
  /** Destino fora do Brasil. */
  international?: boolean;
  /** Hora típica de saída da volta na rota (tabela de rotas, opcional). Sem ela, 14:00 padrão. */
  returnDepartureTime?: string;
}

type PlannedOut = PlannedFlight & {
  priceSource?: string; tzKnown?: boolean; durationKnown?: boolean; international?: boolean;
  /** Volta estimada: 'route' (hora típica da tabela de rotas) | 'default' (14:00). */
  departureTimeSource?: 'route' | 'default';
};

/** Ida e volta planejadas (estimativa). Horários vêm da regra de direção/duração + computeArrival. */
export function buildPlannedFlights(i: PlannedFlightsInput): { outbound: PlannedOut; return: PlannedOut } {
  const stops = i.hasDirectFlight ? 0 : 1;
  // Volta: sai na hora típica da rota (quando a tabela tem) ou 14:00 padrão, marcada pela fonte;
  // chegada em UTC → local da origem (R-V1), D+n por data (R-V2).
  // Sem um dos fusos, mesmo fuso nas duas pontas — o número existe, mas a tela diz "a confirmar".
  const routeTime = /^\d{2}:\d{2}$/.test(i.returnDepartureTime ?? '') ? (i.returnDepartureTime as string) : null;
  const returnTime = routeTime ?? '14:00';
  const homeTz = i.originTz || i.destinationTz || 'America/Sao_Paulo';
  const back = computeArrival({
    date: i.returnDate,
    time: returnTime,
    durationMinutes: Math.round(i.flightHours * 60),
    originTz: i.tzKnown === false ? homeTz : (i.destinationTz || homeTz),
    destinationTz: homeTz,
  });
  const flags = {
    ...(i.priceSource ? { priceSource: i.priceSource } : {}),
    ...(typeof i.tzKnown === 'boolean' ? { tzKnown: i.tzKnown } : {}),
    ...(typeof i.durationKnown === 'boolean' ? { durationKnown: i.durationKnown } : {}),
    ...(typeof i.international === 'boolean' ? { international: i.international } : {}),
  };
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
      ...flags,
    },
    return: {
      id: 'flight-return',
      airline: 'A confirmar',
      flightNumber: '---',
      origin: i.destinationCode,
      destination: i.originCode,
      departureDate: i.returnDate.toISOString(),
      departureTime: returnTime,
      departureTimeSource: routeTime ? 'route' : 'default',
      arrivalDate: addDays(i.returnDate, back.daysLater).toISOString(),
      arrivalTime: back.arrivalTime,
      duration: `${i.flightHours}h`,
      stops,
      price: i.returnLegPrice ?? i.legPrice,
      status: 'planned',
      ...flags,
    },
  };
}

// ─── Preço de referência (Travelpayouts) → SelectedFlight ───

/** Oferta como a function `amadeus-flights` devolve (fonte real: Travelpayouts/Aviasales). */
export interface ReferenceOffer {
  id: string;
  airline: string;
  route: string;
  isDirect: boolean;
  connectionCities?: string[];
  duration: string;
  durationMinutes: number;
  price: number;
  departureTime: string;
  arrivalTime: string;
  departureAirport?: string;
  arrivalAirport?: string;
  segments?: Array<{ departure: { iataCode: string; at: string }; arrival: { iataCode: string; at: string } }>;
}

export interface OfferContext {
  /** Data da perna (ida ou volta) na viagem. */
  date: Date;
  /** Cidades da perna (fallback de fuso quando o aeroporto não está mapeado). */
  fromCity?: string;
  toCity?: string;
}

/**
 * Oferta de referência → SelectedFlight pelo mesmo modelo do voo estimado.
 *
 * A fonte manda UM segmento (origem→destino) e só a contagem de escalas: não há hora por
 * conexão (R-V4 fica declarado). Do servidor, só vale `segments[0].departure.at` (data +
 * HH:mm locais da origem) e `durationMinutes`. `arrival.at` é a saída somada à duração no
 * relógio da origem com rótulo UTC, e `departureTime`/`arrivalTime` saem formatados em UTC
 * no servidor — os três são ignorados. Chegada = computeArrival (UTC primeiro, R-V1); D+n
 * por datas locais (R-V2), gravado no segmento como hora local sem `Z`.
 */
export function offerToSelected(offer: ReferenceOffer, ctx: OfferContext): SelectedFlight {
  const first = offer.segments?.[0];
  const last = offer.segments?.[offer.segments.length - 1];
  const fromCode = (first?.departure?.iataCode || offer.departureAirport || '').toUpperCase();
  const toCode = (last?.arrival?.iataCode || offer.arrivalAirport || '').toUpperCase();

  const m = String(first?.departure?.at || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const depDate = m ? m[1] : dateKey(ctx.date);
  const depTime = m ? m[2] : offer.departureTime;

  const fromInfo = airportCity(fromCode);
  const toInfo = airportCity(toCode);
  const originTz = cityTimezone(fromInfo?.city) ?? cityTimezone(ctx.fromCity);
  const destinationTz = cityTimezone(toInfo?.city) ?? cityTimezone(ctx.toCity);
  const tzKnown = !!(originTz && destinationTz);
  const home = originTz || destinationTz || 'America/Sao_Paulo';
  const durationMinutes = Math.max(0, Math.round(Number(offer.durationMinutes) || 0));
  const arr = computeArrival({
    date: depDate, time: depTime, durationMinutes,
    originTz: home, destinationTz: tzKnown ? (destinationTz as string) : home,
  });
  // Internacional = alguma ponta fora do Brasil (aeroporto mapeado; senão, desconhecido conta como fora).
  const international = !(fromInfo?.brazil && toInfo?.brazil);

  return {
    option: {
      id: offer.id,
      airline: offer.airline,
      route: offer.route,
      isDirect: offer.isDirect,
      connectionCity: offer.connectionCities?.[0],
      duration: offer.duration,
      durationMinutes,
      price: offer.price,
      departureTime: depTime,
      arrivalTime: arr.arrivalTime,
      segments: [{
        departure: { iataCode: fromCode, at: `${depDate}T${depTime}:00` },
        arrival: { iataCode: toCode, at: `${arr.arrivalDate}T${arr.arrivalTime}:00` },
      }],
    },
    date: ctx.date,
    source: 'reference',
    priceSource: 'travelpayouts',
    tzKnown,
    international,
  };
}

/** D+n de um SelectedFlight pelas datas locais dos segmentos (0 sem segmentos). */
export function flightDaysLater(sel: SelectedFlight): number {
  const segs = sel.option.segments;
  const a = String(segs?.[0]?.departure?.at || '').slice(0, 10);
  const b = String(segs?.[segs.length - 1]?.arrival?.at || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return 0;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * Mesma perna com outra hora de saída (ex.: confirmada em Viagens): chegada refeita por
 * computeArrival (R-V1/R-V2) com os fusos dos aeroportos — saída nova nunca fica com chegada velha.
 */
export function retimeFlight(sel: SelectedFlight, departureTime: string, ctx: { fromCity?: string; toCity?: string } = {}): SelectedFlight {
  const o = sel.option;
  const segs = o.segments;
  const fromCode = String(segs?.[0]?.departure?.iataCode || '').toUpperCase();
  const toCode = String(segs?.[(segs?.length ?? 1) - 1]?.arrival?.iataCode || '').toUpperCase();
  const segDate = String(segs?.[0]?.departure?.at || '').match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(?::\d{2})?$/);
  const depDate = segDate ? segDate[1] : dateKey(new Date(sel.date));
  const originTz = cityTimezone(airportCity(fromCode)?.city) ?? cityTimezone(ctx.fromCity);
  const destinationTz = cityTimezone(airportCity(toCode)?.city) ?? cityTimezone(ctx.toCity);
  const tzKnown = !!(originTz && destinationTz);
  const home = originTz || destinationTz || 'America/Sao_Paulo';
  const arr = computeArrival({
    date: depDate, time: departureTime, durationMinutes: Math.max(0, Math.round(Number(o.durationMinutes) || 0)),
    originTz: home, destinationTz: tzKnown ? (destinationTz as string) : home,
  });
  return {
    ...sel,
    option: {
      ...o,
      departureTime,
      arrivalTime: arr.arrivalTime,
      segments: [{
        departure: { iataCode: fromCode, at: `${depDate}T${departureTime}:00` },
        arrival: { iataCode: toCode, at: `${arr.arrivalDate}T${arr.arrivalTime}:00` },
      }],
    },
    tzKnown: sel.tzKnown === false ? false : tzKnown,
  };
}

/** SelectedFlight → voo planejado (o formato de trip.flights.*), a partir do MESMO objeto. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectedToPlanned(sel: SelectedFlight, prev: any, id: string): PlannedOut & Record<string, unknown> {
  const o = sel.option;
  const segs = o.segments;
  const departureDate: string = prev?.departureDate || sel.date.toISOString();
  return {
    ...(prev || {}),
    id,
    airline: o.airline,
    flightNumber: prev?.flightNumber || '---',
    origin: segs?.[0]?.departure?.iataCode || prev?.origin || '',
    destination: segs?.[segs.length - 1]?.arrival?.iataCode || prev?.destination || '',
    departureDate,
    departureTime: o.departureTime,
    arrivalDate: addDays(new Date(departureDate), flightDaysLater(sel)).toISOString(),
    arrivalTime: o.arrivalTime,
    // Horas decimais: o parse do planejado (plannedFlightToSelected) e o PDF leem "N.NNh".
    duration: `${Math.round((o.durationMinutes / 60) * 100) / 100}h`,
    stops: o.isDirect ? 0 : 1,
    price: o.price,
    status: sel.source === 'confirmed' ? 'confirmed' : 'planned',
    source: sel.source,
    ...(sel.priceSource ? { priceSource: sel.priceSource } : {}),
    ...(sel.chosenBy ? { chosenBy: sel.chosenBy } : {}),
    ...(typeof sel.tzKnown === 'boolean' ? { tzKnown: sel.tzKnown } : {}),
    ...(typeof sel.international === 'boolean' ? { international: sel.international } : {}),
  };
}

/**
 * Write-through (R-V12): o voo escolhido vira, de uma vez, `outboundFlight/returnFlight`,
 * `trip.flights.outbound/return` e o balde de voo das finanças. Puro: devolve viagem nova.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeFlightsThrough<T extends Record<string, any>>(trip: T, outbound: SelectedFlight, ret: SelectedFlight): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next: any = {
    ...trip,
    outboundFlight: outbound,
    returnFlight: ret,
    flights: {
      ...(trip.flights || {}),
      outbound: selectedToPlanned(outbound, trip.flights?.outbound, 'flight-outbound'),
      return: selectedToPlanned(ret, trip.flights?.return, 'flight-return'),
    },
  };
  // Guarda a estimativa do KINU na 1ª troca: ela segue como índice 0 da lista depois.
  if (!trip.kinuEstimate && trip.outboundFlight?.source === 'estimate' && trip.returnFlight) {
    next.kinuEstimate = { outbound: trip.outboundFlight, return: trip.returnFlight };
  }
  if (trip.finances) {
    next.finances = {
      ...trip.finances,
      categories: { ...trip.finances.categories, flights: { ...trip.finances.categories?.flights } },
    };
  }
  return syncTripFlightPlannedFinances(next);
}

/** A estimativa do KINU da viagem (índice 0 da lista), mesmo depois de uma troca. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function estimateOf(trip: any): { outbound?: SelectedFlight; return?: SelectedFlight } {
  if (trip?.kinuEstimate?.outbound) return trip.kinuEstimate;
  if (trip?.outboundFlight?.source === 'estimate') return { outbound: trip.outboundFlight, return: trip.returnFlight };
  const fo = trip?.flights?.outbound;
  const fr = trip?.flights?.return;
  const isEst = (f: { source?: string } | undefined) => !!f && (!f.source || f.source === 'estimate');
  return {
    outbound: isEst(fo) ? plannedFlightToSelected(fo, new Date(trip.startDate)) : undefined,
    return: isEst(fr) ? plannedFlightToSelected(fr, new Date(trip.endDate)) : undefined,
  };
}
