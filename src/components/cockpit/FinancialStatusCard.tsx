interface FinancialStatus {
  confirmed: number;
  inAuction: number;
  pending: number;
  total: number;
}

interface FinancialStatusCardProps {
  status: FinancialStatus;
  budget: number;
}

const FinancialStatusCard = ({ status, budget }: FinancialStatusCardProps) => {
  const confirmedPercent = Math.round((status.confirmed / budget) * 100);
  const auctionPercent = Math.round((status.inAuction / budget) * 100);
  const pendingPercent = Math.round((status.pending / budget) * 100);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mt-4">
      <h3 className="font-semibold text-foreground font-['Outfit'] mb-4 flex items-center gap-2">
        💰 STATUS FINANCEIRO
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Planejado:</span>
          <span className="text-foreground font-medium font-['Outfit']">
            R$ {budget.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground text-sm">Confirmado:</span>
          </div>
          <span className="text-primary font-medium font-['Outfit']">
            R$ {status.confirmed.toLocaleString()} ({confirmedPercent}%)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--kinu-gold))] animate-pulse" />
            <span className="text-muted-foreground text-sm">Em Leilão:</span>
          </div>
          <span className="text-[hsl(var(--kinu-gold))] font-medium font-['Outfit']">
            R$ {status.inAuction.toLocaleString()} ({auctionPercent}%)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground text-sm">Pendente:</span>
          </div>
          <span className="text-muted-foreground font-medium font-['Outfit']">
            R$ {status.pending.toLocaleString()} ({pendingPercent}%)
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${confirmedPercent}%` }}
        />
        <div 
          className="h-full bg-[hsl(var(--kinu-gold))] transition-all"
          style={{ width: `${auctionPercent}%` }}
        />
        <div 
          className="h-full bg-muted-foreground/30 transition-all"
          style={{ width: `${pendingPercent}%` }}
        />
      </div>
    </div>
  );
};

export default FinancialStatusCard;
