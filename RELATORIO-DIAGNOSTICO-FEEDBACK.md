MISSÃO: correção R-04 — neutralizar a edge function feedback-digest.

CONTEXTO: feedback-digest lê beta_feedback com service_role e devolve o resumo a
qualquer chamador anônimo (vazamento de feedback de testers, contornando a RLS).
A função não tem mais uso legítimo: o único chamador era um botão na página Conta que
será removido, e o dono recebe feedback por outro caminho (feedback-notify → WhatsApp).
Decisão: neutralizar a função para que ela pare de responder a qualquer requisição,
sem deletá-la (reversível).

ESCOPO ESTRITO — mude UM arquivo: supabase/functions/feedback-digest/index.ts

Logo no início do handler Deno.serve, DEPOIS do tratamento de OPTIONS (para não
quebrar preflight CORS) e ANTES de qualquer leitura de secret ou createClient,
adicione um retorno 403 que encerra a função para todas as requisições que não sejam
OPTIONS. Use os corsHeaders já existentes no arquivo. Algo equivalente a:

    return new Response(
      JSON.stringify({ error: 'Esta função foi desativada.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

Requisitos:
- O bloco if (req.method === 'OPTIONS') { ... } permanece intacto e ANTES do 403.
- O 403 vem imediatamente depois, encerrando tudo. Nenhum secret é lido, nenhum
  createClient é chamado, beta_feedback nunca é acessada.
- NÃO delete o resto do código da função — deixe abaixo do return, morto mas presente
  (reversível). Não precisa remover imports.

DO NOT TOUCH:
- feedback-notify (é o fluxo de WhatsApp dos testers — não encoste)
- qualquer outra edge function
- qualquer arquivo em src/ (o botão da página Conta será tratado separadamente)

PASSO 1 — REPORT antes de aplicar: cole as primeiras ~15 linhas atuais do handler
(do Deno.serve até logo depois do bloco OPTIONS), pra eu confirmar onde o 403 entra
e qual o nome exato da variável de corsHeaders. NÃO aplique ainda.

Depois que eu confirmar, aplique, faça git add APENAS de feedback-digest/index.ts,
commit na main com a mensagem "fix(R-04): neutraliza feedback-digest (fecha vazamento
de feedback de testers)", git push, e me diga o hash. NÃO faça mais nada.