// FlightSelectionStage — Stage 1: Select outbound and return flights

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Plane, Trophy, Clock, ArrowRight, 
  Calendar, Sparkles, ChevronDown, ChevronUp, Check, Lightbulb
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Types
export interface FlightOption {
  id: string;
  airline: string;
  airlineLogo?: string;
  route: string;
  isDirect: boolean;
  connectionCity?: string;
  duration: string;
  durationMinutes: number;
  price: number;
  departureTime: string;
  arrivalTime: string;
  isBestPrice?: boolean;
}

export interface SelectedFlight {
  option: FlightOption;
  date: Date;
}

interface FlightSelectionStageProps {
  destination: string;
  origin: string;
  originCode: string;
  destinationCode: string;
  departureDate: Date;
  returnDate: Date;
  budget: number;
  emoji: string;
  onFlightsSelected: (outbound: SelectedFlight, returnFlight: SelectedFlight) => void;
  onSave: () => void;
  onBack: () => void;
}

// Mock flight options generator
function generateFlightOptions(
  originCode: string,
  destinationCode: string,
  date: Date,
  isReturn: boolean = false
): FlightOption[] {
  const baseOptions: FlightOption[] = [
    {
      id: `${isReturn ? 'return' : 'outbound'}-1`,
      airline: 'TAP Portugal',
      route: isReturn ? `${destinationCode} → LIS → ${originCode}` : `${originCode} → LIS → ${destinationCode}`,
      isDirect: false,
      connectionCity: 'Lisboa',
      duration: isReturn ? '13h50' : '14h30',
      durationMinutes: isReturn ? 830 : 870,
      price: 4200,
      departureTime: isReturn ? '10:45' : '23:15',
      arrivalTime: isReturn ? '06:35+1' : '14:30+1',
      isBestPrice: true,
    },
    {
      id: `${isReturn ? 'return' : 'outbound'}-2`,
      airline: 'Air France',
      route: isReturn ? `${destinationCode} → ${originCode} direto` : `${originCode} → ${destinationCode} direto`,
      isDirect: true,
      duration: isReturn ? '11h30' : '11h20',
      durationMinutes: isReturn ? 690 : 680,
      price: isReturn ? 5500 : 5800,
      departureTime: isReturn ? '23:30' : '22:45',
      arrivalTime: isReturn ? '06:00+1' : '05:05+1',
    },
    {
      id: `${isReturn ? 'return' : 'outbound'}-3`,
      airline: 'Emirates',
      route: isReturn ? `${destinationCode} → DXB → ${originCode}` : `${originCode} → DXB → ${destinationCode}`,
      isDirect: false,
      connectionCity: 'Dubai',
      duration: isReturn ? '19h20' : '18h45',
      durationMinutes: isReturn ? 1160 : 1125,
      price: isReturn ? 4500 : 4600,
      departureTime: isReturn ? '14:20' : '01:30',
      arrivalTime: isReturn ? '09:40+1' : '20:15',
    },
    {
      id: `${isReturn ? 'return' : 'outbound'}-4`,
      airline: isReturn ? 'KLM' : 'LATAM',
      route: isReturn ? `${destinationCode} → AMS → ${originCode}` : `${originCode} → MAD → ${destinationCode}`,
      isDirect: false,
      connectionCity: isReturn ? 'Amsterdam' : 'Madrid',
      duration: isReturn ? '14h20' : '15h00',
      durationMinutes: isReturn ? 860 : 900,
      price: isReturn ? 4100 : 4400,
      departureTime: isReturn ? '11:10' : '21:00',
      arrivalTime: isReturn ? '05:30+1' : '12:00+1',
    },
  ];

  return baseOptions;
}

// Generate price variations for flexible dates
function generateFlexiblePrices(basePrice: number, baseDate: Date): { date: Date; price: number; diff: number }[] {
  const prices: { date: Date; price: number; diff: number }[] = [];
  
  for (let i = -5; i <= 5; i++) {
    const date = addDays(baseDate, i);
    const dayOfWeek = date.getDay();
    
    let variation = 0;
    // Terça/Quarta: -10% to -15%
    if (dayOfWeek === 2 || dayOfWeek === 3) {
      variation = -(Math.random() * 0.05 + 0.10);
    }
    // Sexta/Domingo: +5% to +10%
    else if (dayOfWeek === 0 || dayOfWeek === 5) {
      variation = Math.random() * 0.05 + 0.05;
    }
    // Others: -5% to +5%
    else {
      variation = (Math.random() - 0.5) * 0.10;
    }
    
    const price = Math.round(basePrice * (1 + variation));
    const diff = price - basePrice;
    
    prices.push({ date, price, diff });
  }
  
  return prices;
}

export const FlightSelectionStage = ({
  destination,
  origin,
  originCode,
  destinationCode,
  departureDate,
  returnDate,
  budget,
  emoji,
  onFlightsSelected,
  onSave,
  onBack,
}: FlightSelectionStageProps) => {
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlight | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlight | null>(null);
  const [flexibleDatesModal, setFlexibleDatesModal] = useState<{
    type: 'outbound' | 'return';
    basePrice: number;
    baseDate: Date;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'outbound' | 'return' | null>('outbound');

  const outboundOptions = useMemo(() => 
    generateFlightOptions(originCode, destinationCode, departureDate),
    [originCode, destinationCode, departureDate]
  );

  const returnOptions = useMemo(() => 
    generateFlightOptions(originCode, destinationCode, returnDate, true),
    [originCode, destinationCode, returnDate]
  );

  const flexiblePrices = useMemo(() => {
    if (!flexibleDatesModal) return [];
    return generateFlexiblePrices(flexibleDatesModal.basePrice, flexibleDatesModal.baseDate);
  }, [flexibleDatesModal]);

  const totalFlightCost = (selectedOutbound?.option.price || 0) + (selectedReturn?.option.price || 0);
  const bothSelected = selectedOutbound && selectedReturn;

  const handleSelectFlight = (option: FlightOption, type: 'outbound' | 'return', date: Date) => {
    if (type === 'outbound') {
      setSelectedOutbound({ option, date });
      setExpandedSection('return');
    } else {
      setSelectedReturn({ option, date });
      setExpandedSection(null);
    }
  };

  const handleChangeDateAndSelect = (newDate: Date) => {
    if (!flexibleDatesModal) return;
    
    const options = flexibleDatesModal.type === 'outbound' ? outboundOptions : returnOptions;
    const bestPriceOption = options.find(o => o.isBestPrice) || options[0];
    
    // Adjust price for the new date
    const dayOfWeek = newDate.getDay();
    let variation = 0;
    if (dayOfWeek === 2 || dayOfWeek === 3) variation = -0.12;
    else if (dayOfWeek === 0 || dayOfWeek === 5) variation = 0.07;
    
    const adjustedOption = {
      ...bestPriceOption,
      price: Math.round(bestPriceOption.price * (1 + variation)),
    };
    
    handleSelectFlight(adjustedOption, flexibleDatesModal.type, newDate);
    setFlexibleDatesModal(null);
  };

  const handleGenerateItinerary = () => {
    if (selectedOutbound && selectedReturn) {
      onFlightsSelected(selectedOutbound, selectedReturn);
    }
  };

  const renderFlightOption = (option: FlightOption, type: 'outbound' | 'return', date: Date) => {
    const isSelected = type === 'outbound' 
      ? selectedOutbound?.option.id === option.id 
      : selectedReturn?.option.id === option.id;

    return (
      <motion.div
        key={option.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-xl border-2 transition-all cursor-pointer',
          isSelected 
            ? 'border-primary bg-primary/10' 
            : 'border-border bg-card hover:border-primary/50',
          option.isBestPrice && !isSelected && 'border-amber-500/50'
        )}
        onClick={() => handleSelectFlight(option, type, date)}
      >
        {option.isBestPrice && (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium mb-2">
            <Trophy size={12} />
            <span>MELHOR PREÇO</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{option.airline}</span>
              {option.isDirect && (
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                  DIRETO
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{option.route}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {option.duration}
              </span>
              <span>{option.departureTime} → {option.arrivalTime}</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-lg text-foreground">
              R$ {option.price.toLocaleString('pt-BR')}
            </p>
            {isSelected && (
              <div className="mt-1 flex items-center justify-end text-primary">
                <Check size={16} />
                <span className="text-xs ml-1">Selecionado</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <span className="text-2xl">{emoji}</span>
            <div>
              <h1 className="font-bold text-lg font-['Outfit'] text-foreground">{destination}</h1>
              <p className="text-xs text-muted-foreground">Definir voos</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save size={16} className="mr-1" />
            Salvar
          </Button>
        </div>

        {/* Trip Info */}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>📅 {format(departureDate, 'dd MMM', { locale: ptBR })} - {format(returnDate, 'dd MMM yyyy', { locale: ptBR })}</span>
          <span>• Budget: R$ {budget.toLocaleString('pt-BR')}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 pb-48 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Plane size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground font-['Outfit']">Defina seus voos</h2>
            <p className="text-sm text-muted-foreground">Primeiro, escolha os melhores trechos</p>
          </div>
        </div>

        {/* Outbound Flight Section */}
        <div className="mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === 'outbound' ? null : 'outbound')}
            className={cn(
              'w-full p-4 rounded-xl border-2 transition-all',
              selectedOutbound ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card',
              expandedSection === 'outbound' && 'border-primary'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plane size={20} className={selectedOutbound ? 'text-emerald-500' : 'text-muted-foreground'} />
                <div className="text-left">
                  <p className="font-medium text-foreground">VOO DE IDA</p>
                  <p className="text-sm text-muted-foreground">
                    {origin} ({originCode}) → {destination} ({destinationCode})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {format(departureDate, 'dd/MMM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedOutbound && (
                  <span className="text-emerald-500 text-sm font-medium flex items-center gap-1">
                    <Check size={14} />
                    R$ {selectedOutbound.option.price.toLocaleString('pt-BR')}
                  </span>
                )}
                {expandedSection === 'outbound' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'outbound' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                <p className="text-sm text-muted-foreground font-medium">OPÇÕES ENCONTRADAS:</p>
                
                {outboundOptions.map(option => renderFlightOption(option, 'outbound', departureDate))}

                {/* Flexible dates tip */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">💡 DICA KINU:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "Se você puder viajar 2 dias antes, economia de até R$ 890!"
                      </p>
                      <button
                        onClick={() => setFlexibleDatesModal({
                          type: 'outbound',
                          basePrice: outboundOptions.find(o => o.isBestPrice)?.price || 4200,
                          baseDate: departureDate,
                        })}
                        className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                      >
                        <Calendar size={14} />
                        Ver datas flexíveis
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Return Flight Section */}
        <div className="mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === 'return' ? null : 'return')}
            className={cn(
              'w-full p-4 rounded-xl border-2 transition-all',
              selectedReturn ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card',
              expandedSection === 'return' && 'border-primary'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plane size={20} className={cn(
                  selectedReturn ? 'text-emerald-500' : 'text-muted-foreground',
                  'rotate-180'
                )} />
                <div className="text-left">
                  <p className="font-medium text-foreground">VOO DE VOLTA</p>
                  <p className="text-sm text-muted-foreground">
                    {destination} ({destinationCode}) → {origin} ({originCode})
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {format(returnDate, 'dd/MMM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedReturn && (
                  <span className="text-emerald-500 text-sm font-medium flex items-center gap-1">
                    <Check size={14} />
                    R$ {selectedReturn.option.price.toLocaleString('pt-BR')}
                  </span>
                )}
                {expandedSection === 'return' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </button>

          <AnimatePresence>
            {expandedSection === 'return' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                <p className="text-sm text-muted-foreground font-medium">OPÇÕES ENCONTRADAS:</p>
                
                {returnOptions.map(option => renderFlightOption(option, 'return', returnDate))}

                {/* Flexible dates tip */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">💡 DICA KINU:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "Voos de terça/quarta costumam ser mais baratos!"
                      </p>
                      <button
                        onClick={() => setFlexibleDatesModal({
                          type: 'return',
                          basePrice: returnOptions.find(o => o.isBestPrice)?.price || 4200,
                          baseDate: returnDate,
                        })}
                        className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                      >
                        <Calendar size={14} />
                        Ver datas flexíveis
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Summary */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4">
        <div className="mb-4 p-3 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted-foreground mb-2">RESUMO DOS VOOS SELECIONADOS:</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ida:</span>
              <span className={selectedOutbound ? 'text-foreground' : 'text-muted-foreground italic'}>
                {selectedOutbound 
                  ? `${selectedOutbound.option.airline} • R$ ${selectedOutbound.option.price.toLocaleString('pt-BR')}`
                  : '(não selecionado)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Volta:</span>
              <span className={selectedReturn ? 'text-foreground' : 'text-muted-foreground italic'}>
                {selectedReturn 
                  ? `${selectedReturn.option.airline} • R$ ${selectedReturn.option.price.toLocaleString('pt-BR')}`
                  : '(não selecionado)'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="font-medium text-foreground">Total voos:</span>
              <span className="font-bold text-foreground">
                R$ {totalFlightCost.toLocaleString('pt-BR')} / R$ {budget.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <Button
          className="w-full h-14"
          size="lg"
          disabled={!bothSelected}
          onClick={handleGenerateItinerary}
        >
          <Sparkles size={20} className="mr-2" />
          <span className="font-['Outfit'] text-lg">
            {bothSelected ? 'Gerar Roteiro Inteligente' : 'Selecione ida e volta'}
          </span>
        </Button>
      </footer>

      {/* Flexible Dates Modal */}
      <Dialog open={!!flexibleDatesModal} onOpenChange={() => setFlexibleDatesModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Datas Flexíveis - Melhores Preços
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sua data: {flexibleDatesModal && format(flexibleDatesModal.baseDate, 'dd/MMM', { locale: ptBR })} 
              {' '}— Preço: R$ {flexibleDatesModal?.basePrice.toLocaleString('pt-BR')}
            </p>

            <p className="text-xs font-medium text-muted-foreground mb-3">ALTERNATIVAS:</p>

            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {flexiblePrices.map(({ date, price, diff }) => {
                const isBest = price === Math.min(...flexiblePrices.map(p => p.price));
                const isBase = diff === 0;
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleChangeDateAndSelect(date)}
                    className={cn(
                      'p-3 rounded-xl border transition-all text-center',
                      isBest && 'border-amber-500 bg-amber-500/10',
                      isBase && 'border-primary bg-primary/10',
                      !isBest && !isBase && 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <p className="text-xs text-muted-foreground">
                      {format(date, 'EEE', { locale: ptBR })}
                    </p>
                    <p className="font-medium text-foreground">
                      {format(date, 'dd/MM')}
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      R$ {price.toLocaleString('pt-BR')}
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-red-400' : 'text-muted-foreground'
                    )}>
                      {diff === 0 ? '--' : diff > 0 ? `+R$ ${diff}` : `-R$ ${Math.abs(diff)}`}
                    </p>
                    {isBest && (
                      <div className="mt-1 flex items-center justify-center">
                        <Trophy size={10} className="text-amber-500 mr-1" />
                        <span className="text-[10px] text-amber-500">Menor</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-sm text-foreground">
                  Menor preço: {flexiblePrices.length > 0 && (
                    <>
                      {format(
                        flexiblePrices.reduce((min, p) => p.price < min.price ? p : min).date,
                        "dd/MMM (EEE)",
                        { locale: ptBR }
                      )} - R$ {Math.min(...flexiblePrices.map(p => p.price)).toLocaleString('pt-BR')}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlightSelectionStage;
