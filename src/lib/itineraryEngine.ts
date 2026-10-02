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
  /** De onde veio: estimativa do gerador, busca real ou reserva confirmada. */
  source?: 'estimate' | 'amadeus' | 'confirmed';
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
  const sameDayArrival = !crossesMidnight;

  // Compute real arrival day offset (supports multi-day flights)
  const lastSeg = (outboundFlight.option as any).segments?.[(outboundFlight.option as any).segments.length - 1];
  let arrivalDayIndex = sameDayArrival ? 0 : 1;
  if (lastSeg?.arrival?.at) {
    const arrivalDate = new Date(lastSeg.arrival.at);
    const diff = differenceInCalendarDays(arrivalDate, departureDate);
    if (diff >= 0 && diff <= 3) arrivalDayIndex = diff;
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

  function pickActivity(category: 'morning' | 'afternoon' | 'night' | 'breakfast' | 'lunch' | 'dinner', themeName: string): SuggestedActivity | null {
    const pool = getDestinationActivities(destination);
    const themeStyleMap: Record<string, string[]> = {
      'Cultura': ['culture', 'history', 'art'],
      'Gastronomia': ['gastronomy'],
      'Passeios': ['nature', 'romantic', 'shopping'],
      'Aventura': ['adventure', 'nature'],
      'Descobertas': ['culture', 'shopping', 'art'],
    };
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

    // Preferred pool: unseen name + matching theme tags.
    let candidates = pool.filter(a =>
      a.category === category &&
      isFresh(a) &&
      (targetTags.length === 0 || (a.styleTags && a.styleTags.some(t => targetTags.includes(t))))
    );
    // Second pass: unseen name, any theme.
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category && isFresh(a));
    }

    let forcedReuse = false;
    if (candidates.length === 0) {
      // EXP activities NEVER repeat. Signal exhaustion so caller can emit a free-slot entry.
      if (isExp) return null;

      // Restaurants: every name already used — degrade gracefully rather than
      // leave the slot empty. A repeated dinner beats a day with no dinner.
      candidates = pickReusableByGap(
        pool.filter(a => a.category === category),
        usedPlaces,
        currentPickDayIndex,
        category
      );
      if (candidates.length === 0) return null;
      forcedReuse = true;
    }

    if (candidates.length === 0) return null;
    if (!forcedReuse) {
      // Sort by tier intent: budget=cheapest first, luxury=most expensive first,
      // midrange=closest to median target
      candidates.sort((a, b) => {
        const priceA = a.estimatedCostBRL || 0;
        const priceB = b.estimatedCostBRL || 0;
        if (priceLevel === 'budget') return priceA - priceB;
        if (priceLevel === 'luxury') return priceB - priceA;
        // midrange: proximity to target
        return Math.abs(priceA - target) - Math.abs(priceB - target);
      });
    }
    const picked = candidates[0];
    usedPlaces.mark(picked.name, currentPickDayIndex, category);
    return picked;
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

  let michelinCount = 0;
  for (let i = 0; i < totalDays; i++) {
    currentPickDayIndex = i;
    const date = addDays(departureDate, i);
    const activities: ItineraryActivity[] = [];
    let label = '';
    let theme = '';
    let dayTotal = 0;


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
      });
      dayTotal = outboundCost;

      // Short flight + early arrival: complete the day with check-in + afternoon + dinner
      if (sameDayArrival) {
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
        const dinnerActivity = pickActivity('dinner', 'Gastronomia');
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

        const lightDinner = pickActivity('dinner', 'Gastronomia');
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

        const dinnerActivity = pickActivity('dinner', 'Gastronomia');
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
        const breakfastActivity = pickActivity('breakfast', 'Gastronomia');
        if (breakfastActivity) {
          const activity = convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00', travelers);
          activities.push(activity);
          dayTotal += activity.estimatedCost;
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
        let morningActivity: SuggestedActivity | null = null;
        for (let attempt = 0; attempt < 10; attempt++) {
          const candidate = pickActivity('afternoon', 'Descobertas');
          if (!candidate) break;
          if (candidate.dayOccupancy !== 'full' && candidate.dayOccupancy !== 'half') {
            morningActivity = candidate;
            break;
          }
        }
        if (morningActivity) {
          const activity = convertToItineraryActivity(morningActivity, i, 'morning', '10:00', travelers);
          activity.tips = ['Aproveite as últimas horas!', ...(activity.tips || [])];
          activities.push(activity);
          dayTotal += activity.estimatedCost;
        }
      }

      
      // Lunch — only if transfer is 14:00 or later
      if (transferMinutes >= 14 * 60) {
        const lunchActivity = pickActivity('lunch', 'Gastronomia');
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
      
      // ☕ BREAKFAST (08:00) — 80% hotel (free), ~20% external café for variety
      const explorationDayIndex = i - 2; // 0-based index of exploration days
      const totalExplorationDays = totalDays - 3; // exclude departure + arrival + return
      const suggestExternalBreakfast = (explorationDayIndex === 1) || (explorationDayIndex === Math.floor(totalExplorationDays / 2));

      if (suggestExternalBreakfast) {
        const breakfastActivity = pickActivity('breakfast', dayTheme.title);
        if (breakfastActivity) {
          const act = convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00', travelers);
          act.tips = ['Sugestão de café externo para variar', ...(act.tips || [])];
          activities.push(act);
          dayTotal += act.estimatedCost;
        }
      } else {
        // Hotel breakfast — included in daily rate, cost is 0
        activities.push({
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
      }
      
      // 🏛️ MORNING ACTIVITY (10:00) — decide day shape based on occupancy
      const morningActivity = pickActivity('morning', dayTheme.title);
      const morningOccupancy = morningActivity?.dayOccupancy;
      let afternoonOccupancy: 'full' | 'half' | undefined;

      if (morningActivity) {
        const act = convertToItineraryActivity(morningActivity, i, 'morning', '10:00', travelers);
        activities.push(act);
        dayTotal += act.estimatedCost;
      } else {
        // EXP pool exhausted for morning slot — emit free-slot entry.
        activities.push(buildFreeSlotActivity(i, 'morning', '10:00'));
      }

      if (morningOccupancy === 'full') {
        // CASE A: full-day morning activity consumes the day
        // breakfast + full-day activity + dinner (no lunch, no afternoon, no night)
      } else if (morningOccupancy === 'half') {
        // CASE B: half-day morning activity + lunch + dinner (no afternoon, no night)
        const lunchActivity = pickActivity('lunch', dayTheme.title);
        if (lunchActivity) {
          const act = convertToItineraryActivity(lunchActivity, i, 'lunch', '13:00', travelers);
          activities.push(act);
          dayTotal += act.estimatedCost;
        }
      } else {
        // CASE C: normal morning activity + lunch + afternoon + dinner + optional night
        const lunchActivity = pickActivity('lunch', dayTheme.title);
        if (lunchActivity) {
          const act = convertToItineraryActivity(lunchActivity, i, 'lunch', '13:00', travelers);
          activities.push(act);
          dayTotal += act.estimatedCost;
        }

        const isSunsetActivity = (a: any) =>
          !!a && typeof a.name === 'string' &&
          /(p[ôo]r do sol|sunset)/i.test(a.name);

        let afternoonActivity = pickActivity('afternoon', dayTheme.title);
        if (afternoonActivity && (afternoonActivity.dayOccupancy === 'full' || afternoonActivity.dayOccupancy === 'half')) {
          // Full/half-day activities must anchor the day from the morning, not the afternoon.
          // Draw one more time for a normal afternoon activity; the original drawn id is already
          // marked as used so it won't be repeated this day.
          afternoonActivity = pickActivity('afternoon', dayTheme.title);
        }

        // Sunset activities MUST occupy the last afternoon slot (17:30), never 15:00.
        // If the initial afternoon pick is a sunset, try to draw a normal activity for
        // 15:00 and place the sunset at 17:30 (swap the effective time slot).
        let sunsetActivity: typeof afternoonActivity | null = null;
        if (isSunsetActivity(afternoonActivity)) {
          sunsetActivity = afternoonActivity;
          let replacement = pickActivity('afternoon', dayTheme.title);
          if (replacement && (replacement.dayOccupancy === 'full' || replacement.dayOccupancy === 'half')) {
            replacement = pickActivity('afternoon', dayTheme.title);
          }
          // If the replacement is ALSO a sunset, keep only one sunset at 17:30.
          if (isSunsetActivity(replacement)) {
            replacement = null;
          }
          afternoonActivity = replacement || null;
        }

        if (afternoonActivity && afternoonActivity.dayOccupancy !== 'full' && afternoonActivity.dayOccupancy !== 'half') {
          afternoonOccupancy = afternoonActivity.dayOccupancy;
          const act = convertToItineraryActivity(afternoonActivity, i, 'afternoon', '15:00', travelers);
          activities.push(act);
          dayTotal += act.estimatedCost;
        } else if (!afternoonActivity && !sunsetActivity) {
          // EXP pool exhausted for afternoon slot — emit free-slot entry.
          activities.push(buildFreeSlotActivity(i, 'afternoon', '15:00'));
        }

        if (sunsetActivity && sunsetActivity.dayOccupancy !== 'full' && sunsetActivity.dayOccupancy !== 'half') {
          if (!afternoonOccupancy) afternoonOccupancy = sunsetActivity.dayOccupancy;
          const sunsetAct = convertToItineraryActivity(sunsetActivity, i, 'afternoon', '17:30', travelers);
          activities.push(sunsetAct);
          dayTotal += sunsetAct.estimatedCost;
        }
      }

      // 🍷 DINNER (19:30) — Michelin injection for gastronomy days
      const isGastroDay = dayTheme.title.toLowerCase().includes('gastron');
      const wantsGastronomy = travelInterests.some(ti => ti.toLowerCase().includes('gastronom'));
      
      let dinnerActivity = pickActivity('dinner', dayTheme.title);
      
      if (isGastroDay && wantsGastronomy && priceLevel !== 'budget' && michelinCount < 1) {
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
        } else if (dinnerActivity) {
          const act = convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30', travelers);
          activities.push(act);
          dayTotal += act.estimatedCost;
        }
      } else if (dinnerActivity) {
        const act = convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30', travelers);
        activities.push(act);
        dayTotal += act.estimatedCost;
      }
      
      // 🌙 NIGHT ACTIVITY - Optional (21:30) — only on nightlife-themed days, when the user
      // explicitly likes nightlife, or roughly every 3rd exploration day to keep daily density realistic
      const isNightlifeDay = /noturna|noite|nightlife/i.test(dayTheme.title);
      const wantsNightlife = travelInterests.some(ti => /noturna|noite|nightlife/i.test(ti));
      const shouldAddNightActivity = isNightlifeDay || wantsNightlife;
      
      if (shouldAddNightActivity && morningOccupancy !== 'full' && morningOccupancy !== 'half' && afternoonOccupancy !== 'full' && afternoonOccupancy !== 'half') {
        const nightActivity = pickActivity('night', dayTheme.title);
        if (nightActivity) {
          const act = convertToItineraryActivity(nightActivity, i, 'night', '21:30', travelers);
          act.tips = ['(Opcional)', ...(act.tips || [])];
          activities.push(act);
          dayTotal += act.estimatedCost;
        }
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
