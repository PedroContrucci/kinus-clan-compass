// WizardStep4Summary — Summary, Trust Zone & Generate Draft

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Wallet, Plane, Hotel, Sparkles, AlertTriangle, Brain, Check, Info } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { WizardData, BudgetBreakdown } from './types';
import { PRIORITY_OPTIONS, TRAVEL_STYLES } from './types';

interface WizardStep4Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onGenerateDraft: () => void;
  isGenerating: boolean;
}

// Calculate budget breakdown based on input
function calculateBudgetBreakdown(data: WizardData): BudgetBreakdown {
  const DESTINATION_COSTS: Record<string, { flight: number; hotelPerNight: number; activitiesPerDay: number }> = {
    'Tóquio': { flight: 12000, hotelPerNight: 600, activitiesPerDay: 500 },
    'Paris': { flight: 8000, hotelPerNight: 800, activitiesPerDay: 400 },
    'Roma': { flight: 7000, hotelPerNight: 700, activitiesPerDay: 350 },
    'Lisboa': { flight: 5000, hotelPerNight: 500, activitiesPerDay: 300 },
    'Bangkok': { flight: 10000, hotelPerNight: 350, activitiesPerDay: 200 },
    'default': { flight: 8000, hotelPerNight: 600, activitiesPerDay: 350 },
  };

  const costs = DESTINATION_COSTS[data.destinationCity] || DESTINATION_COSTS['default'];
  
  // Style multipliers
  const styleMultipliers: Record<string, number> = {
    'backpacker': 0.6,
    'economic': 0.8,
    'comfort': 1.0,
    'luxury': 1.5,
  };
  const styleMultiplier = styleMultipliers[data.travelStyle] || 1.0;

  // Calculate paying travelers (infants are free)
  const payingFlyers = data.adults + data.children.length;
  const totalTravelers = payingFlyers + data.infants;

  // Priority multipliers
  const priorityIndex = {
    flights: data.priorities.indexOf('flights'),
    accommodation: data.priorities.indexOf('accommodation'),
    experiences: data.priorities.indexOf('experiences'),
  };
  
  const getPriorityMultiplier = (index: number) => {
    if (index === 0) return 1.2;
    if (index === 1) return 1.0;
    return 0.85;
  };

  // Base calculations
  const baseFlights = costs.flight * payingFlyers * styleMultiplier * getPriorityMultiplier(priorityIndex.flights);
  const baseAccommodation = costs.hotelPerNight * data.totalNights * Math.ceil(totalTravelers / 2) * styleMultiplier * getPriorityMultiplier(priorityIndex.accommodation);
  const baseExperiences = costs.activitiesPerDay * data.totalDays * totalTravelers * styleMultiplier * getPriorityMultiplier(priorityIndex.experiences);
  
  const subtotal = baseFlights + baseAccommodation + baseExperiences;
  const buffer = subtotal * 0.10;
  const total = subtotal + buffer;

  const usagePercent = data.budgetAmount > 0 ? (total / data.budgetAmount) * 100 : 0;
  const isWithinTrustZone = usagePercent >= 80 && usagePercent <= 100;

  return {
    flights: Math.round(baseFlights),
    accommodation: Math.round(baseAccommodation),
    experiences: Math.round(baseExperiences),
    buffer: Math.round(buffer),
    total: Math.round(total),
    usagePercent: Math.round(usagePercent),
    isWithinTrustZone,
  };
}

// Get destination emoji
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🇯🇵',
    'Paris': '🇫🇷',
    'Roma': '🇮🇹',
    'Lisboa': '🇵🇹',
    'Bangkok': '🇹🇭',
    'Barcelona': '🇪🇸',
    'Nova York': '🇺🇸',
    'Londres': '🇬🇧',
  };
  return emojiMap[destination] || '✈️';
}

// Calculate jet lag
function calculateJetLag(destination: string): { hours: number; severity: 'low' | 'moderate' | 'high' | 'severe' } {
  const timezones: Record<string, number> = {
    'Tóquio': 12,
    'Bangkok': 10,
    'Dubai': 7,
    'Paris': 4,
    'Lisboa': 3,
    'Londres': 3,
    'Roma': 4,
    'Barcelona': 4,
    'Nova York': -2,
  };
  
  const hours = Math.abs(timezones[destination] || 0);
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  if (hours > 8) severity = 'severe';
  else if (hours > 5) severity = 'high';
  else if (hours > 2) severity = 'moderate';
  
  return { hours, severity };
}

export const WizardStep4Summary = ({ data, onChange, onGenerateDraft, isGenerating }: WizardStep4Props) => {
  const breakdown = useMemo(() => calculateBudgetBreakdown(data), [data]);
  const jetLag = useMemo(() => calculateJetLag(data.destinationCity), [data.destinationCity]);
  
  const totalTravelers = data.adults + data.children.length + data.infants;
  const priorityLabels = data.priorities.map(p => PRIORITY_OPTIONS.find(o => o.id === p)?.label || p);
  const styleLabel = TRAVEL_STYLES.find(s => s.id === data.travelStyle)?.label || data.travelStyle;

  // State for jet lag mode
  const [jetLagModeEnabled, setJetLagModeEnabled] = useMemo(() => {
    return [jetLag.severity !== 'low', () => {}];
  }, [jetLag]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground font-['Outfit']">
          📋 Resumo do Planejamento
        </h2>
      </div>

      {/* Trip Summary Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        {/* Route */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getDestinationEmoji(data.destinationCity)}</span>
          <div>
            <p className="font-bold text-foreground font-['Outfit'] text-lg">
              {data.originCity} → {data.destinationCity}
            </p>
            {data.originAirportCode && data.destinationAirportCode && (
              <p className="text-sm text-muted-foreground">
                {data.originAirportCode} → {data.destinationAirportCode}
              </p>
            )}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="text-muted-foreground">
              {data.departureDate && format(data.departureDate, 'dd/MM/yyyy', { locale: ptBR })} - 
              {data.returnDate && format(data.returnDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-primary" />
            <span className="text-foreground font-medium">{data.totalDays} dias</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-primary" />
            <span className="text-muted-foreground">
              {data.adults} adulto{data.adults > 1 ? 's' : ''}
              {data.children.length > 0 && ` + ${data.children.length} criança${data.children.length > 1 ? 's' : ''}`}
              {data.infants > 0 && ` + ${data.infants} bebê${data.infants > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wallet size={16} className="text-primary" />
            <span className="text-foreground font-medium">
              R$ {data.budgetAmount.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">🎯 Prioridade:</span>
          <span className="text-foreground">{priorityLabels.join(' > ')}</span>
        </div>

        {/* Style */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">🎨 Estilo:</span>
          <span className="text-foreground">{styleLabel}</span>
        </div>
      </div>

      {/* Trust Zone */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-primary" />
          Trust Zone do Budget
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Alocação estimada:</span>
            <span className={cn(
              'font-bold',
              breakdown.isWithinTrustZone ? 'text-emerald-500' : 
              breakdown.usagePercent < 80 ? 'text-blue-500' : 'text-amber-500'
            )}>
              {breakdown.usagePercent}% (R$ {breakdown.total.toLocaleString('pt-BR')})
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <Progress 
              value={Math.min(breakdown.usagePercent, 120)} 
              className="h-4"
            />
            {/* 80% marker */}
            <div className="absolute left-[66.7%] top-0 h-4 w-0.5 bg-foreground/30" />
            {/* 100% marker */}
            <div className="absolute left-[83.3%] top-0 h-4 w-0.5 bg-foreground/30" />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>80%</span>
            <span>100%</span>
            <span>120%</span>
          </div>

          {/* Status Indicator */}
          <div className={cn(
            'p-3 rounded-xl flex items-center gap-2',
            breakdown.isWithinTrustZone ? 'bg-emerald-500/10 border border-emerald-500/30' :
            breakdown.usagePercent < 80 ? 'bg-blue-500/10 border border-blue-500/30' :
            'bg-amber-500/10 border border-amber-500/30'
          )}>
            {breakdown.isWithinTrustZone ? (
              <>
                <Check size={18} className="text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">✅ Dentro da Trust Zone (80-100%)</span>
              </>
            ) : breakdown.usagePercent < 80 ? (
              <>
                <Info size={18} className="text-blue-500" />
                <span className="text-sm text-blue-500 font-medium">Há margem para upgrades</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} className="text-amber-500" />
                <span className="text-sm text-amber-500 font-medium">Budget apertado - considere ajustes</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Estimativa por categoria:</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane size={16} className="text-primary" />
              <span className="text-muted-foreground">Voos</span>
            </div>
            <span className="font-medium text-foreground">
              R$ {breakdown.flights.toLocaleString('pt-BR')} ({Math.round((breakdown.flights / breakdown.total) * 100)}%)
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hotel size={16} className="text-primary" />
              <span className="text-muted-foreground">Hospedagem</span>
            </div>
            <span className="font-medium text-foreground">
              R$ {breakdown.accommodation.toLocaleString('pt-BR')} ({Math.round((breakdown.accommodation / breakdown.total) * 100)}%)
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span className="text-muted-foreground">Experiências</span>
            </div>
            <span className="font-medium text-foreground">
              R$ {breakdown.experiences.toLocaleString('pt-BR')} ({Math.round((breakdown.experiences / breakdown.total) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {!data.hasDirectFlight && data.connections.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-500">Conexão necessária (voo não direto)</p>
              <p className="text-sm text-muted-foreground mt-1">
                {data.originAirportCode} → {data.connections[0]} → {data.destinationAirportCode}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Jet Lag Alert */}
      {jetLag.severity !== 'low' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <Brain size={20} className="text-purple-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-purple-500">
                🧬 Biology AI: Jet lag de {jetLag.hours}h detectado
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {jetLag.severity === 'severe' && 'Impacto severo. Dia 1 focado em descanso.'}
                {jetLag.severity === 'high' && 'Impacto alto. Recomendamos atividades leves no Dia 1.'}
                {jetLag.severity === 'moderate' && 'Impacto moderado. Dia 1 será leve.'}
              </p>
              
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <Checkbox defaultChecked={true} />
                <span className="text-sm text-foreground">Bloquear atividades intensas no Dia 1</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WizardStep4Summary;
