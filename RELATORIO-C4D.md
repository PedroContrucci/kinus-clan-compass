# RELATORIO-C4D — R19 sequência do dia (diagnóstico, motor intocado)

**Entregue (089efa1):** `validateDaySequence` em `itineraryValidator.ts` (só adição, fora de `validatePlanRules`), `SmokeRow.r19` + `summarizeR19` no `smokeMatrix.ts`, coluna R19 e linha de resumo no `PlanRulesMatrix.tsx`, 4 testes em `itineraryValidator.test.ts`.
**Decisões:** D1 check-in/check-out = 30 min · D2 voo (ida e volta) isento do R19b; transfer/check-out isentos só no último dia com volta < 08:00 · D3 viagem = pior dia.
**Como mede:** item com hora comparado com o item que **termina mais tarde** até ali (não só o vizinho). FAIL se começa > 15 min antes desse fim; WARN se cai antes do fim + deslocamento (fórmula do `logisticsLine`, copiada porque importar daria ciclo).

## Rodada 1 — volta padrão 14:00 (= smoke commitado), 63 viagens
`R13 55/61 · R14 12/12 · R15 57/63 · R16 63/63` → **igual ao C.3a**.
**R19: 504 dias → 284 PASS · 139 WARN · 81 FAIL · 48/63 viagens com FAIL.** 82 pares em FAIL:
- (a) 36 — "Dia de praia/parque" 10:00 4–5 h × almoço 13:00. Ex.: `Fortaleza D2: Dia de praia no Crocobeach 10:00–15:00 × Cemoara 13:00`.
- (d) 46 — jantar 2–2,5 h × noite 21:30 (35; ex.: `Paris D2: Septime 19:30–22:00 × Descanso para regular o sono 21:30`) · almoço 2,5 h × tarde 15:00 (6; `Rio D2: Aprazível 13:00–15:30 × Mureta da Urca 15:00`) · manhã 3,5 h+ × almoço 13:00 (5).
FAIL por cidade (gc = gastro-cultura · pf = praia-família · ca = cultura-aventura; letra = causa):
- Fortaleza: gc D2a D3a D4a D5a D7a · ca D2a D6a D7a — Porto Seguro: gc D5a D7a · pf D3a D5a D6a · ca D3a D5d D7a
- Roma: gc D3d D4d D5d · pf D5d · ca D3d D4d — Salvador: gc D2d D3d D5d · ca D5d D6d — Cartagena: gc D2d D3d D7a · ca D2d D3d
- Gramado: gc D4a · pf D5a D6a · ca D3a D4a — Dubai: gc D3d D4d · pf D3d D5d · ca D5d — Marrakech: gc D2d D7a · pf D4a · ca D2d D7a
- Lisboa: gc D2d D3d D6d · ca D2d — Orlando: gc D5a · pf D3a · ca D6a D7a — Nova York: gc D2d D5a · pf D4a · ca D6a — Cidade do Cabo: gc D2d D3a · ca D2d D3a
- Paris: gc D2d D3d · ca D2d — Rio, Istambul, Singapura: 1 dia d por perfil — Londres: gc D3a · ca D5a — Barcelona: gc D3d · pf D5a — Tóquio, Buenos Aires: gc 1 dia d
- Sem FAIL: Bangkok (só nesta rodada).
**WARN (211 pares, todos d):** quase tudo é encaixe exato sem tempo de deslocamento — 10:00+3 h → 13:00 (80), 13:00+2 h → 15:00 (54), 19:30+2 h → 21:30 (50).

## Rodada 2 — volta 02:30 (harness com `typicalReturnDeparture`), 63 viagens
R13/R14/R15 iguais; **R16 3/63** (a janela do último dia fica em 0 h com volta 02:30 — esperado).
**R19: 224 PASS · 139 WARN · 141 FAIL · 63/63 viagens com FAIL.** O que a madrugada acrescenta: **exatamente +60 dias FAIL, 1 por viagem, sempre o último**, e sempre o mesmo padrão:
- `Fortaleza D8: Café rápido no hotel 00:00 (horário inventado)` + `Café 00:00–01:30 × Check-out 00:00` + `Café × Transfer 00:30` (doméstico).
- Internacional: transfer cai em **00:00** (hipótese: a antecedência internacional cai antes da meia-noite e é presa em 00:00) → `Paris D8: Check-out do hotel 00:00–00:30 × Transfer para Aeroporto 00:00` também falha.
- +288 pares: 60 R19b (b) · 120 sobreposição com logística (c) · 108 partida R19c (c).

## Ranking de causas (dias com FAIL; um dia pode ter mais de uma causa)
| causa | volta 14:00 | volta 02:30 |
|---|---|---|
| (d) jantar×noite, almoço×tarde, manhã longa×almoço | 45 | 45 |
| (a) item ≥ 4 h de manhã/tarde × refeição | 36 | 36 |
| (c) chegada/partida desrespeitada | 0 | 60 |
| (b) 00:00–05:59 inventado | 0 | 60 |
Na chegada não aparece nada: R19c-chegada deu 0 nas duas rodadas.

## Onde está o problema (insumo do C.4)
- **Top 5 cidades por dias FAIL (rodada 1):** Fortaleza 8 · Porto Seguro 8 · Roma 6 · Salvador 5 · Cartagena/Gramado/Dubai/Marrakech 5 (empate).
- **Por perfil:** gastro-cultura 38 · cultura-aventura 28 · praia-família 15. gc lidera porque refeição de 2–2,5 h colide com a âncora seguinte.
- **(a) fica nas cidades espalhadas** (praia/parque: Fortaleza, Porto Seguro, Gramado, Orlando). **(d) fica nas cidades de gastronomia** (Roma, Lisboa, Salvador, Cartagena, Paris).
- **Causa-raiz comum:** as âncoras fixas (10:00 / 13:00 / 15:00 / 19:30 / 21:30) não andam conforme a duração. Um único ajuste ("próximo começa em max(âncora, fim + deslocamento)") cobre a, d e a maioria dos WARN. b/c é outro ajuste, só no último dia: não inventar café e ancorar check-out e transfer de trás pra frente a partir do voo.

## Pendências
- **R16 conta 0 h para item sem duração** (achado 3 do STEP1). O R19 usa defaults (1h30 / 1h / 1h30; check-in/out 30 min), o R16 não. Fica para o C.4 alinhar.
- O smoke commitado só cobre a volta 14:00. A rodada 02:30 vive em harness `/tmp` (não commitado).

## Verificação
Suíte inteira 1×: 50 arquivos, **611 passed**, 2 skipped, 1 todo · tsc limpo · build ok · eslint limpo nos 4 arquivos · `itineraryEngine.ts` e `planRules.test.ts` sem diff.

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   a966639..089efa1  main -> main
```
