// FlightSelectionStage — Stage 1: Select outbound and return flights
// Lista: índice 0 = estimativa do KINU ("Sugerido pelo KINU · estimado"); abaixo, preços de
// referência (Travelpayouts, via function `amadeus-flights`) normalizados por offerToSelected
// e ordenados pela regra escrita em src/lib/flightRanking.ts.

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Plane, Trophy, Clock, ArrowRight, 
  Calendar, Sparkles, ChevronDown, ChevronUp, Check, Lightbulb,
  Loader2, AlertCircle, Zap, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  useFlightSearch, 
  useFlexibleFlightSearch,
  FlexibleDateResult,
  formatFlightPrice 
} from '@/hooks/useFlightSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { offerToSelected, flightDaysLater, formatDurationHM, durationTextToMinutes } from '@/lib/flightModel';
import { rankFlights } from '@/lib/flightRanking';

// Types - Extended to support Amadeus data
// Tipos do voo moram no motor de roteiro (puro); reexportados para os imports existentes.
import type { FlightOption, SelectedFlight } from '@/lib/itineraryEngine';
export type { FlightOption, SelectedFlight };

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
  /** Estimativa do KINU: sempre o índice 0 da lista, rotulada "Sugerido pelo KINU · estimado". */
  estimate?: { outbound?: SelectedFlight; return?: SelectedFlight };
  /** Voos atuais da viagem (pré-seleção). Sem eles, pré-seleciona a estimativa. */
  current?: { outbound?: SelectedFlight; return?: SelectedFlight };
  /** Ofertas já normalizadas pelo cockpit (busca ao abrir o rascunho). Ausente = o estágio busca. */
  offers?: { outbound: SelectedFlight[]; return: SelectedFlight[]; loading?: boolean };
  /** Painel dentro do card do cockpit: sem header, sem tela cheia, rodapé no fluxo (não fixo). */
  embedded?: boolean;
}

type ListItem = SelectedFlight & { isEstimate?: boolean };

// Fallback mock data when API fails or returns empty.
// originCode/destinationCode are always the TRIP's origin and destination — the
// direction is derived here from isReturn, so callers must not pre-swap them.
// Exported for the regression test that pins that invariant.
export function generateFallbackFlightOptions(
  originCode: string,
  destinationCode: string,
  isReturn: boolean = false
): FlightOption[] {
  const BR_AIRPORTS = ['GRU','CGH','VCP','GIG','SDU','BSB','CNF','SSA','REC','FOR',
    'POA','CWB','FLN','MCZ','NAT','BEL','MAO','VIX','GYN','CGB','CGR','SLZ','THE',
    'AJU','MCP','RBR','PMW','BVB','BPS','IOS','JPA'];
  const isDomestic = BR_AIRPORTS.includes(originCode) && BR_AIRPORTS.includes(destinationCode);

  if (isDomestic) {
    return [
      { id: `${isReturn?'return':'outbound'}-fallback-dom-1`, airline: 'Estimativa · companhia a definir',
        route: isReturn?`${destinationCode} → ${originCode}`:`${originCode} → ${destinationCode}`,
        isDirect: true, duration: '1h05', durationMinutes: 65, price: isReturn?890:850,
        departureTime: isReturn?'18:30':'08:15', arrivalTime: isReturn?'19:35':'09:20',
        isBestPrice: true },
      { id: `${isReturn?'return':'outbound'}-fallback-dom-2`, airline: 'Estimativa · companhia a definir',
        route: isReturn?`${destinationCode} → ${originCode}`:`${originCode} → ${destinationCode}`,
        isDirect: true, duration: '1h10', durationMinutes: 70, price: isReturn?965:920,
        departureTime: isReturn?'20:00':'10:40', arrivalTime: isReturn?'21:10':'11:50',
        isFastest: true },
      { id: `${isReturn?'return':'outbound'}-fallback-dom-3`, airline: 'Estimativa · companhia a definir',
        route: isReturn?`${destinationCode} → ${originCode}`:`${originCode} → ${destinationCode}`,
        isDirect: true, duration: '1h15', durationMinutes: 75, price: isReturn?1010:1050,
        departureTime: isReturn?'15:20':'13:30', arrivalTime: isReturn?'16:35':'14:45' },
    ];
  }

  const baseOptions: FlightOption[] = [
    {
      id: `${isReturn ? 'return' : 'outbound'}-fallback-1`,
      airline: 'Estimativa · companhia a definir',
      route: isReturn ? `${destinationCode} → ${originCode}` : `${originCode} → ${destinationCode}`,
      isDirect: true,
      duration: isReturn ? '13h50' : '14h30',
      durationMinutes: isReturn ? 830 : 870,
      price: 4200,
      departureTime: isReturn ? '10:45' : '23:15',
      arrivalTime: isReturn ? '06:35' : '14:30',
      isBestPrice: true,
    },
    {
      id: `${isReturn ? 'return' : 'outbound'}-fallback-2`,
      airline: 'Estimativa · companhia a definir',
      route: isReturn ? `${destinationCode} → ${originCode}` : `${originCode} → ${destinationCode}`,
      isDirect: true,
      duration: isReturn ? '11h30' : '11h20',
      durationMinutes: isReturn ? 690 : 680,
      price: isReturn ? 5500 : 5800,
      departureTime: isReturn ? '23:30' : '22:45',
      arrivalTime: isReturn ? '06:00' : '05:05',
      isFastest: true,
    },
    {
      id: `${isReturn ? 'return' : 'outbound'}-fallback-3`,
      airline: 'Estimativa · companhia a definir',
      route: isReturn ? `${destinationCode} → ${originCode}` : `${originCode} → ${destinationCode}`,
      isDirect: true,
      duration: isReturn ? '19h20' : '18h45',
      durationMinutes: isReturn ? 1160 : 1125,
      price: isReturn ? 4500 : 4600,
      departureTime: isReturn ? '14:20' : '01:30',
      arrivalTime: isReturn ? '09:40' : '20:15',
    },
  ];

  return baseOptions;
}

// Format date for API (YYYY-MM-DD)
function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
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
  estimate,
  current,
  offers,
  embedded = false,
}: FlightSelectionStageProps) => {
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlight | null>(current?.outbound ?? estimate?.outbound ?? null);
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlight | null>(current?.return ?? estimate?.return ?? null);
  const [flexibleDatesModal, setFlexibleDatesModal] = useState<{
    type: 'outbound' | 'return';
    basePrice: number;
    baseDate: Date;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'outbound' | 'return' | null>('outbound');
  const [sortBy, setSortBy] = useState<'price' | 'duration'>('price');

  // Fetch outbound flights from Amadeus API
  const { 
    data: outboundData, 
    isLoading: outboundLoading, 
    error: outboundError,
    refetch: refetchOutbound 
  } = useFlightSearch(
    originCode,
    destinationCode,
    formatDateForAPI(departureDate),
    1,
    offers === undefined
  );

  // Fetch return flights from Amadeus API
  const { 
    data: returnData, 
    isLoading: returnLoading, 
    error: returnError,
    refetch: refetchReturn 
  } = useFlightSearch(
    destinationCode,
    originCode,
    formatDateForAPI(returnDate),
    1,
    offers === undefined
  );

  // Fetch flexible dates for outbound
  const { data: flexibleOutbound } = useFlexibleFlightSearch(
    originCode,
    destinationCode,
    formatDateForAPI(departureDate),
    1,
    3,
    !!flexibleDatesModal && flexibleDatesModal.type === 'outbound'
  );

  // Fetch flexible dates for return
  const { data: flexibleReturn } = useFlexibleFlightSearch(
    destinationCode,
    originCode,
    formatDateForAPI(returnDate),
    1,
    3,
    !!flexibleDatesModal && flexibleDatesModal.type === 'return'
  );

  // Ofertas de referência → SelectedFlight pelo MESMO modelo do voo (fuso, D+n, fonte).
  const realOutbound: SelectedFlight[] = useMemo(() => offers
    ? offers.outbound
    : (outboundData || []).map(o => offerToSelected(o, { date: departureDate, fromCity: origin, toCity: destination })),
  [offers, outboundData, departureDate, origin, destination]);
  const realReturn: SelectedFlight[] = useMemo(() => offers
    ? offers.return
    : (returnData || []).map(o => offerToSelected(o, { date: returnDate, fromCity: destination, toCity: origin })),
  [offers, returnData, returnDate, origin, destination]);
  const outboundLoadingAll = offers ? !!offers.loading : outboundLoading;
  const returnLoadingAll = offers ? !!offers.loading : returnLoading;

  // Lista = estimativa (índice 0) + ofertas reais pelo ranking. Os mocks "Estimativa ·
  // companhia a definir" (preço inventado) só aparecem no legado, sem estimativa e sem oferta.
  const buildList = (real: SelectedFlight[], est: SelectedFlight | undefined, isReturn: boolean, date: Date): ListItem[] => {
    const base: ListItem[] = real.length
      ? rankFlights(real, sortBy === 'price' ? 'kinu' : 'fastest')
      : est ? [] : generateFallbackFlightOptions(originCode, destinationCode, isReturn).map(option => ({ option, date }));
    const minPrice = Math.min(...base.map(o => o.option.price));
    const minDuration = Math.min(...base.map(o => o.option.durationMinutes));
    const bp = base.findIndex(o => o.option.price === minPrice);
    const fa = base.findIndex(o => o.option.durationMinutes === minDuration);
    // Cópia: as ofertas podem vir das props do cockpit (nunca mutar).
    const ranked = base.map((o, i) => ({ ...o, option: { ...o.option, isBestPrice: i === bp, isFastest: i === fa } }));
    return est ? [{ ...est, isEstimate: true }, ...ranked] : ranked;
  };
  const sortedOutboundOptions = useMemo(
    () => buildList(realOutbound, estimate?.outbound, false, departureDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [realOutbound, estimate?.outbound, sortBy, originCode, destinationCode, departureDate]);
  const sortedReturnOptions = useMemo(
    () => buildList(realReturn, estimate?.return, true, returnDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [realReturn, estimate?.return, sortBy, originCode, destinationCode, returnDate]);
  const hasReference = realOutbound.length > 0 || realReturn.length > 0;

  // Flexible prices from API
  const flexiblePrices = useMemo(() => {
    const flexData = flexibleDatesModal?.type === 'outbound' ? flexibleOutbound : flexibleReturn;
    if (!flexData) return [];
    
    return flexData.map(item => ({
      date: new Date(item.date),
      price: item.bestPrice,
      diff: item.bestPrice - (flexibleDatesModal?.basePrice || 0),
    }));
  }, [flexibleDatesModal, flexibleOutbound, flexibleReturn]);

  const totalFlightCost = (selectedOutbound?.option.price || 0) + (selectedReturn?.option.price || 0);
  const bothSelected = selectedOutbound && selectedReturn;

  const handleSelectFlight = (item: ListItem, type: 'outbound' | 'return', date: Date) => {
    // Escolha na lista é do usuário (chosenBy 'user'); a fonte segue a do item.
    const { isEstimate, kinuPick, ...rest } = item;
    const picked: SelectedFlight = { ...rest, date, chosenBy: 'user' };
    if (type === 'outbound') {
      setSelectedOutbound(picked);
      setExpandedSection('return');
    } else {
      setSelectedReturn(picked);
      setExpandedSection(null);
    }
  };

  const handleChangeDateAndSelect = (newDate: Date) => {
    if (!flexibleDatesModal) return;
    
    const options = flexibleDatesModal.type === 'outbound' ? sortedOutboundOptions : sortedReturnOptions;
    const best = options.find(o => o.option.isBestPrice) || options[0];
    if (!best) return;
    const bestPriceOption = best.option;
    
    // Adjust price for the new date
    const dayOfWeek = newDate.getDay();
    let variation = 0;
    if (dayOfWeek === 2 || dayOfWeek === 3) variation = -0.12;
    else if (dayOfWeek === 0 || dayOfWeek === 5) variation = 0.07;
    
    const adjustedOption = {
      ...bestPriceOption,
      price: Math.round(bestPriceOption.price * (1 + variation)),
    };
    
    handleSelectFlight({ ...best, option: adjustedOption }, flexibleDatesModal.type, newDate);
    setFlexibleDatesModal(null);
  };

  const handleGenerateItinerary = () => {
    if (selectedOutbound && selectedReturn) {
      onFlightsSelected(selectedOutbound, selectedReturn);
    }
  };

  // Loading skeleton for flight options
  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
          <div className="flex justify-between mt-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  // Error message component
  const renderError = (error: Error | null, onRetry: () => void) => (
    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-destructive mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Erro ao buscar voos</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || 'Não foi possível carregar os voos. Usando dados de exemplo.'}
          </p>
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );

  const renderFlightOption = (item: ListItem, type: 'outbound' | 'return', date: Date) => {
    const option = item.option;
    const isSelected = type === 'outbound' 
      ? selectedOutbound?.option.id === option.id 
      : selectedReturn?.option.id === option.id;
    const chosenByKinu = (type === 'outbound' ? current?.outbound : current?.return);
    const isKinuPick = !item.isEstimate && chosenByKinu?.chosenBy === 'kinu' && chosenByKinu.option.id === option.id;

    const dayOffset = flightDaysLater(item);

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
          option.isBestPrice && !isSelected && 'border-amber-500/50',
          option.isFastest && !option.isBestPrice && !isSelected && 'border-sky-500/50'
        )}
        onClick={() => handleSelectFlight(item, type, date)}
      >
        <div className="flex items-center gap-2 mb-2">
          {item.isEstimate && (
            <div className="flex items-center gap-1 text-primary text-xs font-medium">
              <Sparkles size={12} />
              <span>Sugerido pelo KINU · estimado</span>
            </div>
          )}
          {isKinuPick && (
            <div className="flex items-center gap-1 text-primary text-xs font-medium">
              <Sparkles size={12} />
              <span>KINU escolheu</span>
            </div>
          )}
          {option.isBestPrice && (
            <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
              <Trophy size={12} />
              <span>MELHOR PREÇO</span>
            </div>
          )}
          {option.isFastest && !option.isBestPrice && (
            <div className="flex items-center gap-1 text-sky-400 text-xs font-medium">
              <Zap size={12} />
              <span>MAIS RÁPIDO</span>
            </div>
          )}
        </div>
        
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
                {(() => { const m = option.durationMinutes || durationTextToMinutes(option.duration); return m > 0 ? formatDurationHM(m) : option.duration; })()}
              </span>
              <span>
                {option.departureTime} → {item.tzKnown === false ? 'chegada a confirmar' : option.arrivalTime}
                {dayOffset >= 1 && (
                  <span className="ml-1 text-xs" style={{ color: '#eab308' }}>+{dayOffset}</span>
                )}
              </span>
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
    <div className={embedded ? 'bg-background flex flex-col' : 'min-h-screen bg-background flex flex-col'}>
      {/* Header */}
      {!embedded && (
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
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
      )}

      {/* Main Content */}
      <main className={embedded ? 'px-1 py-3' : 'flex-1 px-4 py-6 pb-72 overflow-y-auto'}>
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
                {/* Sort controls */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    {outboundLoadingAll ? 'BUSCANDO VOOS...' : `${sortedOutboundOptions.length} OPÇÕES ENCONTRADAS:`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('price')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        sortBy === 'price' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      Menor preço
                    </button>
                    <button
                      onClick={() => setSortBy('duration')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        sortBy === 'duration' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      Mais rápido
                    </button>
                  </div>
                </div>
                
                {/* Loading state */}
                {hasReference && <p className="text-[11px] text-muted-foreground">preços de referência · Travelpayouts</p>}
                {outboundLoadingAll && renderLoadingSkeleton()}
                
                {/* Error state — only when no offers loaded and not currently fetching */}
                {outboundError && !outboundLoadingAll && sortedOutboundOptions.length === 0 &&
                  renderError(outboundError as Error, refetchOutbound)}
                
                {/* Flight options */}
                {(!outboundLoadingAll || estimate?.outbound) && sortedOutboundOptions.map(item =>
                  renderFlightOption(item, 'outbound', departureDate)
                )}

                {/* Flexible dates tip */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">💡 DICA KINU:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "Pesquise datas flexíveis para encontrar economia de até 20%!"
                      </p>
                      <button
                        onClick={() => setFlexibleDatesModal({
                          type: 'outbound',
                          basePrice: sortedOutboundOptions.find(o => o.option.isBestPrice)?.option.price || sortedOutboundOptions[0]?.option.price || 4200,
                          baseDate: departureDate,
                        })}
                        className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                      >
                        <Calendar size={14} />
                        Ver datas flexíveis (±3 dias)
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
                {/* Sort controls */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    {returnLoadingAll ? 'BUSCANDO VOOS...' : `${sortedReturnOptions.length} OPÇÕES ENCONTRADAS:`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('price')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        sortBy === 'price' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      Menor preço
                    </button>
                    <button
                      onClick={() => setSortBy('duration')}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        sortBy === 'duration' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      Mais rápido
                    </button>
                  </div>
                </div>
                
                {/* Loading state */}
                {hasReference && <p className="text-[11px] text-muted-foreground">preços de referência · Travelpayouts</p>}
                {returnLoadingAll && renderLoadingSkeleton()}
                
                {/* Error state — only when no offers loaded and not currently fetching */}
                {returnError && !returnLoadingAll && sortedReturnOptions.length === 0 &&
                  renderError(returnError as Error, refetchReturn)}
                
                {/* Flight options */}
                {(!returnLoadingAll || estimate?.return) && sortedReturnOptions.map(item =>
                  renderFlightOption(item, 'return', returnDate)
                )}

                {/* Flexible dates tip */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">💡 DICA KINU:</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "Pesquise datas flexíveis para encontrar economia de até 20%!"
                      </p>
                      <button
                        onClick={() => setFlexibleDatesModal({
                          type: 'return',
                          basePrice: sortedReturnOptions.find(o => o.option.isBestPrice)?.option.price || sortedReturnOptions[0]?.option.price || 4200,
                          baseDate: returnDate,
                        })}
                        className="mt-2 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                      >
                        <Calendar size={14} />
                        Ver datas flexíveis (±3 dias)
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
      {/* z-20: abaixo da trilha do rascunho (z-30); o pb-72 do main deixa o fim da lista visível. */}
      <footer className={embedded ? 'border-t border-border pt-3' : 'fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-lg border-t border-border p-4'}>
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
