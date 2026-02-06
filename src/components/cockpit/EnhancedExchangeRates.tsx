// EnhancedExchangeRates — Full exchange with 12-month history, prediction, calculator, alerts

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Bell, Calculator, Sparkles, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

interface EnhancedExchangeRatesProps {
  destinationCurrency: string;
  baseCurrency?: string;
  budgetBRL?: number;
}

interface RateData {
  month: string;
  rate: number;
  label: string;
}

interface Prediction {
  month: string;
  min: number;
  max: number;
  confidence: number;
}

// Generate 12-month historical data
function generate12MonthHistory(currentRate: number): RateData[] {
  const data: RateData[] = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    
    // More realistic variation based on economic cycles
    const baseVariation = Math.sin((i / 12) * Math.PI * 2) * 0.08; // Seasonal pattern
    const randomVariation = (Math.random() - 0.5) * 0.06;
    const rate = currentRate * (1 + baseVariation + randomVariation);
    
    data.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      rate: Math.round(rate * 100) / 100,
      label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    });
  }
  
  // Ensure last month is current rate
  data[data.length - 1].rate = currentRate;
  
  return data;
}

// Generate 3-month prediction
function generatePrediction(currentRate: number, historicalData: RateData[]): Prediction[] {
  const predictions: Prediction[] = [];
  const today = new Date();
  
  // Calculate trend from historical data
  const recentRates = historicalData.slice(-3).map(d => d.rate);
  const avgRecent = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
  const trend = (currentRate - avgRecent) / avgRecent;
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + i);
    
    // Project with decreasing confidence
    const projectedChange = trend * i * 0.3;
    const uncertainty = 0.03 * i; // Increases over time
    
    predictions.push({
      month: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      min: Math.round(currentRate * (1 + projectedChange - uncertainty) * 100) / 100,
      max: Math.round(currentRate * (1 + projectedChange + uncertainty) * 100) / 100,
      confidence: Math.max(50, 80 - i * 10),
    });
  }
  
  return predictions;
}

// Exchange rates relative to BRL
const EXCHANGE_RATES: Record<string, number> = {
  'USD': 5.10,
  'EUR': 5.88,
  'GBP': 6.40,
  'JPY': 0.034,
  'CAD': 3.80,
  'AUD': 3.40,
  'CHF': 5.90,
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'AU$',
    'CHF': 'CHF',
  };
  return symbols[currency] || currency;
};

export const EnhancedExchangeRates = ({
  destinationCurrency,
  baseCurrency = 'BRL',
  budgetBRL = 0,
}: EnhancedExchangeRatesProps) => {
  const [currentRate, setCurrentRate] = useState<number>(EXCHANGE_RATES[destinationCurrency] || 5.50);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [calcBRL, setCalcBRL] = useState<string>('1000');
  const [calcForeign, setCalcForeign] = useState<string>('100');
  const [alerts, setAlerts] = useState<{ threshold: number; enabled: boolean }[]>([
    { threshold: Math.round(currentRate * 0.97 * 100) / 100, enabled: false },
    { threshold: Math.round(currentRate * 0.93 * 100) / 100, enabled: false },
  ]);
  
  const historicalData = useMemo(() => generate12MonthHistory(currentRate), [currentRate]);
  const predictions = useMemo(() => generatePrediction(currentRate, historicalData), [currentRate, historicalData]);
  
  const stats = useMemo(() => {
    const rates = historicalData.map(d => d.rate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const minMonth = historicalData.find(d => d.rate === min)?.label || '';
    const maxMonth = historicalData.find(d => d.rate === max)?.label || '';
    const vsAvg = ((currentRate - avg) / avg) * 100;
    
    return { min, max, avg: Math.round(avg * 100) / 100, minMonth, maxMonth, vsAvg: Math.round(vsAvg * 10) / 10 };
  }, [historicalData, currentRate]);
  
  const trend = useMemo(() => {
    const first = historicalData[0].rate;
    const last = historicalData[historicalData.length - 1].rate;
    const change = ((last - first) / first) * 100;
    
    if (change > 2) return { direction: 'up' as const, change: Math.round(change * 10) / 10 };
    if (change < -2) return { direction: 'down' as const, change: Math.round(change * 10) / 10 };
    return { direction: 'stable' as const, change: 0 };
  }, [historicalData]);
  
  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLastUpdate(new Date());
      setLoading(false);
    }, 500);
  };
  
  const budgetInForeign = budgetBRL ? Math.round(budgetBRL / currentRate) : 0;
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-red-500' : trend.direction === 'down' ? 'text-emerald-500' : 'text-muted-foreground';
  const currencySymbol = getCurrencySymbol(destinationCurrency);
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Current Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            💱 Cotação Atual
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={cn("text-muted-foreground", loading && "animate-spin")} />
          </button>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground font-['Outfit']">
              R$ {currentRate.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              1 {destinationCurrency} = R$ {currentRate.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              {currencySymbol} 1,00 = R$ {currentRate.toFixed(2)}
            </p>
          </div>
          
          <div className="text-right">
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon size={18} />
              <span className="font-medium">
                {trend.change > 0 ? '+' : ''}{trend.change}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* 12-Month Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4">📊 Histórico (12 meses)</h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[stats.min * 0.95, stats.max * 1.05]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value.toFixed(2)}`}
              />
              <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Taxa']}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Menor</p>
            <p className="font-medium text-emerald-500">R$ {stats.min.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{stats.minMonth}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Maior</p>
            <p className="font-medium text-red-500">R$ {stats.max.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{stats.maxMonth}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Média</p>
            <p className="font-medium text-foreground">R$ {stats.avg.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Hoje vs Média</p>
            <p className={cn("font-medium", stats.vsAvg < 0 ? 'text-emerald-500' : 'text-red-500')}>
              {stats.vsAvg > 0 ? '+' : ''}{stats.vsAvg}%
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Prediction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          🔮 Predição KINU (próximos 3 meses)
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Tendência:</span>
            <span className={cn(
              "font-medium",
              trend.direction === 'up' ? 'text-red-500' : trend.direction === 'down' ? 'text-emerald-500' : 'text-foreground'
            )}>
              {trend.direction === 'up' ? '📈 ALTA' : trend.direction === 'down' ? '📉 BAIXA' : '➡️ ESTÁVEL'}
            </span>
          </div>
          
          {predictions.map((pred, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-card rounded-lg">
              <span className="text-sm text-foreground capitalize">{pred.month}</span>
              <span className="font-medium text-foreground">
                R$ {pred.min.toFixed(2)} - R$ {pred.max.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">
                {pred.confidence}% confiança
              </span>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* KINU Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex items-start gap-2">
          <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground mb-1">💡 Insight KINU</p>
            <p className="text-sm text-muted-foreground">
              {stats.vsAvg < 0 
                ? `O ${destinationCurrency} está ${Math.abs(stats.vsAvg)}% abaixo da média anual — bom momento para comprar! Recomendo adquirir 50-70% agora e o resto mais perto da viagem caso o câmbio melhore.`
                : stats.vsAvg > 3
                  ? `O ${destinationCurrency} está ${stats.vsAvg}% acima da média. Se puder esperar, monitore os próximos dias para uma entrada melhor.`
                  : `O ${destinationCurrency} está próximo da média histórica. Momento neutro para compra.`
              }
            </p>
            
            {budgetBRL > 0 && (
              <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                <p className="text-sm text-foreground">
                  📊 Seu budget: R$ {budgetBRL.toLocaleString()} ≈ {currencySymbol} {budgetInForeign.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Calculator size={16} />
          🧮 Calculadora
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">R$</label>
              <input
                type="number"
                value={calcBRL}
                onChange={(e) => setCalcBRL(e.target.value)}
                className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground font-medium"
              />
            </div>
            <span className="text-muted-foreground mt-5">→</span>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{destinationCurrency}</label>
              <div className="w-full mt-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-foreground font-medium">
                {currencySymbol} {(parseFloat(calcBRL) / currentRate || 0).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{destinationCurrency}</label>
              <input
                type="number"
                value={calcForeign}
                onChange={(e) => setCalcForeign(e.target.value)}
                className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground font-medium"
              />
            </div>
            <span className="text-muted-foreground mt-5">→</span>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">R$</label>
              <div className="w-full mt-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-foreground font-medium">
                R$ {(parseFloat(calcForeign) * currentRate || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Bell size={16} />
          🔔 Alertas de Câmbio
        </h3>
        
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <label key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <span className="text-sm text-foreground">
                Avisar quando {destinationCurrency} {'<'} R$ {alert.threshold.toFixed(2)}
              </span>
              <input
                type="checkbox"
                checked={alert.enabled}
                onChange={() => setAlerts(prev => prev.map((a, idx) => 
                  idx === i ? { ...a, enabled: !a.enabled } : a
                ))}
                className="w-5 h-5 accent-primary"
              />
            </label>
          ))}
          
          <button className="w-full p-3 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
            + Criar alerta personalizado
          </button>
        </div>
      </motion.div>
      
      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/50 rounded-xl">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <p>
          Cotações são aproximadas e podem variar. Predições baseadas em padrões históricos, 
          não constituem recomendação financeira. Consulte seu banco para valores exatos.
        </p>
      </div>
    </div>
  );
};

export default EnhancedExchangeRates;
