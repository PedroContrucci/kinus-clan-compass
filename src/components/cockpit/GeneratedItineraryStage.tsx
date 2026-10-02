// GeneratedItineraryStage — Stage 2: View and edit generated itinerary
// Now generates complete daily schedules with breakfast, morning activity, lunch, 
// afternoon activity, dinner, and optional night activity
// Includes KINU Analysis, Weather, and Exchange Rate integrations

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, PlayCircle, Plus, Pencil, Trash2, RefreshCw,
  Plane, Hotel, MapPin, Sparkles, ChevronLeft, ChevronRight,
  Check, AlertCircle, Clock, Star, Lightbulb, Coffee, Utensils, Moon, Sun
} from 'lucide-react';
import { getActivityPrice, findBestPriceLevel, type PriceLevel } from '@/lib/activityPricing';
import { format, addDays, differenceInDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { SelectedFlight } from './FlightSelectionStage';
import { 
   
  getActivitiesByCategory,
  getDestinationActivities,
  getDestinationThemes,
  type SuggestedActivity,
  type DestinationTheme
} from '@/data/destinationActivities';
import { getTopMichelinForCity } from '@/lib/michelinData';
import { createPlaceUsageTracker, normalizePlaceName, pickReusableByGap } from '@/lib/placeIdentity';
import { getHotelRecommendation } from '@/lib/hotelZones';
import { KinuAnalysisCard } from './KinuAnalysisCard';
import { ItineraryDayWeather } from './ItineraryDayWeather';
import { ItineraryExchangeRate } from './ItineraryExchangeRate';
import { updateTrip } from '@/lib/tripStore';
import { followPlanEnvelope, envelopeFor, reserveFor } from '@/lib/planTotals';
import type { TripFinances } from '@/types/trip';
import {
  generateItinerary,
  computeBuckets as computeEngineBuckets,
  convertToItineraryActivity,
  type ItineraryActivity,
  type ItineraryDay,
  type BudgetBreakdown,
} from '@/lib/itineraryEngine';

// Reexport: o gerador mora no motor puro; quem importava daqui segue funcionando.
export { generateItinerary };



interface GeneratedItineraryStageProps {
  /**
   * `id` da viagem no storage. Destrava a escrita por `updateTrip` e aposenta a busca
   * por destino+datas (recon §8.1 trava 1, §4.4). Obrigatório: um fallback para "sem
   * id" seria de volta o `return` silencioso que esta fase existe para matar.
   */
  tripId: string;
  destination: string;
  origin: string;
  emoji: string;
  departureDate: Date;
  returnDate: Date;
  budget: number;
  travelers: number;
  outboundFlight: SelectedFlight;
  returnFlight: SelectedFlight;
  travelInterests?: string[];
  jetLagSeverity?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  onActivate: (days?: any[], financeBuckets?: { flightsPlanned: number; hotelPlanned: number; foodPlanned: number; toursPlanned: number; totalPlanned: number }) => void;
  onSave: (days?: any[], financeBuckets?: { flightsPlanned: number; hotelPlanned: number; foodPlanned: number; toursPlanned: number; totalPlanned: number }) => void;
  onBack: () => void;
  onDaysGenerated?: (days: ItineraryDay[]) => void;
  priceLevel?: PriceLevel;
  /** Existing generated days (TripDay[] shape from createTrip). If complete, they are used instead of running the internal generator. */
  existingDays?: any[];
  /**
   * Hospedagem planejada que vem da viagem, não da estimativa desta etapa. Chega
   * preenchido só quando a viagem tem hotel CURADO (`accommodation.curatedHotelId`):
   * aí o valor autoritativo é o `accommodation.totalPrice` — diária curada × noites —,
   * e não o `getActivityPrice('hotel_night') × noites` daqui, que ignora o hotel real
   * e reverteria a troca de hotel do usuário no mount.
   */
  hotelPlannedOverride?: number;
  /** Envelope segue o plano (rascunho do fluxo guiado): Análise compara com custo + reserva. */
  budgetFollowsPlan?: boolean;
}

// Convert previously-generated TripDay[] (from createTrip) into ItineraryDay[]
// for display in this stage. Also derives a minimal budget breakdown.
function convertTripDaysToItinerary(
  existingDays: any[],
  departureDate: Date,
  travelers: number,
  budget: number
): { days: ItineraryDay[]; breakdown: BudgetBreakdown; meta: { michelinCount: number } } {
  const inferTimeSlot = (time: string | undefined, category?: string, type?: string): ItineraryActivity['timeSlot'] => {
    const cat = (category || '').toLowerCase();
    const t = (type || '').toLowerCase();
    if (cat === 'voo' || t.includes('voo') || t.includes('flight')) return 'flight';
    if (cat === 'hotel' || t.includes('hotel') || t.includes('check')) return 'hotel';
    const h = parseInt((time || '12:00').split(':')[0], 10) || 12;
    if (cat === 'comida') {
      if (h < 10) return 'breakfast';
      if (h < 15) return 'lunch';
      return 'dinner';
    }
    if (h < 11) return 'morning';
    if (h < 14) return 'lunch';
    if (h < 17) return 'afternoon';
    if (h < 21) return 'dinner';
    return 'night';
  };
  const mapType = (category?: string, timeSlot?: ItineraryActivity['timeSlot']): ItineraryActivity['type'] => {
    const c = (category || '').toLowerCase();
    if (c === 'voo') return 'flight';
    if (c === 'hotel') return 'hotel';
    if (c === 'comida') return (timeSlot as any) || 'lunch';
    if (c === 'transporte') return 'transport';
    return 'experience';
  };
  const mapStatus = (s: string): ItineraryActivity['status'] => {
    if (s === 'confirmed') return 'defined';
    if (s === 'cancelled') return 'pending';
    return 'suggestion';
  };

  const days: ItineraryDay[] = existingDays.map((d: any, idx: number) => {
    const activities: ItineraryActivity[] = (d.activities || []).map((a: any) => {
      const timeSlot = inferTimeSlot(a.time, a.category, a.type);
      const cost = Number(a.cost) || 0;
      return {
        id: a.id || `existing-${idx}-${Math.random().toString(36).slice(2, 8)}`,
        name: a.name || 'Atividade',
        type: mapType(a.category, timeSlot),
        timeSlot,
        estimatedCost: cost,
        costPerPerson: travelers > 0 ? cost / travelers : cost,
        time: a.time,
        duration: a.duration,
        location: a.location,
        status: mapStatus(a.status),
        tips: a.description ? [a.description] : undefined,
        source: 'kinu',
      } as ItineraryActivity;
    });
    const totalCost = activities.reduce((s, a) => s + (a.estimatedCost || 0), 0);
    const parsedDate = d.date ? new Date(d.date) : addDays(departureDate, idx);
    return {
      dayNumber: d.day ?? idx + 1,
      date: isNaN(parsedDate.getTime()) ? addDays(departureDate, idx) : parsedDate,
      label: d.title || `Dia ${idx + 1}`,
      theme: [d.icon, d.title].filter(Boolean).join(' ').trim(),
      activities,
      totalCost,
    };
  });

  const sumByPredicate = (pred: (a: ItineraryActivity) => boolean) =>
    days.reduce((s, day) => s + day.activities.filter(pred).reduce((ss, a) => ss + (a.estimatedCost || 0), 0), 0);

  const flightsAmt = sumByPredicate(a => a.type === 'flight');
  const hotelAmt = sumByPredicate(a => a.type === 'hotel' || a.type === 'checkin' || a.type === 'checkout');
  const foodAmt = sumByPredicate(a => a.type === 'breakfast' || a.type === 'lunch' || a.type === 'dinner');
  const experiencesAmt = sumByPredicate(a => !['flight', 'hotel', 'checkin', 'checkout', 'breakfast', 'lunch', 'dinner'].includes(a.type));
  const total = flightsAmt + hotelAmt + foodAmt + experiencesAmt;
  const safeBudget = budget > 0 ? budget : total || 1;
  const pct = (v: number) => Math.round((v / safeBudget) * 100);

  const breakdown: BudgetBreakdown = {
    flights: { amount: flightsAmt, percent: pct(flightsAmt), status: 'defined' },
    hotel: { amount: hotelAmt, percent: pct(hotelAmt), status: 'estimated' },
    experiences: { amount: experiencesAmt, percent: pct(experiencesAmt), status: 'estimated' },
    food: { amount: foodAmt, percent: pct(foodAmt), status: 'estimated' },
    total,
    available: safeBudget - total,
    trustZonePercent: Math.round((total / safeBudget) * 100),
  };

  return { days, breakdown, meta: { michelinCount: 0 } };
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

const categoryLabels: Record<string, string> = {
  breakfast: 'Café',
  morning: 'Manhã',
  lunch: 'Almoço',
  afternoon: 'Tarde',
  dinner: 'Jantar',
  night: 'Noite',
  flight: 'Logística',
  hotel: 'Logística',
};

const statusBadges: Record<string, { label: string; className: string }> = {
  defined: { label: '✓ Definido', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  suggestion: { label: '~ Sugestão', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  pending: { label: '⚠️ Pendente', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const GeneratedItineraryStage = ({
  tripId,
  destination,
  origin,
  emoji,
  departureDate,
  returnDate,
  budget,
  travelers,
  outboundFlight,
  returnFlight,
  travelInterests = [],
  jetLagSeverity,
  onActivate,
  onSave,
  onBack,
  onDaysGenerated,
  priceLevel: priceLevelProp,
  existingDays,
  hotelPlannedOverride,
  budgetFollowsPlan = false,
}: GeneratedItineraryStageProps) => {
  // SINGLE SOURCE OF TRUTH: the internal generator ALWAYS runs so trip-wide
  // no-repetition, Michelin cap and sunset rules apply. existingDays is ignored
  // as an itinerary source (kept in the prop only for backwards compatibility).
  void existingDays;
  const { days: initialDays, breakdown: initialBreakdown, meta = { michelinCount: 0 } } = useMemo(() => {
    return generateItinerary(departureDate, returnDate, destination, origin, outboundFlight, returnFlight, budget, travelers, travelInterests, jetLagSeverity, priceLevelProp);
  }, [departureDate, returnDate, destination, origin, outboundFlight, returnFlight, budget, travelers, travelInterests, jetLagSeverity, priceLevelProp]);

  const [days, setDays] = useState(initialDays);
  const [breakdown] = useState(initialBreakdown);

  useEffect(() => {
    if (onDaysGenerated && days.length > 0) {
      onDaysGenerated(days);
    }
  }, [days, onDaysGenerated]);

  // Recompute finances from the actual generated content and persist onto the
  // matching draft in localStorage so the Financeiro tab always reflects what
  // the Roteiro contains. Runs after generation and whenever the days change
  // in-stage (before activation). Post-activation edits keep working on top.
  // Single source of truth for the finance buckets shown across all surfaces.
  // Matches EXACTLY what recomputeAndPersistFinances writes to trip.finances.
  const computeBuckets = (currentDays: ItineraryDay[]) => {
    const flightsPlanned = Math.round(breakdown.flights.amount || 0);
    // Hotel curado manda: `hotelPlannedOverride` é a diária curada × noites da própria
    // viagem. Sem ele (viagem sem hotel curado), a estimativa desta etapa, como antes.
    const hotelPlanned = hotelPlannedOverride && hotelPlannedOverride > 0
      ? Math.round(hotelPlannedOverride)
      : Math.round(breakdown.hotel.amount || 0);
    let foodPlanned = 0;
    let toursPlanned = 0;
    currentDays.forEach((day) => {
      day.activities.forEach((act) => {
        const cost = Math.round(act.estimatedCost || 0);
        // Exclude flight/hotel/system items — their cost lives only in the
        // planned flight/hotel totals from breakdown, never on day items.
        if (['flight', 'hotel', 'checkin', 'checkout', 'transport'].includes(act.type)) return;
        if (['breakfast', 'lunch', 'dinner'].includes(act.timeSlot)) {
          foodPlanned += cost;
        } else if (['morning', 'afternoon', 'night'].includes(act.timeSlot)) {
          toursPlanned += cost;
        }
      });
    });
    const totalPlanned = flightsPlanned + hotelPlanned + foodPlanned + toursPlanned;
    return { flightsPlanned, hotelPlanned, foodPlanned, toursPlanned, totalPlanned };
  };

  const derivedFinances = useMemo(() => computeBuckets(days), [days, breakdown, hotelPlannedOverride]);

  const recomputeAndPersistFinances = useMemo(() => {
    return (currentDays: ItineraryDay[]) => {
      try {
        const { flightsPlanned, hotelPlanned, foodPlanned, toursPlanned, totalPlanned } = computeBuckets(currentDays);

        // Read-modify-write pelo funil: o updater recebe a viagem FRESCA do storage,
        // então nenhuma viagem irmã é reconstruída de memória (recon §4.1). Id
        // inexistente agora loga aviso no store em vez do `return` mudo (§4.4).
        updateTrip(tripId, (trip) => {
          const prevFinances: Partial<TripFinances> = trip.finances || {};
          const prevCats: Partial<TripFinances['categories']> = prevFinances.categories || {};
          const cat = (name: string) => ({
            planned: 0,
            confirmed: prevCats[name]?.confirmed || 0,
            bidding: prevCats[name]?.bidding || 0,
          });

          const total = trip.budget || prevFinances.total || totalPlanned;
          const confirmed = prevFinances.confirmed || 0;
          const bidding = prevFinances.bidding || 0;

          return followPlanEnvelope({
            ...trip,
            finances: {
              total,
              confirmed,
              bidding,
              planned: totalPlanned,
              available: total - totalPlanned - confirmed,
              categories: {
                flights: { ...cat('flights'), planned: flightsPlanned },
                accommodation: { ...cat('accommodation'), planned: hotelPlanned },
                tours: { ...cat('tours'), planned: toursPlanned },
                food: { ...cat('food'), planned: foodPlanned },
                transport: cat('transport'),
                shopping: cat('shopping'),
              },
            },
          });
        });
      } catch (err) {
        console.warn('[GeneratedItineraryStage] finance recompute failed', err);
      }
    };
    // `destination`/`departureDate`/`returnDate` saem das deps junto com a busca por
    // conteúdo — e é isso que impede o ciclo. O `updateTrip` emite para o sino da
    // /viagens, que re-renderiza o DraftCockpit, que recria `new Date(trip.startDate)`
    // a cada render (DraftCockpit.tsx:371-372): com as datas nas deps, este `useMemo`
    // recomporia, o effect abaixo redispararia e o laço seria infinito. `breakdown` é
    // useState sem setter (:1043) e `tripId` é string — ambos estáveis.
    // `hotelPlannedOverride` é number|undefined derivado de `accommodation.totalPrice`:
    // só muda quando o hotel da viagem muda, e recomputar com o MESMO valor não
    // redispara nada — não reabre o laço que este comentário guarda.
  }, [breakdown, tripId, hotelPlannedOverride]);


  useEffect(() => {
    if (days.length > 0) recomputeAndPersistFinances(days);
  }, [days, recomputeAndPersistFinances]);

  // Convert current ItineraryDay[] into TripDay[] shape (matches buildDraftTrip
  // output) so the parent can persist EXACTLY what the user sees.
  const toTripDays = (source: ItineraryDay[]): any[] => {
    const mapCat = (a: ItineraryActivity): string => {
      const t = a.type;
      if (t === 'flight') return 'voo';
      if (t === 'hotel' || t === 'checkin') return 'hotel';
      if (t === 'transport' || t === 'checkout') return 'transporte';
      if (t === 'breakfast' || t === 'lunch' || t === 'dinner') return 'comida';
      const slot = a.timeSlot;
      if (slot === 'flight') return 'voo';
      if (slot === 'hotel') return 'hotel';
      if (slot === 'breakfast' || slot === 'lunch' || slot === 'dinner') return 'comida';
      return 'passeio';
    };
    const mapStatus = (s: string): string =>
      s === 'pending' ? 'cancelled' : 'planned';
    return source.map((d) => ({
      day: d.dayNumber,
      date: d.date instanceof Date ? d.date.toISOString() : d.date,
      title: d.label,
      icon: (d.theme || '').split(' ')[0] || '',
      activities: d.activities.map((a) => {
        const cat = mapCat(a);
        return {
          id: a.id,
          time: a.time || '',
          name: a.name,
          description: (a.tips && a.tips[0]) || '',
          duration: a.duration || '',
          cost: Math.round(a.estimatedCost || 0),
          type: cat,
          category: cat,
          status: mapStatus(a.status),
        };
      }),
    }));
  };

  const handleActivateWithFinances = () => {
    const tripDays = toTripDays(days);
    const buckets = computeBuckets(days);
    onActivate(tripDays, buckets);
  };
  const handleSaveWithDays = () => {
    const tripDays = toTripDays(days);
    const buckets = computeBuckets(days);
    onSave(tripDays, buckets);
  };
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

  const handleSwapActivity = (dayNum: number, activityId: string) => {
    const day = days.find(d => d.dayNumber === dayNum);
    const activity = day?.activities.find(a => a.id === activityId);
    if (!day || !activity) return;

    // Names already in the trip. Keyed by normalized name, not id, so swapping
    // cannot land on a venue the trip already has under another category's id.
    const usedNames = new Set<string>();
    days.forEach(d => d.activities.forEach(a => usedNames.add(normalizePlaceName(a.name))));

    const category = activity.timeSlot;
    if (category === 'flight' || category === 'hotel') return;

    const themeName = day.theme || 'Descobertas';
    const themeStyleMap: Record<string, string[]> = {
      'Cultura': ['culture', 'history', 'art'],
      'Gastronomia': ['gastronomy'],
      'Passeios': ['nature', 'romantic', 'shopping'],
      'Aventura': ['adventure', 'nature'],
      'Descobertas': ['culture', 'shopping', 'art'],
    };
    const targetTags = themeStyleMap[themeName] || [];

    const pool = getDestinationActivities(destination);
    const isFresh = (a: SuggestedActivity) => !usedNames.has(normalizePlaceName(a.name));
    let candidates = pool.filter(a =>
      a.category === category &&
      isFresh(a) &&
      (targetTags.length === 0 || (a.styleTags && a.styleTags.some(t => targetTags.includes(t))))
    );
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category && isFresh(a));
    }
    if (candidates.length === 0) {
      toast({ title: "Sem outra opção curada para este horário" });
      return;
    }

    const picked = candidates[0];
    const dayIndex = day.dayNumber - 1;
    const newActivity: ItineraryActivity = {
      ...activity,
      id: `day-${dayIndex}-${picked.id}`,
      name: picked.name,
      estimatedCost: picked.estimatedCostBRL * travelers,
      costPerPerson: picked.estimatedCostBRL,
      status: 'suggestion',
    };

    const updatedDays = days.map(d => {
      if (d.dayNumber !== dayNum) return d;
      return {
        ...d,
        activities: d.activities.map(a => (a.id === activityId ? newActivity : a)),
      };
    });
    setDays(updatedDays);
    toast({ title: "Atividade trocada" });
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
            <Button variant="outline" size="sm" onClick={handleSaveWithDays}>
              <Save size={16} className="mr-1" />
              Salvar
            </Button>
            <Button size="sm" onClick={handleActivateWithFinances}>
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

      {/* KINU Analysis Card */}
      <div className="px-4 pt-4">
        <KinuAnalysisCard
          destination={destination}
          departureDate={departureDate}
          returnDate={returnDate}
          budget={budgetFollowsPlan ? envelopeFor(derivedFinances.totalPlanned) : budget}
          reserveAmount={budgetFollowsPlan ? reserveFor(derivedFinances.totalPlanned) : undefined}
          flightsCost={derivedFinances.flightsPlanned}
          hotelCost={derivedFinances.hotelPlanned}
          toursCost={derivedFinances.toursPlanned}
          foodCost={derivedFinances.foodPlanned}
          travelInterests={travelInterests}
          michelinCount={meta.michelinCount}
          jetLagSeverity={jetLagSeverity}
        />
      </div>

      {/* Info Strip: Weather + Exchange */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <ItineraryDayWeather destination={destination} date={departureDate} />
        <ItineraryExchangeRate destination={destination} />
      </div>

      {/* Budget Breakdown */}
      <div className="px-4 py-4 border-b border-border bg-card/50">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            💰 ORÇAMENTO ESTIMADO
          </h3>
          
          <div className="space-y-2 text-sm">
            {(() => {
              const budgetVal = budget || 0;
              const pct = (n: number) => (budgetVal > 0 ? Math.round((n / budgetVal) * 100) : 0);
              const totalPlanned = derivedFinances.totalPlanned;
              const available = budgetVal - totalPlanned;
              const trustZonePercent = budgetVal > 0 ? Math.round((totalPlanned / budgetVal) * 100) : 0;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium text-foreground">R$ {budgetVal.toLocaleString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Plane size={14} className="text-blue-400" />
                      <span className="text-muted-foreground">Voos:</span>
                    </span>
                    <span className="text-foreground">
                      R$ {derivedFinances.flightsPlanned.toLocaleString('pt-BR')} ({pct(derivedFinances.flightsPlanned)}%)
                      <span className="text-emerald-400 ml-1">✓</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Hotel size={14} className="text-purple-400" />
                      <span className="text-muted-foreground">Hotel:</span>
                    </span>
                    <span className="text-foreground">
                      R$ {derivedFinances.hotelPlanned.toLocaleString('pt-BR')} ({pct(derivedFinances.hotelPlanned)}%)
                      <span className="text-amber-400 ml-1">~</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      <span className="text-muted-foreground">Experiências:</span>
                    </span>
                    <span className="text-foreground">
                      R$ {derivedFinances.toursPlanned.toLocaleString('pt-BR')} ({pct(derivedFinances.toursPlanned)}%)
                      <span className="text-amber-400 ml-1">~</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-orange-400" />
                      <span className="text-muted-foreground">Alimentação:</span>
                    </span>
                    <span className="text-foreground">
                      R$ {derivedFinances.foodPlanned.toLocaleString('pt-BR')} ({pct(derivedFinances.foodPlanned)}%)
                      <span className="text-amber-400 ml-1">~</span>
                    </span>
                  </div>

                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total estimado:</span>
                      <span className="font-medium text-foreground">
                        R$ {totalPlanned.toLocaleString('pt-BR')} ({trustZonePercent}%)
                      </span>
                    </div>
                    <div className={cn(
                      'flex items-center justify-between',
                      available >= 0 ? 'text-emerald-400' : 'text-red-500'
                    )}>
                      <span>{available >= 0 ? 'Disponível:' : 'Acima do orçamento:'}</span>
                      <span className="font-medium">
                        {available >= 0
                          ? `R$ ${available.toLocaleString('pt-BR')} para upgrades`
                          : `R$ ${Math.abs(available).toLocaleString('pt-BR')} acima do limite`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Trust Zone</span>
                      <span className={cn(
                        'font-medium',
                        trustZonePercent <= 98 && trustZonePercent >= 85
                          ? 'text-emerald-500'
                          : trustZonePercent < 85
                            ? 'text-amber-500'
                            : 'text-red-500'
                      )}>
                        {trustZonePercent}% {trustZonePercent <= 98 ? '✅' : '⚠️'}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(trustZonePercent, 100)}
                      className={cn(
                        'h-2',
                        trustZonePercent > 100 && '[&>div]:bg-red-500'
                      )}
                    />
                  </div>
                </>
              );
            })()}
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
                          <button
                            onClick={() => handleSwapActivity(currentDay.dayNumber, activity.id)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                          >
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
                        <span className="text-xs text-muted-foreground">{categoryLabels[activity.timeSlot] || activity.type}</span>
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
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-medium text-foreground">
                              R$ {activity.estimatedCost.toLocaleString('pt-BR')}
                            </span>
                            {activity.costPerPerson && activity.costPerPerson !== activity.estimatedCost && (
                              <span className="text-xs text-muted-foreground">
                                (R$ {activity.costPerPerson.toLocaleString('pt-BR')}/pessoa)
                              </span>
                            )}
                          </div>
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
          onClick={handleActivateWithFinances}
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
