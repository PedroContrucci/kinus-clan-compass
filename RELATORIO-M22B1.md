# RELATORIO-M22B1 — biblioteca de importação de roteiro (pura)
Commit `feat(import):` b4f487f — `src/lib/importItinerary.ts`, `src/test/m22b1-import.test.ts`, `src/lib/roteiroBlocks.ts` (só A5). Nada mais tocado; STEP1-M22*.md intactos, não commitados.

## Entrega
- `buildImportedDraft` / `applyImportedDays`: rascunho pelo caminho normal + dias do usuário; do motor fica só logística.
- Casamento com catálogo (`matchKey`, conectivo unificado), livres com `cost 0`/`semValor`, `emDiaFechado`, finanças = voo+hotel do base + importados + transfer do motor.
- `replanImportedTrip` (A2), `outsideDayWindow` + `foraDaJanela` no resumo (A3), guarda em `roteiroKind` (A5).

## Parada de 12/11 — o que mudou
- Desvio 3 (U+2060) REJEITADO e removido: o nome do usuário fica idêntico, sem caractere invisível. A5: `roteiroKind` devolve restaurante/passeio (pela category) para `importedFrom === 'user'`, antes de qualquer regra de nome (inclui "café da manhã"/"room service").
- A1: `engineItemIds` = saída completa do motor do rascunho base (teste 4 ajustado).
- A2: `replanImportedTrip(trip, flights)` = `replanTrip` + (a) remove o que não é logística nem importado + (b) devolve ao dia/hora originais todo importado que o `replanTrip` pôs em `unplaced` ou perdeu (o `isLogistic` dele lê o NOME: "Transfer para Versalhes" seria descartado), com `foraDaJanela: true`. `unplaced` devolvido sem item importado. `replanItinerary.ts` não alterado.
- A3: `outsideDayWindow(hora, duração, partidaVolta, doméstico)` com `lastDayWindowHours`. Resumo ganhou `foraDaJanela: [{nome,data,motivo}]`; só avisa. **Só o dia da volta**: a janela do dia de chegada não é exportada (`windowOf` é privada em replanItinerary; `arrivalWindow` é inline no motor).
- A4: teste 6 na mesma cena: (i) Montmartre em `foraDaJanela`; (ii) após `replanImportedTrip`, os 15 importados nos mesmos dias/horas, Montmartre com `foraDaJanela`, `unplaced` sem importados; (iii) só logística + importado. Teste 6b (viagem à mão): item de catálogo inserido é removido. Teste de `outsideDayWindow`.
- Aprovados e mantidos: desvios 1, 2, 4, 5 e a conta de finanças.

## Gates
- `tsc -p tsconfig.app.json --noEmit`: limpo · `vitest run`: 89 arquivos, 924 passed, 0 failed, 3 skipped · `npm run build`: ok · eslint: limpo nos 3 arquivos.
- Nenhum teste existente mudou de resultado (roteiroBlocks e RoteiroDia inclusos).

## Fica para a M22b-2
Item do usuário sobreposto ao check-out/voo no último dia e item antes do check-in no dia de chegada (sem janela exportada). Nenhuma edge function tocada: sem prompt de redeploy.

## Push do feat
```
To https://github.com/PedroContrucci/kinus-clan-compass
   6f7b7c5..b4f487f  main -> main
```
