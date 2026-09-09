// DraftCockpit — Draft trip editing interface with 3-stage flow:
// Stage 1: Flight Selection → Stage 2: Generated Itinerary → Stage 3: Active Trip
// UI stepper reflects the two in-cockpit stages: flights and itinerary.

import { useState, useCallback, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { FlightSelectionStage, FlightOption, SelectedFlight } from './FlightSelectionStage';
import { GeneratedItineraryStage } from './GeneratedItineraryStage';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { applyHotelSwap, type SwapTripLike, type AccommodationLike } from '@/lib/hotelSwap';
import type { StoredTrip } from '@/lib/tripStore';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';
import { HintBalloon } from '@/components/onboarding/HintBalloon';

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
  onActivate: (trip: DraftTrip) => void;
  onClose: () => void;
  /** Mesmo contrato do TripPanel: read-modify-write do storage, não da cópia React. */
  onUpdateTrip?: (updater: (t: StoredTrip) => StoredTrip) => void;
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

// Convert a planned flight (as created by buildDraftTrip) into a SelectedFlight
// so the itinerary summary stage can render for KINU-created trips.
function plannedFlightToSelected(flight: any, date: Date): SelectedFlight {
  const route = `${flight.origin} → ${flight.destination}`;
  const duration = flight.duration || '0h';
  const durationMinutes = (() => {
    const m = duration.match(/(\d+)h\s*(\d+)?/);
    if (!m) return 0;
    const hours = parseInt(m[1], 10) || 0;
    const minutes = parseInt(m[2], 10) || 0;
    return hours * 60 + minutes;
  })();

  const option: FlightOption = {
    id: flight.id,
    airline: flight.airline,
    route,
    isDirect: flight.stops === 0,
    duration,
    durationMinutes,
    price: flight.price,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    segments: [{
      departure: { iataCode: flight.origin, at: flight.departureDate },
      arrival: { iataCode: flight.destination, at: flight.arrivalDate },
    }],
  };

  return { option, date };
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
    subtitle: 'Escolha os voos de ida e volta',
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
        <HintBalloon
          area="draft_cockpit"
          arrow="up"
          text="Sua trilha: toque numa etapa para voltar a ela."
        />
      </div>
    </div>
  );
};

export const DraftCockpit = ({ trip, onSave, onActivate, onClose, onUpdateTrip }: DraftCockpitProps) => {
  // KINU-created trips arrive with a pre-generated itinerary, so we jump straight
  // to the itinerary summary stage while keeping the flight stage reachable.
  const isKinuCreated = (trip as any).createdVia === 'kinu';

  const [stage, setStage] = useState<'flights' | 'itinerary'>(() => 
    (trip.flightsSelected || isKinuCreated) ? 'itinerary' : 'flights'
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
  const [generatedDays, setGeneratedDays] = useState<any[] | null>(null);
  const [hotelSwapOpen, setHotelSwapOpen] = useState(false);

  // If the trip already carries a complete generated itinerary (from the wizard /
  // createTrip), we hand it off to GeneratedItineraryStage as `existingDays` and
  // preserve its original shape on activate — never overwriting with a re-generated one.
  const totalDaysExpected =
    trip.totalDays ||
    (Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1);
  const hasExistingDays = Array.isArray(trip.days)
    && trip.days.length === totalDaysExpected
    && trip.days.every((d: any) => Array.isArray(d?.activities) && d.activities.length > 0);

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

  const handleFlightsSelected = useCallback((outbound: SelectedFlight, returnFlight: SelectedFlight) => {
    setSelectedOutbound(outbound);
    setSelectedReturn(returnFlight);

    // Update trip with selected flights + sync finances.planned so the flight
    // anchor matches the actual Amadeus price shown in the hero card.
    const updatedTrip: any = {
      ...trip,
      flightsSelected: true,
      outboundFlight: outbound,
      returnFlight: returnFlight,
    };
    syncTripFlightPlannedFinances(updatedTrip);

    onSave(updatedTrip);
    setStage('itinerary');
    
    toast({
      title: "Voos selecionados! ✈️",
      description: "Gerando seu roteiro inteligente...",
    });
  }, [trip, onSave]);

  const handleSave = useCallback((daysFromStage?: any[], bucketsFromStage?: { flightsPlanned: number; hotelPlanned: number; foodPlanned: number; toursPlanned: number; totalPlanned: number }) => {
    const nextDays = daysFromStage && daysFromStage.length > 0
      ? daysFromStage
      : (generatedDays && generatedDays.length > 0 ? generatedDays : trip.days);
    const updatedTrip: any = {
      ...trip,
      flightsSelected: stage === 'itinerary',
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
      days: nextDays,
    };
    syncTripFlightPlannedFinances(updatedTrip);
    if (bucketsFromStage) {
      const prev = updatedTrip.finances || {};
      const prevCats = prev.categories || {};
      const keep = (n: string) => ({ confirmed: prevCats[n]?.confirmed || 0, bidding: prevCats[n]?.bidding || 0 });
      const flightsPlanned = bucketsFromStage.flightsPlanned > 0
        ? bucketsFromStage.flightsPlanned
        : (prevCats.flights?.planned || 0);
      const planned = flightsPlanned + bucketsFromStage.hotelPlanned + bucketsFromStage.toursPlanned + bucketsFromStage.foodPlanned;
      const total = updatedTrip.budget || prev.total || planned;
      const confirmed = prev.confirmed || 0;
      const bidding = prev.bidding || 0;
      updatedTrip.finances = {
        total, confirmed, bidding, planned,
        available: total - planned - confirmed,
        categories: {
          flights: { ...keep('flights'), planned: flightsPlanned },
          accommodation: { ...keep('accommodation'), planned: bucketsFromStage.hotelPlanned },
          tours: { ...keep('tours'), planned: bucketsFromStage.toursPlanned },
          food: { ...keep('food'), planned: bucketsFromStage.foodPlanned },
          transport: keep('transport'),
          shopping: keep('shopping'),
        },
      };
    }
    onSave(updatedTrip);
    toast({ title: "Rascunho salvo! 📝" });
  }, [trip, stage, selectedOutbound, selectedReturn, generatedDays, onSave]);

  // For KINU-created drafts (or drafts that already carry a full generated itinerary),
  // the itinerary stage is reachable without a real Amadeus flight selection —
  // we synthesize placeholder SelectedFlights from the trip's planned data.
  const canSkipFlightSelection = isKinuCreated || hasExistingDays;

  const buildPlaceholderFlight = useCallback((date: Date, direction: 'outbound' | 'return'): SelectedFlight => {
    const isOutbound = direction === 'outbound';
    const from = isOutbound ? originCode : destinationCode;
    const to = isOutbound ? destinationCode : originCode;
    const iso = date.toISOString();
    const option: FlightOption = {
      id: `placeholder-${direction}`,
      airline: 'A definir',
      route: `${from} → ${to}`,
      isDirect: trip.hasDirectFlight ?? true,
      duration: '0h',
      durationMinutes: 0,
      price: 0,
      departureTime: '--:--',
      arrivalTime: '--:--',
      segments: [{
        departure: { iataCode: from, at: iso },
        arrival: { iataCode: to, at: iso },
      }],
    };
    return { option, date };
  }, [originCode, destinationCode, trip.hasDirectFlight]);

  const effectiveOutbound = selectedOutbound
    || (canSkipFlightSelection ? buildPlaceholderFlight(new Date(trip.startDate), 'outbound') : undefined);
  const effectiveReturn = selectedReturn
    || (canSkipFlightSelection ? buildPlaceholderFlight(new Date(trip.endDate), 'return') : undefined);

  const handleActivate = useCallback((daysFromStage?: any[], bucketsFromStage?: { flightsPlanned: number; hotelPlanned: number; foodPlanned: number; toursPlanned: number; totalPlanned: number }) => {
    if ((!effectiveOutbound || !effectiveReturn) && !canSkipFlightSelection) {
      toast({ 
        title: "Selecione os voos primeiro", 
        description: "Você precisa definir ida e volta antes de ativar.",
        variant: "destructive" 
      });
      return;
    }

    // Prefer the days the itinerary stage just displayed (source of truth),
    // falling back to previously generated days, then the trip's own days.
    const nextDays = daysFromStage && daysFromStage.length > 0
      ? daysFromStage
      : (generatedDays && generatedDays.length > 0 ? generatedDays : trip.days);

    const updatedTrip: any = {
      ...trip,
      status: 'active',
      flightsSelected: Boolean(selectedOutbound && selectedReturn),
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
      days: nextDays,
    };
    syncTripFlightPlannedFinances(updatedTrip);
    if (bucketsFromStage) {
      const prev = updatedTrip.finances || {};
      const prevCats = prev.categories || {};
      const keep = (n: string) => ({ confirmed: prevCats[n]?.confirmed || 0, bidding: prevCats[n]?.bidding || 0 });
      const flightsPlanned = bucketsFromStage.flightsPlanned > 0
        ? bucketsFromStage.flightsPlanned
        : (prevCats.flights?.planned || 0);
      const planned = flightsPlanned + bucketsFromStage.hotelPlanned + bucketsFromStage.toursPlanned + bucketsFromStage.foodPlanned;
      const total = updatedTrip.budget || prev.total || planned;
      const confirmed = prev.confirmed || 0;
      const bidding = prev.bidding || 0;
      updatedTrip.finances = {
        total, confirmed, bidding, planned,
        available: total - planned - confirmed,
        categories: {
          flights: { ...keep('flights'), planned: flightsPlanned },
          accommodation: { ...keep('accommodation'), planned: bucketsFromStage.hotelPlanned },
          tours: { ...keep('tours'), planned: bucketsFromStage.toursPlanned },
          food: { ...keep('food'), planned: bucketsFromStage.foodPlanned },
          transport: keep('transport'),
          shopping: keep('shopping'),
        },
      };
    }

    onActivate(updatedTrip as any);
    toast({ title: "Viagem ativada! 🚀", description: "Sua viagem está pronta para acompanhamento." });
  }, [trip, selectedOutbound, selectedReturn, effectiveOutbound, effectiveReturn, canSkipFlightSelection, generatedDays, onActivate]);

  const handleBackFromItinerary = useCallback(() => {
    setStage('flights');
  }, []);

  const tierToPriceLevel = { backpacker: 'budget', economic: 'budget', comfort: 'midrange', luxury: 'luxury' } as const;
  const chosenPriceLevel = trip.budgetType ? tierToPriceLevel[trip.budgetType] : undefined;

  // Stage 1: Flight Selection
  // Troca de hotel no rascunho. Mesmo modal e mesma persistência da viagem ativa:
  // um só caminho de escrita para os dois estados da viagem.
  const hotelSwapModal = (
    <HotelSwapModal
      open={hotelSwapOpen}
      onClose={() => setHotelSwapOpen(false)}
      trip={trip as SwapTripLike}
      onSelect={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
    />
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
  if (stage === 'itinerary' && effectiveOutbound && effectiveReturn) {
    return (
      <>
        <DraftStepper trip={trip} currentStage={stage} onChange={setStage} onSwapHotel={() => setHotelSwapOpen(true)} />
      {hotelSwapModal}
        <GeneratedItineraryStage
          tripId={trip.id}
          destination={trip.destination}
          origin={trip.origin || 'São Paulo'}
          emoji={emoji}
          departureDate={new Date(trip.startDate)}
          returnDate={new Date(trip.endDate)}
          budget={trip.budget}
          travelers={getTravelers(trip)}
          outboundFlight={effectiveOutbound}
          returnFlight={effectiveReturn}
          travelInterests={trip.travelInterests}
          jetLagSeverity={trip.jetLagSeverity}
          priceLevel={chosenPriceLevel}
          onActivate={handleActivate}
          onSave={handleSave}
          onBack={handleBackFromItinerary}
          onDaysGenerated={hasExistingDays ? undefined : setGeneratedDays}
          existingDays={hasExistingDays ? trip.days : undefined}
          hotelPlannedOverride={curatedHotelPlanned}
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
