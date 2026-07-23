// KinuAnalysisCard — AI analysis explaining itinerary choices
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TRAVEL_INTERESTS } from '@/components/wizard/types';

interface KinuAnalysisCardProps {
  destination: string;
  departureDate: Date;
  returnDate: Date;
  budget: number;
  flightsCost: number;
  hotelCost: number;
  toursCost: number;
  foodCost: number;
  travelInterests?: string[];
  michelinCount?: number;
  jetLagSeverity?: string;
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
  toursCost,
  foodCost,
  travelInterests = [],
  michelinCount = 0,
  jetLagSeverity,
}: KinuAnalysisCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const analysis = useMemo<AnalysisSection[]>(() => {
    const totalDays = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalEstimated = flightsCost + hotelCost + toursCost + foodCost;
    const remainingBudget = Math.max(0, budget - totalEstimated);
    const dailyBudget = Math.round(remainingBudget / totalDays);
    const isOverBudget = totalEstimated > budget;

    const sections: AnalysisSection[] = [
      {
        icon: <TrendingUp size={16} className="text-emerald-400" />,
        title: isOverBudget ? 'Orçamento Insuficiente' : 'Otimização Financeira',
        content: isOverBudget
          ? `O total estimado (R$ ${totalEstimated.toLocaleString('pt-BR')}) ultrapassa seu budget (R$ ${budget.toLocaleString('pt-BR')}). Considere aumentar o orçamento, reduzir dias ou escolher um destino mais próximo.`
          : `Com R$ ${dailyBudget}/dia para experiências, priorizei atividades gratuitas pela manhã e experiências pagas à tarde.`,
      },
      {
        icon: <Brain size={16} className="text-primary" />,
        title: 'Distribuição Inteligente',
        content: `Cada dia tem 5-6 atividades balanceadas: café, cultura, almoço, passeio, jantar. Ritmo confortável sem correria.`,
      },
      {
        icon: <Shield size={16} className="text-amber-400" />,
        title: isOverBudget ? 'Sem Folga no Orçamento' : 'Reserva de Segurança',
        content: isOverBudget
          ? 'O plano já excede o budget — considere uma reserva à parte para imprevistos.'
          : `Guardei 15% do budget disponível para emergências e oportunidades de última hora.`,
      },
    ];

    const hasInterests = travelInterests.length > 0;
    const hasMichelin = michelinCount > 0;
    const severeJetLag = /^(alto|severo)$/i.test(jetLagSeverity || '');

    if (hasInterests || hasMichelin || severeJetLag) {
      const clauses: string[] = [];
      if (hasInterests) {
        clauses.push(`Roteiro calibrado para: ${travelInterests.join(', ')}, com atividades do catálogo curado KINU.`);
      }
      if (hasMichelin) {
        clauses.push(`Inclui ${michelinCount} jantar com estrela Michelin.`);
      }
      if (severeJetLag) {
        clauses.push(`Primeiro dia em ritmo leve para recuperar o fuso (Biology AI).`);
      }
      sections.push({
        icon: <Sparkles size={16} className="text-sky-400" />,
        title: 'Feito Para Vocês',
        content: clauses.join(' '),
      });
    }

    return sections;
  }, [destination, departureDate, returnDate, budget, flightsCost, hotelCost, toursCost, foodCost, travelInterests, michelinCount, jetLagSeverity]);

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
            {analysis.map((section, index) => (
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
            ))}

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
