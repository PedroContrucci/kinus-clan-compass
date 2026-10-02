import { describe, it, expect, vi } from 'vitest';
import before from './fixtures/itineraryEngine.before.json';
import {
  runItineraryEngine,
  RECOVERY_BY_SEVERITY,
  resolveSameDayClashes,
  placeSlug,
  computeBuckets,
  type JetLagSeverity,
  type SelectedFlight,
} from '@/lib/itineraryEngine';
import { normalizePlaceName } from '@/lib/placeIdentity';

// Snapshot capturado do generateItinerary ANTES da extração (GeneratedItineraryStage.tsx).
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
