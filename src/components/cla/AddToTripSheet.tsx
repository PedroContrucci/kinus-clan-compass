// "➕ Adicionar à minha viagem" — o Clã como FONTE do roteiro.
// Atividade: mesma inserção do agente (addCatalogActivityToDay). Hotel: applyHotelSwap.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { listTrips, updateTrip, type StoredTrip } from '@/lib/tripStore';
import { addCatalogActivityToDay, defaultTimeFor } from '@/lib/tripItineraryOps';
import { applyHotelSwap } from '@/lib/hotelSwap';
import { trackEvent } from '@/lib/kinuEvents';
import type { SuggestedActivity } from '@/data/destinationActivities';
import type { CuratedHotel } from '@/data/curatedHotels';
import type { SavedTrip } from '@/types/trip';

export type AddTarget =
  | { kind: 'activity'; activity: SuggestedActivity }
  | { kind: 'hotel'; hotel: CuratedHotel };

const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function tripMatchesCity(trip: StoredTrip, city: string): boolean {
  const d = norm(String(trip.destination || ''));
  return !!d && d.includes(norm(city));
}

const fmt = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'dd MMM', { locale: ptBR });
};

interface Props {
  target: AddTarget | null;
  city: string;
  onClose: () => void;
}

export function AddToTripSheet({ target, city, onClose }: Props) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('10:00');

  useEffect(() => {
    if (!target) return;
    const list = listTrips().filter((t) => t.status === 'draft' || t.status === 'active');
    setTrips(list);
    const first = list.find((t) => tripMatchesCity(t, city));
    setTripId(first?.id ?? null);
    setDay(1);
    setTime(target.kind === 'activity' ? defaultTimeFor(target.activity.category) : '10:00');
  }, [target, city]);

  const trip = useMemo(() => trips.find((t) => t.id === tripId) ?? null, [trips, tripId]);
  const hasCityTrip = trips.some((t) => tripMatchesCity(t, city));
  const name = target?.kind === 'activity' ? target.activity.name : target?.hotel.name;

  const apply = () => {
    if (!target || !trip) return;
    if (target.kind === 'hotel') {
      const saved = updateTrip(trip.id, (t) => applyHotelSwap(t, target.hotel));
      if (!saved) return toast.error('Não consegui atualizar a viagem.');
      trackEvent('cla.add_to_trip', { activity_id: target.hotel.id, city, trip_id: trip.id });
      toast.success(`Hotel da viagem ${trip.destination}: ${target.hotel.name}`);
      return onClose();
    }
    let ok = false;
    updateTrip(trip.id, (t) => {
      const copy: SavedTrip = JSON.parse(JSON.stringify(t));
      ok = addCatalogActivityToDay(copy, day, target.activity, time);
      return (ok ? copy : t) as StoredTrip;
    });
    if (!ok) return toast.error('Esse dia não existe na viagem.');
    trackEvent('cla.add_to_trip', { activity_id: target.activity.id, city, trip_id: trip.id });
    toast.success(`Adicionada ao dia ${day} da viagem ${trip.destination}`);
    onClose();
  };

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>{target?.kind === 'hotel' ? 'Usar este hotel' : 'Adicionar à minha viagem'}</SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>

        {!hasCityTrip ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Você ainda não tem viagem para {city}.</p>
            <Button className="w-full" onClick={() => { onClose(); navigate('/planejar', { state: { openWizardFor: city } }); }}>
              Planejar uma viagem para {city}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Viagem</p>
              {trips.map((t) => {
                const same = tripMatchesCity(t, city);
                const active = t.id === tripId;
                return (
                  <button
                    key={t.id}
                    disabled={!same}
                    onClick={() => { setTripId(t.id); setDay(1); }}
                    className={`w-full rounded-xl border p-3 text-left transition-colors disabled:opacity-50 ${active ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{t.emoji} {t.destination}</span>
                      {!same && <span className="shrink-0 text-[10px] text-muted-foreground">cidade diferente</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{fmt(t.startDate)} – {fmt(t.endDate)}</p>
                  </button>
                );
              })}
            </section>

            {target?.kind === 'activity' && trip && (
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dia</p>
                <div className="flex flex-wrap gap-2">
                  {(trip.days || []).map((d, i) => {
                    const n = d.day ?? i + 1;
                    return (
                      <button
                        key={n}
                        onClick={() => setDay(n)}
                        className={`rounded-full border px-3 py-1 text-xs ${day === n ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                      >
                        Dia {n}
                      </button>
                    );
                  })}
                </div>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Horário</p>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-32" />
              </section>
            )}

            <Button className="w-full" disabled={!trip || (target?.kind === 'activity' && !time)} onClick={apply}>
              {target?.kind === 'hotel' ? 'Usar este hotel' : '➕ Adicionar'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
