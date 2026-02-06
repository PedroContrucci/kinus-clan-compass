// LogisticsStep — Step 1: Origin, Destination, Dates (Supabase connected)

import { useState, useEffect } from 'react';
import { Calendar, Plane, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CityAutocomplete } from '@/components/shared/CityAutocomplete';
import { RouteInfo } from '@/components/shared/RouteInfo';
import { useCities } from '@/hooks/useSupabaseData';

interface LogisticsStepProps {
  data: {
    origin: string;
    destination: string;
    departureDate: Date | undefined;
    returnDate: Date | undefined;
    originCityId?: string;
    destinationCityId?: string;
  };
  onChange: (data: Partial<LogisticsStepProps['data']>) => void;
}

export const LogisticsStep = ({ data, onChange }: LogisticsStepProps) => {
  const [showRouteInfo, setShowRouteInfo] = useState(false);

  // Fetch popular cities from Supabase
  const { data: cities } = useCities();

  // Show route info when both origin and destination are set
  useEffect(() => {
    if (data.origin && data.destination) {
      setShowRouteInfo(true);
    }
  }, [data.origin, data.destination]);

  const handleDepartureDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        departureDate: date,
        returnDate: data.returnDate && data.returnDate > date 
          ? data.returnDate 
          : addDays(date, 1),
      });
    }
  };

  // Get popular destinations from database
  const popularOrigins = cities
    ?.filter((c: any) => c.country?.code === 'BR')
    .slice(0, 4)
    .map((c: any) => ({
      id: c.id,
      name: c.name_pt,
    })) || [];

  const popularDestinations = cities
    ?.filter((c: any) => c.is_popular_destination && c.country?.code !== 'BR')
    .slice(0, 6)
    .map((c: any) => ({
      id: c.id,
      name: c.name_pt,
      country: c.country?.name_pt,
      emoji: getDestinationEmoji(c.name_pt),
    })) || [];

  return (
    <div className="space-y-6">
      {/* Origin */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <Plane size={16} className="inline mr-2" />
          Partida
        </label>
        <CityAutocomplete
          value={data.origin}
          onChange={(value, cityId) => onChange({ origin: value, originCityId: cityId })}
          placeholder="De onde você vai sair?"
          icon="origin"
        />
        {popularOrigins.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {popularOrigins.map((origin: any) => (
              <button
                key={origin.id}
                onClick={() => onChange({ origin: origin.name, originCityId: origin.id })}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  data.origin === origin.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {origin.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <Plane size={16} className="inline mr-2 rotate-90" />
          Destino
        </label>
        <CityAutocomplete
          value={data.destination}
          onChange={(value, cityId) => onChange({ destination: value, destinationCityId: cityId })}
          placeholder="Para onde você quer ir?"
          icon="destination"
        />
        {popularDestinations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {popularDestinations.map((dest: any) => (
              <button
                key={dest.id}
                onClick={() => onChange({ destination: dest.name, destinationCityId: dest.id })}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  data.destination === dest.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {dest.emoji} {dest.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Route Information */}
      {showRouteInfo && data.origin && data.destination && (
        <RouteInfo origin={data.origin} destination={data.destination} />
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        {/* Departure Date */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            <Calendar size={16} className="inline mr-2" />
            Data de Ida
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left text-foreground hover:border-primary/50 transition-colors">
                {data.departureDate
                  ? format(data.departureDate, 'dd MMM yyyy', { locale: ptBR })
                  : 'Selecionar'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={data.departureDate}
                onSelect={handleDepartureDateChange}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            <Calendar size={16} className="inline mr-2" />
            Data de Volta
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left text-foreground hover:border-primary/50 transition-colors">
                {data.returnDate
                  ? format(data.returnDate, 'dd MMM yyyy', { locale: ptBR })
                  : 'Selecionar'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={data.returnDate}
                onSelect={(date) => onChange({ returnDate: date })}
                disabled={(date) => date < (data.departureDate || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Trip Duration Info */}
      {data.departureDate && data.returnDate && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
          <Info size={16} className="text-accent" />
          <span className="text-sm text-foreground">
            Duração da viagem:{' '}
            <strong>
              {Math.ceil(
                (data.returnDate.getTime() - data.departureDate.getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              dias
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

function getDestinationEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯',
    'Paris': '🗼',
    'Roma': '🏛️',
    'Lisboa': '🚃',
    'Barcelona': '🏖️',
    'Nova York': '🗽',
    'Londres': '🎡',
    'Dubai': '🏙️',
    'Bangkok': '🛕',
    'Singapura': '🌆',
    'Sydney': '🦘',
    'Amsterdã': '🌷',
    'Madri': '💃',
    'Zurique': '🏔️',
    'Atenas': '🏛️',
    'Cairo': '🏺',
  };
  return emojiMap[name] || '✈️';
}

export default LogisticsStep;
