// WizardStep3Budget — Budget Tier Cards, Priorities, Travel Interests

import { useState, useMemo } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Wallet, GripVertical, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTripEstimate } from '@/lib/activityPricing';
import type { WizardData, TravelInterest } from './types';
import { BUDGET_TIERS, PRIORITY_OPTIONS, TRAVEL_INTERESTS } from './types';

interface WizardStep3Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WizardStep3Budget = ({ data, onChange }: WizardStep3Props) => {

  const [manualBudgetInput, setManualBudgetInput] = useState('');

  const handleTierSelect = (tierId: WizardData['budgetTier']) => {
    const tier = BUDGET_TIERS.find(t => t.id === tierId)!;
    const priceLevel = tier.priceLevel;
    const multiplier = tier.multiplier;
    
    const totalTravelers = data.adults + data.children.length + data.infants;
    const duration = data.totalDays || 7;
    const city = data.destinationCity || 'Roma';
    
    const estimate = calculateTripEstimate(city, duration, totalTravelers, priceLevel);
    const adjustedTotal = Math.round(estimate.total * multiplier);
    
    // Min/max range: -15% to +20%
    const min = Math.round(adjustedTotal * 0.85);
    const max = Math.round(adjustedTotal * 1.20);
    
    const updates: Partial<WizardData> = {
      budgetTier: tierId,
      budgetEstimateMin: min,
      budgetEstimateMax: max,
      travelStyle: tierId === 'backpacker' ? 'backpacker' : tierId === 'economic' ? 'economic' : tierId === 'comfort' ? 'comfort' : 'luxury',
    };
    
    if (!manualBudgetInput.trim()) {
      updates.budgetAmount = adjustedTotal;
    }
    
    onChange(updates);
  };

  const handlePriorityReorder = (newOrder: string[]) => {
    onChange({ priorities: newOrder as WizardData['priorities'] });
  };

  const handlePromotePriority = (priorityId: WizardData['priorities'][number]) => {
    const rest = data.priorities.filter((p) => p !== priorityId);
    onChange({ priorities: [priorityId, ...rest] as WizardData['priorities'] });
  };


  const handleInterestToggle = (interest: TravelInterest) => {
    const current = data.travelInterests || [];
    if (current.includes(interest)) {
      onChange({ travelInterests: current.filter(i => i !== interest) });
    } else if (current.length < 3) {
      onChange({ travelInterests: [...current, interest] });
    }
  };

  const handleManualBudgetChange = (value: string) => {
    setManualBudgetInput(value);
    const num = parseInt(value.replace(/\D/g, ''));
    if (!isNaN(num) && value.trim() !== '') {
      onChange({ budgetAmount: num });
    }
  };

  const getPriorityExplanation = () => {
    if (data.priorities.length === 0) return null;
    const first = data.priorities[0];
    switch (first) {
      case 'flights':
        return 'Buscaremos conexões mais rápidas e classes superiores quando possível. (45% do budget)';
      case 'accommodation':
        return 'Priorizaremos hotéis bem localizados e com melhor qualidade. (45% do budget)';
      case 'experiences':
        return 'Reservaremos mais budget para passeios e restaurantes incríveis. (45% do budget)';
      default:
        return null;
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-['Outfit']">
          Budget & Prioridades
        </h2>
      </div>

      {/* Travel Interests - Multi-select chips */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          🎨 Qual o estilo da sua viagem?
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Selecione até 3 interesses
        </p>
        
        <div className="flex flex-wrap gap-2">
          {TRAVEL_INTERESTS.map((interest) => {
            const isSelected = (data.travelInterests || []).includes(interest.id as TravelInterest);
            const isDisabled = !isSelected && (data.travelInterests || []).length >= 3;
            
            return (
              <motion.button
                key={interest.id}
                whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                onClick={() => !isDisabled && handleInterestToggle(interest.id as TravelInterest)}
                disabled={isDisabled}
                className={cn(
                  'px-3 py-2 rounded-full border text-sm flex items-center gap-1.5 transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isDisabled
                    ? 'bg-muted/30 text-muted-foreground border-muted cursor-not-allowed opacity-50'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                <span>{interest.icon}</span>
                <span>{interest.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Budget Tier Cards */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          💰 Qual sua faixa de orçamento?
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {BUDGET_TIERS.map((tier) => {
            const isSelected = data.budgetTier === tier.id;
            return (
              <motion.button
                key={tier.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTierSelect(tier.id)}
                className={cn(
                  'relative p-4 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:border-primary/50'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl mb-2 block">{tier.icon}</span>
                <p className="font-semibold text-foreground">{tier.label}</p>
                <p className="text-xs text-primary font-medium">{tier.subtitle}</p>
                <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Budget Estimate */}
      {data.budgetTier && data.destinationCity && data.budgetEstimateMin > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-xl"
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Estimativa para {data.destinationCity} ({data.totalNights || 6} noites, {data.adults + data.children.length} viajante{(data.adults + data.children.length) > 1 ? 's' : ''}):
              </p>
              <p className="text-lg font-bold text-primary font-['Outfit'] mt-1">
                R$ {formatBRL(data.budgetEstimateMin)} – R$ {formatBRL(data.budgetEstimateMax)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O KINU vai otimizar para o menor valor possível dentro desta faixa.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manual Budget Input */}
      {data.budgetTier && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Quanto você quer gastar? (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <input
              type="text"
              value={manualBudgetInput}
              onChange={(e) => handleManualBudgetChange(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-lg font-bold text-foreground font-['Outfit'] focus:outline-none focus:border-primary transition-colors"
              placeholder={data.budgetEstimateMin > 0 ? formatBRL(Math.round((data.budgetEstimateMin + data.budgetEstimateMax) / 2)) : '0'}
            />
          </div>

          {/* Reconciliation Message */}
          {manualBudgetInput.trim() !== '' && data.budgetEstimateMin > 0 && data.budgetEstimateMax > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl border border-border"
            >
              {(() => {
                const midpoint = Math.round((data.budgetEstimateMin + data.budgetEstimateMax) / 2);
                const typed = data.budgetAmount || 0;
                const diff = typed - midpoint;
                const percent = midpoint > 0 ? Math.round((typed / midpoint) * 100) : 0;

                if (typed >= midpoint) {
                  return (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <span>✅</span>
                      <span>Seu orçamento cobre este roteiro (sobra ~R$ {formatBRL(Math.abs(diff))}).</span>
                    </div>
                  );
                } else if (percent >= 90) {
                  return (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <span>⚠️</span>
                      <span>Está justo — seu orçamento cobre ~{percent}% da estimativa.</span>
                    </div>
                  );
                } else {
                  const currentTierIndex = BUDGET_TIERS.findIndex(t => t.id === data.budgetTier);
                  const nextLowerTier = currentTierIndex > 0 ? BUDGET_TIERS[currentTierIndex - 1] : null;
                  const belowPercent = midpoint > 0 ? Math.round(((midpoint - typed) / midpoint) * 100) : 0;
                  return (
                    <div className="flex items-start gap-2 text-red-400 text-sm">
                      <span>💡</span>
                      <span>
                        Sua estimativa para esta faixa é ~R$ {formatBRL(midpoint)}. Com R$ {formatBRL(typed)} você ficaria ~{belowPercent}% abaixo. Considere a faixa {nextLowerTier?.label || 'inferior'} ou ajustar as atividades.
                      </span>
                    </div>
                  );
                }
              })()}
            </motion.div>
          )}
        </div>
      )}

      {/* Priority Ordering */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          🎯 Onde você quer investir mais?
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Arraste para ordenar ou toque em uma opção para promovê-la ao topo (1º = 45%, 2º = 35%, 3º = 20%)
        </p>

        
        <Reorder.Group
          axis="y"
          values={data.priorities}
          onReorder={handlePriorityReorder}
          className="space-y-2"
        >
          {data.priorities.map((priorityId, index) => {
            const priority = PRIORITY_OPTIONS.find(p => p.id === priorityId);
            if (!priority) return null;
            
            const percentages = [45, 35, 20];
            
            return (
              <Reorder.Item
                key={priorityId}
                value={priorityId}
                className="cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handlePromotePriority(priorityId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePromotePriority(priorityId);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 p-4 bg-card border rounded-xl transition-colors cursor-pointer hover:border-primary/50',
                    index === 0 ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <GripVertical size={18} className="text-muted-foreground" />
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-xl">{priority.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{priority.label}</p>
                    <p className="text-xs text-muted-foreground">{priority.description}</p>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    index === 0 ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {percentages[index]}%
                  </span>
                </motion.div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>

        {/* Priority Explanation */}
        {getPriorityExplanation() && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-2"
          >
            <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary">{getPriorityExplanation()}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WizardStep3Budget;
