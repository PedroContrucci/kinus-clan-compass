// ItineraryExchangeRate — Shows current exchange rate for the destination
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { Skeleton } from '@/components/ui/skeleton';

interface ItineraryExchangeRateProps {
  destination: string;
  compact?: boolean;
}

// Map destinations to currencies
const destinationCurrencyMap: Record<string, string> = {
  'Paris': 'EUR',
  'Roma': 'EUR',
  'Lisboa': 'EUR',
  'Barcelona': 'EUR',
  'Berlim': 'EUR',
  'Amsterdam': 'EUR',
  'Tóquio': 'JPY',
  'Tokyo': 'JPY',
  'Londres': 'GBP',
  'London': 'GBP',
  'Nova York': 'USD',
  'New York': 'USD',
  'Miami': 'USD',
  'Los Angeles': 'USD',
  'Dubai': 'AED',
  'Bangkok': 'THB',
  'Buenos Aires': 'ARS',
  'Santiago': 'CLP',
  'Lima': 'PEN',
  'Cidade do México': 'MXN',
  'Cancún': 'MXN',
};

export const ItineraryExchangeRate = ({ destination, compact = false }: ItineraryExchangeRateProps) => {
  const targetCurrency = destinationCurrencyMap[destination] || 'USD';
  const { rates, statistics, loading, refresh } = useExchangeRates(targetCurrency);

  if (loading) {
    return compact ? null : <Skeleton className="h-8 w-24" />;
  }

  const currentRate = rates[targetCurrency];
  if (!currentRate) {
    return null;
  }

  const getTrendIcon = () => {
    if (!statistics) return <Minus size={12} className="text-muted-foreground" />;
    if (statistics.trend === 'up') return <TrendingUp size={12} className="text-red-400" />;
    if (statistics.trend === 'down') return <TrendingDown size={12} className="text-emerald-400" />;
    return <Minus size={12} className="text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!statistics) return 'text-muted-foreground';
    if (statistics.trend === 'up') return 'text-red-400';
    if (statistics.trend === 'down') return 'text-emerald-400';
    return 'text-muted-foreground';
  };

  // How much 1 unit of foreign currency costs in BRL
  const rateDisplay = (1 / currentRate).toFixed(2);

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">1 {targetCurrency} =</span>
        <span className="font-medium text-foreground">R$ {rateDisplay}</span>
        {getTrendIcon()}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
      <div className="text-xs">
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">1 {targetCurrency} = R$ {rateDisplay}</span>
          {getTrendIcon()}
        </div>
        {statistics && (
          <p className={`text-[10px] ${getTrendColor()}`}>
            {statistics.trend === 'up' ? '↑' : statistics.trend === 'down' ? '↓' : '→'} 
            {' '}{Math.abs(parseFloat(statistics.trendPercent)).toFixed(1)}% vs ontem
          </p>
        )}
      </div>
      <button
        onClick={() => refresh()}
        className="p-1 hover:bg-muted rounded transition-colors"
        title="Atualizar cotação"
      >
        <RefreshCw size={12} className="text-muted-foreground" />
      </button>
    </div>
  );
};

export default ItineraryExchangeRate;
