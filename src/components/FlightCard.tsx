import { Plane, Tag } from 'lucide-react';
import { FlightCard as FlightCardType, ActivityStatus } from '@/types/trip';

interface FlightCardProps {
  flight: FlightCardType;
  type: 'outbound' | 'return';
  onOpenAuction: () => void;
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

const FlightCard = ({ flight, type, onOpenAuction }: FlightCardProps) => {
  const statusBadge = getStatusBadge(flight.status);

  return (
    <div className={`bg-[#1e293b] border ${statusBadge.border} rounded-2xl p-4 mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#10b981]/20 rounded-lg flex items-center justify-center">
            <Plane size={18} className="text-[#10b981]" />
          </div>
          <span className="text-xs text-[#94a3b8] uppercase font-medium">
            {type === 'outbound' ? '✈️ Voo de Chegada' : '✈️ Voo de Retorno'}
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[#0f172a] text-[#94a3b8]">Âncora</span>
      </div>

      {/* Flight Info */}
      <div className="mb-3">
        <h4 className="font-bold text-[#f8fafc] font-['Outfit']">
          {flight.airline} {flight.flightNumber}
        </h4>
        <p className="text-sm text-[#94a3b8]">
          {flight.origin} → {flight.destination}
        </p>
      </div>

      {/* Times */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div>
          <p className="text-[#f8fafc] font-medium">{flight.departureTime}</p>
          <p className="text-xs text-[#94a3b8]">{flight.departureDate}</p>
        </div>
        <div className="flex-1 mx-4 border-t border-dashed border-[#334155] relative">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1e293b] px-2 text-xs text-[#94a3b8]">
            {flight.duration} • {flight.stops === 0 ? 'Direto' : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[#f8fafc] font-medium">{flight.arrivalTime}</p>
          <p className="text-xs text-[#94a3b8]">{flight.arrivalDate}</p>
        </div>
      </div>

      {/* Price & Status */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-[#10b981]">R$ {flight.price.toLocaleString()}</span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${statusBadge.bg} ${statusBadge.pulse ? 'animate-pulse' : ''}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Action */}
      {flight.status !== 'confirmed' && (
        <button
          onClick={onOpenAuction}
          className="w-full mt-4 py-2 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] text-sm flex items-center justify-center gap-2 hover:border-[#10b981] transition-colors"
        >
          <Tag size={14} />
          Buscar Ofertas
        </button>
      )}

      {flight.status === 'confirmed' && flight.confirmationLink && (
        <button
          onClick={() => window.open(flight.confirmationLink, '_blank')}
          className="w-full mt-4 py-2 bg-[#10b981]/20 border border-[#10b981] rounded-xl text-[#10b981] text-sm"
        >
          Ver Reserva
        </button>
      )}
    </div>
  );
};

export default FlightCard;
