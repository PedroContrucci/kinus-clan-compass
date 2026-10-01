import { describe, it, expect } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { applyEstimatedFlights, initialDraftStage } from '@/components/cockpit/DraftCockpit';
import { kinuDidLines } from '@/lib/onboardingFlow';
import { isKinuBuilt } from '@/lib/kinuBuilt';

async function onboardingDraft() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trip: any = await buildDraftTrip({
    originCity: 'São Paulo', originAirportCode: 'GRU',
    destinationCity: 'Cartagena', destinationAirportCode: 'CTG',
    departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-15T12:00:00'),
    adults: 2, children: [], infants: 0,
    budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
    travelInterests: [], priorities: [],
  });
  trip.createdVia = 'onboarding';
  trip.onboardingFlow = 'v2';
  return trip;
}

describe('estimativa de voo como selecionada (onboarding)', () => {
  it('isKinuBuilt aceita kinu e onboarding, nada mais', () => {
    expect(isKinuBuilt({ createdVia: 'kinu' })).toBe(true);
    expect(isKinuBuilt({ createdVia: 'onboarding' })).toBe(true);
    expect(isKinuBuilt({ createdVia: 'wizard' })).toBe(false);
    expect(isKinuBuilt({})).toBe(false);
  });

  it('(1) abre no 07 Roteiro com a estimativa selecionada, source estimate', async () => {
    const trip = applyEstimatedFlights(await onboardingDraft());
    expect(initialDraftStage(trip)).toBe('itinerary');
    expect(trip.outboundFlight?.source).toBe('estimate');
    expect(trip.returnFlight?.source).toBe('estimate');
  });

  it('(2) orçamento de voos > 0 logo após abrir', async () => {
    const trip = applyEstimatedFlights(await onboardingDraft());
    expect(Number(trip.finances.categories.flights.planned)).toBeGreaterThan(0);
  });

  it('(3) linha do voo e sufixo do orçamento no card', async () => {
    const trip = applyEstimatedFlights(await onboardingDraft());
    trip.startDate = '2026-11-10'; trip.endDate = '2026-11-15';
    const l = kinuDidLines(trip);
    expect(l.flight).toBe('Voo estimado · ida 10/11 · volta 15/11 · escolha o voo real para fechar o orçamento');
    expect(l.budget.endsWith(' · fecha ao escolher o voo')).toBe(true);
    const real = { ...trip, outboundFlight: { ...trip.outboundFlight, source: 'amadeus' } };
    expect(kinuDidLines(real).budget).not.toContain('fecha ao escolher');
  });

  it('(4) migração idempotente e não sobrescreve voo escolhido', async () => {
    const once = applyEstimatedFlights(await onboardingDraft());
    expect(applyEstimatedFlights(once)).toBe(once);
    const chosen = { ...(await onboardingDraft()), outboundFlight: { source: 'amadeus' } };
    expect(applyEstimatedFlights(chosen)).toBe(chosen);
    const wizard = { ...(await onboardingDraft()), createdVia: 'wizard' };
    expect(applyEstimatedFlights(wizard)).toBe(wizard);
  });
});
