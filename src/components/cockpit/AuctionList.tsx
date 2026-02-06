// AuctionList — Reverse auction list for trip activities

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, TrendingDown, Bell, CheckCircle, AlertTriangle, 
  Zap, Sparkles, ExternalLink, Play, Pause, RotateCcw
} from 'lucide-react';
import { format, addDays, differenceInDays, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuctionItem {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'experience' | 'transport';
  targetPrice: number;
  currentBestPrice: number | null;
  bestPriceDate: Date | null;
  bestPriceUrl: string | null;
  kinutEstimate: number;
  startedAt: Date;
  expiresAt: Date;
  maxWaitDays: number;
  status: 'watching' | 'won' | 'expired' | 'paused';
  savings: number;
}

interface AuctionListProps {
  tripId: string;
  activities?: any[];
}

const typeIcons = {
  flight: '✈️',
  hotel: '🏨',
  experience: '🎭',
  transport: '🚃',
};

const statusConfig = {
  watching: { label: 'Monitorando', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
  won: { label: 'Conquistado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  expired: { label: 'Expirado', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  paused: { label: 'Pausado', color: 'bg-muted text-muted-foreground border-muted' },
};

export const AuctionList = ({ tripId, activities }: AuctionListProps) => {
  // START EMPTY - no mock data, auctions must be activated from the itinerary
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);

  const totalSavings = useMemo(() => {
    return auctions.reduce((acc, a) => acc + a.savings, 0);
  }, [auctions]);

  const activeAuctions = auctions.filter(a => a.status === 'watching');
  const wonAuctions = auctions.filter(a => a.status === 'won');

  const handleToggleAuction = (id: string) => {
    setAuctions(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'watching' ? 'paused' : 'watching' as const };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Economia com leilões</p>
            <p className="text-2xl font-bold text-primary font-['Outfit']">
              R$ {totalSavings.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {activeAuctions.length} ativos • {wonAuctions.length} conquistados
            </p>
          </div>
        </div>
      </motion.div>

      {/* Active Auctions */}
      <div>
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Bell size={16} className="text-amber-500" />
          Monitorando Preços
        </h3>

        <div className="space-y-3">
          {activeAuctions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum leilão ativo</p>
              <p className="text-sm mt-1">Ative o leilão em alguma atividade para monitorar preços</p>
            </div>
          ) : (
            activeAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcons[auction.type]}</span>
                    <div>
                      <p className="font-medium text-foreground">{auction.name}</p>
                      <Badge variant="outline" className={statusConfig[auction.status].color}>
                        {statusConfig[auction.status].label}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAuction(auction.id)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    <Pause size={16} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço Alvo</p>
                    <p className="font-medium text-foreground">
                      R$ {auction.targetPrice.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Melhor Encontrado</p>
                    <p className={cn(
                      'font-medium',
                      auction.currentBestPrice && auction.currentBestPrice <= auction.targetPrice 
                        ? 'text-emerald-500' 
                        : 'text-foreground'
                    )}>
                      {auction.currentBestPrice 
                        ? `R$ ${auction.currentBestPrice.toLocaleString('pt-BR')}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimativa KINU</p>
                    <p className="font-medium text-primary">
                      R$ {auction.kinutEstimate.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Time remaining */}
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <div className="flex-1">
                    <Progress 
                      value={
                        (differenceInDays(new Date(), auction.startedAt) / auction.maxWaitDays) * 100
                      } 
                      className="h-1.5"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {differenceInDays(auction.expiresAt, new Date())} dias restantes
                  </span>
                </div>

                {/* KINU insight */}
                <div className="mt-3 p-2 bg-primary/5 rounded-lg flex items-start gap-2">
                  <Sparkles size={14} className="text-primary mt-0.5" />
                  <p className="text-xs text-primary">
                    Historicamente, preços caem 10-15% nas últimas 2 semanas antes da viagem.
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Won Auctions */}
      {wonAuctions.length > 0 && (
        <div>
          <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Conquistados
          </h3>

          <div className="space-y-3">
            {wonAuctions.map((auction) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcons[auction.type]}</span>
                    <div>
                      <p className="font-medium text-foreground">{auction.name}</p>
                      <p className="text-sm text-emerald-500">
                        Economizou R$ {auction.savings.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {auction.bestPriceUrl && (
                    <a
                      href={auction.bestPriceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <ExternalLink size={16} className="text-muted-foreground" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-muted/50 rounded-xl">
        <div className="flex items-start gap-2">
          <Zap size={16} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Como funciona o Leilão Reverso?</p>
            <p className="text-xs text-muted-foreground mt-1">
              O KINU monitora preços 24/7 e avisa quando encontrar valores abaixo do seu alvo. 
              Você define o preço máximo e quanto tempo pode esperar — nós fazemos o resto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionList;
