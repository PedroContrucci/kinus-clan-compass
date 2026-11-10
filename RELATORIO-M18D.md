# RELATORIO M18d — feriado duro: atração paga só entra se confirmada aberta (FECHADO)

## Resultado
- Em 25/12 e 01/01 (Tóquio: só 01/01), manhã/tarde só aceita atividade livre ou id em `OPEN_CONFIRMED` (vazio por ora). O resto é tratado como fechado pelo mesmo caminho dos `closedIds` (reserva M19c, R17, R23).
- Gates: `tsc` limpo; vitest 893 passed, 0 failed, 3 skipped, 1 todo; build ok. Fixture `itineraryEngine.before.json` não mudou.
- ESLint: 2 erros `any` em `itineraryEngine.ts:722`, anteriores à missão (meu diff no motor: linhas 33, 643, 814). Nenhum problema novo.

## O que entrou
- `src/data/openIds.ts` (novo): `HARD_HOLIDAYS` (Paris, Lisboa, Porto, Roma, Rio de Janeiro, Salvador, Fortaleza = 25/12 e 01/01; Tóquio = 01/01), `HARD_HOLIDAY_ALIASES` (`Rome`→`Roma`, `Tokyo`→`Tóquio`), `OPEN_CONFIRMED` {ids, source, verifiedAt} vazio nas 8 cidades.
- `src/lib/seasonal.ts`: `unavailableIdsOnDate` = `closedIdsOnDate` ∪ regra; `closedIdsOnDate` intocada. Cidade/data fora da tabela = exatamente `closedIdsOnDate`.
- 5 chamadas trocadas: `itineraryEngine.ts:643`, `:814`; `itineraryValidator.ts:866`, `:926`, `:971`. Mensagem do R23: "fechado nesta data" × "não confirmado aberto no feriado".
- `seasonalNotes.ts` (só adição): Castelo de São Jorge fechado 24 e 25/12 (idx 3), 31/12 (idx 4), 01/01 (jan, idx 2). Fonte: egeac.pt/espacos/sao-jorge-castle.
- Cenários de smoke: "Roma Réveillon 28/12–02/01 2 adultos", "Tóquio Réveillon 28/12–03/01 2 adultos". Testes: `m18d.test.ts` (9, novo).

## Critério "livre" (D1)
`estimatedCostBRL === 0` E sem styleTag `shopping` E id sem `outlet`/`mall`. No STEP1 contei "shopping" na linha toda; a regra usa a styleTag (mais estrita). Contagens: Paris 11 livres, Lisboa 7, Roma 10, Tóquio 4, Porto 11, Salvador 13, Fortaleza 5, Rio 10.

## Assert alterado (autorizado, só o valor esperado) — `m18c.test.ts`
- Antigo: `closedIds` Lisboa dez `{0,2}`, jan `{0,1}`.
- Novo: dez `{0,2,3,4}` (3 e 4 = `lis-castelo-sao-jorge`), jan `{0,1,2}`; mais asserts das 3 linhas novas de `closures`.
- Motivo: a D5 acrescenta as chaves do Castelo; sem isso o `toEqual` não pode passar.

## Nomes de cidade
Missão dizia `Rome`/`Tokyo`; o app usa `Roma`/`Tóquio`. Chaves = nomes do app, apelidos normalizados (autorizado).

## Cenários no feriado duro (manhã / tarde)
- Lisboa 25/12: Alfama e Portas do Sol / Miradouros (Senhora do Monte e Graça). 24/12: Sintra. Castelo fora de 24 e 25/12.
- Roma 01/01: Campo de Fiori / Aventino. Roma 31/12: Vaticano / Trevi.
- Tóquio 01/01: Senso-ji / "Tarde livre — explore por conta" (`thin('feriado')`; aceito pelo fundador). 25/12 em Tóquio não aplica a regra (testado).
- Paris Natal 2+2, 25/12: Bois de Vincennes / Galerie Vivienne; Versalhes em 24/12. Paris gastrô: Carnavalet / Galerie Vivienne.
- Só Tóquio acusou `thin('feriado')`. Louvre em 23, 24 ou 26; R17 OBRIGATÓRIO ≠ FAIL.

## Anexo
`RELATORIO-M18D-ANEXO.md`: por cidade, (a) pagas (id · nome · período · custo · styleTags) e (b) livres — insumo para curar `OPEN_CONFIRMED`.

## Commits
- b4e83ab data(seasonal): openIds.ts (feriado duro por cidade) + Castelo de São Jorge 24, 25, 31/12 e 01/01
- 40577a9 feat(m18d): feriado duro — atração paga só entra se confirmada aberta

## Saída do push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   21d565f..40577a9  main -> main
```

## Deploy
Nenhuma edge function tocada; sem prompt de redeploy. Publish do front é do fundador. `/cost`: comando do fundador (não executável pelo agente).
