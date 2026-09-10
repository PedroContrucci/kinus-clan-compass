// Camada Local — os 5 moldes do §4, cada um NO LIMIAR, sobre os ids que a pessoa viveu.
//
// Sem `vi.mock`: a camada é pura, então o teste é a lista de eventos e a resposta do troféu.
// Os ids usados aqui são os REAIS de Fortaleza (`src/data/generated/landmarkTiers.ts`) — id
// inventado passaria por qualquer bug de casamento sem levantar a mão.
//
// O QUE ESTA SUÍTE PROTEGE, além dos limiares: o formato do `trip.checkin` provado em
// 10/09/2026, em que `lived_ids` chega como STRING com vírgula, e a extração do id do
// catálogo de dentro do id do item de roteiro (`day-1-for-mercado-peixes`).
import { describe, it, expect } from 'vitest';
import { computeProgress, indexEvents, unlockedKeys, type AchievementEvent } from '@/lib/achievements';
import {
  catalogIdOf,
  localAchievementsOf,
  LOCAL_ACHIEVEMENTS,
  LOCAL_CITIES,
  resolveCity,
  splitList,
} from '@/lib/localAchievements';
import { LANDMARKS } from '@/data/generated/landmarkTiers';

// --- os ids reais de Fortaleza ---------------------------------------------

const ICONE = 'for-beach-park';
const ESSENCIAIS = [
  'for-praia-futuro-manha',
  'for-mercado-central',
  'for-cumbuco-manha',
  'for-dragao-do-mar',
  'for-praia-iracema',
  'for-beira-mar',
];
const SEGREDO = 'for-mercado-peixes';
/** Três gastronômicos SEM tier — para o Garfo não pegar carona no Coração. */
const COMIDA = ['for-coco-bambu-beira-mar', 'for-carneiro-ordones', 'for-cemoara'];

// --- construtores de fato ---------------------------------------------------

const completed = (tripId: string, destination = 'Fortaleza'): AchievementEvent => ({
  name: 'trip.completed',
  props: { trip_id: tripId, destination, country: 'Brasil', continent: 'Américas', days: 5 },
});

/** O check-in COMO ELE CHEGA: `lived_ids` string com vírgula, `lived_names` com ' | '. */
const checkin = (
  tripId: string,
  ids: string[],
  over: Record<string, unknown> = {},
): AchievementEvent => ({
  name: 'trip.checkin',
  props: {
    trip_id: tripId,
    city: 'Fortaleza',
    lived_ids: ids.map((id) => `day-1-${id}`).join(','),
    lived_names: ids.map((id) => `Nome de ${id}`).join(' | '),
    skipped: 2,
    note_len: 0,
    ...over,
  },
});

const item = (tripId: string, itemId: string): AchievementEvent => ({
  name: 'trip.item_confirmed',
  props: { trip_id: tripId, kind: 'activity', item_id: `day-2-${itemId}` },
});

const has = (events: AchievementEvent[], key: string) => unlockedKeys(events).includes(key);

// --- leitura do que veio do check-in ---------------------------------------

describe('splitList — o `lived_ids` chega como string, não como array', () => {
  it('quebra a string na vírgula e apara o espaço', () => {
    expect(splitList('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  it('quebra `lived_names` no separador dele', () => {
    expect(splitList('Torre Eiffel | Louvre | Sena', '|')).toEqual(['Torre Eiffel', 'Louvre', 'Sena']);
  });

  it('aceita array também — o emissor pode ser corrigido amanhã sem perder o histórico', () => {
    expect(splitList(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('vazio, nulo e número viram lista vazia, sem lançar', () => {
    expect(splitList('')).toEqual([]);
    expect(splitList(null)).toEqual([]);
    expect(splitList(undefined)).toEqual([]);
    expect(splitList(42)).toEqual([]);
    expect(splitList(',,, ,')).toEqual([]);
  });
});

describe('catalogIdOf — o id do catálogo dentro do id do item de roteiro', () => {
  it('tira o prefixo do dia', () => {
    expect(catalogIdOf('day-1-for-mercado-peixes')).toBe('for-mercado-peixes');
  });

  it('tira o prefixo de dia com dois dígitos', () => {
    expect(catalogIdOf('day-12-paris-louvre')).toBe('paris-louvre');
  });

  it('deixa o id já cru em paz', () => {
    expect(catalogIdOf('for-mercado-peixes')).toBe('for-mercado-peixes');
  });

  it('tira só o PRIMEIRO prefixo — o resto do id é do catálogo', () => {
    expect(catalogIdOf('day-3-day-tour')).toBe('day-tour');
  });

  it('não lança com lixo', () => {
    expect(catalogIdOf(null)).toBe('');
    expect(catalogIdOf(7)).toBe('');
  });
});

describe('resolveCity — o texto do evento vira cidade canônica', () => {
  it('casa a cidade curada', () => {
    expect(resolveCity('Fortaleza')).toBe('Fortaleza');
  });

  it('casa os apelidos que o catálogo carrega', () => {
    expect(resolveCity('Tokyo')).toBe('Tóquio');
    expect(resolveCity('Rome')).toBe('Roma');
  });

  it('ignora caixa e acento', () => {
    expect(resolveCity('tóquio')).toBe('Tóquio');
    expect(resolveCity('TOQUIO')).toBe('Tóquio');
  });

  it('não casa por pedaço — "Porto" não é "Porto Seguro"', () => {
    expect(resolveCity('Porto')).toBeNull();
  });

  it('cidade fora das classificadas não resolve', () => {
    expect(resolveCity('Praga')).toBeNull();
    expect(resolveCity('')).toBeNull();
    expect(resolveCity(null)).toBeNull();
  });
});

// --- os cinco moldes, no limiar --------------------------------------------

describe('Carimbo', () => {
  it('sai da primeira viagem CONCLUÍDA na cidade', () => {
    expect(has([completed('t1')], 'local.fortaleza.carimbo')).toBe(true);
  });

  it('não sai de check-in sem conclusão — carimbo é de viagem concluída', () => {
    expect(has([checkin('t1', [ICONE])], 'local.fortaleza.carimbo')).toBe(false);
  });

  it('não sai para cidade que não é das classificadas', () => {
    const keys = unlockedKeys([completed('t1', 'Praga')]);
    expect(keys.filter((k) => k.startsWith('local.'))).toEqual([]);
  });
});

describe('Ícone', () => {
  it('sai com o item `icon` vivido', () => {
    expect(has([completed('t1'), checkin('t1', [ICONE])], 'local.fortaleza.icone')).toBe(true);
  });

  it('não sai com oito essenciais e nenhum ícone', () => {
    expect(has([completed('t1'), checkin('t1', ESSENCIAIS)], 'local.fortaleza.icone')).toBe(false);
  });

  it('tem nome próprio, não template', () => {
    const icone = localAchievementsOf('Fortaleza').find((a) => a.key.endsWith('.icone'));
    expect(icone?.name).toBe('Rei das Marés');
  });
});

describe('Coração', () => {
  it('4 essenciais NÃO fazem, 5 fazem', () => {
    const quatro = [completed('t1'), checkin('t1', ESSENCIAIS.slice(0, 4))];
    const cinco = [completed('t1'), checkin('t1', ESSENCIAIS.slice(0, 5))];

    expect(has(quatro, 'local.fortaleza.coracao')).toBe(false);
    expect(has(cinco, 'local.fortaleza.coracao')).toBe(true);
  });

  it('o mesmo essencial repetido continua sendo um', () => {
    const events = [completed('t1'), checkin('t1', [...ESSENCIAIS.slice(0, 4), ESSENCIAIS[0]])];
    expect(has(events, 'local.fortaleza.coracao')).toBe(false);
  });

  it('ACUMULA entre viagens na mesma cidade — 3 numa, 2 na outra', () => {
    const events = [
      completed('t1'),
      checkin('t1', ESSENCIAIS.slice(0, 3)),
      completed('t2'),
      checkin('t2', ESSENCIAIS.slice(3, 5)),
    ];
    expect(has(events, 'local.fortaleza.coracao')).toBe(true);
  });
});

describe('Garfo', () => {
  it('2 gastronômicos NÃO fazem, 3 fazem', () => {
    const dois = [completed('t1'), checkin('t1', COMIDA.slice(0, 2))];
    const tres = [completed('t1'), checkin('t1', COMIDA)];

    expect(has(dois, 'local.fortaleza.garfo')).toBe(false);
    expect(has(tres, 'local.fortaleza.garfo')).toBe(true);
  });

  it('conta comida do catálogo, não item local do roteiro', () => {
    const events = [
      completed('t1'),
      checkin('t1', [...COMIDA.slice(0, 2), 'breakfast-hotel', 'dinner-michelin']),
    ];
    expect(has(events, 'local.fortaleza.garfo')).toBe(false);
  });
});

describe('Segredo', () => {
  it('um `hidden_gem` basta', () => {
    expect(has([completed('t1'), checkin('t1', [SEGREDO])], 'local.fortaleza.segredo')).toBe(true);
  });

  it('nenhum `hidden_gem` não faz, por mais essenciais que tenha', () => {
    expect(has([completed('t1'), checkin('t1', ESSENCIAIS)], 'local.fortaleza.segredo')).toBe(false);
  });
});

// --- fonte da verdade: check-in > confirmado --------------------------------

describe('fonte da vivência', () => {
  it('sem check-in, o item confirmado em viagem CONCLUÍDA vale', () => {
    const events = [completed('t1'), ...COMIDA.map((id) => item('t1', id))];
    expect(has(events, 'local.fortaleza.garfo')).toBe(true);
  });

  it('item confirmado SEM conclusão não vale — confirmar não é viver', () => {
    const events = COMIDA.map((id) => item('t1', id));
    expect(has(events, 'local.fortaleza.garfo')).toBe(false);
  });

  it('havendo check-in, o confirmado da MESMA viagem não entra pela porta dos fundos', () => {
    const events = [
      completed('t1'),
      // Confirmou os três restaurantes…
      ...COMIDA.map((id) => item('t1', id)),
      // …mas no check-in disse que só viveu um.
      checkin('t1', [COMIDA[0]]),
    ];
    expect(has(events, 'local.fortaleza.garfo')).toBe(false);
  });

  it('viagem com check-in não apaga o fallback de OUTRA viagem', () => {
    const events = [
      completed('t1'),
      checkin('t1', [COMIDA[0]]),
      completed('t2'),
      ...COMIDA.slice(1).map((id) => item('t2', id)),
    ];
    expect(has(events, 'local.fortaleza.garfo')).toBe(true);
  });

  it('check-in sem `city` cai no destino da viagem concluída', () => {
    const events = [completed('t1'), checkin('t1', [SEGREDO], { city: '' })];
    expect(has(events, 'local.fortaleza.segredo')).toBe(true);
  });

  it('dois envios do mesmo check-in UNEM os ids em vez de o último vencer', () => {
    const events = [
      completed('t1'),
      checkin('t1', ESSENCIAIS.slice(0, 3)),
      checkin('t1', ESSENCIAIS.slice(3, 5)),
    ];
    expect(has(events, 'local.fortaleza.coracao')).toBe(true);
  });

  it('o item vivido numa cidade não conta para outra', () => {
    const events = [completed('t1', 'Lisboa'), checkin('t1', [SEGREDO], { city: 'Lisboa' })];
    expect(has(events, 'local.fortaleza.segredo')).toBe(false);
    expect(has(events, 'local.lisboa.segredo')).toBe(false);
  });
});

// --- o catálogo dinâmico e o XP --------------------------------------------

describe('o catálogo local', () => {
  it('é 5 moldes por cidade classificada, sem número escrito à mão', () => {
    expect(LOCAL_CITIES).toHaveLength(21);
    expect(LOCAL_ACHIEVEMENTS).toHaveLength(5 * LOCAL_CITIES.length);
  });

  it('as chaves são únicas e no formato `local.<slug>.<molde>`', () => {
    const keys = LOCAL_ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^local\.[a-z0-9-]+\.(carimbo|icone|coracao|garfo|segredo)$/);
  });

  it('as 21 cidades têm nome-ícone próprio — nenhuma cai no template', () => {
    for (const city of LOCAL_CITIES) {
      const icone = localAchievementsOf(city)[1];
      expect(icone.name).not.toBe(`Ícone de ${city}`);
    }
  });

  it('as 21 têm garfo batizado; só Orlando usa o nome da cidade, e de propósito', () => {
    const genericos = LOCAL_CITIES.filter(
      (city) => localAchievementsOf(city)[3].name === `Garfo de ${city}`,
    );
    expect(genericos).toEqual(['Orlando']);
  });

  it('nenhum critério lança, nem com índice vazio', () => {
    const vazio = indexEvents([]);
    for (const achievement of LOCAL_ACHIEVEMENTS) {
      expect(() => achievement.earned(vazio)).not.toThrow();
      expect(achievement.earned(vazio)).toBe(false);
    }
  });
});

describe('XP da Camada Local', () => {
  it('Coração e Segredo valem 50; Carimbo, Ícone e Garfo valem 25', () => {
    const [carimbo, icone, coracao, garfo, segredo] = localAchievementsOf('Fortaleza');
    expect([carimbo.xp, icone.xp, coracao.xp, garfo.xp, segredo.xp]).toEqual([25, 25, 50, 25, 50]);
  });

  it('a soma usa o valor do molde, não 25 para todo mundo', () => {
    const so = computeProgress([completed('t1')]);
    const comSegredo = computeProgress([completed('t1'), checkin('t1', [SEGREDO])]);

    // +50 do Segredo. Nada mais mudou: um id não faz Coração, Garfo nem Ícone.
    expect(comSegredo.xp - so.xp).toBe(50);
  });

  it('o total conta as duas camadas', () => {
    expect(computeProgress([]).total).toBe(12 + 5 * LOCAL_CITIES.length);
  });
});

describe('visitedCities — o que a UI abre em "Por destino"', () => {
  it('traz a cidade da viagem concluída, na ordem do catálogo', () => {
    const events = [completed('t1'), completed('t2', 'Lisboa')];
    expect(computeProgress(events).visitedCities).toEqual(['Fortaleza', 'Lisboa']);
  });

  it('traz a cidade do check-in mesmo antes da varredura de conclusão', () => {
    expect(computeProgress([checkin('t1', [ICONE])]).visitedCities).toEqual(['Fortaleza']);
  });

  it('cidade não classificada não aparece', () => {
    expect(computeProgress([completed('t1', 'Praga')]).visitedCities).toEqual([]);
  });
});

// --- invariante -------------------------------------------------------------

describe('invariante: nada aqui lança', () => {
  it('sobrevive a check-in torto', () => {
    const tortos: AchievementEvent[] = [
      { name: 'trip.checkin', props: { trip_id: 't1' } },
      { name: 'trip.checkin', props: { trip_id: 't1', city: 42, lived_ids: {} } },
      { name: 'trip.checkin', props: {} },
      { name: 'trip.checkin', props: null as unknown as Record<string, unknown> },
    ];
    expect(() => computeProgress(tortos)).not.toThrow();
    expect(computeProgress(tortos).unlocked).toEqual([]);
  });

  it('o retroativo de Fortaleza: uma viagem concluída + o check-in de hoje', () => {
    // O caso real que motivou a missão — mercado dos peixes vivido, o resto skipado.
    const events = [completed('t1'), checkin('t1', [SEGREDO])];
    const keys = unlockedKeys(events).filter((k) => k.startsWith('local.'));

    expect(keys).toEqual(['local.fortaleza.carimbo', 'local.fortaleza.segredo']);
  });

  it('os ids do teste ainda são o que o arquivo gerado diz que são', () => {
    // Se a curadoria reclassificar `for-mercado-peixes`, esta suíte inteira vira teatro —
    // melhor descobrir aqui do que ver os limiares passando por acidente.
    const forta = LANDMARKS['Fortaleza'];
    expect(forta.tiers[ICONE]).toBe('icon');
    expect(forta.tiers[SEGREDO]).toBe('hidden_gem');
    for (const id of ESSENCIAIS) expect(forta.tiers[id]).toBe('essential');
    for (const id of COMIDA) {
      expect(forta.food).toContain(id);
      expect(forta.tiers[id]).toBeUndefined();
    }
  });
});
