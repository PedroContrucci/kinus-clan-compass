# RELATÓRIO — R-04: neutralização da edge function `feedback-digest`

**Data:** 2026-08-07
**Commit:** `d7cbd0dd6f821001b66f55f840083c76d017381b` (`d7cbd0d`)
**Branch:** `main` — enviado para `origin/main` (`d9cfd42..d7cbd0d`)

## Problema

`feedback-digest` lia a tabela `beta_feedback` usando `SUPABASE_SERVICE_ROLE_KEY` e
devolvia o resumo a qualquer chamador anônimo, contornando a RLS. Na prática, o
feedback dos testers beta ficava exposto publicamente.

A função não tinha mais uso legítimo: o único chamador era um botão na página Conta
(a ser removido separadamente) e o dono já recebe o feedback por outro caminho
(`feedback-notify` → WhatsApp).

## Correção aplicada

Arquivo único alterado: `supabase/functions/feedback-digest/index.ts` (+8 linhas, 0 removidas).

Inserido um `return` 403 no handler `Deno.serve`, **depois** do bloco `OPTIONS` e
**antes** de qualquer leitura de secret:

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // R-04: função desativada. Expunha beta_feedback (service_role) a qualquer chamador
  // anônimo, contornando a RLS. Sem uso legítimo restante — o dono recebe feedback via
  // feedback-notify (WhatsApp). Código abaixo mantido inerte para reversão.
  return new Response(
    JSON.stringify({ error: 'Esta função foi desativada.' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );

  try {
    // ... resto do código, agora inalcançável
```

### Efeito

- Preflight CORS (`OPTIONS`) continua respondendo `ok` — nada quebra do lado do browser.
- Qualquer outro método recebe `403` com os `corsHeaders` existentes.
- Nenhum `Deno.env.get` é executado, nenhum `createClient` é criado, `beta_feedback`
  nunca é acessada.

## Reversibilidade

O corpo original da função (linhas do `try` até o `catch` final) permanece intacto,
apenas inalcançável. Reverter = remover o bloco `return` 403. A função não foi deletada
do projeto Supabase.

## Fora de escopo (não tocado)

- `feedback-notify` — fluxo de WhatsApp dos testers, intocado.
- Demais edge functions — intocadas.
- `src/` — o botão da página Conta que chamava esta função será tratado separadamente.
  **Pendência:** enquanto o botão existir, ele passará a exibir o erro 403.

## Verificação

- `git diff --cached` confirmou que apenas `supabase/functions/feedback-digest/index.ts`
  entrou no commit (1 arquivo, 8 inserções).
- Alterações pré-existentes não relacionadas (`.gitignore`, `package.json`, relatórios
  `.md` não rastreados, `scripts/writeback-catalog.ts`) ficaram fora do commit.
- Não foi executado deploy da edge function — o 403 só passa a valer no ambiente
  Supabase após o próximo deploy da função.
