// Onboarding — flags de primeira viagem e telemetria leve.
//
// FONTE DA VERDADE: `profiles.preferences` (jsonb) do kinu-beta.
// O localStorage é só CACHE de leitura, para a UI não piscar enquanto o
// profile carrega. Quem manda é o banco.
//
// Chaves criadas dentro de preferences:
//   onboarding_welcome_seen : boolean — welcome mostrado/dispensado
//   onboarding_checklist_done : boolean — primeira viagem ativada (some pra sempre)
//
// Eventos: tabela `events` do kinu-beta pelo emissor único de `lib/kinuEvents.ts`
// (fire-and-forget, anel local como rede). Nunca lança, nunca bloqueia UI.

import { kinuBeta } from '@/integrations/kinu-beta/client';
import { trackEvent, type EventProps } from '@/lib/kinuEvents';

export type OnboardingPrefs = {
  onboarding_welcome_seen?: boolean;
  onboarding_checklist_done?: boolean;
  /** dicas contextuais já vistas, por área: { viagens: true, ... } */
  onboarding_hints?: Record<string, boolean>;
};

const CACHE_KEY = 'kinu_onboarding_prefs';

export function readCachedPrefs(): OnboardingPrefs {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingPrefs) : {};
  } catch {
    return {};
  }
}

function writeCache(prefs: OnboardingPrefs) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage cheio/bloqueado — o banco continua sendo a verdade */
  }
}

/** Lê preferences do profile. Falha de rede devolve o cache. */
export async function fetchOnboardingPrefs(userId: string): Promise<OnboardingPrefs> {
  try {
    const { data, error } = await kinuBeta
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return readCachedPrefs();
    const prefs = ((data as any).preferences ?? {}) as OnboardingPrefs;
    writeCache(prefs);
    return prefs;
  } catch {
    return readCachedPrefs();
  }
}

/** Merge não-destrutivo: lê, mescla e grava só as chaves passadas. */
export async function setOnboardingPref(
  userId: string,
  patch: OnboardingPrefs
): Promise<void> {
  writeCache({ ...readCachedPrefs(), ...patch });
  try {
    const { data } = await kinuBeta
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .maybeSingle();
    const current = ((data as any)?.preferences ?? {}) as Record<string, unknown>;
    await kinuBeta
      .from('profiles')
      .update({ preferences: { ...current, ...patch } })
      .eq('id', userId);
  } catch (e) {
    console.warn('[onboarding] falha ao gravar preferences', e);
  }
}

/** Marca uma dica como vista, mesclando dentro de onboarding_hints. */
export async function markHintSeen(userId: string, area: string): Promise<void> {
  const cached = readCachedPrefs();
  const hints = { ...(cached.onboarding_hints ?? {}), [area]: true };
  await setOnboardingPref(userId, { onboarding_hints: hints });
}

/** Zera todas as dicas — o guia volta a aparecer conforme a navegação. */
export async function resetHints(
  userId: string,
  extra: OnboardingPrefs = {}
): Promise<void> {
  await setOnboardingPref(userId, { onboarding_hints: {}, ...extra });
}

export type OnboardingEvent =
  | 'onboarding.welcome_shown'
  | 'onboarding.path_chosen'
  | 'onboarding.dismissed'
  | 'onboarding.checklist_done'
  | 'onboarding.hint_shown'
  | 'onboarding.guide_reset';

/**
 * Fire-and-forget, agora pelo emissor único (`lib/kinuEvents.ts`).
 *
 * O que havia aqui antes tentava três formatos de coluna em ordem
 * (`type/payload`, `event_type/data`, `name/properties`) porque o schema da tabela
 * `events` não era conhecido. Com o schema lido do PostgREST — `(user_id, name, props)` —
 * ficou claro que NENHUM dos três casava: esta telemetria nunca gravou uma linha. Um
 * formato só, o certo, e o anel local segurando o que não for aceito.
 *
 * A assinatura fica: os 7 pontos de chamada (Dashboard, Conta, HintBalloon) não mudam.
 */
export function trackOnboarding(
  event: OnboardingEvent,
  userId?: string,
  payload: Record<string, unknown> = {}
): void {
  trackEvent(event, payload as EventProps, userId);
}
