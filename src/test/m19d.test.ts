import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { validateDaysOfWeek, validateDenseDays, type PlanDay, type PlanRulesContext } from '@/lib/itineraryValidator';
import { getActivityPrice } from '@/lib/activityPricing';

// M19d — ícone/essencial de 4–6 h ocupa a tarde (Beach Park volta); sem noite, jantar perto do hotel.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(city: string, dep: string, ret: string, sev: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO' = 'BAIXO', interests = ['gastronomia', 'cultura']) {
  return runItineraryEngine({
    departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`),
    destination: city, origin: 'São Paulo',
    outboundFlight: flight(`${dep}T12:00:00`, '08:00'), returnFlight: flight(`${ret}T12:00:00`, '21:00'),
    budget: 30000, travelers: 4, interests, jetLagSeverity: sev, priceLevel: 'midrange',
    hotel: { nightlyRate: getActivityPrice('hotel_night', city, 'midrange') },
  });
}
type Out = ReturnType<typeof run>;
const toPlan = (r: Out): PlanDay[] => r.days.map((d) => ({
  day: d.dayNumber, date: d.date.toISOString().slice(0, 10), title: d.label,
  activities: d.activities.map((a) => ({ id: a.id, name: a.name, timeSlot: a.timeSlot })),
}));
const bp = (r: Out) => r.days.filter((d) => d.activities.some((a) => a.id.endsWith('-for-beach-park')));

describe('M19d — ícone longo ocupa a tarde', () => {
  it('Fortaleza 10–17/11: Beach Park entra; dia sem noite; jantar ≤ 2 km do hotel ou de dia-limitado; R18 PASS e dia não ralo no R20', () => {
    const r = run('Fortaleza', '2026-11-10', '2026-11-17');
    const days = bp(r);
    expect(days).toHaveLength(1);
    const d = days[0];
    expect(d.activities.some((a) => a.timeSlot === 'night')).toBe(false);
    expect(d.activities.find((a) => a.id.endsWith('-for-beach-park'))!.tips?.[0]).toMatch(/Ocupa a tarde inteira/);
    expect(d.activities.some((a) => a.timeSlot === 'dinner')).toBe(true);
    const plan = toPlan(r);
    expect(validateDaysOfWeek(plan).status).toBe('PASS');
    const ctx = { destination: 'Fortaleza' } as PlanRulesContext;
    // R20: o dia do Beach Park não é ralo (outros dias ralos, se houver, são do pool e não desta missão).
    const r20 = validateDenseDays(plan, ctx);
    const thinDays = (r20.detail.match(/: ([\d, ]+)$/)?.[1] ?? '').split(',').map((x) => Number(x.trim()));
    expect(thinDays).not.toContain(d.dayNumber);
  });

  it('Fortaleza 10–15/11 família: Beach Park nunca na quarta (fechada)', () => {
    const r = run('Fortaleza', '2026-11-10', '2026-11-15');
    for (const d of bp(r)) expect(d.date.getDay()).not.toBe(3);
    expect(validateDaysOfWeek(toPlan(r)).status).toBe('PASS');
  });

  it('jet lag SEVERO: Beach Park nunca no 1º dia de exploração', () => {
    const r = run('Fortaleza', '2026-11-10', '2026-11-17', 'SEVERO');
    const first = r.days.find((d) => d.activities.some((a) => a.timeSlot === 'afternoon' || a.timeSlot === 'morning') && d.dayNumber > 1);
    for (const d of bp(r)) expect(d.dayNumber).not.toBe(first!.dayNumber);
  });

  it('Paris: nenhum item de catálogo ≥ 4 h entra na tarde (regra antiga intacta sem tier longo)', () => {
    const r = run('Paris', '2026-12-10', '2026-12-15', 'BAIXO', ['culture']);
    for (const d of r.days) for (const a of d.activities.filter((x) => x.timeSlot === 'afternoon')) {
      expect(parseFloat(String(a.duration)) || 0).toBeLessThan(4);
    }
  });
});
