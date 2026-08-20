/**
 * Testes da adoção consentida (Arco 4e).
 *
 * O harness é o mesmo idioma do `tripSync.test.ts` — e é uma CÓPIA, não um import: o
 * `vi.hoisted` + `vi.mock` do cliente precisam morar no arquivo que os usa (o hoisting do
 * vitest sobe as duas chamadas para antes de qualquer import, então um helper compartilhado
 * chegaria tarde demais). O `client.ts:36` roda `createClient` no import e lança sem as
 * `VITE_KINU_BETA_*`; sem o mock, a suíte morreria antes do primeiro `it` num CI sem `.env`.
 *
 * `session.ts`, `tripStore.ts` e `tripSync.ts` são os REAIS por cima do GoTrue falso: o que
 * se testa aqui é a adoção conversando com o espelho de verdade, não com um dublê dele.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SavedTrip } from '@/types/trip';

const db = vi.hoisted(() => {
  const OK = { data: null, error: null };

  const state = {
    callbacks: [] as Array<(event: string, session: unknown) => void>,
    session: null as unknown,
    upserts: [] as Array<{ table: string; rows: any[]; options: unknown }>,
    deletes: [] as Array<{ table: string; column: string; value: string }>,
    inserts: [] as Array<{ table: string; values: any }>,
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
const C = uuid(3);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function trip(id: string, extra: Record<string, unknown> = {}): SavedTrip {
  return { id, status: 'draft', destination: 'Rio de Janeiro', ...extra } as unknown as SavedTrip;
}

type Mods = {
  store: typeof import('@/lib/tripStore');
  session: typeof import('@/lib/session');
  sync: typeof import('@/lib/tripSync');
  adoption: typeof import('@/lib/tripAdoption');
};

/**
 * O boot do `App.tsx`, na mesma ordem: sessão, espelho, adoção. Separado do `fresh()` porque
 * vários testes precisam assinar o pedido de consentimento ANTES de a sessão resolver — é o
 * caso real (o módulo liga no escopo do módulo, o React monta depois).
 */
async function boot(mods: Mods) {
  mods.session.startSession();
  mods.sync.startTripSync();
  mods.adoption.startTripAdoption();
  await tick(); // deixa o getSession resolver
}

async function fresh(
  opts: {
    userId?: string | null;
    seed?: unknown[];
    owner?: unknown;
    autoStart?: boolean;
  } = {},
): Promise<Mods> {
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
  if (opts.owner !== undefined) {
    localStorage.setItem('kinu_trips_owner', JSON.stringify(opts.owner));
  }

  const store = await import('@/lib/tripStore');
  const session = await import('@/lib/session');
  const sync = await import('@/lib/tripSync');
  const adoption = await import('@/lib/tripAdoption');

  const mods: Mods = { store, session, sync, adoption };
  if (opts.autoStart !== false) await boot(mods);

  return mods;
}

/** Registra tudo que o sino da adoção emitiu, na ordem. */
function record(adoption: Mods['adoption']) {
  const seen: Array<unknown> = [];
  adoption.subscribeAdoption((prompt) => seen.push(prompt));
  return seen;
}

function rawOwner(): any {
  const raw = localStorage.getItem('kinu_trips_owner');
  return raw === null ? null : JSON.parse(raw);
}

function rawOutbox(): any[] {
  return JSON.parse(localStorage.getItem('kinu_trips_outbox') || '[]');
}

function fireAuthEvent(event: string, session: unknown) {
  db.state.callbacks.forEach((cb) => cb(event, session));
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tripAdoption — o gatilho', () => {
  it('1. sessão + viagens locais + owner ausente: pede consentimento e NÃO toca no banco', async () => {
    const mods = await fresh({ seed: [trip(A), trip(B)], autoStart: false });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ userId: 'u-1', tripIds: [A, B] });
    expect(mods.adoption.getAdoptionPrompt()).toEqual({ userId: 'u-1', tripIds: [A, B] });

    // Perguntar não é adotar: nada subiu, nada foi enfileirado, nada foi gravado.
    expect(db.state.upserts).toHaveLength(0);
    expect(rawOutbox()).toHaveLength(0);
    expect(rawOwner()).toBeNull();
  });

  it('2. owner do MESMO usuário já gravado: não pergunta', async () => {
    const mods = await fresh({
      seed: [trip(A)],
      owner: { userId: 'u-1', adoptedAt: '2026-08-01T10:00:00.000Z' },
      autoStart: false,
    });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(0);
    expect(mods.adoption.getAdoptionPrompt()).toBeNull();
    expect(rawOutbox()).toHaveLength(0);
  });

  it('3. owner de OUTRO usuário: não pergunta, não adota, não reescreve o marcador', async () => {
    const owner = { userId: 'u-1', adoptedAt: '2026-08-01T10:00:00.000Z' };
    const mods = await fresh({
      userId: 'u-2',
      seed: [trip(A), trip(B)],
      owner,
      autoStart: false,
    });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(0);
    expect(rawOwner()).toEqual(owner); // o dono anterior continua sendo o dono
    expect(rawOutbox()).toHaveLength(0);
    expect(db.state.upserts).toHaveLength(0);
  });

  it('4. recusa gravada ({userId:null}) vale para OUTRO usuário também', async () => {
    // O teste que prova a ordem de leitura: `userId: null` é RECUSA, e a recusa é testada
    // ANTES do "dono diferente" — senão o `null !== 'u-9'` mandaria o caso para o ramo errado.
    const mods = await fresh({
      userId: 'u-9',
      seed: [trip(A)],
      owner: { userId: null, adoptedAt: null },
      autoStart: false,
    });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(0);
    expect(rawOwner()).toEqual({ userId: null, adoptedAt: null });
    expect(rawOutbox()).toHaveLength(0);
  });

  it('5. sem viagem local: não pergunta e grava o dono sem passado', async () => {
    const mods = await fresh({ autoStart: false });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(0);
    // Sem esta gravação, a viagem criada logo abaixo (que o espelho já subiu) viraria
    // "passado" na próxima sessão e o app perguntaria se pode trazê-la para a conta.
    expect(rawOwner()).toEqual({ userId: 'u-1', adoptedAt: null });

    mods.store.addTrip(trip(A));
    await tick();

    expect(db.state.upserts).toHaveLength(1); // espelho normal da 4c, sem adoção envolvida
    expect(mods.adoption.getAdoptionPrompt()).toBeNull();
  });

  it('6. sessão anônima com viagens locais: não pergunta e não grava nada', async () => {
    const mods = await fresh({ userId: null, seed: [trip(A), trip(B)], autoStart: false });
    const seen = record(mods.adoption);

    await boot(mods);

    expect(seen).toHaveLength(0);
    expect(rawOwner()).toBeNull(); // nada foi decidido: o marcador continua ausente
    expect(db.state.upserts).toHaveLength(0);
  });
});

describe('tripAdoption — aceitar', () => {
  it('7. aceitar grava o marcador, enfileira com o uid certo e sobe as viagens', async () => {
    const { adoption, sync } = await fresh({ seed: [trip(A), trip(B)] });

    const before = new Date().toISOString();
    adoption.acceptAdoption();
    await tick();

    const owner = rawOwner();
    expect(owner.userId).toBe('u-1');
    expect(typeof owner.adoptedAt).toBe('string');
    expect(owner.adoptedAt >= before).toBe(true);

    // Uma requisição, as duas linhas (lote de 5), e o outbox drenado.
    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].table).toBe('trips');
    expect(db.state.upserts[0].rows.map((row: any) => row.id).sort()).toEqual([A, B].sort());
    expect(db.state.upserts[0].rows.every((row: any) => row.user_id === 'u-1')).toBe(true);
    expect(db.state.upserts[0].rows.every((row: any) => row.schema_version === 1)).toBe(true);

    expect(sync.getOutboxLength()).toBe(0);
    expect(adoption.getAdoptionPrompt()).toBeNull();
  });

  it('8. o outbox nasce com op/uid corretos antes do flush resolver', async () => {
    // Roteiro que nunca responde: congela o voo para inspecionar o outbox como ele foi escrito.
    const { adoption } = await fresh({ seed: [trip(A), trip(B)] });
    db.state.upsertResult = () => new Promise(() => {});

    adoption.acceptAdoption();

    const entries = rawOutbox();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.id)).toEqual([A, B]);
    expect(entries.every((e) => e.op === 'upsert')).toBe(true);
    expect(entries.every((e) => e.uid === 'u-1')).toBe(true);
    expect(entries.every((e) => e.blocked === undefined)).toBe(true);
  });

  it('9. aceitar com o flush falhando: marcador gravado, outbox preservado', async () => {
    const { adoption, sync } = await fresh({ seed: [trip(A), trip(B)] });
    db.state.upsertResult = () => Promise.reject(new Error('network down'));

    adoption.acceptAdoption();
    await tick();

    // A adoção é uma DECISÃO, não uma entrega: o marcador registra o consentimento e o outbox
    // guarda o trabalho. Esperar a drenagem para gravar re-perguntaria a cada queda de rede.
    expect(rawOwner().userId).toBe('u-1');
    expect(rawOwner().adoptedAt).toEqual(expect.any(String));
    expect(sync.getOutboxLength()).toBe(2);

    const status = sync.getSyncStatus();
    expect(status.outbox.pending).toBe(2);
    expect(status.lastFlushError?.message).toContain('network down');
  });

  it('10. adotar duas vezes não duplica: a segunda chamada é no-op', async () => {
    const { adoption } = await fresh({ seed: [trip(A)] });

    adoption.acceptAdoption();
    await tick();
    const upsertsDepoisDaPrimeira = db.state.upserts.length;

    adoption.acceptAdoption(); // sem pedido em aberto
    await tick();

    expect(db.state.upserts).toHaveLength(upsertsDepoisDaPrimeira);
    expect(rawOutbox()).toHaveLength(0);
  });

  it('11. id apagado entre a pergunta e o clique não vira upsert órfão', async () => {
    const { store, adoption } = await fresh({ seed: [trip(A), trip(B)] });

    store.deleteTrip(B); // outra aba, ou a mesma, com o modal aberto
    await tick();
    db.state.upserts = [];
    db.state.deletes = [];

    adoption.acceptAdoption();
    await tick();

    // Adota-se o que foi mostrado, MENOS o que deixou de existir.
    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].rows.map((row: any) => row.id)).toEqual([A]);
  });
});

describe('tripAdoption — recusar', () => {
  it('12. recusar grava {userId:null}, não enfileira e não chama o banco', async () => {
    const { adoption, sync } = await fresh({ seed: [trip(A), trip(B)] });

    adoption.declineAdoption();
    await tick();

    expect(rawOwner()).toEqual({ userId: null, adoptedAt: null });
    expect(sync.getOutboxLength()).toBe(0);
    expect(db.state.upserts).toHaveLength(0);
    expect(db.state.deletes).toHaveLength(0);
    expect(adoption.getAdoptionPrompt()).toBeNull();
  });

  it('13. depois de recusar, EDITAR uma viagem antiga a sobe — a implicação declarada', async () => {
    const { store, adoption } = await fresh({ seed: [trip(A)] });

    adoption.declineAdoption();
    await tick();
    expect(db.state.upserts).toHaveLength(0);

    store.updateTrip(A, (t) => ({ ...t, destination: 'Lisboa' }));
    await tick();

    // Não é regressão: é o comportamento da 4c, que a recusa NÃO desliga. O sino não distingue
    // viagem velha de nova. O diálogo avisa isso na tela (rodapé), em vez de o código fingir
    // que a viagem ficou em quarentena — quarentena é promessa que a hidratação da 4f não
    // conseguiria manter.
    expect(db.state.upserts).toHaveLength(1);
    expect(db.state.upserts[0].rows[0].payload.destination).toBe('Lisboa');
  });
});

describe('tripAdoption — a sessão muda com o pedido aberto', () => {
  it('14. aceitar em nome de uma sessão que trocou não grava nem enfileira', async () => {
    const { adoption } = await fresh({ seed: [trip(A), trip(B)] });
    expect(adoption.getAdoptionPrompt()?.userId).toBe('u-1');

    fireAuthEvent('SIGNED_OUT', null); // logout em outra aba, com o modal aberto

    adoption.acceptAdoption();
    await tick();

    expect(rawOwner()).toBeNull();
    expect(rawOutbox()).toHaveLength(0);
    expect(db.state.upserts).toHaveLength(0);
  });

  it('15. troca de conta com o pedido aberto: o pedido é refeito em nome do novo usuário', async () => {
    const mods = await fresh({ seed: [trip(A), trip(C)], autoStart: false });
    const seen = record(mods.adoption);

    await boot(mods);
    expect(seen).toEqual([{ userId: 'u-1', tripIds: [A, C] }]);

    fireAuthEvent('SIGNED_IN', { user: { id: 'u-2' } });

    // Consentimento dado por A não vale para B: o pedido antigo é retirado (null) e um novo
    // é emitido, porque `owner` continua ausente — ninguém decidiu nada ainda.
    expect(seen).toEqual([
      { userId: 'u-1', tripIds: [A, C] },
      null,
      { userId: 'u-2', tripIds: [A, C] },
    ]);

    mods.adoption.declineAdoption();
    expect(rawOwner()).toEqual({ userId: null, adoptedAt: null });
  });
});

describe('tripAdoption — o marcador', () => {
  it('16. marcador torto é tratado como ausente (pergunta de novo)', async () => {
    const mods = await fresh({ seed: [trip(A)], owner: 'não é um objeto', autoStart: false });
    const seen = record(mods.adoption);

    await boot(mods);

    // Das três leituras possíveis para lixo, esta é a única recuperável: perguntar custa um
    // diálogo e a re-adoção é idempotente. Ler lixo como recusa silenciaria o app para sempre.
    expect(seen).toHaveLength(1);
    expect(mods.adoption.getTripsOwner()).toBeNull();
  });

  it('17. getTripsOwner devolve o marcador gravado — é o que o painel Espelho lê', async () => {
    const owner = { userId: 'u-7', adoptedAt: '2026-08-19T12:00:00.000Z' };
    const { adoption } = await fresh({ userId: 'u-7', seed: [trip(A)], owner });

    expect(adoption.getTripsOwner()).toEqual(owner);
  });
});
