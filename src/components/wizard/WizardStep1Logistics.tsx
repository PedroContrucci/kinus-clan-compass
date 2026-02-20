// WizardStep1Logistics — Cascading Region → Country → City Selection + Dates

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UnsplashThumbnail } from '@/components/shared/UnsplashImage';
import { REGIONS, DESTINATION_CATALOG, type RegionName, type CountryEntry, type CityEntry } from '@/data/destinationCatalog';
import { cn } from '@/lib/utils';
import type { WizardData } from './types';

interface WizardStep1Props {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export const WizardStep1Logistics = ({ data, onChange }: WizardStep1Props) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionName | null>(
    (data.selectedRegion as RegionName) || null
  );
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry | null>(null);

  // Restore country from data
  useEffect(() => {
    if (data.selectedRegion && data.selectedCountry && !selectedCountry) {
      const region = DESTINATION_CATALOG[data.selectedRegion as RegionName];
      const country = region?.find(c => c.country === data.selectedCountry);
      if (country) {
        setSelectedRegion(data.selectedRegion as RegionName);
        setSelectedCountry(country);
      }
    }
  }, []);

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

  const handleRegionSelect = (region: RegionName) => {
    setSelectedRegion(region);
    setSelectedCountry(null);
    onChange({
      selectedRegion: region,
      selectedCountry: '',
      selectedCountryFlag: '',
      destinationCity: '',
      destinationAirportCode: '',
      destinationCurrency: '',
      destinationTimezoneId: '',
      destinationAirports: [],
      destinationTimezone: null,
    });
  };

  const handleCountrySelect = (country: CountryEntry) => {
    setSelectedCountry(country);
    onChange({
      selectedCountry: country.country,
      selectedCountryFlag: country.flag,
      destinationCity: '',
      destinationAirportCode: '',
      destinationCurrency: '',
      destinationTimezoneId: '',
      destinationAirports: [],
      destinationTimezone: null,
    });
  };

  const handleCitySelect = (city: CityEntry) => {
    onChange({
      destinationCity: city.name,
      destinationAirportCode: city.airports[0],
      destinationCurrency: city.currency,
      destinationTimezoneId: city.timezone,
      destinationTimezone: city.timezone,
      destinationAirports: city.airports,
    });
  };

  const handleAirportSelect = (airport: string) => {
    onChange({ destinationAirportCode: airport });
  };

  const handleBreadcrumbBack = (level: 'region' | 'country') => {
    if (level === 'region') {
      setSelectedRegion(null);
      setSelectedCountry(null);
      onChange({
        selectedRegion: '',
        selectedCountry: '',
        selectedCountryFlag: '',
        destinationCity: '',
        destinationAirportCode: '',
        destinationCurrency: '',
        destinationTimezoneId: '',
        destinationAirports: [],
        destinationTimezone: null,
      });
    } else {
      setSelectedCountry(null);
      onChange({
        selectedCountry: '',
        selectedCountryFlag: '',
        destinationCity: '',
        destinationAirportCode: '',
        destinationCurrency: '',
        destinationTimezoneId: '',
        destinationAirports: [],
        destinationTimezone: null,
      });
    }
  };

  const countries = selectedRegion ? DESTINATION_CATALOG[selectedRegion] : [];

  const ORIGIN_AIRPORTS = [
    { city: 'São Paulo', airports: [{ code: 'GRU', name: 'Guarulhos' }, { code: 'CGH', name: 'Congonhas' }] },
    { city: 'Rio de Janeiro', airports: [{ code: 'GIG', name: 'Galeão' }, { code: 'SDU', name: 'Santos Dumont' }] },
    { city: 'Belo Horizonte', airports: [{ code: 'CNF', name: 'Confins' }] },
    { city: 'Brasília', airports: [{ code: 'BSB', name: 'Juscelino Kubitschek' }] },
    { city: 'Curitiba', airports: [{ code: 'CWB', name: 'Afonso Pena' }] },
    { city: 'Porto Alegre', airports: [{ code: 'POA', name: 'Salgado Filho' }] },
    { city: 'Recife', airports: [{ code: 'REC', name: 'Guararapes' }] },
    { city: 'Fortaleza', airports: [{ code: 'FOR', name: 'Pinto Martins' }] },
    { city: 'Salvador', airports: [{ code: 'SSA', name: 'Luís Eduardo Magalhães' }] },
    { city: 'Campinas', airports: [{ code: 'VCP', name: 'Viracopos' }] },
  ];

  const [originOpen, setOriginOpen] = useState(false);

  const currentOrigin = ORIGIN_AIRPORTS.find(o => o.city === data.originCity) || ORIGIN_AIRPORTS[0];
  const currentAirport = currentOrigin.airports.find(a => a.code === data.originAirportCode) || currentOrigin.airports[0];

  const handleOriginCitySelect = (origin: typeof ORIGIN_AIRPORTS[0]) => {
    onChange({
      originCity: origin.city,
      originAirportCode: origin.airports[0].code,
    });
    if (origin.airports.length === 1) {
      setOriginOpen(false);
    }
  };

  const handleOriginAirportSelect = (code: string) => {
    onChange({ originAirportCode: code });
    setOriginOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Origin - Selectable */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          ✈️ De onde você parte?
        </label>
        <Popover open={originOpen} onOpenChange={setOriginOpen}>
          <PopoverTrigger asChild>
            <button className="w-full px-4 py-4 bg-card border border-border rounded-2xl text-foreground text-left hover:border-primary/50 transition-colors flex items-center justify-between">
              <div>
                <span className="font-medium">{currentOrigin.city} ({currentAirport.code})</span>
                <span className="text-muted-foreground text-sm ml-2">• {currentAirport.name}</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 max-h-80 overflow-y-auto" align="start">
            <div className="space-y-1">
              {ORIGIN_AIRPORTS.map((origin) => (
                <div key={origin.city}>
                  <button
                    onClick={() => handleOriginCitySelect(origin)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-muted",
                      data.originCity === origin.city && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    {origin.city}
                    {origin.airports.length === 1 && (
                      <span className="text-muted-foreground ml-1">• {origin.airports[0].code}</span>
                    )}
                  </button>
                  {data.originCity === origin.city && origin.airports.length > 1 && (
                    <div className="flex gap-2 px-3 pb-2">
                      {origin.airports.map((ap) => (
                        <button
                          key={ap.code}
                          onClick={() => handleOriginAirportSelect(ap.code)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            data.originAirportCode === ap.code
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {ap.code} • {ap.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Destination Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          📍 Para onde você vai?
        </label>

        {/* Breadcrumb */}
        {(selectedRegion || data.destinationCity) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-sm mb-3 flex-wrap"
          >
            <button
              onClick={() => handleBreadcrumbBack('region')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              🌍 Destino
            </button>
            {selectedRegion && (
              <>
                <ChevronRight size={14} className="text-muted-foreground" />
                <button
                  onClick={() => handleBreadcrumbBack('region')}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {REGIONS.find(r => r.id === selectedRegion)?.emoji} {selectedRegion}
                </button>
              </>
            )}
            {selectedCountry && (
              <>
                <ChevronRight size={14} className="text-muted-foreground" />
                <button
                  onClick={() => handleBreadcrumbBack('country')}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {selectedCountry.flag} {selectedCountry.country}
                </button>
              </>
            )}
            {data.destinationCity && (
              <>
                <ChevronRight size={14} className="text-muted-foreground" />
                <span className="text-foreground font-semibold">
                  {data.destinationCity} ({data.destinationAirportCode})
                </span>
              </>
            )}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Level 1: Region */}
          {!selectedRegion && (
            <motion.div
              key="regions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {REGIONS.map((region) => (
                <motion.button
                  key={region.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRegionSelect(region.id)}
                  className="p-4 bg-card border border-border rounded-2xl text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <span className="text-2xl block mb-1">{region.emoji}</span>
                  <span className="font-medium text-foreground text-sm">{region.id}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Level 2: Country */}
          {selectedRegion && !selectedCountry && (
            <motion.div
              key="countries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {countries.map((country) => (
                <motion.button
                  key={country.country}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCountrySelect(country)}
                  className="p-3 bg-card border border-border rounded-xl text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.flag}</span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{country.country}</p>
                      <p className="text-xs text-muted-foreground">
                        {country.cities.length} cidade{country.cities.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Level 3: City */}
          {selectedCountry && !data.destinationCity && (
            <motion.div
              key="cities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {selectedCountry.cities.map((city) => (
                <motion.button
                  key={city.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCitySelect(city)}
                  className="relative overflow-hidden bg-card border border-border rounded-xl text-left hover:border-primary/50 transition-all"
                >
                  <div className="h-20 w-full">
                    <UnsplashThumbnail
                      query={`${city.name} ${selectedCountry.country} landmark`}
                      alt={city.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-foreground text-sm">{city.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {city.airports.join(' • ')}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* City Selected - Show airport selector if multiple */}
          {data.destinationCity && data.destinationAirports.length > 1 && (
            <motion.div
              key="airport-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-card border border-primary/30 rounded-2xl"
            >
              <p className="text-sm font-medium text-foreground mb-2">
                ✈️ Selecione o aeroporto preferido:
              </p>
              <div className="flex gap-2">
                {data.destinationAirports.map((airport) => (
                  <button
                    key={airport}
                    onClick={() => handleAirportSelect(airport)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      data.destinationAirportCode === airport
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {airport}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* City Selected Confirmation */}
          {data.destinationCity && (
            <motion.div
              key="selected-city"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-primary/10 border border-primary/30 rounded-2xl mt-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{data.selectedCountryFlag}</span>
                <div>
                  <p className="font-bold text-foreground">
                    {data.destinationCity}, {data.selectedCountry}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Aeroporto: {data.destinationAirportCode} • Moeda: {data.destinationCurrency}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
                defaultMonth={data.departureDate ? addDays(data.departureDate, 1) : undefined}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
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
