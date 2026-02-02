import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plane, Tag, Pin, RotateCcw, Brain, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  jetLagMode?: boolean;
  firstActivityTime?: string;
  onSearchOffers?: () => void;
  onChangeFlight?: () => void;
}

export const FlightAnchorCard = ({
  type,
  flight,
  timezoneDiff = 0,
  jetLagMode = false,
  firstActivityTime,
  onSearchOffers,
  onChangeFlight,
}: FlightAnchorCardProps) => {
  const isOutbound = type === 'outbound';
  const statusColors = {
    planned: { bg: 'bg-muted/50', text: 'text-muted-foreground', label: '⚪ Planejado', icon: '⚪' },
    bidding: { bg: 'bg-amber-500/20', text: 'text-amber-500', label: '🟡 Em Leilão', icon: '🟡' },
    confirmed: { bg: 'bg-primary/20', text: 'text-primary', label: '🟢 Confirmado', icon: '🟢' },
  };
  
  const status = statusColors[flight.status];
  const isNextDay = flight.arrivalDate.getDate() !== flight.departureDate.getDate();
  const showJetLagAlert = isOutbound && jetLagMode && Math.abs(timezoneDiff) >= 3;

  return (
    <div 
      className={cn(
        "bg-card border-2 rounded-2xl overflow-hidden transition-all",
        isOutbound ? "border-primary" : "border-sky-500",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Plane 
            size={18} 
            className={cn(
              isOutbound ? "text-primary" : "text-sky-500 rotate-180"
            )} 
          />
          <span className="font-semibold text-foreground font-['Outfit']">
            {isOutbound ? '✈️ VOO DE IDA' : '✈️ VOO DE VOLTA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", status.bg, status.text)}>
            {status.icon} {flight.status === 'confirmed' ? 'Confirmado' : flight.status === 'bidding' ? 'Em Leilão' : 'Planejado'}
          </span>
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
            ⚓ ÂNCORA
          </span>
        </div>
      </div>
      
      {/* Flight Path Visualization */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between mb-5">
          {/* Origin */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-['Outfit']">
              {flight.originCode}
            </div>
            <div className="text-sm text-muted-foreground">{flight.origin}</div>
            <div className="text-lg font-semibold text-foreground mt-2">{flight.departureTime}</div>
            <div className="text-xs text-muted-foreground">
              {format(flight.departureDate, 'EEE dd/MM', { locale: ptBR })}
            </div>
          </div>
          
          {/* Flight Path */}
          <div className="flex-1 flex flex-col items-center px-4">
            <span className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Clock size={12} />
              {flight.duration}
            </span>
            <div className="flex items-center w-full">
              <div className="h-px flex-1 bg-border" />
              <Plane size={20} className={cn("mx-2", isOutbound ? "text-primary" : "text-sky-500")} />
              <div className="h-px flex-1 bg-border" />
            </div>
            <span className="text-xs text-muted-foreground mt-2">
              {flight.stops === 0 ? 'Direto' : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}
            </span>
            {timezoneDiff !== 0 && (
              <span className="text-xs text-muted-foreground mt-1">
                Fuso: {timezoneDiff > 0 ? '+' : ''}{timezoneDiff}h
              </span>
            )}
          </div>
          
          {/* Destination */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground font-['Outfit']">
              {flight.destinationCode}
            </div>
            <div className="text-sm text-muted-foreground">{flight.destination}</div>
            <div className="text-lg font-semibold text-foreground mt-2 flex items-center justify-center gap-1">
              {flight.arrivalTime}
              {isNextDay && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                  +1
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(flight.arrivalDate, 'EEE dd/MM', { locale: ptBR })}
            </div>
          </div>
        </div>
        
        {/* Airline Info */}
        <div className="flex items-center justify-between py-3 border-t border-border text-sm text-muted-foreground">
          <span>{flight.airline} • {flight.flightNumber}</span>
          <span className="flex items-center gap-1">
            <Users size={14} />
            {flight.travelers} viajante{flight.travelers > 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Biology-Aware Jet Lag Alert */}
        {showJetLagAlert && (
          <div className="bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Brain size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-500">🧠 Biology-Aware Ativo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Detectamos <span className="text-foreground font-medium">{Math.abs(timezoneDiff)}h</span> de fuso horário.
                  {firstActivityTime && (
                    <> Atividades do Dia 1 começam às <span className="text-foreground font-medium">{firstActivityTime}</span> para adaptação.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tip for Return Flight */}
        {!isOutbound && (
          <div className="bg-amber-500/10 border-l-2 border-amber-500 rounded-r-lg p-3 mb-4 text-sm">
            <span className="text-foreground">
              💡 "Voo noturno é ótimo — você chega de manhã e ainda tem o domingo pra descansar!" 🌿
            </span>
          </div>
        )}
        
        {/* Price Section */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold font-['Outfit'] text-foreground">
                R$ {flight.totalPrice.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                R$ {flight.pricePerPerson.toLocaleString()}/pessoa
              </p>
            </div>
            {flight.status === 'confirmed' && (
              <span className="text-primary text-sm font-medium">✓ Reservado</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 bg-muted/20 border-t border-border">
        <div className="flex gap-2 flex-wrap">
          {flight.status !== 'confirmed' && (
            <button
              onClick={onSearchOffers}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors"
            >
              <Tag size={14} />
              🏷️ Ativar Leilão
            </button>
          )}
          <button 
            onClick={onChangeFlight}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm text-foreground hover:border-primary transition-colors"
          >
            <RotateCcw size={14} />
            🔄 Alterar Voo
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightAnchorCard;
