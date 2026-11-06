# RELATORIO M20c — pax nos textos que diziam "pessoas"/"travelers"

## O que mudou
1. **Resumo "O que o KINU fez"** — o texto real estava em `src/lib/onboardingFlow.ts:175` (não em `DraftCockpit.tsx`; tocado com autorização): "estimativa para 4 pessoas" → `paxLabel(paxOf(trip))` ("2 adultos + 2 crianças"). `/pessoa` permanece.
2. **`GeneratedItineraryStage`** — nova prop opcional `pax`; passada a `generateItinerary` (hotel `undefined`, como antes) e à troca de item (`convertToItineraryActivity`). Ausente = comportamento anterior. Obs.: o componente hoje só é montado em teste; o app usa `generateItinerary`/`draftItinerary`, que já passava `paxOf(trip)`.
3. **Hero (`FlightPriceLines`)** — quando `airfarePaxOf` difere de `paxOf` (criança ≥ 12): `estimativa para {família} · tarifa aérea conta {aérea} (12+ paga adulto)`; igual: só a composição. "confirmado para" segue com o rótulo da aérea. Nunca "total".
4. **Motor (`itineraryEngine`)** — `flightPayers = travelers − bebês` só quando `pax.infants > 0`; senão `= travelers` (idêntico). Aplicado a: perna de ida, perna de volta e `flightsCost` (l.733, autorizado). Rótulo: `(N pagantes)` com bebê; `(N pax)` sem bebê, como antes.

## Linhas 1545 e 1771 — não são voo
Ambas são o jantar/almoço **Michelin** (`perPerson * travelers`, preço da estrela). Refeição é por viajante (bebê incluso na conta de consumo, regra M20 existente). Deixadas intactas.

## Testes
- Novo `src/test/pax20c.test.tsx` (5 casos): resumo 2+2; hero idades 8 e 12 (e caso sem diferença); roteiro com 1 bebê (4000 por perna, `flights` 8000, "(4 pagantes)"); sem bebê idêntico (4000, "(4 pax)", com e sem `pax`).
- **Nenhum assert existente alterado** (`git diff -- src/test` vazio); fixture do motor intacta.
- vitest inteiro: 76 arquivos, 837 passed | 3 skipped | 1 todo · `tsc -p tsconfig.app.json --noEmit` limpo · `npm run build` ok.
- eslint nos arquivos tocados: 7 problemas antes e depois (pré-existentes); nenhum novo.

## Redeploy
Nenhuma edge function tocada. Só Publish do front (fundador).

## Push do commit `feat(pax)`
```
To https://github.com/PedroContrucci/kinus-clan-compass
   450fd98..dca6e77  main -> main
```
(`git pull --ff-only origin main`: Already up to date.)
