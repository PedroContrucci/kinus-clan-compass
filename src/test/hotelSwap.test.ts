// Troca de hotel: parse de preço, ordenação por afinidade e recálculo financeiro.
//
// O recálculo é o coração: o financeiro planejado depende de diária × noites, e um
// delta que acumula transforma duas trocas seguidas num orçamento fantasma.
import { describe, it, expect } from 'vitest';
import {
  parsePriceRangeBRL,
  rankHotelsForTrip,
  getCuratedHotelsForCity,
  applyHotelSwap,
  previewSwapImpact,
  nightlyRateFor,
  tierOfTrip,
  personaOfTrip,
} from '@/lib/hotelSwap';
import type { AccommodationLike, FinanceBucketLike, SwapTripLike, TripFinancesLike } from '@/lib/hotelSwap';
import { curatedHotels, type CuratedHotel } from '@/data/curatedHotels';
import { CURATED_CITIES } from '@/lib/curatedCities';

const TODOS = Object.values(curatedHotels).flat();

/** Viagem de teste com hospedagem e finanças garantidas — evita `!` em toda asserção. */
type TestTrip = SwapTripLike & {
  id: string;
  accommodation: AccommodationLike & { nightlyRate: number; totalNights: number; totalPrice: number };
  finances: TripFinancesLike & {
    total: number; planned: number; confirmed: number; bidding: number; available: number;
    categories: Record<string, FinanceBucketLike>;
  };
};

function makeTrip(over: Partial<TestTrip> = {}): TestTrip {
  return {
    id: 'trip-1',
    destination: 'Cartagena',
    budgetTier: 'comfort',
    travelers: 4,
    travelInterests: [],
    budget: 20000,
    accommodation: {
      id: 'hotel-main',
      name: 'Novotel Cartagena — Centro, Cartagena',
      neighborhood: 'Centro',
      stars: 4,
      checkIn: '2026-10-05T00:00:00.000Z',
      checkOut: '2026-10-12T00:00:00.000Z',
      nightlyRate: 450,
      totalNights: 7,
      totalPrice: 3150,
      status: 'planned',
    },
    finances: {
      total: 20000,
      confirmed: 0,
      bidding: 0,
      planned: 10000,
      available: 10000,
      categories: {
        flights: { planned: 5000, confirmed: 0, bidding: 0 },
        accommodation: { planned: 3150, confirmed: 0, bidding: 0 },
        tours: { planned: 1000, confirmed: 0, bidding: 0 },
        food: { planned: 600, confirmed: 0, bidding: 0 },
        transport: { planned: 250, confirmed: 0, bidding: 0 },
        shopping: { planned: 0, confirmed: 0, bidding: 0 },
      },
    },
    ...over,
  };
}

const hotelDe = (cidade: string, i = 0): CuratedHotel => curatedHotels[cidade][i];

describe('parsePriceRangeBRL', () => {
  it('parseia os 68 hotéis reais sem exceção', () => {
    const falhas = TODOS.filter((h) => parsePriceRangeBRL(h.priceRangeBRL) === null);
    expect(falhas.map((h) => `${h.name}: ${h.priceRangeBRL}`)).toEqual([]);
    expect(TODOS.length).toBe(68);
  });

  it('trata o ponto como separador de milhar (pt-BR)', () => {
    expect(parsePriceRangeBRL('R$ 2.500-4.500')).toEqual({ min: 2500, max: 4500, mid: 3500 });
    expect(parsePriceRangeBRL('R$ 700-1.100')).toEqual({ min: 700, max: 1100, mid: 900 });
    expect(parsePriceRangeBRL('R$ 90-180')).toEqual({ min: 90, max: 180, mid: 135 });
  });

  it('devolve null sem lançar quando o formato não bate', () => {
    for (const ruim of ['', 'sob consulta', 'R$ 500', null, undefined, 42 as never, 'R$ 900-100']) {
      expect(parsePriceRangeBRL(ruim as never)).toBeNull();
    }
  });

  it('mid é sempre o meio da faixa, arredondado', () => {
    for (const h of TODOS) {
      const p = parsePriceRangeBRL(h.priceRangeBRL)!;
      expect(p.mid).toBe(Math.round((p.min + p.max) / 2));
      expect(p.mid).toBeGreaterThanOrEqual(p.min);
      expect(p.mid).toBeLessThanOrEqual(p.max);
    }
  });
});

describe('perfil da viagem', () => {
  it('mapeia tier do wizard para tier da curadoria', () => {
    expect(tierOfTrip({ budgetTier: 'backpacker' })).toBe('budget');
    expect(tierOfTrip({ budgetTier: 'comfort' })).toBe('mid');
    expect(tierOfTrip({ budgetTier: 'luxury' })).toBe('upscale');
    expect(tierOfTrip({ budgetType: 'conforto' })).toBe('mid');
    expect(tierOfTrip({})).toBe('mid');
  });

  it('deriva persona dos viajantes, sem campo novo', () => {
    expect(personaOfTrip({ travelers: 4 })).toBe('family');
    expect(personaOfTrip({ travelers: 2 })).toBe('couple');
    expect(personaOfTrip({ travelers: 1 })).toBe('solo');
  });
});

describe('rankHotelsForTrip', () => {
  it('põe tier igual à frente, e persona decide o empate', () => {
    const ranked = rankHotelsForTrip('Cartagena', makeTrip());
    expect(ranked.length).toBe(curatedHotels['Cartagena'].length);

    const primeiro = ranked[0].hotel;
    expect(primeiro.tier).toBe('mid');
    expect(primeiro.personaTags).toContain('family');

    // Nenhum upscale pode aparecer acima de um mid nesta viagem.
    const primeiroUpscale = ranked.findIndex((r) => r.hotel.tier === 'upscale');
    const ultimoMid = ranked.map((r) => r.hotel.tier).lastIndexOf('mid');
    if (primeiroUpscale >= 0 && ultimoMid >= 0) expect(primeiroUpscale).toBeGreaterThan(ultimoMid);
  });

  it('muda a ordem quando o perfil muda', () => {
    const familia = rankHotelsForTrip('Gramado', makeTrip({ destination: 'Gramado', travelers: 4 }));
    const casalLuxo = rankHotelsForTrip('Gramado', makeTrip({ destination: 'Gramado', travelers: 2, budgetTier: 'luxury' }));
    expect(casalLuxo[0].hotel.tier).toBe('upscale');
    expect(familia[0].hotel.name).not.toBe(casalLuxo[0].hotel.name);
  });

  it('marca isCurrent quando o hotel da viagem É um dos curados', () => {
    const alvo = hotelDe('Cartagena', 2);
    const ranked = rankHotelsForTrip('Cartagena', makeTrip({
      accommodation: { ...makeTrip().accommodation, name: `${alvo.name} — ${alvo.zone}, Cartagena` },
    }));
    expect(ranked.filter((r) => r.isCurrent).map((r) => r.hotel.id)).toEqual([alvo.id]);
  });

  it('não marca nada quando o hotel atual é de fora da curadoria (o caso comum)', () => {
    const ranked = rankHotelsForTrip('Cartagena', makeTrip());
    expect(ranked.some((r) => r.isCurrent)).toBe(false);
  });

  it('devolve vazio, sem lançar, nas 5 cidades sem curadoria', () => {
    for (const cidade of ['Cidade do Cabo', 'Istambul', 'Bangkok', 'Marrakech', 'Singapura']) {
      expect(rankHotelsForTrip(cidade, makeTrip({ destination: cidade }))).toEqual([]);
      expect(getCuratedHotelsForCity(cidade)).toEqual([]);
    }
    expect(rankHotelsForTrip(undefined, makeTrip())).toEqual([]);
    expect(rankHotelsForTrip('Xanadu', makeTrip())).toEqual([]);
  });

  it('acha a cidade sem acento e com caixa diferente', () => {
    expect(getCuratedHotelsForCity('toquio').length).toBe(curatedHotels['Tóquio'].length);
    expect(getCuratedHotelsForCity('RIO DE JANEIRO').length).toBe(curatedHotels['Rio de Janeiro'].length);
  });

  it('as 16 cidades com curadoria respondem, e todo item tem preço parseado', () => {
    const comCuradoria = CURATED_CITIES.filter((c) => getCuratedHotelsForCity(c).length > 0);
    expect(comCuradoria.length).toBe(16);
    for (const cidade of comCuradoria) {
      const ranked = rankHotelsForTrip(cidade, makeTrip({ destination: cidade }));
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked.every((r) => r.price !== null)).toBe(true);
    }
  });
});

describe('applyHotelSwap — recálculo financeiro', () => {
  it('troca por hotel mais caro sobe planejado e derruba disponível pelo MESMO delta', () => {
    const trip = makeTrip();
    const caro = curatedHotels['Cartagena'].find((h) => parsePriceRangeBRL(h.priceRangeBRL)!.mid > 450)!;
    const esperado = parsePriceRangeBRL(caro.priceRangeBRL)!.mid * 7;
    const delta = esperado - 3150;
    expect(delta).toBeGreaterThan(0);

    const out = applyHotelSwap(trip, caro);
    expect(out.accommodation.totalPrice).toBe(esperado);
    expect(out.finances.categories.accommodation.planned).toBe(3150 + delta);
    expect(out.finances.planned).toBe(10000 + delta);
    expect(out.finances.available).toBe(10000 - delta);
  });

  it('troca por hotel mais barato move os três na direção oposta', () => {
    const trip = makeTrip();
    const barato = curatedHotels['Cartagena'].find((h) => parsePriceRangeBRL(h.priceRangeBRL)!.mid < 450);
    if (!barato) return; // a cidade pode não ter um mais barato; o caso caro já cobre o sinal
    const delta = parsePriceRangeBRL(barato.priceRangeBRL)!.mid * 7 - 3150;
    const out = applyHotelSwap(trip, barato);
    expect(delta).toBeLessThan(0);
    expect(out.finances.planned).toBe(10000 + delta);
    expect(out.finances.available).toBe(10000 - delta);
  });

  it('duas trocas seguidas NÃO acumulam delta', () => {
    const trip = makeTrip();
    const [a, b] = curatedHotels['Cartagena'].filter(
      (h) => parsePriceRangeBRL(h.priceRangeBRL)!.mid !== 450,
    );
    const viaA = applyHotelSwap(applyHotelSwap(trip, a), b);
    const direto = applyHotelSwap(trip, b);

    expect(viaA.accommodation.totalPrice).toBe(direto.accommodation.totalPrice);
    expect(viaA.finances.planned).toBe(direto.finances.planned);
    expect(viaA.finances.available).toBe(direto.finances.available);
    expect(viaA.finances.categories.accommodation.planned).toBe(direto.finances.categories.accommodation.planned);
  });

  it('voltar ao hotel original restaura o orçamento exatamente', () => {
    const trip = makeTrip();
    const original = curatedHotels['Cartagena'][0];
    const base = applyHotelSwap(trip, original);
    const ida = applyHotelSwap(base, curatedHotels['Cartagena'][1]);
    const volta = applyHotelSwap(ida, original);
    expect(volta.finances.planned).toBe(base.finances.planned);
    expect(volta.finances.available).toBe(base.finances.available);
  });

  it('não encosta nas outras categorias', () => {
    const out = applyHotelSwap(makeTrip(), hotelDe('Cartagena'));
    const cat = out.finances.categories;
    expect(cat.flights).toEqual({ planned: 5000, confirmed: 0, bidding: 0 });
    expect(cat.tours).toEqual({ planned: 1000, confirmed: 0, bidding: 0 });
    expect(cat.food).toEqual({ planned: 600, confirmed: 0, bidding: 0 });
    expect(cat.transport).toEqual({ planned: 250, confirmed: 0, bidding: 0 });
  });

  it('available nunca fica negativo', () => {
    const pobre = makeTrip({
      budget: 1000,
      finances: { ...makeTrip().finances, total: 1000, planned: 900, available: 100 },
    });
    const caro = curatedHotels['Cartagena'].reduce((a, b) =>
      parsePriceRangeBRL(a.priceRangeBRL)!.mid > parsePriceRangeBRL(b.priceRangeBRL)!.mid ? a : b);
    expect(applyHotelSwap(pobre, caro).finances.available).toBe(0);
  });

  it('preserva datas e noites — a troca é de hotel, não de estadia', () => {
    const trip = makeTrip();
    const out = applyHotelSwap(trip, hotelDe('Cartagena'));
    expect(out.accommodation.checkIn).toBe(trip.accommodation.checkIn);
    expect(out.accommodation.checkOut).toBe(trip.accommodation.checkOut);
    expect(out.accommodation.totalNights).toBe(7);
    expect(out.accommodation.totalPrice).toBe(out.accommodation.nightlyRate * 7);
  });

  it('hotel confirmado volta a planejado', () => {
    const confirmado = makeTrip({
      accommodation: { ...makeTrip().accommodation, status: 'confirmed' },
    });
    expect(applyHotelSwap(confirmado, hotelDe('Cartagena')).accommodation.status).toBe('planned');
  });

  it('grava nome, zona, tip e proveniência', () => {
    const h = hotelDe('Paris');
    const out = applyHotelSwap(makeTrip({ destination: 'Paris' }), h);
    expect(out.accommodation.name).toBe(h.name);
    expect(out.accommodation.neighborhood).toBe(h.zone);
    expect(out.accommodation.description).toBe(h.tips[0]);
    expect(out.accommodation.curatedHotelId).toBe(h.id);
  });

  it('stars vem do tier — aproximação declarada, não dado da curadoria', () => {
    const porTier = (t: string) => TODOS.find((h) => h.tier === t)!;
    expect(applyHotelSwap(makeTrip(), porTier('budget')).accommodation.stars).toBe(3);
    expect(applyHotelSwap(makeTrip(), porTier('mid')).accommodation.stars).toBe(4);
    expect(applyHotelSwap(makeTrip(), porTier('upscale')).accommodation.stars).toBe(5);
  });

  it('é imutável: a viagem de entrada não muda', () => {
    const trip = makeTrip();
    const antes = JSON.stringify(trip);
    applyHotelSwap(trip, hotelDe('Cartagena'));
    expect(JSON.stringify(trip)).toBe(antes);
  });

  it('não quebra em viagem sem finances nem accommodation', () => {
    const out = applyHotelSwap({ id: 'x' } as TestTrip, hotelDe('Cartagena'));
    expect(out.accommodation.name).toBe(hotelDe('Cartagena').name);
    expect(out.accommodation.totalNights).toBe(1);
    expect(out.finances).toBeUndefined();
  });

  it('faixa ilegível preserva a diária atual em vez de zerar', () => {
    const semPreco = { ...hotelDe('Cartagena'), priceRangeBRL: 'sob consulta' };
    expect(nightlyRateFor(semPreco, 450)).toBe(450);
    const out = applyHotelSwap(makeTrip(), semPreco);
    expect(out.accommodation.nightlyRate).toBe(450);
    expect(out.finances.planned).toBe(10000);
  });
});

describe('previewSwapImpact', () => {
  it('antecipa exatamente o que applyHotelSwap vai fazer', () => {
    const trip = makeTrip();
    for (const h of curatedHotels['Cartagena']) {
      const preview = previewSwapImpact(trip, h);
      const real = applyHotelSwap(trip, h);
      expect(preview.nextTotal).toBe(real.accommodation.totalPrice);
      expect(preview.delta).toBe(real.finances.planned - trip.finances.planned);
      expect(preview.nights).toBe(7);
    }
  });
});
