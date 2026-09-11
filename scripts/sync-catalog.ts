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
 * **Também emite `src/data/generated/landmarkTiers.ts`** no `--apply`. A coluna
 * `landmark_tier` NÃO entra em `destinationActivities.ts` (ela não é campo de roteiro,
 * é classificação de conquista) — mas o motor de troféus precisa dela em runtime, e
 * runtime não fala com o banco. O arquivo gerado é a ponte, e é a ÚNICA: nenhum outro
 * lugar do app conhece o tier.
 *
 * **E emite `src/data/generated/coords.ts`**, pelo mesmo motivo e com a mesma forma:
 * `lat`/`lng` são geometria, não campo de roteiro, e `SuggestedActivity` é intocável.
 * Este é o único lugar do sync que também lê `curated_hotels` — o mapa de coordenadas
 * é um só, por id, e `curatedHotels.ts` continua sendo escrito só pelo `sync-hotels.ts`.
 * As colunas são preenchidas pelo enrich; ver `supabase-beta/ENRICH-COORDS.md`.
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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { CURATED_CITIES } from '../src/lib/curatedCities';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ENV_FILE = resolve(ROOT, '.env.sync');
const CATALOG_FILE = resolve(ROOT, 'src/data/destinationActivities.ts');
const TIERS_FILE = resolve(ROOT, 'src/data/generated/landmarkTiers.ts');
const COORDS_FILE = resolve(ROOT, 'src/data/generated/coords.ts');
const TSCONFIG = 'tsconfig.app.json';

/** O SQL que cria as colunas de coordenada. Aparece na mensagem de erro quando elas faltam. */
const COORDS_SQL = `alter table curated_activities add column if not exists lat double precision;
   alter table curated_activities add column if not exists lng double precision;
   alter table curated_hotels     add column if not exists lat double precision;
   alter table curated_hotels     add column if not exists lng double precision;`;

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

/** As categorias que são comida. É o que o "Garfo" do §4 do desenho conta. */
const FOOD_CATEGORIES = new Set(['breakfast', 'lunch', 'dinner']);

/** Os valores aceitos em `curated_activities.landmark_tier`. Outro valor aborta o run. */
const TIERS = new Set(['icon', 'essential', 'hidden_gem']);

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
  landmark_tier: string | null;
  lat: number | string | null;
  lng: number | string | null;
}

/** O mínimo que o mapa de coordenadas precisa saber sobre um hotel curado. */
interface HotelCoordRow {
  id: string;
  lat: number | string | null;
  lng: number | string | null;
}

const SELECT =
  'id,city,name,category,neighborhood,rating,google_rating,estimated_cost_brl,duration_hours,tips,style_tags,landmark_tier,lat,lng';

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

/**
 * Traduz o 400 do PostgREST quando `lat`/`lng` ainda não existem.
 *
 * É o erro mais provável do primeiro run deste script depois do arco das coordenadas, e a
 * mensagem crua (`column curated_activities.lat does not exist`) não diz o que fazer.
 */
function dieIfCoordColumnMissing(table: string, body: string): void {
  if (!body.includes('42703') && !body.includes('does not exist')) return;
  die(
    `a tabela '${table}' ainda não tem as colunas de coordenada. Rode no kinu-beta:\n\n` +
      `   ${COORDS_SQL}\n\n` +
      `   Detalhe: ${body.slice(0, 200)}\n` +
      `   (passo a passo em supabase-beta/ENRICH-COORDS.md). Nada foi escrito.`
  );
}

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
      const body = await res.text();
      dieIfCoordColumnMissing('curated_activities', body);
      die(`Falha na consulta REST (HTTP ${res.status}): ${body.slice(0, 300)}`);
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

/**
 * Os hotéis publicados, só id e coordenada.
 *
 * É a ÚNICA leitura de `curated_hotels` neste script, e ela não escreve em
 * `src/data/curatedHotels.ts` — esse arquivo continua sendo do `sync-hotels.ts`. O mapa de
 * coordenadas é um só porque o consumidor faz um lookup só, por id.
 */
async function fetchHotelCoords(): Promise<HotelCoordRow[]> {
  const rows: HotelCoordRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = `${baseUrl}/rest/v1/curated_hotels?select=id,lat,lng&status=eq.published&order=id.asc`;
    const res = await fetch(url, {
      headers: { ...headers, Range: `${offset}-${offset + PAGE - 1}` },
    });
    if (!res.ok && res.status !== 206) {
      const body = await res.text();
      dieIfCoordColumnMissing('curated_hotels', body);
      die(`Falha na consulta de hotéis (HTTP ${res.status}): ${body.slice(0, 300)}`);
    }
    const page = (await res.json()) as HotelCoordRow[];
    if (!Array.isArray(page)) die(`Resposta inesperada em curated_hotels (esperava um array).`);
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  const ids = rows.map((r) => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) die(`ids de hotel duplicados no banco: ${[...new Set(dupes)].join(', ')}`);
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
// 4b) O artefato de tiers — a única ponte entre `landmark_tier` e o runtime
// ---------------------------------------------------------------------------

/** minúsculo, sem diacríticos. Mesma normalização do `build-kinu-catalog`. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** O slug da chave do troféu. CONGELADO — mudar aqui re-destrava a coleção inteira. */
function slugOf(city: string): string {
  return normalize(city).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * O nome canônico da cidade do banco.
 *
 * O banco diz `Rome` e `Tokyo`; `CURATED_CITIES` diz `Roma` e `Tóquio`. Os dois apelidos
 * apontam para a MESMA const no registry de `destinationActivities` — é por aí que a
 * tradução acontece, sem tabela de sinônimos para envelhecer. Ambiguidade aborta: chave de
 * troféu errada é troféu errado para sempre.
 */
function canonicalCity(dbCity: string, registry: Map<string, string>): string {
  const constName = registry.get(dbCity);
  if (!constName) die(`cidade '${dbCity}' não tem chave no registry — impossível canonizar.`);
  const hits = CURATED_CITIES.filter((c) => registry.get(c) === constName);
  if (hits.length !== 1) {
    die(
      `'${dbCity}' -> const '${constName}' casa com ${hits.length} cidades curadas ` +
        `(${hits.join(', ') || 'nenhuma'}). Nada foi escrito.`
    );
  }
  return hits[0];
}

/**
 * Gera `src/data/generated/landmarkTiers.ts`.
 *
 * Emite só o que o motor de conquistas precisa e nada mais: os itens classificados e os
 * gastronômicos. O resto do catálogo já vive em `destinationActivities.ts` — duplicá-lo aqui
 * seria criar uma segunda verdade sobre a mesma coisa.
 */
function renderTiers(rows: DbRow[], registry: Map<string, string>): string {
  const byCanonical = new Map<string, DbRow[]>();
  for (const r of rows) {
    const city = canonicalCity(r.city, registry);
    if (!byCanonical.has(city)) byCanonical.set(city, []);
    byCanonical.get(city)!.push(r);
  }

  const faltando = CURATED_CITIES.filter((c) => !byCanonical.has(c));
  if (faltando.length) die(`cidades curadas sem linha no banco: ${faltando.join(', ')}. Nada foi escrito.`);

  const slugs = new Map<string, string>();
  const blocks: string[] = [];

  // Na ordem de CURATED_CITIES: a saída tem que ser estável entre runs, ou o diff mente.
  for (const city of CURATED_CITIES) {
    const cityRows = [...byCanonical.get(city)!].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const slug = slugOf(city);
    const clash = [...slugs.entries()].find(([, s]) => s === slug);
    if (clash) die(`slug '${slug}' colide entre '${clash[0]}' e '${city}'. Nada foi escrito.`);
    slugs.set(city, slug);

    const tiers: string[] = [];
    const food: string[] = [];
    for (const r of cityRows) {
      const tier = r.landmark_tier;
      if (tier !== null && tier !== undefined && tier !== '') {
        if (!TIERS.has(tier)) die(`landmark_tier '${tier}' de '${r.id}' não é icon|essential|hidden_gem.`);
        tiers.push(`      ${q(r.id)}: ${q(tier)},`);
      }
      if (FOOD_CATEGORIES.has(r.category)) food.push(q(r.id));
    }

    // Os limiares dos cinco moldes. Cidade classificada pela metade produziria troféu que
    // NUNCA destrava — melhor não escrever o arquivo do que escrever a promessa quebrada.
    const count = (t: string) => cityRows.filter((r) => r.landmark_tier === t).length;
    if (count('icon') !== 1) die(`'${city}' tem ${count('icon')} itens 'icon' (o molde Ícone exige exatamente 1).`);
    if (count('essential') < 5) die(`'${city}' tem ${count('essential')} 'essential' (o molde Coração exige 5).`);
    if (count('hidden_gem') < 1) die(`'${city}' não tem nenhum 'hidden_gem' (o molde Segredo exige 1).`);
    if (food.length < 3) die(`'${city}' tem ${food.length} itens gastronômicos (o molde Garfo exige 3).`);

    const constName = registry.get(city)!;
    const aliases = [...registry.keys()].filter((k) => registry.get(k) === constName).sort();

    blocks.push(
      `  ${q(city)}: {\n` +
        `    slug: ${q(slug)},\n` +
        `    aliases: [${aliases.map(q).join(', ')}],\n` +
        `    tiers: {\n${tiers.join('\n')}\n    },\n` +
        `    food: [${food.join(', ')}],\n` +
        `  },`
    );
  }

  return `// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// A classificação \`landmark_tier\` vive só em \`curated_activities\` no kinu-beta, e o motor de
// conquistas roda no cliente, sem rede. Este arquivo é a ponte — e é a única: nenhum outro
// lugar do app conhece o tier. Editar aqui é escrever no espelho; o próximo \`--apply\` apaga.
//
// A trava de deriva é \`src/test/landmarkTiersArtifact.test.ts\`. Ela NÃO consulta o banco (a
// suíte não tem a service key, e não deve ter): confere o que dá para conferir offline — que
// todo id daqui ainda existe em \`destinationActivities\`, que \`food\` é exatamente a
// gastronomia do catálogo, e que cada cidade fecha os limiares dos cinco moldes.

/** As três classes do §4 do DESENHO-CONQUISTAS-v2. */
export type LandmarkTier = 'icon' | 'essential' | 'hidden_gem';

export interface CityLandmarks {
  /** O pedaço do meio da chave do troféu (\`local.<slug>.<molde>\`). CONGELADO. */
  slug: string;
  /** Todo nome que significa esta cidade — vem do registry de \`destinationActivities\`, que já
   *  carrega os apelidos ('Tokyo' e 'Tóquio' apontam para a mesma const). É o que faz um
   *  \`trip.checkin\` com \`city: 'Rome'\` cair em 'Roma'. */
  aliases: string[];
  /** Só os itens classificados. Quem não está aqui não vale troféu de tier. */
  tiers: Record<string, LandmarkTier>;
  /** Ids de category breakfast|lunch|dinner — o que o molde Garfo conta. */
  food: string[];
}

/** Chaveado pelo nome canônico de \`CURATED_CITIES\` ('Roma', 'Tóquio' — não 'Rome'/'Tokyo'). */
export const LANDMARKS: Record<string, CityLandmarks> = {
${blocks.join('\n')}
};
`;
}

// ---------------------------------------------------------------------------
// 4c) O artefato de coordenadas — a ponte entre `lat`/`lng` e a Rota do Dia
// ---------------------------------------------------------------------------

interface CoordEntry {
  id: string;
  lat: number;
  lng: number;
}

/**
 * Aceita uma coordenada, ou aborta o run.
 *
 * Devolve `null` quando a linha simplesmente ainda não foi enriquecida (os dois campos nulos) —
 * isso é o estado normal e não é erro. Aborta quando o par existe e está errado: metade
 * preenchida, valor não-numérico, fora da faixa, ou `0,0` (o "null island" que um enrich
 * confuso grava quando não acha o lugar — no golfo da Guiné, longe de qualquer cidade curada).
 */
function coordOf(id: string, lat: unknown, lng: unknown): CoordEntry | null {
  const missing = (v: unknown) => v === null || v === undefined || v === '';
  if (missing(lat) && missing(lng)) return null;
  if (missing(lat) || missing(lng)) {
    die(`'${id}': coordenada pela metade (lat=${lat}, lng=${lng}). Meia coordenada é erro, não ausência.`);
  }
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) die(`'${id}': coordenada não numérica (${lat}, ${lng}).`);
  if (la < -90 || la > 90) die(`'${id}': lat ${la} fora de [-90, 90].`);
  if (ln < -180 || ln > 180) die(`'${id}': lng ${ln} fora de [-180, 180].`);
  if (la === 0 && ln === 0) die(`'${id}': coordenada 0,0 — o enrich não achou o lugar e gravou zero.`);
  return { id, lat: la, lng: ln };
}

/**
 * Gera `src/data/generated/coords.ts`.
 *
 * **Sem guarda de piso, de propósito.** A cobertura nasceu em 0 e cresce a cada lote de enrich;
 * um piso de 80% como o do catálogo abortaria todo run legítimo do começo. O que substitui a
 * guarda é a contagem impressa: cobertura é número visto, não suposição.
 */
function renderCoords(
  rows: DbRow[],
  hotels: HotelCoordRow[]
): { content: string; acts: CoordEntry[]; hotelCoords: CoordEntry[] } {
  const byId = (a: CoordEntry, b: CoordEntry) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const acts = rows.map((r) => coordOf(r.id, r.lat, r.lng)).filter((c): c is CoordEntry => c !== null).sort(byId);
  const hotelCoords = hotels
    .map((h) => coordOf(h.id, h.lat, h.lng))
    .filter((c): c is CoordEntry => c !== null)
    .sort(byId);

  // Um id em duas tabelas viraria um hotel servindo de atividade (ou o contrário) em silêncio.
  const actIds = new Set(acts.map((c) => c.id));
  const clash = hotelCoords.filter((c) => actIds.has(c.id)).map((c) => c.id);
  if (clash.length) die(`id(s) presentes em curated_activities E curated_hotels: ${clash.join(', ')}. Nada foi escrito.`);

  const line = (c: CoordEntry) => `  ${q(c.id)}: { lat: ${c.lat}, lng: ${c.lng} },`;
  const body =
    (acts.length ? `  // ── atividades ──\n${acts.map(line).join('\n')}\n` : '') +
    (hotelCoords.length ? `  // ── hotéis ──\n${hotelCoords.map(line).join('\n')}\n` : '');

  const content = `// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// A coordenada de um lugar curado vive nas colunas \`lat\`/\`lng\` de \`curated_activities\` e
// \`curated_hotels\`, no kinu-beta, preenchidas pelo enrich a partir do Google Places (ver
// \`supabase-beta/ENRICH-COORDS.md\`). O mapa da Rota do Dia roda no cliente, sem falar com o
// banco. Este arquivo é a ponte — e é a única.
//
// POR QUE UM ARQUIVO GERADO E NÃO UM CAMPO EM \`SuggestedActivity\`: coordenada não é campo de
// roteiro, é geometria — a mesma razão pela qual \`landmark_tier\` mora em \`landmarkTiers.ts\`. E
// \`SuggestedActivity\` é intocável: \`lat:\` dentro do literal de \`destinationActivities.ts\` seria
// erro de excess-property no \`tsc\`, não "campo por fora do tipo".
//
// ATIVIDADES E HOTÉIS NO MESMO MAPA. O consumidor (\`src/lib/routeCoords.ts\`) faz um lookup só,
// por id, e os prefixos não colidem (\`for-h-gran-marquise\` vs \`for-mercado-peixes\`). O script
// aborta se algum dia colidirem, em vez de deixar um hotel virar atividade em silêncio.
//
// NASCE VAZIO E CRESCE. Não há guarda de piso aqui: a cobertura era 0 no dia em que o arquivo
// entrou e sobe a cada lote de enrich. O \`--apply\` imprime a contagem para a cobertura ser um
// número visto, não uma suposição. A trava de deriva é \`src/test/routeCoords.test.ts\`.

export interface CuratedCoord {
  lat: number;
  lng: number;
}

/** Chaveado pelo id do catálogo (\`for-mercado-peixes\`) ou do hotel (\`for-h-gran-marquise\`). */
export const CURATED_COORDS: Record<string, CuratedCoord> = {
${body}};
`;

  return { content, acts, hotelCoords };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(
    `\n🔄 Sync catálogo banco -> app  ${apply ? '\x1b[31m[APPLY — vai escrever]\x1b[0m' : '[dry-run]'}\n`
  );

  const rows = await fetchAllPublished();
  const hotels = await fetchHotelCoords();
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

  // --- O artefato de tiers, montado (e validado) ANTES de qualquer escrita ---
  // Se a classificação do banco não fecha os limiares dos moldes, o run morre aqui — com
  // `destinationActivities.ts` ainda intacto no disco.
  const tiersContent = renderTiers(rows, registry);
  const tiersBefore = existsSync(TIERS_FILE) ? readFileSync(TIERS_FILE, 'utf8') : null;
  const tiersChanged = tiersBefore !== tiersContent;
  console.log(
    `landmarkTiers.ts: ${rows.filter((r) => r.landmark_tier).length} itens classificados em ` +
      `${CURATED_CITIES.length} cidades — ${tiersBefore === null ? 'ARQUIVO NOVO' : tiersChanged ? 'muda' : 'sem mudança'}\n`
  );

  // Idem para as coordenadas: coordenada torta aborta aqui, com os arquivos intactos no disco.
  const coords = renderCoords(rows, hotels);
  const coordsBefore = existsSync(COORDS_FILE) ? readFileSync(COORDS_FILE, 'utf8') : null;
  const coordsChanged = coordsBefore !== coords.content;
  const pct = (n: number, d: number) => (d === 0 ? '0' : ((n / d) * 100).toFixed(0));
  console.log(
    `coords.ts: ${coords.acts.length}/${rows.length} atividades (${pct(coords.acts.length, rows.length)}%), ` +
      `${coords.hotelCoords.length}/${hotels.length} hotéis (${pct(coords.hotelCoords.length, hotels.length)}%) ` +
      `com coordenada — ${coordsBefore === null ? 'ARQUIVO NOVO' : coordsChanged ? 'muda' : 'sem mudança'}\n`
  );

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

  // O artefato de tiers sai junto, no mesmo run: catálogo novo com tiers velhos é exatamente
  // a deriva que a trava do teste existe para pegar — e ela pegaria DEPOIS do commit.
  mkdirSync(dirname(TIERS_FILE), { recursive: true });
  writeFileSync(TIERS_FILE, tiersContent, 'utf8');
  writeFileSync(COORDS_FILE, coords.content, 'utf8');

  // Restaura os TRÊS. Meio-caminho é o pior estado possível: o app compila com um catálogo,
  // classifica com o outro e desenha o mapa com um terceiro.
  const restore = () => {
    writeFileSync(CATALOG_FILE, original, 'utf8');
    if (tiersBefore !== null) writeFileSync(TIERS_FILE, tiersBefore, 'utf8');
    if (coordsBefore !== null) writeFileSync(COORDS_FILE, coordsBefore, 'utf8');
  };

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
  console.log(`   • src/data/generated/landmarkTiers.ts — ${tiersContent.length} bytes`);
  console.log(
    `   • src/data/generated/coords.ts — ${coords.acts.length + coords.hotelCoords.length} coordenadas`
  );
  console.log(`   • rodando type-check (tsc -p ${TSCONFIG} --noEmit)…`);
  try {
    execSync(`npx tsc -p ${TSCONFIG} --noEmit`, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    restore();
    die(`type-check falhou. Arquivo restaurado ao estado original.`);
  }

  // Etapa 6: regerar o artefato que a edge function kinu-ai deploya junto.
  // Sem isto o agente serviria o catálogo anterior — velho com cara de novo. O
  // gerador não usa credencial nenhuma; só transforma o TS que acabou de ser escrito.
  console.log(`   • regerando supabase/functions/kinu-ai/catalog.ts…`);
  try {
    execSync(`npx tsx scripts/build-kinu-catalog.ts`, { cwd: ROOT, stdio: 'inherit' });
  } catch {
    restore();
    die(`falhou ao regerar o catálogo da kinu-ai. Arquivo restaurado ao estado original.`);
  }

  console.log(`\n✅ Sync concluído — ${tBefore} -> ${tAfter} entradas, ${plans.length} cidades.`);
  console.log(`   Lembre: o deploy da kinu-ai leva index.ts E catalog.ts juntos.\n`);
}

main().catch((err) => die(err instanceof Error ? err.message : String(err)));
