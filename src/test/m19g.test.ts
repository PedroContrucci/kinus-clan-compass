import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { validateEssentials, validateMustSee, weekdayOf, type PlanDay, type PlanRulesContext } from '@/lib/itineraryValidator';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { closedIdsOnDate } from '@/lib/seasonal';
import { getActivityPrice } from '@/lib/activityPricing';
import { CURATED_MUST_SEE } from '@/data/generated/mustSee';
import { LANDMARKS } from '@/data/generated/landmarkTiers';
import { getDestinationActivities } from '@/data/destinationActivities';

// M19g — obrigatório (must_see): primeiro entre os essenciais, force próprio no último dia aberto, R17 OBRIGATÓRIO.
// Os mocks deixam os testes sintéticos marcar must_see e mexer nos dias de abertura sem editar src/data; vazio = dado real.
const { dow, extraMust } = vi.hoisted(() => ({ dow: {} as Record<string, number[]>, extraMust: new Set<string>() }));
vi.mock('@/data/generated/daysOfWeek', async () => {
  const actual = await vi.importActual<typeof import('@/data/generated/daysOfWeek')>('@/data/generated/daysOfWeek');
  const proxy = new Proxy(actual.CURATED_DAYS_OF_WEEK as Record<string, number[]>, {
    get: (t, k: string) => (k in dow ? dow[k] : t[k]),
    has: (t, k: string) => k in dow || k in t,
  });
  return { ...actual, CURATED_DAYS_OF_WEEK: proxy };
});
vi.mock('@/lib/mustSee', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mustSee')>('@/lib/mustSee');
  return { isMustSee: (id: string) => extraMust.has(id) || actual.isMustSee(id) };
});
beforeEach(() => { for (const k of Object.keys(dow)) delete dow[k]; extraMust.clear(); });

const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d),
  source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
// Lisboa 10–17/11: exploração de qua 11 a seg 16/11; Torre de Belém (ícone) sai no 11.
const lisboa = () => runItineraryEngine({
  departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
  destination: 'Lisboa', origin: 'São Paulo',
  outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
  budget: 30000, travelers: 2, interests: ['gastronomia', 'cultura'], jetLagSeverity: 'MODERADO', priceLevel: 'midrange',
  hotel: { nightlyRate: getActivityPrice('hotel_night', 'Lisboa', 'midrange') },
});
type Out = ReturnType<typeof lisboa>;
const dayOf = (r: Out, id: string) => r.days.findIndex((d) => d.activities.some((a) => a.id.endsWith(`-${id}`)));
const toPlan = (r: Out): PlanDay[] => r.days.map((d) => ({
  day: d.dayNumber, date: d.date.toISOString().slice(0, 10), title: d.label,
  activities: d.activities.map((a) => ({ id: a.id, name: a.name, timeSlot: a.timeSlot })),
}));
const lisCtx: PlanRulesContext = { destination: 'Lisboa', interests: [], arrivalDate: '2026-11-10', arrivalTime: '15:00', domestic: false };

describe('M19g — mustSee.ts (gerado pelo sync)', () => {
  it('Paris: Louvre e Orsay; todo must_see é essencial de manhã/tarde do catálogo', () => {
    expect([...CURATED_MUST_SEE]).toEqual(['paris-louvre', 'paris-orsay']);
    const paris = getDestinationActivities('Paris');
    for (const id of CURATED_MUST_SEE) {
      expect(LANDMARKS['Paris'].tiers[id]).toBe('essential');
      expect(['morning', 'afternoon']).toContain(paris.find((a) => a.id === id)?.category);
    }
  });
});

describe('M19g — cenários de smoke (Natal em Paris)', () => {
  for (const id of ['Paris Natal 20–27/12 2+2', 'Paris Natal gastrô 20–27/12 2 adultos']) {
    it(`${id}: Louvre em 23, 24 ou 26/12; R17 OBRIGATÓRIO ≠ FAIL; R17 ÍCONE PASS`, async () => {
      const sc = SMOKE_SCENARIOS.find((s) => s.id === id)!;
      expect(sc).toBeTruthy();
      const row = await runSmokeScenario(sc);
      expect(row.error).toBeUndefined();
      expect(row.r17must?.status).not.toBe('FAIL');
      expect(row.r17icon?.status).toBe('PASS');
      expect(row.r23?.status).toBe('PASS');
      expect(row.r18?.status).toBe('PASS');
    }, 60000);
  }

  it('Paris Natal 2+2: Louvre num dia aberto (23, 24 ou 26/12) e Versalhes segue em 24/12', async () => {
    const { buildDraftTrip } = await import('@/lib/createTrip');
    const { buildFlowInput } = await import('@/lib/onboardingFlow');
    const { addDays } = await import('date-fns');
    const sc = SMOKE_SCENARIOS.find((s) => s.id === 'Paris Natal 20–27/12 2+2')!;
    const input = buildFlowInput({ city: sc.city, origin: 'São Paulo', from: sc.from, to: addDays(sc.from, sc.nights), adults: sc.adults, children: sc.children, tier: sc.tier, childrenAges: sc.childrenAges });
    input.travelInterests = sc.interests;
    input.priorities = sc.interests;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trip = (await buildDraftTrip(input, {})) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days = (trip.days as any[]).filter((d) => d.activities.some((a: any) => /-paris-louvre$/.test(a.id)));
    expect(days).toHaveLength(1);
    expect(['2026-12-23', '2026-12-24', '2026-12-26']).toContain(String(days[0].date).slice(0, 10));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vers = (trip.days as any[]).filter((d) => d.activities.some((a: any) => /-par3-versailles$/.test(a.id)));
    expect(vers.map((d) => String(d.date).slice(0, 10))).toEqual(['2026-12-24']);
  }, 60000);
});

describe('M19g — motor (sintético em Lisboa)', () => {
  it('entre essenciais, o obrigatório de maior rating vem primeiro, mesmo contra o tema do dia', () => {
    // Castelo (4,5) sai naturalmente no 12/11; Alfama (4,7) fica de fora. Marcados os dois, Alfama vem antes.
    expect(dayOf(lisboa(), 'lis-alfama-walk')).toBe(-1);
    extraMust.add('lis-castelo-sao-jorge');
    extraMust.add('lis-alfama-walk');
    const r = lisboa();
    const alfama = dayOf(r, 'lis-alfama-walk');
    const castelo = dayOf(r, 'lis-castelo-sao-jorge');
    expect(alfama).toBeGreaterThan(0);
    if (castelo >= 0) expect(alfama).toBeLessThan(castelo);
  });

  it('obrigatório aberto só no último dia de exploração entra nesse dia (force próprio)', () => {
    extraMust.add('lis-baixa-chiado');
    dow['lis-baixa-chiado'] = [1]; // só segunda — 16/11, o último dia de exploração
    const r = lisboa();
    const d = dayOf(r, 'lis-baixa-chiado');
    expect(d).toBeGreaterThan(0);
    expect(weekdayOf(r.days[d].date)).toBe(1);
    expect(validateMustSee(toPlan(r), lisCtx).status).toBe('PASS');
  });

  it('o force do ícone ainda vence o obrigatório no mesmo último dia', () => {
    extraMust.add('lis-baixa-chiado');
    dow['lis-baixa-chiado'] = [1];
    dow['lis-torre-belem'] = [1]; // ícone também só na segunda
    const r = lisboa();
    const t = dayOf(r, 'lis-torre-belem');
    expect(t).toBeGreaterThan(0);
    expect(weekdayOf(r.days[t].date)).toBe(1);
    expect(dayOf(r, 'lis-baixa-chiado')).toBe(-1);
    const v = validateMustSee(toPlan(r), lisCtx);
    expect(v.status).toBe('FAIL');
    expect(v.detail).toMatch(/abriria: dia 7 \(seg\)/);
  });
});

describe('M19g — R17 OBRIGATÓRIO e closedIds no R17 ESSENCIAIS', () => {
  const ctx: PlanRulesContext = { destination: 'Paris', interests: [], arrivalDate: '2026-12-21', arrivalTime: '15:00', domestic: false };
  const item = (id: string, name: string) => ({ id: `day-x-${id}`, name, timeSlot: 'morning' });
  // 20/12 (partida) … 21/12 (chegada) · 22–26/12 exploração · 27/12 volta.
  const natal = (extra: Record<string, ReturnType<typeof item>[]> = {}): PlanDay[] =>
    Array.from({ length: 8 }, (_, i) => {
      const date = `2026-12-${20 + i}`;
      return { day: i + 1, date, title: i === 1 ? 'Chegada' : i === 7 ? 'Volta' : 'Exploração', activities: extra[date] ?? [] };
    });

  it('FAIL com os dias em que abriria (dia da semana e 25/12 fora)', () => {
    const r = validateMustSee(natal(), ctx);
    expect(r.status).toBe('FAIL');
    expect(r.detail).toContain('Museu do Louvre abriria: dia 4 (qua), dia 5 (qui), dia 7 (sáb)');
    expect(r.ids).toEqual(['paris-louvre', 'paris-orsay']);
  });

  it('PASS com os dois no roteiro', () => {
    const r = validateMustSee(natal({ '2026-12-23': [item('paris-louvre', 'Museu do Louvre')], '2026-12-26': [item('paris-orsay', "Museu d'Orsay")] }), ctx);
    expect(r).toMatchObject({ status: 'PASS', detail: '2/2' });
  });

  it('PASS com nota quando fecha em toda a estadia', () => {
    dow['paris-louvre'] = [1]; // só segunda: nenhuma segunda em 22–26/12
    const r = validateMustSee(natal({ '2026-12-23': [item('paris-orsay', "Museu d'Orsay")] }), ctx);
    expect(r).toMatchObject({ status: 'PASS', detail: '1/2 · fechado em toda a estadia: paris-louvre' });
  });

  it('WARN quando os dois só abrem na mesma manhã', () => {
    dow['paris-louvre'] = [3];
    dow['paris-orsay'] = [3]; // os dois só na quarta 23/12
    const r = validateMustSee(natal({ '2026-12-23': [item('paris-orsay', "Museu d'Orsay")] }), ctx);
    expect(r.status).toBe('WARN');
    expect(r.ids).toEqual(['paris-louvre']);
    expect(r.detail).toContain('só abrem na manhã do dia 4 (qua)');
  });

  it('SKIP com menos de 4 dias de exploração', () => {
    const days = natal().filter((d) => !['2026-12-24', '2026-12-25'].includes(String(d.date)));
    expect(validateMustSee(days, ctx).status).toBe('SKIP');
  });

  it('R17 ESSENCIAIS: dia fechado por closedIds (25/12) não conta como "cabia"', () => {
    expect(closedIdsOnDate('Paris', '2026-12-25').has('paris-louvre')).toBe(true);
    // Exploração só em ter 22/12, 25/12 e ter 29/12: o Louvre não abre em nenhum.
    const days: PlanDay[] = ['2026-12-21', '2026-12-22', '2026-12-25', '2026-12-29', '2026-12-30']
      .map((date, i) => ({ day: i + 1, date, title: i === 0 ? 'Chegada' : i === 4 ? 'Volta' : 'Exploração', activities: [] }));
    const r = validateEssentials(days, ctx);
    expect(r.ids ?? []).not.toContain('paris-louvre');
  });
});
