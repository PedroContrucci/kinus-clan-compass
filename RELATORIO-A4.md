# RELATÓRIO A.4 — Trocar perna replaneja sem apagar

Commit `f78456f` (feat). Decisões do fundador: 1 transfer em −3h/−2h · 2 toast + `unplacedEdits` · 3 coluna opcional, sem migração · 4 T4b na matriz.

## Entregue
1. **R-V11 — replanejar preservando** (`src/lib/replanItinerary.ts`, novo e puro). `reapplyEdits` reaplica sobre a saída nova do motor:
   itens fora de `engineItemIds` (trocados/adicionados), remoções do usuário (o mesmo id regerado sai de novo) e itens confirmados
   (herdam o status). Ordem: vaga que ele mesmo abriu no slot → item de catálogo novo do motor no mesmo slot → pela hora, se a janela
   do dia regerado permite (trânsito/chegada noturna: nada; dia de chegada: check-in→22h; último dia: até o transfer). O resto
   vira `unplaced` → toast "N itens seus não couberam no novo horário" com a lista (dia incluso) + `unplacedEdits` gravado.
   Lugar do usuário manda: a cópia do motor em outro dia sai (nome normalizado). `engineItemIds` = saída pura do motor, então as
   edições continuam contando. Cockpit: `handleFlightsSelected` e `applyPendingPick` replanejam sem diálogo; "desfaz N trocas" ficou
   **só** no "Regerar roteiro".
2. **R-V8 — último dia** (`itineraryEngine.ts`): transfer = saída −3h intl / −2h dom (o −4h morreu); check-out `min(11:00, transfer−30)`;
   café do catálogo às 08:00 se o transfer é ≥ 09:00, senão "Café rápido no hotel" (genérico) 1h antes do transfer. Saída < 10:00 = só
   café + check-out. Achado no caminho: o corte de janela do motor tirava o **check-out** (type `transport`) quando a janela era 0 —
   agora é logística (`isLogisticAct`, pelo nome).
3. **R-V9 — dia de chegada** (`arrivalBandFor`, exportado): < 14h tarde leve (como antes) · 14–20h check-in 1h após pousar + jantar
   (≥ 1h30 após pousar), sem caminhada · ≥ 20h só check-in com a dica "Chegada noturna: descanse". Vale no dia 0, no dia de chegada
   D+n e no ramo recovery (severidade §5 intocada). Fuso desconhecido = tarde leve.
4. **Viagens — confirmar voo**: `retimeConfirmedLegs` refaz a chegada da perna com hora nova (`retimeFlight` → `computeArrival`,
   segmentos e `trip.flights.*` juntos — antes a chegada ficava velha). Se D+n, faixa R-V9 ou janela do último dia mudam → replaneja
   com o item 1; só passeios/comida planejados acompanham (voo confirmado e hotel intocados). Toast sempre que replaneja.
5. **Volta estimada**: `FlightPriceEstimate.typicalReturnDeparture` lido de `typical_return_departure` se a linha tiver;
   `buildPlannedFlights` usa e marca `departureTimeSource: 'route'`; sem ele, 14:00 `'default'` ("Voo de Volta (estimado)").
   SQL para o kinu-beta quando for preencher:
   `alter table public.flight_price_estimates add column if not exists typical_return_departure time;`
6. **MATRIZ §6**: linha T4b adicionada (T4 intacta), neste commit docs.

## Testes (`src/test/flightLegSwap.test.ts`, 14)
T1 Lisboa ida 23:00→10:00: D+1→D+0, chega 23:00, dia 1 só check-in, dia 2 vira exploração · T2 Fortaleza volta 14:00→07:30: último
dia = café rápido + check-out + transfer 05:30 + voo; café trocado pelo usuário → avisado · T3 Tóquio 18:00→01:00: D+2→D+1, +1 dia
de exploração, `toursPlanned` sobe · T4 trocas/remoções preservadas (com e sem mudar a ida), confirmado herda status · R-V8 (19:00 /
12:00) · R-V9 (10:25 / 16:25 / 21:25) · item 4 (replaneja quando D+n muda; intacto quando não) · item 5 (rota/default).
**Fixture** `itineraryEngine.before.json`: regravados só o dia 1 e o último dos 4 casos (chegada 15:30 → sem caminhada, check-in
16:30; transfer 21:00 −3h = 18:00 / FOR dom −2h = 19:00; dica do transfer). Os dias do meio batem byte a byte.

## Verificação
- `npx vitest run` (com SMOKE_FULL=1): **48 arquivos, 583 passed**, 1 skipped, 1 todo.
- Smoke 63 — antes: `R15 57/63 PASS · 6 WARN | R16 63/63 PASS` · depois: `R15 57/63 PASS · 6 WARN | R16 63/63 PASS` (R13 55/61, R14 12/12 iguais).
- `tsc -p tsconfig.app.json` limpo · `npm run build` ok · eslint: contagem igual à de antes nos 9 arquivos tocados.
- Nenhuma edge function tocada → sem prompt de redeploy. Publish do front é do fundador.
- Push: o git travou na verificação de locks do LFS (o remote não suporta); configurei `lfs.<url>.locksverify false` só no
  `.git/config` local, como o próprio git sugeriu.
- /cost: não tenho acesso ao contador da sessão; anotar pelo `/cost` do terminal.

## Fora / pendente
UI dedicada dos não encaixados (C.2) · severidade §5 · function de voos · preencher `typical_return_departure`.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   5498449..f78456f  main -> main
```
