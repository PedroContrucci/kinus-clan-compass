# RELATÓRIO — B.3.2 (essencial fora do motor; R17 só relatório)

Commit `665bdd9` (feat). Decisão final: aplicar `d4.patch` com piso R13 ≥ 54/61.

## Sync: não rodou
`sync-catalog --apply` abortou sem gravar nada. As 10 praias novas (Rio: arpoador, barra, leblon, vermelha, prainha · Cartagena: boquilla-manglares, castillogrande, islas-rosario, playa-blanca, tierra-bomba) estão `published`, mas com `rating`, `google_rating`, `lat` e `lng` nulos, e o script recusa item sem nota. Por decisão do fundador, entreguei o patch sem as praias. **Pendente no kinu-beta:** nota + coordenada nas 10 e checar se `rio-praia-arpoador` duplica `rio-arpoador`. Depois, sync e nova medição (a fixture de Cartagena vai mudar de novo).

## O que mudou
- **Motor:** `pickActivity` ordena por `[hopKey, interestKey, themeKey, dualKey, priceKey]`, a ordem do B.3. `essentials` e os imports órfãos saíram. R18, lanche, estrada, PDF e Compromissos do B.3.1 ficam.
- **Testes:**
  - "Torre e Jerónimos entram" virou "R17 relata presentes/cabiam" (status, `n/total`, ids ⊂ essenciais).
  - "Caranguejada só em 12/nov" virou "se entra, só na quinta + R18 PASS". O ↻ de sexta continua recusando.
  - Fixture das 4 cidades regravada, com adendo B.3.2.
  - `razaoLines` Σ = 10984 (era 11254).

## Medido (SMOKE_FULL=1)
| | C.4 (`f2069c1`) | B.3.1 | final |
|---|---|---|---|
| R13 | 55/61 | 47/61 | **54/61** |
| R14 · R16 | 12/12 · 63/63 | = | 12/12 · 63/63 |
| R15 | 57/63 | 57/63 | 57/63 |
| R19 | 0 FAIL | 0 FAIL | 504 P / 0 W / 0 F (volta padrão e 02:30) |
| R18 | — | 0 FAIL | 0 FAIL |
| R17 | — | 26 P / 37 W | 0 P / 63 W (só relatório) |

**Causa do 54:** contra o C.4, só Cartagena / praia+família muda de status (7/14 = 50 % → 7/15 = 47 %). O lanche tirou o Portal de los Dulces do slot EXP das 15:00 do D4 e o levou para as 17:30. O slot liberado foi para o Palacio de la Inquisición, porque não há praia publicada em Cartagena. As praias pendentes devem preencher esse slot: não medido.

## Decisão: essencial por dado
Hoje há 169 `essential` + 22 `icon` em 20 cidades (~8 por cidade) contra ~10 slots de passeio por viagem. Na frente do interesse, o essencial tomava quase todos os slots (R13 55 → 47). Antes de o motor voltar a usá-lo, redefinir no catálogo: **icon + no máximo 3 por cidade**. Até lá, o R17 só mede.

## Verificação
Suíte 2× (as duas com smoke): 679 passed, 1 skipped, 1 todo, 57 arquivos. tsc limpo. Build ok. ESLint nos tocados: 2 antes, 2 depois, nenhum novo. Nenhuma edge function tocada: sem redeploy. Publish é do fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   22a10ff..665bdd9  main -> main
```
