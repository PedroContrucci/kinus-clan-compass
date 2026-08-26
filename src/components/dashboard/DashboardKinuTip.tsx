// DashboardKinuTip — AI-powered contextual tip for the dashboard
import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { kinuAuthHeaders } from '@/lib/kinuAuthHeader';

interface DashboardKinuTipProps {
  nextTrip?: {
    destination: string;
    startDate: string;
    budget: number;
  };
}

export const DashboardKinuTip = ({ nextTrip }: DashboardKinuTipProps) => {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTip = async () => {
    setIsLoading(true);
    
    try {
      const context = nextTrip 
        ? `Próxima viagem: ${nextTrip.destination} em ${new Date(nextTrip.startDate).toLocaleDateString('pt-BR')}. Budget: R$ ${nextTrip.budget.toLocaleString('pt-BR')}.`
        : 'Usuário ainda não tem viagens planejadas.';

      const { data, error } = await supabase.functions.invoke('kinu-ai', {
        // Arco 5.d: identidade em modo sombra. Anônimo devolve {} e nada muda.
        headers: await kinuAuthHeaders(),
        body: {
          message: 'Dê uma dica curta e útil de viagem (máximo 100 caracteres)',
          context: {
            type: 'dashboard_tip',
            tripInfo: context,
          },
        },
      });

      if (error) throw error;

      if (data?.response) {
        // Extract just the tip, limit length
        const tipText = data.response.slice(0, 120);
        setTip(tipText);
      }
    } catch (err) {
      console.error('Failed to fetch KINU tip:', err);
      // Fallback tips
      const fallbackTips = [
        'Dezembro é alta temporada no Japão. Reserve hotéis com 3 meses de antecedência!',
        'Viaje nas terças e quartas para economizar até 30% nos voos.',
        'Sempre tenha uma cópia digital dos documentos no celular.',
        'O seguro viagem é obrigatório para Europa. Não esqueça!',
        'Avise seu banco sobre a viagem para evitar bloqueio do cartão.',
      ];
      setTip(nextTrip 
        ? `Lembre-se de verificar a documentação para ${nextTrip.destination}!`
        : fallbackTips[Math.floor(Math.random() * fallbackTips.length)]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, [nextTrip?.destination]);

  if (!tip && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
          {isLoading ? (
            <Loader2 size={20} className="text-primary animate-spin" />
          ) : (
            <Sparkles size={20} className="text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-1">💡 Dica da KINU</p>
          {isLoading ? (
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-sm text-muted-foreground">{tip}</p>
          )}
        </div>
        <button
          onClick={fetchTip}
          disabled={isLoading}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
};

export default DashboardKinuTip;
