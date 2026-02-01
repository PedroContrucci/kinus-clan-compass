import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, Users, Wallet, Clock, Euro, RotateCcw, Trash2, Pin, Tag, CalendarIcon } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import { TripData, SavedTrip, TripActivity, TripDay, defaultChecklist } from '@/types/trip';
import kinuLogo from '@/assets/KINU_logo.png';

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

  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    startDate: undefined,
    endDate: undefined,
    travelers: 2,
    travelType: 'casal',
    budgetAmount: 0,
    budgetType: '',
    priorities: [],
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
    const days = calculateDays();
    
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
        status: pinnedActivities.has(`day${day.day}-act${idx}`) ? 'confirmed' as const : 'pending' as const,
        category: act.type === 'food' ? 'comida' as const : 
                  act.type === 'transport' ? 'transporte' as const : 
                  act.type === 'relax' ? 'hotel' as const : 'passeio' as const,
      })),
    }));

    const savedTrip: SavedTrip = {
      id: tripId,
      destination: generatedItinerary.destination,
      country: destinationCountries[generatedItinerary.destination] || 'País',
      emoji: destinationEmojis[generatedItinerary.destination] || '✈️',
      startDate: tripData.startDate?.toISOString() || '',
      endDate: tripData.endDate?.toISOString() || '',
      budget: tripData.budgetAmount || generatedItinerary.estimatedBudget,
      budgetType: tripData.budgetType,
      travelers: tripData.travelers,
      priorities: tripData.priorities,
      status: 'planning',
      progress: 0,
      days: tripDays,
      finances: {
        confirmed: 0,
        pending: generatedItinerary.estimatedBudget,
        available: tripData.budgetAmount || generatedItinerary.estimatedBudget,
        byCategory: {
          voos: 0,
          hoteis: 0,
          passeios: 0,
          comida: 0,
          outros: 0,
        },
      },
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
                {generatedItinerary.days} dias • R$ {generatedItinerary.estimatedBudget.toLocaleString()} estimado • {generatedItinerary.focusAreas.join(' e ')}
              </p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Day Timeline */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">📅 Roteiro Dia a Dia</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {generatedItinerary.itinerary.map((day) => (
                <button
                  key={day.day}
                  onClick={() => handleDayChange(day.day)}
                  className={`flex-shrink-0 p-4 rounded-2xl transition-all duration-200 border ${
                    selectedDay === day.day
                      ? 'bg-[#1e293b] border-[#10b981] ring-2 ring-[#10b981]/30'
                      : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{day.icon}</div>
                  <div className="font-semibold text-[#f8fafc] font-['Outfit']">Dia {day.day}</div>
                  <div className="text-xs text-[#94a3b8] max-w-[80px] truncate font-['Plus_Jakarta_Sans']">{day.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Day Activities */}
          {currentDay && (
            <div
              className={`bg-[#1e293b] border border-[#334155] rounded-2xl p-4 mb-6 transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <h3 className="font-semibold text-lg mb-4 text-[#f8fafc] font-['Outfit']">
                Dia {currentDay.day}: {currentDay.title}
              </h3>
              <div className="space-y-4">
                {currentDay.activities.map((activity, index) => {
                  const activityKey = `day${currentDay.day}-act${index}`;
                  const isPinned = pinnedActivities.has(activityKey);
                  
                  return (
                    <div key={index} className={`flex gap-3 ${isPinned ? 'bg-[#10b981]/10 -mx-2 px-2 py-2 rounded-xl border border-[#10b981]/30' : ''}`}>
                      <div className="flex flex-col items-center">
                        <div className="text-xl">{getActivityIcon(activity.type)}</div>
                        {index < currentDay.activities.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[#334155] mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                            <Clock size={14} />
                            {activity.time}
                            {activity.cost > 0 && (
                              <>
                                <span>•</span>
                                <Euro size={14} />
                                {activity.cost}
                              </>
                            )}
                            {isPinned && (
                              <span className="text-xs bg-[#10b981] text-white px-2 py-0.5 rounded-full">
                                📌 Fixado
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                        <p className="text-sm text-[#94a3b8]">{activity.description}</p>
                        <p className="text-xs text-[#94a3b8] mt-1">⏱️ {activity.duration}</p>
                        
                        {/* Activity Actions */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <button
                            onClick={() => setAuctionModal({ isOpen: true, activityName: activity.name, activityType: activity.type })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-[#10b981] transition-colors"
                          >
                            <Tag size={12} />
                            Ver Ofertas
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-[#10b981] transition-colors">
                            <RotateCcw size={12} />
                            Trocar
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-red-500/50 transition-colors">
                            <Trash2 size={12} />
                            Remover
                          </button>
                          <button
                            onClick={() => togglePinActivity(activityKey)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              isPinned
                                ? 'bg-[#10b981] text-white'
                                : 'bg-[#0f172a] border border-[#334155] text-[#f8fafc] hover:border-[#10b981]'
                            }`}
                          >
                            <Pin size={12} />
                            {isPinned ? 'Fixado' : 'Fixar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* Step 2: Dates - Interactive Calendar */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Quando vai rolar essa aventura?
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Data de ida</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 pl-4 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#10b981]",
                        !tripData.startDate && "text-[#94a3b8]"
                      )}
                    >
                      <CalendarIcon size={20} className="text-[#94a3b8]" />
                      {tripData.startDate ? (
                        <span className="text-[#f8fafc]">{format(tripData.startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                      ) : (
                        <span>Seleciona a data de ida</span>
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
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Data de volta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 pl-4 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-[#10b981]",
                        !tripData.endDate && "text-[#94a3b8]"
                      )}
                    >
                      <CalendarIcon size={20} className="text-[#94a3b8]" />
                      {tripData.endDate ? (
                        <span className="text-[#f8fafc]">{format(tripData.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                      ) : (
                        <span>Seleciona a data de volta</span>
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
            </div>
            {calculateDays() > 0 && (
              <div className="bg-[#10b981]/20 border border-[#10b981] rounded-xl p-4 mb-4">
                <p className="text-[#f8fafc] font-['Outfit'] text-center text-lg">
                  ✨ {calculateDays()} dias de aventura!
                </p>
              </div>
            )}
            <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-xl p-4">
              <p className="text-[#f8fafc] text-sm">
                💡 <span className="text-[#eab308] font-medium">Dica de Ouro:</span> Evita alta temporada pra economizar até 40%
              </p>
            </div>
          </div>
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
