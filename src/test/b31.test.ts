import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { logisticsLine, swapCandidates } from '@/lib/itineraryEngine';
import {
  travelMinutes, isSnack, essentialsOf, weekdayOf, validateDaysOfWeek, validateEssentials,
  type PlanDay, type PlanRulesContext,
} from '@/lib/itineraryValidator';
import { getDestinationActivities } from '@/data/destinationActivities';
import { CURATED_DAYS_OF_WEEK } from '@/data/generated/daysOfWeek';

// B.3.1 — R18 dia da semana · R17 essenciais · lanche no fim da tarde · estrada > 15 km.

type A = { id: string; name: string; time: string; timeSlot?: string; duration?: string };
type D = { day: number; date: string; activities: A[] };
const mins = (t: string) => { const m = t.match(/^(\d{2}):(\d{2})/)!; return Number(m[1]) * 60 + Number(m[2]); };
const route = async (origin: string, destination: string) =>
  ({ origin, destination, economyMin: 0, economyAvg: 1200, economyMax: 0, businessAvg: 0 });
async function draft(city: string, from: Date, nights: number, interests = ['gastronomy', 'culture']): Promise<D[]> {
  const input = buildFlowInput({ city, origin: 'São Paulo', from, to: addDays(from, nights), adults: 2, children: 0, tier: 'comfort' });
  input.travelInterests = interests;
  input.priorities = interests;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((await buildDraftTrip(input, { routeLookup: route })) as any).days;
}
const CARANGUEJADA = 'for-caranguejada-iate';
const daysWith = (days: D[], id: string) => days.filter((d) => d.activities.some((a) => a.id.endsWith(`-${id}`)));

describe('B.3.1 — R18 dia da semana', () => {
  it('o sync trouxe a Caranguejada só na quinta', () => {
    expect(CURATED_DAYS_OF_WEEK[CARANGUEJADA]).toEqual([4]);
    expect(weekdayOf('2026-11-12')).toBe(4);
    expect(weekdayOf(new Date(2026, 10, 12))).toBe(4);
    expect(weekdayOf(undefined)).toBe(-1);
  });

  // B.3.2: sem o essencial no sort, a Caranguejada pode não ser escalada; o R18 garante só que nunca sai da quinta.
  it('Fortaleza 10–15/nov: Caranguejada, se entra, só em 12/nov (quinta)', async () => {
    const days = await draft('Fortaleza', new Date(2026, 10, 10), 5);
    for (const d of daysWith(days, CARANGUEJADA)) expect(String(d.date).slice(0, 10)).toBe('2026-11-12');
    expect(validateDaysOfWeek(days).status).toBe('PASS');
  });

  it('Fortaleza 13–15/nov (sex–dom): Caranguejada nunca entra', async () => {
    const days = await draft('Fortaleza', new Date(2026, 10, 13), 2);
    expect(daysWith(days, CARANGUEJADA)).toEqual([]);
  });

  it('R18 FAIL sintético: Caranguejada numa sexta', () => {
    const days: PlanDay[] = [{ day: 1, date: '2026-11-13', activities: [{ id: `day-0-${CARANGUEJADA}`, name: 'Caranguejada de quinta (Iate Clube)', timeSlot: 'dinner' }] }];
    const r = validateDaysOfWeek(days);
    expect(r.status).toBe('FAIL');
    expect(r.ids).toEqual([CARANGUEJADA]);
    expect(r.detail).toMatch(/sex.*só qui/);
  });

  it('↻ trocar: numa sexta a Caranguejada não aparece como alternativa de jantar', async () => {
    const days = await draft('Fortaleza', new Date(2026, 10, 10), 5);
    const fri = days.findIndex((d) => String(d.date).slice(0, 10) === '2026-11-13');
    const dinner = days[fri].activities.find((a) => a.timeSlot === 'dinner')!;
    const trip = { destination: 'Fortaleza', days, flights: {} };
    expect(swapCandidates(trip, fri, dinner.id).map((c) => c.activity.id)).not.toContain(CARANGUEJADA);
  });
});

describe('B.3.1 — R17 essenciais', () => {
  const ctx: PlanRulesContext = { destination: 'Lisboa', interests: [], arrivalDate: '2026-11-10', arrivalTime: '15:00', domestic: false };
  const empty = (n: number, fill?: boolean): PlanDay[] => Array.from({ length: n }, (_, i) => ({
    day: i + 1,
    date: `2026-11-${String(10 + i).padStart(2, '0')}`,
    activities: fill ? [{ id: `x-${i}`, name: `Ocupado ${i}`, timeSlot: 'morning', duration: '14h' }] : [],
  }));

  it('icon ∪ essential, todas as categorias (Lisboa: Torre e Jerónimos, Pastéis de Belém)', () => {
    const ids = essentialsOf('Lisboa');
    expect(ids).toEqual(expect.arrayContaining(['lis-torre-belem', 'lis-jeronimos']));
    expect(ids.length).toBeGreaterThanOrEqual(5);
  });

  it('ausente com espaço = WARN com os ids; ausente sem espaço = PASS com nota; viagem curta = SKIP', () => {
    const warn = validateEssentials(empty(6), ctx);
    expect(warn.status).toBe('WARN');
    expect(warn.ids).toEqual(expect.arrayContaining(['lis-torre-belem']));
    const full = validateEssentials(empty(6, true), ctx);
    expect(full.status).toBe('PASS');
    expect(full.detail).toMatch(/sem espaço/);
    expect(validateEssentials(empty(4), ctx).status).toBe('SKIP');
  });

  // B.3.2: o motor não usa mais o essencial (169 essential + 22 icon ≈ 8/cidade contra ~10 slots).
  // R17 é só relatório: no roteiro real ele mede e lista, sem o motor garantir presença.
  it('Lisboa gc 7 noites: R17 relata os essenciais presentes e os que cabiam', async () => {
    const days = await draft('Lisboa', new Date(2026, 10, 10), 7);
    const r = validateEssentials(days as unknown as PlanDay[], { ...ctx, interests: ['gastronomy', 'culture'] });
    expect(['PASS', 'WARN']).toContain(r.status);
    expect(r.detail).toMatch(new RegExp(`^\\d+/${essentialsOf('Lisboa').length}`));
    for (const id of r.ids ?? []) expect(essentialsOf('Lisboa')).toContain(id);
  });
});

describe('B.3.1 — lanche no fim da tarde', () => {
  it('tag snack nos 5 itens do kinu-beta', () => {
    const snacks = ['Lisboa', 'Salvador', 'Fortaleza', 'Rio de Janeiro', 'Cartagena']
      .flatMap((c) => getDestinationActivities(c)).filter(isSnack).map((a) => a.id).sort();
    expect(snacks).toEqual(['ctg-portal-dulces', 'for-doce-50-sabores', 'lis2-santini', 'rio-momo-gelato', 'ssa-sorveteria-ribeira']);
  });

  it('Lisboa gc: Gelados Santini ≥ 17:30, no mesmo dia de almoço e jantar', async () => {
    const days = await draft('Lisboa', new Date(2026, 10, 10), 7);
    const day = daysWith(days, 'lis2-santini')[0];
    expect(day).toBeDefined();
    const santini = day.activities.find((a) => a.id.endsWith('-lis2-santini'))!;
    expect(mins(santini.time)).toBeGreaterThanOrEqual(17 * 60 + 30);
    expect(day.activities.some((a) => a.timeSlot === 'lunch')).toBe(true);
    expect(day.activities.some((a) => a.timeSlot === 'dinner')).toBe(true);
  });
});

describe('B.3.1 — estrada', () => {
  // ~0,45° de latitude ≈ 50 km (Fortaleza → Águas Belas).
  const a = { lat: -3.73, lng: -38.52 };
  const at = (km: number) => ({ lat: a.lat - km / 111.2, lng: a.lng });

  it('travelMinutes: a pé ≤ 1,2 km · táxi ≤ 15 km · carro km + 10', () => {
    expect(travelMinutes(1).mode).toBe('walk');
    expect(travelMinutes(10)).toEqual({ mode: 'taxi', minutes: 35 });
    expect(travelMinutes(50)).toEqual({ mode: 'car', minutes: 60 });
  });

  it('logisticsLine: 50 km = "~1h de carro"; 20 km = "~30 min de carro"; 80 km = "~1h30 de carro"; urbano igual', () => {
    expect(logisticsLine(a, at(50))).toBe('~1h de carro');
    expect(logisticsLine(a, at(20))).toBe('~30 min de carro');
    expect(logisticsLine(a, at(80))).toBe('~1h30 de carro');
    expect(logisticsLine(a, at(5))).toBe('~20 min de táxi');
  });
});
