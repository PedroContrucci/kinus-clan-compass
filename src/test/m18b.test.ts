import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { closedIdsOnDate, prefixHasDate } from '@/lib/seasonal';
import { SEASONAL_NOTES } from '@/data/seasonalNotes';
import { getDestinationActivities } from '@/data/destinationActivities';
import { validateSeasonalClosures, weekdayOf } from '@/lib/itineraryValidator';
import { getActivityPrice } from '@/lib/activityPricing';

// M18b — fechamentos sazonais governam o dia (seasonalNotes.closedIds).
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 210, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(city: string, dep: string, ret: string, interests: string[], pax?: { adults: number; children: number; infants: number }) {
  return runItineraryEngine({
    departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`), destination: city, origin: 'São Paulo',
    outboundFlight: flight(`${dep}T12:00:00`, '08:00'), returnFlight: flight(`${ret}T12:00:00`, '21:00'),
    budget: 60000, travelers: pax ? pax.adults + pax.children : 2, interests, jetLagSeverity: 'BAIXO', priceLevel: 'midrange',
    hotel: { nightlyRate: getActivityPrice('hotel_night', city, 'midrange') },
    ...(pax ? { pax } : {}),
  });
}
const dayKey = (d: { date: Date | string }) => (d.date instanceof Date ? d.date.toISOString() : String(d.date)).slice(0, 10);
const ids = (d: { activities: { id: string }[] }) => d.activities.map((a) => a.id.replace(/^day-\d+-/, ''));

describe('M18b — dado (closedIds)', () => {
  it('toda chave < closures.length e todo id existe no catálogo da cidade', () => {
    let withIds = 0;
    for (const n of SEASONAL_NOTES) {
      if (!n.closedIds) continue;
      withIds++;
      const catalog = new Set(getDestinationActivities(n.city).map((a) => a.id));
      for (const [k, list] of Object.entries(n.closedIds)) {
        expect(Number.isInteger(+k) && +k >= 0 && +k < n.closures.length, `${n.city} ${n.month} chave ${k}`).toBe(true);
        for (const id of list) expect(catalog.has(id), `${n.city} ${n.month}: ${id}`).toBe(true);
      }
    }
    expect(withIds).toBeGreaterThan(0);
  });

  it('closedIdsOnDate: data, "e", "Mês inteiro"; cidade sem ids = vazio', () => {
    const d25 = closedIdsOnDate('Paris', '2026-12-25');
    expect([...d25].sort()).toEqual(['par3-giverny', 'par3-versailles', 'paris-louvre', 'paris-orsay']);
    expect(closedIdsOnDate('Paris', '2026-12-26')).toEqual(new Set(['par3-giverny']));
    expect(closedIdsOnDate('Paris', '2026-12-10')).toEqual(new Set(['par3-giverny']));
    expect(closedIdsOnDate('Paris', '2027-01-01').has('paris-louvre')).toBe(true);
    expect(closedIdsOnDate('Lisboa', '2026-12-25').has('lis-jeronimos')).toBe(true);
    expect(closedIdsOnDate('Lisboa', '2026-12-31').has('lis-jeronimos')).toBe(false);
    expect(closedIdsOnDate('Rio de Janeiro', '2026-12-25').size).toBe(0);
    expect(closedIdsOnDate('Madri', '2026-12-25').size).toBe(0);
    expect(closedIdsOnDate('Paris', undefined).size).toBe(0);
  });

  it('parser de data: "DD/MM", "DD/MM e DD/MM" e intervalo (inclusive, atravessa o ano)', () => {
    expect(prefixHasDate('25/12 e 01/01', 12, 25)).toBe(true);
    expect(prefixHasDate('25/12 e 01/01', 1, 1)).toBe(true);
    expect(prefixHasDate('25/12 e 01/01', 12, 26)).toBe(false);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 12, 28)).toBe(true);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 12, 31)).toBe(true);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 1, 2)).toBe(true);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 1, 3)).toBe(true);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 12, 27)).toBe(false);
    expect(prefixHasDate('28/12 a 03/01 (aprox.)', 1, 4)).toBe(false);
    expect(prefixHasDate('10/12 a 15/12', 12, 12)).toBe(true);
    expect(prefixHasDate('10/12 a 15/12', 12, 16)).toBe(false);
    expect(prefixHasDate('24/12 à tarde e 31/12 à noite', 12, 24)).toBe(true);
  });
});

describe('M18b — motor', () => {
  const r = run('Paris', '2026-12-20', '2026-12-27', ['culture', 'family'], { adults: 2, children: 2, infants: 0 });
  const g = run('Paris', '2026-12-20', '2026-12-27', ['gastronomy', 'culture']);

  it('Paris 20–27/12: Louvre, Orsay e Versalhes fora do dia 25', () => {
    for (const run of [r, g]) {
      const d25 = run.days.filter((d) => dayKey(d) === '2026-12-25');
      expect(d25).toHaveLength(1);
      for (const closed of ['paris-louvre', 'paris-orsay', 'par3-versailles']) expect(ids(d25[0])).not.toContain(closed);
    }
  });

  it('Giverny nunca em dezembro', () => {
    for (const run of [r, g]) for (const d of run.days) expect(ids(d)).not.toContain('par3-giverny');
    const early = run('Paris', '2026-12-10', '2026-12-17', ['culture', 'family']);
    for (const d of early.days) expect(ids(d)).not.toContain('par3-giverny');
  });

  it('item fechado no dia é reservado para outro dia (Versalhes 25→24/12; Louvre 01/01→31/12)', () => {
    // Sem o dado, Versalhes cairia no 25/12 (22–28/12) e o Louvre no 01/01 (24/12–02/01).
    const v = run('Paris', '2026-12-22', '2026-12-28', ['culture', 'family']);
    expect(v.days.filter((d) => ids(d).includes('par3-versailles')).map(dayKey)).toEqual(['2026-12-24']);
    const l = run('Paris', '2026-12-24', '2027-01-02', ['culture', 'family']);
    // M19g: a M18b garante "não no dia fechado", não "no último dia" (31/12 era acidente da ordenação de então).
    const louvre = l.days.filter((d) => ids(d).includes('paris-louvre')).map(dayKey);
    expect(louvre).toHaveLength(1);
    expect(louvre[0]).not.toBe('2027-01-01');
    expect(weekdayOf(louvre[0])).not.toBe(2);
    expect(closedIdsOnDate('Paris', louvre[0]).has('paris-louvre')).toBe(false);
  });

  it('R23 PASS no gerado; FAIL quando o Louvre é posto no dia 25', () => {
    const ctx = { destination: 'Paris', interests: ['culture'], arrivalDate: '2026-12-20' } as never;
    const plan = r.days.map((d) => ({ day: d.dayNumber, date: dayKey(d), title: d.label, activities: d.activities })) as never;
    expect(validateSeasonalClosures(plan, ctx).status).toBe('PASS');
    const bad = [{ day: 1, date: '2026-12-25', title: 'Exploração', activities: [{ id: 'day-1-paris-louvre', name: 'Museu do Louvre', time: '10:00', timeSlot: 'morning', type: 'morning' }] }] as never;
    const res = validateSeasonalClosures(bad, ctx);
    expect(res.status).toBe('FAIL');
    expect(res.detail).toContain('Louvre');
  });

  it('cenário "Paris Natal 20–27/12 2+2": sem erro, R23 e R18 PASS', async () => {
    const sc = SMOKE_SCENARIOS.find((s) => s.id === 'Paris Natal 20–27/12 2+2');
    expect(sc).toBeDefined();
    const row = await runSmokeScenario(sc!, { routeLookup: async () => null });
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
    expect(row.r18?.status).toBe('PASS');
  });
});
