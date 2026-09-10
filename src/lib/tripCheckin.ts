// tripCheckin — o check-in pós-viagem: o que a família REALMENTE viveu.
//
// Fonte de verdade da Camada Local (conquistas) e do futuro recap. Escreve três campos
// fora do tipo (index signature do StoredTrip, mesmo padrão de `activatedEventAt`):
//   checkinAt   ISO da submissão — UMA por viagem, é ele que fecha o banner para sempre
//   livedIds    ids locais das atividades marcadas como vividas
//   checkinNote texto livre (fica SÓ aqui; nunca vai no evento, por privacidade)
//
// Não existe referência ao catálogo na atividade: o gerador cria ids derivados do nome
// (`activity-<slug>`, `free-<slug>`) e nenhum campo catalogId/curatedId/sourceId existe no
// objeto. Por isso o evento carrega `lived_ids` (ids locais) E `lived_names`, para o motor
// casar por nome normalizado contra o catálogo.
//
// INVARIANTE: nada aqui lança.
import { differenceInCalendarDays } from 'date-fns';
import type { TripActivity } from '@/types/trip';
import { trackEvent } from '@/lib/kinuEvents';
import { updateTrip, type StoredTrip } from '@/lib/tripStore';

export const CHECKIN_AT = 'checkinAt';
export const LIVED_IDS = 'livedIds';
export const CHECKIN_NOTE = 'checkinNote';

export const NOTE_MAX = 140;

/** Rascunho nunca aconteceu. */
const CHECKINABLE_STATUS = new Set(['active', 'ongoing', 'completed']);

/** Logística não se "vive": voo, hotel, transfer, check-in/out. */
export function isLivableActivity(a: TripActivity): boolean {
  if (!a) return false;
  const cat = a.category;
  if (cat === 'voo' || cat === 'hotel' || cat === 'transporte') return false;
  const name = (a.name || '').toLowerCase();
  if (name.includes('check-in') || name.includes('check in')) return false;
  if (name.includes('check-out') || name.includes('check out')) return false;
  if (name.includes('voo ') || name.includes('transfer')) return false;
  return true;
}

export interface LivableDay {
  day: number;
  title: string;
  date?: string;
  activities: TripActivity[];
}

/** O roteiro agrupado por dia, só com o que dá para ter vivido. Nunca lança. */
export function livableDays(trip: StoredTrip | null | undefined): LivableDay[] {
  try {
    return (trip?.days || [])
      .map((d) => ({
        day: d.day,
        title: d.title,
        date: d.date,
        activities: (d.activities || []).filter(isLivableActivity),
      }))
      .filter((d) => d.activities.length > 0);
  } catch {
    return [];
  }
}

export function isPastTrip(trip: StoredTrip | null | undefined, now: Date = new Date()): boolean {
  try {
    if (!trip?.endDate) return false;
    const end = new Date(trip.endDate);
    if (Number.isNaN(end.getTime())) return false;
    return differenceInCalendarDays(now, end) > 0;
  } catch {
    return false;
  }
}

export function checkinAtOf(trip: StoredTrip | null | undefined): string | null {
  const value = (trip as { checkinAt?: unknown } | null)?.checkinAt;
  return typeof value === 'string' && value ? value : null;
}

/** Viagem passada, de verdade, e ainda sem check-in. */
export function needsCheckin(trip: StoredTrip | null | undefined, now: Date = new Date()): boolean {
  if (!trip) return false;
  if (checkinAtOf(trip)) return false;
  if (!CHECKINABLE_STATUS.has(String(trip.status))) return false;
  return isPastTrip(trip, now);
}

// --- Dispensa por sessão: "depois" não pode virar um pedido a cada render ---
const dismissed = new Set<string>();
export const isCheckinDismissed = (tripId: string) => dismissed.has(tripId);
export const dismissCheckin = (tripId: string) => { dismissed.add(tripId); };

export interface CheckinSubmission {
  livedIds: string[];
  /** Nomes das vividas — o motor casa por nome quando não há id de catálogo. */
  livedNames: string[];
  /** Quantas atividades ficaram desligadas. */
  skipped: number;
  note: string;
}

/**
 * Grava o check-in na viagem e emite `trip.checkin`. Devolve a viagem gravada (ou `null`).
 * Uma por viagem: se `checkinAt` já existe, não regrava e não emite. Nunca lança.
 */
export function submitCheckin(tripId: string, data: CheckinSubmission): StoredTrip | null {
  try {
    let already = false;
    const note = (data.note || '').slice(0, NOTE_MAX);

    const stored = updateTrip(tripId, (trip) => {
      if (trip[CHECKIN_AT]) { already = true; return trip; }
      return {
        ...trip,
        [CHECKIN_AT]: new Date().toISOString(),
        [LIVED_IDS]: data.livedIds,
        ...(note ? { [CHECKIN_NOTE]: note } : {}),
      };
    });

    if (!stored || already) return stored;

    trackEvent('trip.checkin', {
      trip_id: stored.id,
      city: stored.destination ?? '',
      lived_ids: data.livedIds.join(','),
      lived_names: data.livedNames.join(' | '),
      skipped: data.skipped,
      note_len: note.length,
    });

    return stored;
  } catch {
    return null;
  }
}
