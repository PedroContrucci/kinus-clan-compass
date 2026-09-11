// A coordenada curada vem antes do geocoding por texto — e a trava de deriva do artefato.
//
// O QUE ESTA SUÍTE PROVA, e por quê: o Gran Marquise fica na Beira-Mar do Mucuripe e a Rota do
// Dia o desenhava seis quadras para dentro do Meireles, porque geocodificava o nome dele no
// Nominatim. A regra nova é de precedência, e precedência só se testa provando que o degrau
// de baixo **não foi pisado**: por isso os testes contam chamadas do fallback, não só valores.
//
// O `fallback` injetado aqui é o mesmo papel que o `geocodeByName` do `DailyRouteMap` cumpre —
// a cadeia ATTRACTION_COORDS -> Nominatim inteira. Injetar em vez de importar é o que permite
// exercitar a decisão sem montar Leaflet e sem tocar a rede.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/data/generated/coords', () => ({
  CURATED_COORDS: {
    'for-mercado-peixes': { lat: -3.716, lng: -38.479 },
    'for-h-gran-marquise': { lat: -3.7284, lng: -38.4869 },
  },
}));

const { curatedCoordOf, resolveStopCoord } = await import('@/lib/routeCoords');

const ARTIFACT = resolve(__dirname, '../data/generated/coords.ts');
const CURADA = { lat: -3.716, lng: -38.479 };
const DO_NOMINATIM = { lat: -3.73, lng: -38.52 };

/** Um dublê do `geocodeByName`: devolve sempre a mesma coisa e conta quantas vezes foi chamado. */
const spyFallback = () => vi.fn(async () => DO_NOMINATIM);

describe('resolveStopCoord — coordenada curada antes do Nominatim', () => {
  it('usa a coordenada curada e NÃO chama o geocoding por nome', async () => {
    const fallback = spyFallback();
    const coord = await resolveStopCoord(
      { id: 'day-3-for-mercado-peixes', name: 'Mercado dos Peixes' },
      'Fortaleza',
      fallback
    );
    expect(coord).toEqual(CURADA);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('casa pelo id do catálogo, não pelo nome — nome de tela pode mudar', async () => {
    const fallback = spyFallback();
    const coord = await resolveStopCoord(
      // O nome foi reescrito pelo usuário; o id continua o mesmo.
      { id: 'day-12-for-mercado-peixes', name: '🐟 Jantar: peixe frito na beira' },
      'Fortaleza',
      fallback
    );
    expect(coord).toEqual(CURADA);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('item sem coordenada curada cai no fallback, uma vez', async () => {
    const fallback = spyFallback();
    const coord = await resolveStopCoord(
      { id: 'day-1-for-praia-futuro', name: 'Praia do Futuro' },
      'Fortaleza',
      fallback
    );
    expect(coord).toEqual(DO_NOMINATIM);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith('Praia do Futuro', 'Fortaleza');
  });

  it('item sintético do gerador, sem id de catálogo, cai no fallback', async () => {
    const fallback = spyFallback();
    // `free-morning`/`ambient-walk` não têm par no catálogo; e há itens sem id nenhum.
    expect(await resolveStopCoord({ id: 'day-2-free-morning', name: 'Manhã livre' }, 'Fortaleza', fallback))
      .toEqual(DO_NOMINATIM);
    expect(await resolveStopCoord({ name: 'Passeio pela orla' }, 'Fortaleza', fallback))
      .toEqual(DO_NOMINATIM);
    expect(fallback).toHaveBeenCalledTimes(2);
  });

  it('devolve null quando nem o curado nem o fallback acham o lugar', async () => {
    const fallback = vi.fn(async () => null);
    expect(await resolveStopCoord({ name: 'Lugar que não existe' }, 'Fortaleza', fallback)).toBeNull();
  });
});

describe('curatedCoordOf — o id do hotel curado passa inteiro', () => {
  it('acha o hotel pelo `curatedHotelId`, sem prefixo de dia', () => {
    expect(curatedCoordOf('for-h-gran-marquise')).toEqual({ lat: -3.7284, lng: -38.4869 });
  });

  it('devolve null para id ausente, vazio ou de outro tipo', () => {
    expect(curatedCoordOf(undefined)).toBeNull();
    expect(curatedCoordOf('')).toBeNull();
    expect(curatedCoordOf(7)).toBeNull();
    expect(curatedCoordOf('for-h-vila-gale')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Trava de deriva do artefato — sem mock, lendo o arquivo real do disco
// ---------------------------------------------------------------------------
//
// Mesmo limite declarado do `landmarkTiersArtifact.test.ts`: a suíte não tem (nem deve ter) a
// service key, então não confere o artefato contra o banco. Confere o que dá offline — que o
// arquivo é gerado, que todo id dele ainda existe no app, e que toda coordenada é plausível.

describe('artefato de coordenadas (src/data/generated/coords.ts)', () => {
  it('não é editado à mão', () => {
    expect(readFileSync(ARTIFACT, 'utf8')).toContain('GERADO por scripts/sync-catalog.ts');
  });

  it('todo id ainda existe no catálogo ou entre os hotéis curados, e a coordenada é plausível', async () => {
    // Import dinâmico e sem o mock deste arquivo: `vi.importActual` lê o módulo real.
    const { CURATED_COORDS } = await vi.importActual<typeof import('@/data/generated/coords')>(
      '@/data/generated/coords'
    );
    const { destinationActivities } = await import('@/data/destinationActivities');
    const { curatedHotels } = await import('@/data/curatedHotels');

    const conhecidos = new Set<string>();
    for (const dest of Object.values(destinationActivities)) {
      for (const act of dest.activities) conhecidos.add(act.id);
    }
    for (const lista of Object.values(curatedHotels)) {
      for (const hotel of lista) conhecidos.add(hotel.id);
    }

    for (const [id, c] of Object.entries(CURATED_COORDS)) {
      expect(conhecidos.has(id), `id '${id}' do artefato não existe mais em src/data/`).toBe(true);
      expect(Number.isFinite(c.lat) && Number.isFinite(c.lng), `'${id}': coordenada não numérica`).toBe(true);
      expect(Math.abs(c.lat), `'${id}': lat fora de faixa`).toBeLessThanOrEqual(90);
      expect(Math.abs(c.lng), `'${id}': lng fora de faixa`).toBeLessThanOrEqual(180);
      // 0,0 é o golfo da Guiné: nenhuma cidade curada mora lá, então é enrich que falhou.
      expect(c.lat === 0 && c.lng === 0, `'${id}': coordenada 0,0`).toBe(false);
    }
  });
});
