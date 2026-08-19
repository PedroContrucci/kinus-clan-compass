/**
 * Testes do espelho de escrita (Arco 4c).
 *
 * Dois motivos para o `vi.mock` do cliente (recon §6.2): `client.ts:36` roda `createClient`
 * NO IMPORT e lança sem as `VITE_KINU_BETA_*` — sem `.env` (CI) a suíte morreria antes do
 * primeiro `it`; e é o mock que permite roteirizar respostas do PostgREST sem rede.
 *
 * O `session.ts` é o REAL, por cima do GoTrue falso: o par 4b+4c é exercitado de verdade.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SavedTrip } from '@/types/trip';

const db = vi.hoisted(() => {
  const OK = { data: null, error: null };

  const state = {
    // GoTrue
    callbacks: [] as Array<(event: string, session: unknown) => void>,
    session: null as unknown,
    // registro do que o espelho mandou
    upserts: [] as Array<{ table: string; rows: any[]; options: unknown }>,
    deletes: [] as Array<{ table: string; column: string; value: string }>,
    inserts: [] as Array<{ table: string; values: any }>,
    // roteiro (null = responde OK)
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
      upsert: (rows: any[], options: unknown) => {
        state.upserts.push({ table, rows, options });
        return state.upsertResult ? state.upsertResult(rows) : Promise.resolve(OK);
      },
      insert: (values: any) => {
        state.inserts.push({ table, values });
        return Promise.resolve(OK);
      },
      delete: () => ({
        eq: (column: string, value: string) => {
          state.deletes.push({ table, column, value });
          return state.deleteResult ? state.deleteResult(value) : Promise.resolve(OK);
        },
      }),
    }),
  };

  return { state, kinuBeta, OK };
});

vi.mock('@/integrations/kinu-beta/client', () => ({ kinuBeta: db.kinuBeta }));

/** Ids em uuid v4 — a coluna `trips.id` não aceita outra coisa (Arco 4a). */
const uuid = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;
const A = uuid(1);
const B = uuid(2);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Fixture parcial de propósito: é o que existe no storage de produção hoje. */
function trip(id: string, extra: Record<string, unknown> = {}): SavedTrip {
  return { id, status: 'draft', destination: 'Rio de Janeiro', ...extra } as unknown as SavedTrip;
}

async function boot(mods: { session: any; sync: any }) {
  mods.session.startSession();
  mods.sync.startTripSync();
  await tick(); // deixa o getSession resolver
}

async function fresh(
  opts: {
    userId?: string | null;
    seed?: unknown[];
    outbox?: unknown[];
    log?: unknown[];
    autoStart?: boolean;
  } = {},
) {
  vi.resetModules();
  localStorage.clear();

  db.state.callbacks = [];
  db.state.upserts = [];
  db.state.deletes = [];
  db.state.inserts = [];
  db.state.upsertResult = null;
  db.state.deleteResult = null;

  const userId = opts.userId === undefined ? 'u-1' : opts.userId;
  db.state.session = userId ? { user: { id: userId } } : null;

  if (opts.seed) localStorage.setItem('kinu_trips', JSON.stringify(opts.seed));
  if (opts.outbox) localStorage.setItem('kinu_trips_outbox', JSON.stringify(opts.outbox));
  if (opts.log) localStorage.setItem('kinu_sync_log', JSON.stringify(opts.log));

  const store = await import('@/lib/tripStore');
  const session = await import('@/lib/session');
  const sync = await import('@/lib/tripSync');

  const mods = { store, session, sync };
  if (opts.autoStart !== false) await boot(mods);

  return mods;
}

function fireAuthEvent(event: string, session: unknown) {
  db.state.callbacks.forEach((cb) => cb(event, session));
}

function rawOutbox(): any[] {
  return JSON.parse(localStorage.getItem('kinu_trips_outbox') || '[]');
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tripSync — o guard da sessão', () => {
  it('1. sem sessão: nenhuma chamada ao banco, e a escrita local funciona igual', async () => {
    const { store, sync } = await fresh({ userId: null });

    store.addTrip(trip(A));
    await tick();

    expect(db.state.upserts).toHaveLength(0);
    expect(db.state.deletes).toHaveLength(0);
    expect(sync.getOutboxLength()).toBe(0);
    expect(store.listTrips()).toHaveLength(1);
  });
});

describe('tripSync — espelho das quatro escritas', () => {
  it('2. addTrip sobe uma linha e esvazia o outbox', async () => {
    const { store, sync } = await fresh();

    store.addTrip(trip(A));
    await tick();

    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].table).toBe('trips');
    expect(db.state.upserts[0].options).toEqual({ onConflict: 'id' });
    expect(db.state.upserts[0].rows.map((row: any) => row.id)).toEqual([A]);
    expect(sync.getOutboxLength()).toBe(0);
  });

  it('3. updateTrip sobe o payload novo', async () => {
    const { store } = await fresh();

    store.addTrip(trip(A, { destination: 'Rio de Janeiro' }));
    await tick();
    store.updateTrip(A, (t) => ({ ...t, destination: 'Lisboa' }));
    await tick();

    expect(db.state.upserts).toHaveLength(2);
    expect(db.state.upserts[1].rows[0].payload.destination).toBe('Lisboa');
  });

  it('4. deleteTrip vira .delete().eq(id)', async () => {
    const { store } = await fresh();

    store.addTrip(trip(A));
    await tick();
    store.deleteTrip(A);
    await tick();

    expect(db.state.deletes).toEqual([{ table: 'trips', column: 'id', value: A }]);
  });

  it('5. clearTrips apaga todas as conhecidas', async () => {
    const { store, sync } = await fresh();

    store.addTrip(trip(A));
    store.addTrip(trip(B));
    await tick();
    store.clearTrips();
    await tick();

    expect(db.state.deletes.map((d) => d.value).sort()).toEqual([A, B]);
    expect(sync.getOutboxLength()).toBe(0);
  });
});

describe('tripSync — a forma da linha (risco 4)', () => {
  it('6. exatamente {id, user_id, payload, schema_version}; status vai por dentro', async () => {
    const { store } = await fresh();

    store.addTrip(
      trip(A, { status: 'draft', destination: 'Rio de Janeiro', createdAt: '2026-01-01' }),
    );
    await tick();

    const row = db.state.upserts[0].rows[0];
    expect(Object.keys(row).sort()).toEqual(['id', 'payload', 'schema_version', 'user_id']);
    expect(row.user_id).toBe('u-1');
    expect(row.schema_version).toBe(1);
    expect(row).not.toHaveProperty('status');
    expect(row).not.toHaveProperty('destination');
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('updated_at');
    // as colunas geradas leem daqui:
    expect(row.payload.status).toBe('draft');
    expect(row.payload.destination).toBe('Rio de Janeiro');
  });
});

describe('tripSync — erros', () => {
  it('7. rede caída: fica no outbox e o próximo flush reenvia', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () => Promise.reject(new Error('Failed to fetch'));
    store.addTrip(trip(A));
    await tick();

    expect(db.state.upserts).toHaveLength(1);
    expect(sync.getOutboxLength()).toBe(1);
    expect(sync.getLastFlushError()?.message).toContain('Failed to fetch');

    db.state.upsertResult = null;
    await sync.flush();

    expect(db.state.upserts).toHaveLength(2);
    expect(sync.getOutboxLength()).toBe(0);
    expect(sync.getLastFlushError()).toBeNull();
  });

  it('8. 42501: marca a entrada e não entra em loop', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () =>
      Promise.resolve({ data: null, error: { code: '42501', message: 'row-level security' } });
    store.addTrip(trip(A));
    await tick();

    expect(db.state.upserts).toHaveLength(1);
    expect(rawOutbox()).toEqual([
      { op: 'upsert', id: A, seq: 1, uid: 'u-1', blocked: true },
    ]);
    expect(sync.getLastFlushError()?.code).toBe('42501');

    await sync.flush();
    await sync.flush();

    expect(db.state.upserts).toHaveLength(1); // nenhuma tentativa nova
    expect(sync.getOutboxLength()).toBe(1);
  });

  it('13. 23503: insere o perfil uma vez e repete o upsert', async () => {
    const { store, sync } = await fresh();

    let attempt = 0;
    db.state.upsertResult = () => {
      attempt += 1;
      return Promise.resolve(
        attempt === 1
          ? { data: null, error: { code: '23503', message: 'violates foreign key' } }
          : db.OK,
      );
    };

    store.addTrip(trip(A));
    await tick();

    expect(db.state.inserts).toEqual([
      { table: 'profiles', values: { id: 'u-1', name: null } },
    ]);
    expect(db.state.upserts).toHaveLength(2);
    expect(sync.getOutboxLength()).toBe(0);
  });
});

describe('tripSync — o outbox', () => {
  it('9. op mais recente por id vence, nos dois sentidos', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () => Promise.reject(new Error('offline'));
    db.state.deleteResult = () => Promise.reject(new Error('offline'));

    store.addTrip(trip(A));
    await tick();
    store.deleteTrip(A);
    await tick();

    expect(rawOutbox()).toHaveLength(1);
    expect(rawOutbox()[0].op).toBe('delete');
    expect(rawOutbox()[0].id).toBe(A);

    store.addTrip(trip(A));
    await tick();

    expect(rawOutbox()).toHaveLength(1);
    expect(rawOutbox()[0].op).toBe('upsert');
    expect(sync.getOutboxLength()).toBe(1);
  });

  it('10. dois flushes concorrentes: só um roda', async () => {
    const { store, sync } = await fresh();

    let release: (value: unknown) => void = () => {};
    db.state.upsertResult = () => new Promise((resolve) => { release = resolve; });

    store.addTrip(trip(A));
    await tick();
    expect(db.state.upserts).toHaveLength(1);

    await sync.flush(); // encontra o inFlight e sai
    expect(db.state.upserts).toHaveLength(1);

    release(db.OK);
    await tick();
    expect(sync.getOutboxLength()).toBe(0);
  });

  it('11. lote de 7 vira 5 + 2', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () => Promise.reject(new Error('offline'));
    for (let i = 1; i <= 7; i += 1) {
      store.addTrip(trip(uuid(i)));
      await tick();
    }
    expect(sync.getOutboxLength()).toBe(7);

    db.state.upsertResult = null;
    db.state.upserts = [];
    await sync.flush();

    expect(db.state.upserts.map((call) => call.rows.length)).toEqual([5, 2]);
    expect(sync.getOutboxLength()).toBe(0);
  });

  it('12. logout no meio do flush: para de enviar e preserva o outbox', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () => Promise.reject(new Error('offline'));
    for (let i = 1; i <= 7; i += 1) {
      store.addTrip(trip(uuid(i)));
      await tick();
    }

    db.state.upserts = [];
    db.state.upsertResult = () => {
      fireAuthEvent('SIGNED_OUT', null); // a sessão cai enquanto o 1º lote está no ar
      return Promise.resolve(db.OK);
    };

    await sync.flush();

    expect(db.state.upserts).toHaveLength(1);
    expect(sync.getOutboxLength()).toBe(2);

    await sync.flush(); // sem sessão: no-op
    expect(db.state.upserts).toHaveLength(1);
    expect(sync.getOutboxLength()).toBe(2);
  });

  it('15. escrita durante o voo não é engolida pela resposta do lote antigo', async () => {
    const { store, sync } = await fresh();

    let calls = 0;
    let release: (value: unknown) => void = () => {};
    db.state.upsertResult = () => {
      calls += 1;
      return calls === 1
        ? new Promise((resolve) => { release = resolve; })
        : Promise.resolve(db.OK);
    };

    store.addTrip(trip(A, { destination: 'Rio de Janeiro' }));
    await tick();

    store.updateTrip(A, (t) => ({ ...t, destination: 'Lisboa' })); // reenfileira com seq novo
    expect(sync.getOutboxLength()).toBe(1);

    release(db.OK);
    await tick();

    expect(db.state.upserts).toHaveLength(2);
    expect(db.state.upserts[1].rows[0].payload.destination).toBe('Lisboa');
    expect(sync.getOutboxLength()).toBe(0);
  });

  it('17. op de outro dono não é drenada sob a sessão de quem está logado', async () => {
    const { sync } = await fresh({
      seed: [
        { id: A, status: 'draft', destination: 'Rio de Janeiro' },
        { id: B, status: 'draft', destination: 'Lisboa' },
      ],
      outbox: [
        { op: 'upsert', id: A, seq: 1, uid: 'u-1' },
        { op: 'upsert', id: B, seq: 2, uid: 'u-2' },
      ],
    });

    // O flush do boot (sessão obtida) drenou só o que é de u-1.
    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].rows.map((row: any) => row.id)).toEqual([A]);

    expect(rawOutbox()).toEqual([{ op: 'upsert', id: B, seq: 2, uid: 'u-2' }]);
    expect(sync.getOutboxLength()).toBe(1);
  });
});

describe('tripSync — boot', () => {
  it('14. o snapshot inicial NÃO adota o que já estava no navegador', async () => {
    const { store, sync } = await fresh({
      seed: [
        { id: A, status: 'draft', destination: 'Rio de Janeiro' },
        { id: B, status: 'active', destination: 'Lisboa' },
      ],
    });

    expect(store.listTrips()).toHaveLength(2);
    expect(db.state.upserts).toHaveLength(0);
    expect(db.state.deletes).toHaveLength(0);
    expect(sync.getOutboxLength()).toBe(0);

    store.updateTrip(A, (t) => ({ ...t, destination: 'Salvador' }));
    await tick();

    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].rows.map((row: any) => row.id)).toEqual([A]);
  });

  it('16. registra os gatilhos de DOM e é idempotente', async () => {
    const { session, sync } = await fresh({ autoStart: false });

    const onWindow = vi.spyOn(window, 'addEventListener');
    const onDocument = vi.spyOn(document, 'addEventListener');

    session.startSession();
    sync.startTripSync();
    await tick();

    expect(onWindow.mock.calls.map((call) => call[0])).toContain('online');
    expect(onDocument.mock.calls.map((call) => call[0])).toContain('visibilitychange');

    const windowCalls = onWindow.mock.calls.length;
    const documentCalls = onDocument.mock.calls.length;

    sync.startTripSync(); // 2ª chamada: no-op

    expect(onWindow.mock.calls.length).toBe(windowCalls);
    expect(onDocument.mock.calls.length).toBe(documentCalls);
  });
});

describe('tripSync — observabilidade (Arco 4d)', () => {
  it('18. tentativa bem-sucedida entra no log como ok', async () => {
    const { store, sync } = await fresh();

    store.addTrip(trip(A));
    await tick();

    const log = sync.getSyncLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ op: 'upsert', id: A, ok: true });
    expect(log[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(log[0]).not.toHaveProperty('code');

    const status = sync.getSyncStatus();
    expect(status.lastFlushAt).toBe(log[0].ts);
    expect(status.errors24h).toBe(0);
    expect(status.outbox).toMatchObject({ pending: 0, blocked: 0, foreignOwner: 0 });
  });

  it('19. tentativa falha entra no log com o código', async () => {
    const { store, sync } = await fresh();

    db.state.upsertResult = () =>
      Promise.resolve({ data: null, error: { code: '42501', message: 'row-level security' } });

    store.addTrip(trip(A));
    await tick();

    const log = sync.getSyncLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ op: 'upsert', id: A, ok: false, code: '42501' });
    expect(sync.getSyncStatus().errors24h).toBe(1);
  });

  it('20. o anel para em 50: o 51º descarta o mais antigo', async () => {
    const seeded = Array.from({ length: 50 }, (_, i) => ({
      ts: `2026-08-19T00:00:${String(i).padStart(2, '0')}.000Z`,
      op: 'upsert' as const,
      id: uuid(9),
      ok: true,
    }));

    const { store, sync } = await fresh({ log: seeded });

    store.addTrip(trip(A));
    await tick();

    const log = sync.getSyncLog();
    expect(log).toHaveLength(50);
    expect(log[0].ts).toBe(seeded[1].ts); // o primeiro semeado saiu pela frente
    expect(log[49]).toMatchObject({ id: A, ok: true }); // o novo entrou pelo fim
  });

  it('21. getSyncStatus separa pendente, blocked e outro dono', async () => {
    const C = uuid(3);
    const mods = await fresh({
      seed: [
        { id: A, status: 'draft', destination: 'Rio de Janeiro' },
        { id: B, status: 'draft', destination: 'Lisboa' },
        { id: C, status: 'draft', destination: 'Salvador' },
      ],
      outbox: [
        { op: 'upsert', id: A, seq: 1, uid: 'u-1' },
        { op: 'upsert', id: B, seq: 2, uid: 'u-1', blocked: true },
        { op: 'delete', id: C, seq: 3, uid: 'u-2' },
      ],
      autoStart: false,
    });

    // offline: o flush do boot tenta o pendente e não o drena, então os três casos coexistem
    db.state.upsertResult = () => Promise.reject(new Error('offline'));
    await boot(mods);

    const status = mods.sync.getSyncStatus();
    expect(status.ownerUserId).toBe('u-1');
    expect(status.sessionResolved).toBe(true);
    expect(status.outbox.pending).toBe(1);
    expect(status.outbox.blocked).toBe(1);
    expect(status.outbox.foreignOwner).toBe(1);
    expect(status.outbox.ids).toEqual({ pending: [A], blocked: [B], foreignOwner: [C] });

    // a invariante: os três casos somam o outbox inteiro, sem sobra nem dupla contagem
    const { pending, blocked, foreignOwner } = status.outbox;
    expect(pending + blocked + foreignOwner).toBe(mods.sync.getOutboxLength());
  });

  it('22. errors24h conta só erro das últimas 24h', async () => {
    const now = Date.now();
    const h = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
    const recent = h(2);

    const { sync } = await fresh({
      log: [
        { ts: h(30), op: 'upsert', id: A, ok: false, code: '42501' }, // velho: fora
        { ts: 'não é data', op: 'upsert', id: A, ok: false, code: 'x' }, // ilegível: fora
        { ts: recent, op: 'upsert', id: A, ok: false, code: null }, // conta
        { ts: recent, op: 'delete', id: B, ok: true }, // sucesso: não é erro
      ],
      autoStart: false,
    });

    const status = sync.getSyncStatus();
    expect(status.errors24h).toBe(1);
    // sem flush nesta sessão, o `lastFlushAt` vem do anel gravado (aba recarregada)
    expect(status.lastFlushAt).toBe(recent);
  });
});
