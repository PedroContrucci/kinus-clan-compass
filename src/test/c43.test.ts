import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { itemCoord, logisticsLine, stayHotelCoord } from '@/lib/itineraryEngine';
import { validateDaysOfWeek } from '@/lib/itineraryValidator';
import { getDestinationActivities } from '@/data/destinationActivities';
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

const TRIP_IDS = new Set(getDestinationActivities('Fortaleza')
  .filter((a) => (a.styleTags ?? []).includes('daytrip') && !/-(almoco|jantar)$/.test(a.id)).map((a) => a.id));

describe('C.4.3 — hotel no salto', () => {
  // M6b (C.20) — reescrito: o teste fixava `days[10]` e o Praia de Águas Belas; a cota de bate-volta (⌊exploração/3⌋) e a
  // véspera leve mudaram quais bate-voltas entram. Vale para qualquer bate-volta de Fortaleza e exige ≥ 2 em 11 noites.
  it('Fortaleza D11 (11 noites): ≥ 2 bate-voltas; em cada um, café no hotel → bate-volta ≥ 10:00 e "~1h de carro" na tela', async () => {
    const days = await draft('Fortaleza', new Date(2026, 10, 10), 11);
    const trips = days.filter((d) => d.activities.some((a) => TRIP_IDS.has(a.id.replace(/^day-\d+-/, ''))));
    expect(trips.length).toBeGreaterThanOrEqual(2);
    const hotel = stayHotelCoord(days, 'Fortaleza');
    expect(hotel).not.toBeNull();
    for (const day of trips) {
      const d4 = day.activities;
      const k = d4.findIndex((a) => TRIP_IDS.has(a.id.replace(/^day-\d+-/, '')));
      const cafe = d4[k - 1];
      expect(cafe.id).toMatch(/-slot-breakfast$/);
      expect(mins(d4[k].time)).toBeGreaterThanOrEqual(10 * 60);
      expect(logisticsLine(itemCoord(cafe, 'Fortaleza', hotel), itemCoord(d4[k], 'Fortaleza', hotel))).toMatch(/de carro$/);
    }
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
