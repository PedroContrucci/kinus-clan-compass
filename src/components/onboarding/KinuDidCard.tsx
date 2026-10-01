// KinuDidCard — "O que o KINU fez": cada escolha automática do fluxo com o porquê e onde trocar.
// Some quando a viagem é ativada (só é renderizado em rascunho).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Rocket } from 'lucide-react';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { applyHotelSwap, type SwapTripLike } from '@/lib/hotelSwap';
import { kinuDidLines } from '@/lib/onboardingFlow';

interface Props {
  trip: any;
  onActivate: () => void;
  onUpdateTrip: (updater: (t: any) => any) => void;
}

export const KinuDidCard = ({ trip, onActivate, onUpdateTrip }: Props) => {
  const navigate = useNavigate();
  const [swapOpen, setSwapOpen] = useState(false);
  const l = kinuDidLines(trip);
  const toCockpit = () => document.getElementById('draft-cockpit')?.scrollIntoView({ behavior: 'smooth' });

  const rows: { icon: string; text: string; action: () => void }[] = [
    { icon: '🛫', text: l.origin, action: () => navigate('/planejar') },
    { icon: '🏨', text: l.hotel, action: () => setSwapOpen(true) },
    { icon: '✈️', text: l.flight, action: toCockpit },
    { icon: '🗺️', text: l.itinerary, action: toCockpit },
    { icon: '💰', text: l.budget, action: () => navigate('/planejar') },
  ];

  return (
    <section className="mx-4 mt-4 bg-card border border-border rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground font-['Outfit']">
        <Sparkles size={16} className="text-primary" /> O que o KINU fez
      </h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.icon} className="flex items-start gap-2 text-sm">
            <span>{r.icon}</span>
            <span className="flex-1 text-foreground">{r.text}</span>
            <button onClick={r.action} className="shrink-0 text-primary text-xs underline-offset-2 hover:underline">trocar</button>
          </li>
        ))}
      </ul>
      <button onClick={onActivate}
        className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold font-['Outfit'] flex items-center justify-center gap-2">
        <Rocket size={16} /> Ativar
      </button>
      <HotelSwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        trip={trip as SwapTripLike}
        onSelect={(hotel) => { onUpdateTrip((t) => applyHotelSwap(t, hotel)); setSwapOpen(false); }}
      />
    </section>
  );
};

export default KinuDidCard;
