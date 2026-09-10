// HotelSwapModal — a porta de saída da segunda maior decisão de uma viagem.
//
// A seção "ATUAL" existe separada por honestidade, não por estética: o hotel que o
// app escolheu quase nunca é um dos curados (7 de 84 medidos — ver hotelSwap.ts).
// Misturá-lo na lista curada, ou escondê-lo, faria o produto mentir sobre a origem
// da própria recomendação.
import { useMemo, useState } from 'react';
import { Hotel, Check, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { CuratedHotel } from '@/data/curatedHotels';
import {
  rankHotelsForTrip,
  previewSwapImpact,
  baseHotelName,
  tierOfTrip,
  personaOfTrip,
  TIER_LABEL,
  PERSONA_LABEL,
  type RankedHotel,
  type SwapTripLike,
} from '@/lib/hotelSwap';
import { trackHotelSwap } from '@/lib/hotelSwapEvent';

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

interface HotelSwapModalProps {
  open: boolean;
  onClose: () => void;
  trip: SwapTripLike | null;
  /** Aplica a troca. Quem passa é responsável por persistir (updateTrip). */
  onSelect: (hotel: CuratedHotel) => void;
  /** Caminho externo das cidades sem curadoria — o "Buscar Hotel" que já existe. */
  onOpenOffers?: () => void;
  /**
   * Abre a ficha do hotel. Quando não vem — `TripPanel` e `DraftCockpit`, que abrem este
   * modal por conta própria —, a linha segue selecionando no toque, como sempre fez.
   */
  onOpenDetail?: (hotel: CuratedHotel) => void;
}

export const HotelSwapModal = ({ open, onClose, trip, onSelect, onOpenOffers, onOpenDetail }: HotelSwapModalProps) => {
  const [pending, setPending] = useState<CuratedHotel | null>(null);

  const city = String(trip?.destination ?? '');
  const ranked = useMemo(() => (open ? rankHotelsForTrip(city, trip) : []), [open, city, trip]);

  const acc = trip?.accommodation;
  const currentName = baseHotelName(acc?.name);
  const currentIsCurated = ranked.some((r) => r.isCurrent);
  const confirmed = acc?.status === 'confirmed';
  const persona = personaOfTrip(trip);
  const tier = tierOfTrip(trip);

  const impact = pending && trip ? previewSwapImpact(trip, pending) : null;

  /**
   * `from` é lido ANTES da troca — depois dela o nome atual já é o novo.
   *
   * Este é o ÚNICO emissor desta superfície, e vale para os dois caminhos que chegam aqui:
   * o modal aberto pelo bloco do roteiro e o aberto pelo stepper/TripPanel, que passam por
   * `handlePick` e `confirmPending`. Quem só apresenta a linha (o bloco, o painel) não
   * emite nada — a troca é um evento do modal.
   */
  const trackSwap = (hotel: CuratedHotel) => {
    trackHotelSwap({ from: currentName, to: hotel.name, city, surface: 'swap' });
  };

  const handlePick = (hotel: CuratedHotel) => {
    // Trocar um hotel confirmado desfaz a confirmação: pede um segundo toque.
    if (confirmed) return setPending(hotel);
    trackSwap(hotel);
    onSelect(hotel);
    onClose();
  };

  const confirmPending = () => {
    if (!pending) return;
    trackSwap(pending);
    onSelect(pending);
    setPending(null);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) { setPending(null); onClose(); } }}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Hotel size={18} className="text-purple-400" />
            Trocar hotel {city ? `em ${city}` : ''}
          </DrawerTitle>
          {ranked.length > 0 && (
            <p className="text-xs text-muted-foreground text-left">
              Ordenado pelo perfil da sua viagem: {TIER_LABEL[tier] ?? tier} · {PERSONA_LABEL[persona]}
            </p>
          )}
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* ATUAL — só quando ele NÃO é um dos curados. Se for, aparece uma vez só,
              marcado com ✓ na lista, em vez de duplicado aqui. */}
          {currentName && !currentIsCurated && (
            <section>
              <h3 className="text-[11px] font-bold tracking-wide text-muted-foreground mb-2">
                ATUAL — ESCOLHIDO PELO KINU
              </h3>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-sm font-medium text-foreground">{currentName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[acc?.neighborhood, acc?.nightlyRate ? `${brl(acc.nightlyRate)}/noite` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="text-[11px] text-amber-500/90 mt-1.5">
                  não faz parte da curadoria KINU desta cidade
                </p>
              </div>
            </section>
          )}

          {ranked.length > 0 ? (
            <section>
              <h3 className="text-[11px] font-bold tracking-wide text-muted-foreground mb-2">
                CURADORIA KINU EM {city.toUpperCase()} ({ranked.length})
              </h3>
              <div className="space-y-2">
                {ranked.map((r, i) => (
                  <HotelRow
                    key={r.hotel.id}
                    ranked={r}
                    recommended={i === 0}
                    onPick={handlePick}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-muted/20 p-4 text-center space-y-3">
              <p className="text-sm text-foreground">
                Ainda não temos hotéis curados em {city || 'nesta cidade'}.
              </p>
              <p className="text-xs text-muted-foreground">
                Prefiro dizer isso a inventar uma recomendação. Enquanto a curadoria não chega,
                dá pra buscar ofertas por fora.
              </p>
              {onOpenOffers && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenOffers(); }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300"
                >
                  <ExternalLink size={13} /> Ver ofertas de hospedagem
                </button>
              )}
            </section>
          )}
        </div>

        {/* Confirmação da troca de um hotel JÁ confirmado. */}
        {pending && impact && (
          <div className="border-t border-border bg-background p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="text-foreground font-medium">Este hotel está confirmado.</p>
                <p>
                  Trocar para <span className="text-foreground">{pending.name}</span> desfaz a
                  confirmação e volta o valor para planejado.
                </p>
                <p className="mt-1">
                  Planejado: {brl(impact.currentTotal)} → {brl(impact.nextTotal)}{' '}
                  <span className={impact.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    ({impact.delta > 0 ? '+' : ''}{brl(impact.delta)})
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground"
              >
                <X size={13} className="inline mr-1" /> Manter o atual
              </button>
              <button
                type="button"
                onClick={confirmPending}
                className="flex-1 rounded-lg bg-purple-500 py-2 text-xs font-medium text-white"
              >
                <Check size={13} className="inline mr-1" /> Trocar mesmo assim
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

function RowBody({ ranked, recommended }: { ranked: RankedHotel; recommended: boolean }) {
  const { hotel, price, isCurrent, reasons } = ranked;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{hotel.name}</p>
        {isCurrent ? (
          <span className="shrink-0 text-[10px] font-bold text-emerald-400">✓ ATUAL</span>
        ) : recommended ? (
          <span className="shrink-0 text-[10px] font-bold text-purple-400">RECOMENDADO</span>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground mt-0.5">
        {[
          hotel.zone,
          TIER_LABEL[hotel.tier] ?? hotel.tier,
          (hotel.personaTags ?? []).map((p) => PERSONA_LABEL[p] ?? p).join('/'),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      <p className="text-xs text-foreground/80 mt-1">
        {price ? (
          <>
            {hotel.priceRangeBRL}/noite{' '}
            <span className="text-muted-foreground">· usamos {brl(price.mid)} no orçamento</span>
          </>
        ) : (
          <span className="text-muted-foreground">faixa de preço indisponível</span>
        )}
      </p>

      {/* Os motivos são o mesmo `reasons[]` do bloco do roteiro: é aqui que o usuário
          compara, e comparar sem o critério na frente é escolher no escuro. */}
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {reasons.map((r) => (
            <span
              key={r.kind}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
            >
              {r.label}
            </span>
          ))}
        </div>
      )}

      {hotel.tips?.[0] && (
        <p className="text-[11px] text-muted-foreground mt-1.5 italic">{hotel.tips[0]}</p>
      )}
    </>
  );
}

function HotelRow({
  ranked,
  recommended,
  onPick,
  onOpenDetail,
}: {
  ranked: RankedHotel;
  recommended: boolean;
  onPick: (h: CuratedHotel) => void;
  onOpenDetail?: (h: CuratedHotel) => void;
}) {
  const { hotel, isCurrent } = ranked;
  const frame = isCurrent
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : 'border-border hover:border-purple-500/40 hover:bg-purple-500/5';

  // Sem ficha: a linha inteira é o botão de escolher, exatamente como antes.
  if (!onOpenDetail) {
    return (
      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onPick(hotel)}
        className={`w-full text-left rounded-xl border p-3 transition-colors ${frame} ${
          isCurrent ? 'cursor-default' : ''
        }`}
      >
        <RowBody ranked={ranked} recommended={recommended} />
      </button>
    );
  }

  // Com ficha: dois destinos no mesmo cartão. Botão dentro de botão não existe em HTML,
  // então a moldura é uma div e cada afordância tem o seu próprio <button>.
  return (
    <div className={`rounded-xl border transition-colors ${frame}`}>
      <button
        type="button"
        onClick={() => onOpenDetail(hotel)}
        className="w-full text-left p-3"
        aria-label={`Ver detalhes de ${hotel.name}`}
      >
        <RowBody ranked={ranked} recommended={recommended} />
      </button>
      <div className="flex justify-end border-t border-border/60 px-3 py-2">
        {isCurrent ? (
          <span className="text-[11px] font-semibold text-emerald-400">é o seu hotel</span>
        ) : (
          <button
            type="button"
            onClick={() => onPick(hotel)}
            className="text-[11px] font-semibold text-purple-300 hover:text-purple-200"
          >
            Escolher este
          </button>
        )}
      </div>
    </div>
  );
}

export default HotelSwapModal;
