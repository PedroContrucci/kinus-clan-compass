// smokeMatrix — 21 cidades × 3 perfis, pelo mesmo caminho do "Montar minha viagem" (buildDraftTrip),
// validadas por R13–R16. Puro: sem React.
import { addDays, startOfDay } from 'date-fns';
import { buildDraftTrip, type DraftTripDeps } from '@/lib/createTrip';
import { buildFlowInput, type FlowTierId } from '@/lib/onboardingFlow';
import { interestsFor } from '@/lib/interestsFor';
import { findCityInfo } from '@/data/destinationCatalog';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { validatePlanRules, validateDaySequence, type PlanRuleResult, type PlanDay, type SequenceReport } from '@/lib/itineraryValidator';

export interface SmokeProfile { id: string; label: string; interests: string[]; tier: FlowTierId }
export const SMOKE_PROFILES: SmokeProfile[] = [
  { id: 'gastro-cultura', label: 'gastronomia+cultura · Conforto', interests: ['gastronomy', 'culture'], tier: 'comfort' },
  { id: 'praia-familia', label: 'praia+família · Econômico', interests: ['beach', 'family'], tier: 'economic' },
  { id: 'cultura-aventura', label: 'cultura+aventura · Alto padrão', interests: ['culture', 'adventure'], tier: 'luxury' },
];
export const SMOKE_NIGHTS = 7;

export interface SmokeRow { city: string; profile: string; interestsUsed: string[]; results: PlanRuleResult[]; r19?: SequenceReport; error?: string }

// Doméstico = destino no Brasil, por enquanto. O modelo de voo vai carregar uma flag explícita depois.
export const isDomesticDestination = (city: string) => findCityInfo(city)?.region === 'Brasil';

export interface SmokeOpts {
  /** Volta forçada (HH:mm) — a rodada de madrugada (SMOKE_RETURN=02:30). A página /smoke não passa. */
  returnDeparture?: string;
}

/** Embrulha o routeLookup para a rota devolver `typicalReturnDeparture` = a volta pedida. */
function withReturn(deps: DraftTripDeps, returnDeparture?: string): DraftTripDeps {
  if (!returnDeparture) return deps;
  return {
    ...deps,
    routeLookup: async (origin, destination) => {
      const base = deps.routeLookup ? await deps.routeLookup(origin, destination) : null;
      return { origin, destination, economyMin: 0, economyAvg: 0, economyMax: 0, businessAvg: 0, ...base, typicalReturnDeparture: returnDeparture };
    },
  };
}

export async function runSmokeCase(city: string, profile: SmokeProfile, from: Date, deps: DraftTripDeps = {}, opts: SmokeOpts = {}): Promise<SmokeRow> {
  const interestsUsed = profile.interests.filter((i) => interestsFor(city).some((c) => c.id === i));
  try {
    const input = buildFlowInput({ city, origin: 'São Paulo', from, to: addDays(from, SMOKE_NIGHTS), adults: 2, children: 0, tier: profile.tier });
    input.travelInterests = interestsUsed;
    input.priorities = interestsUsed;
    const trip = await buildDraftTrip(input, withReturn(deps, opts.returnDeparture));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = trip as any;
    const days = (t.days ?? []) as PlanDay[];
    const ctx = {
      destination: city,
      interests: interestsUsed,
      arrivalDate: String(t.flights?.outbound?.arrivalDate ?? '').slice(0, 10),
      arrivalTime: t.flights?.outbound?.arrivalTime,
      returnDepartureTime: t.flights?.return?.departureTime,
      domestic: isDomesticDestination(city),
    };
    const results = validatePlanRules(days, ctx);
    return { city, profile: profile.id, interestsUsed, results, r19: validateDaySequence(days, ctx) };
  } catch (e) {
    return { city, profile: profile.id, interestsUsed, results: [], error: String(e) };
  }
}

export async function runSmokeMatrix(deps: DraftTripDeps = {}, from = addDays(startOfDay(new Date()), 30), opts: SmokeOpts = {}): Promise<SmokeRow[]> {
  const rows: SmokeRow[] = [];
  for (const city of CURATED_CITIES) for (const p of SMOKE_PROFILES) rows.push(await runSmokeCase(city, p, from, deps, opts));
  return rows;
}

/** Linha de resumo: PASS/(PASS+WARN) por regra; SKIP reportado à parte. */
export function summarizeSmoke(rows: SmokeRow[]): string {
  const rules = ['R13 PRIORIDADE', 'R14 MICHELIN', 'R15 GEO', 'R16 TEMPO'];
  return rules.map((r) => {
    const all = rows.flatMap((x) => x.results.filter((y) => y.rule === r));
    const pass = all.filter((y) => y.status === 'PASS').length;
    const warn = all.filter((y) => y.status === 'WARN').length;
    const skip = all.filter((y) => y.status === 'SKIP').length;
    return `${r.split(' ')[0]} ${pass}/${pass + warn} PASS · ${warn} WARN · ${skip} SKIP`;
  }).join(' | ');
}

/** R19 em uma linha: dias PASS/WARN/FAIL somados e viagens com ao menos um dia FAIL. */
export function summarizeR19(rows: SmokeRow[]): string {
  const reps = rows.flatMap((r) => (r.r19 ? [r.r19] : []));
  const sum = (k: 'pass' | 'warn' | 'fail') => reps.reduce((s, r) => s + r[k], 0);
  const failTrips = reps.filter((r) => r.status === 'FAIL').length;
  return `R19 dias ${sum('pass')} PASS · ${sum('warn')} WARN · ${sum('fail')} FAIL · viagens com FAIL ${failTrips}/${reps.length}`;
}
