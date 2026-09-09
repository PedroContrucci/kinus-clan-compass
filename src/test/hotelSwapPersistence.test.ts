// A troca de hotel tem que sobreviver ao reload E ao espelho kinu-beta.
//
// Trocar hotel é decisão do usuário: se ela evapora no refresh, o botão é pior que
// não existir. E o espelho do 4c serializa a viagem inteira — o campo de proveniência
// (curatedHotelId), gravado por fora de SavedTrip como o accommodation.mealPlan já é,
// precisa atravessar normalizeTrip sem sumir.
import { describe, it, expect, beforeEach } from 'vitest';
import { TRIPS_KEY, addTrip, getTrip, listTrips, updateTrip, normalizeTrip, newTripId } from '@/lib/tripStore';
import { applyHotelSwap, parsePriceRangeBRL, type AccommodationLike } from '@/lib/hotelSwap';
import { curatedHotels } from '@/data/curatedHotels';
import type { SavedTrip } from '@/types/trip';

const CARTAGENA = curatedHotels['Cartagena'];

function baseTrip(id: string, destination = 'Cartagena'): SavedTrip {
  return {
    id,
    status: 'draft',
    destination,
    country: 'Colômbia',
    emoji: '🌴',
    startDate: '2026-10-05T00:00:00.000Z',
    endDate: '2026-10-12T00:00:00.000Z',
    budget: 20000,
    budgetType: 'comfort',
    travelers: 4,
    priorities: [],
    progress: 0,
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
    days: [],
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
    checklist: [],
    createdAt: '2026-09-09T00:00:00.000Z',
  } as SavedTrip;
}

beforeEach(() => {
  localStorage.clear();
});

describe('troca de hotel sobrevive ao storage', () => {
  it('reler do storage devolve o hotel novo e as finanças novas', () => {
    const id = newTripId();
    addTrip(baseTrip(id));
    const escolhido = CARTAGENA[1];
    const esperado = parsePriceRangeBRL(escolhido.priceRangeBRL)!.mid * 7;

    updateTrip(id, (t) => applyHotelSwap(t, escolhido));

    // getTrip lê do localStorage — é o mesmo caminho de um reload.
    const relido = getTrip(id)!;
    expect(relido.accommodation!.name).toBe(escolhido.name);
    expect(relido.accommodation!.neighborhood).toBe(escolhido.zone);
    expect(relido.accommodation!.totalPrice).toBe(esperado);
    expect(relido.finances.categories.accommodation.planned).toBe(esperado);
    expect(relido.finances.planned).toBe(10000 + (esperado - 3150));
  });

  it('preserva curatedHotelId, que vive por fora de SavedTrip', () => {
    const id = newTripId();
    addTrip(baseTrip(id));
    const escolhido = CARTAGENA[2];

    updateTrip(id, (t) => applyHotelSwap(t, escolhido));

    expect((getTrip(id)!.accommodation as AccommodationLike).curatedHotelId).toBe(escolhido.id);
    // E também na travessia explícita do normalizador, que o espelho usa.
    const norm = normalizeTrip(JSON.parse(localStorage.getItem(TRIPS_KEY)!)[0]);
    expect((norm.accommodation as AccommodationLike).curatedHotelId).toBe(escolhido.id);
  });

  it("grava a autoria 'user' e ela sobrevive ao reload e ao normalizador", () => {
    // Sem este campo, o bloco do roteiro diria "Escolhido porque" sobre um hotel que o
    // usuário escolheu — a mentirinha que a regra de transparência existe para evitar.
    const id = newTripId();
    addTrip(baseTrip(id));

    updateTrip(id, (t) => applyHotelSwap(t, CARTAGENA[3]));

    expect((getTrip(id)!.accommodation as AccommodationLike).chosenBy).toBe('user');
    const norm = normalizeTrip(JSON.parse(localStorage.getItem(TRIPS_KEY)!)[0]);
    expect((norm.accommodation as AccommodationLike).chosenBy).toBe('user');
  });

  it('não toca nas outras viagens do array', () => {
    const a = newTripId();
    const b = newTripId();
    addTrip(baseTrip(a));
    addTrip(baseTrip(b, 'Paris'));
    const antesB = JSON.stringify(getTrip(b));

    updateTrip(a, (t) => applyHotelSwap(t, CARTAGENA[0]));

    expect(JSON.stringify(getTrip(b))).toBe(antesB);
    expect(listTrips().length).toBe(2);
  });

  it('atravessa a serialização do espelho sem perder campo', () => {
    const id = newTripId();
    addTrip(baseTrip(id));
    updateTrip(id, (t) => applyHotelSwap(t, CARTAGENA[3]));

    const trip = getTrip(id)!;
    // Ida e volta pelo JSON: exatamente o que o outbox do 4c faz com a viagem.
    const roundTrip = normalizeTrip(JSON.parse(JSON.stringify(trip)));

    expect(roundTrip.accommodation).toEqual(trip.accommodation);
    expect(roundTrip.finances).toEqual(trip.finances);
  });

  it('trocas sucessivas gravadas no storage não acumulam delta', () => {
    const id = newTripId();
    addTrip(baseTrip(id));

    updateTrip(id, (t) => applyHotelSwap(t, CARTAGENA[0]));
    updateTrip(id, (t) => applyHotelSwap(t, CARTAGENA[1]));
    updateTrip(id, (t) => applyHotelSwap(t, CARTAGENA[2]));
    const viaStorage = getTrip(id)!;

    const outroId = newTripId();
    addTrip(baseTrip(outroId));
    updateTrip(outroId, (t) => applyHotelSwap(t, CARTAGENA[2]));
    const direto = getTrip(outroId)!;

    expect(viaStorage.finances.planned).toBe(direto.finances.planned);
    expect(viaStorage.finances.available).toBe(direto.finances.available);
    expect(viaStorage.accommodation!.totalPrice).toBe(direto.accommodation!.totalPrice);
  });

  it('viagem em cidade sem curadoria continua intacta se nada for trocado', () => {
    const id = newTripId();
    addTrip(baseTrip(id, 'Istambul'));
    const antes = JSON.stringify(getTrip(id));
    expect(JSON.stringify(getTrip(id))).toBe(antes);
  });
});
