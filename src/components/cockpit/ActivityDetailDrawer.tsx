import { useEffect, useMemo, useState } from 'react';
import { Star, Clock, MapPin, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { usePlaceDetails, PlaceDetails } from '@/hooks/usePlaceDetails';
import { destinationActivities } from '@/data/destinationActivities';
import type { TripActivity } from '@/types/trip';

interface ActivityDetailDrawerProps {
  activity: TripActivity | null;
  destination: string;
  travelers?: number;
  open: boolean;
  onClose: () => void;
  onFocusOnMap?: (activityName: string) => void;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function findCuratedMatch(destination: string, activityName: string) {
  const data = destinationActivities[destination];
  if (!data || !activityName) return null;
  const target = normalize(
    activityName
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/^(almoço|almoco|jantar|café|cafe|café da manhã|cafe da manha)\s*:\s*/i, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim()
  );
  if (!target) return null;
  return (
    data.activities.find((a) => normalize(a.name) === target) ||
    data.activities.find((a) => {
      const n = normalize(a.name);
      return n.includes(target) || target.includes(n);
    }) ||
    null
  );
}

export const ActivityDetailDrawer = ({
  activity,
  destination,
  travelers = 1,
  open,
  onClose,
  onFocusOnMap,
}: ActivityDetailDrawerProps) => {
  const { searchPlace } = usePlaceDetails();
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanName = (activity?.name || '')
    .replace(/^(Jantar|Almoço|Café|Café da manhã):\s*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();

  const skip = !cleanName ||
    cleanName.toLowerCase().includes('check-in') ||
    cleanName.toLowerCase().includes('check-out') ||
    cleanName.toLowerCase().includes('transfer') ||
    cleanName.toLowerCase().includes('voo') ||
    cleanName.toLowerCase().includes('aeroporto') ||
    cleanName.toLowerCase().includes('room service') ||
    cleanName.toLowerCase().includes('café da manhã') ||
    cleanName.toLowerCase().includes('descanso');

  useEffect(() => {
    if (!open || skip) { setPlace(null); return; }
    setLoading(true);
    searchPlace(cleanName, destination).then(result => {
      if (result?.found) setPlace(result);
      else setPlace(null);
      setLoading(false);
    });
  }, [open, cleanName, destination, skip, searchPlace]);

  const curated = useMemo(
    () => (activity ? findCuratedMatch(destination, activity.name) : null),
    [activity, destination]
  );

  if (!activity) return null;

  const neighborhood = curated?.neighborhood;
  const tips = curated?.tips || [];
  const perPerson = Math.max(0, Math.round(activity.cost || 0));
  const total = perPerson * Math.max(1, travelers);
  const isConfirmed = activity.status === 'confirmed';

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-card border-border">
        <DrawerHeader className="flex items-start justify-between pb-2 gap-3">
          <div className="flex-1 min-w-0">
            <DrawerTitle className="font-['Outfit'] text-lg text-foreground text-left">
              {activity.name}
            </DrawerTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {activity.time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {activity.time}
                </span>
              )}
              {activity.duration && <span>⏱ {activity.duration}</span>}
              {neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {neighborhood}
                </span>
              )}
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isConfirmed ? '✅ Confirmada' : '💡 Sugestão'}
              </span>
            </div>
          </div>
          <DrawerClose asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X size={18} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Photo (Google Places) */}
          {place?.photoUrl && (
            <img
              src={place.photoUrl}
              alt={place.name || activity.name}
              className="w-full h-48 rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          )}

          {/* Place info (Google) */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Carregando informações...
            </div>
          )}

          {place?.found && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {place.rating && (
                  <span className="flex items-center gap-1 text-sm text-amber-400 font-medium">
                    <Star size={14} className="fill-amber-400" /> {place.rating}
                    {place.totalRatings && (
                      <span className="text-muted-foreground text-xs">
                        ({place.totalRatings.toLocaleString()} avaliações)
                      </span>
                    )}
                  </span>
                )}
                {place.openNow !== undefined && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      place.openNow
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <Clock size={10} className="inline mr-1" />
                    {place.openNow ? 'Aberto agora' : 'Fechado'}
                  </span>
                )}
              </div>

              {place.hours && place.hours.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Horários:</p>
                  {place.hours.map((h, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{h}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All curated tips */}
          {tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground font-['Outfit']">💡 Dicas do KINU</p>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-emerald-500/40"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cost breakdown */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-foreground font-['Outfit'] mb-1">Custo</p>
            {perPerson > 0 ? (
              <p className="text-sm text-foreground">
                R$ {perPerson.toLocaleString('pt-BR')} por pessoa
                <span className="text-muted-foreground"> · </span>
                <span className="text-emerald-400 font-medium">
                  R$ {total.toLocaleString('pt-BR')} total
                </span>
                <span className="text-muted-foreground text-xs"> ({Math.max(1, travelers)} viajantes)</span>
              </p>
            ) : (
              <p className="text-sm text-emerald-400 font-medium">Grátis</p>
            )}
          </div>

          {/* Focus on map */}
          {onFocusOnMap && !skip && (
            <button
              onClick={() => {
                onFocusOnMap(activity.name);
                onClose();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors font-['Outfit']"
            >
              <MapPin size={16} /> 📍 Ver no mapa
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
