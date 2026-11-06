import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { validateDaysOfWeek, validateIcons, weekdayOf, type PlanDay, type PlanRulesContext } from '@/lib/itineraryValidator';
import { getActivityPrice } from '@/lib/activityPricing';

// M19c — item fechado no dia troca de dia em vez de sumir (reserva), force no último dia aberto, R17 ÍCONE.
// O mock deixa os testes sintéticos mexerem nos dias de abertura sem editar src/data; vazio = dado real.
const { overrides } = vi.hoisted(() => ({ overrides: {} as Record<string, number[]> }));
vi.mock('@/data/generated/daysOfWeek', async () => {
  const actual = await vi.importActual<typeof import('@/data/generated/daysOfWeek')>('@/data/generated/daysOfWeek');
  const proxy = new Proxy(actual.CURATED_DAYS_OF_WEEK as Record<string, number[]>, {
    get: (t, k: string) => (k in overrides ? overrides[k] : t[k]),
    has: (t, k: string) => k in overrides || k in t,
  });
  return { ...actual, CURATED_DAYS_OF_WEEK: proxy };
});
beforeEach(() => { for (const k of Object.keys(overrides)) delete overrides[k]; });

const flight = (d: string, dep: string, durationMinutes = 450): SelectedFlight => ({
  date: new Date(d),
  source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(city: string, dep: string, ret: string, o: { interests?: string[]; depTime?: string; durationMinutes?: number; sev?: 'BAIXO' | 'MODERADO' } = {}) {
  return runItineraryEngine({
    departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`),
    destination: city, origin: 'São Paulo',
    outboundFlight: flight(`${dep}T12:00:00`, o.depTime ?? '08:00', o.durationMinutes),
    returnFlight: flight(`${ret}T12:00:00`, '21:00'),
    budget: 30000, travelers: 2, interests: o.interests ?? ['gastronomia', 'cultura'],
    jetLagSeverity: o.sev ?? 'MODERADO', priceLevel: 'midrange',
    hotel: { nightlyRate: getActivityPrice('hotel_night', city, 'midrange') },
  });
}
type Out = ReturnType<typeof run>;
const daysWith = (r: Out, id: string) => r.days.filter((d) => d.activities.some((a) => a.id.endsWith(`-${id}`)));
const toPlan = (r: Out): PlanDay[] => r.days.map((d) => ({
  day: d.dayNumber, date: d.date.toISOString().slice(0, 10), title: d.label,
  activities: d.activities.map((a) => ({ id: a.id, name: a.name, timeSlot: a.timeSlot })),
}));

describe('M19c — item fechado no dia troca de dia', () => {
  it('Paris 10–15/12/2026, Conforto, ida noturna: Versalhes (fecha seg) aparece em dia ≠ segunda; R18 PASS', () => {
    const r = run('Paris', '2026-12-10', '2026-12-15', { interests: ['culture'], depTime: '22:00', durationMinutes: 690, sev: 'BAIXO' });
    const v = daysWith(r, 'par3-versailles');
    expect(v).toHaveLength(1);
    expect(weekdayOf(v[0].date)).not.toBe(1);
    expect(validateDaysOfWeek(toPlan(r)).status).toBe('PASS');
  });

  it('Lisboa 10–17/11 (fixture): Jerónimos (fecha seg) presente em dia ≠ segunda; R18 PASS', () => {
    const r = run('Lisboa', '2026-11-10', '2026-11-17');
    const j = daysWith(r, 'lis-jeronimos');
    expect(j).toHaveLength(1);
    expect(weekdayOf(j[0].date)).not.toBe(1);
    expect(validateDaysOfWeek(toPlan(r)).status).toBe('PASS');
  });

  it('sintético: essencial que só abre em 1 dos dias de exploração é escalado nesse dia', () => {
    overrides['lis-jeronimos'] = [5]; // só sexta 13/11
    const r = run('Lisboa', '2026-11-10', '2026-11-17');
    const j = daysWith(r, 'lis-jeronimos');
    expect(j).toHaveLength(1);
    expect(weekdayOf(j[0].date)).toBe(5);
    expect(validateDaysOfWeek(toPlan(r)).status).toBe('PASS');
  });

  it('sintético: ícone fechado no último dia de exploração continua no roteiro, em dia aberto', () => {
    // Volta numa terça: o último dia de exploração é a segunda 16/11, quando a Torre de Belém fecha.
    const r = run('Lisboa', '2026-11-10', '2026-11-17');
    const t = daysWith(r, 'lis-torre-belem');
    expect(t).toHaveLength(1);
    expect(weekdayOf(t[0].date)).not.toBe(1);
  });
});

describe('M19c — R17 ÍCONE', () => {
  const ctx: PlanRulesContext = { destination: 'Lisboa', interests: [], arrivalDate: '2026-11-10', arrivalTime: '15:00', domestic: false };
  const empty = (n: number): PlanDay[] => Array.from({ length: n }, (_, i) => ({
    day: i + 1, date: `2026-11-${String(10 + i).padStart(2, '0')}`, activities: [],
  }));

  it('ícone ausente que abre na estadia = FAIL, com os dias em que abriria', () => {
    const r = validateIcons(empty(6), ctx); // 10–15/11; Torre abre todos os dias menos segunda
    expect(r.status).toBe('FAIL');
    expect(r.ids).toEqual(['lis-torre-belem']);
    expect(r.detail).toMatch(/Torre de Belém abriria: dia 2 \(qua\)/);
    expect(r.detail).not.toMatch(/seg/);
  });

  it('ícone presente = PASS', () => {
    const days = empty(6);
    days[2].activities.push({ id: 'day-2-lis-torre-belem', name: 'Torre de Belém', timeSlot: 'morning' });
    expect(validateIcons(days, ctx).status).toBe('PASS');
  });

  it('ícone que não abre em nenhum dia de exploração = PASS com nota, não FAIL', () => {
    overrides['lis-torre-belem'] = [1]; // só segunda; a estadia 10–15/11 não tem segunda
    const r = validateIcons(empty(6), ctx);
    expect(r.status).toBe('PASS');
    expect(r.detail).toMatch(/fechado em toda a estadia: lis-torre-belem/);
  });

  it('roteiro gerado de Lisboa: ícone presente → PASS', () => {
    expect(validateIcons(toPlan(run('Lisboa', '2026-11-10', '2026-11-17')), ctx).status).toBe('PASS');
  });
});
