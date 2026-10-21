// TripPanel — Orchestrated Executive Dashboard

import { motion } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, MapPin, ExternalLink, X } from 'lucide-react';
import { CheckinBanner } from '@/components/checkin/CheckinBanner';
import { TripCheckinDrawer } from '@/components/checkin/TripCheckinDrawer';
import { WeatherBadge } from './WeatherBadge';
import { useFlexibleFlightSearch } from '@/hooks/useFlightSearch';
import { differenceInDays, format } from 'date-fns';
import { tripTimezone } from '@/lib/timezone';
import { ptBR } from 'date-fns/locale';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { exportTripPDF } from '@/lib/tripPdfExport';
import { getIcarusRoteiroInsight, getIcarusHeroFlight, getIcarusHeroHotel, getHermesHotelInsight } from '@/lib/agentMessages';
import { DestinationImage } from '@/components/shared/DestinationImage';
import type { SavedTrip } from '@/types/trip';
import { buildOfferLinks } from '@/lib/offersLinks';
import { isPriceCheckComparable } from '@/lib/tripScope';
import { OffersModal } from '@/components/cockpit/OffersModal';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { applyHotelSwap } from '@/lib/hotelSwap';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { getFlightPlannedTotal, getSelectedFlightPlannedTotal } from '@/lib/flightFinance';
import { PainelResumo } from './PainelResumo';

const TIER_DESCRIPTIONS: Record<string, string> = {
  backpacker: 'Hostels, street food, tours gratuitos',
  economic: 'Hotels 3★, restaurantes locais, tours em grupo',
  comfort: 'Hotels 4★, restaurantes recomendados, tours privados',
  luxury: 'Hotels 5★, restaurantes Michelin, tours VIP',
};

function CurationSources({ trip }: { trip: SavedTrip }) {
  const interests = trip.travelInterests || [];
  const tierLabel = TIER_LABELS[trip.budgetType || 'comfort'] || 'Conforto';
  const tierDesc = TIER_DESCRIPTIONS[trip.budgetType || 'comfort'] || '';
  const hasGastronomy = interests.includes('gastronomy');
  // Fuso recalculado na data da viagem (não o gap gravado na criação); desconhecido = "a confirmar".
  const tz = tripTimezone(trip);
  const jetLagHours = Math.abs(tz.diff);

  const interestLabels: Record<string, string> = {
    gastronomy: 'Gastronomia', culture: 'Cultura', history: 'História',
    art: 'Arte', adventure: 'Aventura', nature: 'Natureza',
    beach: 'Praia', relaxation: 'Relaxamento', shopping: 'Compras',
    nightlife: 'Vida Noturna', family: 'Família', winter: 'Inverno',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
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
      {trip.jetLagMode && (jetLagHours > 0 || !tz.tzKnown) && (
        <div className="flex items-start gap-2">
          <div className="w-0.5 self-stretch rounded-full bg-purple-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-purple-400 font-medium">Biology AI:</span> {tz.tzKnown ? <>fuso de {String(jetLagHours).replace('.', ',')}h adaptado</> : <>fuso a confirmar</>}
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
    </div>
  );
}

// Persist open/closed state of each TripPanel section in a single localStorage key.
function useSectionOpen(id: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('kinu_trip_panel_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed[id] === 'boolean') return parsed[id];
      }
    } catch {
      // ignore corrupt storage
    }
    return defaultOpen;
  });

  const setOpenPersisted = useCallback((value: boolean) => {
    setOpen(value);
    try {
      const saved = localStorage.getItem('kinu_trip_panel_sections');
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[id] = value;
      localStorage.setItem('kinu_trip_panel_sections', JSON.stringify(parsed));
    } catch {
      // ignore storage errors
    }
  }, [id]);

  return [open, setOpenPersisted] as const;
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
  /**
   * Nome de quem exporta, repassado ao exportTripPDF (Arco 3c). Vem por prop e
   * não por useAuth() aqui de dentro: este painel monta a cada seleção de
   * viagem e um hook de auth aqui abriria uma segunda assinatura do GoTrue e um
   * getSession() extra por montagem. A Viagens já tem o usuário — passa.
   */
  exporterName?: string;
  exporterEmail?: string;
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


const TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro', economic: 'Econômico', comfort: 'Conforto', luxury: 'Luxo',
};


function getDaysLeft(trip: SavedTrip): number {
  if (!trip.startDate) return 999;
  return differenceInDays(new Date(trip.startDate), new Date());
}

function getChecklistPct(trip: SavedTrip): number {
  const total = trip.checklist?.length || 0;
  const done = trip.checklist?.filter(i => i.checked).length || 0;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}


const MiniKPI = ({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) => (
  <div className={`flex-1 text-center py-2 rounded-xl ${urgent ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/5 border border-white/5'}`}>
    <p className={`text-sm font-bold font-['Outfit'] ${urgent ? 'text-amber-400' : 'text-foreground'}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
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

/** iOS Safari: o vaul não reposiciona (repositionInputs={false}); o input focado vai pro centro do sheet. */
const centerOnFocus = (e: React.FocusEvent<HTMLInputElement>) =>
  e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });

function getTripCurrency(dest: string): string {
  const n = dest.toLowerCase().trim();
  return DEST_CURRENCY_MAP[n] || 'USD';
}

export const TripPanel = ({ trip, onConfirm, onUnconfirm, onUpdateTrip, onOpenAuction, onNavigateTab, pendingConfirmRequest, onPendingConfirmHandled, exporterName, exporterEmail }: TripPanelProps) => {
  const summaryHeaderRef = useRef<HTMLDivElement | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [dismissedNow, setDismissedNow] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string | null>(null);
  const [vooOpen, setVooOpen] = useSectionOpen('vooHospedagem', true);
  const [mapOpen, setMapOpen] = useSectionOpen('mapa', false);
  const [weatherOpen, setWeatherOpen] = useSectionOpen('clima', false);
  const [fontesOpen, setFontesOpen] = useSectionOpen('fontes', false);
  const [showFlexDates, setShowFlexDates] = useState(false);
  const [offersModal, setOffersModal] = useState<{ isOpen: boolean; activityName: string; activityDate?: string } | null>(null);
  const [confirmReservation, setConfirmReservation] = useState<{ type: 'flight' | 'hotel'; amount: string; link: string; hotelName: string; mealPlan: string; outboundAirline: string; outboundFlightNumber: string; outboundTime: string; returnAirline: string; returnFlightNumber: string; returnTime: string } | null>(null);
  const [hotelSwapOpen, setHotelSwapOpen] = useState(false);
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

  // Fetch maps embed URL — lazy, only when the "Mapa da viagem" section is expanded
  useEffect(() => {
    if (!mapOpen || mapEmbedUrl) return;
    const mapQuery = trip.country
      ? `${trip.destination}, ${trip.country}`
      : trip.destinationAirportCode
        ? `${trip.destination} (${trip.destinationAirportCode})`
        : trip.destination;
    supabase.functions.invoke('maps-embed', {
      body: { query: mapQuery, zoom: 12 }
    }).then(({ data }) => {
      if (data?.embedUrl) setMapEmbedUrl(data.embedUrl);
    }).catch(() => {});
  }, [mapOpen, mapEmbedUrl, trip.destination, trip.country, trip.destinationAirportCode]);

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


  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';

  const nowOnKinu = useMemo(() => {
    // TOP PRIORITY: live flight price monitoring signal
    // Só com real vs real da mesma fonte (isPriceCheckComparable); estimativa contra
    // tarifa consultada é número sem origem e não vira alerta.
    const priceCheck: any = (trip as any).lastPriceCheck;
    if (priceCheck && isPriceCheckComparable(trip) && (Date.now() - priceCheck.checkedAt) < 24 * 3600 * 1000) {
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
          message: `📉 Seu voo caiu R$ ${fmtNum(Math.abs(priceCheck.delta))} — referência estimada agora R$ ${fmtNum(priceCheck.price)}`,
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

  const dest = trip.destination || 'o destino';

  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';



  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await exportTripPDF(trip, exporterName, exporterEmail);
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

  // Hero-scoped offer links: flight partners live behind the flight hero's
  // "Buscar Ofertas" popover; hotel partners split into a hotel-specific
  // Booking link and a generic-hotel popover on the hotel hero.
  const heroOfferParams = {
    originCode: trip.flights?.outbound?.origin || 'GRU',
    destinationCode: trip.flights?.outbound?.destination || trip.destinationAirportCode,
    city: trip.destination,
    startDate: trip.startDate ? new Date(trip.startDate) : undefined,
    endDate: trip.endDate ? new Date(trip.endDate) : undefined,
    travelers: trip.travelers || 1,
  };
  const heroFlightLinks = buildOfferLinks({ ...heroOfferParams, category: 'flight' });
  const heroHotelSpecificLinks = trip.accommodation?.name
    ? buildOfferLinks({ ...heroOfferParams, category: 'hotel', hotelName: trip.accommodation.name })
    : [];
  const heroHotelBookingSpecific = heroHotelSpecificLinks.find(l => l.partner === 'Booking');
  const heroHotelGenericLinks = buildOfferLinks({ ...heroOfferParams, category: 'hotel' });



  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Pós-viagem: o convite (ou o registro) do check-in */}
      <CheckinBanner trip={trip as any} onOpen={() => setCheckinOpen(true)} />
      {checkinOpen && (
        <TripCheckinDrawer
          trip={trip as any}
          open={checkinOpen}
          onOpenChange={setCheckinOpen}
          onSaved={(stored) => onUpdateTrip?.(() => stored)}
        />
      )}

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

      <PainelResumo trip={trip} onNavigateTab={onNavigateTab} />

      {/* Section: Voo & Hospedagem */}
      <Collapsible open={vooOpen} onOpenChange={setVooOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-2">
            <span>✈️🏨</span>
            <span className="font-medium text-foreground">Voo & Hospedagem</span>
          </span>
          {vooOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          {/* 1. Header Premium with Hero Image */}
      <div ref={summaryHeaderRef} className="relative overflow-hidden rounded-2xl border border-border">
        {/* Hero banner image */}
        <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <DestinationImage
            resetKey={trip.id}
            storedUrl={(trip as any).coverImageUrl}
            onResolved={(url) => {
              if ((trip as any).coverImageUrl === url) return;
              onUpdateTrip?.((t: any) => ({ ...t, coverImageUrl: url }));
            }}
            destination={trip.destination}
            query={`${trip.destination} travel landmark`}
            className="absolute inset-0 w-full h-full object-cover"
            alt={trip.destination}
          />
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
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="text-xs font-semibold py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                    >
                      🎯 Buscar Ofertas
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2 bg-card border-border">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Parceiros de voo</p>
                    {heroFlightLinks.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">Sem ofertas disponíveis.</p>
                    ) : heroFlightLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-foreground font-['Outfit']">{link.partner}</span>
                          {link.isAffiliate && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Parceiro</span>
                          )}
                        </div>
                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
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
          {/* Trocar hotel — a porta de saída da segunda maior decisão da viagem.
              Fica visível inclusive com o hotel confirmado: o modal avisa que a
              troca desfaz a confirmação antes de aplicar. */}
          <button
            onClick={() => setHotelSwapOpen(true)}
            className="w-full mt-3 text-xs font-semibold py-2 rounded-lg border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            🔄 Trocar hotel
          </button>
          {!hotelConfirmed && (
            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => openReservationConfirm('hotel')}
                className="w-full text-xs font-semibold py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                ✅ Confirmar
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                {heroHotelBookingSpecific ? (
                  <a
                    href={heroHotelBookingSpecific.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-center"
                  >
                    🔎 Buscar este hotel
                  </a>
                ) : (
                  <button
                    disabled
                    className="text-xs font-semibold py-2 rounded-lg bg-amber-500/40 text-white/70 cursor-not-allowed"
                    title="Sem hotel recomendado"
                  >
                    🔎 Buscar este hotel
                  </button>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-xs font-semibold py-2 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors">
                      Ver outros hotéis
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-2 bg-card border-border">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outros parceiros</p>
                    {heroHotelGenericLinks.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">Sem ofertas disponíveis.</p>
                    ) : heroHotelGenericLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-foreground font-['Outfit']">{link.partner}</span>
                          {link.isAffiliate && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">Parceiro</span>
                          )}
                        </div>
                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
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


      {/* Status de Reservas — removed: flight/hotel state now lives in the hero cards only. */}


      {/* 🎟️ Ofertas de Experiências — activity partner links only.
          Flight partner links live behind the flight hero's "Buscar Ofertas" popover.
          Hotel partner links live on the hotel hero. */}
      {(() => {
        const paidActivities = (trip.days?.flatMap(d => (d.activities || []).map(a => ({ ...a, dayDate: d.date }))) || [])
          .filter(a => a.category === 'passeio' && (a.cost || 0) >= 80);
        const uniqueByName = new Map<string, typeof paidActivities[0]>();
        paidActivities.forEach(a => {
          if (a.name && !uniqueByName.has(a.name)) uniqueByName.set(a.name, a);
        });
        const uniquePaidActivities = Array.from(uniqueByName.values());
        if (uniquePaidActivities.length === 0) return null;

        return (
          <div id="ofertas-experiencias" className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-foreground font-['Outfit']">🎟️ Ofertas de Experiências</p>
              <p className="text-xs text-muted-foreground">Reserve as atividades pagas do seu roteiro</p>
            </div>
            <div className="space-y-1.5">
              {uniquePaidActivities.map((activity) => (
                <button
                  key={activity.name}
                  onClick={() => setOffersModal({ isOpen: true, activityName: activity.name, activityDate: String(activity.dayDate || '').slice(0, 10) })}
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
                activityDate={offersModal.activityDate}
                city={trip.destination}
              />
            )}
          </div>
        );
      })()}

      {/* Troca de hotel. Persiste pelo onUpdateTrip, que é o read-modify-write do
          storage (Viagens.handleUpdateTrip) — não a cópia do estado React. */}
      <HotelSwapModal
        open={hotelSwapOpen}
        onClose={() => setHotelSwapOpen(false)}
        trip={trip}
        onSelect={(hotel) => onUpdateTrip?.((t) => applyHotelSwap(t, hotel))}
        onOpenOffers={() => onOpenAuction('hotel')}
      />


{/* Reservation Confirm — bottom-sheet (C.2): cabe em 390×660; Confirmar fixo no rodapé do
          sheet (safe-area), alcançável com teclado aberto. Mesmo payload de sempre (onConfirm). */}
      <Drawer
        open={!!confirmReservation}
        onOpenChange={(open) => { if (!open) setConfirmReservation(null); }}
        repositionInputs={false}
      >
        <DrawerContent className="z-[70] max-h-[85dvh] bg-[#1e293b] border-border" data-testid="confirm-sheet">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="font-['Outfit'] text-foreground">
              {confirmReservation?.type === 'flight' ? '✈️ Confirmar Voo Reservado' : '🏨 Confirmar Hotel Reservado'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Valor pago (R$)</label>
              <input
                type="number"
                inputMode="decimal"
                value={confirmReservation?.amount ?? ''}
                onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, amount: e.target.value } : prev)}
                onFocus={centerOnFocus}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            {confirmReservation?.type === 'flight' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Horário da ida</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={confirmReservation?.outboundTime ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, outboundTime: e.target.value } : prev)}
                onFocus={centerOnFocus}
                      placeholder="14:00"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Horário da volta</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={confirmReservation?.returnTime ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, returnTime: e.target.value } : prev)}
                onFocus={centerOnFocus}
                      placeholder="16:00"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
                <details className="rounded-lg border border-border px-3 py-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer select-none">Detalhes ▸</summary>
                  <div className="mt-3 space-y-3">
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
                    <label className="block text-xs text-muted-foreground mb-1.5">Link/Confirmação (opcional)</label>
                    <input
                      type="text"
                      value={confirmReservation?.link ?? ''}
                      onChange={(e) => setConfirmReservation((prev) => prev ? { ...prev, link: e.target.value } : prev)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  </div>
                </details>
              </>
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
            {confirmReservation?.type === 'hotel' && (
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
            )}
          </div>
          <div className="shrink-0 border-t border-border px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              onClick={handleReservationConfirm}
              className="w-full py-3 bg-emerald-500 text-emerald-950 rounded-lg font-semibold text-sm hover:bg-emerald-400 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>
        </CollapsibleContent>
      </Collapsible>


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

      {/* Bottom: Mapa da viagem (collapsed, lazy) */}
      <Collapsible open={mapOpen} onOpenChange={setMapOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-2">
            <span>🗺️</span>
            <span className="font-medium text-foreground">Mapa da viagem</span>
          </span>
          {mapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          {mapEmbedUrl ? (
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
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground text-center">
              Carregando mapa…
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Bottom: Clima (collapsed) */}
      {trip.destination && (
        <Collapsible open={weatherOpen} onOpenChange={setWeatherOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <span>🌤️</span>
              <span className="font-medium text-foreground">Clima</span>
            </span>
            {weatherOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 bg-card border border-border rounded-xl p-4">
            <WeatherBadge destination={trip.destination} startDate={trip.startDate} />
            <p className="text-xs text-muted-foreground/70 mt-2">
              Previsão detalhada aparece aqui quando a viagem estiver a menos de 7 dias.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Section: Fontes da curadoria */}
      <Collapsible open={fontesOpen} onOpenChange={setFontesOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
          <span className="flex items-center gap-2">
            <span>📚</span>
            <span className="font-medium text-foreground">Fontes da curadoria</span>
          </span>
          {fontesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <CurationSources trip={trip} />
        </CollapsibleContent>
      </Collapsible>

    </motion.div>
  );
};

export default TripPanel;
