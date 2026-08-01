# Relatório — Write-back LOTE 5 (banco == app)

**Data:** 2026-08-01 · **Escopo:** fechar o loop banco↔app das pendências do [RELATORIO-LOTE5.md](RELATORIO-LOTE5.md)

1. **Write-back de acentuação** — PATCH REST em `curated_activities` levando `name`/`neighborhood`/`tips` do `.ts` para o banco: **13 linhas alteradas**, 14 já idênticas, das 27 novas (`gra5-`/`ps5-`). Backup das 27 linhas tirado antes de qualquer escrita.
2. **`ps5-quadrado`** — `'jantar nos restos'` → `'jantar nos restaurantes'` (banco + `.ts`).
3. **Notas internas** — tip `'Curadores: ...'` removida de `ps5-caraiva-almoco` e `ps5-tres-cabanas` e **anexada ao `notes`** das mesmas linhas, preservando o conteúdo anterior e o separador ` · ` já usado no campo. Restam **0** ocorrências de `Curadores:` no `.ts`.
4. **Prova** — `npm run sync-catalog -- "Gramado"` e `-- "Porto Seguro"` rodados após as escritas: **`git diff` vazio (0 linhas)**. O sync regrava o array inteiro a partir do banco, então diff vazio == banco e app idênticos.

| Verificação | Resultado |
|---|---|
| `git diff` pós-sync das 2 cidades | **0 linhas** ✅ |
| Paridade de ids contra o banco | `Gramado 40==40` · `Porto Seguro 38==38` — IDENTICOS ✅ |
| `npx tsc -p tsconfig.app.json --noEmit` · `npx vitest run` | ✅ OK · ✅ 1/1 |

> As 21 correções de acento agora vivem no banco — o próximo sync **não** as reverte mais. Os `notes` continuam fora do `select` do `sync-catalog`, então as instruções de curadoria não vazam para o app.
