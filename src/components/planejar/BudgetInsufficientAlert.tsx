import { AlertTriangle, TrendingDown, Calendar, MapPin, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetInsufficientAlertProps {
  type: 'insufficient' | 'tight';
  userBudget: number;
  requiredBudget: number;
  destination: string;
  days: number;
  onAdjustBudget: () => void;
  onChangeDates: () => void;
  onViewAlternatives: () => void;
  suggestions?: {
    reduceDays?: { newDays: number; savings: number };
    changeDates?: { savingsPercent: number };
    alternativeDestination?: { destination: string; budget: number };
    newMinBudget?: number;
  };
}

export const BudgetInsufficientAlert = ({
  type,
  userBudget,
  requiredBudget,
  destination,
  days,
  onAdjustBudget,
  onChangeDates,
  onViewAlternatives,
  suggestions,
}: BudgetInsufficientAlertProps) => {
  const deficit = requiredBudget - userBudget;
  const deficitPercent = Math.round((deficit / userBudget) * 100);

  if (type === 'insufficient') {
    return (
      <div 
        className={cn(
          "border rounded-2xl p-6",
          "bg-[#eab308]/5 border-[#eab308]"
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={24} className="text-[#eab308]" />
          <h3 className="font-semibold text-foreground font-['Outfit'] text-lg">
            ⚠️ Orçamento Insuficiente para este Horizonte
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-muted-foreground text-sm">📊 Análise Financeira:</p>
          
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seu orçamento:</span>
              <span className="text-foreground font-medium font-['Outfit']">
                R$ {userBudget.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo mínimo (voo + hotel):</span>
              <span className="text-foreground font-medium font-['Outfit']">
                R$ {requiredBudget.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Déficit:</span>
              <span className="text-destructive font-semibold font-['Outfit']">
                R$ {deficit.toLocaleString()} ({deficitPercent > 0 ? '+' : ''}{deficitPercent}%)
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground text-sm mb-3">💡 Sugestões do Irmão Experiente:</p>
          
          <div className="space-y-2">
            {suggestions?.reduceDays && (
              <div className="flex items-center justify-between bg-muted/20 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-foreground">Reduzir para {suggestions.reduceDays.newDays} diárias</span>
                </div>
                <span className="text-primary font-medium">
                  Economia: R$ {suggestions.reduceDays.savings.toLocaleString()}
                </span>
              </div>
            )}
            
            {suggestions?.changeDates && (
              <div className="flex items-center justify-between bg-muted/20 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-primary" />
                  <span className="text-foreground">Alterar datas (+15 dias)</span>
                </div>
                <span className="text-primary font-medium">
                  Economia: -{suggestions.changeDates.savingsPercent}%
                </span>
              </div>
            )}
            
            {suggestions?.alternativeDestination && (
              <div className="flex items-center justify-between bg-muted/20 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span className="text-foreground">Considerar destino alternativo</span>
                </div>
                <span className="text-primary font-medium">
                  {suggestions.alternativeDestination.destination}: R$ {suggestions.alternativeDestination.budget.toLocaleString()}
                </span>
              </div>
            )}
            
            {suggestions?.newMinBudget && (
              <div className="flex items-center justify-between bg-muted/20 rounded-xl p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-primary" />
                  <span className="text-foreground">Aumentar orçamento para</span>
                </div>
                <span className="text-primary font-medium">
                  R$ {suggestions.newMinBudget.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#eab308]/10 rounded-xl p-4 mb-6">
          <p className="text-foreground text-sm italic">
            "Prefiro te falar agora do que você descobrir no cartão de crédito depois. Vamos ajustar?" 🌿
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onAdjustBudget}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl font-medium text-sm"
          >
            Ajustar Orçamento
          </button>
          <button
            onClick={onChangeDates}
            className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors"
          >
            Mudar Datas
          </button>
          <button
            onClick={onViewAlternatives}
            className="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors"
          >
            Ver Alternativas
          </button>
        </div>
      </div>
    );
  }

  // Tight budget - can proceed but with mostly free activities
  return (
    <div 
      className={cn(
        "border rounded-2xl p-6",
        "bg-primary/5 border-primary"
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="font-semibold text-foreground font-['Outfit'] text-lg">
          Roteiro Econômico Gerado
        </h3>
      </div>

      <p className="text-muted-foreground text-sm mb-4">
        Seu orçamento permite a viagem, mas com pouca margem para atividades pagas.
      </p>

      <div className="bg-muted/30 rounded-xl p-4 space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Voo + Hotel:</span>
          <span className="text-foreground font-medium font-['Outfit']">
            R$ {requiredBudget.toLocaleString()} ({Math.round((requiredBudget / userBudget) * 100)}%)
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saldo para atividades:</span>
          <span className="text-foreground font-medium font-['Outfit']">
            R$ {(userBudget - requiredBudget).toLocaleString()} ({Math.round(((userBudget - requiredBudget) / userBudget) * 100)}%)
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Por dia:</span>
          <span className="text-primary font-semibold font-['Outfit']">
            R$ {Math.round((userBudget - requiredBudget) / days).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-primary/10 rounded-xl p-4">
        <p className="text-foreground text-sm">
          ✅ Geramos um roteiro com atividades gratuitas e experiências de baixo custo.
        </p>
        <p className="text-foreground text-sm italic mt-2">
          "{destination} tem MUITA coisa grátis! Panteão, Fontana di Trevi, praças lindas... Vai ser incrível!" 🌿
        </p>
      </div>
    </div>
  );
};

export default BudgetInsufficientAlert;
