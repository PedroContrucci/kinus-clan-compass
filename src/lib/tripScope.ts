// Recorte do que a viagem mostra (C.5a). Tudo derivado na renderização — nada é gravado.
//
// Doméstica x internacional: o voo é quem sabe (`international` gravado pelo flightModel);
// sem voo, o catálogo (região Brasil) ou o país declarado na viagem.
import { findCityInfo } from '@/data/destinationCatalog';
import type { ChecklistItem } from '@/types/trip';

// Aceita SavedTrip/StoredTrip sem cast; os campos fora do tipo são lidos por `extra()`.
type TripLike = { destination?: string; country?: string };
const extra = (trip: TripLike | null | undefined, key: string): unknown =>
  trip ? (trip as Record<string, unknown>)[key] : undefined;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function isDomesticTrip(trip: TripLike | null | undefined): boolean {
  if (!trip) return false;
  const flights = [extra(trip, 'outboundFlight'), extra(trip, 'returnFlight')] as Array<{ international?: unknown } | undefined>;
  for (const f of flights) {
    if (f && typeof f.international === 'boolean') return !f.international;
  }
  if (trip.destination && findCityInfo(trip.destination)?.region === 'Brasil') return true;
  const country = norm(trip.country || '');
  return country === 'brasil' || country === 'brazil';
}

/** Tiles do Financeiro: inteiro até 10 mil; formato k só acima disso. */
export function formatTileBRL(value: number): string {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 10000) return `${sign}R$ ${abs.toLocaleString('pt-BR')}`;
  const k = (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${sign}R$ ${k}k`;
}

/** Itens do checklist fixo que não existem numa viagem doméstica. */
export const INTERNATIONAL_ONLY_CHECKLIST_IDS = ['doc-1', 'pre-2', 'pre-3', 'pre-4'] as const;

/**
 * Recorte do checklist gravado (a lista fixa mora em src/types/trip.ts, intocável).
 * Devolve os rótulos ajustados e os ids a esconder — quem renderiza soma ao próprio
 * `hiddenIds`, então o item escondido também sai do contador de Prontidão.
 */
export function scopeChecklist(items: ChecklistItem[], domestic: boolean): { items: ChecklistItem[]; hiddenIds: string[] } {
  if (!domestic) return { items, hiddenIds: [] };
  const hidden = new Set<string>(INTERNATIONAL_ONLY_CHECKLIST_IDS);
  return {
    items: items.map((i) => (i.id === 'pack-3' ? { ...i, label: 'Carregadores' } : i)),
    hiddenIds: items.filter((i) => hidden.has(i.id)).map((i) => i.id),
  };
}

export type PriceCheck = { price: number; delta?: number; checkedAt?: number; source?: string; roundTrip?: boolean };

/**
 * Só compara preço real com preço real da mesma fonte e do mesmo formato (ida e volta).
 * Hoje a consulta grava a tarifa só de ida × 2, sem `source`, contra um voo planejado que
 * em geral é estimativa (route/tier) — então isto devolve false até haver real vs real.
 */
export function isPriceCheckComparable(trip: TripLike | null | undefined, check?: PriceCheck | null): boolean {
  const pc = check ?? ((extra(trip, 'lastPriceCheck') as PriceCheck | undefined) || null);
  if (!pc || !pc.source || pc.roundTrip !== true) return false;
  const out = extra(trip, 'outboundFlight') as { source?: string; priceSource?: string } | undefined;
  if (!out || !out.source || out.source === 'estimate') return false;
  return out.priceSource === pc.source;
}

export const NO_COMPARABLE_PRICE_REPLY = 'Ainda não tenho preço real comparável para esta rota.';

/** Resposta do agente (`verificar_ofertas`): sem fonte comparável, nunca um número. */
export function buildOfferCheckReply(
  trip: TripLike,
  check: PriceCheck,
  anchor: number,
  kiwiUrl: string,
): string {
  if (!isPriceCheckComparable(trip, check) || !(anchor > 0)) {
    return kiwiUrl ? `${NO_COMPARABLE_PRICE_REPLY} ${kiwiUrl}` : NO_COMPARABLE_PRICE_REPLY;
  }
  const fmt = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
  const comparable = check.price;
  if (comparable <= anchor * 0.95) {
    return `📉 Achei voo por ${fmt(comparable)} — ${fmt(anchor - comparable)} abaixo do seu planejado (${fmt(anchor)}). Vale garantir: ${kiwiUrl}`;
  }
  if (comparable <= anchor * 1.05) {
    return `➡️ Preços estáveis: melhor voo agora ${fmt(comparable)} vs ${fmt(anchor)} planejado. ${kiwiUrl}`;
  }
  return `📈 Voos subiram: melhor agora ${fmt(comparable)} vs ${fmt(anchor)} planejado. ${kiwiUrl}`;
}
