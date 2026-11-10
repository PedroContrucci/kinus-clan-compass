import { describe, it, expect } from 'vitest';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { closedIdsOnDate, unavailableIdsOnDate, isFreeOnHardHoliday } from '@/lib/seasonal';
import { HARD_HOLIDAYS, OPEN_CONFIRMED } from '@/data/openIds';
import { getDestinationActivities } from '@/data/destinationActivities';

// M18d — feriado duro: atração paga só entra se confirmada aberta.
const dayKey = (d: { date: Date | string }) => String(d.date instanceof Date ? d.date.toISOString() : d.date).slice(0, 10);
const catId = (id: string) => id.replace(/^day-\d+-/, '');

async function trip(id: string) {
  const sc = SMOKE_SCENARIOS.find((s) => s.id === id)!;
  expect(sc, id).toBeTruthy();
  const { buildDraftTrip } = await import('@/lib/createTrip');
  const { buildFlowInput } = await import('@/lib/onboardingFlow');
  const { addDays } = await import('date-fns');
  const input = buildFlowInput({ city: sc.city, origin: 'São Paulo', from: sc.from, to: addDays(sc.from, sc.nights), adults: sc.adults, children: sc.children, tier: sc.tier, childrenAges: sc.childrenAges });
  input.travelInterests = sc.interests;
  input.priorities = sc.interests;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (await buildDraftTrip(input, {})) as any;
  return { sc, days: t.days as { date: Date | string; activities: { id: string; name: string; timeSlot: string }[] }[] };
}
/** Atividades de passeio (catálogo, manhã/tarde) do dia. */
function tours(city: string, day: { activities: { id: string; name: string; timeSlot: string }[] }) {
  const cat = new Map(getDestinationActivities(city).map((a) => [a.id, a]));
  return day.activities.map((a) => cat.get(catId(a.id))).filter((a): a is NonNullable<typeof a> => !!a && (a.category === 'morning' || a.category === 'afternoon'));
}

describe('M18d — unavailableIdsOnDate (dado)', () => {
  const CITIES = [...Object.keys(HARD_HOLIDAYS), 'Rome', 'Tokyo', 'Madri', 'Cartagena'];
  const DATES = ['2026-12-10', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31', '2027-01-01', '2027-01-02'];

  it('⊇ closedIdsOnDate em toda cidade e data', () => {
    for (const c of CITIES) for (const d of DATES) {
      const closed = closedIdsOnDate(c, d);
      const un = unavailableIdsOnDate(c, d);
      for (const id of closed) expect(un.has(id), `${c} ${d} ${id}`).toBe(true);
    }
  });

  it('cidade fora de HARD_HOLIDAYS devolve exatamente closedIdsOnDate', () => {
    for (const c of ['Madri', 'Cartagena', 'Nova York']) for (const d of DATES) expect(unavailableIdsOnDate(c, d), `${c} ${d}`).toEqual(closedIdsOnDate(c, d));
  });

  it('fora das datas do feriado duro = closedIdsOnDate; Tóquio 25/12 não aplica a regra', () => {
    expect(unavailableIdsOnDate('Paris', '2026-12-26')).toEqual(closedIdsOnDate('Paris', '2026-12-26'));
    expect(unavailableIdsOnDate('Tóquio', '2026-12-25')).toEqual(closedIdsOnDate('Tóquio', '2026-12-25'));
    expect(unavailableIdsOnDate('Tóquio', '2027-01-01').size).toBeGreaterThan(closedIdsOnDate('Tóquio', '2027-01-01').size);
  });

  it('apelidos Rome/Tokyo normalizam para Roma/Tóquio', () => {
    expect(unavailableIdsOnDate('Rome', '2026-12-25')).toEqual(unavailableIdsOnDate('Roma', '2026-12-25'));
    expect(unavailableIdsOnDate('Tokyo', '2027-01-01')).toEqual(unavailableIdsOnDate('Tóquio', '2027-01-01'));
  });

  it('regra: pago/compras de manhã/tarde indisponível; livre disponível; refeição nunca; OPEN_CONFIRMED vazio; closedIds vence', () => {
    for (const c of Object.keys(HARD_HOLIDAYS)) expect(OPEN_CONFIRMED[c].ids, c).toEqual([]);
    const un = unavailableIdsOnDate('Roma', '2026-12-25');
    for (const a of getDestinationActivities('Roma')) {
      const slot = a.category === 'morning' || a.category === 'afternoon';
      expect(un.has(a.id), a.id).toBe(slot && !isFreeOnHardHoliday(a));
    }
    expect(unavailableIdsOnDate('Lisboa', '2026-12-25').has('lis-castelo-sao-jorge')).toBe(true);
  });

  it('Castelo de São Jorge fechado em 24/12, 25/12, 31/12 e 01/01; aberto em 23/12', () => {
    for (const d of ['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01']) expect(closedIdsOnDate('Lisboa', d).has('lis-castelo-sao-jorge'), d).toBe(true);
    expect(closedIdsOnDate('Lisboa', '2026-12-23').has('lis-castelo-sao-jorge')).toBe(false);
  });
});

describe('M18d — cenários de smoke', () => {
  it('Lisboa Natal 20–27/12: em 25/12 nenhuma paga; Castelo fora de 24 e 25/12', async () => {
    const { days } = await trip('Lisboa Natal 20–27/12 2 adultos');
    for (const d of days.filter((x) => ['2026-12-24', '2026-12-25'].includes(dayKey(x)))) {
      expect(d.activities.some((a) => /lis-castelo-sao-jorge$/.test(a.id)), dayKey(d)).toBe(false);
    }
    const d25 = days.find((x) => dayKey(x) === '2026-12-25')!;
    for (const a of tours('Lisboa', d25)) expect(isFreeOnHardHoliday(a), a.id).toBe(true);
  }, 60000);

  it('Roma Réveillon: em 01/01 nenhuma paga de manhã/tarde; R23 PASS; R17 ÍCONE ≠ FAIL', async () => {
    const { sc, days } = await trip('Roma Réveillon 28/12–02/01 2 adultos');
    const d1 = days.find((x) => dayKey(x) === '2027-01-01')!;
    expect(d1).toBeTruthy();
    for (const a of tours('Roma', d1)) expect(a.estimatedCostBRL, a.id).toBe(0);
    const row = await runSmokeScenario(sc);
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
    expect(row.r17icon?.status).not.toBe('FAIL');
  }, 60000);

  it('Tóquio Réveillon: em 01/01 nenhuma paga nem de compras; R23 PASS', async () => {
    const { sc, days } = await trip('Tóquio Réveillon 28/12–03/01 2 adultos');
    const d1 = days.find((x) => dayKey(x) === '2027-01-01')!;
    expect(d1).toBeTruthy();
    for (const a of tours('Tóquio', d1)) { expect(a.estimatedCostBRL, a.id).toBe(0); expect(isFreeOnHardHoliday(a), a.id).toBe(true); }
    const row = await runSmokeScenario(sc);
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
  }, 60000);
});
