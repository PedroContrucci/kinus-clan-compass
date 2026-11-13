# RELATORIO-M22B2 — tela da viagem importada
Commit `feat(import):` 5c3f934. Arquivos: `RoteiroDia.tsx`, `DraftCockpit.tsx`, `Viagens.tsx`, `tripPdfExport.ts`, `importItinerary.ts` (só adições/refator interno), `src/test/m22b2-tela.test.tsx`. Intocáveis e proibidos intactos. Nenhuma edge function: sem prompt de redeploy. STEP1-M22*.md não comitados.

## Pontos de chamada de replanTrip (2 ≤ 3; nenhuma parada)
- `DraftCockpit.tsx:220` → `replanFor(trip)` (importada = `replanImportedTrip`; demais = `replanTrip`, idêntico).
- `replanItinerary.ts:241` (dentro de `retimeConfirmedLegs`, arquivo proibido; chamado em `Viagens.tsx:652`): não editei. `Viagens` agora chama `retimeLegsFor` (importItinerary), que roda `retimeConfirmedLegs` e, se `importedFrom==='user'` e houve replanejamento, aplica a mesma restauração de `replanImportedTrip` (helper `restoreImported`, extraído sem mudar comportamento). Não importada: resultado idêntico.
- `importItinerary.ts:331`: o próprio `replanImportedTrip`.

## Mudanças
1. Troca de voo: acima.
2. Regerar (`DraftCockpit`): `needsRegenerateConfirm(trip)` → AlertDialog existente com o texto pedido; botões "Manter meu roteiro" / "Regerar mesmo assim". Não importada: igual.
3. Sem valor: `RoteiroDia` mostra "· sem valor" (linha) e " · N sem valor" no cabeçalho do dia; PDF imprime "sem valor"; `Viagens` (modal de confirmar) mostra "Sem valor estimado · item do seu roteiro" em vez de "Atividade gratuita".
4. Selo "Do seu roteiro" (`importedFrom==='user'`).
5. Avisos sempre visíveis sob a linha, estilo âmbar do `dayAlert`, sem componente novo: "Fechado neste dia da semana (terça)" (`closedWeekdayOf`, qualquer viagem) e "Não cabe antes do voo de volta" (`foraDaJanela`). Nada é movido/removido.

## Testes (`m22b2-tela.test.tsx`, 5)
Cena 2026-12-08: Café Constant semValor + Louvre + item foraDaJanela → selo ×3, "sem valor", "(terça)", aviso de janela, "2 sem valor" e "1 sem valor" no total; viagem não importada com itens de catálogo → sem selo e sem "sem valor" (aviso de fechado continua); quarta → sem aviso; `replanFor`/`needsRegenerateConfirm` puros.

## Checagem de parada
- Smoke: teste descartável rodou `closedWeekdayOf` em todos os dias gerados de `SMOKE_SCENARIOS` → 0 ocorrências (removido).
- Nenhum teste existente mudou de resultado (roteiroDia, PDF inclusos).

## Gates
tsc limpo · vitest 90 arquivos, 929 passed, 0 failed · build ok · eslint: sem problema novo (Viagens 31 e DraftCockpit/PDF 32 iguais ao HEAD; RoteiroDia, importItinerary e teste limpos).

## Push do feat
```
To https://github.com/PedroContrucci/kinus-clan-compass
   9c90cb8..5c3f934  main -> main
```
