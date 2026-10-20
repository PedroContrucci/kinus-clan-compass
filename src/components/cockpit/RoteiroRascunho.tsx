// RoteiroRascunho — C.5e: o painel "ver ▸" do roteiro no rascunho, em blocos (RoteiroDia).
// C.7: a mesma tira de dias da viagem ativa (EnhancedDayTimeline), um dia por vez; uma linha fechada por item, detalhe ao abrir, uma rota aberta por vez
// (mapa montado só ao abrir). ↻ e 🗑 são as edições do rascunho (src/lib/draftRoteiro.ts),
// gravadas na hora pelo mesmo funil do stage (updateTrip).

import { useCallback, useEffect, useState } from 'react';
import { parseISO, addDays } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { TripActivity } from '@/types/trip';
import { updateTrip, type StoredTrip } from '@/lib/tripStore';
import { countManualEdits, itemIdsOf } from '@/lib/draftItinerary';
import { draftSwapCandidates, removeDraftItem, swapDraftItem } from '@/lib/draftRoteiro';
import type { SwapCandidate } from '@/lib/itineraryEngine';
import { roteiroKind } from '@/lib/roteiroBlocks';
import { RoteiroDia } from './RoteiroDia';
import { EnhancedDayTimeline } from './EnhancedDayTimeline';
import { DailyRouteMap, type RouteLeg } from './DailyRouteMap';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DraftLike = Record<string, any> & { id: string; destination: string; startDate: string };

interface RoteiroRascunhoProps {
  trip: DraftLike;
  /** "Regerar roteiro": recebe o número de trocas manuais. */
  onRegenerate?: (manualEdits: number) => void;
}

interface DayLike { day: number; date?: string; title?: string; activities: TripActivity[] }

const isStop = (a: TripActivity) => {
  const k = roteiroKind(a);
  return k === 'passeio' || k === 'restaurante';
};

export const RoteiroRascunho = ({ trip, onRegenerate }: RoteiroRascunhoProps) => {
  // Cópia local da viagem editada: a tela segue a gravação mesmo antes do sino re-renderizar o pai.
  const [current, setCurrent] = useState<DraftLike>(trip);
  useEffect(() => { setCurrent(trip); }, [trip]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [routeDay, setRouteDay] = useState<number | null>(null);
  const [liveLegs, setLiveLegs] = useState<{ day: number; legs: RouteLeg[] } | null>(null);
  const [swapOpenId, setSwapOpenId] = useState<string | null>(null);

  const days: DayLike[] = Array.isArray(current.days) ? current.days : [];
  const [selectedDay, setSelectedDay] = useState<number>(() => days[0]?.day ?? 1);
  const selectDay = (day: number) => {
    setSelectedDay(day);
    setRouteDay(null);
    setSwapOpenId(null);
  };

  const commit = useCallback((edit: (t: DraftLike) => DraftLike) => {
    const saved = updateTrip(current.id, (t) => edit(t as DraftLike) as StoredTrip);
    setCurrent((saved as DraftLike | null) ?? edit(current));
  }, [current]);

  const toggleExpand = useCallback((id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);

  const handleRemove = (a: TripActivity) => {
    commit((t) => removeDraftItem(t, a.id));
    toast({ title: 'Atividade removida', description: 'A atividade foi removida do roteiro.' });
  };

  const handlePickSwap = (dayNumber: number, a: TripActivity, cand: SwapCandidate) => {
    commit((t) => swapDraftItem(t, dayNumber, a.id, cand));
    setSwapOpenId(null);
    toast({ title: 'Atividade trocada' });
  };

  // Só um mapa montado por vez: os trechos que ele reporta são do dia com a rota aberta.
  const handleLegs = useCallback((legs: RouteLeg[]) => {
    setLiveLegs({ day: routeDay ?? -1, legs });
  }, [routeDay]);

  if (days.length === 0) {
    return <p className="text-xs text-muted-foreground p-2">Sem roteiro neste rascunho — use "Regerar roteiro".</p>;
  }

  const startDate = current.startDate ? parseISO(String(current.startDate).slice(0, 10)) : undefined;

  return (
    <div className="space-y-3">
      {onRegenerate && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onRegenerate(countManualEdits(current.engineItemIds, itemIdsOf(days)))}>
            <RefreshCw size={16} className="mr-1" />
            Regerar roteiro
          </Button>
        </div>
      )}
      {current.startDate && (
        <EnhancedDayTimeline
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          days={days as any}
          selectedDay={selectedDay}
          onSelectDay={selectDay}
          tripStartDate={String(current.startDate)}
        />
      )}
      {[days.find((d) => d.day === selectedDay) ?? days[0]].map((d) => {
        const stops = d.activities.filter(isStop);
        const stopNumbers: Record<string, number> = {};
        stops.slice()
          .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
          .forEach((a, i) => { stopNumbers[a.name] = i + 1; });
        const date = d.date
          ? parseISO(String(d.date).slice(0, 10))
          : startDate ? addDays(startDate, d.day - 1) : undefined;
        return (
          <RoteiroDia
            key={d.day}
            dayNumber={d.day}
            date={date}
            activities={d.activities}
            destination={current.destination}
            liveLegs={liveLegs && liveLegs.day === d.day ? liveLegs.legs : null}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onCollapseAll={() => setExpandedIds(new Set())}
            routeOpen={routeDay === d.day}
            onRouteToggle={() => setRouteDay((cur) => (cur === d.day ? null : d.day))}
            renderMap={stops.length >= 2 ? () => (
              <DailyRouteMap
                destination={current.destination}
                activities={d.activities}
                hotelNeighborhood={current.accommodation?.neighborhood}
                hotelId={current.accommodation?.curatedHotelId}
                hotelName={current.accommodation?.name}
                stopNumbers={stopNumbers}
                onLegsChange={handleLegs}
              />
            ) : null}
            onSwap={(a) => setSwapOpenId((cur) => (cur === a.id ? null : a.id))}
            onRemove={handleRemove}
            renderDetail={(a) => {
              if (swapOpenId !== a.id) return null;
              const cands = draftSwapCandidates(current, d.day, a.id);
              return (
                <div className="rounded-lg border border-border bg-muted/30 p-2 space-y-1" data-testid="swap-panel">
                  {cands.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma alternativa do catálogo cabe neste horário</p>
                  ) : cands.map((c) => (
                    <button
                      key={c.activity.id}
                      type="button"
                      onClick={() => handlePickSwap(d.day, a, c)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <p className="text-sm text-foreground">{c.activity.name} · {String(c.hours).replace('.', ',')}h</p>
                      <p className="text-xs text-muted-foreground">{c.why}</p>
                    </button>
                  ))}
                </div>
              );
            }}
          />
        );
      })}
    </div>
  );
};

export default RoteiroRascunho;
