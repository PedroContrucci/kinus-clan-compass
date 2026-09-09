// HotelDetailDrawer — a ficha do hotel: tudo que a curadoria sabe, de uma vez.
//
// Até aqui o app mostrava a `tips[0]` e engolia o resto: o Sofitel Legend e o Hotel Caribe
// têm a segunda dica escrita ("Família E casal cabem", "praia em frente") e nenhum usuário
// jamais leu. Uma ficha que mostra metade da curadoria é uma curadoria pela metade.
//
// O CONTEÚDO é um componente separado da casca (`HotelDetailContent`) por um motivo
// prático: nenhum teste da suíte monta um `Drawer` do vaul, e testar pela casca obrigaria
// a mockar pointer/resize do jsdom e perseguir portal. A lógica fica testável; a casca,
// que não tem lógica, fica de fora.
import { Hotel, MapPin, Star, Check, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import type { CuratedHotel } from '@/data/curatedHotels';
import {
  parsePriceRangeBRL,
  hotelMapsUrl,
  TIER_LABEL,
  PERSONA_LABEL,
  type HotelReason,
} from '@/lib/hotelSwap';

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

export interface HotelDetailContentProps {
  hotel: CuratedHotel;
  city: string;
  /** Motivos do `rankHotelsForTrip`. Vazio quando a ficha é aberta sem viagem em contexto. */
  reasons?: HotelReason[];
  /** É o hotel da viagem? Então o botão de escolher não tem o que fazer. */
  isCurrent?: boolean;
  onSelect?: (hotel: CuratedHotel) => void;
}

export const HotelDetailContent = ({
  hotel,
  city,
  reasons = [],
  isCurrent = false,
  onSelect,
}: HotelDetailContentProps) => {
  const price = parsePriceRangeBRL(hotel.priceRangeBRL);
  const personas = (hotel.personaTags ?? []).map((p) => PERSONA_LABEL[p] ?? p).join(' · ');

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
          {TIER_LABEL[hotel.tier] ?? hotel.tier}
        </span>
        {personas && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
            {personas}
          </span>
        )}
        {Number(hotel.rating) > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
            <Star size={12} className="fill-amber-400" /> {hotel.rating}
          </span>
        )}
        {isCurrent && (
          <span className="text-[11px] font-bold text-emerald-400">✓ é o seu hotel</span>
        )}
      </div>

      {reasons.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground font-['Outfit']">
            Por que combina com sua viagem
          </p>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <span
                key={r.kind}
                className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
              >
                {r.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TODAS as tips — é o ponto da ficha. */}
      {hotel.tips?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground font-['Outfit']">💡 Dicas do KINU</p>
          <ul className="space-y-1.5">
            {hotel.tips.map((tip, i) => (
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

      <div className="pt-2 border-t border-border">
        <p className="text-xs font-semibold text-foreground font-['Outfit'] mb-1">Diária</p>
        {price ? (
          <p className="text-sm text-foreground">
            {hotel.priceRangeBRL}
            <span className="text-muted-foreground"> · usamos {brl(price.mid)} no orçamento</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">faixa de preço indisponível</p>
        )}
      </div>

      <a
        href={hotelMapsUrl(hotel, city)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors font-['Outfit']"
      >
        <MapPin size={16} /> Ver {hotel.zone || city} no mapa
      </a>

      {onSelect && (
        <button
          type="button"
          disabled={isCurrent}
          onClick={() => onSelect(hotel)}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-colors font-['Outfit'] ${
            isCurrent
              ? 'bg-muted text-muted-foreground cursor-default'
              : 'bg-purple-500 text-white hover:bg-purple-400'
          }`}
        >
          <Check size={16} /> {isCurrent ? 'Já é o seu hotel' : 'Escolher este hotel'}
        </button>
      )}
    </div>
  );
};

export interface HotelDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  hotel: CuratedHotel | null;
  city: string;
  reasons?: HotelReason[];
  isCurrent?: boolean;
  onSelect?: (hotel: CuratedHotel) => void;
}

export const HotelDetailDrawer = ({
  open,
  onClose,
  hotel,
  city,
  reasons,
  isCurrent,
  onSelect,
}: HotelDetailDrawerProps) => {
  if (!hotel) return null;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-card border-border">
        <DrawerHeader className="flex items-start justify-between pb-2 gap-3">
          <div className="flex-1 min-w-0">
            <DrawerTitle className="font-['Outfit'] text-lg text-foreground text-left flex items-center gap-2">
              <Hotel size={18} className="text-purple-400 shrink-0" />
              {hotel.name}
            </DrawerTitle>
            <p className="text-xs text-muted-foreground mt-1 text-left">
              {[hotel.zone, city].filter(Boolean).join(' · ')}
            </p>
          </div>
          <DrawerClose asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X size={18} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto">
          <HotelDetailContent
            hotel={hotel}
            city={city}
            reasons={reasons}
            isCurrent={isCurrent}
            onSelect={onSelect}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default HotelDetailDrawer;
