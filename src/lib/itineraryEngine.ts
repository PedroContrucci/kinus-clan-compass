// itineraryEngine — o motor de roteiro do KINU, puro (sem React, sem hooks, sem components).
// Extraído de GeneratedItineraryStage.tsx sem mudança de comportamento, exceto os ids
// sintéticos, que passam ao namespace da casa (`day-N-<catalogId>` / `day-N-slot-<slug>`):
//   day-N-flight-out       → day-N-slot-flight-out
//   day-N-flight-return    → day-N-slot-flight-back
//   day-N-checkin          → day-N-slot-checkin
//   day-N-breakfast-hotel  → day-N-slot-breakfast
//   day-N-free-<slot>      → day-N-slot-free-<slot>
//   day-N-ambient-walk     → day-N-slot-ambient-walk
//   day-N-walk / -rest     → day-N-slot-walk / day-N-slot-rest
//   day-N-transit          → day-N-slot-transit
//   day-N-checkout         → day-N-slot-checkout
//   day-N-transfer         → day-N-slot-transfer
//   day-N-dinner-michelin  → day-N-michelin-<slug do nome>
// Colisão de id no mesmo dia → day-N-slot-dup-<k> + console.warn.
import { getActivityPrice, findBestPriceLevel, type PriceLevel } from '@/lib/activityPricing';
import { format, addDays, differenceInDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  getActivitiesByCategory,
  getDestinationActivities,
  getDestinationThemes,
  type SuggestedActivity,
  type DestinationTheme
} from '@/data/destinationActivities';
import { getTopMichelinForCity } from '@/lib/michelinData';
import { createPlaceUsageTracker, normalizePlaceName, pickReusableByGap } from '@/lib/placeIdentity';
import { getHotelRecommendation } from '@/lib/hotelZones';
import { interestsFor } from '@/lib/interestsFor';
import { matchesPriority } from '@/lib/claChips';
import { curatedCoordOf, resolveHotelCoord } from '@/lib/routeCoords';
import { maxHopKmFor, haversineKm, HOP_HOURS, lastDayWindowHours } from '@/lib/itineraryValidator';
import { findCityInfo } from '@/data/destinationCatalog';

type Coord = { lat: number; lng: number };

/** Janela de um dia de exploração (08–22 h), em horas. */
export const EXPLORATION_WINDOW_HOURS = 14;
/** Jantar do dia de bate-volta: no máximo isto do hotel. */
export const DAYTRIP_DINNER_KM = 5;

const isDaytripTagged = (a: SuggestedActivity) => (a.styleTags ?? []).some((t) => t.toLowerCase() === 'daytrip');
const PAIR_RE = /^(.*)-(almoco|jantar)$/;

/** Horas de um item como o R16 conta: o número antes de "h" em `duration` ("1h30" → 1). */
function itemHoursOf(a: ItineraryActivity): number {
  const m = String(a.duration ?? '').match(/(\d+(?:[.,]\d+)?)\s*h/);
  return m ? parseFloat(m[1].replace(',', '.')) : 0;
}
/** Logística fica fora da janela (mesmo critério do R16). */
const isLogisticAct = (a: ItineraryActivity) =>
  a.timeSlot === 'flight' || a.timeSlot === 'hotel' || ['flight', 'hotel', 'checkin', 'checkout'].includes(a.type) || /transfer|aeroporto/i.test(a.name);
/** Horas usadas no dia: Σ duração + 0,5 h por salto. */
export function dayHoursUsed(activities: ItineraryActivity[]): number {
  const items = activities.filter((a) => !isLogisticAct(a));
  return items.reduce((s, a) => s + itemHoursOf(a), 0) + HOP_HOURS * Math.max(0, items.length - 1);
}
const parseHour = (t?: string): number => {
  const m = String(t ?? '').match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : -1;
};

export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo?: string;
  route: string;
  isDirect: boolean;
  connectionCity?: string;
  duration: string;
  durationMinutes: number;
  price: number;
  departureTime: string;
  arrivalTime: string;
  segments?: Array<{
    departure: { iataCode: string; at: string };
    arrival: { iataCode: string; at: string };
  }>;
  isBestPrice?: boolean;
  isFastest?: boolean;
}

export interface SelectedFlight {
  option: FlightOption;
  date: Date;
  /**
   * De onde veio: estimativa do gerador, preço de referência (Travelpayouts), reserva
   * confirmada. 'amadeus' é legado (viagens gravadas antes da A.3); nada novo grava isso.
   */
  source?: 'estimate' | 'reference' | 'amadeus' | 'confirmed';
  /** Fonte do preço: 'route'/'tier' (estimativa) ou 'travelpayouts' (preço de referência). */
  priceSource?: 'route' | 'tier' | 'travelpayouts';
  /** Quem escolheu este voo: o KINU pelo ranking (flightRanking) ou o usuário na lista. */
  chosenBy?: 'kinu' | 'user';
  /** Quando o KINU escolheu: base do "por quê" (média da perna, nº de ofertas, modo). */
  kinuPick?: { averagePrice: number; offers: number; mode: 'kinu' | 'fastest' };
  /** false → fuso do destino desconhecido: hora de chegada "a confirmar" (R-V6). Ausente = conhecido. */
  tzKnown?: boolean;
  /** false → duração estimada sem base (fallback conservador): "duração a confirmar". */
  durationKnown?: boolean;
  /** Destino fora do Brasil. */
  international?: boolean;
}


/** R-V6 / D4: o que não foi medido aparece como "a confirmar" no item do voo, nunca como número. */
function flightUnknownTips(f: SelectedFlight): { tips?: string[] } {
  const tips: string[] = [];
  if (f.tzKnown === false) tips.push('Horário de chegada a confirmar (fuso do destino desconhecido)');
  if (f.durationKnown === false) tips.push('duração a confirmar (estimativa conservadora, não medida)');
  // Uma linha só: o rascunho exibe apenas a primeira dica do item (draftItinerary).
  return tips.length ? { tips: [tips.join(' · ')] } : {};
}

export type JetLagSeverity = 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';

/** Severidade do jet lag → o dia de chegada vira dia de recuperação? Ajustável aqui. */
export const RECOVERY_BY_SEVERITY: Record<JetLagSeverity, boolean> = {
  BAIXO: false,
  MODERADO: true,
  ALTO: true,
  SEVERO: true,
};

/**
 * Hotel informado pela viagem. Ausente = comportamento atual (tabela de zonas).
 * `label` é o texto exibido no item de check-in.
 */
export interface EngineHotel {
  label: string;
}

/** Slug estável de um nome de lugar para compor ids (`day-N-michelin-<slug>`). */
export function placeSlug(name: string): string {
  return normalizePlaceName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Ids repetidos dentro do mesmo dia viram `day-N-slot-dup-<k>` (com aviso). Muta `days`. */
export function resolveSameDayClashes(days: { dayNumber: number; activities: { id: string }[] }[]): void {
  for (const day of days) {
    const seen = new Set<string>();
    let k = 0;
    for (const act of day.activities) {
      if (seen.has(act.id)) {
        k += 1;
        const prefix = act.id.match(/^day-\d+-/)?.[0] ?? `day-${day.dayNumber}-`;
        const next = `${prefix}slot-dup-${k}`;
        console.warn(`[itineraryEngine] id repetido no dia: ${act.id} → ${next}`);
        act.id = next;
      }
      seen.add(act.id);
    }
  }
}

export interface FinanceBuckets {
  flightsPlanned: number;
  hotelPlanned: number;
  foodPlanned: number;
  toursPlanned: number;
  totalPlanned: number;
}

/**
 * Os baldes de custo do roteiro — fonte única do que o stage mostra e grava em trip.finances.
 * `hotelPlannedOverride` (diária curada × noites) manda sobre a estimativa do breakdown.
 */
export function computeBuckets(
  currentDays: ItineraryDay[],
  breakdown: BudgetBreakdown,
  hotelPlannedOverride?: number
): FinanceBuckets {
  const flightsPlanned = Math.round(breakdown.flights.amount || 0);
  // Hotel curado manda: `hotelPlannedOverride` é a diária curada × noites da própria
  // viagem. Sem ele (viagem sem hotel curado), a estimativa desta etapa, como antes.
  const hotelPlanned = hotelPlannedOverride && hotelPlannedOverride > 0
    ? Math.round(hotelPlannedOverride)
    : Math.round(breakdown.hotel.amount || 0);
  let foodPlanned = 0;
  let toursPlanned = 0;
  currentDays.forEach((day) => {
    day.activities.forEach((act) => {
      const cost = Math.round(act.estimatedCost || 0);
      // Exclude flight/hotel/system items — their cost lives only in the
      // planned flight/hotel totals from breakdown, never on day items.
      if (['flight', 'hotel', 'checkin', 'checkout', 'transport'].includes(act.type)) return;
      if (['breakfast', 'lunch', 'dinner'].includes(act.timeSlot)) {
        foodPlanned += cost;
      } else if (['morning', 'afternoon', 'night'].includes(act.timeSlot)) {
        toursPlanned += cost;
      }
    });
  });
  const totalPlanned = flightsPlanned + hotelPlanned + foodPlanned + toursPlanned;
  return { flightsPlanned, hotelPlanned, foodPlanned, toursPlanned, totalPlanned };
}

// Types
export interface ItineraryActivity {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'experience' | 'restaurant' | 'checkin' | 'checkout' | 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'night' | 'transport';
  timeSlot: 'breakfast' | 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'night' | 'flight' | 'hotel';
  estimatedCost: number;
  costPerPerson?: number;
  time?: string;
  duration?: string;
  location?: string;
  rating?: number;
  status: 'defined' | 'suggestion' | 'pending';
  tips?: string[];
  source: 'kinu' | 'clan' | 'custom';
}

export interface ItineraryDay {
  dayNumber: number;
  date: Date;
  label: string;
  theme?: string;
  activities: ItineraryActivity[];
  totalCost: number;
}

export interface BudgetBreakdown {
  flights: { amount: number; percent: number; status: 'defined' | 'estimated' };
  hotel: { amount: number; percent: number; status: 'defined' | 'estimated' };
  experiences: { amount: number; percent: number; status: 'defined' | 'estimated' };
  food: { amount: number; percent: number; status: 'defined' | 'estimated' };
  total: number;
  available: number;
  trustZonePercent: number;
}

// Convert SuggestedActivity to ItineraryActivity
// Individual consumption items (meals, experiences) are multiplied by travelers
// Shared items (hotel, transfer) are NOT
export function convertToItineraryActivity(
  activity: SuggestedActivity,
  dayIndex: number,
  timeSlot: ItineraryActivity['timeSlot'],
  time: string,
  travelers: number = 1
): ItineraryActivity {
  const typeMap: Record<string, ItineraryActivity['type']> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    morning: 'experience',
    afternoon: 'experience',
    night: 'night',
  };

  // All activities from destinationActivities are individual (per-person) costs
  const totalCost = activity.estimatedCostBRL * travelers;
  const costLabel = travelers > 1 ? ` (${travelers} pax)` : '';

  return {
    id: `day-${dayIndex}-${activity.id}`,
    name: activity.name,
    type: typeMap[activity.category] || 'experience',
    timeSlot,
    estimatedCost: totalCost,
    costPerPerson: activity.estimatedCostBRL,
    time,
    duration: `${activity.durationHours}h`,
    location: `${activity.neighborhood}${costLabel}`,
    rating: activity.rating,
    status: 'suggestion',
    tips: activity.tips,
    source: 'kinu',
  };
}

/**
 * Coordenada do hotel para o motor: casamento por nome com hotel curado (resolveHotelCoord). Sem
 * casamento, a MEDIANA das coords do catálogo da cidade serve de proxy do centro — palpite
 * declarado, usado só para o jantar perto do hotel e o primeiro salto dos dias de chegada/volta.
 */
export function engineHotelCoord(destination: string, hotelName: string | undefined): Coord | null {
  const byName = resolveHotelCoord(undefined, hotelName, destination);
  if (byName) return byName;
  const cs = getDestinationActivities(destination).map((a) => curatedCoordOf(a.id)).filter((c): c is Coord => !!c);
  if (cs.length === 0) return null;
  const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  return { lat: med(cs.map((c) => c.lat)), lng: med(cs.map((c) => c.lng)) };
}

// Generate complete itinerary with multiple activities per day
export function generateItinerary(
  departureDate: Date,
  returnDate: Date,
  destination: string,
  origin: string,
  outboundFlight: SelectedFlight,
  returnFlight: SelectedFlight,
  budget: number,
  travelers: number = 1,
  travelInterests: string[] = [],
  jetLagSeverity?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO',
  priceLevelProp?: PriceLevel,
  hotel?: EngineHotel
): { days: ItineraryDay[]; breakdown: BudgetBreakdown; meta: { michelinCount: number } } {
  const totalDays = differenceInDays(returnDate, departureDate) + 1;
  const totalNights = totalDays - 1;
  
  // Prefer the user-chosen budget tier; only recalculate when none was provided
  const priceLevel: PriceLevel = priceLevelProp ?? findBestPriceLevel(destination, totalDays, travelers, budget).level;

  // Detect a flight that cannot cross midnight — enables same-day arrival flow
  const depHourStr = outboundFlight.option.departureTime?.split(':')[0];
  const departureHour = parseInt(depHourStr, 10) || 0;
  const flightHours = outboundFlight.option.durationMinutes / 60;
  const crossesMidnight = (departureHour + flightHours) >= 24;
  // Quem decide se virou o dia é só a meia-noite. O antigo `durationMinutes < 240`
  // reprovava 08:00+9h (pousa 17:00 do mesmo dia) e excluía exatamente 4h no limite.
  let sameDayArrival = !crossesMidnight;

  // Compute real arrival day offset (supports multi-day flights)
  const lastSeg = (outboundFlight.option as any).segments?.[(outboundFlight.option as any).segments.length - 1];
  let arrivalDayIndex = sameDayArrival ? 0 : 1;
  if (lastSeg?.arrival?.at) {
    const arrivalDate = new Date(lastSeg.arrival.at);
    const diff = differenceInCalendarDays(arrivalDate, departureDate);
    if (diff >= 0 && diff <= 3) {
      arrivalDayIndex = diff;
      // R-V2: a DATA local da chegada decide se virou o dia. A soma de horas no relógio da
      // origem (acima) só vale sem segmento — GRU 13:00 +10h → LIS chega 02:00 de D+1.
      sameDayArrival = diff === 0;
    }
    else if (diff > 3) console.warn('[KINU] implausible flight arrival offset', diff, '— falling back to default');
  }

  const explorationStart = arrivalDayIndex > 1 ? arrivalDayIndex + 1 : (sameDayArrival ? 1 : 2);
  const outboundLegPrice = Number(outboundFlight?.option?.price) || 0;
  const returnLegPrice = Number(returnFlight?.option?.price) || 0;

  // Planned flight total (round-trip, per person) = the same source the flight
  // hero card uses. Outbound and return line items each carry exactly half.
  const plannedFlightTotalPerPerson = outboundLegPrice + returnLegPrice;
  const flightsCost = plannedFlightTotalPerPerson * travelers;
  const flightPerPerson = plannedFlightTotalPerPerson / 2;
  
  // Hotel is SHARED (not multiplied by travelers)
  const hotelPerNight = getActivityPrice('hotel_night', destination, priceLevel);
  const hotelTotal = hotelPerNight * totalNights;
  
  // Transfer cost (shared)
  const transferCost = getActivityPrice('transfer', destination, priceLevel);

  const days: ItineraryDay[] = [];
  // Trip-wide uniqueness, keyed by NORMALIZED NAME and shared across every
  // category. Keying by id was the bug: the catalog carries the same real
  // venue under distinct ids in distinct categories (Cabaña del Primo is both
  // for-cabana-del-primo/lunch and for-rest-cabana-del-primo/dinner), so an
  // id-keyed Set happily scheduled the same house twice in one trip.
  //
  // EXP (morning/afternoon/night): NEVER repeat — an exhausted slot becomes
  // free time instead. Restaurants (breakfast/lunch/dinner): may repeat only
  // once no unseen name is left, preferring the one used longest ago.
  const usedPlaces = createPlaceUsageTracker();
  let currentPickDayIndex = 0;

  const EXP_CATEGORIES = new Set(['morning', 'afternoon', 'night']);
  const pool = getDestinationActivities(destination);
  const maxHop = maxHopKmFor(destination);

  // Interesses válidos = os que a cidade oferece (interestsFor); os 2 primeiros puxam a cota.
  const offered = new Set(interestsFor(destination).map((c) => c.id));
  const top2 = travelInterests.filter((x) => offered.has(x)).slice(0, 2);
  const matchesTop2 = (a: SuggestedActivity) =>
    top2.some((p) => matchesPriority({ category: a.category, styleTags: a.styleTags ?? [] }, p));

  // Bate-volta: âncora (não-refeição com tag daytrip) e seus pares `<id>-almoco` / `<id>-jantar`.
  const poolIds = new Set(pool.map((a) => a.id));
  const isDaytripAnchor = (a: SuggestedActivity) => isDaytripTagged(a) && EXP_CATEGORIES.has(a.category);
  const isPairMeal = (a: SuggestedActivity) => {
    const m = a.id.match(PAIR_RE);
    return !!m && poolIds.has(m[1]) && isDaytripAnchor(pool.find((p) => p.id === m[1])!);
  };
  const dualRole = (() => {
    const cats = new Map<string, Set<string>>();
    for (const a of pool) {
      const k = normalizePlaceName(a.name);
      if (!cats.has(k)) cats.set(k, new Set());
      cats.get(k)!.add(a.category);
    }
    return new Set([...cats].filter(([, c]) => c.size > 1).map(([k]) => k));
  })();
  const pairsOf = (anchorId: string) => pool.filter((a) => a.id === `${anchorId}-almoco` || a.id === `${anchorId}-jantar`);

  const hotelCoord = engineHotelCoord(destination, hotel?.label ?? getHotelRecommendation(destination, priceLevel, travelInterests)?.name);

  const themeStyleMap: Record<string, string[]> = {
    'Cultura': ['culture', 'history', 'art'],
    'Gastronomia': ['gastronomy'],
    'Passeios': ['nature', 'romantic', 'shopping'],
    'Aventura': ['adventure', 'nature'],
    'Descobertas': ['culture', 'shopping', 'art'],
  };

  interface PickOpts {
    /** Coordenada da parada anterior: candidatos a ≤ `nearKm` vêm primeiro; sem nenhum, o mais próximo. */
    near?: Coord | null;
    /** Segunda referência: a distância que conta é a maior das duas (almoço entre manhã e tarde). */
    alsoNear?: Coord | null;
    nearKm?: number;
    /** Slot EXP de dia de exploração: os 2 interesses do topo vêm antes do tema (cota do R13). */
    quota?: boolean;
    /** Bate-volta pode ser a âncora deste pick (manhã de dia elegível). */
    daytripOk?: (a: SuggestedActivity) => boolean;
    accept?: (a: SuggestedActivity) => boolean;
    /** Âncora do dia: prefere quem tem almoço inédito a ≤ maxHop (dia que fecha a corrente). */
    anchor?: boolean;
  }

  function pickActivity(
    category: 'morning' | 'afternoon' | 'night' | 'breakfast' | 'lunch' | 'dinner',
    themeName: string,
    opts: PickOpts = {}
  ): SuggestedActivity | null {
    const targetTags = themeStyleMap[themeName] || [];
    // Price targets by tier and category (in BRL)
    const priceTargets: Record<string, Record<string, number>> = {
      budget:   { breakfast: 50,  lunch: 120, dinner: 200, morning: 0,   afternoon: 0,   night: 50 },
      midrange: { breakfast: 100, lunch: 250, dinner: 400, morning: 150, afternoon: 150, night: 150 },
      luxury:   { breakfast: 200, lunch: 500, dinner: 900, morning: 300, afternoon: 300, night: 300 },
    };
    const target = priceTargets[priceLevel]?.[category] ?? 150;
    const isExp = EXP_CATEGORIES.has(category);
    const isFresh = (a: SuggestedActivity) => !usedPlaces.isUsed(a.name);

    // Bate-volta só entra como âncora explícita; seus pares só junto dele.
    const eligible = (a: SuggestedActivity) => {
      if (isPairMeal(a)) return false;
      if (isDaytripAnchor(a)) return !!opts.daytripOk?.(a);
      return a.category === category && (!opts.accept || opts.accept(a));
    };
    let candidates = pool.filter((a) => eligible(a) && isFresh(a));

    let forcedReuse = false;
    if (candidates.length === 0) {
      // EXP activities NEVER repeat. Signal exhaustion so caller can emit a free-slot entry.
      if (isExp) return null;

      // Restaurants: every name already used — degrade gracefully rather than
      // leave the slot empty. A repeated dinner beats a day with no dinner.
      candidates = pickReusableByGap(
        pool.filter(a => a.category === category && !isPairMeal(a) && !isDaytripTagged(a)),
        usedPlaces,
        currentPickDayIndex,
        category
      );
      if (candidates.length === 0) return null;
      forcedReuse = true;
    }

    if (candidates.length === 0) return null;
    if (!forcedReuse) {
      // Ordem: dentro do salto > interesse (só quando a cota pede) > tema > preço do tier.
      // Sem interesse válido o critério de interesse some e sobra o comportamento anterior
      // (tema, depois preço), agora com a coesão geográfica na frente.
      const nearKm = opts.near ? (opts.nearKm ?? maxHop) : 0;
      const lunchCoords = opts.anchor
        ? pool.filter((l) => l.category === 'lunch' && isFresh(l) && !isPairMeal(l)).map((l) => curatedCoordOf(l.id)).filter((c): c is Coord => !!c)
        : [];
      const hopKey = (a: SuggestedActivity) => {
        if (opts.anchor) {
          const c = curatedCoordOf(a.id);
          if (!c || isDaytripAnchor(a) || lunchCoords.length === 0) return 0;
          return lunchCoords.some((l) => haversineKm(c, l) <= maxHop) ? 0 : 1;
        }
        if (!opts.near) return 0;
        const c = curatedCoordOf(a.id);
        if (!c) return 0; // sem coord não quebra a corrente do R15
        const km = Math.max(haversineKm(opts.near, c), opts.alsoNear ? haversineKm(opts.alsoNear, c) : 0);
        return km <= nearKm ? 0 : 1 + km;
      };
      // Cota: interesse sempre na frente do tema enquanto houver um dentro do salto. Medido no smoke,
      // isto rende mais que alternar em 50–75 % — o estoque de interesse por cidade é que limita.
      const wantInterest = !!opts.quota && top2.length > 0;
      const interestKey = (a: SuggestedActivity) => (wantInterest && !matchesTop2(a) ? 1 : 0);
      const themeKey = (a: SuggestedActivity) =>
        targetTags.length === 0 || (a.styleTags && a.styleTags.some(t => targetTags.includes(t))) ? 0 : 1;
      // Casa com dois papéis no catálogo (ex.: Cabaña del Primo almoço e jantar) vai por último:
      // escalá-la num papel tira um nome do outro pool e força repetição lá.
      const dualKey = (a: SuggestedActivity) => (dualRole.has(normalizePlaceName(a.name)) ? 1 : 0);
      const priceKey = (a: SuggestedActivity) => {
        const p = a.estimatedCostBRL || 0;
        if (priceLevel === 'budget') return p;
        if (priceLevel === 'luxury') return -p;
        return Math.abs(p - target);
      };
      const keyed = candidates.map((a) => ({ a, k: [hopKey(a), interestKey(a), themeKey(a), dualKey(a), priceKey(a)] }));
      keyed.sort((x, y) => {
        for (let j = 0; j < x.k.length; j++) if (x.k[j] !== y.k[j]) return x.k[j] - y.k[j];
        return 0;
      });
      candidates = keyed.map((x) => x.a);
    } else if (opts.near) {
      // Repetição forçada: o menos usado continua mandando (espalha as repetições); entre os
      // igualmente usados, o que está dentro do salto vem antes da ordem de espaçamento.
      const near = opts.near, km = opts.nearKm ?? maxHop;
      const outside = (a: SuggestedActivity) => { const c = curatedCoordOf(a.id); return c && haversineKm(near, c) > km ? 1 : 0; };
      candidates = [...candidates].sort((a, b) =>
        usedPlaces.countOf(a.name) - usedPlaces.countOf(b.name) || outside(a) - outside(b));
    }
    const picked = candidates[0];
    usedPlaces.mark(picked.name, currentPickDayIndex, category);
    return picked;
  }

  // Jantar do dia de chegada: perto do hotel e, se der, curto o bastante para a janela chegada → 22 h.
  function pickArrivalDinner(): SuggestedActivity | null {
    const fits = (a: SuggestedActivity) => (a.durationHours || 0) <= arrivalWindow;
    const anyFits = pool.some((a) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && fits(a));
    return pickActivity('dinner', 'Gastronomia', { near: hotelCoord, accept: anyFits ? fits : undefined });
  }

  // Build a free-slot ItineraryActivity for exhausted EXP pools (morning/afternoon).
  function buildFreeSlotActivity(
    dayIndex: number,
    slot: 'morning' | 'afternoon',
    time: string
  ): ItineraryActivity {
    const name = slot === 'morning'
      ? 'Manhã livre — explore por conta'
      : 'Tarde livre — explore por conta';
    return {
      id: `day-${dayIndex}-slot-free-${slot}`,
      name,
      type: 'experience',
      timeSlot: slot,
      estimatedCost: 0,
      costPerPerson: 0,
      time,
      duration: '2h',
      location: destination,
      status: 'suggestion',
      source: 'kinu',
      tips: ['Dia para revisitar o que amou ou descobrir o bairro do hotel no seu ritmo'],
    };
  }


  // Style tags for filtering (convert interests to lowercase)
  const styleTags = travelInterests.map(i => i.toLowerCase().replace('🍜 ', '').replace('🏖️ ', '').replace('🌙 ', '').replace('👨‍👩‍👧 ', '').replace('🏛️ ', '').replace('🎨 ', '').replace('🎭 ', '').replace('🏔️ ', '').replace('💆 ', '').replace('🛍️ ', '').replace('🌿 ', ''));

  // Interest-aware theme ranking (mirrors NewPlanningWizard lines 655-666)
  const interestToTheme: Record<string, string> = {
    'gastronomy': 'Gastronomia', 'culture': 'Cultura', 'history': 'Cultura',
    'art': 'Cultura', 'adventure': 'Aventura', 'nature': 'Aventura',
    'beach': 'Passeios', 'relaxation': 'Passeios', 'shopping': 'Passeios',
    'nightlife': 'Descobertas', 'family': 'Passeios', 'winter': 'Aventura',
  };
  const rawInterests = travelInterests.map(i => i.toLowerCase().replace(/[^\w]/g, '').trim());
  const cityThemes = getDestinationThemes(destination);
  const scoredThemes = cityThemes.map(theme => ({
    theme,
    score: rawInterests.filter(interest => interestToTheme[interest] === theme.title).length,
  }));
  scoredThemes.sort((a, b) => b.score - a.score);
  const orderedThemes: DestinationTheme[] = scoredThemes.map(s => s.theme);

  // Build weighted theme sequence for exploration days, prioritizing user-selected interests.
  const preferredThemes: DestinationTheme[] = scoredThemes.filter(s => s.score > 0).map(s => s.theme);
  const otherThemes: DestinationTheme[] = scoredThemes.filter(s => s.score === 0).map(s => s.theme);
  const baseThemes = preferredThemes.length > 0 ? preferredThemes : orderedThemes;

  // Janelas de tempo (R16): chegada → 22 h no dia de chegada; 08 h → aeroporto (−3 h intl / −2 h
  // doméstico) no último. Doméstico = destino no Brasil, como no smoke.
  // Fuso desconhecido (R-V6): a hora de chegada não é medida → janela padrão, não a hora.
  const arrivalHour = outboundFlight.tzKnown === false ? -1 : parseHour(outboundFlight.option.arrivalTime);
  const arrivalWindow = arrivalHour < 0 ? EXPLORATION_WINDOW_HOURS : Math.max(0, 22 - arrivalHour);
  const domestic = typeof returnFlight.international === 'boolean'
    ? !returnFlight.international
    : findCityInfo(destination)?.region === 'Brasil';
  const lastWindow = lastDayWindowHours(returnFlight.option.departureTime, domestic);

  let michelinCount = 0;
  let lastDaytripDay = -10;
  for (let i = 0; i < totalDays; i++) {
    currentPickDayIndex = i;
    const date = addDays(departureDate, i);
    const activities: ItineraryActivity[] = [];
    let label = '';
    let theme = '';
    let dayTotal = 0;
    let windowHours: number | null = null;
    let dayThemeTitle = '';


    // Day 1: Departure (flight only)
    if (i === 0) {
      label = 'Partida';
      theme = '✈️ Dia de Viagem';
      const outboundCost = flightsCost / 2; // Half of round trip
      activities.push({
        id: `day-${i}-slot-flight-out`,
        name: outboundFlight.source === 'estimate' ? 'Voo de Ida (estimado)' : 'Voo de Ida',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: outboundCost,
        costPerPerson: flightPerPerson,
        time: outboundFlight.option.departureTime,
        duration: outboundFlight.option.duration,
        location: outboundFlight.option.route + (travelers > 1 ? ` (${travelers} pax)` : ''),
        status: 'defined',
        source: 'kinu',
        ...flightUnknownTips(outboundFlight),
      });
      dayTotal = outboundCost;

      // Short flight + early arrival: complete the day with check-in + afternoon + dinner
      if (sameDayArrival) {
        windowHours = arrivalWindow;
        activities.push({
          id: `day-${i}-slot-checkin`, name: 'Check-in no hotel', type: 'checkin', timeSlot: 'hotel',
          estimatedCost: 0, costPerPerson: 0, time: '14:00',
          location: (() => {
            if (hotel) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'suggestion', source: 'kinu',
          tips: [`${totalNights} noites (~R$ ${hotelPerNight.toLocaleString('pt-BR')}/noite)`, 'Custo já incluso no total da hospedagem'],
        });
        activities.push({
          id: `day-${i}-slot-ambient-walk`,
          name: 'Caminhada leve no bairro do hotel',
          type: 'experience',
          timeSlot: 'afternoon',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '16:00',
          duration: '2h',
          location: destination,
          status: 'suggestion',
          source: 'kinu',
          tips: ['Conheça os arredores do hotel sem pressa', 'Ajuda a regular o relógio biológico'],
        });
        const dinnerActivity = pickArrivalDinner();
        if (dinnerActivity) {
          const act = convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30', travelers);
          activities.push(act); dayTotal += act.estimatedCost;
        }
      }
    }
    // Transit day(s): for multi-day flights, fill the gap between departure and arrival
    else if (i > 0 && i < arrivalDayIndex) {
      label = 'Em trânsito';
      theme = 'Em trânsito ✈️';
      activities.push({
        id: `day-${i}-slot-transit`,
        name: `Voo em andamento — descanse, hidrate-se e ajuste o relógio para o fuso de ${destination}`,
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: 0,
        costPerPerson: 0,
        status: 'defined',
        source: 'kinu',
      });
      dayTotal = 0;
    }
    // Arrival day: Check-in + Light activities
    else if (i === arrivalDayIndex && !sameDayArrival) {
      label = `Chegada em ${destination}`;
      theme = '🛬 Dia de Chegada';

      const isRecoveryDay = jetLagSeverity ? RECOVERY_BY_SEVERITY[jetLagSeverity] : false;
      windowHours = arrivalWindow;

      if (isRecoveryDay) {
        // Recovery day — light activities only (Biology AI active)
        activities.push({
          id: `day-${i}-slot-checkin`,
          name: 'Check-in no hotel',
          type: 'checkin',
          timeSlot: 'hotel',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '15:00',
          duration: '1h',
          location: (() => {
            if (hotel) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'defined',
          source: 'kinu',
          tips: ['Acomodação após o voo, sem pressa', `${totalNights} noites (~R$ ${hotelPerNight.toLocaleString('pt-BR')}/noite)`, 'Custo já incluso no total da hospedagem'],
        });

        activities.push({
          id: `day-${i}-slot-walk`,
          name: 'Caminhada leve no bairro',
          type: 'experience',
          timeSlot: 'afternoon',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '17:00',
          duration: '1h30',
          location: destination,
          status: 'defined',
          source: 'kinu',
          tips: ['Conheça os arredores do hotel sem pressa', 'Ajuda a regular o relógio biológico'],
        });

        const lightDinner = pickArrivalDinner();
        if (lightDinner) {
          const act = convertToItineraryActivity(lightDinner, i, 'dinner', '19:30', travelers);
          act.tips = ['Refeição leve. Evite álcool e comida pesada.', ...(act.tips || [])];
          activities.push(act);
          dayTotal += act.estimatedCost;
        }

        activities.push({
          id: `day-${i}-slot-rest`,
          name: 'Descanso para regular o sono',
          type: 'night',
          timeSlot: 'night',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '21:30',
          duration: '0h',
          location: destination,
          status: 'defined',
          source: 'kinu',
          tips: ['Tente dormir no horário local', 'Resista o cochilo se for antes das 22h'],
        });
      } else {
        // Normal arrival day — check-in + light exploration
        activities.push({
          id: `day-${i}-slot-checkin`,
          name: 'Check-in no hotel',
          type: 'checkin',
          timeSlot: 'hotel',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '14:00',
          location: (() => {
            if (hotel) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'suggestion',
          tips: [`${totalNights} noites (~R$ ${hotelPerNight.toLocaleString('pt-BR')}/noite)`, 'Custo já incluso no total da hospedagem'],
          source: 'kinu',
        });

        activities.push({
          id: `day-${i}-slot-ambient-walk`,
          name: 'Caminhada leve no bairro do hotel',
          type: 'experience',
          timeSlot: 'afternoon',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '16:00',
          duration: '2h',
          location: destination,
          status: 'suggestion',
          source: 'kinu',
          tips: ['Conheça os arredores do hotel sem pressa', 'Ajuda a regular o relógio biológico'],
        });

        const dinnerActivity = pickArrivalDinner();
        if (dinnerActivity) {
          const activity = convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30', travelers);
          activities.push(activity);
          dayTotal += activity.estimatedCost;
        }
      }
    }
    // Last day: Checkout + Morning activity + Flight
    else if (i === totalDays - 1) {
      label = 'Volta';
      theme = '✈️ Dia de Partida';
      windowHours = lastWindow;
      let last: Coord | null = hotelCoord;
      
      // Derive schedule backward from real return flight time
      const [depH, depM] = returnFlight.option.departureTime.split(':').map(Number);
      const depMinutes = depH * 60 + depM;
      const transferMinutes = depMinutes - 4 * 60; // 1h transfer + 3h antecedência
      const fmt = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };
      const transferTime = fmt(transferMinutes);
      
      // Breakfast — only if there's time before transfer
      if (transferMinutes >= 9 * 60) {
        const breakfastActivity = pickActivity('breakfast', 'Gastronomia', { near: last });
        if (breakfastActivity) {
          const activity = convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00', travelers);
          activities.push(activity);
          dayTotal += activity.estimatedCost;
          last = curatedCoordOf(breakfastActivity.id) ?? last;
        }
      }
      
      // Checkout — 30 min before transfer, capped so it is never later than 11:00
      const checkoutMinutes = Math.min(11 * 60, transferMinutes - 30);
      activities.push({
        id: `day-${i}-slot-checkout`,
        name: 'Check-out do hotel',
        type: 'transport',
        timeSlot: 'morning',
        estimatedCost: 0,
        costPerPerson: 0,
        time: fmt(checkoutMinutes),
        status: 'suggestion',
        tips: ['Logística de saída — sem custo adicional'],
        source: 'kinu',
      });

      
      // Light morning activity — only if transfer is 12:15 or later
      if (transferMinutes >= 12 * 60 + 15) {
        const morningActivity = pickActivity('afternoon', 'Descobertas', {
          near: last,
          accept: (a) => a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half',
        });
        if (morningActivity) {
          last = curatedCoordOf(morningActivity.id) ?? last;
          const activity = convertToItineraryActivity(morningActivity, i, 'morning', '10:00', travelers);
          activity.tips = ['Aproveite as últimas horas!', ...(activity.tips || [])];
          activities.push(activity);
          dayTotal += activity.estimatedCost;
        }
      }

      
      // Lunch — only if transfer is 14:00 or later
      if (transferMinutes >= 14 * 60) {
        const lunchActivity = pickActivity('lunch', 'Gastronomia', { near: last });
        if (lunchActivity) {
          const activity = convertToItineraryActivity(lunchActivity, i, 'lunch', '12:30', travelers);
          activities.push(activity);
          dayTotal += activity.estimatedCost;
        }
      }
      
      // Transfer to airport (SHARED — not multiplied)
      activities.push({
        id: `day-${i}-slot-transfer`,
        name: 'Transfer para Aeroporto',
    type: 'transport',
        timeSlot: 'afternoon',
        estimatedCost: transferCost,
        time: transferTime,
        duration: '1h',
        status: 'suggestion',
        tips: ['Chegue com 3h de antecedência para voos internacionais'],
        source: 'kinu',
      });
      dayTotal += transferCost;

      
      // Return flight
      const returnCost = flightsCost / 2;
      activities.push({
        id: `day-${i}-slot-flight-back`,
        name: returnFlight.source === 'estimate' ? 'Voo de Volta (estimado)' : 'Voo de Volta',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: returnCost,
        costPerPerson: flightPerPerson,
        time: returnFlight.option.departureTime,
        duration: returnFlight.option.duration,
        location: returnFlight.option.route + (travelers > 1 ? ` (${travelers} pax)` : ''),
        status: 'defined',
        source: 'kinu',
        ...flightUnknownTips(returnFlight),
      });
      dayTotal += returnCost;

      // Sort this day's activities by time
      activities.sort((a, b) => {
        const [ha, ma] = (a.time || '').split(':').map(Number);
        const [hb, mb] = (b.time || '').split(':').map(Number);
        const minA = (ha || 0) * 60 + (ma || 0);
        const minB = (hb || 0) * 60 + (mb || 0);
        return minA - minB;
      });
    }

    // Middle days: Full exploration with 5-6 activities
    else {
      const explorationDay = i - explorationStart;
      // Índice seguro: `explorationDay` pode ser NEGATIVO quando o voo diz que chegou no
      // mesmo dia do calendário mas a rota cruza a meia-noite (arrivalDayIndex=0 com
      // sameDayArrival=false ⇒ explorationStart=2, i=1). `lista[-1]` é undefined e o
      // `.icon` derrubava a página inteira. Também cobre lista vazia.
      const FALLBACK_THEME: DestinationTheme = {
        title: 'Exploração',
        icon: '🗺️',
        activities: ['', '', ''],
        restaurants: { lunch: '', dinner: '' },
      };
      const pickTheme = (list: DestinationTheme[], idx: number): DestinationTheme => {
        if (!list.length || !Number.isFinite(idx)) return FALLBACK_THEME;
        const safe = ((Math.trunc(idx) % list.length) + list.length) % list.length;
        return list[safe] ?? FALLBACK_THEME;
      };
      // Weighted theme sequence: cycle preferred themes; fall back to otherThemes only if we run out.
      let dayTheme: DestinationTheme;
      if (preferredThemes.length > 0 && explorationDay >= preferredThemes.length && otherThemes.length > 0) {
        // After every preferred theme has appeared once, optionally interleave other themes
        const overflow = explorationDay - preferredThemes.length;
        // Alternate: preferred (cycled) most of the time, otherThemes occasionally
        dayTheme = overflow % 3 === 2
          ? pickTheme(otherThemes, Math.floor(overflow / 3))
          : pickTheme(baseThemes, explorationDay);
      } else {
        dayTheme = pickTheme(baseThemes, explorationDay);
      }
      // Focus day: first exploration day uses top-ranked theme
      if (explorationDay === 0 && rawInterests.length > 0) {
        const focusThemeName = interestToTheme[rawInterests[0]];
        const focusMatch = baseThemes.find(t => t.title === focusThemeName) || orderedThemes.find(t => t.title === focusThemeName);
        if (focusMatch) dayTheme = focusMatch;
      }

      label = 'Exploração';
      theme = `${dayTheme.icon} ${dayTheme.title}`;
      
      windowHours = EXPLORATION_WINDOW_HOURS;
      dayThemeTitle = dayTheme.title;
      const isGastroDay = dayTheme.title.toLowerCase().includes('gastron');
      const wantsGastronomy = travelInterests.some(ti => ti.toLowerCase().includes('gastronom'));
      const michelinPending = isGastroDay && wantsGastronomy && priceLevel !== 'budget' && michelinCount < 1;

      // Corrente geográfica do dia: cada pick nasce perto da parada anterior com coordenada.
      let last: Coord | null = null;
      const place = (sug: SuggestedActivity, slot: ItineraryActivity['timeSlot'], time: string) => {
        const act = convertToItineraryActivity(sug, i, slot, time, travelers);
        activities.push(act);
        dayTotal += act.estimatedCost;
        last = curatedCoordOf(sug.id) ?? last;
        return act;
      };
      const hotelBreakfast = (): ItineraryActivity => ({
        id: `day-${i}-slot-breakfast`,
        name: 'Café da manhã no hotel',
        type: 'breakfast',
        timeSlot: 'breakfast',
        estimatedCost: 0,
        costPerPerson: 0,
        time: '08:00',
        duration: '1h',
        location: 'Hotel',
        status: 'defined',
        source: 'kinu',
        tips: ['Incluso na diária do hotel'],
      });

      // 🚌 Bate-volta: âncora da manhã num dia elegível — nem colado no anterior, nem no dia do
      // Michelin pendente, e só se cabe na janela com café + pares + jantar (+0,5 h por salto).
      const daytripFits = (a: SuggestedActivity) => {
        const pairs = pairsOf(a.id);
        const hasDinnerPair = pairs.some((p) => p.id.endsWith('-jantar'));
        const hours = 1 + (a.durationHours || 0) + pairs.reduce((s, p) => s + (p.durationHours || 0), 0) + (hasDinnerPair ? 0 : 2);
        const stops = 2 + pairs.length + (hasDinnerPair ? 0 : 1);
        return hours + HOP_HOURS * (stops - 1) <= EXPLORATION_WINDOW_HOURS;
      };
      const daytripDayOk = lastDaytripDay < i - 1 && !michelinPending;

      // 🏛️ MORNING ACTIVITY (10:00) — âncora do dia; decide o formato do dia
      const morningActivity = pickActivity('morning', dayTheme.title, {
        quota: true,
        anchor: true,
        daytripOk: daytripDayOk ? daytripFits : undefined,
      });

      if (morningActivity && isDaytripAnchor(morningActivity)) {
        // Dia inteiro fora: café no hotel antes, par no destino, jantar a ≤ 5 km do hotel depois.
        lastDaytripDay = i;
        activities.push(hotelBreakfast());
        const trip = place(morningActivity, 'morning', '09:00');
        trip.tips = ['Bate-volta: ocupa o dia inteiro', ...(trip.tips || [])];
        const pairs = pairsOf(morningActivity.id);
        for (const p of pairs) {
          usedPlaces.mark(p.name, i, p.category);
          place(p, p.id.endsWith('-jantar') ? 'dinner' : 'lunch', p.id.endsWith('-jantar') ? '19:30' : '13:00');
        }
        if (!pairs.some((p) => p.id.endsWith('-jantar'))) {
          const fitsDay = (a: SuggestedActivity) =>
            dayHoursUsed(activities) + HOP_HOURS + (a.durationHours || 0) <= EXPLORATION_WINDOW_HOURS;
          const anyFits = pool.some((a) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && fitsDay(a));
          const dinner = pickActivity('dinner', dayTheme.title, {
            near: hotelCoord, nearKm: DAYTRIP_DINNER_KM, accept: anyFits ? fitsDay : undefined,
          });
          if (dinner) {
            const act = place(dinner, 'dinner', '20:00');
            act.tips = ['Perto do hotel, para a volta do bate-volta', ...(act.tips || [])];
          }
        }
      } else {
        // ☕ BREAKFAST (08:00) — 80% hotel (free), ~20% external café for variety
        const explorationDayIndex = i - 2; // 0-based index of exploration days
        const totalExplorationDays = totalDays - 3; // exclude departure + arrival + return
        const suggestExternalBreakfast = (explorationDayIndex === 1) || (explorationDayIndex === Math.floor(totalExplorationDays / 2));
        const morningCoord = morningActivity ? curatedCoordOf(morningActivity.id) : null;

        // Café externo só se houver um dentro do salto da manhã; senão, café no hotel.
        const nearMorning = (a: SuggestedActivity) => {
          const c = curatedCoordOf(a.id);
          return !morningCoord || !c || haversineKm(morningCoord, c) <= maxHop;
        };
        if (suggestExternalBreakfast && pool.some((a) => a.category === 'breakfast' && !usedPlaces.isUsed(a.name) && nearMorning(a))) {
          const breakfastActivity = pickActivity('breakfast', dayTheme.title, { near: morningCoord, accept: nearMorning });
          if (breakfastActivity) {
            const act = place(breakfastActivity, 'breakfast', '08:00');
            act.tips = ['Sugestão de café externo para variar', ...(act.tips || [])];
          }
        } else {
          // Hotel breakfast — included in daily rate, cost is 0
          activities.push(hotelBreakfast());
        }

        const morningOccupancy = morningActivity?.dayOccupancy;
        let afternoonOccupancy: 'full' | 'half' | undefined;

        if (morningActivity) {
          place(morningActivity, 'morning', '10:00');
        } else {
          // EXP pool exhausted for morning slot — emit free-slot entry.
          activities.push(buildFreeSlotActivity(i, 'morning', '10:00'));
        }

        if (morningOccupancy === 'full') {
          // CASE A: full-day morning activity consumes the day
          // breakfast + full-day activity + dinner (no lunch, no afternoon, no night)
        } else if (morningOccupancy === 'half') {
          // CASE B: half-day morning activity + lunch + dinner (no afternoon, no night)
          const lunchActivity = pickActivity('lunch', dayTheme.title, { near: last });
          if (lunchActivity) place(lunchActivity, 'lunch', '13:00');
        } else {
          // CASE C: normal morning activity + lunch + afternoon + dinner + optional night.
          // A tarde nasce perto da manhã (é ela que pesa na cota); o almoço vem depois, perto das duas.
          const morningAt = last;
          const isSunsetActivity = (a: SuggestedActivity | null) =>
            !!a && typeof a.name === 'string' &&
            /(p[ôo]r do sol|sunset)/i.test(a.name);
          // Full/half-day activities must anchor the day from the morning, not the afternoon.
          const notLong = (a: SuggestedActivity) => a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half';

          let afternoonActivity = pickActivity('afternoon', dayTheme.title, { near: morningAt, quota: true, accept: notLong });

          // Sunset activities MUST occupy the last afternoon slot (17:30), never 15:00.
          // If the initial afternoon pick is a sunset, draw a non-sunset for 15:00.
          let sunsetActivity: SuggestedActivity | null = null;
          if (isSunsetActivity(afternoonActivity)) {
            sunsetActivity = afternoonActivity;
            afternoonActivity = pickActivity('afternoon', dayTheme.title, {
              near: morningAt, quota: true, accept: (a) => notLong(a) && !isSunsetActivity(a),
            });
          }
          const afternoonAt = curatedCoordOf((afternoonActivity ?? sunsetActivity)?.id ?? '') ?? null;

          const lunchActivity = pickActivity('lunch', dayTheme.title, { near: morningAt, alsoNear: afternoonAt });
          if (lunchActivity) place(lunchActivity, 'lunch', '13:00');

          if (afternoonActivity) {
            afternoonOccupancy = afternoonActivity.dayOccupancy;
            place(afternoonActivity, 'afternoon', '15:00');
          } else if (!sunsetActivity) {
            // EXP pool exhausted for afternoon slot — emit free-slot entry.
            activities.push(buildFreeSlotActivity(i, 'afternoon', '15:00'));
          }

          if (sunsetActivity) {
            if (!afternoonOccupancy) afternoonOccupancy = sunsetActivity.dayOccupancy;
            place(sunsetActivity, 'afternoon', '17:30');
          }
        }

        // 🍷 DINNER (19:30) — Michelin injection for gastronomy days
        const dinnerActivity = pickActivity('dinner', dayTheme.title, { near: last });
        let michelinPlaced = false;

        if (michelinPending) {
          const michelin = getTopMichelinForCity(destination, 10);
          const available = michelin;
          let preferred: typeof available;
          if (priceLevel === 'luxury') {
            preferred = available.filter(m => m.stars >= 2);
            if (preferred.length === 0) preferred = available;
          } else {
            // midrange → prefer 1 star, fall back to higher
            preferred = available.filter(m => m.stars === 1);
            if (preferred.length === 0) preferred = available;
          }
          const availableMichelin = preferred[0];
          if (availableMichelin) {
            const MICHELIN_MULTIPLIER: Record<number, number> = { 1: 2.5, 2: 4.5, 3: 7 };
            const MICHELIN_FLOOR: Record<number, number> = { 1: 850, 2: 1400, 3: 2200 };
            const michelinFactor = MICHELIN_MULTIPLIER[availableMichelin.stars] || 2.5;
            const basePerPerson = getActivityPrice('restaurant_dinner', destination, priceLevel);
            const perPerson = Math.max(basePerPerson * michelinFactor, MICHELIN_FLOOR[availableMichelin.stars] || 850);
            const total = perPerson * travelers;
            const stars = '⭐'.repeat(availableMichelin.stars);
            activities.push({
              id: `day-${i}-michelin-${placeSlug(availableMichelin.name)}`,
              name: `${availableMichelin.name} ${stars} Michelin`,
              type: 'dinner',
              timeSlot: 'dinner',
              estimatedCost: total,
              costPerPerson: perPerson,
              time: '20:00',
              duration: '2h30',
              location: availableMichelin.neighborhood || destination,
              status: 'defined',
              source: 'kinu',
              tips: [`Cozinha ${availableMichelin.cuisine}`, 'Reserve com 2-3 semanas de antecedência', 'Menu degustação — valor estimado por pessoa'],
            });
            // (Michelin is capped at 1 per trip via michelinCount; no id-tracking needed.)
            dayTotal += total;
            michelinCount++;
            michelinPlaced = true;
          }
        }
        if (!michelinPlaced && dinnerActivity) place(dinnerActivity, 'dinner', '19:30');

        // 🌙 NIGHT ACTIVITY - Optional (21:30) — only on nightlife-themed days or when the user
        // explicitly likes nightlife, to keep daily density realistic
        const isNightlifeDay = /noturna|noite|nightlife/i.test(dayTheme.title);
        const wantsNightlife = travelInterests.some(ti => /noturna|noite|nightlife/i.test(ti));
        // Noite também abre quando há item noturno inédito do interesse que cabe na janela.
        const fitsNight = (a: SuggestedActivity) =>
          dayHoursUsed(activities) + HOP_HOURS + (a.durationHours || 0) <= EXPLORATION_WINDOW_HOURS;
        const interestNight = (a: SuggestedActivity) => matchesTop2(a) && fitsNight(a);
        const hasInterestNight = top2.length > 0 &&
          pool.some((a) => a.category === 'night' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && !isDaytripTagged(a) && interestNight(a));
        const shouldAddNightActivity = isNightlifeDay || wantsNightlife || hasInterestNight;

        if (shouldAddNightActivity && morningOccupancy !== 'full' && morningOccupancy !== 'half' && afternoonOccupancy !== 'full' && afternoonOccupancy !== 'half') {
          const nightActivity = pickActivity('night', dayTheme.title, {
            near: last, quota: true, accept: isNightlifeDay || wantsNightlife ? undefined : interestNight,
          });
          if (nightActivity) {
            const act = place(nightActivity, 'night', '21:30');
            act.tips = ['(Opcional)', ...(act.tips || [])];
          }
        }
      }
    }

    // ⏱️ Empacota na janela: estourou → sai o item de menor afinidade (sintético < fora do tema <
    // tema < interesse; empate → o mais longo), nunca refeição nem Michelin. O nome removido
    // continua marcado como usado (o rastreador não desmarca) — perde-se uma opção, nunca repete.
    if (windowHours !== null) {
      const MEAL_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);
      const affinity = (a: ItineraryActivity) => {
        if (/^day-\d+-slot-/.test(a.id)) return 0;
        const sug = pool.find((p) => a.id === `day-${i}-${p.id}`);
        if (!sug) return 0;
        if (matchesTop2(sug)) return 3;
        const tags = themeStyleMap[dayThemeTitle] || [];
        return sug.styleTags?.some((t) => tags.includes(t)) ? 2 : 1;
      };
      while (dayHoursUsed(activities) > windowHours) {
        const removable = activities.filter((a) =>
          !isLogisticAct(a) && !MEAL_SLOTS.has(a.timeSlot) && !/^day-\d+-michelin-/.test(a.id) &&
          !pool.some((p) => isDaytripAnchor(p) && a.id === `day-${i}-${p.id}`));
        if (removable.length === 0) break;
        removable.sort((x, y) => affinity(x) - affinity(y) || itemHoursOf(y) - itemHoursOf(x));
        const out = removable[0];
        activities.splice(activities.indexOf(out), 1);
        dayTotal -= out.estimatedCost;
      }
    }

    days.push({
      dayNumber: i + 1,
      date,
      label,
      theme,
      activities,
      totalCost: dayTotal,
    });
  }

  // Calculate actual totals from generated activities
  let actualExperiencesTotal = 0;
  let actualFoodTotal = 0;
  
  days.forEach(day => {
    day.activities.forEach(activity => {
      if (['breakfast', 'lunch', 'dinner'].includes(activity.timeSlot)) {
        actualFoodTotal += activity.estimatedCost;
      } else if (['morning', 'afternoon', 'night'].includes(activity.timeSlot)) {
        actualExperiencesTotal += activity.estimatedCost;
      }
    });
  });

  const totalEstimated = flightsCost + hotelTotal + actualExperiencesTotal + actualFoodTotal;
  
  const breakdown: BudgetBreakdown = {
    flights: { amount: flightsCost, percent: Math.round((flightsCost / budget) * 100), status: 'defined' },
    hotel: { amount: hotelTotal, percent: Math.round((hotelTotal / budget) * 100), status: 'estimated' },
    experiences: { amount: actualExperiencesTotal, percent: Math.round((actualExperiencesTotal / budget) * 100), status: 'estimated' },
    food: { amount: actualFoodTotal, percent: Math.round((actualFoodTotal / budget) * 100), status: 'estimated' },
    total: totalEstimated,
    available: budget - totalEstimated,
    trustZonePercent: Math.round((totalEstimated / budget) * 100),
  };

  resolveSameDayClashes(days);
  return { days, breakdown, meta: { michelinCount } };
}

export interface EngineInput {
  departureDate: Date;
  returnDate: Date;
  destination: string;
  origin: string;
  outboundFlight: SelectedFlight;
  returnFlight: SelectedFlight;
  budget: number;
  travelers?: number;
  interests?: string[];
  jetLagSeverity?: JetLagSeverity;
  priceLevel?: PriceLevel;
  hotel?: EngineHotel;
  hotelPlannedOverride?: number;
}

/** Ponto de entrada do motor: dias + breakdown + baldes de custo. */
export function runItineraryEngine(input: EngineInput) {
  const r = generateItinerary(
    input.departureDate, input.returnDate, input.destination, input.origin,
    input.outboundFlight, input.returnFlight, input.budget, input.travelers ?? 1,
    input.interests ?? [], input.jetLagSeverity, input.priceLevel, input.hotel
  );
  return { ...r, buckets: computeBuckets(r.days, r.breakdown, input.hotelPlannedOverride) };
}
