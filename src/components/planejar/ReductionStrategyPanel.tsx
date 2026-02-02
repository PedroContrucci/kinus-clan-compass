import { useState } from 'react';
import { AlertTriangle, TrendingDown, Calendar, Hotel, Plane, Tag, Utensils, Car, ChevronDown, Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

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

interface BudgetVillain {
  id: string;
  rank: number;
  type: 'flight' | 'hotel' | 'activity' | 'food';
  name: string;
  cost: number;
  percent: number;
  potentialSaving: number;
  canAuction: boolean;
  details?: string;
}

interface ReductionStrategyPanelProps {
  userBudget: number;
  totalCost: number;
  breakdown: SpendingBreakdown;
  suggestions: ReductionSuggestion[];
  destination: string;
  days: number;
  villains?: BudgetVillain[];
  onApplySuggestion: (suggestionId: string) => void;
  onGenerateEconomic: () => void;
  onActivateAuction: (activityName: string, targetPrice?: number) => void;
  isGeneratingEconomic?: boolean;
}

export const ReductionStrategyPanel = ({
  userBudget,
  totalCost,
  breakdown,
  suggestions,
  destination,
  days,
  villains = [],
  onApplySuggestion,
  onGenerateEconomic,
  onActivateAuction,
  isGeneratingEconomic = false,
}: ReductionStrategyPanelProps) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [auctionStates, setAuctionStates] = useState<Record<string, { isOpen: boolean; targetPrice: number; isSearching: boolean }>>({});
  
  const overflow = totalCost - userBudget;
  const overflowPercent = Math.round((overflow / userBudget) * 100);
  
  // Find the villain (highest spending category from breakdown)
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

  const getVillainIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane size={18} className="text-muted-foreground" />;
      case 'hotel': return <Hotel size={18} className="text-muted-foreground" />;
      case 'activity': return <Tag size={18} className="text-muted-foreground" />;
      case 'food': return <Utensils size={18} className="text-muted-foreground" />;
      default: return null;
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy size={20} className="text-[#eab308]" />;
      case 2: return <Medal size={20} className="text-[#94a3b8]" />;
      case 3: return <Award size={20} className="text-[#cd7f32]" />;
      default: return null;
    }
  };

  const toggleVillainAuction = (villainId: string, currentCost: number) => {
    setAuctionStates(prev => ({
      ...prev,
      [villainId]: prev[villainId]?.isOpen 
        ? { ...prev[villainId], isOpen: false }
        : { isOpen: true, targetPrice: Math.round(currentCost * 0.75), isSearching: false }
    }));
  };

  const handleVillainAuctionSearch = (villainId: string, villainName: string) => {
    const state = auctionStates[villainId];
    if (!state) return;
    
    setAuctionStates(prev => ({
      ...prev,
      [villainId]: { ...prev[villainId], isSearching: true }
    }));
    
    // Simulate search and trigger auction
    setTimeout(() => {
      onActivateAuction(villainName, state.targetPrice);
      setAuctionStates(prev => ({
        ...prev,
        [villainId]: { ...prev[villainId], isSearching: false, isOpen: false }
      }));
    }, 1000);
  };

  // Calculate total potential savings from villains
  const totalPotentialSavings = villains.reduce((sum, v) => sum + v.potentialSaving, 0);

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
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-background rounded-lg p-3 text-center">
            <span className="text-xs text-muted-foreground block mb-1">Seu Budget</span>
            <span className="text-foreground font-bold font-['Outfit'] text-lg">
              R$ {userBudget.toLocaleString()}
            </span>
          </div>
          <div className="bg-background rounded-lg p-3 text-center border border-destructive/30">
            <span className="text-xs text-muted-foreground block mb-1">Custo Gerado</span>
            <span className="text-destructive font-bold font-['Outfit'] text-lg">
              R$ {totalCost.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#eab308]/10 rounded-lg p-3 text-center border border-[#eab308]/30">
            <span className="text-xs text-muted-foreground block mb-1">Excesso</span>
            <span className="text-[#eab308] font-bold font-['Outfit'] text-lg">
              +{overflowPercent}%
            </span>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Precisamos economizar <span className="text-[#eab308] font-semibold">R$ {overflow.toLocaleString()}</span> para caber no budget
        </div>
      </div>

      {/* Top 3 Villains Section */}
      {villains.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-foreground font-['Outfit'] mb-4 flex items-center gap-2">
            🎯 MAIORES VILÕES DO ORÇAMENTO
          </h3>
          
          <div className="space-y-3">
            {villains.map((villain) => {
              const auctionState = auctionStates[villain.id];
              
              return (
                <div 
                  key={villain.id}
                  className={cn(
                    "rounded-xl p-4 border transition-all",
                    villain.rank === 1 
                      ? "bg-[#eab308]/10 border-[#eab308]" 
                      : "bg-muted/30 border-border"
                  )}
                >
                  {/* Villain Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(villain.rank)}
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded",
                        villain.rank === 1 ? "bg-[#eab308]/20 text-[#eab308]" : "bg-muted text-muted-foreground"
                      )}>
                        #{villain.rank} VILÃO
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {villain.percent}% do total
                    </span>
                  </div>
                  
                  {/* Villain Info */}
                  <div className="flex items-center gap-2 mb-2">
                    {getVillainIcon(villain.type)}
                    <span className="text-foreground font-medium">{villain.name}</span>
                  </div>
                  
                  {/* Cost and Details */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-foreground font-bold font-['Outfit'] text-lg">
                      R$ {villain.cost.toLocaleString()}
                    </span>
                    {villain.details && (
                      <span className="text-xs text-muted-foreground">{villain.details}</span>
                    )}
                  </div>
                  
                  {/* Potential Saving */}
                  <p className="text-sm text-primary mb-3">
                    💡 Economia potencial: ~R$ {villain.potentialSaving.toLocaleString()}
                  </p>
                  
                  {/* Auction Panel (inline) */}
                  {auctionState?.isOpen ? (
                    <div className="bg-[#eab308]/5 border border-[#eab308]/50 rounded-lg p-4 mt-3">
                      <h4 className="text-sm font-semibold text-[#eab308] mb-3 flex items-center gap-2">
                        🏷️ Leilão Reverso
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor atual:</span>
                          <span className="text-foreground font-['Outfit']">R$ {villain.cost.toLocaleString()}</span>
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Seu preço alvo:</label>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">R$</span>
                            <Input
                              type="number"
                              value={auctionState.targetPrice}
                              onChange={(e) => setAuctionStates(prev => ({
                                ...prev,
                                [villain.id]: { ...prev[villain.id], targetPrice: Number(e.target.value) }
                              }))}
                              className="w-32 bg-background"
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-primary">
                          Se conseguir: Economia de R$ {(villain.cost - auctionState.targetPrice).toLocaleString()}
                        </p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVillainAuctionSearch(villain.id, villain.name)}
                            disabled={auctionState.isSearching}
                            className="flex-1 py-2 bg-[#eab308] text-background rounded-lg text-sm font-semibold hover:bg-[#eab308]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {auctionState.isSearching ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              '🔍 Buscar Ofertas'
                            )}
                          </button>
                          <button
                            onClick={() => toggleVillainAuction(villain.id, villain.cost)}
                            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    villain.canAuction && (
                      <button
                        onClick={() => toggleVillainAuction(villain.id, villain.cost)}
                        className="w-full py-2 bg-[#eab308]/20 text-[#eab308] rounded-lg text-sm font-medium hover:bg-[#eab308]/30 transition-colors"
                      >
                        🏷️ Ativar Leilão
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Potential savings summary */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-foreground text-center italic">
              💡 "Se conseguirmos ~25% de desconto nesses {villains.length} itens, 
              economizamos <span className="text-primary font-semibold">R$ {totalPotentialSavings.toLocaleString()}</span> 
              {totalPotentialSavings >= overflow 
                ? ' e entramos no budget!'
                : ` (faltam R$ ${Math.max(0, overflow - totalPotentialSavings).toLocaleString()})`
              }" 🌿
            </p>
          </div>
        </div>
      )}

      {/* Spending Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-foreground font-['Outfit'] mb-3 flex items-center gap-2">
          🔍 ONDE O DINHEIRO ESTÁ INDO:
        </h3>
        
        {/* Villain Highlight */}
        <div className="bg-[#eab308]/10 border-l-4 border-[#eab308] rounded-r-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#eab308] font-bold text-sm">🔴 CATEGORIA #1: {getCategoryLabel(villain.key)}</span>
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
          🛠️ OPÇÕES PARA RESOLVER
        </h3>
        
        <div className="space-y-4">
          {/* Strategy 4: Economic Version - PRIORITY */}
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
                  R$ {Math.round(userBudget * 0.85).toLocaleString()} (dentro do budget!)
                </span>
              </div>
            </div>
            
            <button
              onClick={onGenerateEconomic}
              disabled={isGeneratingEconomic}
              className="w-full py-3 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGeneratingEconomic ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando roteiro econômico...
                </>
              ) : (
                '🌿 Gerar Opção Econômica'
              )}
            </button>
          </div>

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
