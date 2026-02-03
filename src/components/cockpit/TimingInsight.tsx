interface TimingInsightProps {
  type: 'WAIT' | 'URGENT' | 'NEUTRAL';
  trend: string;
  confidence: number;
  message: string;
  onWait?: () => void;
  onCloseNow?: () => void;
}

const TimingInsight = ({ type, trend, confidence, message, onWait, onCloseNow }: TimingInsightProps) => {
  const isUrgent = type === 'URGENT';
  
  return (
    <div className={`timing-insight ${isUrgent ? 'urgent' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isUrgent ? '🔥' : type === 'WAIT' ? '📉' : '➡️'}</span>
        <span className="font-semibold text-foreground font-['Outfit']">
          INSIGHT DE TIMING
        </span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-sm font-medium ${isUrgent ? 'text-destructive' : 'text-[hsl(var(--kinu-gold))]'}`}>
          {isUrgent ? '⚠️' : '📉'} Tendência: {trend}
        </span>
        <span className="text-sm text-muted-foreground">
          Confiança: {confidence}%
        </span>
      </div>
      
      <p className="text-sm text-foreground/80 mb-4">
        "{message}" 🌿
      </p>
      
      <div className="flex gap-2">
        {type === 'WAIT' && (
          <>
            <button 
              onClick={onWait}
              className="flex-1 py-2 px-4 bg-[hsl(var(--kinu-gold))]/10 border border-[hsl(var(--kinu-gold))]/30 text-[hsl(var(--kinu-gold))] rounded-lg text-sm font-medium hover:bg-[hsl(var(--kinu-gold))]/20 transition-colors"
            >
              Aguardar
            </button>
            <button 
              onClick={onCloseNow}
              className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Fechar Agora Mesmo Assim
            </button>
          </>
        )}
        {type === 'URGENT' && (
          <button 
            onClick={onCloseNow}
            className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            🔥 Fechar Agora
          </button>
        )}
      </div>
    </div>
  );
};

export default TimingInsight;
