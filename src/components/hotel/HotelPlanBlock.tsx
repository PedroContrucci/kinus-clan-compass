// HotelPlanBlock — o hotel no roteiro, com o porquê e a porta de saída.
//
// A REGRA DE PRODUTO que este bloco estreia: toda escolha que o KINU faz pelo usuário
// mostra POR QUE escolheu e COMO trocar. Antes dele, o porquê do hotel existia só como
// número dentro do `score` de `rankHotelsForTrip`, e a porta de saída morava numa pílula
// do stepper e num card de finanças — dois lugares onde ninguém procura hospedagem.
//
// Autocontido de propósito: dono do modal e da ficha. Quem chama passa `trip` e
// `onUpdateTrip`, e o rascunho (DraftCockpit) e a viagem ativa (Viagens) recebem
// exatamente o mesmo bloco — dois roteiros com o mesmo hotel não podem contar histórias
// diferentes sobre ele.
//
// UM DRAWER ABERTO POR VEZ. O vaul aninhado exige `NestedRoot`, que não é o que o modal
// usa; então o estado é uma máquina de três posições e a ficha aberta de dentro do modal
// fecha o modal — e ao fechar, devolve o usuário para a lista, que é de onde ele veio.
import { useEffect, useMemo, useState } from 'react';
import { Hotel, ChevronRight, AlertTriangle, ExternalLink } from 'lucide-react';
import type { CuratedHotel } from '@/data/curatedHotels';
import {
  rankHotelsForTrip,
  getCuratedHotelsForCity,
  baseHotelName,
  hotelChoiceLabel,
  type RankedHotel,
  type SwapTripLike,
} from '@/lib/hotelSwap';
import { trackEvent } from '@/lib/kinuEvents';
import { trackHotelSwap } from '@/lib/hotelSwapEvent';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { HotelDetailDrawer } from '@/components/hotel/HotelDetailDrawer';

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

export interface HotelPlanBlockProps {
  trip: SwapTripLike | null | undefined;
  /**
   * Aplica a troca. Recebe o hotel e não um updater porque é assim que `TripPanel` e
   * `DraftCockpit` já chamam o modal (`onUpdateTrip?.((t) => applyHotelSwap(t, hotel))`):
   * a escrita continua sendo do dono do storage, e o bloco não precisa conhecer o tipo
   * concreto da viagem de cada tela. Sem ele o bloco informa, mas não oferece a saída.
   */
  onSelectHotel?: (hotel: CuratedHotel) => void;
  /** Caminho externo das cidades sem curadoria — o "Buscar Ofertas" que já existe. */
  onOpenOffers?: () => void;
}

type View = 'none' | 'swap' | 'detail';

export const HotelPlanBlock = ({ trip, onSelectHotel, onOpenOffers }: HotelPlanBlockProps) => {
  const [view, setView] = useState<View>('none');
  const [detailFrom, setDetailFrom] = useState<'block' | 'swap'>('block');
  const [detailHotel, setDetailHotel] = useState<CuratedHotel | null>(null);

  const city = String(trip?.destination ?? '');
  const acc = trip?.accommodation;
  const currentName = baseHotelName(acc?.name);

  const ranked = useMemo(() => rankHotelsForTrip(city, trip), [city, trip]);
  const cityHasCuration = useMemo(() => getCuratedHotelsForCity(city).length > 0, [city]);

  // O curado da viagem: pelo id de proveniência quando existe, pelo nome quando a viagem
  // é antiga o bastante para não ter `curatedHotelId`.
  const current: RankedHotel | undefined = useMemo(() => {
    const id = acc?.curatedHotelId;
    return ranked.find((r) => (id ? r.hotel.id === id : false)) ?? ranked.find((r) => r.isCurrent);
  }, [ranked, acc?.curatedHotelId]);

  const choice = useMemo(() => hotelChoiceLabel(city, trip), [city, trip]);
  const reasons = current?.reasons ?? [];

  // reasons_viewed: uma vez por hotel visível, não uma vez por render. O dedupe mora no
  // emissor (kinuEvents), então este efeito pode disparar à vontade sem inundar o anel.
  useEffect(() => {
    if (!currentName || reasons.length === 0) return;
    trackEvent('hotel.reasons_viewed', {
      hotel: currentName,
      city,
      curated: true,
      reasons: reasons.length,
      author: choice.author,
    });
  }, [currentName, city, reasons.length, choice.author]);

  if (!currentName) return null;

  const openDetail = (hotel: CuratedHotel, from: 'block' | 'swap') => {
    setDetailHotel(hotel);
    setDetailFrom(from);
    setView('detail');
    trackEvent('hotel.detail_opened', { hotel: hotel.name, city, from });
  };

  const closeDetail = () => {
    // Veio da lista? Volta para a lista. Fechar a ficha não deveria custar o contexto.
    setView(detailFrom === 'swap' ? 'swap' : 'none');
    setDetailHotel(null);
  };

  const nights = Number(acc?.totalNights) || 0;
  const nightsLabel = nights > 0 ? `${nights} ${nights === 1 ? 'noite' : 'noites'}` : null;

  const priceLabel = current?.hotel.priceRangeBRL
    ? `${current.hotel.priceRangeBRL}/noite`
    : acc?.nightlyRate
      ? `${brl(Number(acc.nightlyRate))}/noite (estimativa)`
      : null;

  const zone = current?.hotel.zone || acc?.neighborhood || '';

  return (
    <>
      <section className="mb-4 rounded-2xl border border-border bg-card/60 overflow-hidden">
        <button
          type="button"
          onClick={() => current && openDetail(current.hotel, 'block')}
          disabled={!current}
          className={`w-full text-left p-4 ${current ? 'hover:bg-muted/40 transition-colors' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Hotel size={14} className="text-purple-400" />
            <span className="text-[11px] font-bold tracking-wide text-muted-foreground">
              ONDE VOCÊ FICA
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground font-['Outfit']">{currentName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {[zone, priceLabel, nightsLabel].filter(Boolean).join(' · ')}
              </p>
            </div>
            {current && <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />}
          </div>

          {current ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground">{choice.label}</p>
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
          ) : (
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-500/90 leading-relaxed">
                sugestão automática — ainda sem curadoria KINU{' '}
                {cityHasCuration ? 'neste tier' : `em ${city || 'nesta cidade'}`}
              </p>
            </div>
          )}
        </button>

        <div className="flex gap-2 border-t border-border p-3">
          {onSelectHotel && (cityHasCuration || !onOpenOffers) && (
            <button
              type="button"
              onClick={() => setView('swap')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              Ver curadoria e trocar
            </button>
          )}
          {onOpenOffers && (
            <button
              type="button"
              onClick={onOpenOffers}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${
                cityHasCuration ? 'px-3' : 'flex-1'
              }`}
            >
              <ExternalLink size={13} /> Buscar ofertas
            </button>
          )}
        </div>
      </section>

      <HotelSwapModal
        open={view === 'swap'}
        onClose={() => setView('none')}
        trip={trip ?? null}
        // Sem telemetria aqui: o `hotel.swapped` desta superfície é emitido DENTRO do
        // modal (handlePick/confirmPending). Emitir também no caminho de volta é como a
        // mesma troca vira duas linhas.
        onSelect={(hotel) => onSelectHotel?.(hotel)}
        onOpenOffers={onOpenOffers}
        onOpenDetail={(hotel) => openDetail(hotel, 'swap')}
      />

      <HotelDetailDrawer
        open={view === 'detail'}
        onClose={closeDetail}
        hotel={detailHotel}
        city={city}
        reasons={ranked.find((r) => r.hotel.id === detailHotel?.id)?.reasons}
        isCurrent={!!detailHotel && detailHotel.id === current?.hotel.id}
        onSelect={
          onSelectHotel
            ? (hotel) => {
                // `hotel.swapped` sai daqui e do HotelSwapModal, nunca dos dois no mesmo
                // clique: a ficha aberta pelo modal fecha o modal antes de escolher
                // (`view` é uma posição só), então o `handlePick` de lá não roda.
                trackHotelSwap({ from: currentName, to: hotel.name, city, surface: 'detail' });
                onSelectHotel(hotel);
                setView('none');
                setDetailHotel(null);
              }
            : undefined
        }
      />
    </>
  );
};

export default HotelPlanBlock;
