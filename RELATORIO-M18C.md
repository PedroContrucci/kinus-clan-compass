# RELATORIO M18c — Gulbenkian fecha 24 e 25/12 e 01/01 (FECHADO)

## Contexto
PDF de produção (Lisboa 20–27/12/2026, 2 adultos) pôs o Museu Calouste Gulbenkian na manhã de 25/12.
O museu fecha 24/12, 25/12 e 01/01 (gulbenkian.pt/museu/en/visit).

## O que entrou
- Id único no catálogo: `lis-gulbenkian` (sem ambiguidade).
- `src/data/seasonalNotes.ts` (só adição):
  - Lisboa dez: closures[2] `24/12 e 25/12: Museu Calouste Gulbenkian fechado`; closedIds `2: ['lis-gulbenkian']`.
  - Lisboa jan: closures[1] `01/01: Museu Calouste Gulbenkian fechado`; closedIds `1: ['lis-gulbenkian']`.
- `src/lib/smokeMatrix.ts`: cenário "Lisboa Natal 20–27/12 2 adultos" (Conforto, cultura + gastronomia).
- `src/test/m18c.test.ts` (novo): closedIds por data, linhas/índices novos, cenário (sem Gulbenkian em 24 e 25/12; R23 PASS; R17 OBRIGATÓRIO ≠ FAIL; os 5 dias de exploração com manhã).
- Motor, validador e arquivos intocáveis: sem alteração. Nenhum assert existente alterado.

## Resultado no roteiro
- 25/12 manhã: Pavilhão do Conhecimento; almoço Zé da Mouraria; tarde miradouros (Senhora do Monte e Graça); jantar O Frade dos Mares.
- 24/12 manhã: bate-volta a Sintra (Palácio da Pena).
- Gulbenkian não aparece em nenhum dia desse cenário.

## Gates
- tsc limpo; vitest 884 passed, 3 skipped, 1 todo, 0 failed; build ok; eslint sem problema.
- Fixture de Lisboa (itineraryEngine.before.json) não mudou.

## Commits
- data(seasonal): Gulbenkian fecha 24–25/12 e 01/01 (Lisboa)
- test(m18c): cenário Lisboa Natal + closedIds da Gulbenkian

## Saída do push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   b0b97cd..96d99ac  main -> main
```

## Deploy
Nenhuma edge function tocada; sem prompt de redeploy. Publish do front é do fundador.
