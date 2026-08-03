# Relatório de correção — LOTE 6: regressão de hotéis + crença errada sobre o deploy da edge

**Data:** 2026-08-03
**Corrige:** `RELATORIO-LOTE6.md` 1ª versão (commit `2c1f98a`), que continha **dois erros de fato**.

## Commit

- **Hash:** `b5b0c2d`
- **Branch:** `main` (pushed para `origin/main`)
- **Mensagem:** `feat: LOTE 6 + hotels full resync (16 cities) + Fortaleza catch-up`

| Arquivo | Mudança |
|---|---|
| `src/data/curatedHotels.ts` | regerado — 6 cidades / 33 hotéis → **16 cidades / 68 hotéis** |
| `scripts/sync-hotels.ts` | `DEFAULT_CITIES` = as 16 cidades; `CITY_KEY_ALIAS` + validação restaurados |
| `src/data/destinationActivities.ts` | Fortaleza 51 → 56 (catch-up; banco é fonte da verdade) |
| `RELATORIO-DEPLOY-EDGE.md` | aviso de correção no topo + pendências reescritas |
| `RELATORIO-HOTEIS.md` | nota de correção antes da secção do redeploy |

---

# Correção 1 — regressão de hotéis

`curatedHotels.ts` ficou com **6 cidades / 33 hotéis** quando o banco tem **16 / 68**.

## Reconstituição pelo git

| Hash | O quê | Arquivo depois |
|---|---|---|
| `d50c8c8` | piloto H1 — Cartagena + Gramado | 2 cidades / 20 hotéis |
| `f33f7e0` | **onda H2** — todas as cidades published | **12 cidades / 55 hotéis** |
| `4e610de` | **`Revert "feat: hotels H2 wave"`** | **2 cidades / 20 hotéis** ⬅ aqui os 35 hotéis saíram |
| `2c1f98a` | LOTE 6, 1ª passagem (6 cidades) | 6 cidades / 33 hotéis |
| `b5b0c2d` | **resync total, sem argumentos** | **16 cidades / 68 hotéis** ✅ |

**Quem apagou:** o revert `4e610de`, que já era o `HEAD` quando o LOTE 6 começou.

**O que eu errei:** li o revert no log, li o `RELATORIO-HOTEIS.md`, e mesmo assim tratei o arquivo de
2 cidades como linha de base legítima — sincronizei 6 cidades e deixei as outras 10 de fora. Devia
ter estranhado um revert que remove dado publicado e perguntado antes de construir por cima dele.

**Por que era grave:** a edge lê os hotéis do payload que o app manda, e o bundle em produção foi
construído do `f33f7e0`. Com a edge viva (correção 2), os 35 hotéis só continuavam a existir em
produção enquanto ninguém rebuildasse o front a partir do `main`. O repo era a única coisa a
segurá-los.

## O resync

```bash
npx tsx scripts/sync-hotels.ts        # sem argumentos = todas as 16 cidades
```

Lista levantada do banco antes de rodar (`select distinct city ... where status='published'`):

| Cidade (banco) | Chave no app | Hotéis | | Cidade (banco) | Chave no app | Hotéis |
|---|---|---|---|---|---|---|
| Barcelona | Barcelona | 3 | | Nova York | Nova York | 3 |
| Buenos Aires | Buenos Aires | 4 | | Orlando | Orlando | 5 |
| Cartagena | Cartagena | 10 | | Paris | Paris | 3 |
| Dubai | Dubai | 5 | | Porto Seguro | Porto Seguro | 4 |
| Fortaleza | Fortaleza | 2 | | Rio de Janeiro | Rio de Janeiro | 4 |
| Gramado | Gramado | 10 | | **Rome** | **Roma** (alias) | 3 |
| Lisboa | Lisboa | 4 | | Salvador | Salvador | 3 |
| Londres | Londres | 2 | | **Tokyo** | **Tóquio** (alias) | 3 |
| | | | | **Total** | **16 cidades** | **68** |

As 5 cidades curadas sem hotel no banco continuam sem seção de hotel no prompt, como esperado:
Cidade do Cabo, Istambul, Bangkok, Marrakech, Singapura.

## `CITY_KEY_ALIAS` restaurado

O revert `4e610de` levou junto a proteção que a onda H2 tinha criado. Ela é **obrigatória** neste
resync: o banco grava `Rome` e `Tokyo`, o app usa `Roma` e `Tóquio`. Sem tradução, 6 hotéis entrariam
sob chaves que `getCuratedHotels()` nunca encontra — a seção sumiria do prompt em Roma e Tóquio, sem
erro e sem sintoma. Restaurado do `f33f7e0`:

- `CITY_KEY_ALIAS = { Rome: 'Roma', Tokyo: 'Tóquio' }` — consulta pelo nome do banco, escreve o do app;
- **toda** chave gerada é validada contra `CURATED_CITIES`; o script morre em vez de gravar dado morto.

## `DEFAULT_CITIES` = as 16

Passa a ser a lista completa, com o aviso no topo do script: **o `sync-hotels` regrava o arquivo
inteiro**, então o que não estiver na lista (ou nos argumentos) some sem erro. Foi assim que o
arquivo encolheu duas vezes. Um `npx tsx scripts/sync-hotels.ts` sem argumentos agora reconstrói o
arquivo correto e completo. O cabeçalho do arquivo gerado passa a marcar `RUN PARCIAL` quando é
gerado com um subconjunto.

---

# Correção 2 — a edge **está** deployada e a servir

A 1ª versão do relatório repetia que a edge `kinu-ai` nunca fora deployada. **Está errado.**

**Prova em produção (do usuário, ao vivo):** o agente recomendou `Alvear` / `Duhau` / `Home` em
Buenos Aires e os hotéis de Gramado. Esses nomes só existem no catálogo curado e só chegam ao
utilizador pela seção `🏨 HOTÉIS CURADOS`, que é **exclusiva da versão nova** da edge. Se a produção
servisse a versão antiga, o campo `hotels` seria ignorado e nenhum desses nomes apareceria.
Confirmei que os três estão no arquivo restaurado — o dado que o agente citou é este.

**Por que a sonda deu negativo:** ela mira `lnhbamzhturwkhcwiohr`, o ref de `supabase/config.toml:1`
(o mesmo do `.env` local). O `SEM_HOTEIS_NO_CONTEXTO` é evidência sobre **esse ref**, não sobre a
produção — a instância que atende os utilizadores não é essa. Um canário apontado ao alvo errado não
é prova de nada; foi lido como se fosse, e daí saiu a conclusão errada.

**O que muda:**

- ~~"a edge nunca foi deployada"~~ — **retirado**. Está deployada e a funcionar.
- ~~"os hotéis não têm efeito em produção"~~ — **retirado**. Têm, e é por isso que a regressão da
  correção 1 importava.
- **Fica em aberto:** qual é o ref real de produção. Não dá para descobrir daqui — vive no ambiente
  de deploy do Lovable, e o token local não tem acesso a ele. Enquanto não for identificado e
  registado, `config.toml` e `.env` continuam a apontar para um ref que não é o que serve, e
  qualquer sonda ou `functions deploy` futuro vai mirar o alvo errado outra vez.

---

## Validação das duas correções

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |
| Toda cidade com hotel published no banco está no arquivo | ✅ 16/16 |
| Contagem por cidade, arquivo == banco (hotéis) | ✅ 16/16, total 68 == 68 |
| Chaves órfãs no arquivo (cidade que o banco não tem) | ✅ nenhuma |
| Chaves mortas (fora de `CURATED_CITIES`) | ✅ nenhuma |
| Alias: `getCuratedHotels('Roma')` / `('Tóquio')` | ✅ 3 e 3 (chaves `Rome`/`Tokyo` ausentes) |
| Ids duplicados (hotéis) | ✅ nenhum |
| **Prova viva do usuário** — Alvear / Duhau / Home em Buenos Aires | ✅ os 3 no arquivo |
| Cidades sem curadoria de hotel → seção some | ✅ 5 cidades, `null` |
| Fortaleza arquivo == banco | ✅ 56 == 56 |
| Demais cidades de atividades intocadas | ✅ só Fortaleza mudou desde `2c1f98a` |

O lote em si (atividades das 4 cidades, contagens, backlog de write-back) está em
`RELATORIO-LOTE6.md`.
