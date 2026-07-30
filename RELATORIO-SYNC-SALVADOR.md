# Relatório — sync Salvador (banco → app)

## Resultado da execução
- Comando: `npm run sync-catalog -- "Salvador"`
- Cidade → const: `Salvador` → `salvadorActivities`
- Entradas: **61 (arquivo) == 61 (banco)** ✅
- Validações: contagem OK · ids únicos OK · `tsc -p tsconfig.app.json --noEmit` OK
- Diff em `src/data/destinationActivities.ts`: `61 insertions, 322 deletions`
  (formato multi-linha antigo → 61 entradas compactas do banco)
- Primeiras: `ssa-acaraje-cira`, `ssa-acaraje-dinha` · Últimas: `ssa-terca-da-bencao`, `ssa-yemanja`

## Commit
- **Hash:** `e6e62abd33b86bf9f8ffe074938cb5208d2c2a65`
- **Mensagem:** `feat: sync-catalog script + Salvador 61 from curated DB`
- **Push:** `1a58acb..e6e62ab  main -> main` — `local == origin/main` ✅
- Arquivos: `scripts/sync-catalog.ts`, `.env.sync.example`, `.gitignore`, `package.json`, `package-lock.json`, `src/data/destinationActivities.ts` (`.env.sync` fora do commit, git-ignorado)

## Como usar (3 linhas)
```bash
cp .env.sync.example .env.sync   # preencha KINU_BETA_URL e KINU_BETA_SERVICE_KEY
npm run sync-catalog -- "Salvador"        # ou qualquer chave do registry (ex.: "Rio de Janeiro")
# valida (contagem/ids/type-check) e regrava só o array daquela cidade; reverte se falhar
```
