# Relatório — LOTE 6 + resync total de hotéis (16 cidades) + catch-up de Fortaleza

**Data:** 2026-08-03
**Escopo:** atividades de Nova York / Londres / Barcelona / Dubai, resync de **todos** os hotéis
(16 cidades), catch-up de Fortaleza. Puro dado — nenhuma lógica de app, contexto ou edge foi tocada.

> **A 1ª versão deste relatório (commit `2c1f98a`) continha dois erros de fato** — regressão de
> hotéis e uma crença errada sobre o deploy da edge. Ambos corrigidos em **`RELATORIO-CORRECAO-LOTE6.md`**,
> que é onde está o detalhe completo. Aqui ficam só os resumos (secções 0 e 5).

## Resumo

| | Antes | Depois | Δ |
|---|---|---|---|
| Atividades — 4 cidades do lote | 115 | **169** | +54 |
| Atividades — Fortaleza | 51 | **56** | +5 |
| Atividades — arquivo inteiro | 917 | **976** | +59 |
| **Hotéis** | **20 (2 cidades)** | **68 (16 cidades)** | **+48 / +14 cidades** |

## 0) Correção — regressão de hotéis (resumo)

O `curatedHotels.ts` ficou com 6 cidades / 33 hotéis quando o banco tem 16 / 68. O revert
`4e610de` (que desfez a onda H2, `f33f7e0`) já era o `HEAD` quando o lote começou; sincronizei
6 cidades por cima e não restaurei as outras 10. Corrigido: resync total, **68 hotéis em 16
cidades**, com o `CITY_KEY_ALIAS` (`Rome`→`Roma`, `Tokyo`→`Tóquio`) restaurado e
`DEFAULT_CITIES` = a lista completa.

📄 **Detalhe completo, causa e reconstituição pelo git: `RELATORIO-CORRECAO-LOTE6.md` — Correção 1.**

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

## 5) Correção — a edge **está** deployada (resumo)

A 1ª versão dizia que a edge `kinu-ai` nunca fora deployada. **Errado.** O agente recomendou
`Alvear` / `Duhau` / `Home` em Buenos Aires e os hotéis de Gramado em produção — nomes que só a
versão nova produz. A sonda que dava `SEM_HOTEIS_NO_CONTEXTO` mira `lnhbamzhturwkhcwiohr`, o ref
de `config.toml`, que não é quem serve os utilizadores.

**Fica em aberto:** identificar o ref real de produção. Sem ele, `config.toml` e `.env` apontam
para o alvo errado e a próxima sonda ou `functions deploy` erra outra vez.

📄 **Detalhe completo: `RELATORIO-CORRECAO-LOTE6.md` — Correção 2.** Ver também a correção no topo
de `RELATORIO-DEPLOY-EDGE.md` e `RELATORIO-HOTEIS.md`.
