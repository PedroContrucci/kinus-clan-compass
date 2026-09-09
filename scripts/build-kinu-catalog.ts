#!/usr/bin/env tsx
/**
 * build-kinu-catalog.ts — gera o artefato de catálogo que viaja com a edge function.
 *
 * Lê `src/data/destinationActivities.ts` + `src/data/curatedHotels.ts` e escreve
 * `supabase/functions/kinu-ai/catalog.ts`, que a ferramenta `consultar_catalogo`
 * importa. É assim que o agente responde sobre QUALQUER cidade curada, com ou sem
 * viagem ativa no app.
 *
 * **Roda sem credencial nenhuma.** Ao contrário do `sync-catalog.ts` (que precisa da
 * `KINU_BETA_SERVICE_KEY` no `.env.sync` para ler o banco), este script só transforma
 * arquivos que já estão no repositório — qualquer um reproduz o artefato e confere.
 * A service key do kinu-beta NUNCA chega perto de `supabase/functions/`.
 *
 * Formato `.ts` e não `.json` de propósito: import de módulo é o mecanismo já provado
 * neste deploy (`_shared/telemetry.ts`, arco 5.e). Um `import ... with { type: 'json' }`
 * que o bundler não inclua não degrada a function — mata (lição do 5.d §7.1).
 *
 * Uso:
 *   npx tsx scripts/build-kinu-catalog.ts           # escreve o artefato
 *   npx tsx scripts/build-kinu-catalog.ts --check   # só verifica se está atualizado
 *
 * O `--check` é o que a suíte `kinuCatalogArtifact.test.ts` usa como trava de deriva:
 * catálogo velho servido com cara de novo é o defeito de hoje ao contrário.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { destinationActivities } from '../src/data/destinationActivities';
import { curatedHotels } from '../src/data/curatedHotels';
import { CURATED_CITIES } from '../src/lib/curatedCities';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'supabase/functions/kinu-ai/catalog.ts');

/** Máximos espelhados do que a function já aceita do front, para o texto não divergir. */
const MAX_ITEMS = 80;
const MAX_HOTELS = 30;
const MAX_TIPS = 2;

/**
 * Formas curtas e nomes em inglês que o modelo pode emitir e que não existem como
 * chave em `destinationActivities`. Os apelidos que JÁ existem lá ('Tokyo', 'Rome')
 * são colhidos automaticamente por `cityCode` — não estão nesta lista.
 */
const EXTRA_ALIASES: Record<string, string> = {
  'rio': 'Rio de Janeiro',
  'new york': 'Nova York',
  'nova iorque': 'Nova York',
  'istanbul': 'Istambul',
  'cape town': 'Cidade do Cabo',
  'lisbon': 'Lisboa',
  'london': 'Londres',
  'singapore': 'Singapura',
  'marrakesh': 'Marrakech',
};

/** minúsculo, sem diacríticos, espaços colapsados. Mesma normalização da function. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function die(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function build(): string {
  const faltando = CURATED_CITIES.filter((c) => !destinationActivities[c]);
  if (faltando.length > 0) {
    die(`cidades curadas sem entrada em destinationActivities: ${faltando.join(', ')}`);
  }

  const cities: Record<string, unknown> = {};
  for (const city of CURATED_CITIES) {
    const data = destinationActivities[city];
    cities[city] = {
      city,
      items: data.activities.slice(0, MAX_ITEMS).map((a) => ({
        name: a.name,
        category: a.category,
        neighborhood: a.neighborhood,
        costBRL: typeof a.estimatedCostBRL === 'number' ? a.estimatedCostBRL : null,
        tip: (a.tips ?? []).slice(0, MAX_TIPS).join(' · '),
      })),
      hotels: (curatedHotels[city] ?? []).slice(0, MAX_HOTELS).map((h) => ({
        name: h.name,
        zone: h.zone,
        tier: h.tier,
        personaTags: h.personaTags.slice(0, 5),
        priceRangeBRL: h.priceRangeBRL,
        tip: h.tips.slice(0, MAX_TIPS).join(' · '),
      })),
    };
  }

  // Índice de busca: a forma canônica, mais os apelidos que já existem nos dados
  // (mesma cityCode = mesma cidade: 'Tokyo'->'Tóquio', 'Rome'->'Roma'), mais as
  // formas curtas do EXTRA_ALIASES. Tudo normalizado sem acento.
  const index: Record<string, string> = {};
  for (const city of CURATED_CITIES) index[normalize(city)] = city;

  for (const [key, data] of Object.entries(destinationActivities)) {
    if (CURATED_CITIES.includes(key)) continue;
    const canonical = CURATED_CITIES.find((c) => destinationActivities[c]?.cityCode === data.cityCode);
    if (canonical) index[normalize(key)] = canonical;
  }

  for (const [alias, canonical] of Object.entries(EXTRA_ALIASES)) {
    if (!CURATED_CITIES.includes(canonical)) die(`EXTRA_ALIASES aponta para cidade não curada: ${canonical}`);
    index[normalize(alias)] = canonical;
  }

  const sortedIndex = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));

  const totalItems = CURATED_CITIES.reduce((n, c) => n + (cities[c] as { items: unknown[] }).items.length, 0);
  const totalHotels = CURATED_CITIES.reduce((n, c) => n + (cities[c] as { hotels: unknown[] }).hotels.length, 0);

  return `// GERADO por scripts/build-kinu-catalog.ts — NÃO EDITAR À MÃO.
// Fonte: src/data/destinationActivities.ts + src/data/curatedHotels.ts
// ${CURATED_CITIES.length} cidades · ${totalItems} atividades · ${totalHotels} hotéis
//
// Este arquivo é o que permite ao KINU responder sobre uma cidade curada SEM viagem
// ativa e SEM o front ter adivinhado a cidade na mensagem. Ele viaja com o deploy da
// function: nenhuma rede, nenhum segredo, nenhuma leitura de banco.
//
// Para regerar:  npx tsx scripts/build-kinu-catalog.ts
// A suíte src/test/kinuCatalogArtifact.test.ts falha se este arquivo estiver velho.

export interface CatalogItem {
  name: string;
  category: string;
  neighborhood: string;
  costBRL: number | null;
  tip: string;
}

export interface CatalogHotel {
  name: string;
  zone: string;
  tier: string;
  personaTags: string[];
  priceRangeBRL: string;
  tip: string;
}

export interface CatalogCity {
  city: string;
  items: CatalogItem[];
  hotels: CatalogHotel[];
}

export const CATALOG: Record<string, CatalogCity> = ${JSON.stringify(cities, null, 2)};

/** Forma normalizada (minúscula, sem acento) -> chave canônica em CATALOG. */
export const CATALOG_INDEX: Record<string, string> = ${JSON.stringify(sortedIndex, null, 2)};

/** Nomes canônicos das cidades curadas, na ordem de CURATED_CITIES. */
export const CATALOG_CITIES: string[] = ${JSON.stringify(CURATED_CITIES, null, 2)};
`;
}

function main(): void {
  const conteudo = build();
  const check = process.argv.includes('--check');

  if (check) {
    let atual: string;
    try {
      atual = readFileSync(OUT_FILE, 'utf8');
    } catch {
      die(`${OUT_FILE} não existe. Rode: npx tsx scripts/build-kinu-catalog.ts`);
    }
    if (atual !== conteudo) {
      die(
        `catalog.ts está DESATUALIZADO em relação a src/data/.\n` +
          `   O agente serviria catálogo velho com cara de novo.\n` +
          `   Rode: npx tsx scripts/build-kinu-catalog.ts`,
      );
    }
    console.log('✅ catalog.ts está em dia com src/data/.');
    return;
  }

  writeFileSync(OUT_FILE, conteudo, 'utf8');
  console.log(`✅ ${OUT_FILE} — ${conteudo.length} bytes, ${CURATED_CITIES.length} cidades.`);
}

main();
