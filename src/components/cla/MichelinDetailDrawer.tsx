import { MapPin, X } from 'lucide-react';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ClaLazyImage } from '@/components/cla/ClaLazyImage';
import type { MichelinRestaurant } from '@/lib/michelinData';

interface MichelinDetailDrawerProps {
  restaurant: MichelinRestaurant | null;
  open: boolean;
  onClose: () => void;
}

export function MichelinDetailDrawer({ restaurant, open, onClose }: MichelinDetailDrawerProps) {
  if (!restaurant) return null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.city}`)}`;

  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DrawerContent className="max-h-[85vh] border-border bg-card">
        <DrawerHeader className="flex items-start justify-between gap-3 pb-2">
          <div className="min-w-0 flex-1 text-left">
            <DrawerTitle className="font-['Outfit'] text-lg text-foreground">{restaurant.name}</DrawerTitle>
            <p className="mt-1 text-xs text-muted-foreground">{restaurant.city} · {restaurant.neighborhood || 'Bairro não informado'}</p>
          </div>
          <DrawerClose asChild>
            <button type="button" aria-label="Fechar" className="shrink-0 rounded-lg p-1 transition-colors hover:bg-muted">
              <X size={18} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          <ClaLazyImage name={restaurant.name} city={restaurant.city} className="aspect-[16/9] overflow-hidden rounded-lg" />
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-400">{'⭐'.repeat(restaurant.stars)} Michelin</span>
            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{restaurant.cuisine}</span>
            <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{restaurant.priceRange}</span>
          </div>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
            <MapPin size={16} /> Ver no mapa
          </a>
        </div>
      </DrawerContent>
    </Drawer>
  );
}