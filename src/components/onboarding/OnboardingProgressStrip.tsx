// OnboardingProgressStrip — versão magra do checklist: uma linha só.
// Mesma lógica de estado/persistência do card antigo, sem ocupar o painel.

import { motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import type { OnboardingStep } from './OnboardingChecklist';

interface OnboardingProgressStripProps {
  steps: OnboardingStep[];
  onDismiss: () => void;
}

export const OnboardingProgressStrip = ({ steps, onDismiss }: OnboardingProgressStripProps) => {
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2"
    >
      <button
        onClick={() => next?.onClick()}
        className="flex-1 flex items-center gap-2 min-w-0 text-left group"
      >
        <span className="text-[11px] font-semibold text-emerald-400 font-['Outfit'] shrink-0">
          {doneCount}/{steps.length}
        </span>
        <span className="text-[13px] text-foreground font-['Plus_Jakarta_Sans'] truncate">
          Sua primeira viagem
          {next && (
            <span className="text-muted-foreground"> · próximo: {next.label.toLowerCase()}</span>
          )}
        </span>
        <ChevronRight
          size={16}
          className="ml-auto shrink-0 text-muted-foreground group-hover:text-emerald-400 transition-colors"
        />
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dispensar"
        className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
      >
        <X size={14} className="text-muted-foreground" />
      </button>
    </motion.div>
  );
};

export default OnboardingProgressStrip;
