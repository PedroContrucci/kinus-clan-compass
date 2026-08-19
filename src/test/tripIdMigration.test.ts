import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { TRIPS_KEY, PRICE_HISTORY_PREFIX } from '@/lib/tripStore';
import { migrateLegacyTripIds, isUuidV4 } from '@/lib/tripIdMigration';

type RawTrip = Record<string, unknown>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Grava direto no storage — é exatamente o que existe no navegador de um beta tester. */
function seed(value: unknown): void {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(value));
}

function readRaw(): RawTrip[] {
  return JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]');
}

function historyKey(tripId: string): string {
  return `${PRICE_HISTORY_PREFIX}${tripId}`;
}

// A migração informa o que fez via console.info; sem o spy a saída da suíte vira lixo.
let info: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  info = vi.spyOn(console, 'info').mockImplementation(() => {});
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  info.mockRestore();
  warn.mockRestore();
});

describe('migrateLegacyTripIds', () => {
  it('converte ids legados (hífen e underscore) e preserva o resto do payload', () => {
    seed([
      { id: 'trip-1755000000000', destination: 'Lisboa', finances: { total: 10 }, days: [{}] },
      { id: 'trip_1755000000001', destination: 'Porto' },
    ]);

    const result = migrateLegacyTripIds();

    expect(result.migrated).toBe(2);

    const stored = readRaw();
    expect(stored).toHaveLength(2);
    stored.forEach((trip) => expect(trip.id as string).toMatch(UUID_V4));
    expect(stored[0].id).not.toBe(stored[1].id);

    // Um campo só é tocado: nada de normalização por baixo dos panos.
    expect(stored[0].destination).toBe('Lisboa');
    expect(stored[0].finances).toEqual({ total: 10 });
    expect(stored[0].days).toEqual([{}]);
    expect(stored[1].destination).toBe('Porto');
  });

  it('renomeia kinu_price_history_<antigo> para <novo>, com o conteúdo intacto', () => {
    const snapshots = [{ price: 100, timestamp: '2026-01-01T00:00:00.000Z' }];
    seed([{ id: 'trip-1755000000000' }]);
    localStorage.setItem(historyKey('trip-1755000000000'), JSON.stringify(snapshots));

    const { migrated, historiesRenamed } = migrateLegacyTripIds();
    const novoId = readRaw()[0].id as string;

    expect(migrated).toBe(1);
    expect(historiesRenamed).toBe(1);
    expect(localStorage.getItem(historyKey('trip-1755000000000'))).toBeNull();
    expect(JSON.parse(localStorage.getItem(historyKey(novoId)) as string)).toEqual(snapshots);
  });

  it('é idempotente: a segunda execução não acha id legado e não reescreve nada', () => {
    seed([{ id: 'trip-1755000000000', destination: 'Lisboa' }]);
    localStorage.setItem(historyKey('trip-1755000000000'), JSON.stringify([{ price: 1, timestamp: 'x' }]));

    const primeira = migrateLegacyTripIds();
    const depoisDaPrimeira = localStorage.getItem(TRIPS_KEY);
    const novoId = readRaw()[0].id as string;

    const segunda = migrateLegacyTripIds();

    expect(primeira.migrated).toBe(1);
    expect(segunda).toEqual({ migrated: 0, historiesRenamed: 0 });
    // Byte a byte: nem o id nem a ordem das chaves mudaram na segunda passada.
    expect(localStorage.getItem(TRIPS_KEY)).toBe(depoisDaPrimeira);
    expect(localStorage.getItem(historyKey(novoId))).not.toBeNull();
  });

  it('deixa intacta a viagem que já está em uuid v4', () => {
    const jaUuid = { id: '91868bba-23bc-472c-ad8b-1a664fd67f58', destination: 'Roma' };
    seed([jaUuid]);
    const antes = localStorage.getItem(TRIPS_KEY);

    const result = migrateLegacyTripIds();

    expect(result).toEqual({ migrated: 0, historiesRenamed: 0 });
    expect(localStorage.getItem(TRIPS_KEY)).toBe(antes);
    expect(readRaw()[0]).toEqual(jaUuid);
  });

  it('só migra a legada quando a lista é mista, e mantém a ordem', () => {
    seed([
      { id: '91868bba-23bc-472c-ad8b-1a664fd67f58', destination: 'Roma' },
      { id: 'trip-1755000000000', destination: 'Lisboa' },
    ]);

    const result = migrateLegacyTripIds();
    const stored = readRaw();

    expect(result.migrated).toBe(1);
    expect(stored[0].id).toBe('91868bba-23bc-472c-ad8b-1a664fd67f58');
    expect(stored[0].destination).toBe('Roma');
    expect(stored[1].id as string).toMatch(UUID_V4);
    expect(stored[1].destination).toBe('Lisboa');
  });

  it('dá uuid para viagem sem id, sem renomear histórico nenhum', () => {
    seed([{ destination: 'Lisboa' }]);

    const result = migrateLegacyTripIds();

    expect(result).toEqual({ migrated: 1, historiesRenamed: 0 });
    expect(readRaw()[0].id as string).toMatch(UUID_V4);
  });

  it('não escreve nada com storage vazio, corrompido ou não-array', () => {
    expect(migrateLegacyTripIds()).toEqual({ migrated: 0, historiesRenamed: 0 });
    expect(localStorage.getItem(TRIPS_KEY)).toBeNull();

    localStorage.setItem(TRIPS_KEY, '{ isso não é json');
    expect(migrateLegacyTripIds()).toEqual({ migrated: 0, historiesRenamed: 0 });
    expect(localStorage.getItem(TRIPS_KEY)).toBe('{ isso não é json');

    seed({ id: 'trip-1755000000000' });
    expect(migrateLegacyTripIds()).toEqual({ migrated: 0, historiesRenamed: 0 });
    expect(readRaw()).toEqual({ id: 'trip-1755000000000' } as unknown as RawTrip[]);
  });

  it('preserva entradas não-objeto dentro do array', () => {
    seed([null, 42, { id: 'trip-1755000000000' }]);

    const result = migrateLegacyTripIds();
    const stored = readRaw();

    expect(result.migrated).toBe(1);
    expect(stored[0]).toBeNull();
    expect(stored[1]).toBe(42);
    expect(stored[2].id as string).toMatch(UUID_V4);
  });
});

describe('isUuidV4', () => {
  it('aceita só uuid v4', () => {
    expect(isUuidV4('91868bba-23bc-472c-ad8b-1a664fd67f58')).toBe(true);
    expect(isUuidV4('trip-1755000000000')).toBe(false);
    expect(isUuidV4('trip_1755000000000')).toBe(false);
    // v1: o dígito de versão é 1, não 4.
    expect(isUuidV4('91868bba-23bc-172c-ad8b-1a664fd67f58')).toBe(false);
    expect(isUuidV4(undefined)).toBe(false);
    expect(isUuidV4(42)).toBe(false);
  });
});
