// C.4.1 item 3 — noites de hotel com saída de madrugada (R11 no dinheiro).
import { describe, it, expect } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { buildItineraryForTrip } from '@/lib/draftItinerary';
import { checkoutOnEve, type SelectedFlight } from '@/lib/itineraryEngine';

const input: DraftTripInput = {
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: 'Fortaleza', destinationAirportCode: 'FOR',
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'luxury', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
};

// luxury = hotel curado (Gran Marquise): o Financeiro lê acc.totalPrice. Sem curado, a estimativa do motor.
async function withReturn(dep: string, tier = 'luxury', dest: Partial<DraftTripInput> = {}) {
  const trip = await buildDraftTrip({ ...input, budgetTier: tier, ...dest });
  const t = trip as typeof trip & { outboundFlight: SelectedFlight; returnFlight: SelectedFlight };
  const built = buildItineraryForTrip(trip, {
    outbound: t.outboundFlight,
    return: { ...t.returnFlight, option: { ...t.returnFlight.option, departureTime: dep } },
  });
  return { trip, built, acc: built.accommodation as { curatedHotelId?: string; nightlyRate: number; totalNights: number; totalPrice: number; checkOut: string } };
}

describe('noites de hotel × saída de madrugada', () => {
  it('checkoutOnEve: 02:30 doméstico → véspera; 14:00 → não; 03:00 intl → véspera; 06:00 intl → check-out 01:45 do dia', () => {
    expect(checkoutOnEve('02:30', true)).toBe(true);
    expect(checkoutOnEve('14:00', true)).toBe(false);
    expect(checkoutOnEve('03:00', false)).toBe(true);
    expect(checkoutOnEve('06:00', false)).toBe(false);
  });

  it('Fortaleza 10–15/nov, volta 02:30 do dia 15 → 4 noites, total = 4 × diária, checkOut 14/nov', async () => {
    const { built, acc } = await withReturn('02:30');
    expect(acc.curatedHotelId).toBeTruthy();
    expect(acc.totalNights).toBe(4);
    expect(acc.totalPrice).toBe(Math.round(4 * acc.nightlyRate));
    expect(built.buckets.hotelPlanned).toBe(acc.totalPrice);
    expect(built.finances.categories.accommodation.planned).toBe(acc.totalPrice);
    expect(new Date(acc.checkOut).getDate()).toBe(14);
  });

  it('mesma viagem, volta 14:00 → 5 noites e checkOut 15/nov (ida e volta restaura)', async () => {
    const { built, acc } = await withReturn('14:00');
    expect(acc.totalNights).toBe(5);
    expect(acc.totalPrice).toBe(Math.round(5 * acc.nightlyRate));
    expect(built.buckets.hotelPlanned).toBe(acc.totalPrice);
    expect(new Date(acc.checkOut).getDate()).toBe(15);
    // Volta para a madrugada a partir da hospedagem já com 5 noites: cai para 4 de novo.
    const { trip } = await withReturn('02:30');
    const t = trip as typeof trip & { outboundFlight: SelectedFlight; returnFlight: SelectedFlight };
    const back = buildItineraryForTrip({ ...trip, accommodation: acc }, {
      outbound: t.outboundFlight,
      return: { ...t.returnFlight, option: { ...t.returnFlight.option, departureTime: '02:30' } },
    });
    expect((back.accommodation as { totalNights: number }).totalNights).toBe(4);
  });

  // Fortaleza ganhou curados em todos os tiers; o caminho sem curado roda em Natal (fora do catálogo).
  const NATAL = { destinationCity: 'Natal', destinationAirportCode: 'NAT' };
  it('sem hotel curado (Natal, comfort): 4 noites gravadas e a estimativa do motor também com 4', async () => {
    const eve = await withReturn('02:30', 'comfort', NATAL);
    const day = await withReturn('14:00', 'comfort', NATAL);
    expect(eve.acc.curatedHotelId).toBeUndefined();
    expect(eve.acc.totalNights).toBe(4);
    expect(eve.acc.totalPrice).toBe(Math.round(4 * eve.acc.nightlyRate));
    expect(eve.built.buckets.hotelPlanned * 5).toBe(day.built.buckets.hotelPlanned * 4);
  });
});
