import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Plane, Hotel, MapPin, Clock, Calendar } from 'lucide-react';
import { Offer } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  onStartMonitoring?: (data: { activity: any; targetPrice: number }) => void;
  // Real trip data for deep links
  tripStartDate?: Date;
  tripEndDate?: Date;
  cityName?: string;
}

const ReverseAuctionModal = ({
  isOpen,
  onClose,
  item,
  activityName,
  estimatedPrice = 280,
  tripStartDate,
  tripEndDate,
  cityName,
}: ReverseAuctionModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const auctionItem: AuctionItem = item || {
    type: 'activity' as AuctionItemType,
    id: 'legacy',
    name: activityName || 'Atividade',
    cost: estimatedPrice,
  };

  const currentCost = auctionItem.cost;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  const getTypeIcon = () => {
    switch (auctionItem.type) {
      case 'flight': return <Plane size={20} className="text-sky-400" />;
      case 'hotel': return <Hotel size={20} className="text-purple-400" />;
      case 'activity': return <MapPin size={20} className="text-primary" />;
      default: return <MapPin size={20} className="text-primary" />;
    }
  };

  const getTypeLabel = () => {
    switch (auctionItem.type) {
      case 'flight': return 'Voo';
      case 'hotel': return 'Hospedagem';
      case 'activity': return 'Passeio';
      default: return 'Item';
    }
  };

  const getCategoryBadgeClass = () => {
    switch (auctionItem.type) {
      case 'flight': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'hotel': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'activity': return 'bg-primary/10 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const effectiveStartDate = tripStartDate || auctionItem.departureDate || auctionItem.checkIn || auctionItem.activityDate;
  const effectiveEndDate = tripEndDate || auctionItem.checkOut;
  const effectiveCity = cityName || destination || auctionItem.location || auctionItem.destination || auctionItem.name;

  const buildDeepLinks = () => {
    const links: { name: string; description: string; url: string }[] = [];

    switch (auctionItem.type) {
      case 'flight': {
        const origin = (auctionItem.originCode || '').toUpperCase();
        const dest = (auctionItem.destinationCode || '').toUpperCase();
        const travelers = auctionItem.travelers || 1;
        const start = effectiveStartDate ? format(effectiveStartDate, 'yyyy-MM-dd') : '';
        const end = effectiveEndDate ? format(effectiveEndDate, 'yyyy-MM-dd') : '';

        if (origin && dest && start && end) {
          links.push({
            name: 'Google Flights',
            description: 'Busca já preenchida com sua rota e datas',
            url: `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${dest}%20on%20${start}%20through%20${end}`,
          });
        }

        const startYY = effectiveStartDate ? format(effectiveStartDate, 'yyMMdd') : '';
        const endYY = effectiveEndDate ? format(effectiveEndDate, 'yyMMdd') : '';
        if (origin && dest && startYY && endYY) {
          links.push({
            name: 'Skyscanner',
            description: 'Busca já preenchida com sua rota e datas',
            url: `https://www.skyscanner.com.br/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${startYY}/${endYY}/?adults=${travelers}`,
          });
        }
        break;
      }
      case 'hotel': {
        const city = effectiveCity || '';
        const checkin = effectiveStartDate ? format(effectiveStartDate, 'yyyy-MM-dd') : '';
        const checkout = effectiveEndDate ? format(effectiveEndDate, 'yyyy-MM-dd') : '';
        const travelers = auctionItem.travelers || 1;
        if (city && checkin && checkout) {
          links.push({
            name: 'Booking.com',
            description: 'Busca já preenchida com sua rota e datas',
            url: `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(city)}&checkin=${checkin}&checkout=${checkout}&group_adults=${travelers}`,
          });
        }
        break;
      }
      case 'activity': {
        const city = effectiveCity || '';
        if (city) {
          links.push({
            name: 'Viator',
            description: 'Busca já preenchida com sua rota e datas',
            url: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(city)}`,
          });
        }
        break;
      }
    }

    return links;
  };

  const deepLinks = buildDeepLinks();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md mx-auto max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-['Outfit'] text-lg flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2",
                getCategoryBadgeClass()
              )}>
                {getTypeIcon()}
                <span>Central de Ofertas — {getTypeLabel()}</span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isVisible && (
          <div className="space-y-4 animate-fade-in max-h-[70vh] overflow-y-auto pr-1">
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
                    {auctionItem.departureTime && auctionItem.arrivalTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {auctionItem.departureTime} → {auctionItem.arrivalTime}
                      </span>
                    )}
                    {auctionItem.duration && (
                      <span>⏱️ {auctionItem.duration}</span>
                    )}
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
                    {auctionItem.nights && (
                      <span>🛏️ {auctionItem.nights} noites</span>
                    )}
                    {auctionItem.perNight && (
                      <span>R$ {auctionItem.perNight}/noite</span>
                    )}
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

            {/* Partner Cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground font-['Outfit']">
                Parceiros com busca pré-preenchida
              </h3>
              {deepLinks.map((link) => (
                <div
                  key={link.name}
                  className="bg-muted border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-foreground font-['Outfit']">{link.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
                  <button
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                    className="w-full py-3 bg-gradient-to-r from-primary to-sky-500 text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                  >
                    Abrir ofertas <ExternalLink size={16} />
                  </button>
                </div>
              ))}
              {deepLinks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Não foi possível gerar links de busca — dados da viagem incompletos.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReverseAuctionModal;
