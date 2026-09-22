// ClaProof — prova social, só leitura. "👍 12 do clã". Some quando ninguém sinalizou.
//
// Votar é assunto do check-in pós-viagem: no roteiro o clã só informa, nunca pede ação.
import { useClaStats } from '@/hooks/useCla';

interface ClaProofProps {
  /** Id do catálogo (já sem o prefixo `day-N-`). */
  activityId: string;
  city: string;
  className?: string;
}

export const ClaProof = ({ activityId, city, className = '' }: ClaProofProps) => {
  const stats = useClaStats(city);
  if (!activityId || !city) return null;

  const stat = stats.get(activityId);
  const ups = stat?.ups ?? 0;
  if (ups <= 0) return null;

  return (
    <p className={`mt-2 text-[11px] text-emerald-400/90 ${className}`}>
      👍 {ups} do clã
    </p>
  );
};

export default ClaProof;
