// Onboarding v2 — helpers puros do fluxo de primeira viagem (grade → 3 campos → rascunho).
// Só LÊ dados curados; nada aqui escreve em src/data.

import { addDays, addMonths, differenceInDays, format, isValid, parseISO, startOfMonth } from 'date-fns';
import { LANDMARKS } from '@/data/generated/landmarkTiers';
import { findCityInfo } from '@/data/destinationCatalog';
import { BUDGET_TIERS } from '@/components/wizard/types';
import { calculateTripEstimate } from '@/lib/activityPricing';
import { rankHotelsForTrip, type SwapTripLike } from '@/lib/hotelSwap';
import { catalogIdOf } from '@/lib/localAchievements';
import { planBreakdown, reserveFor, RESERVE_RATE } from '@/lib/planTotals';
import type { DraftTripInput } from '@/lib/createTrip';
import { interestLabel, splitInterests } from '@/lib/interestsFor';
import { explainPick } from '@/lib/flightRanking';

export const DEFAULT_ORIGIN = 'São Paulo';
export type OriginSource = 'profile' | 'default';

export const FLOW_TIERS = [
  { id: 'economic', label: 'Econômico' },
  { id: 'comfort', label: 'Conforto' },
  { id: 'luxury', label: 'Alto padrão' },
] as const;
export type FlowTierId = (typeof FLOW_TIERS)[number]['id'];

/** O item `icon` da cidade (exatamente um por cidade no gerado). */
export function iconIdOf(city: string): string | null {
  const tiers = LANDMARKS[city]?.tiers ?? {};
  return Object.keys(tiers).find((id) => tiers[id] === 'icon') ?? null;
}

const COUNTRY_FALLBACK: Record<string, string> = { 'Porto Seguro': 'Brasil' };

export function countryOf(city: string): string {
  // Cidade curada fora do catálogo de destinos (ex.: Porto Seguro) cai num mapa local mínimo.
  return findCityInfo(city)?.country.country ?? COUNTRY_FALLBACK[city] ?? '';
}

/** Próximo mês, 5 noites. */
export function defaultDates(now = new Date()): { from: Date; to: Date } {
  const from = addDays(startOfMonth(addMonths(now, 1)), 9);
  return { from, to: addDays(from, 5) };
}

export function resolveOrigin(homeCity: unknown): { city: string; source: OriginSource } {
  const c = typeof homeCity === 'string' ? homeCity.trim() : '';
  return c ? { city: c, source: 'profile' } : { city: DEFAULT_ORIGIN, source: 'default' };
}

/** Mesma conta do passo de orçamento do assistente (calculateTripEstimate × multiplicador do tier). */
export function estimateBudget(city: string, tierId: string, travelers: number, nights: number): number {
  const tier = BUDGET_TIERS.find((t) => t.id === tierId) ?? BUDGET_TIERS[2];
  const est = calculateTripEstimate(city, nights + 1, Math.max(1, travelers), tier.priceLevel);
  return Math.round(est.total * tier.multiplier);
}

export function buildFlowInput(p: {
  city: string; origin: string; from: Date; to: Date; adults: number; children: number; tier: FlowTierId;
}): DraftTripInput {
  const info = findCityInfo(p.city);
  const nights = Math.max(1, differenceInDays(p.to, p.from));
  const travelers = p.adults + p.children;
  return {
    originCity: p.origin,
    originAirportCode: p.origin === DEFAULT_ORIGIN ? 'GRU' : undefined,
    destinationCity: p.city,
    destinationAirportCode: info?.city.airports[0],
    selectedCountry: info?.country.country,
    departureDate: p.from,
    returnDate: p.to,
    adults: p.adults,
    children: Array.from({ length: p.children }, () => ({ age: 8 })),
    infants: 0,
    budgetTier: p.tier,
    travelStyle: p.tier,
    budgetAmount: estimateBudget(p.city, p.tier, travelers, nights),
    travelInterests: [],
    priorities: [],
  };
}

export function tierLabel(id: unknown): string {
  return FLOW_TIERS.find((t) => t.id === id)?.label ?? BUDGET_TIERS.find((t) => t.id === id)?.label ?? String(id ?? '');
}

export interface KinuDidLines {
  origin: string;
  hotel: string;
  flight: string;
  itinerary: string;
  budget: string;
  /** Detalhe do custo: voo · hotel · alimentação · passeios (+ reserva). */
  budgetDetail: string;
}

/** As linhas do card "O que o KINU fez", todas derivadas da viagem. */
export function kinuDidLines(trip: any): KinuDidLines {
  const assumed = trip.originSource === 'default';
  const origin = `Saindo de ${trip.origin || DEFAULT_ORIGIN}${assumed ? ' (assumido)' : ''}`;

  const ranked = rankHotelsForTrip(trip.destination, trip as SwapTripLike);
  const cur = ranked.find((r) => r.isCurrent);
  const hotelName = trip.accommodation?.name ?? 'Hotel';
  const hotel = cur && cur.reasons.length
    ? `${hotelName}: ${cur.reasons.map((r) => r.label).join(' · ')}`
    : `${hotelName}: melhor opção disponível para o seu perfil`;

  const ddmm = (v: unknown) => {
    const d = parseISO(String(v ?? '').slice(0, 10));
    return isValid(d) ? format(d, 'dd/MM') : '—';
  };
  const realFlight = Boolean(trip.outboundFlight && trip.outboundFlight.source !== 'estimate');
  const out = trip.outboundFlight;
  const flight = out?.chosenBy === 'kinu' && out.kinuPick
    ? `KINU escolheu: ${explainPick(out)} · trocar`
    : realFlight
      ? `Voo escolhido · ida ${ddmm(trip.startDate)} · volta ${ddmm(trip.endDate)}`
      : `Voo estimado · ida ${ddmm(trip.startDate)} · volta ${ddmm(trip.endDate)} · ${flightPriceLabel(trip)}`;

  const days: any[] = Array.isArray(trip.days) ? trip.days : [];
  const cityTiers = LANDMARKS[trip.destination]?.tiers;
  const ids = new Set<string>();
  for (const d of days) for (const a of d.activities ?? []) {
    const id = catalogIdOf(a?.id);
    if (/^day-\d+-/.test(String(a?.id ?? '')) && id && (!cityTiers || id.includes('-'))) ids.add(id);
  }
  const base = `${days.length} dias com ${ids.size} atividades do catálogo`;
  const { used, ignored } = splitInterests(trip.destination, trip.travelInterests);
  const itinerary = ignored.length
    ? `${base} · montei ${used.length ? `por ${used.map(interestLabel).join(', ')}` : 'pelo catálogo da cidade'} — ${ignored.map(interestLabel).join(', ')} ${ignored.length === 1 ? 'não tem' : 'não têm'} catálogo em ${trip.destination}`
    : base;

  const travelers = Number(trip.travelers) || 1;
  const nights = trip.startDate && trip.endDate
    ? Math.max(1, differenceInDays(new Date(trip.endDate), new Date(trip.startDate)))
    : Math.max(1, days.length - 1);
  const amount = Number(trip.budget) || 0;
  const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  const plan = planBreakdown(trip);
  const budget = `${brl(amount)} — estimativa para ${travelers} ${travelers === 1 ? 'pessoa' : 'pessoas'}, ${nights} noites, perfil ${tierLabel(trip.budgetType)}${realFlight ? '' : ' · fecha ao escolher o voo'}`;
  const reserve = Math.max(0, amount - plan.total);
  const budgetDetail = `Custo estimado ${brl(plan.total)}: voo ${brl(plan.flights)}${realFlight ? '' : ` (${trip.outboundFlight?.priceSource === 'route' ? 'estimativa por rota' : 'estimativa genérica'})`} · hotel ${brl(plan.hotel)} · alimentação ${brl(plan.food)} · passeios ${brl(plan.tours)}`
    + (reserve > 0 && reserve === reserveFor(plan.total) ? ` · inclui reserva de ${Math.round(RESERVE_RATE * 100)}% (${brl(reserve)})` : '');
  return { origin, hotel, flight, itinerary, budget, budgetDetail };
}

/** Rótulo do preço do voo estimado: por rota (tabela) ou genérico (perfil). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flightPriceLabel(trip: any): string {
  return trip?.outboundFlight?.priceSource === 'route'
    ? 'estimativa por rota'
    : 'estimativa genérica · cotação real na etapa Voo';
}
