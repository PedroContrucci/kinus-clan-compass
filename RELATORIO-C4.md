# RELATORIO-C4 — Scheduler: o dia é uma sequência (220e97e)

**Aceite:** R19 **0 FAIL / 504 dias** nas duas rodadas, **9 WARN** (limite 30). R13 55/61 · R14 12/12 · R15 57/63 · R16 63/63 na volta 14:00 — **idênticos ao C.3a, nenhuma queda**. Na volta 02:30, R16 também fica 63/63.

## Regras do motor (`layoutDay`, `src/lib/itineraryEngine.ts`)
| # | Regra |
|---|---|
| R1 | Entrada = itens na ordem do dia. A hora é calculada, nunca lida da âncora. |
| R2 | Fixos não se movem: voo, check-in, check-out (30 min), transfer (45 min). |
| R3 | Âncora/máximo: café 08:00/10:00 · manhã 09:30/11:30 · almoço 12:30/14:30 · tarde 15:00/17:00 · pôr do sol 17:30/18:30 · jantar 19:30/21:00 (22:00 na chegada) · noite 21:30/22:30. Longo ≥ 4h: âncora 09:00. |
| R4 | início = max(âncora, startMin, fim anterior + deslocamento). Deslocamento = `logisticsLine` arredondado para cima; sem coords, 15 min; saindo de bate-volta, 15 min (a duração já inclui a volta). |
| R5 | Duração: catálogo → `duration` (h, decimal, h+min, min) → defaults 1h30 refeição / 1h logística / 30 min check-in/out / 1h30 resto. O motor grava decimal ("1.5h"). |
| R6 | Item flexível sai se passa do máximo do slot ou não cabe antes do próximo fixo. |
| R7 | Refeição estourada → sai uma atividade antes dela: noite > pôr do sol > tarde > manhã. Longo empurrando almoço → sai o almoço, com "Almoço no local". |
| R8 | "Descanso para regular o sono" não é item: vira a dica do jantar. |
| R9 | Dia longo (≥ 4h, bate-volta, full/half): café → longo → almoço só se cabe até 14:30 → sem tarde → jantar. |
| R10 | Último dia: T = partida − 2h/3h; transfer = T − 45 min; check-out = min(transfer − 30, 12:00). Café se check-out ≥ 07:30. Manhã termina antes do check-out; almoço e tarde vão até o transfer. |
| R11 | Check-out < 06:00: dia de volta só com check-out, transfer e voo. A véspera perde a noite e o jantar recebe "Saída HH:MM". Check-out/transfer antes de 00:00 vão para a véspera. |
| R12 | Chegada: R-V9 intacto; startMin = pouso + 60 + 45 min. |

Usam o mesmo scheduler: gerador, `swapCandidates` ("cabe" = a troca não derruba nada que o dia mantinha, e o R16 continua) e `replanTrip` (item do usuário guarda a própria hora como âncora; o que cai → `unplaced`).

## Decisões
- **D1** Check-out com teto às 12:00. Atividades continuam depois dele até o transfer, com a dica "Malas na guarda do hotel até o transfer". Voo 21:00 doméstico = dia inteiro útil.
- **D2** Transfer/check-out antes de 00:00 vão para a véspera; o dia de volta fica só com o voo.
- **D3** `DraftCockpit.tsx` (3 chamadas) e `FlightSelectionStage.tsx` (2) passam `'return'`. Volta só concorre com partida entre 06:00 e 22:00; fora disso, rótulo "fora da janela · sai 02:30".
- **D4** R19b: check-out e transfer isentos sempre; café e atividade não. É a linha autorizada; saíram também 2 linhas que ficaram sem uso (`returnMin`/`earlyReturn`), exigência do lint.
- **D5** Jantar até 22:00 no dia de chegada.
- **D6** Michelin e jantar do bate-volta na âncora 19:30, derivável do item.

## Rodadas do R19 (63 viagens, 504 dias)
| | volta 14:00 | volta 02:30 |
|---|---|---|
| C.4-diag | 284 P · 139 W · **81 F** (48/63) | 224 P · 139 W · **141 F** (63/63) |
| C.4 | 495 P · **9 W · 0 F** (0/63) | 495 P · **9 W · 0 F** (0/63) |

Os 9 WARN são todos bate-volta → jantar 19:30: Disneyland, Kennedy ×3, Kamakura ×2, Praia do Forte, Hatta e Ayutthaya. O R19 mede o deslocamento em linha reta a partir do destino do bate-volta, mas a duração do catálogo já inclui a volta. Sobreposição real: nenhuma.
Reproduzir: `SMOKE_FULL=1 npx vitest run src/test/itineraryValidator.test.ts`; com `SMOKE_RETURN=02:30` roda a madrugada.
**Efeito nas 63 viagens (14:00):** itens 2156 → 2102. 20 dias longos ficam com "Almoço no local". Itens de noite 125 → 92, incluindo os "Descanso" que deixaram de ser item.

## Testes e arquivos
- **Novos:**
  - Fortaleza gc D2 (Crocobeach sem tarde, almoço depois ou "no local");
  - Paris D2 (Septime 19:30, a dica do descanso);
  - Rio D2 (Mureta = fim do Aprazível + deslocamento);
  - volta 02:30 doméstica (23:15/23:45 na véspera; o dia de volta só com o voo);
  - volta 02:30 internacional (22:15/22:45; nenhum 00:00);
  - R7 isolado;
  - volta 02:30 × 09:00 → 09:00;
  - R19b check-out 05:15;
  - aceite do smoke.
- **Fixture** `itineraryEngine.before.json` (4 cidades) regravada, com adendo no cabeçalho do teste.
- **Testes fora da lista** atualizados porque codificavam regra que a missão mudou, cada um com comentário C.4:
  - `flightLegSwap.test.ts` (R-V8: transfer 18:15/11:15; T2: volta 07:30 sem café);
  - `cockpitCard.test.tsx` (transfer 15:15);
  - `generatorNoRepeat.test.ts` (par de bate-volta não conta como nome disponível para os outros dias).
- **R16 também passou a contar check-out pelo nome como logística**, igual ao motor. Era o único WARN da rodada 02:30: Orlando ca D7, 15/14h.
- **Achados no caminho:**
  - Hakone (10h) era derrubado pelo R7 porque o deslocamento em linha reta (~4h) estourava o jantar → regra "saindo de bate-volta, 15 min".
  - O almoço escolhido e depois derrubado gastava o nome → o almoço do dia longo e os itens do último dia agora são escolhidos já com o deslocamento real.

**Textos públicos novos (para a Rachel revisar):**
- "Almoço no local" / "Almoço no local: <par>"
- "Jantar leve e cedo: evite álcool e tente dormir no horário local"
- "Saída HH:MM — jantar leve antes do check-out" / "— jantar leve, durma cedo"
- "Voo de madrugada: saída do hotel na véspera"
- "Malas na guarda do hotel até o transfer"
- "No aeroporto 2h antes do voo doméstico" / "3h antes do voo internacional"
- "fora da janela · sai HH:MM"
- "nenhuma volta sai e chega entre 06h e 22h"

## Pendências (registradas, não feitas)
1. Saída de madrugada: o Financeiro cobra a noite 14→15 que não é dormida.
2. O card da atividade mostra "Duração: 1.5h" cru; usar `formatDurationHM` na tela.
3. Coord de aeroporto no catálogo (hoje 45 min fixos).
4. R19 vs bate-volta: o WARN do jantar depois do bate-volta é falso positivo; o R19 poderia usar a mesma regra de 15 min.

## Verificação
Suíte inteira 2× (`SMOKE_FULL=1`): **50 arquivos, 622 passed**, 1 skipped, 1 todo. tsc limpo, build ok. eslint: os mesmos 8 problemas de antes nos arquivos tocados, nenhum novo. Nenhuma edge function tocada → sem prompt de redeploy.

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   bd36b1c..220e97e  main -> main
```
