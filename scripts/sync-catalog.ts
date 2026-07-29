#!/usr/bin/env tsx
/**
 * sync-catalog.ts — round-trip banco -> app do catálogo curado.
 *
 * Lê a tabela `curated_activities` (status='published') do Supabase externo
 * (projeto kinu-beta) e regrava o array da cidade correspondente em
 * src/data/destinationActivities.ts, preservando o formato TS do arquivo.
 *
 * Uso:
 *   npx tsx scripts/sync-catalog.ts "Salvador"
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
const CATALOG_FILE = resolve(ROOT, 'src/data/destinationActivities.ts');
const TSCONFIG = 'tsconfig.app.json';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface DbRow {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  rating: number | string | null;
  estimated_cost_brl: number | string | null;
  duration_hours: number | string | null;
  tips: string[] | null;
  style_tags: string[] | null;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

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
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
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

/** Formata número; erro se não for finito. */
function num(value: unknown, field: string, id: string): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) die(`Valor numérico inválido em '${field}' da atividade '${id}': ${value}`);
  return n;
}

// ---------------------------------------------------------------------------
// 1) Argumentos
// ---------------------------------------------------------------------------

const city = process.argv[2];
if (!city) die(`Informe a cidade. Ex.: npx tsx scripts/sync-catalog.ts "Salvador"`);

const env = loadEnvSync();
const baseUrl = (env.KINU_BETA_URL || '').replace(/\/+$/, '');
const serviceKey = env.KINU_BETA_SERVICE_KEY || '';
if (!baseUrl) die(`KINU_BETA_URL ausente em .env.sync`);
if (!serviceKey) die(`KINU_BETA_SERVICE_KEY ausente em .env.sync`);

// ---------------------------------------------------------------------------
// 2) Busca no Supabase (REST / PostgREST)
// ---------------------------------------------------------------------------

async function fetchActivities(): Promise<DbRow[]> {
  const select = 'id,name,category,neighborhood,rating,estimated_cost_brl,duration_hours,tips,style_tags';
  const url =
    `${baseUrl}/rest/v1/curated_activities` +
    `?select=${select}` +
    `&city=eq.${encodeURIComponent(city)}` +
    `&status=eq.published` +
    `&order=id.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    die(`Falha na consulta REST (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  const rows = (await res.json()) as DbRow[];
  if (!Array.isArray(rows)) die(`Resposta inesperada do Supabase (esperava um array).`);
  if (rows.length === 0) die(`Nenhuma atividade published para '${city}' no banco.`);
  return rows;
}

// ---------------------------------------------------------------------------
// 3) Localiza a const da cidade via registry
// ---------------------------------------------------------------------------

/** Extrai o nome da const (`activities: <const>`) da cidade no registry. */
function resolveConstName(source: string): string {
  const registryStart = source.indexOf('export const destinationActivities');
  if (registryStart === -1) die(`registry destinationActivities não encontrado no arquivo.`);
  const registry = source.slice(registryStart);

  // Ex.: 'Salvador': { cityName: 'Salvador', cityCode: 'SSA', activities: salvadorActivities, },
  const cityKey = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`['"]${cityKey}['"]\\s*:\\s*\\{[^}]*?activities\\s*:\\s*([A-Za-z0-9_]+)`, 'm');
  const m = registry.match(re);
  if (!m) {
    die(`Cidade '${city}' não encontrada no registry. Verifique se a chave existe em destinationActivities.`);
  }
  return m[1];
}

/** Retorna [startIndexDoConteudo, endIndexDoConteudo] entre `[` e `\n];` da const. */
function findArrayBounds(source: string, constName: string): [number, number] {
  const decl = `const ${constName}: SuggestedActivity[] = [`;
  const declIdx = source.indexOf(decl);
  if (declIdx === -1) die(`Declaração da const '${constName}' não encontrada.`);
  const openIdx = declIdx + decl.length; // logo após o '['
  // O array fecha com '];' no início de uma linha (coluna 0).
  const closeMarker = '\n];';
  const closeIdx = source.indexOf(closeMarker, openIdx);
  if (closeIdx === -1) die(`Fechamento '\\n];' da const '${constName}' não encontrado.`);
  return [openIdx, closeIdx];
}

// ---------------------------------------------------------------------------
// 4) Gera as entradas TS
// ---------------------------------------------------------------------------

function renderEntry(r: DbRow): string {
  const tips = (r.tips ?? []).map(q).join(', ');
  const tags = (r.style_tags ?? []).map(q).join(', ');
  return (
    `  { id: ${q(r.id)}, name: ${q(r.name)}, category: ${q(r.category)}, ` +
    `neighborhood: ${q(r.neighborhood)}, rating: ${num(r.rating, 'rating', r.id)}, ` +
    `estimatedCostBRL: ${num(r.estimated_cost_brl, 'estimated_cost_brl', r.id)}, ` +
    `durationHours: ${num(r.duration_hours, 'duration_hours', r.id)}, ` +
    `tips: [${tips}], styleTags: [${tags}] },`
  );
}

// ---------------------------------------------------------------------------
// 5) Validações
// ---------------------------------------------------------------------------

/** Conta entradas (linhas `{ id: ...`) dentro do corpo de uma const. */
function countEntriesInBody(body: string): number {
  const matches = body.match(/^\s*\{\s*id:/gm);
  return matches ? matches.length : 0;
}

function typeCheck(): void {
  console.log(`   • rodando type-check (tsc -p ${TSCONFIG} --noEmit)…`);
  execSync(`npx tsc -p ${TSCONFIG} --noEmit`, { cwd: ROOT, stdio: 'inherit' });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\n🔄 Sincronizando catálogo de "${city}" (banco -> app)…\n`);

  const rows = await fetchActivities();

  // ids únicos no banco
  const ids = rows.map((r) => r.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    die(`ids duplicados no banco: ${[...new Set(dupes)].join(', ')}`);
  }

  const original = readFileSync(CATALOG_FILE, 'utf8');
  const constName = resolveConstName(original);
  const [openIdx, closeIdx] = findArrayBounds(original, constName);

  console.log(`   • cidade '${city}' -> const '${constName}' (${rows.length} atividades no banco)`);

  const body = '\n' + rows.map(renderEntry).join('\n') + '\n';
  const updated = original.slice(0, openIdx) + body + original.slice(closeIdx + 1); // +1 mantém o '\n' antes de '];'

  writeFileSync(CATALOG_FILE, updated, 'utf8');

  // Revalida a partir do arquivo escrito
  const rewritten = readFileSync(CATALOG_FILE, 'utf8');
  const [o2, c2] = findArrayBounds(rewritten, constName);
  const fileCount = countEntriesInBody(rewritten.slice(o2, c2));

  const restore = () => writeFileSync(CATALOG_FILE, original, 'utf8');

  if (fileCount !== rows.length) {
    restore();
    die(`contagem divergente: arquivo=${fileCount} vs banco=${rows.length}. Arquivo restaurado.`);
  }

  try {
    typeCheck();
  } catch {
    restore();
    die(`type-check falhou. Arquivo restaurado ao estado original.`);
  }

  // ------- Resumo -------
  const first = rows.slice(0, 2).map((r) => `${r.id} — ${r.name}`);
  const last = rows.slice(-2).map((r) => `${r.id} — ${r.name}`);
  console.log(`\n✅ Sincronizado com sucesso.`);
  console.log(`   cidade:   ${city}`);
  console.log(`   const:    ${constName}`);
  console.log(`   entradas: ${fileCount} (arquivo) == ${rows.length} (banco)`);
  console.log(`   primeiras: \n     - ${first.join('\n     - ')}`);
  console.log(`   últimas:   \n     - ${last.join('\n     - ')}`);
  console.log('');
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
