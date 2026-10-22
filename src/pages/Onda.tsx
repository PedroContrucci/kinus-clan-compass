import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { cn } from '@/lib/utils';

interface OndaRow {
  nome: string;
  grupo: string;
  convidado_em: string | null;
  cadastrou: boolean;
  cadastro_em: string | null;
  viagens: number;
  destinos: string[] | string | null;
  voo_ok: number;
  hotel_ok: number;
  conversas_ai: number;
  feedbacks: number;
  nota: number | null;
  ultimo_sinal: string | null;
}

// ultimo_sinal chega em UTC. new Date() lê o instante real e format() mostra no fuso de quem olha.
function formatSignal(date: Date | null) {
  return date && !Number.isNaN(date.getTime()) ? format(date, 'dd/MM HH:mm', { locale: ptBR }) : 'sem atividade';
}

const groups = ['familia', 'amigos', 'mba', 'trabalho'];
const headingClass = "font-['Outfit'] text-xl font-semibold text-foreground";

type Triage = 'novo' | 'fila' | 'feito' | 'nao_fara';
interface FeedbackRow {
  id: string;
  quando: string;
  tester_name: string;
  rating: number | null;
  message: string;
  categoria: string | null;
  tela: string | null;
  destino: string | null;
  triage: Triage;
  triage_note: string | null;
}

const triageOptions: { value: Triage; label: string; countLabel: string; selectedClass: string }[] = [
  { value: 'novo', label: 'Novo', countLabel: 'novo', selectedClass: 'border-accent/30 bg-accent/15 text-accent' },
  { value: 'fila', label: 'Na fila', countLabel: 'fila', selectedClass: 'border-[hsl(var(--kinu-gold))]/30 bg-[hsl(var(--kinu-gold))]/15 text-[hsl(var(--kinu-gold))]' },
  { value: 'feito', label: 'Feito', countLabel: 'feito', selectedClass: 'border-primary/30 bg-primary/15 text-primary' },
  { value: 'nao_fara', label: 'Não fará', countLabel: 'não fará', selectedClass: 'border-border bg-muted text-muted-foreground' },
];

function FeedbackCard({ row, onRefresh }: { row: FeedbackRow; onRefresh: () => Promise<void> }) {
  const [note, setNote] = useState(row.triage_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  useEffect(() => { setNote(row.triage_note ?? ''); }, [row.triage_note]);

  const save = async (status: Triage) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const { error: rpcError } = await kinuBeta.rpc('onda_triage', { p_id: row.id, p_triage: status, p_note: note });
      if (rpcError) throw rpcError;
      await onRefresh();
    } catch {
      setSaveError('Não foi possível salvar a triagem. Tente novamente.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return <article className="min-w-0 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <h3 className="break-words font-bold">{row.tester_name}</h3>
      {row.categoria && <span className={cn('rounded-md border px-2 py-0.5 text-xs', row.categoria === 'bug' ? 'border-destructive/30 bg-destructive/10 text-destructive' : row.categoria === 'suggestion' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-muted/30 text-muted-foreground')}>{row.categoria}</span>}
      {row.rating != null && <span className="text-[hsl(var(--kinu-gold))]">★ {row.rating}</span>}
      <time dateTime={row.quando} className="text-xs text-muted-foreground">{formatSignal(new Date(row.quando))}</time>
    </div>
    <p className="mt-3 whitespace-pre-wrap break-words text-sm">{row.message}</p>
    {(row.tela || row.destino) && <p className="mt-3 break-words text-xs text-muted-foreground">{[row.tela, row.destino].filter(Boolean).join(' · ')}</p>}
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Triagem de ${row.tester_name}`}>
      {triageOptions.map(option => <Button key={option.value} variant="outline" size="sm" aria-pressed={row.triage === option.value} disabled={saving} className={cn('h-8 px-2 text-xs', row.triage === option.value && option.selectedClass)} onClick={() => void save(option.value)}>{option.label}</Button>)}
    </div>
    <form className="mt-2 flex min-w-0 gap-2" onSubmit={event => { event.preventDefault(); void save(row.triage); }}>
      <Input value={note} onChange={event => setNote(event.target.value)} disabled={saving} placeholder="Nota (arco, decisão…)" aria-label={`Nota de triagem de ${row.tester_name}`} className="min-w-0 flex-1" />
      <Button type="submit" variant="outline" size="sm" disabled={saving} className="h-10 shrink-0">{saving && <Loader2 className="h-3 w-3 animate-spin" />}Salvar</Button>
    </form>
    {saveError && <p role="alert" className="mt-2 text-xs text-destructive">{saveError}</p>}
  </article>;
}

function FeedbackSection({ rows, error, onRefresh }: { rows: FeedbackRow[]; error: string | null; onRefresh: () => Promise<void> }) {
  const [filter, setFilter] = useState<Triage | null>(null);
  const visible = useMemo(() => rows.filter(row => !filter || row.triage === filter).sort((a, b) => {
    const priority = Number(b.triage === 'novo') - Number(a.triage === 'novo');
    return priority || new Date(b.quando).getTime() - new Date(a.quando).getTime();
  }), [rows, filter]);

  return <section className="border-b border-border py-6" aria-labelledby="onda-feedbacks">
    <div className="flex flex-wrap items-center gap-3">
      <h2 id="onda-feedbacks" className={headingClass}>Feedbacks</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar feedbacks">
        {triageOptions.map(option => <Button key={option.value} variant="outline" size="sm" aria-pressed={filter === option.value} className={cn('h-8 px-2 text-xs', filter === option.value && option.selectedClass)} onClick={() => setFilter(current => current === option.value ? null : option.value)}>{option.countLabel} · {rows.filter(row => row.triage === option.value).length}</Button>)}
      </div>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {!error && rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhum feedback ainda.</p> : <div className="mt-4 grid gap-3">{visible.map(row => <FeedbackCard key={row.id} row={row} onRefresh={onRefresh} />)}</div>}
  </section>;
}

export default function Onda() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const allowed = user?.email?.toLowerCase() === 'pedrocontrucci@hotmail.com';
  const [rows, setRows] = useState<OndaRow[]>([]);
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate('/', { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (isLoading || !allowed) return;
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || !active) return;
      inFlight = true;
      setRefreshing(true);
      try {
        const [panel, feedback] = await Promise.all([kinuBeta.rpc('onda_painel'), kinuBeta.rpc('onda_feedback')]);
        const { data, error: rpcError } = panel;
        if (rpcError) throw rpcError;
        if (!active) return;
        setRows((data ?? []) as OndaRow[]);
        if (feedback.error) {
          setFeedbackError('Não foi possível atualizar os feedbacks. Tente novamente.');
        } else {
          setFeedbackRows((feedback.data ?? []) as FeedbackRow[]);
          setFeedbackError(null);
        }
        setUpdatedAt(new Date());
        setError(null);
      } catch {
        if (active) setError('Não foi possível atualizar o painel. Tente novamente.');
      } finally {
        inFlight = false;
        if (active) setRefreshing(false);
      }
    };
    refreshRef.current = refresh;
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    return () => {
      active = false;
      clearInterval(interval);
      refreshRef.current = null;
    };
  }, [isLoading, allowed, user?.id]);

  const totals = useMemo(() => ({
    invited: rows.length,
    accounts: rows.filter(row => row.cadastrou).length,
    trips: rows.filter(row => row.viagens > 0).length,
    flights: rows.filter(row => row.voo_ok > 0).length,
    hotels: rows.filter(row => row.hotel_ok > 0).length,
    feedback: rows.filter(row => row.feedbacks > 0).length,
    tripFlights: rows.filter(row => row.viagens > 0 && row.voo_ok > 0).length,
    tripHotels: rows.filter(row => row.viagens > 0 && row.hotel_ok > 0).length,
  }), [rows]);
  const people = useMemo(() => [...rows].sort((a, b) => {
    const time = (value: string | null) => value ? (new Date(value).getTime() || 0) : 0;
    return time(b.ultimo_sinal) - time(a.ultimo_sinal);
  }), [rows]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (
    <main className="px-4 pt-24 pb-24">
      <div className="mx-auto max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className={headingClass}>Sem acesso</h1>
        <Button asChild variant="link" className="mt-3 px-0"><Link to="/inicio">Voltar ao início</Link></Button>
      </div>
    </main>
  );

  const steps = [
    { label: 'Convidados', count: totals.invited, gold: false },
    { label: 'Com conta', count: totals.accounts, gold: false },
    { label: 'Criaram viagem', count: totals.trips, gold: false },
    { label: 'Confirmaram voo', count: totals.flights, gold: true },
    { label: 'Confirmaram hotel', count: totals.hotels, gold: true },
    { label: 'Deram feedback', count: totals.feedback, gold: false },
  ];
  const ratio = (count: number) => totals.trips ? `${Math.round(count / totals.trips * 100)}%` : '—';
  const now = (updatedAt ?? new Date()).getTime();
  const chipClass = 'rounded-md border border-border px-2 py-1 text-xs';
  const refreshFeedbacks = async () => {
    const { data, error: rpcError } = await kinuBeta.rpc('onda_feedback');
    if (rpcError) throw rpcError;
    setFeedbackRows((data ?? []) as FeedbackRow[]);
    setFeedbackError(null);
  };

  return (
    <main className="mx-auto max-w-4xl bg-background px-4 pt-24 pb-24 text-foreground sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <h1 className="font-['Outfit'] text-2xl font-semibold sm:text-3xl">Onda 27/10 → 02/11</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" disabled={refreshing} onClick={() => void refreshRef.current?.()}>
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}Atualizar
          </Button>
          <span className="text-xs text-muted-foreground" aria-live="polite">{updatedAt ? `Atualizado às ${format(updatedAt, 'HH:mm', { locale: ptBR })}` : '—'}</span>
        </div>
      </header>

      {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      {!updatedAt && refreshing ? <div className="flex justify-center py-12" role="status" aria-label="Carregando painel"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : updatedAt && rows.length === 0 ? (
        <><p className="py-12 text-sm text-muted-foreground">Nenhum convidado cadastrado em onda.convidados.</p><FeedbackSection rows={feedbackRows} error={feedbackError} onRefresh={refreshFeedbacks} /></>
      ) : updatedAt && <>
        <section className="border-b border-border py-6" aria-labelledby="onda-funil">
          <h2 id="onda-funil" className={headingClass}>Funil</h2>
          <div className="mt-5 space-y-4">
            {steps.map(step => <div key={step.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span>{step.label}</span><span className="font-semibold tabular-nums">{step.count}</span></div>
              <div className="h-2 overflow-hidden rounded-sm bg-muted/30" role="progressbar" aria-label={step.label} aria-valuemin={0} aria-valuemax={totals.invited} aria-valuenow={step.count}>
                <div className={step.gold ? 'h-full bg-[hsl(var(--kinu-gold))]' : 'h-full bg-primary'} style={{ width: `${totals.invited ? step.count / totals.invited * 100 : 0}%` }} />
              </div>
            </div>)}
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Voo {ratio(totals.tripFlights)} · Hotel {ratio(totals.tripHotels)} dos que criaram viagem</p>
        </section>

        <FeedbackSection rows={feedbackRows} error={feedbackError} onRefresh={refreshFeedbacks} />

        <section className="border-b border-border py-6" aria-labelledby="onda-grupos">
          <h2 id="onda-grupos" className={headingClass}>Por grupo</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-muted-foreground"><tr>{['grupo', 'convidados', 'com conta', 'voo', 'hotel'].map(label => <th key={label} scope="col" className="whitespace-nowrap py-3 pr-3 font-medium">{label}</th>)}</tr></thead>
              <tbody>{groups.map(group => {
                const members = rows.filter(row => row.grupo === group);
                if (!members.length) return null;
                return <tr key={group} className="border-t border-border"><th scope="row" className="py-3 pr-3 font-medium text-accent">{group}</th>{[members.length, members.filter(row => row.cadastrou).length, members.filter(row => row.voo_ok > 0).length, members.filter(row => row.hotel_ok > 0).length].map((count, index) => <td key={index} className="py-3 pr-3 tabular-nums">{count}</td>)}</tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        <section className="py-6" aria-labelledby="onda-pessoas">
          <h2 id="onda-pessoas" className={headingClass}>Pessoas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {people.map((row, index) => {
              const signalDate = row.ultimo_sinal ? new Date(row.ultimo_sinal) : null;
              const signal = signalDate?.getTime() ?? NaN;
              const recent = signal <= now && now - signal <= 24 * 60 * 60 * 1000;
              const destinations = Array.isArray(row.destinos) ? row.destinos.join(', ') : row.destinos;
              return <article key={`${row.nome}-${row.grupo}-${index}`} className={recent ? 'min-w-0 rounded-lg border border-border border-l-4 border-l-primary bg-card p-4' : 'min-w-0 rounded-lg border border-border border-l-4 bg-card p-4'}>
                <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-bold">{row.nome}</h3><span className="rounded-md border border-accent/30 px-2 py-0.5 text-xs text-accent">{row.grupo}</span></div>
                <p className="mt-3 break-words text-sm">Conta {row.cadastrou ? '✓' : '—'} · Viagens {row.viagens}{destinations ? ` · ${destinations}` : ''}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={cn(chipClass, row.voo_ok > 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground')}>Voo {row.voo_ok > 0 ? '✓' : '—'}</span>
                  <span className={cn(chipClass, row.hotel_ok > 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground')}>Hotel {row.hotel_ok > 0 ? '✓' : '—'}</span>
                  <span className={cn(chipClass, 'text-muted-foreground')}>Feedback {row.feedbacks}</span>
                  {row.nota != null && <span className={cn(chipClass, 'text-[hsl(var(--kinu-gold))]')}>Nota {row.nota}</span>}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{row.ultimo_sinal ? `Último sinal: ${formatSignal(signalDate)}` : 'sem atividade'}</p>
              </article>;
            })}
          </div>
        </section>
      </>}
    </main>
  );
}