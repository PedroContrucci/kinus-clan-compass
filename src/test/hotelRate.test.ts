// C.4.2 — fonte única da diária: card, Financeiro e PDF leem a mesma acc.nightlyRate × noites.
import { describe, it, expect } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { buildItineraryForTrip, hotelRateLabel, hotelRateSource } from '@/lib/draftItinerary';
import { planBreakdown } from '@/lib/planTotals';
import { getActivityPrice } from '@/lib/activityPricing';
import type { SelectedFlight } from '@/lib/itineraryEngine';
import { getCuratedHotelsForCity, parsePriceRangeBRL } from '@/lib/hotelSwap';

const input: DraftTripInput = {
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: 'Fortaleza', destinationAirportCode: 'FOR',
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
};

type Acc = { curatedHotelId?: string; rateTier?: string; nightlyRate: number; totalNights: number; totalPrice: number };

/** As três superfícies: card (rótulo), Financeiro (balde gravado) e PDF (acc.nightlyRate / totalNights). */
function surfaces(trip: { accommodation?: unknown; finances?: unknown }) {
  const acc = trip.accommodation as Acc;
  return {
    acc,
    card: hotelRateLabel(acc),
    financeiro: planBreakdown(trip as Parameters<typeof planBreakdown>[0]).hotel,
    pdf: { rate: acc.nightlyRate, nights: acc.totalNights },
  };
}

// Fortaleza ganhou curados (budget+mid); o caminho da ESTIMATIVA roda em Natal (fora do catálogo).
const NATAL: Partial<DraftTripInput> = { destinationCity: 'Natal', destinationAirportCode: 'NAT' };

async function draft(tier: string, returnDep?: string, dest: Partial<DraftTripInput> = {}) {
  const trip = await buildDraftTrip({ ...input, budgetTier: tier, ...dest });
  if (!returnDep) return { trip, ...surfaces(trip) };
  const t = trip as typeof trip & { outboundFlight: SelectedFlight; returnFlight: SelectedFlight };
  const built = buildItineraryForTrip(trip, {
    outbound: t.outboundFlight,
    return: { ...t.returnFlight, option: { ...t.returnFlight.option, departureTime: returnDep } },
  });
  const next = { ...trip, accommodation: built.accommodation, finances: built.finances };
  return { trip: next, ...surfaces(next) };
}

describe('diária de hotel — fonte única', () => {
  it('Natal Conforto 10–15/nov (sem curado): card = Financeiro = PDF', async () => {
    const { acc, card, financeiro, pdf } = await draft('comfort', undefined, NATAL);
    expect(acc.curatedHotelId).toBeUndefined();
    expect(hotelRateSource(acc)).toBe('estimate');
    expect(card).toBe(`R$ ${acc.nightlyRate.toLocaleString('pt-BR')}/noite · estimativa Conforto`);
    expect(financeiro).toBe(acc.totalPrice);
    expect(pdf.rate * pdf.nights).toBe(financeiro);
  });

  it('Luxo (Gran Marquise curado): os três mudam juntos para a diária do curado', async () => {
    const comfort = await draft('comfort');
    const lux = await draft('luxury');
    expect(lux.acc.curatedHotelId).toBeTruthy();
    expect(lux.card).toMatch(/· curado$/);
    expect(lux.acc.nightlyRate).not.toBe(comfort.acc.nightlyRate);
    expect(lux.financeiro).toBe(lux.acc.totalPrice);
    expect(lux.pdf.rate * lux.pdf.nights).toBe(lux.financeiro);
  });

  it('volta 02:30 → 4 noites nos três', async () => {
    for (const tier of ['comfort', 'luxury']) {
      const { acc, financeiro, pdf } = await draft(tier, '02:30');
      expect(pdf.nights).toBe(4);
      expect(financeiro).toBe(4 * acc.nightlyRate);
      expect(acc.totalPrice).toBe(financeiro);
    }
  });

  it('Mochileiro Natal (sem curado, o caso que divergia): os três a 60% da tabela', async () => {
    const { acc, card, financeiro, pdf } = await draft('backpacker', undefined, NATAL);
    const rate = Math.round(getActivityPrice('hotel_night', 'Natal', 'budget') * 0.6);
    expect(acc.curatedHotelId).toBeUndefined();
    expect(acc.nightlyRate).toBe(rate);
    expect(card).toBe(`R$ ${rate.toLocaleString('pt-BR')}/noite · estimativa Mochileiro`);
    expect(financeiro).toBe(rate * pdf.nights);
  });

  it('Fortaleza Conforto (curado mid): card = Financeiro = PDF na diária do curado, fonte curado', async () => {
    const { acc, card, financeiro, pdf } = await draft('comfort');
    const hotel = getCuratedHotelsForCity('Fortaleza').find((h) => h.id === acc.curatedHotelId);
    expect(hotel?.tier).toBe('mid');
    expect(hotelRateSource(acc)).toBe('curated');
    expect(acc.nightlyRate).toBe(parsePriceRangeBRL(hotel!.priceRangeBRL)!.mid);
    expect(card).toMatch(new RegExp(`^R\\$ ${acc.nightlyRate.toLocaleString('pt-BR').replace('.', '\\.')}/noite · curado`));
    expect(financeiro).toBe(acc.nightlyRate * acc.totalNights);
    expect(financeiro).toBe(acc.totalPrice);
    expect(pdf.rate * pdf.nights).toBe(financeiro);
  });

  it('rótulo: confirmado > curado (com faixa) > estimativa; sem diária, nada', () => {
    expect(hotelRateLabel({ nightlyRate: 900, status: 'confirmed', curatedHotelId: 'x' })).toBe('R$ 900/noite · confirmado');
    expect(hotelRateLabel({ nightlyRate: 900, curatedHotelId: 'x' }, 'R$ 800–1.000')).toBe('R$ 900/noite · curado (faixa R$ 800–1.000)');
    expect(hotelRateLabel({ nightlyRate: 900 })).toBe('R$ 900/noite · estimativa');
    expect(hotelRateLabel({ name: 'Hotel' })).toBeNull();
  });
});
