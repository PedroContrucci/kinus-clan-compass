# RELATORIO-M27 — google-places devolve o motivo do erro do Google

## O que mudou (commit bdfd547, `fix(places):`)
- Novo `supabase/functions/_shared/placesUpstream.ts` (sem imports): `readUpstream(response)` lê o corpo como texto,
  tolera não-JSON, detecta `!response.ok` ou `error` no corpo e extrai `status` + primeiro `details[].reason`.
  `maskKeys` troca `AIza[A-Za-z0-9_-]*` por `AIza***`.
- `google-places/index.ts`: search, search_many e details, ao recusa do Google, respondem HTTP 200 + mesmos cabeçalhos:
  `{ found:false, unavailable:true, upstream:{httpStatus,status,reason} }` (search_many mantém `results: []`).
- Mensagem completa só em `console.error`, mascarada e cortada em 500 chars. Nunca vai ao cliente.
- details não responde mais `found:true` quando o Google erra.
- Sucesso: corpo idêntico (testes comparam campo a campo). Sem resultado em search continua `{found:false}`.
- Front: `usePlaceDetails`, `PlaceInfoCard`, `ActivityDetailDrawer` só leem `found` → ignoram campos novos. Front intacto.
- kinu-ai (`consultar_lugares`) lê só `results`; não tocado.

## Testes (`src/test/googlePlacesUpstream.test.ts`, fetch simulado, sem rede)
403 PERMISSION_DENIED+API_KEY_SERVICE_BLOCKED (sem mensagem/chave na resposta) · 429 · 400 · corpo não-JSON ·
200 com `error` · corte em 500 · handler real nas 3 ações (recusa e sucesso). googlePlacesPhoto segue verde.

## Gates
deno check OK · tsc limpo · vitest 97 arquivos, 981 passed, 0 failed (rodada após o último ajuste) · build OK.
eslint: index.ts 3 `any` (baseline 3, nenhum novo); placesUpstream.ts e teste limpos.

## git log --oneline -6 -- supabase/functions/google-places/ supabase/functions/_shared/
bdfd547 fix(places): google-places devolve o motivo do erro do Google em vez de engolir (M27)
dd6ce8c fix(security): google-places resolve foto no servidor e devolve URL sem chave (M26)
537bb36 Changes
d2400fb Changes
1f16b40 feat(f3): contador persistente + telemetria da sombra (arco 5.e)
95a8d33 feat(f3): arco 5.d - identidade kinu-beta nas functions caras (verifyKinuBetaJwt, modo sombra)

## Prompt de redeploy para o Lovable
"Faça redeploy da edge function google-places. Arquivos que sobem:
supabase/functions/google-places/index.ts,
supabase/functions/_shared/placesUpstream.ts (novo),
supabase/functions/_shared/placesPhoto.ts,
supabase/functions/_shared/http.ts.
Nenhuma outra function muda."
Depois: um pedido real → o corpo traz `upstream.status`/`reason` com o motivo do Google.

## Push do código
To https://github.com/PedroContrucci/kinus-clan-compass
   afb8377..bdfd547  main -> main
