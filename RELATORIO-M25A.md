# RELATORIO-M25A — importada: financeiro e aviso do dia da volta após troca de voo (FECHADO)
Commit `fix(import):` 56841d5. Arquivos: `importItinerary.ts`, `tripStore.ts` (+1 linha), `RoteiroDia.tsx` (texto do aviso),
`src/test/m25a-troca-voo.test.tsx` (novo). Motor, validator, replanItinerary, createTrip, draftItinerary, placeIdentity,
`src/data/*`, hotelZones, michelinData, `types/trip.ts`, functions: sem diff.

## Parada de 13/11
Teste (i) falhava: volta 18:20 e Montmartre com `foraDaJanela`. `replanTrip` devolvia o item em `unplaced`
(âncora 10:00 + 3h colide com o check-out fixo das 12:00, `itineraryEngine.ts:553-555`); `outsideDayWindow` sozinho dizia "cabe".
Pedro decidiu A: o aviso fica, com o motivo certo ('voo' vs 'checkout').

## Parada de 16/11
(vi) (Montmartre 08:30 explícito, volta 18:20) saiu com `foraDaJanela` + 'checkout' porque o motor também devolve esse item
em `unplaced`. Decisão do Pedro: a marca NÃO depende mais de `unplaced`; vale só pelo que a tela mostra.

## Implementação final
1. `janelaMotivoOf(item, atividadesDoDia, {departureTime, international})` — UMA conta, início = hora, fim = início + duração:
   a) `outsideDayWindow(...)` OU fim > início do `-slot-transfer` → `'voo'`;
   b) senão, sobreposição com `-slot-checkout` (inícioA < fimB e inícioB < fimA) → `'checkout'`; c) senão null.
2. Usada na importação (`warnWindow`) e em `restoreImported` (após replan / retime): põe `foraDaJanela`+`janelaMotivo` ou remove os dois.
   `restoreImported` segue devolvendo ao dia/hora original todo importado que veio em `unplaced`; `unplaced` e `engineItemIds` iguais.
3. `RoteiroDia`: 'checkout' → "Conflita com o horário do check-out"; 'voo'/sem motivo → "Não cabe antes do voo de volta".
4. `tripStore.normalizeTripDays`: repassa `janelaMotivo` quando presente.
5. Financeiro (verde desde 13/11): comida/passeios = soma dos itens dos dias finais; voo 29.652; hotel e teto intactos.

## Medições (antes dos asserts)
```
M25A-I   montmartre 10:00+3h  checkout@12:00+0.5h transfer@14:35+0.75h flight-back@18:20  → fora:true motivo:checkout
M25A-II  montmartre 10:00+3h  checkout@06:45+0.5h transfer@07:15+0.75h flight-back@11:00  → fora:true motivo:voo
M25A-VII (logo após importação, voo estimado) 10:00 → fora:true motivo:voo
M25A-VI  (08:30 explícito, volta 18:20) {"time":"08:30"} → sem foraDaJanela, sem janelaMotivo, no dia às 08:30
```
Checkout e transfer estavam no dia após o replan em todas as cenas; nenhuma medição contrariou o esperado.

## Testes (`m25a-troca-voo.test.tsx`: 9, todos passam)
(i) checkout + texto na tela · (ii) voo + texto · (ii-b) voo→checkout · (vii) importação → voo · (vi) sem aviso, 08:30 ·
(iii) financeiro · (iv) itens nos mesmos dias/horas · soma de custos · (v) não importada = `replanTrip`, JSON idêntico.
m22b1, m22b4, m22b5 e demais: sem mudança de resultado.

## Gates (depois do último ajuste)
- `tsc -p tsconfig.app.json --noEmit`: limpo · `vitest run`: 94 arquivos, 953 passed | 3 skipped | 1 todo, 0 failed · `npm run build`: ok
- eslint nos arquivos tocados: sem problema novo (diff antes/depois vazio; erros `any` pré-existentes).
- STEP1-*.md não commitados nem deletados. Sem edge function tocada → sem prompt de redeploy.

## Saída do git push (do fix)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   b1c261b..56841d5  main -> main
```
