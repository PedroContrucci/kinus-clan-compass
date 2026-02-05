// LogisticsStep — Step 1: Origin, Destination, Dates

import { useState } from 'react';
import { Calendar, MapPin, Plane } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const POPULAR_ORIGINS = [
  { code: 'GRU', city: 'São Paulo', country: 'Brasil' },
  { code: 'GIG', city: 'Rio de Janeiro', country: 'Brasil' },
  { code: 'BSB', city: 'Brasília', country: 'Brasil' },
  { code: 'CNF', city: 'Belo Horizonte', country: 'Brasil' },
];

const POPULAR_DESTINATIONS = [
  { code: 'CDG', city: 'Paris', country: 'França', emoji: '🗼' },
  { code: 'NRT', city: 'Tóquio', country: 'Japão', emoji: '🏯' },
  { code: 'FCO', city: 'Roma', country: 'Itália', emoji: '🏛️' },
  { code: 'LIS', city: 'Lisboa', country: 'Portugal', emoji: '🚃' },
  { code: 'BCN', city: 'Barcelona', country: 'Espanha', emoji: '🏖️' },
  { code: 'JFK', city: 'Nova York', country: 'EUA', emoji: '🗽' },
];

interface LogisticsStepProps {
  data: {
    origin: string;
    destination: string;
    departureDate: Date | undefined;
    returnDate: Date | undefined;
  };
  onChange: (data: Partial<LogisticsStepProps['data']>) => void;
}

export const LogisticsStep = ({ data, onChange }: LogisticsStepProps) => {
  const [originSearch, setOriginSearch] = useState(data.origin);
  const [destSearch, setDestSearch] = useState(data.destination);

  const handleDepartureDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({
        departureDate: date,
        returnDate: data.returnDate || addDays(date, 1),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Origin */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <Plane size={16} className="inline mr-2" />
          Partida
        </label>
        <input
          type="text"
          value={originSearch}
          onChange={(e) => {
            setOriginSearch(e.target.value);
            onChange({ origin: e.target.value });
          }}
          placeholder="De onde você vai sair?"
          className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {POPULAR_ORIGINS.map((origin) => (
            <button
              key={origin.code}
              onClick={() => {
                setOriginSearch(origin.city);
                onChange({ origin: origin.city });
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                data.origin === origin.city
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#334155] text-muted-foreground hover:text-foreground'
              )}
            >
              {origin.city}
            </button>
          ))}
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          <MapPin size={16} className="inline mr-2" />
          Destino
        </label>
        <input
          type="text"
          value={destSearch}
          onChange={(e) => {
            setDestSearch(e.target.value);
            onChange({ destination: e.target.value });
          }}
          placeholder="Para onde você quer ir?"
          className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.code}
              onClick={() => {
                setDestSearch(dest.city);
                onChange({ destination: dest.city });
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                data.destination === dest.city
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#334155] text-muted-foreground hover:text-foreground'
              )}
            >
              {dest.emoji} {dest.city}
            </button>
          ))}
        </div>
      </div>

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
              <button className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-left text-foreground hover:border-emerald-500/50 transition-colors">
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
              <button className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-left text-foreground hover:border-emerald-500/50 transition-colors">
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
    </div>
  );
};

export default LogisticsStep;
