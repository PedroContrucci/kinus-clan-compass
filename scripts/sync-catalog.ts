#!/usr/bin/env tsx
/**
 * sync-catalog.ts — Etapa 5 da esteira: round-trip banco -> app do catálogo curado.
 *
 * Lê `curated_activities` (status='published') do Supabase externo (projeto kinu-beta)
 * e regrava o array de **TODAS as cidades** em src/data/destinationActivities.ts,
 * preservando o formato TS do arquivo.
 *
 * **Export parcial é impossível por construção.** Este script não aceita cidade como
 * argumento: ou regenera as 21 cidades no mesmo run, ou aborta sem escrever um byte.
 * A razão é a lição do sync-hotels: regenerar um subconjunto **apaga** as demais
 * cidades. A versão de cidade única existe em `git show b33e4be:scripts/sync-catalog.ts`.
 *
 * O caminho inverso (app -> banco) é `writeback-catalog.ts`, e ele roda **antes** deste
 * sempre que o app tiver itens que o banco não tem — senão eles são apagados aqui.
 *
 * Uso:
 *   npx tsx scripts/sync-catalog.ts            # dry-run: imprime o plano, não escreve
 *   npx tsx scripts/sync-catalog.ts --apply    # escreve, valida, e restaura se falhar
 *
 * Credenciais em .env.sync (git-ignorado) na raiz:
 *   KINU_BETA_URL=...
 *   KINU_BETA_SERVICE_KEY=...
 *
 * (A anon key do .env **não** serve: o papel `anon` não tem SELECT em curated_activities.)
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

/** Aborta se uma cidade vier com menos que esta fração da contagem atual do arquivo. */
const FLOOR_RATIO = 0.8;
/** Tamanho da página do PostgREST. */
const PAGE = 1000;

/**
 * Campo do TS **sem coluna no banco**, e com lógica viva no gerador de roteiro
 * (GeneratedItineraryStage.tsx, itineraryValidator.ts). Enquanto
 * `curated_activities.day_occupancy` não existir, a fonte de verdade é esta const:
 * ela é reaplicada por id a cada regen. Ids daqui que não aparecerem no export são
 * avisados, não fatais.
 */
const DAY_OCCUPANCY: Record<string, 'full' | 'half'> = {
  'bkk-ayutthaya': 'full',
  'bkk-mercado-flutuante': 'half',
  'cpt-peninsula': 'full',
  'cpt-robben-island': 'half',
  'cpt-table-mountain': 'half',
  'ist-ilhas-principes': 'full',
  'ist-topkapi': 'half',
  'mrk-medina-souks': 'half',
  'mrk-ourika': 'full',
  'orl-magic-kingdom': 'full',
  'orl-universal-studios': 'full',
  'sin-sentosa': 'full',
  'sin-universal': 'full',
  'sin-zoo': 'half',
};

/** A união de `SuggestedActivity['category']`. Valor fora dela aborta o run. */
const CATEGORIES = new Set(['breakfast', 'lunch', 'dinner', 'morning', 'afternoon', 'night']);

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface DbRow {
  id: string;
  city: string;
  name: string;
  category: string;
  neighborhood: string;
  rating: number | string | null;
  google_rating: number | string | null;
  estimated_cost_brl: number | string | null;
  duration_hours: number | string | null;
  tips: string[] | null;
  style_tags: string[] | null;
}

const SELECT =
  'id,city,name,category,neighborhood,rating,google_rating,estimated_cost_brl,duration_hours,tips,style_tags';

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

/** Formata número; aborta se não for finito. `3.0` sai como `3`. */
function num(value: unknown, field: string, id: string): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) die(`Valor numérico inválido em '${field}' da atividade '${id}': ${value}`);
  return n;
}

// ---------------------------------------------------------------------------
// 1) Argumentos e credenciais
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const stray = argv.filter((a) => !a.startsWith('--'));
if (stray.length) {
  die(
    `Este script não aceita cidade como argumento (recebi: ${stray.join(', ')}).\n` +
      `   Export parcial apaga as demais cidades — ele regenera as 21 sempre.`
  );
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
};

// ---------------------------------------------------------------------------
// 2) Busca — todas as cidades, paginada, com conferência do total
// ---------------------------------------------------------------------------

async function fetchAllPublished(): Promise<DbRow[]> {
  const rows: DbRow[] = [];
  let total: number | null = null;

  for (let offset = 0; ; offset += PAGE) {
    const url =
      `${baseUrl}/rest/v1/curated_activities` +
      `?select=${SELECT}&status=eq.published&order=city.asc,id.asc`;
    const res = await fetch(url, {
      headers: { ...headers, Range: `${offset}-${offset + PAGE - 1}`, Prefer: 'count=exact' },
    });
    if (!res.ok && res.status !== 206) {
      die(`Falha na consulta REST (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    // content-range: "0-999/893"
    const cr = res.headers.get('content-range') ?? '';
    const slash = cr.lastIndexOf('/');
    const reported = slash === -1 ? NaN : Number(cr.slice(slash + 1));
    if (!Number.isFinite(reported)) die(`content-range ilegível na resposta: '${cr}'`);
    if (total === null) total = reported;
    else if (total !== reported) die(`o total mudou no meio da paginação (${total} -> ${reported}). Rode de novo.`);

    const page = (await res.json()) as DbRow[];
    if (!Array.isArray(page)) die(`Resposta inesperada do Supabase (esperava um array).`);
    rows.push(...page);
    if (page.length < PAGE || rows.length >= total) break;
  }

  if (total === null) die(`não foi possível determinar o total de linhas.`);
  if (rows.length !== total) {
    die(`paginação incompleta: recebi ${rows.length} de ${total} linhas. Nada foi escrito.`);
  }
  if (rows.length === 0) die(`o banco não devolveu nenhuma linha published.`);

  const ids = rows.map((r) => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) die(`ids duplicados no banco: ${[...new Set(dupes)].join(', ')}`);

  return rows;
}

// ---------------------------------------------------------------------------
// 3) Leitura do arquivo — registry e limites de cada const
// ---------------------------------------------------------------------------

/** Mapa cidade -> const, lido do registry do próprio arquivo. */
function readRegistry(source: string): Map<string, string> {
  const m = source.match(
    /export const destinationActivities: Record<string, DestinationData> = \{([\s\S]*?)\n\};/
  );
  if (!m) die(`registry destinationActivities não encontrado no arquivo.`);
  const out = new Map<string, string>();
  const re = /'((?:[^'\\]|\\.)*)':\s*\{[^}]*?activities:\s*([A-Za-z0-9_]+)\s*,?\s*\}/g;
  for (let hit = re.exec(m[1]); hit; hit = re.exec(m[1])) out.set(hit[1], hit[2]);
  if (out.size === 0) die(`registry encontrado, mas nenhuma cidade foi extraída dele.`);
  return out;
}

/** Todas as consts `const X: SuggestedActivity[] = [` do arquivo. */
function readConstNames(source: string): string[] {
  return [...source.matchAll(/^const ([A-Za-z0-9_]+): SuggestedActivity\[\] = \[/gm)].map((m) => m[1]);
}

/** Retorna [inícioDoConteúdo, fimDoConteúdo] entre `[` e `\n];` da const. */
function findArrayBounds(source: string, constName: string): [number, number] {
  const decl = `const ${constName}: SuggestedActivity[] = [`;
  const declIdx = source.indexOf(decl);
  if (declIdx === -1) die(`Declaração da const '${constName}' não encontrada.`);
  const openIdx = declIdx + decl.length;
  const closeIdx = source.indexOf('\n];', openIdx);
  if (closeIdx === -1) die(`Fechamento '\\n];' da const '${constName}' não encontrado.`);
  return [openIdx, closeIdx];
}

/** Ids de uma const, na ordem do arquivo. Aceita o formato one-liner e o multi-linha. */
function idsInBody(body: string): string[] {
  return [...body.matchAll(/^\s*(?:\{\s*)?id:\s*'((?:[^'\\]|\\.)*)'/gm)].map((m) =>
    m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
  );
}

// ---------------------------------------------------------------------------
// 4) Renderização
// ---------------------------------------------------------------------------

function renderEntry(r: DbRow): string {
  if (!CATEGORIES.has(r.category)) {
    die(`category '${r.category}' de '${r.id}' não existe em SuggestedActivity['category'].`);
  }
  const rating = r.rating ?? r.google_rating;
  if (rating === null || rating === undefined) {
    die(`'${r.id}': rating e google_rating nulos — sem nota para publicar.`);
  }
  const tips = (r.tips ?? []).map(q).join(', ');
  const tags = (r.style_tags ?? []).map(q).join(', ');
  const occ = DAY_OCCUPANCY[r.id];
  return (
    `  { id: ${q(r.id)}, name: ${q(r.name)}, category: ${q(r.category)}, ` +
    `neighborhood: ${q(r.neighborhood)}, rating: ${num(rating, 'rating', r.id)}, ` +
    `estimatedCostBRL: ${num(r.estimated_cost_brl, 'estimated_cost_brl', r.id)}, ` +
    `durationHours: ${num(r.duration_hours, 'duration_hours', r.id)}, ` +
    (occ ? `dayOccupancy: ${q(occ)}, ` : '') +
    `tips: [${tips}], styleTags: [${tags}] },`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(
    `\n🔄 Sync catálogo banco -> app  ${apply ? '\x1b[31m[APPLY — vai escrever]\x1b[0m' : '[dry-run]'}\n`
  );

  const rows = await fetchAllPublished();
  const original = readFileSync(CATALOG_FILE, 'utf8');
  const registry = readRegistry(original);
  const constNames = readConstNames(original);

  // Agrupa por cidade do banco
  const byCity = new Map<string, DbRow[]>();
  for (const r of rows) {
    if (!byCity.has(r.city)) byCity.set(r.city, []);
    byCity.get(r.city)!.push(r);
  }

  // --- Guarda anti-export-parcial: nada é escrito se a cobertura não fechar ---
  const missingKey = [...byCity.keys()].filter((c) => !registry.has(c));
  if (missingKey.length) {
    die(`cidades no banco sem chave no registry: ${missingKey.join(', ')}. Nada foi escrito.`);
  }
  const reached = new Set([...byCity.keys()].map((c) => registry.get(c)!));
  const orphanConsts = constNames.filter((c) => !reached.has(c));
  if (orphanConsts.length) {
    die(
      `consts sem nenhuma cidade correspondente no banco: ${orphanConsts.join(', ')}.\n` +
        `   Regenerar assim as esvaziaria. Nada foi escrito.`
    );
  }
  if (reached.size !== constNames.length) {
    die(`cobertura inconsistente: ${reached.size} consts alcançadas vs ${constNames.length} no arquivo.`);
  }

  // --- Plano por const, e guarda de piso ---
  interface Plan {
    constName: string;
    cities: string[];
    rows: DbRow[];
    before: string[];
  }
  const plans: Plan[] = [];
  for (const constName of constNames) {
    const cities = [...byCity.keys()].filter((c) => registry.get(c) === constName);
    const merged = cities.flatMap((c) => byCity.get(c)!).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const [o, c] = findArrayBounds(original, constName);
    plans.push({ constName, cities, rows: merged, before: idsInBody(original.slice(o, c)) });
  }

  const floorBreach = plans.filter((p) => p.rows.length < Math.floor(p.before.length * FLOOR_RATIO));
  if (floorBreach.length) {
    die(
      `guarda de piso (${FLOOR_RATIO * 100}%) disparada — o banco veio pequeno demais:\n` +
        floorBreach.map((p) => `   ${p.constName}: arquivo=${p.before.length} banco=${p.rows.length}`).join('\n') +
        `\n   Nada foi escrito.`
    );
  }

  // --- Tabela ---
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(
    `${pad('cidade(s)', 26)}${pad('const', 24)}${'antes'.padStart(6)}${'banco'.padStart(7)}${'entram'.padStart(8)}${'saem'.padStart(6)}`
  );
  let tBefore = 0;
  let tAfter = 0;
  const ins: Array<[string, string]> = [];
  const outs: Array<[string, string]> = [];
  for (const p of plans) {
    const before = new Set(p.before);
    const after = new Set(p.rows.map((r) => r.id));
    const entram = [...after].filter((i) => !before.has(i)).sort();
    const saem = [...before].filter((i) => !after.has(i)).sort();
    for (const i of entram) ins.push([p.cities.join('/'), i]);
    for (const i of saem) outs.push([p.cities.join('/'), i]);
    tBefore += p.before.length;
    tAfter += p.rows.length;
    console.log(
      `${pad(p.cities.join('/'), 26)}${pad(p.constName, 24)}` +
        `${String(p.before.length).padStart(6)}${String(p.rows.length).padStart(7)}` +
        `${String(entram.length).padStart(8)}${String(saem.length).padStart(6)}`
    );
  }
  console.log(
    `${pad('TOTAL', 50)}${String(tBefore).padStart(6)}${String(tAfter).padStart(7)}` +
      `${String(ins.length).padStart(8)}${String(outs.length).padStart(6)}\n`
  );

  if (ins.length) {
    console.log(`── Entram (${ins.length})`);
    for (const [c, i] of ins) console.log(`   + ${pad(c, 18)} ${i}`);
  }
  if (outs.length) {
    console.log(`── Saem (${outs.length})`);
    for (const [c, i] of outs) console.log(`   - ${pad(c, 18)} ${i}`);
  }
  console.log('');

  // --- Aviso: ids do overlay que não estão no export ---
  const exported = new Set(rows.map((r) => r.id));
  const staleOcc = Object.keys(DAY_OCCUPANCY).filter((id) => !exported.has(id));
  if (staleOcc.length) {
    console.log(`⚠ DAY_OCCUPANCY tem id(s) fora do export (não fatal): ${staleOcc.join(', ')}\n`);
  }

  if (!apply) {
    console.log(`Dry-run — nada foi escrito. Para aplicar:\n\n   npx tsx scripts/sync-catalog.ts --apply\n`);
    return;
  }

  // ------- APPLY -------
  let updated = original;
  // De trás para frente: reescrever um miolo invalida os índices dos que vêm depois.
  const ordered = [...plans].sort(
    (a, b) => findArrayBounds(original, b.constName)[0] - findArrayBounds(original, a.constName)[0]
  );
  for (const p of ordered) {
    const [o, c] = findArrayBounds(updated, p.constName);
    const body = '\n' + p.rows.map(renderEntry).join('\n') + '\n';
    updated = updated.slice(0, o) + body + updated.slice(c + 1);
  }
  writeFileSync(CATALOG_FILE, updated, 'utf8');

  const restore = () => writeFileSync(CATALOG_FILE, original, 'utf8');

  // --- Revalidação a partir do arquivo escrito ---
  const rewritten = readFileSync(CATALOG_FILE, 'utf8');
  for (const p of plans) {
    const [o, c] = findArrayBounds(rewritten, p.constName);
    const got = idsInBody(rewritten.slice(o, c));
    const want = p.rows.map((r) => r.id);
    if (got.length !== want.length || got.some((id, i) => id !== want[i])) {
      restore();
      die(`'${p.constName}': arquivo escrito não bate com o banco (${got.length} vs ${want.length}). Restaurado.`);
    }
  }
  if (readConstNames(rewritten).length !== constNames.length) {
    restore();
    die(`o número de consts mudou depois da escrita. Restaurado.`);
  }

  console.log(`   • ${tAfter} entradas escritas em ${plans.length} consts`);
  console.log(`   • rodando type-check (tsc -p ${TSCONFIG} --noEmit)…`);
  try {
    execSync(`npx tsc -p ${TSCONFIG} --noEmit`, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    restore();
    die(`type-check falhou. Arquivo restaurado ao estado original.`);
  }

  console.log(`\n✅ Sync concluído — ${tBefore} -> ${tAfter} entradas, ${plans.length} cidades.\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
