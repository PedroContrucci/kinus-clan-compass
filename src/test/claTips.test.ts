import { describe, expect, it } from 'vitest';
import { buildTipRow, freshnessLine } from '@/lib/claTips';
import { matchesPriority, PRIORITY_CHIPS } from '@/lib/claChips';

describe('claTips', () => {
  it('place sem activity vira city', () => {
    const row = buildTipRow('u', { city: ' Paris ', scope: 'place', kind: 'custo', text: '  abc def ghi  ' }, true);
    expect(row).toMatchObject({ city: 'Paris', scope: 'city', activity_id: null, text: 'abc def ghi', lived: true, supersedes_id: null });
  });
  it('supersedes preservado', () => {
    expect(buildTipRow('u', { city: 'X', scope: 'place', activityId: 'a1', kind: 'geral', text: '1234567890', supersedesId: 't0' }, false))
      .toMatchObject({ scope: 'place', activity_id: 'a1', supersedes_id: 't0' });
  });
  it('frescor', () => {
    const now = Date.parse('2026-09-25T12:00:00Z');
    expect(freshnessLine(0, null, now)).toBe('ainda sem confirmação');
    expect(freshnessLine(3, '2026-09-13T12:00:00Z', now)).toBe('confirmada há 12 dias por 3 pessoas');
  });
});

describe('claChips', () => {
  it('espelha o wizard e casa refeição em gastronomia', () => {
    expect(PRIORITY_CHIPS[0].id).toBe('gastronomy');
    expect(matchesPriority({ category: 'dinner', styleTags: [] }, 'gastronomy')).toBe(true);
    expect(matchesPriority({ category: 'night', styleTags: [] }, 'nightlife')).toBe(true);
    expect(matchesPriority({ category: 'morning', styleTags: ['family'] }, 'beach')).toBe(false);
  });
});
