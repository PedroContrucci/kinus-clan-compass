// achievements — o catálogo da Camada Mundo e as contas que ele exige. PURO.
//
// Sem rede, sem storage, sem React, sem relógio: entra uma lista de eventos, sai o que está
// destravado e quanto XP isso vale. É o arquivo que responde "por que esta pessoa tem este
// troféu?" sem que ninguém precise abrir o banco.
//
// A FRONTEIRA É DE PROPÓSITO. Quem lê a tabela `events`, decide o que gravar e quando rodar é o
// `achievementEngine.ts`. Aqui não se sabe que existe um servidor — é o que permite testar os
// doze critérios com eventos sintéticos, sem mock nenhum.
//
// O CATÁLOGO É O DESENHO (DESENHO-CONQUISTAS-v2.md §3), não uma releitura dele. As duas linhas
// reservadas do §3 (primeiro_registro, album_do_cla) não estão aqui: são de memórias, 2027 — e
// troféu sem critério é troféu que nunca destrava, ocupando lugar na grade.
//
// O ÍNDICE DEDUPLICA POR trip_id. O `tripEvents` protege cada fato com uma marca na própria
// viagem, mas o motor não pode depender da higiene do emissor: a tabela é append-only e um
// dispositivo antigo, um F5 no meio de uma entrega ou uma migração futura podem deixar duas
// linhas do mesmo `trip.completed`. Uma viagem conta uma vez, aconteça o que acontecer.

/** Uma linha da tabela `events`, reduzida ao que o catálogo lê. */
export interface AchievementEvent {
  name: string;
  props: Record<string, unknown>;
}

/** Um troféu da Camada Mundo. */
export interface Achievement {
  /** Chave estável — é o que vai em `achievement.unlocked { key }` e o que fecha a idempotência. */
  key: string;
  name: string;
  /** O critério em UMA linha, para o troféu bloqueado dizer o que falta. */
  criterion: string;
  emoji: string;
  /** Merecido AGORA, olhando só o histórico. Nunca lança. */
  earned: (index: EventIndex) => boolean;
}

// ---------------------------------------------------------------------------
// Leitura defensiva das props — a tabela é jsonb, tudo que vem de lá é `unknown`
// ---------------------------------------------------------------------------

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

/** Viagem concluída, com o que o `trip.completed` carrega. */
interface CompletedTrip {
  destination: string;
  country: string;
  continent: string;
  days: number;
}

/** Os itens confirmados de uma viagem. `activities` é um Set porque `item_id` existe justamente
 *  para distinguir duas atividades da mesma viagem (tripEvents.ts). */
interface ConfirmedItems {
  flight: boolean;
  hotel: boolean;
  activities: Set<string>;
}

/**
 * O histórico do usuário organizado uma vez só.
 *
 * Doze critérios varrendo doze vezes a mesma lista não é só desperdício: é cada critério
 * decidindo por conta própria o que conta como "viagem concluída". Aqui essa decisão acontece
 * num lugar, e os critérios só leem.
 */
export interface EventIndex {
  /** trip_id -> dados da conclusão. Uma entrada por viagem, mesmo com linhas repetidas. */
  completed: Map<string, CompletedTrip>;
  /** trip_id -> crianças na ativação. `trip.completed` não carrega `children`; a ativação sim. */
  activated: Map<string, number>;
  /** trip_ids criados pelo KINU AI. */
  createdByAi: Set<string>;
  /** trip_ids que fecharam dentro do orçamento. */
  underBudget: Set<string>;
  /** trip_id -> o que foi confirmado nela. */
  items: Map<string, ConfirmedItems>;
}

/** Monta o índice. Evento torto entra sem `trip_id` e é ignorado — nunca lança. */
export function indexEvents(events: AchievementEvent[]): EventIndex {
  const index: EventIndex = {
    completed: new Map(),
    activated: new Map(),
    createdByAi: new Set(),
    underBudget: new Set(),
    items: new Map(),
  };

  for (const event of Array.isArray(events) ? events : []) {
    const props = (event?.props ?? {}) as Record<string, unknown>;
    const tripId = str(props.trip_id);
    if (!tripId) continue;

    switch (event.name) {
      case 'trip.completed':
        // `set` e não `has` antes: a última linha vence. Duas linhas da mesma viagem são a
        // mesma viagem, e a mais recente é a que tem o país certo se o catálogo mudou.
        index.completed.set(tripId, {
          destination: str(props.destination),
          country: str(props.country),
          continent: str(props.continent),
          days: num(props.days),
        });
        break;

      case 'trip.activated':
        index.activated.set(tripId, num(props.children));
        break;

      case 'trip.created':
        if (str(props.origin) === 'kinu_ai') index.createdByAi.add(tripId);
        break;

      case 'budget.closed_under':
        index.underBudget.add(tripId);
        break;

      case 'trip.item_confirmed': {
        const entry = index.items.get(tripId)
          ?? { flight: false, hotel: false, activities: new Set<string>() };
        const kind = str(props.kind);
        if (kind === 'flight') entry.flight = true;
        else if (kind === 'hotel') entry.hotel = true;
        else if (kind === 'activity') entry.activities.add(str(props.item_id));
        index.items.set(tripId, entry);
        break;
      }

      default:
        break;
    }
  }

  return index;
}

// ---------------------------------------------------------------------------
// Contas que mais de um critério usa
// ---------------------------------------------------------------------------

/** Os valores distintos e não-vazios de um campo das viagens concluídas. Destino sem país
 *  catalogado chega como `''` (geoOf omite a prop) e não pode contar como "mais um país". */
function distinct(index: EventIndex, field: keyof CompletedTrip): Set<string> {
  const values = new Set<string>();
  for (const trip of index.completed.values()) {
    const value = trip[field];
    if (typeof value === 'string' && value) values.add(value);
  }
  return values;
}

// ---------------------------------------------------------------------------
// Camada Mundo — 12 troféus ativos
// ---------------------------------------------------------------------------

export const WORLD_ACHIEVEMENTS: Achievement[] = [
  {
    key: 'primeira_fogueira',
    name: 'Primeira Fogueira',
    criterion: 'Ative sua primeira viagem',
    emoji: '🔥',
    earned: (i) => i.activated.size >= 1,
  },
  {
    key: 'pe_na_estrada',
    name: 'Pé na Estrada',
    criterion: 'Conclua sua primeira viagem',
    emoji: '🥾',
    earned: (i) => i.completed.size >= 1,
  },
  {
    key: 'cla_em_movimento',
    name: 'Clã em Movimento',
    criterion: 'Conclua uma viagem com crianças no clã',
    emoji: '👨‍👩‍👧',
    // O join que o §1 obriga: `trip.completed` não carrega `children`, só a ativação carrega.
    earned: (i) => [...i.completed.keys()].some((tripId) => (i.activated.get(tripId) ?? 0) > 0),
  },
  {
    key: 'maratonista',
    name: 'Maratonista do Clã',
    criterion: 'Conclua uma viagem de 10 dias ou mais',
    emoji: '🏃',
    earned: (i) => [...i.completed.values()].some((trip) => trip.days >= 10),
  },
  {
    key: 'bandeirante',
    name: 'Bandeirante',
    criterion: 'Conclua viagens a 3 destinos diferentes',
    emoji: '🧭',
    earned: (i) => distinct(i, 'destination').size >= 3,
  },
  {
    key: 'cartografo',
    name: 'Cartógrafo',
    criterion: 'Conclua viagens em 5 países diferentes',
    emoji: '🗺️',
    earned: (i) => distinct(i, 'country').size >= 5,
  },
  {
    key: 'cidadao_do_mundo',
    name: 'Cidadão do Mundo',
    criterion: 'Conclua viagens em 3 continentes diferentes',
    emoji: '🌍',
    earned: (i) => distinct(i, 'continent').size >= 3,
  },
  {
    key: 'raizes_fortes',
    name: 'Raízes Fortes',
    criterion: 'Conclua 3 viagens pelo Brasil',
    emoji: '🌳',
    earned: (i) => [...i.completed.values()].filter((trip) => trip.country === 'Brasil').length >= 3,
  },
  {
    key: 'capitao_do_orcamento',
    name: 'Capitão do Orçamento',
    criterion: 'Feche uma viagem dentro do orçamento',
    emoji: '🎯',
    earned: (i) => i.underBudget.size >= 1,
  },
  {
    key: 'tesoureiro_do_cla',
    name: 'Tesoureiro do Clã',
    criterion: 'Feche 3 viagens dentro do orçamento',
    emoji: '💰',
    earned: (i) => i.underBudget.size >= 3,
  },
  {
    key: 'tudo_no_lugar',
    name: 'Tudo no Lugar',
    // O §3 diz "antes da partida". Nenhum evento carrega a data de partida — `trip.activated`
    // tem `days`, não `startDate` —, então o critério mede o que É verificável: voo, hotel e
    // três atividades confirmados na MESMA viagem. Mudar isso é mudar a taxonomia do §1.
    criterion: 'Confirme voo, hotel e 3 atividades na mesma viagem',
    emoji: '📋',
    earned: (i) => [...i.items.values()].some(
      (items) => items.flight && items.hotel && items.activities.size >= 3,
    ),
  },
  {
    key: 'co_piloto',
    name: 'Co-piloto',
    criterion: 'Ative uma viagem criada pelo KINU AI',
    emoji: '🤖',
    earned: (i) => [...i.createdByAi].some((tripId) => i.activated.has(tripId)),
  },
];

/** O troféu de uma chave, quando ela é do catálogo. */
export function achievementOf(key: string): Achievement | undefined {
  return WORLD_ACHIEVEMENTS.find((a) => a.key === key);
}

// ---------------------------------------------------------------------------
// XP e níveis (§3)
// ---------------------------------------------------------------------------

/** O que vale cada coisa. Muda aqui, muda em todo lugar. */
export const XP = {
  completedTrip: 100,
  newCountry: 50,
  newContinent: 150,
  underBudget: 50,
  achievement: 25,
} as const;

export interface Level {
  name: string;
  /** XP mínimo da faixa. */
  min: number;
}

/** Da menor para a maior — `levelOf` percorre de trás para frente. */
export const LEVELS: Level[] = [
  { name: 'Aprendiz do Clã', min: 0 },
  { name: 'Explorador', min: 100 },
  { name: 'Desbravador', min: 300 },
  { name: 'Guardião das Rotas', min: 700 },
  { name: 'Ancião do Clã', min: 1500 },
];

/** A faixa de um XP. Nunca devolve `undefined`: a primeira faixa começa em zero. */
export function levelOf(xp: number): Level {
  let level = LEVELS[0];
  for (const candidate of LEVELS) {
    if (xp >= candidate.min) level = candidate;
  }
  return level;
}

/** A próxima faixa, ou `null` para quem já é Ancião. */
export function nextLevelOf(xp: number): Level | null {
  return LEVELS.find((candidate) => candidate.min > xp) ?? null;
}

export interface Progress {
  xp: number;
  /** As chaves merecidas, na ordem do catálogo. */
  unlocked: string[];
  /** Quantos troféus existem na Camada Mundo. */
  total: number;
  level: Level;
  nextLevel: Level | null;
  /** Quanto XP falta para a próxima faixa. `0` no topo. */
  toNext: number;
  /** 0..1 dentro da faixa atual — é o que a barra desenha. Topo é 1. */
  ratio: number;
}

/** As chaves merecidas por este histórico, na ordem do catálogo. */
export function unlockedKeys(events: AchievementEvent[]): string[] {
  const index = indexEvents(events);
  return WORLD_ACHIEVEMENTS.filter((a) => {
    try {
      return a.earned(index);
    } catch {
      // Um critério que lança não pode levar os outros onze junto.
      return false;
    }
  }).map((a) => a.key);
}

/**
 * Nível, XP e troféus deste histórico.
 *
 * O XP conta o que o §3 manda contar — e conta pelo ÍNDICE, não pela lista crua: país novo é
 * país distinto entre as viagens concluídas, não uma linha a mais na tabela.
 */
export function computeProgress(events: AchievementEvent[]): Progress {
  const index = indexEvents(events);
  const unlocked = WORLD_ACHIEVEMENTS.filter((a) => {
    try {
      return a.earned(index);
    } catch {
      return false;
    }
  }).map((a) => a.key);

  const xp =
    index.completed.size * XP.completedTrip
    + distinct(index, 'country').size * XP.newCountry
    + distinct(index, 'continent').size * XP.newContinent
    + index.underBudget.size * XP.underBudget
    + unlocked.length * XP.achievement;

  const level = levelOf(xp);
  const nextLevel = nextLevelOf(xp);
  const span = nextLevel ? nextLevel.min - level.min : 0;

  return {
    xp,
    unlocked,
    total: WORLD_ACHIEVEMENTS.length,
    level,
    nextLevel,
    toNext: nextLevel ? nextLevel.min - xp : 0,
    ratio: span > 0 ? (xp - level.min) / span : 1,
  };
}

/** O ponto de partida da UI antes da primeira leitura: ninguém tem nada. */
export const EMPTY_PROGRESS: Progress = computeProgress([]);
