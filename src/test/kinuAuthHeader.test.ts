// Arco 5.d — o header de identidade do kinu-beta (modo sombra).
//
// O CONTRATO: telemetria nunca derruba chamada de produto. Sessão ausente, erro do
// GoTrue ou exceção têm que sair como `{}` — nunca lançar, nunca devolver
// `Bearer undefined`. Um `{}` é inócuo no invoke (functions-js entra no mesmo ramo
// de quando `headers` é undefined).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSession = vi.fn();

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: { auth: { getSession: () => getSession() } },
}));

import { kinuAuthHeaders } from '@/lib/kinuAuthHeader';

describe('kinuAuthHeaders', () => {
  // As chaves NÃO são decoração: `() => getSession.mockReset()` devolveria o
  // próprio mock, e o vitest trata função devolvida por hook como teardown —
  // ele chamaria getSession() depois de cada teste, fazendo o caso de falha
  // abaixo estourar fora do try/catch do helper.
  beforeEach(() => { getSession.mockReset(); });

  it('com sessão => manda x-kinu-authorization: Bearer <token>', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-abc' } }, error: null });
    expect(await kinuAuthHeaders()).toEqual({ 'x-kinu-authorization': 'Bearer tok-abc' });
  });

  it('sem sessão (deslogado) => {} e nenhum header', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await kinuAuthHeaders()).toEqual({});
  });

  it('getSession devolvendo error => {} (não manda token de sessão suspeita)', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } }, error: new Error('boom') });
    expect(await kinuAuthHeaders()).toEqual({});
  });

  it('getSession lançando (GoTrue fora do ar) => {} e NÃO propaga', async () => {
    getSession.mockRejectedValue(new Error('rede caiu'));
    await expect(kinuAuthHeaders()).resolves.toEqual({});
  });

  it('sessão sem access_token => {} (nunca "Bearer undefined")', async () => {
    getSession.mockResolvedValue({ data: { session: {} }, error: null });
    expect(await kinuAuthHeaders()).toEqual({});
  });
});
