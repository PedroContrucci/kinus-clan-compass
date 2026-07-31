# Relatório — sync LOTE 3 (banco → app)

**Data:** 2026-07-31
**Commit:** `eb21d2a4df88cc0db9bd03b89a2aa976f2a8c754` — `feat: sync Paris 66 + Tokyo 53 from curated DB (LOTE 3)`
**Push:** `6fc8dbe..eb21d2a  main -> main` — `local == origin/main` ✅

## Contagens por cidade (arquivo == banco)

| Ordem | Cidade | const | Antes | Depois | Δ | Validações |
|---|---|---|---|---|---|---|
| 1 | Paris | `parisActivities` | 46 | **66** | +20 | contagem · ids únicos · paridade de ids · type-check ✅ |
| 2 | Tokyo | `tokyoActivities` | 31 | **53** | +22 | contagem · ids únicos · paridade de ids · type-check ✅ |

Total: **119 atividades** sincronizadas (+42 sobre o estado anterior).
Todas as validações passaram; nenhuma reversão.

## Validação

Além das checagens internas do `scripts/sync-catalog.ts` (contagem · ids únicos ·
`tsc -p tsconfig.app.json --noEmit`, com restauração do arquivo em caso de falha), foi feita
uma verificação independente **no nível de ids** — não só de contagem:

```
Paris: banco=66 arquivo=66 diff=IDENTICOS
Tokyo: banco=53 arquivo=53 diff=IDENTICOS
```

Comparação do conjunto ordenado de `id` retornado por
`curated_activities?city=eq.<cidade>&status=eq.published&order=id.asc` contra os ids extraídos
do array no `.ts`. Zero ids duplicados em ambos.

**Escopo do diff confinado aos dois arrays** — o `git diff -U0` produz exatamente dois hunks:

```
@@ -26,524 +26,66 @@ const parisActivities: SuggestedActivity[] = [
@@ -554,354 +96,53 @@ const tokyoActivities: SuggestedActivity[] = [
```

Nenhum dos outros 18 arrays de cidade foi tocado. Arquivo alterado:
`src/data/destinationActivities.ts` (119 insertions, 878 deletions — a queda no total de linhas
vem da conversão do formato multilinha para linha única, padrão do sincronizador).

## Nota sobre as chaves do registry

O registry tem **três** chaves relevantes (`destinationActivities.ts:4906-4919`):

```ts
'Paris':  { cityName: 'Paris',  cityCode: 'CDG', activities: parisActivities },
'Tóquio': { cityName: 'Tóquio', cityCode: 'NRT', activities: tokyoActivities },
'Tokyo':  { cityName: 'Tokyo',  cityCode: 'NRT', activities: tokyoActivities },
```

`'Tóquio'` e `'Tokyo'` apontam para o **mesmo const**. No banco a cidade está gravada como
`Tokyo` (`city=eq.Tóquio` retorna 0 linhas), então o sync foi rodado com `"Tokyo"` — o que
atualiza `tokyoActivities` e, por consequência, atende às duas chaves. Nenhuma ação pendente
para o alias acentuado.

## Comandos executados

```bash
npm run sync-catalog -- "Paris"
npm run sync-catalog -- "Tokyo"
```

## Estado acumulado do catálogo curado

| Lote | Cidades | Atividades |
|---|---|---|
| 1 | Salvador | 61 |
| 2 | Lisboa · Rome · Buenos Aires · Orlando | 161 |
| 3 | **Paris · Tokyo** | **119** |
