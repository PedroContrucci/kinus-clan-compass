import { format } from 'date-fns';
import { Plane, Tag, Pin, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlightCard } from '@/types/trip';

interface FlightAnchorCardProps {
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

export const FlightAnchorCard = ({
  type,
  flight,
  timezoneDiff,
  onSearchOffers,
}: FlightAnchorCardProps) => {
  const isOutbound = type === 'outbound';
  const statusColors = {
    planned: { bg: 'bg-muted/50', text: 'text-muted-foreground', label: '⚪ Planejado' },
    bidding: { bg: 'bg-[#eab308]/20', text: 'text-[#eab308]', label: '🟡 Em Leilão' },
    confirmed: { bg: 'bg-primary/20', text: 'text-primary', label: '🟢 Confirmado' },
  };
  
  const status = statusColors[flight.status];
  const isNextDay = flight.arrivalDate.getDate() !== flight.departureDate.getDate();

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
          ÂNCORA
        </span>
      </div>
      
      {/* Flight Path Visualization */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Origin */}
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground font-['Outfit']">
              {flight.originCode}
            </div>
            <div className="text-xs text-muted-foreground">{flight.origin}</div>
          </div>
          
          {/* Flight Path */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex items-center w-full">
              <div className="h-px flex-1 bg-border" />
              <div className="px-2 text-lg">✈️</div>
              <div className="h-px flex-1 bg-border relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                  {flight.duration}
                </span>
              </div>
            </div>
          </div>
          
          {/* Destination */}
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground font-['Outfit']">
              {flight.destinationCode}
            </div>
            <div className="text-xs text-muted-foreground">{flight.destination}</div>
          </div>
        </div>
        
        {/* Times */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="text-left">
            <div className="font-semibold text-foreground">{flight.departureTime}</div>
            <div className="text-xs text-muted-foreground">
              {format(flight.departureDate, 'EEE dd/MM', { locale: undefined })}
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground">
            {flight.stops === 0 ? 'Direto' : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-foreground">
              {flight.arrivalTime}
              {isNextDay && <span className="text-xs text-muted-foreground ml-1">+1</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(flight.arrivalDate, 'EEE dd/MM', { locale: undefined })}
            </div>
          </div>
        </div>
        
        {/* Airline & Price */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {flight.airline} {flight.flightNumber} • {flight.stops === 0 ? 'Direto' : `${flight.stops} escala`} • Econômica
          </div>
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground font-['Outfit']">
              💰 R$ {flight.pricePerPerson.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground"> /pessoa</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Total: </span>
            <span className="font-semibold text-foreground">
              R$ {flight.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Arrival Info for Outbound */}
        {isOutbound && timezoneDiff !== undefined && (
          <div className="mt-3 p-3 bg-muted/30 rounded-xl text-sm">
            <span className="text-muted-foreground">⏰ Chegada em {flight.destination}: </span>
            <span className="text-foreground font-medium">
              {format(flight.arrivalDate, 'EEE dd/MM')} às {flight.arrivalTime}
            </span>
            <span className="text-muted-foreground"> (horário local — fuso {timezoneDiff >= 0 ? '+' : ''}{timezoneDiff}h)</span>
          </div>
        )}
        
        {/* Tip for Return */}
        {!isOutbound && (
          <div className="mt-3 p-3 bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg text-sm">
            <span className="text-foreground">
              💡 "Voo noturno é ótimo — você chega de manhã e ainda tem o domingo pra descansar!" 🌿
            </span>
          </div>
        )}
      </div>
      
      {/* Status & Actions */}
      <div className="px-4 py-3 bg-muted/20 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className={cn("text-sm font-medium", status.text)}>
            Status: {status.label}
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onSearchOffers}
            className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-primary to-[#0ea5e9] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Tag size={14} />
            🏷️ Buscar Ofertas
          </button>
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

export default FlightAnchorCard;
