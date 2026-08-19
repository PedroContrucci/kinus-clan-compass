import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { generateItinerary } from '@/components/cockpit/GeneratedItineraryStage';
import type { SelectedFlight, FlightOption } from '@/components/cockpit/FlightSelectionStage';
import { validateItinerary, validateOfferLinks, formatReport, type ValidationResult } from '@/lib/itineraryValidator';
import { buildOfferLinks } from '@/lib/offersLinks';
import type { PriceLevel } from '@/lib/activityPricing';
import { toast } from '@/hooks/use-toast';
import {
  flush,
  getSyncLog,
  getSyncStatus,
  clearSyncLog,
  type SyncLogEvent,
  type SyncStatus,
} from '@/lib/tripSync';

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
  {
    label: 'Bangkok SEVERO',
    origin: 'São Paulo',
    destination: 'Bangkok',
    originIata: 'GRU',
    destIata: 'BKK',
    days: 8,
    travelers: 2,
    budget: 32000,
    interests: ['culture', 'gastronomy', 'family'],
    jetLagSeverity: 'SEVERO',
    outboundDeparture: '01:35',
    outboundDuration: '21h50',
    returnDeparture: '18:25',
    returnDuration: '21h50',
  },
  {
    label: 'Marrakech místico',
    origin: 'São Paulo',
    destination: 'Marrakech',
    originIata: 'GRU',
    destIata: 'RAK',
    days: 8,
    travelers: 2,
    budget: 26000,
    interests: ['culture', 'shopping'],
    jetLagSeverity: 'MODERADO',
    outboundDeparture: '19:05',
    outboundDuration: '13h30',
    returnDeparture: '10:15',
    returnDuration: '13h30',
  },
  {
    label: 'Singapura SEVERO',
    origin: 'São Paulo',
    destination: 'Singapura',
    originIata: 'GRU',
    destIata: 'SIN',
    days: 8,
    travelers: 2,
    budget: 38000,
    interests: ['family', 'nature', 'gastronomy'],
    jetLagSeverity: 'SEVERO',
    outboundDeparture: '23:55',
    outboundDuration: '19h40',
    returnDeparture: '08:45',
    returnDuration: '19h40',
  },
];

interface TestOutcome {
  config: TestConfig;
  results: ValidationResult[];
  report: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Espelho (Arco 4) — ADITIVO. Nada aqui entra no placar do smoke: `totals` é
// calculado só sobre `outcomes`, e este componente tem estado próprio.
//
// Mostra o lado LOCAL do espelho (outbox, log, status). A comparação local × banco
// (só-no-local, só-no-banco, payload divergente, ordem) precisa de `select` e chega
// na 4f junto com a hidratação — o aviso na tela diz isso ao vivo.
// ---------------------------------------------------------------------------

const MIRROR_REFRESH_MS = 2000;

/** Uuid inteiro é ilegível numa tabela; o começo basta para bater olho, e o title tem tudo. */
function shortId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}

function hhmmss(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : parsed.toLocaleTimeString('pt-BR');
}

function MirrorTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'ok' | 'warn' | 'bad';
}) {
  const color =
    tone === 'bad' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-mono ${color}`}>{value}</div>
    </div>
  );
}

function MirrorIds({ label, ids }: { label: string; ids: string[] }) {
  return (
    <p className="text-xs text-slate-400">
      <span className="text-slate-500">{label}:</span>{' '}
      {ids.length === 0 ? (
        '—'
      ) : (
        <span className="font-mono text-slate-300">
          {ids.map((id) => (
            <span key={id} title={id} className="mr-2">
              {shortId(id)}
            </span>
          ))}
        </span>
      )}
    </p>
  );
}

function MirrorPanel() {
  const [status, setStatus] = useState<SyncStatus>(() => getSyncStatus());
  const [log, setLog] = useState<SyncLogEvent[]>(() => getSyncLog());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Polling em vez de assinatura: o espelho não expõe sino próprio, e um painel de soak
  // precisa se mexer sozinho enquanto você usa o app em outra aba.
  useEffect(() => {
    const refresh = () => {
      setStatus(getSyncStatus());
      setLog(getSyncLog());
    };
    const timer = window.setInterval(refresh, MIRROR_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const sessionLabel = !status.sessionResolved
    ? 'resolvendo…'
    : status.ownerUserId
      ? status.ownerUserId
      : 'anônimo (espelho desligado)';

  const forceFlush = async () => {
    setBusy(true);
    setFeedback('Flush em andamento…');
    try {
      await flush();
    } finally {
      setBusy(false);
    }

    const next = getSyncStatus();
    setStatus(next);
    setLog(getSyncLog());

    if (!next.ownerUserId) {
      setFeedback('Sem sessão resolvida com userId: o flush é no-op e nenhuma chamada foi feita.');
    } else if (next.lastFlushError) {
      setFeedback(
        `Terminou com erro ${next.lastFlushError.code ?? 'sem código'}: ${next.lastFlushError.message}`,
      );
    } else {
      setFeedback(`Flush concluído. Restam ${next.outbox.pending} pendente(s) na fila.`);
    }
  };

  const handleClearLog = () => {
    clearSyncLog();
    setStatus(getSyncStatus());
    setLog(getSyncLog());
    setFeedback('Log apagado. O outbox NÃO foi tocado.');
  };

  const newestFirst = [...log].reverse();

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg">🪞 Espelho (Arco 4) — lado local</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sessão: <span className="font-mono text-slate-200">{sessionLabel}</span> · inFlight:{' '}
            <span className="font-mono">{status.inFlight ? 'sim' : 'não'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={forceFlush}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition"
          >
            {busy ? 'Flushando…' : 'Forçar flush'}
          </button>
          <button
            onClick={handleClearLog}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-medium transition"
          >
            Limpar log
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/5 rounded-lg p-3">
        ⚠ Comparação local × banco (só-no-local, só-no-banco, payload divergente, ordem) chega na{' '}
        <strong>4f</strong>, junto com a hidratação — ela precisa de <code>select</code>, e a 4d
        não lê do banco. Este painel mostra só o lado local: outbox, log e status.
      </p>

      {feedback && (
        <p className="text-xs font-mono text-slate-200 border border-slate-700 bg-slate-950/60 rounded-lg p-2">
          {feedback}
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <MirrorTile
          label="Pendente"
          value={status.outbox.pending}
          tone={status.outbox.pending > 0 ? 'warn' : 'ok'}
        />
        <MirrorTile
          label="Blocked (42501)"
          value={status.outbox.blocked}
          tone={status.outbox.blocked > 0 ? 'bad' : 'ok'}
        />
        <MirrorTile
          label="Outro dono"
          value={status.outbox.foreignOwner}
          tone={status.outbox.foreignOwner > 0 ? 'warn' : 'ok'}
        />
        <MirrorTile
          label="Erros 24h"
          value={status.errors24h}
          tone={status.errors24h > 0 ? 'bad' : 'ok'}
        />
        <MirrorTile
          label="Último flush"
          value={status.lastFlushAt ? hhmmss(status.lastFlushAt) : '—'}
          tone={status.lastFlushAt ? 'ok' : 'warn'}
        />
      </div>

      <div className="space-y-1">
        <MirrorIds label="ids pendentes" ids={status.outbox.ids.pending} />
        <MirrorIds label="ids blocked" ids={status.outbox.ids.blocked} />
        <MirrorIds label="ids de outro dono" ids={status.outbox.ids.foreignOwner} />
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Último erro:</span>{' '}
          {status.lastFlushError ? (
            <span className="font-mono text-red-400">
              [{status.lastFlushError.code ?? 'sem código'}] {status.lastFlushError.message}
            </span>
          ) : (
            'nenhum'
          )}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          kinu_sync_log — {log.length}/50 evento(s), mais recente no topo
        </h3>
        {newestFirst.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma tentativa registrada nesta origem ainda.</p>
        ) : (
          <div className="max-h-72 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-500 sticky top-0">
                <tr>
                  <th className="text-left p-2">quando</th>
                  <th className="text-left p-2">op</th>
                  <th className="text-left p-2">id</th>
                  <th className="text-left p-2">resultado</th>
                </tr>
              </thead>
              <tbody>
                {newestFirst.map((event, i) => (
                  <tr
                    key={`${event.ts}-${event.id}-${i}`}
                    className="border-t border-slate-800/60"
                  >
                    <td className="p-2 text-slate-400">{hhmmss(event.ts)}</td>
                    <td className="p-2 text-slate-300">{event.op}</td>
                    <td className="p-2 text-slate-300" title={event.id}>
                      {shortId(event.id)}
                    </td>
                    <td className={`p-2 ${event.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {event.ok ? '✅ ok' : `🔴 ${event.code ?? 'sem código'}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
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

      <MirrorPanel />

      <pre className="text-xs bg-slate-900 border border-slate-800 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
        {outcomes.map((o) => o.report).join('\n\n')}
      </pre>
    </div>
  );
}
