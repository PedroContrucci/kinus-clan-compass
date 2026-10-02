// DraftCockpit — Draft trip editing interface with 3-stage flow:
// Stage 1: Flight Selection → Stage 2: Generated Itinerary → Stage 3: Active Trip
// UI stepper reflects the two in-cockpit stages: flights and itinerary.

import { budgetFollowsPlan, planBreakdown } from '@/lib/planTotals';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { FlightSelectionStage, SelectedFlight } from './FlightSelectionStage';
import { GeneratedItineraryStage } from './GeneratedItineraryStage';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { HotelPlanBlock } from '@/components/hotel/HotelPlanBlock';
import { applyHotelSwap, type SwapTripLike, type AccommodationLike } from '@/lib/hotelSwap';
import type { StoredTrip } from '@/lib/tripStore';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';
import { isKinuBuilt } from '@/lib/kinuBuilt';
import { plannedFlightToSelected } from '@/lib/flightModel';
import { buildItineraryForTrip, countManualEdits, itemIdsOf } from '@/lib/draftItinerary';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Types
interface DraftTrip {
  id: string;
  destination: string;
  origin: string;
  emoji: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  priorities: string[];
  travelInterests?: string[];
  biologyAIEnabled?: boolean;
  hasDirectFlight?: boolean;
  connections?: string[];
  jetLagSeverity?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  totalDays: number;
  originAirportCode?: string;
  destinationAirportCode?: string;
  flightsSelected?: boolean;
  outboundFlight?: SelectedFlight;
  returnFlight?: SelectedFlight;
  budgetType?: 'backpacker' | 'economic' | 'comfort' | 'luxury';
  /** Inclui o `curatedHotelId` que gerador e troca gravam por fora do tipo (recon §4.6). */
  accommodation?: AccommodationLike;
  days?: any[];
  createdVia?: string;
  flights?: any;
}

interface DraftCockpitProps {
  trip: DraftTrip;
  onSave: (trip: DraftTrip) => void;
  /** Caminho único (src/lib/activateDraft.ts): só o id; ativa o que está gravado. */
  onActivate: (tripId: string) => void;
  onClose: () => void;
  /** Mesmo contrato do TripPanel: read-modify-write do storage, não da cópia React. */
  onUpdateTrip?: (updater: (t: StoredTrip) => StoredTrip) => void;
  /** Incrementado por fora (card "O que o KINU fez") para abrir o passo Voo. */
  openFlightsSignal?: number;
}

function getTravelers(trip: DraftTrip): number {
  return trip.travelers || 1;
}

// Infer airport codes from city names
export function inferAirportCode(city: string): string {
  const codeMap: Record<string, string> = {
    'São Paulo': 'GRU',
    'Rio de Janeiro': 'GIG',
    'Paris': 'CDG',
    'Tóquio': 'NRT',
    'Tokyo': 'NRT',
    'Londres': 'LHR',
    'London': 'LHR',
    'Nova York': 'JFK',
    'New York': 'JFK',
    'Lisboa': 'LIS',
    'Barcelona': 'BCN',
    'Roma': 'FCO',
    'Bangkok': 'BKK',
    'Dubai': 'DXB',
    'Cidade do México': 'MEX',
    'Lima': 'LIM',
    'Buenos Aires': 'EZE',
    'Santiago': 'SCL',
    'Florianópolis': 'FLN',
    'Salvador': 'SSA',
    'Recife': 'REC',
    'Fortaleza': 'FOR',
    'Manaus': 'MAO',
    'Brasília': 'BSB',
    'Curitiba': 'CWB',
    'Porto Alegre': 'POA',
    'Natal': 'NAT',
    'Maceió': 'MCZ',
    'Montevidéu': 'MVD',
    'Cartagena': 'CTG',
    'Cusco': 'CUZ',
    'Bariloche': 'BRC',
    'Havana': 'HAV',
  };
  
  return codeMap[city] || city.substring(0, 3).toUpperCase();
}

// plannedFlightToSelected mora em src/lib/flightModel.ts; reexport para quem importava daqui.
// eslint-disable-next-line react-refresh/only-export-components
export { plannedFlightToSelected };

/**
 * Viagem montada pelo KINU sem voo escolhido: grava a estimativa do gerador como
 * ida/volta selecionadas (source 'estimate') e sincroniza o orçamento de voos.
 * Idempotente: viagem que já tem `outboundFlight` volta intacta (mesmo objeto).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyEstimatedFlights<T extends Record<string, any>>(trip: T): T {
  if (!isKinuBuilt(trip) || trip.outboundFlight || !trip.flights?.outbound || !trip.flights?.return) return trip;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated: any = {
    ...trip,
    outboundFlight: plannedFlightToSelected(trip.flights.outbound, new Date(trip.startDate)),
    returnFlight: plannedFlightToSelected(trip.flights.return, new Date(trip.endDate)),
  };
  if (updated.finances) {
    updated.finances = {
      ...updated.finances,
      categories: { ...updated.finances.categories, flights: { ...updated.finances.categories?.flights } },
    };
  }
  syncTripFlightPlannedFinances(updated);
  return updated;
}

/** Os 4 baldes de trip.finances (mesma leitura do card "O que o KINU fez"). */
// eslint-disable-next-line react-refresh/only-export-components, @typescript-eslint/no-explicit-any
export function financeBucketsOf(trip: any) {
  if (!trip?.finances?.categories) return undefined;
  const p = planBreakdown(trip);
  return { flightsPlanned: p.flights, hotelPlanned: p.hotel, foodPlanned: p.food, toursPlanned: p.tours, totalPlanned: p.total };
}

/** Estágio inicial do cockpit: Roteiro para viagens com voo escolhido ou montadas pelo KINU. */
// eslint-disable-next-line react-refresh/only-export-components
export function initialDraftStage(trip: { flightsSelected?: boolean; createdVia?: unknown }): 'flights' | 'itinerary' {
  return trip.flightsSelected || isKinuBuilt(trip) ? 'itinerary' : 'flights';
}

// Get emoji from destination
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯',
    'Tokyo': '🏯',
    'Paris': '🗼',
    'Roma': '🏛️',
    'Lisboa': '🚃',
    'Bangkok': '🛕',
    'Barcelona': '🏖️',
    'Nova York': '🗽',
    'New York': '🗽',
    'Londres': '🎡',
    'London': '🎡',
    'Dubai': '🏗️',
    'Rio de Janeiro': '🏖️',
    'Florianópolis': '🏖️',
    'Salvador': '🎭',
    'Buenos Aires': '💃',
    'Cartagena': '🏰',
    'Cusco': '🏔️',
    'Machu Picchu': '🏔️',
  };
  return emojiMap[destination] || '✈️';
}

// Journey trail: wizard decisions (read-only, done) → hotel → in-cockpit stages.
// Wizard steps in Planejar (NewPlanningWizard): Logística → Viajantes → Budget → Resumo.
// Resumo is a review screen, not a decision — it is not rendered as a pill.
type StepperStageId = 'flights' | 'itinerary';

interface TrailPill {
  id: string;
  label: string;
  subtitle: string;
  state: 'done' | 'current' | 'upcoming';
  stageId?: StepperStageId; // set only for in-cockpit stages (clickable)
  /** Pílula que abre uma ação em vez de mudar de estágio (hoje: trocar hotel). */
  action?: 'swap-hotel';
}

const BUDGET_TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro',
  economic: 'Econômico',
  comfort: 'Conforto',
  luxury: 'Luxo',
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

function buildTrail(trip: DraftTrip, currentStage: StepperStageId): TrailPill[] {
  const pills: TrailPill[] = [];

  // Wizard: Destino
  pills.push({
    id: 'destino',
    label: 'Destino',
    subtitle: trip.destination || '—',
    state: 'done',
  });

  // Wizard: Datas
  const start = formatShortDate(trip.startDate);
  const end = formatShortDate(trip.endDate);
  pills.push({
    id: 'datas',
    label: 'Datas',
    subtitle: start && end ? `${start} – ${end}` : '—',
    state: 'done',
  });

  // Wizard: Viajantes
  const t = getTravelers(trip);
  pills.push({
    id: 'viajantes',
    label: 'Viajantes',
    subtitle: `${t} ${t === 1 ? 'pessoa' : 'pessoas'}`,
    state: 'done',
  });

  // Wizard: Budget
  const tier = trip.budgetType ? BUDGET_TIER_LABELS[trip.budgetType] : null;
  const budgetFmt = trip.budget
    ? `R$ ${Math.round(trip.budget).toLocaleString('pt-BR')}`
    : '';
  pills.push({
    id: 'budget',
    label: 'Budget',
    subtitle: [tier, budgetFmt].filter(Boolean).join(' · ') || '—',
    state: 'done',
  });

  // Hotel: escolhido pelo KINU, mas agora com porta de saída — a pílula abre a
  // troca pelos curados da cidade. Era o único ponto da trilha sem retorno.
  const hotelName = (trip as any).accommodation?.name as string | undefined;
  pills.push({
    id: 'hotel',
    label: 'Hotel',
    subtitle: hotelName
      ? `${hotelName.split('—')[0].trim()} · toque pra trocar`
      : 'O KINU escolhe no roteiro',
    state: hotelName ? 'done' : 'upcoming',
    action: hotelName ? 'swap-hotel' : undefined,
  });

  // In-cockpit stages (unchanged behavior)
  pills.push({
    id: 'flights',
    label: 'Voo',
    subtitle: trip.outboundFlight?.source === 'estimate'
      ? 'Voo estimado · toque para escolher o real'
      : 'Escolha os voos de ida e volta',
    state: currentStage === 'itinerary' ? 'done' : 'current',
    stageId: 'flights',
  });
  pills.push({
    id: 'itinerary',
    label: 'Roteiro',
    subtitle: 'Revise o roteiro e ative a viagem',
    state: currentStage === 'itinerary' ? 'current' : 'upcoming',
    stageId: 'itinerary',
  });

  return pills;
}

interface DraftStepperProps {
  trip: DraftTrip;
  currentStage: StepperStageId;
  onChange: (stage: StepperStageId) => void;
  onSwapHotel?: () => void;
}

const DraftStepper = ({ trip, currentStage, onChange, onSwapHotel }: DraftStepperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPillRef = useRef<HTMLButtonElement>(null);
  const trail = buildTrail(trip, currentStage);

  useEffect(() => {
    if (currentPillRef.current && containerRef.current) {
      currentPillRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentStage]);

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-30 w-full overflow-x-auto bg-background/90 backdrop-blur-md border-b border-border"
    >
      <div className="flex items-center gap-2 px-4 py-3 min-w-max">
        {trail.map((s, index) => {
          const isDone = s.state === 'done';
          const isCurrent = s.state === 'current';
          const isUpcoming = s.state === 'upcoming';
          // Estágios do cockpit seguem como estavam; a pílula de hotel ganha ação própria.
          const clickable = (!!s.stageId && (isCurrent || isDone)) || (s.action === 'swap-hotel' && !!onSwapHotel);
          // Wizard/hotel pills always show their value; stage pills when current.
          const showSubtitle = !s.stageId || isCurrent;

          return (
            <button
              key={s.id}
              ref={isCurrent ? currentPillRef : null}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (!clickable) return;
                if (s.action === 'swap-hotel') return onSwapHotel?.();
                if (s.stageId) onChange(s.stageId);
              }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-full border transition-all",
                "font-['Outfit'] text-sm font-medium",
                isCurrent &&
                  "bg-[hsl(45,93%,47%)] text-[hsl(222,47%,11%)] border-[hsl(45,93%,47%)] shadow-[0_0_12px_hsla(45,93%,47%,0.25)]",
                isDone && s.stageId &&
                  "bg-[hsl(160,84%,39%)]/15 text-[hsl(160,77%,67%)] border-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,39%)]/25",
                isDone && !s.stageId && !s.action &&
                  "bg-[hsl(160,84%,39%)]/10 text-[hsl(160,77%,67%)] border-[hsl(160,84%,39%)]/60 cursor-default",
                isDone && !s.stageId && s.action &&
                  "bg-[hsl(160,84%,39%)]/10 text-[hsl(160,77%,67%)] border-[hsl(160,84%,39%)]/60 hover:bg-[hsl(160,84%,39%)]/25",
                isUpcoming &&
                  "bg-muted/30 text-muted-foreground border-border cursor-not-allowed opacity-70"
              )}
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                {isDone ? (
                  <Check size={14} className="text-[hsl(160,77%,67%)]" />
                ) : (
                  <span className="text-xs opacity-80">{String(index + 1).padStart(2, '0')}</span>
                )}
                {s.label}
              </span>
              {showSubtitle && (
                <span className="text-[10px] leading-tight font-normal text-center max-w-[180px] opacity-90">
                  {s.subtitle}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="px-4 pb-3">
      </div>
    </div>
  );
};

export const DraftCockpit = ({ trip, onSave, onActivate, onClose, onUpdateTrip, openFlightsSignal }: DraftCockpitProps) => {
  // KINU-built trips (KINU AI ou onboarding) arrive with a pre-generated itinerary and an
  // estimated flight, so we jump straight to the itinerary stage; Voo stays reachable.
  const isKinuCreated = isKinuBuilt(trip);

  // Rascunho montado pelo KINU sem voo escolhido: grava a estimativa uma vez (idempotente).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = applyEstimatedFlights(trip as any);
    if (updated !== (trip as unknown)) onSave(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  // "trocar" do voo no card "O que o KINU fez" abre o passo Voo.
  useEffect(() => {
    if (openFlightsSignal) setStage('flights');
  }, [openFlightsSignal]);

  const [stage, setStage] = useState<'flights' | 'itinerary'>(() => initialDraftStage(trip)
  );
  
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlight | undefined>(() => {
    if (trip.outboundFlight) return trip.outboundFlight;
    if (isKinuCreated && trip.flights?.outbound) {
      return plannedFlightToSelected(trip.flights.outbound, new Date(trip.startDate));
    }
    return undefined;
  });
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlight | undefined>(() => {
    if (trip.returnFlight) return trip.returnFlight;
    if (isKinuCreated && trip.flights?.return) {
      return plannedFlightToSelected(trip.flights.return, new Date(trip.endDate));
    }
    return undefined;
  });
  const [hotelSwapOpen, setHotelSwapOpen] = useState(false);

  // If the trip already carries a complete generated itinerary (from the wizard /
  // createTrip), we hand it off to GeneratedItineraryStage as `existingDays` and
  // preserve its original shape on activate — never overwriting with a re-generated one.
  const totalDaysExpected =
    trip.totalDays ||
    (Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1);
  // Rascunho salvo é mostrado como está (nunca regerado no open); "Regerar roteiro" é o único caminho.
  void totalDaysExpected;
  const hasExistingDays = Array.isArray(trip.days)
    && trip.days.length > 0
    && trip.days.some((d: any) => Array.isArray(d?.activities) && d.activities.length > 0);

  // Hospedagem curada manda no bucket de hospedagem. A etapa de roteiro recalcula as
  // finanças no mount a partir da SUA estimativa (getActivityPrice × noites) e, sem
  // este override, ela desfazia em silêncio tanto o hotel curado do gerador quanto o
  // delta de uma troca feita pelo usuário — o "Trocar hotel" desfazendo a si mesmo.
  // Portão no `curatedHotelId`: viagem sem hotel curado não muda um centavo.
  const curatedHotelPlanned = trip.accommodation?.curatedHotelId
    ? Math.round(Number(trip.accommodation.totalPrice) || 0) || undefined
    : undefined;

  // Infer airport codes
  const originCode = trip.originAirportCode || inferAirportCode(trip.origin || 'São Paulo');
  const destinationCode = trip.destinationAirportCode || inferAirportCode(trip.destination);
  const emoji = trip.emoji || getDestinationEmoji(trip.destination);

  // Regerar: motor único com os voos dados → dias + finanças gravados no rascunho.
  // A etapa de roteiro remonta (regenKey) para renderizar os dias novos.
  const [regenKey, setRegenKey] = useState(0);
  const [pendingRegen, setPendingRegen] = useState<{ edits: number; run: () => void } | null>(null);

  const regenerateWith = useCallback((outbound: SelectedFlight, returnFlight: SelectedFlight, extra: Record<string, unknown> = {}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built = buildItineraryForTrip(trip as any, { outbound, return: returnFlight });
    onSave({
      ...trip,
      ...extra,
      outboundFlight: outbound,
      returnFlight,
      days: built.days,
      budget: built.budget,
      finances: built.finances,
      engineItemIds: built.engineItemIds,
    } as DraftTrip);
    setRegenKey((k) => k + 1);
  }, [trip, onSave]);

  /** Só pergunta quando há trocas manuais; sem trocas, executa direto. */
  const confirmIfEdited = useCallback((edits: number, run: () => void) => {
    if (edits > 0) setPendingRegen({ edits, run });
    else run();
  }, []);

  const handleFlightsSelected = useCallback((pickedOut: SelectedFlight, pickedRet: SelectedFlight) => {
    const outbound: SelectedFlight = { ...pickedOut, source: 'amadeus' };
    const returnFlight: SelectedFlight = { ...pickedRet, source: 'amadeus' };
    const edits = countManualEdits((trip as { engineItemIds?: unknown }).engineItemIds, itemIdsOf(trip.days));
    confirmIfEdited(edits, () => {
      setSelectedOutbound(outbound);
      setSelectedReturn(returnFlight);
      regenerateWith(outbound, returnFlight, { flightsSelected: true });
      setStage('itinerary');
      toast({ title: "Voos selecionados! ✈️", description: "Roteiro refeito com os horários do voo." });
    });
  }, [trip, confirmIfEdited, regenerateWith]);

  const handleRegenerate = useCallback((edits: number) => {
    const out = selectedOutbound;
    const ret = selectedReturn;
    if (!out || !ret) return;
    confirmIfEdited(edits, () => {
      regenerateWith(out, ret);
      toast({ title: "Roteiro refeito" });
    });
  }, [selectedOutbound, selectedReturn, confirmIfEdited, regenerateWith]);

  // Salvar e Ativar leem a viagem gravada: toda edição (remover/trocar/adicionar) já
  // escreveu em trip.days via updateTrip, e voos/finanças são gravados na escolha/regeração.
  const handleSave = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedTrip: any = { ...trip };
    syncTripFlightPlannedFinances(updatedTrip);
    onSave(updatedTrip);
    toast({ title: "Rascunho salvo! 📝" });
  }, [trip, onSave]);

  // O cockpit nunca inventa voo: sem ida e volta gravadas (a estimativa conta), a ativação
  // é recusada pelo activateDraft com "Escolha os voos de ida e volta".
  const handleActivate = useCallback(() => {
    onActivate(trip.id);
  }, [trip.id, onActivate]);

  const handleBackFromItinerary = useCallback(() => {
    setStage('flights');
  }, []);

  const tierToPriceLevel = { backpacker: 'budget', economic: 'budget', comfort: 'midrange', luxury: 'luxury' } as const;
  const chosenPriceLevel = trip.budgetType ? tierToPriceLevel[trip.budgetType] : undefined;

  // Stage 1: Flight Selection
  // Troca de hotel no rascunho. Mesmo modal e mesma persistência da viagem ativa:
  // um só caminho de escrita para os dois estados da viagem.
  const regenDialog = (
    <AlertDialog open={!!pendingRegen} onOpenChange={(o) => { if (!o) setPendingRegen(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refazer o roteiro?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso refaz o roteiro e desfaz {pendingRegen?.edits} {pendingRegen?.edits === 1 ? 'troca sua' : 'trocas suas'}. Continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => { const run = pendingRegen?.run; setPendingRegen(null); run?.(); }}>
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const hotelSwapModal = (
    <>
    {regenDialog}
    <HotelSwapModal
      open={hotelSwapOpen}
      onClose={() => setHotelSwapOpen(false)}
      trip={trip as SwapTripLike}
      onSelect={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
    />
    </>
  );

  if (stage === 'flights') {
    return (
      <>
        <DraftStepper trip={trip} currentStage={stage} onChange={setStage} onSwapHotel={() => setHotelSwapOpen(true)} />
      {hotelSwapModal}
        <FlightSelectionStage
          destination={trip.destination}
          origin={trip.origin || 'São Paulo'}
          originCode={originCode}
          destinationCode={destinationCode}
          departureDate={new Date(trip.startDate)}
          returnDate={new Date(trip.endDate)}
          budget={trip.budget}
          emoji={emoji}
          onFlightsSelected={handleFlightsSelected}
          onSave={handleSave}
          onBack={onClose}
        />
      </>
    );
  }

  // Stage 2: Generated Itinerary
  if (stage === 'itinerary' && selectedOutbound && selectedReturn) {
    return (
      <>
        <DraftStepper trip={trip} currentStage={stage} onChange={setStage} onSwapHotel={() => setHotelSwapOpen(true)} />
      {hotelSwapModal}
        {/* O hotel no roteiro do rascunho: mesmo bloco da viagem ativa, com o porquê e a
            porta de saída. Fica ACIMA do estágio de propósito — o gerador não é tocado. */}
        <HotelPlanBlock
          trip={trip as SwapTripLike}
          onSelectHotel={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
        />
        <GeneratedItineraryStage
          key={regenKey}
          tripId={trip.id}
          destination={trip.destination}
          origin={trip.origin || 'São Paulo'}
          emoji={emoji}
          departureDate={new Date(trip.startDate)}
          returnDate={new Date(trip.endDate)}
          budget={trip.budget}
          travelers={getTravelers(trip)}
          outboundFlight={selectedOutbound}
          returnFlight={selectedReturn}
          travelInterests={trip.travelInterests}
          jetLagSeverity={trip.jetLagSeverity}
          priceLevel={chosenPriceLevel}
          onActivate={handleActivate}
          onSave={handleSave}
          onBack={handleBackFromItinerary}
          existingDays={hasExistingDays ? trip.days : undefined}
          hotelPlannedOverride={curatedHotelPlanned}
          budgetFollowsPlan={budgetFollowsPlan(trip)}
          plannedFlights={(trip as { finances?: { categories?: { flights?: { planned?: number } } } }).finances?.categories?.flights?.planned}
          plannedHotel={(trip as { finances?: { categories?: { accommodation?: { planned?: number } } } }).finances?.categories?.accommodation?.planned}
          financeBuckets={financeBucketsOf(trip)}
          engineItemIds={(trip as { engineItemIds?: string[] }).engineItemIds}
          onRegenerate={selectedOutbound && selectedReturn ? handleRegenerate : undefined}
        />
      </>
    );
  }

  // Fallback to flights if no flights selected
  return (
    <>
      <DraftStepper trip={trip} currentStage={stage} onChange={setStage} onSwapHotel={() => setHotelSwapOpen(true)} />
      {hotelSwapModal}
      <FlightSelectionStage
        destination={trip.destination}
        origin={trip.origin || 'São Paulo'}
        originCode={originCode}
        destinationCode={destinationCode}
        departureDate={new Date(trip.startDate)}
        returnDate={new Date(trip.endDate)}
        budget={trip.budget}
        emoji={emoji}
        onFlightsSelected={handleFlightsSelected}
        onSave={handleSave}
        onBack={onClose}
      />
    </>
  );
};

export default DraftCockpit;
