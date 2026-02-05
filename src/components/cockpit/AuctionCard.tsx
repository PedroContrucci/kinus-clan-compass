// AuctionCard — Reverse auction card for activities

import { useState } from 'react';
import { Tag, Clock, TrendingDown, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuctionCardProps {
  item: {
    id: string;
    name: string;
    category: 'flight' | 'hotel' | 'experience';
    kinuEstimate: number;
    targetPrice?: number;
    waitDays?: number;
    status: 'idle' | 'watching' | 'won' | 'expired';
  };
  insight?: {
    type: 'best_price' | 'wait_recommended' | 'price_rising';
    message: string;
  };
  onActivate: (targetPrice: number, waitDays: number) => void;
}

const CATEGORY_CONFIG = {
  flight: { icon: '✈️', label: 'Voo', color: 'sky' },
  hotel: { icon: '🏨', label: 'Hotel', color: 'violet' },
  experience: { icon: '🎯', label: 'Experiência', color: 'emerald' },
};

const INSIGHT_CONFIG = {
  best_price: { icon: <Zap size={14} />, color: 'emerald', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  wait_recommended: { icon: <Clock size={14} />, color: 'amber', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  price_rising: { icon: <TrendingDown size={14} className="rotate-180" />, color: 'red', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
};

export const AuctionCard = ({ item, insight, onActivate }: AuctionCardProps) => {
  const [targetPrice, setTargetPrice] = useState(Math.round(item.kinuEstimate * 0.85));
  const [waitDays, setWaitDays] = useState(3);
  const [isExpanded, setIsExpanded] = useState(false);

  const category = CATEGORY_CONFIG[item.category];
  const insightConfig = insight ? INSIGHT_CONFIG[insight.type] : null;

  const discount = Math.round(((item.kinuEstimate - targetPrice) / item.kinuEstimate) * 100);

  const handleActivate = () => {
    onActivate(targetPrice, waitDays);
  };

  return (
    <motion.div
      layout
      className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-md hover:border-emerald-500/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div>
            <h3 className="font-semibold text-foreground font-['Outfit']">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{category.label}</p>
          </div>
        </div>
        
        {item.status === 'watching' && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 animate-pulse">
            Em Leilão
          </span>
        )}
        {item.status === 'won' && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            Ganho ✓
          </span>
        )}
      </div>

      {/* Estimate */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-sm text-muted-foreground">Estimativa KINU:</span>
        <span className="text-xl font-bold text-foreground font-['Outfit']">
          R$ {item.kinuEstimate.toLocaleString()}
        </span>
      </div>

      {/* Insight */}
      {insight && insightConfig && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${insightConfig.bgColor} border ${insightConfig.borderColor}`}
        >
          <span className={`text-${insightConfig.color}-400`}>{insightConfig.icon}</span>
          <span className={`text-sm text-${insightConfig.color}-400`}>{insight.message}</span>
        </motion.div>
      )}

      {/* Expandable Form */}
      {item.status === 'idle' && (
        <>
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Tag size={16} className="inline mr-2" />
              Ativar Leilão
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Target Price */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Seu Alvo:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#334155] border border-[#475569] rounded-xl pl-10 pr-4 py-3 text-foreground font-['Outfit'] font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Desconto: {discount}% ({discount < 15 ? 'Alta chance' : discount < 25 ? 'Média' : 'Baixa chance'})
                </p>
              </div>

              {/* Wait Days */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Dias de Espera:
                </label>
                <div className="flex gap-2">
                  {[1, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => setWaitDays(days)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        waitDays === days
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#334155] text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="flex-1 py-3 rounded-xl bg-[#334155] text-muted-foreground font-medium hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleActivate}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                >
                  Ativar
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AuctionCard;
