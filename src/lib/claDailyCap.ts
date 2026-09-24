// Limite de indicações ao clã: 5 por dia por usuário (localStorage). A RLS do servidor
// segue sendo a verdade; isto só evita que a pessoa apanhe.
import { loadJson } from '@/lib/safeStorage';

export const CLA_DAILY_CAP = 5;

function key(userId: string, now: Date): string {
  const d = now.toISOString().slice(0, 10);
  return `kinu:cla-cap:${userId}:${d}`;
}

export function claSuggestionsToday(userId: string, now = new Date()): number {
  const n = loadJson<number>(key(userId, now), 0);
  return Number.isFinite(n) ? n : 0;
}

export function canSuggestToday(userId: string, now = new Date()): boolean {
  return claSuggestionsToday(userId, now) < CLA_DAILY_CAP;
}

export function markSuggestionToday(userId: string, now = new Date()): void {
  try {
    localStorage.setItem(key(userId, now), JSON.stringify(claSuggestionsToday(userId, now) + 1));
  } catch {
    /* storage cheio não bloqueia */
  }
}
