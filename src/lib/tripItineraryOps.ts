// Operações puras sobre o roteiro — extraídas de Viagens.tsx para que o agente (adicionar_atividade),
// o drawer e o Clã usem o MESMO caminho de inserção. Corpo idêntico ao original.
import type { SavedTrip, TripActivity } from '@/types/trip';
import type { SuggestedActivity } from '@/data/destinationActivities';

export const calculateTripProgress = (trip: SavedTrip) => {
  if (!trip?.days || !Array.isArray(trip.days)) return 0;

  let total = 0;
  let confirmed = 0;

  if (trip.flights?.outbound) {
    total++;
    if (trip.flights.outbound.status === 'confirmed') confirmed++;
  }

  if (trip.accommodation) {
    total++;
    if (trip.accommodation.status === 'confirmed') confirmed++;
  }

  trip.days.forEach((day) => {
    if (day?.activities && Array.isArray(day.activities)) {
      day.activities.forEach((act) => {
        if (act.category === 'voo' || act.category === 'hotel') return;
        total++;
        if (act.status === 'confirmed') confirmed++;
      });
    }
  });
  return total > 0 ? Math.round((confirmed / total) * 100) : 0;
};

export const applyTripPlannedCostDelta = (trip: SavedTrip, activity: TripActivity, delta: number) => {
  // Only planned (not confirmed/bidding) contributes to finances.planned
  if (activity.status === 'confirmed' || activity.status === 'bidding') return;
  if (!delta) return;
  const cat = (activity.category as string) || '';
  const bucket: 'food' | 'tours' =
    ['comida', 'breakfast', 'lunch', 'dinner', 'café', 'cafe'].includes(cat.toLowerCase())
      ? 'food'
      : 'tours';
  trip.finances.planned = Math.max(0, trip.finances.planned + delta);
  trip.finances.categories[bucket].planned = Math.max(0, (trip.finances.categories[bucket].planned || 0) + delta);
  trip.finances.available = trip.finances.total - trip.finances.planned - trip.finances.confirmed - trip.finances.bidding;
};

/**
 * Insere um item do catálogo no dia `dia` de `trip` (MUTA a cópia recebida).
 * Devolve false quando o dia não existe — nada é alterado.
 */
export function addCatalogActivityToDay(
  trip: SavedTrip,
  dia: number,
  suggested: SuggestedActivity,
  horario: string,
): boolean {
  const dayIdx = trip.days.findIndex(d => d.day === dia);
  const day = dayIdx >= 0 ? trip.days[dayIdx] : trip.days[dia - 1];
  if (!day) return false;
  const travelers = Math.max(1, trip.travelers || 1);
  const cost = suggested.estimatedCostBRL || 0;
  const newAct: TripActivity = {
    id: `${suggested.id}-${Date.now()}`,
    time: horario,
    name: suggested.name,
    description: suggested.tips?.[0] || '',
    duration: suggested.durationHours ? `${suggested.durationHours}h` : '',
    cost,
    type: suggested.category || 'activity',
    status: 'planned',
    category: suggested.category as TripActivity['category'],
    edited: true,
  };
  day.activities.push(newAct);
  day.activities.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  applyTripPlannedCostDelta(trip, newAct, cost * travelers);
  trip.progress = calculateTripProgress(trip);
  return true;
}

/** Horário padrão por categoria do catálogo (sheet do Clã). */
export function defaultTimeFor(category?: string): string {
  switch (category) {
    case 'breakfast': return '08:00';
    case 'lunch': return '12:30';
    case 'dinner': return '20:00';
    case 'afternoon': return '15:00';
    case 'night': return '21:00';
    default: return '10:00';
  }
}

/** Id do catálogo em um id de item: `day-N-<id>` (gerador) ou `<id>-<timestamp>` (inserção manual). */
export function extractCatalogId(itemId: unknown): string {
  if (typeof itemId !== 'string') return '';
  return itemId.trim().replace(/^day-\d+-/, '').replace(/-\d{13}$/, '');
}
