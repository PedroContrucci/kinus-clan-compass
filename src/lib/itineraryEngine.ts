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
import { getTopMichelinForCity, type MichelinRestaurant } from '@/lib/michelinData';
import { paxLabel, type Pax } from '@/lib/pax';
import { createPlaceUsageTracker, normalizePlaceName, pickReusableByGap } from '@/lib/placeIdentity';
import { getHotelRecommendation } from '@/lib/hotelZones';
import { interestsFor, catalogFor, splitInterests, interestLabel } from '@/lib/interestsFor';
import { matchesPriority } from '@/lib/claChips';
import { curatedCoordOf, resolveHotelCoord } from '@/lib/routeCoords';
import { unavailableIdsOnDate } from '@/lib/seasonal';
import { isEveningItem, maxHopKmFor, haversineKm, travelMinutes, isSnack, opensOn, weekdayOf, tiersOf, ESSENTIALS_MIN_DAYS, MUST_SEE_MIN_DAYS, HOP_HOURS, lastDayWindowHours, dayWindowUsage, catalogItemOf, durationMinutesOf, defaultMinutesOf, type PlanDay, type PlanDayItem } from '@/lib/itineraryValidator';
import { catalogIdOf } from '@/lib/localAchievements';
import type { LandmarkTier } from '@/data/generated/landmarkTiers';
import { rulesContextOf } from '@/lib/cockpitLines';
import { findCityInfo } from '@/data/destinationCatalog';
import { CURATED_DAYS_OF_WEEK } from '@/data/generated/daysOfWeek';
import { isMustSee } from '@/lib/mustSee';

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
/** Logística fica fora da janela (mesmo critério do R16; check-out pelo nome — o motor o grava como 'transport'). */
const isLogisticAct = (a: ItineraryActivity) =>
  a.timeSlot === 'flight' || a.timeSlot === 'hotel' || ['flight', 'hotel', 'checkin', 'checkout'].includes(a.type) || /transfer|aeroporto|check-?out/i.test(a.name);
/** Horas usadas no dia: Σ duração + 0,5 h por salto. */
export function dayHoursUsed(activities: ItineraryActivity[]): number {
  const items = activities.filter((a) => !isLogisticAct(a));
  return items.reduce((s, a) => s + itemHoursOf(a), 0) + HOP_HOURS * Math.max(0, items.length - 1);
}
const parseHour = (t?: string): number => {
  const m = String(t ?? '').match(/(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : -1;
};

export type ArrivalBand = 'afternoon' | 'dinner' | 'night';
/** R-V9: chegada antes de 14 h → tarde leve; 14–20 h → só jantar; depois de 20 h → nada. Hora < 0 (desconhecida) = tarde leve. */
export function arrivalBandFor(arrivalHour: number): ArrivalBand {
  return arrivalHour < 14 ? 'afternoon' : arrivalHour < 20 ? 'dinner' : 'night';
}
/** Faixa R-V9 da chegada de uma perna (fuso desconhecido = tarde leve, R-V6). */
export function flightArrivalBand(f: SelectedFlight): ArrivalBand {
  return arrivalBandFor(f.tzKnown === false ? -1 : parseHour(f.option.arrivalTime));
}

export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo?: string;
  route: string;
  isDirect: boolean;
  connectionCity?: string;
  duration: string;
  durationMinutes: number;
  /** Preço por pessoa, por trecho (Travelpayouts/Aviasales devolve o preço de referência de 1 adulto; a estimativa idem). Total = × pagantes (adultos + crianças; airfarePaxOf), não × travelers. */
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
  /** M10-0: quando o Aviasales viu o preço de referência (ISO); null = a fonte não informou. */
  foundAt?: string | null;
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
 * Hotel informado pela viagem. Sem `label` = rótulo da tabela de zonas no check-in.
 * `label` é o texto exibido no item de check-in.
 */
export interface EngineHotel {
  label?: string;
  /** Diária da viagem (`acc.nightlyRate`, gravada uma vez no createTrip). O motor só multiplica pelas noites. */
  nightlyRate?: number;
}

/**
 * M7 (C.21): Michelin por faixa. Econômico → nenhum (os dados não têm Bib Gourmand); Conforto → só 1★;
 * Luxo → 2–3★. Sem queda entre faixas: cidade sem estrela da faixa = nenhum Michelin injetado.
 */
export function michelinForTier(city: string, level: PriceLevel): MichelinRestaurant[] {
  if (level === 'budget') return [];
  const all = getTopMichelinForCity(city, Infinity);
  return level === 'luxury' ? all.filter((m) => m.stars >= 2) : all.filter((m) => m.stars === 1);
}

const isCatalogMichelin = (a: { name: string; tips?: string[] }) =>
  /michelin/i.test(a.name) || (a.tips ?? []).some((t) => /michelin/i.test(t));

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
      // C.5c (D2): transport conta — transfer com custo é gasto do dia (Roteiro = razão = tile).
      if (['flight', 'hotel', 'checkin', 'checkout'].includes(act.type)) return;
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
  travelers: number = 1,
  /** M20: com pax, ingresso (EXP) = × adultos; refeição segue × travelers. Sem pax, comportamento de sempre. */
  pax?: Pick<Pax, 'adults' | 'children' | 'infants'>
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
  const isTicket = !!pax && ['morning', 'afternoon', 'night'].includes(activity.category) && (pax.children > 0 || pax.infants > 0);
  const payers = isTicket ? Math.max(1, pax!.adults) : travelers;
  const totalCost = activity.estimatedCostBRL * payers;
  const costLabel = isTicket && travelers > 1 ? ` (${paxLabel(pax!)})` : travelers > 1 ? ` (${travelers} pax)` : '';
  const kidTip = isTicket && pax!.children > 0
    ? `+ ${pax!.children} ${pax!.children === 1 ? 'criança' : 'crianças'}: ingresso infantil a confirmar`
    : null;

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
    tips: kidTip ? [...(activity.tips ?? []), kidTip] : activity.tips,
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

// ── C.3a: trocar atividade, logística e check-in pós-meia-noite (puros; a tela deriva, nada é gravado) ──

/** "HH:MM", ou "HH:MM (+1)" quando a soma cruza a meia-noite. */
export function nextDayClock(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const c = m % (24 * 60);
  const s = `${String(Math.floor(c / 60)).padStart(2, '0')}:${String(c % 60).padStart(2, '0')}`;
  return m >= 24 * 60 ? `${s} (+1)` : s;
}

/** Minutos de "HH:MM" (com "(+1)" = dia seguinte), −1 sem hora. */
function clockMinutes(t?: string): number {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]) + (/\(\+1\)/.test(String(t)) ? 24 * 60 : 0);
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** Estrada: arredonda a 30 min, mínimo 30 → "~30 min" · "~1h" · "~1h30". */
function roadClock(min: number): string {
  const m = Math.max(30, Math.round(min / 30) * 30);
  const h = Math.floor(m / 60);
  return h === 0 ? `~${m} min` : m % 60 ? `~${h}h${m % 60}` : `~${h}h`;
}

/** "~N min a pé" · "~N min de táxi" · "~1h de carro" (> 15 km) — travelMinutes. Sem coords numa ponta → nada. */
export function logisticsLine(prev: Coord | null | undefined, curr: Coord | null | undefined): string | undefined {
  if (!prev || !curr) return undefined;
  const t = travelMinutes(haversineKm(prev, curr));
  if (t.mode === 'walk') return `~${roundTo5(t.minutes)} min a pé`;
  if (t.mode === 'taxi') return `~${roundTo5(t.minutes)} min de táxi`;
  return `${roadClock(t.minutes)} de carro`;
}

type CoordItem = { id?: string; name?: string; type?: string; timeSlot?: string; location?: string };
const isCheckInOut = (item: CoordItem) => item.type === 'checkin' || item.type === 'checkout' || /check-?(in|out)/i.test(item.name ?? '');
/** Incluído no hotel (C.4.3): café/room service do hotel acontece no hotel. */
const isHotelIncluded = (item: CoordItem) =>
  /-slot-(quick-)?breakfast$/.test(item.id ?? '') || item.location === 'Hotel' || /no hotel|room service/i.test(item.name ?? '');

/**
 * Coordenada real de um item do roteiro: catálogo pelo id. Check-in/out pelo casamento do nome do hotel,
 * senão `hotel`; item incluído no hotel (café, room service) = `hotel`. Nunca a mediana.
 */
export function itemCoord(item: CoordItem | undefined, destination: string, hotel?: Coord | null): Coord | null {
  if (!item) return null;
  if (isCheckInOut(item)) return resolveHotelCoord(undefined, item.location, destination) ?? hotel ?? null;
  if (isHotelIncluded(item)) return hotel ?? null;
  if (item.timeSlot === 'flight' || item.type === 'flight' || /transfer|aeroporto/i.test(item.name ?? '')) return null;
  return curatedCoordOf(item.id);
}

/** Hotel da viagem por casamento real: o 1º check-in/out cuja `location` é um hotel curado (ou null). */
export function stayHotelCoord(days: { activities?: CoordItem[] }[] | undefined, destination: string): Coord | null {
  for (const d of days ?? []) {
    for (const a of d.activities ?? []) {
      if (!isCheckInOut(a)) continue;
      const c = resolveHotelCoord(undefined, a.location, destination);
      if (c) return c;
    }
  }
  return null;
}

// ── C.4: scheduler — o dia é uma sequência; a hora é calculada (R1–R12 no RELATORIO-C4) ──

/** R3: âncora (início mínimo) e início máximo por slot, em minutos. */
export const SLOT_RULES: Record<string, { anchor: number; max: number }> = {
  breakfast: { anchor: 8 * 60, max: 10 * 60 },
  morning: { anchor: 9 * 60 + 30, max: 11 * 60 + 30 },
  lunch: { anchor: 12 * 60 + 30, max: 14 * 60 + 30 },
  afternoon: { anchor: 15 * 60, max: 17 * 60 },
  dinner: { anchor: 19 * 60 + 30, max: 21 * 60 },
  night: { anchor: 21 * 60 + 30, max: 22 * 60 + 30 },
};
export const SUNSET_RULE = { anchor: 17 * 60 + 30, max: 18 * 60 + 30 };
/** Item da manhã que ocupa o dia (≥ 4 h, bate-volta): âncora 09:00. */
export const LONG_ITEM_MINUTES = 4 * 60;
/** M19d: ícone/essencial de 4–6 h pode ocupar a tarde inteira (sem noite, jantar perto do hotel). */
export const LONG_ICON_MAX_MINUTES = 6 * 60;
export const LONG_ITEM_ANCHOR = 9 * 60;
/** M6b: EXP curto da tarde após o item longo — duração máxima (h) e fim máximo (18:30). */
export const SHORT_ITEM_MAX_H = 2.5;
export const SHORT_AFTERNOON_END_MIN = 18 * 60 + 30;
/** Deslocamento sem coords numa ponta: 15 min, nunca zero. */
export const DEFAULT_HOP_MIN = 15;
/** Hotel ↔ aeroporto (o catálogo não tem coord de aeroporto). */
export const AIRPORT_HOP_MIN = 45;

/**
 * R11 no dinheiro: o check-out cai na véspera do voo de volta (transfer − 30 min < 00:00, mesma
 * conta do R10/R11 do layout)? Então a última noite não é dormida — fonte única da regra de noites.
 */
export function checkoutOnEve(returnDepTime: string | undefined, domestic: boolean): boolean {
  const dep = clockMinutes(returnDepTime);
  const transfer = (dep >= 0 ? dep : 14 * 60) - (domestic ? 2 : 3) * 60 - AIRPORT_HOP_MIN;
  return Math.min(transfer - 30, 12 * 60) < 0;
}
/** Máximo do jantar no dia de chegada (D5). */
export const ARRIVAL_DINNER_MAX = 22 * 60;
export const LUNCH_ON_SITE_TIP = 'Almoço no local';
export const LUGGAGE_TIP = 'Malas na guarda do hotel até o transfer';
/** R8: "Descanso para regular o sono" não é item — é a dica do jantar. */
export const REST_DINNER_TIP = 'Jantar leve e cedo: evite álcool e tente dormir no horário local';
const SUNSET_RE = /(p[ôo]r do sol|sunset)/i;

export interface LayoutItem {
  id: string;
  name: string;
  timeSlot?: string;
  type?: string;
  kind?: string;
  time?: string;
  duration?: string;
  tips?: string[];
  description?: string;
}
export interface LayoutOpts {
  destination: string;
  /** Hotel por casamento real: check-in/out e itens incluídos saltam dele (C.4.3). */
  hotelCoord?: Coord | null;
  /** Nada flexível começa antes disto (dia de chegada: pouso + 60 + 45 min). */
  startMin?: number;
  /** Máximo do jantar (dia de chegada: 22:00). */
  dinnerMax?: number;
  /** Itens cuja hora gravada é a âncora (item do usuário no replan). */
  anchorFromTime?: (item: LayoutItem) => boolean;
  index?: Map<string, SuggestedActivity>;
}

const kindOf = (a: LayoutItem) => a.type ?? a.kind;
const isFlightL = (a: LayoutItem) => a.timeSlot === 'flight' || kindOf(a) === 'flight';
const isCheckinL = (a: LayoutItem) => kindOf(a) === 'checkin' || /-slot-checkin$/.test(a.id) || /check-?in/i.test(a.name);
const isCheckoutL = (a: LayoutItem) => kindOf(a) === 'checkout' || /-slot-checkout$/.test(a.id) || /check-?out/i.test(a.name);
const isTransferL = (a: LayoutItem) => /transfer|aeroporto/i.test(a.name);
/** R2: voo, check-in, check-out e transfer têm hora própria. */
const isFixedL = (a: LayoutItem) => isFlightL(a) || isCheckinL(a) || isCheckoutL(a) || isTransferL(a) || a.timeSlot === 'hotel';
const MEAL_SLOT_SET = new Set(['breakfast', 'lunch', 'dinner']);

/**
 * Minutos de deslocamento: os de travelMinutes (logisticsLine; arredondados para cima a 5) com coords nas duas pontas;
 * senão 15. Saindo de um bate-volta, 15: a duração do catálogo já inclui a volta.
 */
export function hopMinutes(a: LayoutItem | null | undefined, b: LayoutItem | null | undefined, index?: Map<string, SuggestedActivity>, hotel?: Coord | null): number {
  const fromTrip = a && index ? catalogItemOf(a as PlanDayItem, index) : null;
  if (fromTrip && isDaytripTagged(fromTrip)) return DEFAULT_HOP_MIN;
  const at = (x: LayoutItem) => (isCheckInOut(x) || isHotelIncluded(x) ? hotel ?? null : curatedCoordOf(x.id));
  const ca = a ? at(a) : null;
  const cb = b ? at(b) : null;
  if (!ca || !cb) return DEFAULT_HOP_MIN;
  const raw = travelMinutes(haversineKm(ca, cb)).minutes;
  return Math.max(5, Math.ceil(raw / 5) * 5);
}

/** R5: catálogo pelo id → `duration` → defaults. */
export function layoutMinutesOf(a: LayoutItem, index: Map<string, SuggestedActivity>): number {
  if (isCheckinL(a) || isCheckoutL(a)) return 30;
  if (isTransferL(a) && !isFlightL(a)) return AIRPORT_HOP_MIN;
  const cat = catalogItemOf(a as PlanDayItem, index);
  if (cat && cat.durationHours) return Math.round(cat.durationHours * 60);
  const m = durationMinutesOf(a.duration);
  return m >= 0 ? m : defaultMinutesOf({ ...a, type: kindOf(a) } as PlanDayItem);
}

/** Dica na frente (é a que a tela mostra). A do bate-volta não some: as duas viram uma linha. */
function addTip<T extends LayoutItem>(item: T, tip: string): void {
  const first = item.tips?.[0] ?? '';
  if (first.includes(tip)) return;
  const line = first.startsWith('Bate-volta') ? `${first} · ${tip}` : tip;
  item.tips = first.startsWith('Bate-volta') ? [line, ...(item.tips ?? []).slice(1)] : [line, ...(item.tips ?? [])];
  if ('description' in item) item.description = line;
}

/** Fim de tarde (17:30): pôr do sol pelo nome ou lanche (tag `snack`) pelo id do catálogo. */
const isEveningL = (a: LayoutItem, index: Map<string, SuggestedActivity>) =>
  a.timeSlot === 'afternoon' && (SUNSET_RE.test(a.name) || isSnack(catalogItemOf(a as PlanDayItem, index)));

/** R7: quem sai primeiro quando uma refeição estoura — noite > pôr do sol/lanche > tarde > manhã. */
const sacrificeRank = (a: LayoutItem, index: Map<string, SuggestedActivity>) =>
  a.timeSlot === 'night' ? 0 : isEveningL(a, index) ? 1 : a.timeSlot === 'afternoon' ? 2 : a.timeSlot === 'morning' ? 3 : 4;

/**
 * O scheduler: recebe os itens NA ORDEM do dia e devolve as horas calculadas (R1–R9).
 * Fixos ficam; flexível começa em max(âncora, startMin, fim do anterior + deslocamento) e sai se
 * passar do máximo do slot ou não couber antes do próximo fixo. Refeição é protegida (R7).
 * Puro: devolve cópias; `dropped` traz o que não coube.
 */
export function layoutDay<T extends LayoutItem>(items: T[], opts: LayoutOpts): { items: T[]; dropped: T[] } {
  const index = opts.index ?? new Map(catalogFor(opts.destination).map((a) => [a.id, a]));
  const seq = items.map((a) => ({ ...a, tips: a.tips ? [...a.tips] : a.tips })) as T[];
  const dropped = new Set<T>();
  const mins = new Map<T, number>(seq.map((a) => [a, layoutMinutesOf(a, index)]));
  const isLong = (a: T) => a.timeSlot === 'morning' && (mins.get(a) ?? 0) >= LONG_ITEM_MINUTES;

  for (let guard = 0; guard <= seq.length; guard++) {
    let cursor = -Infinity;
    let prev: T | null = null;
    let restart = false;
    const live = seq.filter((a) => !dropped.has(a));
    for (let k = 0; k < live.length; k++) {
      const a = live[k];
      const own = clockMinutes(a.time);
      if (isFixedL(a)) {
        if (own >= 0) { cursor = Math.max(cursor, own + (mins.get(a) ?? 0)); prev = a; }
        continue;
      }
      const slot = a.timeSlot ?? '';
      const rule = isEveningL(a, index) ? SUNSET_RULE : SLOT_RULES[slot] ?? { anchor: 0, max: Infinity };
      const userAnchor = opts.anchorFromTime?.(a) && own >= 0;
      const anchor = userAnchor ? own : isLong(a) ? LONG_ITEM_ANCHOR : rule.anchor;
      const max = userAnchor ? Infinity : slot === 'dinner' && opts.dinnerMax ? opts.dinnerMax : rule.max;
      const start = Math.max(anchor, opts.startMin ?? -Infinity, prev ? cursor + hopMinutes(prev, a, index, opts.hotelCoord) : -Infinity);
      const end = start + (mins.get(a) ?? 0);
      const nextFixed = live.slice(k + 1).find((x) => isFixedL(x) && clockMinutes(x.time) >= 0);
      const fits = start <= max && (!nextFixed || end + hopMinutes(a, nextFixed, index, opts.hotelCoord) <= clockMinutes(nextFixed.time));
      if (fits) {
        a.time = nextDayClock(start);
        cursor = end;
        prev = a;
        continue;
      }
      if (slot === 'lunch' || slot === 'dinner') {
        // R7: refeição protegida. Item longo empurrando o almoço → o almoço sai, com a dica no longo.
        const before = live.slice(0, k);
        const lastMeal = before.map((x) => MEAL_SLOT_SET.has(x.timeSlot ?? '')).lastIndexOf(true);
        const pushers = before.slice(lastMeal + 1).filter((x) => !isFixedL(x) && !MEAL_SLOT_SET.has(x.timeSlot ?? ''));
        const long = slot === 'lunch' ? pushers.find(isLong) : undefined;
        if (long) {
          const pair = catalogIdOf(a.id) === `${catalogIdOf(long.id)}-almoco`;
          addTip(long, pair ? `${LUNCH_ON_SITE_TIP}: ${a.name}` : LUNCH_ON_SITE_TIP);
          dropped.add(a);
        } else if (pushers.length > 0) {
          const out = [...pushers].sort((x, y) => sacrificeRank(x, index) - sacrificeRank(y, index) || before.indexOf(y) - before.indexOf(x))[0];
          dropped.add(out);
        } else dropped.add(a);
        restart = true;
        break;
      }
      dropped.add(a);
      restart = true;
      break;
    }
    if (!restart) break;
  }
  return { items: seq.filter((a) => !dropped.has(a)), dropped: seq.filter((a) => dropped.has(a)) };
}

export interface SwapCandidate {
  activity: SuggestedActivity;
  hours: number;
  /** "interesse: gastronomia · cabe" ou "mesmo horário · cabe · perto de X". */
  why: string;
}

/**
 * Alternativas do catálogo para o ↻ de um item: mesma cidade, mesma categoria, fora do que a viagem já
 * usa, com a duração PRÓPRIA. Só entra o que cabe: (a) o scheduler (layoutDay) com a troca feita não
 * derruba a candidata nem nenhum item que o dia mantinha (C.4); (b) R16 do dia com a troca — ou a
 * troca não piora (candidata ≤ item atual); no dia da chegada, o slot não começa antes do pouso. Máx. 6.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function swapCandidates(trip: any, dayIndex: number, itemId: string): SwapCandidate[] {
  const days: PlanDay[] = Array.isArray(trip?.days) ? trip.days : [];
  const day = days[dayIndex];
  const item = day?.activities?.find((a) => a.id === itemId);
  const slot = item?.timeSlot;
  if (!day || !item || !slot || slot === 'flight' || slot === 'hotel') return [];
  const ctx = rulesContextOf(trip);
  const pool = catalogFor(ctx.destination);
  const index = new Map(pool.map((a) => [a.id, a]));

  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  days.forEach((d) => (d.activities ?? []).forEach((a) => {
    usedIds.add(catalogIdOf(a.id));
    usedNames.add(normalizePlaceName(a.name));
  }));

  // Horas do item atual como o R16 conta; manual sem duração = 1h30.
  const cur = catalogItemOf(item, index);
  const curParsed = String(item.duration ?? '').match(/(\d+(?:[.,]\d+)?)\s*h/);
  const curHours = cur ? cur.durationHours || 0 : curParsed ? parseFloat(curParsed[1].replace(',', '.')) : 1.5;

  // Dia da chegada: o slot não começa antes do pouso.
  const pos = day.activities.findIndex((a) => a.id === item.id);
  const arrivalIdx = ctx.arrivalDate ? days.findIndex((d) => String(d.date ?? '').slice(0, 10) === ctx.arrivalDate) : -1;
  const isArrival = dayIndex === (arrivalIdx >= 0 ? arrivalIdx : 0);
  const arr = clockMinutes(ctx.arrivalTime);
  if (isArrival && arr >= 0 && clockMinutes(item.time) >= 0 && clockMinutes(item.time) < arr) return [];

  // "Cabe" (C.4) = o scheduler com a candidata no lugar não derruba nada que o dia mantinha.
  const stay = stayHotelCoord(days, ctx.destination);
  const layoutOpts: LayoutOpts = {
    destination: ctx.destination,
    hotelCoord: stay,
    index,
    ...(isArrival && arr >= 0 ? { startMin: arr + 60 + AIRPORT_HOP_MIN, dinnerMax: ARRIVAL_DINNER_MAX } : {}),
  };
  const kept = new Set(layoutDay(day.activities, layoutOpts).items.map((a) => a.id));
  kept.delete(item.id);

  const neighbors = [day.activities[pos - 1], day.activities[pos + 1]]
    .map((a) => ({ a, c: itemCoord(a, ctx.destination, stay) }))
    .filter((n): n is { a: PlanDayItem; c: Coord } => !!n.c);

  const { used } = splitInterests(ctx.destination, trip?.travelInterests ?? trip?.interests);
  const top2 = used.slice(0, 2);

  // R18: só o que existe no dia da semana deste dia.
  const weekday = weekdayOf(day.date);
  // M18b: nem fechado por fechamento sazonal nesta data.
  const closedToday = unavailableIdsOnDate(ctx.destination, day.date as string | Date);

  const fits = (a: SuggestedActivity): boolean => {
    if (weekday >= 0 && !opensOn(a.id, weekday)) return false;
    if (closedToday.has(a.id)) return false;
    const h = a.durationHours || 0;
    const swapped = { id: `day-${dayIndex}-${a.id}`, name: a.name, time: item.time, timeSlot: slot, type: item.type, duration: `${h}h` };
    const acts = day.activities.map((x) => (x.id === item.id ? swapped : x));
    const laid = new Set(layoutDay(acts, layoutOpts).items.map((x) => x.id));
    if (!laid.has(swapped.id) || [...kept].some((id) => !laid.has(id))) return false;
    if (h <= curHours) return true;
    const next = days.map((d, i) => (i !== dayIndex ? d : { ...d, activities: acts }));
    const u = dayWindowUsage(next, ctx, dayIndex, [], index);
    return !u || u.used <= u.window;
  };

  return pool
    .filter((a) => a.category === slot && !usedIds.has(a.id) && !usedNames.has(normalizePlaceName(a.name)) && fits(a))
    .map((a) => {
      const interest = top2.find((p) => matchesPriority({ category: a.category, styleTags: a.styleTags ?? [] }, p));
      const c = curatedCoordOf(a.id);
      let km = Infinity;
      let near: string | undefined;
      for (const n of neighbors) {
        const d = c ? haversineKm(c, n.c) : Infinity;
        if (d < km) { km = d; near = n.a.name; }
      }
      const why = [interest ? `interesse: ${interestLabel(interest).toLowerCase()}` : 'mesmo horário', 'cabe',
        km <= 1.2 && near ? `perto de ${near}` : null].filter(Boolean).join(' · ');
      return { activity: a, hours: a.durationHours || 0, why, rank: interest ? 0 : 1, km };
    })
    .sort((x, y) => x.rank - y.rank || x.km - y.km || x.activity.estimatedCostBRL - y.activity.estimatedCostBRL)
    .slice(0, 6)
    .map(({ activity, hours, why }) => ({ activity, hours, why }));
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
  hotel?: EngineHotel,
  /** M20: adultos/crianças/bebês. Ingresso × adultos; criança limita o Michelin a 1× no almoço. Ausente = como antes. */
  pax?: Pick<Pax, 'adults' | 'children' | 'infants'>,
  /** Interno (M19c): pré-passe que gera o dia ideal ignorando o dia da semana. Não usar de fora. */
  _dry?: { ignoreWeekdays?: boolean }
): { days: ItineraryDay[]; breakdown: BudgetBreakdown; meta: { michelinCount: number; hotelNights: number; checkoutOnEve: boolean; thinDays: { day: number; reason: string }[]; lightEve: boolean } } {
  const totalDays = differenceInDays(returnDate, departureDate) + 1;
  const domestic = typeof returnFlight.international === 'boolean'
    ? !returnFlight.international
    : findCityInfo(destination)?.region === 'Brasil';
  // R11: saída de madrugada = check-out na véspera → uma noite a menos (C.4.1).
  const nightsOnEve = checkoutOnEve(returnFlight.option.departureTime, domestic);
  const totalNights = Math.max(0, totalDays - 1 - (nightsOnEve ? 1 : 0));
  
  // Prefer the user-chosen budget tier; only recalculate when none was provided
  const priceLevel: PriceLevel = priceLevelProp ?? findBestPriceLevel(destination, totalDays, travelers, budget).level;
  // M20c: aérea cobra adultos + crianças; bebê de colo fica de fora. Sem bebê, = travelers (idêntico a antes).
  const flightPayers = pax && pax.infants > 0 ? Math.max(1, travelers - pax.infants) : travelers;
  const flightPaxTag = flightPayers > 1 ? (flightPayers === travelers ? ` (${travelers} pax)` : ` (${flightPayers} pagantes)`) : '';

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
  // hero card uses. Outbound and return line items each carry their own leg × travelers.
  const plannedFlightTotalPerPerson = outboundLegPrice + returnLegPrice;
  const flightsCost = plannedFlightTotalPerPerson * flightPayers;
  
  // Hotel is SHARED (not multiplied by travelers)
  // C.4.2: diária de fonte única — a da viagem; o motor não estima diária.
  const hotelPerNight = Math.round(Number(hotel?.nightlyRate) || 0);
  const hotelTotal = hotelPerNight * totalNights;
  const nightsTip = hotelPerNight > 0
    ? [`${totalNights} noites (~R$ ${hotelPerNight.toLocaleString('pt-BR')}/noite)`, 'Custo já incluso no total da hospedagem']
    : [];
  
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

  // M6: noite e compras só entram com interesse explícito (a tag de um item não vira interesse do usuário).
  const wantsNightlife = travelInterests.some((ti) => /noturna|noite|nightlife/i.test(ti));
  const wantsShopping = travelInterests.some((ti) => /shopping|compras/i.test(ti));
  // M6c+: com gastronomia nos interesses o restaurante É o passeio — qualidade decide a refeição dentro da faixa de 4 km.
  const wantsGastro = travelInterests.some((ti) => /gastronom/i.test(ti));
  // M6: tier de paisagem (icon/essential) como critério de escolha, antes da ordenação do pickActivity.
  const tiers = tiersOf(destination);
  const isTierEssential = (id: string) => tiers[id] === 'icon' || tiers[id] === 'essential';
  let iconPlaced = false;
  let essentialsPlaced = 0;
  const releasedIcons = new Set<string>();

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

  // R18: o item existe no dia da semana do dia sendo montado.
  // M18b: fechamento sazonal (seasonalNotes.closedIds) governa o dia pelo mesmo caminho; o pré-passe seco gera o dia ideal
  // (sem dia da semana e sem fechamento) e o M19c reserva o ícone/essencial/âncora para o dia aberto mais próximo.
  const closedCache = new Map<number, Set<string>>();
  const closedOnIdx = (id: string, i: number) => {
    if (!closedCache.has(i)) closedCache.set(i, unavailableIdsOnDate(destination, addDays(departureDate, i)));
    return closedCache.get(i)!.has(id);
  };
  const opensToday = (a: SuggestedActivity) => !!_dry?.ignoreWeekdays || (opensOn(a.id, addDays(departureDate, currentPickDayIndex).getDay()) && !closedOnIdx(a.id, currentPickDayIndex));
  const opensIdx = (id: string, i: number) => opensOn(id, addDays(departureDate, i).getDay()) && !closedOnIdx(id, i);
  // M18b: o slot (manhã/tarde) ficou vazio e havia item inédito da categoria cortado só pelo fechamento de hoje → 'feriado'.
  const closedCutToday = (category: 'morning' | 'afternoon') =>
    pool.some((a) => a.category === category && !isPairMeal(a) && closedOnIdx(a.id, currentPickDayIndex) && !usedPlaces.isUsed(a.name));

  // M19c: item fechado no dia troca de dia em vez de sumir. Pré-passe: gera o dia ideal (sem dia da semana);
  // ícone/essencial/âncora de bate-volta que caiu em dia fechado fica RESERVADO para o dia de exploração aberto
  // mais próximo (o anterior; sem anterior, o seguinte). Daí em diante é o primeiro da fila (reservedNow).
  // Não fura o `force` do ícone nem as regras do bate-volta (daytripOk: cota, véspera, jet lag, dia colado).
  const reserve = new Map<string, number>();
  if (!_dry) {
    const dry = generateItinerary(departureDate, returnDate, destination, origin, outboundFlight, returnFlight, budget, travelers, travelInterests, jetLagSeverity, priceLevelProp, hotel, pax, { ignoreWeekdays: true });
    const exIdx: number[] = [];
    for (let j = explorationStart; j <= totalDays - 2; j++) exIdx.push(j);
    dry.days.forEach((d, j) => {
      if (d.label !== 'Exploração') return;
      for (const a of d.activities) {
        const id = catalogIdOf(a.id);
        const sug = pool.find((p) => p.id === id);
        if (!sug || !(sug.category === 'morning' || sug.category === 'afternoon') || opensIdx(id, j)) continue;
        if (!(isTierEssential(id) || isDaytripAnchor(sug))) continue;
        const before = exIdx.filter((k) => k < j && opensIdx(id, k));
        const after = exIdx.filter((k) => k > j && opensIdx(id, k));
        const t = before.length ? before[before.length - 1] : after[0];
        if (t !== undefined) reserve.set(id, t);
      }
    });
  }
  const reservedNow = (a: SuggestedActivity) => reserve.has(a.id) && currentPickDayIndex >= reserve.get(a.id)!;

  const hotelCoord = engineHotelCoord(destination, hotel?.label ?? getHotelRecommendation(destination, priceLevel, travelInterests)?.name);
  // C.4.3: o scheduler salta do hotel só por casamento real (a mediana do engineHotelCoord fica no pick).
  const stayCoord = resolveHotelCoord(undefined, hotel?.label ?? getHotelRecommendation(destination, priceLevel, travelInterests)?.name, destination);

  const themeStyleMap: Record<string, string[]> = {
    'Cultura': ['culture', 'history', 'art'],
    'Gastronomia': ['gastronomy'],
    'Passeios': ['nature', 'romantic', 'shopping'],
    'Aventura': ['adventure', 'nature'],
    'Descobertas': ['culture', 'art'],
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
    /** M6c+: refeição de dia de exploração. Faixa `band` km da referência (`alt`: ou do hotel); `chain`: a outra ponta
     *  da corrente, sempre ≤ maxHop (R15). Com gastronomia: Michelin do catálogo → rating → km decidem dentro da faixa. */
    meal?: { band: number; ref: Coord | null; alt?: Coord | null; chain?: Coord | null };
    /** Âncora do dia: prefere quem tem almoço inédito a ≤ maxHop (dia que fecha a corrente). */
    anchor?: boolean;
    /** M6: dia de exploração — prefere esses tiers (dentro do salto; `force` ignora o salto) e conta o que sai.
     *  M19g: `mustSeeDue` = obrigatórios cujo último dia aberto é hoje (force próprio; não fura o `force` do ícone). */
    tierPlan?: TierPlan;
  }
  type TierPlan = { tiers: Set<LandmarkTier>; force: boolean; fits: (a: SuggestedActivity) => boolean; mustSeeDue?: Set<string> };

  // M6: o que o dia de exploração `n` pede ao tier. icon até sair um (força no último dia se ainda não saiu);
  // icon|essential nos 3 primeiros dias de exploração até 4 essenciais, em viagem com ≥ 3 dias (preferência).
  const explorationTotal = Math.max(0, totalDays - 1 - explorationStart);
  const minHours = (cat: string) => Math.min(...pool.filter((a) => a.category === cat && !isPairMeal(a)).map((a) => a.durationHours || 1), 3);
  const mealReserve = minHours('lunch') + minHours('dinner') + 2 * HOP_HOURS;
  // M19c: o `force` do ícone vale no ÚLTIMO dia de exploração em que algum ícone da cidade abre (não por posição).
  const forceN = (() => {
    const icons = Object.keys(tiers).filter((id) => tiers[id] === 'icon');
    for (let n = explorationTotal - 1; n >= 0; n--) if (!icons.length || icons.some((id) => opensIdx(id, explorationStart + n))) return n;
    return explorationTotal - 1;
  })();
  // M19g: obrigatório (must_see, essencial do catálogo) ainda fora do roteiro tem `force` próprio no ÚLTIMO dia de
  // exploração em que abre — fora da cota de 4 essenciais e do n < 3. Fora do pré-passe seco (o mapa da reserva
  // M19c fica como era) e fora do item já reservado: a reserva é dona dele. Só em estadia com ≥ 4 dias de exploração
  // (o mesmo piso do R17 OBRIGATÓRIO): abaixo disso as poucas manhãs ficam com ícone, essencial e bate-volta.
  const mustSeeOn = (id: string) => !_dry && explorationTotal >= MUST_SEE_MIN_DAYS && isMustSee(id) && !reserve.has(id);
  const mustSeePool = pool.filter((a) => mustSeeOn(a.id) && tiers[a.id] === 'essential');
  const mustSeeLastOpen = new Map(mustSeePool.map((a) => {
    let last = -1;
    for (let n = explorationTotal - 1; n >= 0 && last < 0; n--) if (opensIdx(a.id, explorationStart + n)) last = n;
    return [a.id, last] as const;
  }));
  const tierPlanFor = (n: number, hoursUsed: () => number): TierPlan => {
    const want = new Set<LandmarkTier>();
    const mustSeeDue = new Set(mustSeePool.filter((a) => mustSeeLastOpen.get(a.id) === n && !usedPlaces.isUsed(a.name)).map((a) => a.id));
    if (mustSeeDue.size) want.add('essential');
    if (!iconPlaced) want.add('icon');
    if (explorationTotal >= ESSENTIALS_MIN_DAYS && n >= 0 && n < 3 && essentialsPlaced < 4) { want.add('icon'); want.add('essential'); }
    // Cabe = o que já está no dia + o item + almoço e jantar (os menores) + saltos ≤ janela; senão a janela o cortaria.
    // M19d-fix: vale também para o ícone longo (4–6 h) — janela real; se não cabe hoje, fica para forceN / outro dia.
    const fits = (a: SuggestedActivity) => hoursUsed() + HOP_HOURS + (a.durationHours || 0) + mealReserve <= EXPLORATION_WINDOW_HOURS;
    return { tiers: want, force: !iconPlaced && n === forceN, fits, mustSeeDue };
  };

  // M7: Michelin do catálogo governado por preço, não por rótulo. Econômico nunca; Conforto no jantar só
  // até 2× o ticket médio do jantar da faixa (acima disso, só almoço); Luxo livre.
  const dinnerTicket = getActivityPrice('restaurant_dinner', destination, priceLevel);
  // Michelin do catálogo, governado por preço: Econômico (qualquer refeição) e Conforto acima de 2× o ticket
  // no jantar vão para o ÚLTIMO da fila. Não somem: o pool da categoria tem que esgotar antes de qualquer
  // repetição (trava do gerador, generatorNoRepeat), então só entram quando não resta outro lugar inédito.
  const michelinOverCap = (a: SuggestedActivity, category: string) =>
    isCatalogMichelin(a) && (priceLevel === 'budget' ||
      (priceLevel === 'midrange' && category === 'dinner' && (a.estimatedCostBRL || 0) > 2 * dinnerTicket));

  // M20: com criança, Michelin só no almoço e 1× na viagem (injetado + catálogo). Para todos: nunca 2 Michelin
  // no mesmo dia. `michelinByDay` conta o que já foi escolhido/posto em cada dia; `catalogMichelinTrip`, o do catálogo.
  const kids = (pax?.children ?? 0) > 0;
  const michelinByDay = new Map<number, number>();
  let catalogMichelinTrip = 0;
  const bumpDayMichelin = (day: number) => michelinByDay.set(day, (michelinByDay.get(day) ?? 0) + 1);
  const michelinBlocked = (a: SuggestedActivity, category: string) =>
    isCatalogMichelin(a) && ((michelinByDay.get(currentPickDayIndex) ?? 0) > 0 ||
      (kids && (category !== 'lunch' || michelinCount + catalogMichelinTrip >= 1)));

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
    // M6: ícone cortado pela janela volta ao pool (nunca chegou ao roteiro).
    const isFresh = (a: SuggestedActivity) => !usedPlaces.isUsed(a.name) || releasedIcons.has(a.id);

    // Bate-volta só entra como âncora explícita; seus pares só junto dele.
    const eligible = (a: SuggestedActivity) => {
      if (isPairMeal(a) || !opensToday(a) || michelinBlocked(a, category)) return false;
      if (isDaytripAnchor(a)) return !!opts.daytripOk?.(a);
      // M6: compras não ocupam slot de passeio sem interesse de compras (ícone/essencial passam).
      if (isExp && !wantsShopping && (a.styleTags ?? []).includes('shopping') && !isTierEssential(a.id)) return false;
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
        pool.filter(a => a.category === category && !isPairMeal(a) && !isDaytripTagged(a) && opensToday(a) && !michelinBlocked(a, category)),
        usedPlaces,
        currentPickDayIndex,
        category
      );
      if (candidates.length === 0) return null;
      forcedReuse = true;
    }

    if (candidates.length === 0) return null;
    if (!forcedReuse) {
      // Ordem: dentro do salto > interesse (só quando a cota pede) > dia certo (R18) > tema > preço do tier.
      // R17 (essenciais) é só validador: o motor volta a usá-lo depois de o essencial ser redefinido por dado (B.3.2).
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
        if (opts.meal) {
          // Salto da cidade (R15) continua o primeiro critério; a faixa da refeição (bandKey) vem depois do dia raro (R18).
          const { ref, chain } = opts.meal;
          if (!ref) return 0;
          const far = Math.max(haversineKm(ref, c), chain ? haversineKm(chain, c) : 0);
          return far <= maxHop ? 0 : 1 + far;
        }
        const km = Math.max(haversineKm(opts.near, c), opts.alsoNear ? haversineKm(opts.alsoNear, c) : 0);
        return km <= nearKm ? 0 : 1 + km;
      };
      // Cota: interesse sempre na frente do tema enquanto houver um dentro do salto. Medido no smoke,
      // isto rende mais que alternar em 50–75 % — o estoque de interesse por cidade é que limita.
      const wantInterest = !!opts.quota && top2.length > 0;
      const interestKey = (a: SuggestedActivity) => (wantInterest && !matchesTop2(a) ? 1 : 0);
      // C.4.3: item com dia da semana no catálogo que chegou aqui abre HOJE (opensToday) — é o dia dele.
      // Por especificidade, só para itens realmente raros (≤ 3 dias por semana): menos dias = encaixado antes.
      // "Fecha um dia" (4–6 dias) não é urgência e vale igual a sem restrição (7) — senão passa na frente de
      // ícone/interesse. Fortaleza: "só quinta" (1 dia) tem que vencer o resto na quinta.
      const weekdayKey = (a: SuggestedActivity) => {
        const n = CURATED_DAYS_OF_WEEK[a.id]?.length;
        return n && n <= 3 ? n : 7;
      };
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
      // M6c+: com gastronomia, dentro da faixa a qualidade decide (Michelin do catálogo → rating); km só desempata.
      const qualityMeal = !!opts.meal && wantsGastro;
      // Faixa da refeição: 0 dentro dela (referência ou, no jantar sem gastronomia, o hotel); fora, a distância (o mais perto vence).
      const bandKey = (a: SuggestedActivity) => {
        const m = opts.meal, c = curatedCoordOf(a.id);
        if (!m || !m.ref || !c) return 0;
        const km = m.alt ? Math.min(haversineKm(m.ref, c), haversineKm(m.alt, c)) : haversineKm(m.ref, c);
        return km <= m.band ? 0 : km;
      };
      const mealKm = (a: SuggestedActivity) => {
        const c = curatedCoordOf(a.id);
        const ref = opts.meal?.ref;
        return c && ref ? haversineKm(ref, c) : 0;
      };
      const keyed = candidates.map((a) => ({ a, k: [reservedNow(a) ? 0 : 1, michelinOverCap(a, category) ? 1 : 0, hopKey(a),
        opts.meal ? weekdayKey(a) : 0, bandKey(a), qualityMeal && !isCatalogMichelin(a) ? 1 : 0, qualityMeal ? -(a.rating || 0) : 0, qualityMeal ? mealKm(a) : 0, interestKey(a), weekdayKey(a), themeKey(a), dualKey(a), priceKey(a)] }));
      keyed.sort((x, y) => {
        for (let j = 0; j < x.k.length; j++) if (x.k[j] !== y.k[j]) return x.k[j] - y.k[j];
        return 0;
      });
      candidates = keyed.map((x) => x.a);
      // M6: tier como critério — restringe o conjunto já ordenado (a ordem segue a de sempre). Exceção: pôr do sol
      // ou lanche na frente da fila continua mandando; é ele que vira o item de fim de tarde (17:30).
      // M19c: reservado na frente da fila → o tier não o desloca (salvo `force`).
      if (opts.tierPlan && opts.tierPlan.tiers.size > 0 && (opts.tierPlan.force || !reservedNow(candidates[0]))) {
        const want = opts.tierPlan.tiers;
        let byTier = candidates.filter((a) => tiers[a.id] && want.has(tiers[a.id]) && opts.tierPlan!.fits(a) && (opts.tierPlan!.force || hopKey(a) === 0));
        // M6-fix: ícone ainda não encaixado passa na frente dos essenciais (sort estável preserva a ordem geral);
        // com `force` (último dia de exploração sem ícone, vale desde a manhã) restringe ao tier icon se houver.
        if (want.has('icon') && !iconPlaced) {
          const icons = byTier.filter((a) => tiers[a.id] === 'icon');
          if (icons.length) byTier = opts.tierPlan.force ? icons : [...icons, ...byTier.filter((a) => tiers[a.id] !== 'icon')];
        }
        // M19g: entre os essenciais, o obrigatório (must_see) vem primeiro, por rating; o ícone pendente segue na frente.
        const ms = byTier.filter((a) => tiers[a.id] === 'essential' && mustSeeOn(a.id)).sort((x, y) => (y.rating || 0) - (x.rating || 0));
        if (ms.length) {
          const head = byTier.filter((a) => tiers[a.id] === 'icon' && !iconPlaced);
          byTier = [...head, ...ms, ...byTier.filter((a) => !head.includes(a) && !ms.includes(a))];
        }
        // M19g: hoje é o último dia aberto de um obrigatório ainda fora → só ele (ignora o salto, respeita a janela).
        if (!opts.tierPlan.force && opts.tierPlan.mustSeeDue?.size) {
          const due = candidates.filter((a) => opts.tierPlan!.mustSeeDue!.has(a.id) && opts.tierPlan!.fits(a)).sort((x, y) => (y.rating || 0) - (x.rating || 0));
          if (due.length) byTier = due;
        }
        const first = candidates[0];
        const lateSlot = /(p[ôo]r do sol|sunset)/i.test(first.name) || isSnack(first);
        if (byTier.length && !(lateSlot && !byTier.includes(first))) candidates = byTier;
      }
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
    if (isCatalogMichelin(picked)) { bumpDayMichelin(currentPickDayIndex); catalogMichelinTrip++; }
    if (opts.tierPlan && isExp && isTierEssential(picked.id)) {
      essentialsPlaced++;
      if (tiers[picked.id] === 'icon') iconPlaced = true;
    }
    return picked;
  }

  // Jantar do dia de chegada: perto do hotel e, se der, curto o bastante para a janela chegada → 22 h.
  function pickArrivalDinner(): SuggestedActivity | null {
    // M7: nunca Michelin (pelo nome; a dica 'estrela acessível' do Septime fica, decisão do fundador) e ≤ 2× o ticket
    // médio da faixa; se nada passar, cai sem o teto de preço (mas sem Michelin).
    const plain = (a: SuggestedActivity) => !/michelin/i.test(a.name);
    const cheap = (a: SuggestedActivity) => plain(a) && (a.estimatedCostBRL || 0) <= 2 * dinnerTicket;
    const free = (a: SuggestedActivity) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a);
    const fits = (a: SuggestedActivity) => (a.durationHours || 0) <= arrivalWindow;
    // M6b: a distância ao hotel manda na frente do preço — ≤ 1 km, depois ≤ 2 km, depois o mais próximo.
    return pickNearHotelDinner([(a) => cheap(a) && fits(a), cheap, (a) => plain(a) && fits(a), plain]);
  }

  /** M6b: jantar perto do hotel. Para cada raio (1 km, 2 km) e cada filtro (do mais ao menos exigente), o primeiro com candidato
   *  inédito vence; sem coordenada do hotel ou sem ninguém a ≤ 2 km, pickActivity ordena pelo mais próximo. */
  function pickNearHotelDinner(filters: Array<(a: SuggestedActivity) => boolean>): SuggestedActivity | null {
    const free = (a: SuggestedActivity) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && opensToday(a);
    const within = (km: number) => (a: SuggestedActivity) => {
      const c = curatedCoordOf(a.id);
      return !!hotelCoord && !!c && haversineKm(hotelCoord, c) <= km;
    };
    if (hotelCoord) {
      for (const km of [1, 2]) {
        for (const f of filters) {
          const accept = (a: SuggestedActivity) => f(a) && within(km)(a);
          if (pool.some((a) => free(a) && accept(a))) return pickActivity('dinner', 'Gastronomia', { near: hotelCoord, nearKm: km, accept });
        }
      }
    }
    return pickActivity('dinner', 'Gastronomia', { near: hotelCoord, nearKm: 1, accept: filters[filters.length - 1] });
  }

  /** M6b: dica de distância do jantar ao hotel (transparência): "Perto do hotel" ≤ 2 km; acima, a distância real. */
  const nearHotelTip = (a: SuggestedActivity): string | null => {
    const c = curatedCoordOf(a.id);
    if (!hotelCoord || !c) return null;
    const km = haversineKm(hotelCoord, c);
    return km <= 2 ? 'Perto do hotel' : `Jantar mais próximo disponível: a ${km.toFixed(1).replace('.', ',')} km do hotel`;
  };

  /** M6c+: faixa da refeição — gastronomia 4 km; sem ela, almoço 1,5 km do passeio da manhã e jantar 2 km (tarde ou hotel). */
  const mealBand = (kind: 'lunch' | 'dinner') => (wantsGastro ? 4 : kind === 'lunch' ? 1.5 : 2);
  /** M6c+: transparência da escolha. Gastronomia: "~N min" quando > 1,5 km. Sem: a distância real quando fora da faixa. */
  const mealTip = (a: SuggestedActivity, kind: 'lunch' | 'dinner', refs: Array<{ label: string; c: Coord | null | undefined }>): string | null => {
    const c = curatedCoordOf(a.id);
    if (!c) return null;
    const ds = refs.filter((r) => !!r.c).map((r) => ({ label: r.label, km: haversineKm(r.c as Coord, c) }));
    if (ds.length === 0) return null;
    const best = ds.reduce((m, x) => (x.km < m.km ? x : m));
    if (wantsGastro) {
      if (best.km <= 1.5) return null;
      const min = Math.max(5, Math.ceil(travelMinutes(best.km).minutes / 5) * 5);
      return `~${min} min de deslocamento (${best.label}) — escolhido pela qualidade (gastronomia nos seus interesses)`;
    }
    if (best.km <= mealBand(kind)) return null;
    return `A ${best.km.toFixed(1).replace('.', ',')} km ${best.label} — nenhum restaurante mais perto disponível`;
  };
  const addMealTip = (act: ItineraryActivity, tip: string | null) => { if (tip) act.tips = [tip, ...(act.tips || [])]; };

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
  const lastWindow = lastDayWindowHours(returnFlight.option.departureTime, domestic);
  // R-V9: faixa da chegada. Antes de 14 h → tarde leve; 14–20 h → só jantar; depois de 20 h → nada.
  // Fuso desconhecido (R-V6) fica na tarde leve, como sempre.
  const arrivalBand = arrivalBandFor(arrivalHour);
  const hm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const arrivalMinutes = Math.round(arrivalHour * 60);
  // Check-in: hora de sempre na tarde leve; depois, 1 h após pousar ("00:35 (+1)" se cruza a meia-noite).
  const arrivalCheckinTime = (base: string) =>
    arrivalBand === 'afternoon' ? base : nextDayClock(arrivalMinutes + 60);
  // Jantar nunca antes de 1h30 após pousar.
  const arrivalDinnerTime = arrivalBand === 'dinner' ? hm(Math.max(19 * 60 + 30, arrivalMinutes + 90)) : '19:30';
  const NIGHT_ARRIVAL_TIP = 'Chegada noturna: descanse — o roteiro começa amanhã';
  // R12: no dia de chegada nada flexível começa antes de pouso + 60 min + aeroporto→hotel.
  const arrivalStartMin = arrivalHour >= 0 ? arrivalMinutes + 60 + AIRPORT_HOP_MIN : undefined;
  const layoutIndex = new Map(catalogFor(destination).map((a) => [a.id, a]));

  // R10/R11: último dia de trás pra frente. T = partida − 2 h/3 h; transfer = T − 45 min;
  // check-out = transfer − 30 min (teto 12:00, D1). Negativo = véspera (D2): vai para o penúltimo dia.
  const returnDepMin = clockMinutes(returnFlight.option.departureTime) >= 0 ? clockMinutes(returnFlight.option.departureTime) : 14 * 60;
  const lastTransferMin = returnDepMin - (domestic ? 2 : 3) * 60 - AIRPORT_HOP_MIN;
  const lastCheckoutMin = Math.min(lastTransferMin - 30, 12 * 60);
  const earlyExit = lastCheckoutMin < 6 * 60;
  const clockOf = (m: number) => hm(m < 0 ? m + 24 * 60 : m);
  const exitTip = lastTransferMin < 0
    ? `Saída ${clockOf(lastTransferMin)} — jantar leve antes do check-out`
    : `Saída ${clockOf(lastTransferMin)} — jantar leve, durma cedo`;
  const checkoutItem = (dayIdx: number, mins: number): ItineraryActivity => ({
    id: `day-${dayIdx}-slot-checkout`,
    name: 'Check-out do hotel',
    type: 'transport',
    timeSlot: 'morning',
    estimatedCost: 0,
    costPerPerson: 0,
    time: clockOf(mins),
    duration: '0.5h',
    status: 'suggestion',
    tips: [mins < 0 ? 'Voo de madrugada: saída do hotel na véspera' : 'Logística de saída — sem custo adicional'],
    source: 'kinu',
  });
  const transferItem = (dayIdx: number, mins: number): ItineraryActivity => ({
    id: `day-${dayIdx}-slot-transfer`,
    name: 'Transfer para Aeroporto',
    type: 'transport',
    timeSlot: 'afternoon',
    estimatedCost: transferCost,
    time: clockOf(mins),
    duration: '0.75h',
    status: 'suggestion',
    tips: [domestic ? 'No aeroporto 2h antes do voo doméstico' : 'No aeroporto 3h antes do voo internacional'],
    source: 'kinu',
  });

  let michelinCount = 0;
  let lastDaytripDay = -10;
  // M6b: cota de bate-volta (1 a cada 3 dias de exploração) e o registro de dias ralos (motivo de faltar EXP).
  const maxDaytrips = Math.floor(explorationTotal / 3);
  let daytripCount = 0;
  const jetLagHigh = jetLagSeverity === 'ALTO' || jetLagSeverity === 'SEVERO';
  const thinDays: { day: number; reason: string }[] = [];
  const LIGHT_EVE_END_MIN = 17 * 60;
  for (let i = 0; i < totalDays; i++) {
    currentPickDayIndex = i;
    // M6b: véspera de voo cedo (check-out < 06:00, que inclui voo < 09:00) = dia leve.
    const isEve = earlyExit && i === totalDays - 2;
    const thin = (reason: string) => { if (!thinDays.some((t) => t.day === i + 1 && t.reason === reason)) thinDays.push({ day: i + 1, reason }); };
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
      // Cada perna carrega o próprio preço × pax (nunca metade de ida+volta).
      const outboundCost = outboundLegPrice * flightPayers;
      activities.push({
        id: `day-${i}-slot-flight-out`,
        name: outboundFlight.source === 'estimate' ? 'Voo de Ida (estimado)' : 'Voo de Ida',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: outboundCost,
        costPerPerson: outboundLegPrice,
        time: outboundFlight.option.departureTime,
        duration: outboundFlight.option.duration,
        location: outboundFlight.option.route + flightPaxTag,
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
          estimatedCost: 0, costPerPerson: 0, time: arrivalCheckinTime('14:00'),
          location: (() => {
            if (hotel?.label) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'suggestion', source: 'kinu',
          tips: [
            ...(arrivalBand === 'night' ? [NIGHT_ARRIVAL_TIP] : []),
            ...nightsTip,
          ],
        });
        if (arrivalBand === 'afternoon') activities.push({
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
        const dinnerActivity = arrivalBand !== 'night' ? pickArrivalDinner() : null;
        if (dinnerActivity) {
          const act = convertToItineraryActivity(dinnerActivity, i, 'dinner', arrivalDinnerTime, travelers, pax);
          const nh = nearHotelTip(dinnerActivity);
          if (nh) act.tips = [nh, ...(act.tips || [])];
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
          time: arrivalCheckinTime('15:00'),
          duration: '0.5h',
          location: (() => {
            if (hotel?.label) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'defined',
          source: 'kinu',
          tips: [...(arrivalBand === 'night' ? [NIGHT_ARRIVAL_TIP] : []), 'Acomodação após o voo, sem pressa', ...nightsTip],
        });

        if (arrivalBand === 'afternoon') activities.push({
          id: `day-${i}-slot-walk`,
          name: 'Caminhada leve no bairro',
          type: 'experience',
          timeSlot: 'afternoon',
          estimatedCost: 0,
          costPerPerson: 0,
          time: '17:00',
          duration: '1.5h',
          location: destination,
          status: 'defined',
          source: 'kinu',
          tips: ['Conheça os arredores do hotel sem pressa', 'Ajuda a regular o relógio biológico'],
        });

        const lightDinner = arrivalBand !== 'night' ? pickArrivalDinner() : null;
        if (lightDinner) {
          const act = convertToItineraryActivity(lightDinner, i, 'dinner', arrivalDinnerTime, travelers, pax);
          const nh = nearHotelTip(lightDinner);
          act.tips = [REST_DINNER_TIP, ...(act.tips || []), ...(nh ? [nh] : [])];
          activities.push(act);
          dayTotal += act.estimatedCost;
        }

      } else {
        // Normal arrival day — check-in + light exploration
        activities.push({
          id: `day-${i}-slot-checkin`,
          name: 'Check-in no hotel',
          type: 'checkin',
          timeSlot: 'hotel',
          estimatedCost: 0,
          costPerPerson: 0,
          time: arrivalCheckinTime('14:00'),
          location: (() => {
            if (hotel?.label) return hotel.label;
            const rec = getHotelRecommendation(destination, priceLevel, travelInterests);
            if (rec) return `${rec.name} ⭐ ${rec.stars}.0 • ${rec.neighborhood}`;
            return `Hotel em ${destination}`;
          })(),
          status: 'suggestion',
          tips: [
            ...(arrivalBand === 'night' ? [NIGHT_ARRIVAL_TIP] : []),
            ...nightsTip,
          ],
          source: 'kinu',
        });

        if (arrivalBand === 'afternoon') activities.push({
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

        const dinnerActivity = arrivalBand !== 'night' ? pickArrivalDinner() : null;
        if (dinnerActivity) {
          const activity = convertToItineraryActivity(dinnerActivity, i, 'dinner', arrivalDinnerTime, travelers, pax);
          const nh = nearHotelTip(dinnerActivity);
          if (nh) activity.tips = [nh, ...(activity.tips || [])];
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
      const add = (act: ItineraryActivity) => { activities.push(act); dayTotal += act.estimatedCost; };
      const dur = (a: SuggestedActivity) => Math.round((a.durationHours || 0) * 60);
      const notLongDay = (a: SuggestedActivity) => a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half';

      if (!earlyExit) {
        // Café: do catálogo às 08:00 se o check-out é ≥ 09:00; senão café rápido 1 h antes do check-out.
        let cursor = 8 * 60;
        let prevItem: ItineraryActivity | null = null;
        const candidate = (a: SuggestedActivity) => ({ id: `day-${i}-${a.id}`, name: a.name });
        const startAfter = (a: SuggestedActivity, anchor: number) =>
          Math.max(anchor, cursor + (prevItem ? hopMinutes(prevItem, candidate(a), layoutIndex, stayCoord) : DEFAULT_HOP_MIN));
        if (lastCheckoutMin >= 9 * 60) {
          const breakfastActivity = pickActivity('breakfast', 'Gastronomia', { near: last });
          if (breakfastActivity) {
            prevItem = convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00', travelers, pax);
            add(prevItem);
            last = curatedCoordOf(breakfastActivity.id) ?? last;
            cursor = 8 * 60 + dur(breakfastActivity);
          }
        } else if (lastCheckoutMin >= 7 * 60 + 30) {
          add({
            id: `day-${i}-slot-quick-breakfast`,
            name: 'Café rápido no hotel',
            type: 'breakfast',
            timeSlot: 'breakfast',
            estimatedCost: 0,
            costPerPerson: 0,
            time: hm(lastCheckoutMin - 60),
            duration: '0.5h',
            status: 'suggestion',
            tips: ['Voo cedo: só café e check-out antes do aeroporto'],
            source: 'kinu',
          });
        }

        // Manhã: só o que termina (+ deslocamento) antes do check-out.
        const morningStart = Math.max(SLOT_RULES.morning.anchor, cursor + DEFAULT_HOP_MIN);
        const morningRoom = lastCheckoutMin - DEFAULT_HOP_MIN - morningStart;
        if (morningRoom >= 60) {
          const morningActivity = pickActivity('afternoon', 'Descobertas', {
            near: last,
            // M19e: fim de tarde/noite (pôr do sol, snack, night, "à noite") nunca ocupa a manhã do último dia.
            accept: (a) => notLongDay(a) && !isEveningItem(a) && startAfter(a, SLOT_RULES.morning.anchor) + dur(a) + DEFAULT_HOP_MIN <= lastCheckoutMin,
          });
          if (!morningActivity) {
            // Sem candidato após o filtro: espaço livre (nunca um item de fim de tarde).
            add(buildFreeSlotActivity(i, 'morning', '10:00'));
          } else {
            last = curatedCoordOf(morningActivity.id) ?? last;
            const activity = convertToItineraryActivity(morningActivity, i, 'morning', '10:00', travelers, pax);
            activity.tips = ['Aproveite as últimas horas!', ...(activity.tips || [])];
            add(activity);
          }
        }

        add(checkoutItem(i, lastCheckoutMin));
        prevItem = null; // do hotel: sem coord → deslocamento padrão

        // Depois do check-out (D1): almoço e tarde, se terminam (+ deslocamento) antes do transfer.
        let after = lastCheckoutMin + 30;
        const lunchStart = Math.max(SLOT_RULES.lunch.anchor, after + DEFAULT_HOP_MIN);
        if (lunchStart + 90 + DEFAULT_HOP_MIN <= lastTransferMin) {
          const lunchActivity = pickActivity('lunch', 'Gastronomia', {
            near: last,
            accept: (a) => lunchStart + dur(a) + DEFAULT_HOP_MIN <= lastTransferMin,
          });
          if (lunchActivity) {
            prevItem = convertToItineraryActivity(lunchActivity, i, 'lunch', '12:30', travelers, pax);
            add(prevItem);
            last = curatedCoordOf(lunchActivity.id) ?? last;
            after = lunchStart + dur(lunchActivity);
          }
        }
        const afternoonStart = Math.max(SLOT_RULES.afternoon.anchor, after + DEFAULT_HOP_MIN);
        const afternoonRoom = lastTransferMin - DEFAULT_HOP_MIN - afternoonStart;
        if (afternoonStart <= SLOT_RULES.afternoon.max && afternoonRoom >= 60) {
          cursor = after;
          const afternoonActivity = pickActivity('afternoon', 'Descobertas', {
            near: last,
            accept: (a) => {
              const st = startAfter(a, SLOT_RULES.afternoon.anchor);
              return notLongDay(a) && !isEveningItem(a) && st <= SLOT_RULES.afternoon.max && st + dur(a) + DEFAULT_HOP_MIN <= lastTransferMin;
            },
          });
          if (afternoonActivity) add(convertToItineraryActivity(afternoonActivity, i, 'afternoon', '15:00', travelers, pax));
        }
      } else if (lastCheckoutMin >= 0) {
        // R11: madrugada — o dia de volta só tem check-out, transfer e voo, com horas reais.
        add(checkoutItem(i, lastCheckoutMin));
      }

      if (lastTransferMin >= 0) add(transferItem(i, lastTransferMin));

      // Return flight
      const returnCost = returnLegPrice * flightPayers;
      activities.push({
        id: `day-${i}-slot-flight-back`,
        name: returnFlight.source === 'estimate' ? 'Voo de Volta (estimado)' : 'Voo de Volta',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: returnCost,
        costPerPerson: returnLegPrice,
        time: returnFlight.option.departureTime,
        duration: returnFlight.option.duration,
        location: returnFlight.option.route + flightPaxTag,
        status: 'defined',
        source: 'kinu',
        ...flightUnknownTips(returnFlight),
      });
      dayTotal += returnCost;
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
      // M6b: véspera leve não recebe o Michelin (jantar ≤ 1 km do hotel, sem noite); vai para outro dia gastronômico.
      const michelinList = isGastroDay && wantsGastronomy && michelinCount < 1 && !isEve && !(kids && catalogMichelinTrip > 0) && (michelinByDay.get(i) ?? 0) === 0 ? michelinForTier(destination, priceLevel) : [];
      if (isEve && isGastroDay && wantsGastronomy && michelinCount < 1 && michelinForTier(destination, priceLevel).length > 0) thin('michelin-fora-da-vespera');
      const michelinPending = priceLevel === 'luxury' && !kids && michelinList.length > 0;          // jantar 2–3★ (M20: com criança, almoço)
      const michelinLunchPending = (priceLevel === 'midrange' || (priceLevel === 'luxury' && kids)) && michelinList.length > 0;   // almoço (menu de almoço)

      // M7: almoço Michelin 1★ do Conforto (menu de almoço). Empurra no dia e conta no cap de 1 por viagem.
      const placeMichelinLunch = () => {
        const m = michelinList[0];
        // M20: Luxo com criança leva o 2–3★ para o almoço, com o preço da estrela (o do Conforto fica como era).
        const perPerson = priceLevel === 'luxury'
          ? Math.max(getActivityPrice('restaurant_dinner', destination, priceLevel) * ({ 1: 2.5, 2: 4.5, 3: 7 } as Record<number, number>)[m.stars], ({ 1: 850, 2: 1400, 3: 2200 } as Record<number, number>)[m.stars] || 850)
          : Math.max(dinnerTicket * 2.5, 850);
        const total = perPerson * travelers;
        activities.push({
          id: `day-${i}-michelin-${placeSlug(m.name)}`,
          name: `${m.name} ${'⭐'.repeat(m.stars)} Michelin`,
          type: 'lunch',
          timeSlot: 'lunch',
          estimatedCost: total,
          costPerPerson: perPerson,
          time: '13:00',
          duration: '2h',
          location: m.neighborhood || destination,
          status: 'defined',
          source: 'kinu',
          tips: [`Cozinha ${m.cuisine}`, 'Menu de almoço — mais acessível que o jantar', 'Reserve com 2-3 semanas de antecedência', 'Valor estimado por pessoa'],
        });
        dayTotal += total;
        michelinCount++;
        bumpDayMichelin(i);
      };

      // Corrente geográfica do dia: cada pick nasce perto da parada anterior com coordenada.
      let last: Coord | null = null;
      const place = (sug: SuggestedActivity, slot: ItineraryActivity['timeSlot'], time: string) => {
        const act = convertToItineraryActivity(sug, i, slot, time, travelers, pax);
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
      const daytripDayOk = lastDaytripDay < i - 1 && !michelinPending && !michelinLunchPending &&
        daytripCount < maxDaytrips && !isEve && !(i === explorationStart && jetLagHigh);

      // 🏛️ MORNING ACTIVITY (10:00) — âncora do dia; decide o formato do dia
      const morningActivity = pickActivity('morning', dayTheme.title, {
        quota: true,
        anchor: true,
        accept: (a) => !isEveningItem(a), // M19e: fim de tarde/noite nunca de manhã, em dia nenhum
        tierPlan: tierPlanFor(explorationDay, () => dayHoursUsed(activities)),
        daytripOk: daytripDayOk ? daytripFits : undefined,
      });

      if (morningActivity && isDaytripAnchor(morningActivity)) {
        // Dia inteiro fora: café no hotel antes, par no destino, jantar a ≤ 5 km do hotel depois.
        lastDaytripDay = i;
        daytripCount++;
        activities.push(hotelBreakfast());
        const trip = place(morningActivity, 'morning', '09:00');
        trip.tips = ['Bate-volta: ocupa o dia inteiro', ...(trip.tips || [])];
        const pairs = pairsOf(morningActivity.id).sort((a, b) => Number(a.id.endsWith('-jantar')) - Number(b.id.endsWith('-jantar')));
        for (const p of pairs) {
          usedPlaces.mark(p.name, i, p.category);
          place(p, p.id.endsWith('-jantar') ? 'dinner' : 'lunch', p.id.endsWith('-jantar') ? '19:30' : '13:00');
        }
        if (!pairs.some((p) => p.id.endsWith('-almoco'))) {
          // M6c+: o dia inteiro fora não tem item de almoço (R7 o derrubaria); a âncora diz onde/como almoçar. Custo não somado.
          const nb = normalizePlaceName(morningActivity.neighborhood || '');
          const local = nb ? pool
            .filter((a) => a.category === 'lunch' && !isPairMeal(a) && !isDaytripTagged(a) && opensToday(a) && !usedPlaces.isUsed(a.name) &&
              !michelinBlocked(a, 'lunch') && normalizePlaceName(a.neighborhood || '') === nb)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] : undefined;
          if (local) usedPlaces.mark(local.name, i, 'lunch');
          trip.tips = [local ? `${LUNCH_ON_SITE_TIP}: ${local.name}` : `${LUNCH_ON_SITE_TIP} — a confirmar`, ...(trip.tips || [])];
        }
        if (!pairs.some((p) => p.id.endsWith('-jantar'))) {
          const fitsDay = (a: SuggestedActivity) =>
            dayHoursUsed(activities) + HOP_HOURS + (a.durationHours || 0) <= EXPLORATION_WINDOW_HOURS;
          const anyFits = pool.some((a) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && fitsDay(a));
          const dinner = pickActivity('dinner', dayTheme.title, {
            near: hotelCoord, nearKm: DAYTRIP_DINNER_KM, accept: anyFits ? fitsDay : undefined,
          });
          if (dinner) {
            const act = place(dinner, 'dinner', '19:30');
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
        // Regra 2 (C.4): manhã ≥ 4 h ocupa o dia como o bate-volta — sem tarde; almoço só se cabe até 14:30.
        const longMorning = !!morningActivity && (morningActivity.durationHours || 0) * 60 >= LONG_ITEM_MINUTES;
        let afternoonOccupancy: 'full' | 'half' | undefined;
        let longIconAfternoon = false;

        if (morningActivity) {
          place(morningActivity, 'morning', '10:00');
        } else {
          // EXP pool exhausted for morning slot — emit free-slot entry.
          activities.push(buildFreeSlotActivity(i, 'morning', '10:00'));
          thin('manha-sem-candidato');
          if (closedCutToday('morning')) thin('feriado');
        }

        // Fim de tarde (17:30): pôr do sol ou lanche (tag snack).
        const isSunsetActivity = (a: SuggestedActivity | null) =>
          !!a && typeof a.name === 'string' &&
          (/(p[ôo]r do sol|sunset)/i.test(a.name) || isSnack(a));
        // Full/half-day activities must anchor the day from the morning, not the afternoon.
        // M19d: exceção — ícone/essencial de 4–6 h entra na tarde (não na véspera leve nem no 1º dia com jet lag ALTO/SEVERO).
        const longIconOk = (a: SuggestedActivity) => {
          const mins = (a.durationHours || 0) * 60;
          return !isEve && !(i === explorationStart && jetLagHigh) && (tiers[a.id] === 'icon' || tiers[a.id] === 'essential') &&
            mins >= LONG_ITEM_MINUTES && mins <= LONG_ICON_MAX_MINUTES && a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half';
        };
        const notLong = (a: SuggestedActivity) =>
          longIconOk(a) || (a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half' && (a.durationHours || 0) * 60 < LONG_ITEM_MINUTES);

        if (longMorning || morningOccupancy === 'full' || morningOccupancy === 'half') {
          // Dia longo (CASE A/B unificados): café + longo + almoço se termina (+ desloc.) até 14:30 + jantar.
          // Só escolhe almoço que o scheduler vai manter: fim real do longo + deslocamento até ele ≤ 14:30.
          const morningAct = activities.find((a) => morningActivity && a.id === `day-${i}-${morningActivity.id}`);
          const longLaid = morningAct && layoutDay(activities, { destination, index: layoutIndex, hotelCoord: stayCoord }).items.find((a) => a.id === morningAct.id);
          const longEnd = longLaid ? clockMinutes(longLaid.time) + layoutMinutesOf(longLaid, layoutIndex) : Infinity;
          const lunchFits = (a: SuggestedActivity) =>
            !!longLaid && longEnd + hopMinutes(longLaid, { id: `day-${i}-${a.id}`, name: a.name }, layoutIndex, stayCoord) <= SLOT_RULES.lunch.max;
          if (michelinLunchPending && michelinCount < 1 && longLaid && longEnd + DEFAULT_HOP_MIN <= SLOT_RULES.lunch.max) {
            placeMichelinLunch();
          } else if (pool.some((a) => a.category === 'lunch' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && lunchFits(a))) {
            const lunchRef = last;
            const lunchActivity = pickActivity('lunch', dayTheme.title, { near: lunchRef, accept: lunchFits, meal: { band: mealBand('lunch'), ref: lunchRef } });
            if (lunchActivity) addMealTip(place(lunchActivity, 'lunch', '13:00'), mealTip(lunchActivity, 'lunch', [{ label: 'do passeio da manhã', c: lunchRef }]));
          } else if (morningAct && longMorning) {
            morningAct.tips = [LUNCH_ON_SITE_TIP, ...(morningAct.tips || [])];
          }

          // M6b (C.20): o item longo ocupa a manhã; a tarde recebe um EXP curto (≤ 2,5 h) perto, que termine até 18:30
          // (17:00 na véspera leve). Fim real pós-layout do que já está no dia + deslocamento. Nada cabe → registra o motivo.
          const shortEndMax = isEve ? LIGHT_EVE_END_MIN : SHORT_AFTERNOON_END_MIN;
          const laidNow = layoutDay(activities, { destination, index: layoutIndex, hotelCoord: stayCoord }).items.filter((a) => a.timeSlot !== 'hotel');
          const lastLaid = laidNow.filter((a) => clockMinutes(a.time) >= 0).sort((a, b) =>
            (clockMinutes(a.time) + layoutMinutesOf(a, layoutIndex)) - (clockMinutes(b.time) + layoutMinutesOf(b, layoutIndex))).at(-1);
          const dayEnd = lastLaid ? clockMinutes(lastLaid.time) + layoutMinutesOf(lastLaid, layoutIndex) : Infinity;
          const dinnerReserveH = minHours('dinner') + HOP_HOURS;
          const shortAfternoon = (a: SuggestedActivity) => {
            if (!notLong(a) || isSunsetActivity(a) || (a.durationHours || 0) > SHORT_ITEM_MAX_H) return false;
            const hop = lastLaid ? hopMinutes(lastLaid, { id: `day-${i}-${a.id}`, name: a.name }, layoutIndex, stayCoord) : DEFAULT_HOP_MIN;
            const start = Math.max(SLOT_RULES.afternoon.anchor, dayEnd + hop);
            return start <= SLOT_RULES.afternoon.max && start + Math.round((a.durationHours || 0) * 60) <= shortEndMax &&
              dayHoursUsed(activities) + HOP_HOURS + (a.durationHours || 0) + dinnerReserveH <= EXPLORATION_WINDOW_HOURS;
          };
          const shortPick = pool.some((a) => a.category === 'afternoon' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && opensToday(a) && shortAfternoon(a))
            ? pickActivity('afternoon', dayTheme.title, { near: last, quota: true, accept: shortAfternoon, tierPlan: tierPlanFor(explorationDay, () => dayHoursUsed(activities)) })
            : null;
          if (shortPick) place(shortPick, 'afternoon', '15:00');
          else thin('longo-sem-tarde-curta');
        } else {
          // CASE C: normal morning activity + lunch + afternoon + dinner + optional night.
          // A tarde nasce perto da manhã (é ela que pesa na cota); o almoço vem depois, perto das duas.
          // M19d-fix: manhã ≥ 3 h que impede o ícone longo de caber → tenta uma manhã ≤ 2 h antes de desistir do ícone hoje.
          // O nome da manhã trocada continua usado (perde-se uma opção, nunca repete).
          if (morningActivity && !iconPlaced && !isDaytripAnchor(morningActivity) && !isTierEssential(morningActivity.id) &&
              (morningActivity.durationHours || 0) >= 3 && !morningOccupancy) {
            const plan = tierPlanFor(explorationDay, () => dayHoursUsed(activities));
            const swapHours = dayHoursUsed(activities) - (morningActivity.durationHours || 0) + 2;
            const wantsSwap = pool.some((a) => tiers[a.id] === 'icon' && longIconOk(a) && opensToday(a) && !usedPlaces.isUsed(a.name) &&
              !plan.fits(a) && swapHours + HOP_HOURS + (a.durationHours || 0) + mealReserve <= EXPLORATION_WINDOW_HOURS);
            if (wantsSwap) {
              const shortMorning = pickActivity('morning', dayTheme.title, { quota: true, accept: (a) => (a.durationHours || 0) <= 2 && !a.dayOccupancy });
              if (shortMorning) {
                const oldIdx = activities.findIndex((a) => a.id === `day-${i}-${morningActivity.id}`);
                if (oldIdx >= 0) { dayTotal -= activities[oldIdx].estimatedCost; activities.splice(oldIdx, 1); }
                place(shortMorning, 'morning', '10:00');
              }
            }
          }
          const morningAt = last;
          // M6b: véspera leve — a tarde termina até 17:00 (≤ 2 h a partir das 15:00) e não há pôr do sol às 17:30.
          const eveFits = (a: SuggestedActivity) => !isEve || (!isSunsetActivity(a) && SLOT_RULES.afternoon.anchor + Math.round((a.durationHours || 0) * 60) <= LIGHT_EVE_END_MIN);
          let afternoonActivity = pickActivity('afternoon', dayTheme.title, { near: morningAt, quota: true, accept: (a) => notLong(a) && eveFits(a), tierPlan: tierPlanFor(explorationDay, () => dayHoursUsed(activities)) });

          // Sunset activities MUST occupy the last afternoon slot (17:30), never 15:00.
          // If the initial afternoon pick is a sunset, draw a non-sunset for 15:00.
          let sunsetActivity: SuggestedActivity | null = null;
          if (isSunsetActivity(afternoonActivity)) {
            sunsetActivity = afternoonActivity;
            afternoonActivity = pickActivity('afternoon', dayTheme.title, {
              near: morningAt, alsoNear: curatedCoordOf(sunsetActivity.id) ?? null, quota: true, accept: (a) => notLong(a) && !isSunsetActivity(a) && eveFits(a), tierPlan: tierPlanFor(explorationDay, () => dayHoursUsed(activities)),
            });
            // M19d-fix: ícone longo ocupa a tarde — o pôr do sol do dia não cabe junto; volta ao pool (outro dia).
            if (afternoonActivity && longIconOk(afternoonActivity)) {
              releasedIcons.add(sunsetActivity.id);
              sunsetActivity = null;
            }
          }
          const afternoonAt = curatedCoordOf((afternoonActivity ?? sunsetActivity)?.id ?? '') ?? null;

          if (michelinLunchPending && michelinCount < 1) {
            placeMichelinLunch();
          } else {
            const lunchActivity = pickActivity('lunch', dayTheme.title, { near: morningAt, alsoNear: afternoonAt, meal: { band: mealBand('lunch'), ref: morningAt, chain: afternoonAt } });
            if (lunchActivity) addMealTip(place(lunchActivity, 'lunch', '13:00'), mealTip(lunchActivity, 'lunch', [{ label: 'do passeio da manhã', c: morningAt }]));
          }

          if (afternoonActivity) {
            afternoonOccupancy = afternoonActivity.dayOccupancy;
            if (longIconOk(afternoonActivity)) {
              afternoonOccupancy = 'full';
              longIconAfternoon = true;
            }
            const placedAft = place(afternoonActivity, 'afternoon', '15:00');
            if (longIconAfternoon) placedAft.tips = ['Ocupa a tarde inteira — jantar perto do hotel', ...(placedAft.tips || [])];
          } else if (!sunsetActivity) {
            // EXP pool exhausted for afternoon slot — emit free-slot entry.
            activities.push(buildFreeSlotActivity(i, 'afternoon', '15:00'));
            thin('tarde-sem-candidato');
            if (closedCutToday('afternoon')) thin('feriado');
          }

          if (sunsetActivity) {
            if (!afternoonOccupancy) afternoonOccupancy = sunsetActivity.dayOccupancy;
            place(sunsetActivity, 'afternoon', '17:30');
          }
        }

        // 🍷 DINNER (19:30) — Michelin injection for gastronomy days
        // M6b: véspera leve — jantar a ≤ 1 km do hotel (fallback 2 km, depois o mais próximo), com a dica de distância.
        const michelinBeforeDinner = michelinByDay.get(i) ?? 0;
        // M19d: no dia do ícone longo o jantar fica perto do hotel — salvo jantar de "só N dias" (≤ 3) que abre hoje (bônus do dia certo).
        const dayBoundDinnerToday = longIconAfternoon && pool.some((a) => a.category === 'dinner' && !usedPlaces.isUsed(a.name) && !isPairMeal(a) && opensToday(a) && (CURATED_DAYS_OF_WEEK[a.id]?.length ?? 7) <= 3);
        const dinnerActivity = isEve || (longIconAfternoon && !dayBoundDinnerToday)
          ? pickNearHotelDinner([(a) => !isCatalogMichelin(a) || priceLevel === 'luxury', () => true])
          : pickActivity('dinner', dayTheme.title, { near: last, nearKm: mealBand('dinner'), meal: { band: mealBand('dinner'), ref: last, alt: wantsGastro ? null : hotelCoord, chain: last } });
        const dinnerRef = last;
        let michelinPlaced = false;

        if (michelinPending && michelinBeforeDinner === 0) {
          const availableMichelin = michelinList[0];
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
              time: '19:30',
              duration: '2.5h',
              location: availableMichelin.neighborhood || destination,
              status: 'defined',
              source: 'kinu',
              tips: [`Cozinha ${availableMichelin.cuisine}`, 'Reserve com 2-3 semanas de antecedência', 'Menu degustação — valor estimado por pessoa'],
            });
            // (Michelin is capped at 1 per trip via michelinCount; no id-tracking needed.)
            dayTotal += total;
            michelinCount++;
            // O jantar do catálogo escolhido acima é descartado quando o Michelin injetado entra: desfaz a contagem dele.
            if (dinnerActivity && isCatalogMichelin(dinnerActivity)) { michelinByDay.set(i, (michelinByDay.get(i) ?? 1) - 1); catalogMichelinTrip--; }
            bumpDayMichelin(i);
            michelinPlaced = true;
          }
        }
        if (!michelinPlaced && dinnerActivity) {
          const dinnerAct = place(dinnerActivity, 'dinner', '19:30');
          const nh = isEve ? nearHotelTip(dinnerActivity) : null;
          if (nh) dinnerAct.tips = [nh, ...(dinnerAct.tips || [])];
          else if (!isEve && !(longIconAfternoon && !dayBoundDinnerToday)) {
            addMealTip(dinnerAct, mealTip(dinnerActivity, 'dinner', [{ label: 'do último passeio', c: dinnerRef }, ...(wantsGastro ? [] : [{ label: 'do hotel', c: hotelCoord }])]));
          }
        }

        // 🌙 NIGHT ACTIVITY - Optional (21:30) — only on nightlife-themed days or when the user
        // explicitly likes nightlife, to keep daily density realistic
        // M6: noite só com interesse explícito de vida noturna (a tag de um item não conta como interesse).
        if (wantsNightlife && !isEve && morningOccupancy !== 'full' && morningOccupancy !== 'half' && afternoonOccupancy !== 'full' && afternoonOccupancy !== 'half') {
          const nightActivity = pickActivity('night', dayTheme.title, { near: last, quota: true });
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
      let droppedAfternoon = false;
      while (dayHoursUsed(activities) > windowHours) {
        const removable = activities.filter((a) =>
          !isLogisticAct(a) && !MEAL_SLOTS.has(a.timeSlot) && !/^day-\d+-michelin-/.test(a.id) &&
          !pool.some((p) => isDaytripAnchor(p) && a.id === `day-${i}-${p.id}`));
        if (removable.length === 0) break;
        removable.sort((x, y) => affinity(x) - affinity(y) || itemHoursOf(y) - itemHoursOf(x));
        const out = removable[0];
        if (out.timeSlot === 'morning' || out.timeSlot === 'afternoon') thin('janela-14h');
        if (out.timeSlot === 'afternoon') droppedAfternoon = true;
        activities.splice(activities.indexOf(out), 1);
        dayTotal -= out.estimatedCost;
        const outId = catalogIdOf(out.id);
        if (tiers[outId] === 'icon') releasedIcons.add(outId);
      }
      // M19d-fix: rede de segurança — a janela tirou a tarde → re-escolhe com a regra normal (sem exceção de ícone longo,
      // sem pôr do sol). Só fica vazia se o pool acabou ('pool').
      if (droppedAfternoon && label === 'Exploração' &&
          !activities.some((a) => a.timeSlot === 'afternoon' && !isLogisticAct(a) && !/-slot-/.test(a.id) && !SUNSET_RE.test(a.name))) {
        const hoursNow = () => dayHoursUsed(activities);
        const reAft = pickActivity('afternoon', dayThemeTitle, {
          near: hotelCoord, quota: true,
          accept: (a) => a.dayOccupancy !== 'full' && a.dayOccupancy !== 'half' && (a.durationHours || 0) * 60 < LONG_ITEM_MINUTES &&
            !SUNSET_RE.test(a.name) && !isSnack(a) && hoursNow() + HOP_HOURS + (a.durationHours || 0) <= windowHours,
        });
        if (reAft) {
          const act = convertToItineraryActivity(reAft, i, 'afternoon', '15:00', travelers, pax);
          activities.push(act);
          dayTotal += act.estimatedCost;
        } else { thin('pool'); if (closedCutToday('afternoon')) thin('feriado'); }
      }
    }

    // R11: saída de madrugada — a véspera perde a noite, recebe o check-out/transfer que caem antes
    // de 00:00 (D2) e o jantar ganha a dica da saída.
    if (isEve) {
      for (const a of activities.filter((x) => x.timeSlot === 'night')) {
        activities.splice(activities.indexOf(a), 1);
        dayTotal -= a.estimatedCost;
      }
      if (lastCheckoutMin < 0) activities.push(checkoutItem(i, lastCheckoutMin));
      if (lastTransferMin < 0) { activities.push(transferItem(i, lastTransferMin)); dayTotal += transferCost; }
    }

    // ⏰ Scheduler (C.4): a sequência vira horário; o que não cabe sai (R1–R9).
    const isArrivalDay = (i === 0 && sameDayArrival) || (i === arrivalDayIndex && !sameDayArrival && i !== totalDays - 1);
    const laid = layoutDay(activities, {
      destination,
      index: layoutIndex,
      hotelCoord: stayCoord,
      ...(isArrivalDay ? { startMin: arrivalStartMin, dinnerMax: ARRIVAL_DINNER_MAX } : {}),
    });
    for (const out of laid.dropped) {
      dayTotal -= out.estimatedCost;
      if (label === 'Exploração' && !isLogisticAct(out) && (out.timeSlot === 'morning' || out.timeSlot === 'afternoon')) thin('layout-nao-coube');
    }
    // M6: sem interesse de vida noturna, nada que não seja logística/refeição começa às 21:00 ou depois
    // (o layout pode empurrar o item para a noite). O nome continua usado: perde-se uma opção, nunca repete.
    const LATE_EXEMPT_TYPES = new Set(['flight', 'checkin', 'checkout', 'hotel', 'transfer']);
    const LATE_EXEMPT_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);
    const keptItems = wantsNightlife ? laid.items : laid.items.filter((a) => {
      if (LATE_EXEMPT_TYPES.has(a.type) || LATE_EXEMPT_SLOTS.has(a.timeSlot) || /-slot-(transfer|checkout|checkin|flight)/.test(a.id)) return true;
      if (a.name.startsWith('Descanso') || a.name.startsWith('Caminhada leve')) return true;
      const m = /^(\d{1,2}):(\d{2})/.exec(a.time ?? '');
      if (!m || +m[1] * 60 + +m[2] < 21 * 60) return true;
      dayTotal -= a.estimatedCost;
      return false;
    });
    // M6b: véspera leve — nada de passeio que termine depois das 17:00 (o layout pode empurrar). Logística/refeição ficam.
    const eveKept = !isEve ? keptItems : keptItems.filter((a) => {
      if (LATE_EXEMPT_TYPES.has(a.type) || LATE_EXEMPT_SLOTS.has(a.timeSlot) || /-slot-/.test(a.id) || /^day-\d+-michelin-/.test(a.id)) return true;
      if (a.timeSlot !== 'morning' && a.timeSlot !== 'afternoon') return true;
      if (clockMinutes(a.time) + layoutMinutesOf(a, layoutIndex) <= LIGHT_EVE_END_MIN) return true;
      dayTotal -= a.estimatedCost;
      thin('vespera-apos-17h');
      return false;
    });
    activities.splice(0, activities.length, ...eveKept);
    if (isEve) {
      const dinner = activities.find((a) => a.timeSlot === 'dinner');
      if (dinner) dinner.tips = [exitTip, ...(dinner.tips || [])];
    }
    const checkout = activities.find((a) => /-slot-checkout$/.test(a.id));
    if (checkout && i === totalDays - 1 && activities.some((a, k) => k > activities.indexOf(checkout) && !isFixedL(a))) {
      checkout.tips = [LUGGAGE_TIP, ...(checkout.tips || [])];
    }

    days.push({
      dayNumber: i + 1,
      date,
      label,
      theme,
      activities,
      totalCost: dayTotal,
    });
    // M6: os contadores do tier seguem o que ficou no roteiro (o que a janela/layout cortou não conta).
    const keptIds = days.flatMap((d) => d.activities.map((a) => catalogIdOf(a.id)));
    iconPlaced = keptIds.some((id) => tiers[id] === 'icon');
    essentialsPlaced = keptIds.filter(isTierEssential).length;
    for (const id of keptIds) releasedIcons.delete(id);
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
  return { days, breakdown, meta: { michelinCount, hotelNights: totalNights, checkoutOnEve: nightsOnEve, thinDays, lightEve: earlyExit } };
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
  pax?: Pick<Pax, 'adults' | 'children' | 'infants'>;
}

/** Ponto de entrada do motor: dias + breakdown + baldes de custo. */
export function runItineraryEngine(input: EngineInput) {
  const r = generateItinerary(
    input.departureDate, input.returnDate, input.destination, input.origin,
    input.outboundFlight, input.returnFlight, input.budget, input.travelers ?? 1,
    input.interests ?? [], input.jetLagSeverity, input.priceLevel, input.hotel, input.pax
  );
  return { ...r, buckets: computeBuckets(r.days, r.breakdown, input.hotelPlannedOverride) };
}
