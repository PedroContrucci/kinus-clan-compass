/**
 * Testes da hidratação (Arco 4f) — a porta de volta, banco -> localStorage.
 *
 * O harness é CÓPIA do idioma do `tripSync.test.ts` (o `vi.hoisted` + `vi.mock` precisam morar
 * no arquivo que os usa), acrescido de um `select().eq().order()` encadeável e roteirizável.
 *
 * `session.ts`, `tripStore.ts`, `tripSync.ts` e `tripAdoption.ts` são os REAIS por cima do
 * GoTrue falso: o que se testa é a hidratação conversando com o espelho e a adoção de verdade,
 * não com dublês deles. Cobre os testes 6, 7 e 12 da matriz do recon §6.2.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SavedTrip } from '@/types/trip';

const db = vi.hoisted(() => {
  const OK = { data: null, error: null };

  interface SelectCall {
    table: string;
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    order: { column: string; options: unknown } | null;
  }

  const state = {
    // GoTrue
    callbacks: [] as Array<(event: string, session: unknown) => void>,
    session: null as unknown,
    // registro do que o app mandou
    upserts: [] as Array<{ table: string; rows: any[] }>,
    deletes: [] as Array<{ table: string; value: string }>,
    selects: [] as SelectCall[],
    // roteiro (null = responde OK / devolve `rows`)
    rows: [] as any[],
    selectResult: null as null | (() => Promise<any>),
    upsertResult: null as null | ((rows: any[]) => Promise<any>),
    deleteResult: null as null | ((id: string) => Promise<any>),
  };

  const kinuBeta = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        state.callbacks.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () => Promise.resolve({ data: { session: state.session } }),
    },
    from: (table: string) => ({
      upsert: (rows: any[]) => {
        state.upserts.push({ table, rows });
        return state.upsertResult ? state.upsertResult(rows) : Promise.resolve(OK);
      },
      insert: () => Promise.resolve(OK),
      delete: () => ({
        eq: (_column: string, value: string) => {
          state.deletes.push({ table, value });
          return state.deleteResult ? state.deleteResult(value) : Promise.resolve(OK);
        },
      }),
      select: (columns: string) => {
        const call: SelectCall = { table, columns, filters: [], order: null };
        state.selects.push(call);

        const builder = {
          eq: (column: string, value: unknown) => {
            call.filters.push({ column, value });
            return builder;
          },
          order: (column: string, options: unknown) => {
            call.order = { column, options };
            return state.selectResult
              ? state.selectResult()
              : Promise.resolve({ data: state.rows, error: null });
          },
        };

        return builder;
      },
    }),
  };

  return { state, kinuBeta, OK };
});

vi.mock('@/integrations/kinu-beta/client', () => ({ kinuBeta: db.kinuBeta }));

/** Ids em uuid v4 — a coluna `trips.id` não aceita outra coisa (Arco 4a). */
const uuid = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;
const A = uuid(1);
const B = uuid(2);
const C = uuid(3);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Fixture parcial de propósito: é o que existe no storage de produção hoje. */
function trip(id: string, extra: Record<string, unknown> = {}): SavedTrip {
  return { id, status: 'draft', destination: 'Rio de Janeiro', ...extra } as unknown as SavedTrip;
}

/** Uma linha como o PostgREST devolve. `created_at` não é selecionado: ele só ordena. */
function row(id: string, payload: unknown, schemaVersion = 1) {
  return { id, payload, schema_version: schemaVersion };
}

async function fresh(
  opts: {
    userId?: string | null;
    seed?: unknown[];
    outbox?: unknown[];
    owner?: unknown;
    rows?: any[];
    autoStart?: boolean;
  } = {},
) {
  vi.resetModules();
  localStorage.clear();

  db.state.callbacks = [];
  db.state.upserts = [];
  db.state.deletes = [];
  db.state.selects = [];
  db.state.rows = opts.rows ?? [];
  db.state.selectResult = null;
  db.state.upsertResult = null;
  db.state.deleteResult = null;

  const userId = opts.userId === undefined ? 'u-1' : opts.userId;
  db.state.session = userId ? { user: { id: userId } } : null;

  if (opts.seed) localStorage.setItem('kinu_trips', JSON.stringify(opts.seed));
  if (opts.outbox) localStorage.setItem('kinu_trips_outbox', JSON.stringify(opts.outbox));
  if (opts.owner !== undefined) localStorage.setItem('kinu_trips_owner', JSON.stringify(opts.owner));

  const store = await import('@/lib/tripStore');
  const session = await import('@/lib/session');
  const sync = await import('@/lib/tripSync');
  const adoption = await import('@/lib/tripAdoption');
  const hydration = await import('@/lib/tripHydration');

  if (opts.autoStart !== false) {
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick(); // o select da hidratação sai depois da resolução da sessão
  }

  return { store, session, sync, adoption, hydration };
}

const ids = (trips: Array<{ id?: string }>) => trips.map((t) => t.id);
const outboxRaw = (): any[] => JSON.parse(localStorage.getItem('kinu_trips_outbox') || '[]');

/** O dono deste navegador é `u-1` e ele já adotou — o estado normal pós-4e. */
const OWNED = { userId: 'u-1', adoptedAt: '2026-08-19T12:00:00.000Z' };

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tripHydration — a leitura', () => {
  it('1. hidratação feliz: o banco entra no localStorage, normalizado', async () => {
    const { store } = await fresh({
      owner: OWNED,
      rows: [row(A, trip(A, { destination: 'Lisboa' })), row(B, trip(B))],
    });

    const trips = store.listTrips();
    expect(ids(trips)).toEqual([A, B]);
    expect(trips[0].destination).toBe('Lisboa');
    expect(Array.isArray(trips[0].days) || trips[0].days === undefined).toBe(true);
  });

  it('2. a forma do select: eq(user_id) + order(created_at asc) — recon teste 12', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });

    expect(db.state.selects).toHaveLength(1);
    const call = db.state.selects[0];
    expect(call.table).toBe('trips');
    expect(call.columns).toBe('id, payload, schema_version');
    expect(call.filters).toEqual([{ column: 'user_id', value: 'u-1' }]);
    expect(call.order).toEqual({ column: 'created_at', options: { ascending: true } });
  });

  it('3. a ordem é a do banco, e é ela que decide a viagem ativa', async () => {
    const { store } = await fresh({
      seed: [trip(B), trip(A)], // ordem local invertida em relação ao banco
      owner: OWNED,
      rows: [row(A, trip(A)), row(B, trip(B))],
    });

    expect(ids(store.listTrips())).toEqual([A, B]);
    expect(store.getActiveTrip()?.id).toBe(B); // "a última da lista" — tripStore.ts:296
  });

  it('4. select falhou: o localStorage fica INTACTO — recon teste 7', async () => {
    const { store, hydration } = await fresh({ seed: [trip(A)], owner: OWNED, autoStart: false });

    db.state.selectResult = () =>
      Promise.resolve({ data: null, error: { code: 'PGRST301', message: 'jwt expired' } });

    const { session, sync, adoption } = await import('@/lib/session').then(async (s) => ({
      session: s,
      sync: await import('@/lib/tripSync'),
      adoption: await import('@/lib/tripAdoption'),
    }));
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick();

    expect(ids(store.listTrips())).toEqual([A]);
    const status = hydration.getHydrationStatus();
    expect(status.lastHydrationError?.code).toBe('PGRST301');
    expect(status.lastResult).toBeNull();
  });

  it('5. rede caída (promessa rejeitada): também não toca no storage', async () => {
    const { store, hydration } = await fresh({ autoStart: false, seed: [trip(A)], owner: OWNED });

    db.state.selectResult = () => Promise.reject(new Error('Failed to fetch'));

    const session = await import('@/lib/session');
    const sync = await import('@/lib/tripSync');
    const adoption = await import('@/lib/tripAdoption');
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick();

    expect(ids(store.listTrips())).toEqual([A]);
    expect(hydration.getHydrationStatus().lastHydrationError?.message).toContain('Failed to fetch');
  });
});

describe('tripHydration — o gate (quem tem direito de hidratar)', () => {
  it('6. sem sessão: zero chamadas ao banco', async () => {
    const { store, hydration } = await fresh({
      userId: null,
      seed: [trip(A)],
      owner: OWNED,
      rows: [row(B, trip(B))],
    });

    expect(db.state.selects).toHaveLength(0);
    expect(ids(store.listTrips())).toEqual([A]);
    expect(hydration.getHydrationStatus().lastSkip).toBe('sem-sessao');
  });

  it('7. marcador ausente: não hidrata — quem decide é o diálogo da 4e', async () => {
    const { store, hydration, adoption } = await fresh({
      seed: [trip(A)],
      rows: [row(B, trip(B))],
    });

    expect(db.state.selects).toHaveLength(0);
    expect(ids(store.listTrips())).toEqual([A]);
    expect(hydration.getHydrationStatus().lastSkip).toBe('sem-decisao');
    expect(adoption.getAdoptionPrompt()?.tripIds).toEqual([A]); // a 4e perguntou, como sempre
  });

  it('8. recusa gravada: NUNCA hidrata, nem para outro usuário', async () => {
    const { store, hydration } = await fresh({
      seed: [trip(A)],
      owner: { userId: null, adoptedAt: null },
      rows: [row(B, trip(B))],
    });

    expect(db.state.selects).toHaveLength(0);
    expect(ids(store.listTrips())).toEqual([A]);
    expect(hydration.getHydrationStatus().lastSkip).toBe('recusa');
  });
});

describe('tripHydration — o que o banco não pode tocar', () => {
  it('9. upsert pendente: a versão LOCAL vence a do banco', async () => {
    const { store } = await fresh({
      autoStart: false,
      seed: [trip(A, { destination: 'Lisboa' })],
      outbox: [{ op: 'upsert', id: A, seq: 1, uid: 'u-1' }],
      owner: OWNED,
      rows: [row(A, trip(A, { destination: 'Rio de Janeiro' }))],
    });

    // O flush falha de propósito: a escrita local continua sem ter chegado ao banco, que é
    // exatamente o estado que a proteção existe para cobrir.
    db.state.upsertResult = () => Promise.reject(new Error('offline'));

    const session = await import('@/lib/session');
    const sync = await import('@/lib/tripSync');
    const adoption = await import('@/lib/tripAdoption');
    const hydration = await import('@/lib/tripHydration');
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick();

    expect(store.getTrip(A)?.destination).toBe('Lisboa');
    expect(outboxRaw()).toHaveLength(1); // continua devendo ao banco
  });

  it('10. delete pendente: a linha do banco NÃO volta', async () => {
    const { store } = await fresh({
      autoStart: false,
      seed: [],
      outbox: [{ op: 'delete', id: A, seq: 1, uid: 'u-1' }],
      owner: OWNED,
      rows: [row(A, trip(A))],
    });

    db.state.deleteResult = () => Promise.reject(new Error('offline'));

    const session = await import('@/lib/session');
    const sync = await import('@/lib/tripSync');
    const adoption = await import('@/lib/tripAdoption');
    const hydration = await import('@/lib/tripHydration');
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick();

    expect(store.listTrips()).toHaveLength(0); // a viagem apagada não ressuscitou
  });

  it('11. entrada blocked protege igual a pendente', async () => {
    const { store } = await fresh({
      seed: [trip(A, { destination: 'Lisboa' })],
      outbox: [{ op: 'upsert', id: A, seq: 1, uid: 'u-1', blocked: true }],
      owner: OWNED,
      rows: [row(A, trip(A, { destination: 'Rio de Janeiro' }))],
    });

    expect(store.getTrip(A)?.destination).toBe('Lisboa');
  });

  it('12. schema_version futuro: ignorada com aviso, cópia local preservada', async () => {
    const { store, hydration } = await fresh({
      seed: [trip(A, { destination: 'Lisboa' })],
      owner: OWNED,
      rows: [row(A, trip(A, { destination: 'do futuro' }), 2), row(B, trip(B))],
    });

    expect(store.getTrip(A)?.destination).toBe('Lisboa'); // não foi sobrescrita
    expect(store.getTrip(B)).not.toBeNull(); // nem bloqueou o resto
    expect(hydration.getHydrationStatus().lastResult?.ignored).toEqual([A]);
  });

  it('13. payload torto no banco: a linha é ignorada e o resto hidrata', async () => {
    const { store, hydration } = await fresh({
      owner: OWNED,
      rows: [row(A, null), row(B, trip(B))],
    });

    expect(ids(store.listTrips())).toEqual([B]);
    expect(hydration.getHydrationStatus().lastResult?.ignored).toEqual([A]);
  });
});

describe('tripHydration — banco vence', () => {
  it('14. viagem só no local, sem outbox: removida, com o histórico de preços junto', async () => {
    localStorage.setItem(`kinu_price_history_${A}`, JSON.stringify([{ price: 1, timestamp: 'x' }]));

    const { store, hydration } = await fresh({
      seed: [trip(A), trip(B)],
      owner: OWNED,
      rows: [row(B, trip(B))],
    });

    expect(ids(store.listTrips())).toEqual([B]);
    expect(localStorage.getItem(`kinu_price_history_${A}`)).toBeNull();
    expect(hydration.getHydrationStatus().lastResult?.removed).toBe(1);
  });

  it('15. hidratar não enfileira NADA: sem eco banco -> local -> banco', async () => {
    const { sync } = await fresh({
      owner: OWNED,
      rows: [row(A, trip(A)), row(B, trip(B))],
    });

    await tick();
    expect(db.state.upserts).toHaveLength(0);
    expect(db.state.deletes).toHaveLength(0);
    expect(sync.getOutboxLength()).toBe(0);
  });

  it('16. hidratar duas vezes: a segunda não grava e não toca o sino', async () => {
    const { store, hydration } = await fresh({
      owner: OWNED,
      rows: [row(A, trip(A)), row(B, trip(B))],
    });

    let rings = 0;
    store.subscribeTrips(() => {
      rings += 1;
    });

    const again = await hydration.hydrateNow();

    expect(again.result?.changed).toBe(false);
    expect(rings).toBe(0);
    expect(ids(store.listTrips())).toEqual([A, B]);
  });
});

describe('tripHydration — a adoção (4e) e a troca de dono', () => {
  it('17. aceite: as recém-adotadas sobrevivem à hidratação imediata, com o banco ainda vazio', async () => {
    // A sequência exata do risco: `acceptAdoption()` enfileira A e B, dispara o flush E o
    // gatilho da hidratação no mesmo instante. O `select` sai antes de os upserts chegarem, então
    // ele volta com o banco VAZIO — e o flush já drenou a fila. Sem a leitura do outbox nos dois
    // lados do voo, "banco vence" apagaria as duas viagens no segundo seguinte ao "sim".
    const { store, adoption, hydration } = await fresh({
      seed: [trip(A), trip(B)],
      rows: [], // conta nova: o banco ainda não tem nada
    });

    expect(adoption.getAdoptionPrompt()?.tripIds).toEqual([A, B]);

    // O SELECT DEMORA MAIS QUE O UPSERT — a ponta perigosa da corrida, roteirizada. Sem isto o
    // fake responde tão rápido que o outbox ainda está cheio quando a fusão acontece, e o teste
    // passaria mesmo com a proteção quebrada.
    db.state.selectResult = async () => {
      await tick();
      await tick();
      return { data: [], error: null };
    };

    adoption.acceptAdoption();
    await tick();
    await tick();
    await tick();
    await tick();

    // A fila JÁ drenou quando a resposta chegou: a proteção que salvou as duas viagens é a
    // leitura do outbox feita ANTES do request.
    expect(outboxRaw()).toHaveLength(0);
    expect(ids(store.listTrips())).toEqual([A, B]); // nada sumiu
    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].rows.map((r: any) => r.id)).toEqual([A, B]);
    expect(hydration.getHydrationStatus().lastResult?.keptLocal).toBe(2);
  });

  it('18. recusa: o gatilho da adoção roda e o gate barra na hora', async () => {
    const { store, adoption, hydration } = await fresh({ seed: [trip(A)], rows: [row(B, trip(B))] });

    adoption.declineAdoption();
    await tick();

    expect(db.state.selects).toHaveLength(0);
    expect(ids(store.listTrips())).toEqual([A]);
    expect(hydration.getHydrationStatus().lastSkip).toBe('recusa');
  });

  it('19. dono diferente: limpa o passado alheio, grava o novo dono e hidrata', async () => {
    const { store, adoption, hydration } = await fresh({
      seed: [trip(A)], // viagem do u-2, que já é dona deste navegador
      owner: { userId: 'u-2', adoptedAt: '2026-08-01T10:00:00.000Z' },
      outbox: [
        { op: 'upsert', id: A, seq: 1, uid: 'u-2' },
        { op: 'delete', id: C, seq: 2, uid: 'u-2' },
      ],
      rows: [row(B, trip(B))], // o banco do u-1
    });

    expect(ids(store.listTrips())).toEqual([B]);
    expect(adoption.getTripsOwner()).toEqual({ userId: 'u-1', adoptedAt: null });
    expect(hydration.getHydrationStatus().lastResult?.takeover).toBe(true);

    // O upsert órfão do dono anterior sai (sem payload local, não teria o que enviar); o delete
    // dele FICA, porque continua executável e perdê-lo ressuscitaria a viagem na conta dele.
    expect(outboxRaw().map((e) => `${e.op}:${e.id}`)).toEqual([`delete:${C}`]);
  });

  it('20. troca de dono com o select falhando: nada é gravado, nem o marcador', async () => {
    const { store, adoption, hydration } = await fresh({
      autoStart: false,
      seed: [trip(A)],
      owner: { userId: 'u-2', adoptedAt: '2026-08-01T10:00:00.000Z' },
    });

    db.state.selectResult = () =>
      Promise.resolve({ data: null, error: { code: '08006', message: 'connection failure' } });

    const session = await import('@/lib/session');
    const sync = await import('@/lib/tripSync');
    session.startSession();
    sync.startTripSync();
    adoption.startTripAdoption();
    hydration.startTripHydration();
    await tick();
    await tick();

    expect(ids(store.listTrips())).toEqual([A]);
    expect(adoption.getTripsOwner()?.userId).toBe('u-2'); // o marcador não mudou
    expect(hydration.getHydrationStatus().lastHydrationError?.code).toBe('08006');
  });
});

describe('tripHydration — a comparação do painel (§7.3)', () => {
  it('21. compara os dois lados sem gravar nada', async () => {
    const { store, hydration } = await fresh({
      owner: OWNED,
      rows: [row(A, trip(A)), row(B, trip(B))],
    });

    // Diverge o local de propósito, sem deixar o espelho enfileirar (ele enfileira, mas o que
    // importa aqui é o retrato).
    store.updateTrip(A, (t) => ({ ...t, destination: 'Lisboa' }));
    db.state.rows = [row(A, trip(A)), row(B, trip(B)), row(C, trip(C))];
    await tick();

    const before = localStorage.getItem('kinu_trips');
    const diff = await hydration.compareWithDatabase();

    expect(diff.ok).toBe(true);
    expect(diff.divergent).toEqual([A]);
    expect(diff.onlyRemote).toEqual([C]);
    expect(diff.onlyLocal).toEqual([]);
    expect(diff.orderMatches).toBe(true);
    expect(localStorage.getItem('kinu_trips')).toBe(before); // leitura pura
  });

  it('22. sem sessão a comparação diz por quê, em vez de fingir verde', async () => {
    const { hydration } = await fresh({ userId: null, owner: OWNED });

    const diff = await hydration.compareWithDatabase();

    expect(diff.ok).toBe(false);
    expect(diff.error?.message).toContain('sem sessão');
  });
});

/**
 * O gatilho de retorno de aba (Arco 4g).
 *
 * DUAS FERRAMENTAS NOVAS, e as duas existem por um motivo específico:
 *
 * 1. `vi.useFakeTimers({ toFake: ['Date'] })` — SÓ `Date`. O `tick()` do harness depende de um
 *    `setTimeout` real, e falsificar os timers inteiros travaria o arquivo. O relógio do debounce
 *    é `Date.now()`, então falsificar `Date` basta.
 *
 * 2. O dublê de `document.addEventListener`, que REGISTRA e ENGOLE em vez de deixar passar. Sem
 *    ele os testes contariam errado: `vi.resetModules()` cria uma instância nova do módulo a cada
 *    `fresh()`, mas as instâncias ANTERIORES continuam vivas — o listener delas ficou no mesmo
 *    `document` e não há `stopTripHydration()` para removê-lo. Um `dispatchEvent` de verdade
 *    acordaria a hidratação de todos os testes já rodados, cada uma somando `select` ao mesmo
 *    `db.state`. Capturando os handlers desta rodada e chamando só eles, o que se mede é a
 *    instância sob teste. O handler do `tripSync` entra na captura junto, de propósito: é o
 *    cenário real dos dois no mesmo evento.
 */
describe('tripHydration — o retorno de aba (4g)', () => {
  const T0 = new Date('2026-08-26T12:00:00.000Z').getTime();
  const at = (ms: number) => vi.setSystemTime(new Date(T0 + ms));

  let handlers: EventListener[] = [];

  const setVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    const event = new Event('visibilitychange');
    handlers.forEach((handler) => handler(event));
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    at(0);

    handlers = [];
    vi.spyOn(document, 'addEventListener').mockImplementation(((type: string, handler: unknown) => {
      if (type === 'visibilitychange' && typeof handler === 'function') {
        handlers.push(handler as EventListener);
      }
    }) as typeof document.addEventListener);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('23. aba volta a ficar visível: hidrata', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });
    expect(db.state.selects).toHaveLength(1); // o do boot

    at(61_000);
    setVisibility('visible');
    await tick();

    expect(db.state.selects).toHaveLength(2);
  });

  it('24. segundo retorno dentro de 60s: não hidrata', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });

    at(61_000);
    setVisibility('visible');
    await tick();
    expect(db.state.selects).toHaveLength(2);

    at(91_000); // 30s depois do anterior
    setVisibility('visible');
    await tick();

    expect(db.state.selects).toHaveLength(2); // o piso mordeu
  });

  it('25. passados 60s, o retorno hidrata de novo', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });

    at(61_000);
    setVisibility('visible');
    await tick();

    at(122_000); // 61s depois do anterior
    setVisibility('visible');
    await tick();

    // Sem este teste, o 24 passaria com o gatilho nunca registrado — o modo de falha mais fácil
    // de não perceber. Os dois andam juntos.
    expect(db.state.selects).toHaveLength(3);
  });

  it('26. visibilitychange para hidden: não hidrata', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });

    at(61_000);
    setVisibility('hidden');
    await tick();

    expect(db.state.selects).toHaveLength(1); // só o do boot
  });

  it('27. o gatilho novo respeita o gate: recusa continua sem hidratar', async () => {
    const { hydration } = await fresh({
      seed: [trip(A)],
      owner: { userId: null, adoptedAt: null },
      rows: [row(B, trip(B))],
    });

    at(61_000);
    setVisibility('visible');
    await tick();

    expect(db.state.selects).toHaveLength(0);
    expect(hydration.getHydrationStatus().lastSkip).toBe('recusa');
  });

  it('28. o boot semeia o relógio: ir e voltar na hora não hidrata de novo', async () => {
    await fresh({ owner: OWNED, rows: [row(A, trip(A))] });

    at(5_000);
    setVisibility('hidden');
    setVisibility('visible');
    await tick();

    expect(db.state.selects).toHaveLength(1);
  });
});
