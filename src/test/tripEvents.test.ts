// tripEvents — os fatos de viagem, e as duas coisas que eles não podem fazer:
// contar a mesma viagem duas vezes, e contar duas confirmações como uma.
//
// O `vi.mock` do cliente é obrigatório pelo motivo de sempre: `client.ts` roda `createClient`
// NO IMPORT e morre sem as VITE_KINU_BETA_* num CI limpo. Aqui o que se conta é EMISSÃO — o
// que entrou no anel do emissor —, não entrega; a entrega tem suíte própria (kinuEvents.test).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

import { readEvents, type EventProps } from '@/lib/kinuEvents';
import { addTrip, getTrip, type StoredTrip } from '@/lib/tripStore';
import type { TripFinances } from '@/types/trip';
import {
  ACTIVATED_MARK,
  COMPLETED_MARK,
  daysOf,
  geoOf,
  itemKindOf,
  sweepCompletedTrips,
  trackTripActivated,
  trackTripCreated,
  trackTripItemConfirmed,
} from '@/lib/tripEvents';

/** As props de cada emissão de um nome, na ordem em que entraram no anel. */
const propsOf = (name: string): EventProps[] =>
  readEvents().filter((e) => e.name === name).map((e) => e.props);

/** `TripFinances` inteiro a partir dos quatro números que o `budget.closed_under` lê. As
 *  categorias zeradas existem só para satisfazer o tipo — nenhum evento olha para elas. */
const finances = (over: Partial<TripFinances> = {}): TripFinances => {
  const zero = { planned: 0, confirmed: 0, bidding: 0 };
  return {
    total: 10000,
    confirmed: 0,
    planned: 0,
    bidding: 0,
    available: 10000,
    categories: {
      flights: { ...zero },
      accommodation: { ...zero },
      tours: { ...zero },
      food: { ...zero },
      transport: { ...zero },
      shopping: { ...zero },
    },
    ...over,
  };
};

const trip = (over: Partial<StoredTrip> = {}): StoredTrip => ({
  id: 'trip-a',
  status: 'draft',
  destination: 'Lisboa',
  country: 'Portugal',
  emoji: '🇵🇹',
  startDate: '2026-03-10T00:00:00.000Z',
  endDate: '2026-03-14T00:00:00.000Z',
  budget: 10000,
  budgetType: 'conforto',
  travelers: 2,
  priorities: [],
  progress: 0,
  days: [],
  finances: finances(),
  checklist: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
} as StoredTrip);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('trip.created', () => {
  it('sai das duas superfícies com a origem de cada uma', () => {
    const wizard = addTrip(trip({ id: 'trip-w' }));
    const kinu = addTrip(trip({ id: 'trip-k', destination: 'Roma' }));

    trackTripCreated(wizard, 'wizard');
    trackTripCreated(kinu, 'kinu_ai');

    expect(propsOf('trip.created')).toEqual([
      { trip_id: 'trip-w', destination: 'Lisboa', origin: 'wizard' },
      { trip_id: 'trip-k', destination: 'Roma', origin: 'kinu_ai' },
    ]);
  });
});

describe('trip.activated', () => {
  it('carrega país, continente, dias de calendário, viajantes e crianças', () => {
    addTrip(trip({ childrenCount: 1 } as Partial<StoredTrip>));

    trackTripActivated('trip-a');

    expect(propsOf('trip.activated')).toEqual([{
      trip_id: 'trip-a',
      destination: 'Lisboa',
      country: 'Portugal',
      continent: 'Europa',
      days: 5,
      travelers: 2,
      children: 1,
    }]);
  });

  it('omite `children` na viagem antiga, que nunca gravou o campo', () => {
    addTrip(trip());

    trackTripActivated('trip-a');

    expect(propsOf('trip.activated')[0]).not.toHaveProperty('children');
  });

  it('é UMA por viagem — a marca, não o dedupe do emissor', () => {
    addTrip(trip({ id: 'trip-a' }));
    addTrip(trip({ id: 'trip-b', destination: 'Roma' }));

    trackTripActivated('trip-a');
    trackTripActivated('trip-b'); // outro evento no meio: o dedupe do emissor deixa passar
    trackTripActivated('trip-a');

    expect(propsOf('trip.activated').map((p) => p.trip_id)).toEqual(['trip-a', 'trip-b']);
  });

  it('grava a marca NA VIAGEM, então ela sobrevive ao recarregamento do app', () => {
    addTrip(trip());
    trackTripActivated('trip-a');

    // A marca está no storage, não em memória: é ela que o segundo dispositivo recebe pelo
    // espelho (`tripSync.toRow` manda a viagem inteira) e é ela que sobrevive a um F5.
    expect(getTrip('trip-a')?.[ACTIVATED_MARK]).toEqual(expect.any(String));
  });

  it('não emite para viagem que não existe no storage', () => {
    trackTripActivated('trip-fantasma');

    expect(propsOf('trip.activated')).toEqual([]);
  });
});

describe('trip.item_confirmed', () => {
  it('traduz a categoria do roteiro para o vocabulário do evento', () => {
    expect(itemKindOf('voo')).toBe('flight');
    expect(itemKindOf('hotel')).toBe('hotel');
    expect(itemKindOf('passeio')).toBe('activity');
    expect(itemKindOf('comida')).toBe('activity');
    expect(itemKindOf(undefined)).toBe('activity');
  });

  it('conta DUAS confirmações seguidas como duas — é para isso que o `item_id` existe', () => {
    trackTripItemConfirmed('trip-a', 'activity', 'day3-2');
    trackTripItemConfirmed('trip-a', 'activity', 'day3-3');

    expect(propsOf('trip.item_confirmed')).toEqual([
      { trip_id: 'trip-a', kind: 'activity', item_id: 'day3-2' },
      { trip_id: 'trip-a', kind: 'activity', item_id: 'day3-3' },
    ]);
  });
});

describe('varredura de trip.completed', () => {
  const HOJE = new Date('2026-09-10T12:00:00.000Z');

  it('emite só a viagem vencida, e sai marcando', () => {
    addTrip(trip({ id: 'vencida', status: 'active', endDate: '2026-08-01T00:00:00.000Z' }));
    addTrip(trip({ id: 'futura', status: 'active', endDate: '2026-12-01T00:00:00.000Z' }));
    addTrip(trip({
      id: 'ja-marcada',
      status: 'active',
      endDate: '2026-07-01T00:00:00.000Z',
      [COMPLETED_MARK]: '2026-07-02T00:00:00.000Z',
    } as Partial<StoredTrip>));

    expect(sweepCompletedTrips(HOJE)).toBe(1);
    expect(propsOf('trip.completed').map((p) => p.trip_id)).toEqual(['vencida']);
    expect(getTrip('vencida')?.[COMPLETED_MARK]).toEqual(expect.any(String));
  });

  it('a segunda varredura não emite nada', () => {
    addTrip(trip({ id: 'vencida', status: 'active', endDate: '2026-08-01T00:00:00.000Z' }));

    sweepCompletedTrips(HOJE);
    expect(sweepCompletedTrips(HOJE)).toBe(0);
  });

  it('rascunho vencido não concluiu viagem nenhuma', () => {
    addTrip(trip({ id: 'abandonada', status: 'draft', endDate: '2026-01-05T00:00:00.000Z' }));

    expect(sweepCompletedTrips(HOJE)).toBe(0);
    expect(getTrip('abandonada')?.[COMPLETED_MARK]).toBeUndefined();
  });

  it('viagem que termina HOJE ainda está acontecendo', () => {
    addTrip(trip({ id: 'em-curso', status: 'ongoing', endDate: '2026-09-10T00:00:00.000Z' }));

    expect(sweepCompletedTrips(HOJE)).toBe(0);
  });
});

describe('budget.closed_under', () => {
  const HOJE = new Date('2026-09-10T12:00:00.000Z');

  it('sai colado no `completed` quando confirmado + planejado couberam no orçamento', () => {
    addTrip(trip({
      id: 'barata',
      status: 'completed',
      endDate: '2026-08-01T00:00:00.000Z',
      finances: finances({ confirmed: 6000, planned: 1500, available: 2500 }),
    }));

    sweepCompletedTrips(HOJE);

    expect(propsOf('budget.closed_under')).toEqual([
      { trip_id: 'barata', budget: 10000, planned: 7500 },
    ]);
  });

  it('não sai quando estourou — e o `completed` sai do mesmo jeito', () => {
    addTrip(trip({
      id: 'estourada',
      status: 'completed',
      endDate: '2026-08-01T00:00:00.000Z',
      finances: finances({ confirmed: 12000, available: 0 }),
    }));

    sweepCompletedTrips(HOJE);

    expect(propsOf('budget.closed_under')).toEqual([]);
    expect(propsOf('trip.completed')).toHaveLength(1);
  });
});

describe('geografia', () => {
  it('colapsa as regiões de produto em continente de verdade', () => {
    expect(geoOf(trip({ destination: 'Rio de Janeiro', country: 'Brasil' })))
      .toEqual({ country: 'Brasil', continent: 'Américas' });
    expect(geoOf(trip({ destination: 'Dubai', country: 'Emirados Árabes' })))
      .toEqual({ country: 'Emirados Árabes', continent: 'Ásia' });
  });

  it('omite as duas props no destino fora do catálogo — ausente é ausente', () => {
    expect(geoOf(trip({ destination: 'Reykjavík', country: '' }))).toEqual({});
  });

  it('acha o continente pelo país quando a cidade não está catalogada', () => {
    expect(geoOf(trip({ destination: 'Trancoso', country: 'Brasil' })))
      .toEqual({ country: 'Brasil', continent: 'Américas' });
  });

  it('conta os dias pelo calendário e cai no roteiro quando as datas estão tortas', () => {
    expect(daysOf(trip())).toBe(5);
    expect(daysOf(trip({ startDate: 'xx', endDate: 'yy', days: [{}, {}, {}] } as Partial<StoredTrip>))).toBe(3);
  });
});

describe('invariante: nada aqui lança', () => {
  it('sobrevive ao storage recusando escrita', () => {
    addTrip(trip({ id: 'vencida', status: 'active', endDate: '2026-08-01T00:00:00.000Z' }));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => trackTripCreated(trip(), 'wizard')).not.toThrow();
    expect(() => trackTripActivated('vencida')).not.toThrow();
    expect(() => trackTripItemConfirmed('vencida', 'hotel', 'accommodation')).not.toThrow();
    expect(() => sweepCompletedTrips(new Date('2026-09-10T12:00:00.000Z'))).not.toThrow();
  });

  it('sobrevive à lista de viagens corrompida', () => {
    localStorage.setItem('kinu_trips', '{"nao":"array"}');

    expect(() => sweepCompletedTrips(new Date('2026-09-10T12:00:00.000Z'))).not.toThrow();
  });
});
