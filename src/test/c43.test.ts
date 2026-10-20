import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { itemCoord, logisticsLine, stayHotelCoord } from '@/lib/itineraryEngine';
import { validateDaysOfWeek } from '@/lib/itineraryValidator';
import { cityToIata, flightSearchRoute } from '@/lib/timezone';

// C.4.3 — IATA sempre · hotel no salto · bônus do dia certo.

type A = { id: string; name: string; time: string; timeSlot?: string; location?: string; type?: string };
type D = { day: number; date: string; activities: A[] };
const mins = (t: string) => { const m = t.match(/^(\d{2}):(\d{2})/)!; return Number(m[1]) * 60 + Number(m[2]); };
const route = async (origin: string, destination: string) =>
  ({ origin, destination, economyMin: 0, economyAvg: 1200, economyMax: 0, businessAvg: 0 });
async function draft(city: string, from: Date, nights: number, interests: string[] = []): Promise<D[]> {
  const input = buildFlowInput({ city, origin: 'São Paulo', from, to: addDays(from, nights), adults: 2, children: 0, tier: 'comfort' });
  if (interests.length) { input.travelInterests = interests; input.priorities = interests; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((await buildDraftTrip(input, { routeLookup: route })) as any).days;
}

describe('C.4.3 — IATA sempre', () => {
  it('viagem sem código na perna → GRU/FOR (nunca o nome da cidade)', () => {
    expect(flightSearchRoute({ destination: 'Fortaleza', flights: { outbound: { origin: '', destination: '' } } }))
      .toEqual({ origin: 'GRU', destination: 'FOR' });
    expect(flightSearchRoute({ origin: 'São Paulo', destination: 'Lisboa' })).toEqual({ origin: 'GRU', destination: 'LIS' });
  });

  it('código da perna conhecido passa; código lixo cai para o próximo candidato', () => {
    expect(flightSearchRoute({ destination: 'Fortaleza', flights: { outbound: { origin: 'SAO', destination: 'FOR' } } }))
      .toEqual({ origin: 'SAO', destination: 'FOR' });
    expect(flightSearchRoute({ destination: 'Fortaleza', destinationAirportCode: 'FOX' })).toEqual({ origin: 'GRU', destination: 'FOR' });
  });

  it('sem IATA conhecido → null (não busca)', () => {
    expect(flightSearchRoute({ destination: 'Cidade Inventada' })).toBeNull();
    expect(cityToIata('Cidade Inventada')).toBeNull();
    expect(cityToIata('')).toBeNull();
  });

  it('cityToIata: catálogo, nunca substring', () => {
    expect(cityToIata('Gramado')).toBe('POA');
    expect(cityToIata('Rio de Janeiro')).toBe('GIG');
    expect(cityToIata('São Paulo')).toBe('GRU');
    expect(cityToIata('lis')).toBe('LIS');
  });
});

describe('C.4.3 — hotel no salto', () => {
  it('Fortaleza D4: café no hotel → Águas Belas ≥ 10:00 e "~1h de carro" na tela', async () => {
    const days = await draft('Fortaleza', new Date(2026, 10, 10), 5);
    const d4 = days[3].activities;
    const k = d4.findIndex((a) => a.id.endsWith('-for-aguas-belas'));
    expect(k).toBeGreaterThan(0);
    const cafe = d4[k - 1];
    expect(cafe.id).toMatch(/-slot-breakfast$/);
    expect(mins(d4[k].time)).toBeGreaterThanOrEqual(10 * 60);
    const hotel = stayHotelCoord(days, 'Fortaleza');
    expect(hotel).not.toBeNull();
    expect(logisticsLine(itemCoord(cafe, 'Fortaleza', hotel), itemCoord(d4[k], 'Fortaleza', hotel))).toBe('~1h de carro');
  });

  it('itemCoord: incluído no hotel sem hotel conhecido = null (nunca a mediana)', () => {
    expect(itemCoord({ id: 'day-1-slot-breakfast', name: 'Café da manhã no hotel', location: 'Hotel' }, 'Fortaleza')).toBeNull();
    expect(itemCoord({ id: 'x', name: 'Room service' }, 'Fortaleza', { lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
  });
});

describe('C.4.3 — bônus do dia certo', () => {
  for (const interests of [[], ['gastronomy', 'culture']]) {
    it(`Fortaleza 10–15/nov (${interests.join('+') || 'padrão'}): Caranguejada é o jantar de quinta 12/nov`, async () => {
      const days = await draft('Fortaleza', new Date(2026, 10, 10), 5, interests);
      const thu = days.find((d) => String(d.date).slice(0, 10) === '2026-11-12')!;
      expect(thu.activities.find((a) => a.timeSlot === 'dinner')?.id).toMatch(/-for-caranguejada-iate$/);
      expect(validateDaysOfWeek(days).status).toBe('PASS');
    });
  }
});
