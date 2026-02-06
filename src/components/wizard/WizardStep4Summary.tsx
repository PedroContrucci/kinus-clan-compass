// WizardStep4Summary — Summary, Trust Zone & Generate Draft

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Wallet, Plane, Hotel, Sparkles, AlertTriangle, Brain, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WizardData, BudgetBreakdown } from './types';
import { PRIORITY_OPTIONS, TRAVEL_STYLES, BUDGET_ALLOCATION, TRAVEL_INTERESTS } from './types';

interface WizardStep4Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onGenerateDraft: () => void;
  isGenerating: boolean;
}

// Calculate budget breakdown based on priority order
function calculateBudgetBreakdown(data: WizardData): BudgetBreakdown {
  const budget = data.budgetAmount;
  
  // Allocate based on priority order: 1st = 45%, 2nd = 35%, 3rd = 20%
  const allocations = {
    flights: 0,
    accommodation: 0,
    experiences: 0,
  };

  data.priorities.forEach((priority, index) => {
    const percent = index === 0 ? BUDGET_ALLOCATION.first : 
                    index === 1 ? BUDGET_ALLOCATION.second : 
                    BUDGET_ALLOCATION.third;
    allocations[priority] = budget * percent;
  });

  const subtotal = allocations.flights + allocations.accommodation + allocations.experiences;
  const usagePercent = budget > 0 ? Math.round((subtotal / budget) * 100) : 0;
  const isWithinTrustZone = usagePercent >= 80 && usagePercent <= 100;

  return {
    flights: Math.round(allocations.flights),
    accommodation: Math.round(allocations.accommodation),
    experiences: Math.round(allocations.experiences),
    buffer: 0,
    total: Math.round(subtotal),
    usagePercent,
    isWithinTrustZone: true, // Since we're using 100% of budget
  };
}

// Get destination emoji
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🇯🇵',
    'Tokyo': '🇯🇵',
    'Paris': '🇫🇷',
    'Roma': '🇮🇹',
    'Lisboa': '🇵🇹',
    'Bangkok': '🇹🇭',
    'Barcelona': '🇪🇸',
    'Nova York': '🇺🇸',
    'Londres': '🇬🇧',
    'Rio de Janeiro': '🇧🇷',
    'Florianópolis': '🏖️',
    'Salvador': '🎭',
    'Recife': '🌴',
    'Fortaleza': '☀️',
    'Foz do Iguaçu': '🌊',
    'Cidade do México': '🇲🇽',
    'Cartagena': '🇨🇴',
    'Lima': '🇵🇪',
    'Cusco': '🏔️',
    'Santiago': '🇨🇱',
    'Montevidéu': '🇺🇾',
    'Buenos Aires': '🇦🇷',
    'Bariloche': '⛷️',
    'Havana': '🇨🇺',
  };
  return emojiMap[destination] || '✈️';
}

// Calculate jet lag based on timezone difference
function calculateJetLag(destinationTimezone: string | null): { hours: number; severity: 'low' | 'moderate' | 'high' | 'severe' } {
  // São Paulo timezone offset (UTC-3)
  const originOffset = -3;
  
  // Map common timezones to offsets
  const timezoneOffsets: Record<string, number> = {
    'Asia/Tokyo': 9,
    'Asia/Bangkok': 7,
    'Asia/Dubai': 4,
    'Europe/Paris': 1,
    'Europe/Lisbon': 0,
    'Europe/London': 0,
    'Europe/Rome': 1,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'America/Sao_Paulo': -3,
    'America/Mexico_City': -6,
    'America/Bogota': -5,
    'America/Lima': -5,
    'America/Santiago': -3,
    'America/Montevideo': -3,
    'America/Argentina/Buenos_Aires': -3,
    'America/Havana': -5,
    'America/Puerto_Rico': -4,
  };
  
  const destOffset = timezoneOffsets[destinationTimezone || ''] ?? originOffset;
  const hours = Math.abs(destOffset - originOffset);
  
  let severity: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  if (hours > 8) severity = 'severe';
  else if (hours > 5) severity = 'high';
  else if (hours > 2) severity = 'moderate';
  
  return { hours, severity };
}

export const WizardStep4Summary = ({ data, onChange, onGenerateDraft, isGenerating }: WizardStep4Props) => {
  const breakdown = useMemo(() => calculateBudgetBreakdown(data), [data]);
  const jetLag = useMemo(() => calculateJetLag(data.destinationTimezone), [data.destinationTimezone]);
  
  const priorityLabels = data.priorities.map(p => PRIORITY_OPTIONS.find(o => o.id === p)?.label || p);
  const styleLabel = TRAVEL_STYLES.find(s => s.id === data.travelStyle)?.label || data.travelStyle;
  const interestLabels = (data.travelInterests || []).map(i => 
    TRAVEL_INTERESTS.find(t => t.id === i)
  ).filter(Boolean);

  const handleBiologyAIToggle = (enabled: boolean) => {
    onChange({ biologyAIEnabled: enabled });
  };

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
          <span className="text-muted-foreground">🏨 Estilo:</span>
          <span className="text-foreground">{styleLabel}</span>
        </div>

        {/* Interests */}
        {interestLabels.length > 0 && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-muted-foreground">🎨 Interesses:</span>
            <div className="flex gap-1.5">
              {interestLabels.map((interest, i) => interest && (
                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  {interest.icon} {interest.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Budget Breakdown - Priority-based allocation */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-primary" />
          Alocação do Budget por Prioridade
        </h3>
        
        <div className="space-y-3">
          {data.priorities.map((priority, index) => {
            const option = PRIORITY_OPTIONS.find(p => p.id === priority);
            const percent = index === 0 ? 45 : index === 1 ? 35 : 20;
            const amount = breakdown[priority as keyof typeof breakdown] as number;
            
            const icons = {
              flights: <Plane size={16} className="text-primary" />,
              accommodation: <Hotel size={16} className="text-primary" />,
              experiences: <Sparkles size={16} className="text-primary" />,
            };
            
            return (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icons[priority as keyof typeof icons]}
                  <span className="text-muted-foreground">{option?.label}</span>
                  {index === 0 && (
                    <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                      Prioridade
                    </span>
                  )}
                </div>
                <span className="font-medium text-foreground">
                  R$ {amount.toLocaleString('pt-BR')} ({percent}%)
                </span>
              </div>
            );
          })}
          
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-primary text-lg">
              R$ {data.budgetAmount.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Zone Indicator */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Check size={18} className="text-emerald-500" />
          <span className="text-sm text-emerald-500 font-medium">
            ✅ Budget 100% alocado dentro da Trust Zone
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          A alocação respeita suas prioridades: {priorityLabels[0]} recebe 45%, {priorityLabels[1]} 35%, e {priorityLabels[2]} 20%.
        </p>
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

      {/* Biology AI - Optional Toggle */}
      {jetLag.hours > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <Brain size={20} className="text-purple-500 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-purple-500">
                  🧬 Biology AI: {jetLag.hours > 0 ? `Jet lag de ${jetLag.hours}h detectado` : 'Sem jet lag significativo'}
                </p>
                <Switch 
                  checked={data.biologyAIEnabled} 
                  onCheckedChange={handleBiologyAIToggle}
                />
              </div>
              
              <div className={cn(
                'mt-3 transition-opacity',
                data.biologyAIEnabled ? 'opacity-100' : 'opacity-50'
              )}>
                <p className="text-sm text-muted-foreground">
                  Se ativado:
                </p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                  <li>Dia 1 será focado em descanso</li>
                  <li>Atividades leves sugeridas</li>
                  <li>Dicas de adaptação ao fuso</li>
                </ul>
              </div>
              
              <p className="text-xs text-muted-foreground/60 mt-2">
                Por padrão: desativado. Ative se quiser otimização de jet lag.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WizardStep4Summary;