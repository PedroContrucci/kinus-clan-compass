// destinationPicker — C.10: seletor continente → país → cidade e o "planejar" do KINU AI.
// Puro: só LÊ o DESTINATION_CATALOG (filtrado por hasCatalog) + as curadas que faltam nele.

import { DESTINATION_CATALOG, REGIONS, type RegionName } from '@/data/destinationCatalog';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { hasCatalog, interestsFor } from '@/lib/interestsFor';
import { TRAVEL_INTERESTS } from '@/components/wizard/types';
import { buildFlowInput, countryOf, resolveOrigin, type FlowTierId, type OriginSource } from '@/lib/onboardingFlow';
import type { DraftTripInput } from '@/lib/createTrip';

export interface PickerCity { name: string; curated: boolean }
export interface PickerCountry { country: string; flag: string; cities: PickerCity[] }
export interface PickerHit extends PickerCity { country: string; flag: string; region: RegionName }

const isCurated = (c: string) => CURATED_CITIES.includes(c);
export const normText = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Curadas fora do catálogo de destinos (hoje só Porto Seguro) entram no país delas, na região Brasil. */
const EXTRA = CURATED_CITIES.filter(
  (c) => !Object.values(DESTINATION_CATALOG).some((cs) => cs.some((x) => x.cities.some((y) => y.name === c))),
);

let cache: Record<RegionName, PickerCountry[]> | null = null;
function tree(): Record<RegionName, PickerCountry[]> {
  if (cache) return cache;
  const out = {} as Record<RegionName, PickerCountry[]>;
  for (const r of REGIONS) {
    out[r.id] = DESTINATION_CATALOG[r.id]
      .map((c) => {
        const names = c.cities.map((x) => x.name);
        for (const e of EXTRA) if (r.id === 'Brasil' && countryOf(e) === c.country && !names.includes(e)) names.push(e);
        const cities = names
          .filter(hasCatalog)
          .map((name) => ({ name, curated: isCurated(name) }))
          .sort((a, b) => Number(b.curated) - Number(a.curated));
        return { country: c.country, flag: c.flag, cities };
      })
      .filter((c) => c.cities.length > 0);
  }
  return (cache = out);
}

export function pickerRegions(): { id: RegionName; emoji: string; count: number }[] {
  const t = tree();
  return REGIONS.map((r) => ({ ...r, count: t[r.id].reduce((s, c) => s + c.cities.length, 0) })).filter((r) => r.count > 0);
}

export function pickerCountries(region: RegionName): PickerCountry[] {
  return tree()[region] ?? [];
}

export function pickerCities(region: RegionName, country: string): PickerCity[] {
  return pickerCountries(region).find((c) => c.country === country)?.cities ?? [];
}

function allHits(): PickerHit[] {
  const t = tree();
  return REGIONS.flatMap((r) => t[r.id].flatMap((c) => c.cities.map((x) => ({ ...x, country: c.country, flag: c.flag, region: r.id }))));
}

/** Busca por cidade ou país, sem acento. Vazio → []. */
export function searchDestinations(q: string): PickerHit[] {
  const n = normText(q);
  if (!n) return [];
  return allHits().filter((h) => normText(h.name).includes(n) || normText(h.country).includes(n));
}

/** Para o agente: as cidades curadas mais próximas de um pedido fora da lista (mesmo país → mesma região → curadas). */
export function nearestCatalogCities(asked: string, n = 3): string[] {
  const a = normText(asked);
  const hit = allHits().find((h) => normText(h.name) === a);
  const curated = allHits().filter((h) => h.curated);
  const out: string[] = [];
  const push = (xs: PickerHit[]) => { for (const x of xs) if (out.length < n && !out.includes(x.name)) out.push(x.name); };
  if (hit) {
    push(curated.filter((h) => h.country === hit.country));
    push(curated.filter((h) => h.region === hit.region));
  }
  push(curated);
  return out;
}

/** O destino que o agente pediu, se for uma das cidades que o agente conhece (as curadas). */
export function agentCity(destino: string): string | null {
  const n = normText(destino);
  return CURATED_CITIES.find((c) => normText(c) === n) ?? null;
}

export interface AgentPlanParams {
  destino: string; data_ida: string; data_volta: string; viajantes: number;
  estilo?: string; interesses?: string[]; prioridades?: string[]; orcamento_total?: number;
}

/** criar_viagem → o MESMO DraftTripInput do fluxo curto (buildFlowInput). null = dados incompletos. */
export function planFromAgent(
  p: AgentPlanParams, homeCity: unknown,
): { input: DraftTripInput; cap: number; origin: { city: string; source: OriginSource } } | null {
  const city = agentCity(String(p.destino ?? ''));
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const adults = Math.floor(Number(p.viajantes));
  if (!city || !dateRe.test(String(p.data_ida)) || !dateRe.test(String(p.data_volta)) || !Number.isFinite(adults) || adults < 1) return null;
  const day = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const estilo = normText(String(p.estilo ?? ''));
  const tier: FlowTierId = estilo.includes('econom') ? 'economic'
    : /premium|luxo|luxury|alto padrao/.test(estilo) ? 'luxury' : 'comfort';
  const offered = new Set(interestsFor(city).map((c) => c.id));
  const asked = [...(p.interesses ?? []), ...(p.prioridades ?? [])].map((s) => normText(String(s))).filter(Boolean);
  const interests = TRAVEL_INTERESTS
    .filter((i) => asked.some((a) => { const id = normText(i.id), lb = normText(i.label); return a.includes(id) || id.includes(a) || a.includes(lb) || lb.includes(a); }))
    .map((i) => i.id as string)
    .filter((id) => offered.has(id));
  const capRaw = Number(p.orcamento_total);
  const cap = Number.isFinite(capRaw) && capRaw > 0 ? Math.round(capRaw) : 0;
  const origin = resolveOrigin(homeCity);
  const input = buildFlowInput({ city, origin: origin.city, from: day(p.data_ida), to: day(p.data_volta), adults, children: 0, tier, interests, cap });
  return { input, cap, origin };
}
