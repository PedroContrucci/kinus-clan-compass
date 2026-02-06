// NewPlanningWizard — 4-step planning wizard orchestrator

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WizardStep1Logistics } from './WizardStep1Logistics';
import { WizardStep2Travelers } from './WizardStep2Travelers';
import { WizardStep3Budget } from './WizardStep3Budget';
import { WizardStep4Summary } from './WizardStep4Summary';
import type { WizardData } from './types';
import kinuLogo from '@/assets/KINU_logo.png';

const STEPS = [
  { id: 1, title: 'Logística', description: 'Origem, destino e datas' },
  { id: 2, title: 'Viajantes', description: 'Perfil do clã' },
  { id: 3, title: 'Budget', description: 'Orçamento e prioridades' },
  { id: 4, title: 'Resumo', description: 'Revisão e confirmação' },
];

const initialData: WizardData = {
  // Step 1
  originCity: 'São Paulo',
  originCityId: null,
  originAirportCode: 'GRU',
  destinationCity: '',
  destinationCityId: null,
  destinationAirportCode: '',
  destinationTimezone: null,
  departureDate: undefined,
  returnDate: undefined,
  hasDirectFlight: false,
  connections: [],
  estimatedFlightDuration: null,
  averageFlightPrice: null,
  
  // Step 2
  adults: 2,
  children: [],
  infants: 0,
  
  // Step 3
  budgetAmount: 0,
  budgetCurrency: 'BRL',
  priorities: ['flights', 'accommodation', 'experiences'],
  travelStyle: 'comfort',
  travelInterests: [],
  
  // Step 4
  biologyAIEnabled: false,
  
  // Computed
  totalDays: 0,
  totalNights: 0,
};

interface NewPlanningWizardProps {
  onComplete?: (data: WizardData) => void;
  onCancel?: () => void;
}

export const NewPlanningWizard = ({ onComplete, onCancel }: NewPlanningWizardProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return data.originCity && data.destinationCity && data.departureDate && data.returnDate;
      case 2:
        return data.adults > 0;
      case 3:
        return data.budgetAmount > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard');
    }
  };

  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    
    try {
      // Save to localStorage for now (would be Supabase in production)
      const tripId = `trip-${Date.now()}`;
      const trip = {
        id: tripId,
        status: 'draft',
        destination: data.destinationCity,
        origin: data.originCity,
        emoji: getDestinationEmoji(data.destinationCity),
        country: '',
        startDate: data.departureDate?.toISOString(),
        endDate: data.returnDate?.toISOString(),
        budget: data.budgetAmount,
        budgetType: data.travelStyle,
        travelers: data.adults + data.children.length + data.infants,
        adults: data.adults,
        children: data.children,
        infants: data.infants,
        priorities: data.priorities,
        hasDirectFlight: data.hasDirectFlight,
        connections: data.connections,
        totalDays: data.totalDays,
        totalNights: data.totalNights,
        progress: 0,
        finances: {
          total: data.budgetAmount,
          confirmed: 0,
          planned: 0,
          available: data.budgetAmount,
        },
        createdAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save to localStorage
      const existingTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
      existingTrips.push(trip);
      localStorage.setItem('kinu_trips', JSON.stringify(existingTrips));

      toast({
        title: "Rascunho criado! 🌿",
        description: "Seu roteiro está pronto para edição.",
      });

      if (onComplete) {
        onComplete(data);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({
        title: "Erro ao gerar rascunho",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
          <img src={kinuLogo} alt="KINU" className="w-8 h-8" />
          <div className="flex-1">
            <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
              Novo Planejamento
            </h1>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de 4 — {STEPS[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mt-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step.id <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <WizardStep1Logistics data={data} onChange={handleChange} />
            )}
            {currentStep === 2 && (
              <WizardStep2Travelers data={data} onChange={handleChange} />
            )}
            {currentStep === 3 && (
              <WizardStep3Budget data={data} onChange={handleChange} />
            )}
            {currentStep === 4 && (
              <WizardStep4Summary 
                data={data} 
                onChange={handleChange}
                onGenerateDraft={handleGenerateDraft}
                isGenerating={isGenerating}
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
          onClick={currentStep === 4 ? handleGenerateDraft : handleNext}
          disabled={!canProceed() || isGenerating}
          className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="font-['Outfit'] text-lg">Gerando...</span>
            </>
          ) : currentStep === 4 ? (
            <>
              <Sparkles size={20} />
              <span className="font-['Outfit'] text-lg">Gerar Rascunho</span>
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

// Helper function
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯',
    'Paris': '🗼',
    'Roma': '🏛️',
    'Lisboa': '🚃',
    'Bangkok': '🛕',
    'Barcelona': '🏖️',
    'Nova York': '🗽',
    'Londres': '🎡',
  };
  return emojiMap[destination] || '✈️';
}

export default NewPlanningWizard;
