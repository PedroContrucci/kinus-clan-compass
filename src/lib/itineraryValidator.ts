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

function toMinutes(t?: string): number {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
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

const isLogistic = (a: PlanDayItem) =>
  LOGISTIC_SLOTS.has(a.timeSlot ?? '') || LOGISTIC_SLOTS.has(a.type ?? '') || a.type === 'checkin' || a.type === 'checkout' || /transfer|aeroporto/i.test(a.name);

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

export function validatePlanRules(days: PlanDay[], ctx: PlanRulesContext): PlanRuleResult[] {
  const index = catalogIndex(ctx.destination);
  const lastIdx = days.length - 1;
  const arrivalIdx = (() => {
    const i = ctx.arrivalDate ? days.findIndex((d) => String(d.date ?? '').slice(0, 10) === ctx.arrivalDate) : -1;
    return i >= 0 ? i : 0;
  })();
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

  // R15
  let worst = { km: 0, label: '' };
  let withCoords = 0, catalogTotal = 0;
  for (const d of days) {
    const stops = d.activities
      .filter((a) => !isLogistic(a))
      .map((a) => ({ a, cat: catalogItemOf(a, index) }))
      .filter((x) => x.cat && (x.cat.durationHours || 0) < DAY_TRIP_HOURS)
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
  const semCoords = `sem coords ${catalogTotal - withCoords}/${catalogTotal}`;
  const r15: PlanRuleResult = worst.label
    ? { rule: 'R15 GEO', status: worst.km > MAX_HOP_KM ? 'WARN' : 'PASS', detail: `pior ${fmt(worst.km)} km ${worst.label} · ${semCoords}` }
    : { rule: 'R15 GEO', status: 'SKIP', detail: `nenhum par com coords · ${semCoords}` };

  // R16
  let worstDay: { over: number; label: string } | null = null;
  let measured = 0;
  days.forEach((d, i) => {
    let window: number;
    if (i < arrivalIdx) return; // em trânsito
    if (i === lastIdx) window = lastDayWindowHours(ctx.returnDepartureTime, ctx.domestic);
    else if (i === arrivalIdx) {
      const arr = hhmm(ctx.arrivalTime);
      window = arr < 0 ? 14 : Math.max(0, 22 - arr);
    } else window = 14;
    const items = d.activities.filter((a) => !isLogistic(a));
    const hours = items.reduce((s, a) => s + itemHours(a, catalogItemOf(a, index)), 0);
    const used = hours + HOP_HOURS * Math.max(0, items.length - 1);
    if (items.length === 0) return;
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
