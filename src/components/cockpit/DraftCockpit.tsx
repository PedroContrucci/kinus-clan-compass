// DraftCockpit — o rascunho é uma lista de blocos (C.2): o card "O que o KINU fez" com uma
// linha por escolha (ícone · porquê · ação). Hotel, voo e roteiro só aparecem ao tocar
// "trocar"/"ver", como painel abaixo da linha; o Ativar do card é o único da tela.

import { budgetFollowsPlan, planBreakdown, envelopeFor, reserveFor } from '@/lib/planTotals';
import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FlightSelectionStage, SelectedFlight } from './FlightSelectionStage';
import { GeneratedItineraryStage } from './GeneratedItineraryStage';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { HotelPlanBlock } from '@/components/hotel/HotelPlanBlock';
import { applyHotelSwap, type SwapTripLike, type AccommodationLike } from '@/lib/hotelSwap';
import type { StoredTrip } from '@/lib/tripStore';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';
import { isKinuBuilt } from '@/lib/kinuBuilt';
import { plannedFlightToSelected, offerToSelected, writeFlightsThrough, estimateOf } from '@/lib/flightModel';
import { pickBest, explainPick, flightSearchKey, shouldAutoSearch, type KinuFlightSearch } from '@/lib/flightRanking';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { buildItineraryForTrip, countManualEdits, itemIdsOf } from '@/lib/draftItinerary';
import { replanTrip, unplacedMessage, type UnplacedEdit } from '@/lib/replanItinerary';
import { KinuDidCard, type KinuDidRow } from '@/components/onboarding/KinuDidCard';
import { KinuAnalysisCard } from './KinuAnalysisCard';
import { analysisSummary, tryPlaceUnplaced } from '@/lib/cockpitLines';
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
  status?: string;
  /** Busca de referência gravada (D2): não repete a chamada a cada abertura. */
  kinuFlightSearch?: KinuFlightSearch;
}

interface DraftCockpitProps {
  trip: DraftTrip;
  onSave: (trip: DraftTrip) => void;
  /** Caminho único (src/lib/activateDraft.ts): só o id; ativa o que está gravado. */
  onActivate: (tripId: string) => void;
  onClose: () => void;
  /** Mesmo contrato do TripPanel: read-modify-write do storage, não da cópia React. */
  onUpdateTrip?: (updater: (t: StoredTrip) => StoredTrip) => void;
  /** Incrementado por fora para abrir o painel Voo. */
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

/** Chip 06 (Voo): diz quem escolheu e por quê; o toque abre a lista ("trocar"). */
// eslint-disable-next-line react-refresh/only-export-components
export function flightPillSubtitle(trip: { outboundFlight?: SelectedFlight; kinuFlightSearch?: KinuFlightSearch }): string {
  const out = trip.outboundFlight;
  if (out?.source === 'confirmed') return 'Voo confirmado';
  if (out?.chosenBy === 'kinu' && out.kinuPick) return `KINU escolheu: ${explainPick(out)} · trocar`;
  if (out?.chosenBy === 'user') return 'Voo escolhido por você · trocar';
  if (trip.kinuFlightSearch?.pending) {
    const best = pickBest(trip.kinuFlightSearch.outbound);
    if (best) return `KINU encontrou: ${explainPick(best)} · aplicar`;
  }
  if (out?.source === 'estimate') return 'Voo estimado · toque para ver preços de referência';
  return 'Escolha os voos de ida e volta';
}

export const DraftCockpit = ({ trip, onSave, onActivate, onClose, onUpdateTrip, openFlightsSignal }: DraftCockpitProps) => {
  // KINU-built trips (KINU AI ou onboarding) arrive with a pre-generated itinerary and an
  // estimated flight; o card mostra as duas e os painéis abrem pela linha.
  const isKinuCreated = isKinuBuilt(trip);

  // Rascunho montado pelo KINU sem voo escolhido: grava a estimativa uma vez (idempotente).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = applyEstimatedFlights(trip as any);
    if (updated !== (trip as unknown)) onSave(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  // Nenhum estágio aberto ao entrar: o card é a tela; painéis abrem pela linha.
  const [openRow, setOpenRow] = useState<KinuDidRow | null>(null);
  const toggleRow = useCallback((row: KinuDidRow) => setOpenRow((cur) => (cur === row ? null : row)), []);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [unplacedOpen, setUnplacedOpen] = useState(false);

  useEffect(() => {
    if (openFlightsSignal) setOpenRow('flight');
  }, [openFlightsSignal]);

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

  // `preserveEdits` (troca de perna, R-V11): edições reaplicadas; as que não cabem voltam
  // para o aviso e ficam em `unplacedEdits`. Sem ele ("Regerar roteiro"), do zero.
  const regenerateWith = useCallback((outbound: SelectedFlight, returnFlight: SelectedFlight, extra: Record<string, unknown> = {}, opts: { preserveEdits?: boolean } = {}): UnplacedEdit[] => {
    // Write-through (R-V12): outboundFlight/returnFlight, trip.flights.* e finanças do mesmo objeto.
    const withFlights = writeFlightsThrough({ ...trip, ...extra } as DraftTrip & Record<string, unknown>, outbound, returnFlight);
    const legs = { outbound, return: returnFlight };
    const built = opts.preserveEdits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? replanTrip(withFlights as any, legs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : { ...buildItineraryForTrip(withFlights as any, legs), unplaced: [] as UnplacedEdit[] };
    onSave({
      ...withFlights,
      days: built.days,
      budget: built.budget,
      finances: built.finances,
      engineItemIds: built.engineItemIds,
      unplacedEdits: built.unplaced,
    } as DraftTrip);
    setRegenKey((k) => k + 1);
    return built.unplaced;
  }, [trip, onSave]);

  /** Aviso da troca de perna: o que não coube, nunca silêncio. */
  const toastReplanned = useCallback((unplaced: UnplacedEdit[], title: string) => {
    const msg = unplacedMessage(unplaced);
    toast(msg ?? { title, description: 'Roteiro refeito com os horários do voo.' });
  }, []);

  /** Só pergunta quando há trocas manuais; sem trocas, executa direto. */
  const confirmIfEdited = useCallback((edits: number, run: () => void) => {
    if (edits > 0) setPendingRegen({ edits, run });
    else run();
  }, []);

  // ─── Busca ao abrir o rascunho (D2) + escolha automática pelo ranking (D3) ───
  const searchKey = flightSearchKey(originCode, destinationCode, trip.startDate, trip.endDate);
  const needSearch = shouldAutoSearch(trip, searchKey);
  const outQ = useFlightSearch(originCode, destinationCode, String(trip.startDate).slice(0, 10), 1, needSearch);
  const retQ = useFlightSearch(destinationCode, originCode, String(trip.endDate).slice(0, 10), 1, needSearch);
  const searchDone = useRef<string | null>(null);
  useEffect(() => {
    if (!needSearch || searchDone.current === searchKey) return;
    if (!outQ.isSuccess || !retQ.isSuccess) return; // erro: não grava, tenta na próxima abertura
    searchDone.current = searchKey;
    const record: KinuFlightSearch = {
      key: searchKey,
      searchedAt: new Date().toISOString(),
      outbound: (outQ.data || []).map(o => offerToSelected(o, { date: new Date(trip.startDate), fromCity: trip.origin || 'São Paulo', toCity: trip.destination })),
      return: (retQ.data || []).map(o => offerToSelected(o, { date: new Date(trip.endDate), fromCity: trip.destination, toCity: trip.origin || 'São Paulo' })),
    };
    const pickOut = pickBest(record.outbound);
    const pickRet = pickBest(record.return);
    const curOut = trip.outboundFlight;
    const curRet = trip.returnFlight;
    if ((!pickOut && !pickRet) || !(pickOut ?? curOut) || !(pickRet ?? curRet)) {
      onSave({ ...trip, kinuFlightSearch: record } as DraftTrip);
      return;
    }
    const edits = countManualEdits((trip as { engineItemIds?: unknown }).engineItemIds, itemIdsOf(trip.days));
    if (edits > 0) {
      // Roteiro editado à mão: não aplica sozinho (R-V11); oferece "KINU encontrou · aplicar".
      onSave({ ...trip, kinuFlightSearch: { ...record, pending: true } } as DraftTrip);
      return;
    }
    const out = (pickOut ?? curOut) as SelectedFlight;
    const ret = (pickRet ?? curRet) as SelectedFlight;
    setSelectedOutbound(out);
    setSelectedReturn(ret);
    regenerateWith(out, ret, { kinuFlightSearch: record });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needSearch, searchKey, outQ.isSuccess, retQ.isSuccess]);

  const applyPendingPick = useCallback(() => {
    const rec = trip.kinuFlightSearch;
    if (!rec) return;
    const out = pickBest(rec.outbound) ?? trip.outboundFlight;
    const ret = pickBest(rec.return) ?? trip.returnFlight;
    if (!out || !ret) return;
    setSelectedOutbound(out);
    setSelectedReturn(ret);
    const unplaced = regenerateWith(out, ret, { kinuFlightSearch: { ...rec, pending: false } }, { preserveEdits: true });
    toastReplanned(unplaced, 'Voo do KINU aplicado ✈️');
  }, [trip, regenerateWith, toastReplanned]);

  // Ofertas para a lista: gravadas (sem nova chamada) ou em busca agora; senão o estágio busca.
  const stageOffers = trip.kinuFlightSearch?.key === searchKey
    ? { outbound: trip.kinuFlightSearch.outbound, return: trip.kinuFlightSearch.return }
    : needSearch && !outQ.isError && !retQ.isError
      ? { outbound: [], return: [], loading: outQ.isLoading || retQ.isLoading }
      : undefined;
  const stageEstimate = estimateOf(trip);
  const stageCurrent = { outbound: trip.outboundFlight, return: trip.returnFlight };
  const pendingPick = trip.kinuFlightSearch?.pending ? pickBest(trip.kinuFlightSearch.outbound) : null;

  const handleFlightsSelected = useCallback((pickedOut: SelectedFlight, pickedRet: SelectedFlight) => {
    // A fonte é a do item escolhido: 'reference' (Travelpayouts) ou 'estimate' (estimativa
    // do KINU / exemplo do legado). Nunca 'amadeus': o nome da fonte é o nome da fonte.
    const outbound: SelectedFlight = { ...pickedOut, source: pickedOut.source ?? 'estimate', chosenBy: 'user' };
    const returnFlight: SelectedFlight = { ...pickedRet, source: pickedRet.source ?? 'estimate', chosenBy: 'user' };
    // Trocar perna replaneja sem apagar (R-V11): sem "desfaz N trocas" aqui.
    setSelectedOutbound(outbound);
    setSelectedReturn(returnFlight);
    const unplaced = regenerateWith(outbound, returnFlight, { flightsSelected: true }, { preserveEdits: true });
    // Volta pro card com a linha do voo atualizada — nunca pra lista de Viagens.
    setOpenRow(null);
    toastReplanned(unplaced, 'Voos selecionados! ✈️');
  }, [regenerateWith, toastReplanned]);

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

  // "tentar encaixar": mesma janela R16 do motor; o que não cabe fica em unplacedEdits.
  const handleTryPlace = useCallback(() => {
    let res: ReturnType<typeof tryPlaceUnplaced> | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apply = (t: any) => { res = tryPlaceUnplaced(t); return res.trip; };
    if (onUpdateTrip) onUpdateTrip(apply as (t: StoredTrip) => StoredTrip);
    else onSave(apply(trip) as DraftTrip);
    const r = res as ReturnType<typeof tryPlaceUnplaced> | null;
    if (!r) return;
    if (r.placed.length) setRegenKey((k) => k + 1);
    toast(r.left.length
      ? { title: `${r.left.length} ${r.left.length === 1 ? 'item não coube' : 'itens não couberam'}`, description: `Fora da janela do dia: ${r.left.map((u) => u.name).join(', ')}.` }
      : { title: 'Itens encaixados', description: `${r.placed.length} de volta ao roteiro.` });
  }, [trip, onSave, onUpdateTrip]);

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
    {pendingPick && (
      <div className="mx-4 mt-3 p-3 rounded-xl border border-primary/40 bg-primary/10 text-sm flex items-center justify-between gap-3">
        <span className="text-foreground">KINU encontrou: {explainPick(pendingPick)}</span>
        <button type="button" onClick={applyPendingPick} className="text-primary font-medium hover:underline shrink-0">aplicar</button>
      </div>
    )}
    <HotelSwapModal
      open={hotelSwapOpen}
      onClose={() => setHotelSwapOpen(false)}
      trip={trip as SwapTripLike}
      onSelect={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
    />
    </>
  );

  const flightPanel = (
    <FlightSelectionStage
      embedded
      key={`${trip.outboundFlight?.option?.id ?? 'none'}|${trip.returnFlight?.option?.id ?? 'none'}`}
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
      onBack={() => setOpenRow(null)}
      estimate={stageEstimate}
      current={stageCurrent}
      offers={stageOffers}
    />
  );

  const itineraryPanel = selectedOutbound && selectedReturn ? (
    <GeneratedItineraryStage
      embedded
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
      onBack={() => setOpenRow(null)}
      existingDays={hasExistingDays ? trip.days : undefined}
      hotelPlannedOverride={curatedHotelPlanned}
      budgetFollowsPlan={budgetFollowsPlan(trip)}
      plannedFlights={(trip as { finances?: { categories?: { flights?: { planned?: number } } } }).finances?.categories?.flights?.planned}
      plannedHotel={(trip as { finances?: { categories?: { accommodation?: { planned?: number } } } }).finances?.categories?.accommodation?.planned}
      financeBuckets={financeBucketsOf(trip)}
      engineItemIds={(trip as { engineItemIds?: string[] }).engineItemIds}
      onRegenerate={handleRegenerate}
    />
  ) : (
    <p className="text-xs text-muted-foreground p-2">Escolha os voos de ida e volta para montar o roteiro.</p>
  );

  // O hotel no rascunho: mesmo bloco da viagem ativa, com o porquê e a porta de saída.
  const hotelPanel = trip.accommodation?.name ? (
    <HotelPlanBlock
      trip={trip as SwapTripLike}
      onSelectHotel={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
    />
  ) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = planBreakdown(trip as any);
  const follows = budgetFollowsPlan(trip);
  const rawUnplaced = (trip as unknown as { unplacedEdits?: unknown }).unplacedEdits;
  const unplacedList: UnplacedEdit[] = Array.isArray(rawUnplaced) ? rawUnplaced : [];

  const extraRows = (
    <>
      <div className="text-sm">
        <button type="button" onClick={() => setAnalysisOpen((v) => !v)} aria-expanded={analysisOpen}
          className="w-full flex items-start gap-2 text-left text-foreground">
          <span>🧠</span>
          <span className="flex-1">{analysisSummary(trip)}</span>
          <span className="shrink-0 text-primary text-xs">{analysisOpen ? '▾' : '▸'}</span>
        </button>
        {analysisOpen && (
          <div className="mt-2">
            <KinuAnalysisCard
              destination={trip.destination}
              departureDate={new Date(trip.startDate)}
              returnDate={new Date(trip.endDate)}
              budget={follows ? envelopeFor(plan.total) : trip.budget}
              reserveAmount={follows ? reserveFor(plan.total) : undefined}
              flightsCost={plan.flights}
              hotelCost={plan.hotel}
              toursCost={plan.tours}
              foodCost={plan.food}
              travelInterests={trip.travelInterests}
              jetLagSeverity={trip.jetLagSeverity}
            />
          </div>
        )}
      </div>
      {unplacedList.length > 0 && (
        <div className="text-sm" data-testid="unplaced-row">
          <button type="button" onClick={() => setUnplacedOpen((v) => !v)} aria-expanded={unplacedOpen}
            className="w-full flex items-start gap-2 text-left text-foreground">
            <span>📌</span>
            <span className="flex-1">{unplacedList.length} {unplacedList.length === 1 ? 'item seu não coube' : 'itens seus não couberam'}</span>
            <span className="shrink-0 text-primary text-xs">{unplacedOpen ? '▾' : '▸'}</span>
          </button>
          {unplacedOpen && (
            <div className="mt-2 ml-6 space-y-1">
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {unplacedList.map((u) => <li key={`${u.id}-${u.day}`}>{u.name} · dia {u.day}</li>)}
              </ul>
              <button type="button" onClick={handleTryPlace} className="text-primary text-xs font-medium hover:underline">tentar encaixar</button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 px-4 pt-3">
        <button type="button" onClick={onClose} aria-label="voltar para Viagens" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <span className="text-xl">{emoji}</span>
        <h1 className="font-bold text-lg font-['Outfit'] text-foreground">{trip.destination}</h1>
      </div>
      {hotelSwapModal}
      <KinuDidCard
        trip={trip}
        onActivate={handleActivate}
        onUpdateTrip={(u) => onUpdateTrip?.(u)}
        panels={{ hotel: hotelPanel, flight: flightPanel, itinerary: itineraryPanel }}
        openRow={openRow}
        onToggleRow={toggleRow}
        extraRows={extraRows}
      />
    </div>
  );
};

export default DraftCockpit;
