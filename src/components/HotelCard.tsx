import { Building, Tag, ExternalLink } from 'lucide-react';
import { HotelCard as HotelCardType, ActivityStatus } from '@/types/trip';

interface HotelCardProps {
  hotel: HotelCardType;
  onOpenAuction: () => void;
  onChangeHotel?: () => void;
}

const getStatusBadge = (status: ActivityStatus) => {
  switch (status) {
    case 'confirmed':
      return { label: '🟢 Confirmado', bg: 'bg-[#10b981]/20', border: 'border-[#10b981]' };
    case 'bidding':
      return { label: '🟡 Em Leilão', bg: 'bg-[#eab308]/20', border: 'border-[#eab308]', pulse: true };
    case 'cancelled':
      return { label: '🔴 Cancelado', bg: 'bg-red-500/20', border: 'border-red-500' };
    default:
      return { label: '⚪ Planejado', bg: 'bg-[#64748b]/20', border: 'border-[#64748b]' };
  }
};

const getStars = (count: number) => {
  return '⭐'.repeat(count);
};

const HotelCard = ({ hotel, onOpenAuction, onChangeHotel }: HotelCardProps) => {
  const statusBadge = getStatusBadge(hotel.status);

  return (
    <div className={`bg-[#1e293b] border ${statusBadge.border} rounded-2xl p-4 mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0ea5e9]/20 rounded-lg flex items-center justify-center">
            <Building size={18} className="text-[#0ea5e9]" />
          </div>
          <span className="text-xs text-[#94a3b8] uppercase font-medium">
            🏨 Hospedagem
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[#0f172a] text-[#94a3b8]">Card fixo</span>
      </div>

      {/* Hotel Info */}
      <div className="mb-3">
        <h4 className="font-bold text-[#f8fafc] font-['Outfit']">
          {hotel.name} <span className="text-sm font-normal">{getStars(hotel.stars)}</span>
        </h4>
        <p className="text-sm text-[#94a3b8]">
          Check-in: {hotel.checkIn} | Check-out: {hotel.checkOut}
        </p>
      </div>

      {/* Pricing */}
      <div className="bg-[#0f172a] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#94a3b8]">Diária</span>
          <span className="text-[#f8fafc]">R$ {hotel.nightlyRate.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#94a3b8]">Noites</span>
          <span className="text-[#f8fafc]">{hotel.totalNights}</span>
        </div>
        <div className="border-t border-[#334155] mt-2 pt-2 flex items-center justify-between">
          <span className="text-[#94a3b8] font-medium">Total</span>
          <span className="text-lg font-bold text-[#10b981]">R$ {hotel.totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs px-3 py-1 rounded-full ${statusBadge.bg} ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {hotel.status === 'confirmed' && hotel.confirmationLink ? (
          <button
            onClick={() => window.open(hotel.confirmationLink, '_blank')}
            className="flex-1 py-2 bg-[#10b981]/20 border border-[#10b981] rounded-xl text-[#10b981] text-sm flex items-center justify-center gap-2"
          >
            Ver Reserva <ExternalLink size={14} />
          </button>
        ) : (
          <button
            onClick={onOpenAuction}
            className="flex-1 py-2 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-sm flex items-center justify-center gap-2 hover:border-[#10b981] transition-colors"
          >
            <Tag size={14} />
            Ver Ofertas
          </button>
        )}
        {onChangeHotel && (
          <button
            onClick={onChangeHotel}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-xl text-[#94a3b8] text-sm hover:text-[#f8fafc] hover:border-[#334155] transition-colors"
          >
            Alterar Hotel
          </button>
        )}
      </div>
    </div>
  );
};

export default HotelCard;
