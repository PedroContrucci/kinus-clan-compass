import { describe, it, expect } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput, defaultDates, kinuDidLines } from '@/lib/onboardingFlow';
import { planBreakdown, followPlanEnvelope, budgetFollowsPlan, envelopeFor, RESERVE_RATE } from '@/lib/planTotals';

async function onboardingDraft(city: string) {
  const { from, to } = defaultDates(new Date(2026, 0, 15));
  const trip = await buildDraftTrip(buildFlowInput({ city, origin: 'São Paulo', from, to, adults: 2, children: 0, tier: 'comfort' }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return followPlanEnvelope({ ...(trip as any), createdVia: 'onboarding', budgetSource: 'plan' });
}

describe('budget truth', () => {
  it('total do plano = soma das quatro parcelas; budget = total × (1 + reserva)', async () => {
    for (const city of ['Cartagena', 'Lisboa', 'Fortaleza']) {
      const t = await onboardingDraft(city);
      const p = planBreakdown(t);
      expect(p.total).toBe(p.flights + p.hotel + p.food + p.tours);
      expect(p.total).toBeGreaterThan(0);
      expect(t.budget).toBe(Math.round(p.total) + Math.round(p.total * RESERVE_RATE));
      expect(t.finances.total).toBe(t.budget);
      // Análise: insuficiente quando custo > budget — nunca no draft montado pelo KINU.
      expect(p.total).toBeLessThanOrEqual(t.budget);
    }
  });

  it('segue o plano quando os custos mudam (recompute da etapa) e é idempotente', async () => {
    const t = await onboardingDraft('Cartagena');
    const changed = { ...t, finances: { ...t.finances, categories: { ...t.finances.categories, food: { planned: 999, confirmed: 0, bidding: 0 } } } };
    const after = followPlanEnvelope(changed);
    expect(after.budget).toBe(envelopeFor(planBreakdown(after).total));
    expect(followPlanEnvelope(after)).toBe(after);
  });

  it("congela com budgetSource 'user' e após Ativar", async () => {
    const t = await onboardingDraft('Lisboa');
    expect(budgetFollowsPlan({ ...t, budgetSource: 'user' })).toBe(false);
    expect(budgetFollowsPlan({ ...t, status: 'active' })).toBe(false);
    expect(budgetFollowsPlan({ status: 'draft', createdVia: 'wizard' })).toBe(false);
    expect(budgetFollowsPlan({ status: 'draft', createdVia: 'onboarding' })).toBe(true);
    const frozen = { ...t, status: 'active', budget: 1 };
    expect(followPlanEnvelope(frozen)).toBe(frozen);
  });

  it('card: linha fechada mostra o total; detalhe as quatro parcelas e a reserva', async () => {
    const t = await onboardingDraft('Cartagena');
    const l = kinuDidLines(t);
    expect(l.budget.startsWith(`R$ ${t.budget.toLocaleString('pt-BR')}`)).toBe(true);
    expect(l.budgetDetail).toMatch(/voo R\$ .* · hotel R\$ .* · alimentação R\$ .* · passeios R\$ .*inclui reserva de 15% \(R\$/);
  });
});
