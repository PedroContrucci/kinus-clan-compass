# RELATORIO-M21A — rótulo de deslocamento no PDF ("desde o anterior")

## Causa (STEP1)
O cálculo (`logisticsLine`) estava certo. O PDF imprimia sob cada item o trecho item → PRÓXIMO; a tela imprime
anterior → item ("desde o anterior"). Leitura como chegada gerava o "erro" (ex.: "~10 min a pé" sob Santa Justa era
Santa Justa → jantar, não Cacilhas → Santa Justa).

## O que mudou
- `src/lib/tripPdfExport.ts`: rótulo sob cada item = item ANTERIOR do dia → este, texto "… desde o anterior".
  Refeição conta; anterior voo/transfer não conta; hotel vale com coordenada (`stayHotelCoord`, como na tela).
  1º item sem anterior válido = sem rótulo. Motor, validador, tela e escolha de atividades intactos.
- `src/test/m21a.test.ts` (novo): dia 26/12 de Lisboa montado à mão (sem motor/SMOKE_SCENARIOS), jsPDF falso, coords
  de `generated/coords.ts`. Falha com o código antigo, passa com o novo. Nenhum assert existente alterado.
- Decisões: D2 sem R24 (teste de texto do PDF no lugar); D3 backlog abaixo.

## Rótulos do PDF — dia à mão Café → Jerónimos → Ponto Final → Santa Justa → Pap'Açôrda
| Item | Antes (→ próximo) | Depois (desde o anterior) |
|---|---|---|
| Café no hotel | ~25 min de táxi | (sem rótulo) |
| Jerónimos | ~20 min de táxi | (sem rótulo — anterior é o café, sem coord de hotel curado no teste) |
| Ponto Final | ~15 min de táxi | ~20 min de táxi desde o anterior (Jerónimos→Ponto Final, 4,50 km) |
| Santa Justa e Carmo | ~10 min a pé* | ~15 min de táxi desde o anterior (Ponto Final→Santa Justa, 3,39 km) |
| Pap'Açôrda | (sem rótulo) | ~10 min a pé desde o anterior (Santa Justa→jantar) |
*antes, o "a pé" que o fundador viu era o trecho de saída de Santa Justa.

## Backlog (D3)
Travessia de água/barreira (Tejo, baías): sem dado estruturado no catálogo; fora de escopo. Tempo cruzando o rio
(barco/ponte) é subestimado pela reta. Exigiria campo novo no kinu-beta + sync.

## Gates
tsc limpo · vitest 85 arquivos, 899 passed / 0 failed · build ok · eslint: mesma contagem de erros que antes em
`tripPdfExport.ts` (30, pré-existentes `any`), 0 em `m21a.test.ts`.
Redeploy: nenhuma edge function tocada. STEP1-M21A.md apagado.

## Push (código)
To https://github.com/PedroContrucci/kinus-clan-compass
   4629004..af4dd58  main -> main

## /cost
Não disponível dentro da sessão — rode `/cost` no chat.
