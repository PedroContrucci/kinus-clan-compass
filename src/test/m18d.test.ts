import { describe, it, expect, afterAll } from 'vitest';
import { writeFileSync } from 'node:fs';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { closedIdsOnDate, unavailableIdsOnDate } from '@/lib/seasonal';
import { HARD_HOLIDAYS, OPEN_AIR, OPEN_CONFIRMED } from '@/data/openIds';
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

// M18d-2: lista explícita = OPEN_AIR ∪ OPEN_CONFIRMED da cidade.
const openSet = (city: string) => new Set([...(OPEN_AIR[city] ?? []), ...(OPEN_CONFIRMED[city] ?? []).map((o) => o.id)]);
const HARD_DAYS = (city: string) => (HARD_HOLIDAYS[city] ?? []).map((dd) => (dd === '25/12' ? '2026-12-25' : '2027-01-01'));

describe('M18d-2 — ids das listas existem no pool', () => {
  it('todo id de OPEN_AIR/OPEN_CONFIRMED existe na cidade e é morning/afternoon', () => {
    const bad: string[] = [];
    for (const c of Object.keys(HARD_HOLIDAYS)) {
      const pool = new Map(getDestinationActivities(c).map((a) => [a.id, a]));
      for (const id of openSet(c)) {
        const a = pool.get(id);
        if (!a) bad.push(`${c}: ${id} inexistente`);
        else if (a.category !== 'morning' && a.category !== 'afternoon') bad.push(`${c}: ${id} é ${a.category}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

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

  // antigo: pago/compras indisponível, livre (custo 0) disponível, OPEN_CONFIRMED vazio. novo: só OPEN_AIR ∪ OPEN_CONFIRMED disponível. motivo: M18d-2 (lista explícita).
  it('regra: manhã/tarde só disponível se em OPEN_AIR ∪ OPEN_CONFIRMED; refeição nunca; closedIds vence', () => {
    for (const c of Object.keys(HARD_HOLIDAYS)) {
      const open = openSet(c);
      const un = unavailableIdsOnDate(c, c === 'Tóquio' ? '2027-01-01' : '2026-12-25');
      const closed = closedIdsOnDate(c, c === 'Tóquio' ? '2027-01-01' : '2026-12-25');
      for (const a of getDestinationActivities(c)) {
        const slot = a.category === 'morning' || a.category === 'afternoon';
        expect(un.has(a.id), `${c} ${a.id}`).toBe(slot ? !open.has(a.id) || closed.has(a.id) : closed.has(a.id));
      }
    }
    expect(unavailableIdsOnDate('Lisboa', '2026-12-25').has('lis-castelo-sao-jorge')).toBe(true);
  });

  it('par3-carnavalet, par3-galerie-vivienne, rome-campo-fiori e rome-san-pietro indisponíveis em todo feriado duro', () => {
    for (const d of HARD_DAYS('Paris')) for (const id of ['par3-carnavalet', 'par3-galerie-vivienne']) expect(unavailableIdsOnDate('Paris', d).has(id), `${d} ${id}`).toBe(true);
    for (const d of HARD_DAYS('Roma')) for (const id of ['rome-campo-fiori', 'rome-san-pietro']) expect(unavailableIdsOnDate('Roma', d).has(id), `${d} ${id}`).toBe(true);
  });

  it('Castelo de São Jorge fechado em 24/12, 25/12, 31/12 e 01/01; aberto em 23/12', () => {
    for (const d of ['2026-12-24', '2026-12-25', '2026-12-31', '2027-01-01']) expect(closedIdsOnDate('Lisboa', d).has('lis-castelo-sao-jorge'), d).toBe(true);
    expect(closedIdsOnDate('Lisboa', '2026-12-23').has('lis-castelo-sao-jorge')).toBe(false);
  });
});

const LOG: string[] = [];
/** Em cada feriado duro do cenário: tudo de manhã/tarde pertence à lista; registra o que entrou. */
async function checkHard(id: string, city: string) {
  const { sc, days } = await trip(id);
  const open = openSet(city);
  const hard = new Set<string>(HARD_DAYS(city));
  for (const d of days.filter((x) => hard.has(dayKey(x)))) {
    const t = tours(city, d);
    const m = t.filter((a) => a.category === 'morning').map((a) => a.id);
    const af = t.filter((a) => a.category === 'afternoon').map((a) => a.id);
    LOG.push(`${id} | ${dayKey(d)} | manhã: ${m.join(',') || 'thin(feriado)'} | tarde: ${af.join(',') || 'thin(feriado)'}`);
    for (const a of t) expect(open.has(a.id), `${id} ${dayKey(d)} ${a.id}`).toBe(true);
    for (const x of ['par3-carnavalet', 'par3-galerie-vivienne', 'rome-campo-fiori', 'rome-san-pietro']) expect(d.activities.some((a) => a.id.endsWith(x)), `${dayKey(d)} ${x}`).toBe(false);
  }
  return { sc, days };
}

describe('M18d-2 — cenários de smoke', () => {
  it('Lisboa Natal 20–27/12: feriado duro só com lista; Castelo fora de 24 e 25/12', async () => {
    const { days } = await checkHard('Lisboa Natal 20–27/12 2 adultos', 'Lisboa');
    for (const d of days.filter((x) => ['2026-12-24', '2026-12-25'].includes(dayKey(x)))) expect(d.activities.some((a) => /lis-castelo-sao-jorge$/.test(a.id)), dayKey(d)).toBe(false);
  }, 60000);

  it('Roma Réveillon: feriado duro só com lista; R23 PASS; R17 ÍCONE ≠ FAIL', async () => {
    const { sc } = await checkHard('Roma Réveillon 28/12–02/01 2 adultos', 'Roma');
    const row = await runSmokeScenario(sc);
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
    expect(row.r17icon?.status).not.toBe('FAIL');
  }, 60000);

  it('Tóquio Réveillon: feriado duro só com lista; R23 PASS', async () => {
    const { sc } = await checkHard('Tóquio Réveillon 28/12–03/01 2 adultos', 'Tóquio');
    const row = await runSmokeScenario(sc);
    expect(row.error).toBeUndefined();
    expect(row.r23?.status).toBe('PASS');
  }, 60000);

  for (const id of ['Paris Natal 20–27/12 2+2', 'Paris Natal gastrô 20–27/12 2 adultos']) {
    it(`${id}: feriado duro só com lista; Louvre em 23/24/26; R23 PASS; R17 OBRIGATÓRIO/ÍCONE ≠ FAIL`, async () => {
      const { sc, days } = await checkHard(id, 'Paris');
      const lv = days.filter((d) => d.activities.some((a) => /louvre/.test(a.id))).map(dayKey);
      LOG.push(`${id} | Louvre em ${lv.join(',')}`);
      expect(lv.some((k) => ['2026-12-23', '2026-12-24', '2026-12-26'].includes(k)), `Louvre em ${lv}`).toBe(true);
      for (const d of days) if (d.activities.some((a) => /tour-eiffel-top/.test(a.id))) LOG.push(`${id} | Torre Eiffel em ${dayKey(d)}`);
      const row = await runSmokeScenario(sc);
      expect(row.error).toBeUndefined();
      expect(row.r23?.status).toBe('PASS');
      expect(row.r17icon?.status).not.toBe('FAIL');
      expect(row.r17must?.status).not.toBe('FAIL');
    }, 60000);
  }

  it('Tóquio 25/12 continua sem regra', () => {
    expect(unavailableIdsOnDate('Tóquio', '2026-12-25')).toEqual(closedIdsOnDate('Tóquio', '2026-12-25'));
  });

  afterAll(() => { if (process.env.M18D2_LOG) writeFileSync(process.env.M18D2_LOG, LOG.join('\n')); });
});
