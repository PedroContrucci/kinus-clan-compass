import { describe, it, expect } from 'vitest';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { closedIdsOnDate } from '@/lib/seasonal';
import { SEASONAL_NOTES } from '@/data/seasonalNotes';

// M18c — Gulbenkian fecha 24 e 25/12 e 01/01 (gulbenkian.pt/museu/en/visit).
const ID = 'Lisboa Natal 20–27/12 2 adultos';

describe('M18c — Gulbenkian (dado)', () => {
  it('closedIds: fechada em 24/12, 25/12 e 01/01; aberta em 23/12 e 26/12; Jerónimos intacto', () => {
    for (const d of ['2026-12-24', '2026-12-25', '2027-01-01']) expect(closedIdsOnDate('Lisboa', d).has('lis-gulbenkian'), d).toBe(true);
    for (const d of ['2026-12-23', '2026-12-26']) expect(closedIdsOnDate('Lisboa', d).has('lis-gulbenkian'), d).toBe(false);
    expect(closedIdsOnDate('Lisboa', '2026-12-25').has('lis-jeronimos')).toBe(true);
  });

  it('as linhas novas entram no fim de closures, com o índice certo em closedIds', () => {
    const dez = SEASONAL_NOTES.find((n) => n.city === 'Lisboa' && n.month === 12)!;
    const jan = SEASONAL_NOTES.find((n) => n.city === 'Lisboa' && n.month === 1)!;
    expect(dez.closures[2]).toBe('24/12 e 25/12: Museu Calouste Gulbenkian fechado');
    expect(dez.closedIds).toEqual({ 0: ['lis-jeronimos', 'lis-torre-belem'], 2: ['lis-gulbenkian'] });
    expect(jan.closures[1]).toBe('01/01: Museu Calouste Gulbenkian fechado');
    expect(jan.closedIds).toEqual({ 0: ['lis-jeronimos', 'lis-torre-belem'], 1: ['lis-gulbenkian'] });
  });
});

describe('M18c — cenário de smoke (Lisboa Natal)', () => {
  it(`${ID}: sem Gulbenkian em 24 e 25/12; R23 PASS; R17 OBRIGATÓRIO ≠ FAIL; toda manhã de exploração com atividade`, async () => {
    const sc = SMOKE_SCENARIOS.find((s) => s.id === ID)!;
    expect(sc).toBeTruthy();
    const { buildDraftTrip } = await import('@/lib/createTrip');
    const { buildFlowInput } = await import('@/lib/onboardingFlow');
    const { addDays } = await import('date-fns');
    const input = buildFlowInput({ city: sc.city, origin: 'São Paulo', from: sc.from, to: addDays(sc.from, sc.nights), adults: sc.adults, children: sc.children, tier: sc.tier, childrenAges: sc.childrenAges });
    input.travelInterests = sc.interests;
    input.priorities = sc.interests;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trip = (await buildDraftTrip(input, {})) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days = trip.days as any[];
    const key = (d: { date: Date | string }) => String(d.date instanceof Date ? d.date.toISOString() : d.date).slice(0, 10);
    for (const d of days.filter((x) => ['2026-12-24', '2026-12-25'].includes(key(x)))) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(d.activities.some((a: any) => /-lis-gulbenkian$/.test(a.id)), key(d)).toBe(false);
    }
    // dia de exploração = nem chegada (check-in) nem partida/voo: todo dia assim precisa de atividade de manhã.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const explor = days.filter((d) => !d.activities.some((a: any) => a.timeSlot === 'flight' || a.timeSlot === 'hotel'));
    expect(explor.length).toBe(5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const d of explor) expect(d.activities.some((a: any) => a.timeSlot === 'morning'), key(d)).toBe(true);
    const row = await runSmokeScenario(sc);
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
    expect(row.r17must?.status).not.toBe('FAIL');
  }, 60000);
});
