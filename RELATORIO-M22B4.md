# RELATORIO-M22B4 — marcas da viagem importada
Commit `fix(import):` 82b10b7. Proibidos/intocáveis e edge functions intactos. STEP1-M22*.md não comitados.

## Causa (hipótese CONFIRMADA)
`src/lib/tripStore.ts:121-165` (`normalizeTripDays`, chamado por `normalizeTrip` em `addTrip`:327 e `listTrips`:288) reconstrói cada atividade com lista fechada de campos (timeSlot, kind, location, edited). `importedFrom`, `importedName`, `semValor`, `foraDaJanela` eram descartados; o `importedFrom` da VIAGEM sobrevive porque `normalizeTrip` espalha `...trip`. A buildImportedDraft, finishFlowTrip e addTrip→localStorage estavam corretos; a perda é na leitura.
- (1) "0 itens / 0 reconhecidos": `kinuDidLines` conta pelas marcas da atividade → 0.
- (2) sem selo / "sem valor" / "· N sem valor": RoteiroDia lê `importedFrom` e `semValor` da atividade lida da store.
- (3) sem aviso de janela: idem, `foraDaJanela`.
- (4) "Fechado (terça)" aparecia: vem do id + data, não de marca.

## Correção
`tripStore.ts`: 4 linhas condicionais repassando os 4 campos (só quando presentes: viagem não importada fica byte a byte igual).
Linha de resumo (`onboardingFlow.ts`): "<N> itens do seu roteiro em <N> dias · <N> reconhecidos no catálogo" (dias = dias com item do usuário). Só `importedFrom==='user'`.

## Teste (`m22b4-marcas.test.tsx`, 4)
Caminho real com a cena de 14 itens: buildAgentImport → addTrip (localStorage) → listTrips → RoteiroDia por dia. Afirma 14/11/3, selo e "sem valor" ×3, "· N sem valor" no cabeçalho, 1 aviso de janela (Montmartre, dia da volta), linha nova "14 itens do seu roteiro em 5 dias · 11 reconhecidos". Sem o patch do tripStore: 3 dos 4 falham.
Teste existente alterado: `m22b3-agente` (assert da linha "O que o KINU fez", pedido pelo item 3); nenhum outro mudou.

## SÓ RELATO — voo não aplicado na importada
`DraftCockpit.tsx:274-279`: `edits = countManualEdits(engineItemIds, itemIdsOf(trip.days))` e `edits > 0` → grava `kinuFlightSearch.pending` e mostra "KINU encontrou… aplicar" em vez de aplicar (R-V11, "roteiro editado à mão"). `countManualEdits` (`draftItinerary.ts:183`, proibido) compara com `engineItemIds` = saída COMPLETA do motor (M22b-1 A1); a importada removeu os itens do motor e pôs os do usuário → removidos/adicionados enormes → "editado". Em criar_viagem os ids coincidem → 0 → aplica sozinho.
Menor conserto (DraftCockpit, não proibido): em :274 `const edits = (trip as {importedFrom?:unknown}).importedFrom === 'user' ? 0 : countManualEdits(...)`. Seguro: `regenerateWith` já usa `replanFor` (restaura importados). Mas troca aplicar-sozinho altera horários de voo sob um roteiro do usuário: decisão do Pedro (alternativa: manter o "aplicar" manual, que é conservador).

## Gates
tsc limpo · vitest 92 arquivos, 938 passed, 0 failed (rodada após o último ajuste) · build ok.

## Push do fix
```
To https://github.com/PedroContrucci/kinus-clan-compass
   8c15095..82b10b7  main -> main
```
