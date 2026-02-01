import { format, differenceInDays } from 'date-fns';
import { Brain, Users, Target, Wallet, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripHeaderSummaryProps {
  destination: string;
  country: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  experienceDays: number;
  budget: number;
  travelers: number;
  priorities: string[];
  jetLagEnabled: boolean;
  jetLagImpact?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  arrivalDate?: Date;
}

const priorityLabels: Record<string, string> = {
  'gastronomia': 'Gastronomia',
  'historia': 'História',
  'natureza': 'Natureza',
  'compras': 'Compras',
  'arte': 'Arte',
  'praias': 'Praias',
  'vida-noturna': 'Vida Noturna',
  'relax': 'Relax',
};

export const TripHeaderSummary = ({
  destination,
  country,
  emoji,
  startDate,
  endDate,
  totalDays,
  experienceDays,
  budget,
  travelers,
  priorities,
  jetLagEnabled,
  jetLagImpact,
  arrivalDate,
}: TripHeaderSummaryProps) => {
  const isTransitDifferent = experienceDays < totalDays;
  
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      {/* Destination Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h2 className="text-xl font-bold text-foreground font-['Outfit']">
            Seu Roteiro para {destination}
          </h2>
          <p className="text-sm text-muted-foreground">{country}</p>
        </div>
      </div>
      
      {/* Trip Details Card */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-primary" />
          <span className="text-foreground font-medium">
            {format(startDate, 'EEE dd/MM')} → {format(endDate, 'EEE dd/MM')}
          </span>
        </div>
        
        {/* Days Breakdown */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-4" />
          <span>
            {totalDays} dias totais • {experienceDays} dias de experiências
          </span>
        </div>
        
        {isTransitDifferent && (
          <div className="text-xs text-muted-foreground ml-6 italic">
            ⚠️ Dia {format(startDate, 'dd')}: Trânsito (voo)
          </div>
        )}
        
        {/* Budget */}
        <div className="flex items-center gap-2 text-sm">
          <Wallet size={16} className="text-primary" />
          <span className="text-foreground font-medium">
            Orçamento: R$ {budget.toLocaleString()}
          </span>
        </div>
        
        {/* Travelers */}
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-primary" />
          <span className="text-foreground font-medium">
            {travelers} viajante{travelers > 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Priorities */}
        <div className="flex items-center gap-2 text-sm">
          <Target size={16} className="text-primary" />
          <span className="text-foreground font-medium">
            Foco: {priorities.map(p => priorityLabels[p] || p).join(', ')}
          </span>
        </div>
        
        {/* Jet Lag Mode */}
        {jetLagEnabled && jetLagImpact && jetLagImpact !== 'BAIXO' && arrivalDate && (
          <div className="flex items-center gap-2 text-sm">
            <Brain size={16} className="text-[#eab308]" />
            <span className="text-[#eab308] font-medium">
              Biology-Aware: Dia {format(arrivalDate, 'dd')} otimizado (jet lag)
            </span>
          </div>
        )}
      </div>
      
      {/* Honest Experience Counter */}
      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-xl">
        <p className="text-sm text-foreground">
          <span className="font-medium text-primary">✅ {experienceDays} dias de experiências reais</span>
          {isTransitDifferent && (
            <span className="text-muted-foreground ml-2">
              (descontando trânsito)
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          💡 "Contamos só os dias que você realmente vai aproveitar. Honestidade é nosso lema!" 🌿
        </p>
      </div>
    </div>
  );
};

export default TripHeaderSummary;
