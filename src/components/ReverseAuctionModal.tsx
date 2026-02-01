import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, Plane, Building, MapPin } from 'lucide-react';

interface Offer {
  provider: string;
  price: number;
  details: string;
  link: string;
}

interface ReverseAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  activityType: string;
  destination: string;
}

const flightOffers: Offer[] = [
  { provider: 'LATAM', price: 3200, details: 'GRU → CDG • Direto • 11h', link: 'https://latam.com' },
  { provider: 'Air France', price: 3450, details: 'GRU → CDG • 1 parada • 14h', link: 'https://airfrance.com' },
  { provider: 'TAP', price: 2980, details: 'GRU → CDG • 1 parada • 16h', link: 'https://flytap.com' },
];

const hotelOffers: Offer[] = [
  { provider: 'Hotel Le Marais', price: 450, details: '⭐⭐⭐⭐ • Café incluso', link: 'https://booking.com' },
  { provider: 'Ibis Bastille', price: 280, details: '⭐⭐⭐ • Central', link: 'https://booking.com' },
  { provider: 'Grand Hôtel', price: 720, details: '⭐⭐⭐⭐⭐ • Spa & Pool', link: 'https://booking.com' },
];

const activityOffers: Offer[] = [
  { provider: 'GetYourGuide', price: 89, details: 'Tour guiado • 3h • Português', link: 'https://getyourguide.com' },
  { provider: 'Civitatis', price: 75, details: 'Tour em grupo • 2.5h', link: 'https://civitatis.com' },
  { provider: 'Viator', price: 95, details: 'Tour privado • 4h', link: 'https://viator.com' },
];

const ReverseAuctionModal = ({ isOpen, onClose, activityName, activityType, destination }: ReverseAuctionModalProps) => {
  const [activeTab, setActiveTab] = useState<'voos' | 'hoteis' | 'passeios'>('passeios');

  const getOffers = () => {
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

  const getIcon = () => {
    switch (activeTab) {
      case 'voos':
        return <Plane size={20} />;
      case 'hoteis':
        return <Building size={20} />;
      case 'passeios':
        return <MapPin size={20} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'voos':
        return `✈️ Ofertas de Voo para ${destination}`;
      case 'hoteis':
        return `🏨 Ofertas de Hotel em ${destination}`;
      case 'passeios':
        return `🎯 Ofertas para ${activityName}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-md mx-auto max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-['Outfit'] text-lg flex items-center gap-2">
            🏷️ Leilão Reverso
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'voos' as const, label: '✈️ Voos', icon: Plane },
            { id: 'hoteis' as const, label: '🏨 Hotéis', icon: Building },
            { id: 'passeios' as const, label: '🎯 Passeios', icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        <h3 className="text-[#f8fafc] font-semibold mb-4 font-['Outfit']">{getTitle()}</h3>

        {/* Offers List */}
        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
          {getOffers().map((offer, index) => (
            <div
              key={index}
              className="bg-[#0f172a] border border-[#334155] rounded-xl p-4 hover:border-[#10b981]/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#f8fafc] font-['Outfit']">{offer.provider}</span>
                <span className="text-[#10b981] font-bold">
                  R$ {offer.price.toLocaleString()}
                  {activeTab === 'hoteis' && <span className="text-xs text-[#94a3b8]">/noite</span>}
                </span>
              </div>
              <p className="text-sm text-[#94a3b8] mb-3">{offer.details}</p>
              <button
                onClick={() => window.open(offer.link, '_blank')}
                className="w-full py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#10b981]/20 hover:border-[#10b981] transition-colors"
              >
                Ver <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-[#94a3b8] text-center mt-4">
          Preços simulados • Links abrem em nova aba
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ReverseAuctionModal;
