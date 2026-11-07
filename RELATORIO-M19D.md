# RELATORIO-M19D — ícone/essencial longo ocupa a tarde (Beach Park volta)

## Causa
`notLong` (accept dos dois picks da tarde, CASE C) recusava todo item ≥ 4 h antes de o `byTier` ver o ícone → o `force` do M19c não salvava o Beach Park (`for-beach-park`, icon, 5 h).

## O que mudou
- `itineraryEngine.ts`: `LONG_ICON_MAX_MINUTES = 6 h`; `longIconOk` (tier `icon`/`essential`, 4–6 h, sem `dayOccupancy` full/half) entra em `notLong`. Fora: véspera leve e 1º dia de exploração com jet lag ALTO/SEVERO.
- `fits` do `tierPlanFor` relaxado **localmente** para esse caso (sem a reserva de refeição); `EXPLORATION_WINDOW_HOURS` (14) intocado.
- Tarde escolhida longa → `afternoonOccupancy = 'full'` (sem noite, sem 2º EXP), dica "Ocupa a tarde inteira — jantar perto do hotel" no item, jantar por `pickNearHotelDinner`.
- `itineraryValidator.ts` (R20): dia com ícone/essencial de catálogo ≥ 4 h conta como cheio.

## Confirmado na implementação (decisões abertas)
- **Flag de jet lag:** `jetLagHigh` (`jetLagSeverity` ALTO|SEVERO, `itineraryEngine.ts` ~1178), o mesmo do bate-volta; aplicado como `i === explorationStart && jetLagHigh`.
- **Nome do tier:** `'essential'` (`LandmarkTier = 'icon' | 'essential' | 'hidden_gem'`).

## Desvio do STEP1 (por causa do "nenhum assert existente alterado")
Com jantar sempre perto do hotel, o Beach Park caiu na quinta 12/11 e deslocou a Caranguejada (bônus do dia certo; `c43.test.ts` falhou, 2 asserts). Ajuste: no dia do ícone longo, se há jantar "só ≤ 3 dias" livre que abre hoje, ele continua mandando; senão, perto do hotel.

## Fixture `itineraryEngine.before.json` (zz-regen só Fortaleza, apagado)
Cartagena, Lisboa e Tóquio **sem diferença** (testes verdes sem regravar). Fortaleza mudou:
- d3: saem Calçadão da Beira-Mar e Sorveteria 50 Sabores (custo 680 → 620).
- d7: sai Jardim Japonês; entra **Beach Park**; sai Veleiro ao pôr do sol (17:30); L'Ô → Mar & Terra (Varjota) 20:30; custo 820 → 1200.
- d8 (último dia): entra Veleiro ao pôr do sol às 09:30 (comportamento pré-existente do último dia; vale revisar).
- Total 4530 → 4730.

## Testes
`src/test/m19d.test.ts` (4 novos): Beach Park entra, sem noite, dica presente, R18 PASS, dia não ralo no R20; nunca na quarta (10–15/11); jet lag SEVERO fora do 1º dia de exploração; Paris sem item ≥ 4 h na tarde. Antes da mudança, o Beach Park não entrava (confirmado). Nenhum assert existente alterado.

## Verificação
vitest 77 arquivos / 841 passed · `tsc -p tsconfig.app.json --noEmit` limpo · `npm run build` ok · eslint: só os 2 `no-explicit-any` pré-existentes (itineraryEngine.ts:717), nada novo.

## Observações
- Fortaleza 10–17/11 tem R20 WARN em 2 outros dias (3 e 6) — pool/bate-volta, fora do escopo.
- Sem function tocada: não há prompt de redeploy. Nada em `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`.

## Push do commit feat
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2443d40..561a9b7  main -> main
```
