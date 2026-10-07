// A.3 — lista de voos coesa com o recomendado + ranking escrito (src/lib/flightRanking.ts).
//
// A fixture imita a resposta real da function `amadeus-flights` (fonte: Travelpayouts):
// `departure.at` com a hora local da origem, `arrival.at` = saída + duração com rótulo UTC
// (errado de propósito) e `departureTime`/`arrivalTime` formatados em UTC no servidor.
// A normalização tem de ignorar os três e recalcular a chegada.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { offerToSelected, writeFlightsThrough, flightDaysLater, estimateOf, type ReferenceOffer } from '@/lib/flightModel';
import { rankFlights, pickBest, explainPick, shouldAutoSearch, flightSearchKey, PRICE_TIE_PCT } from '@/lib/flightRanking';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { kinuDidLines } from '@/lib/onboardingFlow';
import { flightPillSubtitle } from '@/components/cockpit/DraftCockpit';
import { FlightSelectionStage } from '@/components/cockpit/FlightSelectionStage';

vi.mock('@/hooks/useFlightSearch', () => ({
  useFlightSearch: () => ({ data: [], isLoading: false, isSuccess: false, isError: false, error: null, refetch: vi.fn() }),
  useFlexibleFlightSearch: () => ({ data: [], isLoading: false, error: null }),
  formatFlightPrice: (price: number) => `R$ ${price}`,
}));

/** Oferta no formato do servidor: só `dep` (local) e `min` valem; o resto é o lixo que ele manda. */
function offer(id: string, from: string, to: string, date: string, dep: string, min: number, price: number, isDirect: boolean): ReferenceOffer {
  const wrongArr = new Date(new Date(`${date}T${dep}:00Z`).getTime() + min * 60000).toISOString();
  return {
    id, airline: 'Cia', route: `${from} → ${to}`, isDirect, connectionCities: [],
    duration: `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`, durationMinutes: min, price,
    departureTime: '99:99', arrivalTime: '88:88', departureAirport: from, arrivalAirport: to,
    segments: [{ departure: { iataCode: from, at: `${date}T${dep}:00` }, arrival: { iataCode: to, at: wrongArr } }],
  };
}

const NOV10 = new Date(2026, 10, 10);
const ctxOut = { date: NOV10, fromCity: 'São Paulo', toCity: 'Lisboa' };
// GRU→LIS, 10/nov (Lisboa UTC+0, +3h de São Paulo)
const FIXTURE = [
  offer('A-direta-cara', 'GRU', 'LIS', '2026-11-10', '23:00', 600, 6000, true),   // 12:00 D+1
  offer('B-escala-barata', 'GRU', 'LIS', '2026-11-10', '18:00', 900, 3000, false), // 12:00 D+1
  offer('C-chega-0200', 'GRU', 'LIS', '2026-11-10', '13:00', 600, 3100, false),    // 02:00 D+1
  offer('D-d1-tarde', 'GRU', 'LIS', '2026-11-10', '21:00', 960, 3050, false),      // 16:00 D+1
  offer('E-mais-rapida', 'GRU', 'LIS', '2026-11-10', '22:00', 540, 7000, true),    // 10:00 D+1
];
const OUT = FIXTURE.map(o => offerToSelected(o, ctxOut));
const ids = (l: { option: { id: string } }[]) => l.map(f => f.option.id);

describe('offerToSelected — normalização da oferta de referência', () => {
  it('GRU→LIS 23:00 → 12:00 D+1: saída local preservada, chegada recalculada, lixo do servidor ignorado', () => {
    const a = OUT[0];
    expect(a.option.departureTime).toBe('23:00');
    expect(a.option.arrivalTime).toBe('12:00');
    expect(flightDaysLater(a)).toBe(1);
    expect(a.option.segments?.[0].departure.at).toBe('2026-11-10T23:00:00');
    expect(a.option.segments?.[0].arrival.at).toBe('2026-11-11T12:00:00');
    expect(a).toMatchObject({ source: 'reference', priceSource: 'travelpayouts', tzKnown: true, international: true });
  });

  it('as 5 ofertas chegam na hora local certa', () => {
    expect(OUT.map(f => `${f.option.arrivalTime}+${flightDaysLater(f)}`)).toEqual(['12:00+1', '12:00+1', '02:00+1', '16:00+1', '10:00+1']);
  });

  it('NRT→GRU 22:00 (27h) → 13:00 D+1 em São Paulo', () => {
    const v = offerToSelected(offer('nrt', 'NRT', 'GRU', '2026-11-15', '22:00', 1620, 5000, false), { date: new Date(2026, 10, 15), fromCity: 'Tóquio', toCity: 'São Paulo' });
    expect(v.option.arrivalTime).toBe('13:00');
    expect(flightDaysLater(v)).toBe(1);
    expect(v.international).toBe(true);
  });

  it('aeroporto e cidade desconhecidos → tzKnown false ("chegada a confirmar")', () => {
    const x = offerToSelected(offer('x', 'GRU', 'ZZZ', '2026-11-10', '08:00', 300, 900, true), { date: NOV10, fromCity: 'São Paulo', toCity: 'Atlântida' });
    expect(x.tzKnown).toBe(false);
    expect(explainPick(x)).toMatch(/chegada a confirmar/);
  });

  it('doméstico GRU→FOR é international:false', () => {
    const f = offerToSelected(offer('for', 'GRU', 'FOR', '2026-11-10', '08:00', 205, 900, true), { date: NOV10 });
    expect(f.international).toBe(false);
    expect(f.option.arrivalTime).toBe('11:25');
  });
});

describe('rankFlights — regra escrita, determinística', () => {
  it(`modo kinu: direto > preço (faixa de ${PRICE_TIE_PCT * 100}%) > janela 06–22 > duração`, () => {
    // Diretas: E (7000) fica fora da faixa de A (6000 × 1,05). Escalas B/D/C empatam no
    // preço (≤ 3150); C chega 02:00 (fora da janela); B dura menos que D.
    expect(ids(rankFlights(OUT, 'kinu'))).toEqual(['A-direta-cara', 'E-mais-rapida', 'B-escala-barata', 'D-d1-tarde', 'C-chega-0200']);
  });

  it('modo fastest: direto > duração > preço > janela', () => {
    expect(ids(rankFlights(OUT, 'fastest'))).toEqual(['E-mais-rapida', 'A-direta-cara', 'C-chega-0200', 'B-escala-barata', 'D-d1-tarde']);
  });

  it('a ordem não depende da ordem de entrada', () => {
    const shuffled = [OUT[3], OUT[0], OUT[4], OUT[2], OUT[1]];
    expect(ids(rankFlights(shuffled, 'kinu'))).toEqual(ids(rankFlights(OUT, 'kinu')));
    expect(ids(rankFlights(shuffled, 'fastest'))).toEqual(ids(rankFlights(OUT, 'fastest')));
  });

  it('pickBest marca chosenBy kinu e o porquê (média da ida)', () => {
    const best = pickBest(OUT)!;
    expect(best.option.id).toBe('A-direta-cara');
    expect(best).toMatchObject({ chosenBy: 'kinu', kinuPick: { averagePrice: 4430, offers: 5, mode: 'kinu' } });
    // Honesto: a direta é a mais cara — o texto diz "acima da média".
    expect(explainPick(best)).toBe('direto, R$ 1.570 acima da média, chega 12:00 (+1)');
  });
});

function draftInput(over: Partial<DraftTripInput> = {}): DraftTripInput {
  return {
    originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: 'Lisboa', destinationAirportCode: 'LIS',
    hasDirectFlight: true, departureDate: NOV10, returnDate: new Date(2026, 10, 15),
    adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'conforto',
    budgetAmount: 30000, travelInterests: [], priorities: [], ...over,
  };
}

describe('writeFlightsThrough — um objeto de voo para todo mundo (R-V12)', () => {
  it('atualiza outboundFlight/returnFlight, trip.flights.* e trip.finances; guarda a estimativa', async () => {
    const trip = await buildDraftTrip(draftInput(), { routeLookup: async () => null });
    const estOut = (trip as unknown as { outboundFlight: unknown }).outboundFlight;
    const pickOut = pickBest(OUT)!;
    const pickRet = pickBest([offerToSelected(offer('R1', 'LIS', 'GRU', '2026-11-15', '13:00', 600, 2500, true), { date: new Date(2026, 10, 15) })])!;
    const next = writeFlightsThrough(trip as unknown as Record<string, unknown>, pickOut, pickRet) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    expect(next.outboundFlight).toBe(pickOut);
    expect(next.returnFlight).toBe(pickRet);
    expect(next.flights.outbound).toMatchObject({ price: 6000, arrivalTime: '12:00', departureTime: '23:00', source: 'reference', priceSource: 'travelpayouts', chosenBy: 'kinu', stops: 0, origin: 'GRU', destination: 'LIS' });
    expect(next.flights.return).toMatchObject({ price: 2500, arrivalTime: '20:00', source: 'reference' });
    expect(next.finances.categories.flights.planned).toBe((6000 + 2500) * 2);
    expect(next.kinuEstimate.outbound).toBe(estOut);
    expect(estimateOf(next).outbound).toBe(estOut);
    // A viagem original não é mutada.
    expect((trip as unknown as { flights: { outbound: { price: number } } }).flights.outbound.price).not.toBe(6000);
  });

  it('card e chip 06 dizem "KINU escolheu: … · trocar"', async () => {
    const trip = await buildDraftTrip(draftInput(), { routeLookup: async () => null });
    const next = writeFlightsThrough(trip as unknown as Record<string, unknown>, pickBest(OUT)!, pickBest(OUT)!);
    const line = 'KINU escolheu: direto, R$ 1.570 acima da média, chega 12:00 (+1) · trocar';
    expect(kinuDidLines(next).flight).toBe(line);
    expect(flightPillSubtitle(next as never)).toBe(line);
  });
});

describe('busca ao abrir o rascunho (D2)', () => {
  const key = flightSearchKey('GRU', 'LIS', '2026-11-10T03:00:00.000Z', '2026-11-15T03:00:00.000Z');
  const est = { ...OUT[0], source: 'estimate' as const };
  it('só rascunho, só estimativa sem escolha do usuário, só sem busca gravada para a mesma chave', () => {
    expect(shouldAutoSearch({ status: 'draft', outboundFlight: est }, key)).toBe(true);
    expect(shouldAutoSearch({ status: 'active', outboundFlight: est }, key)).toBe(false);
    expect(shouldAutoSearch({ status: 'draft', outboundFlight: { ...est, chosenBy: 'user' } }, key)).toBe(false);
    expect(shouldAutoSearch({ status: 'draft', outboundFlight: OUT[0] }, key)).toBe(false);
    expect(shouldAutoSearch({ status: 'draft', outboundFlight: est, kinuFlightSearch: { key, searchedAt: '', outbound: [], return: [] } }, key)).toBe(false);
    expect(shouldAutoSearch({ status: 'draft', outboundFlight: est, kinuFlightSearch: { key: 'outra', searchedAt: '', outbound: [], return: [] } }, key)).toBe(true);
  });
});

describe('FlightSelectionStage — estimativa sempre no índice 0', () => {
  it('1º cartão = "Sugerido pelo KINU · estimado", pré-selecionado; ofertas reais abaixo, sem mocks', async () => {
    const trip = await buildDraftTrip(draftInput(), { routeLookup: async () => null });
    const est = estimateOf(trip);
    const { container } = render(
      <FlightSelectionStage
        destination="Lisboa" origin="São Paulo" originCode="GRU" destinationCode="LIS"
        departureDate={NOV10} returnDate={new Date(2026, 10, 15)} budget={30000} emoji="🚃"
        onFlightsSelected={vi.fn()} onSave={vi.fn()} onBack={vi.fn()}
        estimate={est} current={est} offers={{ outbound: OUT, return: [] }}
      />,
    );
    const cards = Array.from(container.querySelectorAll('div.cursor-pointer'));
    expect(cards.length).toBe(6);
    expect(cards[0].textContent).toMatch(/Sugerido pelo KINU · estimado/);
    expect(cards[0].textContent).toMatch(/Selecionado/);
    expect(cards[1].textContent).toMatch(/R\$ 6\.000/);
    expect(screen.queryByText(/companhia a definir/)).toBeNull();
    expect(screen.getAllByText('preços de referência · Travelpayouts').length).toBeGreaterThan(0);
  });
});
