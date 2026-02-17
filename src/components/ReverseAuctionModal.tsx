import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Check, Star, ArrowLeft, Plane, Hotel, MapPin, Clock, Users, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { Offer } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { calculateSuccessChance } from '@/lib/tierSystem';
import { useViatorSearch, ViatorProduct } from '@/hooks/useViatorSearch';

// Item type for contextual auction
export type AuctionItemType = 'flight' | 'hotel' | 'activity';

export interface AuctionItem {
  type: AuctionItemType;
  id: string;
  name: string;
  cost: number;
  
  // Flight specific
  origin?: string;
  originCode?: string;
  destination?: string;
  destinationCode?: string;
  departureDate?: Date;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  airline?: string;
  flightClass?: string;
  travelers?: number;
  
  // Hotel specific
  hotelName?: string;
  stars?: number;
  checkIn?: Date;
  checkOut?: Date;
  nights?: number;
  perNight?: number;
  location?: string;
  
  // Activity specific
  activityDate?: Date;
  activityTime?: string;
  activityDuration?: string;
  includes?: string[];
}

interface ReverseAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: AuctionItem;
  // Legacy props for backward compatibility
  activityName?: string;
  activityType?: string;
  destination?: string;
  estimatedPrice?: number;
  onAcceptOffer?: (offer: Offer) => void;
}

// Provider data by type
const PROVIDERS = {
  flight: [
    { name: 'LATAM', icon: '✈️' },
    { name: 'Decolar', icon: '🌐' },
    { name: 'MaxMilhas', icon: '🎫' },
    { name: 'Google Flights', icon: '🔍' },
    { name: 'Skyscanner', icon: '✈️' },
  ],
  hotel: [
    { name: 'Booking.com', icon: '🏨' },
    { name: 'Hotels.com', icon: '🏨' },
    { name: 'Expedia', icon: '🌐' },
    { name: 'Airbnb', icon: '🏠' },
  ],
  activity: [
    { name: 'GetYourGuide', icon: '🎯' },
    { name: 'Civitatis', icon: '🎫' },
    { name: 'Viator', icon: '🌐' },
    { name: 'ToursByLocals', icon: '👤' },
  ],
};

// Generate mock offers based on item type with success chance
const generateOffers = (item: AuctionItem, targetPrice: number): (Offer & { successChance?: ReturnType<typeof calculateSuccessChance> })[] => {
  const basePrice = item.cost;
  const providers = PROVIDERS[item.type];
  
  return providers.slice(0, 4).map((provider, index) => {
    // First offer is best (closest to target), others are higher
    const discount = index === 0 ? 0.25 : index === 1 ? 0.20 : index === 2 ? 0.15 : 0.10;
    const price = Math.round(basePrice * (1 - discount));
    
    let details = '';
    let features: string[] = [];
    
    switch (item.type) {
      case 'flight':
        details = `${item.originCode} → ${item.destinationCode} • ${index === 0 ? 'Direto' : `${index} parada(s)`} • ${item.duration}`;
        features = ['Bagagem inclusa', 'Cancelamento flexível', 'Seleção de assento'];
        break;
      case 'hotel':
        details = `${item.stars}★ • ${item.nights} noites • R$ ${Math.round(price / (item.nights || 1))}/noite`;
        features = ['Café incluso', 'Wi-Fi grátis', 'Cancelamento grátis até 24h'];
        break;
      case 'activity':
        details = `Tour ${index === 0 ? 'privado' : 'em grupo'} • ${item.activityDuration}`;
        features = ['Guia em português', 'Ingresso incluso', 'Cancelamento grátis'];
        break;
    }
    
    // Calculate success chance based on discount
    const successChance = calculateSuccessChance(price, targetPrice, basePrice);
    
    return {
      id: `offer-${index}`,
      provider: provider.name,
      price,
      originalPrice: basePrice,
      details,
      rating: 4.5 + Math.random() * 0.4,
      reviewCount: Math.floor(1000 + Math.random() * 5000),
      features: features.slice(0, 2 + index),
      link: `https://${provider.name.toLowerCase().replace(/\s+/g, '')}.com`,
      successChance,
    };
  }).sort((a, b) => a.price - b.price);
};

type AuctionStep = 'target' | 'competing' | 'results';

const ReverseAuctionModal = ({ 
  isOpen, 
  onClose, 
  item,
  activityName,
  activityType: legacyType,
  destination,
  estimatedPrice = 280,
  onAcceptOffer
}: ReverseAuctionModalProps) => {
  const [step, setStep] = useState<AuctionStep>('target');
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [competingOffers, setCompetingOffers] = useState<{ provider: string; price: number; progress: number }[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showOtherOffers, setShowOtherOffers] = useState(false);
  
  const { search: searchViator, results: viatorResults, loading: viatorLoading } = useViatorSearch();

  // CRITICAL: Create item from legacy props if not provided
  // Ensure strict typing - category is determined at mount time and NEVER changes
  const auctionItem: AuctionItem = item || {
    type: 'activity' as AuctionItemType,
    id: 'legacy',
    name: activityName || 'Atividade',
    cost: estimatedPrice,
  };

  // Log current category for debugging
  useEffect(() => {
    if (isOpen) {
      console.log('🏷️ [ReverseAuctionModal] Opened for category:', auctionItem.type);
      console.log('🏷️ [ReverseAuctionModal] Item details:', {
        type: auctionItem.type,
        name: auctionItem.name,
        cost: auctionItem.cost,
        // Log type-specific fields to verify isolation
        ...(auctionItem.type === 'flight' && { airline: auctionItem.airline, originCode: auctionItem.originCode }),
        ...(auctionItem.type === 'hotel' && { hotelName: auctionItem.hotelName, stars: auctionItem.stars }),
        ...(auctionItem.type === 'activity' && { duration: auctionItem.activityDuration }),
      });
    }
  }, [isOpen, auctionItem]);

  const currentCost = auctionItem.cost;

  useEffect(() => {
    if (isOpen) {
      setStep('target');
      setTargetPrice(Math.round(currentCost * 0.80)); // Default 20% below
      setShowOtherOffers(false);
      setOffers([]);
    }
  }, [isOpen, currentCost]);

  // Fetch real Viator offers when modal opens
  useEffect(() => {
    if (isOpen && destination) {
      const name = auctionItem.name;
      const type = auctionItem.type === 'activity' ? (legacyType || '') : auctionItem.type;
      searchViator({
        destination,
        activityName: name,
        activityType: type,
        currency: 'BRL',
        count: 5,
      });
    }
  }, [isOpen, destination]);

  const startAuction = () => {
    setStep('competing');
    const providers = PROVIDERS[auctionItem.type];
    
    // Initialize competing offers
    const initialOffers = providers.slice(0, 4).map(p => ({ 
      provider: p.name, 
      price: Math.round(currentCost * 1.1), 
      progress: 0 
    }));
    setCompetingOffers(initialOffers);

    // Animate competition
    let iteration = 0;
    const interval = setInterval(() => {
      iteration++;
      setCompetingOffers(prev => 
        prev.map((p, i) => ({
          ...p,
          price: Math.max(
            Math.round(currentCost * (0.7 + i * 0.05)), 
            p.price - Math.floor(Math.random() * (currentCost * 0.05))
          ),
          progress: Math.min(100, p.progress + Math.floor(Math.random() * 25) + 15)
        }))
      );

      if (iteration >= 5) {
        clearInterval(interval);
        const generatedOffers = generateOffers(auctionItem, targetPrice);
        setOffers(generatedOffers);
        setTimeout(() => setStep('results'), 400);
      }
    }, 450);
  };

  const handleAcceptOffer = (offer: Offer) => {
    window.open(offer.link, '_blank');
    if (onAcceptOffer) {
      onAcceptOffer(offer);
    }
  };

  const handleClose = () => {
    setStep('target');
    onClose();
  };

  const getSuccessChance = (): number => {
    const diff = ((currentCost - targetPrice) / currentCost) * 100;
    if (diff <= 10) return 92;
    if (diff <= 15) return 78;
    if (diff <= 20) return 65;
    if (diff <= 25) return 48;
    if (diff <= 30) return 32;
    return 18;
  };

  const getTypeIcon = () => {
    // STRICT: Return icon based ONLY on the item's declared type
    switch (auctionItem.type) {
      case 'flight': return <Plane size={20} className="text-sky-400" />;
      case 'hotel': return <Hotel size={20} className="text-purple-400" />;
      case 'activity': return <MapPin size={20} className="text-primary" />;
      default: return <MapPin size={20} className="text-primary" />;
    }
  };

  const getTypeLabel = () => {
    // STRICT: Return label based ONLY on the item's declared type
    switch (auctionItem.type) {
      case 'flight': return 'Voo';
      case 'hotel': return 'Hospedagem';
      case 'activity': return 'Passeio';
      default: return 'Item';
    }
  };
  
  // Get category-specific badge styling
  const getCategoryBadgeClass = () => {
    switch (auctionItem.type) {
      case 'flight': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'hotel': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'activity': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const bestOffer = offers[0];
  const otherOffers = offers.slice(1);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-['Outfit'] text-lg flex items-center gap-3">
            {step !== 'target' && (
              <button onClick={() => setStep('target')} className="p-1 hover:bg-muted rounded">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              {/* Category Badge with distinct styling */}
              <span className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2",
                getCategoryBadgeClass()
              )}>
                {getTypeIcon()}
                <span>Leilão — {getTypeLabel()}</span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Target Price */}
        {step === 'target' && (
          <div className="space-y-4 animate-fade-in">
            {/* Contextual Item Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              {auctionItem.type === 'flight' && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold font-['Outfit']">{auctionItem.originCode}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-2xl font-bold font-['Outfit']">{auctionItem.destinationCode}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {auctionItem.departureDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(auctionItem.departureDate, 'dd/MM', { locale: ptBR })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {auctionItem.departureTime} → {auctionItem.arrivalTime}
                    </span>
                    <span>⏱️ {auctionItem.duration}</span>
                  </div>
                  {auctionItem.airline && (
                    <p className="text-sm text-muted-foreground">
                      Cia atual: {auctionItem.airline} • {auctionItem.flightClass}
                    </p>
                  )}
                </>
              )}

              {auctionItem.type === 'hotel' && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold font-['Outfit']">{auctionItem.hotelName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {'★'.repeat(auctionItem.stars || 3)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {auctionItem.checkIn && format(auctionItem.checkIn, 'dd/MM', { locale: ptBR })} → {auctionItem.checkOut && format(auctionItem.checkOut, 'dd/MM', { locale: ptBR })}
                    </span>
                    <span>🛏️ {auctionItem.nights} noites</span>
                    <span>R$ {auctionItem.perNight}/noite</span>
                  </div>
                  {auctionItem.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin size={14} />
                      {auctionItem.location}
                    </p>
                  )}
                </>
              )}

              {auctionItem.type === 'activity' && (
                <>
                  <h4 className="font-semibold font-['Outfit']">{auctionItem.name}</h4>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {auctionItem.activityDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(auctionItem.activityDate, 'dd/MM', { locale: ptBR })}
                      </span>
                    )}
                    {auctionItem.activityTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {auctionItem.activityTime}
                      </span>
                    )}
                    {auctionItem.activityDuration && (
                      <span>⏱️ {auctionItem.activityDuration}</span>
                    )}
                  </div>
                  {auctionItem.includes && auctionItem.includes.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Inclui: {auctionItem.includes.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Providers hint */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                🔍 Buscando em: {PROVIDERS[auctionItem.type].map(p => p.name).join(', ')}
              </p>
            </div>

            {/* Current Price */}
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">📊 Preço atual</span>
                <span className="text-foreground font-bold text-xl font-['Outfit']">
                  R$ {currentCost.toLocaleString()}
                </span>
              </div>
              {auctionItem.type === 'flight' && auctionItem.travelers && (
                <p className="text-xs text-muted-foreground">
                  R$ {Math.round(currentCost / auctionItem.travelers).toLocaleString()}/pessoa
                </p>
              )}
            </div>

            {/* Target Price Input */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Qual seu preço alvo?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <input
                  type="number"
                  value={targetPrice || ''}
                  onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-xl text-foreground text-xl font-semibold font-['Outfit'] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Potential Saving & Success Chance */}
            {targetPrice > 0 && targetPrice < currentCost && (
              <div className="space-y-2">
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <p className="text-sm">
                    💰 Economia potencial: <span className="text-primary font-bold">
                      R$ {(currentCost - targetPrice).toLocaleString()}
                    </span> ({Math.round((1 - targetPrice / currentCost) * 100)}%)
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-sm">
                    🎯 Chance de sucesso: <span className="text-amber-500 font-bold">{getSuccessChance()}%</span>
                  </p>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={startAuction}
              disabled={targetPrice <= 0 || targetPrice >= currentCost}
              className="w-full py-4 bg-gradient-to-r from-primary to-sky-500 text-primary-foreground rounded-xl font-semibold font-['Outfit'] disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              🔍 Buscar Ofertas
            </button>
          </div>
        )}

        {/* STEP 2: Competing Animation */}
        {step === 'competing' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-foreground font-semibold font-['Outfit']">🏷️ Fornecedores Competindo...</h3>
            
            <div className="bg-muted rounded-xl p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                Seu alvo: <span className="text-primary font-bold">R$ {targetPrice.toLocaleString()}</span>
              </p>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {competingOffers.map((offer, index) => (
                <div key={index} className="bg-muted rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground font-['Outfit']">{offer.provider}</span>
                    <span className="text-primary font-bold font-['Outfit']">R$ {offer.price.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-sky-500 transition-all duration-300"
                      style={{ width: `${offer.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Buscando melhor oferta...</span>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 'results' && bestOffer && (
          <div className="space-y-4 animate-fade-in max-h-[70vh] overflow-y-auto pr-1">
            <h3 className="text-foreground font-semibold font-['Outfit']">🎉 Ofertas Encontradas!</h3>

            {/* Best Offer */}
            <div className="bg-gradient-to-br from-primary/20 to-sky-500/20 border-2 border-primary rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                  🏆 MELHOR OFERTA
                </span>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg text-foreground font-['Outfit']">{bestOffer.provider}</h4>
                  {bestOffer.rating && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>{bestOffer.rating.toFixed(1)}</span>
                      <span>({bestOffer.reviewCount?.toLocaleString()} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary font-['Outfit']">
                    R$ {bestOffer.price.toLocaleString()}
                  </p>
                  {auctionItem.type === 'hotel' && (
                    <span className="text-xs text-muted-foreground">/noite</span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{bestOffer.details}</p>

              <div className="border-t border-border pt-3 mb-3">
                {/* Success Chance for best offer */}
                {(bestOffer as any).successChance && (
                  <div 
                    className="flex items-center gap-2 text-sm mb-2 px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: `${(bestOffer as any).successChance.color}15`,
                      color: (bestOffer as any).successChance.color 
                    }}
                  >
                    <TrendingUp size={14} />
                    <span className="font-bold">{(bestOffer as any).successChance.percent}%</span>
                    <span>Chance de sucesso — {(bestOffer as any).successChance.label}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Você pediu:</span>
                  <span className="text-foreground">R$ {targetPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Economia:</span>
                  <span className="text-primary font-medium">
                    R$ {(currentCost - bestOffer.price).toLocaleString()} ({Math.round((1 - bestOffer.price / currentCost) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Features */}
              {bestOffer.features && (
                <div className="space-y-1 mb-4">
                  {bestOffer.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={14} className="text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptOffer(bestOffer)}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-sky-500 text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  Aceitar Oferta <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setShowOtherOffers(!showOtherOffers)}
                  className="px-4 py-3 bg-muted border border-border rounded-xl text-foreground text-sm hover:border-primary transition-colors"
                >
                  {showOtherOffers ? 'Ocultar' : 'Ver Outras'}
                </button>
              </div>
            </div>

            {/* Other Offers */}
            {showOtherOffers && otherOffers.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Outras opções:</p>
                {otherOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-muted border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground font-['Outfit']">{offer.provider}</span>
                      <span className="text-primary font-bold font-['Outfit']">R$ {offer.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{offer.details}</p>
                    
                    {/* Success Chance Badge */}
                    {(offer as any).successChance && (
                      <div 
                        className="flex items-center gap-2 text-xs mb-2 px-2 py-1 rounded-lg w-fit"
                        style={{ 
                          backgroundColor: `${(offer as any).successChance.color}15`,
                          color: (offer as any).successChance.color 
                        }}
                      >
                        <TrendingUp size={12} />
                        <span className="font-semibold">{(offer as any).successChance.percent}%</span>
                        <span>{(offer as any).successChance.label}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleAcceptOffer(offer)}
                      className="w-full py-2 bg-card border border-border rounded-lg text-foreground text-sm flex items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary transition-colors"
                    >
                      Ver <ExternalLink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Real Viator Offers */}
            {(viatorResults.length > 0 || viatorLoading) && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground font-['Outfit'] flex items-center gap-2">
                    🌍 Ofertas Reais — Viator
                  </h4>
                  {viatorLoading && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 size={12} className="animate-spin" />
                      Buscando...
                    </span>
                  )}
                </div>

                {viatorResults.map((product) => (
                  <div
                    key={product.id}
                    className="bg-muted border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-foreground text-sm font-['Outfit'] line-clamp-2">
                          {product.title}
                        </h5>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {product.rating > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star size={10} className="text-amber-500 fill-amber-500" />
                              {product.rating.toFixed(1)} ({product.reviewCount})
                            </span>
                          )}
                          {product.duration && (
                            <span className="text-xs text-muted-foreground">⏱ {product.duration}</span>
                          )}
                          {product.freeCancellation && (
                            <span className="text-xs text-emerald-500 font-medium">✓ Cancelamento grátis</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-primary font-bold text-sm font-['Outfit']">
                            R$ {product.price.toLocaleString('pt-BR')}
                          </span>
                          <a
                            href={product.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1 font-medium"
                          >
                            Ver na Viator <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              {viatorResults.length > 0 
                ? 'Ofertas reais do Viator • Preços simulados das outras fontes • Links abrem em nova aba'
                : 'Preços simulados • Links abrem em nova aba'
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReverseAuctionModal;
