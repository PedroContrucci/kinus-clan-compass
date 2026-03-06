// TripPanel — Orchestrated Executive Dashboard

import { motion } from 'framer-motion';
import { Check, FileText, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { WeatherBadge } from './WeatherBadge';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportTripPDF } from '@/lib/tripPdfExport';
import { getIcarusRoteiroInsight, getIcarusHeroFlight, getIcarusHeroHotel, getHermesHotelInsight } from '@/lib/agentMessages';
import type { SavedTrip } from '@/types/trip';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';

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
  onConfirm: (type: 'flight' | 'hotel', amount: number) => void;
  onOpenAuction: (type: 'flight' | 'hotel') => void;
  onNavigateTab: (tab: string, categoryFilter?: string) => void;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
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

export const TripPanel = ({ trip, onConfirm, onOpenAuction, onNavigateTab }: TripPanelProps) => {
  const [confirmModal, setConfirmModal] = useState<{ type: 'flight' | 'hotel'; isOpen: boolean } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [showAllActions, setShowAllActions] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [flightResults, setFlightResults] = useState<any[] | null>(null);
  const [searchingFlights, setSearchingFlights] = useState(false);

  const destCurrency = (trip as any).destinationCurrency || getTripCurrency(trip.destination);
  const { rates, loading: ratesLoading, updatedAgo } = useExchangeRates(destCurrency);

  const daysLeft = trip.startDate ? Math.max(0, differenceInDays(new Date(trip.startDate), new Date())) : 0;
  const isPast = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) < 0 : false;

  const totalActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0;
  const confirmedActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.filter(a => a.status === 'confirmed').length || 0), 0) || 0;
  const progressPct = totalActivities > 0 ? Math.round((confirmedActivities / totalActivities) * 100) : 0;

  const checklistPct = getChecklistPct(trip);
  const tierLabel = TIER_LABELS[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';

  const confirmedPct = trip.finances.total > 0 ? Math.round((trip.finances.confirmed / trip.finances.total) * 100) : 0;
  const plannedPct = trip.finances.total > 0 ? Math.min(100 - confirmedPct, Math.round((trip.finances.planned / trip.finances.total) * 100)) : 0;

  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';
  const flightPrice = trip.flights?.outbound?.price || trip.finances.planned * 0.4 || 0;
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

  const handleConfirm = () => {
    if (confirmModal) {
      onConfirm(confirmModal.type, parseFloat(confirmAmount) || 0);
    }
    setConfirmModal(null);
    setConfirmAmount('');
  };

  const handleAction = (action: OrchestratedAction) => {
    switch (action.actionType) {
      case 'open-auction-flight': onOpenAuction('flight'); break;
      case 'open-auction-hotel': onOpenAuction('hotel'); break;
      case 'confirm-flight': setConfirmModal({ type: 'flight', isOpen: true }); break;
      case 'confirm-hotel': setConfirmModal({ type: 'hotel', isOpen: true }); break;
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
      if (data?.data && Array.isArray(data.data)) {
        setFlightResults(data.data.slice(0, 3));
      } else if (data?.offers) {
        setFlightResults(data.offers.slice(0, 3));
      }
    } catch (err) {
      console.error('Amadeus search failed:', err);
    } finally {
      setSearchingFlights(false);
    }
  };

  // Find first non-completed action index
  const firstActiveIdx = filteredActions.findIndex(a => !a.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 1. Header Premium with Hero Image */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {/* Hero banner image */}
        <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
          <img
            src={`https://source.unsplash.com/800x300/?${encodeURIComponent(trip.destination)}+travel+landmark`}
            alt={trip.destination}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
            <MiniKPI label="progresso" value={`${progressPct}%`} />
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
            {flightConfirmed ? '✅ Confirmado' : `R$ ${fmt(flightPrice)}`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {trip.flights?.outbound?.duration || '—'} · {trip.flights?.outbound?.stops === 0 ? 'Direto' : `${trip.flights?.outbound?.stops || 1} parada`}
          </p>
          {!flightConfirmed && (
            <div className="mt-3 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => setConfirmModal({ type: 'flight', isOpen: true })}
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
            {hotelConfirmed ? '✅ Confirmado' : `R$ ${fmt(trip.accommodation?.nightlyRate || 0)}/noite`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {trip.accommodation?.totalNights || '—'} noites · {trip.accommodation?.stars || 3}★
          </p>
          {!hotelConfirmed && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => setConfirmModal({ type: 'hotel', isOpen: true })}
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
          {(trip.days || []).map((day) => {
            const realActivities = (day.activities || []).filter(a =>
              a.category !== 'voo' &&
              !(a.category === 'hotel' && (a.name?.toLowerCase().includes('check-in') || a.name?.toLowerCase().includes('check-out'))) &&
              !a.name?.toLowerCase().includes('transfer')
            );
            const confirmedCount = realActivities.filter(a => a.status === 'confirmed').length;
            const dayTotal = realActivities.reduce((sum, a) => sum + (a.cost || 0), 0);
            const dayDate = trip.startDate
              ? format(new Date(new Date(trip.startDate).getTime() + (day.day - 1) * 86400000), "dd/MM (EEE)", { locale: ptBR })
              : '';
            const cleanTitle = (day.title || '').replace(/[^\w\sà-úÀ-Ú—·•\-,]/gi, '').trim();

            return (
              <button
                key={day.day}
                onClick={() => onNavigateTab('roteiro')}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{cleanTitle || `Dia ${day.day}`}</p>
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

      {/* 4. Export PDF */}
      <button
        onClick={handleExportPdf}
        disabled={pdfLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <FileText size={16} />
        {pdfLoading ? 'Gerando PDF...' : 'Exportar PDF Premium'}
      </button>

      {/* 5. Curation Sources (collapsible) */}
      <CurationSources trip={trip} />

      {/* Confirm Modal */}
      <Dialog open={confirmModal?.isOpen || false} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">
              {confirmModal?.type === 'flight' ? 'Confirmar Voo' : 'Confirmar Hospedagem'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Valor pago (R$)</label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
            >
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TripPanel;
