import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Plane, Building, MapPin, Check, Star, ArrowLeft } from 'lucide-react';
import { Offer } from '@/types/trip';

interface ReverseAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  activityType: string;
  destination: string;
  estimatedPrice?: number;
  onAcceptOffer?: (offer: Offer) => void;
}

const flightOffers: Offer[] = [
  { id: 'f1', provider: 'LATAM', price: 3200, originalPrice: 3800, details: 'GRU → CDG • Direto • 11h', rating: 4.5, reviewCount: 2340, features: ['Bagagem inclusa', 'Refeição inclusa'], link: 'https://latam.com' },
  { id: 'f2', provider: 'Air France', price: 3450, originalPrice: 3900, details: 'GRU → CDG • 1 parada • 14h', rating: 4.7, reviewCount: 5621, features: ['Entretenimento a bordo', 'Wi-Fi disponível'], link: 'https://airfrance.com' },
  { id: 'f3', provider: 'TAP', price: 2980, originalPrice: 3400, details: 'GRU → CDG • 1 parada • 16h', rating: 4.2, reviewCount: 1892, features: ['Cancelamento flexível'], link: 'https://flytap.com' },
];

const hotelOffers: Offer[] = [
  { id: 'h1', provider: 'Hotel Le Marais', price: 450, originalPrice: 520, details: '⭐⭐⭐⭐ • Café incluso', rating: 4.6, reviewCount: 892, features: ['Wi-Fi grátis', 'Central'], link: 'https://booking.com' },
  { id: 'h2', provider: 'Ibis Bastille', price: 280, originalPrice: 320, details: '⭐⭐⭐ • Central', rating: 4.1, reviewCount: 2341, features: ['Check-in 24h'], link: 'https://booking.com' },
  { id: 'h3', provider: 'Grand Hôtel', price: 720, originalPrice: 890, details: '⭐⭐⭐⭐⭐ • Spa & Pool', rating: 4.9, reviewCount: 567, features: ['Spa incluso', 'Vista panorâmica'], link: 'https://booking.com' },
];

const activityOffers: Offer[] = [
  { id: 'a1', provider: 'GetYourGuide', price: 265, originalPrice: 320, details: 'Tour guiado • 3h • Português', rating: 4.8, reviewCount: 1234, features: ['Cancelamento grátis até 24h', 'Guia em português'], link: 'https://getyourguide.com' },
  { id: 'a2', provider: 'Civitatis', price: 242, originalPrice: 280, details: 'Tour em grupo • 2.5h', rating: 4.5, reviewCount: 876, features: ['Grupo pequeno', 'Ingresso incluso'], link: 'https://civitatis.com' },
  { id: 'a3', provider: 'Viator', price: 228, originalPrice: 295, details: 'Tour privado • 4h', rating: 4.7, reviewCount: 543, features: ['Tour privado', 'Horário flexível'], link: 'https://viator.com' },
  { id: 'a4', provider: 'TourByLocals', price: 195, originalPrice: 280, details: 'Guia local • 3h', rating: 4.9, reviewCount: 892, features: ['Cancelamento grátis até 24h', 'Guia em português', 'Ingresso sem fila'], link: 'https://tourbylocals.com' },
];

type AuctionStep = 'target' | 'competing' | 'results';
type TabType = 'voos' | 'hoteis' | 'passeios';

const ReverseAuctionModal = ({ 
  isOpen, 
  onClose, 
  activityName, 
  activityType, 
  destination,
  estimatedPrice = 280,
  onAcceptOffer
}: ReverseAuctionModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('passeios');
  const [step, setStep] = useState<AuctionStep>('target');
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [competingOffers, setCompetingOffers] = useState<{ provider: string; price: number; progress: number }[]>([]);
  const [bestOffer, setBestOffer] = useState<Offer | null>(null);
  const [showOtherOffers, setShowOtherOffers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('target');
      setTargetPrice(Math.round(estimatedPrice * 0.85));
      setShowOtherOffers(false);
    }
  }, [isOpen, estimatedPrice]);

  const getOffers = (): Offer[] => {
    switch (activeTab) {
      case 'voos':
        return flightOffers;
      case 'hoteis':
        return hotelOffers;
      case 'passeios':
        return activityOffers;
      default:
        return activityOffers;
    }
  };

  const getEstimatedPrice = (): number => {
    switch (activeTab) {
      case 'voos':
        return 3200;
      case 'hoteis':
        return 450;
      case 'passeios':
        return estimatedPrice;
      default:
        return estimatedPrice;
    }
  };

  const startAuction = () => {
    setStep('competing');
    const offers = getOffers();
    
    // Simulate competition animation
    const providers = offers.map(o => ({ provider: o.provider, price: o.originalPrice || o.price + 100, progress: 0 }));
    setCompetingOffers(providers);

    // Animate progress bars
    let iteration = 0;
    const interval = setInterval(() => {
      iteration++;
      setCompetingOffers(prev => 
        prev.map((p, i) => ({
          ...p,
          price: Math.max(offers[i].price, p.price - Math.floor(Math.random() * 20)),
          progress: Math.min(100, p.progress + Math.floor(Math.random() * 30) + 10)
        }))
      );

      if (iteration >= 6) {
        clearInterval(interval);
        // Find best offer
        const sorted = [...offers].sort((a, b) => a.price - b.price);
        setBestOffer(sorted[0]);
        setTimeout(() => setStep('results'), 500);
      }
    }, 400);
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
    const estimated = getEstimatedPrice();
    const diff = ((estimated - targetPrice) / estimated) * 100;
    if (diff <= 10) return 92;
    if (diff <= 15) return 73;
    if (diff <= 20) return 54;
    if (diff <= 30) return 32;
    return 15;
  };

  const getTitle = (): string => {
    switch (activeTab) {
      case 'voos':
        return `✈️ Voos para ${destination}`;
      case 'hoteis':
        return `🏨 Hotéis em ${destination}`;
      case 'passeios':
        return `🎯 ${activityName}`;
    }
  };

  const allOffers = getOffers();
  const otherOffers = allOffers.filter(o => o.id !== bestOffer?.id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-md mx-auto max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-['Outfit'] text-lg flex items-center gap-2">
            {step !== 'target' && (
              <button onClick={() => setStep('target')} className="p-1 hover:bg-[#334155] rounded">
                <ArrowLeft size={18} />
              </button>
            )}
            🏷️ Leilão Reverso
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Target Price */}
        {step === 'target' && (
          <div className="space-y-4 animate-fade-in">
            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'voos' as const, label: '✈️ Voos' },
                { id: 'hoteis' as const, label: '🏨 Hotéis' },
                { id: 'passeios' as const, label: '🎯 Passeios' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setTargetPrice(Math.round(getEstimatedPrice() * 0.85));
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#10b981] text-white'
                      : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <h3 className="text-[#f8fafc] font-semibold font-['Outfit']">{getTitle()}</h3>

            {/* Estimated Price */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#94a3b8] text-sm">📊 Estimativa KINU</span>
                <span className="text-[#f8fafc] font-bold text-xl">R$ {getEstimatedPrice().toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#94a3b8]">Baseado em 1.2k reservas do clã</p>
            </div>

            {/* Target Price Input */}
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Qual seu preço alvo?</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">R$</span>
                <input
                  type="number"
                  value={targetPrice || ''}
                  onChange={(e) => setTargetPrice(parseInt(e.target.value) || 0)}
                  className="w-full pl-12 pr-4 py-4 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
            </div>

            {/* Success Chance */}
            {targetPrice > 0 && (
              <div className="bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl p-3">
                <p className="text-sm text-[#f8fafc]">
                  💡 <span className="text-[#eab308]">{Math.round((1 - targetPrice / getEstimatedPrice()) * 100)}% abaixo</span> da estimativa tem <span className="text-[#10b981] font-bold">{getSuccessChance()}%</span> de chance de sucesso!
                </p>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={startAuction}
              disabled={targetPrice <= 0}
              className="w-full py-4 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold font-['Outfit'] disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#10b981]/30"
            >
              Iniciar Leilão →
            </button>
          </div>
        )}

        {/* STEP 2: Competing Animation */}
        {step === 'competing' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-[#f8fafc] font-semibold font-['Outfit']">🏷️ Fornecedores Competindo...</h3>
            
            <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-3 mb-4">
              <p className="text-sm text-[#94a3b8]">Seu alvo: <span className="text-[#10b981] font-bold">R$ {targetPrice.toLocaleString()}</span></p>
            </div>

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {competingOffers.map((offer, index) => (
                <div key={index} className="bg-[#0f172a] border border-[#334155] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#f8fafc] font-['Outfit']">{offer.provider}</span>
                    <span className="text-[#10b981] font-bold">R$ {offer.price.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#334155] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#10b981] to-[#0ea5e9] transition-all duration-300"
                      style={{ width: `${offer.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 text-[#94a3b8]">
              <div className="w-4 h-4 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Buscando melhor oferta...</span>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 'results' && bestOffer && (
          <div className="space-y-4 animate-fade-in max-h-[70vh] overflow-y-auto pr-1">
            <h3 className="text-[#f8fafc] font-semibold font-['Outfit']">🎉 Encontramos uma oferta!</h3>

            {/* Best Offer */}
            <div className="bg-gradient-to-br from-[#10b981]/20 to-[#0ea5e9]/20 border-2 border-[#10b981] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded-full font-medium">🏆 MELHOR OFERTA</span>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-lg text-[#f8fafc] font-['Outfit']">{bestOffer.provider}</h4>
                  {bestOffer.rating && (
                    <div className="flex items-center gap-1 text-sm text-[#94a3b8]">
                      <Star size={14} className="text-[#eab308] fill-[#eab308]" />
                      <span>{bestOffer.rating}</span>
                      <span>({bestOffer.reviewCount?.toLocaleString()} reviews)</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#10b981]">R$ {bestOffer.price.toLocaleString()}</p>
                  {activeTab === 'hoteis' && <span className="text-xs text-[#94a3b8]">/noite</span>}
                </div>
              </div>

              <div className="border-t border-[#334155] pt-3 mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#94a3b8]">Você pediu:</span>
                  <span className="text-[#f8fafc]">R$ {targetPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94a3b8]">Economia:</span>
                  <span className="text-[#10b981] font-medium">
                    R$ {((bestOffer.originalPrice || getEstimatedPrice()) - bestOffer.price).toLocaleString()} ({Math.round((1 - bestOffer.price / (bestOffer.originalPrice || getEstimatedPrice())) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Features */}
              {bestOffer.features && (
                <div className="space-y-1 mb-4">
                  {bestOffer.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#f8fafc]">
                      <Check size={14} className="text-[#10b981]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptOffer(bestOffer)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  Aceitar Oferta <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setShowOtherOffers(!showOtherOffers)}
                  className="px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-sm hover:border-[#10b981] transition-colors"
                >
                  {showOtherOffers ? 'Ocultar' : 'Ver Outras'}
                </button>
              </div>
            </div>

            {/* Other Offers */}
            {showOtherOffers && (
              <div className="space-y-3">
                <p className="text-sm text-[#94a3b8]">Outras opções:</p>
                {otherOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#0f172a] border border-[#334155] rounded-xl p-3 hover:border-[#10b981]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#f8fafc] font-['Outfit']">{offer.provider}</span>
                      <span className="text-[#10b981] font-bold">R$ {offer.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-2">{offer.details}</p>
                    <button
                      onClick={() => handleAcceptOffer(offer)}
                      className="w-full py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] text-sm flex items-center justify-center gap-2 hover:bg-[#10b981]/20 hover:border-[#10b981] transition-colors"
                    >
                      Ver <ExternalLink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-[#94a3b8] text-center">
              Preços simulados • Links abrem em nova aba
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReverseAuctionModal;
