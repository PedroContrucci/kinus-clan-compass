// WizardStep3Budget — Budget Amount, Priorities, Travel Interests & Style

import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Wallet, GripVertical, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardData, TravelInterest } from './types';
import { TRAVEL_STYLES, PRIORITY_OPTIONS, TRAVEL_INTERESTS } from './types';

interface WizardStep3Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WizardStep3Budget = ({ data, onChange }: WizardStep3Props) => {
  const [budgetInput, setBudgetInput] = useState(
    data.budgetAmount > 0 ? data.budgetAmount.toLocaleString('pt-BR') : ''
  );

  const handleBudgetChange = (value: string) => {
    // Remove non-numeric characters except dots and commas
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleaned.replace(/\./g, '')) || 0;
    
    setBudgetInput(value);
    onChange({ budgetAmount: numericValue });
  };

  const handleBudgetBlur = () => {
    if (data.budgetAmount > 0) {
      setBudgetInput(data.budgetAmount.toLocaleString('pt-BR'));
    }
  };

  const handlePriorityReorder = (newOrder: string[]) => {
    onChange({ priorities: newOrder as WizardData['priorities'] });
  };

  const handleStyleSelect = (style: WizardData['travelStyle']) => {
    onChange({ travelStyle: style });
  };

  const handleInterestToggle = (interest: TravelInterest) => {
    const current = data.travelInterests || [];
    if (current.includes(interest)) {
      onChange({ travelInterests: current.filter(i => i !== interest) });
    } else if (current.length < 3) {
      onChange({ travelInterests: [...current, interest] });
    }
  };

  // Get priority explanation based on first priority
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

      {/* Budget Input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          💰 Qual seu orçamento total?
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            R$
          </span>
          <input
            type="text"
            value={budgetInput}
            onChange={(e) => handleBudgetChange(e.target.value)}
            onBlur={handleBudgetBlur}
            placeholder="15.000"
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground text-xl font-bold font-['Outfit'] placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Priority Ordering */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          🎯 Onde você quer investir mais?
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Arraste para ordenar por prioridade (1º = 45%, 2º = 35%, 3º = 20%)
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
                  className={cn(
                    'flex items-center gap-3 p-4 bg-card border rounded-xl transition-colors',
                    index === 0 ? 'border-primary bg-primary/5' : 'border-border'
                  )}
                >
                  <GripVertical size={18} className="text-muted-foreground" />
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    index === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
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

      {/* Travel Style */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          🏨 Nível de conforto
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          {TRAVEL_STYLES.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStyleSelect(style.id as WizardData['travelStyle'])}
              className={cn(
                'relative p-4 rounded-xl border text-left transition-all',
                data.travelStyle === style.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              {data.travelStyle === style.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <span className="text-2xl mb-2 block">{style.icon}</span>
              <p className="font-medium text-foreground">{style.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WizardStep3Budget;