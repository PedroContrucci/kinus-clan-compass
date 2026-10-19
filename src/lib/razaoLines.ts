// razaoLines — C.5c: o Financeiro como livro-razão da viagem. Cada compromisso com valor,
// origem, status e a ação que fecha. Puro: lê só o que já está gravado na viagem (voos,
// hospedagem, itens do dia, categorias de finanças) — nenhum número novo. Os tiles
// Planejado/Confirmado leem `razaoTotals` destas mesmas linhas: Σ linhas = tile por construção.
import type { TripActivity } from '@/types/trip';
import { hotelRateSource } from '@/lib/draftItinerary';
import { planBreakdown, reserveFor } from '@/lib/planTotals';
import { roteiroKind } from '@/lib/roteiroBlocks';
import { buildOfferLinks } from '@/lib/offersLinks';

export type RazaoStatus = 'pending' | 'confirmed' | 'na';
export type RazaoAction = 'confirmar' | 'parceiro' | 'ofertas' | 'roteiro';

export interface RazaoDayItem {
  activity: TripActivity;
  /** Índice real em trip.days[dayIndex].activities (o confirmModal usa). */
  actIndex: number;
  value: number;
  confirmed: boolean;
  /** ☐ só onde o Roteiro também mostra (logística não tem checkbox). */
  checkable: boolean;
}

export interface RazaoLine {
  id: string;
  kind: 'voo' | 'hotel' | 'dia' | 'outros' | 'reserva';
  icon: string;
  title: string;
  value: number;
  /** Parte a confirmar / parte confirmada do valor (somam `value`; reserva fica fora das duas). */
  planned: number;
  confirmed: number;
  origin: string;
  status: RazaoStatus;
  actions: RazaoAction[];
  /** Voo e hotel: qual sheet do TripPanel o [Confirmar] abre. */
  confirmTipo?: 'voo' | 'hotel';
  /** Link de afiliado (Kiwi) quando `actions` inclui 'parceiro'. */
  partnerUrl?: string;
  day?: {
    dayNumber: number;
    dayIndex: number;
    items: RazaoDayItem[];
    confirmedCount: number;
    checkableCount: number;
  };
}

const n = (v: unknown) => Math.round(Number(v) || 0);
const hasPrice = (v: unknown) => v != null && v !== '' && Number.isFinite(Number(v));

const flightOrigin = (source: unknown) =>
  source === 'confirmed' ? 'valor registrado' : source === 'reference' ? 'tarifa de referência' : 'estimativa';

const HOTEL_ORIGIN = { confirmed: 'confirmado', curated: 'curado', estimate: 'estimativa' } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flightLines(trip: any): RazaoLine[] {
  const cats = trip?.finances?.categories ?? {};
  if (trip?.flights?.outbound?.status === 'confirmed') {
    // D3: a confirmação grava um valor só para os dois trechos — a divisão não existe e não é inventada.
    const value = n(cats.flights?.confirmed);
    return [{
      id: 'voo', kind: 'voo', icon: '✈️', title: 'Voo ida e volta', value, planned: 0, confirmed: value,
      origin: 'valor registrado', status: 'confirmed', actions: [],
    }];
  }

  const trav = Math.max(1, Number(trip?.travelers) || 1);
  const planned = n(cats.flights?.planned);
  const ob = trip?.outboundFlight?.option?.price;
  const rt = trip?.returnFlight?.option?.price;
  const actions: RazaoAction[] = ['confirmar'];
  const o = trip?.flights?.outbound;
  const partnerUrl = buildOfferLinks({
    category: 'flight',
    originCode: o?.origin,
    destinationCode: o?.destination,
    startDate: trip?.startDate ? new Date(trip.startDate) : undefined,
    endDate: trip?.endDate ? new Date(trip.endDate) : undefined,
    travelers: trav,
  }).find((l) => l.partner === 'Kiwi')?.url;
  if (partnerUrl) actions.push('parceiro');
  const base = { kind: 'voo' as const, icon: '✈️', confirmed: 0, status: 'pending' as const, actions, confirmTipo: 'voo' as const, partnerUrl };

  // Trechos separados só quando o par gravado é o mesmo número do balde (sem resto de arredondamento).
  if (hasPrice(ob) && hasPrice(rt) && n(Number(ob) * trav) + n(Number(rt) * trav) === planned && planned > 0) {
    const obV = n(Number(ob) * trav);
    const rtV = n(Number(rt) * trav);
    return [
      { ...base, id: 'voo-ida', title: 'Voo ida', value: obV, planned: obV, origin: flightOrigin(trip?.outboundFlight?.source ?? o?.source) },
      { ...base, id: 'voo-volta', title: 'Voo volta', value: rtV, planned: rtV, origin: flightOrigin(trip?.returnFlight?.source ?? trip?.flights?.return?.source) },
    ];
  }
  if (planned <= 0) return [];
  return [{ ...base, id: 'voo', title: 'Voo ida e volta', value: planned, planned, origin: flightOrigin(trip?.outboundFlight?.source ?? o?.source) }];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hotelLine(trip: any): RazaoLine | null {
  const acc = trip?.accommodation;
  // C.4.2: o balde do hotel é sempre acc.totalPrice — e a confirmação grava o valor pago nele.
  const value = acc ? n(acc.totalPrice) : n(trip?.finances?.categories?.accommodation?.planned);
  if (value <= 0) return null;
  const src = hotelRateSource(acc);
  const nights = n(acc?.totalNights);
  const title = nights > 0 ? `Hotel (${nights} ${nights === 1 ? 'noite' : 'noites'})` : 'Hotel';
  if (src === 'confirmed') {
    return { id: 'hotel', kind: 'hotel', icon: '🏨', title, value, planned: 0, confirmed: value, origin: HOTEL_ORIGIN.confirmed, status: 'confirmed', actions: [] };
  }
  return {
    id: 'hotel', kind: 'hotel', icon: '🏨', title, value, planned: value, confirmed: 0,
    origin: HOTEL_ORIGIN[src], status: 'pending', actions: ['confirmar', 'ofertas'], confirmTipo: 'hotel',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dayLines(trip: any): RazaoLine[] {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  const out: RazaoLine[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  days.forEach((d: any, dayIndex: number) => {
    const acts: TripActivity[] = Array.isArray(d?.activities) ? d.activities : [];
    // Mesmo recorte do cabeçalho do Roteiro: voo e hotel moram nas linhas próprias.
    const items: RazaoDayItem[] = acts
      .map((activity, actIndex) => ({ activity, actIndex }))
      .filter(({ activity: a }) => a.category !== 'voo' && a.category !== 'hotel' && a.status !== 'cancelled')
      .map(({ activity, actIndex }) => {
        const confirmed = activity.status === 'confirmed';
        return {
          activity, actIndex, confirmed,
          value: confirmed ? n(activity.paidAmount) : n(activity.cost),
          checkable: roteiroKind(activity) !== 'logistica',
        };
      });
    if (items.length === 0) return;
    const planned = items.filter((i) => !i.confirmed).reduce((s, i) => s + i.value, 0);
    const confirmed = items.filter((i) => i.confirmed).reduce((s, i) => s + i.value, 0);
    const checkable = items.filter((i) => i.checkable);
    const confirmedCount = checkable.filter((i) => i.confirmed).length;
    const dayNumber = Number(d?.day) || dayIndex + 1;
    out.push({
      id: `dia-${dayNumber}`, kind: 'dia', icon: '📅', title: `Dia ${dayNumber}`,
      value: planned + confirmed, planned, confirmed,
      origin: planned === 0 && confirmed > 0 ? 'valor registrado' : 'estimativa do catálogo',
      status: checkable.length > 0 && confirmedCount === checkable.length ? 'confirmed' : 'pending',
      actions: ['roteiro'],
      day: { dayNumber, dayIndex, items, confirmedCount, checkableCount: checkable.length },
    });
  });
  return out;
}

/**
 * D1: gasto manual legado (sem item no roteiro). Só valores gravados por categoria, e só a
 * categoria que nenhum item confirmado do roteiro alimenta — nunca uma diferença calculada.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function otherLine(trip: any): RazaoLine | null {
  const cats = trip?.finances?.categories ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acts: TripActivity[] = (Array.isArray(trip?.days) ? trip.days : []).flatMap((d: any) => d?.activities ?? []);
  const fedByItem = (cat: string) => acts.some((a) => a.category === cat && a.status === 'confirmed');
  const value = (fedByItem('compras') ? 0 : n(cats.shopping?.confirmed)) + (fedByItem('transporte') ? 0 : n(cats.transport?.confirmed));
  if (value <= 0) return null;
  return { id: 'outros', kind: 'outros', icon: '🧾', title: 'Outros gastos registrados', value, planned: 0, confirmed: value, origin: 'valor registrado', status: 'confirmed', actions: [] };
}

/** Voo ida · Voo volta · Hotel · Dia 1…N · (Outros gastos registrados) · Reserva (15%). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function razaoLines(trip: any): RazaoLine[] {
  const lines: RazaoLine[] = [...flightLines(trip)];
  const hotel = hotelLine(trip);
  if (hotel) lines.push(hotel);
  lines.push(...dayLines(trip));
  const other = otherLine(trip);
  if (other) lines.push(other);
  const reserve = reserveFor(planBreakdown(trip).total);
  if (reserve > 0) {
    lines.push({ id: 'reserva', kind: 'reserva', icon: '🛟', title: 'Reserva (15%)', value: reserve, planned: 0, confirmed: 0, origin: 'para imprevistos', status: 'na', actions: [] });
  }
  return lines;
}

/** O que os tiles mostram: Σ das linhas (a reserva fica fora das duas somas). */
export function razaoTotals(lines: RazaoLine[]): { planned: number; confirmed: number } {
  return lines.reduce(
    (t, l) => ({ planned: t.planned + l.planned, confirmed: t.confirmed + l.confirmed }),
    { planned: 0, confirmed: 0 },
  );
}
