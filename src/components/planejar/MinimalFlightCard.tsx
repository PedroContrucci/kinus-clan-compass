import { useState } from 'react';
import { format } from 'date-fns';
import { Plane, Tag, Pin, RotateCcw, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

interface MinimalFlightCardProps {
  type: 'outbound' | 'return';
  flight: {
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departureDate: Date;
    departureTime: string;
    arrivalDate: Date;
    arrivalTime: string;
    duration: string;
    airline: string;
    flightNumber: string;
    stops: number;
    pricePerPerson: number;
    totalPrice: number;
    travelers: number;
    status: 'planned' | 'bidding' | 'confirmed';
  };
  timezoneDiff?: number;
  onSearchOffers?: () => void;
}

interface AuctionOffer {
  provider: string;
  price: number;
  airline: string;
  features: string;
  isBest?: boolean;
}

export const MinimalFlightCard = ({
  type,
  flight,
  timezoneDiff,
  onSearchOffers,
}: MinimalFlightCardProps) => {
  const [auctionOpen, setAuctionOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [auctionState, setAuctionState] = useState<'input' | 'searching' | 'results'>('input');
  const [offers, setOffers] = useState<AuctionOffer[]>([]);
  const [acceptedOffer, setAcceptedOffer] = useState<AuctionOffer | null>(null);

  const isOutbound = type === 'outbound';
  const isNextDay = flight.arrivalDate.getDate() !== flight.departureDate.getDate();

  const statusStyles = {
    planned: { text: 'text-muted-foreground', label: '⚪ Planejado' },
    bidding: { text: 'text-[#eab308]', label: '🟡 Em Leilão' },
    confirmed: { text: 'text-primary', label: '🟢 Confirmado' },
  };

  const status = statusStyles[acceptedOffer ? 'confirmed' : flight.status];

  const handleActivateAuction = () => {
    setAuctionOpen(true);
    setAuctionState('input');
    setTargetPrice(String(Math.round(flight.totalPrice * 0.85)));
  };

  const handleSearchOffers = () => {
    setAuctionState('searching');
    setTimeout(() => {
      const mockOffers: AuctionOffer[] = [
        {
          provider: 'Skyscanner',
          price: Math.round(flight.totalPrice * 0.82),
          airline: 'TAP Portugal',
          features: '1 escala • Bagagem 23kg',
          isBest: true,
        },
        {
          provider: 'Google Flights',
          price: Math.round(flight.totalPrice * 0.88),
          airline: flight.airline,
          features: 'Direto • Econômica',
        },
        {
          provider: 'Kayak',
          price: Math.round(flight.totalPrice * 0.95),
          airline: 'Air France',
          features: 'Direto • Flex',
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

  const displayPrice = acceptedOffer ? acceptedOffer.price : flight.totalPrice;
  const displayPricePerPerson = Math.round(displayPrice / flight.travelers);

  return (
    <div 
      className={cn(
        "bg-card border rounded-2xl overflow-hidden transition-all",
        "border-t-4",
        isOutbound ? "border-t-primary" : "border-t-[#0ea5e9]",
        "border-x-border border-b-border"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Plane 
            size={18} 
            className={cn(
              isOutbound ? "text-primary" : "text-[#0ea5e9] rotate-180"
            )} 
          />
          <span className="font-semibold text-foreground font-['Outfit']">
            {isOutbound ? '✈️ VOO DE IDA' : '✈️ VOO DE VOLTA'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          ⚓ ÂNCORA
        </span>
      </div>
      
      {/* Flight Route */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-foreground font-['Outfit']">
            {flight.originCode}
          </span>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="h-px flex-1 bg-border" />
            <span className="px-2">→</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <span className="text-2xl font-bold text-foreground font-['Outfit']">
            {flight.destinationCode}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>{flight.origin}</span>
          <span>{flight.destination}</span>
        </div>
        
        {/* Times & Details */}
        <div className="bg-muted/30 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-foreground font-semibold">📅 {format(flight.departureDate, 'EEE dd/MM')}</span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="text-foreground">🕐 {flight.departureTime}</span>
              <span className="text-muted-foreground mx-1">→</span>
              <span className="text-foreground">{flight.arrivalTime}</span>
              {isNextDay && <span className="text-xs text-[#eab308] ml-1">+1</span>}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            ⏱️ {flight.duration} voo • {flight.airline} {flight.flightNumber} • {flight.stops === 0 ? 'Direto' : `${flight.stops} escala`}
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-foreground font-['Outfit']">
              💰 R$ {displayPricePerPerson.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground"> /pessoa</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total: </span>
            <span className="font-semibold text-foreground font-['Outfit']">
              R$ {displayPrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">({flight.travelers} pessoas)</span>
          </div>
        </div>

        {/* Accepted Offer Info */}
        {acceptedOffer && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                🟢 Fechado via {acceptedOffer.provider}
              </span>
              <span className="text-primary font-medium">
                Economia: R$ {(flight.totalPrice - acceptedOffer.price).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        
        {/* Arrival Info for Outbound */}
        {isOutbound && timezoneDiff !== undefined && (
          <div className="text-sm text-muted-foreground mb-3">
            ⏰ Chegada em {flight.destination}: {format(flight.arrivalDate, 'EEE dd/MM')} às {flight.arrivalTime}
            <span className="ml-1">(fuso {timezoneDiff >= 0 ? '+' : ''}{timezoneDiff}h)</span>
          </div>
        )}
        
        {/* Tip for Return */}
        {!isOutbound && !acceptedOffer && (
          <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg p-3 mb-3 text-sm">
            💡 "Voo noturno é ótimo — você chega de manhã e ainda tem o domingo pra descansar!" 🌿
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
                      🏷️ LEILÃO REVERSO — VOO
                    </span>
                    <button onClick={() => setAuctionOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimativa atual:</span>
                      <span className="text-foreground font-medium">R$ {flight.totalPrice.toLocaleString()}</span>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">
                        Qual seu preço alvo? (total)
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            className="pl-10 bg-background"
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
                  <p className="text-muted-foreground text-sm">Buscando voos...</p>
                </div>
              )}

              {auctionState === 'results' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-[#eab308] font-['Outfit']">
                      🏷️ OFERTAS DE VOO
                    </span>
                    <button onClick={() => setAuctionOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={16} />
                    </button>
                  </div>
                  
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
                          <div>
                            <span className="font-medium text-foreground">{offer.provider}</span>
                            <span className="text-xs text-muted-foreground ml-2">• {offer.airline}</span>
                          </div>
                          <span className="font-bold text-foreground font-['Outfit']">
                            R$ {offer.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{offer.features}</span>
                          {offer.isBest && (
                            <span className="text-primary">
                              Economia: R$ {(flight.totalPrice - offer.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAcceptOffer(offer)}
                          className={cn(
                            "w-full mt-2 py-1.5 rounded-lg text-xs font-medium",
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
      </div>
      
      {/* Status & Actions */}
      <div className="px-4 py-3 bg-muted/20 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className={cn("text-sm font-medium", status.text)}>
            Status: {status.label}
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {!acceptedOffer && (
            <button
              onClick={handleActivateAuction}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              <Tag size={14} />
              🏷️ Ativar Leilão
            </button>
          )}
          
          {acceptedOffer && (
            <button className="flex items-center gap-1 px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-medium">
              <ExternalLink size={14} />
              📎 Ver Reserva
            </button>
          )}
          
          <button className="flex items-center gap-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground hover:border-primary transition-colors">
            <Pin size={14} />
            📌 Fixar
          </button>
          <button className="flex items-center gap-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground hover:border-primary transition-colors">
            <RotateCcw size={14} />
            🔄 Alterar Voo
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalFlightCard;
