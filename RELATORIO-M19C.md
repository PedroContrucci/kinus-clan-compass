# RELATORIO-M19C — item fechado no dia troca de dia

Commit de código: `1d59ee1` feat(engine) — 4 arquivos de código + teste novo + fixture (só Lisboa).

## O que mudou
- **B1 reserva** (`itineraryEngine.ts`): pré-passe gera o dia ideal sem dia da semana (`_dry`, param final opcional). Ícone, essencial ou âncora de bate-volta que caiu em dia fechado fica reservado para o dia de exploração aberto mais próximo (o anterior; sem anterior, o seguinte) e vai à frente da fila. Não fura o `force` nem o `daytripOk`.
- **B1' force**: vale no último dia de exploração em que algum ícone abre (`forceN`), não por posição.
- **B3 R17 ÍCONE** (`validateIcons`): FAIL se o ícone abre na estadia e não aparece, com os dias ("abriria: dia 2 (qua)…"). PASS com nota se fecha em toda a estadia. `smokeMatrix` ganhou `r17icon`, só log. `validateEssentials` não conta mais dia fechado como "cabia" (asserts de `b31` intactos).
- **B2 fora**, por decisão. Não implementei o `thin('fechado-no-dia')` previsto no STEP1: reserva sem dia aberto some em silêncio, como hoje.

## Versalhes e Jerónimos, antes/depois
| Caso | Antes do M19a | HEAD (M19b) | Agora |
|---|---|---|---|
| Paris 10–15/12, Conforto, ida 22:00, `culture` — Versalhes | D5 seg 14/12 (fechado) | ausente | **D4 dom 13/12** |
| Lisboa 10–17/11 (fixture) — Jerónimos | D7 seg 16/11 (fechado) | ausente | **D6 dom 15/11** |

## Diff da fixture de Lisboa (só ela mudou; Cartagena, Tóquio e Fortaleza byte a byte iguais)
```
- D6 lis2-sintra, lis-pap-acorda
+ D6 lis-jeronimos, lis-ponto-final, lis-jardim-estrela, lis-pap-acorda
- D7 lis-gulbenkian, lis-ze-da-mouraria, lis2-maat, lis2-sol-e-pesca
+ D7 lis2-sintra, lis2-sol-e-pesca
- D8 …, lis-jardim-estrela
+ D8 …, lis-monsanto-montes-claros
```
O breakdown de Lisboa também mudou (consequência dos itens trocados). Sintra foi para D7 (segunda, aberta).

## Testes
`src/test/m19c.test.ts` (8): Paris/Versalhes ≠ seg com R18 PASS; Lisboa/Jerónimos ≠ seg; sintético com `vi.mock` (essencial aberto só na sexta é escalado na sexta); Torre de Belém com último dia de exploração fechado; `validateIcons` (FAIL com dias, PASS, PASS com nota, roteiro real).
Limite honesto: o teste da Torre é guarda de regressão. Nenhum dado real reproduz o bug do `force` posicional (0 de 840 viagens a Lisboa sem a Torre).
Verificação: vitest 793 passam (68 arquivos, 3 skipped, 1 todo), tsc limpo, build ok, eslint sem problema novo (2 `no-explicit-any` já existentes, só mudaram de linha).

## SQL — Versalhes como essential no kinu-beta (rodar no kinu-beta; depois `scripts/sync-catalog.ts --apply`)
```sql
update curated_activities set landmark_tier = 'essential' where id = 'par3-versailles';
select id, city, landmark_tier from curated_activities where id = 'par3-versailles';
```
A coluna é `landmark_tier` (valores `icon|essential|hidden_gem`). Efeito esperado: Versalhes entra no tierPlan e na reserva, mas segue limitado pela cota de bate-volta (⌊n/3⌋). Rodar o sync gera nova fixture/tiers; conferir os testes de Paris depois.

## Observações fora do escopo
- **Beach Park** (ícone de Fortaleza, tarde de 5 h) não entra em nenhuma das 840 viagens a Fortaleza que testei, nem no HEAD: a tarde recusa item ≥ 4 h. O R17 ÍCONE vai acusar FAIL em toda viagem a Fortaleza. Merece missão própria.
- **Giverny** entra em dezembro, mas o jardim de Monet fecha de nov a mar. Falta dado sazonal.
- Não há edge function tocada: sem prompt de redeploy.

## Saída do push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   5f631f5..1d59ee1  main -> main
```

## Adendo — saída do push do relatório (M19c)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   1d59ee1..2af0971  main -> main
```
