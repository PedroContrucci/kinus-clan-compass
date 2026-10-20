// razaoLines — C.5c: o Financeiro como livro-razão da viagem. Cada compromisso com valor,
// origem, status e a ação que fecha. Puro: lê só o que já está gravado na viagem (voos,
// hospedagem, itens do dia, categorias de finanças) — nenhum número novo. Os tiles
// Planejado/Confirmado leem `razaoTotals` destas mesmas linhas: Σ linhas = tile por construção.
import { addDays, format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TripActivity } from '@/types/trip';
import { hotelRateSource } from '@/lib/draftItinerary';
import { planBreakdown, reserveFor } from '@/lib/planTotals';
import { roteiroKind } from '@/lib/roteiroBlocks';
import { buildCloseLinks, type CloseLink } from '@/lib/offersLinks';
import { flightSearchRoute } from '@/lib/timezone';

export type RazaoStatus = 'pending' | 'confirmed' | 'na';
export type RazaoAction = 'confirmar' | 'ofertas' | 'roteiro';

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
  /** C.8 — voo/hotel a confirmar: provedores com rota/datas/pax ("Onde fechar ▸"). */
  closeLinks?: CloseLink[];
  day?: {
    dayNumber: number;
    dayIndex: number;
    items: RazaoDayItem[];
    confirmedCount: number;
    checkableCount: number;
  };
}

const tripDate = (v: unknown) => {
  if (!v) return undefined;
  const d = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
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
  // C.8: "Onde fechar ▸" — rota da busca (nunca inventada) + datas + pax; Kiwi parceiro entra aqui.
  const route = flightSearchRoute(trip ?? {});
  const closeLinks = buildCloseLinks('voo', {
    origin: route?.origin,
    destination: route?.destination,
    start: tripDate(trip?.startDate),
    end: tripDate(trip?.endDate),
    pax: trav,
    airline: trip?.outboundFlight?.option?.airline,
  });
  const base = { kind: 'voo' as const, icon: '✈️', confirmed: 0, status: 'pending' as const, actions, confirmTipo: 'voo' as const, closeLinks };

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
    closeLinks: buildCloseLinks('hotel', {
      city: trip?.destination,
      hotelName: acc?.name,
      start: tripDate(trip?.startDate),
      end: tripDate(trip?.endDate),
      pax: Math.max(1, Number(trip?.travelers) || 1),
    }),
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

// ---------------------------------------------------------------------------
// C.5d — tiles clicáveis e "Quando o dinheiro sai". Os dois só AGRUPAM as linhas acima:
// Σ quebra = tile e Σ desembolso = Planejado por construção, nenhuma conta nova.
// ---------------------------------------------------------------------------

export type RazaoCategory = 'voo' | 'hotel' | 'passeios' | 'alimentacao' | 'transfer' | 'outros';

export const RAZAO_CATEGORY_LABEL: Record<RazaoCategory, string> = {
  voo: 'Voo', hotel: 'Hotel', passeios: 'Passeios', alimentacao: 'Alimentação', transfer: 'Transfer', outros: 'Outros gastos',
};

function itemCategory(a: TripActivity): RazaoCategory {
  const name = (a.name || '').toLowerCase();
  if (a.type === 'transport' || a.category === 'transporte' || name.includes('transfer')) return 'transfer';
  if (roteiroKind(a) === 'restaurante') return 'alimentacao';
  return 'passeios';
}

/** Quebra de um tile (a confirmar ou confirmado) por categoria. As 5 sempre; "outros" só se > 0. */
export function razaoBreakdown(
  lines: RazaoLine[],
  part: 'planned' | 'confirmed',
): { key: RazaoCategory; label: string; value: number }[] {
  const acc: Record<RazaoCategory, number> = { voo: 0, hotel: 0, passeios: 0, alimentacao: 0, transfer: 0, outros: 0 };
  for (const l of lines) {
    if (l.kind === 'voo' || l.kind === 'hotel' || l.kind === 'outros') acc[l.kind] += l[part];
    else if (l.kind === 'dia' && l.day) {
      for (const it of l.day.items) {
        if (it.confirmed === (part === 'confirmed')) acc[itemCategory(it.activity)] += it.value;
      }
    }
  }
  return (Object.keys(acc) as RazaoCategory[])
    .filter((k) => k !== 'outros' || acc.outros > 0)
    .map((key) => ({ key, label: RAZAO_CATEGORY_LABEL[key], value: acc[key] }));
}

export interface DesembolsoMarco {
  id: string;
  label: string;
  value: number;
  /** Reserva: aparece, mas fica fora da soma (não é plano). */
  outOfPlan?: boolean;
}

const dayLabel = (d: Date | null) => (d && isValid(d) ? format(d, 'dd/MMM', { locale: ptBR }) : null);
const isoDay = (v: unknown) => (v ? parseISO(String(v).slice(0, 10)) : null);

/** Quando sai o que ainda está a confirmar: voo ao confirmar, hotel no check-in, cada dia na sua data. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function razaoDesembolso(trip: any, lines: RazaoLine[]): DesembolsoMarco[] {
  const out: DesembolsoMarco[] = [];
  const voo = lines.filter((l) => l.kind === 'voo').reduce((s, l) => s + l.planned, 0);
  if (voo > 0) out.push({ id: 'voo', label: 'Ao confirmar o voo · hoje', value: voo });
  const start = isoDay(trip?.startDate);
  for (const l of lines) {
    if (l.planned <= 0) continue;
    if (l.kind === 'hotel') {
      const d = dayLabel(isoDay(trip?.accommodation?.checkIn) ?? start);
      out.push({ id: l.id, label: `No check-in${d ? ` (${d})` : ''} · Hotel`, value: l.planned });
    } else if (l.kind === 'dia' && l.day) {
      // Mesma regra de data do Roteiro: a do dia, senão início + N − 1.
      const own = isoDay(trip?.days?.[l.day.dayIndex]?.date);
      const d = dayLabel(own ?? (start ? addDays(start, l.day.dayNumber - 1) : null));
      out.push({ id: l.id, label: `Dia ${l.day.dayNumber}${d ? ` (${d})` : ''}`, value: l.planned });
    }
  }
  const reserva = lines.find((l) => l.kind === 'reserva');
  if (reserva) out.push({ id: 'reserva', label: 'Reserva', value: reserva.value, outOfPlan: true });
  return out;
}
