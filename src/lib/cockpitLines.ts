// cockpitLines — linhas do card do rascunho que não cabem em kinuDidLines: a análise em
// uma linha e os itens que não couberam (com o "tentar encaixar" pela janela R16 do motor).
// Puro: lê a viagem e o catálogo; quem grava é o dono do storage.
import type { SuggestedActivity } from '@/data/destinationActivities';
import { findCityInfo } from '@/data/destinationCatalog';
import { catalogFor } from '@/lib/interestsFor';
import { catalogIdOf } from '@/lib/localAchievements';
import { planBreakdown } from '@/lib/planTotals';
import { dayWindowUsage, type PlanDay, type PlanDayItem, type PlanRulesContext } from '@/lib/itineraryValidator';
import type { UnplacedEdit } from '@/lib/replanItinerary';

const brl = (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
const hasTag = (a: SuggestedActivity | undefined, tag: string) => !!a && (a.styleTags ?? []).some((t) => t.toLowerCase() === tag);

/** Dias do roteiro com pelo menos um item do catálogo marcado com a tag. Nunca pelo nome da cidade. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function daysWithTag(trip: any, tag: string): number {
  const index = new Map(catalogFor(String(trip?.destination ?? '')).map((a) => [a.id, a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days: any[] = Array.isArray(trip?.days) ? trip.days : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return days.filter((d) => (d?.activities ?? []).some((a: any) =>
    /^day-\d+-/.test(String(a?.id ?? '')) && hasTag(index.get(catalogIdOf(a.id)), tag))).length;
}

/** "Análise: dentro do teto · 1 bate-volta · 3 dias de praia". Praia só com a marca 'beach' do catálogo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analysisSummary(trip: any): string {
  const plan = planBreakdown(trip);
  const budget = Number(trip?.budget) || 0;
  const parts: string[] = [];
  if (budget > 0 && plan.total > 0) parts.push(plan.total <= budget ? 'dentro do teto' : `${brl(plan.total - budget)} acima do teto`);
  const daytrips = daysWithTag(trip, 'daytrip');
  if (daytrips > 0) parts.push(`${daytrips} ${daytrips === 1 ? 'bate-volta' : 'bate-voltas'}`);
  const beach = daysWithTag(trip, 'beach');
  if (beach > 0) parts.push(`${beach} ${beach === 1 ? 'dia de praia' : 'dias de praia'}`);
  return `Análise: ${parts.length ? parts.join(' · ') : 'como montei o roteiro'}`;
}

/** Contexto R16 da viagem: chegada da ida, saída da volta e doméstico como o motor decide. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rulesContextOf(trip: any): PlanRulesContext {
  const out = trip?.outboundFlight;
  const ret = trip?.returnFlight;
  const segs = out?.option?.segments;
  const arrAt = String(segs?.[(segs?.length ?? 1) - 1]?.arrival?.at ?? '');
  const m = arrAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const domestic = typeof ret?.international === 'boolean'
    ? !ret.international
    : findCityInfo(String(trip?.destination ?? ''))?.region === 'Brasil';
  return {
    destination: String(trip?.destination ?? ''),
    interests: [],
    arrivalDate: m?.[1],
    arrivalTime: out?.tzKnown === false ? undefined : (m?.[2] ?? out?.option?.arrivalTime),
    returnDepartureTime: ret?.option?.departureTime,
    domestic,
  };
}

const MEAL = new Set(['breakfast', 'lunch', 'dinner']);

/**
 * "tentar encaixar": cada item volta ao fim do seu dia (ou ao último dia que ainda existe),
 * só se o dia ainda cabe na janela R16 com ele. O que não cabe fica em `unplacedEdits`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tryPlaceUnplaced<T extends Record<string, any>>(trip: T): { trip: T; placed: UnplacedEdit[]; left: UnplacedEdit[] } {
  const unplaced: UnplacedEdit[] = Array.isArray(trip.unplacedEdits) ? trip.unplacedEdits : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const srcDays: any[] = Array.isArray(trip.days) ? trip.days : [];
  if (unplaced.length === 0 || srcDays.length === 0) return { trip, placed: [], left: unplaced };
  const days = srcDays.map((d) => ({ ...d, activities: [...(d.activities ?? [])] }));
  const ctx = rulesContextOf(trip);
  const catalog = new Map(catalogFor(ctx.destination).map((a) => [a.id, a]));
  const travelers = Number(trip.travelers) || 1;
  const placed: UnplacedEdit[] = [];
  const left: UnplacedEdit[] = [];
  for (const u of unplaced) {
    let idx = days.findIndex((d) => d.day === u.day);
    if (idx < 0) idx = days.length - 1;
    const day = days[idx].day;
    // Id de roteiro embute o do catálogo (`day-N-<id>`): mesmo deslocamento N − dia do original.
    const pm = String(u.id).match(/^day-(\d+)-(.+)$/);
    const id = pm && day !== u.day ? `day-${day + (Number(pm[1]) - u.day)}-${pm[2]}` : u.id;
    const cat = catalog.get(catalogIdOf(u.id));
    const kind = cat && MEAL.has(cat.category) ? 'comida' : 'passeio';
    const item = {
      id, name: u.name, time: '', description: cat?.tips?.[0] ?? '',
      duration: cat ? `${cat.durationHours}h` : '',
      cost: Math.round((cat?.estimatedCostBRL ?? 0) * travelers),
      type: kind, category: kind, status: 'planned', timeSlot: cat?.category ?? 'afternoon',
    };
    const fit = dayWindowUsage(days as PlanDay[], ctx, idx, [item as PlanDayItem]);
    if (!fit || fit.used > fit.window) { left.push(u); continue; }
    days[idx].activities.push(item);
    placed.push(u);
  }
  return { trip: { ...trip, days, unplacedEdits: left }, placed, left };
}
