// achievementEngine — as duas coisas que o motor não pode fazer:
// gravar o mesmo troféu duas vezes, e gravar qualquer coisa sem saber o que já está gravado.
//
// A TABELA É MOCKADA COM MEMÓRIA DE VERDADE: o `insert` do fake empurra a linha para a mesma
// lista que o `select` devolve. Sem isso, "a segunda passada não regrava" seria um teste vazio —
// ele passaria mesmo com o motor cego, porque o servidor falso nunca lembraria da primeira.
//
// `vi.resetModules()` a cada teste porque o motor tem estado de módulo (o `started`, o `Set` da
// sessão, o snapshot em memória) — dois testes no mesmo módulo se contaminariam.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  /** As linhas da tabela `events`, com dono. */
  rows: [] as { user_id: string | null; name: string; props: Record<string, unknown> }[],
  /** O que o `select` deve devolver como erro, quando o teste quer a leitura quebrada. */
  readError: null as { message: string } | null,
  /** Quantas leituras aconteceram — é assim que se enxerga um looping. */
  reads: 0,
  /** Quem está logado. */
  userId: null as string | null,
}));

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => {
      const filters: { userId?: string; names?: string[] } = {};
      const builder = {
        insert: async (row: { user_id: string | null; name: string; props: Record<string, unknown> }) => {
          state.rows.push({ user_id: row.user_id, name: row.name, props: row.props });
          return { data: null, error: null };
        },
        select: () => builder,
        eq: (_column: string, value: string) => { filters.userId = value; return builder; },
        in: (_column: string, values: string[]) => { filters.names = values; return builder; },
        limit: async () => {
          state.reads += 1;
          if (state.readError) return { data: null, error: state.readError };
          const data = state.rows
            .filter((row) => !filters.userId || row.user_id === filters.userId)
            .filter((row) => !filters.names || filters.names.includes(row.name))
            .map((row) => ({ name: row.name, props: row.props }));
          return { data, error: null };
        },
      };
      return builder;
    },
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

vi.mock('@/lib/session', () => ({
  getCurrentUserId: () => state.userId,
  isSessionResolved: () => true,
  subscribeSession: () => () => {},
  startSession: () => {},
}));

const UID = 'user-1';

/** Uma linha da tabela, do jeito que o kinu-beta a devolveria. */
const row = (name: string, props: Record<string, unknown>, userId: string | null = UID) =>
  ({ user_id: userId, name, props });

/**
 * Uma viagem inteira vivida: criada, ativada, concluída.
 *
 * O destino é o **Porto**, e não Lisboa, de propósito: Porto não é uma das 21 cidades
 * classificadas, então nenhum troféu da Camada Local entra junto. Estas suítes são sobre
 * idempotência, sino e cache — o que a Camada Local destrava tem suíte própria
 * (`achievementsLocal.test.ts`). Fixture que destrava demais testa o motor por acidente.
 */
const livedTrip = (tripId: string, over: Record<string, unknown> = {}) => [
  row('trip.created', { trip_id: tripId, destination: 'Porto', origin: 'wizard' }),
  row('trip.activated', { trip_id: tripId, destination: 'Porto', days: 5, travelers: 2, ...over }),
  row('trip.completed', {
    trip_id: tripId, destination: 'Porto', country: 'Portugal', continent: 'Europa', days: 5, ...over,
  }),
];

/** Os `achievement.unlocked` que chegaram na tabela, na ordem. */
const recorded = () => state.rows.filter((r) => r.name === 'achievement.unlocked').map((r) => r.props.key);

/**
 * Carrega motor e emissor limpos.
 *
 * Os dois juntos de propósito: depois de `resetModules` existem DUAS cópias do `kinuEvents` se
 * ele for importado no topo do arquivo, e drenar a cópia errada não entrega nada.
 */
async function load() {
  vi.resetModules();
  const engine = await import('@/lib/achievementEngine');
  const events = await import('@/lib/kinuEvents');
  return { engine, events };
}

/** Roda até o motor não ter mais nada a fazer — passada, entrega, e a passada que a entrega
 *  possa ter acordado. */
async function settle(
  engine: typeof import('@/lib/achievementEngine'),
  events: typeof import('@/lib/kinuEvents'),
) {
  await engine.runAchievements();
  await events.flushEvents();
  await engine.runAchievements();
  await events.flushEvents();
}

beforeEach(() => {
  localStorage.clear();
  state.rows = [];
  state.readError = null;
  state.reads = 0;
  state.userId = UID;
});

describe('retroativo', () => {
  it('destrava sobre histórico frio — ninguém precisa viajar de novo', async () => {
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    await settle(engine, events);

    expect(recorded()).toEqual(['primeira_fogueira', 'pe_na_estrada']);
    // 100 (viagem) + 50 (país) + 150 (continente) + 2 × 25 (troféus).
    expect(engine.getProgress().xp).toBe(350);
    expect(engine.getProgress().level.name).toBe('Desbravador');
  });

  it('grava o evento com o dono, não com `null`', async () => {
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    await settle(engine, events);

    const unlocked = state.rows.filter((r) => r.name === 'achievement.unlocked');
    expect(unlocked.every((r) => r.user_id === UID)).toBe(true);
  });
});

describe('idempotência', () => {
  it('a segunda passada não regrava', async () => {
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    await settle(engine, events);
    const depoisDaPrimeira = recorded();

    await settle(engine, events);

    expect(recorded()).toEqual(depoisDaPrimeira);
  });

  it('não regrava nem em outra sessão — a chave natural vive no servidor', async () => {
    state.rows.push(...livedTrip('t1'));
    const primeira = await load();
    await settle(primeira.engine, primeira.events);

    // Outro dispositivo, outro carregamento do app: módulos novos, memória zerada, mesma tabela.
    const segunda = await load();
    await settle(segunda.engine, segunda.events);

    expect(recorded()).toEqual(['primeira_fogueira', 'pe_na_estrada']);
  });

  it('histórico que já traz o troféu não emite nada', async () => {
    state.rows.push(...livedTrip('t1'));
    state.rows.push(row('achievement.unlocked', { key: 'primeira_fogueira' }));
    state.rows.push(row('achievement.unlocked', { key: 'pe_na_estrada' }));
    const { engine, events } = await load();

    await settle(engine, events);

    expect(recorded()).toEqual(['primeira_fogueira', 'pe_na_estrada']);
    // E o progresso continua contando os dois: o que vale é o merecido, não o que foi emitido
    // nesta passada.
    expect(engine.getProgress().unlocked).toEqual(['primeira_fogueira', 'pe_na_estrada']);
  });

  it('o troféu de OUTRO usuário não conta como já gravado', async () => {
    state.rows.push(...livedTrip('t1'));
    state.rows.push(row('achievement.unlocked', { key: 'primeira_fogueira' }, 'outro-usuario'));
    const { engine, events } = await load();

    await settle(engine, events);

    expect(recorded().filter((k) => k === 'primeira_fogueira')).toHaveLength(2);
  });
});

describe('as recusas', () => {
  it('sem sessão não lê nem grava', async () => {
    state.userId = null;
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    await settle(engine, events);

    expect(state.reads).toBe(0);
    expect(recorded()).toEqual([]);
  });

  it('erro na leitura não grava NADA — sem saber o que já existe, gravar é reemitir tudo', async () => {
    state.rows.push(...livedTrip('t1'));
    state.readError = { message: 'sem rede' };
    const { engine, events } = await load();

    await settle(engine, events);

    expect(recorded()).toEqual([]);
    expect(engine.getProgress().xp).toBe(0);
  });

  it('a leitura que volta não destrava o que ninguém viveu', async () => {
    const { engine, events } = await load();
    await settle(engine, events);
    expect(recorded()).toEqual([]);
  });
});

describe('o sino do emissor', () => {
  it('um fato novo acorda o motor', async () => {
    const { engine, events } = await load();
    engine.startAchievements();
    await settle(engine, events);
    expect(recorded()).toEqual([]);

    // A pessoa ativa a primeira viagem. O evento sai pelo emissor; o motor escuta.
    events.trackEvent('trip.activated', { trip_id: 't1', destination: 'Lisboa', days: 5 }, UID);
    await settle(engine, events);

    expect(recorded()).toEqual(['primeira_fogueira']);
  });

  it('o motor não se acorda com o próprio evento', async () => {
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    engine.startAchievements();
    await settle(engine, events);

    // Duas chaves, uma linha cada — e não uma cascata de passadas.
    expect(recorded()).toEqual(['primeira_fogueira', 'pe_na_estrada']);
    expect(state.reads).toBeLessThan(10);
  });

  it('`startAchievements` é idempotente', async () => {
    const { engine, events } = await load();
    engine.startAchievements();
    engine.startAchievements();
    engine.startAchievements();
    await settle(engine, events);

    state.rows.push(...livedTrip('t1'));
    events.trackEvent('trip.completed', {
      // Milão pelo mesmo motivo do Porto no `livedTrip`: fora das 21 classificadas.
      trip_id: 't2', destination: 'Milão', country: 'Itália', continent: 'Europa', days: 4,
    }, UID);
    await settle(engine, events);

    // Uma assinatura, uma emissão por chave — três `start` não triplicam nada.
    expect(recorded()).toEqual(['primeira_fogueira', 'pe_na_estrada']);
  });
});

describe('o sino do motor', () => {
  it('avisa quem destravou AGORA, e só na passada que destravou', async () => {
    state.rows.push(...livedTrip('t1'));
    const { engine, events } = await load();

    const avisos: string[][] = [];
    engine.subscribeAchievements((_progress, unlockedNow) => {
      avisos.push(unlockedNow.map((a) => a.key));
    });

    await settle(engine, events);
    await settle(engine, events);

    expect(avisos[0]).toEqual(['primeira_fogueira', 'pe_na_estrada']);
    // Da segunda em diante, nada novo — a celebração não repete a cada boot.
    expect(avisos.slice(1).every((a) => a.length === 0)).toBe(true);
  });
});

describe('o cache', () => {
  it('guarda o snapshot e pinta a tela antes da primeira leitura do boot seguinte', async () => {
    state.rows.push(...livedTrip('t1'));
    const primeira = await load();
    await settle(primeira.engine, primeira.events);

    const cached = JSON.parse(localStorage.getItem('kinu_achievements') ?? '{}');
    expect(cached.xp).toBe(350);

    // Boot seguinte: o motor já sabe o que mostrar sem ter falado com o servidor.
    const leiturasAntes = state.reads;
    const segunda = await load();
    expect(segunda.engine.getProgress().xp).toBe(350);
    expect(state.reads).toBe(leiturasAntes);
  });

  it('cache de formato velho não vira tela quebrada', async () => {
    localStorage.setItem('kinu_achievements', JSON.stringify({ nivel: 'Explorador' }));
    const { engine } = await load();
    expect(engine.getProgress().xp).toBe(0);
    expect(engine.getProgress().unlocked).toEqual([]);
  });
});
