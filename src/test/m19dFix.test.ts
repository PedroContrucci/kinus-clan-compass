import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { getActivityPrice } from '@/lib/activityPricing';

// M19d-fix — ícone longo só entra se cabe na janela real; tarde nunca vazia por remoção do empacotamento.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 210, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(dep: string, ret: string, o: { pax?: { adults: number; children: number; infants: number }; interests?: string[]; travelers?: number } = {}) {
  return runItineraryEngine({
    departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`), destination: 'Fortaleza', origin: 'São Paulo',
    outboundFlight: flight(`${dep}T12:00:00`, '08:00'), returnFlight: flight(`${ret}T12:00:00`, '21:00'),
    budget: 30000, travelers: o.travelers ?? 2, interests: o.interests ?? ['gastronomia', 'cultura'], jetLagSeverity: 'BAIXO', priceLevel: 'midrange',
    hotel: { label: 'Sonata de Iracema', nightlyRate: getActivityPrice('hotel_night', 'Fortaleza', 'midrange') },
    ...(o.pax ? { pax: o.pax } : {}),
  });
}
const FAMILY = { pax: { adults: 2, children: 2, infants: 0 }, interests: ['beach', 'family'], travelers: 4 };

describe('M19d-fix — Fortaleza 10–15/12 família 2+2', () => {
  const r = run('2026-12-10', '2026-12-15', FAMILY);
  const explorationDays = r.days.filter((d) => d.label === 'Exploração');
  const hasAfternoon = (d: (typeof r.days)[number]) => d.activities.some((a) => a.timeSlot === 'afternoon');
  const isDaytrip = (d: (typeof r.days)[number]) => d.activities.some((a) => /bate-volta/i.test(a.name));

  it('Beach Park presente numa tarde de sex/sáb/dom/seg', () => {
    const days = r.days.filter((d) => d.activities.some((a) => a.id.endsWith('-for-beach-park')));
    expect(days).toHaveLength(1);
    expect([5, 6, 0, 1]).toContain(days[0].date.getDay());
    expect(days[0].activities.find((a) => a.id.endsWith('-for-beach-park'))!.timeSlot).toBe('afternoon');
  });

  it('nenhum dia de exploração (sem bate-volta) com tarde vazia e nenhum thinDay por janela', () => {
    for (const d of explorationDays.filter((x) => !isDaytrip(x))) expect(hasAfternoon(d)).toBe(true);
    expect(r.meta.thinDays.filter((t) => t.reason === 'janela-14h')).toEqual([]);
  });

  it('veleiro nunca no mesmo dia do Beach Park', () => {
    const bp = r.days.find((d) => d.activities.some((a) => a.id.endsWith('-for-beach-park')))!;
    expect(bp.activities.some((a) => a.id.endsWith('-for-veleiro-por-do-sol'))).toBe(false);
  });
});

describe('M19d-fix — Fortaleza 10–17/11 (fixture)', () => {
  it('continua com Beach Park', () => {
    const r = run('2026-11-10', '2026-11-17');
    expect(r.days.some((d) => d.activities.some((a) => a.id.endsWith('-for-beach-park')))).toBe(true);
  });
});

describe('M19d-fix — smoke "Fortaleza família dez (2+2)"', () => {
  it('R20 e R17 ÍCONE passam', async () => {
    const sc = SMOKE_SCENARIOS.find((s) => s.id === 'Fortaleza família dez (2+2)')!;
    const row = await runSmokeScenario(sc, { routeLookup: async () => null });
    expect(row.error).toBeUndefined();
    expect(row.r20?.status).toBe('PASS');
    expect(row.r17icon?.status).toBe('PASS');
  });
});
