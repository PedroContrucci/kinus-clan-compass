// MATRIZ-VOO-FUSO §1–§4 — chegada em UTC, fuso na data, D+n por data local.
//
// Prova viva (A.2): o PDF de Lisboa 10–15/nov mostrava "Fuso: +4h" porque o gap era
// medido "hoje" (out/2026, Lisboa em WEST). Aqui a data entra no cálculo: um teste de
// julho e um de novembro por cidade com horário de verão (§1).
import { describe, it, expect } from 'vitest';
import { computeArrival, getTimezoneDiff, tripTimezone, formatTzDiff, formatTzInfo } from '@/lib/timezone';
import { CITY_TIMEZONES } from '@/data/generated/cityTimezones';
import { getAllCities } from '@/data/destinationCatalog';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { plannedFlightToSelected, offerToSelected, writeFlightsThrough, type ReferenceOffer } from '@/lib/flightModel';
import { pickBest, explainPick, rankFlights, outsideWindowLabel } from '@/lib/flightRanking';
import { planBreakdown } from '@/lib/planTotals';
import { buildItineraryForTrip, tripDaysToItinerary } from '@/lib/draftItinerary';

const TZ = {
  GRU: 'America/Sao_Paulo',
  FOR: 'America/Fortaleza',
  CTG: 'America/Bogota',
  JFK: 'America/New_York',
  LIS: 'Europe/Lisbon',
  CPT: 'Africa/Johannesburg',
  NRT: 'Asia/Tokyo',
} as const;

const NOV = '2026-11-10';
const JUL = '2026-07-10';
const NOV_BACK = '2026-11-15';

const min = (h: number, m = 0) => h * 60 + m;

type Case = [id: string, from: keyof typeof TZ, to: keyof typeof TZ, date: string, dep: string, dur: number, arr: string, dn: number];

// §2 — ida
const OUTBOUND: Case[] = [
  ['I1', 'GRU', 'FOR', NOV, '08:00', min(3, 25), '11:25', 0],
  ['I2', 'GRU', 'CTG', NOV, '08:00', min(7, 30), '13:30', 0],
  ['I3', 'GRU', 'LIS', NOV, '23:00', min(10), '12:00', 1],
  ['I3b', 'GRU', 'LIS', JUL, '23:00', min(10), '13:00', 1],
  ['I4', 'GRU', 'JFK', NOV, '22:00', min(9, 45), '05:45', 1],
  ['I4b', 'GRU', 'JFK', JUL, '22:00', min(9, 45), '06:45', 1],
  ['I5', 'GRU', 'NRT', NOV, '18:00', min(26), '08:00', 2],
  ['I6', 'GRU', 'CPT', NOV, '17:00', min(14), '12:00', 1],
];

// §3 — volta
const RETURN: Case[] = [
  ['V1', 'FOR', 'GRU', NOV_BACK, '14:00', min(3, 25), '17:25', 0],
  ['V2', 'CTG', 'GRU', NOV_BACK, '09:00', min(7, 30), '18:30', 0],
  ['V3', 'LIS', 'GRU', NOV_BACK, '13:00', min(10), '20:00', 0],
  ['V4', 'JFK', 'GRU', NOV_BACK, '22:00', min(9, 45), '09:45', 1],
  ['V5', 'NRT', 'GRU', NOV_BACK, '22:00', min(27), '13:00', 1],
  ['V6', 'CPT', 'GRU', NOV_BACK, '14:00', min(14), '23:00', 0],
];

describe('computeArrival — matriz §2/§3 (hora local e D+n exatos)', () => {
  it.each([...OUTBOUND, ...RETURN])('%s %s→%s %s %s', (_id, from, to, date, dep, dur, arr, dn) => {
    const r = computeArrival({ date, time: dep, durationMinutes: dur, originTz: TZ[from], destinationTz: TZ[to] });
    expect(r.arrivalTime).toBe(arr);
    expect(r.daysLater).toBe(dn);
  });

  it('a data local de chegada acompanha o D+n (I5 Tóquio: 10/nov → 12/nov)', () => {
    const r = computeArrival({ date: NOV, time: '18:00', durationMinutes: min(26), originTz: TZ.GRU, destinationTz: TZ.NRT });
    expect(r.arrivalDate).toBe('2026-11-12');
  });
});

describe('getTimezoneDiff — fuso na data da viagem (§1, R-V3/R-V7)', () => {
  it.each([
    ['Lisboa', NOV, 3], ['Lisboa', JUL, 4],
    ['Nova York', NOV, -2], ['Nova York', JUL, -1],
    ['Tóquio', NOV, 12], ['Cidade do Cabo', NOV, 5],
    ['Cartagena', NOV, -2], ['Fortaleza', NOV, 0],
    ['Nova Délhi', NOV, 8.5],
  ] as const)('%s em %s = %s', (city, date, diff) => {
    const tz = getTimezoneDiff('São Paulo', city, date);
    expect(tz.tzKnown).toBe(true);
    expect(tz.diff).toBe(diff);
  });

  it('cidade sem fuso conhecido → { diff: 0, tzKnown: false }, sem fallback numérico (R-V6)', () => {
    const tz = getTimezoneDiff('São Paulo', 'Atlântida', NOV);
    expect(tz).toMatchObject({ diff: 0, tzKnown: false });
    expect(formatTzDiff(tz)).toBe('a confirmar');
    expect(formatTzInfo(tz)).toBe('a confirmar');
  });

  it('formatação: capa e informações do PDF de Lisboa em nov batem (+3h / UTC+0)', () => {
    const tz = tripTimezone({ origin: 'São Paulo', destination: 'Lisboa', startDate: new Date(2026, 10, 10).toISOString() });
    expect(formatTzDiff(tz)).toBe('+3h');
    expect(formatTzInfo(tz)).toBe('UTC+0 (3h à frente de São Paulo)');
    const jul = tripTimezone({ origin: 'São Paulo', destination: 'Lisboa', startDate: new Date(2026, 6, 10).toISOString() });
    expect(formatTzInfo(jul)).toBe('UTC+1 (4h à frente de São Paulo)');
  });
});

describe('cityTimezones — o mapa e o catálogo batem', () => {
  it('cobre as 82 cidades do catálogo com o mesmo IANA, mais São Paulo', () => {
    const cities = getAllCities();
    expect(cities).toHaveLength(82);
    for (const c of cities) expect(CITY_TIMEZONES[c.name], c.name).toBe(c.timezone);
    expect(CITY_TIMEZONES['São Paulo']).toBe('America/Sao_Paulo');
  });
});

function draftInput(over: Partial<DraftTripInput> = {}): DraftTripInput {
  return {
    originCity: 'São Paulo',
    originAirportCode: 'GRU',
    destinationCity: 'Lisboa',
    destinationAirportCode: 'LIS',
    hasDirectFlight: true,
    departureDate: new Date(2026, 10, 10),
    returnDate: new Date(2026, 10, 15),
    adults: 1,
    children: [],
    infants: 0,
    budgetTier: 'comfort',
    travelStyle: 'conforto',
    budgetAmount: 20000,
    travelInterests: [],
    priorities: [],
    ...over,
  };
}
const noRoute = { routeLookup: async () => null };

describe('buildDraftTrip — um voo, uma verdade', () => {
  it('Lisboa 10/nov grava diff +3 (não o +4 de "hoje") e voo internacional com fuso conhecido', async () => {
    const trip = await buildDraftTrip(draftInput(), noRoute);
    expect(trip.timezone).toMatchObject({ origin: 'America/Sao_Paulo', destination: 'Europe/Lisbon', diff: 3, tzKnown: true });
    const ob = trip.flights!.outbound as unknown as Record<string, unknown>;
    expect(ob).toMatchObject({ tzKnown: true, international: true, durationKnown: true });
    expect((trip as unknown as Record<string, unknown>).outboundFlight).toMatchObject({ tzKnown: true, international: true });
  });

  it('Lisboa em julho grava +4 (horário de verão pela data)', async () => {
    const trip = await buildDraftTrip(draftInput({ departureDate: new Date(2026, 6, 10), returnDate: new Date(2026, 6, 15) }), noRoute);
    expect(trip.timezone?.diff).toBe(4);
  });

  it('Tóquio chega D+2 e a volta chega D+1 em São Paulo', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Tóquio', destinationAirportCode: 'NRT' }), noRoute);
    const ob = trip.flights!.outbound!;
    const rt = trip.flights!.return!;
    const days = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
    const hours = parseFloat(ob.duration);
    const expected = computeArrival({ date: '2026-11-10', time: ob.departureTime, durationMinutes: hours * 60, originTz: TZ.GRU, destinationTz: TZ.NRT });
    expect(expected.daysLater).toBe(2);
    expect(days(ob.arrivalDate, ob.departureDate)).toBe(2);
    expect(ob.arrivalTime).toBe(expected.arrivalTime);
    const back = computeArrival({ date: '2026-11-15', time: '14:00', durationMinutes: hours * 60, originTz: TZ.NRT, destinationTz: TZ.GRU });
    expect(rt.arrivalTime).toBe(back.arrivalTime);
    expect(days(rt.arrivalDate, rt.departureDate)).toBe(back.daysLater);
    expect(back.daysLater).toBe(1);
  });

  it('Fortaleza é doméstico; Nova York nov −2 / jul −1', async () => {
    const forTrip = await buildDraftTrip(draftInput({ destinationCity: 'Fortaleza', destinationAirportCode: 'FOR' }), noRoute);
    expect((forTrip as unknown as Record<string, unknown>).outboundFlight).toMatchObject({ international: false, tzKnown: true });
    const nyNov = await buildDraftTrip(draftInput({ destinationCity: 'Nova York', destinationAirportCode: 'JFK' }), noRoute);
    const nyJul = await buildDraftTrip(draftInput({ destinationCity: 'Nova York', destinationAirportCode: 'JFK', departureDate: new Date(2026, 6, 10), returnDate: new Date(2026, 6, 15) }), noRoute);
    expect(nyNov.timezone?.diff).toBe(-2);
    expect(nyJul.timezone?.diff).toBe(-1);
  });

  it('cidade fora do catálogo: tzKnown e durationKnown false, 11h conservadoras, nada de Europe/Rome', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Atlântida', destinationAirportCode: '' }), noRoute);
    expect(trip.timezone).toMatchObject({ diff: 0, tzKnown: false, destination: '' });
    const ob = trip.flights!.outbound as unknown as Record<string, unknown>;
    expect(ob).toMatchObject({ tzKnown: false, durationKnown: false, duration: '11h' });
    const sel = plannedFlightToSelected(trip.flights!.outbound, new Date(2026, 10, 10));
    expect(sel).toMatchObject({ tzKnown: false, durationKnown: false });
    const flightItem = trip.days.flatMap(d => d.activities).find(a => a.id.endsWith('slot-flight-out'));
    // O rascunho mostra a 1ª dica do motor como descrição do item.
    const shown = (flightItem as unknown as { description?: string })?.description ?? '';
    expect(shown).toMatch(/chegada a confirmar/);
    expect(shown).toMatch(/duração a confirmar/);
  });
});

// C.2.1 — janela de chegada filtra a sugestão; preço por pessoa e por perna.
describe('C.2.1 — sugestão na janela, preço por pessoa/perna', () => {
  // GRU→FOR 3h25 (mesmo fuso): 23:35 → 03:00 (+1); 17:40 → 21:05. FOR→GRU 12:00.
  const leg = (id: string, from: string, to: string, at: string, price: number): ReferenceOffer => ({
    id, airline: id.split('-')[0], route: `${from} → ${to}`, isDirect: true, duration: '3h 25m', durationMinutes: 205,
    price, departureTime: '', arrivalTime: '', segments: [{ departure: { iataCode: from, at }, arrival: { iataCode: to, at } }],
  });
  const madrugada = offerToSelected(leg('Gol-0300', 'GRU', 'FOR', '2026-11-10T23:35', 631), { date: new Date(2026, 10, 10, 12) });
  const noite = offerToSelected(leg('Azul-2105', 'GRU', 'FOR', '2026-11-10T17:40', 676), { date: new Date(2026, 10, 10, 12) });

  it('631 às 03:00 (+1) doméstico fica fora; 676 às 21:05 é a sugestão; a lista mantém as duas', () => {
    expect(madrugada.option.arrivalTime).toBe('03:00');
    expect(noite.option.arrivalTime).toBe('21:05');
    const best = pickBest([madrugada, noite])!;
    expect(best.option.id).toBe('Azul-2105');
    expect(rankFlights([madrugada, noite]).map(f => f.option.id)).toEqual(['Azul-2105', 'Gol-0300']);
  });

  it('só a das 03:00 → é ela, e o porquê termina em "nenhuma opção chega entre 06h e 22h"', () => {
    const best = pickBest([madrugada])!;
    expect(best.option.id).toBe('Gol-0300');
    expect(explainPick(best)).toMatch(/ · nenhuma opção chega entre 06h e 22h$/);
  });

  it('explainPick: razão sem "média"; média só como ressalva acima de PRICE_TIE_PCT', () => {
    const best = pickBest([madrugada, noite])!;
    // 676 vs média 653,5 → 3,4%: dentro do empate, sem ressalva.
    expect(explainPick(best)).toBe('direto · chega 21:05 · menor preço');
    expect(explainPick(best)).not.toMatch(/média/);
  });

  it('2 pax, ida 636 + volta 897: Financeiro 3.066; item da ida 1.272 (636/pessoa), da volta 1.794', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Fortaleza', destinationAirportCode: 'FOR', adults: 2 }), noRoute);
    const out = offerToSelected(leg('Azul-ida', 'GRU', 'FOR', '2026-11-10T07:47', 636), { date: new Date(2026, 10, 10, 12) });
    const ret = offerToSelected(leg('Azul-volta', 'FOR', 'GRU', '2026-11-15T15:00', 897), { date: new Date(2026, 10, 15, 12) });
    const next = writeFlightsThrough(trip as unknown as Record<string, unknown>, out, ret);
    expect(planBreakdown(next as never).flights).toBe(3066);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built = buildItineraryForTrip(next as any, { outbound: out, return: ret });
    // Gravado: `cost` da perna × pax; a tela divide por travelers (tripDaysToItinerary) → /pessoa da perna.
    const items = built.days.flatMap((d: { activities: Array<{ id: string; cost: number }> }) => d.activities);
    const ida = items.find(a => a.id.endsWith('slot-flight-out'));
    const volta = items.find(a => a.id.endsWith('slot-flight-back'));
    expect(ida).toMatchObject({ cost: 1272 });
    expect(volta).toMatchObject({ cost: 1794 });
    const shown = tripDaysToItinerary(built.days, new Date(2026, 10, 10, 12), 2).flatMap(d => d.activities);
    expect(shown.find(a => a.id.endsWith('slot-flight-out'))).toMatchObject({ estimatedCost: 1272, costPerPerson: 636 });
    expect(shown.find(a => a.id.endsWith('slot-flight-back'))).toMatchObject({ estimatedCost: 1794, costPerPerson: 897 });
  });
});

// C.4 — a volta também tem janela: partida 06:00–22:00.
describe('C.4 — janela de partida da volta', () => {
  const back = (id: string, at: string, arrive: string, price: number): ReferenceOffer => ({
    id, airline: id.split('-')[0], route: 'FOR → GRU', isDirect: true, duration: '3h 25m', durationMinutes: 205,
    price, departureTime: '', arrivalTime: '', segments: [{ departure: { iataCode: 'FOR', at }, arrival: { iataCode: 'GRU', at: arrive } }],
  });
  const madrugada = offerToSelected(back('Gol-0230', '2026-11-15T02:30', '2026-11-15T05:55', 480), { date: new Date(2026, 10, 15, 12) });
  const manha = offerToSelected(back('Azul-0900', '2026-11-15T09:00', '2026-11-15T12:25', 640), { date: new Date(2026, 10, 15, 12) });

  it('volta 02:30 (mais barata) vs 09:00 → o KINU sugere a das 09:00; a 02:30 segue na lista com rótulo', () => {
    expect(madrugada.option.departureTime).toBe('02:30');
    expect(pickBest([madrugada, manha], 'kinu', 'return')!.option.id).toBe('Azul-0900');
    expect(rankFlights([madrugada, manha], 'kinu', 'return').map((f) => f.option.id)).toEqual(['Azul-0900', 'Gol-0230']);
    expect(outsideWindowLabel(madrugada, 'return')).toBe('fora da janela · sai 02:30');
    expect(outsideWindowLabel(manha, 'return')).toBeNull();
  });

  it('só a das 02:30 → é ela, com a ressalva da volta; na ida a regra de partida não vale', () => {
    const best = pickBest([madrugada], 'kinu', 'return')!;
    expect(best.option.id).toBe('Gol-0230');
    expect(explainPick(best)).toMatch(/ · nenhuma volta sai e chega entre 06h e 22h$/);
    // Na ida o critério continua sendo a chegada (05:55, fora), não a partida.
    expect(outsideWindowLabel(madrugada)).toBe('fora da janela · chega 05:55');
  });
});
