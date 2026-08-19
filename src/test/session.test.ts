/**
 * Testes do módulo de sessão (Arco 4b).
 *
 * `vi.mock` do client — ver §5 do relatório: hoje o Vite carrega o `.env` também no modo
 * test, então o import real passaria neste Codespace; sem `.env` (CI) o `createClient` lança
 * NO IMPORT ("supabaseUrl is required.") e a suíte morre antes do primeiro `it`. Fora isso,
 * é o mock que permite roteirizar o getSession e disparar eventos do GoTrue sem rede.
 */
import { describe, it, expect, vi } from 'vitest';

type AuthCallback = (event: string, session: unknown) => void;

const auth = vi.hoisted(() => {
  const state = {
    callbacks: [] as AuthCallback[],
    unsubscribes: 0,
    order: [] as string[],
    getSessionResult: (): Promise<{ data: { session: unknown } }> =>
      Promise.resolve({ data: { session: null } }),
  };

  const onAuthStateChange = vi.fn((cb: AuthCallback) => {
    state.order.push('onAuthStateChange');
    state.callbacks.push(cb);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            state.unsubscribes += 1;
          },
        },
      },
    };
  });

  const getSession = vi.fn(() => {
    state.order.push('getSession');
    return state.getSessionResult();
  });

  return { state, onAuthStateChange, getSession };
});

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    auth: { onAuthStateChange: auth.onAuthStateChange, getSession: auth.getSession },
  },
}));

const sessionOf = (id: string) => ({ user: { id } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Cada teste precisa de um módulo virgem: `startSession()` é idempotente por design. */
async function freshSession() {
  vi.resetModules();
  auth.state.callbacks = [];
  auth.state.unsubscribes = 0;
  auth.state.order = [];
  auth.state.getSessionResult = () => Promise.resolve({ data: { session: null } });
  auth.onAuthStateChange.mockClear();
  auth.getSession.mockClear();
  return import('@/lib/session');
}

/** Dispara um evento como o GoTrue real faria. */
function fireAuthEvent(event: string, session: unknown) {
  auth.state.callbacks.forEach((cb) => cb(event, session));
}

describe('session — resolução inicial', () => {
  it('com sessão: adota o userId do getSession e resolve', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-1') } });

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    expect(s.isSessionResolved()).toBe(false);
    expect(s.getCurrentUserId()).toBeNull();

    s.startSession();
    await flush();

    expect(s.getCurrentUserId()).toBe('u-1');
    expect(s.isSessionResolved()).toBe(true);
    expect(seen).toEqual(['u-1']);
  });

  it('sem sessão: resolve como anônimo e avisa uma vez', async () => {
    const s = await freshSession();

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    s.startSession();
    await flush();

    expect(s.getCurrentUserId()).toBeNull();
    expect(s.isSessionResolved()).toBe(true);
    expect(seen).toEqual([null]); // a emissão da primeira resolução
  });

  it('getSession rejeitando: resolve em vez de prender o app', async () => {
    const s = await freshSession();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    auth.state.getSessionResult = () => Promise.reject(new Error('rede caída'));

    s.startSession();
    await flush();

    expect(s.isSessionResolved()).toBe(true);
    expect(s.getCurrentUserId()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('assina o GoTrue ANTES de pedir a sessão', async () => {
    const s = await freshSession();
    s.startSession();
    expect(auth.state.order).toEqual(['onAuthStateChange', 'getSession']);
  });

  it('evento no meio da janela não é sobrescrito pelo retrato velho do getSession', async () => {
    const s = await freshSession();
    let resolveGetSession: (value: { data: { session: unknown } }) => void = () => {};
    auth.state.getSessionResult = () =>
      new Promise((resolve) => {
        resolveGetSession = resolve;
      });

    s.startSession();
    fireAuthEvent('SIGNED_IN', sessionOf('u-9'));

    expect(s.getCurrentUserId()).toBe('u-9');
    expect(s.isSessionResolved()).toBe(true);

    resolveGetSession({ data: { session: null } }); // leitura anterior ao login
    await flush();

    expect(s.getCurrentUserId()).toBe('u-9');
  });
});

describe('session — mudanças', () => {
  it('login notifica com o userId', async () => {
    const s = await freshSession();
    s.startSession();
    await flush();

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    fireAuthEvent('SIGNED_IN', sessionOf('u-2'));

    expect(seen).toEqual(['u-2']);
    expect(s.getCurrentUserId()).toBe('u-2');
  });

  it('logout notifica null', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-3') } });
    s.startSession();
    await flush();

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    fireAuthEvent('SIGNED_OUT', null);

    expect(seen).toEqual([null]);
    expect(s.getCurrentUserId()).toBeNull();
  });

  it('refresh de token com o MESMO userId não notifica', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-4') } });
    s.startSession();
    await flush();

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    fireAuthEvent('TOKEN_REFRESHED', sessionOf('u-4'));
    fireAuthEvent('TOKEN_REFRESHED', sessionOf('u-4'));

    expect(seen).toEqual([]);
    expect(s.getCurrentUserId()).toBe('u-4');
  });

  it('troca de conta notifica o id novo', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-5') } });
    s.startSession();
    await flush();

    const seen: (string | null)[] = [];
    s.subscribeSession((id) => seen.push(id));

    fireAuthEvent('SIGNED_IN', sessionOf('u-6'));

    expect(seen).toEqual(['u-6']);
  });

  it('unsubscribe para de receber; os outros continuam', async () => {
    const s = await freshSession();
    s.startSession();
    await flush();

    const sai: (string | null)[] = [];
    const fica: (string | null)[] = [];
    const unsubscribe = s.subscribeSession((id) => sai.push(id));
    s.subscribeSession((id) => fica.push(id));

    unsubscribe();
    fireAuthEvent('SIGNED_IN', sessionOf('u-7'));

    expect(sai).toEqual([]);
    expect(fica).toEqual(['u-7']);
  });
});

describe('session — idempotência e leitura síncrona', () => {
  it('a segunda chamada de startSession é no-op', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-8') } });

    s.startSession();
    await flush();
    s.startSession();
    await flush();

    expect(auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(auth.getSession).toHaveBeenCalledTimes(1);
    expect(auth.state.callbacks).toHaveLength(1);
    expect(s.getCurrentUserId()).toBe('u-8'); // não derrubou o que já estava resolvido
  });

  it('getCurrentUserId é síncrono antes e depois da resolução', async () => {
    const s = await freshSession();
    auth.state.getSessionResult = () =>
      Promise.resolve({ data: { session: sessionOf('u-10') } });

    expect(s.getCurrentUserId()).toBeNull();
    expect(s.isSessionResolved()).toBe(false);

    s.startSession();
    expect(s.getCurrentUserId()).toBeNull();   // ainda pendente, e ninguém travou
    expect(s.isSessionResolved()).toBe(false);

    await flush();
    expect(s.getCurrentUserId()).toBe('u-10');

    // e a leitura logo após um evento não precisa de await nenhum
    fireAuthEvent('SIGNED_OUT', null);
    expect(s.getCurrentUserId()).toBeNull();
    expect(s.isSessionResolved()).toBe(true);
  });

  it('um listener que lança não derruba os outros', async () => {
    const s = await freshSession();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    s.startSession();
    await flush();

    const ok: (string | null)[] = [];
    s.subscribeSession(() => {
      throw new Error('listener ruim');
    });
    s.subscribeSession((id) => ok.push(id));

    fireAuthEvent('SIGNED_IN', sessionOf('u-11'));

    expect(ok).toEqual(['u-11']);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
