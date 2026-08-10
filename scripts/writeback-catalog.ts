#!/usr/bin/env tsx
/**
 * writeback-catalog.ts — round-trip app -> banco do catálogo curado.
 *
 * O inverso do `sync-catalog.ts`. Insere em `curated_activities` as atividades que
 * existem em src/data/destinationActivities.ts e **não** existem no banco.
 *
 * Existe porque `sync-catalog` regrava o array da cidade inteiro a partir do banco:
 * rodá-lo numa cidade com item app-only **apaga** esse item do app. O write-back é o
 * passo que fecha o loop antes de sincronizar.
 *
 * Regras (deliberadamente conservador):
 *   - **Só INSERT.** Nunca faz UPDATE nem DELETE. Id que já existe no banco é ignorado,
 *     mesmo que o conteúdo diverja — reconciliar conteúdo é outra decisão.
 *   - **Dry-run é o padrão.** Sem `--apply` nada é escrito.
 *   - **Backup antes de escrever.** Todas as linhas da cidade vão para um .json local.
 *   - Ids **db-only** (banco tem, app não) são reportados como aviso — este script não
 *     os traz para o app; isso é trabalho do `sync-catalog`.
 *
 * Uso:
 *   npx tsx scripts/writeback-catalog.ts                      # dry-run, as 5 cidades pendentes
 *   npx tsx scripts/writeback-catalog.ts Bangkok Istambul     # dry-run, cidades escolhidas
 *   npx tsx scripts/writeback-catalog.ts Bangkok --apply      # escreve de verdade
 *
 * Credenciais em .env.sync (git-ignorado) na raiz:
 *   KINU_BETA_URL=...
 *   KINU_BETA_SERVICE_KEY=...
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { destinationActivities, type SuggestedActivity } from '../src/data/destinationActivities';
import { CURATED_CITIES } from '../src/lib/curatedCities';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_FILE = resolve(ROOT, '.env.sync');
const BACKUP_DIR = resolve(ROOT, '.writeback-backups');

/** Cidades onde o app tinha itens que o banco não tem (levantamento de 03/08/2026). */
const DEFAULT_CITIES = ['Cidade do Cabo', 'Istambul', 'Bangkok', 'Marrakech', 'Singapura'];

/** Nome da cidade no app -> nome no banco. O banco grava alguns em inglês. */
const CITY_DB_ALIAS: Record<string, string> = { Roma: 'Rome', 'Tóquio': 'Tokyo' };

/** Marca de proveniência gravada em `notes` nas linhas inseridas. */
const WRITEBACK_NOTE = 'write-back app->banco';

interface DbRow {
  id: string;
  city: string;
  name: string;
  category: string;
  neighborhood: string;
  status: string;
  notes: string | null;
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
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1) Argumentos
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const cities = argv.filter((a) => !a.startsWith('--'));
const targets = cities.length > 0 ? cities : DEFAULT_CITIES;

for (const c of targets) {
  if (!CURATED_CITIES.includes(c)) {
    die(`'${c}' não está em CURATED_CITIES (src/lib/curatedCities.ts). Nome errado ou cidade não curada.`);
  }
  if (!destinationActivities[c]) {
    die(`'${c}' não está no registry destinationActivities.`);
  }
}

const env = loadEnvSync();
const baseUrl = (env.KINU_BETA_URL || '').replace(/\/+$/, '');
const serviceKey = env.KINU_BETA_SERVICE_KEY || '';
if (!baseUrl) die(`KINU_BETA_URL ausente em .env.sync`);
if (!serviceKey) die(`KINU_BETA_SERVICE_KEY ausente em .env.sync`);

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// 2) Banco
// ---------------------------------------------------------------------------

async function fetchCity(dbCity: string): Promise<DbRow[]> {
  const url =
    `${baseUrl}/rest/v1/curated_activities` +
    `?select=id,city,name,category,neighborhood,status,notes` +
    `&city=eq.${encodeURIComponent(dbCity)}&order=id.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) die(`Falha na consulta de '${dbCity}' (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as DbRow[];
}

/** Linha completa da cidade, para o backup em disco. */
async function fetchCityFull(dbCity: string): Promise<unknown[]> {
  const url = `${baseUrl}/rest/v1/curated_activities?select=*&city=eq.${encodeURIComponent(dbCity)}&order=id.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) die(`Falha no backup de '${dbCity}' (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as unknown[];
}

/** Monta a linha do banco a partir da entrada do app. `status` espelha o resto da cidade. */
function toDbRow(a: SuggestedActivity, dbCity: string, stamp: string) {
  return {
    id: a.id,
    city: dbCity,
    name: a.name,
    category: a.category,
    neighborhood: a.neighborhood,
    rating: a.rating,
    estimated_cost_brl: a.estimatedCostBRL,
    duration_hours: a.durationHours,
    tips: a.tips ?? [],
    style_tags: a.styleTags ?? [],
    source: 'kinu',
    status: 'published',
    notes: `${WRITEBACK_NOTE} · ${stamp}`,
  };
}

async function insertRows(rows: ReturnType<typeof toDbRow>[]): Promise<DbRow[]> {
  const res = await fetch(`${baseUrl}/rest/v1/curated_activities`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) die(`INSERT falhou (HTTP ${res.status}): ${(await res.text()).slice(0, 500)}`);
  return (await res.json()) as DbRow[];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Plan {
  city: string;
  dbCity: string;
  appOnly: SuggestedActivity[];
  dbOnly: DbRow[];
  appCount: number;
  dbCount: number;
}

async function main(): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 10);
  console.log(`\n🔁 Write-back app -> banco  ${apply ? '\x1b[31m[APPLY — vai escrever]\x1b[0m' : '[dry-run]'}`);
  console.log(`   cidades: ${targets.join(', ')}\n`);

  const plans: Plan[] = [];

  for (const city of targets) {
    const dbCity = CITY_DB_ALIAS[city] ?? city;
    const app = destinationActivities[city].activities;
    const db = await fetchCity(dbCity);

    const dbIds = new Set(db.map((r) => r.id));
    const appIds = new Set(app.map((a) => a.id));

    const appOnly = app.filter((a) => !dbIds.has(a.id));
    const dbOnly = db.filter((r) => !appIds.has(r.id));

    plans.push({ city, dbCity, appOnly, dbOnly, appCount: app.length, dbCount: db.length });

    const label = city === dbCity ? city : `${city} (banco: ${dbCity})`;
    console.log(`── ${label} — app=${app.length} banco=${db.length}`);
    for (const a of appOnly) console.log(`   + INSERT   ${a.id.padEnd(28)} ${a.name}`);
    for (const r of dbOnly) console.log(`   ⚠ db-only  ${r.id.padEnd(28)} ${r.name}  [não tocado — falta no app]`);
    if (appOnly.length === 0 && dbOnly.length === 0) console.log(`   ✅ sem divergência de ids`);
    console.log('');
  }

  const toInsert = plans.flatMap((p) => p.appOnly.map((a) => ({ plan: p, activity: a })));
  const dbOnlyTotal = plans.reduce((n, p) => n + p.dbOnly.length, 0);

  console.log(`── Total: ${toInsert.length} a inserir · ${dbOnlyTotal} db-only (aviso)\n`);

  // ids duplicados entre as cidades do lote — o banco tem id único global
  const ids = toInsert.map((t) => t.activity.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) die(`ids repetidos entre as cidades do lote: ${[...new Set(dupes)].join(', ')}`);

  if (toInsert.length === 0) {
    console.log(`Nada a inserir.\n`);
    return;
  }

  if (!apply) {
    console.log(`Dry-run — nada foi escrito. Para aplicar:\n`);
    console.log(`   npx tsx scripts/writeback-catalog.ts ${targets.map((c) => `"${c}"`).join(' ')} --apply\n`);
    if (dbOnlyTotal > 0) {
      console.log(
        `⚠ Há ${dbOnlyTotal} id(s) que só existem no banco. Depois do write-back, um\n` +
          `  'sync-catalog' nessas cidades traz esses itens para o app — e reescreve o\n` +
          `  conteúdo dos ids partilhados com a versão do banco.\n`
      );
    }
    return;
  }

  // ------- APPLY -------
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const backup: Record<string, unknown[]> = {};
  for (const p of plans) backup[p.dbCity] = await fetchCityFull(p.dbCity);
  const backupFile = resolve(BACKUP_DIR, `writeback-${stamp}-${Date.now()}.json`);
  writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`   • backup de ${Object.values(backup).reduce((n, r) => n + r.length, 0)} linhas -> ${backupFile}`);

  const rows = toInsert.map((t) => toDbRow(t.activity, t.plan.dbCity, stamp));
  const inserted = await insertRows(rows);
  console.log(`   • INSERT devolveu ${inserted.length} linha(s)\n`);

  // ------- Verificação pós-escrita, relendo o banco -------
  let ok = true;
  for (const p of plans) {
    if (p.appOnly.length === 0) continue;
    const after = await fetchCity(p.dbCity);
    const afterIds = new Set(after.map((r) => r.id));
    const missing = p.appOnly.filter((a) => !afterIds.has(a.id));
    const expected = p.dbCount + p.appOnly.length;
    const countOk = after.length === expected;
    if (missing.length || !countOk) ok = false;
    console.log(
      `   ${missing.length === 0 && countOk ? '✅' : '❌'} ${p.city.padEnd(16)} ` +
        `${p.dbCount} -> ${after.length} (esperado ${expected})` +
        (missing.length ? `  faltando: ${missing.map((m) => m.id).join(', ')}` : '')
    );
  }

  console.log(
    ok
      ? `\n✅ Write-back concluído. Agora 'sync-catalog' nessas cidades é seguro (não apaga nada).\n`
      : `\n❌ Verificação falhou. O backup está em ${backupFile}.\n`
  );
  if (!ok) process.exit(1);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
