import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, Users, Wallet, Clock, Euro, RotateCcw, Trash2, Pin, Tag, CalendarIcon, Plane, Brain, Info } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import { 
  TripData, SavedTrip, TripActivity, TripDay, defaultChecklist, defaultFinances, 
  calculateTimezone, shouldActivateJetLagMode, ActivityStatus,
  FLIGHT_DURATION, calculateJetLagImpact, calculateArrivalTime, timezoneOffsets,
  ACTIVITY_IMAGES, getIntensityBadge, ActivityIntensity
} from '@/types/trip';
import kinuLogo from '@/assets/KINU_logo.png';
import { 
  DayNavigator, 
  MinimalFlightCard, 
  MinimalActivityCard,
  DailyFinancialSummary,
  TripHeaderSummary,
  TripTimeline,
  BudgetTracker,
  CompactBudgetHeader,
  BudgetInsufficientAlert,
  ReductionStrategyPanel,
  getActivityImage as getActivityImageFromComponent,
  getActivityIcon as getActivityIconFromComponent
} from '@/components/planejar';
import { 
  allocateBudget, 
  checkBudgetOverflow, 
  validateBudget, 
  analyzeSpending, 
  generateReductionSuggestions,
  type SpendingBreakdown,
  type ReductionSuggestion,
  type BudgetValidation
} from '@/lib/budget';
import { generateEconomicItinerary, identifyTopVillains, type BudgetVillain } from '@/lib/economicGenerator';

interface Activity {
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: string;
}

interface DayItinerary {
  day: number;
  title: string;
  icon: string;
  activities: Activity[];
}

interface ClanTip {
  tip: string;
  icon: string;
}

interface SimilarTrip {
  destination: string;
  days: number;
  budget: number;
  match: string;
}

interface GeneratedItinerary {
  destination: string;
  country: string;
  days: number;
  estimatedBudget: number;
  focusAreas: string[];
  itinerary: DayItinerary[];
  clanTips: ClanTip[];
  similarTrips: SimilarTrip[];
}

const loadingMessages = [
  "Consultando a sabedoria do clã...",
  "Analisando as melhores rotas...",
  "Tecendo experiências únicas...",
  "Quase lá...",
];

const popularDestinations = [
  { name: 'Paris', country: 'França', emoji: '🗼' },
  { name: 'Tóquio', country: 'Japão', emoji: '🏯' },
  { name: 'Bali', country: 'Indonésia', emoji: '🌴' },
  { name: 'Roma', country: 'Itália', emoji: '🏛️' },
];

const travelTypes = [
  { id: 'solo', label: 'Solo', icon: '🧍' },
  { id: 'casal', label: 'Casal', icon: '💑' },
  { id: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
  { id: 'amigos', label: 'Amigos', icon: '👥' },
];

const budgetPresets = [
  { id: 'economico', label: 'Econômico', icon: '💰', min: 3000, max: 5000, description: 'Hostels, street food' },
  { id: 'conforto', label: 'Conforto', icon: '✨', min: 5000, max: 12000, description: 'Hotéis 3-4★, mix' },
  { id: 'elite', label: 'Elite', icon: '👑', min: 12000, max: 50000, description: 'Luxo total, sem limites' },
];

const priorityOptions = [
  { id: 'gastronomia', label: 'Gastronomia', icon: '🍷' },
  { id: 'historia', label: 'História', icon: '🏛️' },
  { id: 'natureza', label: 'Natureza', icon: '🌿' },
  { id: 'compras', label: 'Compras', icon: '🛍️' },
  { id: 'arte', label: 'Arte', icon: '🎨' },
  { id: 'praias', label: 'Praias', icon: '🏖️' },
  { id: 'vida-noturna', label: 'Vida Noturna', icon: '🎉' },
  { id: 'relax', label: 'Relax', icon: '🧘' },
];

const destinationEmojis: Record<string, string> = {
  'Paris': '🗼',
  'Tóquio': '🏯',
  'Lisboa': '🚃',
  'Barcelona': '🏖️',
  'Roma': '🏛️',
  'Bali': '🌴',
  'Nova York': '🗽',
  'Santorini': '🇬🇷',
  'Amsterdã': '🚲',
  'Marrakech': '🕌',
};

const destinationCountries: Record<string, string> = {
  'Paris': 'França',
  'Tóquio': 'Japão',
  'Lisboa': 'Portugal',
  'Barcelona': 'Espanha',
  'Roma': 'Itália',
  'Bali': 'Indonésia',
  'Nova York': 'EUA',
  'Santorini': 'Grécia',
  'Amsterdã': 'Holanda',
  'Marrakech': 'Marrocos',
};

const getBudgetClassification = (amount: number) => {
  if (amount <= 0) return null;
  if (amount <= 5000) {
    return { type: 'economico', label: '💰 Modo Econômico', message: 'Vamos otimizar cada real!' };
  }
  if (amount <= 12000) {
    return { type: 'conforto', label: '✨ Modo Conforto', message: 'Equilíbrio perfeito!' };
  }
  return { type: 'elite', label: '👑 Modo Elite', message: 'Sem limites, só experiências!' };
};

const Planejar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionModal, setAuctionModal] = useState<{ isOpen: boolean; activityName: string; activityType: string } | null>(null);
  const [pinnedActivities, setPinnedActivities] = useState<Set<string>>(new Set());
  const [isGeneratingEconomic, setIsGeneratingEconomic] = useState(false);
  const [economicItinerary, setEconomicItinerary] = useState<ReturnType<typeof generateEconomicItinerary> | null>(null);

  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    startDate: undefined,
    endDate: undefined,
    departureTime: '22:30',
    returnTime: '23:00',
    travelers: 2,
    travelType: 'casal',
    budgetAmount: 0,
    budgetType: '',
    priorities: [],
    jetLagModeEnabled: true,
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Update budget type based on amount
  useEffect(() => {
    const classification = getBudgetClassification(tripData.budgetAmount);
    if (classification) {
      setTripData((prev) => ({ ...prev, budgetType: classification.type }));
    }
  }, [tripData.budgetAmount]);

  const calculateDays = () => {
    if (tripData.startDate && tripData.endDate) {
      const days = differenceInDays(tripData.endDate, tripData.startDate) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSelectDestination = (dest: string) => {
    setTripData((prev) => ({ ...prev, destination: dest }));
    setSearchQuery(dest);
  };

  const togglePriority = (priority: string) => {
    setTripData((prev) => {
      if (prev.priorities.includes(priority)) {
        return { ...prev, priorities: prev.priorities.filter((p) => p !== priority) };
      }
      if (prev.priorities.length < 3) {
        return { ...prev, priorities: [...prev.priorities, priority] };
      }
      return prev;
    });
  };

  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDay(day);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBudgetPreset = (preset: typeof budgetPresets[0]) => {
    const midValue = Math.round((preset.min + preset.max) / 2);
    setTripData((prev) => ({ ...prev, budgetAmount: midValue, budgetType: preset.id }));
  };

  const togglePinActivity = (activityId: string) => {
    setPinnedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleGenerateItinerary = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            destination: tripData.destination,
            startDate: tripData.startDate?.toISOString(),
            endDate: tripData.endDate?.toISOString(),
            travelers: tripData.travelers,
            travelType: tripData.travelType,
            budget: tripData.budgetType,
            budgetAmount: tripData.budgetAmount,
            priorities: tripData.priorities,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar roteiro');
      }

      const data = await response.json();
      setGeneratedItinerary(data);
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar roteiro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = () => {
    if (!generatedItinerary) return;

    const tripId = `trip-${Date.now()}`;
    const totalBudget = tripData.budgetAmount || generatedItinerary.estimatedBudget;
    
    // Calculate timezone info
    const timezoneInfo = calculateTimezone('Brasil', generatedItinerary.destination);
    const jetLagMode = shouldActivateJetLagMode(timezoneInfo.diff);
    
    // Convert generated itinerary to trip format
    const tripDays: TripDay[] = generatedItinerary.itinerary.map((day) => ({
      day: day.day,
      title: day.title,
      icon: day.icon,
      activities: day.activities.map((act, idx) => ({
        id: `${tripId}-day${day.day}-act${idx}`,
        time: act.time,
        name: act.name,
        description: act.description,
        duration: act.duration,
        cost: act.cost,
        type: act.type,
        status: pinnedActivities.has(`day${day.day}-act${idx}`) ? 'confirmed' as ActivityStatus : 'planned' as ActivityStatus,
        category: act.type === 'food' ? 'comida' as const : 
                  act.type === 'transport' ? 'transporte' as const : 
                  act.type === 'relax' ? 'hotel' as const : 'passeio' as const,
        jetLagFriendly: jetLagMode && day.day === 1,
      })),
    }));

    // Create initial finances
    const finances = {
      ...defaultFinances,
      total: totalBudget,
      planned: generatedItinerary.estimatedBudget,
      available: totalBudget,
    };

    const savedTrip: SavedTrip = {
      id: tripId,
      status: 'draft',
      destination: generatedItinerary.destination,
      country: destinationCountries[generatedItinerary.destination] || 'País',
      emoji: destinationEmojis[generatedItinerary.destination] || '✈️',
      startDate: tripData.startDate?.toISOString() || '',
      endDate: tripData.endDate?.toISOString() || '',
      budget: totalBudget,
      budgetType: tripData.budgetType,
      travelers: tripData.travelers,
      priorities: tripData.priorities,
      progress: 0,
      timezone: timezoneInfo,
      jetLagMode,
      days: tripDays,
      finances,
      checklist: defaultChecklist,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    existingTrips.push(savedTrip);
    localStorage.setItem('kinu_trips', JSON.stringify(existingTrips));

    toast({
      title: "Roteiro salvo! 🌿",
      description: "Agora é hora de fechar os detalhes.",
    });

    setTimeout(() => {
      navigate('/viagens');
    }, 1500);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return tripData.destination.length > 0;
      case 2:
        return tripData.startDate && tripData.endDate && calculateDays() > 0;
      case 3:
        return tripData.travelers > 0 && tripData.travelType;
      case 4:
        return tripData.budgetAmount > 0;
      case 5:
        return tripData.priorities.length > 0;
      default:
        return false;
    }
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

  // Helper functions for activity display
  const getActivityIntensity = (type: string, duration: string): ActivityIntensity => {
    const durationHours = parseFloat(duration) || 1;
    if (type === 'relax' || type === 'food' || durationHours <= 1) return 'light';
    if (type === 'transport' || durationHours <= 2) return 'moderate';
    if (durationHours <= 4) return 'intense';
    return 'very_intense';
  };

  const getActivityImage = (name: string, type: string): string => {
    const nameKey = name.toLowerCase()
      .replace(/torre eiffel/i, 'torre-eiffel')
      .replace(/louvre/i, 'louvre')
      .replace(/montmartre/i, 'montmartre')
      .replace(/cruzeiro.*sena/i, 'sena-cruzeiro')
      .replace(/notre.?dame/i, 'notre-dame')
      .replace(/versailles|versalhes/i, 'versailles')
      .replace(/marais/i, 'marais')
      .replace(/café|cafe|coffee/i, 'cafe-paris')
      .replace(/hotel|check.?in/i, 'hotel')
      .replace(/transfer|taxi|uber/i, 'transfer')
      .replace(/restaurante|jantar|almoço|breizh|ristorante|trattoria/i, 'restaurante')
      .replace(/aeroporto|cdg|gru|fiumicino/i, 'aeroporto')
      .replace(/shibuya/i, 'shibuya')
      .replace(/senso.?ji/i, 'senso-ji')
      .replace(/meiji/i, 'meiji')
      .replace(/belém|belem/i, 'belem')
      .replace(/alfama/i, 'alfama')
      // Roma specific
      .replace(/vaticano|vatican/i, 'vaticano')
      .replace(/capela sistina|sistine/i, 'capela-sistina')
      .replace(/basílica.*pedro|st.*peter/i, 'basilica-sao-pedro')
      .replace(/museus.*vaticano|vatican.*museum/i, 'museus-vaticano')
      .replace(/coliseu|colosseum|colosseo/i, 'coliseu')
      .replace(/forum.*romano|roman.*forum/i, 'forum-romano')
      .replace(/palatino|palatine/i, 'palatino')
      .replace(/trastevere/i, 'trastevere')
      .replace(/villa.*este|villa d'este/i, 'villa-este')
      .replace(/villa.*adriana|hadrian/i, 'villa-adriana')
      .replace(/fontana.*trevi|trevi.*fountain/i, 'fontana-trevi')
      .replace(/piazza.*navona/i, 'piazza-navona')
      .replace(/panteão|pantheon|panteao/i, 'panteao')
      .replace(/escadaria.*espanhola|spanish.*steps/i, 'escadaria-espanhola')
      .replace(/castel.*sant.*angelo/i, 'castel-santangelo')
      .replace(/via.*del.*corso/i, 'via-del-corso')
      .replace(/carbonara/i, 'carbonara')
      .replace(/cacio.*pepe/i, 'cacio-pepe')
      .replace(/gelato|sorvete/i, 'gelato-roma')
      .replace(/pizza/i, 'pizza-roma')
      .replace(/pasta|massa/i, 'pasta-roma');
    
    for (const key of Object.keys(ACTIVITY_IMAGES)) {
      if (nameKey.includes(key)) {
        return ACTIVITY_IMAGES[key];
      }
    }
    
    // Fallback by type
    if (type === 'food') return ACTIVITY_IMAGES['restaurante'];
    if (type === 'relax') return ACTIVITY_IMAGES['hotel'];
    if (type === 'transport') return ACTIVITY_IMAGES['transfer'];
    
    return ACTIVITY_IMAGES['default'];
  };

  const getClanTip = (type: string): string => {
    const tips: Record<string, string[]> = {
      food: [
        "Pede o prato do dia, sempre mais fresco e barato! — @MariaV",
        "Reserva pelo Google Maps, eles respondem rápido. — @PedroL",
      ],
      culture: [
        "Vai cedo de manhã pra evitar filas! — @AnaC",
        "Compra ingresso online com antecedência. — @JoãoM",
      ],
      transport: [
        "Uber costuma ser mais barato que táxi oficial. — @CarlosR",
        "Pega o metrô se tiver tempo, muito mais barato! — @LucasS",
      ],
      photo: [
        "Melhor luz pra foto é 30min antes do pôr do sol. — @FernandaP",
        "Chega cedo pra pegar o lugar vazio! — @RafaelT",
      ],
      relax: [
        "Pede um upgrade no check-in, às vezes funciona! — @JuliaM",
        "Aproveita o frigobar vazio pra guardar suas coisas. — @ThiagoB",
      ],
    };
    const categoryTips = tips[type] || tips.culture;
    return categoryTips[Math.floor(Math.random() * categoryTips.length)];
  };

  // Calculate jet lag info for the result screen
  const jetLagInfo = useMemo(() => {
    if (!generatedItinerary) return null;
    const tz = calculateTimezone('São Paulo', generatedItinerary.destination);
    return { ...tz, ...calculateJetLagImpact(tz.diff) };
  }, [generatedItinerary]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mb-8" />
        <p className="text-[#f8fafc] text-xl font-['Outfit'] text-center animate-pulse">
          {loadingMessages[loadingMessageIndex]}
        </p>
        <Toaster />
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😔</div>
        <p className="text-[#f8fafc] text-xl font-['Outfit'] text-center mb-2">Ops, algo deu errado</p>
        <p className="text-[#94a3b8] text-center mb-6">{error}</p>
        <button
          onClick={() => {
            setError(null);
            handleGenerateItinerary();
          }}
          className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold"
        >
          Tentar Novamente
        </button>
        <Toaster />
      </div>
    );
  }

  // Result Screen
  if (generatedItinerary) {
    const currentDay = generatedItinerary.itinerary.find((d) => d.day === selectedDay);
    const startDate = tripData.startDate || new Date();
    const endDate = tripData.endDate || addDays(startDate, generatedItinerary.days - 1);
    const currentDayDate = addDays(startDate, selectedDay - 1);
    
    // Calculate arrival info for transit day logic
    const flightDuration = FLIGHT_DURATION[`São Paulo-${generatedItinerary.destination}`] || 11.5;
    const arrivalInfo = jetLagInfo ? calculateArrivalTime(
      tripData.departureTime || '22:30',
      startDate,
      flightDuration,
      jetLagInfo.diff
    ) : null;
    
    // If arrival is next day, we have a transit day (day 1 = departure, day 2 = arrival/experience day 1)
    const hasTransitDay = arrivalInfo?.nextDay ?? true;
    
    // Generate day info for navigator
    // Icons and titles from AI start from the first experience day (not transit)
    const dayIcons = ['✈️', ...generatedItinerary.itinerary.map(d => d.icon)];
    const dayTitles = ['Partida', ...generatedItinerary.itinerary.map(d => d.title)];
    
    // Total days including transit
    const totalDaysWithTransit = hasTransitDay ? generatedItinerary.days + 1 : generatedItinerary.days;
    
    // Calculate experience days (excluding transit)
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const experienceDays = hasTransitDay ? totalDays - 1 : totalDays;
    
    // Map selected day to actual itinerary day (account for transit)
    // selectedDay 1 = transit (no activities from itinerary)
    // selectedDay 2 = itinerary day 1
    const itineraryDayIndex = hasTransitDay ? selectedDay - 2 : selectedDay - 1;
    const currentItineraryDay = generatedItinerary.itinerary[itineraryDayIndex];
    const isTransitDay = hasTransitDay && selectedDay === 1;
    const isFirstExperienceDay = hasTransitDay ? selectedDay === 2 : selectedDay === 1;
    
    // Calculate daily expenses for current day
    const currentDayExpenses = currentItineraryDay?.activities.map(act => ({
      icon: getActivityIcon(act.type),
      name: act.name,
      amount: act.cost,
      category: act.type as 'attraction' | 'food' | 'transport' | 'accommodation' | 'shopping'
    })) || [];
    
    const averageDailySpend = generatedItinerary.estimatedBudget / generatedItinerary.days;
    
    // Budget allocation for Hard Budget system
    const userBudget = tripData.budgetAmount || generatedItinerary.estimatedBudget;
    const budgetAllocation = allocateBudget(userBudget, totalDays);
    const dailyBudget = budgetAllocation.dailyBudget.total;
    
    // Calculate current day spending
    const currentDaySpent = currentDayExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Timeline data - include transit day
    const timelineData = [
      // Transit day (departure)
      ...(hasTransitDay ? [{
        dayNumber: 0,
        date: startDate,
        icon: '✈️',
        title: 'Partida',
        totalCost: 0,
        isTransit: true,
      }] : []),
      // Experience days
      ...generatedItinerary.itinerary.map((day, idx) => ({
        dayNumber: day.day,
        date: addDays(startDate, hasTransitDay ? idx + 1 : idx),
        icon: day.icon,
        title: day.title,
        totalCost: day.activities.reduce((sum, a) => sum + a.cost, 0),
        isTransit: false,
      })),
    ];
    
    const totalSpent = timelineData.reduce((sum, d) => sum + d.totalCost, 0);
    
    // Generate mock flight data
    const outboundFlight = {
      origin: 'São Paulo',
      originCode: 'GRU',
      destination: generatedItinerary.destination,
      destinationCode: generatedItinerary.destination === 'Paris' ? 'CDG' : 
                       generatedItinerary.destination === 'Tóquio' ? 'NRT' :
                       generatedItinerary.destination === 'Lisboa' ? 'LIS' :
                       generatedItinerary.destination === 'Roma' ? 'FCO' :
                       generatedItinerary.destination === 'Barcelona' ? 'BCN' :
                       generatedItinerary.destination === 'Amsterdã' ? 'AMS' : 'XXX',
      departureDate: startDate,
      departureTime: tripData.departureTime || '22:30',
      arrivalDate: addDays(startDate, 1),
      arrivalTime: jetLagInfo ? 
        calculateArrivalTime(tripData.departureTime || '22:30', startDate, 
          FLIGHT_DURATION[`São Paulo-${generatedItinerary.destination}`] || 11.5,
          jetLagInfo.diff).arrivalTime : '14:00',
      duration: `${FLIGHT_DURATION[`São Paulo-${generatedItinerary.destination}`] || 11.5}h`,
      airline: 'LATAM',
      flightNumber: 'LA8044',
      stops: 0,
      pricePerPerson: 3100,
      totalPrice: 3100 * tripData.travelers,
      travelers: tripData.travelers,
      status: 'bidding' as const,
    };
    
    const returnFlight = {
      origin: generatedItinerary.destination,
      originCode: outboundFlight.destinationCode,
      destination: 'São Paulo',
      destinationCode: 'GRU',
      departureDate: endDate,
      departureTime: tripData.returnTime || '23:00',
      arrivalDate: addDays(endDate, 1),
      arrivalTime: '06:00',
      duration: `${FLIGHT_DURATION[`São Paulo-${generatedItinerary.destination}`] || 11.5}h`,
      airline: 'Air France',
      flightNumber: 'AF456',
      stops: 0,
      pricePerPerson: 3200,
      totalPrice: 3200 * tripData.travelers,
      travelers: tripData.travelers,
      status: 'bidding' as const,
    };
    
    // ═══════════════════════════════════════════════════════════════
    // HARD BUDGET VALIDATION — Check if total exceeds user budget
    // ═══════════════════════════════════════════════════════════════
    const allActivities = generatedItinerary.itinerary.flatMap(day => 
      day.activities.map(act => ({ name: act.name, cost: act.cost }))
    );
    
    const foodCost = generatedItinerary.itinerary.flatMap(day => 
      day.activities.filter(a => a.type === 'food')
    ).reduce((sum, a) => sum + a.cost, 0);
    
    const transportCost = generatedItinerary.itinerary.flatMap(day => 
      day.activities.filter(a => a.type === 'transport')
    ).reduce((sum, a) => sum + a.cost, 0);
    
    const activityCost = generatedItinerary.itinerary.flatMap(day => 
      day.activities.filter(a => a.type !== 'food' && a.type !== 'transport')
    ).reduce((sum, a) => sum + a.cost, 0);
    
    const totalItineraryCost = outboundFlight.totalPrice + returnFlight.totalPrice + totalSpent;
    
    const budgetValidation = validateBudget(userBudget, {
      flights: outboundFlight.totalPrice + returnFlight.totalPrice,
      accommodation: experienceDays * 480, // Estimated hotel cost
      accommodationNights: experienceDays,
      activities: allActivities.filter(a => 
        !['food', 'transport'].some(type => a.name.toLowerCase().includes(type))
      ),
      food: foodCost,
      transport: transportCost,
    });
    
    // Identify top 3 spending items (villains) - include type info
    const activitiesWithType = generatedItinerary.itinerary.flatMap(day => 
      day.activities.map(act => ({ name: act.name, cost: act.cost, type: act.type }))
    );
    
    const budgetVillains = identifyTopVillains(
      { outbound: outboundFlight.totalPrice, return: returnFlight.totalPrice },
      { total: experienceDays * 480, perNight: 480, nights: experienceDays },
      activitiesWithType,
      budgetValidation.totalCost
    );
    
    // Handler for generating economic version
    const handleGenerateEconomicVersion = async () => {
      setIsGeneratingEconomic(true);
      
      try {
        // Simulate API delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const economicResult = generateEconomicItinerary(
          generatedItinerary.destination,
          destinationCountries[generatedItinerary.destination] || 'País',
          experienceDays,
          userBudget,
          tripData.travelers,
          budgetValidation.totalCost
        );
        
        if (economicResult && economicResult.isWithinBudget) {
          // Convert economic itinerary to standard format
          const convertedItinerary: GeneratedItinerary = {
            destination: economicResult.destination,
            country: economicResult.country,
            days: economicResult.days,
            estimatedBudget: economicResult.totalCost,
            focusAreas: ['econômico', 'gratuito'],
            itinerary: economicResult.itinerary.map(day => ({
              day: day.day,
              title: day.title,
              icon: day.icon,
              activities: day.activities.map(act => ({
                time: act.time,
                name: act.name,
                description: act.description,
                duration: act.duration,
                cost: act.cost,
                type: act.type,
              })),
            })),
            clanTips: [
              { tip: `Roma tem ${economicResult.itinerary.flatMap(d => d.activities.filter(a => a.isFree)).length} atividades gratuitas incríveis!`, icon: '💚' },
              { tip: 'Economize comendo em mercados e traquerias locais.', icon: '🍕' },
            ],
            similarTrips: [],
          };
          
          setGeneratedItinerary(convertedItinerary);
          setEconomicItinerary(economicResult);
          
          toast({
            title: "Roteiro Econômico Gerado! 💚",
            description: `Total: R$ ${economicResult.totalCost.toLocaleString()} — Economia de R$ ${economicResult.savings.toLocaleString()}!`,
          });
        } else {
          toast({
            title: "Orçamento muito apertado ⚠️",
            description: "Mesmo com opções econômicas, os custos de voo e hotel superam o budget. Considere alterar datas ou aumentar o orçamento.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error generating economic itinerary:', err);
        toast({
          title: "Erro ao gerar roteiro econômico",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingEconomic(false);
      }
    };
    
    // If budget is exceeded, show Reduction Strategy Panel instead of itinerary
    if (!budgetValidation.isValid && budgetValidation.breakdown && budgetValidation.suggestions) {
      return (
        <div className="min-h-screen bg-background pb-20">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setGeneratedItinerary(null);
                  setCurrentStep(1);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-foreground" />
              </button>
              <div>
                <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
                  ⚠️ Ajuste Necessário
                </h1>
                <p className="text-sm text-muted-foreground">
                  O roteiro gerado excede seu orçamento em {budgetValidation.overflowPercent}%
                </p>
              </div>
            </div>
          </header>

          <main className="px-4 py-6">
            <ReductionStrategyPanel
              userBudget={userBudget}
              totalCost={budgetValidation.totalCost}
              breakdown={budgetValidation.breakdown}
              suggestions={budgetValidation.suggestions}
              destination={generatedItinerary.destination}
              days={experienceDays}
              villains={budgetVillains}
              isGeneratingEconomic={isGeneratingEconomic}
              onApplySuggestion={(suggestionId) => {
                toast({
                  title: "Estratégia aplicada! 🌿",
                  description: "Regenerando roteiro com as novas configurações...",
                });
                // For now, just regenerate
                handleGenerateItinerary();
              }}
              onGenerateEconomic={handleGenerateEconomicVersion}
              onActivateAuction={(activityName, targetPrice) => {
                setAuctionModal({ isOpen: true, activityName, activityType: 'activity' });
              }}
            />
          </main>
          
          {/* Auction Modal */}
          {auctionModal && (
            <ReverseAuctionModal
              isOpen={auctionModal.isOpen}
              onClose={() => setAuctionModal(null)}
              activityName={auctionModal.activityName}
              activityType={auctionModal.activityType}
              destination={generatedItinerary.destination}
            />
          )}
          <Toaster />
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMAL ITINERARY RENDER — Budget is valid
    // ═══════════════════════════════════════════════════════════════
    return (
      <div className="min-h-screen bg-[#0f172a] pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setGeneratedItinerary(null);
                setCurrentStep(1);
              }}
              className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#f8fafc]" />
            </button>
            <div>
              <h1 className="font-bold text-lg font-['Outfit'] text-[#f8fafc]">
                Teu roteiro pra {generatedItinerary.destination} está pronto! 🌿
              </h1>
              <p className="text-sm text-[#94a3b8]">
                {format(startDate, 'dd/MM')} - {format(endDate, 'dd/MM')} • R$ {generatedItinerary.estimatedBudget.toLocaleString()} estimado
              </p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Trip Header Summary */}
          <TripHeaderSummary
            destination={generatedItinerary.destination}
            country={destinationCountries[generatedItinerary.destination] || 'País'}
            emoji={destinationEmojis[generatedItinerary.destination] || '✈️'}
            startDate={startDate}
            endDate={endDate}
            totalDays={totalDays}
            experienceDays={experienceDays}
            budget={tripData.budgetAmount || generatedItinerary.estimatedBudget}
            travelers={tripData.travelers}
            priorities={tripData.priorities}
            jetLagEnabled={tripData.jetLagModeEnabled}
            jetLagImpact={jetLagInfo?.level}
            arrivalDate={addDays(startDate, 1)}
          />
          
          {/* Timeline Overview */}
          <TripTimeline
            startDate={startDate}
            days={timelineData}
            totalBudget={tripData.budgetAmount || generatedItinerary.estimatedBudget}
            totalSpent={totalSpent + outboundFlight.totalPrice + returnFlight.totalPrice}
          />

          {/* Compact Budget Header - Always visible */}
          <CompactBudgetHeader
            totalSpent={totalSpent + outboundFlight.totalPrice + returnFlight.totalPrice}
            totalBudget={userBudget}
            isOverBudget={checkBudgetOverflow(totalSpent + outboundFlight.totalPrice + returnFlight.totalPrice, userBudget).isOverBudget}
            overflowPercent={checkBudgetOverflow(totalSpent + outboundFlight.totalPrice + returnFlight.totalPrice, userBudget).percentage}
          />

          {/* Day Navigator with Real Dates */}
          <DayNavigator
            startDate={startDate}
            totalDays={totalDaysWithTransit}
            selectedDay={selectedDay}
            onDayChange={handleDayChange}
            jetLagModeEnabled={tripData.jetLagModeEnabled}
            icons={dayIcons}
            titles={dayTitles}
            hasTransitDay={hasTransitDay}
          />

          {/* Transit Day Info */}
          {isTransitDay && (
            <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9] rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✈️</span>
                <span className="font-semibold text-[#f8fafc] font-['Outfit']">
                  Dia de Trânsito
                </span>
              </div>
              <p className="text-[#94a3b8] text-sm mb-3">
                Hoje você estará viajando para {generatedItinerary.destination}. 
                {arrivalInfo?.nextDay && ` Chegada prevista: ${format(addDays(startDate, 1), 'dd/MM')} às ${arrivalInfo.arrivalTime}`}
              </p>
              <p className="text-[#f8fafc] text-sm italic">
                "Descansa no voo que amanhã a aventura começa!" 🌿
              </p>
            </div>
          )}

          {/* Jet Lag Mode Banner - Show on first experience day */}
          {tripData.jetLagModeEnabled && isFirstExperienceDay && jetLagInfo && jetLagInfo.level !== 'BAIXO' && (
            <div 
              className="border rounded-2xl p-4 mb-6"
              style={{ 
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                borderColor: '#eab308' 
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain size={20} className="text-[#eab308]" />
                <span className="font-semibold text-[#f8fafc] font-['Outfit']">
                  Biology-Aware AI Ativa
                </span>
              </div>
              <p className="text-[#94a3b8] text-sm mb-3">
                Detectamos +{Math.abs(jetLagInfo.diff)}h de fuso horário. O Dia 1 foi otimizado para neutralização de Jet Lag.
              </p>
              <p className="text-[#f8fafc] text-sm italic">
                "Seu corpo vai agradecer. Amanhã você ataca com tudo — hoje é só curtir a chegada!" 🌿
              </p>
            </div>
          )}
          
          {/* Flight Anchor Card - Transit Day */}
          {isTransitDay && (
            <div className="mb-6">
              <MinimalFlightCard
                type="outbound"
                flight={outboundFlight}
                timezoneDiff={jetLagInfo?.diff}
                onSearchOffers={() => setAuctionModal({ isOpen: true, activityName: 'Voo de Ida', activityType: 'flight' })}
              />
            </div>
          )}
          
          {/* Flight Anchor Card - Last Day */}
          {selectedDay === totalDaysWithTransit && (
            <div className="mb-6">
              <MinimalFlightCard
                type="return"
                flight={returnFlight}
                onSearchOffers={() => setAuctionModal({ isOpen: true, activityName: 'Voo de Volta', activityType: 'flight' })}
              />
            </div>
          )}

          {/* Day Activities - Only show if not transit day and we have activities */}
          {!isTransitDay && currentItineraryDay && (
            <div
              className={`transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <h3 className="font-semibold text-lg mb-4 text-[#f8fafc] font-['Outfit']">
                {format(currentDayDate, 'EEEE dd/MM', { locale: ptBR })} — {currentItineraryDay.title}
              </h3>
              <div className="space-y-4">
                {currentItineraryDay.activities.map((activity, index) => {
                  const activityKey = `day${currentItineraryDay.day}-act${index}`;
                  const isPinned = pinnedActivities.has(activityKey);
                  
                  // Build minimal activity data
                  const minimalActivity = {
                    id: activityKey,
                    time: activity.time,
                    name: activity.name,
                    description: activity.description,
                    duration: activity.duration,
                    type: activity.type,
                    cost: activity.cost,
                    costBreakdown: activity.cost > 0 ? `~R$ ${Math.round(activity.cost / tripData.travelers)}/pessoa × ${tripData.travelers}` : undefined,
                    status: isPinned ? 'pinned' as const : 'planned' as const,
                    clanTip: index % 3 === 0 ? { text: getClanTip(activity.type).split('—')[0].trim(), author: getClanTip(activity.type).split('—')[1]?.trim() || '@Clã' } : undefined,
                  };
                  
                  return (
                    <MinimalActivityCard
                      key={activityKey}
                      activity={minimalActivity}
                      date={currentDayDate}
                      isPinned={isPinned}
                      dailyBudget={dailyBudget}
                      onTogglePin={() => togglePinActivity(activityKey)}
                      onOpenAuction={() => setAuctionModal({ isOpen: true, activityName: activity.name, activityType: activity.type })}
                      onSwap={() => {}}
                      onRemove={() => {}}
                    />
                  );
                })}
              </div>
              
              {/* Daily Financial Summary */}
              <DailyFinancialSummary
                date={currentDayDate}
                expenses={currentDayExpenses}
                averageDailySpend={averageDailySpend}
                tip={isFirstExperienceDay
                  ? "Dia de chegada — gastos mínimos, foco em adaptação!"
                  : selectedDay === totalDaysWithTransit 
                    ? "Último dia — aproveite cada momento!"
                    : undefined
                }
              />
            </div>
          )}

          {/* Clan Tips */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">💡 Dicas de Ouro</h2>
            <div className="space-y-3">
              {generatedItinerary.clanTips.map((tip, index) => (
                <div
                  key={index}
                  className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-xl p-4"
                >
                  <p className="text-[#f8fafc] font-['Plus_Jakarta_Sans']">
                    {tip.icon} {tip.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Trips */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">
              🌿 Inspirado no Clã
            </h2>
            <p className="text-[#94a3b8] text-sm mb-3">Outros viajantes também fizeram:</p>
            <div className="grid grid-cols-1 gap-3">
              {generatedItinerary.similarTrips.map((trip, index) => (
                <div
                  key={index}
                  className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-[#f8fafc] font-['Outfit']">{trip.destination}</p>
                    <p className="text-sm text-[#94a3b8]">
                      {trip.days} dias • R$ {trip.budget.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[#10b981] text-sm font-medium">{trip.match} match</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveTrip}
            className="w-full py-4 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-2xl font-semibold font-['Outfit'] text-lg transition-all hover:shadow-lg hover:shadow-[#10b981]/30"
          >
            Salvar em Minhas Viagens →
          </button>
        </main>

        {/* Bottom Nav */}
        <BottomNav currentPath={location.pathname} />
        
        {/* Reverse Auction Modal */}
        {auctionModal && (
          <ReverseAuctionModal
            isOpen={auctionModal.isOpen}
            onClose={() => setAuctionModal(null)}
            activityName={auctionModal.activityName}
            activityType={auctionModal.activityType}
            destination={generatedItinerary.destination}
          />
        )}
        
        <Toaster />
      </div>
    );
  }

  // Wizard Steps
  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">O Nexo 🧭</h1>
            <p className="text-sm text-[#94a3b8]">Me conta sobre tua próxima aventura...</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-colors ${
                step <= currentStep ? 'bg-[#10b981]' : 'bg-[#334155]'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Step 1: Destination */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Pra onde o coração quer ir?
            </h2>
            <div className="relative mb-6">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Busca um destino..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTripData((prev) => ({ ...prev, destination: e.target.value }));
                }}
                className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-[#94a3b8] mb-3">Em alta no clã 🔥</p>
              <div className="grid grid-cols-2 gap-3">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest.name}
                    onClick={() => handleSelectDestination(dest.name)}
                    className={`p-4 rounded-xl border transition-all ${
                      tripData.destination === dest.name
                        ? 'bg-[#10b981]/20 border-[#10b981]'
                        : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                    }`}
                  >
                    <span className="text-2xl">{dest.emoji}</span>
                    <p className="font-semibold text-[#f8fafc] font-['Outfit'] mt-1">{dest.name}</p>
                    <p className="text-xs text-[#94a3b8]">{dest.country}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Dates + Flight Times + Biology-Aware AI */}
        {currentStep === 2 && (
          <Step2FlightDates 
            tripData={tripData} 
            setTripData={setTripData} 
            calculateDays={calculateDays}
          />
        )}

        {/* Step 3: Travelers */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Quem vai contigo nessa jornada?
            </h2>
            <div className="mb-6">
              <label className="block text-sm text-[#94a3b8] mb-3">Número de viajantes</label>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setTripData((prev) => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                  className="w-12 h-12 bg-[#1e293b] border border-[#334155] rounded-xl flex items-center justify-center text-[#f8fafc] text-2xl hover:bg-[#10b981]/20"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-[#f8fafc] font-['Outfit'] w-16 text-center">
                  {tripData.travelers}
                </span>
                <button
                  onClick={() => setTripData((prev) => ({ ...prev, travelers: prev.travelers + 1 }))}
                  className="w-12 h-12 bg-[#1e293b] border border-[#334155] rounded-xl flex items-center justify-center text-[#f8fafc] text-2xl hover:bg-[#10b981]/20"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-3">Tipo de viagem</label>
              <div className="grid grid-cols-2 gap-3">
                {travelTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTripData((prev) => ({ ...prev, travelType: type.id }))}
                    className={`p-4 rounded-xl border transition-all ${
                      tripData.travelType === type.id
                        ? 'bg-[#10b981]/20 border-[#10b981]'
                        : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <p className="font-semibold text-[#f8fafc] font-['Outfit'] mt-1">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Budget - Free Input with Classification */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Qual o fôlego do teu bolso?
            </h2>
            
            {/* Free Input */}
            <div className="mb-6">
              <label className="block text-sm text-[#94a3b8] mb-2">Teu orçamento total</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] font-medium">R$</span>
                <input
                  type="number"
                  placeholder="Digite seu orçamento"
                  value={tripData.budgetAmount || ''}
                  onChange={(e) => setTripData((prev) => ({ ...prev, budgetAmount: parseInt(e.target.value) || 0 }))}
                  className="w-full pl-12 pr-4 py-4 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f8fafc] text-xl font-semibold placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              
              {/* Budget Classification */}
              {tripData.budgetAmount > 0 && (
                <div className={`mt-4 p-4 rounded-xl border-l-4 ${
                  getBudgetClassification(tripData.budgetAmount)?.type === 'economico' ? 'bg-[#10b981]/10 border-[#10b981]' :
                  getBudgetClassification(tripData.budgetAmount)?.type === 'conforto' ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]' :
                  'bg-[#eab308]/10 border-[#eab308]'
                }`}>
                  <p className="text-[#f8fafc] font-semibold font-['Outfit']">
                    {getBudgetClassification(tripData.budgetAmount)?.label}
                  </p>
                  <p className="text-[#94a3b8] text-sm">
                    {getBudgetClassification(tripData.budgetAmount)?.message}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-sm text-[#94a3b8] mb-3">Ou escolhe um modo rápido:</p>
              <div className="space-y-3">
                {budgetPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleBudgetPreset(preset)}
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      tripData.budgetType === preset.id
                        ? 'bg-[#10b981]/20 border-[#10b981]'
                        : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{preset.icon}</span>
                      <div>
                        <p className="font-semibold text-[#f8fafc] font-['Outfit']">{preset.label}</p>
                        <p className="text-sm text-[#94a3b8]">
                          R$ {preset.min.toLocaleString()} - {preset.max.toLocaleString()} • {preset.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Priorities */}
        {currentStep === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">
              O que não pode faltar?
            </h2>
            <p className="text-[#94a3b8] mb-6">Seleciona até 3 prioridades</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {priorityOptions.map((priority) => (
                <button
                  key={priority.id}
                  onClick={() => togglePriority(priority.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    tripData.priorities.includes(priority.id)
                      ? 'bg-[#10b981]/20 border-[#10b981]'
                      : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                  } ${tripData.priorities.length >= 3 && !tripData.priorities.includes(priority.id) ? 'opacity-50' : ''}`}
                  disabled={tripData.priorities.length >= 3 && !tripData.priorities.includes(priority.id)}
                >
                  <span className="text-2xl">{priority.icon}</span>
                  <p className="font-semibold text-[#f8fafc] font-['Outfit'] mt-1">{priority.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-4 bg-[#1e293b] border border-[#334155] text-[#f8fafc] rounded-xl font-semibold font-['Outfit'] flex items-center justify-center gap-2 hover:bg-[#1e293b]/80"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
          )}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-4 rounded-xl font-semibold font-['Outfit'] flex items-center justify-center gap-2 transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#10b981]/30'
                  : 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
              }`}
            >
              Próximo
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleGenerateItinerary}
              disabled={!canProceed()}
              className={`flex-1 py-4 rounded-xl font-semibold font-['Outfit'] text-lg transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#10b981]/30'
                  : 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'
              }`}
            >
              ✨ Tecer Minha Jornada
            </button>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav currentPath={location.pathname} />
      <Toaster />
    </div>
  );
};

// Step 2 Component: Flight Dates + Biology-Aware AI
interface Step2Props {
  tripData: TripData;
  setTripData: React.Dispatch<React.SetStateAction<TripData>>;
  calculateDays: () => number;
}

const Step2FlightDates = ({ tripData, setTripData, calculateDays }: Step2Props) => {
  // Calculate timezone and jet lag info
  const timezoneInfo = useMemo(() => {
    if (!tripData.destination) return null;
    return calculateTimezone('São Paulo', tripData.destination);
  }, [tripData.destination]);

  const jetLagImpact = useMemo(() => {
    if (!timezoneInfo) return null;
    return calculateJetLagImpact(timezoneInfo.diff);
  }, [timezoneInfo]);

  const flightDuration = useMemo(() => {
    if (!tripData.destination) return 11.5; // Default
    const key = `São Paulo-${tripData.destination}`;
    return FLIGHT_DURATION[key] || FLIGHT_DURATION[`Brasil-${tripData.destination}`] || 11.5;
  }, [tripData.destination]);

  const arrivalInfo = useMemo(() => {
    if (!tripData.startDate || !tripData.departureTime || !timezoneInfo) return null;
    return calculateArrivalTime(
      tripData.departureTime,
      tripData.startDate,
      flightDuration,
      timezoneInfo.diff
    );
  }, [tripData.startDate, tripData.departureTime, flightDuration, timezoneInfo]);

  const getTimezoneCode = (city: string) => {
    const codes: Record<string, string> = {
      'São Paulo': 'BRT', 'Brasil': 'BRT', 'Paris': 'CET', 'Tóquio': 'JST',
      'Nova York': 'EST', 'Londres': 'GMT', 'Dubai': 'GST', 'Sydney': 'AEDT',
      'Lisboa': 'WET', 'Roma': 'CET', 'Barcelona': 'CET', 'Bali': 'WITA',
      'Amsterdã': 'CET', 'Marrakech': 'WET', 'Santorini': 'EET',
    };
    return codes[city] || 'UTC';
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">
        ✈️ Quando vai rolar essa aventura?
      </h2>
      <p className="text-[#94a3b8] mb-6 text-sm">Detalhes do voo para otimizar seu roteiro</p>
      
      {/* Outbound Flight */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Plane size={18} className="text-[#10b981]" />
          <span className="font-semibold text-[#f8fafc] font-['Outfit']">VOO DE IDA</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Date Picker */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">📅 Data partida</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]",
                    !tripData.startDate && "text-[#94a3b8]"
                  )}
                >
                  <CalendarIcon size={14} className="text-[#94a3b8]" />
                  {tripData.startDate ? (
                    <span className="text-[#f8fafc]">{format(tripData.startDate, "dd/MM/yyyy")}</span>
                  ) : (
                    <span>Selecionar</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1e293b] border-[#334155]" align="start">
                <Calendar
                  mode="single"
                  selected={tripData.startDate}
                  onSelect={(date) => setTripData((prev) => ({ ...prev, startDate: date }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto bg-[#1e293b] text-[#f8fafc]")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Picker */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">🕐 Horário partida</label>
            <input
              type="time"
              value={tripData.departureTime}
              onChange={(e) => setTripData((prev) => ({ ...prev, departureTime: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>
        </div>
        
        <p className="text-xs text-[#94a3b8]">
          Origem: São Paulo (GRU) — Fuso: {getTimezoneCode('São Paulo')} (UTC-3)
        </p>
      </div>

      {/* Return Flight */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Plane size={18} className="text-[#0ea5e9] rotate-180" />
          <span className="font-semibold text-[#f8fafc] font-['Outfit']">VOO DE VOLTA</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">📅 Data retorno</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]",
                    !tripData.endDate && "text-[#94a3b8]"
                  )}
                >
                  <CalendarIcon size={14} className="text-[#94a3b8]" />
                  {tripData.endDate ? (
                    <span className="text-[#f8fafc]">{format(tripData.endDate, "dd/MM/yyyy")}</span>
                  ) : (
                    <span>Selecionar</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1e293b] border-[#334155]" align="start">
                <Calendar
                  mode="single"
                  selected={tripData.endDate}
                  onSelect={(date) => setTripData((prev) => ({ ...prev, endDate: date }))}
                  disabled={(date) => date < (tripData.startDate || new Date())}
                  initialFocus
                  className={cn("p-3 pointer-events-auto bg-[#1e293b] text-[#f8fafc]")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">🕐 Horário retorno</label>
            <input
              type="time"
              value={tripData.returnTime}
              onChange={(e) => setTripData((prev) => ({ ...prev, returnTime: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>
        </div>
      </div>

      {/* Flight Calculation Card */}
      {tripData.destination && tripData.startDate && arrivalInfo && timezoneInfo && (
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-lg">📊</div>
            <span className="font-semibold text-[#f8fafc] font-['Outfit']">CÁLCULO AUTOMÁTICO</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">✈️</span>
              <span className="text-[#f8fafc]">São Paulo → {tripData.destination}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">🛫</span>
              <span className="text-[#94a3b8]">
                Partida: {format(tripData.startDate, "dd/MM")} às {tripData.departureTime} (horário de Brasília)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">⏱️</span>
              <span className="text-[#94a3b8]">Duração estimada: ~{flightDuration}h</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">🛬</span>
              <span className="text-[#f8fafc]">
                Chegada: {arrivalInfo.nextDay ? format(arrivalInfo.arrivalDate, "dd/MM") : format(tripData.startDate, "dd/MM")} às {arrivalInfo.arrivalTime} (horário de {tripData.destination})
              </span>
            </div>
            
            <div className="h-px bg-[#334155] my-3" />
            
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <span className="text-[#f8fafc]">
                Diferença de fuso: {timezoneInfo.diff >= 0 ? '+' : ''}{timezoneInfo.diff} horas
              </span>
            </div>
            
            {jetLagImpact && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg mt-2"
                style={{ backgroundColor: jetLagImpact.bgColor }}
              >
                <Brain size={16} style={{ color: jetLagImpact.color }} />
                <span style={{ color: jetLagImpact.color }} className="font-medium">
                  Impacto no corpo: {jetLagImpact.level}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biology-Aware AI Toggle */}
      {jetLagImpact && jetLagImpact.level !== 'BAIXO' && (
        <div 
          className="border rounded-2xl p-4 mb-4 transition-all"
          style={{ 
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            borderColor: '#eab308' 
          }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-[#eab308]" />
              <span className="font-semibold text-[#f8fafc] font-['Outfit']">
                Biology-Aware AI
              </span>
            </div>
            <Switch
              checked={tripData.jetLagModeEnabled}
              onCheckedChange={(checked) => setTripData((prev) => ({ ...prev, jetLagModeEnabled: checked }))}
              className="data-[state=checked]:bg-[#10b981]"
            />
          </div>
          
          <p className="text-[#f8fafc] text-sm mb-2">
            Detectamos +{Math.abs(timezoneInfo?.diff || 0)}h de fuso horário.
          </p>
          <p className="text-[#94a3b8] text-sm">
            {tripData.jetLagModeEnabled 
              ? "O Dia 1 será otimizado para neutralização de Jet Lag. Atividades leves e tempo para adaptação."
              : "⚠️ Roteiro normal ativado. Seu corpo pode reclamar, mas você manda!"
            }
          </p>
        </div>
      )}

      {/* Days Summary */}
      {calculateDays() > 0 && (
        <div className="bg-[#10b981]/20 border border-[#10b981] rounded-xl p-4 mb-4">
          <p className="text-[#f8fafc] font-['Outfit'] text-center text-lg">
            ✨ {calculateDays()} dias de aventura!
          </p>
        </div>
      )}

      {/* Golden Tip */}
      <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-xl p-4">
        <p className="text-[#f8fafc] text-sm">
          💡 <span className="text-[#eab308] font-medium">Dica de Ouro:</span>{' '}
          {tripData.departureTime >= '21:00' || tripData.departureTime <= '06:00'
            ? "Voo noturno é ótimo! Tenta dormir no avião que você chega mais disposto. 🌿"
            : "Evita alta temporada pra economizar até 40%"
          }
        </p>
      </div>
    </div>
  );
};

const BottomNav = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/cla', icon: '🌿', label: 'Clã' },
    { path: '/planejar', icon: '🧭', label: 'Planejar' },
    { path: '/viagens', icon: '💼', label: 'Viagens' },
    { path: '/conta', icon: '👤', label: 'Conta' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b]/90 backdrop-blur-lg border-t border-[#334155] px-4 py-3">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}
            >
              {isActive && <div className="w-8 h-0.5 bg-[#10b981] rounded-full mb-1" />}
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Planejar;
