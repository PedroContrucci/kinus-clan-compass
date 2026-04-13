import { useEffect, useState } from 'react';
import { Star, Clock, MapPin, ExternalLink, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { usePlaceDetails, PlaceDetails } from '@/hooks/usePlaceDetails';
import type { TripActivity } from '@/types/trip';

interface ActivityDetailDrawerProps {
  activity: TripActivity | null;
  destination: string;
  open: boolean;
  onClose: () => void;
}

export const ActivityDetailDrawer = ({ activity, destination, open, onClose }: ActivityDetailDrawerProps) => {
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

  if (!activity) return null;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-card border-border">
        <DrawerHeader className="flex items-center justify-between pb-2">
          <DrawerTitle className="font-['Outfit'] text-lg text-foreground">{activity.name}</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Photo */}
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

          {/* Place info */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Carregando informações...
            </div>
          )}

          {place?.found && (
            <div className="space-y-3">
              {/* Rating & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                {place.rating && (
                  <span className="flex items-center gap-1 text-sm text-amber-400 font-medium">
                    <Star size={14} className="fill-amber-400" /> {place.rating}
                    {place.totalRatings && (
                      <span className="text-muted-foreground text-xs">({place.totalRatings.toLocaleString()} avaliações)</span>
                    )}
                  </span>
                )}
                {place.openNow !== undefined && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${place.openNow ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Clock size={10} className="inline mr-1" />
                    {place.openNow ? 'Aberto agora' : 'Fechado'}
                  </span>
                )}
              </div>

              {/* Summary */}
              {place.summary && (
                <p className="text-sm text-muted-foreground">{place.summary}</p>
              )}

              {/* Opening Hours */}
              {place.hours && place.hours.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Horários:</p>
                  {place.hours.map((h, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{h}</p>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {place.reviews && place.reviews.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Avaliações recentes:</p>
                  {place.reviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-400 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span className="text-[10px] text-muted-foreground">{review.author}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Maps button */}
              {place.mapsUrl && (
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-sky-500/20 text-sky-400 rounded-xl text-sm font-medium hover:bg-sky-500/30 transition-colors"
                >
                  <MapPin size={16} /> Ver no mapa
                </a>
              )}
            </div>
          )}

          {/* Activity meta */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-2 border-t border-border">
            {activity.time && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {activity.time}
              </span>
            )}
            {activity.cost > 0 && (
              <span>R$ {activity.cost.toLocaleString('pt-BR')}</span>
            )}
            {activity.cost === 0 && <span>Grátis</span>}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
