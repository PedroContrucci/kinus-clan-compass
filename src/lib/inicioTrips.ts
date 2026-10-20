// Início (C.7) — ordem e linha de estado da lista de viagens. Só contagem e ordenação:
// nenhum valor calculado aqui (o Planejado de cada linha vem de razaoTotals).
import { format, isValid, parseISO } from 'date-fns';
import type { StoredTrip } from '@/lib/tripStore';

export const ACTIVE = new Set(['active', 'ongoing']);
export const STATUS_LABEL: Record<string, string> = { active: 'Ativa', ongoing: 'Em viagem', draft: 'Rascunho', completed: 'Concluída' };

export const ddmm = (v: unknown) => {
  const d = parseISO(String(v ?? '').slice(0, 10));
  return isValid(d) ? format(d, 'dd/MM') : '—';
};
const byStart = (a: StoredTrip, b: StoredTrip) => String(a.startDate ?? '').localeCompare(String(b.startDate ?? ''));

/** Ativas pela data mais próxima, depois rascunhos, depois concluídas. */
export function orderTrips(trips: StoredTrip[]): StoredTrip[] {
  return [
    ...trips.filter((t) => ACTIVE.has(String(t.status))).sort(byStart),
    ...trips.filter((t) => t.status === 'draft'),
    ...trips.filter((t) => t.status === 'completed').sort(byStart).reverse(),
  ];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "1 viagem ativa · 1 rascunho" — contagem, nenhum valor calculado. */
export function statusLine(trips: StoredTrip[]): string {
  const active = trips.filter((t) => ACTIVE.has(String(t.status))).length;
  const drafts = trips.filter((t) => t.status === 'draft').length;
  const done = trips.filter((t) => t.status === 'completed').length;
  const parts = [
    active && plural(active, 'viagem ativa', 'viagens ativas'),
    drafts && plural(drafts, 'rascunho', 'rascunhos'),
    done && plural(done, 'concluída', 'concluídas'),
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Nenhuma viagem ainda';
}
