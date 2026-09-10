// tripEvents — os FATOS de viagem que alimentam o motor de conquistas.
//
// Um lugar só monta as props de cada fato, pelo mesmo motivo do `hotelSwapEvent.ts`: a análise
// só compara eventos que têm exatamente o mesmo formato, e formato montado na tela é formato
// que diverge no segundo ponto de emissão.
//
// POR QUE NÃO DENTRO DO `tripStore`: `kinuEvents` importa o cliente do kinu-beta, e
// `client.ts` roda `createClient` NO IMPORT (morre sem as VITE_KINU_BETA_* num CI limpo).
// O `tripStore` é importado por quatro suítes que não mockam esse cliente. O store continua
// sendo storage puro; quem conhece telemetria é este módulo, que importa o store.
//
// IDEMPOTÊNCIA POR CHAVE NATURAL: `trip.activated` e `trip.completed` acontecem UMA vez por
// viagem, não uma por sessão. A marca vive na própria viagem (campo fora do tipo, como o
// `createdVia`), é reivindicada DENTRO do `updateTrip` — que relê o storage antes de gravar,
// então duas telas no mesmo tick não passam as duas — e sobe no `payload` do espelho
// (`tripSync.toRow`), o que faz o segundo dispositivo já encontrar a viagem marcada.
//
// A marca é gravada ANTES da emissão de propósito. `trackEvent` é síncrono e nunca lança, então
// não há janela real entre as duas; e se a ENTREGA falhar, o anel do emissor guarda o evento
// como pendente e a próxima emissão o carrega. Marca sem evento entregue se resolve sozinha;
// evento sem marca duplicaria.
//
// INVARIANTE, a mesma do emissor: nada aqui lança, nunca.
import { differenceInCalendarDays } from 'date-fns';
import type { SavedTrip } from '@/types/trip';
import { trackEvent } from '@/lib/kinuEvents';
import { getCurrentUserId, subscribeSession } from '@/lib/session';
import { listTrips, subscribeTrips, updateTrip, type StoredTrip } from '@/lib/tripStore';
import { DESTINATION_CATALOG, findCityInfo, type RegionName } from '@/data/destinationCatalog';

/** Campos fora do tipo. Exportados para o teste — e para quem for ler a viagem no storage. */
export const ACTIVATED_MARK = 'activatedEventAt';
export const COMPLETED_MARK = 'completedEventAt';

/** Quem criou o rascunho. Vocabulário fechado: é dimensão de análise, não texto livre. */
export type TripOrigin = 'wizard' | 'kinu_ai';

/** O que foi confirmado. `activity` é o resto — passeio, comida, transporte, compras. */
export type ItemKind = 'flight' | 'hotel' | 'activity';

// ---------------------------------------------------------------------------
// Geografia — derivada do catálogo, nunca inventada
// ---------------------------------------------------------------------------

/**
 * As 6 regiões do catálogo colapsadas em continente. `Brasil` é recorte de produto e
 * `Ásia & Oriente Médio` é recorte de operação — nenhum dos dois é continente.
 *
 * `Américas` fica inteira: separar norte de sul exigiria um mapa país→continente, e nenhuma
 * conquista pediu isso ainda.
 */
const CONTINENT_BY_REGION: Record<RegionName, string> = {
  'Europa': 'Europa',
  'Américas': 'Américas',
  'Brasil': 'Américas',
  'Ásia & Oriente Médio': 'Ásia',
  'África': 'África',
  'Oceania': 'Oceania',
};

/** A região de um país do catálogo. Serve ao destino que não é cidade catalogada. */
function regionOfCountry(country: string): RegionName | null {
  if (!country) return null;
  for (const [region, countries] of Object.entries(DESTINATION_CATALOG)) {
    if (countries.some((entry) => entry.country === country)) return region as RegionName;
  }
  return null;
}

/**
 * País e continente da viagem, quando dá para saber.
 *
 * Destino fora do catálogo devolve `{}` — as props somem do evento em vez de virarem
 * `'desconhecido'`, que contaria como mais um país e mais um continente no motor.
 */
export function geoOf(trip: StoredTrip): { country?: string; continent?: string } {
  const info = findCityInfo(trip?.destination);
  const country = info?.country.country || trip?.country || undefined;
  const region = info?.region ?? regionOfCountry(country ?? '');

  return {
    ...(country ? { country } : {}),
    ...(region ? { continent: CONTINENT_BY_REGION[region] } : {}),
  };
}

/** Dias de viagem pelo CALENDÁRIO. Datas tortas caem para o tamanho do roteiro. */
export function daysOf(trip: StoredTrip): number {
  const start = new Date(trip?.startDate);
  const end = new Date(trip?.endDate);
  const diff = differenceInCalendarDays(end, start);

  if (Number.isFinite(diff) && diff >= 0) return diff + 1;
  return Array.isArray(trip?.days) ? trip.days.length : 0;
}

// ---------------------------------------------------------------------------
// A marca — reivindicação atômica pelo funil do store
// ---------------------------------------------------------------------------

/**
 * Marca a viagem e devolve a versão marcada, ou `null` se alguém já tinha marcado.
 *
 * O `if` roda DENTRO do updater porque é lá que se enxerga o storage no momento da escrita:
 * `updateTrip` relê o disco, normaliza e só então chama o updater (tripStore.ts:333).
 */
function claim(tripId: string, mark: string): StoredTrip | null {
  let claimed: StoredTrip | null = null;

  try {
    updateTrip(tripId, (trip) => {
      if (trip[mark]) return trip;
      const marked = { ...trip, [mark]: new Date().toISOString() };
      claimed = marked;
      return marked;
    });
  } catch {
    return null;
  }

  return claimed;
}

// ---------------------------------------------------------------------------
// Os fatos
// ---------------------------------------------------------------------------

/**
 * O rascunho nasceu. Sem marca: criar duas viagens é criar duas viagens.
 *
 * Pede o mínimo que lê, e não `StoredTrip`, para os dois chamadores não precisarem de um
 * `as any` só para atravessar a index signature do store (é a `SavedTrip` crua que sai do
 * `buildDraftTrip` que chega aqui).
 */
export function trackTripCreated(trip: Pick<SavedTrip, 'id' | 'destination'>, origin: TripOrigin): void {
  trackEvent('trip.created', {
    trip_id: trip?.id ?? '',
    destination: trip?.destination ?? '',
    origin,
  });
}

/**
 * A viagem foi ativada. UMA vez por `trip_id`, aqui e em qualquer outro dispositivo que já
 * tenha recebido a marca pelo espelho.
 */
export function trackTripActivated(tripId: string): void {
  const trip = claim(tripId, ACTIVATED_MARK);
  if (!trip) return;

  const { country, continent } = geoOf(trip);
  const children = (trip as { childrenCount?: unknown }).childrenCount;

  trackEvent('trip.activated', {
    trip_id: trip.id,
    destination: trip.destination ?? '',
    ...(country ? { country } : {}),
    ...(continent ? { continent } : {}),
    days: daysOf(trip),
    travelers: Number(trip.travelers) || 0,
    ...(typeof children === 'number' ? { children } : {}),
  });
}

/**
 * Um item foi reservado de verdade.
 *
 * `item_id` não é enfeite: sem ele, confirmar duas atividades seguidas na mesma viagem produz
 * duas emissões idênticas, e o dedupe do emissor (kinuEvents.ts:105) descarta a segunda — o
 * motor contaria 1 onde houve 2. É id local e opaco (`act-3-2`), não conteúdo de roteiro.
 */
export function trackTripItemConfirmed(tripId: string, kind: ItemKind, itemId: string): void {
  trackEvent('trip.item_confirmed', { trip_id: tripId, kind, item_id: itemId });
}

/** A categoria do roteiro no vocabulário do evento. */
export function itemKindOf(category?: string): ItemKind {
  if (category === 'voo') return 'flight';
  if (category === 'hotel') return 'hotel';
  return 'activity';
}

/**
 * Fechou dentro do orçamento? Sai colado no `trip.completed` e só nele — por isso não tem marca
 * própria: quem o protege de repetir é a marca do `completed`.
 *
 * `planned` é o que a viagem custou na conta do app: confirmado + o que sobrou planejado. É a
 * única prop de dinheiro deste arco.
 */
function trackBudgetClosedUnder(trip: StoredTrip, userId?: string): void {
  const budget = Number(trip.finances?.total ?? trip.budget) || 0;
  const planned = (Number(trip.finances?.confirmed) || 0) + (Number(trip.finances?.planned) || 0);

  // Sem orçamento não existe "fechou abaixo" — existe "não sabemos".
  if (budget <= 0) return;
  if (planned > budget) return;

  trackEvent('budget.closed_under', { trip_id: trip.id, budget, planned }, userId);
}

// ---------------------------------------------------------------------------
// trip.completed — varredura no carregamento
// ---------------------------------------------------------------------------

/** Rascunho nunca virou viagem: não concluiu. */
const COMPLETABLE = new Set(['active', 'ongoing', 'completed']);

/** Terminou ANTES de hoje. Viagem que acaba hoje ainda está acontecendo. */
function isPast(trip: StoredTrip, now: Date): boolean {
  if (!trip?.endDate) return false;
  const end = new Date(trip.endDate);
  if (Number.isNaN(end.getTime())) return false;
  return differenceInCalendarDays(now, end) > 0;
}

/**
 * Varre as viagens locais e emite `trip.completed` (e o `budget.closed_under` que o acompanha)
 * das que venceram e ainda não foram marcadas. Devolve quantas emitiu — o teste conta por aqui.
 *
 * Nunca lança. Exportada para o teste e para o `/smoke`.
 */
export function sweepCompletedTrips(now: Date = new Date(), userId?: string): number {
  let emitted = 0;

  try {
    for (const trip of listTrips()) {
      if (trip[COMPLETED_MARK]) continue;
      if (!COMPLETABLE.has(trip.status)) continue;
      if (!isPast(trip, now)) continue;

      // A reivindicação relê o storage: se a varredura reentrou (a marca anterior acordou o
      // sino do store), a segunda tentativa desta mesma viagem volta `null` e para aqui.
      const claimed = claim(trip.id, COMPLETED_MARK);
      if (!claimed) continue;

      const { country, continent } = geoOf(claimed);
      trackEvent('trip.completed', {
        trip_id: claimed.id,
        destination: claimed.destination ?? '',
        ...(country ? { country } : {}),
        ...(continent ? { continent } : {}),
        days: daysOf(claimed),
      }, userId);
      emitted += 1;

      trackBudgetClosedUnder(claimed, userId);
    }
  } catch {
    /* invariante: nada aqui lança */
  }

  return emitted;
}

let started = false;
let sweeping = false;
let sweepAgain = false;

/**
 * Uma varredura por vez, com volta extra para quem chegou no meio — o mesmo idioma do
 * `flushEvents`. A volta importa: a hidratação escreve viagens do servidor no meio do boot, e
 * sem ela as viagens recém-chegadas esperariam o próximo carregamento do app.
 */
function scheduleSweep(): void {
  const userId = getCurrentUserId();

  // SEM DONO NÃO EMITE. Evento com `user_id` nulo não serve a um motor de conquistas, e o
  // /planejar anônimo é caminho real. Quando a sessão resolver, `subscribeSession` traz a
  // varredura de volta e a viagem vencida é emitida ali, com dono.
  if (!userId) return;

  if (sweeping) {
    sweepAgain = true;
    return;
  }

  sweeping = true;
  try {
    do {
      sweepAgain = false;
      sweepCompletedTrips(new Date(), userId);
    } while (sweepAgain);
  } finally {
    sweeping = false;
  }
}

/**
 * Liga a detecção de viagem concluída. Idempotente, síncrona, não devolve promessa — o boot não
 * espera por nada. Mesmo formato dos outros quatro `start*` do App.tsx.
 *
 * Assina o sino do store porque o carregamento do app não é um instante: a hidratação (4f)
 * traz viagens do servidor DEPOIS deste boot, e viagem vencida que chega do servidor também
 * concluiu.
 */
export function startTripCompletion(): void {
  if (started) return;
  started = true;

  subscribeSession(() => scheduleSweep());
  subscribeTrips(() => scheduleSweep());

  // A sessão pode ter resolvido antes desta linha — `subscribeSession` não replica o estado
  // atual na assinatura (contrato do 4b). Mesmo empurrão do `startTripSync`.
  scheduleSweep();
}
