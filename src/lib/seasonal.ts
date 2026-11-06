// M18a — "Nesta época": junta as notas de sazonalidade de uma viagem e acha fechamentos por dia.
// Só renderização. Sem dado = [] (nunca inferir). `verify` nunca sai daqui.
import { seasonalNotesFor, type SeasonalNote } from '@/data/seasonalNotes';

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
