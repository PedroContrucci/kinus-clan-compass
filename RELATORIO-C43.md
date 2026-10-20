# RELATORIO-C43 — IATA sempre, hotel no salto, bônus do dia certo, Fortaleza fora de pendentes

Commit `f21f14e` (feat). Origem: DIAG-A7. A function devolvia 0 quando o front mandava o nome da cidade ("Fortaleza") no lugar do código do aeroporto.

## O que mudou
- **IATA sempre:** `cityToIata` (`src/lib/timezone.ts`) segue a ordem IATA conhecido › `airports[0]` do catálogo (82/82 cidades) › origens do wizard (São Paulo → GRU) › `null`. `flightSearchRoute(trip)` é a única porta: perna › código gravado › cidade, e código lixo cai para o próximo.
  - TripPanel, `Viagens.tsx` (preço de referência + resposta do agente) e DraftCockpit (busca automática) usam a rota.
  - Sem IATA: não chama a function e mostra **"Busca de preços indisponível para este destino"**.
  - `inferAirportCode` (substring, "Gramado" → "GRA") foi apagado.
- **Hotel no salto:** `itemCoord(item, dest, hotel?)` e `hopMinutes(…, hotel?)`. Check-in/out usam o nome do hotel curado e, se não casar, o hotel da viagem. Café e room service do hotel ficam no hotel. Nunca a mediana.
  - `LayoutOpts.hotelCoord` é passado pelo `generateItinerary` (`resolveHotelCoord`), pelo `swapCandidates` e pelo `replanTrip`.
  - `replanItinerary.ts`, 3 linhas fora da lista: sem elas, um replan devolvia Águas Belas a 09:15.
  - A tela (`GeneratedItineraryStage`, D2) usa `stayHotelCoord(days)`. Fortaleza D4: café 08:00, **"~1h de carro"**, Águas Belas **10:00**.
- **Dia certo:** `weekdayKey` entra no `pickActivity` entre interesse e tema. Caranguejada no jantar de 12/nov (quinta), no perfil padrão e no gastro-cultura.
- **Fortaleza** saiu de `ROUTES_PENDING_PRICE` (GRU→FOR 1730 conferido no banco); teste 13 → 12.

## Aceite
| Regra | Antes | Depois |
|---|---|---|
| R13 | 54/61 | **54/61** |
| R14 · R16 | 12/12 · 63/63 | 12/12 · **63/63** |
| R15 | 57/63 | **57/63** |
| R19 | 504 P / 0 F | 504 P / **0 F** (0/63 viagens) |
| R18 | 0 FAIL | **0 FAIL** |

O check-in/out com coord real não derrubou nada: a restrição aos itens incluídos não foi necessária.

## Fixture e pins (mudanças de propósito)
- `itineraryEngine.before.json`: **só Fortaleza** foi regravada, com adendo no teste. Praias passam de 09:15 para 09:20/09:25 e Águas Belas para 10:00.
  - No D3, a barraca longa empurra o almoço e ele sai pela R7 (vira almoço no local).
  - A Caranguejada entra no jantar de quinta e a cadeia de almoços e jantares anda um dia. Comida de 3230 para 2950.
- `razaoLines`: total Fortaleza 02:30 de 10984 para 10764.

## Verificação
- `src/test/c43.test.ts`, 8 testes: payload GRU/FOR sem código na perna; código lixo cai para o próximo; destino inventado dá `null`; Gramado dá POA; D4 Águas Belas ≥ 10:00 com "~1h de carro"; incluído sem hotel dá `null`; Caranguejada na quinta (2 perfis) com R18 PASS.
- Suíte 2× com `SMOKE_FULL=1`. A 1ª pegou os 2 pins acima; a 2ª: 687 passed, 1 skipped, 1 todo, 58 arquivos.
- tsc limpo (também depois do pull do Lovable, que só mexeu em `previewAuthStorage.ts` e `types.ts`). Build ok.
- ESLint nos tocados (antes → depois): DraftCockpit 5 → 4, os demais iguais, `c43.test.ts` 0. Nada novo.
- Nenhuma edge function tocada: sem redeploy. Publish é do fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   b93bb5f..f21f14e  main -> main
```
