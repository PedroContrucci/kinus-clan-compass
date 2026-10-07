import { describe, it, expect } from 'vitest';
import type { SelectedFlight } from '@/lib/itineraryEngine';
import { buildItineraryForTrip, countManualEdits, itemIdsOf, type DraftLike } from '@/lib/draftItinerary';
import { buildPlannedFlights, flightDaysLater, retimeFlight } from '@/lib/flightModel';
import { legShiftChangesPlan, reapplyEdits, replanTrip, retimeConfirmedLegs, unplacedMessage } from '@/lib/replanItinerary';

// A.4 — trocar perna replaneja sem apagar (MATRIZ-VOO-FUSO §3 R-V8, §4 R-V9/R-V11, §6 T1–T4).
const START = '2026-11-10T12:00:00';
const END = '2026-11-17T12:00:00';

function leg(from: string, to: string, date: string, time: string, minutes: number, international: boolean): SelectedFlight {
  const base: SelectedFlight = {
    date: new Date(`${date}T12:00:00`),
    source: 'estimate',
    international,
    option: {
      id: `${from}-${to}`, airline: 'A confirmar', route: `${from} → ${to}`, isDirect: true,
      duration: `${minutes / 60}h`, durationMinutes: minutes, price: 2000, departureTime: time, arrivalTime: '',
      segments: [{ departure: { iataCode: from, at: `${date}T${time}:00` }, arrival: { iataCode: to, at: `${date}T${time}:00` } }],
    },
  };
  return retimeFlight(base, time);
}

const tripFor = (destination: string): DraftLike => ({
  destination, origin: 'São Paulo', startDate: START, endDate: END, budget: 30000, travelers: 2,
  travelInterests: ['gastronomia', 'cultura'], budgetType: 'comfort', jetLagSeverity: 'BAIXO',
});

type Act = { id: string; name: string; time: string; timeSlot?: string; status?: string };
type Day = { day: number; title: string; activities: Act[] };

function build(trip: DraftLike, outbound: SelectedFlight, ret: SelectedFlight) {
  const r = buildItineraryForTrip(trip, { outbound, return: ret });
  return { ...trip, outboundFlight: outbound, returnFlight: ret, days: r.days, engineItemIds: r.engineItemIds, finances: r.finances, _r: r };
}
const daysOf = (t: { days: unknown }) => t.days as Day[];
const isLogistic = (a: Act) => ['flight', 'hotel'].includes(a.timeSlot ?? '') || /check|transfer|aeroporto/i.test(a.name);

describe('R-V8 — último dia pela hora real da volta', () => {
  const out = leg('GRU', 'LIS', '2026-11-10', '23:00', 600, true);
  it('internacional 22:00 → transfer 19:00; doméstico 14:00 → transfer 12:00', () => {
    const lis = daysOf(build(tripFor('Lisboa'), out, leg('LIS', 'GRU', '2026-11-17', '22:00', 600, true)));
    expect(lis.at(-1)!.activities.find((a) => /-slot-transfer$/.test(a.id))!.time).toBe('19:00');
    const fOut = leg('GRU', 'FOR', '2026-11-10', '08:00', 205, false);
    const fort = daysOf(build(tripFor('Fortaleza'), fOut, leg('FOR', 'GRU', '2026-11-17', '14:00', 205, false)));
    const last = fort.at(-1)!.activities;
    expect(last.find((a) => /-slot-transfer$/.test(a.id))!.time).toBe('12:00');
    expect(last.find((a) => /-slot-checkout$/.test(a.id))!.time).toBe('11:00');
  });
});

describe('R-V9 — dia 1 pela hora real de chegada (Fortaleza, mesmo dia)', () => {
  const ret = leg('FOR', 'GRU', '2026-11-17', '14:00', 205, false);
  const day0 = (dep: string) => daysOf(build(tripFor('Fortaleza'), leg('GRU', 'FOR', '2026-11-10', dep, 205, false), ret))[0].activities;
  it('chega 10:25 → tarde leve (caminhada + jantar)', () => {
    const a = day0('07:00');
    expect(a.some((x) => /ambient-walk/.test(x.id))).toBe(true);
    expect(a.some((x) => x.timeSlot === 'dinner')).toBe(true);
  });
  it('chega 16:25 → só jantar, check-in 1 h após pousar', () => {
    const a = day0('13:00');
    expect(a.some((x) => /ambient-walk/.test(x.id))).toBe(false);
    expect(a.find((x) => /-slot-checkin$/.test(x.id))!.time).toBe('17:25');
    expect(a.some((x) => x.timeSlot === 'dinner')).toBe(true);
  });
  it('chega 21:25 → nada além do check-in', () => {
    const a = day0('18:00');
    expect(a.filter((x) => !isLogistic(x))).toEqual([]);
  });
});

describe('T1 — Lisboa ida 23:00 (D+1 12:00) → 10:00 (23:00 D+0)', () => {
  const ret = leg('LIS', 'GRU', '2026-11-17', '13:00', 600, true);
  const before = build(tripFor('Lisboa'), leg('GRU', 'LIS', '2026-11-10', '23:00', 600, true), ret);
  const newOut = leg('GRU', 'LIS', '2026-11-10', '10:00', 600, true);
  it('a troca muda o plano e o D+n vira 0', () => {
    expect(flightDaysLater(before.outboundFlight)).toBe(1);
    expect(flightDaysLater(newOut)).toBe(0);
    expect(newOut.option.arrivalTime).toBe('23:00');
    expect(legShiftChangesPlan({ outbound: before.outboundFlight }, { outbound: newOut })).toBe(true);
  });
  it('dia 1 = chegada noturna, nada; dia 2 vira o 1º de exploração', () => {
    expect(daysOf(before)[1].title).toMatch(/Chegada/);
    const r = replanTrip(before, { outbound: newOut, return: ret });
    const d = r.days as unknown as Day[];
    expect(d[0].activities.filter((a) => !isLogistic(a))).toEqual([]);
    expect(d[0].activities.find((a) => /-slot-checkin$/.test(a.id))).toBeTruthy();
    expect(d[1].title).not.toMatch(/Chegada/);
    expect(d[1].activities.filter((a) => !isLogistic(a)).length).toBeGreaterThanOrEqual(3);
    expect(r.unplaced).toEqual([]);
  });
});

describe('T2 — Fortaleza volta 14:00 → 07:30', () => {
  const out = leg('GRU', 'FOR', '2026-11-10', '08:00', 205, false);
  const before = build(tripFor('Fortaleza'), out, leg('FOR', 'GRU', '2026-11-17', '14:00', 205, false));
  const newRet = leg('FOR', 'GRU', '2026-11-17', '07:30', 205, false);
  it('último dia só café + check-out; café trocado pelo usuário não cabe e é avisado', () => {
    const days = daysOf(before);
    const last = days.at(-1)!;
    const cafe = last.activities.find((a) => a.timeSlot === 'breakfast')!;
    expect(cafe.time).toBe('08:00');
    // Usuário trocou o café do catálogo por outro (mesmo slot e hora).
    const mine: Act = { ...cafe, id: `day-${last.day - 1}-meu-cafe`, name: 'Café da Praia de Iracema' };
    last.activities = last.activities.map((a) => (a.id === cafe.id ? mine : a));
    expect(legShiftChangesPlan({ return: before.returnFlight }, { return: newRet })).toBe(true);

    const r = replanTrip(before, { outbound: out, return: newRet });
    const end = (r.days as unknown as Day[]).at(-1)!.activities;
    expect(end.map((a) => a.id.replace(/^day-\d+-/, ''))).toEqual(['slot-quick-breakfast', 'slot-checkout', 'slot-transfer', 'slot-flight-back']);
    expect(end.find((a) => /-slot-transfer$/.test(a.id))!.time).toBe('05:30');
    expect(r.unplaced).toEqual([{ id: mine.id, name: mine.name, day: last.day }]);
    expect(unplacedMessage(r.unplaced)!.title).toBe('1 item seu não coube no novo horário');
    expect(unplacedMessage(r.unplaced)!.description).toContain('Café da Praia de Iracema');
  });
});

describe('T3 — Tóquio ida 18:00 (D+2) → 01:00 (14:00 D+1)', () => {
  const ret = leg('NRT', 'GRU', '2026-11-17', '22:00', 1620, true);
  const trip = { ...tripFor('Tóquio'), jetLagSeverity: undefined };
  const before = build(trip, leg('GRU', 'NRT', '2026-11-10', '18:00', 1500, true), ret);
  const newOut = leg('GRU', 'NRT', '2026-11-10', '01:00', 1500, true);
  it('ganha um dia de exploração e o orçamento de passeios sobe', () => {
    expect(flightDaysLater(before.outboundFlight)).toBe(2);
    expect(flightDaysLater(newOut)).toBe(1);
    expect(newOut.option.arrivalTime).toBe('14:00');
    const r = replanTrip(before, { outbound: newOut, return: ret });
    const explo = (ds: Day[]) => ds.filter((d) => !/Partida|trânsito|Chegada|Volta/i.test(d.title)).length;
    expect(explo(r.days as unknown as Day[])).toBe(explo(daysOf(before)) + 1);
    expect(r.buckets.toursPlanned).toBeGreaterThan(before._r.buckets.toursPlanned);
  });
});

describe('T4 — troca de perna com edições manuais preserva (R-V11)', () => {
  const ret = leg('LIS', 'GRU', '2026-11-17', '13:00', 600, true);
  const before = build(tripFor('Lisboa'), leg('GRU', 'LIS', '2026-11-10', '23:00', 600, true), ret);
  const days = daysOf(before);
  const d4 = days[3];
  const swapped = d4.activities.find((a) => !isLogistic(a) && !a.id.includes('-slot-') && a.timeSlot === 'afternoon')!;
  const mine: Act = { ...swapped, id: 'day-3-lis-meu-passeio', name: 'Meu passeio em Alfama' };
  d4.activities = d4.activities.map((a) => (a.id === swapped.id ? mine : a));
  const d5 = days[4];
  const removed = d5.activities.find((a) => !isLogistic(a) && !a.id.includes('-slot-'))!;
  d5.activities = d5.activities.filter((a) => a.id !== removed.id);

  it('mesma ida (só reaplica): item trocado fica no mesmo dia/slot e o removido segue removido', () => {
    const r = reapplyEdits(days, before.engineItemIds, before._r.days);
    const nd = r.days as unknown as Day[];
    expect(nd[3].activities.find((a) => a.id === mine.id)).toMatchObject({ timeSlot: 'afternoon', time: swapped.time });
    expect(nd[3].activities.some((a) => a.id === swapped.id)).toBe(false);
    expect(itemIdsOf(nd)).not.toContain(removed.id);
    expect(r.unplaced).toEqual([]);
  });

  it('troca a ida 23:00 → 10:00: edições preservadas, sem pedir "desfaz N trocas"', () => {
    const r = replanTrip(before, { outbound: leg('GRU', 'LIS', '2026-11-10', '10:00', 600, true), return: ret });
    const nd = r.days as unknown as Day[];
    expect(nd[3].activities.find((a) => a.id === mine.id)?.timeSlot).toBe('afternoon');
    expect(itemIdsOf(nd)).not.toContain(removed.id);
    expect(nd.flatMap((d) => d.activities).filter((a) => a.name === mine.name)).toHaveLength(1);
    expect(r.unplaced).toEqual([]);
    // Continuam contando como edições na próxima vez (engineItemIds = saída pura do motor).
    expect(countManualEdits(r.engineItemIds, itemIdsOf(nd))).toBeGreaterThan(0);
  });

  it('confirmado do motor que o motor recoloca herda o status', () => {
    const conf = JSON.parse(JSON.stringify(days)) as Day[];
    const item = conf[5].activities.find((a) => !isLogistic(a))!;
    item.status = 'confirmed';
    const r = reapplyEdits(conf, before.engineItemIds, before._r.days);
    expect((r.days as unknown as Day[])[5].activities.find((a) => a.id === item.id)?.status).toBe('confirmed');
  });
});

describe('Item 4 — confirmar voo com hora nova (Viagens)', () => {
  const ret = leg('LIS', 'GRU', '2026-11-17', '13:00', 600, true);
  const base = build(tripFor('Lisboa'), leg('GRU', 'LIS', '2026-11-10', '23:00', 600, true), ret);
  it('recalcula a chegada e replaneja quando o D+n muda', () => {
    const before = JSON.parse(JSON.stringify({ outbound: base.outboundFlight, return: base.returnFlight }));
    const t = JSON.parse(JSON.stringify(base));
    t.flights = { outbound: { id: 'flight-outbound', departureTime: '23:00', arrivalTime: '12:00' } };
    t.outboundFlight.option.departureTime = '10:00';
    const r = retimeConfirmedLegs(t, before);
    expect(r.trip.outboundFlight.option.arrivalTime).toBe('23:00');
    expect(r.trip.flights.outbound.arrivalTime).toBe('23:00');
    expect(r.replanned).toBe(true);
    expect((r.trip.days as Day[])[1].title).not.toMatch(/Chegada/);
  });
  it('mesma faixa e mesmo D+n → só a hora muda, roteiro intacto', () => {
    const before = JSON.parse(JSON.stringify({ outbound: base.outboundFlight, return: base.returnFlight }));
    const t = JSON.parse(JSON.stringify(base));
    t.outboundFlight.option.departureTime = '22:00';
    const r = retimeConfirmedLegs(t, before);
    expect(r.replanned).toBe(false);
    expect(r.trip.outboundFlight.option.arrivalTime).toBe('11:00');
    expect(r.trip.days).toEqual(t.days);
  });
});

describe('Item 5 — volta estimada pela hora típica da rota', () => {
  const input = {
    originCode: 'GRU', destinationCode: 'LIS', departureDate: new Date(START), returnDate: new Date(END),
    departureTime: '23:00', arrivalTime: '12:00', arrivalDaysLater: 1, flightHours: 10, tzDiff: 3, legPrice: 2000,
    originTz: 'America/Sao_Paulo', destinationTz: 'Europe/Lisbon', tzKnown: true,
  };
  it('com hora da rota usa e marca route; sem ela, 14:00 default', () => {
    const withRoute = buildPlannedFlights({ ...input, returnDepartureTime: '21:30' }).return;
    expect(withRoute.departureTime).toBe('21:30');
    expect(withRoute.departureTimeSource).toBe('route');
    expect(withRoute.arrivalTime).toBe('04:30');
    const plain = buildPlannedFlights(input).return;
    expect(plain.departureTime).toBe('14:00');
    expect(plain.departureTimeSource).toBe('default');
  });
});
