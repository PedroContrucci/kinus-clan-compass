// WizardStep4Summary — Summary, Trust Zone & Generate Draft

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Wallet, Plane, Hotel, Sparkles, AlertTriangle, Brain, Check, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { WizardData } from './types';
import { PRIORITY_OPTIONS, BUDGET_TIERS, BUDGET_ALLOCATION, TRAVEL_INTERESTS } from './types';

interface WizardStep4Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onGenerateDraft: () => void;
  isGenerating: boolean;
}

function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🇯🇵', 'Paris': '🇫🇷', 'Roma': '🇮🇹', 'Lisboa': '🇵🇹',
    'Bangkok': '🇹🇭', 'Barcelona': '🇪🇸', 'Nova York': '🇺🇸', 'Londres': '🇬🇧',
    'Rio de Janeiro': '🇧🇷', 'Buenos Aires': '🇦🇷', 'Santiago': '🇨🇱',
    'Dubai': '🇦🇪', 'Singapura': '🇸🇬', 'Seul': '🇰🇷',
  };
  return emojiMap[destination] || '✈️';
}

function calculateJetLag(destinationTimezone: string | null): { hours: number; severity: 'low' | 'moderate' | 'high' | 'severe' } {
  const originOffset = -3;
  const timezoneOffsets: Record<string, number> = {
    'Asia/Tokyo': 9, 'Asia/Bangkok': 7, 'Asia/Dubai': 4,
    'Europe/Paris': 1, 'Europe/Lisbon': 0, 'Europe/London': 0, 'Europe/Rome': 1,
    'America/New_York': -5, 'America/Los_Angeles': -8, 'America/Sao_Paulo': -3,
    'America/Mexico_City': -6, 'America/Bogota': -5, 'America/Lima': -5,
    'America/Santiago': -3, 'America/Montevideo': -3, 'America/Argentina/Buenos_Aires': -3,
    'America/Havana': -5, 'Asia/Singapore': 8, 'Asia/Seoul': 9,
    'Asia/Shanghai': 8, 'Asia/Kolkata': 5.5, 'Asia/Ho_Chi_Minh': 7,
    'Asia/Jerusalem': 2, 'Indian/Maldives': 5,
    'Australia/Sydney': 11, 'Pacific/Auckland': 13,
    'Africa/Cairo': 2, 'Africa/Casablanca': 1, 'Africa/Johannesburg': 2, 'Africa/Nairobi': 3,
    'Europe/Madrid': 1, 'Europe/Amsterdam': 1, 'Europe/Berlin': 1,
    'Europe/Prague': 1, 'Europe/Vienna': 1, 'Europe/Istanbul': 3,
    'Europe/Athens': 2, 'Europe/Zurich': 1, 'Europe/Dublin': 0,
    'Europe/Zagreb': 1, 'Europe/Budapest': 1,
    'America/Toronto': -5, 'America/Vancouver': -8, 'America/Cancun': -5,
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
  const jetLag = useMemo(() => calculateJetLag(data.destinationTimezoneId || data.destinationTimezone), [data.destinationTimezoneId, data.destinationTimezone]);
  
  const priorityLabels = data.priorities.map(p => PRIORITY_OPTIONS.find(o => o.id === p)?.label || p);
  const tier = BUDGET_TIERS.find(t => t.id === data.budgetTier);
  const interestLabels = (data.travelInterests || []).map(i => 
    TRAVEL_INTERESTS.find(t => t.id === i)
  ).filter(Boolean);

  const handleBiologyAIToggle = (enabled: boolean) => {
    onChange({ biologyAIEnabled: enabled });
  };

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

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
          <span className="text-3xl">{data.selectedCountryFlag || getDestinationEmoji(data.destinationCity)}</span>
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
              {tier?.icon} {tier?.label}
            </span>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">🎯 Prioridade:</span>
          <span className="text-foreground">{priorityLabels.join(' > ')}</span>
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

      {/* Budget Estimate */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-primary" />
          Estimativa de Orçamento
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tier?.icon}</span>
              <div>
                <span className="font-medium text-foreground">{tier?.label}</span>
                <p className="text-xs text-muted-foreground">{tier?.description}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Faixa estimada:</p>
            <p className="text-xl font-bold text-primary font-['Outfit']">
              R$ {formatBRL(data.budgetEstimateMin)} – R$ {formatBRL(data.budgetEstimateMax)}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>🎯 Alocação:</span>
            <span>{priorityLabels[0]} 45% › {priorityLabels[1]} 35% › {priorityLabels[2]} 20%</span>
          </div>
        </div>
      </div>

      {/* Trust Zone */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Check size={18} className="text-emerald-500" />
          <span className="text-sm text-emerald-500 font-medium">
            ✅ Faixa {tier?.label} selecionada — o KINU otimizará os custos
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          O roteiro será gerado buscando o melhor custo-benefício dentro da faixa {tier?.label?.toLowerCase()}.
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

      {/* Biology AI */}
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
                  🧬 Biology AI: Jet lag de {jetLag.hours}h detectado
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
                <p className="text-sm text-muted-foreground">Se ativado:</p>
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

      {/* Curation Justification Card */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground font-['Outfit'] text-base">
          🎯 Curadoria do seu Roteiro
        </h3>

        {interestLabels.length > 0 && (
          <div className="flex items-start gap-3 pl-1">
            <div className="w-1 self-stretch rounded-full bg-emerald-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-emerald-400 font-medium">Seus interesses:</span>{' '}
              {interestLabels.map(i => i!.label).join(', ')} — dias temáticos priorizados de acordo com suas preferências
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 pl-1">
          <div className="w-1 self-stretch rounded-full bg-sky-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-sky-400 font-medium">Base curada KINU:</span>{' '}
            atividades e restaurantes selecionados por curadoria inspirada em Conde Nast Traveler, Lonely Planet e guias especializados
          </p>
        </div>

        {(data.travelInterests || []).includes('gastronomy') && (
          <div className="flex items-start gap-3 pl-1">
            <div className="w-1 self-stretch rounded-full bg-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-amber-400 font-medium">Guia Michelin:</span>{' '}
              restaurantes estrelados incluídos no roteiro quando disponíveis para {data.destinationCity}
            </p>
          </div>
        )}

        {data.biologyAIEnabled && jetLag.hours > 0 && (
          <div className="flex items-start gap-3 pl-1">
            <div className="w-1 self-stretch rounded-full bg-purple-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="text-purple-400 font-medium">Biology AI:</span>{' '}
              ritmo adaptado ao fuso horário ({jetLag.hours}h de diferença)
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 pl-1">
          <div className="w-1 self-stretch rounded-full bg-violet-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-violet-400 font-medium">Hotel Intelligence:</span>{' '}
            bairro recomendado com base nos interesses e orçamento
          </p>
        </div>

        <div className="flex items-start gap-3 pl-1">
          <div className="w-1 self-stretch rounded-full bg-green-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="text-green-400 font-medium">Perfil {tier?.label}:</span>{' '}
            {tier?.id === 'luxury' ? 'Hotels 5★, restaurantes Michelin, tours VIP' :
             tier?.id === 'comfort' ? 'Hotels 4★, restaurantes recomendados, tours privados' :
             tier?.id === 'economic' ? 'Hotels 3★, restaurantes locais, tours em grupo' :
             'Hostels, street food, tours gratuitos'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WizardStep4Summary;
