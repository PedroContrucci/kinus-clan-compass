// NewPlanningWizard — 4-step planning wizard orchestrator

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActivityPrice, calculateTripEstimate } from '@/lib/activityPricing';
import { getIdealHotelZone, getHotelRecommendation } from '@/lib/hotelZones';
import { getDestinationThemes } from '@/data/destinationActivities';
import type { PriceLevel } from '@/lib/activityPricing';
import { defaultChecklist } from '@/types/trip';
import type { SavedTrip, TripDay, TripActivity, ActivityStatus, TripFinances } from '@/types/trip';
import { findCityInfo } from '@/data/destinationCatalog';
import { BUDGET_TIERS } from './types';
import { WizardStep1Logistics } from './WizardStep1Logistics';
import { WizardStep2Travelers } from './WizardStep2Travelers';
import { WizardStep3Budget } from './WizardStep3Budget';
import { WizardStep4Summary } from './WizardStep4Summary';
import type { WizardData } from './types';
import kinuLogo from '@/assets/KINU_logo.png';

const STEPS = [
  { id: 1, title: 'Logística', description: 'Origem, destino e datas' },
  { id: 2, title: 'Viajantes', description: 'Perfil do clã' },
  { id: 3, title: 'Budget', description: 'Orçamento e prioridades' },
  { id: 4, title: 'Resumo', description: 'Revisão e confirmação' },
];

const initialData: WizardData = {
  // Step 1
  originCity: 'São Paulo',
  originCityId: null,
  originAirportCode: 'GRU',
  destinationCity: '',
  destinationCityId: null,
  destinationAirportCode: '',
  destinationTimezone: null,
  departureDate: undefined,
  returnDate: undefined,
  selectedRegion: '',
  selectedCountry: '',
  selectedCountryFlag: '',
  destinationCurrency: '',
  destinationTimezoneId: '',
  destinationAirports: [],
  hasDirectFlight: false,
  connections: [],
  estimatedFlightDuration: null,
  averageFlightPrice: null,
  
  // Step 2
  adults: 2,
  children: [],
  infants: 0,
  
  // Step 3
  budgetTier: 'comfort',
  budgetEstimateMin: 0,
  budgetEstimateMax: 0,
  budgetAmount: 0,
  budgetCurrency: 'BRL',
  priorities: ['flights', 'accommodation', 'experiences'],
  travelStyle: 'comfort',
  travelInterests: [],
  
  // Step 4
  biologyAIEnabled: false,
  
  // Computed
  totalDays: 0,
  totalNights: 0,
};

interface NewPlanningWizardProps {
  onComplete?: (data: WizardData) => void;
  onCancel?: () => void;
}

export const NewPlanningWizard = ({ onComplete, onCancel }: NewPlanningWizardProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.originCity && data.destinationCity && data.departureDate && data.returnDate;
      case 2:
        return data.adults > 0;
      case 3:
        return !!data.budgetTier;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard');
    }
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    
    try {
      if (!data.departureDate || !data.returnDate) throw new Error('Datas não definidas');

      const tripId = `trip-${Date.now()}`;
      const destinationCity = data.destinationCity;
      const duration = differenceInDays(data.returnDate, data.departureDate) + 1;
      const totalNights = Math.max(1, duration - 1);
      const totalTravelers = data.adults + data.children.length + data.infants;
      
      // Map budget tier to price level
      const tier = BUDGET_TIERS.find(t => t.id === data.budgetTier)!;
      const priceLevel: PriceLevel = tier.priceLevel;
      const tierMultiplier = tier.multiplier;
      
      const tzDiff = getTimezoneDiff(destinationCity);
      const jetLagMode = data.biologyAIEnabled || Math.abs(tzDiff) > 3;

      // Generate days
      const days = generateDays(destinationCity, duration, data.departureDate, data.returnDate, priceLevel, jetLagMode, totalTravelers, tierMultiplier);

      // Calculate finances from generated days
      const estimate = calculateTripEstimate(destinationCity, duration, totalTravelers, priceLevel);
      const toursCost = sumCostsByCategory(days, 'passeio');
      const foodCost = sumCostsByCategory(days, 'comida');
      const transportCost = sumCostsByCategory(days, 'transporte');
      const totalPlanned = Math.round((estimate.flights + estimate.hotel + toursCost + foodCost + transportCost) * tierMultiplier);
      const budgetTotal = data.budgetAmount || totalPlanned;

      const finances: TripFinances = {
        total: budgetTotal,
        confirmed: 0,
        bidding: 0,
        planned: totalPlanned,
        available: Math.max(0, budgetTotal - totalPlanned),
        categories: {
          flights: { planned: Math.round(estimate.flights * tierMultiplier), confirmed: 0, bidding: 0 },
          accommodation: { planned: Math.round(estimate.hotel * tierMultiplier), confirmed: 0, bidding: 0 },
          tours: { planned: Math.round(toursCost * tierMultiplier), confirmed: 0, bidding: 0 },
          food: { planned: Math.round(foodCost * tierMultiplier), confirmed: 0, bidding: 0 },
          transport: { planned: Math.round(transportCost * tierMultiplier), confirmed: 0, bidding: 0 },
          shopping: { planned: 0, confirmed: 0, bidding: 0 },
        },
      };

      const flightPrice = Math.round(getActivityPrice('flight', destinationCity, priceLevel) * totalTravelers * tierMultiplier);
      const hotelNightPrice = Math.round(getActivityPrice('hotel_night', destinationCity, priceLevel) * tierMultiplier);

      const cityInfo = findCityInfo(destinationCity);

      const idealZone = getIdealHotelZone(destinationCity, data.travelInterests || []);
      const hotelRec = getHotelRecommendation(destinationCity, data.budgetTier, data.travelInterests || []);

      const hotelName = hotelRec
        ? `${hotelRec.name} — ${hotelRec.neighborhood}, ${destinationCity}`
        : idealZone
          ? `Hotel em ${idealZone.neighborhood}, ${destinationCity}`
          : `Hotel em ${destinationCity}`;

      const trip: SavedTrip = {
        id: tripId,
        status: 'draft',
        destination: destinationCity,
        origin: data.originCity,
        country: cityInfo?.country.country || data.selectedCountry || getCountryForCity(destinationCity),
        emoji: getDestinationEmoji(destinationCity),
        startDate: data.departureDate.toISOString(),
        endDate: data.returnDate.toISOString(),
        budget: budgetTotal,
        budgetType: data.travelStyle,
        travelers: totalTravelers,
        priorities: data.priorities,
        progress: 0,
        timezone: {
          origin: 'America/Sao_Paulo',
          destination: data.destinationTimezoneId || data.destinationTimezone || 'Europe/Rome',
          diff: tzDiff,
        },
        jetLagMode,
        travelInterests: data.travelInterests || [],
        flights: {
          outbound: {
            id: 'flight-outbound',
            airline: 'A confirmar',
            flightNumber: '---',
            origin: data.originAirportCode || 'GRU',
            destination: data.destinationAirportCode || destinationCity,
            departureDate: data.departureDate.toISOString(),
            departureTime: '23:00',
            arrivalDate: addDays(data.departureDate, 1).toISOString(),
            arrivalTime: '11:00',
            duration: data.estimatedFlightDuration ? `${data.estimatedFlightDuration}h` : '12h',
            stops: data.hasDirectFlight ? 0 : 1,
            price: flightPrice,
            status: 'planned' as ActivityStatus,
          },
          return: {
            id: 'flight-return',
            airline: 'A confirmar',
            flightNumber: '---',
            origin: data.destinationAirportCode || destinationCity,
            destination: data.originAirportCode || 'GRU',
            departureDate: data.returnDate.toISOString(),
            departureTime: '14:00',
            arrivalDate: data.returnDate.toISOString(),
            arrivalTime: '23:00',
            duration: data.estimatedFlightDuration ? `${data.estimatedFlightDuration}h` : '12h',
            stops: data.hasDirectFlight ? 0 : 1,
            price: flightPrice,
            status: 'planned' as ActivityStatus,
          },
        },
        accommodation: {
          id: 'hotel-main',
          name: hotelName,
          neighborhood: hotelRec?.neighborhood || idealZone?.neighborhood || '',
          description: hotelRec?.whyGood || idealZone?.whyGood || '',
          stars: hotelRec?.stars || (priceLevel === 'luxury' ? 5 : priceLevel === 'midrange' ? 4 : 3),
          checkIn: addDays(data.departureDate, 1).toISOString(),
          checkOut: data.returnDate.toISOString(),
          nightlyRate: hotelNightPrice,
          totalNights,
          totalPrice: hotelNightPrice * totalNights,
          status: 'planned' as ActivityStatus,
        },
        days,
        finances,
        checklist: defaultChecklist.map(item => ({ ...item })),
        createdAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save to localStorage
      const existingTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
      existingTrips.push(trip);
      localStorage.setItem('kinu_trips', JSON.stringify(existingTrips));

      toast({
        title: "Buscando voos... ✈️",
        description: "Escolha os melhores voos para sua viagem!",
      });

      if (onComplete) {
        onComplete(data);
      } else {
        navigate(`/viagens?trip=${tripId}`);
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Erro ao gerar rascunho",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <img src={kinuLogo} alt="KINU" className="w-8 h-8" />
          <div className="flex-1">
            <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
              Novo Planejamento
            </h1>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de 4 — {STEPS[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mt-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step.id <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <WizardStep1Logistics data={data} onChange={handleChange} />
            )}
            {currentStep === 2 && (
              <WizardStep2Travelers data={data} onChange={handleChange} />
            )}
            {currentStep === 3 && (
              <WizardStep3Budget data={data} onChange={handleChange} />
            )}
            {currentStep === 4 && (
              <WizardStep4Summary 
                data={data} 
                onChange={handleChange}
                onGenerateDraft={handleGenerateDraft}
                isGenerating={isGenerating}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={currentStep === 4 ? handleGenerateDraft : handleNext}
          disabled={!canProceed() || isGenerating}
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="font-['Outfit'] text-lg">Gerando...</span>
            </>
          ) : currentStep === 4 ? (
            <>
              <Sparkles size={20} />
              <span className="font-['Outfit'] text-lg">Escolher Voos ✈️</span>
            </>
          ) : (
            <>
              <span className="font-['Outfit'] text-lg">Continuar</span>
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </footer>
    </div>
  );
};

// ─── Helper Functions ───

function getTimezoneDiff(city: string): number {
  const cityInfo = findCityInfo(city);
  if (!cityInfo) return 4;
  
  const destTz = cityInfo.city.timezone;
  const spTz = 'America/Sao_Paulo';
  
  try {
    const now = new Date();
    const destTime = new Date(now.toLocaleString('en-US', { timeZone: destTz }));
    const spTime = new Date(now.toLocaleString('en-US', { timeZone: spTz }));
    const diffMs = destTime.getTime() - spTime.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  } catch {
    return 4;
  }
}

function getCountryForCity(city: string): string {
  const info = findCityInfo(city);
  return info?.country.country ?? '';
}

function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯', 'Kyoto': '⛩️', 'Osaka': '🏯',
    'Paris': '🗼', 'Roma': '🏛️', 'Lisboa': '🚃',
    'Bangkok': '🛕', 'Barcelona': '🏖️', 'Nova York': '🗽',
    'Londres': '🎡', 'Dubai': '🏙️', 'Singapura': '🌆',
    'Sydney': '🦘', 'Buenos Aires': '💃', 'Cancún': '🏖️',
    'Miami': '🌴', 'Amsterdã': '🌷', 'Berlim': '🏗️',
    'Praga': '🏰', 'Istambul': '🕌', 'Cairo': '🏺',
    'Marrakech': '🕌', 'Seul': '🏯', 'Auckland': '🗻',
    'Rio de Janeiro': '🏖️', 'Salvador': '🎭', 'Florianópolis': '🏖️',
    'Havana': '🇨🇺', 'Cusco': '🏔️', 'Bariloche': '⛷️',
    'Santorini': '🏝️', 'Dubrovnik': '🏰', 'Veneza': '🛶',
    'Malé': '🏝️', 'Phuket': '🏖️',
  };
  return emojiMap[destination] || '✈️';
}

function sumCostsByCategory(days: TripDay[], category: string): number {
  return days.reduce((total, day) => {
    return total + day.activities
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + (a.cost || 0), 0);
  }, 0);
}

// EXPLORATION_THEMES removed — now uses getDestinationThemes() from destinationActivities.ts

function generateDays(
  city: string,
  duration: number,
  departureDate: Date,
  returnDate: Date,
  priceLevel: PriceLevel,
  jetLagMode: boolean,
  travelers: number = 1,
  tierMultiplier: number = 1.0,
): TripDay[] {
  const days: TripDay[] = [];

  for (let i = 0; i < duration; i++) {
    const dayNum = i + 1;
    const dayDate = addDays(departureDate, i);
    const dateStr = format(dayDate, "dd/MM (EEEE)", { locale: ptBR });

    if (dayNum === 1) {
      days.push({
        day: dayNum,
        date: dateStr,
        title: 'Embarque ✈️',
        icon: '✈️',
        activities: [
          { ...makeActivity(`act-${dayNum}-1`, '20:00', 'Check-in aeroporto', 'Apresentar documentação e despachar bagagem', '2h', 'transporte', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
          { ...makeActivity(`act-${dayNum}-2`, '23:00', `Voo ${city}`, `Voo de ida para ${city}`, '12h', 'voo', city, 'flight', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        ],
      });
    } else if (dayNum === 2) {
      const activities: TripActivity[] = [
        { ...makeActivity(`act-${dayNum}-1`, '11:00', `Chegada em ${city}`, 'Desembarque e imigração', '1h30', 'transporte', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        makeActivity(`act-${dayNum}-2`, '12:30', 'Transfer para hotel', 'Transporte do aeroporto ao hotel', '1h', 'transporte', city, 'transfer', priceLevel, travelers, tierMultiplier),
        { ...makeActivity(`act-${dayNum}-3`, '14:00', 'Check-in no hotel', 'Acomodação e descanso', '1h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
      ];
      if (jetLagMode) {
        activities.push(
          makeActivity(`act-${dayNum}-4`, '15:30', 'Passeio leve pelo bairro', 'Caminhada de adaptação ao fuso horário', '2h', 'passeio', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-5`, '19:00', 'Jantar leve', 'Restaurante próximo ao hotel', '1h30', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        );
      } else {
        activities.push(
          makeActivity(`act-${dayNum}-4`, '15:30', 'Exploração inicial', `Primeiras impressões de ${city}`, '3h', 'passeio', city, 'museum', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-5`, '19:30', 'Jantar de boas-vindas', 'Restaurante típico local', '2h', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        );
      }
      days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
    } else if (dayNum === duration) {
      days.push({
        day: dayNum,
        date: dateStr,
        title: 'Retorno 🏠',
        icon: '🏠',
        activities: [
          makeActivity(`act-${dayNum}-1`, '08:00', 'Café da manhã', 'Última refeição no destino', '1h', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier),
          { ...makeActivity(`act-${dayNum}-2`, '10:00', 'Check-out do hotel', 'Liberar quarto e organizar bagagem', '1h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
          makeActivity(`act-${dayNum}-3`, '11:00', 'Transfer para aeroporto', 'Transporte ao aeroporto', '1h', 'transporte', city, 'transfer', priceLevel, travelers, tierMultiplier),
          { ...makeActivity(`act-${dayNum}-4`, '14:00', 'Voo de volta', 'Retorno para o Brasil', '12h', 'voo', city, 'flight', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        ],
      });
    } else {
      const themes = getDestinationThemes(city);
      const themeIndex = (dayNum - 3) % themes.length;
      const theme = themes[themeIndex];
      days.push({
        day: dayNum,
        date: dateStr,
        title: `${theme.title} ${theme.icon}`,
        icon: theme.icon,
        activities: [
          makeActivity(`act-${dayNum}-1`, '08:00', 'Café da manhã', 'Hotel ou padaria local', '1h', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-2`, '09:30', theme.activities[0], '', '2h30', 'passeio', city, 'museum', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-3`, '12:30', `Almoço: ${theme.restaurants.lunch}`, '', '1h30', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-4`, '14:30', theme.activities[1], '', '2h30', 'passeio', city, 'tour', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-5`, '17:30', theme.activities[2], '', '1h30', 'passeio', city, 'free', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-6`, '19:30', `Jantar: ${theme.restaurants.dinner}`, '', '2h', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        ],
      });
    }
  }
  return days;
}

function makeActivity(
  id: string, time: string, name: string, description: string,
  duration: string, category: string, city: string,
  pricingType: string, priceLevel: PriceLevel,
  travelers = 1, tierMultiplier = 1.0, jetLagFriendly = false,
): TripActivity {
  const baseCost = pricingType === 'free' ? 0 : getActivityPrice(pricingType as any, city, priceLevel);
  const sharedTypes = ['free', 'transfer'];
  const isShared = sharedTypes.includes(pricingType) || category === 'hotel';
  const cost = Math.round((isShared ? baseCost : baseCost * travelers) * tierMultiplier);
  return {
    id, time, name, description, duration, cost,
    type: category,
    status: 'planned' as ActivityStatus,
    category: category as any,
    jetLagFriendly: jetLagFriendly || undefined,
  };
}

export default NewPlanningWizard;
