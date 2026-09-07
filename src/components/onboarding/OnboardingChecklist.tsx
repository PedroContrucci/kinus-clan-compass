// OnboardingChecklist — 3 passos, marcados por estado REAL das viagens.
// Some para sempre depois da primeira ativação (persistido em preferences).

import { motion } from 'framer-motion';
import { Check, X, ArrowRight } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  onClick: () => void;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  onDismiss: () => void;
}

export const OnboardingChecklist = ({ steps, onDismiss }: OnboardingChecklistProps) => {
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground font-['Outfit']">
          Sua primeira viagem · {doneCount}/{steps.length}
        </h3>
        <button
          onClick={onDismiss}
          aria-label="Dispensar"
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1">
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={step.onClick}
            className="w-full flex items-center gap-3 py-2 px-2 rounded-lg text-left hover:bg-muted/50 transition-colors group"
          >
            <span
              className={
                step.done
                  ? 'w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0'
                  : 'w-6 h-6 rounded-full border border-border text-muted-foreground text-xs flex items-center justify-center shrink-0'
              }
            >
              {step.done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={
                step.done
                  ? 'flex-1 text-sm text-muted-foreground line-through'
                  : 'flex-1 text-sm text-foreground'
              }
            >
              {step.label}
            </span>
            <ArrowRight
              size={16}
              className="text-muted-foreground/50 group-hover:text-emerald-400 transition-colors"
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default OnboardingChecklist;
