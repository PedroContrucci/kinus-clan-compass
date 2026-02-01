import { useState } from 'react';
import { AlertTriangle, TrendingDown, Calendar, MapPin, Wallet, Hotel, Plane, Tag, Utensils, Car, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SpendingBreakdown {
  flights: { cost: number; percent: number; isHighest: boolean };
  accommodation: { cost: number; percent: number; nightlyCost: number; nights: number; isHighest: boolean };
  activities: { cost: number; percent: number; mostExpensive: { name: string; cost: number }[]; isHighest: boolean };
  food: { cost: number; percent: number; isHighest: boolean };
  transport: { cost: number; percent: number; isHighest: boolean };
}

interface ReductionSuggestion {
  id: string;
  type: 'reduce_days' | 'change_hotel' | 'auction_activities' | 'economic_version';
  title: string;
  description: string;
  savings: number;
  newTotal: number;
  stillOver: boolean;
  details?: {
    from?: string;
    to?: string;
    items?: { name: string; currentCost: number; targetCost: number }[];
  };
}

interface ReductionStrategyPanelProps {
  userBudget: number;
  totalCost: number;
  breakdown: SpendingBreakdown;
  suggestions: ReductionSuggestion[];
  destination: string;
  days: number;
  onApplySuggestion: (suggestionId: string) => void;
  onGenerateEconomic: () => void;
  onActivateAuction: (activityName: string) => void;
}

export const ReductionStrategyPanel = ({
  userBudget,
  totalCost,
  breakdown,
  suggestions,
  destination,
  days,
  onApplySuggestion,
  onGenerateEconomic,
  onActivateAuction,
}: ReductionStrategyPanelProps) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  
  const overflow = totalCost - userBudget;
  const overflowPercent = Math.round((overflow / userBudget) * 100);
  
  // Find the villain (highest spending category)
  const villain = Object.entries(breakdown).reduce((max, [key, val]) => 
    val.cost > max.cost ? { key, ...val } : max
  , { key: '', cost: 0, percent: 0, isHighest: false });

  const getCategoryIcon = (key: string) => {
    switch (key) {
      case 'flights': return <Plane size={16} />;
      case 'accommodation': return <Hotel size={16} />;
      case 'activities': return <Tag size={16} />;
      case 'food': return <Utensils size={16} />;
      case 'transport': return <Car size={16} />;
      default: return null;
    }
  };

  const getCategoryLabel = (key: string) => {
    switch (key) {
      case 'flights': return 'Voos';
      case 'accommodation': return 'Hospedagem';
      case 'activities': return 'Atividades';
      case 'food': return 'Alimentação';
      case 'transport': return 'Transporte';
      default: return key;
    }
  };

  return (
    <div className="bg-background border-2 border-[#eab308] rounded-2xl p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#eab308]/20 rounded-lg">
          <AlertTriangle size={24} className="text-[#eab308]" />
        </div>
        <div>
          <h2 className="font-bold text-xl font-['Outfit'] text-foreground">
            ⚠️ Estratégia de Redução KINU
          </h2>
          <p className="text-sm text-muted-foreground">
            Vamos encontrar um caminho que cabe no seu bolso
          </p>
        </div>
      </div>

      {/* Financial Diagnosis */}
      <div className="bg-muted/30 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-foreground font-['Outfit'] mb-3 flex items-center gap-2">
          📊 DIAGNÓSTICO FINANCEIRO
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Seu orçamento:</span>
            <span className="text-foreground font-semibold font-['Outfit']">
              R$ {userBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Custo gerado:</span>
            <span className="text-foreground font-semibold font-['Outfit']">
              R$ {totalCost.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Excesso:</span>
            <span className="text-destructive font-bold font-['Outfit']">
              R$ {overflow.toLocaleString()} (+{overflowPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground font-['Outfit'] mb-3 flex items-center gap-2">
          🔍 ONDE O DINHEIRO ESTÁ INDO:
        </h3>
        
        {/* Villain Highlight */}
        <div className="bg-[#eab308]/10 border-l-4 border-[#eab308] rounded-r-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#eab308] font-bold text-sm">🔴 VILÃO #1: {getCategoryLabel(villain.key)}</span>
          </div>
          <p className="text-foreground font-semibold font-['Outfit']">
            R$ {villain.cost.toLocaleString()} ({villain.percent}% do total)
          </p>
          {villain.key === 'accommodation' && breakdown.accommodation && (
            <p className="text-sm text-muted-foreground mt-1">
              Hotel × {breakdown.accommodation.nights} noites = R$ {breakdown.accommodation.nightlyCost.toLocaleString()}/noite
            </p>
          )}
          <p className="text-sm text-[#eab308] mt-2">
            💡 Consumindo quase metade do seu budget!
          </p>
        </div>
        
        {/* Other Categories */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-2">
          {Object.entries(breakdown)
            .filter(([key]) => key !== villain.key)
            .map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  {getCategoryIcon(key)} {getCategoryLabel(key)}:
                </span>
                <span className="text-foreground font-medium font-['Outfit']">
                  R$ {val.cost.toLocaleString()} ({val.percent}%)
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Reduction Strategies */}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground font-['Outfit'] mb-4 flex items-center gap-2">
          🎯 ESTRATÉGIAS PARA CABER NO ORÇAMENTO
        </h3>
        
        <div className="space-y-4">
          {/* Strategy 1: Reduce Days */}
          {suggestions.filter(s => s.type === 'reduce_days').map(suggestion => (
            <Collapsible 
              key={suggestion.id}
              open={expandedSuggestion === suggestion.id}
              onOpenChange={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
            >
              <div className="border border-border rounded-xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-primary" />
                    <div className="text-left">
                      <p className="font-semibold text-foreground font-['Outfit']">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Economia estimada:</span>
                        <span className="text-primary font-semibold">- R$ {suggestion.savings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Novo total:</span>
                        <span className={cn(
                          "font-semibold font-['Outfit']",
                          suggestion.stillOver ? "text-[#eab308]" : "text-primary"
                        )}>
                          R$ {suggestion.newTotal.toLocaleString()}
                          {suggestion.stillOver && ` (ainda +R$ ${(suggestion.newTotal - userBudget).toLocaleString()})`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplySuggestion(suggestion.id)}
                      className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      Aplicar Redução
                    </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}

          {/* Strategy 2: Change Hotel */}
          {suggestions.filter(s => s.type === 'change_hotel').map(suggestion => (
            <Collapsible 
              key={suggestion.id}
              open={expandedSuggestion === suggestion.id}
              onOpenChange={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
            >
              <div className="border border-border rounded-xl overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Hotel size={20} className="text-primary" />
                    <div className="text-left">
                      <p className="font-semibold text-foreground font-['Outfit']">{suggestion.title}</p>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    {suggestion.details && (
                      <div className="bg-muted/30 rounded-lg p-3 mb-3 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Atual:</span>
                          <span className="text-foreground">{suggestion.details.from}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Alternativa:</span>
                          <span className="text-primary">{suggestion.details.to}</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Economia:</span>
                        <span className="text-primary font-semibold">R$ {suggestion.savings.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onApplySuggestion(suggestion.id)}
                      className="w-full py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      Ver Hotéis Alternativos
                    </button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}

          {/* Strategy 3: Auction Attack */}
          {suggestions.filter(s => s.type === 'auction_activities').map(suggestion => (
            <div key={suggestion.id} className="border border-[#eab308]/50 bg-[#eab308]/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-[#eab308]" />
                <span className="font-semibold text-[#eab308] font-['Outfit']">
                  🏷️ OPORTUNIDADES DE LEILÃO
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                {suggestion.details?.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-foreground font-medium">{idx + 1}. {item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Atual: R$ {item.currentCost} → Alvo: R$ {item.targetCost}
                        <span className="text-primary ml-1">(-R$ {item.currentCost - item.targetCost})</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onActivateAuction(item.name)}
                      className="px-3 py-1 bg-[#eab308]/20 text-[#eab308] rounded-lg text-xs font-medium hover:bg-[#eab308]/30 transition-colors"
                    >
                      Ativar Leilão
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Economia potencial:</span>
                  <span className="text-[#eab308] font-semibold">R$ {suggestion.savings.toLocaleString()}</span>
                </div>
                <p className="text-foreground text-xs mt-2 italic">
                  💡 "Se conseguirmos essas reduções via leilão, ficamos a R$ {Math.abs(suggestion.newTotal - userBudget).toLocaleString()} de fechar no budget!"
                </p>
              </div>
            </div>
          ))}

          {/* Strategy 4: Economic Version */}
          <div className="border-2 border-primary bg-primary/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 bg-primary/20 rounded-lg">
                <TrendingDown size={18} className="text-primary" />
              </div>
              <span className="font-semibold text-primary font-['Outfit']">
                💚 ROTEIRO 100% DENTRO DO BUDGET
              </span>
            </div>
            
            <p className="text-muted-foreground text-sm mb-3">
              O KINU pode gerar um roteiro alternativo com:
            </p>
            
            <ul className="space-y-1 mb-4 text-sm">
              <li className="flex items-center gap-2 text-foreground">
                <span className="text-primary">✓</span> Mesmo voo (custo fixo)
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <span className="text-primary">✓</span> Hotel 3★ bem avaliado
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <span className="text-primary">✓</span> Apenas atividades gratuitas
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <span className="text-primary">✓</span> Refeições em locais econômicos
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <span className="text-primary">✓</span> Transporte público
              </li>
            </ul>
            
            <div className="bg-muted/30 rounded-lg p-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo estimado:</span>
                <span className="text-primary font-bold font-['Outfit']">
                  R$ {Math.round(userBudget * 0.9).toLocaleString()} (dentro do budget!)
                </span>
              </div>
            </div>
            
            <button
              onClick={onGenerateEconomic}
              className="w-full py-3 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl font-semibold text-sm"
            >
              🌿 Gerar Opção Econômica
            </button>
          </div>
        </div>
      </div>

      {/* Brother's Message */}
      <div className="bg-muted/30 rounded-xl p-4 border-l-4 border-primary">
        <p className="text-foreground text-sm italic">
          💬 "Prefiro te mostrar isso agora do que você descobrir no extrato do cartão. 
          Vamos encontrar um caminho que funcione pro teu bolso. 
          Qual opção faz mais sentido pra ti?" 🌿
        </p>
      </div>
    </div>
  );
};

export default ReductionStrategyPanel;
