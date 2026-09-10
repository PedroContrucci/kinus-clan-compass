// achievements — os doze critérios da Camada Mundo, cada um no LIMIAR.
//
// Não há `vi.mock` aqui e isso é o ponto: o catálogo é puro, então o teste é a lista de eventos
// que a pessoa viveu e a resposta que o troféu dá. Se um dia este arquivo precisar mockar o
// cliente do kinu-beta, a fronteira do módulo caiu.
//
// O QUE CADA CRITÉRIO PRECISA PROVAR: que destrava com o suficiente E que NÃO destrava com um a
// menos. Teste que só prova o caminho feliz aceita `return true`.
import { describe, it, expect } from 'vitest';
import {
  achievementOf,
  computeProgress,
  indexEvents,
  levelOf,
  nextLevelOf,
  unlockedKeys,
  WORLD_ACHIEVEMENTS,
  type AchievementEvent,
} from '@/lib/achievements';
import { LOCAL_CITIES } from '@/lib/localAchievements';

// --- construtores de fato, no formato exato do tripEvents -------------------

const activated = (tripId: string, over: Record<string, unknown> = {}): AchievementEvent => ({
  name: 'trip.activated',
  props: { trip_id: tripId, destination: 'Lisboa', days: 5, travelers: 2, ...over },
});

const completed = (tripId: string, over: Record<string, unknown> = {}): AchievementEvent => ({
  name: 'trip.completed',
  props: {
    trip_id: tripId,
    destination: 'Lisboa',
    country: 'Portugal',
    continent: 'Europa',
    days: 5,
    ...over,
  },
});

const created = (tripId: string, origin: string): AchievementEvent => ({
  name: 'trip.created',
  props: { trip_id: tripId, destination: 'Lisboa', origin },
});

const underBudget = (tripId: string): AchievementEvent => ({
  name: 'budget.closed_under',
  props: { trip_id: tripId, budget: 10000, planned: 8000 },
});

const item = (tripId: string, kind: string, itemId: string): AchievementEvent => ({
  name: 'trip.item_confirmed',
  props: { trip_id: tripId, kind, item_id: itemId },
});

/** Uma viagem inteira concluída: criada, ativada e concluída. */
const trip = (tripId: string, over: Record<string, unknown> = {}): AchievementEvent[] => [
  created(tripId, 'wizard'),
  activated(tripId, over),
  completed(tripId, over),
];

const has = (events: AchievementEvent[], key: string) => unlockedKeys(events).includes(key);

// --- o catálogo ------------------------------------------------------------

describe('o catálogo', () => {
  it('tem os 12 troféus ativos do §3, sem as duas linhas reservadas', () => {
    expect(WORLD_ACHIEVEMENTS).toHaveLength(12);
    const keys = WORLD_ACHIEVEMENTS.map((a) => a.key);
    expect(keys).not.toContain('primeiro_registro');
    expect(keys).not.toContain('album_do_cla');
  });

  it('não repete chave e todo troféu diz o que precisa acontecer', () => {
    const keys = WORLD_ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const achievement of WORLD_ACHIEVEMENTS) {
      expect(achievement.name.length).toBeGreaterThan(0);
      expect(achievement.criterion.length).toBeGreaterThan(0);
      expect(achievement.emoji.length).toBeGreaterThan(0);
    }
  });

  it('histórico vazio não destrava nada', () => {
    expect(unlockedKeys([])).toEqual([]);
  });

  it('`achievementOf` acha pela chave e devolve undefined para o que não existe', () => {
    expect(achievementOf('pe_na_estrada')?.name).toBe('Pé na Estrada');
    expect(achievementOf('troféu_inventado')).toBeUndefined();
  });
});

// --- o índice --------------------------------------------------------------

describe('o índice', () => {
  it('conta a mesma viagem UMA vez, ainda que a tabela tenha a linha repetida', () => {
    const index = indexEvents([completed('t1'), completed('t1'), completed('t1')]);
    expect(index.completed.size).toBe(1);
  });

  it('ignora evento sem trip_id em vez de contá-lo como viagem', () => {
    const index = indexEvents([{ name: 'trip.completed', props: {} }]);
    expect(index.completed.size).toBe(0);
  });

  it('não se afoga em prop de tipo errado', () => {
    const index = indexEvents([
      { name: 'trip.completed', props: { trip_id: 't1', days: 'dez', country: 42 } },
    ]);
    expect(index.completed.get('t1')).toEqual({
      destination: '', country: '', continent: '', days: 0,
    });
  });
});

// --- os doze critérios -----------------------------------------------------

describe('primeira_fogueira e pe_na_estrada', () => {
  it('a fogueira é da ATIVAÇÃO, a estrada é da CONCLUSÃO', () => {
    const so_ativou = [created('t1', 'wizard'), activated('t1')];
    expect(has(so_ativou, 'primeira_fogueira')).toBe(true);
    expect(has(so_ativou, 'pe_na_estrada')).toBe(false);

    expect(has(trip('t1'), 'pe_na_estrada')).toBe(true);
  });

  it('rascunho criado e nunca ativado não acende fogueira', () => {
    expect(has([created('t1', 'wizard')], 'primeira_fogueira')).toBe(false);
  });
});

describe('cla_em_movimento', () => {
  it('cruza a criança da ATIVAÇÃO com a viagem concluída', () => {
    expect(has(trip('t1', { children: 2 }), 'cla_em_movimento')).toBe(true);
  });

  it('viagem com criança que ainda não terminou não conta', () => {
    expect(has([activated('t1', { children: 2 })], 'cla_em_movimento')).toBe(false);
  });

  it('viagem concluída sem criança não conta', () => {
    expect(has(trip('t1', { children: 0 }), 'cla_em_movimento')).toBe(false);
  });

  it('a criança de OUTRA viagem não vale para esta', () => {
    const events = [activated('t1', { children: 2 }), completed('t2')];
    expect(has(events, 'cla_em_movimento')).toBe(false);
  });
});

describe('maratonista', () => {
  it('9 dias não, 10 dias sim', () => {
    expect(has(trip('t1', { days: 9 }), 'maratonista')).toBe(false);
    expect(has(trip('t1', { days: 10 }), 'maratonista')).toBe(true);
  });
});

describe('bandeirante', () => {
  it('3 destinos DISTINTOS concluídos', () => {
    const dois = [completed('t1', { destination: 'Lisboa' }), completed('t2', { destination: 'Roma' })];
    expect(has(dois, 'bandeirante')).toBe(false);
    expect(has([...dois, completed('t3', { destination: 'Paris' })], 'bandeirante')).toBe(true);
  });

  it('três viagens ao MESMO destino são um destino', () => {
    const events = [completed('t1'), completed('t2'), completed('t3')];
    expect(has(events, 'bandeirante')).toBe(false);
  });
});

describe('cartografo e cidadao_do_mundo', () => {
  const paises = ['Portugal', 'Itália', 'França', 'Espanha', 'Grécia'];
  const cincoPaises = paises.map((country, i) =>
    completed(`t${i}`, { destination: `d${i}`, country, continent: 'Europa' }));

  it('4 países não, 5 sim', () => {
    expect(has(cincoPaises.slice(0, 4), 'cartografo')).toBe(false);
    expect(has(cincoPaises, 'cartografo')).toBe(true);
  });

  it('cinco países do mesmo continente não fazem cidadão do mundo', () => {
    expect(has(cincoPaises, 'cidadao_do_mundo')).toBe(false);
  });

  it('3 continentes distintos fazem', () => {
    const events = [
      completed('t1', { continent: 'Europa' }),
      completed('t2', { continent: 'Américas' }),
      completed('t3', { continent: 'Ásia' }),
    ];
    expect(has(events, 'cidadao_do_mundo')).toBe(true);
  });

  it('destino fora do catálogo não conta como país nem continente novos', () => {
    // `geoOf` omite as props quando não sabe — e "não sei" não pode virar mais um país.
    const events = [
      ...cincoPaises.slice(0, 4),
      completed('t9', { destination: 'Ilha Perdida' }),
    ];
    expect(has(events, 'cartografo')).toBe(false);
  });
});

describe('raizes_fortes', () => {
  const brasil = (id: string, destination: string) =>
    completed(id, { destination, country: 'Brasil', continent: 'Américas' });

  it('2 no Brasil não, 3 sim', () => {
    const dois = [brasil('t1', 'Rio'), brasil('t2', 'Salvador')];
    expect(has(dois, 'raizes_fortes')).toBe(false);
    expect(has([...dois, brasil('t3', 'Fortaleza')], 'raizes_fortes')).toBe(true);
  });

  it('conta VIAGENS, não destinos — três vezes o mesmo Rio vale', () => {
    const events = [brasil('t1', 'Rio'), brasil('t2', 'Rio'), brasil('t3', 'Rio')];
    expect(has(events, 'raizes_fortes')).toBe(true);
  });
});

describe('capitao_do_orcamento e tesoureiro_do_cla', () => {
  it('1 dentro do orçamento faz capitão; 3 fazem tesoureiro', () => {
    expect(has([underBudget('t1')], 'capitao_do_orcamento')).toBe(true);
    expect(has([underBudget('t1'), underBudget('t2')], 'tesoureiro_do_cla')).toBe(false);
    expect(has([underBudget('t1'), underBudget('t2'), underBudget('t3')], 'tesoureiro_do_cla')).toBe(true);
  });

  it('a mesma viagem repetida na tabela não vira três', () => {
    const events = [underBudget('t1'), underBudget('t1'), underBudget('t1')];
    expect(has(events, 'tesoureiro_do_cla')).toBe(false);
  });
});

describe('tudo_no_lugar', () => {
  const completo = (id: string) => [
    item(id, 'flight', 'voo-1'),
    item(id, 'hotel', 'hotel-1'),
    item(id, 'activity', 'act-1'),
    item(id, 'activity', 'act-2'),
    item(id, 'activity', 'act-3'),
  ];

  it('voo + hotel + 3 atividades na MESMA viagem', () => {
    expect(has(completo('t1'), 'tudo_no_lugar')).toBe(true);
  });

  it('sem hotel não fecha', () => {
    const semHotel = completo('t1').filter((e) => e.props.kind !== 'hotel');
    expect(has(semHotel, 'tudo_no_lugar')).toBe(false);
  });

  it('a MESMA atividade confirmada três vezes é uma atividade', () => {
    const events = [
      item('t1', 'flight', 'voo-1'),
      item('t1', 'hotel', 'hotel-1'),
      item('t1', 'activity', 'act-1'),
      item('t1', 'activity', 'act-1'),
      item('t1', 'activity', 'act-1'),
    ];
    expect(has(events, 'tudo_no_lugar')).toBe(false);
  });

  it('peças espalhadas por viagens diferentes não fecham nenhuma', () => {
    const events = [
      item('t1', 'flight', 'voo-1'),
      item('t2', 'hotel', 'hotel-1'),
      item('t3', 'activity', 'act-1'),
      item('t3', 'activity', 'act-2'),
      item('t3', 'activity', 'act-3'),
    ];
    expect(has(events, 'tudo_no_lugar')).toBe(false);
  });
});

describe('co_piloto', () => {
  it('criada pelo KINU AI E ativada', () => {
    const events = [created('t1', 'kinu_ai'), activated('t1')];
    expect(has(events, 'co_piloto')).toBe(true);
  });

  it('criada pelo KINU AI e abandonada no rascunho não vale', () => {
    expect(has([created('t1', 'kinu_ai')], 'co_piloto')).toBe(false);
  });

  it('viagem do wizard, ainda que ativada, não vale', () => {
    expect(has([created('t1', 'wizard'), activated('t1')], 'co_piloto')).toBe(false);
  });
});

// --- XP e níveis -----------------------------------------------------------

describe('XP', () => {
  it('soma as cinco fontes do §3', () => {
    // Uma viagem concluída (100) em Portugal (país novo, 50) na Europa (continente novo, 150),
    // dentro do orçamento (50) = 350, mais 25 por troféu.
    const events = [...trip('t1'), underBudget('t1')];
    const progress = computeProgress(events);

    // primeira_fogueira, pe_na_estrada, capitao_do_orcamento — e o Carimbo de Lisboa, que a
    // Camada Local dá de graça a QUALQUER viagem concluída numa das 21 cidades curadas.
    expect(progress.unlocked).toEqual([
      'primeira_fogueira',
      'pe_na_estrada',
      'capitao_do_orcamento',
      'local.lisboa.carimbo',
    ]);
    expect(progress.xp).toBe(100 + 50 + 150 + 50 + 4 * 25);
  });

  it('segundo país no mesmo continente vale país, não continente', () => {
    const um = computeProgress(trip('t1'));
    const dois = computeProgress([
      ...trip('t1'),
      completed('t2', { destination: 'Roma', country: 'Itália', continent: 'Europa' }),
    ]);
    // +100 da viagem, +50 do país, +0 do continente (a conquista extra entra à parte).
    expect(dois.xp - um.xp).toBeGreaterThanOrEqual(150);
  });

  it('histórico vazio é zero XP no primeiro nível', () => {
    const progress = computeProgress([]);
    expect(progress.xp).toBe(0);
    expect(progress.level.name).toBe('Aprendiz do Clã');
    expect(progress.unlocked).toEqual([]);
    // 12 da Mundo + 5 por cidade classificada. O total é DINÂMICO: sai do arquivo gerado,
    // não de um número escrito no catálogo.
    expect(progress.total).toBe(12 + 5 * LOCAL_CITIES.length);
    expect(progress.visitedCities).toEqual([]);
  });
});

describe('níveis', () => {
  it('as cinco faixas do §3, cada uma no limiar exato', () => {
    expect(levelOf(0).name).toBe('Aprendiz do Clã');
    expect(levelOf(99).name).toBe('Aprendiz do Clã');
    expect(levelOf(100).name).toBe('Explorador');
    expect(levelOf(299).name).toBe('Explorador');
    expect(levelOf(300).name).toBe('Desbravador');
    expect(levelOf(700).name).toBe('Guardião das Rotas');
    expect(levelOf(1499).name).toBe('Guardião das Rotas');
    expect(levelOf(1500).name).toBe('Ancião do Clã');
    expect(levelOf(99999).name).toBe('Ancião do Clã');
  });

  it('a próxima faixa acaba no topo', () => {
    expect(nextLevelOf(0)?.name).toBe('Explorador');
    expect(nextLevelOf(100)?.name).toBe('Desbravador');
    expect(nextLevelOf(1500)).toBeNull();
  });

  it('a barra anda dentro da faixa e enche no topo', () => {
    const meio = computeProgress([]); // 0 XP, faixa 0..100
    expect(meio.ratio).toBe(0);
    expect(meio.toNext).toBe(100);

    // Um Ancião: a barra fica cheia e não falta nada.
    const anciao = computeProgress(
      Array.from({ length: 12 }, (_, i) =>
        completed(`t${i}`, { destination: `d${i}`, country: `p${i}`, continent: `c${i}` })),
    );
    expect(anciao.level.name).toBe('Ancião do Clã');
    expect(anciao.nextLevel).toBeNull();
    expect(anciao.toNext).toBe(0);
    expect(anciao.ratio).toBe(1);
  });
});
