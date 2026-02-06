// ExchangeRates — Currency exchange info and historical chart

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Info, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExchangeRatesProps {
  destinationCurrency: string;
  baseCurrency?: string;
}

interface RateData {
  date: string;
  rate: number;
}

// Mock historical data generator (would be replaced with real API)
function generateMockHistory(currentRate: number, days: number = 30): RateData[] {
  const data: RateData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Add some variation to simulate real fluctuations
    const variation = (Math.random() - 0.5) * 0.1 * currentRate;
    const rate = currentRate + variation;
    
    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      rate: Math.round(rate * 100) / 100,
    });
  }
  
  return data;
}

// Exchange rates relative to BRL (approximate)
const EXCHANGE_RATES: Record<string, number> = {
  'USD': 5.10,
  'EUR': 5.50,
  'GBP': 6.40,
  'JPY': 0.034,
  'ARS': 0.0058,
  'CLP': 0.0056,
  'MXN': 0.30,
  'PEN': 1.36,
  'COP': 0.0013,
  'UYU': 0.13,
};

export const ExchangeRates = ({ destinationCurrency, baseCurrency = 'BRL' }: ExchangeRatesProps) => {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchRate = async () => {
      setLoading(true);
      
      // Try to get from Supabase first
      const { data } = await supabase
        .from('exchange_rates')
        .select('rate, recorded_at')
        .eq('base_currency', baseCurrency)
        .eq('target_currency', destinationCurrency)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setCurrentRate(data.rate);
        setLastUpdate(new Date(data.recorded_at || Date.now()));
      } else {
        // Use mock data
        setCurrentRate(EXCHANGE_RATES[destinationCurrency] || 1);
        setLastUpdate(new Date());
      }
      
      setLoading(false);
    };

    fetchRate();
  }, [destinationCurrency, baseCurrency]);

  const historicalData = useMemo(() => {
    if (!currentRate) return [];
    return generateMockHistory(currentRate);
  }, [currentRate]);

  const trend = useMemo(() => {
    if (historicalData.length < 2) return 'stable';
    const first = historicalData[0].rate;
    const last = historicalData[historicalData.length - 1].rate;
    const change = ((last - first) / first) * 100;
    
    if (change > 1) return 'up';
    if (change < -1) return 'down';
    return 'stable';
  }, [historicalData]);

  const trendPercentage = useMemo(() => {
    if (historicalData.length < 2) return 0;
    const first = historicalData[0].rate;
    const last = historicalData[historicalData.length - 1].rate;
    return ((last - first) / first) * 100;
  }, [historicalData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-emerald-500' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Current Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            <span className="font-medium text-foreground">Cotação Atual</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground font-['Outfit']">
              R$ {currentRate?.toFixed(2) || '—'}
            </p>
            <p className="text-sm text-muted-foreground">
              1 {destinationCurrency} = R$ {currentRate?.toFixed(2)}
            </p>
          </div>
          
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon size={18} />
            <span className="font-medium">
              {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground">
            {trend === 'up' && '📈 O Real está desvalorizando. Considere comprar moeda agora.'}
            {trend === 'down' && '📉 O Real está valorizando. Bom momento para acompanhar.'}
            {trend === 'stable' && '➡️ Câmbio estável nos últimos 30 dias.'}
          </p>
        </div>
      </motion.div>

      {/* Historical Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          📊 Histórico (30 dias)
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value.toFixed(2)}`}
              />
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
      </motion.div>

      {/* Quick Conversion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="font-medium text-foreground mb-4">💱 Conversão Rápida</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {[100, 500, 1000, 5000].map((amount) => (
            <div key={amount} className="bg-muted/50 rounded-xl p-3">
              <p className="text-sm text-muted-foreground">{amount} {destinationCurrency}</p>
              <p className="font-bold text-foreground font-['Outfit']">
                R$ {((amount * (currentRate || 1)).toFixed(2))}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <p>
          Cotações são aproximadas e podem variar. Consulte seu banco ou casa de câmbio 
          para valores exatos antes de comprar moeda estrangeira.
        </p>
      </div>
    </div>
  );
};

export default ExchangeRates;
