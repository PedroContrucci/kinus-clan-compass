// WizardStep2Travelers — Clan Profile (Adults, Children, Infants)

import { motion } from 'framer-motion';
import { Users, Minus, Plus, Info, Baby, User, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardData, WizardTraveler } from './types';

interface WizardStep2Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WizardStep2Travelers = ({ data, onChange }: WizardStep2Props) => {
  const handleAdultsChange = (delta: number) => {
    const newValue = Math.max(1, Math.min(10, data.adults + delta));
    onChange({ adults: newValue });
  };

  const handleChildrenChange = (delta: number) => {
    const currentCount = data.children.length;
    const newCount = Math.max(0, Math.min(6, currentCount + delta));
    
    if (newCount > currentCount) {
      // Add a child
      const newChild: WizardTraveler = {
        id: `child-${Date.now()}`,
        type: 'child',
        age: 5,
      };
      onChange({ children: [...data.children, newChild] });
    } else if (newCount < currentCount) {
      // Remove last child
      onChange({ children: data.children.slice(0, -1) });
    }
  };

  const handleInfantsChange = (delta: number) => {
    const newValue = Math.max(0, Math.min(data.adults, data.infants + delta));
    onChange({ infants: newValue });
  };

  const handleChildAgeChange = (childId: string, age: number) => {
    const updatedChildren = data.children.map(child =>
      child.id === childId ? { ...child, age } : child
    );
    onChange({ children: updatedChildren });
  };

  const totalTravelers = data.adults + data.children.length + data.infants;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-['Outfit']">
          Quem vai nessa aventura?
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure o perfil do seu clã
        </p>
      </div>

      {/* Adults Counter */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <UserCheck size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Adultos</p>
              <p className="text-sm text-muted-foreground">12+ anos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAdultsChange(-1)}
              disabled={data.adults <= 1}
              className="w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Minus size={18} className="text-foreground" />
            </motion.button>
            
            <span className="w-8 text-center text-xl font-bold text-foreground font-['Outfit']">
              {data.adults}
            </span>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAdultsChange(1)}
              disabled={data.adults >= 10}
              className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Plus size={18} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Children Counter */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <User size={24} className="text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Crianças</p>
              <p className="text-sm text-muted-foreground">2-11 anos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleChildrenChange(-1)}
              disabled={data.children.length <= 0}
              className="w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Minus size={18} className="text-foreground" />
            </motion.button>
            
            <span className="w-8 text-center text-xl font-bold text-foreground font-['Outfit']">
              {data.children.length}
            </span>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleChildrenChange(1)}
              disabled={data.children.length >= 6}
              className="w-10 h-10 bg-amber-500 hover:bg-amber-500/90 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Plus size={18} className="text-white" />
            </motion.button>
          </div>
        </div>

        {/* Children Age Selectors */}
        {data.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-border space-y-3"
          >
            {data.children.map((child, index) => (
              <div key={child.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👧</span>
                  <span className="text-sm font-medium text-foreground">Criança {index + 1}</span>
                </div>
                <Select
                  value={child.age?.toString() || '5'}
                  onValueChange={(value) => handleChildAgeChange(child.id, parseInt(value))}
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue placeholder="Idade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 2).map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} anos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Infants Counter */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <Baby size={24} className="text-pink-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Bebês</p>
              <p className="text-sm text-muted-foreground">0-1 ano</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleInfantsChange(-1)}
              disabled={data.infants <= 0}
              className="w-10 h-10 bg-muted hover:bg-muted/80 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Minus size={18} className="text-foreground" />
            </motion.button>
            
            <span className="w-8 text-center text-xl font-bold text-foreground font-['Outfit']">
              {data.infants}
            </span>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleInfantsChange(1)}
              disabled={data.infants >= data.adults}
              className="w-10 h-10 bg-pink-500 hover:bg-pink-500/90 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
            >
              <Plus size={18} className="text-white" />
            </motion.button>
          </div>
        </div>

        {/* Lap Infant Info */}
        {data.infants > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <Info size={16} className="text-pink-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-pink-600 dark:text-pink-400">
                Bebês até 2 anos viajam no colo sem custo adicional de passagem aérea.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Total de viajantes</p>
        <p className="text-2xl font-bold text-foreground font-['Outfit']">
          {totalTravelers} {totalTravelers === 1 ? 'pessoa' : 'pessoas'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.adults} adulto{data.adults > 1 ? 's' : ''}
          {data.children.length > 0 && ` • ${data.children.length} criança${data.children.length > 1 ? 's' : ''}`}
          {data.infants > 0 && ` • ${data.infants} bebê${data.infants > 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
};

export default WizardStep2Travelers;
