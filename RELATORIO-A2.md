# RELATÓRIO A.2 — Um voo, uma verdade: fuso real

**Commit:** `aa21423` feat: fuso real na data da viagem e chegada em UTC (A.2) · Decisões D1–D4 aplicadas como aprovadas.

## Causa da prova viva
`getTimezoneDiff` media `new Date()` (07/out, Lisboa em WEST) → gravava +4 em `trip.timezone.diff`; a capa do PDF lia esse número, e as "Informações úteis" liam uma string fixa ("UTC+0 (3h…)"). Eram duas fontes diferentes; agora as duas vêm de `tripTimezone(trip)`, recalculado na data de ida. Lisboa 10/nov passa a mostrar **"Fuso: +3h"** e **"UTC+0 (3h à frente de São Paulo)"**; em julho, +4 / UTC+1.

## Entregue
- **`src/data/generated/cityTimezones.ts`** (novo): 82 cidades do catálogo + São Paulo + 5 origens do wizard fora do catálogo (BH, Brasília, Curitiba, Porto Alegre, Campinas → `America/Sao_Paulo`). Sem elas, quem sai de Curitiba ficaria com tzKnown:false. Teste prova que o mapa e o catálogo batem 82/82.
- **`src/lib/timezone.ts`** (novo, puro): `tzOffsetMinutes` (Intl `longOffset`), `getTimezoneDiff(origem, destino, data)` → `{diff, tzKnown, …}`, **sem fallback 4**; `computeArrival` (saída local → UTC → local do destino com o offset da hora de chegada; D+n por datas locais); `tripTimezone`, `formatTzDiff`, `formatTzInfo`. Fuso decimal mantido (Nova Délhi +8,5h → "+8,5h").
- **`createTrip.ts`**: o `getTimezoneDiff` local foi removido; ida por `computeArrival`; `timezone = {origin, destination, diff, tzKnown}` (chave extra, `TimezoneInfo` intocado; sai o fallback `'Europe/Rome'`). D4: fuso desconhecido → 11h com `durationKnown:false`.
- **`flightModel.ts`**: volta por `computeArrival` com `arrivalDate` real (NRT→GRU = D+1). Os voos planejados e o `SelectedFlight` levam `tzKnown`/`durationKnown`/`international`.
- **`itineraryEngine.ts`**: campos opcionais tipados em `SelectedFlight` (D1, sem cast). `sameDayArrival` sai da data do segmento quando existe (R-V2); com `tzKnown:false` a janela de chegada é a padrão, não uma hora; o item do voo mostra "Horário de chegada a confirmar · duração a confirmar". `domestic` passa a ler `international` quando presente.
- **Consumidores**: capa e infos do PDF, `TripPanel` (Painel), `JetLagAlert`/`Viagens`, `agentMessages`: todos leem `tripTimezone` (D2: viagens antigas são corrigidas na leitura). Fuso desconhecido → "a confirmar" (D3: vale também para Bali e Phuket, mesmo com a string fixa disponível).
- `calculateArrivalTime` (trip.ts) continua intocada e não é mais chamada por createTrip nem por flightModel.

## Testes — `src/test/flightEngine.test.ts` (32 casos)
I1–I6, I3b, I4b, V1–V6 com hora local **e** D+n exatos; Tóquio chega em 12/nov (D+2). Diff: Lisboa nov +3 / jul +4, NY nov −2 / jul −1, Tóquio +12, Cabo +5, Délhi +8,5, cidade desconhecida `{0, false}`. `buildDraftTrip` grava +3 (Lisboa nov) e +4 (jul); Tóquio ida D+2 e volta D+1; Fortaleza `international:false`; cidade fora do catálogo: 11h, `tzKnown`/`durationKnown` false, sem Europe/Rome, "a confirmar" no item do voo.

## Verificação
- `npx vitest run`: **554 passaram, 1 falhou** (2 pulados, 1 todo). A falha é **anterior a esta missão**: `itineraryEngine.test.ts › Lisboa (MODERADO) snapshot` também falha com `git stash` (sem as minhas mudanças). A causa é o commit `2fe4e72` (tag daytrip em Sintra), que pôs "Bate-volta a Sintra" no roteiro de Lisboa e mudou o snapshot. Não regravei a fixture (fora do escopo). **Decisão do fundador:** regravar o snapshot de Lisboa.
- O /smoke (`planRules` + `smokeMatrix`) roda dentro da suíte: verde.
- `tsc -p tsconfig.app.json --noEmit`: zero. `npm run build`: ok. eslint: arquivos novos limpos; nos arquivos tocados, 124 problemas antes e 124 depois (nenhum novo).
- Nenhuma edge function tocada → sem prompt de redeploy.

## Fora de escopo / dívidas
- Horários de voo já gravados em viagens antigas ficam como estão (D2); só o fuso exibido é recalculado.
- A volta continua saindo às 14:00 fixas (R-V8 é A.4). Severidade (§5) não mudou.
- `SmokeTest.tsx` (página) ainda soma saída + duração sem fuso nos voos mock; só afeta o painel de smoke, não o produto.

## Custo
Não tenho acesso à saída do `/cost` (comando do CLI, fora das minhas ferramentas). Pelo contador de contexto, a sessão consumiu cerca de 115k tokens (STEP1 ~65k + aplicação ~50k). Para o número de billing, colar aqui o `/cost`.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2fe4e72..aa21423  main -> main
```

## Adendo 1 — snapshot de Lisboa regravado (decisão do fundador)
- Commit `3103a52` `test: snapshot Lisboa após tag daytrip em Sintra (2fe4e72)`: em `src/test/fixtures/itineraryEngine.before.json` só Lisboa muda. Dias 2, 5, 6, 7 e 8 foram regravados com ids novos, como a B.3 fez; os dias 1, 3 e 4 e as outras três cidades ficam idênticos.
- Dia 2 vira bate-volta a Sintra e o dia 6 vira bate-volta a Cascais. O que ocupava esses dias desce em cascata (2→5→7, 6→8). Breakdown: total de 22338 → 22358. O diff dia a dia está no corpo do commit.
- `npx vitest run`: **555 passaram**, 2 pulados, 1 todo (46/46 arquivos).

Push (test):
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2d25a1b..3103a52  main -> main
```
