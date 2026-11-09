import { describe, it, expect } from 'vitest';
import {
  normalizePlaceName,
  createPlaceUsageTracker,
  pickReusableByGap,
} from '@/lib/placeIdentity';
import { validateItinerary } from '@/lib/itineraryValidator';
import { destinationActivities } from '@/data/destinationActivities';

describe('normalizePlaceName', () => {
  it('remove acentos e caixa', () => {
    expect(normalizePlaceName('Cabaña del Primo')).toBe('cabana del primo');
    expect(normalizePlaceName('Pôr do sol')).toBe('por do sol');
  });

  it('colapsa espaços redundantes', () => {
    expect(normalizePlaceName('  Coco   Bambu  ')).toBe('coco bambu');
  });

  it('remove o prefixo de refeição que a UI acrescenta', () => {
    expect(normalizePlaceName('Almoço: Cabaña del Primo')).toBe('cabana del primo');
    expect(normalizePlaceName('Jantar: Cabaña del Primo')).toBe('cabana del primo');
    expect(normalizePlaceName('Café: Tapioqueiras')).toBe('tapioqueiras');
  });

  it('tolera entrada vazia', () => {
    expect(normalizePlaceName('')).toBe('');
  });

  // A tabela exigida pela missão: o que DEVE colapsar e o que NÃO PODE colapsar.
  describe('tabela de identidade', () => {
    const collapses = (a: string, b: string) => normalizePlaceName(a) === normalizePlaceName(b);

    it('Cabaña del Primo (lunch) e Cabaña del Primo (dinner) COLAPSAM', () => {
      // for-cabana-del-primo × for-rest-cabana-del-primo — mesma casa, ids distintos
      expect(collapses('Cabaña del Primo', 'Cabaña del Primo')).toBe(true);
    });

    it('Coco Bambu Beira-Mar e Coco Bambu (Varjota) NÃO colapsam', () => {
      // casas REAIS distintas — devem poder coexistir na mesma viagem
      expect(collapses('Coco Bambu Beira-Mar', 'Coco Bambu (Varjota)')).toBe(false);
    });

    it('Praia de Iracema… e Pôr do sol… na Ponte dos Ingleses NÃO colapsam', () => {
      expect(
        collapses(
          'Praia de Iracema e Ponte dos Ingleses',
          'Pôr do sol e noite na Ponte dos Ingleses'
        )
      ).toBe(false);
    });
  });

  // Guarda de catálogo: toda colisão de nome normalizado dentro de uma cidade
  // precisa estar CLASSIFICADA aqui. Colisão nova (ou padronizar Coco Bambu
  // Beira-Mar como "Coco Bambu (Beira-Mar)") acusa antes de uma casa sumir
  // silenciosamente dos roteiros.
  //
  // DUAL: mesma casa real, papel diferente (almoço/café/jantar) — permitido.
  const DUAL_ROLE_PAIRS = [
    'Fortaleza::cabana del primo (for-cabana-del-primo + for-rest-cabana-del-primo)',
    'Foz do Iguaçu::castelo libanes (igu-castelo-libanes-almoco + igu-castelo-libanes-cafe)',
    'Foz do Iguaçu::vo bertila (igu-vo-bertila + igu-vo-bertila-jantar)',
    'Maceió::maria antonieta (mcz-maria-antonieta-cafe + mcz-maria-antonieta-jantar)',
    'Maceió::feirinha de pajucara (mcz-feirinha-pajucara-noite + mcz-tapioca-pajucara)',
    'Londres::dishoom (lon-dishoom + lon-dishoom-covent)',
  ];
  // DUPLICATA: mesmo lugar cadastrado duas vezes — a aposentar um id no kinu-beta
  // (M6d, RELATORIO-M6D). Ao aposentar, REMOVA a linha daqui.
  const KNOWN_DUPLICATES_PENDING_RETIREMENT = [
    'Paris::bouillon chartier (par-bouillon-chartier + paris-chartier)',
    "Paris::jardin d'acclimatation (par-jardin-acclimatation + par3-jardin-acclimatation)",
    'Tóquio::kappabashi (tok-kappabashi + tok3-kappabashi)',
    'Tóquio::teamlab planets (tok-teamlab-planets + tok3-teamlab-planets)',
    'Tokyo::kappabashi (tok-kappabashi + tok3-kappabashi)',
    'Tokyo::teamlab planets (tok-teamlab-planets + tok3-teamlab-planets)',
    'Lisboa::feira da ladra (lis-feira-da-ladra + lis2-feira-ladra)',
    'Salvador::boteco do franca (ssa-boteco-do-franca + ssa-boteco-franca)',
    'Buenos Aires::feria de mataderos (bue-feria-mataderos + bue2-mataderos)',
    'Cartagena::bovedas (ctg-bovedas + ctg-las-bovedas)',
    'Londres::sky garden (lon-sky-garden + lon6-sky-garden)',
  ];

  it('toda colisão de nome do catálogo está classificada (dual-role ou duplicata pendente)', () => {
    const collisions: string[] = [];
    for (const [city, data] of Object.entries(destinationActivities)) {
      const byName = new Map<string, string[]>();
      for (const activity of data.activities) {
        const key = normalizePlaceName(activity.name);
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(activity.id);
      }
      for (const [key, ids] of byName) {
        if (ids.length > 1) collisions.push(`${city}::${key} (${ids.join(' + ')})`);
      }
    }
    expect([...collisions].sort()).toEqual(
      [...DUAL_ROLE_PAIRS, ...KNOWN_DUPLICATES_PENDING_RETIREMENT].sort()
    );
  });

  it('Le Bouillon Chartier e Bouillon Chartier (1896) normalizam igual', () => {
    expect(normalizePlaceName('Le Bouillon Chartier')).toBe('bouillon chartier');
    expect(normalizePlaceName('Bouillon Chartier (1896)')).toBe(normalizePlaceName('Le Bouillon Chartier'));
  });

  it('artigo inicial e parênteses saem; o resto permanece', () => {
    expect(normalizePlaceName("L'As du Fallafel")).toBe('as du fallafel');
    expect(normalizePlaceName('O Pastéis de Nata')).toBe('pasteis de nata');
    expect(normalizePlaceName('The Ivy')).toBe('ivy');
    expect(normalizePlaceName('Coco Bambu (Varjota)')).toBe('coco bambu');
  });
});

describe('R5 — duplicata Chartier (M6d)', () => {
  const act = (name: string, timeSlot: string, time: string) =>
    ({ id: `x-${name}`, name, timeSlot, type: timeSlot, time, status: 'planned' });
  const day = (n: number, a: ReturnType<typeof act>) =>
    ({ dayNumber: n, date: `2026-11-${10 + n}`, label: `D${n}`, theme: '', activities: [a] });

  it('acusa quando os dois Chartier aparecem na mesma viagem', () => {
    const days = [
      day(3, act('Le Bouillon Chartier', 'dinner', '19:30')),
      day(5, act('Bouillon Chartier (1896)', 'lunch', '12:30')),
    ];
    const r5 = validateItinerary(days as never, { budget: 20000, travelInterests: [], destination: 'Paris' })
      .find((r) => r.rule === 'R5 NO DUPLICATES');
    expect(r5?.status).not.toBe('PASS');
    expect(r5?.detail).toContain('bouillon chartier');
  });
});

describe('createPlaceUsageTracker', () => {
  it('reconhece o mesmo lugar sob grafias diferentes', () => {
    const t = createPlaceUsageTracker();
    t.mark('Cabaña del Primo', 1);
    expect(t.isUsed('Cabaña del Primo')).toBe(true);
    expect(t.isUsed('Jantar: Cabaña del Primo')).toBe(true);
    expect(t.isUsed('Coco Bambu (Varjota)')).toBe(false);
  });

  it('gapSince devolve Infinity para inédito e a distância em dias para usado', () => {
    const t = createPlaceUsageTracker();
    expect(t.gapSince('Vojnilô (frutos do mar)', 4)).toBe(Infinity);
    t.mark('Vojnilô (frutos do mar)', 1);
    expect(t.gapSince('Vojnilô (frutos do mar)', 4)).toBe(3);
  });

  it('mark sobrescreve com o uso mais recente', () => {
    const t = createPlaceUsageTracker();
    t.mark('Varjota (bairro gastronômico)', 1);
    t.mark('Varjota (bairro gastronômico)', 5);
    expect(t.lastDayOf('Varjota (bairro gastronômico)')).toBe(5);
  });
});

describe('pickReusableByGap', () => {
  const cands = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

  it('prefere o usado há mais tempo', () => {
    const t = createPlaceUsageTracker();
    t.mark('A', 0);
    t.mark('B', 3);
    t.mark('C', 5);
    expect(pickReusableByGap(cands, t, 8)[0].name).toBe('A');
  });

  it('respeita o espaçamento de 3 dias quando possível', () => {
    const t = createPlaceUsageTracker();
    t.mark('A', 6); // gap 1 — consecutivo
    t.mark('B', 4); // gap 3 — aceitável
    const out = pickReusableByGap(cands.slice(0, 2), t, 7);
    expect(out.map((c) => c.name)).toEqual(['B']);
  });

  it('relaxa para não-consecutivo quando ninguém tem 3 dias de folga', () => {
    const t = createPlaceUsageTracker();
    t.mark('A', 6); // gap 1
    t.mark('B', 5); // gap 2
    const out = pickReusableByGap(cands.slice(0, 2), t, 7);
    expect(out.map((c) => c.name)).toEqual(['B']);
  });

  it('aceita consecutivo como último recurso em vez de devolver vazio', () => {
    const t = createPlaceUsageTracker();
    t.mark('A', 6);
    t.mark('B', 6);
    const out = pickReusableByGap(cands.slice(0, 2), t, 7);
    expect(out.length).toBe(2); // melhor jantar repetido que dia sem jantar
  });

  it('devolve vazio quando não há candidato nenhum', () => {
    expect(pickReusableByGap([], createPlaceUsageTracker(), 3)).toEqual([]);
  });

  it('no reuso, não escala como almoço a casa que já foi jantar', () => {
    // O buraco que o esgotamento abria: a unicidade por nome barra o Cabaña
    // del Primo no caminho inédito, mas o pool de almoço continha o id de
    // almoço da mesma casa e o reuso o servia como se fosse outro lugar.
    const t = createPlaceUsageTracker();
    t.mark('Cabaña del Primo', 3, 'dinner');
    t.mark('Coco Bambu Beira-Mar', 5, 'lunch');
    const lunchPool = [{ name: 'Cabaña del Primo' }, { name: 'Coco Bambu Beira-Mar' }];
    const out = pickReusableByGap(lunchPool, t, 11, 'lunch');
    expect(out.map((c) => c.name)).toEqual(['Coco Bambu Beira-Mar']);
  });

  it('cede o filtro de papel quando ele esvaziaria o slot', () => {
    // Almoço repetido que já foi jantar ainda é melhor que dia sem almoço.
    const t = createPlaceUsageTracker();
    t.mark('Cabaña del Primo', 3, 'dinner');
    const out = pickReusableByGap([{ name: 'Cabaña del Primo' }], t, 11, 'lunch');
    expect(out.map((c) => c.name)).toEqual(['Cabaña del Primo']);
  });

  it('uso gravado sem papel não bloqueia papel nenhum', () => {
    const t = createPlaceUsageTracker();
    t.mark('Cabaña del Primo', 3);
    expect(t.usedInOtherRole('Cabaña del Primo', 'lunch')).toBe(false);
    expect(t.usedInOtherRole('Cabaña del Primo', 'dinner')).toBe(false);
  });

  it('o papel viaja pelo nome normalizado, não pelo id', () => {
    const t = createPlaceUsageTracker();
    t.mark('Jantar: Cabaña del Primo', 3, 'dinner');
    expect(t.usedInOtherRole('cabana del primo', 'lunch')).toBe(true);
    expect(t.usedInOtherRole('cabana del primo', 'dinner')).toBe(false);
  });
});
