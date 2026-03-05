// CountdownCard — Premium countdown with progress ring, readiness score, and quick actions

import { motion } from 'framer-motion';
import { FileText, ClipboardList, MapIcon } from 'lucide-react';

interface CountdownCardProps {
  daysLeft: number;
  isUrgent: boolean;
  isPast: boolean;
  destination: string;
  emoji: string;
  trip: any;
  onNavigate?: (tab: string) => void;
  onExportPdf?: () => void;
}

function getMotivationalMessage(days: number, isPast: boolean): string {
  if (isPast) return 'Aproveite cada momento! 🌟';
  if (days === 0) return 'Hoje é o dia! Boa viagem! ✈️';
  if (days <= 7) return 'Quase lá! Verifique documentos e bagagem';
  if (days <= 30) return 'Contagem regressiva! Revise seu checklist';
  if (days <= 60) return '1 mês para a viagem! Hora de confirmar reservas';
  return 'Tempo de sobra para planejar cada detalhe';
}

function getReadinessScore(trip: any): { score: number; details: { label: string; done: boolean }[] } {
  const details: { label: string; done: boolean }[] = [];
  
  const flightDone = trip.flights?.outbound?.status === 'confirmed';
  details.push({ label: 'Voo', done: flightDone });
  
  const hotelDone = trip.accommodation?.status === 'confirmed';
  details.push({ label: 'Hotel', done: hotelDone });
  
  const checklistItems = trip.checklist?.length || 0;
  const checklistDone = trip.checklist?.filter((i: any) => i.checked).length || 0;
  const checklistComplete = checklistItems > 0 && checklistDone === checklistItems;
  details.push({ label: `Checklist (${checklistDone}/${checklistItems})`, done: checklistComplete });
  
  const budgetConfirmedPct = trip.finances?.total > 0 ? (trip.finances.confirmed / trip.finances.total) * 100 : 0;
  details.push({ label: `Orçamento (${Math.round(budgetConfirmedPct)}%)`, done: budgetConfirmedPct >= 80 });
  
  const doneCount = details.filter(d => d.done).length;
  const score = Math.round((doneCount / details.length) * 100);
  
  return { score, details };
}

// SVG Progress Ring
const ProgressRing = ({ progress, size = 100, strokeWidth = 6, children }: { progress: number; size?: number; strokeWidth?: number; children: React.ReactNode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#gradient)" strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export const CountdownCard = ({ daysLeft, isUrgent, isPast, destination, emoji, trip, onNavigate, onExportPdf }: CountdownCardProps) => {
  const message = getMotivationalMessage(daysLeft, isPast);
  const { score, details } = getReadinessScore(trip);
  const maxDays = 90;
  const ringProgress = isPast ? 100 : Math.min(100, ((maxDays - daysLeft) / maxDays) * 100);

  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const barColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      {/* Countdown + Ring */}
      <div className="flex items-center gap-5">
        <ProgressRing progress={ringProgress} size={90} strokeWidth={5}>
          <div className="text-center">
            <span className="text-2xl font-bold font-['Outfit'] text-foreground">
              {isPast ? '🎉' : daysLeft}
            </span>
            {!isPast && <p className="text-[9px] text-muted-foreground leading-none">dias</p>}
          </div>
        </ProgressRing>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold font-['Outfit'] text-foreground truncate">
            {isPast ? 'Em viagem!' : `${daysLeft} dias para ${destination}`} {emoji}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>

      {/* Readiness Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prontidão</span>
          <span className={`text-sm font-bold font-['Outfit'] ${scoreColor}`}>{score}% pronto</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {details.map((d, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${d.done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-muted/50 border-border text-muted-foreground'}`}>
              {d.done ? '✓' : '○'} {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {(onNavigate || onExportPdf) && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {onNavigate && (
            <>
              <button onClick={() => onNavigate('roteiro')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground hover:border-primary/50 transition-colors">
                <MapIcon size={12} /> Ver Roteiro
              </button>
              <button onClick={() => onNavigate('checklist')} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground hover:border-primary/50 transition-colors">
                <ClipboardList size={12} /> Checklist
              </button>
            </>
          )}
          {onExportPdf && (
            <button onClick={onExportPdf} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground hover:border-primary/50 transition-colors">
              <FileText size={12} /> Gerar PDF
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default CountdownCard;
