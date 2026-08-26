// kinuAuthHeader.ts — o access token do kinu-beta anexado às chamadas das edge
// functions CARAS do Lovable (Arco 5.d, modo sombra).
//
// POR QUE UM HEADER PRÓPRIO, e não `Authorization`: o gateway do Supabase do
// projeto Lovable interpreta `Authorization`/`apikey` — são dele. Um nome próprio
// (`x-kinu-authorization`) não colide, não é encaminhado por engano e já está no
// Allow-Headers das 10 functions desde o 5.c (_shared/http.ts:21).
//
// POR QUE getSession() E NÃO O src/lib/session.ts DO 4c: aquele módulo cacheia o
// `userId`, não o token — e o token expira (1 h por padrão). `getSession()` lê do
// cache em memória do GoTrue e RENOVA sozinho se estiver vencido. É isso que
// impede a sombra de encher de `reason=expired` por culpa nossa.
//
// NUNCA LANÇA, NUNCA BLOQUEIA: sem sessão, com erro ou com o GoTrue fora do ar, o
// retorno é `{}` e a requisição sai como sempre saiu — telemetria não pode
// derrubar chamada de produto. Um `{}` é inócuo no invoke: a condição de
// functions-js (FunctionsClient.js:69) entra no MESMO ramo de quando `headers` é
// undefined, então o Content-Type: application/json continua sendo posto.

import { kinuBeta } from '@/integrations/kinu-beta/client';

export async function kinuAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data, error } = await kinuBeta.auth.getSession();
    if (error) return {};
    const token = data?.session?.access_token;
    return token ? { 'x-kinu-authorization': `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
