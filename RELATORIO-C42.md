# RELATORIO-C42 — Fonte única da diária de hotel (R-V12 no dinheiro do hotel)

**Aceite:** smoke R13 55/61 · R14 12/12 · R15 57/63 · R16 63/63, **idênticos ao C.4.1**. R19 **504 P · 0 W · 0 F**
nas duas rodadas (padrão e 02:30). tsc zero · suíte 53 arquivos / 634 ✓ (rodada 2×) · build ok · eslint 7 = 7
da main nos arquivos tocados (nenhum novo; `hotelRate.test.ts` limpo).

## Causa
Duas funções para a mesma diária: o createTrip gravava `getActivityPrice('hotel_night') × tier.multiplier`;
o motor usava `getActivityPrice('hotel_night')` sem multiplicador (e, na regeração, com o priceLevel de
`budgetType`). Sem curado, o Financeiro lia o motor; card/PDF liam `acc.nightlyRate`. Mochileiro divergia
(Financeiro 100%, card 60%); Conforto batia por coincidência (multiplicador 1).

## O que mudou
- `itineraryEngine.ts`: `getActivityPrice('hotel_night')` saiu do motor. `EngineHotel.nightlyRate` é input;
  `hotelTotal = nightlyRate × noites`. `label` virou opcional (sem ele, rótulo da tabela de zonas). A dica
  "N noites (~R$ X/noite)" só aparece com diária.
- `draftItinerary.ts`: motor recebe `acc.nightlyRate`; depois de `accommodationWithNights`, o balde do hotel
  é **sempre** `acc.totalPrice` (curado, estimado ou confirmado). Novos `hotelRateSource` / `hotelRateLabel`.
- `DraftCockpit.tsx`: `hotelPlannedOverride = acc.totalPrice` sempre (sem portão no curado) — cobre o caminho
  legado do `GeneratedItineraryStage` (viagem sem dias salvos roda o motor sem hotel).
- `createTrip.ts`: a diária tier × cidade (ou meio da faixa do curado) é a única origem; grava `rateTier`
  (rótulo do perfil) na hospedagem, por fora do tipo como `curatedHotelId`.
- `HotelPlanBlock.tsx` (card): `R$ X/noite · estimativa Conforto` / `· curado (faixa R$ a–b)` /
  `· confirmado`. Origem **derivada** na renderização (confirmed > curatedHotelId > estimativa); viagem
  antiga sem `rateTier` → `· estimativa`. Sem diária, nada.
- `planTotals.ts` e `hotelSwap.ts` intocados (hotelSwap já grava `nightlyRate` e `totalPrice = diária × noites`).
- Testes: `hotelRate.test.ts` novo — Fortaleza Conforto 10–15/nov sem curado, Luxo (Gran Marquise curado),
  volta 02:30 → 4 noites, Mochileiro a 60% da tabela: card = Financeiro = PDF (`acc.nightlyRate × totalNights`)
  em todos. Ajustados ao contrato novo: snapshot do motor (diária passada como input = a da tabela midrange,
  saída idêntica), `draftTruth` (override = `acc.totalPrice`), `hotelPlanBlock` (rótulo "· estimativa").

## Pendência
- `totalNights = dias − 1` no createTrip ignora chegada D+1 (checkIn já deslocado) — revisar junto com Tóquio.
  Hoje o motor corrige as noites na véspera do retorno, mas não na chegada.

Nenhuma edge function tocada — sem prompt de redeploy. Publish do front fica com o fundador.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   09296b6..b12dccf  main -> main
```
