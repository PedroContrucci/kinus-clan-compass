# RELATORIO-M22A — criar_viagem carrega adultos, idades das crianças e origem

## O que mudou (commit f6d68ed)
- `supabase/functions/kinu-ai/index.ts`: schema de criar_viagem ganha `adultos` (integer), `criancas_idades` (integer[] 0–17) e `origem` (string), opcionais; descrições: só o que o usuário escreveu, nunca deduzir; GRU → "São Paulo". `viajantes` segue sendo o total. Regra nova "10b" no prompt (as demais intactas): passar os campos; criar_viagem NÃO carrega roteiro/lugares/horários/restaurantes; se colou roteiro, dizer isso antes e não afirmar que manteve nada.
- `src/lib/destinationPicker.ts`: `planFromAgent` usa os mesmos campos do wizard (`buildFlowInput`: `adults`, `children`, `childrenAges`; `finishFlowTrip`: `childrenCount`, `originSource`). Sem `adultos`: adultos = viajantes − crianças. Origem informada → `source: 'user'` (sem "(assumido)"; o rótulo só aparece com source 'default'). Idades fora de 0–17 ou não inteiras são descartadas. Novo `describeTravelers` (texto do cartão). Plan devolve também `children`.
- `src/contexts/KinuAIContext.tsx`: `children: plan.children` no lugar do 0 fixo (1 linha).
- `src/components/ai/KinuAIMessage.tsx`: cartão = destino · datas · "2 adultos + 2 crianças (8 e 12 anos)" (ou "N viajante(s)") · "saindo de <origem>" quando informada.
- `src/types/kinuAI.ts` não precisou mudar (`params` já é `Record<string, any>`).
- Teste novo `src/test/m22a-criar-viagem.test.ts` (4 casos, sem rede/motor). Nenhum teste existente mudou; c10-destino segue verde.
- Intocados: src/data/*, hotelZones, michelinData, types/trip.ts, itineraryEngine, itineraryValidator, google-places.

## Gates
- tsc -p tsconfig.app.json --noEmit: limpo
- vitest run: 87 arquivos, 908 passed | 3 skipped | 1 todo, 0 failed
- npm run build: ok
- deno check supabase/functions/kinu-ai/index.ts: ok
- eslint nos arquivos tocados: 19 problemas, idênticos ao baseline (nenhum novo)

## Redeploy (Lovable) — edge function tocada
Prompt: "Faça redeploy da edge function kinu-ai. Arquivos: supabase/functions/kinu-ai/index.ts (nenhum outro: account.ts, catalog.ts e _shared/* não mudaram)." Sem o redeploy, a produção continua com o schema antigo; o front novo é compatível com ambos. Publish do front é do fundador.

## Não coberto
- Nenhum teste de ponta a ponta com o modelo real (sem rede); a regra 10b só se prova na sonda em produção após redeploy.
- STEP1-M22.md mantido sem commit, para a M22b.

## Push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   b97ebcc..f6d68ed  main -> main
```
