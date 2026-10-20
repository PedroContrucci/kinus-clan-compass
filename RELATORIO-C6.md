# RELATORIO-C6 — o agente sempre sabe o que a pessoa tem na conta

**Causa:** só o chat aberto dentro de uma viagem mandava `context`; Home/Viagens mandavam `null`. O cliente é `src/contexts/KinuAIContext.tsx` (não há chamador em hooks/lib).

**Front** (`KinuAIContext.tsx`): toda chamada manda `account` = `{profile:{name, origin?}, trips[≤8]:{id, destination, dates, status active|draft, travelers, budget, summary}, activeTripId?}`.
- `summary` = `kinuDidLines(trip).flight` · `Hotel <accommodation.name>` · `N dias` · `Planejado R$ X` (`razaoTotals(razaoLines)`): nada calculado novo.
- `activeTripId` vem só da viagem aberta ou da escolha na sessão (chip, destino digitado, 'geral'/'nenhuma' → `'none'`). Nunca é deduzido de "só tem uma". Zera em `clearMessages`.
- `profile.origin` só quando `originSource !== 'default'`. O nome segue a cascata do useAuth.
- A viagem escolhida entra no `detectCuratedCity` (catálogo e dicas da cidade certa). O `context` completo da viagem aberta não mudou.

**Chips** (`KinuQuickActions.tsx`): com 0 viagens, os 3 chips de antes. Com viagens, um chip por viagem ("Fortaleza 10–15/nov", "Lisboa (rascunho)", até 3) + "Pergunta geral". O chip registra a escolha e confirma no próprio app, sem chamar o modelo.

**Function** (`kinu-ai/account.ts` novo, irmão do catalog.ts, sem imports; `index.ts`):
- `sanitizeAccount`: strings cortadas e sem `<>`/controle, datas ISO, travelers 1–50, budget ≤10M, máx 8. `activeTripId` só se for da lista ou `'none'`.
- `accountGate`: com 2+ viagens, sem escolha, sem viagem aberta e sem emergência, responde **sem chamar o modelo** com a lista + "Sobre qual delas é a pergunta? (ou diga 'geral' para uma pergunta sem viagem)". Nos outros casos, monta `<account_context>` com uma linha EM FOCO (escolhida | aberta | única → nomear na 1ª frase | nenhuma → genérico + criar | geral).
- `ACCOUNT_RULES` foi concatenado ao prompt de sistema: as regras de escolha + **PROIBIDO** "feche e reabra", "acesse o roteiro direto" e qualquer troubleshooting. Sem dado: "Não tenho os detalhes dessa viagem carregados aqui." e para.
- A regra CIDADE DE PARTIDA agora aceita só a "Origem padrão do perfil"; uma origem "(assumido)" nunca é dita como a do usuário.
- Integridade intacta: catálogo, dicas e `buildOfferCheckReply` não foram tocados.

**Testes** (`src/test/kinuAccount.test.ts`, 9): (a) 2 viagens → sem activeTripId; (b) 1 viagem → activeTripId ausente, trips[0] com summary; (c) `accountGate` com 2 trips → lista as duas e pergunta; 'geral' → genérico sem nova pergunta; emergência passa; 1 e 0 viagens; limites do `sanitizeAccount`; (d) asserção textual da proibição e do fallback + `index.ts` concatena `ACCOUNT_RULES` e tem o `if (gate.reply)`. A prova (c) roda no vitest, sem curl.

**Gate:** vitest **60 arquivos, 699 ok** (suíte 1×) · tsc limpo · build ok. Eslint: nenhum erro novo (os 13 `no-explicit-any` já existiam); **5 warnings novos** `react-refresh/only-export-components` por exportar helpers do arquivo de contexto (mesmo padrão de `computeTripPhase`; mover para lib exigiria arquivo fora da lista).

**Push do feat:**
```
To https://github.com/PedroContrucci/kinus-clan-compass
   f425719..1af10ea  main -> main
```

**Prompt de redeploy (Lovable):**
"Redeploy the edge function kinu-ai from the current repository code (index.ts, account.ts, catalog.ts and the _shared/ files it imports: http.ts, verifyKinuBetaJwt.ts, telemetry.ts). DO NOT modify any code. Do not modify any other function. DO NOT touch any file in src/data/, src/lib/hotelZones.ts, src/lib/michelinData.ts, or src/types/trip.ts."
