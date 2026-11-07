# RELATORIO-M19D-FIX — ícone longo cabe na janela real; tarde nunca vazia por remoção

## Causa (Passo 0b)
Na M19d relaxei o `fits` (sem reserva de refeição) → o Beach Park (5 h) era escolhido e depois removido pelo empacotamento
da janela de 14 h (D2 16,0 h · D3 14,5 h · D4 15,0 h). A tarde ficava vazia (`janela-14h`) e o ícone não reentrava.
Em D2 o veleiro (pôr do sol) ainda somava 2 h na mesma tarde.

## O que mudou (`itineraryEngine.ts`)
1. `fits` volta a incluir `mealReserve` também para o ícone longo: manhã escolhida + almoço + jantar + saltos + duração ≤ 14 h.
   Não cabe hoje → não é escolhido hoje (fica para `forceN` / outro dia aberto). `EXPLORATION_WINDOW_HOURS` intocado.
2. Ícone longo escolhido na tarde → o pôr do sol do dia é descartado e volta ao pool (`releasedIcons`), para outro dia.
3. Manhã ≥ 3 h (não essencial, sem `dayOccupancy`) que impede o ícone: tenta manhã ≤ 2 h antes de desistir.
   O nome da manhã trocada continua usado (perde-se uma opção, nunca repete).
4. Rede de segurança no empacotamento: tarde removida e nenhuma tarde sobrou → `pickActivity('afternoon')` com a regra
   normal (< 4 h, sem pôr do sol/snack, cabe na janela). Sem candidato → `thin('pool')`.
5. `smokeMatrix.ts`: `SMOKE_SCENARIOS` + `runSmokeScenario` ("Fortaleza família dez (2+2)": 10–15/12/2026, 2 adultos +
   crianças 8 e 12, Conforto, beach+family). `runSmokeCase` passou pelo mesmo `evaluateSmoke`; a matriz 21×3 não mudou.

## Resultado (Fortaleza 10–15/12, 2+2)
D2 sex: Praia de Iracema / **Beach Park 15:00** · D3 sáb: Dragão do Mar / Calçadão / veleiro 17:30 · D4 dom: bate-volta
Morro Branco · D5 seg: Sabiaguaba / Jardim Japonês · D6: Theatro José de Alencar / Catedral. `thinDays` = [].

## Testes (`src/test/m19dFix.test.ts`, 5 novos; nenhum assert existente alterado)
Beach Park numa tarde sex/sáb/dom/seg; nenhum dia de exploração (sem bate-volta) sem tarde e sem `janela-14h`; veleiro
fora do dia do Beach Park; Fortaleza 10–17/11 continua com Beach Park; smoke 2+2 com R20 e R17 ÍCONE PASS.

## Fixture
Nenhuma mudança: `itineraryEngine.before.json` passou sem regravar (Fortaleza, Cartagena, Lisboa e Tóquio idênticas).
Sem zz-regen. Hotel Sonata: usado como `hotel.label` no motor; no smoke o hotel vem do fluxo (não forçado, não verificado).

## Verificação
vitest 78 arquivos / 846 passed · tsc limpo · build ok · eslint: só os 2 `no-explicit-any` pré-existentes (L717).
Sem function tocada, sem prompt de redeploy. Nada em `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`.
M19e segue pendente (STEP1-M19E.md e RELATORIO-M19E-PASSO0.md ainda não commitados).

## Push do commit fix
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2e6e820..7869517  main -> main
```
