import { describe, it, expect } from 'vitest';
import {
  normalizePlaceName,
  createPlaceUsageTracker,
  pickReusableByGap,
} from '@/lib/placeIdentity';
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

  // Guarda de catálogo: se alguém cadastrar duas casas reais com nome colidente,
  // ou padronizar Coco Bambu Beira-Mar como "Coco Bambu (Beira-Mar)", este teste
  // acusa antes que uma delas suma silenciosamente dos roteiros.
  it('o único par colidente do catálogo é Cabaña del Primo', () => {
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
    expect(collisions).toEqual([
      'Fortaleza::cabana del primo (for-cabana-del-primo + for-rest-cabana-del-primo)',
    ]);
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
});
