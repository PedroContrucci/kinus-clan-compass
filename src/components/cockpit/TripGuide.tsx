// TripGuide — Travel guide with country info: visa, vaccines, currency, tips

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCheck, Syringe, Wallet, Plug, Phone, Lightbulb, 
  Shield, AlertTriangle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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

  const sections = [
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
