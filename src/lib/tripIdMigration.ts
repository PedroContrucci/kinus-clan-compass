/**
 * tripIdMigration — reescrita one-shot dos ids de viagem legados para uuid v4.
 *
 * Por que existe: até o Arco 4a o id era `trip-${Date.now()}` (createTrip) ou
 * `trip_${Date.now()}` (fallback do store). `trips.id` no kinu-beta é `uuid` — um id
 * legado nem entra na coluna. Os navegadores do beta já têm viagens gravadas com o
 * formato antigo; elas precisam sobreviver. Recon §2.1 (opção A) e §9 risco 2.
 *
 * Por que escreve o `localStorage` direto, em vez de usar o funil do tripStore:
 *   - `updateTrip` entrega ao updater a viagem NORMALIZADA e grava o retorno. Usá-lo aqui
 *     faria a migração de *id* reescrever `days[]` e mutar `finances` de toda viagem
 *     antiga — mudança de dados que ninguém pediu, no boot, em silêncio.
 *   - uma escrita só é atômica: a lista migra inteira ou não migra.
 *   - o store continua sem uma export que aceite "o array inteiro" de fora (a regra de
 *     ouro do Arco 1, tripStore.ts:6-8).
 * Este módulo é a exceção documentada: um passo de migração, chamado num lugar só
 * (App.tsx, antes do primeiro render), descartável quando o beta virar.
 */

import { loadJson } from '@/lib/safeStorage';
import { newTripId, TRIPS_KEY, PRICE_HISTORY_PREFIX } from '@/lib/tripStore';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Estreito de propósito: só o formato que a coluna `uuid` do kinu-beta aceita. */
export function isUuidV4(value: unknown): boolean {
  return typeof value === 'string' && UUID_V4.test(value);
}

export interface TripIdMigrationResult {
  /** Quantas viagens tiveram o id reescrito (inclui viagem sem id nenhum). */
  migrated: number;
  /** Quantas chaves `kinu_price_history_*` foram renomeadas junto. */
  historiesRenamed: number;
}

/**
 * Idempotente: na segunda execução todo id já é uuid v4, então retorna antes de escrever.
 * Não notifica `subscribeTrips` — roda antes de existir assinante.
 */
export function migrateLegacyTripIds(): TripIdMigrationResult {
  const raw = loadJson<unknown>(TRIPS_KEY, []);
  if (!Array.isArray(raw)) return { migrated: 0, historiesRenamed: 0 };

  const renames: Array<{ from: string; to: string }> = [];
  let migrated = 0;

  const trips = raw.map((trip) => {
    if (!trip || typeof trip !== 'object') return trip;

    const id = (trip as { id?: unknown }).id;
    if (isUuidV4(id)) return trip;

    const nextId = newTripId();
    migrated += 1;
    if (typeof id === 'string' && id.length > 0) renames.push({ from: id, to: nextId });

    // Spread raso: preserva TODOS os campos, inclusive os 6 que `SavedTrip` não declara.
    // A migração toca um campo só.
    return { ...(trip as Record<string, unknown>), id: nextId };
  });

  if (migrated === 0) return { migrated: 0, historiesRenamed: 0 };

  // Uma escrita só, e antes dos renames: se um rename falhar sobra histórico órfão (chave
  // sem consumidor em produção); na ordem inversa, um setItem estourado perderia histórico
  // de viagem viva.
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));

  let historiesRenamed = 0;
  renames.forEach(({ from, to }) => {
    const history = localStorage.getItem(`${PRICE_HISTORY_PREFIX}${from}`);
    if (history === null) return;

    localStorage.setItem(`${PRICE_HISTORY_PREFIX}${to}`, history);
    localStorage.removeItem(`${PRICE_HISTORY_PREFIX}${from}`);
    historiesRenamed += 1;
  });

  console.info(
    `[tripIdMigration] ${migrated} viagem(ns) com id legado reescrita(s) em uuid v4` +
    ` · ${historiesRenamed} histórico(s) de preço renomeado(s)`,
  );

  return { migrated, historiesRenamed };
}
