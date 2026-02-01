import { useState } from 'react';
import { format } from 'date-fns';
import { Tag, Pin, RotateCcw, Trash2, Clock, MapPin, Star, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCostCategory } from '@/lib/budget';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

interface MinimalActivityCardProps {
  activity: {
    id: string;
    time: string;
    endTime?: string;
    name: string;
    description: string;
    duration: string;
    type: string;
    location?: string;
    distanceFromHotel?: string;
    rating?: number;
    reviewCount?: number;
    cost: number;
    costBreakdown?: string;
    isFree?: boolean;
    status: 'planned' | 'pinned' | 'bidding' | 'confirmed';
    clanTip?: { text: string; author: string };
  };
  date: Date;
  isPinned: boolean;
  dailyBudget: number;
  onTogglePin: () => void;
  onOpenAuction: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
}

interface AuctionOffer {
  provider: string;
  price: number;
  rating: number;
  features: string;
  isBest?: boolean;
}

const getActivityTypeLabel = (type: string): { label: string; emoji: string } => {
  switch (type) {
    case 'food': return { label: 'Comida', emoji: '🍽️' };
    case 'culture': return { label: 'Cultura', emoji: '🏛️' };
    case 'transport': return { label: 'Transporte', emoji: '🚕' };
    case 'photo': return { label: 'Passeio', emoji: '📸' };
    case 'relax': return { label: 'Relaxar', emoji: '🏨' };
    case 'walk': return { label: 'Caminhada', emoji: '🚶' };
    case 'nature': return { label: 'Natureza', emoji: '🌿' };
    default: return { label: 'Atividade', emoji: '📍' };
  }
};

export const MinimalActivityCard = ({
  activity,
  date,
  isPinned,
  dailyBudget,
  onTogglePin,
  onOpenAuction,
  onSwap,
  onRemove,
}: MinimalActivityCardProps) => {
  const [auctionOpen, setAuctionOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [auctionState, setAuctionState] = useState<'input' | 'searching' | 'results'>('input');
  const [offers, setOffers] = useState<AuctionOffer[]>([]);
  const [acceptedOffer, setAcceptedOffer] = useState<AuctionOffer | null>(null);

  const typeInfo = getActivityTypeLabel(activity.type);
  const costCategory = getCostCategory(activity.cost, dailyBudget);
  const isFree = activity.cost === 0;

  const statusStyles = {
    planned: { border: 'border-border', label: '⚪ Planejado' },
    pinned: { border: 'border-primary ring-2 ring-primary/30', label: '📌 Fixado' },
    bidding: { border: 'border-[#eab308]', label: '🟡 Em Leilão' },
    confirmed: { border: 'border-primary', label: '🟢 Confirmado' },
  };

  const status = statusStyles[isPinned ? 'pinned' : acceptedOffer ? 'confirmed' : activity.status];

  const handleActivateAuction = () => {
    setAuctionOpen(true);
    setAuctionState('input');
    setTargetPrice(String(Math.round(activity.cost * 0.8)));
  };

  const handleSearchOffers = () => {
    setAuctionState('searching');
    // Simulate auction search
    setTimeout(() => {
      const mockOffers: AuctionOffer[] = [
        {
          provider: 'GetYourGuide',
          price: Math.round(activity.cost * 0.75),
          rating: 4.8,
          features: 'Skip the line • Audioguia',
          isBest: true,
        },
        {
          provider: 'Civitatis',
          price: Math.round(activity.cost * 0.85),
          rating: 4.6,
          features: 'Entrada rápida',
        },
        {
          provider: 'Viator',
          price: Math.round(activity.cost * 0.9),
          rating: 4.5,
          features: 'Guia local',
        },
      ];
      setOffers(mockOffers);
      setAuctionState('results');
    }, 1500);
  };

  const handleAcceptOffer = (offer: AuctionOffer) => {
    setAcceptedOffer(offer);
    setAuctionOpen(false);
  };

  return (
    <div 
      className={cn(
        "bg-card border rounded-2xl p-4 transition-all hover:border-primary/50",
        status.border
      )}
    >
      {/* Header: Time & Type */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold font-['Outfit']">
            🕐 {activity.time}
            {activity.endTime && <span className="text-muted-foreground font-normal"> - {activity.endTime}</span>}
          </span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {typeInfo.emoji} {typeInfo.label}
        </span>
      </div>

      {/* Title & Description */}
      <h4 className="font-semibold text-foreground font-['Outfit'] text-lg mb-1">
        {activity.name}
      </h4>
      <p className="text-sm text-muted-foreground mb-3">
        {activity.description}
      </p>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
        {activity.location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {activity.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} /> {activity.duration}
        </span>
        {activity.distanceFromHotel && (
          <span>🚶 {activity.distanceFromHotel} do hotel</span>
        )}
        {activity.rating && (
          <span className="flex items-center gap-1">
            <Star size={12} className="text-[#eab308]" /> {activity.rating}
            {activity.reviewCount && <span>({activity.reviewCount})</span>}
          </span>
        )}
      </div>

      {/* Cost Box */}
      <div className="bg-muted/30 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFree ? (
              <span className="text-primary font-bold font-['Outfit']">
                💚 GRÁTIS
              </span>
            ) : (
              <>
                <span className="font-semibold font-['Outfit']" style={{ color: costCategory.color }}>
                  💰 R$ {activity.cost.toLocaleString()}
                </span>
                <span 
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    costCategory.bgColor
                  )}
                  style={{ color: costCategory.color }}
                >
                  {costCategory.icon} {costCategory.label}
                </span>
              </>
            )}
          </div>
        </div>
        {activity.costBreakdown && (
          <p className="text-xs text-muted-foreground mt-1">
            {activity.costBreakdown}
          </p>
        )}

        {/* Accepted Offer Display */}
        {acceptedOffer && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">via {acceptedOffer.provider}</span>
              <span className="text-primary font-medium">
                Economia: R$ {activity.cost - acceptedOffer.price}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Clan Tip */}
      {activity.clanTip && (
        <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg p-3 mb-3">
          <p className="text-foreground text-sm">
            💡 "{activity.clanTip.text}" — {activity.clanTip.author} 🌿
          </p>
        </div>
      )}

      {/* Inline Auction Panel */}
      <Collapsible open={auctionOpen} onOpenChange={setAuctionOpen}>
        <CollapsibleContent>
          <div className="bg-[#eab308]/5 border border-[#eab308]/30 rounded-xl p-4 mb-3">
            {auctionState === 'input' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-[#eab308] font-['Outfit']">
                    🏷️ LEILÃO REVERSO
                  </span>
                  <button onClick={() => setAuctionOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimativa KINU:</span>
                    <span className="text-foreground font-medium">R$ {activity.cost}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Qual seu preço alvo?
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="pl-10 bg-background"
                          placeholder="250"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSearchOffers}
                      className="flex-1 py-2 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl text-sm font-medium"
                    >
                      Buscar Ofertas
                    </button>
                    <button
                      onClick={() => setAuctionOpen(false)}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            )}

            {auctionState === 'searching' && (
              <div className="flex flex-col items-center py-6">
                <div className="w-8 h-8 border-2 border-[#eab308] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-muted-foreground text-sm">Buscando as melhores ofertas...</p>
              </div>
            )}

            {auctionState === 'results' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-[#eab308] font-['Outfit']">
                    🏷️ OFERTAS ENCONTRADAS
                  </span>
                  <button onClick={() => setAuctionOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  Seu alvo: R$ {targetPrice}
                </p>
                
                <div className="space-y-2">
                  {offers.map((offer, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "border rounded-xl p-3",
                        offer.isBest 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-muted/30"
                      )}
                    >
                      {offer.isBest && (
                        <span className="text-xs text-primary font-medium mb-1 block">
                          🏆 MELHOR OFERTA
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{offer.provider}</span>
                        <span className="font-bold text-foreground font-['Outfit']">
                          R$ {offer.price}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          ⭐ {offer.rating} • {offer.features}
                        </span>
                        {offer.isBest && (
                          <span className="text-primary">
                            Economia: R$ {activity.cost - offer.price} ({Math.round((1 - offer.price / activity.cost) * 100)}%)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        className={cn(
                          "w-full mt-2 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          offer.isBest 
                            ? "bg-primary text-white" 
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {offer.isBest ? 'Aceitar →' : 'Ver'}
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setAuctionOpen(false);
                    setAuctionState('input');
                  }}
                  className="w-full mt-3 py-2 bg-muted text-muted-foreground rounded-xl text-sm"
                >
                  Fechar Leilão
                </button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!isFree && !acceptedOffer && (
          <button
            onClick={handleActivateAuction}
            className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-[#eab308] transition-colors"
          >
            <Tag size={12} />
            🏷️ Ativar Leilão
          </button>
        )}
        
        {acceptedOffer && (
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs"
          >
            <ExternalLink size={12} />
            📎 Ver Voucher
          </button>
        )}
        
        {onSwap && (
          <button 
            onClick={onSwap}
            className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-primary transition-colors"
          >
            <RotateCcw size={12} />
            🔄 Trocar
          </button>
        )}
        
        <button
          onClick={onTogglePin}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
            isPinned
              ? "bg-primary text-white"
              : "bg-background border border-border text-foreground hover:border-primary"
          )}
        >
          <Pin size={12} />
          📌
        </button>
        
        {onRemove && (
          <button 
            onClick={onRemove}
            className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-destructive/50 transition-colors"
          >
            <Trash2 size={12} />
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default MinimalActivityCard;
