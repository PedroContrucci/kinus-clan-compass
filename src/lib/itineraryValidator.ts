import { destinationActivities, SuggestedActivity } from '@/data/destinationActivities';
import { normalizePlaceName } from '@/lib/placeIdentity';
import { catalogFor } from '@/lib/interestsFor';
import { matchesPriority } from '@/lib/claChips';
import { catalogIdOf } from '@/lib/localAchievements';
import { curatedCoordOf } from '@/lib/routeCoords';
import { getMichelinCountForCity } from '@/lib/michelinData';

export interface ValidationResult {
  rule: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  detail?: string;
}

interface ItineraryActivity {
  id: string;
  name: string;
  type: string;
  timeSlot: string;
  estimatedCost: number;
  costPerPerson?: number;
  time?: string;
  duration?: string;
  location?: string;
  status: string;
  tips?: string[];
  source: string;
}

interface ItineraryDay {
  dayNumber: number;
  date: Date;
  label: string;
  theme?: string;
  activities: ItineraryActivity[];
  totalCost: number;
}

const GENERIC_NAMES = new Set<string>([
  'Café da manhã no hotel',
  'Check-in Hotel',
  'Check-out Hotel',
  'Transfer para Aeroporto',
  'Voo de Ida',
  'Voo de Volta',
]);

const NIGHTLIFE_RE = /noturna|noite|nightlife/i;

const toMinutes = (t?: string): number => {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

const isGeneric = (name: string): boolean => {
  if (GENERIC_NAMES.has(name)) return true;
  if (name.startsWith('Caminhada leve')) return true;
  if (name.startsWith('Descanso')) return true;
  return false;
};

const buildOccupancyMap = (destination: string): Map<string, 'full' | 'half'> => {
  const map = new Map<string, 'full' | 'half'>();
  const collect = (list?: SuggestedActivity[]) => {
    if (!list) return;
    for (const a of list) {
      if (a.dayOccupancy) map.set(a.name, a.dayOccupancy);
    }
  };
  const data = destinationActivities[destination];
  if (data) {
    Object.values(data).forEach((v) => {
      if (Array.isArray(v)) collect(v as SuggestedActivity[]);
    });
  } else {
    // fallback: scan all if destination not exact
    Object.values(destinationActivities).forEach((d) => {
      Object.values(d).forEach((v) => {
        if (Array.isArray(v)) collect(v as SuggestedActivity[]);
      });
    });
  }
  return map;
};

const NON_DENSITY_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'flight', 'checkin', 'checkout', 'hotel']);

const isTransfer = (a: ItineraryActivity): boolean =>
  /transfer/i.test(a.name) || /aeroporto/i.test(a.name);

export function validateItinerary(
  days: ItineraryDay[],
  config: { budget: number; travelInterests: string[]; destination: string }
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const occupancy = buildOccupancyMap(config.destination);
  const lastDay = days[days.length - 1];

  // R1 LAST-DAY ORDER
  if (lastDay) {
    const transfer = lastDay.activities.find((a) => isTransfer(a));
    const flight = lastDay.activities.find((a) => a.type === 'flight' || a.timeSlot === 'flight');
    if (transfer && flight) {
      const tt = toMinutes(transfer.time);
      const ft = toMinutes(flight.time);
      if (tt >= 0 && ft >= 0 && tt < ft) {
        results.push({ rule: 'R1 LAST-DAY ORDER', status: 'PASS' });
      } else {
        results.push({
          rule: 'R1 LAST-DAY ORDER',
          status: 'FAIL',
          detail: `transfer ${transfer.time} vs flight ${flight.time}`,
        });
      }
    } else {
      results.push({ rule: 'R1 LAST-DAY ORDER', status: 'PASS', detail: 'no transfer/flight pair' });
    }

    // R2 CHECKOUT
    const checkout = lastDay.activities.find((a) => a.type === 'checkout' || /check-?out/i.test(a.name));
    if (checkout && transfer) {
      const co = toMinutes(checkout.time);
      const tt = toMinutes(transfer.time);
      if (co >= 0 && tt >= 0 && co <= tt) {
        results.push({ rule: 'R2 CHECKOUT', status: 'PASS' });
      } else {
        results.push({
          rule: 'R2 CHECKOUT',
          status: 'FAIL',
          detail: `checkout ${checkout.time} > transfer ${transfer.time}`,
        });
      }
    } else {
      results.push({ rule: 'R2 CHECKOUT', status: 'PASS', detail: 'no checkout/transfer' });
    }

    // R3 NO FULL/HALF ON DEPARTURE DAY
    const bad = lastDay.activities.filter((a) => {
      const occ = occupancy.get(a.name);
      return occ === 'full' || occ === 'half';
    });
    if (bad.length === 0) {
      results.push({ rule: 'R3 NO FULL/HALF ON DEPARTURE DAY', status: 'PASS' });
    } else {
      results.push({
        rule: 'R3 NO FULL/HALF ON DEPARTURE DAY',
        status: 'FAIL',
        detail: bad.map((a) => `${a.name} (${occupancy.get(a.name)})`).join(', '),
      });
    }
  }

  // R4 CHRONOLOGICAL ORDER
  const orderIssues: string[] = [];
  for (const day of days) {
    for (let i = 1; i < day.activities.length; i++) {
      const prev = day.activities[i - 1];
      const cur = day.activities[i];
      const p = toMinutes(prev.time);
      const c = toMinutes(cur.time);
      if (p >= 0 && c >= 0 && p > c) {
        orderIssues.push(`Day ${day.dayNumber}: ${prev.name} ${prev.time} > ${cur.name} ${cur.time}`);
      }
    }
  }
  results.push(
    orderIssues.length === 0
      ? { rule: 'R4 CHRONOLOGICAL ORDER', status: 'PASS' }
      : { rule: 'R4 CHRONOLOGICAL ORDER', status: 'FAIL', detail: orderIssues.join(' | ') }
  );

  // R5 NO DUPLICATES
  // Compara por nome normalizado: o catálogo tem a mesma casa real sob ids
  // distintos em categorias distintas, então id não identifica lugar.
  // Experiência repetida é erro — o gerador nunca deve fazê-lo. Refeição
  // repetida é a degradação deliberada de quando o pool da categoria esgota
  // (um dia sem jantar é pior que um jantar repetido), logo WARN, não FAIL.
  const MEAL_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);
  const nameToEntries = new Map<string, { day: number; isMeal: boolean }[]>();
  for (const day of days) {
    for (const a of day.activities) {
      if (isGeneric(a.name)) continue;
      const key = normalizePlaceName(a.name);
      const arr = nameToEntries.get(key) || [];
      arr.push({ day: day.dayNumber, isMeal: MEAL_SLOTS.has(a.timeSlot) || MEAL_SLOTS.has(a.type) });
      nameToEntries.set(key, arr);
    }
  }
  const expDupes: string[] = [];
  const mealDupes: string[] = [];
  nameToEntries.forEach((entries, name) => {
    if (entries.length < 2) return;
    const dayList = entries.map((e) => e.day);
    const gap = Math.min(
      ...dayList.slice(1).map((d, i) => d - dayList[i])
    );
    const label = `${name} (days ${dayList.join(', ')})`;
    // Só é degradação aceitável se todas as aparições forem em papel de refeição.
    if (entries.every((e) => e.isMeal)) {
      mealDupes.push(`${label}, menor intervalo ${gap}d`);
    } else {
      expDupes.push(label);
    }
  });
  if (expDupes.length > 0) {
    results.push({ rule: 'R5 NO DUPLICATES', status: 'FAIL', detail: expDupes.join(' | ') });
  } else if (mealDupes.length > 0) {
    results.push({
      rule: 'R5 NO DUPLICATES',
      status: 'WARN',
      detail: `pool de restaurantes esgotado — ${mealDupes.join(' | ')}`,
    });
  } else {
    results.push({ rule: 'R5 NO DUPLICATES', status: 'PASS' });
  }

  // R6 DENSITY
  const densityIssues: string[] = [];
  for (const day of days) {
    const count = day.activities.filter((a) => {
      if (NON_DENSITY_TYPES.has(a.type)) return false;
      if (NON_DENSITY_TYPES.has(a.timeSlot)) return false;
      if (isTransfer(a)) return false;
      return true;
    }).length;
    if (count > 4) densityIssues.push(`Day ${day.dayNumber}: ${count} activities`);
  }
  results.push(
    densityIssues.length === 0
      ? { rule: 'R6 DENSITY', status: 'PASS' }
      : { rule: 'R6 DENSITY', status: 'FAIL', detail: densityIssues.join(' | ') }
  );

  // R7 NIGHT DISCIPLINE
  const wantsNight = config.travelInterests.some((i) => NIGHTLIFE_RE.test(i));
  const LOGISTIC_TYPES = new Set(['flight', 'checkin', 'checkout', 'hotel', 'transfer']);
  const nightViolations: string[] = [];
  for (const day of days) {
    for (const a of day.activities) {
      if (LOGISTIC_TYPES.has(a.type) || isTransfer(a)) continue;
      if (a.name.startsWith('Descanso') || a.name.startsWith('Caminhada leve')) continue;
      const m = toMinutes(a.time);
      const isNight = a.type === 'night' || (m >= 0 && m >= 21 * 60);
      if (isNight && !wantsNight) {
        nightViolations.push(`Day ${day.dayNumber}: ${a.name} @ ${a.time}`);
      }
    }
  }
  results.push(
    nightViolations.length === 0
      ? { rule: 'R7 NIGHT DISCIPLINE', status: 'PASS' }
      : { rule: 'R7 NIGHT DISCIPLINE', status: 'FAIL', detail: nightViolations.join(' | ') }
  );

  // R8 BUDGET (WARN)
  const total = days.reduce((s, d) => s + (d.totalCost || 0), 0);
  if (total > config.budget) {
    results.push({
      rule: 'R8 BUDGET',
      status: 'WARN',
      detail: `overflow R$ ${Math.round(total - config.budget).toLocaleString('pt-BR')}`,
    });
  } else {
    results.push({ rule: 'R8 BUDGET', status: 'PASS' });
  }

  // R9 MICHELIN PRICING
  const michelins = days.flatMap((d) =>
    d.activities.filter((a) => /Michelin/i.test(a.name)).map((a) => ({ day: d.dayNumber, a }))
  );
  const michelinIssues: string[] = [];
  for (const { day, a } of michelins) {
    const cpp = a.costPerPerson ?? 0;
    if (cpp < 800) michelinIssues.push(`Day ${day}: ${a.name} R$${cpp}/pp`);
  }
  if (michelins.length > 2) {
    michelinIssues.push(`${michelins.length} Michelin activities (max 2)`);
  }
  results.push(
    michelinIssues.length === 0
      ? { rule: 'R9 MICHELIN PRICING', status: 'PASS' }
      : { rule: 'R9 MICHELIN PRICING', status: 'FAIL', detail: michelinIssues.join(' | ') }
  );

  return results;
}

export function validateOfferLinks(
  links: { label: string; url: string }[],
  config: { departure: string; returnDate: string; originIata: string; destIata: string }
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const RULE = 'R10 AFFILIATE LINKS';
  const BAD_TOKENS = ['undefined', 'null', 'NaN'];

  for (const link of links) {
    const { label, url } = link;

    // Check 1: no bad tokens
    const bad = BAD_TOKENS.filter((t) => url.includes(t));
    results.push(
      bad.length === 0
        ? { rule: RULE, status: 'PASS', detail: `${label}: no bad tokens` }
        : { rule: RULE, status: 'FAIL', detail: `${label}: contains ${bad.join(', ')}` }
    );

    const isTravelpayouts = /travelpayouts\.com/i.test(url);
    const isKiwi = /kiwi\.com/i.test(url) || (isTravelpayouts && /custom_url=/i.test(url));

    // Check 2: Travelpayouts shmarker present with non-empty value
    if (isTravelpayouts) {
      const m = url.match(/[?&]shmarker=([^&]*)/);
      const val = m ? decodeURIComponent(m[1]) : '';
      results.push(
        val.length > 0
          ? { rule: RULE, status: 'PASS', detail: `${label}: shmarker=${val}` }
          : { rule: RULE, status: 'FAIL', detail: `${label}: shmarker missing/empty` }
      );
    }

    // Check 3 & 4: Kiwi deep link inside custom_url
    if (isTravelpayouts && /custom_url=/i.test(url)) {
      const cm = url.match(/[?&]custom_url=([^&]+)/);
      const rawCustom = cm ? cm[1] : '';
      let decoded = '';
      let decodeOk = false;
      try {
        decoded = decodeURIComponent(rawCustom);
        decodeOk = decoded.startsWith('https://');
      } catch {
        decodeOk = false;
      }
      results.push(
        decodeOk
          ? { rule: RULE, status: 'PASS', detail: `${label}: custom_url decodes to https` }
          : { rule: RULE, status: 'FAIL', detail: `${label}: custom_url not properly URL-encoded` }
      );

      if (decodeOk && isKiwi) {
        const okOrigin = decoded.toUpperCase().includes(config.originIata.toUpperCase());
        const okDest = decoded.toUpperCase().includes(config.destIata.toUpperCase());
        const okDep = decoded.includes(config.departure);
        const okRet = decoded.includes(config.returnDate);
        const missing: string[] = [];
        if (!okOrigin) missing.push(`origin ${config.originIata}`);
        if (!okDest) missing.push(`dest ${config.destIata}`);
        if (!okDep) missing.push(`departure ${config.departure}`);
        if (!okRet) missing.push(`return ${config.returnDate}`);
        results.push(
          missing.length === 0
            ? { rule: RULE, status: 'PASS', detail: `${label}: Kiwi deep link has IATA + dates` }
            : { rule: RULE, status: 'FAIL', detail: `${label}: Kiwi deep link missing ${missing.join(', ')}` }
        );
      }
    }
  }

  return results;
}

export function formatReport(tripLabel: string, results: ValidationResult[]): string {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const lines: string[] = [`SMOKE — ${tripLabel}: ${pass}/${results.length} PASS`];
  for (const r of results) {
    if (r.status === 'PASS') continue;
    lines.push(`  ${r.rule} [${r.status}]${r.detail ? `: ${r.detail}` : ''}`);
  }
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// R13–R16 — regras de plano (WARN/SKIP, nunca FAIL por enquanto).
// Item de catálogo é reconhecido pelo id (`day-N-<catalogId>`), nunca pelo nome.
// ─────────────────────────────────────────────────────────────────────────────

export type PlanRuleStatus = 'PASS' | 'WARN' | 'SKIP';
export interface PlanRuleResult {
  rule: 'R13 PRIORIDADE' | 'R14 MICHELIN' | 'R15 GEO' | 'R16 TEMPO';
  status: PlanRuleStatus;
  detail: string;
}

export interface PlanDayItem {
  id: string;
  name: string;
  time?: string;
  duration?: string;
  timeSlot?: string;
  type?: string;
}
export interface PlanDay {
  day: number;
  date?: string;
  title?: string;
  activities: PlanDayItem[];
}
export interface PlanRulesContext {
  destination: string;
  /** Interesses já filtrados por interestsFor. */
  interests: string[];
  /** Chegada do voo de ida: data ISO (yyyy-mm-dd) e HH:mm. */
  arrivalDate?: string;
  arrivalTime?: string;
  /** Partida do voo de volta (HH:mm). */
  returnDepartureTime?: string;
  domestic: boolean;
}

const MEALS = new Set(['breakfast', 'lunch', 'dinner']);
const LOGISTIC_SLOTS = new Set(['flight', 'hotel']);
const EXPLORE_SLOTS = new Set(['morning', 'afternoon', 'night']);
export const MAX_HOP_KM = 8;
/**
 * Cidades espalhadas: atrações distantes entre si por natureza (parques,
 * praias, serra, deserto), então o salto aceitável é maior que nas compactas.
 */
export const SPREAD_CITIES = ['Orlando', 'Dubai', 'Cidade do Cabo', 'Fortaleza', 'Salvador', 'Porto Seguro', 'Gramado'];
export const SPREAD_MAX_HOP_KM = 20;
/** Item de catálogo a mais disto de um bate-volta no mesmo dia é WARN. */
export const DAYTRIP_STRAY_KM = 15;
export const maxHopKmFor = (destination: string): number =>
  SPREAD_CITIES.some((c) => destination.toLowerCase().includes(c.toLowerCase())) ? SPREAD_MAX_HOP_KM : MAX_HOP_KM;
const isDaytrip = (cat: SuggestedActivity) => (cat.styleTags ?? []).some((t) => t.toLowerCase() === 'daytrip');
export const DAY_TRIP_HOURS = 5;
export const HOP_HOURS = 0.5;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const isSlotOrSynthetic = (id: string) => /^day-\d+-(slot|michelin)-/.test(id) || id.startsWith('__free__');

function catalogIndex(destination: string): Map<string, SuggestedActivity> {
  return new Map(catalogFor(destination).map((a) => [a.id, a]));
}

/** O item do catálogo por trás de um item do roteiro, ou null. */
export function catalogItemOf(item: PlanDayItem, index: Map<string, SuggestedActivity>): SuggestedActivity | null {
  if (!item?.id || isSlotOrSynthetic(item.id)) return null;
  const id = catalogIdOf(item.id);
  return id ? index.get(id) ?? null : null;
}

const hhmm = (t?: string): number => {
  const m = toMinutes(t);
  return m < 0 ? -1 : m / 60;
};

/** Janela do último dia: 08:00 até (partida − 3 h intl / − 2 h doméstico). */
export function lastDayWindowHours(returnDepartureTime: string | undefined, domestic: boolean): number {
  const dep = hhmm(returnDepartureTime);
  if (dep < 0) return 0;
  return Math.max(0, dep - (domestic ? 2 : 3) - 8);
}

function itemHours(item: PlanDayItem, cat: SuggestedActivity | null): number {
  if (cat) return cat.durationHours || 0;
  const m = String(item.duration ?? '').match(/(\d+(?:[.,]\d+)?)\s*h/);
  return m ? parseFloat(m[1].replace(',', '.')) : 0;
}

/** Minutos de uma duração gravada: "2h", "1.5h", "1,5h", "1h30", "45min"; −1 se não dá para ler. */
export function durationMinutesOf(d: unknown): number {
  const s = String(d ?? '');
  const h = s.match(/(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d{1,2}))?/);
  if (h) return Math.round(parseFloat(h[1].replace(',', '.')) * 60) + (Number(h[2]) || 0);
  const m = s.match(/(\d+)\s*min/);
  return m ? Number(m[1]) : -1;
}

/** Defaults de quem não tem duração (os mesmos do R19 e do scheduler): refeição 1h30 · check-in/out 30 min · logística 1h · resto 1h30. */
export function defaultMinutesOf(item: PlanDayItem): number {
  if (item.type === 'checkin' || item.type === 'checkout' || /check-?(in|out)/i.test(item.name)) return 30;
  if (MEALS.has(item.timeSlot ?? '') || MEALS.has(item.type ?? '')) return 90;
  if (LOGISTIC_SLOTS.has(item.timeSlot ?? '') || LOGISTIC_SLOTS.has(item.type ?? '') || /transfer|aeroporto/i.test(item.name)) return 60;
  return 90;
}

/** Horas do R16: catálogo → `duration` (h+min) → defaults. Fecha o achado do C.4-diag (item sem duração contava 0 h). */
function planHours(item: PlanDayItem, cat: SuggestedActivity | null): number {
  if (cat && cat.durationHours) return cat.durationHours;
  const m = durationMinutesOf(item.duration);
  return (m >= 0 ? m : defaultMinutesOf(item)) / 60;
}

// Check-out pelo nome também (o motor o grava como 'transport'), como no isLogisticAct do motor (C.4).
const isLogistic = (a: PlanDayItem) =>
  LOGISTIC_SLOTS.has(a.timeSlot ?? '') || LOGISTIC_SLOTS.has(a.type ?? '') || a.type === 'checkin' || a.type === 'checkout' || /transfer|aeroporto|check-?out/i.test(a.name);

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** Dia da chegada no roteiro (pela data do voo de ida); 0 sem data. */
function arrivalIndexOf(days: PlanDay[], ctx: PlanRulesContext): number {
  const i = ctx.arrivalDate ? days.findIndex((d) => String(d.date ?? '').slice(0, 10) === ctx.arrivalDate) : -1;
  return i >= 0 ? i : 0;
}

/**
 * R16 de um dia: horas usadas (itens não logísticos + saltos) contra a janela do dia —
 * chegada → 22 h, 14 h nos do meio, 08 h → aeroporto no último. `extra` entra na conta
 * como se já estivesse no dia (o "tentar encaixar" do cockpit). null = dia em trânsito.
 */
export function dayWindowUsage(
  days: PlanDay[], ctx: PlanRulesContext, i: number, extra: PlanDayItem[] = [],
  index: Map<string, SuggestedActivity> = catalogIndex(ctx.destination),
): { used: number; window: number; items: number } | null {
  const arrivalIdx = arrivalIndexOf(days, ctx);
  if (i < arrivalIdx || !days[i]) return null; // em trânsito
  let window: number;
  if (i === days.length - 1) window = lastDayWindowHours(ctx.returnDepartureTime, ctx.domestic);
  else if (i === arrivalIdx) {
    const arr = hhmm(ctx.arrivalTime);
    window = arr < 0 ? 14 : Math.max(0, 22 - arr);
  } else window = 14;
  const items = [...days[i].activities, ...extra].filter((a) => !isLogistic(a));
  const hours = items.reduce((s, a) => s + planHours(a, catalogItemOf(a, index)), 0);
  return { used: hours + HOP_HOURS * Math.max(0, items.length - 1), window, items: items.length };
}

export function validatePlanRules(days: PlanDay[], ctx: PlanRulesContext): PlanRuleResult[] {
  const index = catalogIndex(ctx.destination);
  const lastIdx = days.length - 1;
  const arrivalIdx = arrivalIndexOf(days, ctx);
  const isExploration = (i: number) =>
    i > arrivalIdx && i < lastIdx && !/recupera|descanso|trânsito/i.test(days[i].title ?? '');

  // R13
  let r13: PlanRuleResult;
  if (ctx.interests.length === 0) {
    r13 = { rule: 'R13 PRIORIDADE', status: 'SKIP', detail: 'sem interesses oferecidos' };
  } else {
    let total = 0, hit = 0;
    days.forEach((d, i) => {
      if (!isExploration(i)) return;
      for (const a of d.activities) {
        if (!EXPLORE_SLOTS.has(a.timeSlot ?? '')) continue;
        const cat = catalogItemOf(a, index);
        if (!cat || MEALS.has(cat.category)) continue;
        total++;
        if (ctx.interests.some((p) => matchesPriority(cat, p))) hit++;
      }
    });
    if (total === 0) r13 = { rule: 'R13 PRIORIDADE', status: 'SKIP', detail: 'sem itens de exploração do catálogo' };
    else {
      const ratio = hit / total;
      r13 = { rule: 'R13 PRIORIDADE', status: ratio >= 0.5 ? 'PASS' : 'WARN', detail: `${hit}/${total} (${Math.round(ratio * 100)}%)` };
    }
  }

  // R14 — limitação conhecida: Michelin que também está no catálogo entra como day-N-<id> e não conta.
  let r14: PlanRuleResult;
  const michelinCity = getMichelinCountForCity(ctx.destination);
  if (!ctx.interests.includes('gastronomy')) r14 = { rule: 'R14 MICHELIN', status: 'SKIP', detail: 'sem gastronomia' };
  else if (michelinCity === 0) r14 = { rule: 'R14 MICHELIN', status: 'SKIP', detail: 'cidade sem Michelin' };
  else {
    const count = days.reduce((s, d) => s + d.activities.filter((a) => /^day-\d+-michelin-/.test(a.id)).length, 0);
    r14 = { rule: 'R14 MICHELIN', status: count >= 1 ? 'PASS' : 'WARN', detail: `count=${count}` };
  }

  // R15 — itens 'daytrip' saem dos saltos e são relatados à parte; limite por cidade.
  // Em dia de bate-volta, refeições ficam fora do stray e dos saltos (o jantar é perto do hotel).
  const maxHop = maxHopKmFor(ctx.destination);
  let worst = { km: 0, label: '' };
  let withCoords = 0, catalogTotal = 0;
  const daytripNotes: string[] = [];
  const daytripStray: string[] = [];
  for (const d of days) {
    const catStops = d.activities
      .filter((a) => !isLogistic(a))
      .map((a) => ({ a, cat: catalogItemOf(a, index) }))
      .filter((x): x is { a: PlanDayItem; cat: SuggestedActivity } => !!x.cat);
    const trips = catStops.filter((x) => isDaytrip(x.cat));
    if (trips.length > 0) {
      daytripNotes.push(`bate-volta: ${trips.length} no dia ${d.day}`);
      const tripCoords = trips.map((t) => curatedCoordOf(t.a.id)).filter((c): c is { lat: number; lng: number } => !!c);
      for (const o of catStops) {
        if (isDaytrip(o.cat) || MEALS.has(o.cat.category)) continue;
        const c = curatedCoordOf(o.a.id);
        if (!c || tripCoords.length === 0) continue;
        const km = Math.min(...tripCoords.map((t) => haversineKm(t, c)));
        if (km > DAYTRIP_STRAY_KM) daytripStray.push(`dia ${d.day}: ${o.a.name} a ${fmt(km)} km do bate-volta`);
      }
    }
    const stops = catStops
      .filter((x) => !isDaytrip(x.cat) && (x.cat.durationHours || 0) < DAY_TRIP_HOURS)
      .filter((x) => trips.length === 0 || !MEALS.has(x.cat.category))
      .sort((x, y) => toMinutes(x.a.time) - toMinutes(y.a.time));
    let prev: { name: string; c: { lat: number; lng: number } } | null = null;
    for (const s of stops) {
      catalogTotal++;
      const c = curatedCoordOf(s.a.id);
      if (!c) continue;
      withCoords++;
      if (prev) {
        const km = haversineKm(prev.c, c);
        if (km > worst.km) worst = { km, label: `dia ${d.day}: ${prev.name} → ${s.a.name}` };
      }
      prev = { name: s.a.name, c };
    }
  }
  const extras = [
    `limite ${maxHop} km`,
    `sem coords ${catalogTotal - withCoords}/${catalogTotal}`,
    ...daytripNotes,
    ...daytripStray,
  ].join(' · ');
  const hopWarn = !!worst.label && worst.km > maxHop;
  const r15: PlanRuleResult = worst.label || daytripNotes.length
    ? {
        rule: 'R15 GEO',
        status: hopWarn || daytripStray.length > 0 ? 'WARN' : 'PASS',
        detail: `${worst.label ? `pior ${fmt(worst.km)} km ${worst.label}` : 'nenhum par com coords'} · ${extras}`,
      }
    : { rule: 'R15 GEO', status: 'SKIP', detail: `nenhum par com coords · ${extras}` };

  // R16
  let worstDay: { over: number; label: string } | null = null;
  let measured = 0;
  days.forEach((d, i) => {
    const u = dayWindowUsage(days, ctx, i, [], index);
    if (!u || u.items === 0) return;
    const { used, window } = u;
    measured++;
    const over = used - window;
    if (!worstDay || over > worstDay.over) worstDay = { over, label: `dia ${d.day}: ${fmt(used)}/${fmt(window)} h` };
  });
  const wd = worstDay as { over: number; label: string } | null;
  const r16: PlanRuleResult = !wd || measured === 0
    ? { rule: 'R16 TEMPO', status: 'SKIP', detail: 'nenhum dia mensurável' }
    : { rule: 'R16 TEMPO', status: wd.over > 0 ? 'WARN' : 'PASS', detail: `pior ${wd.label}` };

  return [r13, r14, r15, r16];
}

// ─────────────────────────────────────────────────────────────────────────────
// R19 — sequência do dia (diagnóstico C.4). Fora de validatePlanRules: R13–R16 não mudam.
// R16 soma horas; R19 olha a ordem — fim de um item contra o início do seguinte.
// ─────────────────────────────────────────────────────────────────────────────

export type SequenceCause = 'a' | 'b' | 'c' | 'd';
export interface SequenceIssue {
  day: number;
  kind: 'overlap' | 'tight' | 'madrugada' | 'chegada' | 'partida';
  status: 'WARN' | 'FAIL';
  /** (a) item ≥ 4 h de manhã/tarde com refeição depois · (b) 00:00–05:59 inventado · (c) chegada/partida · (d) outro. */
  cause: SequenceCause;
  text: string;
}
export interface SequenceDay { day: number; status: 'PASS' | 'WARN' | 'FAIL'; issues: SequenceIssue[] }
export interface SequenceReport {
  rule: 'R19 SEQUÊNCIA';
  status: 'PASS' | 'WARN' | 'FAIL';
  days: SequenceDay[];
  pass: number;
  warn: number;
  fail: number;
  detail: string;
}

export const OVERLAP_TOLERANCE_MIN = 15;
/** Deslocamento após bate-volta/longo — o DEFAULT_HOP_MIN do motor (R4). */
const DAYTRIP_HOP_MIN = 15;
/** Decisão D1 (C.4-diag): check-in/check-out são 30 min, não 1 h. */
const HOTEL_DESK_MIN = 30;

const isFlightItem = (a: PlanDayItem) => a.timeSlot === 'flight' || a.type === 'flight' || a.type === 'voo';
const isTransferItem = (a: PlanDayItem) => /transfer|aeroporto/i.test(a.name);
const isCheckinItem = (a: PlanDayItem) => a.type === 'checkin' || /slot-checkin$/.test(a.id) || /check-?in/i.test(a.name);
const isCheckoutItem = (a: PlanDayItem) => a.type === 'checkout' || /slot-checkout$/.test(a.id) || /check-?out/i.test(a.name);
const isMealItem = (a: PlanDayItem, cat: SuggestedActivity | null) =>
  MEALS.has(a.timeSlot ?? '') || MEALS.has(a.type ?? '') || (!!cat && MEALS.has(cat.category));
const isLogisticItem = (a: PlanDayItem) =>
  isFlightItem(a) || isTransferItem(a) || isCheckinItem(a) || isCheckoutItem(a) || a.timeSlot === 'hotel';

/** Mesma conta de logisticsLine (itineraryEngine; importar dá ciclo): ≤ 1,2 km a pé a 5 km/h; senão táxi a 20 km/h + 5 min. */
const hopMinutes = (a: { lat: number; lng: number } | null, b: { lat: number; lng: number } | null): number => {
  if (!a || !b) return 0;
  const km = haversineKm(a, b);
  return km <= 1.2 ? (km / 5) * 60 : (km / 20) * 60 + 5;
};

const hm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export function validateDaySequence(days: PlanDay[], ctx: PlanRulesContext): SequenceReport {
  const index = catalogIndex(ctx.destination);
  const lastIdx = days.length - 1;
  const arrivalIdx = ctx.arrivalDate && ctx.arrivalTime ? arrivalIndexOf(days, ctx) : -1;
  const arrivalMin = toMinutes(ctx.arrivalTime);
  const city = ctx.destination;

  const out: SequenceDay[] = days.map((d, i) => {
    const issues: SequenceIssue[] = [];
    const items = d.activities
      .filter((a) => toMinutes(a.time) >= 0)
      .map((a) => {
        const cat = catalogItemOf(a, index);
        const start = toMinutes(a.time);
        let mins = itemHours(a, cat) * 60;
        if (isCheckinItem(a) || isCheckoutItem(a)) mins = HOTEL_DESK_MIN;
        else if (mins <= 0) mins = isMealItem(a, cat) ? 90 : isLogisticItem(a) ? 60 : 90;
        let end = start + mins;
        if (isFlightItem(a) && /out/.test(a.id)) {
          const sameDay = ctx.arrivalDate && String(d.date ?? '').slice(0, 10) === ctx.arrivalDate;
          end = sameDay && arrivalMin >= start ? arrivalMin : 24 * 60;
        }
        return { a, cat, start, end, hours: mins / 60 };
      })
      .sort((x, y) => x.start - y.start);
    const label = (x: (typeof items)[number]) => `${x.a.name} ${hm(x.start)}`;
    const span = (x: (typeof items)[number]) => `${x.a.name} ${hm(x.start)}–${hm(x.end)}`;

    // R19 — sobreposição / colado demais, contra o item de maior fim até aqui.
    let lead: (typeof items)[number] | null = null;
    for (const b of items) {
      if (lead) {
        const a = lead;
        const pair = `${city} D${d.day}: ${span(a)} × ${label(b)}`;
        const logisticPair = [a.a, b.a].some(isLogisticItem);
        if (b.start < a.end - OVERLAP_TOLERANCE_MIN) {
          const cause: SequenceCause =
            a.hours >= 4 && ['morning', 'afternoon'].includes(a.a.timeSlot ?? '') && isMealItem(b.a, b.cat) ? 'a'
            : logisticPair ? 'c' : 'd';
          issues.push({ day: d.day, kind: 'overlap', status: 'FAIL', cause, text: pair });
        } else {
          // R4 do motor: saindo de bate-volta/longo, 15 min — a duração do catálogo já inclui a volta.
          const fromTrip = (!!a.cat && isDaytrip(a.cat)) || (a.hours >= 4 && a.a.timeSlot === 'morning');
          const hop = fromTrip ? DAYTRIP_HOP_MIN : hopMinutes(curatedCoordOf(a.a.id), curatedCoordOf(b.a.id));
          if (b.start < a.end + hop) {
            issues.push({ day: d.day, kind: 'tight', status: 'WARN', cause: logisticPair ? 'c' : 'd', text: `${pair} (deslocamento ~${Math.round(hop)} min)` });
          }
        }
      }
      if (!lead || b.end > lead.end) lead = b;
    }

    // R19b — madrugada inventada. Voo, transfer e check-out isentos (C.4 D4); café e atividade não.
    for (const x of items) {
      if (x.start >= 6 * 60) continue;
      if (isFlightItem(x.a)) continue;
      if (isTransferItem(x.a) || isCheckoutItem(x.a)) continue; // derivados do voo (R10/R11), nunca inventados
      issues.push({ day: d.day, kind: 'madrugada', status: 'FAIL', cause: 'b', text: `${city} D${d.day}: ${label(x)} (horário inventado)` });
    }

    // R19c — partida: tudo termina até o transfer; chegada: nada antes do pouso + 60 min.
    if (i === lastIdx) {
      const transfer = items.find((x) => isTransferItem(x.a));
      if (transfer) {
        for (const x of items) {
          if (x === transfer || isFlightItem(x.a) || isTransferItem(x.a)) continue;
          if (x.end > transfer.start) {
            issues.push({ day: d.day, kind: 'partida', status: 'FAIL', cause: 'c', text: `${city} D${d.day}: ${span(x)} × ${label(transfer)}` });
          }
        }
      }
    }
    if (i === arrivalIdx && arrivalMin >= 0) {
      for (const x of items) {
        if (isFlightItem(x.a) || isTransferItem(x.a) || isCheckinItem(x.a)) continue;
        if (x.start < arrivalMin + 60) {
          issues.push({ day: d.day, kind: 'chegada', status: 'FAIL', cause: 'c', text: `${city} D${d.day}: ${label(x)} antes do pouso ${hm(arrivalMin)} + 60 min` });
        }
      }
    }

    const status = issues.some((x) => x.status === 'FAIL') ? 'FAIL' : issues.length ? 'WARN' : 'PASS';
    return { day: d.day, status, issues };
  });

  const pass = out.filter((x) => x.status === 'PASS').length;
  const warn = out.filter((x) => x.status === 'WARN').length;
  const fail = out.filter((x) => x.status === 'FAIL').length;
  // D3: status da viagem = pior dia.
  const status = fail ? 'FAIL' : warn ? 'WARN' : 'PASS';
  const first = out.flatMap((x) => x.issues).find((x) => x.status === 'FAIL');
  return {
    rule: 'R19 SEQUÊNCIA', status, days: out, pass, warn, fail,
    detail: `dias ${pass}P/${warn}W/${fail}F${first ? ` · ${first.text}` : ''}`,
  };
}
