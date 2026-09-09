// hotelUnificado — o gerador de viagens novas escolhe entre os hotéis CURADOS.
//
// Antes deste arco havia duas bases paralelas e `buildDraftTrip` usava a errada:
// `HOTEL_RECOMMENDATIONS` (escrita à mão) em vez de `curatedHotels`. Medido no arco
// anterior: 7 de 84 escolhas do gerador estavam entre os 68 curados — a pílula
// "Escolhido pelo KINU" prometia curadoria em 92% dos casos sem entregar, e Cartagena
// e Gramado recebiam `Novotel <cidade>` com 10 curados ao lado.
//
// O que este arquivo trava são as DUAS metades da regra, porque cada uma sozinha
// quebra o produto:
//   1. cidade com curado do tier pedido -> o hotel vem da curadoria, com proveniência;
//   2. cidade SEM curado do tier -> nada muda, byte a byte (inclusive as finanças).
// A metade 2 é a que impede o `rankHotelsForTrip[0]` cru de servir Copacabana Palace
// a R$ 4.500/noite para quem escolheu Mochileiro.
import { describe, it, expect } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { getCuratedHotelsForCity, parsePriceRangeBRL, pickCuratedHotelForTrip } from '@/lib/hotelSwap';
import type { SavedTrip } from '@/types/trip';

const DEPARTURE = new Date('2026-11-10T00:00:00');
const RETURN = new Date('2026-11-17T00:00:00'); // 8 dias, 7 noites

function draftInput(over: Record<string, unknown> = {}) {
  return {
    originCity: 'São Paulo',
    originAirportCode: 'GRU',
    destinationCity: 'Cartagena',
    destinationAirportCode: 'CTG',
    departureDate: DEPARTURE,
    returnDate: RETURN,
    adults: 2,
    children: [{}, {}] as unknown[],
    infants: 0,
    budgetTier: 'comfort',
    travelStyle: 'balanced',
    budgetAmount: 0,
    travelInterests: [] as string[],
    priorities: ['flights', 'accommodation', 'experiences'],
    ...over,
  } as Parameters<typeof buildDraftTrip>[0];
}

/** A proveniência trafega por fora do tipo, como `mealPlan` (recon §4.6). */
const curatedIdOf = (trip: SavedTrip) =>
  (trip.accommodation as unknown as { curatedHotelId?: string } | undefined)?.curatedHotelId;

describe('buildDraftTrip — cidade com curadoria no tier pedido', () => {
  it('Cartagena/Conforto nasce com hotel da curadoria e proveniência gravada', async () => {
    const trip = await buildDraftTrip(draftInput());
    const curated = getCuratedHotelsForCity('Cartagena');

    const id = curatedIdOf(trip);
    expect(id).toBeTruthy();
    const hotel = curated.find((h) => h.id === id)!;
    expect(hotel).toBeDefined();
    expect(trip.accommodation!.name).toBe(hotel.name);
    expect(trip.accommodation!.neighborhood).toBe(hotel.zone);
  });

  it('o `Novotel Cartagena` sintético morre — o nome é de um curado de verdade', async () => {
    const trip = await buildDraftTrip(draftInput());
    expect(trip.accommodation!.name).not.toMatch(/Novotel/);
    const nomes = getCuratedHotelsForCity('Cartagena').map((h) => h.name);
    expect(nomes).toContain(trip.accommodation!.name);
  });

  it('o tier é respeitado: Mochileiro pega o `budget`, Luxo pega o `upscale`', async () => {
    const mochileiro = await buildDraftTrip(draftInput({ budgetTier: 'backpacker' }));
    const luxo = await buildDraftTrip(draftInput({ budgetTier: 'luxury' }));
    const curated = getCuratedHotelsForCity('Cartagena');
    const tierOf = (trip: SavedTrip) => curated.find((h) => h.id === curatedIdOf(trip))?.tier;

    expect(tierOf(mochileiro)).toBe('budget');
    expect(tierOf(luxo)).toBe('upscale');
    // E o mochileiro NÃO recebe o hotel do luxo — a trava do arco.
    expect(mochileiro.accommodation!.nightlyRate).toBeLessThan(luxo.accommodation!.nightlyRate);
  });

  it('a diária é o ponto médio e cai DENTRO da faixa curada', async () => {
    const trip = await buildDraftTrip(draftInput());
    const hotel = getCuratedHotelsForCity('Cartagena').find((h) => h.id === curatedIdOf(trip))!;
    const faixa = parsePriceRangeBRL(hotel.priceRangeBRL)!;

    expect(trip.accommodation!.nightlyRate).toBe(faixa.mid);
    expect(trip.accommodation!.nightlyRate).toBeGreaterThanOrEqual(faixa.min);
    expect(trip.accommodation!.nightlyRate).toBeLessThanOrEqual(faixa.max);
  });

  it('a tip curada vira a description do card (padrão do swap)', async () => {
    const trip = await buildDraftTrip(draftInput());
    const hotel = getCuratedHotelsForCity('Cartagena').find((h) => h.id === curatedIdOf(trip))!;
    expect(trip.accommodation!.description).toBe(hotel.tips[0]);
  });

  it('Tóquio Conforto e Luxo também nascem curados (acento na chave não atrapalha)', async () => {
    const conforto = await buildDraftTrip(draftInput({ destinationCity: 'Tóquio', destinationAirportCode: 'HND' }));
    const luxo = await buildDraftTrip(draftInput({ destinationCity: 'Tóquio', destinationAirportCode: 'HND', budgetTier: 'luxury' }));
    const nomes = getCuratedHotelsForCity('Tóquio').map((h) => h.name);

    expect(nomes).toContain(conforto.accommodation!.name);
    expect(nomes).toContain(luxo.accommodation!.name);
    expect(curatedIdOf(conforto)).not.toBe(curatedIdOf(luxo));
  });

  it('as finanças ficam coerentes com o hotel curado', async () => {
    const trip = await buildDraftTrip(draftInput());
    const acc = trip.accommodation!;
    const cats = trip.finances.categories;

    expect(acc.totalPrice).toBe(acc.nightlyRate * acc.totalNights);
    expect(cats.accommodation.planned).toBe(acc.totalPrice);
    const soma = cats.flights.planned + cats.accommodation.planned + cats.tours.planned
      + cats.food.planned + cats.transport.planned + cats.shopping.planned;
    expect(trip.finances.planned).toBe(soma);
    // Sem orçamento informado, o rascunho NÃO nasce estourado.
    expect(trip.finances.total).toBe(trip.finances.planned);
    expect(trip.finances.available).toBe(0);
  });
});

describe('buildDraftTrip — cidade sem curadoria no tier: nada muda', () => {
  // Istambul e Bangkok não têm curadoria nenhuma; Rio de Janeiro tem 4 curados mas
  // nenhum `budget`, e é justamente o caso em que a escolha automática cega serviria
  // o Copacabana Palace (R$ 4.500/noite) para um mochileiro de R$ 150.
  it('Istambul segue no HOTEL_RECOMMENDATIONS, sem proveniência curada', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Istambul', destinationAirportCode: 'IST' }));
    expect(getCuratedHotelsForCity('Istambul')).toHaveLength(0);
    expect(curatedIdOf(trip)).toBeUndefined();
    expect(trip.accommodation!.name).toContain('Istambul');
  });

  it('Bangkok mantém o nome com sufixo de bairro/cidade do gerador antigo', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Bangkok', destinationAirportCode: 'BKK' }));
    expect(curatedIdOf(trip)).toBeUndefined();
    expect(trip.accommodation!.name).toMatch(/ — .+, Bangkok$/);
  });

  it('Rio/Mochileiro NÃO é promovido a hotel de luxo curado', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Rio de Janeiro', destinationAirportCode: 'GIG', budgetTier: 'backpacker' }));
    expect(getCuratedHotelsForCity('Rio de Janeiro').length).toBeGreaterThan(0);
    expect(pickCuratedHotelForTrip('Rio de Janeiro', { budgetTier: 'backpacker', travelers: 4 })).toBeNull();
    expect(curatedIdOf(trip)).toBeUndefined();
    expect(trip.accommodation!.nightlyRate).toBeLessThan(1000);
  });

  it('a hospedagem e o planejado seguem a estimativa de sempre (não-regressão)', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Marrakech', destinationAirportCode: 'RAK' }));
    const acc = trip.accommodation!;
    // Estes números são os de antes do arco: diária estimada × 7 noites.
    expect(acc.nightlyRate).toBe(800);
    expect(acc.totalPrice).toBe(5600);
    expect(trip.finances.categories.accommodation.planned).toBe(5600);
    expect(trip.finances.planned).toBe(38720);
  });
});

describe('pickCuratedHotelForTrip — a regra dos tiers aceitos', () => {
  it('upscale e resort são par: Porto Seguro (só resort) atende o Luxo', async () => {
    const escolha = pickCuratedHotelForTrip('Porto Seguro', { budgetTier: 'luxury', travelers: 4 });
    expect(escolha?.tier).toBe('resort');
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Porto Seguro', destinationAirportCode: 'BPS', budgetTier: 'luxury' }));
    expect(curatedIdOf(trip)).toBe(escolha!.id);
  });

  it('mas resort não desce para o Conforto: Dubai/Conforto fica sem curado', () => {
    // Dubai tem 3 resorts e zero `mid`. Aceitar resort ali significaria Atlantis The
    // Palm a R$ 3.750/noite para quem pediu Conforto de R$ 1.300.
    expect(pickCuratedHotelForTrip('Dubai', { budgetTier: 'comfort', travelers: 4 })).toBeNull();
  });

  it('cidade sem curadoria devolve null sem explodir', () => {
    expect(pickCuratedHotelForTrip('Singapura', { budgetTier: 'comfort', travelers: 4 })).toBeNull();
    expect(pickCuratedHotelForTrip(undefined, { budgetTier: 'comfort' })).toBeNull();
    expect(pickCuratedHotelForTrip('Cartagena', null)).not.toBeNull(); // default 'mid'
  });
});
