import { useState, useEffect } from 'react';
import { Star, Clock, MapPin, ExternalLink } from 'lucide-react';
import { usePlaceDetails, PlaceDetails } from '@/hooks/usePlaceDetails';

interface PlaceInfoCardProps {
  activityName: string;
  destination: string;
  compact?: boolean;
}

export const PlaceInfoCard = ({ activityName, destination, compact = true }: PlaceInfoCardProps) => {
  const { searchPlace, loading } = usePlaceDetails();
  const [place, setPlace] = useState<PlaceDetails | null>(null);

  // Clean activity name
  const cleanName = activityName
    .replace(/^(Jantar|Almoço|Café|Café da manhã):\s*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();

  // Skip logistics activities
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
    if (skip) return;
    searchPlace(cleanName, destination).then(result => {
      if (result?.found) setPlace(result);
    });
  }, [cleanName, destination, skip, searchPlace]);

  if (skip || loading || !place?.found) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {place.photoUrl && (
          <img 
            src={place.photoUrl} 
            alt={place.name || ''} 
            className="w-8 h-8 rounded object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {place.rating && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-medium">
              <Star size={10} className="fill-amber-400" /> {place.rating}
              {place.totalRatings && <span className="text-muted-foreground">({place.totalRatings.toLocaleString()})</span>}
            </span>
          )}
          {place.openNow !== undefined && (
            <span className={`text-[10px] font-medium ${place.openNow ? 'text-emerald-400' : 'text-red-400'}`}>
              <Clock size={9} className="inline mr-0.5" /> {place.openNow ? 'Aberto' : 'Fechado'}
            </span>
          )}
          {place.mapsUrl && (
            <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5">
              <MapPin size={9} /> Maps
            </a>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="mt-2 bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex gap-3 p-3">
        {place.photoUrl && (
          <img 
            src={place.photoUrl} 
            alt={place.name || ''} 
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {place.rating && (
              <span className="flex items-center gap-0.5 text-xs text-amber-400 font-medium">
                <Star size={12} className="fill-amber-400" /> {place.rating}
                <span className="text-muted-foreground">({place.totalRatings || 0})</span>
              </span>
            )}
            {place.openNow !== undefined && (
              <span className={`text-xs ${place.openNow ? 'text-emerald-400' : 'text-red-400'}`}>
                {place.openNow ? '✅ Aberto agora' : '🔴 Fechado'}
              </span>
            )}
          </div>
          {place.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{place.summary}</p>
          )}
          <div className="flex gap-2 mt-1.5">
            {place.mapsUrl && (
              <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-400 hover:underline flex items-center gap-1">
                <ExternalLink size={10} /> Ver no Maps
              </a>
            )}
          </div>
        </div>
      </div>
      {place.reviews && place.reviews.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avaliações recentes:</p>
          {place.reviews.slice(0, 2).map((review, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              <span className="text-amber-400">{'★'.repeat(review.rating)}</span>
              <span className="ml-1">{review.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
