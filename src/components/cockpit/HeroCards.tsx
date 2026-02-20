// HeroCards — Fixed flight + hotel hero cards at the top of cockpit

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Building, Target, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getIcarusHeroFlight, getIcarusHeroHotel } from '@/lib/agentMessages';
import type { SavedTrip } from '@/types/trip';

const TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro', economic: 'Econômico', comfort: 'Conforto', luxury: 'Luxo',
};

interface HeroCardsProps {
  trip: SavedTrip;
  onOpenAuction: (type: 'flight' | 'hotel') => void;
  onConfirm: (type: 'flight' | 'hotel', amount: number) => void;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export const HeroCards = ({ trip, onOpenAuction, onConfirm }: HeroCardsProps) => {
  const [confirmModal, setConfirmModal] = useState<{ type: 'flight' | 'hotel'; isOpen: boolean } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');

  const flights = trip.flights;
  const accommodation = trip.accommodation;
  const tierLabel = TIER_LABELS[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';
  const totalNights = accommodation?.totalNights || 6;
  const travelers = trip.travelers || 2;

  const flightTotal = (flights?.outbound?.price || 0) + (flights?.return?.price || 0);
  const flightMin = Math.round(flightTotal * 0.85);
  const flightMax = Math.round(flightTotal * 1.15);
  const flightConfirmed = flights?.outbound?.status === 'confirmed';

  const hotelTotal = accommodation?.totalPrice || 0;
  const hotelPerNight = accommodation?.nightlyRate || 0;
  const hotelMin = Math.round(hotelTotal * 0.85);
  const hotelMax = Math.round(hotelTotal * 1.15);
  const hotelConfirmed = accommodation?.status === 'confirmed';

  const originCode = flights?.outbound?.origin || 'GRU';
  const destCode = flights?.outbound?.destination || trip.destination;

  const handleConfirm = () => {
    if (confirmModal) {
      onConfirm(confirmModal.type, parseFloat(confirmAmount) || 0);
    }
    setConfirmModal(null);
    setConfirmAmount('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 mb-4"
    >
      {/* Flight Hero Card */}
      <div className="relative bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20 rounded-2xl p-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-l-2xl" />
        
        <div className="pl-2">
          <div className="flex items-center gap-2 mb-2">
            <Plane size={18} className="text-sky-400" />
            <span className="font-bold text-sm text-sky-400 font-['Outfit']">VOO IDA E VOLTA</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${flightConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {flightConfirmed ? '🟢 Confirmado' : '🟡 Planejado'}
            </span>
          </div>
          
          <p className="text-sm text-foreground font-medium mb-1">
            {originCode} → {destCode} → {originCode}
          </p>
          
          <p className="text-xs text-muted-foreground mb-1">
            💰 Estimativa: R$ {fmt(flightMin)} – R$ {fmt(flightMax)}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            👥 {travelers} viajante{travelers > 1 ? 's' : ''}
          </p>

          {!flightConfirmed && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onOpenAuction('flight')}
                className="flex items-center gap-1.5 text-xs font-medium bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-lg hover:bg-sky-500/30 transition-colors"
              >
                <Target size={12} /> Buscar Ofertas
              </button>
              <button
                onClick={() => setConfirmModal({ type: 'flight', isOpen: true })}
                className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <Check size={12} /> Já Comprei
              </button>
            </div>
          )}

          {/* Agent tip */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>🦅</span>
            <span className="italic">{getIcarusHeroFlight(trip, flightConfirmed)}</span>
          </div>
        </div>
      </div>

      {/* Hotel Hero Card */}
      <div className="relative bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-2xl" />
        
        <div className="pl-2">
          <div className="flex items-center gap-2 mb-2">
            <Building size={18} className="text-amber-400" />
            <span className="font-bold text-sm text-amber-400 font-['Outfit']">HOSPEDAGEM</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${hotelConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {hotelConfirmed ? '🟢 Confirmado' : '🟡 Planejado'}
            </span>
          </div>
          
          <p className="text-sm text-foreground font-medium mb-1">
            {trip.destination} • {totalNights} noites • Faixa {tierLabel}
          </p>
          
          <p className="text-xs text-muted-foreground mb-1">
            💰 Estimativa: R$ {fmt(hotelMin)} – R$ {fmt(hotelMax)}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            (R$ {fmt(Math.round(hotelPerNight * 0.85))} – R$ {fmt(Math.round(hotelPerNight * 1.15))} / noite)
          </p>

          {!hotelConfirmed && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => onOpenAuction('hotel')}
                className="flex items-center gap-1.5 text-xs font-medium bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                <Target size={12} /> Buscar Ofertas
              </button>
              <button
                onClick={() => setConfirmModal({ type: 'hotel', isOpen: true })}
                className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <Check size={12} /> Já Reservei
              </button>
            </div>
          )}

          {/* Agent tip */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>🦅</span>
            <span className="italic">{getIcarusHeroHotel(trip, hotelConfirmed)}</span>
          </div>
        </div>
      </div>

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

export default HeroCards;
