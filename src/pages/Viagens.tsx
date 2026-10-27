import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useKinuAI } from "@/contexts/KinuAIContext";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight, Plane, Building, MapPin, Utensils, Car, ShoppingBag, Loader2 } from 'lucide-react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { tripTimezone, flightSearchRoute, FLIGHT_SEARCH_NO_IATA } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

import JetLagAlert from '@/components/JetLagAlert';
import FinOpsDashboard from '@/components/FinOpsDashboard';
import SmartPacking from '@/components/SmartPacking';
import { DraftCockpit, TripGuide, ExchangeRates, EnhancedDayTimeline, SmartPackingWithLuggage } from '@/components/cockpit';
import OffersModal from '@/components/cockpit/OffersModal';
import { TripPanel } from '@/components/cockpit/TripPanel';
import { AgentTip } from '@/components/shared/AgentTip';
import { getIcarusRoteiro, getIcarusGuia, getIcarusLeilao, getHestiaFinOps, getHestiaCambio, getHestiaLeilao, getHermesChecklist, getHermesPacking } from '@/lib/agentMessages';
import { AgentInsight } from '@/engines/agentIntelligence';
import { SavedTrip, TripActivity, ActivityStatus, contextualTips } from '@/types/trip';
import { PackingData } from '@/types/packing';
import { getActivityPrice, determinePriceLevel, findBestPriceLevel, mapCategoryToPricingType, CITY_PRICES } from '@/lib/activityPricing';
import { findMichelinMatch, getMichelinStarDisplay } from '@/lib/michelinData';
import { BottomNav } from '@/components/shared/BottomNav';
import { getDestinationActivities } from '@/data/destinationActivities';
import { createPlaceUsageTracker, normalizePlaceName, pickReusableByGap } from '@/lib/placeIdentity';
import type { SuggestedActivity } from '@/data/destinationActivities';
import { getFlightPlannedTotal } from '@/lib/flightFinance';
import { getTrip, listTrips, normalizeTrip, subscribeTrips, updateTrip, type StoredTrip } from '@/lib/tripStore';
import { retimeConfirmedLegs, unplacedMessage, type UnplacedEdit } from '@/lib/replanItinerary';
import { trackEvent } from '@/lib/kinuEvents';
import { addCatalogActivityToDay, applyTripPlannedCostDelta, calculateTripProgress } from '@/lib/tripItineraryOps';
import { itemKindOf, trackTripActivated, trackTripItemConfirmed } from '@/lib/tripEvents';
import { activateDraft } from '@/lib/activateDraft';
import { buildOfferLinks } from '@/lib/offersLinks';
import { prontidao } from '@/lib/roteiroBlocks';
import { buildOfferCheckReply, destinationRules, formatTileBRL, scopeChecklist } from '@/lib/tripScope';
import { CambioBlock, ChecklistBlocks, DestinationRulesBlock } from '@/components/viagens/TripScopeBlocks';
import { supabase } from '@/integrations/supabase/client';

import { DailyRouteMap, RouteLeg } from '@/components/cockpit/DailyRouteMap';
import { PlaceInfoCard } from '@/components/cockpit/PlaceInfoCard';
import { RoteiroDia, RoteiroLinha } from '@/components/cockpit/RoteiroDia';
import { FinanceiroRazao, FinanceiroTiles, QuandoDinheiroSai } from '@/components/cockpit/FinanceiroRazao';
import { razaoLines } from '@/lib/razaoLines';
import { ActivityDetailDrawer } from '@/components/cockpit/ActivityDetailDrawer';
import { TabErrorBoundary } from '@/components/shared/TabErrorBoundary';
import { ClaProof } from '@/components/cla/ClaProof';
import { catalogIdOf } from '@/lib/localAchievements';
import { HotelPlanBlock } from '@/components/hotel/HotelPlanBlock';
import { applyHotelSwap, type AccommodationLike } from '@/lib/hotelSwap';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';


const DESTINATION_CURRENCY: Record<string, string> = {
  // Europa
  'paris': 'EUR', 'roma': 'EUR', 'amsterdam': 'EUR', 'barcelona': 'EUR',
  'madri': 'EUR', 'berlim': 'EUR', 'viena': 'EUR', 'atenas': 'EUR',
  'dublin': 'EUR', 'lisboa': 'EUR', 'milão': 'EUR', 'florença': 'EUR',
  'praga': 'CZK', 'budapeste': 'HUF', 'varsóvia': 'PLN',
  'londres': 'GBP', 'edimburgo': 'GBP',
  'zurique': 'CHF', 'genebra': 'CHF',
  'estocolmo': 'SEK', 'copenhague': 'DKK', 'oslo': 'NOK',
  'istambul': 'TRY', 'moscou': 'RUB',
  // Américas
  'nova york': 'USD', 'new york': 'USD', 'miami': 'USD', 'los angeles': 'USD',
  'san francisco': 'USD', 'orlando': 'USD', 'las vegas': 'USD', 'chicago': 'USD',
  'toronto': 'CAD', 'vancouver': 'CAD', 'montreal': 'CAD',
  'cancún': 'MXN', 'cidade do méxico': 'MXN', 'playa del carmen': 'MXN',
  'buenos aires': 'ARS', 'mendoza': 'ARS', 'bariloche': 'ARS',
  'santiago': 'CLP', 'lima': 'PEN', 'cusco': 'PEN', 'bogotá': 'COP',
  'cartagena': 'COP', 'montevidéu': 'UYU',
  // Ásia
  'tóquio': 'JPY', 'tokyo': 'JPY', 'quioto': 'JPY', 'osaka': 'JPY',
  'bangkok': 'THB', 'seul': 'KRW', 'seoul': 'KRW',
  'pequim': 'CNY', 'xangai': 'CNY', 'hong kong': 'HKD',
  'singapura': 'SGD', 'bali': 'IDR', 'hanói': 'VND',
  'dubai': 'AED', 'abu dhabi': 'AED',
  'nova delhi': 'INR', 'mumbai': 'INR',
  'tel aviv': 'ILS', 'jerusalém': 'ILS',
  // Oceania
  'sydney': 'AUD', 'melbourne': 'AUD', 'auckland': 'NZD',
  // África
  'cidade do cabo': 'ZAR', 'cairo': 'EGP', 'marrakech': 'MAD',
};

function getDestinationCurrency(destination: string): string {
  const normalized = destination.toLowerCase().trim();
  const normalizedNA = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  if (DESTINATION_CURRENCY[normalized]) return DESTINATION_CURRENCY[normalized];
  
  // Try with accent normalization
  for (const [city, currency] of Object.entries(DESTINATION_CURRENCY)) {
    const cityNA = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedNA === cityNA || normalizedNA.includes(cityNA) || cityNA.includes(normalizedNA)) return currency;
  }
  
  const countryCurrency: Record<string, string> = {
    'argentina': 'ARS', 'chile': 'CLP', 'peru': 'PEN', 'colombia': 'COP',
    'mexico': 'MXN', 'uruguai': 'UYU', 'estados unidos': 'USD', 'eua': 'USD',
    'canada': 'CAD', 'japao': 'JPY', 'china': 'CNY', 'coreia': 'KRW',
    'tailandia': 'THB', 'india': 'INR', 'australia': 'AUD',
    'inglaterra': 'GBP', 'reino unido': 'GBP', 'suica': 'CHF',
    'portugal': 'EUR', 'espanha': 'EUR', 'italia': 'EUR', 'franca': 'EUR',
    'alemanha': 'EUR', 'holanda': 'EUR', 'grecia': 'EUR', 'irlanda': 'EUR',
    'austria': 'EUR', 'belgica': 'EUR', 'finlandia': 'EUR',
    'turquia': 'TRY', 'israel': 'ILS', 'egito': 'EGP', 'marrocos': 'MAD',
    'africa do sul': 'ZAR', 'emirados': 'AED',
  };
  for (const [country, currency] of Object.entries(countryCurrency)) {
    if (normalizedNA.includes(country)) return currency;
  }
  return 'USD';
}

const LOGISTICS_KEYWORDS = [
  'café da manhã', 'transfer', 'check-in', 'check-out', 'voo',
  'embarque', 'desembarque', 'imigração', 'aeroporto', 'bagagem',
  'retorno', 'volta'
];
const LOGISTICS_CATEGORIES = ['voo', 'transporte', 'hotel'];

function isLogistics(activity: { name: string; category?: string }): boolean {
  const nameLower = activity.name.toLowerCase();
  if (LOGISTICS_CATEGORIES.includes(activity.category || '')) return true;
  return LOGISTICS_KEYWORDS.some(kw => nameLower.includes(kw));
}


interface ViagensProps {
  /** C.7: a viagem aberta pelo Início (`/inicio?trip=<id>`). */
  tripId?: string;
  /** Voltar/viagem sumida: devolve à lista do Início. */
  onExit?: () => void;
}

const findTrip = (id?: string): SavedTrip | null =>
  (id ? (listTrips().find((t) => t.id === id) as SavedTrip | undefined) : undefined) ?? null;

const Viagens = ({ tripId, onExit }: ViagensProps = {}) => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(() => findTrip(tripId));
  const [activeTab, setActiveTab] = useState<'painel' | 'roteiro' | 'financeiro' | 'preparacao'>('painel');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roteiroCategoryFilter, setRoteiroCategoryFilter] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<string | null>(null);
  
  const [offersModal, setOffersModal] = useState<{ isOpen: boolean; activityName: string; activityDate?: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; activity: TripActivity; dayIndex: number; actIndex: number } | null>(null);
  const [swapModal, setSwapModal] = useState<{ dayIndex: number; actIndex: number; activity: any } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmLink, setConfirmLink] = useState('');
  const [manualExpenseModal, setManualExpenseModal] = useState(false);
  const [manualExpense, setManualExpense] = useState({ name: '', amount: 0, category: 'shopping' as keyof SavedTrip['finances']['categories'] });
  const [activityDetailDrawer, setActivityDetailDrawer] = useState<{ activity: TripActivity; open: boolean } | null>(null);
  const [focusMapActivity, setFocusMapActivity] = useState<string | null>(null);
  // C.5b: um item aberto por vez; mapa da rota montado só com o bloco aberto.
  // C.5c — abrir uma linha não fecha a outra.
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(() => new Set());
  const toggleExpandedActivity = (id: string) => setExpandedActivityIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const [routeOpen, setRouteOpen] = useState(false);
  const mapAnchorRef = useRef<HTMLDivElement | null>(null);
  const roteiroActionRef = useRef<HTMLDivElement | null>(null);
  const preparacaoHeaderRef = useRef<HTMLDivElement | null>(null);
  // Route legs reported by DailyRouteMap — the list reuses the map's OSRM
  // per-leg times instead of deriving its own. (Pin numbering flows the
  // other way: computed here from the day's list and passed down to the map.)
  const [routeLegs, setRouteLegs] = useState<{ day: number; legs: RouteLeg[] } | null>(null);
  const currentDayRef = useRef<number | null>(null);
  const handleRouteLegsChange = useCallback((legs: RouteLeg[]) => {
    setRouteLegs({ day: currentDayRef.current ?? -1, legs });
  }, []);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [budgetEditValue, setBudgetEditValue] = useState('');
  const { setTripContext, registerActionHandlers, pendingNavigation, clearPendingNavigation } = useKinuAI();
  const [pendingConfirmRequest, setPendingConfirmRequest] = useState<{ tipo: 'voo' | 'hotel'; ts: number } | null>(null);

  useEffect(() => {
    if (!pendingNavigation || !selectedTrip) return;
    const { destino } = pendingNavigation;
    if (destino === 'painel' || destino === 'roteiro' || destino === 'financeiro' || destino === 'preparacao') {
      setActiveTab(destino);
      clearPendingNavigation();
    }
  }, [pendingNavigation, selectedTrip, clearPendingNavigation]);

  // Feed trip context to KINU AI when selected trip changes
  useEffect(() => {
    if (selectedTrip) {
      setTripContext({
        destination: selectedTrip.destination,
        country: selectedTrip.country,
        startDate: selectedTrip.startDate,
        endDate: selectedTrip.endDate,
        budget: selectedTrip.budget,
        budgetUsed: selectedTrip.finances?.confirmed || 0,
        travelStyle: selectedTrip.budgetType,
        travelers: selectedTrip.travelers,
        activities: selectedTrip.days?.flatMap(d => d.activities.map(a => a.name)).slice(0, 10) || [],
        daysUntilTrip: selectedTrip.startDate ? differenceInDays(new Date(selectedTrip.startDate), new Date()) : undefined,
        hotelName: selectedTrip.accommodation?.name,
        hotelNeighborhood: selectedTrip.accommodation?.neighborhood,
        jetLagSeverity: (selectedTrip as any).jetLagSeverity,
        checklistProgress: Math.round(((selectedTrip.checklist || []).filter(i => i.checked).length / Math.max(1, (selectedTrip.checklist || []).length)) * 100),
        confirmedActivities: selectedTrip.days?.reduce((s, d) => s + d.activities.filter(a => a.status === 'confirmed').length, 0) || 0,
        totalActivities: selectedTrip.days?.reduce((s, d) => s + d.activities.length, 0) || 0,
        flightConfirmed: selectedTrip.flights?.outbound?.status === 'confirmed',
        hotelConfirmed: selectedTrip.accommodation?.status === 'confirmed',
        interests: (selectedTrip as any).travelInterests,
        flightDuration: selectedTrip.flights?.outbound?.duration,
        tripId: selectedTrip.id,
        // Cru, para o modo DURANTE montar o plano de hoje (horário, status, bairro, coord).
        itineraryActivities: (selectedTrip.days || []).slice(0, 12).map((d) => ({
          day: d.day,
          date: d.date || '',
          activities: (d.activities || []).slice(0, 20).map((a) => ({
            id: a.id,
            time: a.time,
            name: a.name,
            category: a.category,
            status: a.status,
            neighborhood: (a as { neighborhood?: string }).neighborhood,
          })),
        })),
        itineraryDays: (selectedTrip.days || []).slice(0, 12).map((d) => ({
          day: d.day,
          date: selectedTrip.startDate
            ? format(addDays(new Date(selectedTrip.startDate), d.day - 1), "dd/MM (EEEE)", { locale: ptBR }).replace("-feira", "")
            : d.date || '',
          items: (d.activities || []).slice(0, 8).map((a) => `${a.time || ''} ${a.name || ''}`.trim()),
        })),
        activeTab,
      });
    } else {
      setTripContext(null);
    }
  }, [selectedTrip, activeTab, setTripContext]);

  // Guard ASSÍNCRONO — o mais caro de errar do arco (recon §4). O guard antigo
  // era síncrono (loadJson do mock); com sessão vinda da rede, redirecionar
  // antes de `authLoading` cair chutaria TODO usuário logado para `/` a cada
  // reload da tela principal do produto. Só se decide quando a sessão resolveu.
  useEffect(() => {
    if (!user && !authLoading) navigate('/');
  }, [user, authLoading, navigate]);

  // Leitura pelo funil: sempre array, sempre normalizada (recon §4.3, §4.5).
  // A regravação que existia aqui (escrita-no-read) morreu: normalizar é
  // responsabilidade da LEITURA, então não há mais o que persistir no mount.
  //
  // Efeito separado do guard de propósito: as viagens são locais e não esperam
  // a rede — carregam no mount, independentes do estado de auth.
  useEffect(() => {
    setTrips(listTrips());
  }, []);

  // Sino do storage (recon §4.10): qualquer escrita que passe pelo tripStore — desta aba
  // (chat criando viagem via addTrip) ou de outra aba (evento `storage`) — recarrega a
  // lista e re-deriva a seleção. Assina uma vez; o updater funcional de `setSelectedTrip`
  // dá acesso à seleção corrente sem capturar `selectedTrip` na closure.
  useEffect(() => {
    return subscribeTrips(() => {
      const fresh = listTrips();
      setTrips(fresh);
      setSelectedTrip((current) => {
        if (!current) return current;
        // Some do storage => some da tela. Manter a seleção obsoleta faria toda edição
        // seguinte cair no `updateTrip` de id inexistente — o usuário editaria um fantasma.
        return fresh.find((trip) => trip.id === current.id) ?? null;
      });
    });
  }, []);

  // C.7: o id da URL escolhe a viagem (antes o `?trip=` era ignorado e caía na lista).
  useEffect(() => {
    setSelectedTrip(findTrip(tripId));
    setSelectedDay(1);
    setActiveTab('painel');
  }, [tripId]);

  // Sem viagem selecionada (voltar, exclusão, id inexistente) não há tela aqui: volta ao Início.
  useEffect(() => {
    if (authLoading || !user || selectedTrip) return;
    if (onExit) onExit(); else navigate('/inicio');
  }, [selectedTrip, authLoading, user, onExit, navigate]);

  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setSlideDirection(day > selectedDay ? 'left' : 'right');
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDay(day);
      setIsTransitioning(false);
    }, 150);
  };

  const calculateProgress = calculateTripProgress;

  const handleConfirmActivity = () => {
    if (!confirmModal || !selectedTrip) return;

    const amount = parseFloat(confirmAmount) || 0;

    // Lido do STORAGE antes da escrita: a promoção `draft → active` acontece lá dentro, e
    // a `selectedTrip` da closure pode estar velha. Sem isto eu não sei se a ativação
    // aconteceu AGORA — e "agora" é o que separa emitir de reemitir.
    const statusAntes = getTrip(selectedTrip.id)?.status;

    // Toda a edição roda sobre a viagem FRESCA do storage: os totais de finanças são
    // acumuladores (`+=`), então somar sobre a `selectedTrip` da closure gravaria um
    // total defasado se outra tela tivesse escrito no meio (recon §4.1, §4.2).
    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip = { ...trip };
      const activity = updatedTrip.days[confirmModal.dayIndex].activities[confirmModal.actIndex];

      activity.status = 'confirmed';
      activity.paidAmount = amount;
      activity.confirmationLink = confirmLink;

      // Update finances with new structure
      updatedTrip.finances.confirmed += amount;
      updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - amount);
      updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.planned - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;

      // Update category
      const category = activity.category || 'passeio';
      const categoryMap: Record<string, keyof typeof updatedTrip.finances.categories> = {
        'voo': 'flights',
        'hotel': 'accommodation',
        'passeio': 'tours',
        'comida': 'food',
        'transporte': 'transport',
        'compras': 'shopping',
      };
      const financeCategory = categoryMap[category] || 'tours';
      updatedTrip.finances.categories[financeCategory].confirmed += amount;

      // Update progress
      updatedTrip.progress = calculateProgress(updatedTrip);

      // Update status if needed
      if (updatedTrip.status === 'draft') {
        updatedTrip.status = 'active';
      }

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);

    // Fatos, DEPOIS da escrita: a viagem no disco já é a que o evento descreve.
    trackTripItemConfirmed(
      selectedTrip.id,
      itemKindOf(confirmModal.activity?.category),
      confirmModal.activity?.id ?? '',
    );
    // Confirmar item de rascunho ativa a viagem sem passar pelo botão Ativar. A marca dentro
    // de `trackTripActivated` garante uma emissão por viagem, venha ela por qual caminho vier.
    if (statusAntes === 'draft' && stored?.status === 'active') trackTripActivated(selectedTrip.id);

    // `id`/`name` não são tocados pela edição, então a atividade do modal serve para o
    // feedback visual sem precisar reextraí-la da viagem gravada.
    const activity = confirmModal.activity;

    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(50);

    // Track recently confirmed for animation
    setRecentlyConfirmed(activity.id);
    setTimeout(() => setRecentlyConfirmed(null), 1500);

    // Show contextual tip
    toast({
      title: `✅ ${activity.name} confirmado`,
      description: `R$ ${amount.toLocaleString('pt-BR')} registrado no FinOps.`,
    });

    setConfirmModal(null);
    setConfirmAmount('');
    setConfirmLink('');
  };

  const handleStartBidding = (activity: TripActivity, dayIndex: number, actIndex: number) => {
    if (!selectedTrip) return;

    // `act.cost` sai da viagem do storage: se o custo mudou (swap, recálculo do
    // GeneratedItineraryStage), o valor movido planned→bidding é o custo real.
    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip = { ...trip };
      const act = updatedTrip.days[dayIndex].activities[actIndex];
      act.status = 'bidding';

      // Update finances
      updatedTrip.finances.bidding += act.cost;
      updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - act.cost);

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);

    const dayDate = (stored ?? selectedTrip).days[dayIndex]?.date;
    setOffersModal({
      isOpen: true,
      activityName: activity.name,
      activityDate: String(dayDate || '').slice(0, 10),
    });
  };


  const handleAddManualExpense = () => {
    if (!selectedTrip || !manualExpense.name || manualExpense.amount <= 0) return;

    const amount = manualExpense.amount;
    const category = manualExpense.category;

    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip = { ...trip };

      updatedTrip.finances.confirmed += amount;
      updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.planned - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;

      // Update category
      updatedTrip.finances.categories[category].confirmed += amount;

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);

    toast({
      title: "Gasto adicionado! 💰",
      description: `${manualExpense.name}: R$ ${amount.toLocaleString()}`,
    });

    setManualExpenseModal(false);
    setManualExpense({ name: '', amount: 0, category: 'shopping' });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!selectedTrip) return;

    // O toggle passa a inverter o `checked` do disco, não o da closure: dois cliques
    // vindos de renders diferentes não podem mais se anular.
    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip = { ...trip };
      const item = updatedTrip.checklist.find((i) => i.id === itemId);
      if (item) item.checked = !item.checked;

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);
  };

  const handleUpdateBudget = () => {
    if (!selectedTrip) return;
    // `newBudget` fica FORA do updater de propósito: ele alimenta uma guarda com
    // early-return, e um updater não pode abortar a escrita — devolver a viagem
    // intocada gravaria e acordaria o sino à toa. A parte que importa (o recálculo de
    // `available` sobre planned/bidding/confirmed) roda sobre a viagem do storage.
    const newBudget = parseFloat(budgetEditValue) || selectedTrip.budget;
    if (newBudget <= 0) return;

    const stored = updateTrip(selectedTrip.id, (trip) => ({
      ...trip,
      budget: newBudget,
      // C.8 (D4): valor digitado = orçamento do usuário; o envelope do plano não o reescreve.
      budgetSource: 'user',
      finances: {
        ...trip.finances,
        total: newBudget,
        available: Math.max(0, newBudget - trip.finances.planned - trip.finances.bidding - trip.finances.confirmed),
      },
    }));
    if (stored) setSelectedTrip(stored);

    toast({
      title: 'Orçamento atualizado 💰',
      description: `Novo orçamento: R$ ${newBudget.toLocaleString('pt-BR')}`,
    });
    setBudgetEditOpen(false);
  };


  const handlePackingUpdate = (packingData: PackingData) => {
    if (!selectedTrip) return;

    // Escrita mais simples do lote: `packing` (campo fora do tipo, recon §4.6) atravessa
    // o funil pela index signature de `StoredTrip`, sem `as any`.
    const stored = updateTrip(selectedTrip.id, (trip) => ({ ...trip, packing: packingData }));
    if (stored) setSelectedTrip(stored);
  };

  const handleSwapActivity = (dayIndex: number, actIndex: number) => {
    if (!selectedTrip) return;
    const day = selectedTrip.days[dayIndex];
    const activity = day?.activities?.[actIndex];
    if (!activity) return;

    // Collect all activity ids currently used across every day
    // Keyed by normalized name, not id: the same venue lives under distinct
    // ids in distinct categories, and swapping must not reintroduce it.
    const usedNames = new Set<string>();
    selectedTrip.days.forEach((d) => d.activities.forEach((a) => usedNames.add(normalizePlaceName(a.name))));

    // Infer curated-pool category from current activity (time + type)
    const inferPoolCategory = (a: any): 'morning' | 'afternoon' | 'night' | 'breakfast' | 'lunch' | 'dinner' | null => {
      const hour = parseInt((a.time || '').split(':')[0], 10);
      const isFood = a.type === 'food' || a.category === 'comida';
      if (isFood) {
        if (!isNaN(hour)) {
          if (hour < 11) return 'breakfast';
          if (hour < 16) return 'lunch';
          return 'dinner';
        }
        return 'lunch';
      }
      if (a.category === 'voo' || a.category === 'hotel' || a.category === 'transporte') return null;
      if (!isNaN(hour)) {
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'night';
      }
      return 'afternoon';
    };

    const poolCategory = inferPoolCategory(activity);
    if (!poolCategory) {
      toast({ title: 'Sem outra opção curada para este horário' });
      return;
    }

    const pool = getDestinationActivities(selectedTrip.destination);
    const candidates = pool.filter((p: any) => p.category === poolCategory && !usedNames.has(normalizePlaceName(p.name)));
    if (candidates.length === 0) {
      toast({ title: 'Sem outra opção curada para este horário' });
      return;
    }
    const picked: any = candidates[Math.floor(Math.random() * candidates.length)];

    const isFoodSlot = poolCategory === 'breakfast' || poolCategory === 'lunch' || poolCategory === 'dinner';
    const newName = isFoodSlot
      ? `${poolCategory === 'breakfast' ? 'Café' : poolCategory === 'lunch' ? 'Almoço' : 'Jantar'}: ${picked.name}`
      : picked.name;

    // A candidata é escolhida a partir da `selectedTrip` (precisa dos early-returns com
    // toast, que um updater não pode fazer), mas a viagem gravada é montada sobre `trip`
    // — os outros dias e as outras atividades vêm do disco, não da closure.
    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip: StoredTrip = {
        ...trip,
        days: trip.days.map((d, di) => {
          if (di !== dayIndex) return d;
          return {
            ...d,
            activities: d.activities.map((a, ai) => {
              if (ai !== actIndex) return a;
              return {
                ...a,
                id: picked.id,
                name: newName,
                description: picked.tips?.[0] || a.description,
                status: 'suggestion' as ActivityStatus,
              };
            }),
          };
        }),
      };

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);
    toast({ title: 'Atividade trocada' });
  };

  const getTripDuration = (trip: SavedTrip): number => {
    if (!trip.startDate || !trip.endDate) return 7;
    return differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  };

  // handleHeroConfirm — saves flight/hotel confirmation to localStorage
  const handleHeroConfirm = (type: 'flight' | 'hotel', amount: number, flightDetails?: { airline?: string; departureTime?: string; returnTime?: string; outbound?: { airline?: string; flightNumber?: string; departureTime?: string }; return?: { airline?: string; flightNumber?: string; departureTime?: string } }, hotelDetails?: { name?: string; mealPlan?: string }) => {
    if (!selectedTrip) return;

    // `previousFlightPlanned`/`previousFlightConfirmed` são a BASE das subtrações de
    // finanças. Lê-las da `selectedTrip` significaria estornar um valor que talvez já
    // não esteja mais no disco — daí a derivação inteira rodar dentro do updater.
    let replan: { unplaced: UnplacedEdit[] } | null = null;
    const stored = updateTrip(selectedTrip.id, (trip) => {
      let updatedTrip = { ...trip };

      if (type === 'flight') {
        // Pernas como estavam (cópia: o bloco abaixo muda `option` no lugar).
        const legsOf = trip as unknown as Record<string, unknown>;
        const legsBefore = JSON.parse(JSON.stringify({ outbound: legsOf.outboundFlight ?? null, return: legsOf.returnFlight ?? null }));
        const previousFlightPlanned = getFlightPlannedTotal(updatedTrip);
        const previousFlightConfirmed = updatedTrip.finances.categories.flights.confirmed || 0;
        if (updatedTrip.flights?.outbound) {
          updatedTrip.flights.outbound.status = 'confirmed';
          updatedTrip.flights.outbound.price = amount;
        }
        if (updatedTrip.flights?.return) {
          updatedTrip.flights.return.status = 'confirmed';
        }
        updatedTrip.finances.confirmed = Math.max(0, updatedTrip.finances.confirmed - previousFlightConfirmed) + amount;
        updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - previousFlightPlanned);
        updatedTrip.finances.categories.flights.planned = 0;
        updatedTrip.finances.categories.flights.confirmed = amount;

        // Confirmado é a fonte mais forte: card, lista, Financeiro e PDF leem 'confirmed'.
        const legs = updatedTrip as unknown as Record<string, { source?: string } | undefined>;
        for (const k of ['outboundFlight', 'returnFlight']) if (legs[k]) legs[k] = { ...legs[k], source: 'confirmed' };
        const planned = updatedTrip.flights as unknown as Record<string, { source?: string } | undefined> | undefined;
        for (const k of ['outbound', 'return']) if (planned?.[k]) planned[k] = { ...planned[k], source: 'confirmed' };
        const ob = (updatedTrip as any).outboundFlight?.option;
        if (flightDetails?.outbound && ob) {
          if (flightDetails.outbound.airline) ob.airline = flightDetails.outbound.airline;
          if (flightDetails.outbound.flightNumber) (ob as any).flightNumber = flightDetails.outbound.flightNumber;
          if (flightDetails.outbound.departureTime) ob.departureTime = flightDetails.outbound.departureTime;
        }
        const rb = (updatedTrip as any).returnFlight?.option;
        if (flightDetails?.return && rb) {
          if (flightDetails.return.airline) rb.airline = flightDetails.return.airline;
          if (flightDetails.return.flightNumber) (rb as any).flightNumber = flightDetails.return.flightNumber;
          if (flightDetails.return.departureTime) rb.departureTime = flightDetails.return.departureTime;
        }

        // Backwards-compatible flat format from older TripPanel UI
        if (flightDetails && ob && !flightDetails.outbound && !flightDetails.return) {
          if (flightDetails.airline) ob.airline = flightDetails.airline;
          if (flightDetails.departureTime) ob.departureTime = flightDetails.departureTime;
        }
        if (flightDetails?.returnTime && rb && !flightDetails.return) {
          rb.departureTime = flightDetails.returnTime;
        }

        // Hora de saída nova → chegada recalculada; se D+n / dia 1 / último dia mudam, o
        // roteiro é replanejado preservando edições (R-V11) e avisado abaixo.
        const retimed = retimeConfirmedLegs(updatedTrip, legsBefore);
        updatedTrip = retimed.trip;
        if (retimed.replanned) replan = { unplaced: retimed.unplaced };
      } else {
        if (updatedTrip.accommodation) {
          updatedTrip.accommodation.status = 'confirmed';
          updatedTrip.accommodation.totalPrice = amount;
        }
        if (hotelDetails?.name && updatedTrip.accommodation) {
          updatedTrip.accommodation.name = hotelDetails.name;
        }
        if (hotelDetails?.mealPlan && updatedTrip.accommodation) {
          (updatedTrip.accommodation as any).mealPlan = hotelDetails.mealPlan;
        }
        updatedTrip.finances.confirmed += amount;
        updatedTrip.finances.categories.accommodation.confirmed += amount;
        updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - amount);
      }


      updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.planned - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;
      updatedTrip.progress = calculateProgress(updatedTrip);

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);

    // O `type` já é o vocabulário do evento. O `item_id` é o id fixo do item na viagem —
    // opaco, e o bastante para o dedupe do emissor não engolir hotel confirmado logo depois
    // de voo confirmado.
    trackTripItemConfirmed(
      selectedTrip.id,
      type,
      type === 'flight' ? 'flight-outbound' : 'accommodation',
    );

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    toast({
      title: type === 'flight' ? '✈️ Voo confirmado!' : '🏨 Hotel confirmado!',
      description: `R$ ${amount.toLocaleString('pt-BR')} registrado no FinOps.`,
    });
    // Replanejado pelo horário confirmado: aviso, nunca silêncio.
    if (replan) {
      const { unplaced } = replan as { unplaced: UnplacedEdit[] };
      toast(unplacedMessage(unplaced) ?? { title: 'Roteiro ajustado ao voo confirmado', description: 'Dia de chegada e último dia seguem os horários novos; suas edições foram mantidas.' });
    }
  };

  // handleHeroUnconfirm — reverse a flight/hotel confirmation, moving amounts back to planned
  const handleHeroUnconfirm = (type: 'flight' | 'hotel') => {
    if (!selectedTrip) return;

    // `previousConfirmed` é o valor a estornar — tem que ser o do disco, não o da
    // closure, senão o estorno devolve para `planned` um número que já mudou.
    const stored = updateTrip(selectedTrip.id, (trip) => {
      const updatedTrip = { ...trip };

      if (type === 'flight') {
        const previousConfirmed = updatedTrip.finances.categories.flights.confirmed || 0;
        if (updatedTrip.flights?.outbound) {
          updatedTrip.flights.outbound.status = 'planned';
        }
        if (updatedTrip.flights?.return) {
          updatedTrip.flights.return.status = 'planned';
        }
        updatedTrip.finances.confirmed = Math.max(0, updatedTrip.finances.confirmed - previousConfirmed);
        updatedTrip.finances.categories.flights.confirmed = 0;
        updatedTrip.finances.categories.flights.planned = previousConfirmed;
        updatedTrip.finances.planned += previousConfirmed;
      } else {
        const previousConfirmed = updatedTrip.finances.categories.accommodation.confirmed || (updatedTrip.accommodation?.totalPrice || 0);
        if (updatedTrip.accommodation) {
          updatedTrip.accommodation.status = 'planned';
        }
        updatedTrip.finances.confirmed = Math.max(0, updatedTrip.finances.confirmed - previousConfirmed);
        updatedTrip.finances.categories.accommodation.confirmed = Math.max(0, (updatedTrip.finances.categories.accommodation.confirmed || 0) - previousConfirmed);
        updatedTrip.finances.categories.accommodation.planned = (updatedTrip.finances.categories.accommodation.planned || 0) + previousConfirmed;
        updatedTrip.finances.planned += previousConfirmed;
      }

      updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.planned - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;
      updatedTrip.progress = calculateProgress(updatedTrip);

      return updatedTrip;
    });
    if (stored) setSelectedTrip(stored);

    toast({
      title: type === 'flight' ? '✈️ Confirmação desfeita' : '🏨 Confirmação desfeita',
      description: 'Valores voltaram para o planejado.',
    });
  };

  const handleUpdateTrip = (updater: (t: any) => any) => {
    if (!selectedTrip) return;

    // O updater passa a receber a viagem do STORAGE, não a cópia do estado React:
    // é o read-modify-write do funil. As outras viagens do array nunca são
    // reconstruídas a partir da memória (§4.1, §4.2).
    const stored = updateTrip(selectedTrip.id, (trip) => updater(trip));
    if (stored) setSelectedTrip(stored);
  };

  // ---- Itinerary edit helpers (drawer actions) ----
  const persistTrip = (updatedTrip: SavedTrip) => {
    // Os chamadores já montam a viagem inteira a partir da `selectedTrip`, então o
    // updater aqui é constante — o ganho é de ISOLAMENTO: só o slot deste id é
    // regravado, as demais viagens vêm do storage. `setTrips` sai: o sino recarrega
    // a lista no `emit` síncrono de dentro do `updateTrip`.
    const stored = updateTrip(updatedTrip.id, () => updatedTrip as StoredTrip);
    if (stored) setSelectedTrip(stored);
  };

  // Shared helper: fetch cheapest real flight price from Amadeus for a trip.
  // Returns null on any failure or empty results.
  const fetchCheapestFlightPrice = useCallback(async (trip: SavedTrip): Promise<number | null> => {
    try {
      // C.4.3: porta única da busca — só IATA conhecido; sem ele, não busca.
      const route = flightSearchRoute(trip);
      const date = trip.startDate?.split('T')[0];
      const adults = trip.travelers || 1;
      if (!date || !route) return null;
      const { origin, destination } = route;
      const { data, error } = await supabase.functions.invoke('amadeus-flights', {
        body: { action: 'search', origin, destination, date, adults },
      });
      if (error) return null;
      // Match TripPanel's parsing exactly: accept data.data, data.offers, or a
      // raw array response body. Do NOT gate on data.success — TripPanel doesn't.
      let offers: any[] = [];
      if (Array.isArray(data)) {
        offers = data;
      } else if (data?.data && Array.isArray(data.data)) {
        offers = data.data;
      } else if (data?.offers && Array.isArray(data.offers)) {
        offers = data.offers;
      }
      if (offers.length === 0) {
        console.info('[KINU monitor] offers=0 cheapest=null');
        return null;
      }
      const cheapest = Math.min(...offers.map((o: any) => Number(o.price) || Infinity));
      const result = Number.isFinite(cheapest) ? cheapest : null;
      console.info(`[KINU monitor] offers=${offers.length} cheapest=${result}`);
      return result;
    } catch {
      return null;
    }
  }, []);

  // Background price monitoring on trip open. Throttled to once per 12h.
  useEffect(() => {
    if (!selectedTrip) return;
    const lastCheck = (selectedTrip as any).lastPriceCheck;
    const now = Date.now();
    if (lastCheck?.checkedAt && (now - lastCheck.checkedAt) < 12 * 3600 * 1000) return;
    let cancelled = false;
    (async () => {
      const price = await fetchCheapestFlightPrice(selectedTrip);
      if (cancelled || price == null) return;
      const travelers = selectedTrip.travelers || 1;
      const comparable = Math.round(price * 2 * travelers);
      const anchor = getFlightPlannedTotal(selectedTrip);
      const delta = anchor > 0 ? Math.round(comparable - anchor) : 0;
      const updated: SavedTrip = {
        ...selectedTrip,
        lastPriceCheck: { price: comparable, delta, checkedAt: Date.now() },
      } as SavedTrip;
      persistTrip(updated);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip?.id]);

  const applyPlannedCostDelta = applyTripPlannedCostDelta;

  const findActivityLocation = (trip: SavedTrip, activityId: string): { dayIdx: number; actIdx: number } | null => {
    for (let d = 0; d < (trip.days || []).length; d++) {
      const idx = trip.days[d].activities.findIndex(a => a.id === activityId);
      if (idx >= 0) return { dayIdx: d, actIdx: idx };
    }
    return null;
  };

  const handleReplaceActivity = (activityId: string, suggested: import('@/data/destinationActivities').SuggestedActivity) => {
    if (!selectedTrip) return;
    const trip: SavedTrip = JSON.parse(JSON.stringify(selectedTrip));
    const loc = findActivityLocation(trip, activityId);
    if (!loc) return;
    const current = trip.days[loc.dayIdx].activities[loc.actIdx];
    const travelers = Math.max(1, trip.travelers || 1);
    const newCost = suggested.estimatedCostBRL || 0;
    const delta = (newCost - (current.cost || 0)) * travelers;
    const replaced: TripActivity = {
      ...current,
      // Preserve only the slot's time (and structural fields from spread that get overwritten below)
      id: suggested.id,
      name: suggested.name,
      description: suggested.tips?.[0] || '',
      cost: newCost,
      duration: suggested.durationHours ? `${suggested.durationHours}h` : '',
      status: 'planned',
      edited: true,
      // Reset stale confirmation/auction data from the previous activity
      paidAmount: undefined,
      confirmationLink: undefined,
      auction: undefined,
    };

    trip.days[loc.dayIdx].activities[loc.actIdx] = replaced;
    applyPlannedCostDelta(trip, current, delta);
    trip.progress = calculateProgress(trip);
    persistTrip(trip);
    setActivityDetailDrawer({ activity: replaced, open: true });
    toast({ title: '🔄 Sugestão trocada', description: suggested.name });
  };

  const handleAdjustTime = (activityId: string, newTime: string) => {
    if (!selectedTrip || !newTime) return;
    const trip: SavedTrip = JSON.parse(JSON.stringify(selectedTrip));
    const loc = findActivityLocation(trip, activityId);
    if (!loc) return;
    const day = trip.days[loc.dayIdx];
    day.activities[loc.actIdx] = { ...day.activities[loc.actIdx], time: newTime, edited: true };
    day.activities.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    persistTrip(trip);
    const moved = day.activities.find(a => a.id === activityId) || null;
    if (moved) setActivityDetailDrawer({ activity: moved, open: true });
    toast({ title: '🕐 Horário atualizado', description: newTime });
  };

  const handleRemoveActivity = (activityId: string) => {
    if (!selectedTrip) return;
    const trip: SavedTrip = JSON.parse(JSON.stringify(selectedTrip));
    const loc = findActivityLocation(trip, activityId);
    if (!loc) return;
    const current = trip.days[loc.dayIdx].activities[loc.actIdx];
    const travelers = Math.max(1, trip.travelers || 1);
    applyPlannedCostDelta(trip, current, -(current.cost || 0) * travelers);
    trip.days[loc.dayIdx].activities.splice(loc.actIdx, 1);
    trip.progress = calculateProgress(trip);
    persistTrip(trip);
    setActivityDetailDrawer(null);
    toast({ title: '🗑️ Atividade removida', description: current.name });
  };

  const handleAddActivity = (dia: number, suggested: SuggestedActivity, horario: string) => {
    if (!selectedTrip) return;
    const trip: SavedTrip = JSON.parse(JSON.stringify(selectedTrip));
    if (!addCatalogActivityToDay(trip, dia, suggested, horario)) return;
    persistTrip(trip);
    toast({ title: '➕ Atividade adicionada', description: suggested.name });
  };


  // Wire KINU AI proposedActions to the same handlers used by the drawer
  useEffect(() => {
    if (!selectedTrip) {
      registerActionHandlers(null);
      return;
    }
    const findDayActivity = (dia: number, name: string) => {
      const day = (selectedTrip.days || []).find(d => d.day === dia)
        || (selectedTrip.days || [])[dia - 1];
      if (!day) return null;
      const needle = name.toLowerCase().trim();
      const act = day.activities.find(a => a.name?.toLowerCase().includes(needle))
        || day.activities.find(a => needle.includes(a.name?.toLowerCase() || ''));
      return act || null;
    };

    registerActionHandlers({
      trocar_atividade: ({ dia, atividade_atual, nova_atividade }) => {
        const act = findDayActivity(dia, atividade_atual);
        if (!act) return null;
        const catalog = getDestinationActivities(selectedTrip.destination);
        const needle = (nova_atividade || '').toLowerCase().trim();
        const suggested = catalog.find(s => s.name.toLowerCase() === needle)
          || catalog.find(s => s.name.toLowerCase().includes(needle))
          || catalog.find(s => needle.includes(s.name.toLowerCase()));
        if (!suggested) return null;
        handleReplaceActivity(act.id, suggested);
        return `✅ Feito — ${act.name} → ${suggested.name} no dia ${dia}`;
      },
      ajustar_horario: ({ dia, atividade, novo_horario }) => {
        const act = findDayActivity(dia, atividade);
        if (!act || !novo_horario) return null;
        handleAdjustTime(act.id, novo_horario);
        return `✅ Feito — ${act.name} agora às ${novo_horario} no dia ${dia}`;
      },
      remover_atividade: ({ dia, atividade }) => {
        const act = findDayActivity(dia, atividade);
        if (!act) return null;
        handleRemoveActivity(act.id);
        return `✅ Feito — ${act.name} removida do dia ${dia}`;
      },
      confirmar_item: ({ tipo }) => {
        if (tipo !== 'voo' && tipo !== 'hotel') return null;
        setActiveTab('painel');
        setPendingConfirmRequest({ tipo, ts: Date.now() });
        return `🔔 Abri a confirmação do ${tipo === 'voo' ? 'voo' : 'hotel'}. Confere os detalhes e confirma pra mim.`;
      },
      adicionar_atividade: ({ dia, atividade, horario }) => {
        const catalog = getDestinationActivities(selectedTrip.destination);
        const needle = (atividade || '').toLowerCase().trim();
        const suggested = catalog.find(s => s.name.toLowerCase() === needle)
          || catalog.find(s => s.name.toLowerCase().includes(needle))
          || catalog.find(s => needle.includes(s.name.toLowerCase()));
        if (!suggested || !horario) return null;
        handleAddActivity(dia, suggested, horario);
        return `✅ Feito — ${suggested.name} adicionada às ${horario} no dia ${dia}`;
      },
      verificar_ofertas: async () => {
        try {
          const route = flightSearchRoute(selectedTrip);
          if (!route) return `${FLIGHT_SEARCH_NO_IATA}.`;
          const cheapest = await fetchCheapestFlightPrice(selectedTrip);
          if (cheapest == null) {
            return 'Não consegui consultar os preços agora — tenta de novo em instantes.';
          }
          const { origin, destination } = route;
          const adults = selectedTrip.travelers || 1;
          const comparable = Math.round(cheapest * 2 * adults);
          const anchor = getFlightPlannedTotal(selectedTrip);
          const startD = selectedTrip.startDate ? new Date(selectedTrip.startDate) : undefined;
          const endD = selectedTrip.endDate ? new Date(selectedTrip.endDate) : undefined;
          const kiwiUrl = buildOfferLinks({
            category: 'flight',
            originCode: origin,
            destinationCode: destination,
            startDate: startD,
            endDate: endD,
            travelers: adults,
          }).find(l => l.partner === 'Kiwi')?.url || '';
          const delta = anchor > 0 ? Math.round(comparable - anchor) : 0;
          persistTrip({
            ...selectedTrip,
            lastPriceCheck: { price: comparable, delta, checkedAt: Date.now() },
          } as SavedTrip);
          // Tarifa só de ida × 2 contra um voo planejado de outra fonte não é comparação:
          // sem real vs real, o agente não fala número (mesma regra do Painel).
          return buildOfferCheckReply(selectedTrip, { price: comparable, delta }, anchor, kiwiUrl);
        } catch (err) {
          console.error('[verificar_ofertas] failed:', err);
          return 'Não consegui consultar os preços agora — tenta de novo em instantes.';
        }
      },

    });
    return () => registerActionHandlers(null);
  }, [selectedTrip, registerActionHandlers]);

  // Handle draft cockpit actions
  const handleSaveDraft = (updatedTrip: any) => {
    // Update puro: o cockpit só abre para uma viagem que JÁ está no storage
    // (criada por `addTrip` no wizard/chat) e devolve `{ ...trip }` com o mesmo id —
    // não há caminho de viagem inédita aqui, logo não há fallback `addTrip`. Como o
    // chamador já montou a viagem inteira, o updater é constante: o ganho é o mesmo
    // do `persistTrip` (:766) — só o slot deste id é regravado, as demais viagens
    // vêm do storage (§4.1, §4.2). `setTrips` sai: o sino recarrega a lista.
    const stored = updateTrip(updatedTrip.id, () => updatedTrip as StoredTrip);
    if (stored) setSelectedTrip(stored);
  };

  // Caminho único de ativação (card e cockpit): ativa o que está gravado, nunca gera dias.
  const handleActivateDraft = (tripId: string) => {
    const result = activateDraft(tripId, user?.id);
    if ('message' in result) {
      toast({ title: 'Não deu para ativar', description: result.message, variant: 'destructive' });
      return;
    }
    if ('trip' in result) setSelectedTrip(result.trip);
    toast({ title: 'Viagem ativada! 🚀', description: 'Sua viagem está pronta para acompanhamento.' });
  };

  // DEBUG: temporary export of selected trip itinerary as a .txt file
  const handleExportDebug = () => {
    if (!selectedTrip) return;

    const lines: string[] = [];
    lines.push('KINU — DEBUG ROTEIRO');
    lines.push('====================');
    lines.push('');
    lines.push(`Destino: ${selectedTrip.emoji} ${selectedTrip.destination}, ${selectedTrip.country}`);
    lines.push(`Datas: ${selectedTrip.startDate ? format(new Date(selectedTrip.startDate), 'dd/MM/yyyy', { locale: ptBR }) : '?'} - ${selectedTrip.endDate ? format(new Date(selectedTrip.endDate), 'dd/MM/yyyy', { locale: ptBR }) : '?'}`);
    lines.push(`Viajantes: ${selectedTrip.travelers}`);
    lines.push(`Orçamento: R$ ${selectedTrip.budget.toLocaleString('pt-BR')}`);
    lines.push(`Nível de preço: ${selectedTrip.budgetType}`);
    lines.push(`Interesses: ${((selectedTrip as any).travelInterests || []).join(', ') || '-'}`);
    lines.push('');

    lines.push('VOO');
    lines.push('---');
    const obFlight = (selectedTrip as any).outboundFlight?.option || selectedTrip.flights?.outbound;
    if (obFlight) {
      lines.push(`Rota: ${selectedTrip.origin || 'Brasil'} → ${selectedTrip.destination}`);
      lines.push(`Companhia: ${obFlight.airline || '-'}`);
      lines.push(`Voo: ${obFlight.flightNumber || '-'}`);
      lines.push(`Direto: ${obFlight.isDirect ? 'Sim' : 'Não'}`);
      lines.push(`Duração: ${obFlight.duration || '-'}`);
      lines.push(`Horário: ${obFlight.departureTime || '-'}`);
      lines.push(`Status: ${selectedTrip.flights?.outbound?.status || '-'}`);
    } else {
      lines.push('Nenhum voo selecionado.');
    }
    lines.push('');

    lines.push('HOTEL');
    lines.push('-----');
    const hotel = selectedTrip.accommodation;
    if (hotel) {
      lines.push(`Nome: ${hotel.name || '-'}`);
      lines.push(`Bairro: ${hotel.neighborhood || '-'}`);
      lines.push(`Noites: ${hotel.totalNights || 0}`);
      lines.push(`Regime: ${(hotel as any).mealPlan || '-'}`);
      lines.push(`Status: ${hotel.status || '-'}`);
    } else {
      lines.push('Nenhum hotel selecionado.');
    }
    lines.push('');

    const pool = getDestinationActivities(selectedTrip.destination);
    lines.push(`DIAS (${selectedTrip.days?.length || 0})`);
    lines.push('==================');

    selectedTrip.days?.forEach((day) => {
      const dayTotal = day.activities.reduce((sum, a) => sum + (a.cost || 0), 0);
      lines.push('');
      lines.push(`DIA ${day.day} — ${day.date ? format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR }) : 'sem data'} — ${day.title} ${day.icon || ''}`);
      lines.push(`Custo total do dia: R$ ${dayTotal.toLocaleString('pt-BR')}`);
      lines.push('Atividades:');

      if (day.activities.length === 0) {
        lines.push('  (sem atividades)');
      } else {
        day.activities.forEach((activity) => {
          const poolActivity = pool.find((p: any) => p.id === activity.id);
          const dayOccupancy = (activity as any).dayOccupancy || (poolActivity as any)?.dayOccupancy;
          const occupancyPart = dayOccupancy ? ` | dayOccupancy: ${dayOccupancy}` : '';
          const cost = typeof activity.cost === 'number' ? activity.cost : 0;
          lines.push(`  ${activity.time} — ${activity.name} (${activity.type || activity.category || 'passeio'})${occupancyPart} | R$ ${cost.toLocaleString('pt-BR')} | ${activity.status}`);
        });
      }
    });

    lines.push('');
    lines.push('FIM DO ROTEIRO');

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roteiro-${selectedTrip.destination}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate basic days for a trip - WITH CORRECT DAY LOGIC AND REALISTIC PRICES
  // Enquanto a sessão não resolve, espera — não decide. Devolver null aqui
  // seria uma tela branca a cada reload; o guard acima é quem redireciona.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Budget Edit Dialog — C.8: também no ramo do rascunho ("trocar" do 💰 no KinuDidCard).
  const budgetDialog = (
    <Dialog open={budgetEditOpen} onOpenChange={setBudgetEditOpen}>
      <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc]">
        <DialogHeader>
          <DialogTitle className="font-['Outfit']">Editar orçamento</DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            Atualize o valor total disponível para a viagem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            type="number"
            value={budgetEditValue}
            onChange={(e) => setBudgetEditValue(e.target.value)}
            className="bg-[#0f172a] border-[#334155] text-[#f8fafc] placeholder:text-[#64748b]"
            placeholder="Valor em R$"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setBudgetEditOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:bg-[#334155] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateBudget}
              className="px-4 py-2 rounded-lg text-sm bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Draft Trip → Flight Selection Flow
  if (selectedTrip && selectedTrip.status === 'draft') {
    // Todo rascunho (onboarding, wizard, KINU AI) é o mesmo cockpit: card + um só Ativar,
    // que chama activateDraft pelo onActivate do cockpit.
    return (
      <div id="draft-cockpit">
        <DraftCockpit
          trip={selectedTrip as any}
          onSave={handleSaveDraft}
          onActivate={handleActivateDraft}
          onClose={() => setSelectedTrip(null)}
          onUpdateTrip={handleUpdateTrip}
          onEditBudget={() => {
            setBudgetEditValue(String(selectedTrip.budget ?? ''));
            setBudgetEditOpen(true);
          }}
        />
        {budgetDialog}
      </div>
    );
  }

  // --- Trip detail renderer ---
  const renderTripDetailContent = () => {
    if (!selectedTrip) return null;
    
    const currentDay = selectedTrip.days?.find((d) => d.day === selectedDay);
    // Primeira atividade não-logística e não resolvida do dia visível —
    // âncora da dica do Roteiro (pula se não houver / não estiver no DOM).
    const firstActionableActivityId = (() => {
      const isLogisticsActivity = (a: TripActivity) =>
        a.isHeroItem ||
        a.category === 'voo' ||
        (a.category === 'hotel' &&
          (a.name?.toLowerCase().includes('check-in') ||
            a.name?.toLowerCase().includes('check-out'))) ||
        a.name?.toLowerCase().includes('check-in aeroporto') ||
        a.name?.toLowerCase().includes('transfer');
      const a = (currentDay?.activities || []).find(
        (x) =>
          !isLogisticsActivity(x) &&
          x.status !== 'confirmed' &&
          x.status !== 'cancelled',
      );
      return a?.id ?? null;
    })();
    // C.5b — os mesmos caminhos de antes, só mudando de lugar: voo/hotel abre o sheet do
    // TripPanel (aba Painel) como o `confirmar_item` do KINU AI já fazia.
    const openAnchorConfirm = (tipo: 'voo' | 'hotel') => {
      setActiveTab('painel');
      setPendingConfirmRequest({ tipo, ts: Date.now() });
    };
    // Detalhe do item aberto: foto + nota + aberto/fechado (Places), Michelin, Clã.
    const renderRoteiroDetail = (activity: TripActivity) => {
      const isFoodActivity = activity.type === 'food' || activity.category === 'comida' || activity.name?.toLowerCase().includes('restaurante') || activity.name?.toLowerCase().includes('jantar') || activity.name?.toLowerCase().includes('almoço');
      const michelinMatch = isFoodActivity ? findMichelinMatch(activity.name || '', selectedTrip.destination) : null;
      return (
        <>
          {michelinMatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 w-fit">
              {getMichelinStarDisplay(michelinMatch.stars)} Michelin
              {michelinMatch.stars > 1 && ` · ${michelinMatch.cuisine}`}
            </span>
          )}
          <PlaceInfoCard activityName={activity.name} destination={selectedTrip.destination} />
          {activity.category !== 'voo' && activity.category !== 'hotel' && (
            <ClaProof activityId={catalogIdOf(activity.id)} city={selectedTrip.destination} />
          )}
        </>
      );
    };
    const tripSeverity = selectedTrip.jetLagSeverity || 'BAIXO';
    const showJetLagAlert = selectedTrip.jetLagMode && (
      (tripSeverity === 'MODERADO' && selectedDay === 2) ||
      (tripSeverity === 'ALTO' && selectedDay >= 2 && selectedDay <= 3) ||
      (tripSeverity === 'SEVERO' && selectedDay >= 2 && selectedDay <= 4)
    );
    const isRecoveryDay = tripSeverity === 'SEVERO' && selectedDay >= 3 && selectedDay <= 4;

    return (
      <div className="min-h-screen bg-[#0f172a] pb-36 lg:pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setSelectedTrip(null)}
              className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#f8fafc]" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg font-['Outfit'] text-[#f8fafc]">
                {selectedTrip.emoji} {selectedTrip.destination}, {selectedTrip.country}
              </h1>
              <p className="text-sm text-[#94a3b8]">
                {selectedTrip.startDate && format(new Date(selectedTrip.startDate), "dd MMM", { locale: ptBR })} - {selectedTrip.endDate && format(new Date(selectedTrip.endDate), "dd MMM yyyy", { locale: ptBR })} • R$ {selectedTrip.budget.toLocaleString()}
              </p>
            </div>
            {import.meta.env.DEV && (
            <button
              onClick={handleExportDebug}
              className="flex-shrink-0 text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#10b981]/50 transition-colors"
              title="Exportar roteiro para debug"
            >
              📄 Exportar Roteiro (debug)
            </button>
            )}
          </div>

          {/* Tabs */}
          {(() => {
            return (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'painel' as const, label: '📊 Painel' },
                  { id: 'roteiro' as const, label: '🗺️ Roteiro' },
                  { id: 'financeiro' as const, label: '💰 Financeiro' },
                  { id: 'preparacao' as const, label: '✅ Preparação' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            );
          })()}
        </header>

        <main className="px-4 py-6">
          {/* Painel Tab */}
          {activeTab === 'painel' && (
            <TabErrorBoundary tabName="Painel"><div className="animate-fade-in">

              <TripPanel
              trip={selectedTrip}
              exporterName={user?.name}
              exporterEmail={user?.email}
              onConfirm={handleHeroConfirm}
              onUnconfirm={handleHeroUnconfirm}
              onUpdateTrip={handleUpdateTrip}
              pendingConfirmRequest={pendingConfirmRequest}
              onPendingConfirmHandled={() => setPendingConfirmRequest(null)}
              onOpenAuction={(type) => {
                const startDate = selectedTrip.startDate;
                setOffersModal({
                  isOpen: true,
                  activityName: type === 'flight' ? 'Voo de Ida e Volta' : 'Hospedagem',
                  activityDate: String(startDate || '').slice(0, 10),
                });
              }}
              onNavigateTab={(tab, categoryFilter) => {
                setActiveTab(tab as any);
                if (categoryFilter) {
                  const filterMap: Record<string, string> = {
                    'passeio': 'passeio',
                    'comida': 'comida',
                    'transporte': 'logistics',
                    'hotel': 'logistics',
                  };
                  setRoteiroCategoryFilter(filterMap[categoryFilter] || null);
                }
              }}
            />
            </div></TabErrorBoundary>
          )}

          {/* Roteiro Tab */}
          {activeTab === 'roteiro' && (
            <TabErrorBoundary tabName="Roteiro"><div className="animate-fade-in">
              <AgentTip agent="icarus" variant="compact" message={getIcarusRoteiro(selectedTrip, selectedDay)} />

              {/* O hotel com o porquê e a porta de saída, no topo do roteiro: hospedagem
                  é a moldura da viagem inteira, não um evento do dia do check-in. */}
              <HotelPlanBlock
                trip={selectedTrip}
                onSelectHotel={(hotel) => handleUpdateTrip((t) => applyHotelSwap(t, hotel))}
                onOpenOffers={() => setOffersModal({
                  isOpen: true,
                  activityName: 'Hospedagem',
                  activityDate: String(selectedTrip.startDate || '').slice(0, 10),
                })}
              />



              {/* Category Quick Filters */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {(() => {
                  const allActivities = (selectedTrip.days || []).flatMap(d => d.activities);
                  const categories = [
                    { id: null as string | null, label: '📅 Por dia', count: null as number | null, confirmed: 0 },
                    { id: 'comida', label: '🍽️ Alimentação',
                      count: allActivities.filter(a => a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service')).length,
                      confirmed: allActivities.filter(a => a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service') && a.status === 'confirmed').length },
                    { id: 'passeio', label: '🏛️ Passeios',
                      count: allActivities.filter(a => a.category === 'passeio').length,
                      confirmed: allActivities.filter(a => a.category === 'passeio' && a.status === 'confirmed').length },
                    { id: 'logistics', label: '✈️ Logística',
                      count: allActivities.filter(a => a.category === 'transporte').length,
                      confirmed: allActivities.filter(a => a.category === 'transporte' && a.status === 'confirmed').length },
                    { id: 'anchor', label: '⚓ Custos-âncora',
                      count: allActivities.filter(a => ['voo', 'hotel'].includes(a.category)).length,
                      confirmed: allActivities.filter(a => ['voo', 'hotel'].includes(a.category) && a.status === 'confirmed').length },
                  ];
                  return categories.map(cat => (
                    <button
                      key={cat.id || 'all'}
                      onClick={() => setRoteiroCategoryFilter(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        roteiroCategoryFilter === cat.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                      }`}
                    >
                      {cat.label}
                      {cat.count !== null && (
                        <span className="text-[10px] opacity-70">
                          {cat.confirmed}/{cat.count}
                        </span>
                      )}
                    </button>
                  ));
                })()}
              </div>

              {roteiroCategoryFilter !== null ? (
                /* FILTERED VIEW: All activities of this category across all days */
                <div className="space-y-3">
                  {(selectedTrip.days || []).flatMap((day, dayIdx) =>
                    day.activities
                      .filter(act => {
                        if (roteiroCategoryFilter === 'comida') return act.category === 'comida' && !act.name?.toLowerCase().includes('café da manhã') && !act.name?.toLowerCase().includes('room service');
                        if (roteiroCategoryFilter === 'passeio') return act.category === 'passeio';
                        if (roteiroCategoryFilter === 'logistics') return act.category === 'transporte';
                        if (roteiroCategoryFilter === 'anchor') return ['voo', 'hotel'].includes(act.category);
                      })
                      .map((activity) => {
                        const realActIdx = day.activities.indexOf(activity);
                        const acc = selectedTrip.finances?.categories?.accommodation;
                        const hotelDisplay = (acc?.planned || 0) + (acc?.confirmed || 0);
                        const showHotelTotal = roteiroCategoryFilter === 'anchor' && activity.category === 'hotel' && activity.cost === 0;
                        return (
                          <RoteiroLinha
                            key={`${dayIdx}-${activity.id}`}
                            activity={activity}
                            prefix={`Dia ${day.day}`}
                            priceBRL={showHotelTotal ? hotelDisplay : undefined}
                            expanded={expandedActivityIds.has(activity.id)}
                            onToggle={() => toggleExpandedActivity(activity.id)}
                            onCheck={() => setConfirmModal({ isOpen: true, activity, dayIndex: dayIdx, actIndex: realActIdx })}
                            onSwap={() => setSwapModal({ dayIndex: dayIdx, actIndex: realActIdx, activity })}
                            onConfirmAnchor={() => openAnchorConfirm(activity.category === 'voo' ? 'voo' : 'hotel')}
                            onOpenDetails={() => setActivityDetailDrawer({ activity, open: true })}
                            renderDetail={renderRoteiroDetail}
                            highlight={recentlyConfirmed === activity.id}
                          />
                        );
                      })
                  )}

                  {/* Category total */}
                  {(() => {
                    const filtered = (selectedTrip.days || []).flatMap(d => d.activities).filter(a => {
                    if (roteiroCategoryFilter === 'comida') return a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service');
                      if (roteiroCategoryFilter === 'passeio') return a.category === 'passeio';
                      if (roteiroCategoryFilter === 'logistics') return a.category === 'transporte';
                      if (roteiroCategoryFilter === 'anchor') return ['voo', 'hotel'].includes(a.category);
                      return true;
                    });
                    let total = filtered.reduce((s, a) => s + (a.cost || 0), 0);
                    let confirmed = filtered.filter(a => a.status === 'confirmed').reduce((s, a) => s + (a.paidAmount || a.cost || 0), 0);
                    if (roteiroCategoryFilter === 'anchor') {
                      const f = selectedTrip.finances?.categories;
                      total = (f?.flights?.planned || 0) + (f?.flights?.confirmed || 0) + (f?.accommodation?.planned || 0) + (f?.accommodation?.confirmed || 0);
                      confirmed = (f?.flights?.confirmed || 0) + (f?.accommodation?.confirmed || 0);
                    }
                    return (
                      <div className="p-3 rounded-xl bg-card border border-border mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{roteiroCategoryFilter === 'anchor' ? 'Total custos-âncora' : 'Total da categoria'}</span>
                          <span className="font-bold text-foreground">R$ {total.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-emerald-400">Confirmado: R$ {confirmed.toLocaleString('pt-BR')}</span>
                          <span className="text-amber-400">Pendente: R$ {(total - confirmed).toLocaleString('pt-BR')}</span>
                        </div>
                        {roteiroCategoryFilter === 'anchor' && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">Custos fixos contratados antes da viagem — não contam no gasto diário</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* EXISTING DAY-BY-DAY VIEW */
                <>
              {/* Day Timeline */}
              {selectedTrip.startDate && (
                <EnhancedDayTimeline
                  days={selectedTrip.days}
                  selectedDay={selectedDay}
                  onSelectDay={handleDayChange}
                  tripStartDate={selectedTrip.startDate}
                />
              )}

              {/* Jet Lag Alert */}
              {showJetLagAlert && selectedTrip.timezone && (
                <JetLagAlert
                  destination={selectedTrip.destination}
                  timezoneDiff={tripTimezone(selectedTrip).diff}
                  tzKnown={tripTimezone(selectedTrip).tzKnown}
                  severity={selectedTrip.jetLagSeverity}
                  isRecoveryDay={isRecoveryDay}
                />
              )}

              {/* Day Activities — C.5b: uma linha por item, detalhe e ações só ao abrir */}
              {currentDay && (() => {
                // Numbering source of truth for the map pins: the day's chronological
                // list of non-logistics activities (first = 1, second = 2…).
                currentDayRef.current = currentDay.day;
                const stopNumbers: Record<string, number> = {};
                currentDay.activities
                  .filter(a => !isLogistics(a))
                  .slice()
                  .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
                  .forEach((act, idx) => { stopNumbers[act.name] = idx + 1; });
                // OSRM leg times reported by the map — real > estimated (legBetween).
                const liveLegs = routeLegs && routeLegs.day === currentDay.day ? routeLegs.legs : null;
                const dayIndex = selectedTrip.days.findIndex((d) => d.day === currentDay.day);
                const hasRoute = !currentDay.title.includes('Embarque') && !currentDay.title.includes('Retorno');
                const dayDate = currentDay.date
                  ? parseISO(String(currentDay.date).slice(0, 10))
                  : selectedTrip.startDate
                    ? addDays(parseISO(String(selectedTrip.startDate).slice(0, 10)), currentDay.day - 1)
                    : undefined;

                return (
                <div
                  className={`transition-all duration-200 ${
                    isTransitioning
                      ? slideDirection === 'left' ? 'opacity-0 -translate-x-3' : 'opacity-0 translate-x-3'
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  <RoteiroDia
                    dayNumber={currentDay.day}
                    date={dayDate}
                    activities={currentDay.activities}
                    destination={selectedTrip.destination}
                    liveLegs={liveLegs}
                    expandedIds={expandedActivityIds}
                    onToggleExpand={toggleExpandedActivity}
                    onCollapseAll={() => setExpandedActivityIds(new Set())}
                    routeOpen={routeOpen}
                    onRouteToggle={() => setRouteOpen((o) => !o)}
                    mapAnchorRef={mapAnchorRef}
                    anchorActivityId={firstActionableActivityId}
                    anchorRef={roteiroActionRef}
                    highlightId={recentlyConfirmed}
                    renderMap={hasRoute ? () => (
                      <DailyRouteMap
                        destination={selectedTrip.destination}
                        activities={currentDay.activities}
                        hotelNeighborhood={selectedTrip.accommodation?.neighborhood}
                        hotelId={(selectedTrip.accommodation as AccommodationLike | undefined)?.curatedHotelId}
                        hotelName={selectedTrip.accommodation?.name}
                        focusActivityName={focusMapActivity}
                        stopNumbers={stopNumbers}
                        onLegsChange={handleRouteLegsChange}
                      />
                    ) : null}
                    onCheck={(activity, actIndex) => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                    onSwap={(activity, actIndex) => setSwapModal({ dayIndex, actIndex, activity })}
                    onConfirmAnchor={openAnchorConfirm}
                    onOpenDetails={(activity) => setActivityDetailDrawer({ activity, open: true })}
                    renderDetail={renderRoteiroDetail}
                  />
                </div>
                );
              })()}
                </>
              )}
            </div></TabErrorBoundary>
          )}

          {/* Financeiro Tab = Ofertas + Câmbio combined */}
          {activeTab === 'financeiro' && (
            <TabErrorBoundary tabName="Financeiro"><div className="animate-fade-in space-y-6">
              <AgentTip agent="hestia" variant="compact" message={getHestiaCambio(selectedTrip)} />

              
              {/* Budget Summary — C.5c: Planejado/Confirmado = Σ das linhas do razão; C.5d: tiles clicáveis. */}
              {(() => {
                const lines = razaoLines(selectedTrip);
                return (
                  <>
                    <FinanceiroTiles
                      budget={selectedTrip.budget}
                      lines={lines}
                      onEditBudget={() => {
                        setBudgetEditValue(selectedTrip.budget.toString());
                        setBudgetEditOpen(true);
                      }}
                    />

                    <FinanceiroRazao
                      lines={lines}
                      onConfirm={(tipo) => {
                        setActiveTab('painel');
                        setPendingConfirmRequest({ tipo, ts: Date.now() });
                      }}
                      onHotelOffers={() => setOffersModal({
                        isOpen: true,
                        activityName: 'Hospedagem',
                        activityDate: String(selectedTrip.startDate || '').slice(0, 10),
                      })}
                      onOpenDay={(dayNumber) => {
                        setRoteiroCategoryFilter(null);
                        setSelectedDay(dayNumber);
                        setActiveTab('roteiro');
                      }}
                      onCheck={(activity, dayIndex, actIndex) => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                    />

                    <QuandoDinheiroSai trip={selectedTrip} lines={lines} />
                  </>
                );
              })()}


              {/* Cumulative Spending Chart */}
              {(() => {
                const days = selectedTrip.days || [];
                if (days.length === 0) return null;
                const isLogistics = (a: any) => a.category === 'voo' || a.category === 'hotel';
                let cumulative = 0;
                const increments: number[] = [];
                const chartData = days.map((d, i) => {
                  const dayTotal = (d.activities || [])
                    .filter(a => !isLogistics(a))
                    .reduce((sum, a) => sum + (a.cost || 0), 0);
                  increments.push(dayTotal);
                  cumulative += dayTotal;
                  return { day: `Dia ${i + 1}`, total: Math.round(cumulative), incremento: Math.round(dayTotal) };
                });
                if (cumulative === 0) return null;

                const maxInc = Math.max(...increments);
                const avgInc = cumulative / days.length;
                const concentrated = maxInc > avgInc * 1.5;
                const peakIdx = increments.indexOf(maxInc);
                const insight = concentrated
                  ? `concentra no Dia ${peakIdx + 1}`
                  : 'distribuído ao longo da viagem';

                return (
                  <details className="group bg-[#1e293b] border border-[#334155] rounded-xl">
                    <summary className="list-none cursor-pointer p-3 flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#f8fafc] font-['Outfit']">📈 Gastos por dia</span>
                      <span className="text-xs text-[#94a3b8] font-['Outfit'] flex-1 min-w-0 truncate">· {insight}</span>
                      <ChevronRight size={14} className="text-[#94a3b8] transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="text-xs text-[#64748b] px-3 font-['Outfit']">Atividades e refeições. Voo e hotel não entram — veja o total no resumo acima.</p>
                    <div className="p-3">
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="cumColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} width={50} />
                          <RechartsTooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: '#f8fafc' }}
                            formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR')}`, name === 'total' ? 'Acumulado' : 'Incremento']}
                          />
                          <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fill="url(#cumColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </details>
                );
              })()}


              {/* Câmbio — só viagem internacional, colapsado */}
              <CambioBlock trip={selectedTrip} destinationCurrency={getDestinationCurrency(selectedTrip.destination)} />

            </div></TabErrorBoundary>
          )}

          {/* Preparação Tab = Packing + Checklist + Guia combined */}
          {activeTab === 'preparacao' && (
            <TabErrorBoundary tabName="Preparação">{(() => {
            const rawChecklist = selectedTrip.checklist || [];
            // C.9: o checklist lê as regras do destino (visto, vacina, tomada, seguro, recorte doméstico).
            const rules = destinationRules(selectedTrip);
            const scoped = scopeChecklist(rawChecklist, rules);
            const hiddenIds = new Set(scoped.hiddenIds);
            const visibleChecklist = scoped.items.filter((i) => !hiddenIds.has(i.id));
            const totalItems = visibleChecklist.length;
            const checkedItems = visibleChecklist.filter(i => i.checked).length;
            // C.8: Prontidão = voo + hotel + itens que exigem reserva, confirmados. Checklist tem o próprio contador.
            const ready = prontidao(selectedTrip);
            const readiness = ready.pct;

            return (
              <div className="animate-fade-in space-y-6">
                <AgentTip agent="hermes" variant="compact" message={getHermesPacking(selectedTrip)} />

                {/* C.9: regras do destino — uma linha, colapsado */}
                <DestinationRulesBlock rules={rules} />



                {/* Readiness Score */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#f8fafc] font-['Outfit']">🎯 Prontidão da viagem</h3>
                    <span className={`text-2xl font-bold font-['Outfit'] ${readiness >= 80 ? 'text-[#10b981]' : readiness >= 50 ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                      {readiness}%
                    </span>
                  </div>
                  <Progress value={readiness} className="h-2 bg-[#334155]" />
                  <p className="text-xs text-[#94a3b8] mt-2">{ready.done} de {ready.total} {ready.total === 1 ? 'reserva confirmada' : 'reservas confirmadas'} · voo, hotel e o que exige reserva</p>
                </div>

                {/* Bagagem — vazia vira uma linha */}
                <div>
                  <SmartPackingWithLuggage
                    tripId={selectedTrip.id}
                    destination={selectedTrip.destination}
                    duration={getTripDuration(selectedTrip)}
                    month={selectedTrip.startDate ? new Date(selectedTrip.startDate).getMonth() + 1 : undefined}
                    startDate={selectedTrip.startDate}
                  />
                </div>

                {/* Checklist — um bloco por categoria, aberto só o primeiro incompleto */}
                <div ref={preparacaoHeaderRef}>
                  <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">✅ Checklist <span className="text-xs font-normal text-[#94a3b8]">· {checkedItems} de {totalItems} prontos</span></h3>
                  <ChecklistBlocks items={visibleChecklist} onToggle={handleToggleChecklist} />
                </div>

                {/* Trip Guide — não renderiza vazio */}
                <TripGuide destinationCity={selectedTrip.destination} title="📖 Guia do Destino" />
              </div>
            );
          })()}</TabErrorBoundary>
          )}
        </main>


        {/* Offers Modal — Partner Links */}
        {offersModal && (
          <OffersModal
            isOpen={offersModal.isOpen}
            onClose={() => setOffersModal(null)}
            activityName={offersModal.activityName}
            activityDate={offersModal.activityDate}
            city={selectedTrip?.destination || ''}
          />
        )}


        {/* Confirm Activity Modal */}
        <Dialog open={confirmModal?.isOpen || false} onOpenChange={() => setConfirmModal(null)}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">✅ Confirmar Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#94a3b8] text-sm">{confirmModal?.activity.name}</p>
              {confirmModal?.activity.cost === 0 && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                  Atividade gratuita — confirme para marcar como concluída
                </p>
              )}
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Valor pago (R$)</label>
                <input
                  type="number"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Link/Confirmação (opcional)</label>
                <input
                  type="text"
                  value={confirmLink}
                  onChange={(e) => setConfirmLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <button
                onClick={handleConfirmActivity}
                className="w-full py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold"
              >
                Confirmar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Swap Activity Modal */}
        <Dialog open={!!swapModal} onOpenChange={(o) => { if (!o) setSwapModal(null); }}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-md mx-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">🔄 Trocar atividade — escolha uma opção</DialogTitle>
            </DialogHeader>
            {(() => {
              if (!swapModal || !selectedTrip) return null;
              const current = swapModal.activity;
              const inferPoolCategory = (a: any): 'morning' | 'afternoon' | 'night' | 'breakfast' | 'lunch' | 'dinner' | null => {
                const hour = parseInt((a.time || '').split(':')[0], 10);
                const isFood = a.type === 'food' || a.category === 'comida';
                if (isFood) {
                  if (!isNaN(hour)) {
                    if (hour < 11) return 'breakfast';
                    if (hour < 16) return 'lunch';
                    return 'dinner';
                  }
                  return 'lunch';
                }
                if (a.category === 'voo' || a.category === 'hotel' || a.category === 'transporte') return null;
                if (!isNaN(hour)) {
                  if (hour < 12) return 'morning';
                  if (hour < 18) return 'afternoon';
                  return 'night';
                }
                return 'afternoon';
              };
              const poolCategory = inferPoolCategory(current);
              const usedNames = new Set<string>();
              selectedTrip.days.forEach((d) => d.activities.forEach((a) => usedNames.add(normalizePlaceName(a.name))));
              const pool = poolCategory ? getDestinationActivities(selectedTrip.destination) : [];
              const candidates = poolCategory
                ? pool.filter((p: any) => p.category === poolCategory && !usedNames.has(normalizePlaceName(p.name)))
                : [];

              if (candidates.length === 0) {
                return (
                  <p className="text-sm text-[#94a3b8] py-4">Sem outras opções curadas para este horário.</p>
                );
              }

              const isFoodSlot = poolCategory === 'breakfast' || poolCategory === 'lunch' || poolCategory === 'dinner';

              const pick = (picked: any) => {
                const newName = isFoodSlot
                  ? `${poolCategory === 'breakfast' ? 'Café' : poolCategory === 'lunch' ? 'Almoço' : 'Jantar'}: ${picked.name}`
                  : picked.name;
                // As candidatas exibidas continuam derivadas da `selectedTrip` — é o que
                // está renderizado na tela. Só a ESCRITA passa pelo funil.
                const stored = updateTrip(selectedTrip.id, (trip) => {
                  const updatedTrip: StoredTrip = {
                    ...trip,
                    days: trip.days.map((d, di) => {
                      if (di !== swapModal.dayIndex) return d;
                      return {
                        ...d,
                        activities: d.activities.map((a, ai) => {
                          if (ai !== swapModal.actIndex) return a;
                          return {
                            ...a,
                            id: picked.id,
                            name: newName,
                            description: picked.tips?.[0] || a.description,
                            cost: typeof picked.estimatedCostBRL === 'number' ? picked.estimatedCostBRL : a.cost,
                            status: 'suggestion' as ActivityStatus,
                          };
                        }),
                      };
                    }),
                  };

                  return updatedTrip;
                });
                if (stored) setSelectedTrip(stored);
                setSwapModal(null);
                toast({ title: 'Atividade trocada' });
              };

              return (
                <div className="space-y-2">
                  {candidates.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => pick(c)}
                      className="w-full text-left p-3 bg-[#0f172a] border border-[#334155] rounded-xl hover:border-[#10b981]/60 transition-colors"
                    >
                      <div className="font-semibold text-[#f8fafc]">{c.name}</div>
                      <div className="text-xs text-[#94a3b8] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {c.neighborhood && <span>📍 {c.neighborhood}</span>}
                        {typeof c.rating === 'number' && <span>⭐ {c.rating}</span>}
                        <span className="text-emerald-400">
                          {c.estimatedCostBRL === 0 ? 'Grátis' : `~R$ ${c.estimatedCostBRL}`}
                        </span>
                      </div>
                      {c.tips?.[0] && (
                        <div className="text-xs text-[#94a3b8] mt-2 italic">💡 {c.tips[0]}</div>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>


        {/* Manual Expense Modal */}
        <Dialog open={manualExpenseModal} onOpenChange={setManualExpenseModal}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">💰 Adicionar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Descrição</label>
                <input
                  type="text"
                  value={manualExpense.name}
                  onChange={(e) => setManualExpense((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Uber do aeroporto"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Valor (R$)</label>
                <input
                  type="number"
                  value={manualExpense.amount || ''}
                  onChange={(e) => setManualExpense((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'flights' as const, label: '✈️ Voo' },
                    { id: 'accommodation' as const, label: '🏨 Hotel' },
                    { id: 'tours' as const, label: '🎯 Passeio' },
                    { id: 'food' as const, label: '🍽️ Comida' },
                    { id: 'transport' as const, label: '🚕 Transporte' },
                    { id: 'shopping' as const, label: '🛍️ Compras' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setManualExpense((prev) => ({ ...prev, category: cat.id }))}
                      className={`py-2 px-3 rounded-lg text-xs transition-colors ${
                        manualExpense.category === cat.id
                          ? 'bg-[#10b981] text-white'
                          : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddManualExpense}
                disabled={!manualExpense.name || manualExpense.amount <= 0}
                className="w-full py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Toaster />
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  // C.7: a lista vive na aba Início; aqui é só a viagem aberta, coluna única em todo tamanho.
  return (
    <>
      {selectedTrip ? renderTripDetailContent() : null}

      {budgetDialog}

      {/* Activity Detail Drawer */}
      {selectedTrip && (
        <ActivityDetailDrawer
          activity={activityDetailDrawer?.activity || null}
          destination={selectedTrip.destination}
          travelers={selectedTrip.travelers}
          open={activityDetailDrawer?.open || false}
          onClose={() => setActivityDetailDrawer(null)}
          onFocusOnMap={(name) => {
            setFocusMapActivity(name);
            setRouteOpen(true);
            setTimeout(() => {
              mapAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
          onReplaceActivity={handleReplaceActivity}
          onAdjustTime={handleAdjustTime}
          onRemoveActivity={handleRemoveActivity}
          usedActivityIds={(selectedTrip.days || []).flatMap(d => d.activities.map(a => a.id))}
          usedActivityNames={(selectedTrip.days || []).flatMap(d => d.activities.map(a => a.name))}
        />
      )}

      <BottomNav />
    </>
  );
};

export default Viagens;
