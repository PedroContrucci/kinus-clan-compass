import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, Calendar, Users, Wallet, Star, Clock, Euro, RotateCcw, Trash2 } from 'lucide-react';
import { destinations } from '@/data/destinations';
import kinuLogo from '@/assets/KINU_logo.png';

interface TripData {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelType: string;
  budget: string;
  priorities: string[];
}

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

const budgetOptions = [
  { id: 'economico', label: 'Econômico', icon: '💰', range: 'R$ 3-5k', description: 'Hostels, street food' },
  { id: 'conforto', label: 'Conforto', icon: '✨', range: 'R$ 5-10k', description: 'Hotéis 3-4★, mix' },
  { id: 'elite', label: 'Elite', icon: '👑', range: 'R$ 10k+', description: 'Luxo total, sem limites' },
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

  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 2,
    travelType: 'casal',
    budget: 'conforto',
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

  const calculateDays = () => {
    if (tripData.startDate && tripData.endDate) {
      const start = new Date(tripData.startDate);
      const end = new Date(tripData.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
          body: JSON.stringify(tripData),
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
    // TODO: Save to database
    navigate('/viagens');
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
        return tripData.budget;
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
                {currentDay.activities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
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
                        </div>
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-[#0f172a] rounded transition-colors">
                            <RotateCcw size={14} className="text-[#94a3b8]" />
                          </button>
                          <button className="p-1 hover:bg-[#0f172a] rounded transition-colors">
                            <Trash2 size={14} className="text-[#94a3b8]" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                      <p className="text-sm text-[#94a3b8]">{activity.description}</p>
                      <p className="text-xs text-[#94a3b8] mt-1">⏱️ {activity.duration}</p>
                    </div>
                  </div>
                ))}
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

        {/* Step 2: Dates */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Quando vai rolar essa aventura?
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Data de ida</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="date"
                    value={tripData.startDate}
                    onChange={(e) => setTripData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Data de volta</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    type="date"
                    value={tripData.endDate}
                    onChange={(e) => setTripData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                  />
                </div>
              </div>
            </div>
            {calculateDays() > 0 && (
              <div className="bg-[#10b981]/20 border border-[#10b981] rounded-xl p-4 mb-4">
                <p className="text-[#f8fafc] font-['Outfit'] text-center text-lg">
                  ✨ {calculateDays()} dias de descobertas!
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

        {/* Step 4: Budget */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">
              Qual o fôlego do teu bolso?
            </h2>
            <div className="space-y-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTripData((prev) => ({ ...prev, budget: option.id }))}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    tripData.budget === option.id
                      ? 'bg-[#10b981]/20 border-[#10b981]'
                      : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-semibold text-[#f8fafc] font-['Outfit']">{option.label}</p>
                      <p className="text-sm text-[#94a3b8]">{option.range} • {option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
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
