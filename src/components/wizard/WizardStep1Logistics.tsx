// WizardStep1Logistics — Origin, Destination & Dates

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plane, Calendar, Info, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCityAirportSearch, useRouteInfo } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import type { WizardData } from './types';

interface WizardStep1Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

interface CityResult {
  id: string;
  name_pt: string;
  name_en: string;
  country: { name_pt: string; code: string } | null;
}

interface AirportResult {
  id: string;
  iata_code: string;
  name_pt: string;
  city: { name_pt: string } | null;
  country: { name_pt: string; code: string } | null;
}

export const WizardStep1Logistics = ({ data, onChange }: WizardStep1Props) => {
  const [originSearch, setOriginSearch] = useState(data.originCity || 'São Paulo');
  const [destSearch, setDestSearch] = useState(data.destinationCity || '');
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestResults, setShowDestResults] = useState(false);
  
  // Search queries
  const { data: originResults, isLoading: originLoading } = useCityAirportSearch(originSearch);
  const { data: destResults, isLoading: destLoading } = useCityAirportSearch(destSearch);
  
  // Route info when both cities are selected
  const { data: routeInfo, isLoading: routeLoading } = useRouteInfo(
    data.originCity,
    data.destinationCity
  );

  // Update route info when available
  useEffect(() => {
    if (routeInfo) {
      onChange({
        hasDirectFlight: routeInfo.hasDirect || false,
        connections: routeInfo.connections || [],
        estimatedFlightDuration: routeInfo.estimatedDuration || null,
        averageFlightPrice: routeInfo.averagePrice || null,
      });
    }
  }, [routeInfo]);

  // Auto-set return date when departure changes
  useEffect(() => {
    if (data.departureDate && !data.returnDate) {
      onChange({ returnDate: addDays(data.departureDate, 7) });
    }
  }, [data.departureDate]);

  // Calculate days
  useEffect(() => {
    if (data.departureDate && data.returnDate) {
      const days = differenceInDays(data.returnDate, data.departureDate) + 1;
      onChange({ totalDays: days, totalNights: days - 1 });
    }
  }, [data.departureDate, data.returnDate]);

  const handleOriginSelect = (city: CityResult, airport?: AirportResult) => {
    onChange({
      originCity: city.name_pt,
      originCityId: city.id,
      originAirportCode: airport?.iata_code || '',
    });
    setOriginSearch(city.name_pt + (airport ? ` (${airport.iata_code})` : ''));
    setShowOriginResults(false);
  };

  const handleDestSelect = (city: CityResult, airport?: AirportResult) => {
    onChange({
      destinationCity: city.name_pt,
      destinationCityId: city.id,
      destinationAirportCode: airport?.iata_code || '',
    });
    setDestSearch(city.name_pt + (airport ? ` (${airport.iata_code})` : ''));
    setShowDestResults(false);
  };

  // Popular destinations
  const popularDestinations = [
    { name: 'Japão', emoji: '🇯🇵' },
    { name: 'Portugal', emoji: '🇵🇹' },
    { name: 'Tailândia', emoji: '🇹🇭' },
  ];

  return (
    <div className="space-y-6">
      {/* Origin Field */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Plane size={16} className="text-primary" />
          De onde você parte?
        </label>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={originSearch}
            onChange={(e) => {
              setOriginSearch(e.target.value);
              setShowOriginResults(true);
            }}
            onFocus={() => setShowOriginResults(true)}
            placeholder="São Paulo, SP (GRU)"
            className="w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        
        {/* Origin Results Dropdown */}
        {showOriginResults && originSearch.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {originLoading ? (
              <div className="p-4 text-center text-muted-foreground">Buscando...</div>
            ) : (
              <>
                {originResults?.cities?.map((city: CityResult) => (
                  <button
                    key={city.id}
                    onClick={() => handleOriginSelect(city)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">🏙️</span>
                    <div>
                      <p className="font-medium text-foreground">{city.name_pt}</p>
                      <p className="text-sm text-muted-foreground">{city.country?.name_pt}</p>
                    </div>
                  </button>
                ))}
                {originResults?.airports?.map((airport: AirportResult) => (
                  <button
                    key={airport.id}
                    onClick={() => handleOriginSelect(
                      { id: '', name_pt: airport.city?.name_pt || '', name_en: '', country: airport.country },
                      airport
                    )}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">✈️</span>
                    <div>
                      <p className="font-medium text-foreground">{airport.name_pt}</p>
                      <p className="text-sm text-muted-foreground">
                        {airport.iata_code} • {airport.city?.name_pt}, {airport.country?.name_pt}
                      </p>
                    </div>
                  </button>
                ))}
                {!originResults?.cities?.length && !originResults?.airports?.length && (
                  <div className="p-4 text-center text-muted-foreground">Nenhum resultado</div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2">
        <button
          onClick={() => {
            const tempCity = data.originCity;
            const tempId = data.originCityId;
            const tempCode = data.originAirportCode;
            onChange({
              originCity: data.destinationCity,
              originCityId: data.destinationCityId,
              originAirportCode: data.destinationAirportCode,
              destinationCity: tempCity,
              destinationCityId: tempId,
              destinationAirportCode: tempCode,
            });
            setOriginSearch(destSearch);
            setDestSearch(originSearch);
          }}
          className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors"
        >
          <ArrowRightLeft size={18} className="text-muted-foreground rotate-90" />
        </button>
      </div>

      {/* Destination Field */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <span className="text-primary">📍</span>
          Para onde você vai?
        </label>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={destSearch}
            onChange={(e) => {
              setDestSearch(e.target.value);
              setShowDestResults(true);
            }}
            onFocus={() => setShowDestResults(true)}
            placeholder="Tóquio, Japão (NRT/HND)"
            className="w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        
        {/* Destination Results Dropdown */}
        {showDestResults && destSearch.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {destLoading ? (
              <div className="p-4 text-center text-muted-foreground">Buscando...</div>
            ) : (
              <>
                {destResults?.cities?.map((city: CityResult) => (
                  <button
                    key={city.id}
                    onClick={() => handleDestSelect(city)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">🏙️</span>
                    <div>
                      <p className="font-medium text-foreground">{city.name_pt}</p>
                      <p className="text-sm text-muted-foreground">{city.country?.name_pt}</p>
                    </div>
                  </button>
                ))}
                {destResults?.airports?.map((airport: AirportResult) => (
                  <button
                    key={airport.id}
                    onClick={() => handleDestSelect(
                      { id: '', name_pt: airport.city?.name_pt || '', name_en: '', country: airport.country },
                      airport
                    )}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">✈️</span>
                    <div>
                      <p className="font-medium text-foreground">{airport.name_pt}</p>
                      <p className="text-sm text-muted-foreground">
                        {airport.iata_code} • {airport.city?.name_pt}, {airport.country?.name_pt}
                      </p>
                    </div>
                  </button>
                ))}
                {!destResults?.cities?.length && !destResults?.airports?.length && (
                  <div className="p-4 text-center text-muted-foreground">Nenhum resultado</div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Popular Destinations */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info size={14} />
        <span>Destinos em alta:</span>
        {popularDestinations.map((dest) => (
          <button
            key={dest.name}
            onClick={() => {
              setDestSearch(dest.name);
              setShowDestResults(true);
            }}
            className="px-2 py-1 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            {dest.emoji} {dest.name}
          </button>
        ))}
      </div>

      {/* Route Info Alert */}
      {data.originCity && data.destinationCity && !routeLoading && routeInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl border',
            routeInfo.hasDirect
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          )}
        >
          <div className="flex items-start gap-3">
            {routeInfo.hasDirect ? (
              <Plane size={20} className="text-emerald-500 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-amber-500 mt-0.5" />
            )}
            <div>
              {routeInfo.hasDirect ? (
                <>
                  <p className="font-medium text-emerald-500">Voo direto disponível!</p>
                  <p className="text-sm text-muted-foreground">
                    {routeInfo.estimatedDuration && `~${Math.floor(routeInfo.estimatedDuration / 60)}h${routeInfo.estimatedDuration % 60}min`}
                    {routeInfo.averagePrice && ` • A partir de R$ ${routeInfo.averagePrice.toLocaleString('pt-BR')}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-amber-500">Não há voo direto</p>
                  <p className="text-sm text-muted-foreground">
                    Conexões comuns: {routeInfo.connections?.join(', ') || 'Dubai, Doha, Paris'}
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Date Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Ida
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full px-4 py-4 bg-card border border-border rounded-2xl text-left hover:border-primary/50 transition-colors">
                {data.departureDate ? (
                  <span className="text-foreground font-medium">
                    {format(data.departureDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecionar</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={data.departureDate}
                onSelect={(date) => {
                  onChange({ departureDate: date });
                  if (date && (!data.returnDate || data.returnDate <= date)) {
                    onChange({ returnDate: addDays(date, 1) });
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Volta
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full px-4 py-4 bg-card border border-border rounded-2xl text-left hover:border-primary/50 transition-colors">
                {data.returnDate ? (
                  <span className="text-foreground font-medium">
                    {format(data.returnDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecionar</span>
                )}
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

      {/* Duration Info */}
      {data.departureDate && data.returnDate && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl py-3">
          <Info size={14} />
          <span>
            <strong className="text-foreground">{data.totalDays} dias</strong> de viagem ({data.totalNights} noites)
          </span>
        </div>
      )}
    </div>
  );
};

export default WizardStep1Logistics;
