MISSÃO: FeedbackButton passa a gravar no kinu-beta (public.feedback), não mais no Lovable (beta_feedback).

ACHADOS QUE MUDAM O PLANO
1. Não há import direto do kinuBeta hoje: o handler usa `kinuAuthHeaders()` (que lê a sessão do kinu-beta). O insert novo importa `kinuBeta` de `@/integrations/kinu-beta/client` — mesmo cliente de profiles/trips/eventos.
2. user_id: vem de `kinuBeta.auth.getSession()` (já chamada hoje dentro de kinuAuthHeaders). Para não fazer duas chamadas, o handler faz UM `getSession()` no início: dele saem o user_id e o token para o header do feedback-notify. Sem sessão → user_id null (coluna nullable) e header vazio, como hoje.
3. A tabela public.feedback no kinu-beta precisa existir com colunas: user_id uuid, tester_name text, message text (required), rating int, wanted_destination text, context jsonb, created_at. Se ainda não existe, a migration é do kinu-beta (supabase-beta/migrations/) — decisão aberta A.
4. O fallback "coluna wanted_destination inexistente" morre: ou a coluna existe no kinu-beta ou o insert falha inteiro → notify segue + console.warn (regra da missão). Sem retry com mensagem embutida.
5. context jsonb recebe: page, category, rating, screenSize, appVersion, userAgent, tripId (activeTrip?.id), e os campos compostos ([Sente falta]/[Deveria melhorar]) ficam como hoje embutidos em `message`? NÃO — proposta: message = só o texto do usuário; missingFeature e improvement entram no context como chaves próprias. Decisão aberta B.
6. O registro local (localStorage 'kinu_feedback') e o evento cla.feedback_sent continuam idênticos.

DIFF PROPOSTO (2 arquivos)
- src/components/shared/FeedbackButton.tsx:
  - import kinuBeta; remover uso de `supabase` para o insert.
  - handleSubmit: um getSession() → userId + header do notify.
  - insert: kinuBeta.from('feedback').insert({ user_id, tester_name, message, rating, wanted_destination: trimmedDestination || null, context: { page, category, screenSize, appVersion, userAgent, tripId, missingFeature, improvement } }).
  - catch/erro: console.warn('feedback insert failed', error); notify e toast offline seguem como hoje.
  - feedback-notify: mesmo invoke, mesmo body, mesmo header.
- src/test/feedbackButton.test.tsx:
  - mock do kinu-beta ganha from().insert espião; o mock do supabase (Lovable) passa a afirmar que NÃO é chamado.
  - novo teste: insert vai ao cliente kinu-beta, tabela 'feedback', com user_id/tester_name/message/rating/wanted_destination/context.
  - teste existente "sai mesmo quando o insert falha" passa a mockar o kinu-beta falhando.

NÃO TOCA: feedback-notify, qualquer outra function, src/data/*, hotelZones, michelinData, types/trip.ts.

VALIDAÇÃO: vitest suíte inteira, tsc -p tsconfig.app.json, eslint nos 2 arquivos. Deletar este STEP1 ao fim.

DECISÕES ABERTAS
A. A tabela public.feedback já existe no kinu-beta? Se não, escrevo supabase-beta/migrations/004_feedback.sql (você aplica no kinu-beta; eu não tenho acesso de escrita lá).
B. message = só o texto do usuário, com missing/improvement no context (minha proposta)? Ou manter a composição atual na message?
C. rating 0 (não preenchido) vai como null em vez de 0? (0 vira "nota zero" falsa.)
