// planTotals — custo real do plano e o envelope (orçamento) derivado dele.
// Puro: lê trip.finances.categories gravado pela etapa do roteiro (computeBuckets).

/** Reserva para imprevistos somada ao custo do plano no envelope. Única fonte do 15%. */
export const RESERVE_RATE = 0.15;

export type BudgetSource = 'plan' | 'user';

export interface PlanBreakdown {
  flights: number;
  hotel: number;
  food: number;
  tours: number;
  total: number;
}

const n = (v: unknown) => Math.round(Number(v) || 0);

/** Quatro parcelas do custo estimado; total = soma exata das quatro. */
export function planBreakdown(trip: { finances?: { categories?: Record<string, { planned?: number } | undefined> } }): PlanBreakdown {
  const c = trip?.finances?.categories ?? {};
  const flights = n(c.flights?.planned);
  const hotel = n(c.accommodation?.planned);
  const food = n(c.food?.planned);
  const tours = n(c.tours?.planned);
  return { flights, hotel, food, tours, total: flights + hotel + food + tours };
}

export function reserveFor(planTotal: number): number {
  return Math.round(planTotal * RESERVE_RATE);
}

/** Envelope = custo do plano + reserva nomeada. */
export function envelopeFor(planTotal: number): number {
  return Math.round(planTotal) + reserveFor(planTotal);
}

/** O envelope acompanha o plano: rascunho montado pelo fluxo guiado, sem edição explícita do usuário. */
// Rascunhos do fluxo guiado salvos antes do campo existir (sem budgetSource) também seguem o plano.
export function budgetFollowsPlan(trip: { status?: unknown; budgetSource?: unknown; createdVia?: unknown } | null | undefined): boolean {
  if (!trip || trip.status !== 'draft') return false;
  if (trip.budgetSource === 'user') return false;
  return trip.budgetSource === 'plan' || (trip.budgetSource == null && trip.createdVia === 'onboarding');
}

/**
 * Envelope que segue o plano: grava budget = finances.total = envelope do custo atual
 * (soma das 4 parcelas) e recalcula available. Idempotente; viagens fora da regra voltam iguais.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function followPlanEnvelope<T extends Record<string, any>>(trip: T): T {
  if (!budgetFollowsPlan(trip) || !trip.finances) return trip;
  const { total } = planBreakdown(trip);
  if (total <= 0) return trip;
  const envelope = envelopeFor(total);
  if (trip.budget === envelope && trip.finances.total === envelope) return trip;
  const f = trip.finances;
  const planned = Number(f.planned) || total;
  return {
    ...trip,
    budget: envelope,
    finances: {
      ...f,
      total: envelope,
      available: Math.max(0, envelope - planned - (Number(f.bidding) || 0) - (Number(f.confirmed) || 0)),
    },
  };
}
