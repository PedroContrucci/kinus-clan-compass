// TripPanel — Executive dashboard for active trips

import { motion } from 'framer-motion';
import { Plane, Building, Target, Check, ChevronRight, FileText } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AgentTip } from '@/components/shared/AgentTip';
import { exportTripPDF } from '@/lib/tripPdfExport';
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

function getAgentMessage(trip: SavedTrip): { agent: 'icarus' | 'hestia' | 'hermes'; message: string; actionLabel?: string; actionTab?: string } {
  const daysLeft = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) : 999;
  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';
  const checklistTotal = trip.checklist?.length || 0;
  const checklistDone = trip.checklist?.filter(i => i.checked).length || 0;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  if (daysLeft <= 7 && daysLeft > 0) {
    return { agent: 'hermes', message: `⚠️ ${daysLeft} dias! Checklist em ${checklistPct}%. Corre lá!`, actionLabel: '✅ Checklist', actionTab: 'checklist' };
  }
  if (!flightConfirmed) {
    return { agent: 'icarus', message: `Próximo passo: confirme o voo. Quer que eu busque ofertas?`, actionLabel: '🎯 Buscar Ofertas', actionTab: 'flight-auction' };
  }
  if (!hotelConfirmed) {
    return { agent: 'icarus', message: `Voo fechado! Agora confirme o hotel. Posso ajudar!`, actionLabel: '🎯 Buscar Ofertas', actionTab: 'hotel-auction' };
  }
  if (checklistPct < 50) {
    return { agent: 'hermes', message: `Checklist em ${checklistPct}%. Pendente: ${trip.checklist?.find(i => !i.checked)?.label || 'itens'}`, actionLabel: '✅ Checklist', actionTab: 'checklist' };
  }
  const confirmed = trip.finances.confirmed;
  const total = trip.finances.total;
  if (confirmed > total) {
    return { agent: 'hestia', message: `⚠️ Gastos ultrapassaram o orçamento em R$ ${fmt(confirmed - total)}.`, actionLabel: '📊 Ver Detalhes', actionTab: 'cambio' };
  }
  return { agent: 'hestia', message: `Tudo encaminhado! Orçamento saudável. 🎉`, actionLabel: '💱 Ver Câmbio', actionTab: 'cambio' };
}

export const TripPanel = ({ trip, onConfirm, onOpenAuction, onNavigateTab }: TripPanelProps) => {
  const [confirmModal, setConfirmModal] = useState<{ type: 'flight' | 'hotel'; isOpen: boolean } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');

  const daysLeft = trip.startDate ? Math.max(0, differenceInDays(new Date(trip.startDate), new Date())) : 0;
  const isPast = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) < 0 : false;

  const totalActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0;
  const confirmedActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.filter(a => a.status === 'confirmed').length || 0), 0) || 0;
  const progressPct = totalActivities > 0 ? Math.round((confirmedActivities / totalActivities) * 100) : 0;

  const checklistTotal = trip.checklist?.length || 0;
  const checklistDone = trip.checklist?.filter(i => i.checked).length || 0;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';
  const flightTotal = (trip.flights?.outbound?.price || 0) + (trip.flights?.return?.price || 0);
  const hotelTotal = trip.accommodation?.totalPrice || 0;
  const tierLabel = TIER_LABELS[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';
  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || trip.destination;
  const totalNights = trip.accommodation?.totalNights || 0;

  const confirmedPct = trip.finances.total > 0 ? Math.round((trip.finances.confirmed / trip.finances.total) * 100) : 0;
  const plannedPct = trip.finances.total > 0 ? Math.round((trip.finances.planned / trip.finances.total) * 100) : 0;
  const availablePct = Math.max(0, 100 - confirmedPct - plannedPct);

  const agentData = getAgentMessage(trip);

  const handleConfirm = () => {
    if (confirmModal) {
      onConfirm(confirmModal.type, parseFloat(confirmAmount) || 0);
    }
    setConfirmModal(null);
    setConfirmAmount('');
  };

  const handleAgentAction = () => {
    if (agentData.actionTab === 'flight-auction') onOpenAuction('flight');
    else if (agentData.actionTab === 'hotel-auction') onOpenAuction('hotel');
    else if (agentData.actionTab) onNavigateTab(agentData.actionTab);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 animate-fade-in"
    >
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: isPast ? '🛫 Em viagem' : 'dias', value: isPast ? '—' : String(daysLeft), accent: daysLeft <= 7 },
          { label: 'progresso', value: `${progressPct}%`, accent: false },
          { label: 'gasto', value: `R$ ${fmt(trip.finances.confirmed)}`, accent: false },
          { label: 'checklist', value: `${checklistPct}%`, accent: false },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-card border border-border rounded-xl p-3 text-center ${kpi.accent ? 'border-yellow-500/50' : ''}`}>
            <p className={`text-lg font-bold font-['Outfit'] ${kpi.accent ? 'text-yellow-400' : 'text-foreground'}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Key Items */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground font-['Outfit']">Itens Chave</h3>

        {/* Flight */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-sky-400" />
            <span className="text-sm font-medium text-foreground">Voo Ida+Volta</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${flightConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {flightConfirmed ? '🟢 Confirmado' : '🟡 Pendente'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">{originCode} → {destCode} → {originCode}</p>
          <p className="text-xs text-muted-foreground pl-6">
            {flightConfirmed ? `R$ ${fmt(trip.flights?.outbound?.price || 0)}` : `~R$ ${fmt(flightTotal)}`}
          </p>
          {!flightConfirmed && (
            <div className="flex gap-2 pl-6 mt-1">
              <button onClick={() => onOpenAuction('flight')} className="flex items-center gap-1 text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg hover:bg-sky-500/20 transition-colors">
                <Target size={12} /> Buscar Ofertas
              </button>
              <button onClick={() => setConfirmModal({ type: 'flight', isOpen: true })} className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors">
                <Check size={12} /> Já Comprei
              </button>
            </div>
          )}
        </div>

        {/* Hotel */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-amber-400" />
            <span className="text-sm font-medium text-foreground">Hospedagem</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${hotelConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {hotelConfirmed ? '🟢 Confirmado' : '🟡 Pendente'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">{totalNights} noites • Faixa {tierLabel}</p>
          <p className="text-xs text-muted-foreground pl-6">
            {hotelConfirmed ? `R$ ${fmt(trip.accommodation?.totalPrice || 0)}` : `~R$ ${fmt(hotelTotal)}`}
          </p>
          {!hotelConfirmed && (
            <div className="flex gap-2 pl-6 mt-1">
              <button onClick={() => onOpenAuction('hotel')} className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition-colors">
                <Target size={12} /> Buscar Ofertas
              </button>
              <button onClick={() => setConfirmModal({ type: 'hotel', isOpen: true })} className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors">
                <Check size={12} /> Já Reservei
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Financial */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground font-['Outfit']">Financeiro</h3>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${confirmedPct}%` }} />
          <div className="h-full bg-yellow-500 transition-all" style={{ width: `${plannedPct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Confirmado</span>
            <span className="text-foreground font-medium ml-auto">R$ {fmt(trip.finances.confirmed)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Planejado</span>
            <span className="text-foreground font-medium ml-auto">R$ {fmt(trip.finances.planned)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
            <span className="text-muted-foreground">Disponível</span>
            <span className="text-foreground font-medium ml-auto">R$ {fmt(trip.finances.available)}</span>
          </div>
        </div>
      </div>

      {/* Checklist Summary */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground font-['Outfit']">Checklist</h3>
        <div className="flex flex-wrap gap-2">
          {(trip.checklist || []).slice(0, 6).map((item) => (
            <span key={item.id} className={`text-xs px-2 py-1 rounded-lg ${item.checked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              {item.checked ? '✅' : '⬜'} {item.label}
            </span>
          ))}
        </div>
        <button
          onClick={() => onNavigateTab('checklist')}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Ver checklist completa <ChevronRight size={14} />
        </button>
      </div>

      {/* Agent Action */}
      <AgentTip
        agent={agentData.agent}
        variant="full"
        message={agentData.message}
        action={agentData.actionLabel ? { label: agentData.actionLabel, onClick: handleAgentAction } : undefined}
      />

      {/* Export PDF */}
      <button
        onClick={() => exportTripPDF(trip)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-sm"
      >
        <FileText size={16} />
        📄 Exportar PDF da Viagem
      </button>

      {/* Confirm Modal */}
      <Dialog open={confirmModal?.isOpen || false} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">
              ✅ {confirmModal?.type === 'flight' ? 'Confirmar Voo' : 'Confirmar Hospedagem'}
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
