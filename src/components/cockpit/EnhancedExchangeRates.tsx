// EnhancedExchangeRates — Full exchange with real API data, 30-day history, prediction, calculator, alerts

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Bell, Calculator, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface EnhancedExchangeRatesProps {
  destinationCurrency: string;
  baseCurrency?: string;
  budgetBRL?: number;
}

// Generate 3-month prediction based on statistics
function generatePrediction(currentRate: number, trend: 'up' | 'down' | 'stable', trendPercent: number) {
  const predictions: Array<{ month: string; min: number; max: number; confidence: number }> = [];
  const today = new Date();
  
  const trendMultiplier = trend === 'up' ? 0.01 : trend === 'down' ? -0.01 : 0;
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + i);
    
    const projectedChange = trendMultiplier * i;
    const uncertainty = 0.03 * i;
    
    predictions.push({
      month: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      min: Math.round(currentRate * (1 + projectedChange - uncertainty) * 100) / 100,
      max: Math.round(currentRate * (1 + projectedChange + uncertainty) * 100) / 100,
      confidence: Math.max(50, 80 - i * 10),
    });
  }
  
  return predictions;
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'CA$',
    'AUD': 'AU$',
    'CHF': 'CHF',
    'ARS': 'ARS$',
    'CLP': 'CLP$',
    'PEN': 'S/',
  };
  return symbols[currency] || currency;
};

export const EnhancedExchangeRates = ({
  destinationCurrency,
  baseCurrency = 'BRL',
  budgetBRL = 0,
}: EnhancedExchangeRatesProps) => {
  const { 
    rates, 
    history, 
    statistics, 
    loading, 
    error, 
    lastUpdated, 
    refresh, 
    getInsight,
    targetCurrency 
  } = useExchangeRates(destinationCurrency);
  
  const [calcBRL, setCalcBRL] = useState<string>('1000');
  const [calcForeign, setCalcForeign] = useState<string>('100');
  const [alerts, setAlerts] = useState<{ threshold: number; enabled: boolean }[]>([]);

  // Get current rate (inverted because API returns BRL per foreign currency)
  const currentRate = useMemo(() => {
    const rate = rates[destinationCurrency];
    if (!rate || rate === 0) return 5.88; // fallback
    // Rate from API is how much of foreign currency you get for 1 BRL
    // We want to show how much BRL you need for 1 foreign currency
    return 1 / rate;
  }, [rates, destinationCurrency]);

  // Format history for chart
  const chartData = useMemo(() => {
    return history.map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      rate: item.rate > 0 ? 1 / item.rate : 0, // Invert rate
      fullDate: item.date,
    }));
  }, [history]);

  // Calculate stats from inverted rates
  const stats = useMemo(() => {
    if (!statistics) {
      return { min: 0, max: 0, avg: 0, vsAvg: 0 };
    }
    
    // Invert the statistics (since API gives BRL per unit of foreign currency)
    const min = statistics.max > 0 ? 1 / statistics.max : 0;
    const max = statistics.min > 0 ? 1 / statistics.min : 0;
    const avg = statistics.avg > 0 ? 1 / statistics.avg : 0;
    const vsAvg = statistics.current > 0 && statistics.avg > 0 
      ? -((statistics.current - statistics.avg) / statistics.avg) * 100 
      : 0;
    
    return { 
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      vsAvg: Math.round(vsAvg * 10) / 10 
    };
  }, [statistics]);

  // Trend (inverted)
  const trend = useMemo(() => {
    if (!statistics) return { direction: 'stable' as const, change: 0 };
    
    // Invert trend direction since we inverted the rate
    const trendDir = statistics.trend === 'up' ? 'down' : statistics.trend === 'down' ? 'up' : 'stable';
    return { 
      direction: trendDir as 'up' | 'down' | 'stable', 
      change: Math.abs(parseFloat(statistics.trendPercent)) 
    };
  }, [statistics]);

  // Predictions
  const predictions = useMemo(() => {
    if (!statistics) return [];
    return generatePrediction(currentRate, trend.direction, trend.change);
  }, [currentRate, trend, statistics]);

  // Initialize alerts based on current rate
  useMemo(() => {
    if (currentRate > 0 && alerts.length === 0) {
      setAlerts([
        { threshold: Math.round(currentRate * 0.97 * 100) / 100, enabled: false },
        { threshold: Math.round(currentRate * 0.93 * 100) / 100, enabled: false },
      ]);
    }
  }, [currentRate, alerts.length]);

  const insight = getInsight();
  const budgetInForeign = budgetBRL ? Math.round(budgetBRL / currentRate) : 0;
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-red-500' : trend.direction === 'down' ? 'text-emerald-500' : 'text-muted-foreground';
  const currencySymbol = getCurrencySymbol(destinationCurrency);
  
  // Show loading state
  if (loading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>
    );
  }

  // Show error state
  if (error && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => refresh()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

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
            onClick={() => refresh()}
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
              R$ 1,00 = {currencySymbol} {(1/currentRate).toFixed(4)}
            </p>
          </div>
          
          <div className="text-right">
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon size={18} />
              <span className="font-medium">
                {trend.change > 0 ? (trend.direction === 'up' ? '+' : '-') : ''}{trend.change}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado: {lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* 30-Day Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4">📊 Histórico (últimos 30 dias)</h3>
        
        {chartData.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value.toFixed(2)}`}
                  />
                  {stats.avg > 0 && (
                    <ReferenceLine y={stats.avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(4)}`, `1 ${destinationCurrency}`]}
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
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Maior</p>
                <p className="font-medium text-red-500">R$ {stats.max.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Média</p>
                <p className="font-medium text-foreground">R$ {stats.avg.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Hoje vs Média</p>
                <p className={cn("font-medium", stats.vsAvg < 0 ? 'text-emerald-500' : stats.vsAvg > 0 ? 'text-red-500' : 'text-foreground')}>
                  {stats.vsAvg > 0 ? '+' : ''}{stats.vsAvg}%
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Dados históricos não disponíveis
          </div>
        )}
      </motion.div>
      
      {/* Prediction */}
      {predictions.length > 0 && (
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
      )}
      
      {/* KINU Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={cn(
          "border rounded-2xl p-4",
          insight.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30' :
          insight.type === 'negative' ? 'bg-red-500/10 border-red-500/30' :
          'bg-card border-border'
        )}
      >
        <div className="flex items-start gap-2">
          <Sparkles size={18} className={cn(
            "mt-0.5 flex-shrink-0",
            insight.type === 'positive' ? 'text-emerald-500' :
            insight.type === 'negative' ? 'text-red-500' :
            'text-primary'
          )} />
          <div>
            <p className="font-medium text-foreground mb-1">💡 Insight KINU</p>
            <p className="text-sm text-muted-foreground">
              {insight.message}
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
          Cotações fornecidas pela API ExchangeRate.host. Valores são aproximados e podem variar. 
          Predições baseadas em padrões históricos, sem garantia de precisão.
        </p>
      </div>
    </div>
  );
};
