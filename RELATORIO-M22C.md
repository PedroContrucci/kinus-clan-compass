# RELATORIO-M22C — agente sem número de memória no orçamento

## Mudança
- `supabase/functions/kinu-ai/index.ts`: regra 13 (linha 119) e regra 16 (linha 125) substituídas pelo texto da missão. Nenhuma outra linha, nem schema de ferramentas, alterada.
- Teste novo: `src/test/kinuAiOrcamentoPrompt.test.ts` (sem rede) — "12-16k", "números aproximados", "números concretos" ausentes; regra 13 contém "PROIBIDO citar preço".

## Condições de parada (nenhuma disparou)
- Outra linha do prompt mandando citar estimativa sem ferramenta: não. Outras ocorrências de "R$"/"faixa de preço" (index.ts:262 descrição da tool de busca; :455 respeitar faixa de preço do usuário) não mandam estimar.
- Teste existente dependendo do texto antigo: não (grep em src/supabase/scripts só achou o index.ts).
- Outro arquivo precisando mudar: não.

## Gates
- deno check kinu-ai/index.ts: ok
- tsc -p tsconfig.app.json --noEmit: limpo
- vitest run: 88 arquivos, 910 passed | 3 skipped | 1 todo, 0 failed
- npm run build: ok

## Redeploy (function tocada — fazer pelo Lovable)
Prompt: "Redeploy da edge function kinu-ai." Arquivos: `supabase/functions/kinu-ai/index.ts` (nenhum `_shared/` nem `catalog.ts` tocado).

## STEP1-M22.md
Mantido, não commitado, não deletado (por instrução).

## Saída do push (commit fix)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   765b40c..3d05933  main -> main
```
