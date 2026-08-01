# Relatório — Gramado + Porto Seguro (LOTE 5)

**Data:** 2026-08-01
**Escopo:** sync do catálogo curado (banco → app) + passe de acentuação nas entradas novas

## Contagem

| Cidade | const | Antes | Depois | Novas (`gra5-`/`ps5-`) | Removidas |
|---|---|---|---|---|---|
| Gramado | `gramadoActivities` | 29 | **40** | 13 | 2 |
| Porto Seguro | `portoSeguroActivities` | 28 | **38** | 14 | 4 |

Ambas as cidades **já tinham suporte completo** (registry, `cityCoordinates`, `CURATED_CITIES`,
`destinationDocs`, `offersLinks`) — diferente de Cartagena no LOTE 4, nenhum andaime foi necessário.

### Ids removidos (sumiram do banco — deduplicação a montante)

São duplicatas superadas pelas entradas novas, não perda de conteúdo:

| Removido | Superado por |
|---|---|
| `gra-canela-caracol` | `gra5-caracol` |
| `gra-snowland` | `gra5-snowland` |
| `pse-recife-de-fora` | `ps5-recife-fora` |
| `pse-arraial-dajuda` | `ps5-arraial-centro` |
| `pse-trancoso` | `ps5-quadrado` |
| `pse-vila-mucuge` | `ps5-arraial-centro` |

### Distribuição por categoria

| Cidade | `breakfast` | `morning` | `lunch` | `afternoon` | `dinner` | `night` |
|---|---|---|---|---|---|---|
| Gramado | 4 | 8 | 7 | 12 | 7 | 2 |
| Porto Seguro | 3 | 10 | 8 | 9 | 7 | 1 |

As 6 seções do prompt agrupado estão cobertas nas duas cidades; nada cai em `📍 OUTROS`.

## Passe de acentuação

Varredura nas **27 entradas novas** (`name`, `neighborhood`, `tips` — os campos que chegam ao
usuário). **21 correções em 13 entradas:**

| Entrada | Correção |
|---|---|
| `gra5-choco-show` | `fabrica` → **fábrica** (no `name`) |
| `gra5-jolimont` | `Degustacao` → **Degustação** |
| `gra5-natal-luz` | `antecedencia` → **antecedência** |
| `ps5-caraiva-almoco` | `a beira` → **à beira** (crase) |
| `ps5-ecoparque` | `pe na praia` → **pé na praia** |
| `ps5-espelho` | `Va em MARE BAIXA` → **Vá em MARÉ BAIXA** |
| `ps5-jaqueira` | `Vivencia` → **Vivência** · `historia` → **história** · `experiencia` → **experiência** |
| `ps5-mercado` | `cupuacu` → **cupuaçu** |
| `ps5-pitinga` | `Falesias` → **Falésias** |
| `ps5-quadrado` | `Fim de tarde e mágico` → **é mágico** · `proprio` → **próprio** |
| `ps5-recife-fora` | `saida` → **saída** · `So em maré baixa` → **Só** |
| `ps5-toa-toa` | `axe` → **axé** · `historicas` → **históricas** · `danca` → **dança** · `animacao` → **animação** |
| `ps5-tres-cabanas` | `classica` → **clássica** |

Re-varredura pós-correção: **0 pendências nas 27 entradas novas**.

> `cacau` (em `ps5-mercado` e `ps5-sorvete-quadrado`) apareceu na varredura mas está **correto** —
> não leva acento. Nenhuma alteração.

## Validação

| Verificação | Resultado |
|---|---|
| Paridade de ids contra o banco — Gramado | `banco=40 arquivo=40 diff=IDENTICOS` ✅ |
| Paridade de ids contra o banco — Porto Seguro | `banco=38 arquivo=38 diff=IDENTICOS` ✅ |
| ids únicos / campos obrigatórios (smoke em runtime) | ✅ nas duas cidades |
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |

## Pendências para os curadores (⚠️ não corrigidas — fora do escopo do passe de acentuação)

Três problemas de **conteúdo**, não de acento. Como o banco é a fonte da verdade e o próximo sync
sobrescreve o `.ts`, o certo é corrigir **no banco**:

1. **Notas internas vazando para o usuário.** Dois `tips` são recados de curadoria, e são
   renderizados como dica normal:
   - `ps5-caraiva-almoco` → `'Curadores: cravar o restaurante favorito'`
   - `ps5-tres-cabanas` → `'Curadores: indicar a cabana favorita'`
2. **`ps5-quadrado`** → `'jantar nos restos do próprio Quadrado'`. `restos` parece truncamento de
   **restaurantes**; do jeito que está, lê como "sobras".
3. **Divergência banco ↔ app.** As 21 correções de acento vivem só no `.ts`. **O próximo
   `sync-catalog` para essas duas cidades reverte todas** — o script regrava o array inteiro a
   partir do banco. Aplicar os acentos no `curated_activities` fecha o loop.
