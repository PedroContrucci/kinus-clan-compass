// Tela == trip.finances, e o check-in mostra o hotel curado — mesmo após passar pelo storage.
import { describe, it, expect, beforeEach } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { saveTrip, getTrip } from '@/lib/tripStore';
import { financeBucketsOf } from '@/components/cockpit/DraftCockpit';
import { planBreakdown } from '@/lib/planTotals';
import { tripDaysToItinerary } from '@/lib/draftItinerary';
import { computeBuckets } from '@/lib/itineraryEngine';

const CITIES: [string, string][] = [['Cartagena', 'CTG'], ['Lisboa', 'LIS'], ['Tóquio', 'HND'], ['Fortaleza', 'FOR']];
const input = (city: string, code: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 0,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});

describe('tela do rascunho', () => {
  beforeEach(() => localStorage.clear());
  for (const [city, code] of CITIES) {
    it(`${city}: baldes da etapa === trip.finances (antes e depois do storage)`, async () => {
      const built = await buildDraftTrip(input(city, code));
      saveTrip(built);
      const trip = getTrip(built.id)!;
      const card = planBreakdown(trip);
      const stage = financeBucketsOf(trip)!;
      expect([stage.flightsPlanned, stage.hotelPlanned, stage.foodPlanned, stage.toursPlanned])
        .toEqual([card.flights, card.hotel, card.food, card.tours]);
      // os dias relidos do storage classificam igual ao motor (timeSlot preservado)
      const days = tripDaysToItinerary(trip.days, new Date(trip.startDate), trip.travelers);
      const re = computeBuckets(days, { flights: { amount: 0 }, hotel: { amount: 0 } } as never);
      expect([re.foodPlanned, re.toursPlanned]).toEqual([card.food, card.tours]);
    });
  }

  it('check-in mostra o hotel curado (Cartagena) com o bairro, após o storage', async () => {
    const built = await buildDraftTrip(input('Cartagena', 'CTG'));
    saveTrip(built);
    const trip = getTrip(built.id)!;
    const acc = trip.accommodation as { name: string; neighborhood?: string; curatedHotelId?: string };
    expect(acc.curatedHotelId).toBeTruthy();
    const days = tripDaysToItinerary(trip.days, new Date(trip.startDate), trip.travelers);
    const checkin = days.flatMap((d) => d.activities).find((a) => a.type === 'checkin')!;
    expect(checkin.location).toContain(acc.name);
    if (acc.neighborhood) expect(checkin.location).toContain(acc.neighborhood);
  });
});
