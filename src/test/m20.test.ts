import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { getActivityPrice } from '@/lib/activityPricing';
import { paxOf, paxLabel } from '@/lib/pax';
import type { PriceLevel } from '@/lib/activityPricing';

// M20a — crianças existem no motor: ingresso × adultos (+ dica de ingresso infantil), Michelin 1× no almoço,
// nunca 2 Michelin no mesmo dia.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 700, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(level: PriceLevel, pax?: { adults: number; children: number; infants: number }, travelers = 2) {
  return runItineraryEngine({
    departureDate: new Date('2026-05-04T12:00:00'), returnDate: new Date('2026-05-10T12:00:00'),
    destination: 'Paris', origin: 'São Paulo',
    outboundFlight: flight('2026-05-04T12:00:00', '08:00'), returnFlight: flight('2026-05-10T12:00:00', '21:00'),
    budget: 60000, travelers, interests: ['gastronomia', 'cultura'], jetLagSeverity: 'MODERADO', priceLevel: level,
    hotel: { nightlyRate: getActivityPrice('hotel_night', 'Paris', level) }, pax,
  });
}
const items = (r: ReturnType<typeof run>) => r.days.flatMap((d) => d.activities.map((a) => ({ day: d.dayNumber, a })));
const isMichelin = (a: { id: string; name: string }) => /^day-\d+-michelin-/.test(a.id) || /michelin/i.test(a.name);

describe('M20a — pax', () => {
  it('paxOf: viagem antiga cai em adults = travelers; paxLabel', () => {
    expect(paxOf({ travelers: 4 })).toMatchObject({ adults: 4, children: 0, infants: 0, total: 4 });
    expect(paxOf({ travelers: 5, adults: 2, children: 2, infants: 1 })).toMatchObject({ adults: 2, children: 2, infants: 1, total: 5 });
    expect(paxLabel({ adults: 2, children: 2, infants: 0 })).toBe('2 adultos + 2 crianças');
    expect(paxLabel({ adults: 1, children: 1, infants: 0 })).toBe('1 adulto + 1 criança');
  });

  it('Paris 2+2 Conforto: ingresso = 2 × unitário, com dica e label de pax; refeição segue × 4', () => {
    const r = run('midrange', { adults: 2, children: 2, infants: 0 }, 4);
    const exp = items(r).filter(({ a }) => a.timeSlot === 'morning' || a.timeSlot === 'afternoon').filter(({ a }) => a.costPerPerson && a.costPerPerson > 0 && !isMichelin(a));
    expect(exp.length).toBeGreaterThan(0);
    for (const { a } of exp) {
      expect(a.estimatedCost).toBe((a.costPerPerson as number) * 2);
      expect(a.location).toContain('(2 adultos + 2 crianças)');
      expect((a.tips ?? []).some((t) => /2 crianças: ingresso infantil a confirmar/.test(t))).toBe(true);
    }
    const meal = items(r).find(({ a }) => (a.timeSlot === 'lunch' || a.timeSlot === 'dinner') && !isMichelin(a) && a.costPerPerson && a.costPerPerson > 0)!;
    expect(meal.a.estimatedCost).toBe((meal.a.costPerPerson as number) * 4);
  });

  it('bebê não conta no ingresso nem gera dica de criança', () => {
    const r = run('midrange', { adults: 2, children: 0, infants: 1 }, 3);
    const exp = items(r).find(({ a }) => a.timeSlot === 'morning' && (a.costPerPerson ?? 0) > 0)!;
    expect(exp.a.estimatedCost).toBe((exp.a.costPerPerson as number) * 2);
    expect((exp.a.tips ?? []).some((t) => /ingresso infantil/.test(t))).toBe(false);
  });

  it.each(['midrange', 'luxury'] as const)('com crianças (%s): ≤ 1 Michelin na viagem, só no almoço', (level) => {
    const r = run(level, { adults: 2, children: 2, infants: 0 }, 4);
    const m = items(r).filter(({ a }) => isMichelin(a));
    expect(m.length).toBeLessThanOrEqual(1);
    for (const { a } of m) expect(a.timeSlot).toBe('lunch');
    if (level === 'luxury') expect(r.meta.michelinCount).toBeLessThanOrEqual(1);
  });

  it.each([
    ['budget', undefined], ['midrange', undefined], ['luxury', undefined],
    ['midrange', { adults: 2, children: 2, infants: 0 }], ['luxury', { adults: 2, children: 2, infants: 0 }],
  ] as const)('nunca 2 Michelin no mesmo dia (%s, %j)', (level, pax) => {
    const r = run(level, pax as { adults: number; children: number; infants: number } | undefined);
    for (const d of r.days) expect(d.activities.filter((a) => isMichelin(a)).length).toBeLessThanOrEqual(1);
  });

  it('Paris 2 adultos: pax explícito sem criança/bebê = comportamento atual', () => {
    const a = run('midrange');
    const b = run('midrange', { adults: 2, children: 0, infants: 0 });
    expect(JSON.stringify(b.days)).toBe(JSON.stringify(a.days));
  });
});
