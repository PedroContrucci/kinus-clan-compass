// Trava de deriva do artefato de tiers.
//
// `src/data/generated/landmarkTiers.ts` é escrito pelo `sync-catalog.ts --apply` a partir da
// coluna `landmark_tier` de `curated_activities`. O catálogo do app anda (id renomeado, item
// aposentado) e o artefato fica para trás: o troféu passa a apontar para um item que não
// existe mais, e ninguém descobre porque troféu que não destrava não reclama.
//
// O LIMITE, DECLARADO: ao contrário do `kinuCatalogArtifact.test.ts`, esta suíte NÃO chama o
// gerador em modo `--check`. Não dá: o `landmark_tier` só existe no banco, e reconstruir o
// arquivo exigiria a `KINU_BETA_SERVICE_KEY` — que a suíte não tem, e não deve ter. Teste que
// bate na rede é teste que quebra no avião, e num CI sem credencial ele passaria por omissão,
// que é pior. Então travamos tudo que é conferível OFFLINE, contra `src/data/`:
//
//   1. as 21 cidades curadas estão lá, e só elas
//   2. todo id do artefato ainda existe no catálogo do app
//   3. `food` é EXATAMENTE a gastronomia do catálogo (igualdade de conjunto)
//   4. cada cidade fecha os limiares dos cinco moldes do §4
//   5. os 21 slugs, literais — a chave do troféu vai para a tabela `events` e fica lá
//
// O que sobra de fora é o tier ter mudado no banco sem `--apply`. Para esse, o conserto é o
// mesmo de sempre: rodar o sync.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LANDMARKS } from '@/data/generated/landmarkTiers';
import { destinationActivities } from '@/data/destinationActivities';
import { CURATED_CITIES } from '@/lib/curatedCities';

const ARTIFACT = resolve(__dirname, '../data/generated/landmarkTiers.ts');
const FOOD = new Set(['breakfast', 'lunch', 'dinner']);

/** As atividades do catálogo do app para uma cidade canônica. */
const catalogOf = (city: string) => destinationActivities[city]?.activities ?? [];

describe('artefato de tiers (src/data/generated/landmarkTiers.ts)', () => {
  it('não é editado à mão', () => {
    expect(readFileSync(ARTIFACT, 'utf8')).toContain('GERADO por scripts/sync-catalog.ts');
  });

  it('cobre as 21 cidades curadas, e só elas', () => {
    expect(Object.keys(LANDMARKS).sort()).toEqual([...CURATED_CITIES].sort());
  });

  it('os 21 slugs são estes — chave de troféu não muda depois de gravada', () => {
    const slugs = Object.fromEntries(
      Object.entries(LANDMARKS).map(([city, data]) => [city, data.slug]),
    );
    expect(slugs).toEqual({
      'Paris': 'paris',
      'Fortaleza': 'fortaleza',
      'Rio de Janeiro': 'rio-de-janeiro',
      'Lisboa': 'lisboa',
      'Orlando': 'orlando',
      'Tóquio': 'toquio',
      'Roma': 'roma',
      'Salvador': 'salvador',
      'Buenos Aires': 'buenos-aires',
      'Cartagena': 'cartagena',
      'Nova York': 'nova-york',
      'Gramado': 'gramado',
      'Londres': 'londres',
      'Barcelona': 'barcelona',
      'Porto Seguro': 'porto-seguro',
      'Dubai': 'dubai',
      'Cidade do Cabo': 'cidade-do-cabo',
      'Istambul': 'istambul',
      'Bangkok': 'bangkok',
      'Marrakech': 'marrakech',
      'Singapura': 'singapura',
    });
  });

  it('todo id classificado ainda existe no catálogo do app', () => {
    const orfaos: string[] = [];
    for (const [city, data] of Object.entries(LANDMARKS)) {
      const ids = new Set(catalogOf(city).map((a) => a.id));
      for (const id of Object.keys(data.tiers)) if (!ids.has(id)) orfaos.push(`${city}/${id}`);
    }
    expect(orfaos).toEqual([]);
  });

  it('`food` é exatamente a gastronomia do catálogo — nem a mais, nem a menos', () => {
    for (const [city, data] of Object.entries(LANDMARKS)) {
      const doCatalogo = catalogOf(city)
        .filter((a) => FOOD.has(a.category))
        .map((a) => a.id)
        .sort();
      expect([...data.food].sort(), `food de ${city}`).toEqual(doCatalogo);
    }
  });

  it('cada cidade fecha os limiares dos cinco moldes do §4', () => {
    for (const [city, data] of Object.entries(LANDMARKS)) {
      const tiers = Object.values(data.tiers);
      const conta = (t: string) => tiers.filter((v) => v === t).length;

      expect(conta('icon'), `icon de ${city}`).toBe(1);
      expect(conta('essential'), `essential de ${city}`).toBeGreaterThanOrEqual(5);
      expect(conta('hidden_gem'), `hidden_gem de ${city}`).toBeGreaterThanOrEqual(1);
      expect(data.food.length, `gastronomia de ${city}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('os apelidos apontam para a cidade certa no registry do catálogo', () => {
    for (const [city, data] of Object.entries(LANDMARKS)) {
      expect(data.aliases, `aliases de ${city}`).toContain(city);
      for (const alias of data.aliases) {
        // Apelido e canônico têm que ser o MESMO array de atividades — é isso que faz
        // `city: 'Tokyo'` no check-in cair em 'Tóquio' sem tabela de sinônimos à mão.
        expect(destinationActivities[alias]?.activities).toBe(destinationActivities[city]?.activities);
      }
    }
  });
});
