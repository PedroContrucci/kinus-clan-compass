# RELATORIO-M5b — "verificado em dd/mm" no Roteiro

## Entregue
- `scripts/sync-catalog.ts`: seleciona `google_checked_at` e gera
  `src/data/generated/catalogVerified.ts` (`CATALOG_VERIFIED_AT: Record<string, string>`),
  por cidade canônica de `CURATED_CITIES`, data máxima entre as atividades published,
  'YYYY-MM-DD'. Cidade sem data não entra. Entra no restore() e no resumo do --apply.
- `src/lib/catalogVerified.ts`: `catalogVerifiedLabel(city, today?)` (puro). Resolve a cidade
  do app via `resolveCity` (aliases). Retorna "Lugares verificados no Google em dd/mm/aaaa"
  ou null; > 60 dias acrescenta " · reconferência em breve".
- `src/pages/Viagens.tsx`: linha `text-xs text-muted-foreground` na aba Roteiro, acima dos
  filtros de categoria, só quando o rótulo não é null.
- `src/test/catalogVerified.test.ts`: recente, limite 60/61 dias, sem data (3 testes).

## Dados reais do sync
- 28/28 cidades com data (ex.: Paris 2026-10-30).
- 1626 -> 1626 entradas, 28 consts. Demais gerados: "sem mudança".
- `supabase/functions/kinu-ai/catalog.ts` regerado idêntico.
- Fixture itineraryEngine.before.json: inalterado (sem saem/entram).

## Verificação
- tsc limpo · vitest 66 arquivos, 773 passed (770 + 3) · build ok · eslint limpo.

## Desvios / notas
- 5 arquivos de código (não 4): sync, helper, UI, teste e o gerado.
- Nenhuma function tocada: sem prompt de redeploy.
- Trava respeitada: sem toque em src/data/ fora de generated/, hotelZones, michelinData, types/trip.

## Commit de código
`8e3b237` feat(catalog): data de verificação por cidade (M5b)

```
To https://github.com/PedroContrucci/kinus-clan-compass
   19c2a3e..8e3b237  main -> main
```
