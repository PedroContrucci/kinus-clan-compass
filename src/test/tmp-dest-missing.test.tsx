// HARNESS TEMPORÁRIO — deletado ao fim desta rodada. Não commitar.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const makeQuery = () => {
  const q: Record<string, unknown> = {
    insert: async () => ({ error: null }),
    upsert: async () => ({ error: null }),
    update: async () => ({ error: null }),
    delete: async () => ({ error: null }),
  };
  const chain = () => q;
  return Object.assign(q, {
    select: chain, eq: chain, order: chain, limit: chain, single: chain, maybeSingle: chain,
    ilike: chain, gte: chain, lte: chain, in: chain, neq: chain, is: chain, contains: chain,
    then: (res: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(res),
  });
};

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => makeQuery(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    storage: { from: () => ({ upload: async () => ({ data: null, error: null }) }) },
    functions: { invoke: async () => ({ data: null, error: null }) },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    realtime: { channel: () => ({ on: () => ({ subscribe: () => ({}) }) }) },
  },
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: async () => ({ data: null, error: null }) },
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

import { readEvents } from '@/lib/kinuEvents';

const missing = () => readEvents().filter((e) => e.name === 'onboarding.destination_missing');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('destino fora do catálogo', () => {
  it('avisa, aponta o Feedback e registra uma vez por busca', async () => {
    const { FirstTripFlow } = await import('@/components/onboarding/FirstTripFlow');
    render(<MemoryRouter><FirstTripFlow userId="u" /></MemoryRouter>);
    const box = screen.getByLabelText('Buscar destino');

    fireEvent.change(box, { target: { value: 'Zur' } });
    fireEvent.change(box, { target: { value: 'Zurique' } });

    expect(screen.getByText(/Ainda não cobrimos “Zurique”/)).toBeTruthy();
    expect(screen.getByText(/Os mais pedidos entram primeiro/)).toBeTruthy();
    expect(screen.getByText('Feedback', { selector: 'b' })).toBeTruthy();

    // 1: ainda não saiu nada — os 800 ms não venceram
    expect(missing()).toHaveLength(0);

    await wait(950);
    const evs = missing();
    expect(evs).toHaveLength(1);
    expect(evs[0].props).toEqual({ query: 'Zurique' });
    expect(evs[0].userId).toBe('u');

    // 2: destino com hit não registra
    fireEvent.change(box, { target: { value: 'lisb' } });
    await wait(950);
    expect(missing()).toHaveLength(1);

    // 3: busca curta demais não registra
    fireEvent.change(box, { target: { value: 'ro' } });
    await wait(950);
    expect(missing()).toHaveLength(1);
  });
});
