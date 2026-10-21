// PainelResumo — C.11: o Painel resume e redireciona. Três linhas que só LEEM
// (razão, prontidão, dias do roteiro) e levam à aba. Nenhuma conta nova aqui.
import { razaoLines, razaoTotals } from '@/lib/razaoLines';
import { prontidao, requiresBooking, roteiroKind } from '@/lib/roteiroBlocks';
import type { TripActivity } from '@/types/trip';
interface PainelResumoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any;
  onNavigateTab: (tab: string) => void;
}

const brl = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

function Linha({ icon, title, line, onClick, testId }: { icon: string; title: string; line: string; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="w-full flex items-center justify-between gap-3 min-h-[44px] py-3 px-4 bg-card border border-border rounded-xl text-left hover:border-primary/40 transition-colors"
 >
      <span className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{title}</span>
          <span className="block text-xs text-muted-foreground truncate">{line}</span>
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium text-primary">Ver ▸</span>
    </button>
  );
}

export const PainelResumo = ({ trip, onNavigateTab }: PainelResumoProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days: any[] = Array.isArray(trip?.days) ? trip.days : [];
  const acts: TripActivity[] = days
    .flatMap((d) => (Array.isArray(d?.activities) ? d.activities : []))
   .filter((a: TripActivity) => a.status !== 'cancelled');

  const visitas = acts.filter((a) => { const k = roteiroKind(a); return k === 'passeio' || k === 'restaurante'; });

  const reservas = visitas.filter(requiresBooking).length;

  const { planned, confirmed } = razaoTotals(razaoLines(trip));

  const budget = Number(trip?.budget) || 0;

  const p = prontidao(trip);

  if (days.length === 0 && budget === 0) return null;

const roteiroLine = days.length > 0

    ? `${days.length} dias · ${visitas.length} atividades${reservas > 0 ? ` · ${reservas} exigem reserva` : ''}`

    : 'Roteiro ainda não gerado';

  const financeiroLine = `Orçamento ${brl(budget)} · Planejado ${brl(planned)} · Confirmado ${brl(confirmed)}`;

  const prontidaoLine = `${p.done} de ${p.total} itens fechados`;

  return (

    <div className="space-y-2" data-testid="painel-resumo">

      <Linha icon="🗺️" title="Roteiro" line={roteiroLine} onClick={() => onNavigateTab('roteiro')} testId="painel-resumo-roteiro" />

      <Linha icon="💰" title="Financeiro" line={financeiroLine} onClick={() => onNavigateTab('financeiro')} testId="painel-resumo-financeiro" />

  <Linha icon="✅" title="Prontidão" line={prontidaoLine} onClick={() => onNavigateTab('preparacao')} testId="painel-resumo-prontidao" />

    </div>

  );

};
