// hotelSwap — trocar o hotel de uma viagem pelos curados da cidade.
//
// Os 68 hotéis de src/data/curatedHotels.ts existiam com zona, tier, persona e faixa
// de preço, e o usuário não via nenhum deles: o hotel da viagem era escolhido pelo
// algoritmo e não tinha porta de saída. É a segunda maior decisão de uma viagem em
// família.
//
// ATENÇÃO ao ler este arquivo: viagens ANTIGAS quase nunca têm um hotel curado. Elas
// nasceram do getHotelRecommendation (hotelZones.ts), que lê HOTEL_RECOMMENDATIONS —
// outra base, escrita à mão, 107 hotéis em 32 cidades; medido, 7 de 84 escolhas dela
// aparecem na lista curada. Por isso a UI mostra o atual numa seção própria, rotulado
// como fora da curadoria, em vez de fingir que ele é um dos nossos.
//
// Viagens NOVAS já nascem curadas quando a cidade tem o tier: `buildDraftTrip` usa o
// `pickCuratedHotelForTrip` daqui (33 das 84 células cidade×tier). As outras seguem
// no HOTEL_RECOMMENDATIONS — ver o comentário do ACCEPTED_TIERS para o porquê.
import { curatedHotels, type CuratedHotel } from '@/data/curatedHotels';
import { getIdealHotelZone } from '@/lib/hotelZones';

/** Hospedagem como ela realmente trafega: HotelCard mais os campos gravados por fora
 *  do tipo (mealPlan já era assim — recon §4.6), agora com a proveniência do curado. */
export interface AccommodationLike {
  id?: string;
  name?: string;
  neighborhood?: string;
  description?: string;
  stars?: number;
  checkIn?: string;
  checkOut?: string;
  nightlyRate?: number;
  totalNights?: number;
  totalPrice?: number;
  status?: string;
  mealPlan?: string;
  curatedHotelId?: string;
}

export interface FinanceBucketLike {
  planned?: number;
  confirmed?: number;
  bidding?: number;
}

export interface TripFinancesLike {
  total?: number;
  planned?: number;
  confirmed?: number;
  bidding?: number;
  available?: number;
  categories?: Record<string, FinanceBucketLike>;
}

/** O mínimo que a troca de hotel precisa saber sobre a viagem. SavedTrip e StoredTrip
 *  satisfazem por estrutura — nenhum cast necessário em quem chama. */
export interface SwapTripLike {
  destination?: string;
  budgetTier?: string;
  budgetType?: string;
  travelers?: number;
  travelInterests?: string[];
  budget?: number;
  accommodation?: AccommodationLike;
  finances?: TripFinancesLike;
}

export interface ParsedPriceRange {
  min: number;
  max: number;
  /** Ponto médio — é o que vira nightlyRate. A UI mostra a faixa inteira junto. */
  mid: number;
}

export interface RankedHotel {
  hotel: CuratedHotel;
  price: ParsedPriceRange | null;
  score: number;
  /** É o hotel que a viagem já tem? Verdadeiro em ~8% dos casos (ver cabeçalho). */
  isCurrent: boolean;
}

/** Impacto de uma troca no orçamento planejado, para a UI mostrar antes de aplicar. */
export interface SwapImpact {
  currentTotal: number;
  nextTotal: number;
  delta: number;
  nights: number;
}

/**
 * "R$ 2.500-4.500" -> { min: 2500, max: 4500, mid: 3500 }.
 *
 * Os 68 hotéis de hoje casam este formato sem exceção (conferido: 41 em
 * `R$ #.###-#.###`, 19 em `R$ ###-#.###`, 5 em `R$ ###-###`, 2 em `R$ ##-###`,
 * 1 em `R$ #.###-##.###`). O null existe para o dia em que o sync-hotels mudar o
 * formato: o hotel continua listável, só entra sem número.
 */
export function parsePriceRangeBRL(input: string | undefined | null): ParsedPriceRange | null {
  if (typeof input !== 'string') return null;
  const m = input.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!m) return null;

  const toNumber = (s: string) => {
    // pt-BR: o ponto é separador de milhar, não decimal.
    const n = Number(s.replace(/\./g, ''));
    return Number.isFinite(n) ? n : NaN;
  };

  const min = toNumber(m[1]);
  const max = toNumber(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return null;

  return { min, max, mid: Math.round((min + max) / 2) };
}

/** Tier do wizard -> tier da curadoria. */
const TIER_MAP: Record<string, string> = {
  backpacker: 'budget',
  economic: 'budget',
  economica: 'budget',
  comfort: 'mid',
  conforto: 'mid',
  premium: 'upscale',
  luxury: 'upscale',
  luxo: 'upscale',
};

/** Estrelas por tier. A curadoria não tem `stars` — só `rating`, e todos entre 4,5 e
 * 4,8, o que arredondaria tudo para 5. Isto é aproximação de EXIBIÇÃO, não dado. */
const TIER_STARS: Record<string, number> = { budget: 3, mid: 4, upscale: 5, resort: 5 };

export function tierOfTrip(trip: Pick<SwapTripLike, 'budgetTier' | 'budgetType'> | null | undefined): string {
  const raw = String(trip?.budgetTier ?? trip?.budgetType ?? 'comfort').toLowerCase();
  return TIER_MAP[raw] ?? 'mid';
}

/**
 * Persona da viagem a partir do que ela já tem — sem campo novo.
 * Não é ciência: é o mesmo eixo que a curadoria usa em personaTags.
 */
export function personaOfTrip(trip: Pick<SwapTripLike, 'travelers'> | null | undefined): 'family' | 'couple' | 'solo' {
  const n = Number(trip?.travelers ?? 2);
  if (n >= 3) return 'family';
  if (n <= 1) return 'solo';
  return 'couple';
}

/** Nome do hotel sem o sufixo " — Bairro, Cidade" que o gerador acrescenta. */
export function baseHotelName(name: string | undefined | null): string {
  return String(name ?? '').split('—')[0].trim();
}

function sameHotel(a: string | undefined | null, b: string | undefined | null): boolean {
  const norm = (s: string | undefined | null) =>
    baseHotelName(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const na = norm(a);
  return na.length > 0 && na === norm(b);
}

/** Hotéis curados da cidade. Array vazio quando a cidade não tem curadoria (5 das 21). */
export function getCuratedHotelsForCity(city: string | undefined | null): CuratedHotel[] {
  if (!city) return [];
  const direct = curatedHotels[city];
  if (direct?.length) return direct;

  // Tolerante a acento e caixa: 'toquio' encontra 'Tóquio'.
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const key = norm(city);
  for (const [k, v] of Object.entries(curatedHotels)) {
    if (norm(k) === key && v.length > 0) return v;
  }
  return [];
}

/**
 * Ordena os curados da cidade por afinidade com a viagem:
 * tier igual primeiro, depois persona, depois a zona ideal, rating no desempate.
 */
export function rankHotelsForTrip(
  city: string | undefined | null,
  trip: SwapTripLike | null | undefined,
): RankedHotel[] {
  const hotels = getCuratedHotelsForCity(city);
  if (hotels.length === 0) return [];

  const tier = tierOfTrip(trip);
  const persona = personaOfTrip(trip);
  const idealZone = city ? getIdealHotelZone(city, trip?.travelInterests ?? []) : null;
  const zoneName = idealZone?.neighborhood?.toLowerCase() ?? '';
  const currentName = trip?.accommodation?.name;

  return hotels
    .map((hotel) => {
      let score = 0;
      if (hotel.tier === tier) score += 100;
      // 'resort' atende quem pediu acima de budget, mas nunca ganha do tier exato.
      else if (hotel.tier === 'resort' && tier !== 'budget') score += 40;

      if (hotel.personaTags?.includes(persona)) score += 50;

      const hz = hotel.zone?.toLowerCase() ?? '';
      if (zoneName && hz && (hz.includes(zoneName) || zoneName.includes(hz))) score += 10;

      score += Number(hotel.rating) || 0;

      return {
        hotel,
        price: parsePriceRangeBRL(hotel.priceRangeBRL),
        score,
        isCurrent: sameHotel(hotel.name, currentName),
      };
    })
    .sort((a, b) => b.score - a.score || a.hotel.name.localeCompare(b.hotel.name));
}

/** Diária que a troca vai gravar: o meio da faixa, ou a atual se a faixa não parsear. */
export function nightlyRateFor(hotel: CuratedHotel, fallback: number): number {
  return parsePriceRangeBRL(hotel.priceRangeBRL)?.mid ?? Math.round(Number(fallback) || 0);
}

/**
 * Tiers que uma viagem aceita quando é o GERADOR que escolhe sozinho.
 *
 * `rankHotelsForTrip` foi escrita para LISTAR: o humano vê o preço e decide. Como
 * escolha automática ela é cega a tier quando a cidade não tem o tier exato — a
 * curadoria cobre `budget` em 4 das 16 cidades, `mid` em 9 — e o `[0]` cru entrega
 * Copacabana Palace a R$ 4.500/noite para quem escolheu Mochileiro (medido).
 *
 * `upscale` e `resort` são par porque no topo eles são pares de verdade, e a
 * ordenação já assume isso (`resort` vale +40 para quem pediu acima de budget).
 * Abaixo disso não há substituição: subir estoura o orçamento que a família
 * assumiu, descer rebaixa o tier que ela escolheu.
 */
const ACCEPTED_TIERS: Record<string, string[]> = {
  budget: ['budget'],
  mid: ['mid'],
  upscale: ['upscale', 'resort'],
  resort: ['resort', 'upscale'],
};

/**
 * O hotel que o gerador escolhe para uma viagem nova — ou `null` quando a curadoria
 * da cidade não cobre o tier.
 *
 * `null` é resposta legítima, não falha: quem chama volta para
 * `HOTEL_RECOMMENDATIONS`. É o mesmo padrão honesto das 5 cidades sem curadoria —
 * prefiro dizer que não tenho a inventar um upgrade que ninguém pediu. A porta de
 * saída continua sendo o modal, que mostra a curadoria inteira COM o preço.
 */
export function pickCuratedHotelForTrip(
  city: string | undefined | null,
  trip: SwapTripLike | null | undefined,
): CuratedHotel | null {
  const accepted = ACCEPTED_TIERS[tierOfTrip(trip)] ?? [];
  if (accepted.length === 0) return null;
  return rankHotelsForTrip(city, trip).find((r) => accepted.includes(r.hotel.tier))?.hotel ?? null;
}

/**
 * Hotel curado -> campos de hospedagem. Fonte de verdade única: a troca do usuário
 * (`applyHotelSwap`) e o gerador (`buildDraftTrip`) escrevem hospedagem do mesmo
 * jeito, então nunca divergem no nome, na zona, na tip ou na proveniência.
 *
 * `curatedHotelId` vai por fora do tipo, como `mealPlan` já ia (recon §4.6).
 */
export function curatedAccommodationFields(
  hotel: CuratedHotel,
  fallback?: { description?: string; stars?: number },
): Pick<AccommodationLike, 'name' | 'neighborhood' | 'description' | 'stars' | 'curatedHotelId'> {
  return {
    name: hotel.name,
    neighborhood: hotel.zone,
    description: hotel.tips?.[0] ?? fallback?.description ?? '',
    stars: TIER_STARS[hotel.tier] ?? (Number(fallback?.stars) || 4),
    curatedHotelId: hotel.id,
  };
}

/** O que a troca faz com o planejado — para o modal mostrar ANTES de aplicar. */
export function previewSwapImpact(
  trip: SwapTripLike | null | undefined,
  hotel: CuratedHotel,
): SwapImpact {
  const acc = trip?.accommodation;
  const nights = Math.max(1, Number(acc?.totalNights) || 1);
  const currentTotal = Math.round(Number(acc?.totalPrice) || 0);
  const nextTotal = Math.round(nightlyRateFor(hotel, Number(acc?.nightlyRate) || 0) * nights);
  return { currentTotal, nextTotal, delta: nextTotal - currentTotal, nights };
}

/**
 * Aplica a troca: substitui `accommodation` e recalcula as finanças.
 *
 * Imutável (devolve uma viagem nova) e IDEMPOTENTE no delta: trocar A->B->C deixa o
 * mesmo estado de A->C, porque o delta é sempre contra o totalPrice vigente e não
 * acumula. É o mesmo desenho de flightFinance.syncTripFlightPlannedFinances.
 *
 * Datas preservadas: a troca é de hotel, não de estadia. `status` volta a 'planned'
 * quando o hotel trocado estava confirmado — confirmar é sobre uma reserva concreta,
 * e ela deixou de existir.
 */
export function applyHotelSwap<T extends SwapTripLike>(trip: T, hotel: CuratedHotel): T {
  const acc: AccommodationLike = trip?.accommodation ?? {};
  const nights = Math.max(1, Number(acc.totalNights) || 1);
  const nightlyRate = nightlyRateFor(hotel, Number(acc.nightlyRate) || 0);
  const totalPrice = Math.round(nightlyRate * nights);
  const delta = totalPrice - Math.round(Number(acc.totalPrice) || 0);

  const accommodation: AccommodationLike = {
    ...acc,
    id: acc.id ?? 'hotel-main',
    // Nome, zona, tip, estrelas e proveniência saem do mesmo helper que o gerador
    // usa — é o que impede troca e criação de divergirem.
    ...curatedAccommodationFields(hotel, { description: acc.description, stars: acc.stars }),
    nightlyRate,
    totalNights: nights,
    totalPrice,
    status: 'planned',
  };

  const next: SwapTripLike = { ...trip, accommodation };

  const finances = trip?.finances;
  if (finances?.categories?.accommodation) {
    const planned = Math.max(0, Math.round(Number(finances.planned || 0) + delta));
    const total = Number(finances.total ?? trip.budget ?? 0);
    next.finances = {
      ...finances,
      planned,
      available: Math.max(
        0,
        Math.round(total - planned - Number(finances.bidding || 0) - Number(finances.confirmed || 0)),
      ),
      categories: {
        ...finances.categories,
        accommodation: {
          ...finances.categories.accommodation,
          planned: Math.max(0, Math.round(Number(finances.categories.accommodation.planned || 0) + delta)),
        },
      },
    };
  }

  return next as T;
}
