# RELATÓRIO A.3 — Lista de voos coesa com o recomendado + ranking escrito

**Commit:** `db0c14e` feat: lista de voos coesa com o recomendado + ranking escrito (A.3) · D1–D4 e os acréscimos (a)/(b) aplicados como aprovados.

## Achados que mudaram o plano
- A function `amadeus-flights` chama a **Travelpayouts** (Aviasales). Cada oferta traz um segmento só, sem hora por conexão, então R-V4 por segmento fica impossível com essa fonte.
- No servidor, `arrival.at` é saída + duração rotulada como UTC, e `departureTime`/`arrivalTime` saem formatados em UTC (GRU 23:00 aparecia como 02:00). A normalização usa só `segments[0].departure.at` e `durationMinutes`. A function **não foi tocada**.

## Entregue
- **`flightModel.offerToSelected`**: oferta → `SelectedFlight` pelo mesmo modelo do voo estimado.
  - Chegada por `computeArrival` (UTC primeiro), D+n por data local, segmento regravado com hora local sem `Z`.
  - `tzKnown` via aeroporto → cidade → `cityTimezones` (`timezone.airportCity/airportTimezone`), com fallback na cidade da viagem.
  - `international`, `source:'reference'`, `priceSource:'travelpayouts'`.
- **`flightModel.writeFlightsThrough`** (R-V12): grava `outboundFlight/returnFlight`, `trip.flights.*` (via `selectedToPlanned`) e o balde de voo das finanças a partir do mesmo objeto. Guarda `kinuEstimate` na primeira troca. `estimateOf(trip)` devolve a estimativa mesmo depois de uma troca.
- **`src/lib/flightRanking.ts`** (novo):
  - Modo `kinu`: direto > preço com `PRICE_TIE_PCT = 0.05` (até 5% do menor do grupo conta como empate) > chegada local 06:00–22:00 (`ARRIVAL_WINDOW`) > duração.
  - Modo `fastest`: direto > duração > preço > janela. Desempate final por preço exato e depois id.
  - Também: `pickBest`, `explainPick` ("direto, R$ X abaixo/acima da média, chega 12:00 (+1)"), `shouldAutoSearch`, `flightSearchKey`.
- **`SelectedFlight`** (itineraryEngine) ganha campos opcionais tipados: `source` passa a aceitar `'reference'` (`'amadeus'` fica só como legado), `priceSource`, `chosenBy`, `kinuPick`.
- **`DraftCockpit`**, busca ao abrir o rascunho (D2):
  - Só busca em rascunho, com voo estimado e sem escolha do usuário. Usa o cache de 5 min do react-query e grava o resultado em `trip.kinuFlightSearch` (chave origem-destino-ida-volta), então não repete a chamada a cada abertura.
  - Sem edição manual: aplica a melhor de cada perna e regenera o roteiro. Com edição: grava `pending` e mostra "KINU encontrou: … · aplicar" (D3; aplicar passa pelo diálogo "desfaz N trocas").
  - O chip 06 diz "KINU escolheu: … · trocar"; o toque abre a lista.
  - A escolha manual grava `chosenBy:'user'` com a fonte do item, sempre por write-through.
- **`FlightSelectionStage`**:
  - A estimativa é o índice 0, pré-selecionada, com o rótulo "Sugerido pelo KINU · estimado". As ofertas vêm abaixo, na ordem do ranking (chips "Menor preço" e "Mais rápido").
  - "KINU escolheu" marca a escolha automática; chegada sem fuso aparece como "chegada a confirmar".
  - Os 3 mocks com preço inventado somem quando há estimativa (o legado sem estimativa fica igual).
  - CSS: footer e header do estágio em `z-20`, abaixo da trilha (`z-30`); `main` com `pb-72`. **Não verifiquei no browser.**
- **Card** (`kinuDidLines`): mesma linha do chip 06. **Viagens/confirmar** grava `source:'confirmed'` em `outboundFlight/returnFlight` e `trip.flights.*`.
- **Nome da fonte**: TripPanel "✈️ Voos Reais" → "✈️ Preços de referência · Travelpayouts"; "Preços via Amadeus (referência)" → "preços de referência · Travelpayouts"; Privacidade: "Amadeus — busca de voos" → "Travelpayouts — preços de referência de voos".

## Testes — `src/test/flightRanking.test.tsx` (13)
- Fixture com 5 ofertas no formato do servidor, incluindo o lixo que ele manda: direta cara, escala barata, chegada 02:00, D+1 à tarde, mais rápida.
  - Modo `kinu`: [A, E, B, D, C]. Modo `fastest`: [E, A, C, B, D]. Mesma ordem com a entrada embaralhada.
- Normalização: GRU→LIS 23:00 → 12:00 D+1; NRT→GRU 27h → 13:00 D+1; GRU→FOR doméstico; aeroporto desconhecido → "chegada a confirmar".
- Estimativa no índice 0 e pré-selecionada (render), sem mocks.
- `writeFlightsThrough` atualiza os voos, `trip.flights.*` e `finances` ((6000+2500)×2) sem mutar a original.
- Card e chip mostram o mesmo texto. `shouldAutoSearch` só busca em rascunho, só com estimativa e só para chave nova.
- **Exemplo honesto:** a direta cara vence por ser direta, e o texto diz "R$ 1.570 **acima** da média".

## Verificação
- `npx vitest run`: **568 passaram**, 2 pulados, 1 todo (47/47 arquivos). O /smoke está dentro da suíte.
- `tsc` zero. `build` ok. eslint: nenhum problema novo nos arquivos tocados (a contagem antes/depois bate; os novos arquivos estão limpos).
- Nenhuma edge function tocada → sem prompt de redeploy.

## Dívidas / fora de escopo
- **Datas flexíveis** aplicam −12%/+7% inventados sobre o melhor preço (`handleChangeDateAndSelect`). Não mexi.
- Desconfirmar em Viagens volta o status para 'planned', mas mantém `source:'confirmed'` (não há fonte anterior gravada).
- Confirmar muda a hora de saída, mas não recalcula a chegada (A.4). Trocar de perna não replaneja além de regenerar (A.4).
- A function ainda formata horas em UTC e soma a chegada. O cliente ignora esses campos, mas o servidor deveria parar de mandá-los (pede redeploy; fica para quando tocar a function).
- `flightPriceLabel` ainda diz "cotação real na etapa Voo" (não estava em (a)).
- Sem browser: sobreposição da barra, aviso "KINU encontrou" e chip 06 não foram vistos na tela.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   ce22081..db0c14e  main -> main
```
