// TripGuide — Travel guide with country info: visa, vaccines, currency, tips

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCheck, Syringe, Wallet, Plug, Phone, Lightbulb, 
  Shield, AlertTriangle, ChevronDown, ChevronUp, UtensilsCrossed
} from 'lucide-react';
import { getTopMichelinForCity, getMichelinStarDisplay, getMichelinCountForCity } from '@/lib/michelinData';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { PlaceInfoCard } from './PlaceInfoCard';

interface CountryInfo {
  id: string;
  name_pt: string;
  code: string;
  currency_code: string | null;
  visa_required_br: boolean | null;
  visa_notes: string | null;
  vaccines_required: string[] | null;
  vaccines_recommended: string[] | null;
  voltage: string | null;
  power_plug: string | null;
  emergency_numbers: Record<string, string> | null;
  tips: string[] | null;
}

interface TripGuideProps {
  destinationCity: string;
  countryId?: string;
}

const COUNTRY_FALLBACK: Record<string, Partial<CountryInfo>> = {
  'Tailândia': { name_pt: 'Tailândia', code: 'TH', currency_code: 'THB', visa_required_br: false, visa_notes: 'Isento até 90 dias', voltage: '220V', power_plug: 'A/B/C/O' },
  'Japão': { name_pt: 'Japão', code: 'JP', currency_code: 'JPY', visa_required_br: false, visa_notes: 'Isento até 90 dias', voltage: '100V', power_plug: 'A/B' },
  'França': { name_pt: 'França', code: 'FR', currency_code: 'EUR', visa_required_br: false, visa_notes: 'Schengen: isento até 90 dias', voltage: '230V', power_plug: 'C/E' },
  'Itália': { name_pt: 'Itália', code: 'IT', currency_code: 'EUR', visa_required_br: false, visa_notes: 'Schengen: isento até 90 dias', voltage: '230V', power_plug: 'C/F/L' },
  'Portugal': { name_pt: 'Portugal', code: 'PT', currency_code: 'EUR', visa_required_br: false, visa_notes: 'Schengen: isento até 90 dias', voltage: '230V', power_plug: 'C/F' },
  'Espanha': { name_pt: 'Espanha', code: 'ES', currency_code: 'EUR', visa_required_br: false, visa_notes: 'Schengen: isento até 90 dias', voltage: '230V', power_plug: 'C/F' },
  'Reino Unido': { name_pt: 'Reino Unido', code: 'GB', currency_code: 'GBP', visa_required_br: false, visa_notes: 'ETA necessário (£10)', voltage: '230V', power_plug: 'G' },
  'Estados Unidos': { name_pt: 'Estados Unidos', code: 'US', currency_code: 'USD', visa_required_br: true, visa_notes: 'Visto B1/B2 necessário', voltage: '120V', power_plug: 'A/B' },
  'Emirados Árabes': { name_pt: 'Emirados Árabes', code: 'AE', currency_code: 'AED', visa_required_br: false, visa_notes: 'Isento até 90 dias', voltage: '220V', power_plug: 'C/D/G' },
  'Grécia': { name_pt: 'Grécia', code: 'GR', currency_code: 'EUR', visa_required_br: false, visa_notes: 'Schengen: isento até 90 dias', voltage: '230V', power_plug: 'C/F' },
  'Turquia': { name_pt: 'Turquia', code: 'TR', currency_code: 'TRY', visa_required_br: false, visa_notes: 'e-Visa necessário (gratuito)', voltage: '230V', power_plug: 'C/F' },
  'Indonésia': { name_pt: 'Indonésia', code: 'ID', currency_code: 'IDR', visa_required_br: false, visa_notes: 'Visa on arrival (30 dias)', voltage: '230V', power_plug: 'C/F' },
  'Austrália': { name_pt: 'Austrália', code: 'AU', currency_code: 'AUD', visa_required_br: true, visa_notes: 'eVisitor ou ETA necessário', voltage: '230V', power_plug: 'I' },
  'Argentina': { name_pt: 'Argentina', code: 'AR', currency_code: 'ARS', visa_required_br: false, visa_notes: 'Isento, RG aceito', voltage: '220V', power_plug: 'C/I' },
  'México': { name_pt: 'México', code: 'MX', currency_code: 'MXN', visa_required_br: false, visa_notes: 'Isento até 180 dias', voltage: '127V', power_plug: 'A/B' },
  'Coreia do Sul': { name_pt: 'Coreia do Sul', code: 'KR', currency_code: 'KRW', visa_required_br: false, visa_notes: 'K-ETA necessário', voltage: '220V', power_plug: 'C/F' },
  'Singapura': { name_pt: 'Singapura', code: 'SG', currency_code: 'SGD', visa_required_br: false, visa_notes: 'Isento até 30 dias', voltage: '230V', power_plug: 'G' },
  'Marrocos': { name_pt: 'Marrocos', code: 'MA', currency_code: 'MAD', visa_required_br: false, visa_notes: 'Isento até 90 dias', voltage: '220V', power_plug: 'C/E' },
  'Egito': { name_pt: 'Egito', code: 'EG', currency_code: 'EGP', visa_required_br: true, visa_notes: 'Visa on arrival (USD 25)', voltage: '220V', power_plug: 'C' },
  'África do Sul': { name_pt: 'África do Sul', code: 'ZA', currency_code: 'ZAR', visa_required_br: false, visa_notes: 'Isento até 90 dias', voltage: '230V', power_plug: 'C/M/N' },
};

// Map city names to country names for fallback lookup
const CITY_TO_COUNTRY: Record<string, string> = {
  'Paris': 'França', 'Lyon': 'França', 'Nice': 'França', 'Marselha': 'França',
  'Roma': 'Itália', 'Milão': 'Itália', 'Florença': 'Itália', 'Veneza': 'Itália',
  'Lisboa': 'Portugal', 'Porto': 'Portugal',
  'Barcelona': 'Espanha', 'Madri': 'Espanha',
  'Londres': 'Reino Unido', 'Edimburgo': 'Reino Unido',
  'Nova York': 'Estados Unidos', 'Miami': 'Estados Unidos', 'Orlando': 'Estados Unidos', 'Los Angeles': 'Estados Unidos', 'San Francisco': 'Estados Unidos',
  'Tóquio': 'Japão', 'Quioto': 'Japão', 'Osaka': 'Japão',
  'Bangkok': 'Tailândia', 'Phuket': 'Tailândia', 'Chiang Mai': 'Tailândia',
  'Dubai': 'Emirados Árabes', 'Abu Dhabi': 'Emirados Árabes',
  'Atenas': 'Grécia', 'Santorini': 'Grécia',
  'Istambul': 'Turquia',
  'Bali': 'Indonésia',
  'Sydney': 'Austrália', 'Melbourne': 'Austrália',
  'Buenos Aires': 'Argentina', 'Bariloche': 'Argentina',
  'Cancún': 'México', 'Cidade do México': 'México',
  'Seul': 'Coreia do Sul',
  'Singapura': 'Singapura',
  'Marrakech': 'Marrocos',
  'Cairo': 'Egito',
  'Cidade do Cabo': 'África do Sul',
};

export const TripGuide = ({ destinationCity, countryId }: TripGuideProps) => {
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('visa');

  useEffect(() => {
    const fetchCountryInfo = async () => {
      if (!countryId) {
        // Try to find country by city name
        const { data: cityData } = await supabase
          .from('cities')
          .select('country_id')
          .eq('name_pt', destinationCity)
          .single();
        
        if (cityData?.country_id) {
          const { data } = await supabase
            .from('countries')
            .select('*')
            .eq('id', cityData.country_id)
            .single();
          
          setCountryInfo(data as CountryInfo);
        }
      } else {
        const { data } = await supabase
          .from('countries')
          .select('*')
          .eq('id', countryId)
          .single();
        
        setCountryInfo(data as CountryInfo);
      }
      setLoading(false);
    };

    fetchCountryInfo();
  }, [destinationCity, countryId]);

  // Fallback to local data if Supabase didn't return anything
  useEffect(() => {
    if (!loading && !countryInfo) {
      const countryName = CITY_TO_COUNTRY[destinationCity] || destinationCity;
      const fallback = COUNTRY_FALLBACK[countryName];
      if (fallback) {
        setCountryInfo({ id: 'fallback', ...fallback } as CountryInfo);
      }
    }
  }, [loading, countryInfo, destinationCity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!countryInfo) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Informações do país não disponíveis.</p>
      </div>
    );
  }

  const michelinCount = getMichelinCountForCity(destinationCity);
  const topMichelin = michelinCount > 0 ? getTopMichelinForCity(destinationCity, 5) : [];

  const sections = [
    // Michelin section — only if city has data
    ...(michelinCount > 0 ? [{
      id: 'michelin',
      icon: <UtensilsCrossed size={18} />,
      title: `Restaurantes Michelin (${michelinCount})`,
      content: (
        <div className="space-y-3">
          {topMichelin.map((restaurant, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {restaurant.cuisine} · {restaurant.priceRange}
                  {restaurant.neighborhood && ` · ${restaurant.neighborhood}`}
                </p>
              </div>
              <span className="text-sm flex-shrink-0">
                {getMichelinStarDisplay(restaurant.stars)}
              </span>
            </div>
          ))}
        </div>
      ),
    }] : []),
    {
      id: 'visa',
      icon: <FileCheck size={18} />,
      title: 'Visto',
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {countryInfo.visa_required_br ? (
              <AlertTriangle size={16} className="text-amber-500" />
            ) : (
              <Shield size={16} className="text-emerald-500" />
            )}
            <span className={countryInfo.visa_required_br ? 'text-amber-500' : 'text-emerald-500'}>
              {countryInfo.visa_required_br 
                ? 'Visto obrigatório para brasileiros' 
                : 'Não precisa de visto para brasileiros'}
            </span>
          </div>
          {countryInfo.visa_notes && (
            <p className="text-sm text-muted-foreground">{countryInfo.visa_notes}</p>
          )}
        </div>
      ),
    },
    {
      id: 'vaccines',
      icon: <Syringe size={18} />,
      title: 'Vacinas',
      content: (
        <div className="space-y-3">
          {countryInfo.vaccines_required && countryInfo.vaccines_required.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Obrigatórias:</p>
              <div className="flex flex-wrap gap-2">
                {countryInfo.vaccines_required.map((vaccine, i) => (
                  <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs">
                    {vaccine}
                  </span>
                ))}
              </div>
            </div>
          )}
          {countryInfo.vaccines_recommended && countryInfo.vaccines_recommended.length > 0 && (
            <div>
              <p className="text-sm font-medium text-amber-400 mb-1">Recomendadas:</p>
              <div className="flex flex-wrap gap-2">
                {countryInfo.vaccines_recommended.map((vaccine, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs">
                    {vaccine}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(!countryInfo.vaccines_required || countryInfo.vaccines_required.length === 0) &&
           (!countryInfo.vaccines_recommended || countryInfo.vaccines_recommended.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhuma vacina específica necessária.</p>
          )}
        </div>
      ),
    },
    {
      id: 'currency',
      icon: <Wallet size={18} />,
      title: 'Moeda',
      content: (
        <div className="space-y-2">
          <p className="text-foreground font-medium">
            {countryInfo.currency_code || 'Não especificado'}
          </p>
          <p className="text-sm text-muted-foreground">
            Recomendamos levar um mix de dinheiro local e cartão internacional.
          </p>
        </div>
      ),
    },
    {
      id: 'power',
      icon: <Plug size={18} />,
      title: 'Tomadas & Voltagem',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Voltagem</p>
            <p className="font-medium text-foreground">{countryInfo.voltage || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo de tomada</p>
            <p className="font-medium text-foreground">{countryInfo.power_plug || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'emergency',
      icon: <Phone size={18} />,
      title: 'Números de Emergência',
      content: (
        <div className="space-y-2">
          {countryInfo.emergency_numbers ? (
            Object.entries(countryInfo.emergency_numbers).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-mono text-foreground">{value}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Informações não disponíveis.</p>
          )}
        </div>
      ),
    },
    {
      id: 'tips',
      icon: <Lightbulb size={18} />,
      title: 'Dicas do Clã',
      content: (
        <div className="space-y-2">
          {countryInfo.tips && countryInfo.tips.length > 0 ? (
            countryInfo.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-primary">💡</span>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma dica disponível ainda.</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-foreground font-['Outfit'] flex items-center justify-center gap-2">
          📖 Guia de Viagem — {countryInfo.name_pt}
        </h3>
      </div>

      {sections.map((section) => (
        <Collapsible
          key={section.id}
          open={expandedSection === section.id}
          onOpenChange={(open) => setExpandedSection(open ? section.id : null)}
        >
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="text-primary">{section.icon}</div>
                <span className="font-medium text-foreground">{section.title}</span>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp size={18} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-card/50 border border-t-0 border-border rounded-b-xl -mt-2"
            >
              {section.content}
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
};

export default TripGuide;
