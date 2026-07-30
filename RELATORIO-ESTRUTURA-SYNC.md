# Estrutura de sync do catálogo (banco → app)

Round-trip da fonte de verdade (`curated_activities` no Supabase kinu-beta) para os
arrays em `src/data/destinationActivities.ts`.

## Arquivos

| Arquivo | Status | Descrição |
|---|---|---|
| `scripts/sync-catalog.ts` | **novo** | Sincronizador: lê o banco por cidade e regrava o array TS da cidade |
| `.env.sync.example` | **novo** | Template das credenciais (versionado) |
| `.env.sync` | **não versionado** | Credenciais reais (git-ignorado) — você cria a partir do `.example` |
| `.gitignore` | editado | `+ .env.sync` |
| `package.json` | editado | `+ devDependency tsx ^4.19.2` e script `"sync-catalog"` |

> `tsx` já foi instalado (`node_modules`); `package-lock.json` foi atualizado.

## Configuração (uma vez)

```bash
cp .env.sync.example .env.sync
# edite .env.sync e preencha:
#   KINU_BETA_URL=https://<projeto>.supabase.co
#   KINU_BETA_SERVICE_KEY=<service role key>
```

`.env.sync` é git-ignorado — nunca é commitado.

## Uso

```bash
npm run sync-catalog -- "Salvador"
# ou
npx tsx scripts/sync-catalog.ts "Salvador"
```

O argumento é a **chave da cidade no registry** `destinationActivities`
(ex.: `"Salvador"`, `"Rio de Janeiro"`, `"Tóquio"`).

## O que o script faz

1. Lê `KINU_BETA_URL` / `KINU_BETA_SERVICE_KEY` de `.env.sync`.
2. Consulta via REST (PostgREST):
   `curated_activities?city=eq.<cidade>&status=eq.published&order=id.asc`.
3. Resolve a `const` da cidade lendo o registry (`'<cidade>': { … activities: <const> }`).
4. Substitui o corpo daquele array pelas entradas do banco, escapando `'` `\` `\n` `\r`
   para literais TS. Mapeia colunas → campos:
   `estimated_cost_brl → estimatedCostBRL`, `duration_hours → durationHours`,
   `style_tags → styleTags`.
5. **Valida**: contagem no arquivo == contagem no banco · ids únicos ·
   `tsc -p tsconfig.app.json --noEmit`. **Se qualquer verificação falhar, restaura o
   arquivo original** e sai com erro.
6. Imprime resumo: cidade, const, N entradas, primeiras 2 e últimas 2.

## Segurança e comportamento

- A `service key` fica só em `.env.sync` (ignorado). O `.example` vai vazio.
- Só importa atividades com `status='published'`.
- Alteração cirúrgica: mexe apenas no array da cidade informada; o resto do arquivo
  fica intacto. Em falha de validação, reverte tudo.

## Ainda pendente (por você)

- Preencher `.env.sync` com as credenciais.
- Rodar o sync para as cidades desejadas.
- Commitar as mudanças (script, `.env.sync.example`, `.gitignore`, `package.json`,
  `package-lock.json`) — ainda **não** commitado.
