// O rascunho É o roteiro: buildDraftTrip grava exatamente a saída do motor único.
import { describe, it, expect } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { runItineraryEngine } from '@/lib/itineraryEngine';
import { buildItineraryForTrip, countManualEdits, itemIdsOf, itineraryToTripDays, tripDaysToItinerary } from '@/lib/draftItinerary';
import { kinuDidLines } from '@/lib/onboardingFlow';
import type { SelectedFlight } from '@/lib/itineraryEngine';

const CITIES: [string, string][] = [['Cartagena', 'CTG'], ['Lisboa', 'LIS'], ['Tóquio', 'HND'], ['Fortaleza', 'FOR']];
const input = (city: string, code: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 17, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});

describe('draft truth', () => {
  for (const [city, code] of CITIES) {
    it(`${city}: trip.days e finanças == motor com os mesmos inputs`, async () => {
      const trip = await buildDraftTrip(input(city, code));
      const t = trip as typeof trip & { outboundFlight: SelectedFlight; returnFlight: SelectedFlight; priceLevel: 'midrange' };
      expect(t.outboundFlight.source).toBe('estimate');
      expect((trip as { flightsSelected?: boolean }).flightsSelected).toBe(false);
      const acc = trip.accommodation as { name: string; curatedHotelId?: string; totalPrice: number };
      const r = runItineraryEngine({
        departureDate: new Date(trip.startDate), returnDate: new Date(trip.endDate),
        destination: city, origin: 'São Paulo', outboundFlight: t.outboundFlight, returnFlight: t.returnFlight,
        budget: 20000, travelers: 2, interests: ['gastronomy', 'culture'],
        jetLagSeverity: trip.jetLagSeverity as 'BAIXO', priceLevel: t.priceLevel,
        hotel: { label: acc.name }, hotelPlannedOverride: acc.curatedHotelId ? acc.totalPrice : undefined,
      });
      expect(trip.days).toEqual(itineraryToTripDays(r.days));
      const c = trip.finances.categories;
      expect(c.flights.planned).toBe(r.buckets.flightsPlanned);
      expect(c.accommodation.planned).toBe(r.buckets.hotelPlanned);
      expect(c.food.planned).toBe(r.buckets.foodPlanned);
      expect(c.tours.planned).toBe(r.buckets.toursPlanned);
      expect(c.transport.planned).toBe(0);
      expect(trip.finances.planned).toBe(r.buckets.totalPlanned);
      // voo = estimativa × viajantes
      expect(c.flights.planned).toBe((t.outboundFlight.option.price + t.returnFlight.option.price) * 2);
      // a tela lê os dias por cópia direta (timeSlot gravado)
      const back = tripDaysToItinerary(trip.days, new Date(trip.startDate), 2);
      expect(back.flatMap((d) => d.activities.map((a) => [a.id, a.timeSlot, a.type])))
        .toEqual(r.days.flatMap((d) => d.activities.map((a) => [a.id, a.timeSlot, a.type])));
    });
  }

  it('baldes do card (kinuDidLines) == baldes que a etapa recebe (trip.finances)', async () => {
    const trip = await buildDraftTrip(input('Lisboa', 'LIS'));
    const l = kinuDidLines(trip);
    const c = trip.finances.categories;
    for (const v of [c.flights.planned, c.accommodation.planned, c.food.planned, c.tours.planned]) {
      expect(l.budgetDetail).toContain(v.toLocaleString('pt-BR'));
    }
  });

  it('troca de voo e regerar: muda o dia 1 e o último dia', async () => {
    const trip = await buildDraftTrip(input('Lisboa', 'LIS'));
    const t = trip as typeof trip & { outboundFlight: SelectedFlight; returnFlight: SelectedFlight };
    const out: SelectedFlight = { ...t.outboundFlight, option: { ...t.outboundFlight.option, departureTime: '08:00', segments: undefined } };
    const ret: SelectedFlight = { ...t.returnFlight, option: { ...t.returnFlight.option, departureTime: '10:00' } };
    const evening = buildItineraryForTrip(trip, {
      outbound: { ...t.outboundFlight, option: { ...t.outboundFlight.option, departureTime: '23:00', segments: undefined } },
      return: { ...t.returnFlight, option: { ...t.returnFlight.option, departureTime: '22:00' } },
    });
    const morning = buildItineraryForTrip(trip, { outbound: out, return: ret });
    expect(morning.days[0]).not.toEqual(evening.days[0]);
    expect(morning.days[morning.days.length - 1]).not.toEqual(evening.days[evening.days.length - 1]);
  });

  it('countManualEdits: troca = 1, remoção = 1, sem marca = 0', async () => {
    const trip = await buildDraftTrip(input('Cartagena', 'CTG'));
    const engine = (trip as { engineItemIds?: string[] }).engineItemIds!;
    const ids = itemIdsOf(trip.days);
    expect(countManualEdits(engine, ids)).toBe(0);
    expect(countManualEdits(engine, ids.slice(1))).toBe(1);
    expect(countManualEdits(engine, ['x', ...ids.slice(1)])).toBe(1);
    expect(countManualEdits(undefined, ids)).toBe(0);
  });
});
