// kinuEvents — o emissor único, e as três coisas que ele não pode fazer:
// perder evento, gravar evento repetido, e derrubar a tela.
//
// O `vi.mock` do cliente é obrigatório aqui pelos mesmos dois motivos do tripSync.test:
// `client.ts` roda `createClient` NO IMPORT (morre sem as VITE_KINU_BETA_* num CI limpo),
// e é o mock que permite roteirizar a resposta do PostgREST sem rede.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const db = vi.hoisted(() => {
  const state = {
    inserted: [] as Record<string, unknown>[],
    error: null as { code: string; message: string } | null,
    throwOnInsert: false,
    uid: 'uid-1' as string | null,
  };

  const kinuBeta = {
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        if (state.throwOnInsert) throw new Error('sem rede');
        state.inserted.push(row);
        return { data: null, error: state.error };
      },
    }),
    auth: {
      getSession: async () => ({
        data: { session: state.uid ? { user: { id: state.uid } } : null },
        error: null,
      }),
    },
  };

  return { state, kinuBeta };
});

vi.mock('@/integrations/kinu-beta/client', () => ({ kinuBeta: db.kinuBeta }));

import { trackEvent, flushEvents, readEvents, EVENTS_KEY } from '@/lib/kinuEvents';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  localStorage.clear();
  db.state.inserted = [];
  db.state.error = null;
  db.state.throwOnInsert = false;
  db.state.uid = 'uid-1';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gravação e envio', () => {
  it('grava no anel e manda para o kinu-beta no formato REAL da tabela', async () => {
    trackEvent('hotel.detail_opened', { hotel: 'Casa Lola', city: 'Cartagena' });
    await tick();

    expect(db.state.inserted).toEqual([
      {
        user_id: 'uid-1',
        name: 'hotel.detail_opened',
        props: { hotel: 'Casa Lola', city: 'Cartagena' },
      },
    ]);

    const ring = readEvents();
    expect(ring).toHaveLength(1);
    expect(ring[0].sent).toBe(true);
  });

  it('sem sessão, vai com user_id null — a coluna aceita, e o evento não se perde', async () => {
    db.state.uid = null;
    trackEvent('onboarding.welcome_shown');
    await tick();

    expect(db.state.inserted[0]).toEqual({ user_id: null, name: 'onboarding.welcome_shown', props: {} });
  });

  it('userId explícito (trackOnboarding) manda na frente da sessão', async () => {
    trackEvent('onboarding.hint_shown', { area: 'roteiro' }, 'uid-explicito');
    await tick();

    expect(db.state.inserted[0].user_id).toBe('uid-explicito');
  });
});

describe('falha de gravação — o anel é a rede, não a decoração', () => {
  it('erro do PostgREST (é o 42501 de hoje) deixa o evento pendente e reenvia depois', async () => {
    db.state.error = { code: '42501', message: 'permission denied for table events' };
    trackEvent('hotel.reasons_viewed', { hotel: 'A' });
    await tick();

    expect(readEvents()).toHaveLength(1);
    expect(readEvents()[0].sent).toBe(false);

    // O GRANT foi aplicado: a fila sai na próxima emissão, na ordem em que entrou.
    db.state.error = null;
    db.state.inserted = [];
    trackEvent('hotel.reasons_viewed', { hotel: 'B' });
    await tick();

    expect(db.state.inserted.map((r) => (r.props as { hotel: string }).hotel)).toEqual(['A', 'B']);
    expect(readEvents().every((e) => e.sent)).toBe(true);
  });

  it('sem rede (insert lança), nada lança para cima e nada se perde', async () => {
    db.state.throwOnInsert = true;
    expect(() => trackEvent('hotel.swapped', { from: 'A', to: 'B' })).not.toThrow();
    await tick();

    expect(readEvents()[0].sent).toBe(false);
  });

  it('a falha para a drenagem na cabeça da fila — nada de entregar fora de ordem', async () => {
    db.state.error = { code: '42501', message: 'denied' };
    trackEvent('e1');
    trackEvent('e2');
    trackEvent('e3');
    await tick();

    // O MESMO evento mais antigo em toda tentativa: `e2` e `e3` nunca foram tentados antes
    // dele, e a ordem cronológica da tabela é a razão do `break`. Duas tentativas e não
    // três porque as emissões de `e2` e `e3` caíram na drenagem que já estava no ar — elas
    // pediram a volta extra em vez de abrirem uma drenagem paralela cada uma.
    expect(db.state.inserted.map((r) => r.name)).toEqual(['e1', 'e1']);
    expect(readEvents().filter((e) => !e.sent)).toHaveLength(3);
  });
});

describe('uma drenagem por vez', () => {
  // O bug de produção: `hotel.swapped` gravou DUAS linhas idênticas a 10ms. O anel tinha
  // UMA entrada — quem dobrou foi a entrega. A troca emite, a drenagem sai com o `swapped`
  // pendente, o re-render emite `reasons_viewed`, uma segunda drenagem lê a MESMA fila
  // (o `sent: true` da primeira só é gravado depois dos inserts) e reenvia o `swapped`.
  it('evento seguido de outro no mesmo tick não é entregue duas vezes', async () => {
    trackEvent('hotel.swapped', { from: 'Casa Lola', to: 'Sofitel', surface: 'detail' });
    trackEvent('hotel.reasons_viewed', { hotel: 'Sofitel' });
    await tick();

    expect(db.state.inserted.map((r) => r.name)).toEqual(['hotel.swapped', 'hotel.reasons_viewed']);
    expect(readEvents().every((e) => e.sent)).toBe(true);
  });

  it('o evento que chega no meio da drenagem não fica esperando a próxima emissão', async () => {
    trackEvent('a');
    await Promise.resolve(); // a drenagem de `a` já está no ar, ainda sem resolver
    trackEvent('b');
    await tick();

    // `b` não abriu drenagem própria; foi a de `a` que voltou para a fila por ele.
    expect(db.state.inserted.map((r) => r.name)).toEqual(['a', 'b']);
    expect(readEvents().filter((e) => !e.sent)).toHaveLength(0);
  });
});

describe('dedupe no emissor', () => {
  it('evento idêntico ao último é descartado — é o que salva o anel do re-render', async () => {
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola', reasons: 3 });
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola', reasons: 3 });
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola', reasons: 3 });
    await tick();

    expect(readEvents()).toHaveLength(1);
  });

  it('props diferentes são eventos diferentes', async () => {
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola' });
    trackEvent('hotel.reasons_viewed', { hotel: 'Sofitel' });
    await tick();

    expect(readEvents()).toHaveLength(2);
  });

  it('duas emissões idênticas no MESMO tick viram uma — o dedupe não espera o storage', async () => {
    // Dois cliques no mesmo botão acontecem antes de qualquer re-render. A referência do
    // dedupe é a última emissão ACEITA (memória), não a última que o anel devolveu.
    trackEvent('hotel.swapped', { from: 'Casa Lola', to: 'Sofitel', surface: 'swap' });
    trackEvent('hotel.swapped', { from: 'Casa Lola', to: 'Sofitel', surface: 'swap' });
    await tick();

    expect(readEvents()).toHaveLength(1);
    expect(db.state.inserted).toHaveLength(1);
  });

  it('com o storage bloqueado o dedupe continua de pé — é o caminho sem anel', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    trackEvent('hotel.swapped', { from: 'A', to: 'B', surface: 'swap' });
    trackEvent('hotel.swapped', { from: 'A', to: 'B', surface: 'swap' });
    await tick();
    spy.mockRestore();

    // Sem anel para comparar, a memória é a ÚNICA guarda: sem ela, o envio direto manda
    // as duas. Uma linha, e o dedupe não desligou junto com o storage.
    expect(db.state.inserted).toHaveLength(1);
  });

  it('o mesmo evento separado por outro NÃO é duplicata', async () => {
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola' });
    trackEvent('hotel.detail_opened', { hotel: 'Casa Lola' });
    trackEvent('hotel.reasons_viewed', { hotel: 'Casa Lola' });
    await tick();

    expect(readEvents().map((e) => e.name)).toEqual([
      'hotel.reasons_viewed',
      'hotel.detail_opened',
      'hotel.reasons_viewed',
    ]);
  });
});

describe('o anel', () => {
  it('corta em 50, mantendo os mais novos', async () => {
    db.state.error = { code: '42501', message: 'denied' };
    for (let i = 0; i < 60; i += 1) trackEvent('e', { i });
    await tick();

    const ring = readEvents();
    expect(ring).toHaveLength(50);
    expect((ring[0].props as { i: number }).i).toBe(10);
    expect((ring[49].props as { i: number }).i).toBe(59);
  });

  it('storage corrompido devolve lista vazia e não lança', () => {
    localStorage.setItem(EVENTS_KEY, '{isso não é json');
    expect(readEvents()).toEqual([]);
    expect(() => trackEvent('e')).not.toThrow();
  });

  it('entrada torta no anel é filtrada na leitura', () => {
    localStorage.setItem(
      EVENTS_KEY,
      JSON.stringify([
        { ts: '2026-09-09T00:00:00.000Z', name: 'ok', props: {}, sent: false },
        { name: 'sem ts', props: {}, sent: false },
        'nem objeto é',
      ]),
    );
    expect(readEvents().map((e) => e.name)).toEqual(['ok']);
  });

  it('storage bloqueado (quota/navegador privado) manda o evento DIRETO, sem fila', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => trackEvent('hotel.swapped', { from: 'A', to: 'B' })).not.toThrow();
    await tick();
    spy.mockRestore();

    // O anel não guardou nada, mas o evento chegou ao destino — que é o que importa.
    expect(db.state.inserted).toHaveLength(1);
  });

  it('flushEvents sem pendentes não bate na rede', async () => {
    await flushEvents();
    expect(db.state.inserted).toHaveLength(0);
  });
});
