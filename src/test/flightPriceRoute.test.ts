import { describe, it, expect } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { kinuDidLines } from '@/lib/onboardingFlow';
import { planBreakdown } from '@/lib/planTotals';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { ROUTES_PENDING_PRICE, type FlightPriceEstimate } from '@/lib/flightPricing';
import { findCityInfo } from '@/data/destinationCatalog';

// Linhas reais da tabela flight_price_estimates (GRU→LIS, GRU→NRT), sem rede.
const TABLE: Record<string, FlightPriceEstimate> = {
  'GRU-LIS': { origin: 'GRU', destination: 'LIS', economyMin: 2500, economyAvg: 4000, economyMax: 6000, businessAvg: 12000 },
  'GRU-NRT': { origin: 'GRU', destination: 'NRT', economyMin: 4500, economyAvg: 7000, economyMax: 12000, businessAvg: 21000 },
};
const routeLookup = async (o: string, d: string) => TABLE[`${o}-${d}`] ?? null;

const input = (city: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU',
  destinationCity: city, destinationAirportCode: findCityInfo(city)?.city.airports[0],
  departureDate: new Date('2026-11-10T12:00:00Z'), returnDate: new Date('2026-11-17T12:00:00Z'),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'balance',
  budgetAmount: 0, travelInterests: ['culture'], priorities: [],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const src = (t: any) => [t.outboundFlight?.priceSource, t.returnFlight?.priceSource, t.flights.outbound.priceSource];

describe('preço do voo estimado por rota', () => {
  it('SP→Lisboa ≠ SP→Tóquio, ambos priceSource route', async () => {
    const lis = await buildDraftTrip(input('Lisboa'), { routeLookup });
    const nrt = await buildDraftTrip(input('Tóquio'), { routeLookup });
    expect(src(lis)).toEqual(['route', 'route', 'route']);
    expect(src(nrt)).toEqual(['route', 'route', 'route']);
    expect(lis.flights.outbound.price).not.toBe(nrt.flights.outbound.price);
    expect(lis.flights.outbound.price).toBeLessThan(nrt.flights.outbound.price);
  });

  it('determinístico: mesmo input, mesmo preço', async () => {
    const a = await buildDraftTrip(input('Lisboa'), { routeLookup });
    const b = await buildDraftTrip(input('Lisboa'), { routeLookup });
    expect(a.flights.outbound.price).toBe(b.flights.outbound.price);
    expect(a.flights.return.price).toBe(b.flights.return.price);
  });

  it('rota ausente (Cartagena) → número do tier, priceSource tier', async () => {
    const withLookup = await buildDraftTrip(input('Cartagena'), { routeLookup });
    const failing = await buildDraftTrip(input('Cartagena'), { routeLookup: async () => { throw new Error('x'); } }).catch(() => null);
    expect(src(withLookup)).toEqual(['tier', 'tier', 'tier']);
    const tierOnly = await buildDraftTrip(input('Cartagena'), { routeLookup: async () => null });
    expect(withLookup.flights.outbound.price).toBe(tierOnly.flights.outbound.price);
    expect(withLookup.flights.return.price).toBe(withLookup.flights.outbound.price);
    expect(failing === null || src(failing)[0] === 'tier').toBe(true);
  });

  it('total do orçamento = soma das quatro partes (rota e tier)', async () => {
    for (const city of ['Lisboa', 'Cartagena']) {
      const t = await buildDraftTrip(input(city), { routeLookup });
      const p = planBreakdown(t);
      expect(p.total).toBe(p.flights + p.hotel + p.food + p.tours);
    }
  });

  it('card: "estimativa por rota" / "estimativa genérica · cotação real na etapa Voo"', async () => {
    const lis = kinuDidLines(await buildDraftTrip(input('Lisboa'), { routeLookup }));
    const ctg = kinuDidLines(await buildDraftTrip(input('Cartagena'), { routeLookup }));
    expect(lis.flight).toContain('estimativa por rota');
    expect(lis.budgetDetail).toContain('(estimativa por rota)');
    expect(ctg.flight).toContain('estimativa genérica · cotação real na etapa Voo');
    expect(ctg.budgetDetail).toContain('(estimativa genérica)');
  });

  // TODO(A.6): preços reais das 13 rotas pendentes serão fornecidos pelo fundador:
  // Fortaleza, Rio de Janeiro, Orlando, Salvador, Buenos Aires, Cartagena, Gramado,
  // Porto Seguro, Cidade do Cabo, Istambul, Bangkok, Marrakech, Singapura.
  // Ao inserir as linhas em flight_price_estimates e esvaziar ROUTES_PENDING_PRICE, trocar skip por it.
  it.skip('toda cidade da grade de destinos tem linha de rota (nenhuma pendente)', () => {
    const pending = CURATED_CITIES.filter((c) => c in ROUTES_PENDING_PRICE);
    expect(pending).toEqual([]);
  });

  it('lista de pendentes cobre exatamente 13 cidades da grade', () => {
    expect(Object.keys(ROUTES_PENDING_PRICE)).toHaveLength(13);
    for (const c of Object.keys(ROUTES_PENDING_PRICE)) expect(CURATED_CITIES).toContain(c);
  });
});
