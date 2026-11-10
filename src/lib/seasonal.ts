// M18a — "Nesta época": junta as notas de sazonalidade de uma viagem e acha fechamentos por dia.
// Só renderização. Sem dado = [] (nunca inferir). `verify` nunca sai daqui.
import { seasonalNotesFor, type SeasonalNote } from '@/data/seasonalNotes';
import { HARD_HOLIDAYS, HARD_HOLIDAY_ALIASES, OPEN_AIR, OPEN_CONFIRMED } from '@/data/openIds';
import { getDestinationActivities, type SuggestedActivity } from '@/data/destinationActivities';

export type SeasonalView = Pick<SeasonalNote, 'city' | 'month' | 'climate' | 'closures' | 'events' | 'tips'>;

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const monthName = (m: number): string => MESES[m - 1] ?? '';

/** Normalização de destino: só "antes da vírgula" + trim. */
export function seasonalCity(destination?: string): string {
  return (destination ?? '').split(',')[0].trim();
}

function ymd(s?: string | Date): { y: number; m: number; d: number } | null {
  if (s instanceof Date) {
    return isNaN(s.getTime()) ? null : { y: s.getFullYear(), m: s.getMonth() + 1, d: s.getDate() };
  }
  const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? '');
  return r ? { y: +r[1], m: +r[2], d: +r[3] } : null;
}

/** Notas dos meses cobertos pela viagem (ida e volta podem cruzar o mês), em ordem. */
export function seasonalForTrip(trip: { destination?: string; startDate?: string; endDate?: string }): SeasonalView[] {
  const city = seasonalCity(trip?.destination);
  const a = ymd(trip?.startDate);
  if (!city || !a) return [];
  const b = ymd(trip?.endDate) ?? a;
  const out: SeasonalView[] = [];
  let y = a.y, m = a.m;
  for (let guard = 0; guard < 24 && (y < b.y || (y === b.y && m <= b.m)); guard++) {
    const n = seasonalNotesFor(city, m);
    if (n) out.push({ city: n.city, month: n.month, climate: n.climate, closures: n.closures, events: n.events, tips: n.tips });
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

/** Linhas de closures com prefixo de data (antes do 1º ":"); "Mês inteiro" e sem data ficam fora. */
export function closureOnDate(city: string, date?: string | Date): string[] {
  const t = ymd(date);
  const c = seasonalCity(city);
  if (!t || !c) return [];
  const dd = String(t.d).padStart(2, '0');
  const mm = String(t.m).padStart(2, '0');
  const note = seasonalNotesFor(c, t.m);
  if (!note) return [];
  return note.closures.filter((line) => {
    const i = line.indexOf(':');
    if (i < 0) return false;
    const dates = [...line.slice(0, i).matchAll(/(\d{2})\/(\d{2})/g)];
    return dates.some((x) => x[1] === dd && x[2] === mm);
  });
}

/** M18b: a data (dd/mm) cai no prefixo de uma closure? Aceita "DD/MM", "DD/MM e DD/MM" e o intervalo "DD/MM a DD/MM"
 *  (inclusive; o que atravessa o ano, como 28/12 a 03/01, vale para os dois lados). Não mexe em `closureOnDate` (M18a). */
export function prefixHasDate(prefix: string, m: number, d: number): boolean {
  const key = m * 100 + d;
  let hit = false;
  const rest = prefix.replace(/(\d{2})\/(\d{2})\s+a\s+(\d{2})\/(\d{2})/g, (_, d1, m1, d2, m2) => {
    const s = +m1 * 100 + +d1, e = +m2 * 100 + +d2;
    if (s <= e ? key >= s && key <= e : key >= s || key <= e) hit = true;
    return ' ';
  });
  for (const x of rest.matchAll(/(\d{2})\/(\d{2})/g)) if (+x[2] * 100 + +x[1] === key) hit = true;
  return hit;
}

/** M18b: ids do catálogo fechados nesta data — `closedIds` das linhas de `closures` do mês da data que a cobrem
 *  (data, "e", intervalo) ∪ as linhas "Mês inteiro" (toda data daquele mês). Sem dado ou sem `closedIds` = vazio. */
export function closedIdsOnDate(city: string, date?: string | Date): Set<string> {
  const out = new Set<string>();
  const t = ymd(date);
  const c = seasonalCity(city);
  if (!t || !c) return out;
  const note = seasonalNotesFor(c, t.m);
  if (!note?.closedIds) return out;
  for (const [idx, ids] of Object.entries(note.closedIds)) {
    const line = note.closures[+idx];
    if (!line) continue;
    const prefix = line.slice(0, Math.max(line.indexOf(':'), 0));
    if (/^\s*Mês inteiro/i.test(prefix) || prefixHasDate(prefix, t.m, t.d)) ids.forEach((id) => out.add(id));
  }
  return out;
}

/** Cidade da tabela de feriado duro (apelidos `Rome`/`Tokyo` normalizados); undefined = sem regra. */
export function hardHolidayCity(city: string): string | undefined {
  const c = seasonalCity(city);
  const k = HARD_HOLIDAY_ALIASES[c] ?? c;
  return HARD_HOLIDAYS[k] ? k : undefined;
}

const unavailableCache = new Map<string, Set<string>>();

/** M18d: indisponíveis na data = `closedIdsOnDate` ∪ (em feriado duro da cidade) toda atividade de manhã/tarde que não
 *  está em OPEN_AIR nem em OPEN_CONFIRMED. `closedIds` vence. Cidade/data fora de HARD_HOLIDAYS = exatamente `closedIdsOnDate`. */
export function unavailableIdsOnDate(city: string, date?: string | Date): Set<string> {
  const closed = closedIdsOnDate(city, date);
  const k = hardHolidayCity(city);
  const t = ymd(date);
  if (!k || !t) return closed;
  const dd = `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}`;
  if (!HARD_HOLIDAYS[k].includes(dd)) return closed;
  const key = `${k}|${dd}|${[...closed].sort().join(',')}`;
  let out = unavailableCache.get(key);
  if (!out) {
    const open = new Set([...(OPEN_AIR[k] ?? []), ...(OPEN_CONFIRMED[k] ?? []).map((o) => o.id)]);
    out = new Set(closed);
    for (const a of getDestinationActivities(k)) {
      if ((a.category === 'morning' || a.category === 'afternoon') && !open.has(a.id)) out.add(a.id);
    }
    unavailableCache.set(key, out);
  }
  return new Set(out);
}

/** "25/12 — Louvre, Orsay e Versalhes fechados" a partir de "25/12: Louvre, ...; quase todos…". */
export function closureAlert(line: string, date: Date | string): string {
  const t = ymd(date);
  const i = line.indexOf(':');
  const body = (i >= 0 ? line.slice(i + 1) : line).split(';')[0].trim();
  const label = t ? `${String(t.d).padStart(2, '0')}/${String(t.m).padStart(2, '0')}` : '';
  return label ? `${label} — ${body}` : body;
}

/** Alerta do dia (várias linhas juntas) ou null. */
export function dayAlert(city: string, date?: string | Date): string | null {
  const lines = closureOnDate(city, date);
  if (!lines.length || !date) return null;
  return lines.map((l) => closureAlert(l, date)).join(' · ');
}

export interface SeasonalRow { kind: 'title' | 'climate' | 'label' | 'item'; text: string }

/** Linhas planas do bloco "NESTA ÉPOCA" (PDF). Sem dado = []. */
export function seasonalRows(trip: { destination?: string; startDate?: string; endDate?: string }): SeasonalRow[] {
  const rows: SeasonalRow[] = [];
  for (const n of seasonalForTrip(trip)) {
    rows.push({ kind: 'title', text: `NESTA ÉPOCA — ${monthName(n.month)}` });
    rows.push({ kind: 'climate', text: n.climate });
    const sec = (label: string, items: string[]) => {
      if (!items.length) return;
      rows.push({ kind: 'label', text: label });
      items.forEach((t) => rows.push({ kind: 'item', text: t }));
    };
    sec('Fechamentos', n.closures);
    sec('Acontece', n.events);
    sec('Dicas', n.tips);
  }
  return rows;
}
