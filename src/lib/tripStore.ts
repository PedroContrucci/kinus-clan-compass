/**
 * tripStore — funil único de leitura/escrita de trips sobre localStorage.
 *
 * Regra de ouro (RELATORIO-RECON-TRIPSTORE.md §6):
 *   TODA escrita é read-modify-write contra o localStorage no momento da operação.
 *   Nenhuma função aqui aceita "o array inteiro" de fora para regravar o todo — é
 *   exatamente esse padrão (regravar um array vindo do estado React) que produz a
 *   perda silenciosa descrita em §4.1 e §4.2 do recon.
 *
 * Fase 1a: a fundação nasce sem consumidores. O único ponto de contato com o app
 * é `normalizeTrip`, movida de Viagens.tsx:194. A migração dos 28 pontos de acesso
 * acontece nas fases 1b-1d.
 *
 * Não-objetivos declarados desta fase:
 *   - Não há guarda de SSR. O projeto é SPA Vite e os testes rodam em jsdom; em
 *     ambos `localStorage` e `window` existem.
 *   - Erros de escrita (QuotaExceededError, modo privado) NÃO são capturados. Eles
 *     propagam para o chamador, exatamente como fazem hoje nos 19 `setItem` espalhados
 *     pelo app. Mudar isso é decisão de produto, não de refatoração.
 */

import { SavedTrip, TripActivity, ActivityStatus } from '@/types/trip';
import { loadJson } from '@/lib/safeStorage';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';

export const TRIPS_KEY = 'kinu_trips';
export const PRICE_HISTORY_PREFIX = 'kinu_price_history_';

/**
 * A forma que realmente vive no storage.
 *
 * `SavedTrip` (src/types/trip.ts:118) não declara 6 campos que estão em uso e
 * gravados via `as any` — `lastPriceCheck`, `createdVia`, `outboundFlight`,
 * `returnFlight`, `packing`, `accommodation.mealPlan` (recon §4.6). `outboundFlight`
 * sozinho tem 5 leitores, incluindo o FinOps e o PDF.
 *
 * A index signature preserva esses campos na travessia pelo store sem tocar em
 * `src/types/trip.ts`. É `any` e não `unknown` por necessidade: interfaces do TS não
 * têm index signature implícita, então `SavedTrip & Record<string, unknown>` recusaria
 * qualquer `SavedTrip` como argumento (TS2345). Fecha quando o tipo for corrigido.
 */
export type StoredTrip = SavedTrip & { [key: string]: any };

export interface PriceSnapshot {
  price: number;
  timestamp: string;
}

const PRICE_HISTORY_LIMIT = 10;

// ---------------------------------------------------------------------------
// Identidade
// ---------------------------------------------------------------------------

/**
 * Gera o id de uma viagem. É a MESMA identidade das duas pontas: `trips.id` no kinu-beta
 * é `uuid`, então um `trip_1755…` sequer entra na coluna (`22P02`). Recon §2.1, opção A.
 *
 * `crypto.randomUUID` não está garantido: o browser o esconde fora de origem segura
 * (http num IP de LAN — cenário real do beta no celular), e nem todo ambiente de teste o
 * expõe. O fallback usa `getRandomValues`, que existe nos dois casos, e monta o v4 na
 * mão — sem dependência nova.
 */
export function newTripId(): string {
  const native = globalThis.crypto?.randomUUID?.();
  if (native) return native;

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Normalização — movida de Viagens.tsx:111-203, lógica idêntica.
// As cinco auxiliares são privadas: cada uma tinha exatamente um chamador, aqui dentro.
// ---------------------------------------------------------------------------

function inferDayIcon(label?: string): string {
  const text = (label || '').toLowerCase();
  if (text.includes('partida') || text.includes('embarque') || text.includes('viagem')) return '✈️';
  if (text.includes('chegada')) return '🛬';
  if (text.includes('retorno')) return '🏠';
  if (text.includes('gastr')) return '🍽️';
  if (text.includes('cultural')) return '🏛️';
  if (text.includes('arte')) return '🎨';
  if (text.includes('natureza')) return '🌿';
  if (text.includes('aventura')) return '🚶';
  return '🗺️';
}

function normalizeActivityCategory(activity: any): TripActivity['category'] {
  const type = activity?.type;
  const timeSlot = activity?.timeSlot;

  if (type === 'flight' || timeSlot === 'flight') return 'voo';
  if (type === 'hotel' || type === 'checkin' || type === 'checkout' || timeSlot === 'hotel') return 'hotel';
  if (type === 'transport') return 'transporte';
  if (type === 'restaurant' || ['breakfast', 'lunch', 'dinner'].includes(type) || ['breakfast', 'lunch', 'dinner'].includes(timeSlot)) return 'comida';

  return 'passeio';
}

function normalizeActivityStatus(status: any): ActivityStatus {
  if (status === 'confirmed' || status === 'bidding' || status === 'cancelled') return status;
  return 'planned';
}

function isJetLagFriendlyActivity(activity: any): boolean {
  const hints = [activity?.name, ...(Array.isArray(activity?.tips) ? activity.tips : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return Boolean(activity?.jetLagFriendly) || /sem pressa|refeição leve|relogio biológico|relógio biológico|descanso|dormir no horário local|caminhada leve/.test(hints);
}

function normalizeTripDays(days: any[] = []): SavedTrip['days'] {
  return days.map((day: any, index: number) => {
    const dayNumber = typeof day?.day === 'number'
      ? day.day
      : typeof day?.dayNumber === 'number'
        ? day.dayNumber
        : index + 1;

    const title = day?.title || day?.label || day?.theme || `Dia ${dayNumber}`;
    const icon = day?.icon || inferDayIcon(title);

    const activities = Array.isArray(day?.activities)
      ? day.activities.map((activity: any, activityIndex: number): TripActivity => {
          const category = activity?.category || normalizeActivityCategory(activity);

          return {
            id: activity?.id || `day${dayNumber}-${activityIndex + 1}`,
            time: activity?.time || '09:00',
            name: activity?.name || 'Atividade',
            description: activity?.description || (Array.isArray(activity?.tips) ? activity.tips.join(' • ') : activity?.location || ''),
            duration: activity?.duration || '1h',
            cost: typeof activity?.cost === 'number' ? activity.cost : Number(activity?.estimatedCost || 0),
            type: activity?.type || category,
            status: normalizeActivityStatus(activity?.status),
            category,
            jetLagFriendly: isJetLagFriendlyActivity(activity),
          };
        })
      : [];

    return {
      day: dayNumber,
      date: typeof day?.date === 'string'
        ? day.date
        : day?.date instanceof Date
          ? day.date.toISOString()
          : undefined,
      title,
      icon,
      activities,
    };
  });
}

/**
 * Era `normalizeSavedTrip` em Viagens.tsx:194. Comportamento inalterado, incluindo o
 * detalhe de que `syncTripFlightPlannedFinances` MUTA `trip.finances` no lugar — o
 * spread aqui é raso, então o objeto `finances` continua compartilhado com a entrada.
 * A operação é idempotente (delta 0 na segunda passada), o que a torna segura para
 * rodar em toda leitura.
 */
export function normalizeTrip(trip: any): StoredTrip {
  if (!trip) return trip;

  const normalizedTrip = {
    ...trip,
    days: Array.isArray(trip.days) ? normalizeTripDays(trip.days) : trip.days,
  };

  return syncTripFlightPlannedFinances(normalizedTrip);
}

// ---------------------------------------------------------------------------
// Assinatura de mudanças
// ---------------------------------------------------------------------------

type TripsListener = () => void;

const listeners = new Set<TripsListener>();
let storageListenerAttached = false;

function emit(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn('[tripStore] listener lançou exceção — ignorado', err);
    }
  });
}

/** `key === null` acontece quando outra aba chama `localStorage.clear()`. */
function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== TRIPS_KEY) return;
  emit();
}

/**
 * Notifica quando `kinu_trips` muda — por escrita desta aba (via `emit`) ou de outra
 * aba (evento `storage`, que por especificação NÃO dispara na aba que escreveu; não há
 * risco de notificação dupla). Resolve o recon §4.10.
 *
 * Fase 1a: ninguém assina ainda. O listener de `window` só é anexado quando existe ao
 * menos um assinante, e é removido quando o último sai — sem assinantes, custo zero.
 */
export function subscribeTrips(listener: TripsListener): () => void {
  listeners.add(listener);

  if (!storageListenerAttached) {
    window.addEventListener('storage', handleStorageEvent);
    storageListenerAttached = true;
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && storageListenerAttached) {
      window.removeEventListener('storage', handleStorageEvent);
      storageListenerAttached = false;
    }
  };
}

// ---------------------------------------------------------------------------
// Acesso bruto ao storage — privado
// ---------------------------------------------------------------------------

function describeShape(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** Nunca lança, sempre array, sem normalizar. Base de toda leitura e de toda escrita. */
function readRaw(): any[] {
  const raw = loadJson<unknown>(TRIPS_KEY, []);

  if (!Array.isArray(raw)) {
    console.warn(
      `[tripStore] ${TRIPS_KEY} não é um array (recebido: ${describeShape(raw)}) — ` +
      'tratando como lista vazia',
    );
    return [];
  }

  return raw;
}

/** Único ponto de escrita da lista. Notifica os assinantes depois de gravar. */
function writeAll(trips: any[]): void {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  emit();
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * Sempre um array, sempre normalizado. Storage torto (`{}`, `null`, string) vira `[]`
 * com aviso; entradas não-objeto dentro do array são descartadas, também com aviso.
 */
export function listTrips(): StoredTrip[] {
  const raw = readRaw();
  const usable = raw.filter((trip) => trip && typeof trip === 'object');

  if (usable.length !== raw.length) {
    console.warn(
      `[tripStore] ${raw.length - usable.length} entrada(s) inválida(s) em ${TRIPS_KEY} ` +
      'foram ignoradas na leitura',
    );
  }

  return usable.map((trip) => normalizeTrip(trip));
}

/** Cobre o deep-link `?trip=` (recon §4.11) e substitui a busca por conteúdo (§4.4). */
export function getTrip(id: string): StoredTrip | null {
  return listTrips().find((trip) => trip.id === id) || null;
}

/**
 * Heurística única de "viagem ativa": a primeira `active` com `startDate` no futuro,
 * senão a última da lista. Cópia fiel da lógica hoje duplicada em Cla.tsx:81-83 e
 * FeedbackButton.tsx:25-27.
 */
export function getActiveTrip(): StoredTrip | null {
  const trips = listTrips();

  const upcoming = trips.filter(
    (trip) => trip.status === 'active' && trip.startDate && new Date(trip.startDate) > new Date(),
  );
  if (upcoming.length > 0) return upcoming[0];

  return trips.length > 0 ? trips[trips.length - 1] : null;
}

// ---------------------------------------------------------------------------
// Escrita — read-modify-write, sempre
// ---------------------------------------------------------------------------

/** Append. Relê o storage na hora, então nunca apaga viagem criada por outra tela. */
export function addTrip(trip: SavedTrip): StoredTrip {
  const stored = trip as StoredTrip;

  if (!stored.id) stored.id = newTripId();
  if (!stored.createdAt) stored.createdAt = new Date().toISOString();

  const trips = readRaw();
  trips.push(stored);
  writeAll(trips);

  return normalizeTrip(stored);
}

/**
 * O carro-chefe. Relê o storage, aplica o updater SÓ na viagem do `id`, regrava.
 * É esta função que mata os dois cenários de perda silenciosa do recon (§4.1, §4.2):
 * as outras viagens do array nunca são reconstruídas a partir de estado em memória.
 *
 * O updater recebe a viagem NORMALIZADA e seu retorno é gravado como veio — o store
 * não reescreve a decisão do chamador. Toda leitura normaliza de qualquer forma.
 */
export function updateTrip(
  id: string,
  updater: (trip: StoredTrip) => StoredTrip,
): StoredTrip | null {
  const trips = readRaw();
  const index = trips.findIndex((trip) => trip && trip.id === id);

  if (index === -1) {
    console.warn(`[tripStore] updateTrip: viagem "${id}" não existe no storage — nada gravado`);
    return null;
  }

  const updated = updater(normalizeTrip(trips[index]));
  trips[index] = updated;
  writeAll(trips);

  return updated;
}

/** Remove a viagem E o histórico de preços dela — fecha o vazamento do recon §4.9. */
export function deleteTrip(id: string): void {
  const trips = readRaw();
  const remaining = trips.filter((trip) => !trip || trip.id !== id);

  if (remaining.length === trips.length) {
    console.warn(`[tripStore] deleteTrip: viagem "${id}" não existe no storage`);
  } else {
    writeAll(remaining);
  }

  localStorage.removeItem(priceHistoryKey(id));
}

/** Apaga todas as viagens E todos os `kinu_price_history_*`, órfãos inclusive. */
export function clearTrips(): void {
  localStorage.removeItem(TRIPS_KEY);

  // Coleta antes de remover: `removeItem` reindexa o storage, e apagar durante a
  // varredura pularia chaves.
  const priceHistoryKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PRICE_HISTORY_PREFIX)) priceHistoryKeys.push(key);
  }
  priceHistoryKeys.forEach((key) => localStorage.removeItem(key));

  emit();
}

// ---------------------------------------------------------------------------
// Hidratação (Arco 4f) — a ÚNICA porta de entrada do banco para a lista
// ---------------------------------------------------------------------------

export interface HydrationResult {
  added: number;
  updated: number;
  removed: number;
  keptLocal: number;
  /** `false` quando a fusão deu exatamente o que já estava gravado: nada escrito, sino mudo. */
  changed: boolean;
}

/**
 * Funde o retrato do banco com o que está no storage e grava o resultado.
 *
 * POR QUE ISTO NÃO VIOLA A REGRA DE OURO (recon §1.4 previa só o `newTripId` aqui). A regra
 * proíbe **regravar o todo a partir de estado React em memória** — o padrão que produz a perda
 * silenciosa do recon §4.1/§4.2, onde uma aba apaga a escrita da outra por carregar uma cópia
 * velha do array. Esta função relê o storage por dentro (`readRaw`) e funde; o array que entra
 * não é "o estado do app", é o retrato do banco. Read-modify-write continua valendo — o
 * "modify" é que passou a ter duas fontes.
 *
 * A alternativa (o `tripHydration` gravar `kinu_trips` direto) fura o funil que 28 pontos de
 * acesso respeitam e **não toca o sino**: `emit` é privado, e sem ele as 4 telas assinantes não
 * acordariam.
 *
 * CONTRATO:
 *   - `incoming` chega **na ordem final** (o `select` ordena por `created_at asc`, recon §2.4)
 *     e já normalizado. A ordem é semântica: `getActiveTrip()` usa "a última da lista";
 *   - `keepLocalIds` são os ids que o banco **não** pode sobrescrever nem remover — escritas
 *     locais que ele ainda não viu (o outbox) e linhas que este cliente não entende
 *     (`schema_version` futuro). Quem monta a lista é o `tripHydration`;
 *   - viagem local ausente do banco e fora do `keepLocalIds` é **removida** — junto com o
 *     `kinu_price_history_<id>` dela, o mesmo contrato do `deleteTrip` (recon §4.9);
 *   - entrada local sem id **sobrevive sempre**: ela não tem PK, o banco nunca a viu e nunca a
 *     verá. Apagar dado do usuário por não conseguir identificá-lo é a pior das falhas.
 */
export function hydrateTrips(incoming: StoredTrip[], keepLocalIds: string[] = []): HydrationResult {
  const keep = new Set(keepLocalIds);
  const local = readRaw();

  const localById = new Map<string, StoredTrip>();
  const unidentified: StoredTrip[] = [];

  local.forEach((trip) => {
    const id = trip && typeof trip === 'object' ? trip.id : null;
    if (typeof id === 'string' && id) localById.set(id, trip);
    else unidentified.push(trip);
  });

  const merged: StoredTrip[] = [];
  const taken = new Set<string>();
  let added = 0;
  let updated = 0;
  let keptLocal = 0;

  incoming.forEach((row) => {
    const id = row?.id;
    if (typeof id !== 'string' || !id) return;
    if (taken.has(id)) return; // `trips.id` é PK; duplicata só existiria por bug de quem chama
    taken.add(id);

    const mine = localById.get(id);

    if (mine && keep.has(id)) {
      merged.push(mine);
      keptLocal += 1;
      return;
    }

    merged.push(row);
    if (!mine) added += 1;
    else if (JSON.stringify(mine) !== JSON.stringify(row)) updated += 1;
  });

  const removedIds: string[] = [];

  // A ordem do Map é a ordem do array local: as preservadas entram no fim, que é onde as
  // escritas mais recentes sempre estiveram (o `push` do `addTrip`).
  localById.forEach((trip, id) => {
    if (taken.has(id)) return;
    if (keep.has(id)) {
      merged.push(trip);
      keptLocal += 1;
      return;
    }
    removedIds.push(id);
  });

  if (unidentified.length > 0) {
    console.warn(
      `[tripStore] ${unidentified.length} entrada(s) sem id preservada(s) na hidratação — ` +
      'sem PK não há como confrontá-las com o banco',
    );
    merged.push(...unidentified);
  }

  // Idempotência: hidratar duas vezes não pode acordar as 4 telas para nada. É o que torna o
  // botão "Recarregar do banco" barato de apertar durante o soak.
  if (JSON.stringify(merged) === JSON.stringify(local)) {
    return { added: 0, updated: 0, removed: 0, keptLocal, changed: false };
  }

  writeAll(merged);
  removedIds.forEach((id) => localStorage.removeItem(priceHistoryKey(id)));

  return { added, updated, removed: removedIds.length, keptLocal, changed: true };
}

// ---------------------------------------------------------------------------
// Histórico de preços — trip-scoped, uma chave por viagem
// ---------------------------------------------------------------------------

function priceHistoryKey(tripId: string): string {
  return `${PRICE_HISTORY_PREFIX}${tripId}`;
}

/** Nunca lança, sempre array. Equivale a TripPanel.tsx:148-159. */
export function getPriceHistory(tripId: string): PriceSnapshot[] {
  const raw = loadJson<unknown>(priceHistoryKey(tripId), []);

  if (!Array.isArray(raw)) {
    console.warn(
      `[tripStore] ${priceHistoryKey(tripId)} não é um array ` +
      `(recebido: ${describeShape(raw)}) — tratando como vazio`,
    );
    return [];
  }

  return raw as PriceSnapshot[];
}

/**
 * Era `savePriceSnapshot` em TripPanel.tsx:161-168. Mantém os 10 registros mais
 * recentes. Não notifica `subscribeTrips` — histórico de preço não é a lista de viagens.
 */
export function pushPriceSnapshot(tripId: string, price: number): PriceSnapshot[] {
  const history = getPriceHistory(tripId);
  history.push({ price, timestamp: new Date().toISOString() });

  while (history.length > PRICE_HISTORY_LIMIT) history.shift();

  localStorage.setItem(priceHistoryKey(tripId), JSON.stringify(history));
  return history;
}
