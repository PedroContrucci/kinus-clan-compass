import { describe, it, expect } from 'vitest';
import { michelinForTier, runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { getActivityPrice } from '@/lib/activityPricing';
import type { PriceLevel } from '@/lib/activityPricing';

const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '7.5h', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
const run = (city: string, priceLevel: PriceLevel) =>
  runItineraryEngine({
    departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
    destination: city, origin: 'São Paulo',
    outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
    budget: 40000, travelers: 2, interests: ['gastronomia', 'cultura'], jetLagSeverity: 'MODERADO', priceLevel,
    hotel: { nightlyRate: getActivityPrice('hotel_night', city, priceLevel) },
  });
const michelins = (city: string, lvl: PriceLevel) =>
  run(city, lvl).days.flatMap((d) => d.activities.filter((a) => /^day-\d+-michelin-/.test(a.id)).map((a) => ({ day: d.dayNumber, a })));

describe('M7 — Michelin por faixa', () => {
  it('michelinForTier: Econômico nenhum, Conforto só 1★, Luxo 2–3★, sem queda entre faixas', () => {
    expect(michelinForTier('Paris', 'budget')).toEqual([]);
    expect(michelinForTier('Paris', 'midrange').every((m) => m.stars === 1)).toBe(true);
    expect(michelinForTier('Paris', 'luxury').every((m) => m.stars >= 2)).toBe(true);
    expect(michelinForTier('Tóquio', 'midrange')).toEqual([]);
    expect(michelinForTier('Paris', 'midrange').length).toBeGreaterThan(0);
  });

  it('Paris Conforto: 1★ no ALMOÇO (nunca 3★); Econômico nenhum; Luxo 2–3★ no jantar', () => {
    const conf = michelins('Paris', 'midrange');
    expect(conf).toHaveLength(1);
    expect(conf[0].a.timeSlot).toBe('lunch');
    expect(conf[0].a.name).toMatch(/⭐ Michelin$/);
    expect(conf[0].a.name).not.toMatch(/⭐⭐/);
    expect(michelins('Paris', 'budget')).toHaveLength(0);
    const lux = michelins('Paris', 'luxury');
    expect(lux).toHaveLength(1);
    expect(lux[0].a.timeSlot).toBe('dinner');
    expect(lux[0].a.name).toMatch(/⭐⭐/);
  });

  it('Conforto em cidade sem 1★ (Tóquio): nenhum Michelin injetado', () => {
    expect(michelins('Tóquio', 'midrange')).toHaveLength(0);
  });

  it('jantar do dia de chegada: nunca Michelin no nome e ≤ 2× o ticket da faixa', () => {
    for (const [city, lvl] of [['Paris', 'midrange'], ['Paris', 'luxury'], ['Lisboa', 'midrange']] as const) {
      const arrival = run(city, lvl).days[1].activities.find((a) => a.timeSlot === 'dinner');
      if (!arrival) continue;
      expect(arrival.name).not.toMatch(/michelin/i);
      expect(arrival.costPerPerson ?? 0).toBeLessThanOrEqual(2 * getActivityPrice('restaurant_dinner', city, lvl) + 1);
    }
  });
});
