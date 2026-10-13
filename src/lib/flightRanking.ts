// flightRanking — a regra escrita de como o KINU escolhe um voo entre ofertas de referência.
// Puro e determinístico (mesma lista → mesma ordem), testado em src/test/flightRanking.test.ts.
//
// Modo 'kinu' (padrão, chip "Menor preço"):
//   0. só competem as ofertas que chegam entre ARRIVAL_WINDOW.from e .to (06:00–22:00) e, em rota
//      doméstica, no mesmo dia; as outras vão para o fim da lista (seguem escolhíveis pelo usuário).
//      Se nenhuma couber, todas competem;
//   1. direto antes de com escala;
//   2. menor preço — preços a até PRICE_TIE_PCT do menor (do mesmo grupo direto/escala)
//      contam como empate;
//   3. chegada local na janela antes de fora dela;
//   4. menor duração.
// Modo 'fastest' (chip "Mais rápido"): direto > menor duração > menor preço (mesma faixa) > janela.
// Desempate final: preço exato, depois id — nunca a ordem de chegada da API.
import type { SelectedFlight } from '@/lib/itineraryEngine';
import { flightDaysLater } from '@/lib/flightModel';
import { airportCity } from '@/lib/timezone';

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

/** Pode ser sugestão do KINU: chega na janela e, em rota doméstica, no mesmo dia. */
export function eligibleForKinu(f: SelectedFlight): boolean {
  return arrivesInWindow(f) && !(f.international === false && flightDaysLater(f) > 0);
}

/** Rótulo da oferta que não concorre à sugestão: "fora da janela · chega 03:00 (+1)" (null se concorre). */
export function outsideWindowLabel(f: SelectedFlight): string | null {
  if (f.tzKnown === false || eligibleForKinu(f)) return null;
  const n = flightDaysLater(f);
  return `fora da janela · chega ${f.option.arrivalTime}${n > 0 ? ` (+${n})` : ''}`;
}

/** Ordena as ofertas pela regra do modo. Não muda a lista de entrada. */
export function rankFlights(list: SelectedFlight[], mode: RankMode = 'kinu'): SelectedFlight[] {
  // Modo kinu: a faixa de preço é medida dentro do grupo que concorre (elegíveis × excluídas).
  const groupOf = (f: SelectedFlight) =>
    `${mode === 'kinu' && eligibleForKinu(f) ? 'in' : 'out'}-${f.option.isDirect ? 'direct' : 'stops'}`;
  const minPrice: Record<string, number> = {};
  for (const f of list) {
    const k = groupOf(f);
    minPrice[k] = Math.min(minPrice[k] ?? Infinity, f.option.price);
  }
  const bandPrice = (f: SelectedFlight) => {
    const min = minPrice[groupOf(f)];
    return f.option.price <= min * (1 + PRICE_TIE_PCT) ? min : f.option.price;
  };
  const byEligible = (a: SelectedFlight, b: SelectedFlight) => Number(eligibleForKinu(b)) - Number(eligibleForKinu(a));
  const byDirect = (a: SelectedFlight, b: SelectedFlight) => Number(b.option.isDirect) - Number(a.option.isDirect);
  const byBand = (a: SelectedFlight, b: SelectedFlight) => bandPrice(a) - bandPrice(b);
  const byWindow = (a: SelectedFlight, b: SelectedFlight) => Number(arrivesInWindow(b)) - Number(arrivesInWindow(a));
  const byDuration = (a: SelectedFlight, b: SelectedFlight) => a.option.durationMinutes - b.option.durationMinutes;
  const order = mode === 'kinu'
    ? [byEligible, byDirect, byBand, byWindow, byDuration]
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

/** O porquê gravado com a escolha (além de média/ofertas/modo do tipo). */
type KinuPickWhy = NonNullable<SelectedFlight['kinuPick']> & {
  /** Preço na faixa do menor entre as que concorreram (false = direto mais caro que uma com escala). */
  cheapest?: boolean;
  /** Nenhuma oferta chegava na janela: a escolhida é a melhor de fora. */
  windowFallback?: boolean;
};

/** A melhor oferta pelo ranking, marcada como escolha do KINU (null sem ofertas). */
export function pickBest(list: SelectedFlight[], mode: RankMode = 'kinu'): SelectedFlight | null {
  const best = rankFlights(list, mode)[0];
  if (!best) return null;
  const anyEligible = list.some(eligibleForKinu);
  const competing = mode === 'kinu' && anyEligible ? list.filter(eligibleForKinu) : list;
  const min = Math.min(...competing.map((f) => f.option.price));
  const why: KinuPickWhy = {
    averagePrice: averagePrice(list), offers: list.length, mode,
    cheapest: best.option.price <= min * (1 + PRICE_TIE_PCT),
    ...(mode === 'kinu' && !anyEligible && best.tzKnown !== false ? { windowFallback: true } : {}),
  };
  return { ...best, chosenBy: 'kinu', kinuPick: why };
}

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

function arrivalText(f: SelectedFlight): string {
  if (f.tzKnown === false) return 'chegada a confirmar';
  const n = flightDaysLater(f);
  return `chega ${f.option.arrivalTime}${n > 0 ? ` (+${n})` : ''}`;
}

/** Razão e ressalvas da escolha do KINU: "menor preço", "· R$ 45 acima da média" (nunca abaixo), fora da janela. */
function pickReasons(f: SelectedFlight): string[] {
  const why = f.kinuPick as KinuPickWhy | undefined;
  if (!why) return [];
  const out: string[] = [];
  if (why.mode === 'fastest') out.push('mais rápido');
  else if (why.cheapest === true) out.push('menor preço');
  else if (why.cheapest === false) out.push(f.option.isDirect ? 'menor preço entre os diretos' : 'menor preço na janela');
  const avg = why.averagePrice;
  // Só a ressalva: abaixo da média já está dito em "menor preço".
  if (avg && why.offers > 1 && (f.option.price - avg) / avg > PRICE_TIE_PCT) {
    out.push(`${brl(Math.round(f.option.price - avg))} acima da média`);
  }
  if (why.windowFallback) out.push(`nenhuma opção chega entre ${String(ARRIVAL_WINDOW.from).padStart(2, '0')}h e ${ARRIVAL_WINDOW.to}h`);
  return out;
}

/** "direto · chega 11:12 · menor preço" — o porquê da escolha, sem enfeite; ressalvas no fim. */
export function explainPick(f: SelectedFlight): string {
  return [f.option.isDirect ? 'direto' : 'com escala', arrivalText(f), ...pickReasons(f)].join(' · ');
}

/**
 * A linha do voo escolhido, mesma função para os dois sujeitos:
 * "KINU escolheu: Azul · direto · chega 11:12 · R$ 636/pessoa · menor preço" /
 * "Você escolheu: Azul · direto · chega 21:05 · R$ 676/pessoa".
 */
export function flightChoiceLine(f: SelectedFlight): string {
  const subject = f.chosenBy === 'user' ? 'Você' : 'KINU';
  const parts = [
    f.option.airline,
    f.option.isDirect ? 'direto' : 'com escala',
    arrivalText(f),
    `${brl(f.option.price)}/pessoa`,
    ...(f.chosenBy === 'user' ? [] : pickReasons(f)),
  ];
  return `${subject} escolheu: ${parts.join(' · ')}`;
}

/**
 * O porquê do voo no item do roteiro: a linha da escolha sem sujeito e sem cia —
 * "com escala · chega 23:35 · R$ 718/pessoa" (+ razões do KINU).
 */
export function flightWhyLine(f: SelectedFlight): string {
  return [
    f.option.isDirect ? 'direto' : 'com escala',
    arrivalText(f),
    `${brl(f.option.price)}/pessoa`,
    ...(f.chosenBy === 'user' ? [] : pickReasons(f)),
    ...(f.durationKnown === false ? ['duração a confirmar'] : []),
  ].join(' · ');
}

/** "SAO → (1 conex.) → FOR" → "São Paulo → Fortaleza · 1 conexão" (código cru se não mapeado). */
export function flightRouteLabel(option: { route: string; isDirect: boolean }): string {
  const ends = option.route.split('→').map((p) => p.trim()).filter((p) => p && !p.startsWith('('));
  const name = (code: string) => airportCity(code)?.city ?? code;
  const path = ends.length >= 2 ? `${name(ends[0])} → ${name(ends[ends.length - 1])}` : option.route;
  if (option.isDirect) return path;
  const n = Number(option.route.match(/\((\d+)\s*conex/)?.[1]);
  return `${path} · ${n > 1 ? `${n} conexões` : n === 1 ? '1 conexão' : 'com conexão'}`;
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
 * Busca automática só em rascunho, só com voo estimado e nenhuma perna `chosenBy:'user'`, e só
 * se não houver busca gravada para a mesma chave (reabrir o painel nunca busca de novo).
 */
export function shouldAutoSearch(
  trip: { status?: string; outboundFlight?: SelectedFlight; returnFlight?: SelectedFlight; kinuFlightSearch?: KinuFlightSearch },
  key: string,
): boolean {
  if (trip.status && trip.status !== 'draft') return false;
  if (trip.returnFlight?.chosenBy === 'user') return false;
  const out = trip.outboundFlight;
  if (out && (out.source !== 'estimate' || out.chosenBy === 'user')) return false;
  return trip.kinuFlightSearch?.key !== key;
}
