// AuctionActivationModal — Modal to activate auction on flights/hotels

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Bell, TrendingDown, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatBRL } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';

interface Offer {
  id: string;
  provider: string;
  price: number;
  date: string;
  url: string;
  savings: number;
}

interface AuctionActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    id: string;
    name: string;
    type: 'flight' | 'hotel';
    estimatedPrice: number;
  };
  tripId: string;
  onActivateMonitoring: (auctionData: {
    activityId: string;
    targetPrice: number;
    monitorDays: number;
  }) => void;
  onAcceptOffer?: (offer: Offer) => void;
}

export const AuctionActivationModal = ({
  isOpen,
  onClose,
  activity,
  tripId,
  onActivateMonitoring,
  onAcceptOffer,
}: AuctionActivationModalProps) => {
  const [targetPrice, setTargetPrice] = useState<number>(
    Math.round(activity.estimatedPrice * 0.85) // Default: 15% discount
  );
  const [monitorDays, setMonitorDays] = useState(14);
  const [isSearching, setIsSearching] = useState(false);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [mode, setMode] = useState<'input' | 'offers'>('input');

  const discountPercent = Math.round(
    ((activity.estimatedPrice - targetPrice) / activity.estimatedPrice) * 100
  );

  const getSuccessChance = (discount: number): { label: string; color: string } => {
    if (discount <= 10) return { label: 'Muito Alta', color: 'text-emerald-500' };
    if (discount <= 20) return { label: 'Alta', color: 'text-green-500' };
    if (discount <= 30) return { label: 'Média', color: 'text-amber-500' };
    if (discount <= 40) return { label: 'Baixa', color: 'text-orange-500' };
    return { label: 'Muito Baixa', color: 'text-red-500' };
  };

  const successChance = getSuccessChance(discountPercent);

  const handleSearchOffers = async () => {
    setIsSearching(true);
    
    // Simulate API search (would call Amadeus in production)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock offers based on activity type
    const basePrice = activity.estimatedPrice;
    const mockOffers: Offer[] = [
      {
        id: '1',
        provider: activity.type === 'flight' ? 'TAP Portugal' : 'Booking.com',
        price: Math.round(basePrice * 0.92),
        date: activity.type === 'flight' ? '1 dia antes' : 'Check-in flexível',
        url: '#',
        savings: Math.round(basePrice * 0.08),
      },
      {
        id: '2',
        provider: activity.type === 'flight' ? 'Air France' : 'Hotels.com',
        price: Math.round(basePrice * 0.95),
        date: 'Data original',
        url: '#',
        savings: Math.round(basePrice * 0.05),
      },
      {
        id: '3',
        provider: activity.type === 'flight' ? 'LATAM' : 'Expedia',
        price: Math.round(basePrice * 0.88),
        date: activity.type === 'flight' ? '2 dias antes' : 'Cancelamento grátis',
        url: '#',
        savings: Math.round(basePrice * 0.12),
      },
    ];
    
    setOffers(mockOffers.sort((a, b) => a.price - b.price));
    setMode('offers');
    setIsSearching(false);
  };

  const handleActivateMonitoring = () => {
    onActivateMonitoring({
      activityId: activity.id,
      targetPrice,
      monitorDays,
    });
    onClose();
  };

  const handleAcceptOffer = (offer: Offer) => {
    onAcceptOffer?.(offer);
    onClose();
  };

  const handleBack = () => {
    setMode('input');
    setOffers(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            🎯 Leilão - {activity.name}
          </DialogTitle>
        </DialogHeader>

        {mode === 'input' ? (
          <div className="space-y-5">
            {/* Current Price */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">Preço estimado atual</p>
              <p className="text-2xl font-bold text-foreground font-['Outfit']">
                {formatBRL(activity.estimatedPrice)}
              </p>
            </div>

            {/* Target Price Input */}
            <div className="space-y-2">
              <Label htmlFor="targetPrice">Qual seu preço alvo?</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="targetPrice"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="pl-10 text-lg font-semibold"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Desconto: <span className="font-medium text-foreground">{discountPercent}%</span>
                </span>
                <span className={cn('font-medium', successChance.color)}>
                  Chance: {successChance.label}
                </span>
              </div>
            </div>

            {/* KINU Tip */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary">
                  {activity.type === 'flight' 
                    ? 'Preços de voos costumam cair 10-15% faltando 45 dias para a viagem. Terças e quartas geralmente têm as melhores tarifas.'
                    : 'Hotéis frequentemente oferecem descontos de última hora ou em reservas antecipadas com cancelamento grátis.'}
                </p>
              </div>
            </div>

            {/* Monitor Days */}
            <div className="space-y-2">
              <Label htmlFor="monitorDays">Por quantos dias monitorar?</Label>
              <div className="flex items-center gap-3">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setMonitorDays(days)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border transition-colors',
                      monitorDays === days
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-border hover:border-primary/50'
                    )}
                  >
                    {days} dias
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleSearchOffers}
                disabled={isSearching}
                className="w-full"
                variant="outline"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando ofertas...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar ofertas agora
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button onClick={handleActivateMonitoring} className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Ativar monitoramento KINU
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                O KINU irá te avisar quando encontrar seu preço!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ← Voltar
            </button>

            {/* Offers list */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <TrendingDown size={16} className="text-emerald-500" />
                Ofertas encontradas
              </h4>

              {offers?.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-xl border',
                    index === 0 
                      ? 'bg-emerald-500/5 border-emerald-500/30' 
                      : 'bg-card border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{offer.provider}</p>
                      <p className="text-sm text-muted-foreground">{offer.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatBRL(offer.price)}</p>
                      {offer.savings > 0 && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          -{formatBRL(offer.savings)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAcceptOffer(offer)}
                    size="sm"
                    className="w-full"
                    variant={index === 0 ? 'default' : 'outline'}
                  >
                    {index === 0 ? 'Aceitar melhor oferta' : 'Aceitar esta oferta'}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Monitor option */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Nenhuma atende? O KINU continua buscando!
              </p>
              <Button onClick={handleActivateMonitoring} variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                Ativar monitoramento por {monitorDays} dias
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuctionActivationModal;
