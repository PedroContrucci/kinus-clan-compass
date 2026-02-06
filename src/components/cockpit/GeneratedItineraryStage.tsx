// GeneratedItineraryStage — Stage 2: View and edit generated itinerary
// Now generates complete daily schedules with breakfast, morning activity, lunch, 
// afternoon activity, dinner, and optional night activity

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, PlayCircle, Plus, Pencil, Trash2, RefreshCw,
  Plane, Hotel, MapPin, Sparkles, ChevronLeft, ChevronRight,
  Check, AlertCircle, Clock, Star, Lightbulb, Coffee, Utensils, Moon, Sun
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { SelectedFlight } from './FlightSelectionStage';
import { 
  getRandomActivity, 
  getActivitiesByCategory,
  type SuggestedActivity 
} from '@/data/destinationActivities';

// Types
interface ItineraryActivity {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'experience' | 'restaurant' | 'checkin' | 'checkout' | 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'night';
  timeSlot: 'breakfast' | 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'night' | 'flight' | 'hotel';
  estimatedCost: number;
  time?: string;
  duration?: string;
  location?: string;
  rating?: number;
  status: 'defined' | 'suggestion' | 'pending';
  tips?: string[];
  source: 'kinu' | 'clan' | 'custom';
}

interface ItineraryDay {
  dayNumber: number;
  date: Date;
  label: string;
  theme?: string;
  activities: ItineraryActivity[];
  totalCost: number;
}

interface BudgetBreakdown {
  flights: { amount: number; percent: number; status: 'defined' | 'estimated' };
  hotel: { amount: number; percent: number; status: 'defined' | 'estimated' };
  experiences: { amount: number; percent: number; status: 'defined' | 'estimated' };
  food: { amount: number; percent: number; status: 'defined' | 'estimated' };
  total: number;
  available: number;
  trustZonePercent: number;
}

interface GeneratedItineraryStageProps {
  destination: string;
  origin: string;
  emoji: string;
  departureDate: Date;
  returnDate: Date;
  budget: number;
  outboundFlight: SelectedFlight;
  returnFlight: SelectedFlight;
  travelInterests?: string[];
  onActivate: () => void;
  onSave: () => void;
  onBack: () => void;
}

// Day themes based on exploration type
const dayThemes = [
  { theme: 'Exploração Cultural', emoji: '🏛️' },
  { theme: 'Gastronomia & Bairros', emoji: '🍽️' },
  { theme: 'Arte & Compras', emoji: '🎨' },
  { theme: 'Natureza & Relax', emoji: '🌿' },
  { theme: 'Aventura Local', emoji: '🚶' },
  { theme: 'Descobertas Escondidas', emoji: '✨' },
];

// Convert SuggestedActivity to ItineraryActivity
function convertToItineraryActivity(
  activity: SuggestedActivity,
  dayIndex: number,
  timeSlot: ItineraryActivity['timeSlot'],
  time: string
): ItineraryActivity {
  const typeMap: Record<string, ItineraryActivity['type']> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    morning: 'experience',
    afternoon: 'experience',
    night: 'night',
  };

  return {
    id: `day-${dayIndex}-${activity.id}`,
    name: activity.name,
    type: typeMap[activity.category] || 'experience',
    timeSlot,
    estimatedCost: activity.estimatedCostBRL,
    time,
    duration: `${activity.durationHours}h`,
    location: `${activity.neighborhood}`,
    rating: activity.rating,
    status: 'suggestion',
    tips: activity.tips,
    source: 'kinu',
  };
}

// Generate complete itinerary with multiple activities per day
function generateItinerary(
  departureDate: Date,
  returnDate: Date,
  destination: string,
  origin: string,
  outboundFlight: SelectedFlight,
  returnFlight: SelectedFlight,
  budget: number,
  travelInterests: string[] = []
): { days: ItineraryDay[]; breakdown: BudgetBreakdown } {
  const totalDays = differenceInDays(returnDate, departureDate) + 1;
  const totalNights = totalDays - 1;
  const flightsCost = outboundFlight.option.price + returnFlight.option.price;
  
  // Calculate budget allocations
  const remainingAfterFlights = budget - flightsCost;
  const hotelPerNight = Math.round(remainingAfterFlights * 0.35 / totalNights);
  const hotelTotal = hotelPerNight * totalNights;
  
  const experiencesDays = Math.max(totalDays - 2, 1);
  const experienceBudgetPerDay = Math.round(remainingAfterFlights * 0.25 / experiencesDays);
  const experiencesTotal = experienceBudgetPerDay * experiencesDays;
  
  const foodPerDay = Math.round(remainingAfterFlights * 0.15 / totalDays);
  const foodTotal = foodPerDay * totalDays;

  const days: ItineraryDay[] = [];
  const usedActivityIds: string[] = [];

  // Style tags for filtering (convert interests to lowercase)
  const styleTags = travelInterests.map(i => i.toLowerCase().replace('🍜 ', '').replace('🏖️ ', '').replace('🌙 ', '').replace('👨‍👩‍👧 ', '').replace('🏛️ ', '').replace('🎨 ', '').replace('🎭 ', '').replace('🏔️ ', '').replace('💆 ', '').replace('🛍️ ', '').replace('🌿 ', ''));

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(departureDate, i);
    const activities: ItineraryActivity[] = [];
    let label = '';
    let theme = '';
    let dayTotal = 0;

    // Day 1: Departure (flight only)
    if (i === 0) {
      label = 'Partida';
      theme = '✈️ Dia de Viagem';
      activities.push({
        id: `day-${i}-flight-out`,
        name: 'Voo de Ida',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: outboundFlight.option.price,
        time: outboundFlight.option.departureTime,
        duration: outboundFlight.option.duration,
        location: outboundFlight.option.route,
        status: 'defined',
        source: 'kinu',
      });
      dayTotal = outboundFlight.option.price;
    }
    // Day 2: Arrival + Check-in + Light activities
    else if (i === 1) {
      label = `Chegada em ${destination}`;
      theme = '🛬 Dia de Chegada';
      
      // Check-in
      activities.push({
        id: `day-${i}-checkin`,
        name: 'Check-in Hotel',
        type: 'checkin',
        timeSlot: 'hotel',
        estimatedCost: hotelTotal,
        time: '14:00',
        location: `Hôtel Le Marais ⭐ 4.2 • Le Marais`,
        status: 'suggestion',
        tips: [`${totalNights} noites (~R$ ${hotelPerNight.toLocaleString('pt-BR')}/noite)`],
        source: 'kinu',
      });
      dayTotal += hotelTotal;
      
      // Light afternoon walk (arrival day should be relaxed)
      const afternoonActivity = getRandomActivity(destination, 'afternoon', styleTags, usedActivityIds);
      if (afternoonActivity) {
        usedActivityIds.push(afternoonActivity.id);
        const activity = convertToItineraryActivity(afternoonActivity, i, 'afternoon', '16:00');
        activity.tips = ['Passeio leve para se ambientar', ...(activity.tips || [])];
        activities.push(activity);
        dayTotal += activity.estimatedCost;
      }
      
      // Dinner
      const dinnerActivity = getRandomActivity(destination, 'dinner', styleTags, usedActivityIds);
      if (dinnerActivity) {
        usedActivityIds.push(dinnerActivity.id);
        const activity = convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30');
        activities.push(activity);
        dayTotal += activity.estimatedCost;
      }
    }
    // Last day: Checkout + Morning activity + Flight
    else if (i === totalDays - 1) {
      label = 'Volta';
      theme = '✈️ Dia de Partida';
      
      // Breakfast
      const breakfastActivity = getRandomActivity(destination, 'breakfast', styleTags, usedActivityIds);
      if (breakfastActivity) {
        usedActivityIds.push(breakfastActivity.id);
        const activity = convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00');
        activities.push(activity);
        dayTotal += activity.estimatedCost;
      }
      
      // Checkout
      activities.push({
        id: `day-${i}-checkout`,
        name: 'Check-out Hotel',
        type: 'checkout',
        timeSlot: 'hotel',
        estimatedCost: 0,
        time: '10:00',
        status: 'suggestion',
        source: 'kinu',
      });
      
      // Light morning activity or last-minute shopping
      const morningActivity = getRandomActivity(destination, 'afternoon', styleTags, usedActivityIds);
      if (morningActivity) {
        usedActivityIds.push(morningActivity.id);
        const activity = convertToItineraryActivity(morningActivity, i, 'morning', '10:30');
        activity.name = 'Última exploração';
        activity.tips = ['Aproveite as últimas horas!', ...(activity.tips || [])];
        activities.push(activity);
        dayTotal += activity.estimatedCost;
      }
      
      // Lunch before heading to airport
      const lunchActivity = getRandomActivity(destination, 'lunch', styleTags, usedActivityIds);
      if (lunchActivity) {
        usedActivityIds.push(lunchActivity.id);
        const activity = convertToItineraryActivity(lunchActivity, i, 'lunch', '12:30');
        activities.push(activity);
        dayTotal += activity.estimatedCost;
      }
      
      // Transfer to airport
      activities.push({
        id: `day-${i}-transfer`,
        name: 'Transfer para Aeroporto',
        type: 'experience',
        timeSlot: 'afternoon',
        estimatedCost: 100,
        time: '15:00',
        duration: '1h',
        status: 'suggestion',
        tips: ['Chegue com 3h de antecedência para voos internacionais'],
        source: 'kinu',
      });
      dayTotal += 100;
      
      // Return flight
      activities.push({
        id: `day-${i}-flight-return`,
        name: 'Voo de Volta',
        type: 'flight',
        timeSlot: 'flight',
        estimatedCost: 0, // Already counted
        time: returnFlight.option.departureTime,
        duration: returnFlight.option.duration,
        location: returnFlight.option.route,
        status: 'defined',
        source: 'kinu',
      });
    }
    // Middle days: Full exploration with 5-6 activities
    else {
      const themeIndex = (i - 2) % dayThemes.length;
      const dayTheme = dayThemes[themeIndex];
      label = 'Exploração';
      theme = `${dayTheme.emoji} ${dayTheme.theme}`;
      
      // ☕ BREAKFAST (08:00)
      const breakfastActivity = getRandomActivity(destination, 'breakfast', styleTags, usedActivityIds);
      if (breakfastActivity) {
        usedActivityIds.push(breakfastActivity.id);
        activities.push(convertToItineraryActivity(breakfastActivity, i, 'breakfast', '08:00'));
        dayTotal += breakfastActivity.estimatedCostBRL;
      }
      
      // 🏛️ MORNING ACTIVITY (10:00)
      const morningActivity = getRandomActivity(destination, 'morning', styleTags, usedActivityIds);
      if (morningActivity) {
        usedActivityIds.push(morningActivity.id);
        activities.push(convertToItineraryActivity(morningActivity, i, 'morning', '10:00'));
        dayTotal += morningActivity.estimatedCostBRL;
      }
      
      // 🍽️ LUNCH (13:00)
      const lunchActivity = getRandomActivity(destination, 'lunch', styleTags, usedActivityIds);
      if (lunchActivity) {
        usedActivityIds.push(lunchActivity.id);
        activities.push(convertToItineraryActivity(lunchActivity, i, 'lunch', '13:00'));
        dayTotal += lunchActivity.estimatedCostBRL;
      }
      
      // 🚶 AFTERNOON ACTIVITY (15:00)
      const afternoonActivity = getRandomActivity(destination, 'afternoon', styleTags, usedActivityIds);
      if (afternoonActivity) {
        usedActivityIds.push(afternoonActivity.id);
        activities.push(convertToItineraryActivity(afternoonActivity, i, 'afternoon', '15:00'));
        dayTotal += afternoonActivity.estimatedCostBRL;
      }
      
      // 🍷 DINNER (19:30)
      const dinnerActivity = getRandomActivity(destination, 'dinner', styleTags, usedActivityIds);
      if (dinnerActivity) {
        usedActivityIds.push(dinnerActivity.id);
        activities.push(convertToItineraryActivity(dinnerActivity, i, 'dinner', '19:30'));
        dayTotal += dinnerActivity.estimatedCostBRL;
      }
      
      // 🌙 NIGHT ACTIVITY - Optional (21:30)
      const nightActivity = getRandomActivity(destination, 'night', styleTags, usedActivityIds);
      if (nightActivity) {
        usedActivityIds.push(nightActivity.id);
        const activity = convertToItineraryActivity(nightActivity, i, 'night', '21:30');
        activity.tips = ['(Opcional)', ...(activity.tips || [])];
        activities.push(activity);
        dayTotal += nightActivity.estimatedCostBRL;
      }
    }

    days.push({
      dayNumber: i + 1,
      date,
      label,
      theme,
      activities,
      totalCost: dayTotal,
    });
  }

  // Calculate actual totals from generated activities
  let actualExperiencesTotal = 0;
  let actualFoodTotal = 0;
  
  days.forEach(day => {
    day.activities.forEach(activity => {
      if (['breakfast', 'lunch', 'dinner'].includes(activity.timeSlot)) {
        actualFoodTotal += activity.estimatedCost;
      } else if (['morning', 'afternoon', 'night'].includes(activity.timeSlot)) {
        actualExperiencesTotal += activity.estimatedCost;
      }
    });
  });

  const totalEstimated = flightsCost + hotelTotal + actualExperiencesTotal + actualFoodTotal;
  
  const breakdown: BudgetBreakdown = {
    flights: { amount: flightsCost, percent: Math.round((flightsCost / budget) * 100), status: 'defined' },
    hotel: { amount: hotelTotal, percent: Math.round((hotelTotal / budget) * 100), status: 'estimated' },
    experiences: { amount: actualExperiencesTotal, percent: Math.round((actualExperiencesTotal / budget) * 100), status: 'estimated' },
    food: { amount: actualFoodTotal, percent: Math.round((actualFoodTotal / budget) * 100), status: 'estimated' },
    total: totalEstimated,
    available: budget - totalEstimated,
    trustZonePercent: Math.round((totalEstimated / budget) * 100),
  };

  return { days, breakdown };
}

const activityIcons: Record<string, React.ReactNode> = {
  flight: <Plane size={18} />,
  hotel: <Hotel size={18} />,
  checkin: <Hotel size={18} />,
  checkout: <Hotel size={18} />,
  experience: <Sparkles size={18} />,
  restaurant: <Utensils size={18} />,
  breakfast: <Coffee size={18} />,
  lunch: <Utensils size={18} />,
  dinner: <Utensils size={18} />,
  morning: <Sun size={18} />,
  afternoon: <MapPin size={18} />,
  night: <Moon size={18} />,
};

const timeSlotEmojis: Record<string, string> = {
  breakfast: '☕',
  morning: '🏛️',
  lunch: '🍽️',
  afternoon: '🚶',
  dinner: '🍷',
  night: '🌙',
  flight: '✈️',
  hotel: '🏨',
};

const statusBadges: Record<string, { label: string; className: string }> = {
  defined: { label: '✓ Definido', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  suggestion: { label: '~ Sugestão', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  pending: { label: '⚠️ Pendente', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const GeneratedItineraryStage = ({
  destination,
  origin,
  emoji,
  departureDate,
  returnDate,
  budget,
  outboundFlight,
  returnFlight,
  travelInterests = [],
  onActivate,
  onSave,
  onBack,
}: GeneratedItineraryStageProps) => {
  const { days: initialDays, breakdown: initialBreakdown } = useMemo(() => 
    generateItinerary(departureDate, returnDate, destination, origin, outboundFlight, returnFlight, budget, travelInterests),
    [departureDate, returnDate, destination, origin, outboundFlight, returnFlight, budget, travelInterests]
  );

  const [days, setDays] = useState(initialDays);
  const [breakdown] = useState(initialBreakdown);
  const [selectedDay, setSelectedDay] = useState(1);
  const [addActivityModal, setAddActivityModal] = useState(false);

  const totalDays = days.length;
  const startDate = departureDate;
  const currentDay = days[selectedDay - 1];

  const handleRemoveActivity = (activityId: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      activities: day.activities.filter(act => act.id !== activityId),
    }));
    setDays(updatedDays);
    toast({ title: "Atividade removida", description: "A atividade foi removida do roteiro." });
  };

  const getDayLabel = (dayNum: number) => {
    const date = addDays(startDate, dayNum - 1);
    return format(date, 'EEE', { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <span className="text-2xl">{emoji}</span>
            <div>
              <h1 className="font-bold text-lg font-['Outfit'] text-foreground">{destination}</h1>
              <p className="text-xs text-muted-foreground">Roteiro gerado</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSave}>
              <Save size={16} className="mr-1" />
              Salvar
            </Button>
            <Button size="sm" onClick={onActivate}>
              <PlayCircle size={16} className="mr-1" />
              Ativar
            </Button>
          </div>
        </div>

        {/* Trip Info */}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>📅 {format(startDate, 'dd MMM', { locale: ptBR })} - {format(returnDate, 'dd MMM yyyy', { locale: ptBR })}</span>
          <span>• {totalDays} dias</span>
        </div>
      </header>

      {/* Budget Breakdown */}
      <div className="px-4 py-4 border-b border-border bg-card/50">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            💰 ORÇAMENTO ESTIMADO
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium text-foreground">R$ {budget.toLocaleString('pt-BR')}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plane size={14} className="text-blue-400" />
                <span className="text-muted-foreground">Voos:</span>
              </span>
              <span className="text-foreground">
                R$ {breakdown.flights.amount.toLocaleString('pt-BR')} ({breakdown.flights.percent}%) 
                <span className="text-emerald-400 ml-1">✓</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hotel size={14} className="text-purple-400" />
                <span className="text-muted-foreground">Hotel:</span>
              </span>
              <span className="text-foreground">
                R$ {breakdown.hotel.amount.toLocaleString('pt-BR')} ({breakdown.hotel.percent}%) 
                <span className="text-amber-400 ml-1">~</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="text-muted-foreground">Experiências:</span>
              </span>
              <span className="text-foreground">
                R$ {breakdown.experiences.amount.toLocaleString('pt-BR')} ({breakdown.experiences.percent}%) 
                <span className="text-amber-400 ml-1">~</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-orange-400" />
                <span className="text-muted-foreground">Alimentação:</span>
              </span>
              <span className="text-foreground">
                R$ {breakdown.food.amount.toLocaleString('pt-BR')} ({breakdown.food.percent}%) 
                <span className="text-amber-400 ml-1">~</span>
              </span>
            </div>
            
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total estimado:</span>
                <span className="font-medium text-foreground">
                  R$ {breakdown.total.toLocaleString('pt-BR')} ({breakdown.trustZonePercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Disponível:</span>
                <span className="font-medium">R$ {breakdown.available.toLocaleString('pt-BR')} para upgrades</span>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Trust Zone</span>
                <span className={cn(
                  'font-medium',
                  breakdown.trustZonePercent <= 98 && breakdown.trustZonePercent >= 85 
                    ? 'text-emerald-500' 
                    : breakdown.trustZonePercent < 85 
                      ? 'text-amber-500' 
                      : 'text-red-500'
                )}>
                  {breakdown.trustZonePercent}% {breakdown.trustZonePercent <= 98 ? '✅' : '⚠️'}
                </span>
              </div>
              <Progress value={Math.min(breakdown.trustZonePercent, 100)} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Day Navigator */}
      <div className="bg-card/50 border-b border-border px-4 py-3 overflow-x-auto">
        <p className="text-xs text-muted-foreground mb-2">📅 CALENDÁRIO</p>
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className={cn(
                'flex flex-col items-center px-4 py-2 rounded-xl transition-all min-w-[60px]',
                selectedDay === dayNum
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="text-xs font-medium uppercase">{getDayLabel(dayNum)}</span>
              <span className="text-lg font-bold">D{dayNum}</span>
              <span className="text-[10px]">{format(addDays(startDate, dayNum - 1), 'dd/MM')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Content */}
      <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div>
                <h2 className="font-bold text-foreground font-['Outfit']">
                  Dia {selectedDay} - {format(currentDay.date, 'dd/MM (EEEE)', { locale: ptBR })}
                </h2>
                {currentDay.theme && (
                  <p className="text-sm text-primary">{currentDay.theme}</p>
                )}
                {currentDay.label && !currentDay.theme && (
                  <p className="text-sm text-muted-foreground">{currentDay.label}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedDay(prev => Math.max(1, prev - 1))}
                  disabled={selectedDay <= 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setSelectedDay(prev => Math.min(totalDays, prev + 1))}
                  disabled={selectedDay >= totalDays}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              {currentDay.activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma atividade neste dia</p>
                </div>
              ) : (
                currentDay.activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    layout
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all',
                      activity.status === 'defined' && 'border-emerald-500/50 bg-emerald-500/5',
                      activity.status === 'suggestion' && 'border-amber-500/50 bg-amber-500/5',
                      activity.status === 'pending' && 'border-red-500/50 bg-red-500/5'
                    )}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs border',
                        statusBadges[activity.status].className
                      )}>
                        {statusBadges[activity.status].label}
                      </span>
                      
                      {activity.status !== 'defined' && (
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                            <Pencil size={14} className="text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                            <RefreshCw size={14} className="text-muted-foreground" />
                          </button>
                          <button 
                            onClick={() => handleRemoveActivity(activity.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      {/* Time Slot Emoji & Icon */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{timeSlotEmojis[activity.timeSlot] || '📍'}</span>
                        <span className="text-xs text-muted-foreground font-medium">{activity.time}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{activity.name}</h3>
                          {activity.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star size={10} fill="currentColor" />
                              {activity.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        
                        {activity.location && (
                          <p className="text-sm text-muted-foreground mt-0.5">{activity.location}</p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {activity.duration && (
                            <span>Duração: {activity.duration}</span>
                          )}
                        </div>
                        
                        {activity.tips && activity.tips.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {activity.tips.map((tip, tipIdx) => (
                              <div key={tipIdx} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-xs text-amber-400 flex items-start gap-1">
                                  <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                                  {tip}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {activity.estimatedCost > 0 && (
                          <p className="text-sm font-medium text-foreground mt-2">
                            R$ {activity.estimatedCost.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Day Total Summary */}
              {currentDay.totalCost > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>💰</span>
                      <span>Total do Dia {selectedDay}</span>
                    </div>
                    <span className="font-bold text-foreground">
                      R$ {currentDay.totalCost.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}

              {/* Add Activity Button */}
              <button
                onClick={() => setAddActivityModal(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>Adicionar atividade ao Dia {selectedDay}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4">
        <Button
          className="w-full h-14"
          size="lg"
          onClick={onActivate}
        >
          <PlayCircle size={20} className="mr-2" />
          <span className="font-['Outfit'] text-lg">Ativar Viagem</span>
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Confirmar voos e iniciar gestão operacional
        </p>
      </footer>

      {/* Add Activity Modal */}
      <Dialog open={addActivityModal} onOpenChange={setAddActivityModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
            <DialogDescription>
              Escolha uma atividade para adicionar ao Dia {selectedDay}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                setAddActivityModal(false);
                toast({ title: "Em breve!", description: "Busca de atividades do Clã em desenvolvimento." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-foreground">Buscar no Clã</p>
                  <p className="text-sm text-muted-foreground">Atividades recomendadas pela comunidade</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setAddActivityModal(false);
                toast({ title: "Em breve!", description: "Sugestões KINU em desenvolvimento." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-medium text-foreground">Sugestões KINU</p>
                  <p className="text-sm text-muted-foreground">Baseadas no seu estilo de viagem</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                const newActivity: ItineraryActivity = {
                  id: `custom-${Date.now()}`,
                  name: 'Nova atividade',
                  type: 'experience',
                  timeSlot: 'afternoon',
                  estimatedCost: 0,
                  status: 'suggestion',
                  source: 'custom',
                };
                const updatedDays = [...days];
                updatedDays[selectedDay - 1].activities.push(newActivity);
                setDays(updatedDays);
                setAddActivityModal(false);
                toast({ title: "Atividade adicionada!", description: "Edite os detalhes da atividade." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium text-foreground">Criar personalizada</p>
                  <p className="text-sm text-muted-foreground">Adicione sua própria atividade</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneratedItineraryStage;
