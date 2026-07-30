# Relatório — sync LOTE 2 (banco → app)

## Contagens por cidade (arquivo == banco)
| Ordem | Cidade | const | Entradas | Validações |
|---|---|---|---|---|
| 1 | Lisboa | `lisboaActivities` | **40** | contagem · ids únicos · type-check ✅ |
| 2 | Rome | `romeActivities` | **43** | contagem · ids únicos · type-check ✅ |
| 3 | Buenos Aires | `buenosAiresActivities` | **42** | contagem · ids únicos · type-check ✅ |
| 4 | Orlando | `orlandoActivities` | **36** | contagem · ids únicos · type-check ✅ |

Total: **161 atividades** sincronizadas. Todas as validações passaram; nenhuma reversão.

## Commit
- **Hash:** `732d13b719654893e488f1f0178be4f37a308073`
- **Mensagem:** `feat: sync Lisboa/Rome/BA/Orlando from curated DB (LOTE 2)`
- **Push:** `e6e62ab..732d13b  main -> main` — `local == origin/main` ✅
- Arquivo alterado: `src/data/destinationActivities.ts` (198 insertions, 1359 deletions)
