import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { isEveningItem, validateNaturalTime, type PlanDay, type PlanRulesContext } from '@/lib/itineraryValidator';
import { getActivityPrice } from '@/lib/activityPricing';

// M19e — item de fim de tarde/noite nunca entra num slot de manhã; R22 HORÁRIO NATURAL.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
const run = (city: string, dep: string, ret: string) => runItineraryEngine({
  departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`), destination: city, origin: 'São Paulo',
  outboundFlight: flight(`${dep}T12:00:00`, '08:00'), returnFlight: flight(`${ret}T12:00:00`, '21:00'),
  budget: 20000, travelers: 2, interests: ['gastronomia', 'cultura'], jetLagSeverity: 'BAIXO', priceLevel: 'midrange',
  hotel: { nightlyRate: getActivityPrice('hotel_night', city, 'midrange') },
});
const mins = (t: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(t); return m ? +m[1] * 60 + +m[2] : -1; };
const ctx = (destination: string) => ({ destination }) as PlanRulesContext;
const item = (id: string, name: string, time: string, timeSlot = 'morning') => ({ id, name, time, timeSlot });

describe('M19e — Fortaleza 10–17/11', () => {
  const r = run('Fortaleza', '2026-11-10', '2026-11-17');
  it('veleiro nunca antes das 15:00', () => {
    for (const d of r.days) for (const a of d.activities.filter((x) => x.id.endsWith('-for-veleiro-por-do-sol'))) {
      expect(mins(a.time)).toBeGreaterThanOrEqual(15 * 60);
    }
  });
  it('o último dia continua com algo de manhã (item ou espaço livre)', () => {
    const last = r.days[r.days.length - 1];
    expect(last.activities.some((a) => a.timeSlot === 'morning' && !/check-?out/i.test(a.name))).toBe(true);
  });
  it('R22 PASS', () => {
    const days: PlanDay[] = r.days.map((d) => ({ day: d.dayNumber, date: d.date.toISOString().slice(0, 10), title: d.label,
      activities: d.activities.map((a) => ({ id: a.id, name: a.name, time: a.time, timeSlot: a.timeSlot, type: a.type })) }));
    expect(validateNaturalTime(days, ctx('Fortaleza')).status).toBe('PASS');
  });
});

describe('M19e — isEveningItem / R22', () => {
  it('critério: pôr do sol, night, snack, "à noite", by night, anoitecer', () => {
    expect(isEveningItem({ name: 'Passeio de veleiro ao pôr do sol' })).toBe(true);
    expect(isEveningItem({ name: 'Bar X', category: 'night' })).toBe(true);
    expect(isEveningItem({ name: 'Sorveteria', styleTags: ['snack'] })).toBe(true);
    expect(isEveningItem({ name: 'Empire State à noite' })).toBe(true);
    expect(isEveningItem({ name: 'Rome by night' })).toBe(true);
    expect(isEveningItem({ name: 'Sky Bar ao anoitecer' })).toBe(true);
    expect(isEveningItem({ name: 'Theatro José de Alencar', category: 'afternoon' })).toBe(false);
  });
  it('FAIL: veleiro às 09:30; FAIL: item morning depois das 18:00; PASS no horário natural', () => {
    const day = (acts: ReturnType<typeof item>[]): PlanDay[] => [{ day: 1, date: '2026-11-11', title: 'Exploração', activities: acts }];
    expect(validateNaturalTime(day([item('day-1-for-veleiro-por-do-sol', 'Passeio de veleiro ao pôr do sol', '09:30')]), ctx('Fortaleza')).status).toBe('FAIL');
    expect(validateNaturalTime(day([item('day-1-for-theatro-jose-alencar', 'Theatro José de Alencar', '18:30', 'afternoon')]), ctx('Fortaleza')).status).toBe('PASS'); // afternoon não é morning
    expect(validateNaturalTime(day([item('day-1-for-praia-iracema', 'Praia de Iracema e Ponte dos Ingleses', '19:00')]), ctx('Fortaleza')).status).toBe('FAIL');
    expect(validateNaturalTime(day([item('day-1-for-veleiro-por-do-sol', 'Passeio de veleiro ao pôr do sol', '17:30', 'afternoon')]), ctx('Fortaleza')).status).toBe('PASS');
  });
});

describe('M19e — smoke', () => {
  it('cenário "Fortaleza família dez (2+2)" e Fortaleza/Rio praia-família: R22 PASS', async () => {
    const { runSmokeScenario, runSmokeCase, SMOKE_SCENARIOS, SMOKE_PROFILES } = await import('@/lib/smokeMatrix');
    const deps = { routeLookup: async () => null };
    expect((await runSmokeScenario(SMOKE_SCENARIOS[0], deps)).r22?.status).toBe('PASS');
    const pf = SMOKE_PROFILES.find((p) => p.id === 'praia-familia')!;
    for (const city of ['Fortaleza', 'Rio de Janeiro']) expect((await runSmokeCase(city, pf, new Date(2026, 10, 10), deps)).r22?.status).toBe('PASS');
  });
});
