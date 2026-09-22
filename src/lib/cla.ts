// cla — a camada de comunidade do KINU (modelo Waze: o clã sinaliza, o KINU cura).
//
// Duas tabelas e duas RPCs no kinu-beta:
//   cla_reactions(user_id, activity_id, city, kind 'up'|'down', note)  — única por usuário+atividade
//   cla_suggestions(user_id, city, name, category, note, status)
//   cla_stats(p_city)               -> [{ activity_id, ups, downs, notes }]
//   cla_suggestions_public(p_city)  -> [{ name, category, status, apoios }]
//
// ELEGIBILIDADE ("viveu a cidade") é derivada NO CLIENTE dos MESMOS eventos que o motor de
// conquistas lê (`trip.completed` / `trip.checkin`), passando pelo `indexEvents`. A RLS do
// servidor continua sendo a verdade — isto aqui só existe para a UI saber antes de apanhar.
//
// INVARIANTE: nada aqui lança. RPC que falha vira lista vazia e a tela renderiza mesmo assim.
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { getCurrentUserId } from '@/lib/session';
import { indexEvents, type AchievementEvent } from '@/lib/achievements';
import { resolveCity } from '@/lib/localAchievements';
import { trackEvent } from '@/lib/kinuEvents';

export type ReactionKind = 'up' | 'down';

export interface ClaStat {
  activity_id: string;
  ups: number;
  downs: number;
  notes: number;
}

export interface ClaSuggestionPublic {
  name: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected';
  apoios: number;
}

export interface MyReaction {
  activity_id: string;
  city: string;
  kind: ReactionKind;
  note: string | null;
}

export interface MySuggestion {
  city: string;
  name: string;
  category: string;
  note: string | null;
  status: 'pending' | 'accepted' | 'rejected';
}

/** As seis categorias que o clã pode sugerir. */
export const CLA_CATEGORIES: { value: string; label: string }[] = [
  { value: 'restaurant', label: '🍽️ Comida' },
  { value: 'experience', label: '🎭 Experiência' },
  { value: 'culture', label: '🏛️ Cultura' },
  { value: 'nature', label: '🌿 Natureza' },
  { value: 'nightlife', label: '🌙 Noite' },
  { value: 'other', label: '📍 Outro' },
];

export const NOTE_MAX = 140;
export const SUGGESTION_NOTE_MAX = 200;

// ---------------------------------------------------------------------------
// Elegibilidade — derivada dos eventos, cacheada por sessão
// ---------------------------------------------------------------------------

let livedPromise: Promise<Set<string>> | null = null;

async function readLivedCities(): Promise<Set<string>> {
  const userId = getCurrentUserId();
  if (!userId) return new Set();
  try {
    const { data, error } = await kinuBeta
      .from('events')
      .select('name, props')
      .eq('user_id', userId)
      .in('name', ['trip.completed', 'trip.checkin'])
      .limit(5000);
    if (error || !Array.isArray(data)) return new Set();
    const events: AchievementEvent[] = (data as { name?: unknown; props?: unknown }[])
      .filter((r) => typeof r?.name === 'string')
      .map((r) => ({ name: r.name as string, props: (r.props ?? {}) as Record<string, unknown> }));
    const index = indexEvents(events);
    const cities = new Set<string>(index.completedCities);
    // Check-in é pós-viagem por construção: quem registrou o que viveu também viveu a cidade.
    for (const city of index.livedByCity.keys()) cities.add(city);
    return cities;
  } catch {
    return new Set();
  }
}

/** As cidades canônicas que este usuário viveu. Uma leitura por sessão. Nunca lança. */
export function livedCities(): Promise<Set<string>> {
  if (!livedPromise) livedPromise = readLivedCities();
  return livedPromise;
}

/** Recomeça a leitura (troca de sessão, novo check-in). */
export function resetClaCache(): void {
  livedPromise = null;
  statsCache.clear();
  reactionsCache.clear();
}

/** Viveu esta cidade? Casa pelo nome canônico, como o motor de conquistas. */
export async function hasLivedCity(city: string): Promise<boolean> {
  const canonical = resolveCity(city);
  if (!canonical) return false;
  const lived = await livedCities();
  return lived.has(canonical);
}

// ---------------------------------------------------------------------------
// Estatísticas do clã — uma busca por cidade por sessão
// ---------------------------------------------------------------------------

const statsCache = new Map<string, Promise<Map<string, ClaStat>>>();

async function readStats(city: string): Promise<Map<string, ClaStat>> {
  const out = new Map<string, ClaStat>();
  try {
    const { data, error } = await kinuBeta.rpc('cla_stats', { p_city: city });
    if (error || !Array.isArray(data)) return out;
    for (const row of data as ClaStat[]) {
      if (row && typeof row.activity_id === 'string') {
        out.set(row.activity_id, {
          activity_id: row.activity_id,
          ups: Number(row.ups) || 0,
          downs: Number(row.downs) || 0,
          notes: Number(row.notes) || 0,
        });
      }
    }
  } catch {
    /* RPC fora do ar não pode apagar a tela */
  }
  return out;
}

/** Stats da cidade, cacheadas por sessão. Nunca lança. */
export function claStats(city: string, force = false): Promise<Map<string, ClaStat>> {
  if (!city) return Promise.resolve(new Map());
  if (force) statsCache.delete(city);
  let cached = statsCache.get(city);
  if (!cached) {
    cached = readStats(city);
    statsCache.set(city, cached);
  }
  return cached;
}

// ---------------------------------------------------------------------------
// Reações
// ---------------------------------------------------------------------------

const reactionsCache = new Map<string, Promise<MyReaction[]>>();

/** As reações do usuário na cidade, cacheadas por sessão (um card por atividade não pode virar
 *  um request por card). Nunca lança. */
export function myReactions(city = '', force = false): Promise<MyReaction[]> {
  if (force) reactionsCache.delete(city);
  let cached = reactionsCache.get(city);
  if (!cached) {
    cached = readMyReactions(city);
    reactionsCache.set(city, cached);
  }
  return cached;
}

async function readMyReactions(city?: string): Promise<MyReaction[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];
  try {
    let query = kinuBeta.from('cla_reactions').select('activity_id, city, kind, note').eq('user_id', userId);
    if (city) query = query.eq('city', city);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];
    return data as MyReaction[];
  } catch {
    return [];
  }
}

/**
 * Reage a uma atividade. Tocar de novo no mesmo 👍/👎 REMOVE a reação.
 * Devolve a reação resultante (`null` quando removida). Nunca lança.
 */
export async function react(params: {
  activityId: string;
  city: string;
  kind: ReactionKind;
  current?: ReactionKind | null;
  note?: string;
}): Promise<{ ok: boolean; kind: ReactionKind | null }> {
  const userId = getCurrentUserId();
  const { activityId, city, kind, current, note } = params;
  if (!userId || !activityId || !city) return { ok: false, kind: current ?? null };

  try {
    if (current === kind) {
      const { error } = await kinuBeta
        .from('cla_reactions')
        .delete()
        .eq('user_id', userId)
        .eq('activity_id', activityId);
      if (error) return { ok: false, kind: current };
      statsCache.delete(city);
      reactionsCache.clear();
      return { ok: true, kind: null };
    }

    const { error } = await kinuBeta
      .from('cla_reactions')
      .upsert(
        {
          user_id: userId,
          activity_id: activityId,
          city,
          kind,
          note: (note ?? '').slice(0, NOTE_MAX) || null,
        } as never,
        { onConflict: 'user_id,activity_id' }
      );
    if (error) return { ok: false, kind: current ?? null };

    statsCache.delete(city);
    reactionsCache.clear();
    trackEvent('cla.reaction', { activity_id: activityId, city, kind });
    return { ok: true, kind };
  } catch {
    return { ok: false, kind: current ?? null };
  }
}

// ---------------------------------------------------------------------------
// Sugestões
// ---------------------------------------------------------------------------

/** Sugestões públicas da cidade (RPC). Nunca lança. */
export async function suggestionsPublic(city: string): Promise<ClaSuggestionPublic[]> {
  if (!city) return [];
  try {
    const { data, error } = await kinuBeta.rpc('cla_suggestions_public', { p_city: city });
    if (error || !Array.isArray(data)) return [];
    return data as ClaSuggestionPublic[];
  } catch {
    return [];
  }
}

/** As sugestões do próprio usuário. Nunca lança. */
export async function mySuggestions(city?: string): Promise<MySuggestion[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];
  try {
    let query = kinuBeta.from('cla_suggestions').select('city, name, category, note, status').eq('user_id', userId);
    if (city) query = query.eq('city', city);
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];
    return data as MySuggestion[];
  } catch {
    return [];
  }
}

/** Manda um lugar para a curadoria. Nunca lança. */
export async function suggestPlace(params: {
  city: string;
  name: string;
  category: string;
  note?: string;
}): Promise<boolean> {
  const userId = getCurrentUserId();
  const name = params.name.trim();
  if (!userId || !params.city || name.length < 3 || name.length > 80) return false;
  try {
    const { error } = await kinuBeta.from('cla_suggestions').insert({
      user_id: userId,
      city: params.city,
      name,
      category: params.category,
      note: (params.note ?? '').slice(0, SUGGESTION_NOTE_MAX) || null,
      status: 'pending',
    } as never);
    if (error) return false;
    trackEvent('cla.suggestion', { city: params.city, category: params.category });
    return true;
  } catch {
    return false;
  }
}
