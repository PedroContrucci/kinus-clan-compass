import { useEffect, useState, useCallback, useMemo } from 'react';
import { useKinuAI } from "@/contexts/KinuAIContext";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, Tag, Plus, ChevronRight, Plane, Building, MapPin, Utensils, Car, ShoppingBag, RotateCcw, Settings, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { exportTripPDF } from '@/lib/tripPdfExport';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import JetLagAlert from '@/components/JetLagAlert';
import FinOpsDashboard from '@/components/FinOpsDashboard';
import SmartPacking from '@/components/SmartPacking';
import { DraftCockpit, TripGuide, ExchangeRates, AuctionList, EnhancedDayTimeline, SmartPackingWithLuggage, EnhancedExchangeRates, AuctionConfigModal } from '@/components/cockpit';
import { TripPanel } from '@/components/cockpit/TripPanel';
import { AgentTip } from '@/components/shared/AgentTip';
import { getIcarusRoteiro, getIcarusGuia, getIcarusLeilao, getHestiaFinOps, getHestiaCambio, getHestiaLeilao, getHermesChecklist, getHermesPacking } from '@/lib/agentMessages';
import { analyzeTrip, AgentInsight } from '@/engines/agentIntelligence';
import { SavedTrip, TripActivity, ChecklistItem, ActivityStatus, Offer, contextualTips } from '@/types/trip';
import { PackingData } from '@/types/packing';
import { getActivityPrice, determinePriceLevel, findBestPriceLevel, mapCategoryToPricingType, CITY_PRICES } from '@/lib/activityPricing';
import kinuLogo from '@/assets/KINU_logo.png';
import { findMichelinMatch, getMichelinStarDisplay } from '@/lib/michelinData';
import { BottomNav } from '@/components/shared/BottomNav';
import { TRAVEL_INTERESTS } from '@/components/wizard/types';
import { getDestinationActivities } from '@/data/destinationActivities';
import type { SuggestedActivity } from '@/data/destinationActivities';

import { DailyRouteMap } from '@/components/cockpit/DailyRouteMap';
import { ItineraryDayWeather } from '@/components/cockpit/ItineraryDayWeather';
import { PlaceInfoCard } from '@/components/cockpit/PlaceInfoCard';
import { ActivityDetailDrawer } from '@/components/cockpit/ActivityDetailDrawer';


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

const Viagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [activeTab, setActiveTab] = useState<'painel' | 'roteiro' | 'financeiro' | 'preparacao'>('painel');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [roteiroCategoryFilter, setRoteiroCategoryFilter] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<string | null>(null);
  const [auctionModal, setAuctionModal] = useState<{ isOpen: boolean; activityName: string; activityType: string; estimatedPrice?: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; activity: TripActivity; dayIndex: number; actIndex: number } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmLink, setConfirmLink] = useState('');
  const [manualExpenseModal, setManualExpenseModal] = useState(false);
  const [manualExpense, setManualExpense] = useState({ name: '', amount: 0, category: 'shopping' as keyof SavedTrip['finances']['categories'] });
  const [resetModal, setResetModal] = useState(false);
  const [auctionConfigModal, setAuctionConfigModal] = useState<{
    isOpen: boolean;
    activity: { id: string; name: string; type: string; cost: number };
    dayIndex: number;
    actIndex: number;
  } | null>(null);
  const [activityDetailDrawer, setActivityDetailDrawer] = useState<{ activity: TripActivity; open: boolean } | null>(null);
  const { setTripContext } = useKinuAI();

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
      });
    } else {
      setTripContext(null);
    }
  }, [selectedTrip, setTripContext]);

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    // Load trips
    const savedTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    setTrips(savedTrips);
  }, [navigate]);

  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setSlideDirection(day > selectedDay ? 'left' : 'right');
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDay(day);
      setIsTransitioning(false);
    }, 150);
  };

  const calculateProgress = (trip: SavedTrip) => {
    if (!trip?.days || !Array.isArray(trip.days)) return 0;
    
    let total = 0;
    let confirmed = 0;
    trip.days.forEach((day) => {
      if (day?.activities && Array.isArray(day.activities)) {
        day.activities.forEach((act) => {
          total++;
          if (act.status === 'confirmed') confirmed++;
        });
      }
    });
    return total > 0 ? Math.round((confirmed / total) * 100) : 0;
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-[#10b981]">🟢</span>;
      case 'cancelled':
        return <span className="text-red-500">🔴</span>;
      case 'bidding':
        return <span className="text-[#eab308] animate-pulse">🟡</span>;
      default:
        return <span className="text-[#64748b]">⚪</span>;
    }
  };

  const handleConfirmActivity = () => {
    if (!confirmModal || !selectedTrip) return;

    const amount = parseFloat(confirmAmount) || 0;
    const updatedTrip = { ...selectedTrip };
    const activity = updatedTrip.days[confirmModal.dayIndex].activities[confirmModal.actIndex];
    
    activity.status = 'confirmed';
    activity.paidAmount = amount;
    activity.confirmationLink = confirmLink;

    // Update finances with new structure
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - amount);
    updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;

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

    // Save
    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

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

    const updatedTrip = { ...selectedTrip };
    const act = updatedTrip.days[dayIndex].activities[actIndex];
    act.status = 'bidding';

    // Update finances
    updatedTrip.finances.bidding += act.cost;
    updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - act.cost);

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    setAuctionModal({
      isOpen: true,
      activityName: activity.name,
      activityType: activity.type,
      estimatedPrice: activity.cost,
    });
  };

  const handleAcceptOffer = (offer: Offer) => {
    toast({
      title: "Oferta selecionada! 🎉",
      description: `Fechou a reserva? Confirme para atualizar o FinOps.`,
    });
  };

  const handleActivateAuction = (config: { targetPrice: number; waitDays: number }) => {
    if (!selectedTrip || !auctionConfigModal) return;
    const { activity, dayIndex, actIndex } = auctionConfigModal;

    const newAuction = {
      id: `auction-${Date.now()}`,
      activityId: activity.id,
      name: activity.name,
      type: activity.type as 'flight' | 'hotel' | 'experience' | 'transport',
      targetPrice: config.targetPrice,
      currentBestPrice: null,
      bestPriceDate: null,
      bestPriceUrl: null,
      kinutEstimate: activity.cost,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + config.waitDays * 24 * 60 * 60 * 1000).toISOString(),
      maxWaitDays: config.waitDays,
      status: 'watching' as const,
      savings: 0,
    };

    const updatedTrip = { ...selectedTrip };
    if (!(updatedTrip as any).auctions) {
      (updatedTrip as any).auctions = [];
    }
    const auctions = (updatedTrip as any).auctions as any[];
    const existingIndex = auctions.findIndex((a: any) => a.activityId === activity.id);
    if (existingIndex >= 0) {
      auctions[existingIndex] = newAuction;
    } else {
      auctions.push(newAuction);
    }

    if (updatedTrip.days[dayIndex]?.activities[actIndex]) {
      updatedTrip.days[dayIndex].activities[actIndex].status = 'bidding';
    }

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    toast({
      title: "Leilão ativado! 🎯",
      description: `Monitorando "${activity.name}" por ${config.waitDays} dias. Preço alvo: R$ ${config.targetPrice.toLocaleString('pt-BR')}`,
    });
    setAuctionConfigModal(null);
  };

  const handleAddManualExpense = () => {
    if (!selectedTrip || !manualExpense.name || manualExpense.amount <= 0) return;

    const updatedTrip = { ...selectedTrip };
    const amount = manualExpense.amount;
    
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;
    
    // Update category
    updatedTrip.finances.categories[manualExpense.category].confirmed += amount;

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    toast({
      title: "Gasto adicionado! 💰",
      description: `${manualExpense.name}: R$ ${amount.toLocaleString()}`,
    });

    setManualExpenseModal(false);
    setManualExpense({ name: '', amount: 0, category: 'shopping' });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!selectedTrip) return;

    const updatedTrip = { ...selectedTrip };
    const item = updatedTrip.checklist.find((i) => i.id === itemId);
    if (item) item.checked = !item.checked;

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
  };

  const handleResetJourney = () => {
    localStorage.removeItem('kinu_trips');
    setTrips([]);
    setSelectedTrip(null);
    setResetModal(false);
    toast({
      title: "Jornada reiniciada! 🌿",
      description: "Bora planejar de novo?",
    });
    navigate('/planejar');
  };

  const handleDeleteTrip = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Tem certeza que deseja excluir esta viagem?');
    if (!confirmed) return;

    const filtered = trips.filter((t) => t.id !== tripId);
    localStorage.setItem('kinu_trips', JSON.stringify(filtered));
    setTrips(filtered);

    if (selectedTrip?.id === tripId) {
      setSelectedTrip(filtered.length > 0 ? filtered[0] : null);
    }

    toast({
      title: "Viagem excluída 🗑️",
      description: "A viagem foi removida da sua lista.",
    });
  };

  const handlePackingUpdate = (packingData: PackingData) => {
    if (!selectedTrip) return;

    const updatedTrip = { ...selectedTrip, packing: packingData };
    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
  };

  const getTripDuration = (trip: SavedTrip): number => {
    if (!trip.startDate || !trip.endDate) return 7;
    return differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍽️';
      case 'culture': return '🏛️';
      case 'transport': return '🚃';
      case 'photo': return '📸';
      case 'relax': return '🏨';
      default: return '📍';
    }
  };

  const getStatusLabel = (status: SavedTrip['status']) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', color: 'text-[#64748b]' };
      case 'active': return { label: 'Planejando', color: 'text-[#0ea5e9]' };
      case 'ongoing': return { label: 'Em Viagem', color: 'text-[#10b981]' };
      case 'completed': return { label: 'Concluída', color: 'text-[#8b5cf6]' };
      default: return { label: 'Rascunho', color: 'text-[#64748b]' };
    }
  };

  // handleHeroConfirm — saves flight/hotel confirmation to localStorage
  const handleHeroConfirm = (type: 'flight' | 'hotel', amount: number) => {
    if (!selectedTrip) return;
    const updatedTrip = { ...selectedTrip };

    if (type === 'flight') {
      if (updatedTrip.flights?.outbound) {
        updatedTrip.flights.outbound.status = 'confirmed';
        updatedTrip.flights.outbound.price = amount;
      }
      if (updatedTrip.flights?.return) {
        updatedTrip.flights.return.status = 'confirmed';
      }
      updatedTrip.finances.confirmed += amount;
      updatedTrip.finances.categories.flights.confirmed += amount;
    } else {
      if (updatedTrip.accommodation) {
        updatedTrip.accommodation.status = 'confirmed';
        updatedTrip.accommodation.totalPrice = amount;
      }
      updatedTrip.finances.confirmed += amount;
      updatedTrip.finances.categories.accommodation.confirmed += amount;
    }

    updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - amount);
    updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;
    updatedTrip.progress = calculateProgress(updatedTrip);

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);

    toast({
      title: type === 'flight' ? '✈️ Voo confirmado!' : '🏨 Hotel confirmado!',
      description: `R$ ${amount.toLocaleString('pt-BR')} registrado no FinOps.`,
    });
  };

  // Handle draft cockpit actions
  const handleSaveDraft = (updatedTrip: any) => {
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
    setSelectedTrip(updatedTrip);
  };

  const handleActivateDraft = (updatedTrip: any) => {
    updatedTrip.status = 'active';
    
    // Ensure days exist - generate basic itinerary if missing
    if (!updatedTrip.days || updatedTrip.days.length === 0) {
      const duration = getTripDuration(updatedTrip);
      updatedTrip.days = generateBasicDays(updatedTrip, duration);
    }
    
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
    setSelectedTrip(updatedTrip);
  };
  
  // Generate basic days for a trip - WITH CORRECT DAY LOGIC AND REALISTIC PRICES
  // Day 1 = DEPARTURE (user is in transit, NO local activities)
  // Day 2 = ARRIVAL (user arrives, check-in, light activities)
  // Days 3-N-1 = EXPLORATION (full days)
  // Day N = RETURN (check-out, flight home)
  const generateBasicDays = (trip: SavedTrip, duration: number) => {
    const days = [];
    const travelers = trip.travelers || 1;
    
    // Smart tier: find best price level that fits the declared budget
    const { level: priceLevel } = findBestPriceLevel(
      trip.destination, duration, travelers, trip.budget
    );
    const destination = trip.destination?.toLowerCase() || '';
    
    // Per-person prices (will be multiplied by travelers where applicable)
    const transferPricePP = getActivityPrice('transfer', trip.destination, priceLevel);
    const lunchPricePP = getActivityPrice('restaurant_lunch', trip.destination, priceLevel);
    const dinnerPricePP = getActivityPrice('restaurant_dinner', trip.destination, priceLevel);
    const museumPricePP = getActivityPrice('museum', trip.destination, priceLevel);
    const tourPricePP = getActivityPrice('tour', trip.destination, priceLevel);
    
    // Total prices: hotel/transfer shared, meals/entries/tours multiplied
    const transferPrice = transferPricePP; // Shared (1 taxi for the group)
    const lunchPrice = lunchPricePP * travelers;
    const dinnerPrice = dinnerPricePP * travelers;
    const museumPrice = museumPricePP * travelers;
    const tourPrice = tourPricePP * travelers;
    
    const usedActivityIds = new Set<string>();
    function pickActivity(category: 'morning' | 'afternoon' | 'night' | 'breakfast' | 'lunch' | 'dinner', destination: string, themeName: string): SuggestedActivity | null {
      const pool = getDestinationActivities(destination);
      const themeStyleMap: Record<string, string[]> = {
        'Cultura': ['culture', 'history', 'art'],
        'Gastronomia': ['gastronomy'],
        'Passeios': ['nature', 'romantic', 'shopping'],
        'Aventura': ['adventure', 'nature'],
        'Descobertas': ['culture', 'shopping', 'art'],
      };
      const targetTags = themeStyleMap[themeName] || [];
      let candidates = pool.filter(a => a.category === category && !usedActivityIds.has(a.id) && (targetTags.length === 0 || a.styleTags?.some(t => targetTags.includes(t))));
      if (candidates.length === 0) candidates = pool.filter(a => a.category === category && !usedActivityIds.has(a.id));
      if (candidates.length === 0) candidates = pool.filter(a => a.category === category);
      if (candidates.length === 0) return null;
      const picked = candidates[0];
      usedActivityIds.add(picked.id);
      return picked;
    }

    for (let i = 0; i < duration; i++) {
      const dayNum = i + 1;
      const isFirstDay = i === 0;
      const isSecondDay = i === 1;
      const isLastDay = i === duration - 1;
      
      let title = 'Exploração';
      let icon = '🗺️';
      let activities: TripActivity[] = [];
      
      if (isFirstDay) {
        // DAY 1 = DEPARTURE - User is traveling, NOT at destination
        title = 'Embarque';
        icon = '✈️';
        activities = [
          {
            id: `day${dayNum}-1`,
            name: `Voo para ${trip.destination}`,
            description: `Check-in 3h antes no aeroporto • Apresentar documentação e despachar bagagem`,
            time: '22:00',
            duration: trip.flights?.outbound?.duration || '12h',
            type: 'transport',
            category: 'voo',
            cost: getActivityPrice('flight', trip.destination, priceLevel) * travelers,
            status: 'planned' as ActivityStatus,
          },
        ];
      } else if (isSecondDay && duration > 2) {
        // DAY 2 = ARRIVAL - User arrives, jet lag, light day
        title = 'Chegada';
        icon = '🛬';
        activities = [
          {
            id: `day${dayNum}-1`,
            name: 'Chegada em ' + trip.destination,
            description: 'Desembarque e imigração',
            time: '11:00',
            duration: '1h',
            type: 'transport',
            category: 'voo',
            cost: 0, // No cost for arrival
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-2`,
            name: 'Transfer para o hotel',
            description: 'Táxi ou transporte público',
            time: '12:30',
            duration: '1h',
            type: 'transport',
            category: 'transporte',
            cost: transferPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-3`,
            name: 'Check-in no hotel',
            description: 'Deixar bagagens e descansar (adaptação jet lag)',
            time: '14:00',
            duration: '2h',
            type: 'relax',
            category: 'hotel',
            cost: 0, // Hotel cost already included in accommodation
            status: 'planned' as ActivityStatus,
            jetLagFriendly: true,
          },
          {
            id: `day${dayNum}-4`,
            name: 'Passeio leve pelo bairro',
            description: 'Explorar a região do hotel',
            time: '16:30',
            duration: '2h',
            type: 'walk',
            category: 'passeio',
            cost: 0, // Free walking activity
            status: 'planned' as ActivityStatus,
            jetLagFriendly: true,
          },
          {
            id: `day${dayNum}-5`,
            name: 'Jantar local',
            description: travelers > 1 ? `Primeira refeição no destino (${travelers} pessoas)` : 'Primeira refeição no destino',
            time: '19:30',
            duration: '1h30',
            type: 'food',
            category: 'comida',
            cost: dinnerPrice,
            status: 'planned' as ActivityStatus,
          },
        ];
      } else if (isLastDay) {
        // LAST DAY = RETURN - Check-out and flight home
        title = 'Retorno';
        icon = '🏠';
        activities = [
          {
            id: `day${dayNum}-1`,
            name: 'Café da manhã',
            description: 'Último café no hotel',
            time: '08:00',
            duration: '1h',
            type: 'food',
            category: 'comida',
            cost: 0, // Included in hotel
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-2`,
            name: 'Check-out do hotel',
            description: 'Preparar bagagens',
            time: '10:00',
            duration: '1h',
            type: 'relax',
            category: 'hotel',
            cost: 0,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-3`,
            name: 'Voo de retorno',
            description: 'Volta para casa',
            time: '14:00',
            duration: '12h',
            type: 'transport',
            category: 'voo',
            cost: getActivityPrice('flight', trip.destination, priceLevel) * travelers,
            status: 'planned' as ActivityStatus,
          },
        ];
      } else {
        // First exploration day with significant jet lag = recovery day
        const isArrivalRecoveryDay = (i === 2) && trip.jetLagMode &&
          (trip.jetLagSeverity === 'MODERADO' || trip.jetLagSeverity === 'ALTO' || trip.jetLagSeverity === 'SEVERO');

        if (isArrivalRecoveryDay) {
          title = 'Chegada e Recuperação';
          icon = '🛬';
          activities = [
            {
              id: `day${dayNum}-1`, name: 'Check-in no hotel',
              description: 'Acomodação e descanso após o voo', time: '15:00', duration: '1h',
              type: 'relax', category: 'hotel', cost: 0, status: 'planned' as ActivityStatus, jetLagFriendly: true,
            },
            {
              id: `day${dayNum}-2`, name: 'Caminhada leve no bairro',
              description: 'Conheça os arredores do hotel sem pressa, ajuda a regular o relógio biológico', time: '17:00', duration: '1h30',
              type: 'culture', category: 'passeio', cost: 0, status: 'planned' as ActivityStatus, jetLagFriendly: true,
            },
            {
              id: `day${dayNum}-3`, name: 'Jantar leve perto do hotel',
              description: 'Refeição leve para não sobrecarregar o corpo. Evite álcool e comida pesada.', time: '19:30', duration: '1h30',
              type: 'food', category: 'comida', cost: lunchPrice, status: 'planned' as ActivityStatus, jetLagFriendly: true,
            },
            {
              id: `day${dayNum}-4`, name: 'Descanso para regular o sono',
              description: 'Tente dormir no horário local mesmo se não estiver com sono.', time: '21:30', duration: '0h',
              type: 'relax', category: 'hotel', cost: 0, status: 'planned' as ActivityStatus, jetLagFriendly: true,
            },
          ];
        } else {
        // EXPLORATION DAYS - Full day activities with curated pool
        const themes = [
          { title: 'Cultura', icon: '🏛️' },
          { title: 'Gastronomia', icon: '🍽️' },
          { title: 'Passeios', icon: '🚶' },
          { title: 'Descobertas', icon: '🎭' },
          { title: 'Aventura', icon: '⭐' },
        ];
        const theme = themes[(i - 2) % themes.length];
        title = theme.title;
        icon = theme.icon;

        const morningAct = pickActivity('morning', trip.destination, theme.title);
        const afternoonAct = pickActivity('afternoon', trip.destination, theme.title);
        const nightAct = pickActivity('night', trip.destination, theme.title);
        const lunchAct = pickActivity('lunch', trip.destination, theme.title);
        const dinnerAct = pickActivity('dinner', trip.destination, theme.title);

        activities = [
          {
            id: `day${dayNum}-1`,
            name: 'Café da manhã',
            description: 'No hotel ou café local',
            time: '08:30',
            duration: '1h',
            type: 'food',
            category: 'comida',
            cost: 0,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-2`,
            name: morningAct?.name || 'Atividade da manhã',
            description: morningAct?.tips?.[0] || (travelers > 1 ? `Passeio cultural ou turístico (${travelers} pessoas)` : 'Passeio cultural ou turístico'),
            time: '10:00',
            duration: '2h30',
            type: 'culture',
            category: 'passeio',
            cost: museumPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-3`,
            name: lunchAct ? `Almoço: ${lunchAct.name}` : 'Almoço',
            description: lunchAct?.tips?.[0] || (travelers > 1 ? `Restaurante local (${travelers} pessoas)` : 'Restaurante local'),
            time: '13:00',
            duration: '1h30',
            type: 'food',
            category: 'comida',
            cost: lunchPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-4`,
            name: afternoonAct?.name || 'Atividade da tarde',
            description: afternoonAct?.tips?.[0] || (travelers > 1 ? `Exploração livre (${travelers} pessoas)` : 'Exploração livre'),
            time: '15:00',
            duration: '3h',
            type: 'culture',
            category: 'passeio',
            cost: tourPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-5`,
            name: dinnerAct ? `Jantar: ${dinnerAct.name}` : 'Jantar',
            description: dinnerAct?.tips?.[0] || (travelers > 1 ? `Gastronomia local (${travelers} pessoas)` : 'Gastronomia local'),
            time: '19:30',
            duration: '2h',
            type: 'food',
            category: 'comida',
            cost: dinnerPrice,
            status: 'planned' as ActivityStatus,
          },
        ];
        }
      }
      
      days.push({
        day: dayNum,
        title,
        icon,
        activities,
      });
    }
    
    return days;
  };

  if (!user) return null;

  // Draft Trip → Flight Selection Flow
  if (selectedTrip && selectedTrip.status === 'draft') {
    return (
      <DraftCockpit
        trip={selectedTrip as any}
        onSave={handleSaveDraft}
        onActivate={handleActivateDraft}
        onClose={() => setSelectedTrip(null)}
      />
    );
  }

  // --- Reusable trip list renderer ---
  const renderTripList = (isSidebar: boolean) => {
    const containerClass = isSidebar
      ? "h-screen overflow-y-auto border-r border-border bg-[#0f172a]"
      : "min-h-screen bg-[#0f172a] pb-20";

    return (
      <div className={containerClass}>
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">KINU</span>
          </div>
        </header>

        <main className="px-4 py-4">
          <h1 className={`font-bold mb-2 font-['Outfit'] text-[#f8fafc] ${isSidebar ? 'text-lg' : 'text-2xl'}`}>Minhas Viagens 💼</h1>
          {!isSidebar && <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">Teus roteiros salvos aparecem aqui.</p>}

          {trips.length > 0 ? (
            <div className="space-y-3">
              {trips.map((trip) => {
                const progress = calculateProgress(trip);
                const days = trip?.days && Array.isArray(trip.days) ? trip.days : [];
                const statusInfo = getStatusLabel(trip.status);
                const isSelected = selectedTrip?.id === trip.id;
                const totalActivities = days.reduce((acc, day) => acc + (day?.activities?.length || 0), 0);
                const confirmedActivities = days.reduce((acc, day) => {
                  const activities = day?.activities && Array.isArray(day.activities) ? day.activities : [];
                  return acc + activities.filter((a) => a.status === 'confirmed').length;
                }, 0);

                return (
                  <button
                    key={trip.id}
                    onClick={() => {
                      setSelectedTrip(trip);
                      setSelectedDay(1);
                      setActiveTab('painel');
                    }}
                    className={`w-full bg-[#1e293b] border rounded-2xl p-4 text-left transition-colors ${
                      isSelected && isSidebar
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-[#334155] hover:border-[#10b981]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-[#f8fafc] font-['Outfit'] truncate ${isSidebar ? 'text-sm' : 'text-lg'}`}>
                            {trip.emoji} {trip.destination}{!isSidebar && `, ${trip.country}`}
                          </h3>
                          <span className={`text-xs flex-shrink-0 ${statusInfo.color}`}>• {statusInfo.label}</span>
                        </div>
                        <p className="text-xs text-[#94a3b8]">
                          {trip.startDate && format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} - {trip.endDate && format(new Date(trip.endDate), "dd MMM", { locale: ptBR })}
                          {!isSidebar && ` • ${days.length} dias`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          className="p-1 rounded-lg hover:bg-red-500/20 text-[#64748b] hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                        {!isSidebar && <ChevronRight size={20} className="text-[#94a3b8]" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#94a3b8]">R$ {(trip.budget/1000).toFixed(0)}k</span>
                        <span className="text-[#f8fafc]">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-[#334155]" />
                    </div>
                    {!isSidebar && <p className="text-xs text-[#94a3b8] mt-1">{confirmedActivities} de {totalActivities} itens fechados</p>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-[#f8fafc] font-['Outfit'] text-lg mb-2">Nenhuma viagem salva</p>
              <button
                onClick={() => navigate('/planejar')}
                className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold font-['Outfit'] mt-4"
              >
                ✈️ Planejar Nova Viagem
              </button>
            </div>
          )}

          {trips.length > 0 && !isSidebar && (
            <div className="mt-8 pt-6 border-t border-[#334155]">
              <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={16} className="text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Modo Teste</span>
                </div>
                <button
                  onClick={() => setResetModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#ef4444] transition-colors"
                >
                  <RotateCcw size={16} />
                  Reiniciar Jornada
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  // --- Desktop: empty state for detail panel ---
  const renderEmptyDetail = () => (
    <div className="flex-1 flex items-center justify-center h-screen bg-[#0f172a]">
      <div className="text-center">
        <div className="text-5xl mb-4">👈</div>
        <p className="text-[#94a3b8] font-['Outfit'] text-lg">Selecione uma viagem</p>
      </div>
    </div>
  );

  // --- Trip detail renderer ---
  const renderTripDetailContent = () => {
    if (!selectedTrip) return null;
    
    const currentDay = selectedTrip.days?.find((d) => d.day === selectedDay);
    const tripSeverity = selectedTrip.jetLagSeverity || 'BAIXO';
    const showJetLagAlert = selectedTrip.jetLagMode && (
      (tripSeverity === 'MODERADO' && selectedDay === 2) ||
      (tripSeverity === 'ALTO' && selectedDay >= 2 && selectedDay <= 3) ||
      (tripSeverity === 'SEVERO' && selectedDay >= 2 && selectedDay <= 4)
    );
    const isRecoveryDay = tripSeverity === 'SEVERO' && selectedDay >= 3 && selectedDay <= 4;

    return (
      <div className="min-h-screen lg:h-screen lg:overflow-y-auto bg-[#0f172a] pb-20 lg:pb-0">
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
          </div>

          {/* Tabs */}
          {(() => {
            const tripInsights = selectedTrip ? analyzeTrip(selectedTrip) : [];
            const criticalHighCount = tripInsights.filter(i => i.priority === 'critical' || i.priority === 'high').length;
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
                    {tab.id === 'painel' && criticalHighCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                        {criticalHighCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })()}
        </header>

        <main className="px-4 py-6">
          {/* Painel Tab */}
          {activeTab === 'painel' && (
            <div className="animate-fade-in">
              {/* Agent Proactive Insights */}
              {(() => {
                const insights = analyzeTrip(selectedTrip);
                const topInsights = insights.slice(0, 3);
                if (topInsights.length === 0) return null;
                return (
                  <div className="mb-4 space-y-2">
                    {topInsights.map((insight) => (
                      <AgentTip
                        key={insight.id}
                        agent={insight.agent}
                        variant="full"
                        message={insight.message}
                        action={insight.action ? {
                          label: insight.action.label,
                          onClick: () => setActiveTab(insight.action!.tab as any),
                        } : undefined}
                      />
                    ))}
                  </div>
                );
              })()}
              {/* Curadoria do Roteiro Card */}
              {(selectedTrip as any).travelInterests && (selectedTrip as any).travelInterests.length > 0 && (
                <div className="mb-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
                  <div className="p-4 pb-2">
                    <h3 className="text-sm font-bold text-foreground font-['Outfit']">🎯 Roteiro curado para você</h3>
                  </div>
                  <div className="px-4 pb-3 space-y-2">
                    {((selectedTrip as any).travelInterests as string[]).map(interest => {
                      const keywordMap: Record<string, string[]> = {
                        'gastronomy': ['restaurante', 'jantar', 'almoço', 'café', 'market', 'culinária', 'gastronomia', 'michelin', 'food'],
                        'culture': ['museu', 'museum', 'catedral', 'igreja', 'templo', 'palace', 'castelo', 'história', 'cultural'],
                        'art': ['museu', 'museum', 'galeria', 'gallery', 'arte', 'art', 'orsay', 'louvre', 'uffizi'],
                        'history': ['museu', 'museum', 'ruínas', 'fort', 'castelo', 'palace', 'histórico', 'antiga', 'romano'],
                        'adventure': ['trekking', 'snorkeling', 'kayak', 'surf', 'mountain', 'canoa', 'mergulho', 'hiking'],
                        'beach': ['beach', 'praia', 'island', 'ilha', 'bay', 'baía', 'costa', 'snorkeling'],
                        'nature': ['parque', 'garden', 'jardim', 'mountain', 'floresta', 'cachoeira', 'natureza', 'trilha'],
                        'nightlife': ['bar', 'rooftop', 'club', 'noturno', 'night', 'jazz', 'música'],
                        'shopping': ['shopping', 'mercado', 'market', 'bazar', 'loja', 'compras', 'souk'],
                        'relaxation': ['spa', 'praia', 'beach', 'termas', 'relax', 'piscina', 'jardim'],
                        'family': ['parque', 'zoo', 'aquário', 'museu', 'praia', 'beach'],
                        'winter': ['ski', 'neve', 'snow', 'mountain', 'termas', 'chocolate'],
                      };
                      const interestMeta = TRAVEL_INTERESTS.find(i => i.id === interest);
                      const keywords = keywordMap[interest] || [];
                      const matches = (selectedTrip.days || []).flatMap(day =>
                        day.activities.filter(act => {
                          const name = (act.name || '').toLowerCase();
                          return keywords.some(kw => name.includes(kw)) &&
                            act.category !== 'voo' && act.category !== 'transporte' && act.category !== 'hotel';
                        })
                      ).slice(0, 4);
                      if (matches.length === 0) return null;
                      return (
                        <div key={interest} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                            <span className="text-sm">{interestMeta?.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{interestMeta?.icon} {interestMeta?.label}</p>
                            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                              {matches.map(m => m.name.replace(/^(Jantar|Almoço|Café):\s*/i, '')).join(' · ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Biology AI */}
                    {(selectedTrip as any).jetLagMode && (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                          <span className="text-sm">🧠</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">🧠 Biology AI</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                            Ritmo adaptado ao fuso ({(selectedTrip as any).jetLagSeverity || 'MODERADO'})
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <p className="text-[11px] text-muted-foreground text-center pt-1 border-t border-border/50">
                      {selectedTrip.days?.reduce((s, d) => s + d.activities.filter(a =>
                        a.category !== 'voo' && a.category !== 'transporte' && a.category !== 'hotel'
                      ).length, 0) || 0} atividades curadas · {
                        selectedTrip.days?.reduce((s, d) => s + d.activities.filter(a =>
                          a.category === 'comida'
                        ).length, 0) || 0} restaurantes selecionados
                    </p>
                  </div>
                </div>
              )}

              <TripPanel
              trip={selectedTrip}
              onConfirm={handleHeroConfirm}
              onOpenAuction={(type) => {
                setAuctionModal({
                  isOpen: true,
                  activityName: type === 'flight' ? 'Voo de Ida e Volta' : 'Hospedagem',
                  activityType: type,
                  estimatedPrice: type === 'flight'
                    ? (selectedTrip.flights?.outbound?.price || 0) + (selectedTrip.flights?.return?.price || 0)
                    : selectedTrip.accommodation?.totalPrice || 0,
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

              {/* Sticky PDF Export Bar */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground font-['Outfit']">Exportar Roteiro em PDF</p>
                  <p className="text-[10px] text-muted-foreground">PDF premium com fotos, mapa e dicas</p>
                </div>
                <button
                  onClick={() => exportTripPDF(selectedTrip)}
                  className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Gerar PDF
                </button>
              </div>
            </div>
          )}

          {/* Roteiro Tab */}
          {activeTab === 'roteiro' && (
            <div className="animate-fade-in">
              <AgentTip agent="icarus" variant="compact" message={getIcarusRoteiro(selectedTrip, selectedDay)} />

              {/* Category Quick Filters */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
                {(() => {
                  const allActivities = (selectedTrip.days || []).flatMap(d => d.activities);
                  const categories = [
                    { id: null as string | null, label: '📅 Por Dia', count: null as number | null, confirmed: 0 },
                    { id: 'comida', label: '🍽️ Alimentação',
                      count: allActivities.filter(a => a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service')).length,
                      confirmed: allActivities.filter(a => a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service') && a.status === 'confirmed').length },
                    { id: 'passeio', label: '🏛️ Passeios',
                      count: allActivities.filter(a => a.category === 'passeio').length,
                      confirmed: allActivities.filter(a => a.category === 'passeio' && a.status === 'confirmed').length },
                    { id: 'logistics', label: '✈️ Logística',
                      count: allActivities.filter(a => ['voo', 'transporte', 'hotel'].includes(a.category)).length,
                      confirmed: allActivities.filter(a => ['voo', 'transporte', 'hotel'].includes(a.category) && a.status === 'confirmed').length },
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
                        if (roteiroCategoryFilter === 'logistics') return ['voo', 'transporte', 'hotel'].includes(act.category);
                        return true;
                      })
                      .map((activity, actIdx) => {
                        const realActIdx = day.activities.indexOf(activity);
                        return (
                          <div key={`${dayIdx}-${actIdx}`}
                            onClick={() => setActivityDetailDrawer({ activity, open: true })}
                            className={`flex gap-3 p-3 rounded-xl border cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${
                            activity.status === 'confirmed'
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-card border-border'
                          }`}>
                            <div className="flex flex-col items-center gap-1 min-w-[50px]">
                              <span className="text-[10px] text-muted-foreground font-bold">Dia {day.day}</span>
                              <span className="text-lg">{getActivityIcon(activity.type)}</span>
                              <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-foreground font-['Outfit'] truncate">{activity.name}</h4>
                              {activity.description && (
                                <p className="text-[10px] text-muted-foreground truncate">{activity.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {activity.cost > 0 && (
                                  <span className="text-xs text-muted-foreground">R$ {activity.cost.toLocaleString('pt-BR')}</span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  activity.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {activity.status === 'confirmed' ? '✅ Confirmado' : '⏳ Pendente'}
                                </span>
                              </div>
                              {/* Google Places Info */}
                              <PlaceInfoCard activityName={activity.name} destination={selectedTrip.destination} />
                            </div>
                            {activity.status !== 'confirmed' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, activity, dayIndex: dayIdx, actIndex: realActIdx }); }}
                                className="self-center px-3 py-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors whitespace-nowrap"
                              >
                                Confirmar
                              </button>
                            )}
                          </div>
                        );
                      })
                  )}

                  {/* Category total */}
                  {(() => {
                    const filtered = (selectedTrip.days || []).flatMap(d => d.activities).filter(a => {
                    if (roteiroCategoryFilter === 'comida') return a.category === 'comida' && !a.name?.toLowerCase().includes('café da manhã') && !a.name?.toLowerCase().includes('room service');
                      if (roteiroCategoryFilter === 'passeio') return a.category === 'passeio';
                      if (roteiroCategoryFilter === 'logistics') return ['voo', 'transporte', 'hotel'].includes(a.category);
                      return true;
                    });
                    const total = filtered.reduce((s, a) => s + (a.cost || 0), 0);
                    const confirmed = filtered.filter(a => a.status === 'confirmed').reduce((s, a) => s + (a.paidAmount || a.cost || 0), 0);
                    return (
                      <div className="p-3 rounded-xl bg-card border border-border mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total da categoria</span>
                          <span className="font-bold text-foreground">R$ {total.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-emerald-400">Confirmado: R$ {confirmed.toLocaleString('pt-BR')}</span>
                          <span className="text-amber-400">Pendente: R$ {(total - confirmed).toLocaleString('pt-BR')}</span>
                        </div>
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
                  timezoneDiff={selectedTrip.timezone.diff}
                  severity={selectedTrip.jetLagSeverity}
                  isRecoveryDay={isRecoveryDay}
                />
              )}

              {/* Day Activities */}
              {currentDay && (() => {
                const isSkipPhoto = currentDay.title?.includes('Embarque') || currentDay.title?.includes('Retorno') || currentDay.title?.includes('Trânsito');
                const mainActivity = currentDay.activities?.find(a => 
                  a.category !== 'voo' && a.category !== 'hotel' && !a.name?.toLowerCase().includes('transfer') && !a.name?.toLowerCase().includes('check-')
                );
                const photoQuery = mainActivity?.name || currentDay.title || selectedTrip.destination;
                
                return (
                <div
                  className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isTransitioning 
                      ? slideDirection === 'left' ? 'opacity-0 -translate-x-3' : 'opacity-0 translate-x-3'
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  {/* Day banner image */}
                  {!isSkipPhoto && (
                    <div className="relative h-[80px] overflow-hidden">
                      <img
                        src={`https://source.unsplash.com/600x150/?${encodeURIComponent(photoQuery)}`}
                        alt={currentDay.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
                      <div className="absolute bottom-2 left-4 right-4">
                        <h3 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2 drop-shadow-lg">
                          <span>Dia {currentDay.day}: {currentDay.title}</span>
                          {selectedTrip.startDate && (
                            <ItineraryDayWeather
                              destination={selectedTrip.destination}
                              date={new Date(new Date(selectedTrip.startDate).getTime() + (currentDay.day - 1) * 86400000)}
                              compact
                            />
                          )}
                        </h3>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                  {/* Day title fallback for Embarque/Retorno/Trânsito */}
                  {isSkipPhoto && (
                    <h3 className="font-semibold text-lg mb-4 text-foreground font-['Outfit'] flex items-center gap-2">
                      <span>Dia {currentDay.day}: {currentDay.title}</span>
                      {selectedTrip.startDate && (
                        <ItineraryDayWeather
                          destination={selectedTrip.destination}
                          date={new Date(new Date(selectedTrip.startDate).getTime() + (currentDay.day - 1) * 86400000)}
                          compact
                        />
                      )}
                    </h3>
                  )}
                  {/* Daily route map — skip Embarque and Retorno days */}
                  {!currentDay.title.includes('Embarque') && !currentDay.title.includes('Retorno') && (
                    <DailyRouteMap
                      destination={selectedTrip.destination}
                      activities={currentDay.activities}
                    />
                  )}
                  <div className="space-y-4">
                    {currentDay.activities.map((activity, actIndex) => {
                      const dayIndex = selectedTrip.days.findIndex((d) => d.day === currentDay.day);
                      
                      // Auto-detect logistics activities (flight/check-in/check-out/transfer)
                      const isLogisticsActivity = activity.isHeroItem ||
                        activity.category === 'voo' || 
                        (activity.category === 'hotel' && (
                          activity.name?.toLowerCase().includes('check-in') ||
                          activity.name?.toLowerCase().includes('check-out')
                        )) ||
                        activity.name?.toLowerCase().includes('check-in aeroporto') ||
                        activity.name?.toLowerCase().includes('transfer');

                      // Hero items render as muted markers
                      if (isLogisticsActivity) {
                        return (
                          <div key={activity.id} className="flex gap-3 opacity-40">
                            <div className="flex flex-col items-center">
                              <div className="text-xl">{getActivityIcon(activity.type)}</div>
                              {actIndex < currentDay.activities.length - 1 && (
                                <div className="w-0.5 flex-1 bg-[#334155] mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-[#64748b]">
                                  <Clock size={14} className="inline mr-1" />
                                  {activity.time}
                                </span>
                              </div>
                              <h4 className="font-medium text-[#64748b] font-['Outfit'] text-sm">{activity.name}</h4>
                              <p className="text-xs text-[#475569] mt-0.5">📍 Logística — gerenciado no Painel</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={activity.id} className={`flex gap-3 transition-all duration-500 ${
                          activity.status === 'confirmed' ? 'bg-[#10b981]/10 -mx-2 px-2 py-2 rounded-xl border border-[#10b981]/30' :
                          activity.status === 'bidding' ? 'bg-[#eab308]/10 -mx-2 px-2 py-2 rounded-xl border border-[#eab308]/30' :
                          activity.status === 'cancelled' ? 'opacity-50' : ''
                        } ${recentlyConfirmed === activity.id ? 'ring-2 ring-emerald-400 ring-opacity-75' : ''}`}>
                          <div className="flex flex-col items-center">
                            <div className="text-xl">{getActivityIcon(activity.type)}</div>
                            {actIndex < currentDay.activities.length - 1 && (
                              <div className="w-0.5 flex-1 bg-[#334155] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(activity.status)}
                              <span className="text-sm text-[#94a3b8]">
                                <Clock size={14} className="inline mr-1" />
                                {activity.time}
                              </span>
                              {/* Preço estimado */}
                              {activity.cost > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activity.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#334155] text-[#94a3b8]'}`}>
                                  {activity.status === 'confirmed' ? '✓' : '~'}R$ {activity.cost.toLocaleString('pt-BR')}
                                </span>
                              )}
                              {/* Preço pago */}
                              {activity.status === 'confirmed' && activity.paidAmount && (
                                <span className="text-xs bg-[#10b981] text-white px-2 py-0.5 rounded-full font-medium">
                                  ✓ R$ {activity.paidAmount.toLocaleString('pt-BR')}
                                </span>
                              )}
                              {/* Badge grátis */}
                              {activity.cost === 0 && activity.status !== 'confirmed' && 
                               !['info', 'transport'].includes(activity.type) && 
                               activity.category !== 'voo' && activity.category !== 'hotel' && (
                                <span className="text-xs bg-[#334155]/50 text-[#64748b] px-2 py-0.5 rounded-full">
                                  Grátis
                                </span>
                              )}
                              {activity.jetLagFriendly && (
                                <span className="text-xs bg-[#eab308]/20 text-[#eab308] px-2 py-0.5 rounded-full">
                                  🧘 Jet Lag Friendly
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                              {activity.status === 'confirmed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 animate-scale-in">
                                  <Check size={10} className="animate-scale-in" /> Confirmado
                                </span>
                              )}
                            </div>
                            {/* Michelin Badge */}
                            {(() => {
                              const isFoodActivity = activity.type === 'food' || activity.category === 'comida' || activity.name?.toLowerCase().includes('restaurante') || activity.name?.toLowerCase().includes('jantar') || activity.name?.toLowerCase().includes('almoço');
                              const michelinMatch = isFoodActivity ? findMichelinMatch(activity.name || '', selectedTrip.destination) : null;
                              return michelinMatch ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5 w-fit">
                                  {getMichelinStarDisplay(michelinMatch.stars)} Michelin
                                  {michelinMatch.stars > 1 && ` · ${michelinMatch.cuisine}`}
                                </span>
                              ) : null;
                            })()}
                            <p className="text-sm text-[#94a3b8]">{activity.description}</p>
                            
                            {/* Google Places Info */}
                            <PlaceInfoCard activityName={activity.name} destination={selectedTrip.destination} />

                            {/* Actions — max 2 buttons: Confirmar + Ver Ofertas */}
                            {activity.status !== 'confirmed' && activity.status !== 'cancelled' && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#10b981] rounded-lg text-xs text-white hover:bg-[#10b981]/80 transition-colors"
                                >
                                  <Check size={12} />
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setAuctionModal({
                                    isOpen: true,
                                    activityName: activity.name,
                                    activityType: activity.type,
                                    estimatedPrice: activity.cost,
                                  })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-primary/50 transition-colors"
                                >
                                  <Tag size={12} />
                                  Ver Ofertas
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal do dia */}
                  {(() => {
                    const dayTotal = currentDay.activities.reduce((sum, a) => sum + (a.cost || 0), 0);
                    const confirmedTotal = currentDay.activities
                      .filter(a => a.status === 'confirmed')
                      .reduce((sum, a) => sum + (a.paidAmount || 0), 0);
                    
                    if (dayTotal === 0 && confirmedTotal === 0) return null;
                    
                    return (
                      <div className="mt-4 pt-3 border-t border-[#334155] flex justify-between items-center text-sm">
                        <span className="text-[#94a3b8] font-['Outfit']">💰 Total do dia</span>
                        <div className="flex items-center gap-3">
                          {dayTotal > 0 && (
                            <span className="text-[#f8fafc] font-medium font-['Outfit']">
                              ~R$ {dayTotal.toLocaleString('pt-BR')}
                            </span>
                          )}
                          {confirmedTotal > 0 && (
                            <span className="text-[#10b981] font-medium">
                              ✓ R$ {confirmedTotal.toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  </div> {/* close p-4 wrapper */}
                </div>
                );
              })()}
                </>
              )}
            </div>
          )}

          {/* Financeiro Tab = Ofertas + Câmbio combined */}
          {activeTab === 'financeiro' && (
            <div className="animate-fade-in space-y-6">
              <AgentTip agent="hestia" variant="compact" message={getHestiaCambio(selectedTrip)} />
              
              {/* Budget Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#94a3b8]">Orçamento</p>
                  <p className="text-lg font-bold text-[#f8fafc] font-['Outfit']">R$ {(selectedTrip.budget / 1000).toFixed(0)}k</p>
                </div>
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#94a3b8]">Confirmado</p>
                  <p className="text-lg font-bold text-[#10b981] font-['Outfit']">R$ {((selectedTrip.finances?.confirmed || 0) / 1000).toFixed(1)}k</p>
                </div>
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#94a3b8]">Disponível</p>
                  <p className="text-lg font-bold text-[#0ea5e9] font-['Outfit']">R$ {((selectedTrip.finances?.available || 0) / 1000).toFixed(1)}k</p>
                </div>
              </div>

              {/* Exchange Rates */}
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">💱 Câmbio</h3>
                <EnhancedExchangeRates
                  destinationCurrency={getDestinationCurrency(selectedTrip.destination)}
                  baseCurrency="BRL"
                  budgetBRL={selectedTrip.budget}
                />
              </div>

              {/* Auctions / Offers */}
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">🎯 Ofertas & Leilões</h3>
                <AuctionList
                  tripId={selectedTrip.id}
                  activities={selectedTrip.days?.flatMap(d => d.activities) || []}
                  auctions={(selectedTrip as any).auctions || []}
                  onNavigateToItinerary={() => setActiveTab('roteiro')}
                />
              </div>
            </div>
          )}

          {/* Preparação Tab = Packing + Checklist + Guia combined */}
          {activeTab === 'preparacao' && (() => {
            const checklist = selectedTrip.checklist || [];
            const totalItems = checklist.length;
            const checkedItems = checklist.filter(i => i.checked).length;
            const readiness = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

            return (
              <div className="animate-fade-in space-y-6">
                <AgentTip agent="hermes" variant="compact" message={getHermesPacking(selectedTrip)} />

                {/* Readiness Score */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#f8fafc] font-['Outfit']">🎯 Prontidão da Viagem</h3>
                    <span className={`text-2xl font-bold font-['Outfit'] ${readiness >= 80 ? 'text-[#10b981]' : readiness >= 50 ? 'text-[#eab308]' : 'text-[#ef4444]'}`}>
                      {readiness}%
                    </span>
                  </div>
                  <Progress value={readiness} className="h-2 bg-[#334155]" />
                  <p className="text-xs text-[#94a3b8] mt-2">{checkedItems} de {totalItems} itens prontos</p>
                </div>

                {/* Smart Packing */}
                <div>
                  <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">🧳 Smart Packing</h3>
                  <SmartPackingWithLuggage
                    tripId={selectedTrip.id}
                    destination={selectedTrip.destination}
                    duration={getTripDuration(selectedTrip)}
                    month={selectedTrip.startDate ? new Date(selectedTrip.startDate).getMonth() + 1 : undefined}
                    startDate={selectedTrip.startDate}
                  />
                </div>

                {/* Checklist */}
                <div>
                  <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">✅ Checklist</h3>
                  <div className="space-y-4">
                    {['documentos', 'reservas', 'packing', 'pre-viagem'].map((category) => {
                      const items = checklist.filter((i) => i.category === category);
                      if (items.length === 0) return null;
                      const categoryLabels: Record<string, string> = {
                        documentos: '📄 Documentos',
                        reservas: '🎫 Reservas',
                        packing: '🧳 Packing',
                        'pre-viagem': '✈️ Pré-Viagem',
                      };
                      
                      return (
                        <div key={category} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                          <h3 className="font-semibold text-[#f8fafc] mb-3 font-['Outfit']">{categoryLabels[category]}</h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleToggleChecklist(item.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                  item.checked ? 'bg-[#10b981]/10' : 'bg-[#0f172a]'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  item.checked ? 'bg-[#10b981] border-[#10b981]' : 'border-[#334155]'
                                }`}>
                                  {item.checked && <Check size={14} className="text-white" />}
                                </div>
                                <span className={`text-sm font-['Plus_Jakarta_Sans'] ${
                                  item.checked ? 'text-[#94a3b8] line-through' : 'text-[#f8fafc]'
                                }`}>
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trip Guide */}
                <div>
                  <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-3">📖 Guia do Destino</h3>
                  <TripGuide destinationCity={selectedTrip.destination} />
                </div>
              </div>
            );
          })()}
        </main>


        {/* Reverse Auction Modal */}
        {auctionModal && (
          <ReverseAuctionModal
            isOpen={auctionModal.isOpen}
            onClose={() => setAuctionModal(null)}
            activityName={auctionModal.activityName}
            activityType={auctionModal.activityType}
            destination={selectedTrip.destination}
            estimatedPrice={auctionModal.estimatedPrice}
            onAcceptOffer={handleAcceptOffer}
            onStartMonitoring={(data) => {
              setAuctionModal(null);
              let foundDayIndex = 0;
              let foundActIndex = 0;
              selectedTrip?.days?.forEach((day, di) => {
                day.activities?.forEach((act, ai) => {
                  if (act.name === auctionModal?.activityName) {
                    foundDayIndex = di;
                    foundActIndex = ai;
                  }
                });
              });
              setAuctionConfigModal({
                isOpen: true,
                activity: selectedTrip?.days?.[foundDayIndex]?.activities?.[foundActIndex]
                  ? { id: selectedTrip.days[foundDayIndex].activities[foundActIndex].id, name: auctionModal?.activityName || '', type: auctionModal?.activityType || 'activity', cost: data.targetPrice }
                  : { id: 'tmp', name: auctionModal?.activityName || '', type: auctionModal?.activityType || 'activity', cost: data.targetPrice },
                dayIndex: foundDayIndex,
                actIndex: foundActIndex,
              });
            }}
          />
        )}

        {/* Auction Config Modal — Leilão Reverso */}
        {auctionConfigModal && (
          <AuctionConfigModal
            isOpen={auctionConfigModal.isOpen}
            onClose={() => setAuctionConfigModal(null)}
            activity={auctionConfigModal.activity}
            onActivate={handleActivateAuction}
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
  // Mobile: show list OR detail (not both)
  // Desktop (lg+): show sidebar list + detail side-by-side
  return (
    <>
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex lg:h-screen">
        <div className="w-80 flex-shrink-0">
          {renderTripList(true)}
        </div>
        <div className="flex-1">
          {selectedTrip ? renderTripDetailContent() : renderEmptyDetail()}
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden">
        {selectedTrip ? renderTripDetailContent() : renderTripList(false)}
      </div>

      {/* Reset Modal — shared */}
      <Dialog open={resetModal} onOpenChange={setResetModal}>
        <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit'] flex items-center gap-2">
              <RotateCcw size={20} className="text-[#eab308]" />
              Reiniciar Jornada?
            </DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              Isso vai remover o roteiro atual e todos os dados salvos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl">
              <span className="text-[#ef4444]">⚠️</span>
              <p className="text-sm text-[#ef4444]">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setResetModal(false)}
                className="flex-1 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetJourney}
                className="flex-1 py-3 bg-[#ef4444] rounded-xl text-white font-semibold"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </>
  );
};

export default Viagens;
