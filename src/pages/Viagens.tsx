import { useEffect, useState, useCallback } from 'react';
import { useKinuAI } from "@/contexts/KinuAIContext";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, Tag, Plus, ChevronRight, Plane, Building, MapPin, Utensils, Car, ShoppingBag, RotateCcw, Settings, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import FlightCard from '@/components/FlightCard';
import HotelCard from '@/components/HotelCard';
import JetLagAlert from '@/components/JetLagAlert';
import FinOpsDashboard from '@/components/FinOpsDashboard';
import SmartPacking from '@/components/SmartPacking';
import { TripCockpit } from '@/components/dashboard';
import { DraftCockpit, TripGuide, ExchangeRates, AuctionList, EnhancedDayTimeline, SmartPackingWithLuggage, EnhancedExchangeRates, AuctionConfigModal } from '@/components/cockpit';
import { useTripDashboard } from '@/hooks/useTripDashboard';
import { SavedTrip, TripActivity, ChecklistItem, ActivityStatus, Offer, contextualTips } from '@/types/trip';
import { PackingData } from '@/types/packing';
import { getActivityPrice, determinePriceLevel, findBestPriceLevel, mapCategoryToPricingType, CITY_PRICES } from '@/lib/activityPricing';
import kinuLogo from '@/assets/KINU_logo.png';
import { findMichelinMatch, getMichelinStarDisplay } from '@/lib/michelinData';
import { BottomNav } from '@/components/shared/BottomNav';


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
  if (DESTINATION_CURRENCY[normalized]) return DESTINATION_CURRENCY[normalized];
  for (const [city, currency] of Object.entries(DESTINATION_CURRENCY)) {
    if (normalized.includes(city) || city.includes(normalized)) return currency;
  }
  const countryCurrency: Record<string, string> = {
    'argentina': 'ARS', 'chile': 'CLP', 'peru': 'PEN', 'colômbia': 'COP',
    'méxico': 'MXN', 'uruguai': 'UYU', 'estados unidos': 'USD', 'eua': 'USD',
    'canadá': 'CAD', 'japão': 'JPY', 'china': 'CNY', 'coreia': 'KRW',
    'tailândia': 'THB', 'índia': 'INR', 'austrália': 'AUD',
    'inglaterra': 'GBP', 'reino unido': 'GBP', 'suíça': 'CHF',
    'portugal': 'EUR', 'espanha': 'EUR', 'itália': 'EUR', 'frança': 'EUR',
    'alemanha': 'EUR', 'holanda': 'EUR', 'grécia': 'EUR', 'irlanda': 'EUR',
    'áustria': 'EUR', 'bélgica': 'EUR', 'finlândia': 'EUR',
    'turquia': 'TRY', 'israel': 'ILS', 'egito': 'EGP', 'marrocos': 'MAD',
    'áfrica do sul': 'ZAR', 'emirados': 'AED',
  };
  for (const [country, currency] of Object.entries(countryCurrency)) {
    if (normalized.includes(country)) return currency;
  }
  return 'USD';
}

const Viagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [activeTab, setActiveTab] = useState<'roteiro' | 'leilao' | 'guia' | 'cambio' | 'finops' | 'packing' | 'checklist'>('roteiro');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
        activities: selectedTrip.days?.flatMap(d => 
          d.activities.map(a => a.name)
        ).slice(0, 10) || [],
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

    // Show contextual tip
    const tip = contextualTips.confirmation[Math.floor(Math.random() * contextualTips.confirmation.length)];
    toast({
      title: "Atividade confirmada! ✅",
      description: tip,
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

  // Dashboard data from hook
  const dashboardData = useTripDashboard(selectedTrip);

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
        // EXPLORATION DAYS - Full day activities with realistic prices
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
        activities = [
          {
            id: `day${dayNum}-1`,
            name: 'Café da manhã',
            description: 'No hotel ou café local',
            time: '08:30',
            duration: '1h',
            type: 'food',
            category: 'comida',
            cost: 0, // Included in hotel
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-2`,
            name: 'Atividade da manhã',
            description: travelers > 1 ? `Passeio cultural ou turístico (${travelers} pessoas)` : 'Passeio cultural ou turístico',
            time: '10:00',
            duration: '2h30',
            type: 'culture',
            category: 'passeio',
            cost: museumPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-3`,
            name: 'Almoço',
            description: travelers > 1 ? `Restaurante local (${travelers} pessoas)` : 'Restaurante local',
            time: '13:00',
            duration: '1h30',
            type: 'food',
            category: 'comida',
            cost: lunchPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-4`,
            name: 'Atividade da tarde',
            description: travelers > 1 ? `Exploração livre (${travelers} pessoas)` : 'Exploração livre',
            time: '15:00',
            duration: '3h',
            type: 'culture',
            category: 'passeio',
            cost: tourPrice,
            status: 'planned' as ActivityStatus,
          },
          {
            id: `day${dayNum}-5`,
            name: 'Jantar',
            description: travelers > 1 ? `Gastronomia local (${travelers} pessoas)` : 'Gastronomia local',
            time: '19:30',
            duration: '2h',
            type: 'food',
            category: 'comida',
            cost: dinnerPrice,
            status: 'planned' as ActivityStatus,
          },
        ];
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

  // Draft Trip View - Use DraftCockpit
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

  // Active/Ongoing Trip Dashboard View
  if (selectedTrip) {
    const currentDay = selectedTrip.days?.find((d) => d.day === selectedDay);
    const showJetLagAlert = selectedTrip.jetLagMode && selectedDay === 1;

    return (
      <div className="min-h-screen bg-[#0f172a] pb-20">
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
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'roteiro' as const, label: '📋 Roteiro' },
              { id: 'leilao' as const, label: '🎯 Leilão' },
              { id: 'packing' as const, label: '🧳 Packing' },
              { id: 'guia' as const, label: '📖 Guia' },
              { id: 'cambio' as const, label: '💱 Câmbio' },
              { id: 'finops' as const, label: '💰 FinOps' },
              { id: 'checklist' as const, label: '✅ Checklist' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Trip Cockpit — KPIs Dashboard */}
          {dashboardData && (
            <TripCockpit data={dashboardData} />
          )}

          {/* Roteiro Tab */}
          {activeTab === 'roteiro' && (
            <div className="animate-fade-in">
              {/* Fixed Flight Card - Outbound */}
              {selectedTrip.flights?.outbound && (
                <FlightCard
                  flight={selectedTrip.flights.outbound}
                  type="outbound"
                  onOpenAuction={() => setAuctionConfigModal({
                    isOpen: true,
                    activity: { id: 'flight-outbound', name: 'Voo de Ida', type: 'flight', cost: selectedTrip.flights?.outbound?.price || 0 },
                    dayIndex: 0,
                    actIndex: 0,
                  })}
                />
              )}

              {/* Fixed Hotel Card */}
              {selectedTrip.accommodation && (
                <HotelCard
                  hotel={selectedTrip.accommodation}
                  onOpenAuction={() => setAuctionConfigModal({
                    isOpen: true,
                    activity: { id: 'hotel-main', name: selectedTrip.accommodation?.name || 'Hotel', type: 'hotel', cost: selectedTrip.accommodation?.totalPrice || 0 },
                    dayIndex: 0,
                    actIndex: 0,
                  })}
                />
              )}

              {/* Day Timeline - Enhanced with real dates */}
              {selectedTrip.startDate && (
                <EnhancedDayTimeline
                  days={selectedTrip.days}
                  selectedDay={selectedDay}
                  onSelectDay={handleDayChange}
                  tripStartDate={selectedTrip.startDate}
                />
              )}

              {/* Jet Lag Alert for Day 1 */}
              {showJetLagAlert && selectedTrip.timezone && (
                <JetLagAlert
                  destination={selectedTrip.destination}
                  timezoneDiff={selectedTrip.timezone.diff}
                />
              )}

              {/* Day Activities */}
              {currentDay && (
                <div
                  className={`bg-[#1e293b] border border-[#334155] rounded-2xl p-4 transition-opacity duration-300 ${
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-4 text-[#f8fafc] font-['Outfit']">
                    Dia {currentDay.day}: {currentDay.title}
                  </h3>
                  <div className="space-y-4">
                    {currentDay.activities.map((activity, actIndex) => {
                      const dayIndex = selectedTrip.days.findIndex((d) => d.day === currentDay.day);
                      
                      return (
                        <div key={activity.id} className={`flex gap-3 ${
                          activity.status === 'confirmed' ? 'bg-[#10b981]/10 -mx-2 px-2 py-2 rounded-xl border border-[#10b981]/30' :
                          activity.status === 'bidding' ? 'bg-[#eab308]/10 -mx-2 px-2 py-2 rounded-xl border border-[#eab308]/30' :
                          activity.status === 'cancelled' ? 'opacity-50' : ''
                        }`}>
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
                              {/* Preço estimado — visível quando cost > 0 e NÃO confirmado */}
                              {activity.cost > 0 && activity.status !== 'confirmed' && (
                                <span className="text-xs bg-[#334155] text-[#94a3b8] px-2 py-0.5 rounded-full font-medium">
                                  ~R$ {activity.cost.toLocaleString('pt-BR')}
                                </span>
                              )}
                              {/* Preço pago — quando confirmado */}
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
                            <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
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

                            {/* Actions — only for bookable activities */}
                            {activity.status !== 'confirmed' && activity.status !== 'cancelled' && 
                             (activity.cost > 0 || activity.category === 'voo') && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#10b981] rounded-lg text-xs text-white hover:bg-[#10b981]/80 transition-colors"
                                >
                                  <Check size={12} />
                                  Confirmar
                                </button>
                                {activity.cost > 0 && (
                                  <button
                                    onClick={() => handleStartBidding(activity, dayIndex, actIndex)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                                  >
                                    <Tag size={12} />
                                    Ver Ofertas
                                  </button>
                                )}
                                {activity.cost > 0 && (
                                  <button
                                    onClick={() => setAuctionConfigModal({
                                      isOpen: true,
                                      activity: { id: activity.id, name: activity.name, type: activity.type, cost: activity.cost },
                                      dayIndex,
                                      actIndex,
                                    })}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#eab308]/40 rounded-lg text-xs text-[#eab308] hover:border-[#eab308] transition-colors"
                                  >
                                    <Target size={12} />
                                    Leilão
                                  </button>
                                )}
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
                </div>
              )}

              {/* Fixed Flight Card - Return (on last day) */}
              {selectedTrip.flights?.return && selectedDay === selectedTrip.days.length && (
                <div className="mt-4">
                  <FlightCard
                    flight={selectedTrip.flights.return}
                    type="return"
                    onOpenAuction={() => setAuctionConfigModal({
                      isOpen: true,
                      activity: { id: 'flight-return', name: 'Voo de Volta', type: 'flight', cost: selectedTrip.flights?.return?.price || 0 },
                      dayIndex: selectedTrip.days.length - 1,
                      actIndex: 0,
                    })}
                  />
                </div>
              )}
            </div>
          )}

          {/* FinOps Tab */}
          {activeTab === 'finops' && (
            <>
              <FinOpsDashboard
                finances={selectedTrip.finances}
                destination={selectedTrip.destination}
              />

              {/* Add Manual Expense */}
              <button
                onClick={() => setManualExpenseModal(true)}
                className="w-full mt-6 py-4 bg-[#1e293b] border border-dashed border-[#334155] rounded-2xl text-[#94a3b8] font-['Outfit'] flex items-center justify-center gap-2 hover:border-[#10b981] hover:text-[#f8fafc] transition-colors"
              >
                <Plus size={20} />
                Adicionar Gasto Manual
              </button>
            </>
          )}

          {/* Smart Packing Tab - New Flow with Luggage First */}
          {activeTab === 'packing' && (
            <SmartPackingWithLuggage
              tripId={selectedTrip.id}
              destination={selectedTrip.destination}
              duration={getTripDuration(selectedTrip)}
              month={selectedTrip.startDate ? new Date(selectedTrip.startDate).getMonth() + 1 : undefined}
            />
          )}

          {/* Leilão (Auction) Tab */}
          {activeTab === 'leilao' && (
            <div className="animate-fade-in">
              <AuctionList
                tripId={selectedTrip.id}
                activities={selectedTrip.days?.flatMap(d => d.activities) || []}
                auctions={(selectedTrip as any).auctions || []}
                onNavigateToItinerary={() => setActiveTab('roteiro')}
              />
            </div>
          )}

          {/* Guia (Travel Guide) Tab */}
          {activeTab === 'guia' && (
            <div className="animate-fade-in">
              <TripGuide
                destinationCity={selectedTrip.destination}
              />
            </div>
          )}

          {/* Câmbio (Exchange) Tab - Enhanced */}
          {activeTab === 'cambio' && (
            <div className="animate-fade-in">
              <EnhancedExchangeRates
                destinationCurrency={getDestinationCurrency(selectedTrip.destination)}
                baseCurrency="BRL"
                budgetBRL={selectedTrip.budget}
              />
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="animate-fade-in space-y-6">
              {['documentos', 'reservas', 'packing', 'pre-viagem'].map((category) => {
                const items = (selectedTrip.checklist || []).filter((i) => i.category === category);
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
          )}
        </main>

        {/* Bottom Nav */}
        <BottomNav />

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
  }

  // Trips List View
  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">KINU</span>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">Minhas Viagens 💼</h1>
        <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">Teus roteiros salvos aparecem aqui.</p>

        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => {
              const progress = calculateProgress(trip);
              const days = trip?.days && Array.isArray(trip.days) ? trip.days : [];
              const totalActivities = days.reduce((acc, day) => acc + (day?.activities?.length || 0), 0);
              const confirmedActivities = days.reduce((acc, day) => {
                const activities = day?.activities && Array.isArray(day.activities) ? day.activities : [];
                return acc + activities.filter((a) => a.status === 'confirmed').length;
              }, 0);
              const statusInfo = getStatusLabel(trip.status);

              return (
                <button
                  key={trip.id}
                  onClick={() => {
                    setSelectedTrip(trip);
                    setSelectedDay(1);
                    setActiveTab('roteiro');
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-2xl p-4 text-left hover:border-[#10b981]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-[#f8fafc] font-['Outfit']">
                          {trip.emoji} {trip.destination}, {trip.country}
                        </h3>
                        <span className={`text-xs ${statusInfo.color}`}>• {statusInfo.label}</span>
                      </div>
                      <p className="text-sm text-[#94a3b8]">
                        {trip.startDate && format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} - {trip.endDate && format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })} • {days.length} dias
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-[#94a3b8]" />
                  </div>
                  <p className="text-sm text-[#94a3b8] mb-3">Orçamento: R$ {trip.budget.toLocaleString()}</p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#94a3b8]">Progresso</span>
                      <span className="text-[#f8fafc]">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-[#334155]" />
                  </div>
                  <p className="text-xs text-[#94a3b8]">{confirmedActivities} de {totalActivities} itens fechados</p>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-[#f8fafc] font-['Outfit'] text-lg mb-2">Nenhuma viagem salva ainda</p>
            <p className="text-[#94a3b8] text-center mb-6">Planeje sua primeira aventura!</p>
            <button
              onClick={() => navigate('/planejar')}
              className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold font-['Outfit']"
            >
              ✈️ Planejar Nova Viagem
            </button>
          </div>
        )}

        {/* Test Mode - Reset Button */}
        {trips.length > 0 && (
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
              <p className="text-xs text-[#64748b] mt-2 text-center">
                Limpa o roteiro atual para testar novamente
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Reset Confirmation Modal */}
      <Dialog open={resetModal} onOpenChange={setResetModal}>
        <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit'] flex items-center gap-2">
              <RotateCcw size={20} className="text-[#eab308]" />
              Reiniciar Jornada?
            </DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              Isso vai remover o roteiro atual e todos os dados salvos. Você poderá criar um novo roteiro do zero.
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
                className="flex-1 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] font-medium hover:bg-[#1e293b] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetJourney}
                className="flex-1 py-3 bg-[#ef4444] rounded-xl text-white font-semibold hover:bg-[#dc2626] transition-colors"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <BottomNav />
      <Toaster />
    </div>
  );
};

export default Viagens;
