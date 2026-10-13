# RELATÓRIO C.3a — trocar com duração do catálogo · logística real ou nada · check-in pós-meia-noite

Commit `d85befd` (feat). Arquivos: `itineraryEngine.ts`, `GeneratedItineraryStage.tsx`, `cockpitLines.ts` (só `export`),
`tripPdfExport.ts` (só o bloco `hasDistanceHint`/texto), `itineraryEngine.test.ts`, `cockpitCard.test.tsx`.

## Achados (do STEP1)
1. O único handler do ↻ era `handleSwapActivity` no Stage. Ele pegava `candidates[0]` (não sorteava) e **herdava hora e
   duração** do item trocado, daí o Atlantiz 5h com "2h".
2. "~20 min de táxi/transporte" existia **só no PDF**, alternando por índice. O motor e a tela não tinham linha de logística.
3. `dayWindowUsage` mede horas × janela do dia, não o encaixe no horário. Por isso o filtro do vão do slot (D2) foi somado.

## Decisões
- **D1 "troca nunca piora":** a candidata entra se o R16 do dia com a troca fica `≤ janela` **ou** se ela tem
  `horas ≤ item atual`. Item manual sem duração conta 1h30 nessa comparação (o validador não foi tocado).
- **D2 vão do slot:** `início + duração ≤ próximo item com hora`. Conta também item na mesma hora que vem depois na lista.
  No último dia vale ainda `≤ partida − 2h (doméstico)/3h (intl)`. No dia da chegada, slot antes do pouso → lista vazia.
- **D3:** `logisticsLine(prev, curr)` + `itemCoord(item, destino)` servem a tela e o PDF. Hotel só tem coordenada por
  casamento real (`resolveHotelCoord`); a mediana do catálogo nunca vira "~N min". O PDF imprime por `cleanText`, que
  preserva o acento: "táxi" e "pé" saem acentuados, sem normalização extra.
- **D4:** `"00:35 (+1)"` fica no campo `time`. O teste mostra que o Stage, o `normalizeTrip` (→ `normalizeTripDays`) e o
  `exportTripPDF` renderizam esse item sem throw e sem "NaN". A alternativa não foi usada.

## O que mudou
- `swapCandidates(trip, dayIndex, itemId)` filtra por mesma categoria e por `usedActivityIds` + nome normalizado,
  aplica D1+D2 e ordena interesse top-2 → distância aos vizinhos → preço, máx. 6. O `why` é
  `"interesse: gastronomia · cabe"` ou `"mesmo horário · cabe · perto de X"` (≤ 1,2 km).
- ↻ = painel colapsável abaixo do cabeçalho do item. A troca usa `convertToItineraryActivity` (duração, custo e dicas da
  candidata; hora do slot; id `day-N-<id>`) e grava via `commitDays`. O item seguinte não é tocado. Lista vazia mostra
  "Nenhuma alternativa do catálogo cabe neste horário". "Regerar" e `unplacedEdits` estão intactos.
- Ajuste extra: **o ↻ some em itens de voo/hotel.** O handler antigo saía calado neles; agora abriria um painel sempre vazio.
- Logística: linha "~N min a pé/de táxi desde o anterior" só com coordenada nas duas pontas. É derivada, nunca gravada.
- Check-in: `nextDayClock(pouso + 60)` substitui o teto 23:59. O item continua no dia e mantém a dica noturna.

## Desvio de teste (honesto)
- O caso (1) pedia "uma de ≤ 1h aparece", mas o catálogo de Fortaleza **não tem manhã ≤ 1h** (mínimo 2h).
  Testado assim: check-out 11:00 → lista vazia, sem Atlantiz; check-out 12:00 → só candidatas ≤ 2h, cada uma com a
  própria duração, sem Atlantiz.

## Pendente (fora do escopo autorizado do PDF)
- No PDF, a coluna de hora tem ~12 mm (x=26 → nome em x=38). "00:35 (+1)" deve invadir o nome do check-in.
  Correção sugerida, 1 linha: imprimir só "00:35" na coluna e "(+1)" junto ao nome. Fica para o fundador decidir.

## Validação
- `SMOKE_FULL=1 npx vitest run` (1 rodada completa): **49 arquivos, 608 passed**, 1 skipped, 1 todo. Depois disso só
  mudaram as anotações de tipo de um teste, re-rodado isolado (verde).
- Smoke = C.2.2: `R13 55/61 · 6 WARN | R14 12/12 | R15 57/63 · 6 WARN | R16 63/63 PASS`.
- `tsc -p tsconfig.app.json` zero · `npm run build` ok · eslint nos tocados: 36 = baseline, nenhum problema novo.
- Testes novos: 7 no motor (vão de 1h/2h, categoria + usados + interesse, vazio, logística 800 m/6 km/null,
  "00:35 (+1)" no motor, nenhum texto fixo no motor/PDF) e 2 no cockpit (↻ → painel → troca nome+duração; D4).

Nenhuma edge function tocada: sem redeploy. Publish é do fundador.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   81ed14f..d85befd  main -> main
```
