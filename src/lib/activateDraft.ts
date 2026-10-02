/**
 * Caminho ÚNICO de ativação de rascunho (card "O que o KINU fez" e cockpit).
 *
 * Ativa exatamente o que está gravado: trip.days, trip.finances, outboundFlight/returnFlight,
 * hotel. Nunca gera, recalcula nem completa dias — o rascunho já é o roteiro. Rascunho sem
 * dias (legado) ou sem voo de ida e volta é recusado com mensagem; a estimativa conta como voo.
 */
import { getTrip, updateTrip, type StoredTrip } from '@/lib/tripStore';
import { trackTripActivated } from '@/lib/tripEvents';
import { trackEvent } from '@/lib/kinuEvents';

export type ActivationRefusal = 'not_found' | 'not_draft' | 'no_days' | 'no_flight';

export type ActivationResult =
  | { ok: true; trip: StoredTrip }
  | { ok: false; reason: ActivationRefusal; message: string };

export const ACTIVATION_MESSAGES: Record<ActivationRefusal, string> = {
  not_found: 'Não encontrei este rascunho.',
  not_draft: 'Esta viagem já está ativa.',
  no_days: 'Este rascunho não tem roteiro. Toque em “Regerar roteiro” e ative de novo.',
  no_flight: 'Escolha os voos de ida e volta antes de ativar.',
};

function hasDays(trip: StoredTrip): boolean {
  return Array.isArray(trip.days)
    && trip.days.some((d) => Array.isArray(d?.activities) && d.activities.length > 0);
}

/** Checagem pura, igual para os dois botões. */
export function checkActivation(trip: StoredTrip | null): ActivationRefusal | null {
  if (!trip) return 'not_found';
  if (trip.status !== 'draft') return 'not_draft';
  if (!hasDays(trip)) return 'no_days';
  if (!trip.outboundFlight || !trip.returnFlight) return 'no_flight';
  return null;
}

export function activateDraft(tripId: string, userId?: string): ActivationResult {
  const refusal = checkActivation(getTrip(tripId));
  if (refusal) return { ok: false, reason: refusal, message: ACTIVATION_MESSAGES[refusal] };

  // Só o status muda; dias, finanças, voos e hotel seguem como gravados.
  const stored = updateTrip(tripId, (t) => ({ ...t, status: 'active' }));
  if (!stored) return { ok: false, reason: 'not_found', message: ACTIVATION_MESSAGES.not_found };

  // Uma emissão por viagem: a marca na viagem (dentro do trackTripActivated) garante.
  trackTripActivated(tripId);

  // Onboarding v2: idempotente pela marca na viagem.
  if (stored.onboardingFlow === 'v2' && !stored.onboardingActivatedAt) {
    const marked = updateTrip(tripId, (t) => ({ ...t, onboardingActivatedAt: new Date().toISOString() }));
    if (marked) trackEvent('onboarding.activated', { trip_id: tripId }, userId);
  }

  return { ok: true, trip: getTrip(tripId) ?? stored };
}
