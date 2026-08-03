# Relatório — LOTE 6 + resync total de hotéis (16 cidades) + catch-up de Fortaleza

**Data:** 2026-08-03
**Escopo:** atividades de Nova York / Londres / Barcelona / Dubai, resync de **todos** os hotéis
(16 cidades), catch-up de Fortaleza. Puro dado — nenhuma lógica de app, contexto ou edge foi tocada.

> **Este relatório substitui a 1ª versão (commit `2c1f98a`), que continha dois erros de fato.**
> As correções estão nas secções [0](#0-correção-regressão-de-hotéis) e
> [5](#5-correção-a-edge-está-deployada-e-a-servir).

## Resumo

| | Antes | Depois | Δ |
|---|---|---|---|
| Atividades — 4 cidades do lote | 115 | **169** | +54 |
| Atividades — Fortaleza | 51 | **56** | +5 |
| Atividades — arquivo inteiro | 917 | **976** | +59 |
| **Hotéis** | **20 (2 cidades)** | **68 (16 cidades)** | **+48 / +14 cidades** |

## 0) CORREÇÃO: regressão de hotéis

O `curatedHotels.ts` ficou com 6 cidades / 33 hotéis quando devia ter 16 / 68. Reconstituição pelo
git, para que a causa fique registada:

| Hash | O quê | Arquivo depois |
|---|---|---|
| `d50c8c8` | piloto H1 — Cartagena + Gramado | 2 cidades / 20 hotéis |
| `f33f7e0` | **onda H2** — todas as cidades published | **12 cidades / 55 hotéis** |
| `4e610de` | **`Revert "feat: hotels H2 wave"`** | **2 cidades / 20 hotéis** ⬅ aqui os 35 hotéis saíram |
| `2c1f98a` | LOTE 6, 1ª passagem (6 cidades) | 6 cidades / 33 hotéis |
| *este* | resync total, sem argumentos | **16 cidades / 68 hotéis** ✅ |

**Quem apagou:** o revert `4e610de`, que já era o `HEAD` quando o LOTE 6 começou. **O que eu errei:**
li o revert no log, li o `RELATORIO-HOTEIS.md`, e mesmo assim tratei o arquivo de 2 cidades como
linha de base legítima — sincronizei 6 cidades e deixei as outras 10 de fora. Devia ter estranhado
um revert que remove dado publicado e perguntado antes de construir por cima dele.

**Por que era grave:** a edge lê os hotéis do payload que o app manda, e o bundle em produção foi
construído do `f33f7e0`. Com a edge viva (secção 5), os 35 hotéis só continuavam a existir em
produção enquanto ninguém rebuildasse o front a partir do `main`. O repo era a única coisa a
segurá-los.

### O resync

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

### `CITY_KEY_ALIAS` restaurado

O revert `4e610de` levou junto a proteção que a onda H2 tinha criado. Ela é **obrigatória** neste
resync: o banco grava `Rome` e `Tokyo`, o app usa `Roma` e `Tóquio`. Sem tradução, 6 hotéis entrariam
sob chaves que `getCuratedHotels()` nunca encontra — a seção sumiria do prompt em Roma e Tóquio, sem
erro e sem sintoma. Restaurado do `f33f7e0`:

- `CITY_KEY_ALIAS = { Rome: 'Roma', Tokyo: 'Tóquio' }` — consulta pelo nome do banco, escreve o do app;
- **toda** chave gerada é validada contra `CURATED_CITIES`; o script morre em vez de gravar dado morto.

### `DEFAULT_CITIES` = as 16

Passa a ser a lista completa, com o aviso no topo do script: **o `sync-hotels` regrava o arquivo
inteiro**, então o que não estiver na lista (ou nos argumentos) some sem erro. Foi assim que o
arquivo encolheu duas vezes. Um `npx tsx scripts/sync-hotels.ts` sem argumentos agora reconstrói o
arquivo correto e completo. O cabeçalho do arquivo gerado passa a marcar `RUN PARCIAL` quando é
gerado com um subconjunto.

## 1) Chaves — nada a adicionar em `CURATED_CITIES`

As 4 cidades do lote **já estavam** em `src/lib/curatedCities.ts` e no registry
`destinationActivities`, com as consts já existentes. Os `city` do banco batem exatamente com o nome
do app nas quatro (`Nova York`, `Londres`, `Barcelona`, `Dubai`) — nenhum alias foi preciso para elas.

## 2) Atividades — `sync-catalog`

| Cidade | Antes | Depois (= banco) |
|---|---|---|
| Nova York | 29 | **43** |
| Londres | 29 | **42** |
| Barcelona | 29 | **43** |
| Dubai | 28 | **41** |
| **Fortaleza** (catch-up) | 51 | **56** |

Fortaleza estava com 5 atividades a menos que o banco. Banco é fonte da verdade, então foi
sincronizada. O diff é grande em linhas sem perda de dado: o `sync-catalog` grava uma entrada por
linha e os arrays antigos eram multi-linha. Comparei as contagens de **todas** as cidades contra o
commit anterior: só os arrays sincronizados mudaram, os demais estão idênticos.

## 3) Validação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |
| Toda cidade com hotel published no banco está no arquivo | ✅ 16/16 |
| Contagem por cidade, arquivo == banco (hotéis) | ✅ 16/16, total 68 == 68 |
| Contagem arquivo == banco (atividades sincronizadas) | ✅ 43/42/43/41/56 |
| Chaves órfãs no arquivo (cidade que o banco não tem) | ✅ nenhuma |
| Chaves mortas (fora de `CURATED_CITIES`) | ✅ nenhuma |
| Alias: `getCuratedHotels('Roma')` / `('Tóquio')` | ✅ 3 e 3 (chaves `Rome`/`Tokyo` ausentes) |
| Ids duplicados (atividades e hotéis) | ✅ nenhum |
| **Prova viva do usuário** — Alvear / Duhau / Home em Buenos Aires | ✅ os 3 no arquivo |
| Cidades sem curadoria de hotel → seção some | ✅ 5 cidades, `null` |

## 4) Backlog — write-back, decisão futura

5 cidades onde o **app tem itens que o banco não tem**. **Não sincronizadas de propósito:** um
`sync-catalog` apagaria esses itens do app. É write-back (app → banco), decisão sua.

| Cidade | App | Banco | Δ |
|---|---|---|---|
| Bangkok | 29 | 26 | app +3 |
| Cidade do Cabo | 28 | 25 | app +3 |
| Singapura | 29 | 26 | app +3 |
| Istambul | 28 | 26 | app +2 |
| Marrakech | 28 | 26 | app +2 |

## 5) CORREÇÃO: a edge **está** deployada e a servir

A versão anterior deste relatório repetia que a edge `kinu-ai` nunca fora deployada. **Está errado.**

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
  secção 0 importava.
- **Fica em aberto:** qual é o ref real de produção. Não dá para descobrir daqui — vive no ambiente
  de deploy do Lovable, e o token local não tem acesso a ele. Enquanto não for identificado e
  registado, `config.toml` e `.env` continuam a apontar para um ref que não é o que serve, e
  qualquer sonda ou `functions deploy` futuro vai mirar o alvo errado outra vez.

Detalhe em `RELATORIO-DEPLOY-EDGE.md`, corrigido na mesma passagem.
