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
  type JetLagSeverity,
  type SelectedFlight,
} from '@/lib/itineraryEngine';
import { normalizePlaceName } from '@/lib/placeIdentity';
import { getDestinationActivities } from '@/data/destinationActivities';
import { matchesPriority } from '@/lib/claChips';
import { curatedCoordOf } from '@/lib/routeCoords';
import { haversineKm } from '@/lib/itineraryValidator';
import { getHotelRecommendation } from '@/lib/hotelZones';

// Snapshot capturado do generateItinerary ANTES da extração (GeneratedItineraryStage.tsx);
// dias regravados na B.3 só onde geo/tempo/bate-volta mudaram a saída de propósito.
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

  it('par <id>-almoco fica no dia do bate-volta; jantar a ≤ 5 km do hotel', () => {
    const r = run('Porto Seguro', ['culture']);
    const day = r.days.find((d) => d.activities.some((a) => /-ps5-caraiva$/.test(a.id)))!;
    expect(day).toBeDefined();
    expect(day.activities.some((a) => /-ps5-caraiva-almoco$/.test(a.id))).toBe(true);
    const caraivaAlmocoDays = r.days.filter((d) => d.activities.some((a) => /-ps5-caraiva-almoco$/.test(a.id)));
    expect(caraivaAlmocoDays).toEqual([day]);
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
