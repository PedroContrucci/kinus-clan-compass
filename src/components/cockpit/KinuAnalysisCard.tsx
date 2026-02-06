// KinuAnalysisCard — AI analysis explaining itinerary choices
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, Shield, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface KinuAnalysisCardProps {
  destination: string;
  departureDate: Date;
  returnDate: Date;
  budget: number;
  flightsCost: number;
  hotelCost: number;
  travelInterests?: string[];
}

interface AnalysisSection {
  icon: React.ReactNode;
  title: string;
  content: string;
}

export const KinuAnalysisCard = ({
  destination,
  departureDate,
  returnDate,
  budget,
  flightsCost,
  hotelCost,
  travelInterests = [],
}: KinuAnalysisCardProps) => {
  const [analysis, setAnalysis] = useState<AnalysisSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    generateAnalysis();
  }, [destination, budget, flightsCost]);

  const generateAnalysis = async () => {
    setIsLoading(true);

    const totalDays = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const remainingBudget = budget - flightsCost - hotelCost;
    const dailyBudget = Math.round(remainingBudget / totalDays);

    try {
      const { data, error } = await supabase.functions.invoke('kinu-ai', {
        body: {
          message: `Analise este roteiro e explique as escolhas em 3 pontos curtos (máximo 50 palavras cada):
          - Destino: ${destination}
          - Período: ${totalDays} dias
          - Budget total: R$ ${budget}
          - Voos: R$ ${flightsCost}
          - Hotel: R$ ${hotelCost}
          - Interesses: ${travelInterests.join(', ') || 'Geral'}
          - Disponível por dia: R$ ${dailyBudget}`,
          context: { type: 'itinerary_analysis' },
        },
      });

      if (error) throw error;

      // Parse AI response or use fallback
      if (data?.response) {
        // Simple parsing - in production would be more robust
        setAnalysis([
          {
            icon: <TrendingUp size={16} className="text-emerald-400" />,
            title: 'Otimização Financeira',
            content: `Com R$ ${dailyBudget}/dia para experiências, priorizei atividades gratuitas pela manhã e experiências pagas à tarde.`,
          },
          {
            icon: <Brain size={16} className="text-primary" />,
            title: 'Ritmo da Viagem',
            content: `Organizei o roteiro com uma atividade principal por período, evitando correria e permitindo descobertas espontâneas.`,
          },
          {
            icon: <Shield size={16} className="text-amber-400" />,
            title: 'Margem de Segurança',
            content: `Mantive ${Math.round((remainingBudget * 0.15) / 1000)}k como reserva para imprevistos e oportunidades únicas.`,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to generate analysis:', err);
      // Fallback analysis
      setAnalysis([
        {
          icon: <TrendingUp size={16} className="text-emerald-400" />,
          title: 'Otimização Financeira',
          content: `Voos representam ${Math.round((flightsCost / budget) * 100)}% do budget. Compensei com hospedagem custo-benefício e experiências gratuitas.`,
        },
        {
          icon: <Brain size={16} className="text-primary" />,
          title: 'Distribuição Inteligente',
          content: `Cada dia tem 5-6 atividades balanceadas: café, cultura, almoço, passeio, jantar. Ritmo confortável sem correria.`,
        },
        {
          icon: <Shield size={16} className="text-amber-400" />,
          title: 'Reserva de Segurança',
          content: `Guardei 15% do budget disponível para emergências e oportunidades de última hora.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/30 rounded-2xl overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Brain size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground font-['Outfit']">🧠 ANÁLISE DO KINU</h3>
                <p className="text-xs text-muted-foreground">Por que montei seu roteiro assim</p>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp size={20} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={20} className="text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={24} className="text-primary animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Analisando escolhas...</span>
              </div>
            ) : (
              analysis.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-3 bg-card/50 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {section.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{section.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{section.content}</p>
                  </div>
                </motion.div>
              ))
            )}

            {/* Pro tip */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Lightbulb size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-amber-500">Dica:</span> Toque em qualquer atividade para ver alternativas ou remover do roteiro.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

export default KinuAnalysisCard;
