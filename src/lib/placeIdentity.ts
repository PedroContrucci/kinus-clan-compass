/**
 * Identidade de lugar para a regra de não-repetição do gerador.
 *
 * O catálogo tem, por desenho legítimo, a mesma casa real cadastrada como ids
 * distintos em categorias distintas — `for-cabana-del-primo` (lunch) e
 * `for-rest-cabana-del-primo` (dinner) são o mesmo restaurante. Uma regra de
 * unicidade por id não enxerga isso e escala a casa duas vezes na mesma viagem.
 * A unicidade real é por NOME NORMALIZADO, atravessando categorias e dias.
 */

/**
 * Normaliza o nome de um lugar para comparação de identidade.
 *
 * Deliberadamente NÃO remove conteúdo entre parênteses: medido contra o
 * catálogo inteiro, isso não colapsa nenhum par a mais do que a normalização
 * base, e arriscaria fundir casas reais distintas da mesma rede — hoje
 * `Coco Bambu Beira-Mar` × `Coco Bambu (Varjota)`, que devem coexistir.
 */
export function normalizePlaceName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // prefixo de refeição que a UI acrescenta ao gravar a atividade no dia
    .replace(/^(cafe|almoco|jantar):\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rastreia quais lugares já entraram na viagem, quando e quantas vezes. */
export interface PlaceUsageTracker {
  /** O nome já entrou na viagem, em qualquer categoria? */
  isUsed(name: string): boolean;
  /** Índice do dia em que o nome entrou pela última vez. */
  lastDayOf(name: string): number | undefined;
  /** Quantas vezes o nome já entrou na viagem. */
  countOf(name: string): number;
  /**
   * Dias decorridos desde o último uso. `Infinity` quando inédito — deixa as
   * comparações de espaçamento tratarem "nunca usado" como o melhor caso.
   */
  gapSince(name: string, dayIndex: number): number;
  /** Registra o uso do nome no dia informado. */
  mark(name: string, dayIndex: number): void;
}

export function createPlaceUsageTracker(): PlaceUsageTracker {
  const lastDay = new Map<string, number>();
  const uses = new Map<string, number>();
  return {
    isUsed: (name) => lastDay.has(normalizePlaceName(name)),
    lastDayOf: (name) => lastDay.get(normalizePlaceName(name)),
    countOf: (name) => uses.get(normalizePlaceName(name)) ?? 0,
    gapSince: (name, dayIndex) => {
      const last = lastDay.get(normalizePlaceName(name));
      return last === undefined ? Infinity : dayIndex - last;
    },
    mark: (name, dayIndex) => {
      const key = normalizePlaceName(name);
      lastDay.set(key, dayIndex);
      uses.set(key, (uses.get(key) ?? 0) + 1);
    },
  };
}

/**
 * Espaçamentos tentados, em ordem, quando o pool de uma categoria de refeição
 * esgota sem candidato inédito. Repetir é o último recurso — um dia sem jantar
 * é pior que um jantar repetido —, mas repete-se o mais antigo possível.
 */
export const REUSE_GAP_CASCADE = [3, 2, 0] as const;

/**
 * Escolhe candidatos para reuso quando não há nome inédito, aplicando a cascata
 * de espaçamento.
 *
 * Ordena por número de usos primeiro e só então pelo tempo desde o último uso.
 * Espalhar as repetições importa: com 7 almoços e 6 restaurantes no pool, uma
 * repetição é aritmeticamente inevitável — mas nada obriga a concentrá-la na
 * mesma casa, que é como o Cabaña del Primo chegou a três aparições.
 */
export function pickReusableByGap<T extends { name: string }>(
  candidates: T[],
  tracker: PlaceUsageTracker,
  dayIndex: number
): T[] {
  for (const minGap of REUSE_GAP_CASCADE) {
    const viable = candidates.filter((c) => tracker.gapSince(c.name, dayIndex) >= minGap);
    if (viable.length > 0) {
      return [...viable].sort(
        (a, b) =>
          tracker.countOf(a.name) - tracker.countOf(b.name) ||
          tracker.gapSince(b.name, dayIndex) - tracker.gapSince(a.name, dayIndex)
      );
    }
  }
  return [];
}
