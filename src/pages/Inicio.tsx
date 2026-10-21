// Início — C.7: a aba única. Suas viagens em linhas + "Planejar nova viagem" (fluxo curto do
// onboarding v2). Composição do que já existe: a viagem aberta é a tela da Viagens (DraftCockpit
// no rascunho, 4 abas na ativa), o planejar é o FirstTripFlow, os valores vêm do razão.
import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/shared/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useKinuAI } from '@/contexts/KinuAIContext';
import { deleteTrip, listTrips, subscribeTrips, type StoredTrip } from '@/lib/tripStore';
import { razaoLines, razaoTotals } from '@/lib/razaoLines';
import { formatTileBRL } from '@/lib/tripScope';
import { ACTIVE, STATUS_LABEL, ddmm, orderTrips, statusLine } from '@/lib/inicioTrips';
import { FirstTripFlow } from '@/components/onboarding/FirstTripFlow';
import { PlanDoors } from '@/components/onboarding/PlanDoors';
import { NewPlanningWizard } from '@/components/wizard/NewPlanningWizard';
import { CheckinBanner } from '@/components/checkin/CheckinBanner';
import { ViagensVividas } from '@/components/viagens/ViagensVividas';
import { fetchOnboardingPrefs, readCachedPrefs } from '@/lib/onboarding';
import { toast } from '@/hooks/use-toast';
import Viagens from './Viagens';

// Home, Viagens e Planejar viraram esta aba. Link antigo (guia, Clã, chat) segue funcionando:
// o redirect leva a query (?trip=, ?guia=1) e o state (openWizardFor).
export function RedirectInicio() {
  const location = useLocation();
  return <Navigate to={`/inicio${location.search}`} state={location.state} replace />;
}

const ApiStatus = lazy(() => import('@/components/debug/ApiStatus').then(m => ({ default: m.ApiStatus })));

interface TripLinhaProps {
  trip: StoredTrip;
  open: boolean;
  onToggle: () => void;
  onOpenTrip: () => void;
  onDelete: () => void;
}

const TripLinha = ({ trip, open, onToggle, onOpenTrip, onDelete }: TripLinhaProps) => {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (!open) setConfirming(false); }, [open]);
  const planned = razaoTotals(razaoLines(trip)).planned;
  const verb = trip.status === 'draft' ? 'continuar' : trip.status === 'completed' ? 'ver' : 'abrir';
  return (
    <div className="bg-card border border-border rounded-xl" data-testid="trip-linha" data-trip-id={trip.id}>
      <div className="flex items-center gap-2 px-3 min-h-[44px]">
        <span className="text-lg" aria-hidden>{trip.emoji || '✈️'}</span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{trip.destination}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {ddmm(trip.startDate)}–{ddmm(trip.endDate)} · {STATUS_LABEL[String(trip.status)] ?? 'Rascunho'} · Planejado {formatTileBRL(planned)}
          </span>
        </span>
        <button onClick={onOpenTrip} className="shrink-0 text-primary text-sm min-h-[44px] px-1">{verb} ▸</button>
        <button onClick={onToggle} aria-expanded={open} aria-label={`Mais opções de ${trip.destination}`}
          className="shrink-0 text-muted-foreground min-h-[44px] min-w-[32px]">…</button>
      </div>
      {open && (
        <div className="flex items-center justify-end gap-3 px-3 pb-2 text-sm">
          {confirming ? (
            <>
              <span className="text-muted-foreground">Excluir {trip.destination}?</span>
              <button onClick={onDelete} className="text-red-400 min-h-[44px] px-1">sim</button>
              <button onClick={() => setConfirming(false)} className="text-muted-foreground min-h-[44px] px-1">não</button>
            </>
          ) : (
            <button onClick={() => setConfirming(true)} aria-label={`Excluir ${trip.destination}`} className="text-muted-foreground min-h-[44px] px-1">🗑 excluir</button>
          )}
        </div>
      )}
    </div>
  );
};

const Inicio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('trip') ?? undefined;
  const debugMode = searchParams.get('debug') === 'true';
  const forceGuide = searchParams.get('guia') === '1';
  const { user, isLoading: authLoading } = useAuth();
  const { wizardPrefill, openPlanning } = useKinuAI();

  const [trips, setTrips] = useState<StoredTrip[]>(() => listTrips());
  useEffect(() => subscribeTrips(() => setTrips(listTrips())), []);

  useEffect(() => {
    if (!user && !authLoading) navigate('/');
  }, [user, authLoading, navigate]);

  const [prefs, setPrefs] = useState(() => readCachedPrefs() as Record<string, unknown>);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchOnboardingPrefs(userId).then((p) => { if (alive) setPrefs(p as Record<string, unknown>); });
    return () => { alive = false; };
  }, [userId]);

  // Vindo do Clã ("Planejar uma viagem para <cidade>"): o fluxo curto já na cidade.
  const openFor = (location.state as { openWizardFor?: string } | null)?.openWizardFor ?? null;
  const [planning, setPlanning] = useState<boolean>(Boolean(openFor));
  useEffect(() => { if (openFor) setPlanning(true); }, [openFor]);
  // C.10: o "➕" (e a aba sem viagem) abre as duas portas; o fluxo curto é a porta 🧭.
  const [doors, setDoors] = useState(false);

  // Prefill do KINU AI: o assistente completo, por cima da aba.
  const [wizardOpen, setWizardOpen] = useState(false);
  useEffect(() => { if (wizardPrefill) setWizardOpen(true); }, [wizardPrefill]);

  const [openId, setOpenId] = useState<string | null>(null);
  const exitTrip = useCallback(() => navigate('/inicio', { replace: true }), [navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  if (tripId) return <Viagens tripId={tripId} onExit={exitTrip} />;

  if (wizardOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <NewPlanningWizard onCancel={() => setWizardOpen(false)} />
      </div>
    );
  }

  const ordered = orderTrips(trips);

  // Sem viagem (ou pelo "➕") a aba mostra as duas portas; Clã (openFor) e ?guia=1 vão direto ao fluxo curto.
  const backToList = ordered.length > 0
    ? () => { setPlanning(false); setDoors(false); if (forceGuide) navigate('/inicio', { replace: true }); }
    : undefined;
  if (forceGuide || planning) {
    return (
      <>
        <FirstTripFlow
          userId={user.id}
          homeCity={prefs.home_city}
          initialCity={openFor}
          onBack={backToList ?? (openFor || forceGuide ? undefined : () => setPlanning(false))}
          backLabel={backToList ? undefined : 'Voltar'}
        />
        <BottomNav />
      </>
    );
  }
  if (ordered.length === 0 || doors) {
    return (
      <>
        <PlanDoors onInterface={() => setPlanning(true)} onAgent={openPlanning} onBack={backToList} />
        <BottomNav />
      </>
    );
  }

  const handleDelete = (t: StoredTrip) => {
    deleteTrip(t.id);
    setOpenId(null);
    toast({ title: 'Viagem excluída 🗑️', description: `${t.destination} saiu da sua lista.` });
  };

  const firstName = (user.name || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-background pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-28">
      {debugMode && (
        <Suspense fallback={null}>
          <ApiStatus />
        </Suspense>
      )}
      <main className="px-4 pt-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground font-['Outfit']">{firstName ? `Olá, ${firstName}!` : 'Olá!'}</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="inicio-estado">{statusLine(ordered)}</p>

        <ul className="mt-5 space-y-2">
          {ordered.map((t) => (
            <li key={t.id} className="space-y-1">
              {ACTIVE.has(String(t.status)) && (
                <CheckinBanner trip={t} compact onOpen={() => navigate(`/inicio?trip=${t.id}`)} />
              )}
              <TripLinha
                trip={t}
                open={openId === t.id}
                onToggle={() => setOpenId((cur) => (cur === t.id ? null : t.id))}
                onOpenTrip={() => navigate(`/inicio?trip=${t.id}`)}
                onDelete={() => handleDelete(t)}
              />
            </li>
          ))}
          <li>
            <button onClick={() => setDoors(true)}
              className="w-full flex items-center justify-between min-h-[44px] px-3 rounded-xl border border-dashed border-border text-sm text-foreground hover:border-primary/40">
              <span>➕ Planejar nova viagem</span>
              <span className="text-primary">▸</span>
            </button>
          </li>
        </ul>

        <ViagensVividas trips={trips} />
      </main>
      <BottomNav />
    </div>
  );
};

export default Inicio;
