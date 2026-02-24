import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Bug } from 'lucide-react';

interface ApiResult {
  name: string;
  status: 'loading' | 'ok' | 'error';
  message: string;
}

export function ApiStatus() {
  const [results, setResults] = useState<ApiResult[]>([
    { name: 'Unsplash', status: 'loading', message: 'Testando...' },
    { name: 'Weather', status: 'loading', message: 'Testando...' },
    { name: 'KINU AI', status: 'loading', message: 'Testando...' },
    { name: 'Exchange Rate', status: 'loading', message: 'Testando...' },
  ]);

  const update = (idx: number, status: 'ok' | 'error', message: string) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status, message } : r));
  };

  useEffect(() => {
    // Test Unsplash
    supabase.functions.invoke('unsplash', { body: { query: 'paris', perPage: 1 } })
      .then(({ data, error }) => update(0, error ? 'error' : 'ok', error?.message || 'Connected'))
      .catch(e => update(0, 'error', e.message));

    // Test Weather
    supabase.functions.invoke('weather', { body: { lat: 48.8566, lon: 2.3522 } })
      .then(({ data, error }) => update(1, error ? 'error' : 'ok', error?.message || 'Connected'))
      .catch(e => update(1, 'error', e.message));

    // Test KINU AI
    supabase.functions.invoke('kinu-ai', { body: { message: 'Olá', context: {} } })
      .then(({ data, error }) => update(2, error ? 'error' : 'ok', error?.message || 'Connected'))
      .catch(e => update(2, 'error', e.message));

    // Test Exchange Rate
    supabase.functions.invoke('exchange-rates', { body: { base: 'BRL', targets: ['EUR'] } })
      .then(({ data, error }) => update(3, error ? 'error' : 'ok', error?.message || 'Connected'))
      .catch(e => update(3, 'error', e.message));
  }, []);

  return (
    <div className="mx-4 mb-4 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
      <div className="flex items-center gap-2 mb-3">
        <Bug size={16} className="text-yellow-500" />
        <span className="text-xs font-bold font-['Outfit'] text-yellow-500 uppercase tracking-wider">Debug — API Status</span>
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.name} className="flex items-center gap-2 text-sm">
            {r.status === 'loading' && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            {r.status === 'ok' && <CheckCircle2 size={14} className="text-emerald-500" />}
            {r.status === 'error' && <XCircle size={14} className="text-destructive" />}
            <span className="font-medium text-foreground">{r.name}:</span>
            <span className={r.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{r.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
