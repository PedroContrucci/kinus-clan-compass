# RELATÓRIO C.10.1 — porta de planejar / destino novo × gate "qual viagem"

**Causa:** o gate é alimentado pelo front (`activeTripId` só sai se `chosenTripId` existir). `openPlanning` não fixava escolha → com 2+ viagens, a function perguntava "qual?".

**Entregue (só `src/contexts/KinuAIContext.tsx` + testes; function intocada, sem redeploy):**
1. `openPlanning` → `setChosenTripId(NO_TRIP)` antes de abrir. Planejar = sempre "geral".
2. `tripChoiceFromMessage`, precedência: viagem da conta (1 hit → id) › cidade de `getAllCities()` (palavra inteira, sem acento) que não é destino de viagem da conta → `NO_TRIP` › sem cidade → `null` (gate pergunta). 2+ hits de viagem → `null`, como antes.
3. 🗑 (`clearMessages`) já zerava a escolha — sem mudança.

**Testes:** `kinuAccount.test.ts` — "quero ir pra Milão"/"milao" (Fortaleza+Lisboa) → NO_TRIP; "qual o clima?" → null; "clima em Fortaleza" → trip-for; "clima romântico" → null (não casa "Roma"). `c10-destino.test.tsx` — 2 viagens + porta → `chosenTripId 'none'` e o `account.activeTripId` enviado = `'none'`.

**Verificação:** vitest 63 arquivos / 740 ok (3 skip, 1 todo) · tsc zero · build ok · eslint 19 antes = 19 depois (nada novo).

**Push (feat 4f24fb4):**
```
To https://github.com/PedroContrucci/kinus-clan-compass
   e1257c4..4f24fb4  main -> main
```
