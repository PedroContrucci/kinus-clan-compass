// replanItinerary — trocar perna replaneja sem apagar (R-V11). Puro (sem React).
// O motor refaz os dias com os voos novos; as edições do usuário (itens trocados/adicionados,
// remoções e itens confirmados) são reaplicadas onde ainda cabem. O que não cabe volta em
// `unplaced` para o aviso — nada some em silêncio. "Regerar roteiro" continua sendo do zero.
import type { TripDay } from '@/types/trip';
import { flightArrivalBand, type SelectedFlight } from '@/lib/itineraryEngine';
import { lastDayWindowHours } from '@/lib/itineraryValidator';
import { flightDaysLater, retimeFlight, selectedToPlanned } from '@/lib/flightModel';
import { normalizePlaceName } from '@/lib/placeIdentity';
import { buildItineraryForTrip, type DraftItineraryResult, type DraftLike } from '@/lib/draftItinerary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Record<string, any> & { id: string; name: string };
type Day = Omit<TripDay, 'activities'> & { activities: Item[] };

export interface UnplacedEdit { id: string; name: string; day: number }

const LOGISTIC_SLOTS = new Set(['flight', 'hotel']);
const LOGISTIC_KINDS = new Set(['flight', 'hotel', 'checkin', 'checkout', 'transport']);

function isLogistic(a: Item): boolean {
  return LOGISTIC_SLOTS.has(a.timeSlot) || LOGISTIC_KINDS.has(a.kind)
    || /transfer|aeroporto|check-?(in|out)/i.test(a.name || '');
}

const minutesOf = (t: unknown): number => {
  const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
};

const durationMinutes = (d: unknown): number => {
  const m = String(d ?? '').match(/(\d+(?:[.,]\d+)?)\s*h(?:\s*(\d{1,2}))?/);
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 60) + (Number(m[2]) || 0);
  const mm = String(d ?? '').match(/(\d+)\s*min/);
  return mm ? Number(mm[1]) : 0;
};

/**
 * Janela livre de um dia regerado, lida dos próprios itens do motor:
 * trânsito / chegada noturna / partida sem chegada → nada cabe; dia de chegada → depois do
 * check-in até 22 h; último dia → até o transfer para o aeroporto; resto → o dia todo.
 */
function windowOf(day: Day): { start: number; end: number } | null {
  const acts = day.activities;
  if (acts.some((a) => /-slot-transit$/.test(a.id))) return null;
  const transfer = acts.find((a) => /-slot-transfer$/.test(a.id));
  if (transfer) return { start: 0, end: Math.max(0, minutesOf(transfer.time)) };
  const checkin = acts.find((a) => /-slot-checkin$/.test(a.id));
  if (checkin) {
    const start = minutesOf(checkin.time);
    return start < 0 || start >= 20 * 60 ? null : { start, end: 22 * 60 };
  }
  if (acts.some((a) => /-slot-flight-out$/.test(a.id))) return null;
  return { start: 0, end: 24 * 60 };
}

function insertByTime(list: Item[], item: Item): void {
  const t = minutesOf(item.time);
  const at = list.findIndex((a) => minutesOf(a.time) > t);
  if (at < 0) list.push(item); else list.splice(at, 0, item);
}

/**
 * Reaplica as edições de `prevDays` (contra `prevEngineIds`, a última saída do motor) sobre
 * `newDays` (saída nova do motor). Preserva: itens fora do motor (trocados/adicionados) e itens
 * confirmados; remoções do usuário continuam removidas. Mesmo dia; mesmo slot quando houver
 * vaga (o item que ele tinha trocado ou um item novo do motor no mesmo slot); senão pela hora,
 * se a janela do dia permitir; senão → `unplaced`.
 */
export function reapplyEdits(
  prevDays: unknown,
  prevEngineIds: unknown,
  newDays: TripDay[],
): { days: TripDay[]; unplaced: UnplacedEdit[] } {
  const days = JSON.parse(JSON.stringify(newDays)) as Day[];
  if (!Array.isArray(prevDays) || !Array.isArray(prevEngineIds)) return { days: days as unknown as TripDay[], unplaced: [] };
  const engine = new Set(prevEngineIds.map(String));
  const prev = prevDays as Day[];
  const prevItems = prev.flatMap((d) => (Array.isArray(d?.activities) ? d.activities.map((a) => ({ day: Number(d.day), a })) : []));
  const prevIds = new Set(prevItems.map((x) => String(x.a.id)));
  const removed = new Set([...engine].filter((id) => !prevIds.has(id)));
  const newIds = new Set(days.flatMap((d) => d.activities.map((a) => a.id)));

  // Confirmado que o motor recolocou com o mesmo id: só herda o status.
  const prevStatus = new Map(prevItems.filter((x) => x.a.status === 'confirmed' || x.a.status === 'bidding').map((x) => [x.a.id, x.a.status]));
  days.forEach((d) => d.activities.forEach((a) => { if (prevStatus.has(a.id)) a.status = prevStatus.get(a.id); }));

  const keep = prevItems.filter(({ a }) => !isLogistic(a)
    && (!engine.has(String(a.id)) || ((a.status === 'confirmed' || a.status === 'bidding') && !newIds.has(a.id))));

  // Remoções do usuário: o mesmo id regerado sai de novo, e o lugar vira vaga para a troca dele.
  const vacancies = new Map<number, { timeSlot: string; time: string; index: number }[]>();
  days.forEach((d) => {
    const out: Item[] = [];
    d.activities.forEach((a) => {
      if (removed.has(a.id)) {
        const list = vacancies.get(Number(d.day)) ?? [];
        list.push({ timeSlot: a.timeSlot, time: a.time, index: out.length });
        vacancies.set(Number(d.day), list);
      } else out.push(a);
    });
    d.activities = out;
  });

  const unplaced: UnplacedEdit[] = [];
  const placed: Item[] = [];
  for (const { day, a } of keep) {
    const d = days.find((x) => Number(x.day) === day);
    const win = d ? windowOf(d) : null;
    if (!d || !win) { unplaced.push({ id: a.id, name: a.name, day }); continue; }
    // 1) A vaga que ele mesmo abriu (troca), no mesmo slot.
    const vac = vacancies.get(day);
    const vi = vac ? vac.findIndex((v) => v.timeSlot === a.timeSlot) : -1;
    if (vac && vi >= 0) {
      const v = vac.splice(vi, 1)[0];
      const item = { ...a, time: v.time };
      d.activities.splice(Math.min(v.index, d.activities.length), 0, item);
      placed.push(item);
      continue;
    }
    // 2) Item de catálogo novo do motor no mesmo slot (o que o usuário manteve fica; genérico
    //    `-slot-` não é vaga — o café rápido de voo cedo não vira café às 04:30).
    const ri = d.activities.findIndex((x) => x.timeSlot === a.timeSlot && !isLogistic(x)
      && !x.id.includes('-slot-') && !prevIds.has(x.id) && !placed.includes(x));
    if (ri >= 0) {
      const item = { ...a, time: d.activities[ri].time };
      d.activities[ri] = item;
      placed.push(item);
      continue;
    }
    // 3) Pela hora, se a janela do dia permite.
    const t = minutesOf(a.time);
    if (t >= win.start && t >= 0 && t + durationMinutes(a.duration) <= win.end) {
      const item = { ...a };
      insertByTime(d.activities, item);
      placed.push(item);
      continue;
    }
    unplaced.push({ id: a.id, name: a.name, day });
  }

  // Lugar do usuário manda: a cópia do motor em outro ponto da viagem sai (placeIdentity).
  const mine = new Set(placed.map((p) => normalizePlaceName(p.name)));
  days.forEach((d) => {
    d.activities = d.activities.filter((a) => placed.includes(a) || isLogistic(a) || !mine.has(normalizePlaceName(a.name)));
  });
  return { days: days as unknown as TripDay[], unplaced };
}

export interface ReplanResult extends DraftItineraryResult { unplaced: UnplacedEdit[] }

/** Motor com os voos novos + edições reaplicadas. `engineItemIds` = saída pura do motor. */
export function replanTrip(trip: DraftLike, flights: { outbound: SelectedFlight; return: SelectedFlight }): ReplanResult {
  const built = buildItineraryForTrip(trip, flights);
  const { days, unplaced } = reapplyEdits(trip.days, trip.engineItemIds, built.days);
  return { ...built, days, unplaced };
}

/**
 * A troca de hora mexe no roteiro? D+n da ida, faixa R-V9 da chegada ou janela do último
 * dia (R-V8). Doméstico = volta marcada `international: false`.
 */
export function legShiftChangesPlan(
  before: { outbound?: SelectedFlight | null; return?: SelectedFlight | null },
  after: { outbound?: SelectedFlight | null; return?: SelectedFlight | null },
): boolean {
  const bo = before.outbound, ao = after.outbound;
  if (bo && ao && (flightDaysLater(bo) !== flightDaysLater(ao) || flightArrivalBand(bo) !== flightArrivalBand(ao))) return true;
  const br = before.return, ar = after.return;
  if (br && ar) {
    const dom = (f: SelectedFlight) => f.international === false;
    if (lastDayWindowHours(br.option.departureTime, dom(br)) !== lastDayWindowHours(ar.option.departureTime, dom(ar))) return true;
  }
  return false;
}

/** Texto do aviso dos itens que não couberam (lista completa = o "ver"). */
export function unplacedMessage(unplaced: UnplacedEdit[]): { title: string; description: string } | null {
  if (unplaced.length === 0) return null;
  const n = unplaced.length;
  return {
    title: `${n} ${n === 1 ? 'item seu não coube' : 'itens seus não couberam'} no novo horário`,
    description: unplaced.map((u) => `${u.name} (dia ${u.day})`).join(' · '),
  };
}

type Legs = { outbound?: SelectedFlight | null; return?: SelectedFlight | null };

/**
 * Voo confirmado com hora de saída nova (Viagens): a perna que mudou tem a chegada refeita
 * (computeArrival via retimeFlight) e o planejado `trip.flights.*` acompanha os horários.
 * Se D+n, faixa R-V9 ou janela do último dia mudarem, replaneja os dias preservando edições;
 * finanças: só passeios/comida planejados acompanham (voo confirmado e hotel intocados).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function retimeConfirmedLegs<T extends Record<string, any>>(trip: T, before: Legs): { trip: T; replanned: boolean; unplaced: UnplacedEdit[] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next: any = { ...trip };
  const from = trip.origin || 'São Paulo';
  const to = trip.destination;
  const legs: [key: 'outboundFlight' | 'returnFlight', planned: 'outbound' | 'return', b: SelectedFlight | null | undefined, ctx: { fromCity?: string; toCity?: string }][] = [
    ['outboundFlight', 'outbound', before.outbound, { fromCity: from, toCity: to }],
    ['returnFlight', 'return', before.return, { fromCity: to, toCity: from }],
  ];
  for (const [key, plannedKey, b, ctx] of legs) {
    const cur = next[key] as SelectedFlight | undefined;
    if (!cur || !b || cur.option.departureTime === b.option.departureTime) continue;
    const re = retimeFlight(cur, cur.option.departureTime, ctx);
    next[key] = re;
    const prev = next.flights?.[plannedKey];
    if (prev) {
      // Viagem lida do disco: `date` vira string; a data de saída do planejado manda.
      const p = selectedToPlanned(re, { ...prev, departureDate: prev.departureDate ?? new Date(re.date).toISOString() }, prev.id);
      next.flights = { ...next.flights, [plannedKey]: { ...prev, departureTime: p.departureTime, arrivalTime: p.arrivalTime, arrivalDate: p.arrivalDate } };
    }
  }
  const after = { outbound: next.outboundFlight, return: next.returnFlight };
  const hasDays = Array.isArray(next.days) && next.days.length > 0;
  if (!hasDays || !after.outbound || !after.return || !legShiftChangesPlan(before, after)) {
    return { trip: next, replanned: false, unplaced: [] };
  }
  const r = replanTrip(next, { outbound: after.outbound, return: after.return });
  next.days = r.days;
  next.engineItemIds = r.engineItemIds;
  next.unplacedEdits = r.unplaced;
  const cats = next.finances?.categories;
  if (cats?.tours && cats?.food) {
    const delta = (r.buckets.toursPlanned - (cats.tours.planned || 0)) + (r.buckets.foodPlanned - (cats.food.planned || 0));
    next.finances = {
      ...next.finances,
      planned: Math.max(0, (next.finances.planned || 0) + delta),
      categories: {
        ...cats,
        tours: { ...cats.tours, planned: r.buckets.toursPlanned },
        food: { ...cats.food, planned: r.buckets.foodPlanned },
      },
    };
  }
  return { trip: next, replanned: true, unplaced: r.unplaced };
}
