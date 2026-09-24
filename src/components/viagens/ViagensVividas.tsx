// "Viagens vividas" em /viagens: check-in, troféus da cidade e "Indicar meu roteiro ao clã".
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { StoredTrip } from '@/lib/tripStore';
import { checkinAtOf, isPastTrip } from '@/lib/tripCheckin';
import { getProgress, subscribeAchievements } from '@/lib/achievementEngine';
import { localAchievementsOf, resolveCity } from '@/lib/localAchievements';
import { getDestinationActivities } from '@/data/destinationActivities';
import { extractCatalogId } from '@/lib/tripItineraryOps';
import { mySharedTripIds, shareTrip, unshareTrip, type SharedItineraryDay } from '@/lib/cla';

const LIVED_STATUS = new Set(['active', 'completed']);

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : format(d, "dd 'de' MMM", { locale: ptBR });
};

/** Só itens do catálogo verificado: id + nome + categoria. Sem preço, nota ou nome de gente. */
export function buildSharedItinerary(trip: StoredTrip, city: string): SharedItineraryDay[] {
  const catalog = new Map(getDestinationActivities(city).map((a) => [a.id, a]));
  return (trip.days || []).map((d, i) => ({
    day: d.day ?? i + 1,
    items: (d.activities || []).flatMap((act) => {
      const hit = catalog.get(extractCatalogId(act.id));
      return hit ? [{ id: hit.id, name: hit.name, category: hit.category }] : [];
    }),
  }));
}

function livedCatalogIds(trip: StoredTrip, city: string): string[] {
  const raw = (trip as { livedIds?: unknown }).livedIds;
  if (!Array.isArray(raw)) return [];
  const catalog = new Set(getDestinationActivities(city).map((a) => a.id));
  return [...new Set(raw.map(extractCatalogId).filter((id) => catalog.has(id)))];
}

export function ViagensVividas({ trips }: { trips: StoredTrip[] }) {
  const [unlocked, setUnlocked] = useState<string[]>(() => getProgress().unlocked);
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState<StoredTrip | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeAchievements((p) => setUnlocked(p.unlocked)), []);
  useEffect(() => { void mySharedTripIds().then(setShared); }, []);

  const lived = useMemo(
    () => trips.filter((t) => LIVED_STATUS.has(String(t.status)) && isPastTrip(t)),
    [trips],
  );
  if (lived.length === 0) return null;

  const sharingCity = sharing ? resolveCity(sharing.destination) ?? String(sharing.destination) : '';
  const preview = sharing ? buildSharedItinerary(sharing, sharingCity) : [];

  const confirmShare = async () => {
    if (!sharing) return;
    setBusy(true);
    const ok = await shareTrip({
      trip_id: sharing.id,
      city: sharingCity,
      days: (sharing.days || []).length,
      travelers: Math.max(1, Number(sharing.travelers) || 1),
      children: Number((sharing as { childrenCount?: unknown }).childrenCount) || 0,
      itinerary: preview,
      lived_ids: livedCatalogIds(sharing, sharingCity),
      title: title.trim().slice(0, 80) || null,
    });
    setBusy(false);
    if (!ok) return toast.error('Não consegui compartilhar agora.');
    setShared((s) => new Set(s).add(sharing.id));
    toast.success('Roteiro indicado ao clã');
    setSharing(null);
  };

  const withdraw = async (id: string) => {
    if (!(await unshareTrip(id))) return toast.error('Não consegui retirar agora.');
    setShared((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-['Outfit'] text-lg font-bold text-foreground">Viagens vividas</h2>
      {lived.map((trip) => {
        const at = checkinAtOf(trip);
        const city = resolveCity(trip.destination);
        const trophies = city ? localAchievementsOf(city).filter((a) => unlocked.includes(a.key)) : [];
        const isShared = shared.has(trip.id);
        return (
          <div key={trip.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-['Outfit'] font-semibold text-foreground">{trip.emoji} {trip.destination}</p>
              <span className={`shrink-0 text-[11px] ${at ? 'text-emerald-400' : 'text-amber-400'}`}>
                {at ? `registrada em ${fmtDate(at)}` : 'fazer check-in'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}</p>
            {trophies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {trophies.map((a) => (
                  <span key={a.key} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">{a.emoji} {a.name}</span>
                ))}
              </div>
            )}
            {at && (
              <div className="mt-3 flex items-center gap-2">
                {isShared ? (
                  <>
                    <span className="text-xs text-emerald-400">✓ no clã</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void withdraw(trip.id)}>Retirar</Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setTitle(''); setSharing(trip); }}>
                    Indicar meu roteiro ao clã
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Sheet open={!!sharing} onOpenChange={(o) => !o && setSharing(null)}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle>Indicar meu roteiro ao clã</SheetTitle>
            <SheetDescription>{sharing?.destination} · {preview.length} dias</SheetDescription>
          </SheetHeader>
          <Input
            maxLength={80}
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="mt-1 text-right text-[10px] text-muted-foreground">{title.length}/80</p>
          <div className="mt-3 space-y-2">
            {preview.map((d) => (
              <div key={d.day} className="rounded-xl border border-border px-3 py-2">
                <p className="text-xs font-semibold text-foreground">Dia {d.day}</p>
                <p className="text-[11px] text-muted-foreground">
                  {d.items.length ? d.items.map((i) => i.name).join(' · ') : 'sem lugares do catálogo'}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Compartilhado de forma anônima com o clã</p>
          <Button className="mt-3 w-full" disabled={busy} onClick={() => void confirmShare()}>Compartilhar</Button>
        </SheetContent>
      </Sheet>
    </section>
  );
}
