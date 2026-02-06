// CityAutocomplete — Autocomplete para cidades e aeroportos usando Supabase

import { useState, useRef, useEffect } from 'react';
import { MapPin, Plane, Loader2 } from 'lucide-react';
import { useCityAirportSearch } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string, cityId?: string, airportId?: string) => void;
  placeholder?: string;
  icon?: 'origin' | 'destination';
  className?: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = 'Buscar cidade ou aeroporto...',
  icon = 'destination',
  className,
}: CityAutocompleteProps) => {
  const [search, setSearch] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useCityAirportSearch(search);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (name: string, cityId?: string, airportId?: string) => {
    setSearch(name);
    onChange(name, cityId, airportId);
    setIsOpen(false);
  };

  const hasResults = data && (data.cities.length > 0 || data.airports.length > 0);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 pl-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon === 'origin' ? <Plane size={18} /> : <MapPin size={18} />}
        </div>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && search.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          {!hasResults && !isLoading && (
            <div className="px-4 py-3 text-muted-foreground text-sm">
              Nenhum resultado encontrado
            </div>
          )}

          {/* Cities */}
          {data?.cities && data.cities.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                Cidades
              </div>
              {data.cities.map((city: any) => (
                <button
                  key={city.id}
                  onClick={() => handleSelect(city.name_pt, city.id)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <MapPin size={16} className="text-primary" />
                  <div>
                    <div className="text-foreground font-medium">{city.name_pt}</div>
                    <div className="text-xs text-muted-foreground">
                      {city.country?.name_pt || city.name_en}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Airports */}
          {data?.airports && data.airports.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
                Aeroportos
              </div>
              {data.airports.map((airport: any) => (
                <button
                  key={airport.id}
                  onClick={() => handleSelect(
                    `${airport.city?.name_pt || airport.name_pt} (${airport.iata_code})`,
                    undefined,
                    airport.id
                  )}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <Plane size={16} className="text-accent" />
                  <div>
                    <div className="text-foreground font-medium">
                      {airport.iata_code} — {airport.name_pt}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {airport.city?.name_pt}, {airport.country?.name_pt}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
