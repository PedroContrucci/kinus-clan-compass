# STEP1-DAY-IDS — ids `day-N-<catalogId>` no generateDays (createTrip.ts)

## Achados que mudam o plano
1. **Quem lê o prefixo `act-`: ninguém.** Grep em src/: só `test/achievements.test.ts:239–270`
   (ids inventados de fixture, não parseados) e um comentário em `lib/tripEvents.ts:170`
   (exemplo `act-3-2` como id opaco). Nada para adaptar em código.
2. **Itens do catálogo em generateDays são só 5 slots dos dias de exploração** (~604–637):
   `morning`/`afternoon`/`night` (pickExp, quando `!isFreeSlot`), `lunchAct`, `dinnerAct`
   (pickRestaurant). Dias de embarque, chegada, recuperação e retorno usam nomes de tema
   (`theme.activities[i]`, `claim(theme.restaurants…)`) e itens sintéticos (café, check-in,
   voo, transfer) — **não têm id de catálogo**.
3. **Sufixo `-2`/`-3` quebra o próprio teste pedido**: `catalogIdOf('day-5-x-2')` = `x-2`, que
   não resolve no catálogo. E não é necessário: o prefixo `day-N-` já torna o id único entre
   dias; repetir o mesmo id no MESMO dia é impossível (usedPlaces marca por nome; restaurante
   só recicla por gap de dias). Proposta: **sem sufixo**; guarda defensiva só para colisão no
   mesmo dia (cai no id sintético `act-N-M`, nunca muda o catalogId).
4. **Efeito colateral real (desejado):** `catalogIdOf` é lido por achievements.ts:149/219,
   TripCheckinDrawer:91, ActivityDetailDrawer:200 (foto do lugar) e Viagens:2334. Drafts do
   createTrip passam a ter foto real, check-in por lugar e contagem no card "O que o KINU fez"
   (hoje 0). Dados de viagens já salvas não mudam (só drafts novos).
5. Michelin promovido no jantar (`dinnerName` ~611–620) não vem de getDestinationActivities →
   mantém id sintético.

## Diff proposto (1 arquivo + 1 teste)
`src/lib/createTrip.ts`, só no bloco de exploração (~625–637):
```ts
const catId = (slot: number, a: SuggestedActivity | null | undefined, free = false) =>
  a && !free && a.id && !String(a.id).startsWith('__free__')
    ? `day-${dayNum}-${a.id}`
    : free && a ? `${a.id}-${dayNum}`        // __free__-morning-4 (mantém o prefixo)
    : `act-${dayNum}-${slot}`;
// slot 2: catId(2, morning.activity, morning.isFreeSlot)
// slot 3: catId(3, lunchAct)
// slot 4: catId(4, afternoon.activity, afternoon.isFreeSlot)
// slot 5: catId(5, night.activity, night.isFreeSlot)
// slot 6: dinnerName === `${dinnerAct?.name}` ? catId(6, dinnerAct) : `act-${dayNum}-6`
```
`makeActivity` não muda (já recebe o id). Demais `act-N-M` (sintéticos) ficam como estão.

`src/test/generatorDayIds.test.ts` (novo): buildDraftTrip para 3 cidades curadas (Roma,
Fortaleza, Cartagena), 6 noites, interesses variados. Para todo item cujo **nome bate com um
item de getDestinationActivities(city)**: id casa `/^day-\d+-/` e `catalogIdOf(id)` existe no
pool com o mesmo nome. Mais: nenhum id duplicado na viagem; free slots começam com `__free__-`.

## Decisões abertas
- A. "Todo item não-livre casa `/^day-\d+-/`" literal reprovaria café/voo/check-in (sintéticos,
  sem catálogo). Proponho escopo = itens vindos do catálogo (acima). Ou quer os sintéticos
  renomeados para `day-N-<slug>` (ex.: `day-1-flight-out`, padrão do GeneratedItineraryStage)?
- B. Confirmar: sem sufixo `-2`/`-3` (achado 3).

## Verificação
vitest inteiro · tsc -p tsconfig.app.json · build · eslint nos tocados.
Intocáveis (src/data, hotelZones, michelinData, types/trip.ts) não são tocados.
