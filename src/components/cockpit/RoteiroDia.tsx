import type { ReactNode, Ref } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, ChevronDown, Check, Tag, RotateCcw } from 'lucide-react';
import type { TripActivity } from '@/types/trip';
import type { RouteLeg } from '@/components/cockpit/DailyRouteMap';
import { legBetween, roteiroActions, roteiroKind } from '@/lib/roteiroBlocks';

// C.5b — a aba Roteiro da viagem ativa em blocos: uma linha fechada por item, detalhe e
// ações só ao abrir. Apresentação pura: nenhum estado de viagem, nenhum handler próprio —
// os de Viagens.tsx (confirmModal, ofertas, troca, drawer, confirmar voo/hotel) chegam por prop.

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

const logisticsIcon = (a: TripActivity) => {
  if (a.category === 'voo' || (a.name || '').toLowerCase().includes('aeroporto')) return '✈️';
  if (a.category === 'hotel') return '🏨';
  return '🚕';
};

interface RoteiroLinhaProps {
  activity: TripActivity;
  expanded: boolean;
  onToggle: () => void;
  /** ☐ → o confirmModal existente. */
  onCheck: () => void;
  onOffers: () => void;
  onSwap: () => void;
  onConfirmAnchor: () => void;
  onOpenDetails: () => void;
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
  activity, expanded, onToggle, onCheck, onOffers, onSwap, onConfirmAnchor, onOpenDetails,
  renderDetail, prefix, priceBRL, highlight, anchorRef,
}: RoteiroLinhaProps) => {
  const kind = roteiroKind(activity);
  const actions = roteiroActions(activity);
  const confirmed = activity.status === 'confirmed';
  const price = priceBRL ?? activity.cost;
  const paid = confirmed && activity.paidAmount ? activity.paidAmount : 0;
  const detailId = `roteiro-detalhe-${activity.id}`;
  const btn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors';

  return (
    <div
      ref={anchorRef}
      data-roteiro-line="item"
      className={`rounded-xl ${confirmed ? 'bg-emerald-500/10' : ''} ${activity.status === 'cancelled' ? 'opacity-50' : ''} ${highlight ? 'ring-2 ring-emerald-400' : ''}`}
    >
      <div className="flex items-center gap-2 h-11 px-1">
        {kind === 'logistica' ? (
          <span className="w-6 text-center flex-shrink-0" aria-label="Logística">{logisticsIcon(activity)}</span>
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
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.includes('confirmar') && (
                <button type="button" onClick={onConfirmAnchor} className={`${btn} bg-[#10b981] text-white hover:bg-[#10b981]/80`}>
                  <Check size={12} /> Confirmar
                </button>
              )}
              {actions.includes('reservar') && (
                <button type="button" onClick={onOffers} className={`${btn} bg-background border border-border text-foreground hover:border-primary/50`}>
                  <Tag size={12} /> Reservar com parceiro ▸
                </button>
              )}
              {actions.includes('trocar') && (
                <button type="button" onClick={onSwap} className={`${btn} bg-background border border-border text-foreground hover:border-primary/50`}>
                  <RotateCcw size={12} /> Trocar ↻
                </button>
              )}
            </div>
          )}
          <button type="button" onClick={onOpenDetails} className="text-xs text-primary hover:underline">
            Mais detalhes
          </button>
        </div>
      )}
    </div>
  );
};

type LinhaHandlers = Pick<RoteiroLinhaProps, 'renderDetail'> & {
  onCheck: (a: TripActivity, actIndex: number) => void;
  onOffers: (a: TripActivity) => void;
  onSwap: (a: TripActivity, actIndex: number) => void;
  onConfirmAnchor: (tipo: 'voo' | 'hotel') => void;
  onOpenDetails: (a: TripActivity) => void;
};

interface RoteiroDiaProps extends LinhaHandlers {
  dayNumber: number;
  date?: Date;
  activities: TripActivity[];
  destination: string;
  /** Trechos OSRM que o mapa já calculou para este dia (null = mapa ainda não calculou). */
  liveLegs: RouteLeg[] | null;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
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
  dayNumber, date, activities, destination, liveLegs, expandedId, onExpand,
  renderMap, routeOpen, onRouteToggle, mapAnchorRef, anchorActivityId, anchorRef, highlightId,
  onCheck, onOffers, onSwap, onConfirmAnchor, onOpenDetails, renderDetail,
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

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <h3 data-roteiro-line="header" className="font-semibold text-sm text-foreground font-['Outfit'] mb-2 truncate">{header}</h3>

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
              expanded={expandedId === activity.id}
              onToggle={() => onExpand(expandedId === activity.id ? null : activity.id)}
              onCheck={() => onCheck(activity, actIndex)}
              onOffers={() => onOffers(activity)}
              onSwap={() => onSwap(activity, actIndex)}
              onConfirmAnchor={() => onConfirmAnchor(activity.category === 'voo' ? 'voo' : 'hotel')}
              onOpenDetails={() => onOpenDetails(activity)}
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
