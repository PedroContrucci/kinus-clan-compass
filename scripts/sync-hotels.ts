#!/usr/bin/env tsx
/**
 * sync-hotels.ts — gera src/data/curatedHotels.ts a partir do banco.
 *
 * Lê a tabela `curated_hotels` (status='published') do Supabase externo
 * (projeto kinu-beta) e regrava o arquivo inteiro, no mesmo espírito do
 * sync-catalog.ts (que faz o round-trip das atividades).
 *
 * Uso:
 *   npx tsx scripts/sync-hotels.ts                 # cidades padrão (piloto H1)
 *   npx tsx scripts/sync-hotels.ts Cartagena Gramado
 *
 * Credenciais em .env.sync (git-ignorado) na raiz:
 *   KINU_BETA_URL=...
 *   KINU_BETA_SERVICE_KEY=...
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_FILE = resolve(ROOT, '.env.sync');
const OUT_FILE = resolve(ROOT, 'src/data/curatedHotels.ts');
const TSCONFIG = 'tsconfig.app.json';

/** Cidades com curadoria de hotéis fechada (H1 + LOTE 6). Um run sem argumentos
 *  regrava o arquivo inteiro, então esta lista tem de conter TODAS elas — senão
 *  as que faltarem somem do arquivo sem erro. */
const DEFAULT_CITIES = ['Cartagena', 'Gramado', 'Nova York', 'Londres', 'Barcelona', 'Dubai'];

interface DbRow {
  id: string;
  city: string;
  name: string;
  zone: string | null;
  tier: string | null;
  persona_tags: string[] | null;
  price_range_brl: string | null;
  rating: number | string | null;
  tips: string[] | null;
}

function die(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

/** Lê .env.sync (KEY=VALUE por linha, # = comentário) sem dependências externas. */
function loadEnvSync(): Record<string, string> {
  if (!existsSync(ENV_FILE)) {
    die(`.env.sync não encontrado na raiz. Copie .env.sync.example e preencha as credenciais.`);
  }
  const out: Record<string, string> = {};
  for (const raw of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}

/** Escapa uma string para um literal TS entre aspas simples. */
function q(value: unknown): string {
  const s = String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${s}'`;
}

const cities = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_CITIES;

const env = loadEnvSync();
const baseUrl = (env.KINU_BETA_URL || '').replace(/\/+$/, '');
const serviceKey = env.KINU_BETA_SERVICE_KEY || '';
if (!baseUrl) die(`KINU_BETA_URL ausente em .env.sync`);
if (!serviceKey) die(`KINU_BETA_SERVICE_KEY ausente em .env.sync`);

async function fetchHotels(city: string): Promise<DbRow[]> {
  const select = 'id,city,name,zone,tier,persona_tags,price_range_brl,rating,tips';
  const url =
    `${baseUrl}/rest/v1/curated_hotels` +
    `?select=${select}` +
    `&city=eq.${encodeURIComponent(city)}` +
    `&status=eq.published` +
    `&order=id.asc`;

  const res = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    die(`Falha na consulta REST para '${city}' (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const rows = (await res.json()) as DbRow[];
  if (!Array.isArray(rows)) die(`Resposta inesperada do Supabase para '${city}' (esperava um array).`);
  if (rows.length === 0) die(`Nenhum hotel published para '${city}' no banco.`);
  return rows;
}

function renderEntry(r: DbRow): string {
  const tips = (r.tips ?? []).map(q).join(', ');
  const personas = (r.persona_tags ?? []).map(q).join(', ');
  const rating = Number(r.rating ?? 0);
  if (!Number.isFinite(rating)) die(`rating inválido no hotel '${r.id}': ${r.rating}`);
  return (
    `    { id: ${q(r.id)}, name: ${q(r.name)}, zone: ${q(r.zone)}, tier: ${q(r.tier)}, ` +
    `personaTags: [${personas}], priceRangeBRL: ${q(r.price_range_brl)}, ` +
    `rating: ${rating}, tips: [${tips}] },`
  );
}

async function main(): Promise<void> {
  console.log(`\n🏨 Gerando curatedHotels.ts (banco -> app) para: ${cities.join(', ')}\n`);

  const blocks: string[] = [];
  let total = 0;

  for (const city of cities) {
    const rows = await fetchHotels(city);

    const ids = rows.map((r) => r.id);
    if (new Set(ids).size !== ids.length) {
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      die(`ids duplicados no banco para '${city}': ${[...new Set(dupes)].join(', ')}`);
    }

    console.log(`   • ${city}: ${rows.length} hotéis`);
    total += rows.length;
    blocks.push(`  ${q(city)}: [\n${rows.map(renderEntry).join('\n')}\n  ],`);
  }

  const file = `// GERADO por scripts/sync-hotels.ts — não edite à mão.
// Fonte: tabela \`curated_hotels\` (status='published') do projeto kinu-beta.
// Para atualizar: npx tsx scripts/sync-hotels.ts ${cities.join(' ')}

export interface CuratedHotel {
  id: string;
  name: string;
  /** Bairro/região dentro da cidade (ex.: 'Centro Histórico'). */
  zone: string;
  /** Faixa do hotel: 'budget' | 'mid' | 'upscale' | 'resort'. */
  tier: string;
  /** Personas atendidas: 'family' | 'couple' | 'solo'. */
  personaTags: string[];
  /** Faixa de diária já formatada (ex.: 'R$ 700-1.200'). */
  priceRangeBRL: string;
  rating: number;
  tips: string[];
}

/** Hotéis curados por cidade. Chave = nome da cidade como em CURATED_CITIES. */
export const curatedHotels: Record<string, CuratedHotel[]> = {
${blocks.join('\n')}
};

/** Hotéis curados da cidade, ou null se ela ainda não tem curadoria de hotel. */
export function getCuratedHotels(city: string): CuratedHotel[] | null {
  const list = curatedHotels[city];
  return list && list.length > 0 ? list : null;
}
`;

  writeFileSync(OUT_FILE, file, 'utf8');

  console.log(`   • rodando type-check (tsc -p ${TSCONFIG} --noEmit)…`);
  execSync(`npx tsc -p ${TSCONFIG} --noEmit`, { cwd: ROOT, stdio: 'inherit' });

  console.log(`\n✅ src/data/curatedHotels.ts gerado — ${total} hotéis em ${cities.length} cidade(s).\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
