import type { ReactNode, Ref } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, ChevronDown, Check, Tag, RotateCcw, Phone, Trash2 } from 'lucide-react';
import type { TripActivity } from '@/types/trip';
import type { RouteLeg } from '@/components/cockpit/DailyRouteMap';
import { legBetween, roteiroActions, roteiroBooking, roteiroKind, type RoteiroBooking } from '@/lib/roteiroBlocks';

// C.5b — a aba Roteiro da viagem ativa em blocos: uma linha fechada por item, detalhe e
// ações só ao abrir. Apresentação pura: nenhum estado de viagem, nenhum handler próprio —
// os de Viagens.tsx (confirmModal, troca, drawer, confirmar voo/hotel) chegam por prop.
// C.5d: reservar vem do catálogo (roteiroBooking), por item — nunca o link genérico de busca.
// C.5e: o rascunho usa o mesmo bloco sem ☐/Confirmar/Mais detalhes (handlers opcionais) e com 🗑.

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

const actionBtn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors';

/** Botão de fechar a reserva (site/parceiro ou telefone). Texto não é botão: fica com o Roteiro. */
export const BookingAction = ({ booking, className = actionBtn }: { booking: RoteiroBooking | null; className?: string }) => {
  if (!booking || booking.type === 'text') return null;
  const style = `${className} bg-background border border-border text-foreground hover:border-primary/50`;
  if (booking.type === 'tel') {
    return (
      <a href={`tel:${booking.phone.replace(/[^\d+]/g, '')}`} className={style}>
        <Phone size={12} /> Ligar ▸
      </a>
    );
  }
  return (
    <a href={booking.url} target="_blank" rel="noopener noreferrer" className={style}>
      <Tag size={12} /> {booking.label} ▸
    </a>
  );
};

const logisticsIcon = (a: TripActivity) => {
  if (a.category === 'voo' || (a.name || '').toLowerCase().includes('aeroporto')) return '✈️';
  if (a.category === 'hotel') return '🏨';
  return '🚕';
};

interface RoteiroLinhaProps {
  activity: TripActivity;
  expanded: boolean;
  onToggle: () => void;
  /** ☐ → o confirmModal existente. Ausente (rascunho): sem ☐ e sem "Marcar como fechado". */
  onCheck?: () => void;
  onSwap: () => void;
  onConfirmAnchor?: () => void;
  onOpenDetails?: () => void;
  /** 🗑 do rascunho: só passeio e restaurante, nunca logística. */
  onRemove?: () => void;
  /** Foto/nota/aberto-fechado, Michelin, Clã — só chamado com a linha aberta. */
  renderDetail?: (a: TripActivity) => ReactNode;
  /** Prefixo da vista filtrada ("Dia 3"). */
  prefix?: string;
  /** Valor exibido quando difere de `activity.cost` (hotel na vista Custos-âncora). */
  priceBRL?: number;
  highlight?: boolean;
  anchorRef?: Ref<HTMLDivElement>;
}

export const RoteiroLinha = ({
  activity, expanded, onToggle, onCheck, onSwap, onConfirmAnchor, onOpenDetails, onRemove,
  renderDetail, prefix, priceBRL, highlight, anchorRef,
}: RoteiroLinhaProps) => {
  const kind = roteiroKind(activity);
  const actions = roteiroActions(activity);
  const booking = roteiroBooking(activity);
  const canClose = !!onCheck && kind !== 'logistica' && activity.status !== 'confirmed' && activity.status !== 'cancelled';
  const confirmed = activity.status === 'confirmed';
  const price = priceBRL ?? activity.cost;
  const paid = confirmed && activity.paidAmount ? activity.paidAmount : 0;
  const detailId = `roteiro-detalhe-${activity.id}`;
  const btn = actionBtn;
  const canConfirm = !!onConfirmAnchor && actions.includes('confirmar');
  const canRemove = !!onRemove && (kind === 'passeio' || kind === 'restaurante')
    && activity.status !== 'confirmed' && activity.status !== 'cancelled';

  return (
    <div
      ref={anchorRef}
      data-roteiro-line="item"
      className={`rounded-xl ${confirmed ? 'bg-emerald-500/10' : ''} ${activity.status === 'cancelled' ? 'opacity-50' : ''} ${highlight ? 'ring-2 ring-emerald-400' : ''}`}
    >
      <div className="flex items-center gap-2 h-11 px-1">
        {kind === 'logistica' ? (
          <span className="w-6 text-center flex-shrink-0" aria-label="Logística">{logisticsIcon(activity)}</span>
        ) : !onCheck ? (
          <span className="w-6 text-center flex-shrink-0 text-muted-foreground" aria-hidden="true">•</span>
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={confirmed}
            aria-label={confirmed ? `${activity.name}: feito` : `Marcar ${activity.name} como feito`}
            disabled={confirmed}
            onClick={onCheck}
            className={`w-6 h-6 flex-shrink-0 rounded-md border flex items-center justify-center ${
              confirmed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border hover:border-primary'
            }`}
          >
            {confirmed && <Check size={14} />}
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex-1 min-w-0 flex items-center gap-2 text-left text-sm"
        >
          {prefix && <span className="text-[10px] text-muted-foreground font-bold flex-shrink-0">{prefix}</span>}
          <span className="text-muted-foreground tabular-nums flex-shrink-0">{activity.time}</span>
          <span className={`truncate font-['Outfit'] ${kind === 'logistica' ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
            {activity.name}
            {activity.duration && <span className="text-muted-foreground font-normal"> · {activity.duration}</span>}
            {paid > 0 ? (
              <span className="text-emerald-400 font-normal"> · ✓ {brl(paid)}</span>
            ) : price > 0 ? (
              <span className="text-muted-foreground font-normal"> · ~{brl(price)}</span>
            ) : null}
          </span>
          <span className="ml-auto flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </button>
      </div>

      {expanded && (
        <div id={detailId} className="pl-9 pr-2 pb-3 space-y-2 text-sm">
          {kind === 'logistica' && (
            <p className="text-xs text-muted-foreground">📍 Logística — gerenciado no Painel</p>
          )}
          {activity.description && <p className="text-muted-foreground">💡 {activity.description}</p>}
          {renderDetail?.(activity)}
          {activity.jetLagFriendly && <p className="text-xs text-[#eab308]">🧘 Leve para o jet lag</p>}
          <p className="text-xs text-muted-foreground">
            {paid > 0
              ? `✓ ${brl(paid)} pago — valor que você registrou`
              : price > 0
                ? `~${brl(price)} — estimativa do KINU${activity.edited ? ' (ajustada por você)' : ''}`
                : kind === 'passeio' || kind === 'restaurante' ? 'Grátis' : null}
          </p>
          {booking?.type === 'text' && (
            <p data-roteiro-line="booking" className="text-xs text-muted-foreground">{booking.text}</p>
          )}
          {(actions.includes('trocar') || canConfirm || canClose || canRemove || booking) && (
            <div className="flex gap-2 flex-wrap">
              {canClose && (
                <button type="button" onClick={onCheck} className={`${btn} bg-background border border-border text-foreground hover:border-primary/50`}>
                  <Check size={12} /> Marcar como fechado
                </button>
              )}
              {canConfirm && (
                <button type="button" onClick={onConfirmAnchor} className={`${btn} bg-[#10b981] text-white hover:bg-[#10b981]/80`}>
                  <Check size={12} /> Confirmar
                </button>
              )}
              <BookingAction booking={booking} />
              {actions.includes('trocar') && (
                <button type="button" onClick={onSwap} className={`${btn} bg-background border border-border text-foreground hover:border-primary/50`}>
                  <RotateCcw size={12} /> Trocar ↻
                </button>
              )}
              {canRemove && (
                <button type="button" onClick={onRemove} className={`${btn} bg-background border border-border text-red-400 hover:border-red-500/50`}>
                  <Trash2 size={12} /> Remover
                </button>
              )}
            </div>
          )}
          {onOpenDetails && (
            <button type="button" onClick={onOpenDetails} className="text-xs text-primary hover:underline">
              Mais detalhes
            </button>
          )}
        </div>
      )}
    </div>
  );
};

type LinhaHandlers = Pick<RoteiroLinhaProps, 'renderDetail'> & {
  onCheck?: (a: TripActivity, actIndex: number) => void;
  onSwap: (a: TripActivity, actIndex: number) => void;
  onConfirmAnchor?: (tipo: 'voo' | 'hotel') => void;
  onOpenDetails?: (a: TripActivity) => void;
  onRemove?: (a: TripActivity, actIndex: number) => void;
};

interface RoteiroDiaProps extends LinhaHandlers {
  dayNumber: number;
  date?: Date;
  activities: TripActivity[];
  destination: string;
  /** Trechos OSRM que o mapa já calculou para este dia (null = mapa ainda não calculou). */
  liveLegs: RouteLeg[] | null;
  /** C.5c — linhas abertas: abrir uma não fecha a outra. */
  expandedIds: ReadonlySet<string>;
  onToggleExpand: (id: string) => void;
  onCollapseAll: () => void;
  /** null = dia sem rota (Embarque/Retorno). Só é chamado com o bloco aberto. */
  renderMap: (() => ReactNode) | null;
  routeOpen: boolean;
  onRouteToggle: () => void;
  mapAnchorRef?: Ref<HTMLDivElement>;
  anchorActivityId?: string | null;
  anchorRef?: Ref<HTMLDivElement>;
  highlightId?: string | null;
}

export const RoteiroDia = ({
  dayNumber, date, activities, destination, liveLegs, expandedIds, onToggleExpand, onCollapseAll,
  renderMap, routeOpen, onRouteToggle, mapAnchorRef, anchorActivityId, anchorRef, highlightId,
  onCheck, onSwap, onConfirmAnchor, onOpenDetails, onRemove, renderDetail,
}: RoteiroDiaProps) => {
  const legs = activities.map((a, i) => (i > 0 ? legBetween(activities[i - 1], a, liveLegs, destination) : null));
  const routeMinutes = legs.reduce((s, l) => s + (l?.minutes ?? 0), 0);
  const isAnchorCost = (a: TripActivity) => a.category === 'voo' || a.category === 'hotel';
  const dayTotal = activities.filter((a) => !isAnchorCost(a)).reduce((s, a) => s + (a.cost || 0), 0);
  const dateLabel = date && !isNaN(date.getTime())
    ? `${format(date, 'dd/MMM', { locale: ptBR })} (${format(date, 'EEEE', { locale: ptBR }).replace(/-feira$/, '')})`
    : null;
  const header = [
    `Dia ${dayNumber}`,
    dateLabel,
    `${activities.length} ${activities.length === 1 ? 'item' : 'itens'}`,
    dayTotal > 0 ? brl(dayTotal) : null,
  ].filter(Boolean).join(' · ');
  const anyOpen = activities.some((a) => expandedIds.has(a.id));

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <h3 data-roteiro-line="header" className="flex-1 min-w-0 font-semibold text-sm text-foreground font-['Outfit'] truncate">{header}</h3>
        {anyOpen && (
          <button type="button" onClick={onCollapseAll} className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline">
            fechar tudo
          </button>
        )}
      </div>

      {renderMap && (
        <div ref={mapAnchorRef} className="mb-2">
          <button
            type="button"
            data-roteiro-line="rota"
            onClick={onRouteToggle}
            aria-expanded={routeOpen}
            className="w-full flex items-center gap-2 h-10 px-2 rounded-lg bg-muted/40 text-xs text-muted-foreground"
          >
            <span>🗺 Rota do dia{routeMinutes > 0 ? ` · ~${routeMinutes} min de deslocamento` : ''}</span>
            <span className="ml-auto">{routeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          </button>
          {routeOpen && <div className="mt-2">{renderMap()}</div>}
        </div>
      )}

      <div>
        {activities.map((activity, actIndex) => (
          <div key={activity.id}>
            {legs[actIndex] && (
              <p data-roteiro-line="leg" className="h-5 pl-9 text-[10px] text-muted-foreground font-['Outfit']">
                {legs[actIndex]!.text}
              </p>
            )}
            <RoteiroLinha
              activity={activity}
              expanded={expandedIds.has(activity.id)}
              onToggle={() => onToggleExpand(activity.id)}
              onCheck={onCheck && (() => onCheck(activity, actIndex))}
              onSwap={() => onSwap(activity, actIndex)}
              onConfirmAnchor={onConfirmAnchor && (() => onConfirmAnchor(activity.category === 'voo' ? 'voo' : 'hotel'))}
              onOpenDetails={onOpenDetails && (() => onOpenDetails(activity))}
              onRemove={onRemove && (() => onRemove(activity, actIndex))}
              renderDetail={renderDetail}
              highlight={highlightId === activity.id}
              anchorRef={activity.id === anchorActivityId ? anchorRef : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoteiroDia;
