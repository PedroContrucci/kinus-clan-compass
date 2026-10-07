// flightRanking — a regra escrita de como o KINU escolhe um voo entre ofertas de referência.
// Puro e determinístico (mesma lista → mesma ordem), testado em src/test/flightRanking.test.ts.
//
// Modo 'kinu' (padrão, chip "Menor preço"):
//   1. direto antes de com escala;
//   2. menor preço — preços a até PRICE_TIE_PCT do menor (do mesmo grupo direto/escala)
//      contam como empate;
//   3. chegada local entre ARRIVAL_WINDOW.from e .to (06:00–22:00) antes de fora dela;
//   4. menor duração.
// Modo 'fastest' (chip "Mais rápido"): direto > menor duração > menor preço (mesma faixa) > janela.
// Desempate final: preço exato, depois id — nunca a ordem de chegada da API.
import type { SelectedFlight } from '@/lib/itineraryEngine';
import { flightDaysLater } from '@/lib/flightModel';

/** Faixa de empate de preço: até 5% acima do menor conta como "mesmo preço". */
export const PRICE_TIE_PCT = 0.05;
/** Janela de chegada confortável, hora local do destino [from, to]. */
export const ARRIVAL_WINDOW = { from: 6, to: 22 } as const;

export type RankMode = 'kinu' | 'fastest';

function arrivalHour(f: SelectedFlight): number {
  const m = String(f.option.arrivalTime || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : -1;
}

/** Chega dentro da janela? Fuso desconhecido não prova nada → fora. */
export function arrivesInWindow(f: SelectedFlight): boolean {
  if (f.tzKnown === false) return false;
  const h = arrivalHour(f);
  return h >= ARRIVAL_WINDOW.from && h <= ARRIVAL_WINDOW.to;
}

/** Ordena as ofertas pela regra do modo. Não muda a lista de entrada. */
export function rankFlights(list: SelectedFlight[], mode: RankMode = 'kinu'): SelectedFlight[] {
  const minPrice = { direct: Infinity, stops: Infinity };
  for (const f of list) {
    const k = f.option.isDirect ? 'direct' : 'stops';
    minPrice[k] = Math.min(minPrice[k], f.option.price);
  }
  const bandPrice = (f: SelectedFlight) => {
    const min = minPrice[f.option.isDirect ? 'direct' : 'stops'];
    return f.option.price <= min * (1 + PRICE_TIE_PCT) ? min : f.option.price;
  };
  const byDirect = (a: SelectedFlight, b: SelectedFlight) => Number(b.option.isDirect) - Number(a.option.isDirect);
  const byBand = (a: SelectedFlight, b: SelectedFlight) => bandPrice(a) - bandPrice(b);
  const byWindow = (a: SelectedFlight, b: SelectedFlight) => Number(arrivesInWindow(b)) - Number(arrivesInWindow(a));
  const byDuration = (a: SelectedFlight, b: SelectedFlight) => a.option.durationMinutes - b.option.durationMinutes;
  const order = mode === 'kinu'
    ? [byDirect, byBand, byWindow, byDuration]
    : [byDirect, byDuration, byBand, byWindow];
  return [...list].sort((a, b) => {
    for (const cmp of order) {
      const r = cmp(a, b);
      if (r !== 0) return r;
    }
    return a.option.price - b.option.price || a.option.id.localeCompare(b.option.id);
  });
}

/** Média de preço das ofertas (0 sem ofertas). */
export function averagePrice(list: SelectedFlight[]): number {
  if (!list.length) return 0;
  return Math.round(list.reduce((s, f) => s + f.option.price, 0) / list.length);
}

/** A melhor oferta pelo ranking, marcada como escolha do KINU (null sem ofertas). */
export function pickBest(list: SelectedFlight[], mode: RankMode = 'kinu'): SelectedFlight | null {
  const best = rankFlights(list, mode)[0];
  if (!best) return null;
  return { ...best, chosenBy: 'kinu', kinuPick: { averagePrice: averagePrice(list), offers: list.length, mode } };
}

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

/** "direto, R$ 420 abaixo da média, chega 11:25" — o porquê da escolha, sem enfeite. */
export function explainPick(f: SelectedFlight): string {
  const parts: string[] = [f.option.isDirect ? 'direto' : 'com escala'];
  const avg = f.kinuPick?.averagePrice;
  if (avg && (f.kinuPick?.offers ?? 0) > 1) {
    const d = Math.round(avg - f.option.price);
    parts.push(d > 0 ? `${brl(d)} abaixo da média` : d < 0 ? `${brl(-d)} acima da média` : 'na média de preço');
  }
  if (f.tzKnown === false) parts.push('chegada a confirmar');
  else {
    const n = flightDaysLater(f);
    parts.push(`chega ${f.option.arrivalTime}${n > 0 ? ` (+${n})` : ''}`);
  }
  return parts.join(', ');
}

// ─── Busca ao abrir o rascunho (D2) ───

/** Resultado da busca de referência gravado na viagem (`trip.kinuFlightSearch`): não repete a chamada. */
export interface KinuFlightSearch {
  /** origem-destino-ida-volta: datas ou aeroportos mudaram → busca de novo. */
  key: string;
  searchedAt: string;
  outbound: SelectedFlight[];
  return: SelectedFlight[];
  /** true = achou, mas não aplicou porque o roteiro tem troca manual (D3). */
  pending?: boolean;
}

export function flightSearchKey(originCode: string, destinationCode: string, startDate: string, endDate: string): string {
  return `${originCode}-${destinationCode}-${String(startDate).slice(0, 10)}-${String(endDate).slice(0, 10)}`;
}

/**
 * Busca automática só em rascunho, só com voo estimado que o usuário não escolheu, e só
 * se não houver busca gravada para a mesma chave.
 */
export function shouldAutoSearch(
  trip: { status?: string; outboundFlight?: SelectedFlight; kinuFlightSearch?: KinuFlightSearch },
  key: string,
): boolean {
  if (trip.status && trip.status !== 'draft') return false;
  const out = trip.outboundFlight;
  if (out && (out.source !== 'estimate' || out.chosenBy === 'user')) return false;
  return trip.kinuFlightSearch?.key !== key;
}
