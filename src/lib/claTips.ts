// Dicas do clã — camada viva estilo Waze sobre o catálogo (kinu-beta).
//   cla_tips(user_id, city, scope 'city'|'place', activity_id, kind, text 10–280, lived, supersedes_id)
//   cla_tip_votes(tip_id, user_id, vote 'confirm'|'outdated')  — um por usuário, atualizável
//   cla_tips_public(p_city)    -> dicas vivas com confirmations, disputes, last_confirmed_at
//   cla_tips_for_agent(p_city) -> dicas que o agente pode usar
// INVARIANTE: nada aqui lança.
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { getCurrentUserId } from '@/lib/session';
import { trackEvent } from '@/lib/kinuEvents';
import { hasLivedCity } from '@/lib/cla';

export type TipScope = 'city' | 'place';
export type TipKind = 'levar' | 'lembrar' | 'custo' | 'horario' | 'familia' | 'geral';
export type TipVote = 'confirm' | 'outdated';

export const TIP_KINDS: { value: TipKind; label: string }[] = [
  { value: 'levar', label: '🎒 Levar' },
  { value: 'lembrar', label: '📌 Lembrar' },
  { value: 'custo', label: '💰 Custo' },
  { value: 'horario', label: '🕒 Horário' },
  { value: 'familia', label: '👨‍👩‍👧 Família' },
  { value: 'geral', label: '💬 Geral' },
];
export const TIP_MIN = 10;
export const TIP_MAX = 280;

export interface ClaTip {
  id: string;
  city: string;
  scope: TipScope;
  activity_id: string | null;
  kind: TipKind;
  text: string;
  lived: boolean;
  created_at: string;
  confirmations: number;
  disputes: number;
  last_confirmed_at: string | null;
}

export interface AgentClaTip {
  scope: TipScope;
  activity_id: string | null;
  kind: TipKind;
  text: string;
  confirmations: number;
  last_confirmed_at: string | null;
}

const toTip = (r: Record<string, unknown>): ClaTip => ({
  id: String(r.id ?? ''),
  city: String(r.city ?? ''),
  scope: r.scope === 'place' ? 'place' : 'city',
  activity_id: typeof r.activity_id === 'string' ? r.activity_id : null,
  kind: (TIP_KINDS.some((k) => k.value === r.kind) ? r.kind : 'geral') as TipKind,
  text: String(r.text ?? ''),
  lived: Boolean(r.lived),
  created_at: String(r.created_at ?? ''),
  confirmations: Number(r.confirmations) || 0,
  disputes: Number(r.disputes) || 0,
  last_confirmed_at: typeof r.last_confirmed_at === 'string' ? r.last_confirmed_at : null,
});

/** Dicas vivas da cidade. Nunca lança. */
export async function tipsPublic(city: string): Promise<ClaTip[]> {
  if (!city) return [];
  try {
    const { data, error } = await kinuBeta.rpc('cla_tips_public', { p_city: city });
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map(toTip).filter((t) => t.id && t.text);
  } catch {
    return [];
  }
}

/** Meus votos para as dicas dadas. Nunca lança. */
export async function myTipVotes(ids: string[]): Promise<Map<string, TipVote>> {
  const userId = getCurrentUserId();
  if (!userId || !ids.length) return new Map();
  try {
    const { data, error } = await kinuBeta
      .from('cla_tip_votes').select('tip_id, vote').eq('user_id', userId).in('tip_id', ids);
    if (error || !Array.isArray(data)) return new Map();
    return new Map((data as { tip_id: string; vote: TipVote }[]).map((r) => [r.tip_id, r.vote]));
  } catch {
    return new Map();
  }
}

/** Vota; `current === vote` remove o voto (toggle). Devolve o voto resultante. */
export async function voteTip(tipId: string, vote: TipVote, current?: TipVote | null): Promise<{ ok: boolean; vote: TipVote | null }> {
  const userId = getCurrentUserId();
  if (!userId || !tipId) return { ok: false, vote: current ?? null };
  try {
    if (current === vote) {
      const { error } = await kinuBeta.from('cla_tip_votes').delete().eq('user_id', userId).eq('tip_id', tipId);
      if (error) return { ok: false, vote: current };
      agentCache.clear();
      return { ok: true, vote: null };
    }
    const { error } = await kinuBeta
      .from('cla_tip_votes')
      .upsert({ tip_id: tipId, user_id: userId, vote } as never, { onConflict: 'tip_id,user_id' });
    if (error) return { ok: false, vote: current ?? null };
    agentCache.clear();
    trackEvent('cla.tip_vote', { tip_id: tipId, vote });
    return { ok: true, vote };
  } catch {
    return { ok: false, vote: current ?? null };
  }
}

export interface LeaveTipInput {
  city: string;
  scope: TipScope;
  activityId?: string | null;
  kind: TipKind;
  text: string;
  supersedesId?: string | null;
}

/** Monta a linha exata de `cla_tips`. Pura — exportada para teste. */
export function buildTipRow(userId: string, p: LeaveTipInput, lived: boolean) {
  const place = p.scope === 'place' && p.activityId;
  return {
    user_id: userId,
    city: p.city.trim(),
    scope: place ? ('place' as const) : ('city' as const),
    activity_id: place ? p.activityId : null,
    kind: p.kind,
    text: p.text.trim().slice(0, TIP_MAX),
    lived,
    supersedes_id: p.supersedesId ?? null,
  };
}

/** Deixa uma dica (ou a nova versão de uma que mudou). Nunca lança. */
export async function leaveTip(p: LeaveTipInput): Promise<boolean> {
  const userId = getCurrentUserId();
  const text = p.text.trim();
  if (!userId || !p.city || text.length < TIP_MIN || text.length > TIP_MAX) return false;
  try {
    const lived = await hasLivedCity(p.city);
    const row = buildTipRow(userId, p, lived);
    const { error } = await kinuBeta.from('cla_tips').insert(row as never);
    if (error) return false;
    if (p.supersedesId) await voteTip(p.supersedesId, 'outdated');
    agentCache.clear();
    trackEvent('cla.tip', { city: row.city, scope: row.scope, kind: row.kind });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Para o agente — cache por sessão, máx. 40
// ---------------------------------------------------------------------------
const agentCache = new Map<string, Promise<AgentClaTip[]>>();

export function tipsForAgent(city: string): Promise<AgentClaTip[]> {
  if (!city) return Promise.resolve([]);
  let cached = agentCache.get(city);
  if (!cached) {
    cached = (async () => {
      try {
        const { data, error } = await kinuBeta.rpc('cla_tips_for_agent', { p_city: city });
        if (error || !Array.isArray(data)) return [];
        return (data as Record<string, unknown>[]).map(toTip).filter((t) => t.text).slice(0, 40).map((t) => ({
          scope: t.scope, activity_id: t.activity_id, kind: t.kind, text: t.text,
          confirmations: t.confirmations, last_confirmed_at: t.last_confirmed_at,
        }));
      } catch {
        return [];
      }
    })();
    agentCache.set(city, cached);
  }
  return cached;
}

/** "confirmada há 12 dias por 3 pessoas" / "ainda sem confirmação". Pura. */
export function freshnessLine(confirmations: number, lastConfirmedAt: string | null, now = Date.now()): string {
  if (!confirmations || !lastConfirmedAt) return 'ainda sem confirmação';
  const t = Date.parse(lastConfirmedAt);
  if (!Number.isFinite(t)) return 'ainda sem confirmação';
  const days = Math.max(0, Math.floor((now - t) / 86_400_000));
  const when = days === 0 ? 'hoje' : days === 1 ? 'há 1 dia' : `há ${days} dias`;
  return `confirmada ${when} por ${confirmations} ${confirmations === 1 ? 'pessoa' : 'pessoas'}`;
}
