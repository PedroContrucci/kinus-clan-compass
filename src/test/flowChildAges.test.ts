import { describe, it, expect } from 'vitest';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { buildDraftTrip } from '@/lib/createTrip';
import type { StoredTrip } from '@/lib/tripStore';

describe('fluxo curto: idades das crianças', () => {
  it('2 crianças de 8 e 12 anos → childrenAges [8, 12]', async () => {
    const input = buildFlowInput({ city: 'Lisboa', origin: 'São Paulo', from: new Date(2026, 11, 10), to: new Date(2026, 11, 15), adults: 2, children: 2, childrenAges: [8, 12], tier: 'comfort' });
    const trip = (await buildDraftTrip(input)) as StoredTrip;
    expect(trip.childrenAges).toEqual([8, 12]);
  });
});
