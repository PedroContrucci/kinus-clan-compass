import { destinationActivities, SuggestedActivity } from '@/data/destinationActivities';

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
  const nameToDays = new Map<string, number[]>();
  for (const day of days) {
    for (const a of day.activities) {
      if (isGeneric(a.name)) continue;
      const arr = nameToDays.get(a.name) || [];
      arr.push(day.dayNumber);
      nameToDays.set(a.name, arr);
    }
  }
  const dupes: string[] = [];
  nameToDays.forEach((d, name) => {
    if (d.length > 1) dupes.push(`${name} (days ${d.join(', ')})`);
  });
  results.push(
    dupes.length === 0
      ? { rule: 'R5 NO DUPLICATES', status: 'PASS' }
      : { rule: 'R5 NO DUPLICATES', status: 'FAIL', detail: dupes.join(' | ') }
  );

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
