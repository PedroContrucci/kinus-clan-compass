# RELATORIO-M19E — horário natural do item: fim de tarde nunca de manhã; R22

## Passo 0 (achados)
- Não existe categoria `evening` (catálogo: breakfast|lunch|dinner|morning|afternoon|night). Veleiro = `afternoon`, 2 h,
  sem `dayOccupancy`/`bestTime`; o único sinal de fim de tarde é o nome (padrão em ~14 cidades). Nome é a convenção do motor.
- Manhã normal já usa `pickActivity('morning')` (só categoria `morning`). O vazamento era só o último dia: `pickActivity('afternoon')`
  na manhã (`itineraryEngine.ts` ~1428) sem filtro, gravado como `morning` às 10:00.

## Passo 0b (incorporado) — Fortaleza 10–15/12/2026, 2 adultos + 2 crianças, Conforto, beach+family
Reproduziu a produção: Beach Park ausente; D3/D4 sem tarde (`janela-14h`). Nenhum filtro (notLong/longIconOk, fits, isEve, jet lag,
opensToday) o recusava: era escolhido e removido pelo empacotamento da janela de 14 h (D2 16,0 · D3 14,5 · D4 15,0 h), porque o
`fits` da M19d tirava a reserva de refeição; em D2 o veleiro somava 7 h na tarde. Corrigido na M19d-fix (7869517), antes desta.

## O que mudou
- `itineraryValidator.ts`: `isEveningItem` = categoria `night` ∨ tag `snack` ∨ nome (pôr do sol, sunset, "à noite", `noite`,
  by night, anoitecer). Critério (A) como decidido. Nova **R22 HORÁRIO NATURAL** (`validateNaturalTime`): EXP de fim de
  tarde/noite antes das 15:00, ou item `morning` depois das 18:00.
- `itineraryEngine.ts`: `accept` da manhã do último dia e da tarde pós-checkout excluem `isEveningItem` (C); sem candidato de
  manhã → free-slot (B); o pick de manhã dos dias normais também recusa `isEveningItem` (rede de segurança).
- `smokeMatrix.ts`: `SmokeRow.r22`, calculado em toda linha.

## R22 — medição antes do motor (smoke 85 linhas, inclusive o cenário novo, + fixtures)
3 acusações, todas legítimas (último dia, manhã): Fortaleza/praia-familia **Sorveteria 50 Sabores 09:30**; Rio/praia-familia
**Momo Gelato 09:30**; fixture Fortaleza **Veleiro ao pôr do sol 09:30**. Depois do motor: **0 acusações** → R22 nasce **FAIL**.

## Fixture `itineraryEngine.before.json` (zz-regen só Fortaleza, apagado)
Cartagena, Lisboa e Tóquio sem diferença. Fortaleza d7 (último dia): sai o Veleiro ao pôr do sol (09:30); entra o
Jardim Japonês da Beira-Mar (mesmo horário). Total 4730 → 4530.

## Testes (`src/test/m19e.test.ts`, 6 novos; nenhum assert existente alterado)
Veleiro nunca antes das 15:00 (Fortaleza 10–17/11); último dia com item/espaço de manhã; R22 PASS no roteiro; critério do
`isEveningItem`; R22 FAIL (veleiro 09:30; manhã 19:00) e PASS (afternoon 18:30; veleiro 17:30); smoke (cenário 2+2, Fortaleza
e Rio praia-família) com R22 PASS.

## Verificação
vitest 79 arquivos / 852 passed · tsc limpo · build ok · eslint só os 2 `no-explicit-any` pré-existentes (L717).
Sem function tocada, sem prompt de redeploy. Nada em `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`.
STEP1-M19E.md e RELATORIO-M19E-PASSO0.md apagados (o PASSO0 nunca foi commitado).
Nota: a regex `\bnoite\b` também casaria "Noite em Trastevere"-like em item de manhã; hoje o catálogo os põe em `night`/tarde.

## Push do commit feat
```
To https://github.com/PedroContrucci/kinus-clan-compass
   c22b93f..c927955  main -> main
```
