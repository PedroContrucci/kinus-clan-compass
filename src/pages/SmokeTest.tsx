import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { generateItinerary } from '@/components/cockpit/GeneratedItineraryStage';
import type { SelectedFlight, FlightOption } from '@/components/cockpit/FlightSelectionStage';
import { validateItinerary, validateOfferLinks, formatReport, type ValidationResult } from '@/lib/itineraryValidator';
import { buildOfferLinks } from '@/lib/offersLinks';
import type { PriceLevel } from '@/lib/activityPricing';
import { toast } from '@/hooks/use-toast';

interface TestConfig {
  label: string;
  origin: string;
  destination: string;
  originIata: string;
  destIata: string;
  days: number;
  travelers: number;
  budget: number;
  interests: string[];
  jetLagSeverity: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  outboundDeparture: string;
  outboundDuration: string;
  returnDeparture: string;
  returnDuration: string;
  priceLevel?: PriceLevel;
}

function parseDuration(s: string): number {
  const m = s.match(/(\d+)h(?:(\d+))?/);
  if (!m) return 60;
  return parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor((total % 1440) / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function buildFlight(
  origin: string,
  destination: string,
  date: Date,
  departureTime: string,
  durationStr: string,
  price: number
): SelectedFlight {
  const durationMinutes = parseDuration(durationStr);
  const [dh, dm] = departureTime.split(':').map(Number);
  const dep = new Date(date);
  dep.setHours(dh, dm, 0, 0);
  const arr = new Date(dep.getTime() + durationMinutes * 60 * 1000);
  const option: FlightOption = {
    id: `mock-${origin}-${destination}-${departureTime}`,
    airline: 'MockAir',
    route: `${origin} → ${destination}`,
    isDirect: true,
    duration: durationStr,
    durationMinutes,
    price,
    departureTime,
    arrivalTime: addMinutes(departureTime, durationMinutes),
    segments: [
      {
        departure: { iataCode: origin.slice(0, 3).toUpperCase(), at: dep.toISOString() },
        arrival: { iataCode: destination.slice(0, 3).toUpperCase(), at: arr.toISOString() },
      },
    ],
  };
  return { option, date };
}

const TESTS: TestConfig[] = [
  {
    label: 'Paris internacional',
    origin: 'São Paulo',
    destination: 'Paris',
    originIata: 'GRU',
    destIata: 'CDG',
    days: 8,
    travelers: 2,
    budget: 35000,
    interests: ['gastronomy', 'culture', 'nightlife'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '14:10',
    outboundDuration: '16h45',
    returnDeparture: '10:45',
    returnDuration: '12h30',
    priceLevel: 'midrange',
  },
  {
    label: 'Fortaleza doméstico',
    origin: 'São Paulo',
    destination: 'Fortaleza',
    originIata: 'GRU',
    destIata: 'FOR',
    days: 8,
    travelers: 1,
    budget: 10000,
    interests: ['gastronomy', 'beach', 'family'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '08:40',
    outboundDuration: '3h25',
    returnDeparture: '17:00',
    returnDuration: '3h25',
  },
  {
    label: 'Rio simples',
    origin: 'São Paulo',
    destination: 'Rio de Janeiro',
    originIata: 'GRU',
    destIata: 'GIG',
    days: 8,
    travelers: 2,
    budget: 8000,
    interests: ['beach'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '09:15',
    outboundDuration: '1h05',
    returnDeparture: '14:10',
    returnDuration: '1h05',
  },
  {
    label: 'Lisboa internacional',
    origin: 'São Paulo',
    destination: 'Lisboa',
    originIata: 'GRU',
    destIata: 'LIS',
    days: 8,
    travelers: 2,
    budget: 30000,
    interests: ['gastronomy', 'culture', 'family'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '23:15',
    outboundDuration: '9h45',
    returnDeparture: '11:30',
    returnDuration: '9h45',
    priceLevel: 'midrange',
  },
  {
    label: 'Orlando família',
    origin: 'São Paulo',
    destination: 'Orlando',
    originIata: 'GRU',
    destIata: 'MCO',
    days: 8,
    travelers: 2,
    budget: 35000,
    interests: ['family', 'shopping'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '09:40',
    outboundDuration: '9h40',
    returnDeparture: '16:20',
    returnDuration: '9h40',
  },
  {
    label: 'Tóquio SEVERO',
    origin: 'São Paulo',
    destination: 'Tóquio',
    originIata: 'GRU',
    destIata: 'HND',
    days: 8,
    travelers: 2,
    budget: 45000,
    interests: ['culture', 'gastronomy', 'family'],
    jetLagSeverity: 'SEVERO',
    outboundDeparture: '01:25',
    outboundDuration: '25h30',
    returnDeparture: '18:00',
    returnDuration: '22h30',
  },
  {
    label: 'Roma internacional',
    origin: 'São Paulo',
    destination: 'Roma',
    originIata: 'GRU',
    destIata: 'FCO',
    days: 8,
    travelers: 2,
    budget: 28000,
    interests: ['gastronomy', 'culture'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '21:50',
    outboundDuration: '11h35',
    returnDeparture: '10:20',
    returnDuration: '11h35',
    priceLevel: 'midrange',
  },
  {
    label: 'Salvador família',
    origin: 'São Paulo',
    destination: 'Salvador',
    originIata: 'GRU',
    destIata: 'SSA',
    days: 8,
    travelers: 2,
    budget: 14000,
    interests: ['beach', 'culture', 'family'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '08:10',
    outboundDuration: '2h25',
    returnDeparture: '19:30',
    returnDuration: '2h25',
  },
  {
    label: 'Buenos Aires gastrô',
    origin: 'São Paulo',
    destination: 'Buenos Aires',
    originIata: 'GRU',
    destIata: 'EZE',
    days: 8,
    travelers: 2,
    budget: 18000,
    interests: ['gastronomy', 'culture'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '08:30',
    outboundDuration: '2h50',
    returnDeparture: '19:40',
    returnDuration: '2h50',
  },
  {
    label: 'Nova York família',
    origin: 'São Paulo',
    destination: 'Nova York',
    originIata: 'GRU',
    destIata: 'JFK',
    days: 8,
    travelers: 2,
    budget: 42000,
    interests: ['family', 'shopping', 'culture'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '21:40',
    outboundDuration: '9h45',
    returnDeparture: '22:05',
    returnDuration: '9h45',
  },
  {
    label: 'Gramado serra',
    origin: 'São Paulo',
    destination: 'Gramado',
    originIata: 'GRU',
    destIata: 'CXJ',
    days: 8,
    travelers: 2,
    budget: 15000,
    interests: ['gastronomy', 'family'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '10:20',
    outboundDuration: '1h35',
    returnDeparture: '16:45',
    returnDuration: '1h35',
  },
  {
    label: 'Londres família',
    origin: 'São Paulo',
    destination: 'Londres',
    originIata: 'GRU',
    destIata: 'LHR',
    days: 8,
    travelers: 2,
    budget: 38000,
    interests: ['family', 'culture', 'shopping'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '22:10',
    outboundDuration: '11h40',
    returnDeparture: '13:05',
    returnDuration: '11h40',
  },
  {
    label: 'Barcelona cultura',
    origin: 'São Paulo',
    destination: 'Barcelona',
    originIata: 'GRU',
    destIata: 'BCN',
    days: 8,
    travelers: 2,
    budget: 27000,
    interests: ['gastronomy', 'culture'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '19:45',
    outboundDuration: '10h30',
    returnDeparture: '11:55',
    returnDuration: '10h30',
  },
  {
    label: 'Porto Seguro família',
    origin: 'São Paulo',
    destination: 'Porto Seguro',
    originIata: 'GRU',
    destIata: 'BPS',
    days: 8,
    travelers: 2,
    budget: 13000,
    interests: ['beach', 'family'],
    jetLagSeverity: 'BAIXO',
    outboundDeparture: '09:05',
    outboundDuration: '1h50',
    returnDeparture: '17:35',
    returnDuration: '1h50',
  },
  {
    label: 'Dubai desértico',
    origin: 'São Paulo',
    destination: 'Dubai',
    originIata: 'GRU',
    destIata: 'DXB',
    days: 8,
    travelers: 2,
    budget: 42000,
    interests: ['family', 'shopping', 'culture'],
    jetLagSeverity: 'ALTO',
    outboundDeparture: '01:25',
    outboundDuration: '14h35',
    returnDeparture: '09:05',
    returnDuration: '14h35',
  },
  {
    label: 'Cidade do Cabo natureza',
    origin: 'São Paulo',
    destination: 'Cidade do Cabo',
    originIata: 'GRU',
    destIata: 'CPT',
    days: 8,
    travelers: 2,
    budget: 30000,
    interests: ['nature', 'family', 'gastronomy'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '17:30',
    outboundDuration: '11h10',
    returnDeparture: '12:40',
    returnDuration: '11h10',
  },
  {
    label: 'Istambul milenar',
    origin: 'São Paulo',
    destination: 'Istambul',
    originIata: 'GRU',
    destIata: 'IST',
    days: 8,
    travelers: 2,
    budget: 26000,
    interests: ['culture', 'gastronomy'],
    jetLagSeverity: 'ALTO',
    outboundDeparture: '01:55',
    outboundDuration: '12h05',
    returnDeparture: '09:40',
    returnDuration: '12h05',
  },
];

interface TestOutcome {
  config: TestConfig;
  results: ValidationResult[];
  report: string;
  error?: string;
}

export default function SmokeTest() {
  const [outcomes, setOutcomes] = useState<TestOutcome[]>([]);

  useEffect(() => {
    const departure = new Date();
    departure.setHours(0, 0, 0, 0);
    const results: TestOutcome[] = TESTS.map((cfg) => {
      try {
        const depDate = new Date(departure);
        const retDate = addDays(depDate, cfg.days - 1);
        const outbound = buildFlight(
          cfg.origin,
          cfg.destination,
          depDate,
          cfg.outboundDeparture,
          cfg.outboundDuration,
          1200
        );
        const ret = buildFlight(
          cfg.destination,
          cfg.origin,
          retDate,
          cfg.returnDeparture,
          cfg.returnDuration,
          1200
        );
        const { days } = generateItinerary(
          depDate,
          retDate,
          cfg.destination,
          cfg.origin,
          outbound,
          ret,
          cfg.budget,
          cfg.travelers,
          cfg.interests,
          cfg.jetLagSeverity,
          cfg.priceLevel
        );
        const validation = validateItinerary(days, {
          budget: cfg.budget,
          travelInterests: cfg.interests,
          destination: cfg.destination,
        });

        // R10 AFFILIATE LINKS
        const offerLinks = buildOfferLinks({
          category: 'flight',
          originCode: cfg.originIata,
          destinationCode: cfg.destIata,
          startDate: depDate,
          endDate: retDate,
          travelers: cfg.travelers,
        });
        const linkValidation = validateOfferLinks(
          offerLinks.map((l) => ({ label: l.partner, url: l.url })),
          {
            departure: format(depDate, 'yyyy-MM-dd'),
            returnDate: format(retDate, 'yyyy-MM-dd'),
            originIata: cfg.originIata,
            destIata: cfg.destIata,
          }
        );
        const merged = [...validation, ...linkValidation];
        return {
          config: cfg,
          results: merged,
          report: formatReport(cfg.label, merged),
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          config: cfg,
          results: [{ rule: 'GENERATOR', status: 'FAIL', detail: msg }],
          report: `SMOKE — ${cfg.label}: GENERATOR CRASHED\n  ${msg}`,
          error: msg,
        };
      }
    });
    setOutcomes(results);
  }, []);

  const totals = useMemo(() => {
    const all = outcomes.flatMap((o) => o.results);
    const pass = all.filter((r) => r.status === 'PASS').length;
    return { pass, total: all.length };
  }, [outcomes]);

  const copyReport = async () => {
    const text = outcomes.map((o) => o.report).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Relatório copiado', description: 'Cole onde quiser.' });
    } catch {
      toast({ title: 'Erro ao copiar', description: 'Copie manualmente do console.' });
      console.log(text);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">
          🧪 KINU Smoke Test — {totals.pass}/{totals.total} PASS
        </h1>
        <button
          onClick={copyReport}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
        >
          Copiar relatório
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {outcomes.map((o) => {
          const pass = o.results.filter((r) => r.status === 'PASS').length;
          const failed = o.results.filter((r) => r.status !== 'PASS');
          const ok = failed.length === 0;
          return (
            <div
              key={o.config.label}
              className={`rounded-xl border p-4 space-y-3 ${
                ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-lg">{o.config.label}</h2>
                <span className={`text-sm font-mono ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pass}/{o.results.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {o.config.origin} → {o.config.destination} · {o.config.days}d · {o.config.travelers}pax · R$
                {o.config.budget.toLocaleString('pt-BR')}
              </p>
              {failed.length === 0 ? (
                <p className="text-emerald-400 text-sm">✅ Todas as regras passaram</p>
              ) : (
                <ul className="space-y-2">
                  {failed.map((r, i) => (
                    <li key={i} className="text-xs">
                      <span
                        className={`font-mono font-semibold ${
                          r.status === 'FAIL' ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        [{r.status}] {r.rule}
                      </span>
                      {r.detail && <div className="text-slate-300 mt-0.5">{r.detail}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <pre className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
        {outcomes.map((o) => o.report).join('\n\n')}
      </pre>
    </div>
  );
}
