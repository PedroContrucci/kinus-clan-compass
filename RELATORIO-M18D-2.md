# RELATORIO-M18D-2 — feriado duro por lista explícita

## O que mudou
- `src/data/openIds.ts`: `OPEN_AIR` (8 cidades) + `OPEN_CONFIRMED` (4 itens, com fonte e verifiedAt 2026-11-10).
  Estrutura antiga `{ids,source,verifiedAt}` por cidade virou lista de `{id,source,verifiedAt}`.
- `src/lib/seasonal.ts` (só `unavailableIdsOnDate`): morning/afternoon em feriado duro só disponível se id
  ∈ OPEN_AIR ∪ OPEN_CONFIRMED. `isFreeOnHardHoliday` removida (critério custo 0 deixou de existir). closedIds vence.
- `src/test/m18d.test.ts` ajustado. Antigo → novo → motivo:
  - "pago/compras indisponível, livre disponível, OPEN_CONFIRMED vazio" → "slot só disponível se na lista" → regra M18d-2.
  - Lisboa/Roma/Tóquio: "custo 0" → "id na lista" → idem.
  - Novos: ids das listas existem no pool e são morning/afternoon (passou, nenhum id faltando);
    4 ids nunca em feriado duro; Paris Natal 2+2 e gastrô; Tóquio 25/12 sem regra.
- Fixture itineraryEngine.before.json: inalterada. Nenhum outro teste mudou.

## ATENÇÃO — contagem
Você disse 79 ids em OPEN_AIR; a lista que colei tem **83** (Paris 11, Lisboa 9, Roma 10, Tóquio 7, Porto 6,
Salvador 16, Fortaleza 13, Rio 11). Copiei a lista fielmente; só a mensagem do commit data(seasonal) diz "79".
Não reescrevi o commit (só 4 ids de diferença; adendo aqui, sem amend).

## Cenários — manhã / tarde em cada feriado duro
| Cenário | Dia | Manhã | Tarde |
|---|---|---|---|
| Lisboa Natal | 25/12 | lis-alfama-walk | lis-miradouros |
| Roma Réveillon | 01/01 | rom-villa-pamphili | rome-aventino |
| Tóquio Réveillon | 01/01 | tokyo-senso-ji | tok3-skytree (OPEN_CONFIRMED) |
| Paris Natal 2+2 | 25/12 | par-bois-vincennes | paris-luxembourg |
| Paris Natal gastrô | 25/12 | paris-montmartre | paris-quartier-latin |

- Slots thin('feriado'): **nenhum** — todos os 5 cenários preencheram manhã e tarde.
- Torre Eiffel (paris-tour-eiffel-top): **22/12** nos dois cenários de Paris (não caiu em feriado duro).
- Louvre: 23/12 nos dois cenários de Paris. R23 PASS; R17 OBRIGATÓRIO e ÍCONE ≠ FAIL (todos os 5, onde aplicável).

## Gates
tsc limpo · vitest 84 arquivos, 898 passed / 0 failed · build ok · eslint limpo nos 3 arquivos.

## Redeploy
Nenhuma edge function tocada.

## Push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   ad74891..261856f  main -> main
```

## /cost
Não disponível dentro da sessão — rode `/cost` no chat.
