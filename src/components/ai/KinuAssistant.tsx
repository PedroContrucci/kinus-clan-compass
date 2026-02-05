// KinuAssistant — Floating AI assistant with contextual insights

import { useState, useEffect } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KinuInsight {
  id: string;
  trigger: 'destination_season' | 'budget_alert' | 'weather_warning' | 'emergency' | 'optimization';
  title: string;
  message: string;
  actions?: { label: string; action: () => void }[];
  priority: 'low' | 'medium' | 'high';
  dismissable: boolean;
}

interface KinuAssistantProps {
  insights?: KinuInsight[];
  destination?: string;
  departureDate?: Date;
  budget?: { total: number; used: number };
}

// Example insights generator
const generateInsights = (
  destination?: string,
  departureDate?: Date,
  budget?: { total: number; used: number }
): KinuInsight[] => {
  const insights: KinuInsight[] = [];

  // Seasonal insights
  if (destination === 'Tóquio' && departureDate) {
    const month = departureDate.getMonth();
    if (month >= 2 && month <= 4) {
      insights.push({
        id: 'sakura-season',
        trigger: 'destination_season',
        title: 'Época de Sakura 🌸',
        message: 'Você vai pegar a florada das cerejeiras! Hotéis lotam rápido nessa época. Quer que eu priorize a reserva de hospedagem?',
        actions: [
          { label: 'Sim, priorizar', action: () => {} },
          { label: 'Agora não', action: () => {} },
        ],
        priority: 'high',
        dismissable: true,
      });
    }
    if (month >= 8 && month <= 9) {
      insights.push({
        id: 'typhoon-warning',
        trigger: 'weather_warning',
        title: 'Temporada de Tufões ⚠️',
        message: 'Setembro é época de tufões no Japão. Considere contratar um seguro viagem com cobertura de cancelamento.',
        priority: 'medium',
        dismissable: true,
      });
    }
  }

  // Budget insights
  if (budget && budget.used / budget.total < 0.7) {
    insights.push({
      id: 'budget-margin',
      trigger: 'budget_alert',
      title: 'Margem disponível 💰',
      message: `Você tem ${Math.round((1 - budget.used / budget.total) * 100)}% do budget disponível. Que tal adicionar uma experiência premium?`,
      priority: 'low',
      dismissable: true,
    });
  }

  return insights;
};

export const KinuAssistant = ({ insights: propInsights, destination, departureDate, budget }: KinuAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<KinuInsight | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = propInsights || generateInsights(destination, departureDate, budget);
  const activeInsights = insights.filter((i) => !dismissed.has(i.id));
  const hasNewInsights = activeInsights.length > 0;

  useEffect(() => {
    if (hasNewInsights && !currentInsight) {
      // Auto-show first high priority insight
      const highPriority = activeInsights.find((i) => i.priority === 'high');
      if (highPriority) {
        setCurrentInsight(highPriority);
        setIsOpen(true);
      }
    }
  }, [activeInsights, hasNewInsights, currentInsight]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    setCurrentInsight(null);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (activeInsights.length > 0) {
      setCurrentInsight(activeInsights[0]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center"
      >
        <MessageCircle size={24} className="text-white" />
        
        {/* Notification Badge */}
        {hasNewInsights && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-[#0f172a] flex items-center justify-center"
          >
            {activeInsights.length}
          </motion.span>
        )}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-sm bg-[#1E293B] border border-[#334155] rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                <span className="font-semibold text-foreground font-['Outfit']">KINU diz:</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#334155] rounded-lg transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {currentInsight ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={currentInsight.id}
                >
                  <h3 className="font-medium text-foreground mb-2">{currentInsight.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{currentInsight.message}</p>

                  {currentInsight.actions && (
                    <div className="flex gap-3">
                      {currentInsight.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            action.action();
                            handleDismiss(currentInsight.id);
                          }}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                            idx === 0
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-[#334155] text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentInsight.dismissable && !currentInsight.actions && (
                    <button
                      onClick={() => handleDismiss(currentInsight.id)}
                      className="w-full py-2 rounded-xl bg-[#334155] text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
                    >
                      Entendi
                    </button>
                  )}
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum insight no momento. Continue planejando! ✨
                </p>
              )}
            </div>

            {/* Footer with insight count */}
            {activeInsights.length > 1 && currentInsight && (
              <div className="px-4 pb-4">
                <div className="flex justify-center gap-1">
                  {activeInsights.map((insight, idx) => (
                    <button
                      key={insight.id}
                      onClick={() => setCurrentInsight(insight)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        insight.id === currentInsight.id ? 'bg-emerald-400' : 'bg-[#334155]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KinuAssistant;
