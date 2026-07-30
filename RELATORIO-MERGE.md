# Relatório de merge — main

## Commit final na main
- **Hash:** `1a58acb93eb0da0825acb7b3f9a1fb1af06aa226`
- **Mensagem:** `chore: add devcontainer (Node 20 + auto-install claude-code)`

## Merge do fix/rio-catalog-shadowing
- ✅ Mergeado na `main` (fast-forward `e34fe02..39220a6`).
- Commit da correção presente na main: `39220a6 fix: remove stale destinationActivities.js shadowing .ts + raise catalog caps`

Topo do histórico:
```
1a58acb chore: add devcontainer (Node 20 + auto-install claude-code)
39220a6 fix: remove stale destinationActivities.js shadowing .ts + raise catalog caps
e34fe02 Updated rioActivities to 62
```

## Push pro origin
- ✅ Concluído: `e34fe02..1a58acb  main -> main`
- `local main` == `origin/main` == `1a58acb93eb0da0825acb7b3f9a1fb1af06aa226`

## .devcontainer/devcontainer.json
```json
{
  "name": "kinus-clan-compass",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "postCreateCommand": "npm install -g @anthropic-ai/claude-code"
}
```
