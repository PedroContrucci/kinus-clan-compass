import { describe, it, expect } from 'vitest';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { iconIdOf, countryOf, resolveOrigin, buildFlowInput, defaultDates, estimateBudget } from '@/lib/onboardingFlow';
import { differenceInDays } from 'date-fns';

describe('onboardingFlow', () => {
  it('toda cidade curada tem país', () => {
    for (const c of CURATED_CITIES) expect(countryOf(c), c).not.toBe('');
  });
  it('iconIdOf devolve o item icon quando existe', () => {
    expect(iconIdOf('Paris')).toBe('paris-tour-eiffel-top');
  });
  it('origem: perfil ou São Paulo assumido', () => {
    expect(resolveOrigin('Recife')).toEqual({ city: 'Recife', source: 'profile' });
    expect(resolveOrigin('')).toEqual({ city: 'São Paulo', source: 'default' });
  });
  it('defaults: 5 noites, 2 adultos, orçamento pela tabela do assistente', () => {
    const { from, to } = defaultDates(new Date(2026, 0, 15));
    expect(differenceInDays(to, from)).toBe(5);
    const input = buildFlowInput({ city: 'Lisboa', origin: 'São Paulo', from, to, adults: 2, children: 0, tier: 'comfort' });
    expect(input.budgetAmount).toBe(estimateBudget('Lisboa', 'comfort', 2, 5));
    expect(input.budgetAmount).toBeGreaterThan(0);
  });
});
