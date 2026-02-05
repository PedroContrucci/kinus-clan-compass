// BudgetStep — Step 3: Budget & Priorities with Trust Zone

import { useState, useEffect } from 'react';
import { Wallet, Plane, Building, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const BUDGET_PRESETS = [
  { id: 'economico', label: 'Econômico', icon: '💚', min: 5000, max: 50000, description: 'Hotéis 3★, voos econômicos' },
  { id: 'conforto', label: 'Conforto', icon: '✨', min: 50001, max: 100000, description: 'Hotéis 4★, experiências premium' },
  { id: 'elite', label: 'Elite', icon: '👑', min: 100001, max: 500000, description: 'Hotéis 5★, sem limites' },
];

const PRIORITY_OPTIONS: { id: 'flight' | 'accommodation' | 'experiences'; label: string; icon: React.ReactNode }[] = [
  { id: 'flight', label: 'Voo', icon: <Plane size={18} /> },
  { id: 'accommodation', label: 'Hospedagem', icon: <Building size={18} /> },
  { id: 'experiences', label: 'Experiências', icon: <Star size={18} /> },
];

interface BudgetStepProps {
  data: {
    total: number;
    priority: 'flight' | 'accommodation' | 'experiences';
  };
  budgetValidation?: {
    usagePercent: number;
    isWithin: boolean;
    insight?: { title: string; message: string; suggestion: string; severity: 'info' | 'warning' };
  };
  onChange: (data: Partial<BudgetStepProps['data']>) => void;
}

export const BudgetStep = ({ data, budgetValidation, onChange }: BudgetStepProps) => {
  const [manualInput, setManualInput] = useState(data.total.toString());

  useEffect(() => {
    setManualInput(data.total.toString());
  }, [data.total]);

  const handleManualChange = (value: string) => {
    setManualInput(value);
    const num = parseInt(value.replace(/\D/g, ''));
    if (!isNaN(num)) {
      onChange({ total: num });
    }
  };

  const handlePresetClick = (preset: typeof BUDGET_PRESETS[0]) => {
    const midValue = Math.round((preset.min + preset.max) / 2);
    onChange({ total: midValue });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR');
  };

  const usagePercent = budgetValidation?.usagePercent ?? 0;
  const isWithin = budgetValidation?.isWithin ?? true;

  return (
    <div className="space-y-6">
      {/* Budget Input */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <Wallet size={16} className="inline mr-2" />
          Budget Total
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => handleManualChange(e.target.value)}
            className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-12 pr-4 py-4 text-2xl font-bold text-foreground font-['Outfit'] focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="0"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-3">
        {BUDGET_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            className={`p-3 rounded-xl border transition-all ${
              data.total >= preset.min && data.total <= preset.max
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-[#1E293B] border-[#334155] text-muted-foreground hover:border-emerald-500/30'
            }`}
          >
            <span className="text-2xl block mb-1">{preset.icon}</span>
            <span className="text-sm font-medium">{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-3">
          Onde investir mais?
        </label>
        <div className="flex gap-3">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onChange({ priority: option.id })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                data.priority === option.id
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-[#1E293B] border-[#334155] text-muted-foreground hover:border-emerald-500/30'
              }`}
            >
              {option.icon}
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trust Zone Visualization */}
      {data.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Trust Zone</span>
            <span className={`text-sm font-bold ${isWithin ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Math.round(usagePercent * 100)}% alocado
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-[#334155] rounded-full overflow-hidden mb-2">
            {/* Trust Zone markers */}
            <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-emerald-500/50" />
            <div className="absolute left-[100%] top-0 bottom-0 w-0.5 bg-amber-500/50 -ml-0.5" />
            
            {/* Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercent * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                isWithin
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : usagePercent < 0.8
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Meta: 80-100%</span>
            <span>R$ {formatCurrency(data.total)}</span>
          </div>

          {/* Insight */}
          {budgetValidation?.insight && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 flex items-start gap-3 p-3 rounded-xl ${
                budgetValidation.insight.severity === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              {budgetValidation.insight.severity === 'warning' ? (
                <AlertCircle size={18} className="text-amber-400 mt-0.5" />
              ) : (
                <CheckCircle size={18} className="text-emerald-400 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  budgetValidation.insight.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {budgetValidation.insight.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetValidation.insight.suggestion}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BudgetStep;
