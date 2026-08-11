import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SavedTrip } from '@/types/trip';
import {
  TRIPS_KEY,
  PRICE_HISTORY_PREFIX,
  listTrips,
  getTrip,
  getActiveTrip,
  addTrip,
  updateTrip,
  deleteTrip,
  clearTrips,
  subscribeTrips,
  getPriceHistory,
  pushPriceSnapshot,
} from '@/lib/tripStore';

type RawTrip = Record<string, unknown>;

/** Grava direto no storage, sem passar pelo store — simula o "outro caminho de escrita". */
function seed(value: unknown): void {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(value));
}

function readRaw(): RawTrip[] {
  return JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
}

/**
 * As fixtures são viagens parciais de propósito: o store precisa aguentar exatamente o
 * que existe no storage de produção hoje. O cast fica isolado aqui, num lugar só.
 */
function fixture(trip: RawTrip): SavedTrip {
  return trip as unknown as SavedTrip;
}

function futureDate(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function pastDate(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

// O store avisa de propósito em vários caminhos testados aqui; sem o spy a saída da
// suíte vira lixo. Em alguns testes o spy é a própria asserção.
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe('listTrips', () => {
  it('devolve [] com storage vazio', () => {
    expect(listTrips()).toEqual([]);
  });

  it('devolve [] e avisa quando o valor gravado é um objeto', () => {
    seed({});
    expect(listTrips()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('devolve [] quando o valor gravado é null', () => {
    localStorage.setItem(TRIPS_KEY, 'null');
    expect(listTrips()).toEqual([]);
  });

  it('devolve [] quando o valor gravado é uma string', () => {
    localStorage.setItem(TRIPS_KEY, '"abc"');
    expect(listTrips()).toEqual([]);
  });

  it('devolve [] quando o JSON está corrompido', () => {
    localStorage.setItem(TRIPS_KEY, '{{{');
    expect(listTrips()).toEqual([]);
  });

  it('descarta entradas não-objeto e avisa quantas', () => {
    seed([null, 'x', { id: 'a' }]);

    const trips = listTrips();

    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe('a');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('2 entrada(s) inválida(s)'));
  });

  it('normaliza os dias crus de uma viagem', () => {
    seed([
      {
        id: 'a',
        days: [{ activities: [{ name: 'Museu' }] }],
      },
    ]);

    const [trip] = listTrips();
    const [day] = trip.days;

    expect(day.day).toBe(1);
    expect(day.title).toBe('Dia 1');
    expect(day.icon).toBe('🗺️');

    const [activity] = day.activities;
    expect(activity.id).toBe('day1-1');
    expect(activity.time).toBe('09:00');
    expect(activity.category).toBe('passeio');
    expect(activity.status).toBe('planned');
  });
});

describe('getTrip', () => {
  it('acha pelo id', () => {
    seed([{ id: 'a' }, { id: 'b' }]);
    expect(getTrip('b')?.id).toBe('b');
  });

  it('devolve null para id inexistente', () => {
    seed([{ id: 'a' }]);
    expect(getTrip('zzz')).toBeNull();
  });
});

describe('getActiveTrip', () => {
  it('devolve null com storage vazio', () => {
    expect(getActiveTrip()).toBeNull();
  });

  it('prefere a primeira active com startDate futura, não a última da lista', () => {
    seed([
      { id: 'futura', status: 'active', startDate: futureDate() },
      { id: 'ultima', status: 'draft' },
    ]);

    expect(getActiveTrip()?.id).toBe('futura');
  });

  it('cai para a última quando a active tem startDate no passado', () => {
    seed([
      { id: 'passada', status: 'active', startDate: pastDate() },
      { id: 'ultima', status: 'draft' },
    ]);

    expect(getActiveTrip()?.id).toBe('ultima');
  });

  it('cai para a última quando nenhuma é active', () => {
    seed([{ id: 'a' }, { id: 'b' }]);
    expect(getActiveTrip()?.id).toBe('b');
  });
});

describe('addTrip', () => {
  it('gera id e createdAt quando faltam, e faz append no fim', () => {
    seed([{ id: 'existente' }]);

    const created = addTrip(fixture({ destination: 'Lisboa' }));

    expect(created.id).toMatch(/^trip_\d+$/);
    expect(Number.isNaN(Date.parse(created.createdAt as string))).toBe(false);

    const stored = readRaw();
    expect(stored).toHaveLength(2);
    expect(stored[1].id).toBe(created.id);
  });

  it('relê o storage a cada escrita: viagem criada por fora sobrevive', () => {
    addTrip(fixture({ id: 'a' }));

    // Escrita externa entre as duas chamadas.
    seed([{ id: 'a' }, { id: 'b' }]);

    addTrip(fixture({ id: 'c' }));

    expect(readRaw().map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('updateTrip', () => {
  it('grava o patch e devolve o objeto atualizado', () => {
    seed([{ id: 'a', destination: 'Lisboa' }]);

    const updated = updateTrip('a', (trip) => ({ ...trip, destination: 'Porto' }));

    expect(updated?.destination).toBe('Porto');
    expect(readRaw()[0].destination).toBe('Porto');
  });

  it('devolve null, avisa e não grava nada para id inexistente', () => {
    seed([{ id: 'a' }]);

    expect(updateTrip('zzz', (trip) => trip)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('zzz'));
    expect(readRaw()).toEqual([{ id: 'a' }]);
  });

  it('não reconstrói as outras viagens: escrita externa em B sobrevive a um update em A', () => {
    addTrip(fixture({ id: 'a', destination: 'Lisboa' }));
    addTrip(fixture({ id: 'b', destination: 'Roma' }));

    // Simula o outro caminho de escrita (KinuAIContext / GeneratedItineraryStage)
    // gravando em B enquanto quem vai chamar updateTrip tem um array velho em memória.
    const raw = readRaw();
    raw[1].destination = 'Roma (editada por fora)';
    raw[1].outboundFlight = { option: { price: 999 } };
    seed(raw);

    updateTrip('a', (trip) => ({ ...trip, destination: 'Lisboa (editada)' }));

    const trips = listTrips();
    expect(trips[0].destination).toBe('Lisboa (editada)');
    expect(trips[1].destination).toBe('Roma (editada por fora)');
    expect(trips[1].outboundFlight.option.price).toBe(999);
  });
});

describe('deleteTrip', () => {
  it('remove a viagem e o histórico de preços dela, preservando o da outra', () => {
    seed([{ id: 'a' }, { id: 'b' }]);
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}a`, JSON.stringify([{ price: 1, timestamp: 'x' }]));
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}b`, JSON.stringify([{ price: 2, timestamp: 'y' }]));

    deleteTrip('a');

    expect(readRaw().map((t) => t.id)).toEqual(['b']);
    expect(localStorage.getItem(`${PRICE_HISTORY_PREFIX}a`)).toBeNull();
    expect(localStorage.getItem(`${PRICE_HISTORY_PREFIX}b`)).not.toBeNull();
  });

  it('avisa e não altera o storage para id inexistente', () => {
    seed([{ id: 'a' }]);

    deleteTrip('zzz');

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('zzz'));
    expect(readRaw()).toEqual([{ id: 'a' }]);
  });
});

describe('clearTrips', () => {
  it('apaga as viagens e todos os históricos, órfãos inclusive, sem tocar em kinu_user', () => {
    seed([{ id: 'a' }, { id: 'b' }]);
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}a`, '[]');
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}b`, '[]');
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}orfao`, '[]');
    localStorage.setItem('kinu_user', '{"name":"P"}');

    clearTrips();

    expect(localStorage.getItem(TRIPS_KEY)).toBeNull();
    expect(localStorage.getItem(`${PRICE_HISTORY_PREFIX}a`)).toBeNull();
    expect(localStorage.getItem(`${PRICE_HISTORY_PREFIX}b`)).toBeNull();
    expect(localStorage.getItem(`${PRICE_HISTORY_PREFIX}orfao`)).toBeNull();
    expect(localStorage.getItem('kinu_user')).toBe('{"name":"P"}');
  });
});

describe('subscribeTrips', () => {
  it('notifica em add, update, delete e clear', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTrips(listener);

    try {
      addTrip(fixture({ id: 'a' }));
      updateTrip('a', (trip) => trip);
      deleteTrip('a');
      clearTrips();

      expect(listener).toHaveBeenCalledTimes(4);
    } finally {
      unsubscribe();
    }
  });

  it('para de notificar depois do unsubscribe', () => {
    const listener = vi.fn();
    subscribeTrips(listener)();

    addTrip(fixture({ id: 'a' }));

    expect(listener).not.toHaveBeenCalled();
  });

  it('não notifica quando updateTrip não grava nada', () => {
    seed([{ id: 'a' }]);

    const listener = vi.fn();
    const unsubscribe = subscribeTrips(listener);

    try {
      updateTrip('zzz', (trip) => trip);
      expect(listener).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });
});

describe('getPriceHistory', () => {
  it('devolve [] quando a chave não existe', () => {
    expect(getPriceHistory('a')).toEqual([]);
  });

  it('devolve [] e avisa quando a chave tem forma errada', () => {
    localStorage.setItem(`${PRICE_HISTORY_PREFIX}a`, '{}');

    expect(getPriceHistory('a')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

describe('pushPriceSnapshot', () => {
  it('grava preço e timestamp parseável', () => {
    const history = pushPriceSnapshot('a', 1234);

    expect(history).toHaveLength(1);
    expect(history[0].price).toBe(1234);
    expect(Number.isNaN(Date.parse(history[0].timestamp))).toBe(false);
    expect(getPriceHistory('a')).toHaveLength(1);
  });

  it('mantém apenas os 10 mais recentes', () => {
    for (let price = 1; price <= 12; price += 1) pushPriceSnapshot('a', price);

    const history = getPriceHistory('a');

    expect(history).toHaveLength(10);
    expect(history.map((snapshot) => snapshot.price)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
