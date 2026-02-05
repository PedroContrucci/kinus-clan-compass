// PlanningWizard — 3-step wizard for trip planning

import { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogisticsStep } from './LogisticsStep';
import { ClanStep } from './ClanStep';
import { BudgetStep } from './BudgetStep';
import { calculateBudget } from '@/engines/budget/BudgetEngine';
import type { ClanMember } from '@/types/dashboard';
import type { PlanningInput } from '@/types/planning';

interface WizardData {
  origin: string;
  destination: string;
  departureDate: Date | undefined;
  returnDate: Date | undefined;
  clan: ClanMember[];
  budget: {
    total: number;
    priority: 'flight' | 'accommodation' | 'experiences';
  };
}

interface PlanningWizardProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Logística', description: 'Origem, destino e datas' },
  { id: 2, title: 'Clã', description: 'Quem vai viajar' },
  { id: 3, title: 'Budget', description: 'Orçamento e prioridades' },
];

export const PlanningWizard = ({ onComplete, onCancel }: PlanningWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    origin: 'São Paulo',
    destination: '',
    departureDate: undefined,
    returnDate: undefined,
    clan: [{ id: 'adult-1', name: 'Adulto 1', type: 'adult' }],
    budget: {
      total: 0,
      priority: 'experiences',
    },
  });

  // Calculate budget validation when on step 3
  const budgetValidation = useMemo(() => {
    if (currentStep !== 3 || !data.destination || !data.departureDate || !data.returnDate || data.budget.total <= 0) {
      return undefined;
    }

    const input: PlanningInput = {
      origin: data.origin,
      destination: data.destination,
      departureDate: data.departureDate,
      returnDate: data.returnDate,
      clan: data.clan,
      budget: {
        total: data.budget.total,
        currency: 'BRL',
        priority: data.budget.priority,
      },
    };

    const result = calculateBudget(input);
    return {
      usagePercent: result.usagePercent,
      isWithin: result.trustZone.isWithin,
      insight: result.insight,
    };
  }, [currentStep, data]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.origin && data.destination && data.departureDate && data.returnDate;
      case 2:
        return data.clan.length > 0;
      case 3:
        return data.budget.total > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
              Novo Planejamento
            </h1>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de 3 — {STEPS[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mt-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step.id <= currentStep ? 'bg-emerald-500' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <LogisticsStep
                data={{
                  origin: data.origin,
                  destination: data.destination,
                  departureDate: data.departureDate,
                  returnDate: data.returnDate,
                }}
                onChange={(updates) => setData((prev) => ({ ...prev, ...updates }))}
              />
            )}

            {currentStep === 2 && (
              <ClanStep
                clan={data.clan}
                onChange={(clan) => setData((prev) => ({ ...prev, clan }))}
              />
            )}

            {currentStep === 3 && (
              <BudgetStep
                data={data.budget}
                budgetValidation={budgetValidation}
                onChange={(updates) =>
                  setData((prev) => ({
                    ...prev,
                    budget: { ...prev.budget, ...updates },
                  }))
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-colors"
        >
          {currentStep === 3 ? (
            <>
              <Sparkles size={20} />
              <span className="font-['Outfit'] text-lg">Gerar Roteiro</span>
            </>
          ) : (
            <>
              <span className="font-['Outfit'] text-lg">Continuar</span>
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </footer>
    </div>
  );
};

export default PlanningWizard;
