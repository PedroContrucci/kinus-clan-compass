// AuctionConfigModal — Full auction configuration with price analysis

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Clock, Sparkles, Target, Zap, AlertTriangle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuctionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    id: string;
    name: string;
    type: string;
    cost: number;
  };
  onActivate: (config: { targetPrice: number; waitDays: number }) => void;
  onCloseNow?: (price: number) => void;
}

// Simulate price history for analysis
const generatePriceAnalysis = (currentPrice: number) => {
  const variation = 0.15; // 15% historical variation
  const avgPrice = currentPrice * (1 - 0.05); // Average slightly lower
  const lowestPrice = currentPrice * (1 - variation);
  const highestPrice = currentPrice * (1 + variation * 0.5);
  
  // Random trend
  const trends = ['up', 'down', 'stable'] as const;
  const trend = trends[Math.floor(Math.random() * 3)];
  const trendPercentage = trend === 'up' ? 5 + Math.random() * 10 : trend === 'down' ? -(5 + Math.random() * 10) : 0;
  
  return {
    currentPrice,
    avgPrice: Math.round(avgPrice),
    lowestPrice: Math.round(lowestPrice),
    highestPrice: Math.round(highestPrice),
    trend,
    trendPercentage: Math.round(trendPercentage),
    daysAgoLowest: Math.floor(30 + Math.random() * 30),
  };
};

// Calculate success chance based on discount
const getSuccessChance = (discount: number): { label: string; color: string; percentage: number } => {
  if (discount <= 5) return { label: 'Muito Alta', color: 'text-emerald-500', percentage: 90 };
  if (discount <= 10) return { label: 'Alta', color: 'text-emerald-400', percentage: 75 };
  if (discount <= 15) return { label: 'Média', color: 'text-amber-500', percentage: 50 };
  if (discount <= 20) return { label: 'Baixa', color: 'text-orange-500', percentage: 30 };
  return { label: 'Muito Baixa', color: 'text-red-500', percentage: 10 };
};

export const AuctionConfigModal = ({
  isOpen,
  onClose,
  activity,
  onActivate,
  onCloseNow,
}: AuctionConfigModalProps) => {
  const priceAnalysis = useMemo(() => generatePriceAnalysis(activity.cost), [activity.cost]);
  
  // Suggest target = 15% below current
  const [targetPrice, setTargetPrice] = useState(Math.round(activity.cost * 0.85));
  const [waitDays, setWaitDays] = useState(7);
  
  const discount = Math.round(((activity.cost - targetPrice) / activity.cost) * 100);
  const successChance = getSuccessChance(discount);
  const expirationDate = addDays(new Date(), waitDays);
  
  // Check if it's a free activity
  const isFreeActivity = activity.cost === 0;
  
  const TrendIcon = priceAnalysis.trend === 'up' ? TrendingUp : priceAnalysis.trend === 'down' ? TrendingDown : Minus;
  const trendColor = priceAnalysis.trend === 'up' ? 'text-red-500' : priceAnalysis.trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground';
  
  const handleActivate = () => {
    onActivate({ targetPrice, waitDays });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Leilão Reverso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Activity Info */}
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="font-medium text-foreground">{activity.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
          </div>
          
          {isFreeActivity ? (
            /* Free Activity - No Auction Needed */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center"
            >
              <div className="text-3xl mb-2">✨</div>
              <p className="font-medium text-emerald-500">Atividade Gratuita!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Este item não precisa de leilão. Aproveite!
              </p>
            </motion.div>
          ) : (
            <>
              {/* Price Analysis */}
              <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  📊 Análise de Preços KINU
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço Atual</p>
                    <p className="font-bold text-foreground">R$ {activity.cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Média 30 dias</p>
                    <p className="font-medium text-foreground">R$ {priceAnalysis.avgPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Menor registrado</p>
                    <p className="font-medium text-emerald-500">
                      R$ {priceAnalysis.lowestPrice.toLocaleString()}
                      <span className="text-xs text-muted-foreground ml-1">
                        (há {priceAnalysis.daysAgoLowest}d)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tendência</p>
                    <p className={cn('font-medium flex items-center gap-1', trendColor)}>
                      <TrendIcon size={14} />
                      {priceAnalysis.trend === 'up' ? 'Subindo' : priceAnalysis.trend === 'down' ? 'Descendo' : 'Estável'}
                      <span className="text-xs">
                        ({priceAnalysis.trendPercentage > 0 ? '+' : ''}{priceAnalysis.trendPercentage}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* KINU Insight */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-3 bg-primary/5 border border-primary/20 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-primary">
                    {priceAnalysis.trend === 'up' 
                      ? `Preços estão subindo. Se puder fechar em até ${waitDays} dias, provavelmente consegue R$ ${Math.round(activity.cost * 0.9).toLocaleString()} ou menos.`
                      : priceAnalysis.trend === 'down'
                        ? `Boa notícia! Preços em queda. Bom momento para ativar o leilão e conseguir até ${discount}% de desconto.`
                        : `Preços estáveis. Um desconto de ${discount}% é realista para os próximos ${waitDays} dias.`
                    }
                  </p>
                </div>
              </motion.div>
              
              {/* Target Price Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  🎯 Qual preço você quer pagar?
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {discount}% abaixo do preço atual
                  </span>
                  <span className={successChance.color}>
                    Chance: {successChance.label} ({successChance.percentage}%)
                  </span>
                </div>
                <Progress value={successChance.percentage} className="h-1.5" />
              </div>
              
              {/* Wait Days Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock size={14} />
                  Por quantos dias monitorar?
                </label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setWaitDays(days)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                        waitDays === days
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Se não encontrar até {format(expirationDate, "dd/MMM", { locale: ptBR })}, mantém o preço atual
                </p>
              </div>
              
              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleActivate}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Zap size={16} className="mr-2" />
                  Ativar Leilão
                </Button>
                
                {onCloseNow && (
                  <Button
                    variant="outline"
                    onClick={() => onCloseNow(activity.cost)}
                    className="w-full"
                  >
                    💰 Fechar agora por R$ {activity.cost.toLocaleString()}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuctionConfigModal;
