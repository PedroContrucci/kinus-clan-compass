import { describe, it, expect, vi } from 'vitest';
import before from './fixtures/itineraryEngine.before.json';
import {
  runItineraryEngine,
  RECOVERY_BY_SEVERITY,
  resolveSameDayClashes,
  placeSlug,
  computeBuckets,
  dayHoursUsed,
  engineHotelCoord,
  EXPLORATION_WINDOW_HOURS,
  DAYTRIP_DINNER_KM,
  swapCandidates,
  logisticsLine,
  nextDayClock,
  layoutDay,
  hopMinutes,
  REST_DINNER_TIP,
  LUNCH_ON_SITE_TIP,
  type JetLagSeverity,
  type SelectedFlight,
} from '@/lib/itineraryEngine';
import { normalizePlaceName } from '@/lib/placeIdentity';
import { getDestinationActivities } from '@/data/destinationActivities';
import { matchesPriority } from '@/lib/claChips';
import { curatedCoordOf } from '@/lib/routeCoords';
import { haversineKm } from '@/lib/itineraryValidator';
import { getHotelRecommendation } from '@/lib/hotelZones';
import { addDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';

// Snapshot capturado do generateItinerary ANTES da extração (GeneratedItineraryStage.tsx);
// dias regravados na B.3 só onde geo/tempo/bate-volta mudaram a saída de propósito.
// Adendo C.4: as 4 cidades regravadas pelo scheduler (layoutDay) — horas calculadas da sequência,
// "Descanso" vira dica do jantar, último dia de trás pra frente (transfer = partida − 3 h − 45 min),
// durações em hora decimal. Escolhas mudam onde a regra 2 tira tarde/almoço do dia longo, onde a
// tarde passa a recusar item ≥ 4 h e onde o último dia ganha almoço/tarde depois do check-out (D1).
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d),
  source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '7.5h', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
const CASES: [string, JetLagSeverity][] = [
  ['Cartagena', 'MODERADO'], ['Lisboa', 'MODERADO'], ['Tóquio', 'SEVERO'], ['Fortaleza', 'BAIXO'],
];

const RENAMES: [RegExp, string][] = [
  [/^(day-\d+-)free-/, '$1slot-free-'],
  [/^(day-\d+-)flight-out$/, '$1slot-flight-out'],
  [/^(day-\d+-)flight-return$/, '$1slot-flight-back'],
  [/^(day-\d+-)breakfast-hotel$/, '$1slot-breakfast'],
  [/^(day-\d+-)(checkin|ambient-walk|walk|rest|transit|checkout|transfer)$/, '$1slot-$2'],
];

type Act = { id: string; name: string; timeSlot: string };
type Out = { days: { activities: Act[] }[] };

function renameOld(out: Out): Out {
  const copy = JSON.parse(JSON.stringify(out)) as Out;
  for (const d of copy.days) for (const a of d.activities) {
    if (/-dinner-michelin$/.test(a.id)) {
      const name = a.name.replace(/\s*⭐+\s*Michelin$/, '');
      a.id = a.id.replace(/dinner-michelin$/, `michelin-${placeSlug(name)}`);
      continue;
    }
    for (const [re, to] of RENAMES) if (re.test(a.id)) { a.id = a.id.replace(re, to); break; }
  }
  return copy;
}

describe('itineraryEngine — extração sem mudança de comportamento', () => {
  for (const [city, sev] of CASES) {
    it(`${city} (${sev}): saída idêntica ao snapshot, salvo os ids renomeados`, () => {
      const r = runItineraryEngine({
        departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
        destination: city, origin: 'São Paulo',
        outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
        budget: 20000, travelers: 2, interests: ['gastronomia', 'cultura'], jetLagSeverity: sev, priceLevel: 'midrange',
      });
      const now = JSON.parse(JSON.stringify({ days: r.days, breakdown: r.breakdown, meta: r.meta }));
      const expected = renameOld((before as Record<string, Out>)[city]);
      expect(now).toEqual(expected);
      expect(r.buckets).toEqual(computeBuckets(r.days, r.breakdown));
      expect(r.buckets.totalPlanned).toBe(r.buckets.flightsPlanned + r.buckets.hotelPlanned + r.buckets.foodPlanned + r.buckets.toursPlanned);
      for (const d of r.days) for (const a of d.activities) expect(a.id).toMatch(/^day-\d+-/);
    });
  }

  it('Michelin vira day-N-michelin-<slug>', () => {
    const ids = renameOld((before as Record<string, Out>)['Lisboa']).days.flatMap((d) => d.activities.map((a) => a.id));
    expect(ids.some((id) => /^day-\d+-michelin-[a-z0-9-]+$/.test(id))).toBe(true);
  });
});

describe('itineraryEngine — peças', () => {
  it('RECOVERY_BY_SEVERITY preserva a regra (MODERADO/ALTO/SEVERO)', () => {
    expect(RECOVERY_BY_SEVERITY).toEqual({ BAIXO: false, MODERADO: true, ALTO: true, SEVERO: true });
  });
  it('colisão no mesmo dia → day-N-slot-dup-<k> com aviso', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const days = [{ dayNumber: 3, activities: [{ id: 'day-3-x' }, { id: 'day-3-x' }, { id: 'day-3-x' }] }];
    resolveSameDayClashes(days);
    expect(days[0].activities.map((a) => a.id)).toEqual(['day-3-x', 'day-3-slot-dup-1', 'day-3-slot-dup-2']);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
  it('placeSlug segue o nome normalizado', () => {
    expect(placeSlug('Belcanto')).toBe(normalizePlaceName('Belcanto'));
    expect(placeSlug('Alma — Henrique Sá Pessoa')).toBe('alma-henrique-sa-pessoa');
  });
  it('hotel informado substitui o rótulo da zona no check-in', () => {
    const r = runItineraryEngine({
      departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
      destination: 'Lisboa', origin: 'São Paulo',
      outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
      budget: 20000, travelers: 2, priceLevel: 'midrange', hotel: { label: 'Hotel Teste' },
    });
    const checkins = r.days.flatMap((d) => d.activities).filter((a) => a.type === 'checkin');
    expect(checkins.length).toBeGreaterThan(0);
    expect(checkins.some((a) => a.location === 'Hotel Teste' || a.name === 'Hotel Teste')).toBe(true);
  });
});

describe('itineraryEngine — B.3 interesse, tempo e dia', () => {
  const run = (city: string, interests: string[], priceLevel: 'budget' | 'midrange' | 'luxury' = 'midrange') => runItineraryEngine({
    departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
    destination: city, origin: 'São Paulo',
    outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
    budget: 20000, travelers: 2, interests, jetLagSeverity: 'BAIXO', priceLevel,
  });
  const catOf = (city: string, id: string) => getDestinationActivities(city).find((a) => id === id.match(/^day-\d+-/)?.[0] + a.id);
  const isTrip = (city: string, id: string) => (catOf(city, id)?.styleTags ?? []).includes('daytrip') && !/-(almoco|jantar)$/.test(id);
  const CITIES = ['Lisboa', 'Tóquio', 'Cartagena', 'Fortaleza', 'Porto Seguro', 'Paris', 'Bangkok', 'Cidade do Cabo'];

  it('janela: dia de exploração cabe em 14 h; chegada cabe em 22 h − pouso', () => {
    for (const city of CITIES) for (const ints of [[], ['culture', 'family']]) {
      const r = run(city, ints);
      for (const d of r.days) if (d.label === 'Exploração') expect(dayHoursUsed(d.activities), `${city} dia ${d.dayNumber}`).toBeLessThanOrEqual(EXPLORATION_WINDOW_HOURS);
      expect(dayHoursUsed(r.days[0].activities)).toBeLessThanOrEqual(22 - 15.5);
    }
  });

  it('bate-volta: nunca no 1º/último dia nem em dias seguidos; o dia é só café no hotel + bate-volta + par + jantar', () => {
    for (const city of CITIES) for (const ints of [[], ['nature', 'family'], ['culture', 'history']]) {
      const r = run(city, ints);
      const tripDays = r.days.filter((d) => d.activities.some((a) => isTrip(city, a.id))).map((d) => d.dayNumber);
      expect(tripDays).not.toContain(1);
      expect(tripDays).not.toContain(r.days.length);
      for (let k = 1; k < tripDays.length; k++) expect(tripDays[k] - tripDays[k - 1], city).toBeGreaterThan(1);
      for (const n of tripDays) {
        const acts = r.days[n - 1].activities;
        expect(acts.filter((a) => isTrip(city, a.id))).toHaveLength(1);
        expect(acts.find((a) => a.timeSlot === 'breakfast')?.id).toMatch(/-slot-breakfast$/);
        expect(acts.filter((a) => ['afternoon', 'night'].includes(a.timeSlot))).toHaveLength(0);
      }
    }
  });

  // C.4 regra 2: Caraíva (8h) termina depois das 14:30 → o par vira "Almoço no local: <par>" no bate-volta.
  it('par <id>-almoco que não cabe vira a dica do bate-volta (nunca item noutro dia); jantar a ≤ 5 km do hotel', () => {
    const r = run('Porto Seguro', ['culture']);
    const day = r.days.find((d) => d.activities.some((a) => /-ps5-caraiva$/.test(a.id)))!;
    expect(day).toBeDefined();
    const trip = day.activities.find((a) => /-ps5-caraiva$/.test(a.id))!;
    expect(trip.tips?.[0]).toMatch(/^Bate-volta: ocupa o dia inteiro · Almoço no local: /);
    expect(r.days.some((d) => d.activities.some((a) => /-ps5-caraiva-almoco$/.test(a.id)))).toBe(false);
    const dinner = day.activities.find((a) => a.timeSlot === 'dinner')!;
    const hotel = engineHotelCoord('Porto Seguro', getHotelRecommendation('Porto Seguro', 'midrange', ['culture'])?.name)!;
    expect(haversineKm(hotel, curatedCoordOf(dinner.id)!)).toBeLessThanOrEqual(DAYTRIP_DINNER_KM);
  });

  it('interesse: ≥ 50 % dos EXP de catálogo da exploração caem nos 2 interesses do topo', () => {
    for (const [city, ints] of [['Lisboa', ['gastronomy', 'culture']], ['Tóquio', ['culture', 'adventure']], ['Paris', ['culture', 'art']]] as const) {
      const r = run(city, [...ints]);
      const exp = r.days.filter((d) => d.label === 'Exploração').flatMap((d) => d.activities)
        .filter((a) => ['morning', 'afternoon', 'night'].includes(a.timeSlot)).map((a) => catOf(city, a.id)).filter((c) => !!c && !['breakfast', 'lunch', 'dinner'].includes(c.category));
      const hit = exp.filter((c) => ints.some((p) => matchesPriority({ category: c!.category, styleTags: c!.styleTags ?? [] }, p))).length;
      expect(hit / exp.length, city).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('sem interesse válido → mesma saída que sem interesse', () => {
    const strip = (x: ReturnType<typeof run>) => JSON.stringify(x.days);
    expect(strip(run('Lisboa', ['xyz-nao-e-chip']))).toBe(strip(run('Lisboa', [])));
  });

  it('Michelin preservado no dia de gastronomia', () => {
    const r = run('Lisboa', ['gastronomy', 'culture']);
    expect(r.meta.michelinCount).toBe(1);
    expect(r.days.flatMap((d) => d.activities).some((a) => /^day-\d+-michelin-/.test(a.id))).toBe(true);
  });
});

describe('C.3a — trocar com duração do catálogo, logística real, check-in pós-meia-noite', () => {
  // Fortaleza, doméstico, volta 18:00 → último dia até 16:00. Manhã às 10:00, check-out na hora dada.
  const fortaleza = (checkout: string, morningId = 'for-parque-coco') => ({
    destination: 'Fortaleza',
    travelInterests: ['gastronomy', 'culture'],
    outboundFlight: { option: { arrivalTime: '12:00' } },
    returnFlight: { international: false, option: { departureTime: '18:00' } },
    days: [
      { day: 1, date: '2026-11-10', activities: [{ id: 'day-0-for-dragao-do-mar', name: 'Centro Dragão do Mar', time: '15:00', timeSlot: 'afternoon', duration: '3h' }] },
      { day: 2, date: '2026-11-11', activities: [
        { id: 'day-1-slot-breakfast', name: 'Café da manhã no hotel', time: '08:00', timeSlot: 'breakfast', type: 'breakfast', duration: '1h' },
        { id: `day-1-${morningId}`, name: 'Parque do Cocó', time: '10:00', timeSlot: 'morning', type: 'experience', duration: '2h' },
        { id: 'day-1-slot-checkout', name: 'Check-out do hotel', time: checkout, timeSlot: 'hotel', type: 'transport' },
        { id: 'day-1-slot-transfer', name: 'Transfer para o aeroporto', time: '15:00', timeSlot: 'hotel', type: 'transport' },
      ] },
    ],
  });

  it('último dia, manhã 10:00 com check-out 11:00: Atlantiz (5h) fora; nada de 2h+ cabe em 1h', () => {
    const c = swapCandidates(fortaleza('11:00'), 1, 'day-1-for-parque-coco');
    expect(c.map((x) => x.activity.id)).not.toContain('for-barraca-atlantiz');
    // O catálogo de Fortaleza não tem manhã ≤ 1h: o vão de 1h deixa a lista vazia (sem sorteio).
    expect(c).toEqual([]);
  });

  it('check-out 12:00: só cabem as de ≤ 2h, cada uma com a PRÓPRIA duração; Atlantiz segue fora', () => {
    const c = swapCandidates(fortaleza('12:00'), 1, 'day-1-for-parque-coco');
    expect(c.length).toBeGreaterThan(0);
    expect(c.length).toBeLessThanOrEqual(6);
    expect(c.map((x) => x.activity.id)).not.toContain('for-barraca-atlantiz');
    for (const x of c) {
      expect(x.hours).toBe(x.activity.durationHours);
      expect(x.hours).toBeLessThanOrEqual(2);
      expect(x.why).toMatch(/cabe/);
    }
  });

  it('candidatas: mesma categoria, nunca o que a viagem já usa (id nem nome)', () => {
    const trip = fortaleza('16:00');
    const c = swapCandidates(trip, 1, 'day-1-for-parque-coco');
    expect(c.length).toBeGreaterThan(0);
    for (const x of c) expect(x.activity.category).toBe('morning');
    const ids = c.map((x) => x.activity.id);
    expect(ids).not.toContain('for-parque-coco');
    expect(ids).not.toContain('for-dragao-do-mar');
    // Interesse top-2 primeiro (gastronomia/cultura batem por tag).
    expect(c[0].why).toMatch(/^interesse: /);
  });

  it('nada cabe → lista vazia; logística e voo nunca têm alternativa', () => {
    const trip = fortaleza('10:00');
    expect(swapCandidates(trip, 1, 'day-1-for-parque-coco')).toEqual([]);
    expect(swapCandidates(trip, 1, 'day-1-slot-checkout')).toEqual([]);
  });

  it('logisticsLine: 800 m → a pé; 6 km → táxi; uma ponta sem coords → undefined', () => {
    const a = { lat: -3.7300, lng: -38.5000 };
    const b800 = { lat: a.lat + 0.8 / 111.2, lng: a.lng };
    const b6 = { lat: a.lat + 6 / 111.2, lng: a.lng };
    expect(logisticsLine(a, b800)).toBe('~10 min a pé');
    expect(logisticsLine(a, b6)).toBe('~25 min de táxi');
    expect(logisticsLine(a, null)).toBeUndefined();
    expect(logisticsLine(undefined, b6)).toBeUndefined();
  });

  it('check-in 23:35 + 1h → "00:35 (+1)", no mesmo dia, com a dica noturna', () => {
    expect(nextDayClock(23 * 60 + 35 + 60)).toBe('00:35 (+1)');
    expect(nextDayClock(22 * 60 + 10)).toBe('22:10');
    const late: SelectedFlight = {
      date: new Date('2026-11-10T12:00:00'), source: 'estimate',
      option: { id: 'e', airline: 'A confirmar', route: 'GRU → FOR', isDirect: true, duration: '3h25', durationMinutes: 205, price: 900, departureTime: '20:10', arrivalTime: '23:35' },
    };
    const r = runItineraryEngine({
      departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-15T12:00:00'),
      destination: 'Fortaleza', origin: 'São Paulo', outboundFlight: late,
      returnFlight: flight('2026-11-15T12:00:00', '18:00'), budget: 15000, travelers: 2, priceLevel: 'midrange',
    });
    const checkin = r.days[0].activities.find((a) => a.type === 'checkin');
    expect(checkin?.time).toBe('00:35 (+1)');
    expect(checkin?.tips?.[0]).toBe('Chegada noturna: descanse — o roteiro começa amanhã');
    expect(r.days[1].activities.some((a) => a.type === 'checkin')).toBe(false);
  });

  it('nenhum texto fixo de logística sobrevive: motor e PDF', async () => {
    for (const city of ['Lisboa', 'Fortaleza', 'Tóquio']) {
      const r = runItineraryEngine({
        departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
        destination: city, origin: 'São Paulo',
        outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
        budget: 20000, travelers: 2, priceLevel: 'midrange',
      });
      expect(JSON.stringify(r.days)).not.toMatch(/min de t[aá]xi|min a p[eé]|taxi\/transporte/);
    }
    const { readFileSync } = await import('node:fs');
    const pdf = readFileSync('src/lib/tripPdfExport.ts', 'utf8');
    expect(pdf).not.toMatch(/~10 min a pe|~20 min de taxi/);
  });
});

// C.4 — scheduler: o dia é uma sequência (layoutDay). Mesmo caminho do smoke (buildDraftTrip, 2 pax, Conforto, 10/nov).
describe('C.4 — layoutDay: a hora vem da sequência', () => {
  type A = { id: string; name: string; time: string; duration: string; timeSlot?: string; description?: string };
  type D = { day: number; activities: A[] };
  const mins = (t: string) => { const m = t.match(/^(\d{2}):(\d{2})/)!; return Number(m[1]) * 60 + Number(m[2]); };
  const dur = (a: A) => Math.round(parseFloat(a.duration) * 60);
  const draft = async (city: string, interests: string[], returnDeparture?: string): Promise<D[]> => {
    const from = new Date(2026, 10, 10);
    const input = buildFlowInput({ city, origin: 'São Paulo', from, to: addDays(from, 7), adults: 2, children: 0, tier: 'comfort' });
    input.travelInterests = interests;
    input.priorities = interests;
    const routeLookup = async (origin: string, destination: string) => returnDeparture
      ? { origin, destination, economyMin: 0, economyAvg: 0, economyMax: 0, businessAvg: 0, typicalReturnDeparture: returnDeparture }
      : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((await buildDraftTrip(input, { routeLookup })) as any).days;
  };
  const GC = ['gastronomy', 'culture'];

  it('Fortaleza gc D2: Crocobeach ocupa o dia — sem tarde; almoço depois do fim + deslocamento ou "no local"', async () => {
    const d2 = (await draft('Fortaleza', GC))[1].activities;
    const beach = d2.find((a) => /Crocobeach/.test(a.name))!;
    expect(beach).toBeDefined();
    expect(d2.filter((a) => a.timeSlot === 'afternoon')).toEqual([]);
    const lunch = d2.find((a) => a.timeSlot === 'lunch');
    if (lunch) expect(mins(lunch.time)).toBeGreaterThanOrEqual(mins(beach.time) + dur(beach) + 5);
    else expect(beach.description).toMatch(new RegExp(LUNCH_ON_SITE_TIP));
  });

  it('Paris gc D2: Septime 19:30 é o último item; "Descanso" virou a dica do jantar', async () => {
    const d2 = (await draft('Paris', GC))[1].activities;
    const septime = d2.find((a) => a.name === 'Septime')!;
    expect(septime.time).toBe('19:30');
    expect(septime.description).toBe(REST_DINNER_TIP);
    expect(d2.some((a) => /Descanso/.test(a.name))).toBe(false);
    expect(d2.at(-1)).toBe(septime);
  });

  it('Rio gc D2: Aprazível (2,5 h) empurra a Mureta da Urca — começa no fim + deslocamento', async () => {
    const d2 = (await draft('Rio de Janeiro', GC))[1].activities;
    const lunch = d2.find((a) => a.name === 'Aprazível')!;
    const mureta = d2.find((a) => a.name === 'Mureta da Urca')!;
    expect(dur(lunch)).toBe(150);
    const end = mins(lunch.time) + 150;
    expect(mins(mureta.time)).toBe(Math.max(15 * 60, end + hopMinutes(lunch, mureta)));
    expect(mins(mureta.time)).toBeGreaterThan(end);
  });

  it('volta 02:30 doméstica (Fortaleza): check-out 23:15 e transfer 23:45 na véspera, sem noite; o dia de volta é só o voo', async () => {
    const days = await draft('Fortaleza', GC, '02:30');
    const eve = days.at(-2)!.activities;
    expect(eve.find((a) => /-slot-checkout$/.test(a.id))!.time).toBe('23:15');
    expect(eve.find((a) => /-slot-transfer$/.test(a.id))!.time).toBe('23:45');
    expect(eve.some((a) => a.timeSlot === 'night')).toBe(false);
    expect(eve.find((a) => a.timeSlot === 'dinner')!.description).toBe('Saída 23:45 — jantar leve antes do check-out');
    expect(days.at(-1)!.activities.map((a) => `${a.time} ${a.id.replace(/^day-\d+-/, '')}`)).toEqual(['02:30 slot-flight-back']);
  });

  it('volta 02:30 internacional (Paris): check-out 22:15, transfer 22:45 na véspera; nenhum 00:00 travado', async () => {
    const days = await draft('Paris', GC, '02:30');
    const eve = days.at(-2)!.activities;
    expect(eve.find((a) => /-slot-checkout$/.test(a.id))!.time).toBe('22:15');
    expect(eve.find((a) => /-slot-transfer$/.test(a.id))!.time).toBe('22:45');
    expect(days.flatMap((d) => d.activities).filter((a) => a.time === '00:00')).toEqual([]);
    const dinner = eve.find((a) => a.timeSlot === 'dinner')!;
    expect(mins(dinner.time) + dur(dinner)).toBeLessThanOrEqual(mins('22:15'));
  });

  it('R7: jantar empurrado além das 21:00 → sai a tarde (não o jantar)', () => {
    const items: { id: string; name: string; timeSlot: string; duration: string; time?: string }[] = [
      { id: 'x-manha', name: 'Manhã', timeSlot: 'morning', duration: '2h' },
      { id: 'x-almoco', name: 'Almoço', timeSlot: 'lunch', duration: '1.5h' },
      { id: 'x-tarde', name: 'Tarde longa', timeSlot: 'afternoon', duration: '3h' },
      // 18:15 cabe no pôr do sol (≤ 18:30), mas termina 21:15 → o jantar iria a 21:30 (> 21:00).
      { id: 'x-tarde2', name: 'Pôr do sol no mirante', timeSlot: 'afternoon', duration: '3h' },
      { id: 'x-jantar', name: 'Jantar', timeSlot: 'dinner', duration: '2h' },
    ];
    const r = layoutDay(items, { destination: 'Lisboa' });
    expect(r.items.map((a) => a.id)).toEqual(['x-manha', 'x-almoco', 'x-tarde', 'x-jantar']);
    expect(r.dropped.map((a) => a.id)).toEqual(['x-tarde2']);
    expect(r.items.map((a) => a.time)).toEqual(['09:30', '12:30', '15:00', '19:30']);
  });
});
