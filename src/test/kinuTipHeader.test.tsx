// Arco 5.d — o call site, provado de ponta a ponta no front.
//
// DashboardKinuTip é o mais barato de montar dos três chamadores de kinu-ai
// (KinuAIContext exigiria meia árvore de providers), e a linha provada aqui é
// literalmente a mesma dos outros dois: `headers: await kinuAuthHeaders()`.
//
// O que se prova: logado => o invoke recebe o header; deslogado => o invoke sai
// SEM header nenhum e a dica continua sendo pedida.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const invoke = vi.fn();
const getSession = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: { auth: { getSession: () => getSession() } },
}));

import { DashboardKinuTip } from '@/components/dashboard/DashboardKinuTip';

describe('DashboardKinuTip — header de identidade (5.d)', () => {
  beforeEach(() => {
    invoke.mockReset();
    getSession.mockReset();
    invoke.mockResolvedValue({ data: { response: 'dica' }, error: null });
  });

  it('logado => invoke de kinu-ai leva x-kinu-authorization', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-abc' } }, error: null });

    render(<DashboardKinuTip />);

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    const [fn, opts] = invoke.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(fn).toBe('kinu-ai');
    expect(opts.headers).toEqual({ 'x-kinu-authorization': 'Bearer tok-abc' });
  });

  it('deslogado => invoke sai sem header, e a dica continua sendo pedida', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(<DashboardKinuTip />);

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    const [, opts] = invoke.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(opts.headers).toEqual({});
  });
});
