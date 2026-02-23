// TripPanel — Orchestrated Executive Dashboard

import { motion } from 'framer-motion';
import { Check, FileText, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportTripPDF } from '@/lib/tripPdfExport';
import { getIcarusRoteiroInsight, getIcarusHeroFlight, getIcarusHeroHotel, getHermesHotelInsight } from '@/lib/agentMessages';
import type { SavedTrip } from '@/types/trip';
import { useState } from 'react';

interface TripPanelProps {
  trip: SavedTrip;
  onConfirm: (type: 'flight' | 'hotel', amount: number) => void;
  onOpenAuction: (type: 'flight' | 'hotel') => void;
  onNavigateTab: (tab: string) => void;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

const TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro', economic: 'Econômico', comfort: 'Conforto', luxury: 'Luxo',
};

const AGENTS = {
  icarus: {
    emoji: '🦅',
    name: 'Ícaro',
    gradient: 'from-sky-500/10 to-cyan-500/10',
    border: 'border-sky-500/20',
    accentColor: 'text-sky-400',
  },
  hestia: {
    emoji: '🏛️',
    name: 'Héstia',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    border: 'border-amber-500/20',
    accentColor: 'text-amber-400',
  },
  hermes: {
    emoji: '⚡',
    name: 'Hermes',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    accentColor: 'text-emerald-400',
  },
};

interface OrchestratedAction {
  agent: 'icarus' | 'hestia' | 'hermes';
  priority: number;
  title: string;
  message: string;
  actionType: 'confirm-flight' | 'confirm-hotel' | 'open-auction-flight' | 'open-auction-hotel' | 'navigate-checklist' | 'navigate-cambio' | 'navigate-packing' | 'navigate-roteiro' | 'export-pdf' | 'celebrate';
  actionLabel: string;
  completed: boolean;
}

function getDaysLeft(trip: SavedTrip): number {
  if (!trip.startDate) return 999;
  return differenceInDays(new Date(trip.startDate), new Date());
}

function getChecklistPct(trip: SavedTrip): number {
  const total = trip.checklist?.length || 0;
  const done = trip.checklist?.filter(i => i.checked).length || 0;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function getPendingItems(trip: SavedTrip): string {
  const pending = trip.checklist?.filter(i => !i.checked).slice(0, 2).map(i => i.label) || [];
  return pending.join(', ') || 'itens';
}

function getOrchestratedActions(trip: SavedTrip): OrchestratedAction[] {
  const actions: OrchestratedAction[] = [];
  const dest = trip.destination || 'o destino';
  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';
  const checklistPct = getChecklistPct(trip);
  const daysUntil = getDaysLeft(trip);
  const currency = (trip as any).destinationCurrency || 'USD';
  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || dest;

  // 1. Flight — urgency-based messaging
  if (!flightConfirmed && daysUntil <= 14 && daysUntil > 0) {
    actions.push({
      agent: 'icarus', priority: 1,
      title: 'Comprar voo AGORA',
      message: `Urgente! Faltam apenas ${daysUntil} dias. Precos de voo tendem a subir nas ultimas 2 semanas. Feche agora para garantir!`,
      actionType: 'open-auction-flight', actionLabel: '🎯 Buscar Ofertas Agora', completed: false,
    });
  } else if (!flightConfirmed && daysUntil > 30) {
    actions.push({
      agent: 'icarus', priority: 2,
      title: 'Monitorar preco do voo',
      message: `Faltam ${daysUntil} dias. Historicamente, voos para ${dest} caem de preco 45-60 dias antes. Quer monitorar por 7 dias?`,
      actionType: 'open-auction-flight', actionLabel: '🎯 Monitorar Voos', completed: false,
    });
  } else {
    actions.push({
      agent: 'icarus', priority: flightConfirmed ? 99 : 1,
      title: 'Voo Ida e Volta',
      message: getIcarusHeroFlight(trip, flightConfirmed),
      actionType: flightConfirmed ? 'celebrate' : 'open-auction-flight',
      actionLabel: flightConfirmed ? '✅ Confirmado' : '🎯 Buscar Voos',
      completed: flightConfirmed,
    });
  }

  // 2. Hotel
  actions.push({
    agent: 'icarus', priority: hotelConfirmed ? 99 : (flightConfirmed ? 2 : 3),
    title: 'Hospedagem',
    message: getIcarusHeroHotel(trip, hotelConfirmed),
    actionType: hotelConfirmed ? 'celebrate' : 'open-auction-hotel',
    actionLabel: hotelConfirmed ? '✅ Confirmado' : '🎯 Buscar Hotel',
    completed: hotelConfirmed,
  });

  // 2b. Hermes hotel insight (only when hotel has neighborhood and not confirmed)
  if (trip.accommodation?.neighborhood && !hotelConfirmed) {
    actions.push({
      agent: 'hermes', priority: 6,
      title: 'Dica de Hospedagem',
      message: getHermesHotelInsight(trip),
      actionType: 'navigate-roteiro',
      actionLabel: '📍 Ver Roteiro',
      completed: false,
    });
  }

  // 3. Câmbio (Héstia)
  const volatileCurrencies = ['ARS', 'TRY', 'EGP'];
  const destCurrency = (trip as any).destinationCurrency || '';
  if (volatileCurrencies.includes(destCurrency)) {
    actions.push({
      agent: 'hestia', priority: 3,
      title: 'Câmbio instável',
      message: `A moeda do destino (${destCurrency}) tem alta volatilidade. Considere levar USD como backup e comprar moeda local gradualmente.`,
      actionType: 'navigate-cambio', actionLabel: '💱 Ver Câmbio', completed: false,
    });
  } else {
    actions.push({
      agent: 'hestia', priority: flightConfirmed && hotelConfirmed ? 3 : 5,
      title: 'Câmbio',
      message: `Comece a comprar ${currency} aos poucos. Diluir o câmbio reduz o risco.`,
      actionType: 'navigate-cambio', actionLabel: '💱 Ver Câmbio', completed: false,
    });
  }

  // 4. Checklist (Hermes)
  actions.push({
    agent: 'hermes', priority: checklistPct === 100 ? 99 : (daysUntil <= 14 ? 2 : 4),
    title: 'Preparação',
    message: checklistPct === 100
      ? `Tudo pronto! Você está preparado para ${dest}!`
      : checklistPct > 50
        ? `Checklist em ${checklistPct}%. Faltam: ${getPendingItems(trip)}`
        : `Muita coisa pendente! Comece pelo passaporte e seguro viagem.`,
    actionType: checklistPct === 100 ? 'celebrate' : 'navigate-checklist',
    actionLabel: checklistPct === 100 ? '✅ Tudo Pronto' : '✅ Ver Checklist',
    completed: checklistPct === 100,
  });

  // 5. Gastronomy suggestion
  const gastroDay = trip.days?.find(d => d.title?.toLowerCase().includes('gastro'));
  if (gastroDay) {
    const hasMichelin = gastroDay.activities?.some(a => a.name?.toLowerCase().includes('michelin'));
    if (!hasMichelin) {
      actions.push({
        agent: 'icarus', priority: 40,
        title: 'Experiência Gastronômica',
        message: `No Dia ${gastroDay.day} (${gastroDay.title}), considere trocar um restaurante por um Michelin local. A diferença de preço pode valer a experiência!`,
        actionType: 'navigate-roteiro', actionLabel: '📋 Ver no Roteiro', completed: false,
      });
    }
  }

  // 6. Early booking reminder
  if (daysUntil > 7 && daysUntil < 30 && flightConfirmed) {
    actions.push({
      agent: 'hermes', priority: 50,
      title: 'Reserve passeios populares',
      message: `Faltam ${daysUntil} dias. Passeios populares em ${dest} costumam esgotar. Confirme os principais no roteiro!`,
      actionType: 'navigate-roteiro', actionLabel: '📋 Ver Roteiro', completed: false,
    });
  }

  // 7. Smart Packing
  if (checklistPct > 50) {
    actions.push({
      agent: 'hermes', priority: 6,
      title: 'Mala Inteligente',
      message: `Hora de montar a mala! Vou te ajudar com base no clima de ${dest}.`,
      actionType: 'navigate-packing', actionLabel: '🧳 Montar Mala', completed: false,
    });
  }

  return actions.sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return a.priority - b.priority;
  });
}

const MiniKPI = ({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) => (
  <div className={`flex-1 text-center py-2 rounded-xl ${urgent ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-white/5 border border-white/5'}`}>
    <p className={`text-sm font-bold font-['Outfit'] ${urgent ? 'text-amber-400' : 'text-foreground'}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export const TripPanel = ({ trip, onConfirm, onOpenAuction, onNavigateTab }: TripPanelProps) => {
  const [confirmModal, setConfirmModal] = useState<{ type: 'flight' | 'hotel'; isOpen: boolean } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [showAllActions, setShowAllActions] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const daysLeft = trip.startDate ? Math.max(0, differenceInDays(new Date(trip.startDate), new Date())) : 0;
  const isPast = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) < 0 : false;

  const totalActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0;
  const confirmedActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.filter(a => a.status === 'confirmed').length || 0), 0) || 0;
  const progressPct = totalActivities > 0 ? Math.round((confirmedActivities / totalActivities) * 100) : 0;

  const checklistPct = getChecklistPct(trip);
  const tierLabel = TIER_LABELS[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';

  const confirmedPct = trip.finances.total > 0 ? Math.round((trip.finances.confirmed / trip.finances.total) * 100) : 0;
  const plannedPct = trip.finances.total > 0 ? Math.min(100 - confirmedPct, Math.round((trip.finances.planned / trip.finances.total) * 100)) : 0;

  const allActions = getOrchestratedActions(trip);
  const visibleActions = showAllActions ? allActions : allActions.slice(0, 3);
  const hiddenCount = allActions.length - 3;

  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';

  const handleConfirm = () => {
    if (confirmModal) {
      onConfirm(confirmModal.type, parseFloat(confirmAmount) || 0);
    }
    setConfirmModal(null);
    setConfirmAmount('');
  };

  const handleAction = (action: OrchestratedAction) => {
    switch (action.actionType) {
      case 'open-auction-flight': onOpenAuction('flight'); break;
      case 'open-auction-hotel': onOpenAuction('hotel'); break;
      case 'confirm-flight': setConfirmModal({ type: 'flight', isOpen: true }); break;
      case 'confirm-hotel': setConfirmModal({ type: 'hotel', isOpen: true }); break;
      case 'navigate-checklist': onNavigateTab('checklist'); break;
      case 'navigate-cambio': onNavigateTab('cambio'); break;
      case 'navigate-packing': onNavigateTab('packing'); break;
      case 'navigate-roteiro': onNavigateTab('roteiro'); break;
      case 'export-pdf': {
        setPdfLoading(true);
        exportTripPDF(trip).finally(() => setPdfLoading(false));
        break;
      }
    }
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      await exportTripPDF(trip);
    } finally {
      setPdfLoading(false);
    }
  };

  // Find first non-completed action index
  const firstActiveIdx = allActions.findIndex(a => !a.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 1. Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-5 border border-[#334155]">
        <div className="absolute top-2 right-3 text-7xl opacity-10 select-none pointer-events-none">
          {trip.emoji}
        </div>
        <h2 className="text-xl font-bold text-foreground font-['Outfit']">
          {trip.emoji} {trip.destination}, {trip.country}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {dateRange} • {trip.travelers} viajante(s) • Faixa {tierLabel}
        </p>
        {trip.accommodation?.name && (
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(trip.accommodation.name + ', ' + trip.destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-2 text-xs text-sky-400 hover:text-sky-300 transition"
          >
            <MapPin className="w-3 h-3" />
            <span>{trip.accommodation.name} — Ver no mapa</span>
          </a>
        )}
        <div className="flex gap-2 mt-4">
          <MiniKPI label={isPast ? 'em viagem' : 'dias'} value={isPast ? 'Em viagem' : String(daysLeft)} urgent={!isPast && daysLeft <= 7} />
          <MiniKPI label="progresso" value={`${progressPct}%`} />
          <MiniKPI label="gasto" value={`R$${fmt(trip.finances.confirmed / 1000)}k`} />
          <MiniKPI label="checklist" value={`${checklistPct}%`} />
        </div>
      </div>

      {/* 2. Próximos Passos — Agentes orquestrando (prioritized, max 3 visible) */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Próximos Passos
        </h3>
        {visibleActions.map((action, i) => {
          const agent = AGENTS[action.agent];
          const globalIdx = allActions.indexOf(action);
          const isFirstActive = globalIdx === firstActiveIdx;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                action.completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60'
                  : `bg-gradient-to-r ${agent.gradient} ${agent.border}`
              } ${isFirstActive ? 'ring-1 ring-emerald-500/30' : ''}`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{agent.emoji}</span>
              <div className="flex-1 min-w-0">
                {isFirstActive && (
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 block">
                    Proximo Passo
                  </span>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold font-['Outfit'] ${action.completed ? 'text-emerald-400' : agent.accentColor}`}>
                    {agent.name}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-foreground">{action.title}</span>
                  {action.completed && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.message}</p>
                {!action.completed && action.actionType !== 'celebrate' && (
                  <button
                    onClick={() => handleAction(action)}
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${agent.accentColor} bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors`}
                  >
                    {action.actionLabel}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllActions(!showAllActions)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            {showAllActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAllActions ? 'Menos' : `+ ${hiddenCount} ações`}
          </button>
        )}
      </div>

      {/* 2.5 — Roteiro Executivo */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <span className="text-sm">🦅</span>
          <p className="flex-1 text-xs text-muted-foreground leading-relaxed">
            {getIcarusRoteiroInsight(trip)}
          </p>
          <button
            onClick={() => onNavigateTab('roteiro')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Editar →
          </button>
        </div>
        <div className="divide-y divide-border">
          {(trip.days || []).map((day) => {
            const realActivities = (day.activities || []).filter(a =>
              a.category !== 'voo' &&
              !(a.category === 'hotel' && (a.name?.toLowerCase().includes('check-in') || a.name?.toLowerCase().includes('check-out'))) &&
              !a.name?.toLowerCase().includes('transfer')
            );
            const confirmedCount = realActivities.filter(a => a.status === 'confirmed').length;
            const dayTotal = realActivities.reduce((sum, a) => sum + (a.cost || 0), 0);
            const dayDate = trip.startDate
              ? format(new Date(new Date(trip.startDate).getTime() + (day.day - 1) * 86400000), "dd/MM (EEE)", { locale: ptBR })
              : '';
            const cleanTitle = (day.title || '').replace(/[^\w\sà-úÀ-Ú—·•\-,]/gi, '').trim();

            return (
              <button
                key={day.day}
                onClick={() => onNavigateTab('roteiro')}
                className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{cleanTitle || `Dia ${day.day}`}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {dayDate} · {realActivities.length} atividades
                    {confirmedCount > 0 && ` · ${confirmedCount} confirmadas`}
                  </p>
                </div>
                {dayTotal > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                    R$ {fmt(dayTotal)}
                  </span>
                )}
                <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${realActivities.length > 0 ? (confirmedCount / realActivities.length) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Resumo Financeiro Compacto */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Financeiro</span>
          <span className="text-xs text-foreground font-['Outfit']">
            R$ {fmt(trip.finances.confirmed)} / R$ {fmt(trip.finances.total)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${confirmedPct}%` }} />
          <div className="h-full bg-yellow-500 transition-all" style={{ width: `${plannedPct}%` }} />
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmado: R$ {fmt(trip.finances.confirmed)}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-yellow-500" /> Planejado: R$ {fmt(trip.finances.planned)}
          </span>
        </div>
      </div>

      {/* 4. Export PDF */}
      <button
        onClick={handleExportPdf}
        disabled={pdfLoading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <FileText size={16} />
        {pdfLoading ? 'Gerando PDF...' : 'Exportar PDF Premium'}
      </button>

      {/* Confirm Modal */}
      <Dialog open={confirmModal?.isOpen || false} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">
              {confirmModal?.type === 'flight' ? 'Confirmar Voo' : 'Confirmar Hospedagem'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Valor pago (R$)</label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
            >
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TripPanel;
