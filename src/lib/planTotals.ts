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
export function budgetFollowsPlan(trip: { status?: unknown; budgetSource?: unknown } | null | undefined): boolean {
  return Boolean(trip) && trip!.status === 'draft' && trip!.budgetSource === 'plan';
}
