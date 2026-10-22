import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CheckCheck, ChevronDown, Loader2, MessageCircle, Plane, RefreshCw, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  { value: 'novo', label: 'Novo', countLabel: 'Novos', selectedClass: 'border-accent/30 bg-accent/15 text-accent' },
  { value: 'fila', label: 'Na fila', countLabel: 'Na fila', selectedClass: 'border-[hsl(var(--kinu-gold))]/30 bg-[hsl(var(--kinu-gold))]/15 text-[hsl(var(--kinu-gold))]' },
  { value: 'feito', label: 'Feito', countLabel: 'Feitos', selectedClass: 'border-primary/30 bg-primary/15 text-primary' },
  { value: 'nao_fara', label: 'Não fará', countLabel: 'Não fará', selectedClass: 'border-border bg-muted text-muted-foreground' },
];

const chipClass = 'shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] sm:text-xs';
const cardClass = 'min-w-0 rounded-xl border border-border bg-card';
const rowClass = 'h-auto min-h-[44px] w-full justify-start gap-2 rounded-xl px-3 py-3 text-left hover:bg-muted/30 sm:px-4';

function Chevron({ open }: { open: boolean }) {
  return <ChevronDown aria-hidden="true" className={cn('ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', open && 'rotate-180')} />;
}

function Section({ title, summary, count, icon, initialOpen = false, children }: { title: string; summary: string; count: number; icon: ReactNode; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen);
  return <Collapsible open={open} onOpenChange={setOpen} className={cardClass}>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" className={rowClass} aria-label={title}>
        {icon}<span className="shrink-0 font-['Outfit'] font-semibold">{title}</span>
        <span className="min-w-0 truncate text-xs font-normal text-muted-foreground" title={summary}>{summary}</span>
        <span className={cn(chipClass, 'ml-auto text-muted-foreground')}>{count}</span><Chevron open={open} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent><div className="border-t border-border px-3 py-3 sm:px-4">{children}</div></CollapsibleContent>
  </Collapsible>;
}

function FeedbackCard({ row, onRefresh }: { row: FeedbackRow; onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(row.triage_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  useEffect(() => { setNote(row.triage_note ?? ''); }, [row.triage_note]);
  const status = triageOptions.find(option => option.value === row.triage);
  const save = async (triage: Triage) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await kinuBeta.rpc('onda_triage', { p_id: row.id, p_triage: triage, p_note: note });
      if (error) throw error;
      await onRefresh();
      setEditing(false);
    } catch {
      setSaveError('Não foi possível salvar a triagem. Tente novamente.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 border-b border-border last:border-b-0">
    <CollapsibleTrigger asChild><Button variant="ghost" className={cn(rowClass, 'px-0 sm:px-0')} aria-label={`Feedback de ${row.tester_name}`}>
      <span className="min-w-0 flex-1 truncate font-semibold" title={row.tester_name}>{row.tester_name}</span>
      {row.categoria && <span className={cn(chipClass, 'max-w-16 truncate', row.categoria === 'bug' ? 'border-destructive/30 bg-destructive/10 text-destructive' : row.categoria === 'suggestion' ? 'border-accent/30 bg-accent/10 text-accent' : 'bg-muted/30 text-muted-foreground')}>{row.categoria}</span>}
      <time dateTime={row.quando} className="shrink-0 text-[10px] font-normal text-muted-foreground sm:text-xs">{formatSignal(new Date(row.quando))}</time>
      <span className={cn(chipClass, status?.selectedClass)}>{status?.label ?? row.triage}</span><Chevron open={open} />
    </Button></CollapsibleTrigger>
    <CollapsibleContent>
      <div className="space-y-3 pb-4">
        <p className="whitespace-pre-wrap break-words text-sm">{row.message}</p>
        {(row.tela || row.destino) && <p className="break-words text-xs text-muted-foreground">{[row.tela, row.destino].filter(Boolean).join(' · ')}</p>}
        {row.rating != null && <p className="text-xs text-[hsl(var(--kinu-gold))]">★ {row.rating}</p>}
        <div>
          <div className="mb-1 flex min-h-[44px] items-center justify-between gap-2"><span className="text-sm font-medium">Ação</span>
            {!editing && <Button variant="ghost" size="sm" disabled={saving} onClick={() => { setNote(row.triage_note ?? ''); setEditing(true); }}>Editar</Button>}
          </div>
          {editing ? <form className="flex min-w-0 gap-2" onSubmit={event => { event.preventDefault(); void save(row.triage); }}>
            <Input value={note} onChange={event => setNote(event.target.value)} disabled={saving} placeholder="Nota (arco, decisão…)" aria-label={`Ação de ${row.tester_name}`} className="min-w-0 flex-1" />
            <Button type="submit" variant="outline" size="sm" disabled={saving} className="h-10 shrink-0">{saving && <Loader2 className="h-3 w-3 animate-spin" />}Salvar</Button>
          </form> : <p className={cn('break-words text-sm', !row.triage_note && 'text-muted-foreground')}>{row.triage_note || '— sem ação definida'}</p>}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Triagem de ${row.tester_name}`}>
          {triageOptions.map(option => <Button key={option.value} variant="outline" size="sm" disabled={saving} aria-pressed={row.triage === option.value} className={cn('min-h-[44px] px-2 text-xs', row.triage === option.value && option.selectedClass)} onClick={() => void save(option.value)}>{option.label}</Button>)}
        </div>
        {saveError && <p role="alert" className="text-xs text-destructive">{saveError}</p>}
      </div>
    </CollapsibleContent>
  </Collapsible>;
}

function FeedbackSection({ rows, error, onRefresh }: { rows: FeedbackRow[]; error: string | null; onRefresh: () => Promise<void> }) {
  const [filter, setFilter] = useState<Triage | null>(null);
  const counts = (status: Triage) => rows.filter(row => row.triage === status).length;
  const visible = useMemo(() => rows.filter(row => !filter || row.triage === filter).sort((a, b) => Number(b.triage === 'novo') - Number(a.triage === 'novo') || new Date(b.quando).getTime() - new Date(a.quando).getTime()), [rows, filter]);
  return <Section title="Feedbacks" summary={`${counts('novo')} novos · ${counts('fila')} na fila · ${counts('feito')} feitos`} count={rows.length} icon={<MessageCircle className="h-4 w-4 shrink-0 text-accent" />} initialOpen>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar feedbacks">
      <Button variant="outline" size="sm" aria-pressed={filter === null} className={cn('min-h-[44px] px-2 text-xs', filter === null && 'border-accent/30 bg-accent/15 text-accent')} onClick={() => setFilter(null)}>Todos</Button>
      {triageOptions.map(option => <Button key={option.value} variant="outline" size="sm" aria-pressed={filter === option.value} className={cn('min-h-[44px] px-2 text-xs', filter === option.value && option.selectedClass)} onClick={() => setFilter(current => current === option.value ? null : option.value)}>{option.countLabel}</Button>)}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {!error && rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhum feedback desde 22/10.</p> : <div className="mt-2">{visible.map(row => <FeedbackCard key={row.id} row={row} onRefresh={onRefresh} />)}</div>}
  </Section>;
}

function isRecent(date: Date | null, now: number) {
  const signal = date?.getTime() ?? NaN;
  return signal <= now && now - signal <= 24 * 60 * 60 * 1000;
}
function destinations(row: OndaRow) { return Array.isArray(row.destinos) ? row.destinos.join(', ') : row.destinos; }

function PersonRow({ row, now }: { row: OndaRow; now: number }) {
  const [open, setOpen] = useState(false);
  const date = row.ultimo_sinal ? new Date(row.ultimo_sinal) : null;
  return <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 border-b border-border last:border-b-0">
    <CollapsibleTrigger asChild><Button variant="ghost" className={cn(rowClass, 'px-0 sm:px-0')} aria-label={`Pessoa: ${row.nome}`}>
      <span className="min-w-0 flex-1 truncate font-semibold" title={row.nome}>{row.nome}</span>
      <span className={cn(chipClass, 'max-w-16 truncate text-accent')}>{row.grupo}</span>
      <span className="shrink-0 text-[10px] font-normal text-muted-foreground sm:text-xs">{row.cadastrou ? '✓ conta' : '— sem conta'}</span>
      <span className="shrink-0 text-[10px] font-normal text-muted-foreground sm:text-xs">{row.viagens} viagens</span>
      {isRecent(date, now) && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" role="img" aria-label="Ativa nas últimas 24 h" />}<Chevron open={open} />
    </Button></CollapsibleTrigger>
    <CollapsibleContent><div className="space-y-3 pb-4 text-sm">
      {destinations(row) && <p className="break-words">{destinations(row)}</p>}
      <div className="flex flex-wrap gap-2">
        <span className={cn(chipClass, row.voo_ok > 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground')}>Voo {row.voo_ok > 0 ? '✓' : '—'}</span>
        <span className={cn(chipClass, row.hotel_ok > 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'text-muted-foreground')}>Hotel {row.hotel_ok > 0 ? '✓' : '—'}</span>
        <span className={cn(chipClass, 'text-muted-foreground')}>Feedback {row.feedbacks}</span>
        {row.nota != null && <span className={cn(chipClass, 'text-[hsl(var(--kinu-gold))]')}>Nota {row.nota}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{row.ultimo_sinal ? `Último sinal: ${formatSignal(date)}` : 'sem atividade'}</p>
    </div></CollapsibleContent>
  </Collapsible>;
}

type Tile = 'invited' | 'accounts' | 'trips' | 'closed';
const tileOptions = [
  { id: 'invited' as const, label: 'Convidados', icon: Users, matches: (_row: OndaRow) => true },
  { id: 'accounts' as const, label: 'Com conta', icon: UserCheck, matches: (row: OndaRow) => row.cadastrou },
  { id: 'trips' as const, label: 'Criaram viagem', icon: Plane, matches: (row: OndaRow) => row.viagens > 0 },
  { id: 'closed' as const, label: 'Fecharam', icon: CheckCheck, matches: (row: OndaRow) => row.voo_ok > 0 || row.hotel_ok > 0 },
];

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
  const [tile, setTile] = useState<Tile | null>(null);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => { if (!isLoading && !user) navigate('/', { replace: true }); }, [isLoading, user, navigate]);
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
        if (!active) return;
        if (panel.error) throw panel.error;
        setRows((panel.data ?? []) as OndaRow[]);
        if (feedback.error) setFeedbackError('Não foi possível atualizar os feedbacks. Tente novamente.');
        else { setFeedbackRows((feedback.data ?? []) as FeedbackRow[]); setFeedbackError(null); }
        setUpdatedAt(new Date());
        setError(null);
      } catch { if (active) setError('Não foi possível atualizar o painel. Tente novamente.'); }
      finally { inFlight = false; if (active) setRefreshing(false); }
    };
    refreshRef.current = refresh;
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    return () => { active = false; clearInterval(interval); refreshRef.current = null; };
  }, [isLoading, allowed, user?.id]);

  const people = useMemo(() => [...rows].sort((a, b) => {
    const time = (value: string | null) => value ? (new Date(value).getTime() || 0) : -Infinity;
    return time(b.ultimo_sinal) - time(a.ultimo_sinal);
  }), [rows]);
  const refreshFeedbacks = async () => {
    const { data, error } = await kinuBeta.rpc('onda_feedback');
    if (error) throw error;
    setFeedbackRows((data ?? []) as FeedbackRow[]);
    setFeedbackError(null);
  };

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Carregando"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return <main className="px-4 pt-24 pb-24"><div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6"><h1 className={headingClass}>Sem acesso</h1><Button asChild variant="link" className="mt-3 px-0"><Link to="/inicio">Voltar ao início</Link></Button></div></main>;

  const now = (updatedAt ?? new Date()).getTime();
  const activeCount = rows.filter(row => isRecent(row.ultimo_sinal ? new Date(row.ultimo_sinal) : null, now)).length;
  const trips = rows.filter(row => row.viagens > 0);
  const ratio = (kind: 'voo_ok' | 'hotel_ok') => trips.length ? `${Math.round(trips.filter(row => row[kind] > 0).length / trips.length * 100)}%` : '—';
  const selectedTile = tileOptions.find(option => option.id === tile);
  const groupRows = groups.map(group => ({ group, members: rows.filter(row => row.grupo === group) })).filter(group => group.members.length);

  return <main className="mx-auto max-w-4xl bg-background px-4 pt-24 pb-24 text-foreground sm:px-6">
    <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
      <h1 className="font-['Outfit'] text-2xl font-semibold sm:text-3xl">Onda 27/10 → 02/11</h1>
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" size="sm" className="min-h-[44px]" disabled={refreshing} onClick={() => void refreshRef.current?.()}>{refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}Atualizar</Button><span className="text-xs text-muted-foreground" aria-live="polite">{updatedAt ? `Atualizado às ${format(updatedAt, 'HH:mm', { locale: ptBR })}` : '—'}</span></div>
    </header>
    {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
    {!updatedAt && refreshing ? <div className="flex justify-center py-12" role="status" aria-label="Carregando painel"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : updatedAt && <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tileOptions.map(option => <Button key={option.id} variant="ghost" className={cn(cardClass, 'h-auto min-h-[100px] flex-col items-start gap-2 px-4 py-3', tile === option.id && 'border-primary bg-primary/10')} aria-expanded={tile === option.id} aria-controls="onda-tile-people" onClick={() => setTile(current => current === option.id ? null : option.id)}>
          <span className="flex w-full items-center gap-2 text-xs text-muted-foreground"><option.icon className="h-4 w-4 shrink-0" /><span>{option.label}</span></span><span className="font-['Outfit'] text-2xl font-semibold text-foreground">{rows.filter(option.matches).length}</span>
        </Button>)}
      </div>
      <Collapsible open={tile !== null} onOpenChange={open => { if (!open) setTile(null); }}>
        <CollapsibleContent id="onda-tile-people"><div className={cn(cardClass, 'mt-3 px-3 py-1')} role="region" aria-label={selectedTile?.label}>
          {selectedTile && people.filter(selectedTile.matches).map((row, index) => <div key={`${row.nome}-${row.grupo}-${index}`} className="flex min-h-[44px] items-center gap-2 border-b border-border text-xs last:border-b-0"><span className="min-w-0 truncate font-semibold" title={row.nome}>{row.nome}</span><span className={cn(chipClass, 'text-accent')}>{row.grupo}</span><span className="min-w-0 flex-1 truncate text-muted-foreground" title={`${row.cadastrou ? '✓ conta' : '— sem conta'} · ${row.viagens} viagens · Voo ${row.voo_ok > 0 ? '✓' : '—'} · Hotel ${row.hotel_ok > 0 ? '✓' : '—'}`}>{row.cadastrou ? '✓ conta' : '— sem conta'} · {row.viagens} viagens · Voo {row.voo_ok > 0 ? '✓' : '—'} · Hotel {row.hotel_ok > 0 ? '✓' : '—'}</span></div>)}
          {selectedTile && !people.some(selectedTile.matches) && <p className="py-3 text-xs text-muted-foreground">Nenhuma pessoa neste estado.</p>}
        </div></CollapsibleContent>
      </Collapsible>
      <p className="my-4 text-xs text-muted-foreground">Voo {ratio('voo_ok')} · Hotel {ratio('hotel_ok')} dos que criaram viagem</p>
      <div className="space-y-3">
        <FeedbackSection rows={feedbackRows} error={feedbackError} onRefresh={refreshFeedbacks} />
        <Section title="Pessoas" summary={`${rows.length} pessoas · ${activeCount} ativas nas últimas 24 h`} count={rows.length} icon={<Users className="h-4 w-4 shrink-0 text-primary" />}>
          {people.map((row, index) => <PersonRow key={`${row.nome}-${row.grupo}-${index}`} row={row} now={now} />)}
          {!rows.length && <p className="text-sm text-muted-foreground">Nenhum convidado cadastrado em onda.convidados.</p>}
        </Section>
        <Section title="Por grupo" summary={groupRows.map(({ group, members }) => `${group} ${members.length}`).join(' · ')} count={groupRows.length} icon={<BarChart3 className="h-4 w-4 shrink-0 text-[hsl(var(--kinu-gold))]" />}>
          <div className="overflow-x-auto"><table className="w-full text-left text-xs sm:text-sm"><thead className="text-muted-foreground"><tr>{['grupo', 'convidados', 'com conta', 'voo', 'hotel'].map(label => <th key={label} scope="col" className="whitespace-nowrap py-3 pr-3 font-medium">{label}</th>)}</tr></thead><tbody>
            {groupRows.map(({ group, members }) => <tr key={group} className="border-t border-border"><th scope="row" className="py-3 pr-3 font-medium text-accent">{group}</th>{[members.length, members.filter(row => row.cadastrou).length, members.filter(row => row.voo_ok > 0).length, members.filter(row => row.hotel_ok > 0).length].map((count, index) => <td key={index} className="py-3 pr-3 tabular-nums">{count}</td>)}</tr>)}
          </tbody></table></div>
        </Section>
      </div>
    </>}
  </main>;
}
