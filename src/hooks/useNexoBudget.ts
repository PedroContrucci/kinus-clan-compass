// Hook para usar o Motor Nexo

import { useState, useEffect, useMemo } from 'react';
import { NexoBudgetInput, NexoBudgetOutput } from '@/engines/nexo/types';
import { runNexoEngine } from '@/engines/nexo/NexoEngine';

interface UseNexoBudgetResult {
  data: NexoBudgetOutput | null;
  loading: boolean;
  error: string | null;
  recalculate: (input: NexoBudgetInput) => void;
}

export const useNexoBudget = (initialInput?: NexoBudgetInput): UseNexoBudgetResult => {
  const [data, setData] = useState<NexoBudgetOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<NexoBudgetInput | undefined>(initialInput);

  const calculate = useMemo(() => {
    return (budgetInput: NexoBudgetInput): NexoBudgetOutput => {
      try {
        return runNexoEngine(budgetInput);
      } catch (err) {
        throw new Error('Erro ao calcular budget');
      }
    };
  }, []);

  useEffect(() => {
    if (!input) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Simular async para UX consistente
    const timer = setTimeout(() => {
      try {
        const result = calculate(input);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [input, calculate]);

  const recalculate = (newInput: NexoBudgetInput) => {
    setInput(newInput);
  };

  return { data, loading, error, recalculate };
};

export default useNexoBudget;
