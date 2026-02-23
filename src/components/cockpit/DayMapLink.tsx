import { MapPin, ExternalLink } from 'lucide-react';
import { memo } from 'react';

interface DayMapLinkProps {
  destination: string;
  dayActivities: { name: string }[];
  hotelName?: string;
}

export const DayMapLink = memo(({ destination, dayActivities, hotelName }: DayMapLinkProps) => {
  const mainActivity = dayActivities.find(a =>
    !a.name.toLowerCase().includes('check-in') &&
    !a.name.toLowerCase().includes('check-out') &&
    !a.name.toLowerCase().includes('transfer') &&
    !a.name.toLowerCase().includes('voo') &&
    !a.name.toLowerCase().includes('café da manhã')
  );

  const query = mainActivity
    ? `${mainActivity.name}, ${destination}`
    : `${hotelName || destination}`;

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card/80 transition-colors group"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
        <MapPin size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {mainActivity ? mainActivity.name : destination}
        </p>
        <p className="text-xs text-muted-foreground">
          Ver localização no Google Maps
        </p>
      </div>
      <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </a>
  );
});
