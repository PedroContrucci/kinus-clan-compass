// TripPanel — Orchestrated Executive Dashboard

import { motion } from 'framer-motion';
import { Check, FileText, ChevronDown, ChevronUp, MapPin, ExternalLink, X } from 'lucide-react';
import { WeatherBadge } from './WeatherBadge';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useFlexibleFlightSearch } from '@/hooks/useFlightSearch';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportTripPDF } from '@/lib/tripPdfExport';
import { getIcarusRoteiroInsight, getIcarusHeroFlight, getIcarusHeroHotel, getHermesHotelInsight } from '@/lib/agentMessages';
import { DestinationImage } from '@/components/shared/DestinationImage';
import type { SavedTrip } from '@/types/trip';
import { buildOfferLinks } from '@/lib/offersLinks';
import { OffersModal } from '@/components/cockpit/OffersModal';
import { useState, useEffect, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { getFlightPlannedTotal, getSelectedFlightPlannedTotal } from '@/lib/flightFinance';

const TIER_DESCRIPTIONS: Record<string, string> = {
  backpacker: 'Hostels, street food, tours gratuitos',
  economic: 'Hotels 3★, restaurantes locais, tours em grupo',
  comfort: 'Hotels 4★, restaurantes recomendados, tours privados',
  luxury: 'Hotels 5★, restaurantes Michelin, tours VIP',
};

function CurationSources({ trip }: { trip: SavedTrip }) {
  const [open, setOpen] = useState(false);
  const interests = trip.travelInterests || [];
  const tierLabel = TIER_LABELS[trip.budgetType || 'comfort'] || 'Conforto';
  const tierDesc = TIER_DESCRIPTIONS[trip.budgetType || 'comfort'] || '';
  const hasGastronomy = interests.includes('gastronomy');
  const jetLagHours = trip.timezone?.diff ? Math.abs(trip.timezone.diff) : 0;

  const interestLabels: Record<string, string> = {
    gastronomy: 'Gastronomia', culture: 'Cultura', history: 'História',
    art: 'Arte', adventure: 'Aventura', nature: 'Natureza',
    beach: 'Praia', relaxation: 'Relaxamento', shopping: 'Compras',
    nightlife: 'Vida Noturna', family: 'Família', winter: 'Inverno',
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
        <span>📚 Fontes da curadoria</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-card border border-border rounded-xl p-4 space-y-2.5">
        {interests.length > 0 && (
          <div className="flex items-start gap-2">
            <div className="w-0.5 self-stretch rounded-full bg-emerald-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-400 font-medium">Interesses:</span> {interests.map(i => interestLabels[i] || i).join(', ')}
            </p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="w-0.5 self-stretch rounded-full bg-sky-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-sky-400 font-medium">Base curada KINU:</span> Conde Nast Traveler, Lonely Planet, guias especializados
          </p>
        </div>
        {hasGastronomy && (
          <div className="flex items-start gap-2">
            <div className="w-0.5 self-stretch rounded-full bg-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-400 font-medium">Guia Michelin:</span> restaurantes estrelados para {trip.destination}
            </p>
          </div>
        )}
        {trip.jetLagMode && jetLagHours > 0 && (
          <div className="flex items-start gap-2">
            <div className="w-0.5 self-stretch rounded-full bg-purple-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="text-purple-400 font-medium">Biology AI:</span> fuso de {jetLagHours}h adaptado
            </p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <div className="w-0.5 self-stretch rounded-full bg-violet-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-violet-400 font-medium">Hotel Intelligence:</span> bairro por interesses e orçamento
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-0.5 self-stretch rounded-full bg-green-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-green-400 font-medium">Perfil {tierLabel}:</span> {tierDesc}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface TripPanelProps {
  trip: SavedTrip;
  onConfirm: (
    type: 'flight' | 'hotel',
    amount: number,
    flightDetails?: { outbound?: { airline?: string; flightNumber?: string; departureTime?: string }; return?: { airline?: string; flightNumber?: string; departureTime?: string } },
    hotelDetails?: { name?: string; mealPlan?: string }
  ) => void;
  onUpdateTrip?: (updater: (t: any) => any) => void;
  onUnconfirm?: (type: 'flight' | 'hotel') => void;
  onOpenAuction: (type: 'flight' | 'hotel') => void;
  onNavigateTab: (tab: string, categoryFilter?: string) => void;
  pendingConfirmRequest?: { tipo: 'voo' | 'hotel'; ts: number } | null;
  onPendingConfirmHandled?: () => void;
}


function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

interface PriceSnapshot {
  price: number;
  timestamp: string;
}

function getPriceHistory(tripId: string): PriceSnapshot[] {
  try {
    const raw = localStorage.getItem(`kinu_price_history_${tripId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function savePriceSnapshot(tripId: string, price: number) {
  const history = getPriceHistory(tripId);
  history.push({ price, timestamp: new Date().toISOString() });
  if (history.length > 10) {
    history.shift();
  }
  localStorage.setItem(`kinu_price_history_${tripId}`, JSON.stringify(history));
}

function getPriceChangeInfo(tripId: string): { diff: number; dateStr: string; dropped: boolean } | null {
  const history = getPriceHistory(tripId);
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  if (latest.price === previous.price) return null;
  const diff = Math.abs(latest.price - previous.price);
  const dropped = latest.price < previous.price;
  const dateStr = format(new Date(previous.timestamp), 'dd/MM');
  return { diff, dateStr, dropped };
}

const TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro', economic: 'Econômico', comfort: 'Conforto', luxury: 'Luxo',
};

const AGENTS = {
  icarus: {
    emoji: '🦅',
    name: 'Ícaro',
    gradient: 'from-sky-500/10 to-cyan-500/10',
    border: 'border-sky-500/20',
    accentColor: 'text-sky-400',
  },
  hestia: {
    emoji: '🏛️',
    name: 'Héstia',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    border: 'border-amber-500/20',
    accentColor: 'text-amber-400',
  },
  hermes: {
    emoji: '⚡',
    name: 'Hermes',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    accentColor: 'text-emerald-400',
  },
};

interface OrchestratedAction {
  agent: 'icarus' | 'hestia' | 'hermes';
  priority: number;
  title: string;
  message: string;
  actionType: 'confirm-flight' | 'confirm-hotel' | 'open-auction-flight' | 'open-auction-hotel' | 'navigate-checklist' | 'navigate-cambio' | 'navigate-packing' | 'navigate-roteiro' | 'export-pdf' | 'celebrate';
  actionLabel: string;
  completed: boolean;
}

function getDaysLeft(trip: SavedTrip): number {
  if (!trip.startDate) return 999;
  return differenceInDays(new Date(trip.startDate), new Date());
}

function getChecklistPct(trip: SavedTrip): number {
  const total = trip.checklist?.length || 0;
  const done = trip.checklist?.filter(i => i.checked).length || 0;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function getPendingItems(trip: SavedTrip): string {
  const pending = trip.checklist?.filter(i => !i.checked).slice(0, 2).map(i => i.label) || [];
  return pending.join(', ') || 'itens';
}

function getOrchestratedActions(trip: SavedTrip): OrchestratedAction[] {
  const actions: OrchestratedAction[] = [];
  const dest = trip.destination || 'o destino';
  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';
  const checklistPct = getChecklistPct(trip);
  const daysUntil = getDaysLeft(trip);
  const currency = (trip as any).destinationCurrency || 'USD';
  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || dest;

  // 1. Flight — urgency-based messaging
  if (!flightConfirmed && daysUntil <= 14 && daysUntil > 0) {
    actions.push({
      agent: 'icarus', priority: 1,
      title: 'Comprar voo AGORA',
      message: `Urgente! Faltam apenas ${daysUntil} dias. Precos de voo tendem a subir nas ultimas 2 semanas. Feche agora para garantir!`,
      actionType: 'open-auction-flight', actionLabel: '🎯 Buscar Ofertas Agora', completed: false,
    });
  } else if (!flightConfirmed && daysUntil > 30) {
    actions.push({
      agent: 'icarus', priority: 2,
      title: 'Monitorar preco do voo',
      message: `Faltam ${daysUntil} dias. Historicamente, voos para ${dest} caem de preco 45-60 dias antes. Quer monitorar por 7 dias?`,
      actionType: 'open-auction-flight', actionLabel: '🎯 Monitorar Voos', completed: false,
    });
  } else {
    actions.push({
      agent: 'icarus', priority: flightConfirmed ? 99 : 1,
      title: 'Voo Ida e Volta',
      message: getIcarusHeroFlight(trip, flightConfirmed),
      actionType: flightConfirmed ? 'celebrate' : 'open-auction-flight',
      actionLabel: flightConfirmed ? '✅ Confirmado' : '🎯 Buscar Voos',
      completed: flightConfirmed,
    });
  }

  // 2. Hotel
  actions.push({
    agent: 'icarus', priority: hotelConfirmed ? 99 : (flightConfirmed ? 2 : 3),
    title: 'Hospedagem',
    message: getIcarusHeroHotel(trip, hotelConfirmed),
    actionType: hotelConfirmed ? 'celebrate' : 'open-auction-hotel',
    actionLabel: hotelConfirmed ? '✅ Confirmado' : '🎯 Buscar Hotel',
    completed: hotelConfirmed,
  });

  // 2b. Hermes hotel insight (only when hotel has neighborhood and not confirmed)
  if (trip.accommodation?.neighborhood && !hotelConfirmed) {
    actions.push({
      agent: 'hermes', priority: 6,
      title: 'Dica de Hospedagem',
      message: getHermesHotelInsight(trip),
      actionType: 'navigate-roteiro',
      actionLabel: '📍 Ver Roteiro',
      completed: false,
    });
  }

  // 3. Câmbio (Héstia)
  const volatileCurrencies = ['ARS', 'TRY', 'EGP'];
  const destCurrency = (trip as any).destinationCurrency || '';
  if (volatileCurrencies.includes(destCurrency)) {
    actions.push({
      agent: 'hestia', priority: 3,
      title: 'Câmbio instável',
      message: `A moeda do destino (${destCurrency}) tem alta volatilidade. Considere levar USD como backup e comprar moeda local gradualmente.`,
      actionType: 'navigate-cambio', actionLabel: '💱 Ver Câmbio', completed: false,
    });
  } else {
    actions.push({
      agent: 'hestia', priority: flightConfirmed && hotelConfirmed ? 3 : 5,
      title: 'Câmbio',
      message: `Comece a comprar ${currency} aos poucos. Diluir o câmbio reduz o risco.`,
      actionType: 'navigate-cambio', actionLabel: '💱 Ver Câmbio', completed: false,
    });
  }

  // 4. Checklist (Hermes)
  actions.push({
    agent: 'hermes', priority: checklistPct === 100 ? 99 : (daysUntil <= 14 ? 2 : 4),
    title: 'Preparação',
    message: checklistPct === 100
      ? `Tudo pronto! Você está preparado para ${dest}!`
      : checklistPct > 50
        ? `Checklist em ${checklistPct}%. Faltam: ${getPendingItems(trip)}`
        : `Muita coisa pendente! Comece pelo passaporte e seguro viagem.`,
    actionType: checklistPct === 100 ? 'celebrate' : 'navigate-checklist',
    actionLabel: checklistPct === 100 ? '✅ Tudo Pronto' : '✅ Ver Checklist',
    completed: checklistPct === 100,
  });

  // 5. Gastronomy suggestion
  const gastroDay = trip.days?.find(d => d.title?.toLowerCase().includes('gastro'));
  if (gastroDay) {
    const hasMichelin = gastroDay.activities?.some(a => a.name?.toLowerCase().includes('michelin'));
    if (!hasMichelin) {
      actions.push({
        agent: 'icarus', priority: 40,
        title: 'Experiência Gastronômica',
        message: `No Dia ${gastroDay.day} (${gastroDay.title}), considere trocar um restaurante por um Michelin local. A diferença de preço pode valer a experiência!`,
        actionType: 'navigate-roteiro', actionLabel: '📋 Ver no Roteiro', completed: false,
      });
    }
  }

  // 6. Early booking reminder
  if (daysUntil > 7 && daysUntil < 30 && flightConfirmed) {
    actions.push({
      agent: 'hermes', priority: 50,
      title: 'Reserve passeios populares',
      message: `Faltam ${daysUntil} dias. Passeios populares em ${dest} costumam esgotar. Confirme os principais no roteiro!`,
      actionType: 'navigate-roteiro', actionLabel: '📋 Ver Roteiro', completed: false,
    });
  }

  // 7. Smart Packing
  if (checklistPct > 50) {
    actions.push({
      agent: 'hermes', priority: 6,
      title: 'Mala Inteligente',
      message: `Hora de montar a mala! Vou te ajudar com base no clima de ${dest}.`,
      actionType: 'navigate-packing', actionLabel: '🧳 Montar Mala', completed: false,
    });
  }

  return actions.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return a.priority - b.priority;
  });
}

const MiniKPI = ({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) => (
  <div className={`flex-1 text-center py-2 rounded-xl ${urgent ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/5 border border-white/5'}`}>
    <p className={`text-sm font-bold font-['Outfit'] ${urgent ? 'text-amber-400' : 'text-foreground'}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const DualProgressKPI = ({ financePct, roteiroPct }: { financePct: number; roteiroPct: number }) => (
  <div className="flex-1 flex flex-col justify-center py-2 px-2 rounded-xl bg-white/5 border border-white/5 text-center">
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] leading-tight">
        <span className="text-muted-foreground">💰 Financeiro</span>
        <span className="font-bold text-foreground font-['Outfit']">{financePct}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${financePct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[10px] leading-tight">
        <span className="text-muted-foreground">📋 Roteiro</span>
        <span className="font-bold text-foreground font-['Outfit']">{roteiroPct}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${roteiroPct}%` }} />
      </div>
    </div>
  </div>
);

// Helper to get destination currency
const DEST_CURRENCY_MAP: Record<string, string> = {
  'paris': 'EUR', 'roma': 'EUR', 'amsterdam': 'EUR', 'barcelona': 'EUR',
  'madri': 'EUR', 'berlim': 'EUR', 'viena': 'EUR', 'atenas': 'EUR',
  'lisboa': 'EUR', 'londres': 'GBP', 'tóquio': 'JPY', 'tokyo': 'JPY',
  'nova york': 'USD', 'miami': 'USD', 'orlando': 'USD', 'los angeles': 'USD',
  'bangkok': 'THB', 'buenos aires': 'ARS', 'santiago': 'CLP',
  'toronto': 'CAD', 'sydney': 'AUD', 'dubai': 'AED', 'seul': 'KRW',
};

function getTripCurrency(dest: string): string {
  const n = dest.toLowerCase().trim();
  return DEST_CURRENCY_MAP[n] || 'USD';
}

export const TripPanel = ({ trip, onConfirm, onUnconfirm, onUpdateTrip, onOpenAuction, onNavigateTab, pendingConfirmRequest, onPendingConfirmHandled }: TripPanelProps) => {
  const [showAllActions, setShowAllActions] = useState(false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [flightResults, setFlightResults] = useState<any[] | null>(null);
  const [searchingFlights, setSearchingFlights] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [showFlexDates, setShowFlexDates] = useState(false);
  const [offersModal, setOffersModal] = useState<{ isOpen: boolean; activityName: string } | null>(null);
  const [confirmReservation, setConfirmReservation] = useState<{ type: 'flight' | 'hotel'; amount: string; link: string; hotelName: string; mealPlan: string; outboundAirline: string; outboundFlightNumber: string; outboundTime: string; returnAirline: string; returnFlightNumber: string; returnTime: string } | null>(null);
  const [editingBaggage, setEditingBaggage] = useState(false);
  const [editingSeat, setEditingSeat] = useState(false);
  const [baggageInput, setBaggageInput] = useState('');
  const [seatInput, setSeatInput] = useState('');

  const handleReservationConfirm = () => {
    if (!confirmReservation) return;
    onConfirm(
      confirmReservation.type,
      parseFloat(confirmReservation.amount) || 0,
      confirmReservation.type === 'flight'
        ? {
            outbound: { airline: confirmReservation.outboundAirline, flightNumber: confirmReservation.outboundFlightNumber, departureTime: confirmReservation.outboundTime },
            return: { airline: confirmReservation.returnAirline, flightNumber: confirmReservation.returnFlightNumber, departureTime: confirmReservation.returnTime },
          }
        : undefined,
      confirmReservation.type === 'hotel'
        ? { name: confirmReservation.hotelName, mealPlan: confirmReservation.mealPlan }
        : undefined
    );
    setConfirmReservation(null);
  };

  const openReservationConfirm = (type: 'flight' | 'hotel') => {
    if (type === 'flight') {
      setConfirmReservation({
        type: 'flight',
        amount: String(Math.round(getFlightPlannedTotal(trip))),
        link: '',
        hotelName: '',
        mealPlan: '',
        outboundAirline: ((trip as any).outboundFlight?.option?.airline !== 'A confirmar' ? (trip as any).outboundFlight?.option?.airline : '') || '',
        outboundFlightNumber: ((trip as any).outboundFlight?.option?.flightNumber !== '---' ? (trip as any).outboundFlight?.option?.flightNumber : '') || '',
        outboundTime: (trip as any).outboundFlight?.option?.departureTime || '',
        returnAirline: ((trip as any).returnFlight?.option?.airline !== 'A confirmar' ? (trip as any).returnFlight?.option?.airline : '') || '',
        returnFlightNumber: ((trip as any).returnFlight?.option?.flightNumber !== '---' ? (trip as any).returnFlight?.option?.flightNumber : '') || '',
        returnTime: (trip as any).returnFlight?.option?.departureTime || '',
      });
    } else {
      setConfirmReservation({
        type: 'hotel',
        amount: '',
        link: '',
        hotelName: trip.accommodation?.name || '',
        mealPlan: (trip.accommodation as any)?.mealPlan || 'Café da manhã',
        outboundAirline: '', outboundFlightNumber: '', outboundTime: '',
        returnAirline: '', returnFlightNumber: '', returnTime: '',
      });
    }
  };

  // React to KINU AI's confirmar_item proposed action
  useEffect(() => {
    if (!pendingConfirmRequest) return;
    openReservationConfirm(pendingConfirmRequest.tipo === 'voo' ? 'flight' : 'hotel');
    onPendingConfirmHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingConfirmRequest?.ts]);

  // Fetch maps embed URL
  useEffect(() => {
    supabase.functions.invoke('maps-embed', { 
      body: { query: trip.destination, zoom: 12 } 
    }).then(({ data }) => {
      if (data?.embedUrl) setMapEmbedUrl(data.embedUrl);
    }).catch(() => {});
  }, [trip.destination]);

  const flexOrigin = trip.flights?.outbound?.origin || 'GRU';
  const flexDest = trip.flights?.outbound?.destination || trip.destinationAirportCode;
  const flexDate = trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : '';
  const { data: flexDates, isLoading: flexDatesLoading } = useFlexibleFlightSearch(
    flexOrigin,
    flexDest,
    flexDate,
    trip.travelers || 1,
    3,
    showFlexDates
  );

  const destCurrency = (trip as any).destinationCurrency || getTripCurrency(trip.destination);
  const { rates, loading: ratesLoading, updatedAgo } = useExchangeRates(destCurrency);

  const daysLeft = trip.startDate ? Math.max(0, differenceInDays(new Date(trip.startDate), new Date())) : 0;
  const isPast = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) < 0 : false;

  // Weighted quantitative progress — anchors (flight/hotel) weigh 5, activities weigh 1
  let weightedTotal = 0;
  let weightedConfirmed = 0;

  // Flight anchor
  if (trip.flights?.outbound) {
    weightedTotal += 5;
    if (trip.flights.outbound.status === 'confirmed') weightedConfirmed += 5;
  }

  // Hotel anchor
  if (trip.accommodation) {
    weightedTotal += 5;
    if (trip.accommodation.status === 'confirmed') weightedConfirmed += 5;
  }

  // Activities (skip in-itinerary logistics markers to avoid double-count)
  trip.days?.forEach(d => d.activities?.forEach(a => {
    if (a.category === 'voo' || a.category === 'hotel') return;
    weightedTotal += 1;
    if (a.status === 'confirmed') weightedConfirmed += 1;
  }));

  const progressPct = weightedTotal > 0 ? Math.round((weightedConfirmed / weightedTotal) * 100) : 0;

  const checklistPct = getChecklistPct(trip);
  const tierLabel = TIER_LABELS[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';

  const confirmedPct = trip.finances.total > 0 ? Math.round((trip.finances.confirmed / trip.finances.total) * 100) : 0;
  const plannedPct = trip.finances.total > 0 ? Math.min(100 - confirmedPct, Math.round((trip.finances.planned / trip.finances.total) * 100)) : 0;
  const overflow = (trip.finances.planned + trip.finances.confirmed) - trip.finances.total;

  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';

  const nowOnKinu = useMemo(() => {
    // TOP PRIORITY: live flight price monitoring signal
    const priceCheck: any = (trip as any).lastPriceCheck;
    if (priceCheck && (Date.now() - priceCheck.checkedAt) < 24 * 3600 * 1000) {
      const anchor = getFlightPlannedTotal(trip);
      const deltaPct = anchor > 0 ? priceCheck.delta / anchor : 0;
      const fmtNum = (n: number) => Math.round(n).toLocaleString('pt-BR');
      if (deltaPct <= -0.05) {
        const kiwiUrl = buildOfferLinks({
          category: 'flight',
          originCode: trip.flights?.outbound?.origin || 'GRU',
          destinationCode: trip.flights?.outbound?.destination || trip.destination,
          startDate: trip.startDate ? new Date(trip.startDate) : undefined,
          endDate: trip.endDate ? new Date(trip.endDate) : undefined,
          travelers: trip.travelers || 1,
        }).find(l => l.partner === 'Kiwi')?.url;
        return {
          message: `📉 Seu voo caiu R$ ${fmtNum(Math.abs(priceCheck.delta))} — melhor preço agora R$ ${fmtNum(priceCheck.price)}`,
          actionLabel: 'Ver oferta',
          onClick: () => { if (kiwiUrl) window.open(kiwiUrl, '_blank', 'noopener,noreferrer'); },
        };
      }
      if (deltaPct >= 0.08) {
        return {
          message: '📈 Voos desta rota subiram — seu preço planejado está defasado',
          actionLabel: 'Atualizar',
          onClick: () => document.getElementById('central-ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        };
      }
    }
    if (!flightConfirmed && daysLeft <= 30) {
      return {
        message: '✈️ Seu voo ainda não está confirmado',
        actionLabel: 'Confirmar voo',
        onClick: () => openReservationConfirm('flight'),
      };
    }
    if (!hotelConfirmed) {
      return {
        message: '🏨 Sua hospedagem ainda não está confirmada',
        actionLabel: 'Confirmar hotel',
        onClick: () => openReservationConfirm('hotel'),
      };
    }
    if (daysLeft <= 7) {
      return {
        message: `🎒 Faltam ${daysLeft} dias — checklist em ${checklistPct}%`,
        actionLabel: 'Ver checklist',
        onClick: () => onNavigateTab('preparacao'),
      };
    }
    return {
      message: '🌿 Tudo em dia — bora sonhar com o roteiro',
      actionLabel: 'Ver roteiro',
      onClick: () => onNavigateTab('roteiro'),
    };
  }, [trip, flightConfirmed, hotelConfirmed, daysLeft, checklistPct, openReservationConfirm, onNavigateTab]);

  const baggageDone = (trip as any).flightExtras?.baggageDone || false;
  const baggageDetail = (trip as any).flightExtras?.baggageDetail || '';
  const seatDone = (trip as any).flightExtras?.seatDone || false;
  const seatDetail = (trip as any).flightExtras?.seatDetail || '';

  const selectedFlightTotal = getSelectedFlightPlannedTotal(trip);
  const hasRealFlights = selectedFlightTotal != null;
  const flightPlannedTotal = getFlightPlannedTotal(trip);
  const flightConfirmedTotal = trip.finances?.categories?.flights?.confirmed || trip.flights?.outbound?.price || 0;
  const flightTotal = flightConfirmed
    ? flightConfirmedTotal
    : flightPlannedTotal;
  const flightPerPerson = Math.round(flightTotal / (trip.travelers || 1));
  const flightPrice = flightPerPerson;



  // Resolve real selected flight for display
  const realFlight = (trip as any).outboundFlight?.option;
  const returnFlightOpt = (trip as any).returnFlight?.option;
  const flightDuration = realFlight?.duration || trip.flights?.outbound?.duration || '—';
  const flightDirect = realFlight ? realFlight.isDirect : (trip.flights?.outbound?.stops === 0);
  const outboundAirlineDisp = realFlight?.airline && realFlight.airline !== 'A confirmar' ? realFlight.airline : null;
  const outboundNumberDisp = realFlight?.flightNumber && realFlight.flightNumber !== '---' ? realFlight.flightNumber : null;
  const outboundTimeDisp = realFlight?.departureTime || null;
  const returnAirlineDisp = returnFlightOpt?.airline && returnFlightOpt.airline !== 'A confirmar' ? returnFlightOpt.airline : null;
  const returnNumberDisp = returnFlightOpt?.flightNumber && returnFlightOpt.flightNumber !== '---' ? returnFlightOpt.flightNumber : null;
  const returnTimeDisp = returnFlightOpt?.departureTime || null;

  const priceChange = useMemo(() => {
    if (flightConfirmed) return null;
    return getPriceChangeInfo(trip.id);
  }, [trip.id, flightConfirmed]);
  const dest = trip.destination || 'o destino';

  const allActions = getOrchestratedActions(trip);
  // Filter out flight/hotel actions since they have dedicated hero cards
  const filteredActions = allActions.filter(a => 
    a.actionType !== 'open-auction-flight' && 
    a.actionType !== 'open-auction-hotel' && 
    a.actionType !== 'confirm-flight' && 
    a.actionType !== 'confirm-hotel' &&
    !(a.title === 'Voo Ida e Volta') &&
    !(a.title === 'Hospedagem')
  );
  const visibleActions = showAllActions ? filteredActions : filteredActions.slice(0, 3);
  const hiddenCount = filteredActions.length - 3;

  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';


  const handleAction = (action: OrchestratedAction) => {
    switch (action.actionType) {
      case 'open-auction-flight': onOpenAuction('flight'); break;
      case 'open-auction-hotel': onOpenAuction('hotel'); break;
      case 'confirm-flight': openReservationConfirm('flight'); break;
      case 'confirm-hotel': openReservationConfirm('hotel'); break;
      case 'navigate-checklist': onNavigateTab('preparacao'); break;
      case 'navigate-cambio': onNavigateTab('financeiro'); break;
      case 'navigate-packing': onNavigateTab('preparacao'); break;
      case 'navigate-roteiro': onNavigateTab('roteiro'); break;
      case 'export-pdf': {
        setPdfLoading(true);
        exportTripPDF(trip).finally(() => setPdfLoading(false));
        break;
      }
    }
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await exportTripPDF(trip);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareTrip = async () => {
    const days = trip.days || [];
    const totalActs = days.reduce((s, d) => s + d.activities.length, 0);
    const confirmed = days.reduce((s, d) => s + d.activities.filter(a => a.status === 'confirmed').length, 0);
    const highlights = days
      .flatMap(d => d.activities)
      .filter(a => a.category === 'passeio' || (a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã')))
      .slice(0, 5)
      .map(a => a.name?.replace(/^(Jantar|Almoço):\s*/i, ''))
      .join(', ');
    const text = `✈️ Minha viagem para ${trip.destination}!\n📅 ${days.length} dias · ${totalActs} atividades\n🎯 ${confirmed} confirmadas · ${progressPct}% pronto\n📍 Destaques: ${highlights}\n\nPlanejado com KINU Travel OS 🧭`;
    if (navigator.share) {
      try { await navigator.share({ title: `Viagem: ${trip.destination}`, text }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const searchRealFlights = async () => {
    if (!trip.flights?.outbound) return;
    setSearchingFlights(true);
    try {
      const { data, error } = await supabase.functions.invoke('amadeus-flights', {
        body: {
          action: 'search',
          origin: trip.flights.outbound.origin || 'GRU',
          destination: trip.flights.outbound.destination || trip.destination,
          date: trip.startDate?.split('T')[0],
          adults: trip.travelers || 1,
        },
      });
      let results: any[] = [];
      if (data?.data && Array.isArray(data.data)) {
        results = data.data.slice(0, 3);
        setFlightResults(results);
      } else if (data?.offers) {
        results = data.offers.slice(0, 3);
        setFlightResults(results);
      }
      if (results.length > 0) {
        const bestPrice = Math.min(...results.map((r: any) => r.price || Infinity));
        if (bestPrice !== Infinity) {
          savePriceSnapshot(trip.id, bestPrice);
        }
      }
    } catch (err) {
      console.error('Amadeus search failed:', err);
    } finally {
      setSearchingFlights(false);
    }
  };

  // Find first non-completed action index
  const firstActiveIdx = filteredActions.findIndex(a => !a.completed);

  // Reservation status items (flight, hotel, paid activities only)
  const reservationItems = useMemo(() => {
    const items: {
      id: string;
      type: 'flight' | 'hotel' | 'activity';
      name: string;
      confirmed: boolean;
      activityName?: string;
    }[] = [];

    if (trip.flights?.outbound) {
      items.push({
        id: 'flight',
        type: 'flight',
        name: `✈️ Voo ${trip.flights.outbound.origin || 'GRU'}→${trip.flights.outbound.destination || dest}`,
        confirmed: trip.flights.outbound.status === 'confirmed',
      });
    }

    if (trip.accommodation) {
      items.push({
        id: 'hotel',
        type: 'hotel',
        name: `🏨 Hotel ${trip.accommodation.name || trip.accommodation.neighborhood || dest}`,
        confirmed: trip.accommodation.status === 'confirmed',
      });
    }

    const paidActivities = (trip.days?.flatMap(d => d.activities) || [])
      .filter(a => a.category === 'passeio' && (a.cost || 0) >= 80);
    const uniqueByName = new Map<string, typeof paidActivities[0]>();
    paidActivities.forEach(a => {
      if (a.name && !uniqueByName.has(a.name)) uniqueByName.set(a.name, a);
    });
    Array.from(uniqueByName.values()).forEach(a => {
      items.push({
        id: `activity-${a.name}`,
        type: 'activity',
        name: a.name || '',
        activityName: a.name || '',
        confirmed: a.status === 'confirmed',
      });
    });

    return items;
  }, [trip, dest]);

  const totalReservations = reservationItems.length;
  const confirmedReservations = reservationItems.filter(i => i.confirmed).length;
  const allReservationsConfirmed = totalReservations > 0 && confirmedReservations === totalReservations;

  const handleReservationAction = (item: typeof reservationItems[0]) => {
    if (item.confirmed) return;
    if (item.type === 'flight') {
      setConfirmReservation({
        type: 'flight',
        amount: '',
        link: '',
        hotelName: '',
        mealPlan: '',
        outboundAirline: ((trip as any).outboundFlight?.option?.airline !== 'A confirmar' ? (trip as any).outboundFlight?.option?.airline : '') || '',
        outboundFlightNumber: ((trip as any).outboundFlight?.option?.flightNumber !== '---' ? (trip as any).outboundFlight?.option?.flightNumber : '') || '',
        outboundTime: (trip as any).outboundFlight?.option?.departureTime || '',
        returnAirline: ((trip as any).returnFlight?.option?.airline !== 'A confirmar' ? (trip as any).returnFlight?.option?.airline : '') || '',
        returnFlightNumber: ((trip as any).returnFlight?.option?.flightNumber !== '---' ? (trip as any).returnFlight?.option?.flightNumber : '') || '',
        returnTime: (trip as any).returnFlight?.option?.departureTime || '',
      });
    } else if (item.type === 'hotel') {
      setConfirmReservation({ type: 'hotel', amount: '', link: '', hotelName: trip.accommodation?.name || '', mealPlan: (trip.accommodation as any)?.mealPlan || 'Café da manhã', outboundAirline: '', outboundFlightNumber: '', outboundTime: '', returnAirline: '', returnFlightNumber: '', returnTime: '' });
    } else if (item.type === 'activity' && item.activityName) {
      setOffersModal({ isOpen: true, activityName: item.activityName });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Agora no KINU — single most relevant next item */}
      {!dismissedNow && (
        <div className="relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-border border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm truncate">{nowOnKinu.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={nowOnKinu.onClick}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              {nowOnKinu.actionLabel}
            </button>
            <button
              onClick={() => setDismissedNow(true)}
              aria-label="Dispensar"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Premium with Hero Image */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {/* Hero banner image */}
        <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <DestinationImage destination={trip.destination} query={`${trip.destination} travel landmark`} className="absolute inset-0 w-full h-full object-cover" alt={trip.destination} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-xl font-bold text-foreground font-['Outfit'] drop-shadow-lg">
              {trip.emoji} {trip.destination}, {trip.country}
            </h2>
          </div>
          <div className="absolute top-2 right-3 text-7xl opacity-10 select-none pointer-events-none">
            {trip.emoji}
          </div>
        </div>
        {/* Info below hero */}
        <div className="p-5 pt-3 bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <p className="text-sm text-muted-foreground">
            {dateRange} • {trip.travelers} viajante(s) • Faixa {tierLabel}
          </p>
          <div className="mt-1.5">
            <WeatherBadge destination={trip.destination} startDate={trip.startDate} />
          </div>
          {trip.accommodation?.name && (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(trip.accommodation.name + ', ' + trip.destination)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 mt-2 text-xs text-sky-400 hover:text-sky-300 transition"
            >
              <MapPin className="w-3 h-3" />
              <span>{trip.accommodation.name} — Ver no mapa</span>
            </a>
          )}
          <div className="flex gap-2 mt-4">
            <MiniKPI label={isPast ? 'em viagem' : 'dias'} value={isPast ? 'Em viagem' : String(daysLeft)} urgent={!isPast && daysLeft <= 7} />
            <DualProgressKPI financePct={confirmedPct} roteiroPct={progressPct} />
            <MiniKPI label="gasto" value={`R$${fmt(trip.finances.confirmed / 1000)}k`} />
            <MiniKPI label="checklist" value={`${checklistPct}%`} />
          </div>
        </div>
      </div>

      {/* 1.5 — Hero Status: Voo + Hotel */}
      <div className="grid grid-cols-2 gap-3">
        {/* Flight Card */}
        <div className={`rounded-xl border p-4 ${
          flightConfirmed 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-sky-500/10 border-sky-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✈️</span>
            <div>
              <p className="text-xs font-bold text-foreground font-['Outfit']">Voo</p>
              <p className="text-[10px] text-muted-foreground">
                {trip.flights?.outbound?.origin || 'GRU'} → {trip.flights?.outbound?.destination || dest}
              </p>
            </div>
          </div>
          <p className={`text-lg font-bold font-['Outfit'] ${flightConfirmed ? 'text-emerald-400' : 'text-sky-400'}`}>
            R$ {fmt(flightTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            total · R$ {fmt(flightPerPerson)} por pessoa
          </p>
          {!flightConfirmed && priceChange && (
            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${priceChange.dropped ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
              {priceChange.dropped ? '↓' : '↑'} R$ {fmt(priceChange.diff)} desde {priceChange.dateStr}
            </div>
          )}
          {!flightConfirmed && priceChange?.dropped && (
            <p className="text-[10px] text-amber-400 mt-1">💡 Héstia: preço caiu — bom momento para confirmar o voo.</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            {flightDuration} · {flightDirect ? 'Direto' : 'Com conexão'}
          </p>
          {(outboundAirlineDisp || outboundTimeDisp) && (
            <p className="text-[10px] text-muted-foreground">
              ✈️ Ida: {outboundAirlineDisp || ''}{outboundNumberDisp ? ` ${outboundNumberDisp}` : ''}{outboundTimeDisp ? ` · ${outboundTimeDisp}` : ''}
            </p>
          )}
          {(returnAirlineDisp || returnTimeDisp) && (
            <p className="text-[10px] text-muted-foreground">
              🛬 Volta: {returnAirlineDisp || ''}{returnNumberDisp ? ` ${returnNumberDisp}` : ''}{returnTimeDisp ? ` · ${returnTimeDisp}` : ''}
            </p>
          )}
          {flightConfirmed && (
            <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
              {/* Bagagem */}
              <div className="flex items-start gap-2">
                <span className="text-sm">🧳</span>
                <div className="flex-1 min-w-0">
                  {editingBaggage ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={baggageInput}
                        onChange={(e) => setBaggageInput(e.target.value)}
                        placeholder="ex: 2 despachadas"
                        className="flex-1 min-w-0 px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => {
                          onUpdateTrip?.((t) => ({ ...t, flightExtras: { ...(t.flightExtras || {}), baggageDone: true, baggageDetail: baggageInput } }));
                          setEditingBaggage(false);
                        }}
                        className="px-2 py-1 rounded bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Salvar
                      </button>
                      {baggageDone && (
                        <button
                          onClick={() => {
                            onUpdateTrip?.((t) => ({ ...t, flightExtras: { ...(t.flightExtras || {}), baggageDone: false } }));
                            setEditingBaggage(false);
                          }}
                          className="px-2 py-1 rounded bg-transparent text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Desmarcar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {baggageDone ? `✅ Bagagem: ${baggageDetail || 'ok'}` : '🧳 Bagagem pendente'}
                      </p>
                      <button
                        onClick={() => {
                          setBaggageInput(baggageDone ? baggageDetail : '');
                          setEditingBaggage(true);
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        {baggageDone ? 'editar' : 'Marcar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Assento */}
              <div className="flex items-start gap-2">
                <span className="text-sm">💺</span>
                <div className="flex-1 min-w-0">
                  {editingSeat ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={seatInput}
                        onChange={(e) => setSeatInput(e.target.value)}
                        placeholder="ex: 12A, 12B"
                        className="flex-1 min-w-0 px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => {
                          onUpdateTrip?.((t) => ({ ...t, flightExtras: { ...(t.flightExtras || {}), seatDone: true, seatDetail: seatInput } }));
                          setEditingSeat(false);
                        }}
                        className="px-2 py-1 rounded bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Salvar
                      </button>
                      {seatDone && (
                        <button
                          onClick={() => {
                            onUpdateTrip?.((t) => ({ ...t, flightExtras: { ...(t.flightExtras || {}), seatDone: false } }));
                            setEditingSeat(false);
                          }}
                          className="px-2 py-1 rounded bg-transparent text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Desmarcar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {seatDone ? `✅ Assento: ${seatDetail || 'ok'}` : '💺 Assento pendente'}
                      </p>
                      <button
                        onClick={() => {
                          setSeatInput(seatDone ? seatDetail : '');
                          setEditingSeat(true);
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        {seatDone ? 'editar' : 'Marcar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {onUnconfirm && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      if (window.confirm('Desfazer a confirmação? Os valores voltam para o planejado.')) {
                        onUnconfirm('flight');
                      }
                    }}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Desfazer confirmação
                  </button>
                </div>
              )}
            </div>
          )}

          {!flightConfirmed && (
            <div className="mt-3 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => openReservationConfirm('flight')}
                  className="text-xs font-semibold py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  ✅ Confirmar
                </button>
                <button 
                  onClick={() => onOpenAuction('flight')}
                  className="text-xs font-semibold py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  🎯 Buscar Ofertas
                </button>
              </div>
              <button
                onClick={searchRealFlights}
                disabled={searchingFlights}
                className="w-full text-[10px] font-medium py-1.5 rounded-lg border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 transition-colors disabled:opacity-50"
              >
                {searchingFlights ? '✈️ Buscando...' : '✈️ Voos Reais (Amadeus)'}
              </button>
            </div>
          )}
        </div>
        {/* Hotel Card */}
        <div className={`rounded-xl border p-4 ${
          hotelConfirmed 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏨</span>
            <div>
              <p className="text-xs font-bold text-foreground font-['Outfit']">Hotel</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {trip.accommodation?.neighborhood || dest}
              </p>
            </div>
          </div>
          <p className={`text-lg font-bold font-['Outfit'] ${hotelConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
            R$ {fmt(trip.accommodation?.totalPrice || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            total da estadia · R$ {fmt(trip.accommodation?.nightlyRate || 0)} por noite
          </p>
          {trip.accommodation?.name && (
            <p className="text-[11px] font-medium text-foreground mt-1">🏨 {trip.accommodation.name}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            {trip.accommodation?.totalNights || '—'} noites · {trip.accommodation?.stars || 3}★
          </p>
          {((trip.accommodation as any)?.mealPlan) && (
            <p className="text-[10px] text-emerald-400/90 mt-0.5">🍽️ {(trip.accommodation as any).mealPlan}</p>
          )}
          {!hotelConfirmed && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => openReservationConfirm('hotel')}
                className="text-xs font-semibold py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                ✅ Confirmar
              </button>
              <button 
                onClick={() => onOpenAuction('hotel')}
                className="text-xs font-semibold py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                🎯 Buscar Hotel
              </button>
            </div>
          )}
          {hotelConfirmed && onUnconfirm && (
            <div className="mt-3 pt-2 border-t border-border/50 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Desfazer a confirmação? Os valores voltam para o planejado.')) {
                    onUnconfirm('hotel');
                  }
                }}
                className="text-[10px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Desfazer confirmação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Flight Results from Amadeus */}
      {flightResults && flightResults.length > 0 && (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-sky-400 font-['Outfit']">✈️ Voos encontrados:</p>
          {flightResults.map((flight: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div>
                <p className="text-xs font-medium text-foreground">{flight.airline || 'Companhia'}</p>
                <p className="text-[10px] text-muted-foreground">{flight.duration || ''} · {flight.isDirect ? 'Direto' : `${flight.connectionCities?.length || 1} parada`}</p>
              </div>
              <span className="text-sm font-bold text-sky-400 font-['Outfit']">
                R$ {(flight.price || 0).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground text-center">Preços via Amadeus (referência)</p>
        </div>
      )}

      {/* Status de Reservas */}
      {totalReservations > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-foreground font-['Outfit']">🎫 Status de Reservas</p>
            <p className="text-xs text-muted-foreground">{confirmedReservations} de {totalReservations} confirmados</p>
          </div>
          {allReservationsConfirmed ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-lg">✅</span>
              <span className="text-sm font-semibold text-emerald-400 font-['Outfit']">Tudo reservado!</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {reservationItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleReservationAction(item)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    item.confirmed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-background border-border hover:bg-muted/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm flex-shrink-0">{item.confirmed ? '✅' : '⬜'}</span>
                    <span className={`text-sm truncate font-['Outfit'] ${item.confirmed ? 'text-emerald-400/80' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                  </div>
                  {item.confirmed && (
                    <span className="text-[10px] font-medium text-emerald-400/80 flex-shrink-0 ml-2">confirmado</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Central de Ofertas */}
      {(() => {
        const offerParams = {
          originCode: trip.flights?.outbound?.origin || 'GRU',
          destinationCode: trip.flights?.outbound?.destination || trip.destinationAirportCode,
          city: trip.destination,
          hotelName: trip.accommodation?.name,
          startDate: trip.startDate ? new Date(trip.startDate) : undefined,
          endDate: trip.endDate ? new Date(trip.endDate) : undefined,
          travelers: trip.travelers || 1,
        };

        const flightLinks = buildOfferLinks({ ...offerParams, category: 'flight' });
        const hotelLinks = buildOfferLinks({ ...offerParams, category: 'hotel' });

        const paidActivities = (trip.days?.flatMap(d => d.activities) || [])
          .filter(a => a.category === 'passeio' && (a.cost || 0) >= 80);
        const uniqueByName = new Map<string, typeof paidActivities[0]>();
        paidActivities.forEach(a => {
          if (a.name && !uniqueByName.has(a.name)) uniqueByName.set(a.name, a);
        });
        const uniquePaidActivities = Array.from(uniqueByName.values());

        const hasAnyLinks = flightLinks.length > 0 || hotelLinks.length > 0 || uniquePaidActivities.length > 0;
        if (!hasAnyLinks) return null;

        const renderGroup = (title: string, links: ReturnType<typeof buildOfferLinks>) => {
          if (links.length === 0) return null;
          const isFlights = title === '✈️ Voos';
          const isHotels = title === '🏨 Hotéis';
          const sortedFlex = isFlights && flexDates?.length
            ? [...flexDates].sort((a, b) => a.date.localeCompare(b.date))
            : [];
          const minPrice = sortedFlex.length > 0
            ? Math.min(...sortedFlex.map(d => d.bestPrice))
            : null;
          const acc = trip.accommodation;
          const hasCuratedHotel = isHotels && acc?.name;

          return (
            <div key={title} className="space-y-2">
              <p className="text-xs font-semibold text-foreground font-['Outfit']">{title}</p>
              {hasCuratedHotel && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">⭐</span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Recomendado pelo KINU</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground font-['Outfit']">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.stars || 3}★ · {acc.neighborhood || trip.destination}</p>
                    <p className="text-xs text-muted-foreground">R$ {fmt(acc.nightlyRate || 0)} / noite · {acc.totalNights || 1} noites</p>
                  </div>
                  <a
                    href={`https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(`${acc.name} ${trip.destination}`)}&checkin=${trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : ''}&checkout=${trip.endDate ? format(new Date(trip.endDate), 'yyyy-MM-dd') : ''}&group_adults=${trip.travelers || 1}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Ver no Booking
                  </a>
                </div>
              )}
              {hasCuratedHotel && <p className="text-[10px] text-muted-foreground pt-1">Outras ofertas:</p>}
              <div className="space-y-1.5">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground font-['Outfit']">{link.partner}</span>
                        {link.isAffiliate && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                            Parceiro KINU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                    </div>
                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground shrink-0 ml-2" />
                  </a>
                ))}
              </div>
              {(isFlights || isHotels) && (() => {
                const type: 'flight' | 'hotel' = isFlights ? 'flight' : 'hotel';
                const confirmed = isFlights
                  ? trip.flights?.outbound?.status === 'confirmed'
                  : trip.accommodation?.status === 'confirmed';
                const paidValue = isFlights
                  ? ((trip.flights?.outbound?.price || 0) + (trip.flights?.return?.price || 0))
                  : (trip.accommodation?.totalPrice || 0);
                const openModal = () =>
                  setConfirmReservation({
                    type,
                    amount: confirmed && paidValue ? String(Math.round(paidValue)) : type === 'flight' ? String(Math.round(flightPlannedTotal)) : '',
                    link: '',
                    hotelName: type === 'hotel' ? trip.accommodation?.name || '' : '',
                    mealPlan: type === 'hotel' ? (trip.accommodation as any)?.mealPlan || 'Café da manhã' : '',
                    outboundAirline: type === 'flight' ? ((trip as any).outboundFlight?.option?.airline !== 'A confirmar' ? (trip as any).outboundFlight?.option?.airline : '') || '' : '',
                    outboundFlightNumber: type === 'flight' ? ((trip as any).outboundFlight?.option?.flightNumber !== '---' ? (trip as any).outboundFlight?.option?.flightNumber : '') || '' : '',
                    outboundTime: type === 'flight' ? (trip as any).outboundFlight?.option?.departureTime || '' : '',
                    returnAirline: type === 'flight' ? ((trip as any).returnFlight?.option?.airline !== 'A confirmar' ? (trip as any).returnFlight?.option?.airline : '') || '' : '',
                    returnFlightNumber: type === 'flight' ? ((trip as any).returnFlight?.option?.flightNumber !== '---' ? (trip as any).returnFlight?.option?.flightNumber : '') || '' : '',
                    returnTime: type === 'flight' ? (trip as any).returnFlight?.option?.departureTime || '' : '',
                  });
                if (confirmed) {
                  return (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-xs font-semibold text-emerald-400 font-['Outfit']">
                        {isFlights ? '✈️ Voo confirmado' : '🏨 Hotel confirmado'}
                        {paidValue ? ` · R$ ${fmt(Math.round(paidValue))}` : ''}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={openModal}
                          className="text-[11px] font-medium text-emerald-400/80 hover:text-emerald-300 underline underline-offset-2"
                        >
                          Editar
                        </button>
                        {onUnconfirm && (
                          <button
                            onClick={() => {
                              if (window.confirm('Desfazer a confirmação? Os valores voltam para o planejado.')) {
                                onUnconfirm(type);
                              }
                            }}
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
                          >
                            Desfazer confirmação
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={openModal}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    ✓ Já reservei
                  </button>
                );
              })()}
              {isFlights && (
                <div className="space-y-2 pt-1">
                  {!showFlexDates ? (
                    <button
                      onClick={() => setShowFlexDates(true)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-border bg-background/50 hover:bg-muted/60 transition-colors text-xs text-muted-foreground hover:text-foreground"
                    >
                      🔍 Ver melhores datas (±3 dias)
                    </button>
                  ) : flexDatesLoading ? (
                    <p className="text-xs text-muted-foreground px-1">Buscando melhores datas...</p>
                  ) : sortedFlex.length > 0 ? (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-2.5 space-y-1.5">
                      <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Melhores datas encontradas</p>
                      {sortedFlex.map((entry) => {
                        const isLowest = entry.bestPrice === minPrice;
                        return (
                          <div
                            key={entry.date}
                            className={`flex items-center justify-between py-1 px-2 rounded-md text-xs ${
                              isLowest ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-background/50'
                            }`}
                          >
                            <span className={isLowest ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}>
                              {format(new Date(entry.date), 'dd/MMM', { locale: ptBR })}
                            </span>
                            <div className="flex items-center gap-2">
                              {isLowest && (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">menor preço</span>
                              )}
                              <span className={`font-bold font-['Outfit'] ${isLowest ? 'text-emerald-400' : 'text-foreground'}`}>
                                R$ {entry.bestPrice.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground px-1">Não encontramos datas alternativas agora.</p>
                  )}
                </div>
              )}
            </div>
          );
        };

        return (
          <div id="central-ofertas" className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div>
              <p className="text-sm font-bold text-foreground font-['Outfit']">🎯 Central de Ofertas</p>
              <p className="text-xs text-muted-foreground">Compare e reserve com nossos parceiros</p>
            </div>
            {renderGroup('✈️ Voos', flightLinks)}
            {renderGroup('🏨 Hotéis', hotelLinks)}
            {uniquePaidActivities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground font-['Outfit']">🎟️ Atividades do seu roteiro</p>
                <p className="text-[10px] text-muted-foreground">Reserve as atividades pagas do seu roteiro</p>
                <div className="space-y-1.5">
                  {uniquePaidActivities.map((activity) => (
                    <button
                      key={activity.name}
                      onClick={() => setOffersModal({ isOpen: true, activityName: activity.name })}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors group text-left"
                    >
                      <span className="text-sm font-semibold text-foreground font-['Outfit']">{activity.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ver ofertas</span>
                        <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
                {offersModal && (
                  <OffersModal
                    isOpen={offersModal.isOpen}
                    onClose={() => setOffersModal(null)}
                    activityName={offersModal.activityName}
                    city={trip.destination}
                  />
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Reservation Confirm Modal */}
      <Dialog
        open={!!confirmReservation}
        onOpenChange={(open) => { if (!open) setConfirmReservation(null); }}
      >
        <DialogContent className="bg-[#1e293b] border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit'] text-foreground">
              {confirmReservation?.type === 'flight' ? '✈️ Confirmar Voo Reservado' : '🏨 Confirmar Hotel Reservado'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {confirmReservation?.type === 'flight' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground font-['Outfit']">✈️ Ida</p>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Companhia</label>
                    <input
                      type="text"
                      value={confirmReservation?.outboundAirline ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, outboundAirline: e.target.value } : prev)}
                      placeholder="Azul"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Número do voo</label>
                    <input
                      type="text"
                      value={confirmReservation?.outboundFlightNumber ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, outboundFlightNumber: e.target.value } : prev)}
                      placeholder="ex: LA3090"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Horário</label>
                    <input
                      type="text"
                      value={confirmReservation?.outboundTime ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, outboundTime: e.target.value } : prev)}
                      placeholder="14:00"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground font-['Outfit']">🛬 Volta</p>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Companhia</label>
                    <input
                      type="text"
                      value={confirmReservation?.returnAirline ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, returnAirline: e.target.value } : prev)}
                      placeholder="Azul"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Número do voo</label>
                    <input
                      type="text"
                      value={confirmReservation?.returnFlightNumber ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, returnFlightNumber: e.target.value } : prev)}
                      placeholder="ex: LA3090"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Horário</label>
                    <input
                      type="text"
                      value={confirmReservation?.returnTime ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, returnTime: e.target.value } : prev)}
                      placeholder="16:00"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
              </div>
            )}
            {confirmReservation?.type === 'hotel' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Hotel</label>
                  <input
                    type="text"
                    value={confirmReservation?.hotelName ?? ''}
                    onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, hotelName: e.target.value } : prev)}
                    placeholder="Nome do hotel"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Regime</label>
                  <div className="flex flex-wrap gap-2">
                    {['Sem refeições', 'Café da manhã', 'Meia pensão', 'Pensão completa'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setConfirmReservation((prev) => prev ? { ...prev, mealPlan: option } : prev)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${
                          confirmReservation?.mealPlan === option
                            ? 'bg-emerald-500 text-emerald-950 border-emerald-500'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-emerald-500/40'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor pago (R$)</label>
              <input
                type="number"
                value={confirmReservation?.amount ?? ''}
                onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, amount: e.target.value } : prev)}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Link/Confirmação (opcional)</label>
              <input
                type="text"
                value={confirmReservation?.link ?? ''}
                onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, link: e.target.value } : prev)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button
              onClick={handleReservationConfirm}
              className="w-full py-2.5 bg-emerald-500 text-emerald-950 rounded-lg font-semibold text-sm hover:bg-emerald-400 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Destination Map Embed */}
      {mapEmbedUrl && (
        <div className="rounded-xl overflow-hidden border border-border">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa de ${trip.destination}`}
          />
        </div>
      )}

      {/* 1.75 — Activity Summary by Category */}
      {(() => {
        const CATEGORY_STYLES: Record<string, { bg: string; border: string; bar: string; hover: string }> = {
          passeio: { bg: 'bg-sky-500/5', border: 'border-sky-500/20', bar: 'bg-sky-500', hover: 'hover:bg-sky-500/10' },
          comida: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', bar: 'bg-amber-500', hover: 'hover:bg-amber-500/10' },
          transporte: { bg: 'bg-violet-500/5', border: 'border-violet-500/20', bar: 'bg-violet-500', hover: 'hover:bg-violet-500/10' },
          hotel: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', bar: 'bg-emerald-500', hover: 'hover:bg-emerald-500/10' },
        };
        const CATEGORY_META: Record<string, { icon: string; label: string }> = {
          passeio: { icon: '🏛️', label: 'Passeios' },
          comida: { icon: '🍽️', label: 'Refeições' },
          transporte: { icon: '🚕', label: 'Transporte' },
          hotel: { icon: '🏨', label: 'Hospedagem' },
        };
        const allActivities = trip.days?.flatMap(d => d.activities) || [];
        const cats = ['passeio', 'comida', 'transporte', 'hotel'] as const;

        return (
          <div className="space-y-2">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Atividades por Categoria
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {cats.map(cat => {
                const items = allActivities.filter(a => {
                  if (cat === 'comida') return a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service');
                  return a.category === cat;
                });
                const confirmed = items.filter(a => a.status === 'confirmed').length;
                const total = items.length;
                const totalCost = items.reduce((s, a) => s + (a.cost || 0), 0);
                const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
                const style = CATEGORY_STYLES[cat];
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => onNavigateTab('roteiro', cat)}
                    className={`rounded-xl border p-3 text-left transition-colors ${style.bg} ${style.border} ${style.hover}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-[11px] font-semibold text-foreground font-['Outfit']">{meta.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{confirmed}/{total} confirmadas</p>
                    <p className="text-xs font-bold text-foreground font-['Outfit'] mt-0.5">R$ {fmt(totalCost)}</p>
                    <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${style.bar} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 2. Próximos Passos — Agentes orquestrando (prioritized, max 3 visible) */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Próximos Passos
        </h3>
        {visibleActions.map((action, i) => {
          const agent = AGENTS[action.agent];
          const globalIdx = filteredActions.indexOf(action);
          const isFirstActive = globalIdx === firstActiveIdx;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                action.completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60'
                  : `bg-gradient-to-r ${agent.gradient} ${agent.border}`
              } ${isFirstActive ? 'ring-1 ring-emerald-500/30' : ''}`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{agent.emoji}</span>
              <div className="flex-1 min-w-0">
                {isFirstActive && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 block">
                    Proximo Passo
                  </span>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold font-['Outfit'] ${action.completed ? 'text-emerald-400' : agent.accentColor}`}>
                    {agent.name}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-foreground">{action.title}</span>
                  {action.completed && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.message}</p>
                {!action.completed && action.actionType !== 'celebrate' && (
                  <button
                    onClick={() => handleAction(action)}
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${agent.accentColor} bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors`}
                  >
                    {action.actionLabel}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllActions(!showAllActions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            {showAllActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAllActions ? 'Menos' : `+ ${hiddenCount} ações`}
          </button>
        )}
      </div>

      {/* 2.5 — Roteiro Executivo */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <span className="text-sm">🦅</span>
          <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
            {getIcarusRoteiroInsight(trip)}
          </p>
          <button
            onClick={() => onNavigateTab('roteiro')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Editar →
          </button>
        </div>
        <div className="divide-y divide-border">
          {(trip.days || []).map((day, index) => {
            const dayData = day as any;
            const dayIndex = dayData.day ?? dayData.dayNumber ?? index + 1;
            const realActivities = (dayData.activities || []).filter((a: any) =>
              a.category !== 'voo' &&
              !(a.category === 'hotel' && (a.name?.toLowerCase().includes('check-in') || a.name?.toLowerCase().includes('check-out'))) &&
              !a.name?.toLowerCase().includes('transfer')
            );
            const confirmedCount = realActivities.filter((a: any) => a.status === 'confirmed').length;
            const dayTotal = realActivities.reduce((sum: number, a: any) => sum + (a.cost || a.estimatedCost || 0), 0);
            const startMs = trip.startDate ? new Date(trip.startDate).getTime() : NaN;
            const dayDate = !isNaN(startMs) && Number.isFinite(dayIndex)
              ? format(new Date(startMs + (dayIndex - 1) * 86400000), "dd/MM (EEE)", { locale: ptBR })
              : '';
            const dayTitle = dayData.title || dayData.label || dayData.theme || `Dia ${dayIndex}`;
            const cleanTitle = dayTitle.replace(/[^\w\sà-úÀ-Ú—·•\-,]/gi, '').trim();

            return (
              <button
                key={dayIndex}
                onClick={() => onNavigateTab('roteiro')}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {dayIndex}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{cleanTitle || `Dia ${dayIndex}`}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dayDate} · {realActivities.length} atividades
                    {confirmedCount > 0 && ` · ${confirmedCount} confirmadas`}
                  </p>
                </div>
                {dayTotal > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    R$ {fmt(dayTotal)}
                  </span>
                )}
                <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${realActivities.length > 0 ? (confirmedCount / realActivities.length) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Resumo Financeiro Compacto */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Financeiro</span>
          <span className="text-xs text-foreground font-['Outfit']">
            R$ {fmt(trip.finances.confirmed)} / R$ {fmt(trip.finances.total)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${confirmedPct}%` }} />
          <div className="h-full bg-yellow-500 transition-all" style={{ width: `${plannedPct}%` }} />
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmado: R$ {fmt(trip.finances.confirmed)}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-yellow-500" /> Planejado: R$ {fmt(trip.finances.planned)}
          </span>
        </div>
        {/* Currency badge */}
        {rates[destCurrency] && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              💱 1 BRL = {rates[destCurrency].toFixed(4)} {destCurrency}
            </span>
            <span className="text-[10px] text-muted-foreground">{updatedAgo}</span>
          </div>
        )}
      </div>

      {/* Budget overflow warning */}
      {overflow > 0 && (
        <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-[#eab308] text-sm leading-5">⚠️</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#eab308]">
              Plano excede o orçamento em R$ {fmt(overflow)}
            </p>
            <p className="text-xs text-[#eab308]/80 mt-0.5">
              Revise os custos na aba Financeiro ou ajuste o orçamento da viagem.
            </p>
          </div>
        </div>
      )}

      {/* 4. Actions Bar: Share + Export PDF */}
      <div className="flex gap-2">
        <button
          onClick={handleShareTrip}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors text-sm font-medium"
        >
          📤 Compartilhar
        </button>
        <button
          onClick={handleExportPdf}
          disabled={pdfLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 hover:text-sky-300 hover:border-sky-500/40 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <FileText size={16} />
          {pdfLoading ? 'Gerando...' : 'Exportar PDF'}
        </button>
      </div>

      {/* 5. Curation Sources (collapsible) */}
      <CurationSources trip={trip} />

    </motion.div>
  );
};

export default TripPanel;
