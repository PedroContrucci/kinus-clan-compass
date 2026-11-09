# RELATORIO-M6D — normalizePlaceName e duplicatas (Chartier)

**Status: PARADA conforme a missão. Código NÃO commitado.** Este commit é só o relatório.

## O que foi feito
`normalizePlaceName` (`src/lib/placeIdentity.ts`) foi alterada na working tree (não commitada):
remove artigo inicial (uma vez: le, la, les, l', el, los, las, o, a, os, as, the) e qualquer trecho entre parênteses.

| Entrada | Saída |
|---|---|
| Le Bouillon Chartier | bouillon chartier |
| Bouillon Chartier (1896) | bouillon chartier |
| L'As du Fallafel | as du fallafel |
| O Pastéis de Nata | pasteis de nata |
| The Ivy | ivy |
| A Brasileira | brasileira |

## Suíte: 4 falhas / 861 passam (3 arquivos)
1. `placeIdentity.test.ts` (guarda de colisões): 16 pares novos além do Cabaña del Primo:
   - Paris: `par-bouillon-chartier`+`paris-chartier`; `par-jardin-acclimatation`+`par3-jardin-acclimatation`
   - Tóquio/Tokyo: kappabashi (`tok-`/`tok3-`); teamlab planets (`tok-`/`tok3-`)
   - Lisboa: `lis-feira-da-ladra`+`lis2-feira-ladra`
   - Maceió: `mcz-feirinha-pajucara-noite`+`mcz-tapioca-pajucara`; `mcz-maria-antonieta-cafe`+`-jantar`
   - Foz: `igu-castelo-libanes-almoco`+`-cafe`; `igu-vo-bertila`+`-jantar`
   - Salvador: `ssa-boteco-do-franca`+`ssa-boteco-franca`
   - Buenos Aires: `bue-feria-mataderos`+`bue2-mataderos`
   - Cartagena: `ctg-bovedas`+`ctg-las-bovedas`
   - Londres: `lon-dishoom`+`lon-dishoom-covent`; `lon-sky-garden`+`lon6-sky-garden`
2. `generatorNoRepeat`: "Coco Bambu … coexistir" — assert procura a string crua `coco bambu (varjota)`; não é duplicata.
3. `generatorNoRepeat`: teto de concentração — Paris d=14 `pink mamma` ×3 (causa não investigada).
4. `itineraryEngine`: snapshot de Tóquio (SEVERO) mudou, pois os pares de Tóquio agora colidem.

Não alterei asserts nem snapshot (a missão mandou parar).

## Pendente (aguarda decisão do fundador)
(a) atualizar asserts/snapshot e registrar os pares como achado de catálogo; (b) restringir a regra (parêntese só quando o resto já bate); (c) descartar.
Teste novo (Chartier iguais + R5 acusa; R5 em refeição é WARN, não FAIL) e tsc/build/eslint ficam para depois da decisão.

## SQL para o kinu-beta (triagem)
Premissas NÃO verificadas: colunas `id`, `city`, `name`, `status = 'published'` em `curated_activities`; extensão `unaccent` disponível (senão, remova a chamada).
```sql
with n as (
  select id, city, name,
    trim(regexp_replace(
      regexp_replace(
        regexp_replace(lower(unaccent(name)), '^(cafe|almoco|jantar):\s*', ''),
        '\([^)]*\)', ' ', 'g'),
      '\s+', ' ', 'g')) as base
  from curated_activities
  where status = 'published'
), k as (
  select *, regexp_replace(base, '^((les|las|los|le|la|el|os|as|the|o|a)\s+|l[''’]\s*)', '') as norm
  from n
)
select a.city, a.norm, a.id as id_a, a.name as name_a, b.id as id_b, b.name as name_b
from k a join k b on a.city = b.city and a.norm = b.norm and a.id < b.id
order by a.city, a.norm;
```

## Push
(preenchido abaixo)
