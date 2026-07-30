# Relatório de correção — catálogo antigo do Rio (Ferro e Farinha)

## Commit
- **Hash:** `39220a60d10cb5f54064889556464574108c4a0a`
- **Branch:** `fix/rio-catalog-shadowing` (a partir de `main`)
- **Mensagem:** `fix: remove stale destinationActivities.js shadowing .ts + raise catalog caps`

## O que mudou (por arquivo)
| Arquivo | Mudança |
|---|---|
| `src/data/destinationActivities.js` | **Removido** (`git rm`) — artefato obsoleto (7097 linhas, 28 atividades do Rio, sem `rio-ferro-farinha`) que sombreava o `.ts` |
| `.gitignore` | `+ src/data/*.js` com comentário explicando o shadowing (Vite resolve `.js` antes de `.ts`) |
| `vite.config.ts` | `+ resolve.extensions: [".mts", ".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"]` — `.ts/.tsx` antes de `.js` |
| `src/contexts/KinuAIContext.tsx` | `data.activities.slice(0, 60)` → `slice(0, 80)` |
| `supabase/functions/kinu-ai/index.ts` | `cat.items.slice(0, 35)` → `slice(0, 80)` |
| `DIAGNOSTICO-PIZZA.md` | Adicionado (diagnóstico completo) |

## Verificações (passo 5)
```
$ grep -c "id: 'rio-" src/data/destinationActivities.ts
62                      # esperado 62 ✅

$ find src/data -name '*.js' | wc -l
0                       # nenhum .js sombreando src/data/ ✅
```

## Próximos passos
- Redeploy da edge function `kinu-ai` (mudança no servidor Supabase).
- Merge de `fix/rio-catalog-shadowing` em `main`.
- Se necessário, limpar cache do Vite: `rm -rf node_modules/.vite`.
