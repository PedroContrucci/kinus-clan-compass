# Relatório — LOTE 6: Nova York / Londres / Barcelona / Dubai

**Data:** 2026-08-03
**Escopo:** `sync-catalog` das 4 cidades + `sync-hotels` incluindo as mesmas 4. Puro dado — nenhuma
lógica de app, contexto ou edge function foi tocada.

## Resumo

| | Antes | Depois | Δ |
|---|---|---|---|
| Atividades (4 cidades do lote) | 115 | **169** | +54 |
| Atividades (arquivo inteiro) | 917 | **971** | +54 |
| Hotéis | 20 (2 cidades) | **33 (6 cidades)** | +13 / +4 cidades |

## 1) Chaves — nada a adicionar em `CURATED_CITIES`

As 4 cidades **já estavam** em `src/lib/curatedCities.ts` e no registry `destinationActivities`,
com as consts já existentes. Nenhuma entrada nova foi criada:

| Cidade | Em `CURATED_CITIES` | Const no registry | `city` no banco |
|---|---|---|---|
| Nova York | ✅ já estava | `novaYorkActivities` | `Nova York` ✅ bate |
| Londres | ✅ já estava | `londresActivities` | `Londres` ✅ bate |
| Barcelona | ✅ já estava | `barcelonaActivities` | `Barcelona` ✅ bate |
| Dubai | ✅ já estava | `dubaiActivities` | `Dubai` ✅ bate |

**Verificação explícita do risco de chave morta** (o achado da onda H2: o banco grava `Rome`/`Tokyo`
enquanto o app usa `Roma`/`Tóquio`). Levantei os `city` distintos das duas tabelas antes de rodar
qualquer coisa: as 4 cidades deste lote gravam exatamente o nome que o app usa. **Só `Rome` e `Tokyo`
divergem, e nenhuma das duas entra neste lote** — nenhum apelido/tradução foi preciso.

## 2) Atividades — `sync-catalog`

```bash
npx tsx scripts/sync-catalog.ts "Nova York"   # 43
npx tsx scripts/sync-catalog.ts "Londres"     # 42
npx tsx scripts/sync-catalog.ts "Barcelona"   # 43
npx tsx scripts/sync-catalog.ts "Dubai"       # 41
```

| Cidade | Antes | Depois (= banco) |
|---|---|---|
| Nova York | 29 | **43** |
| Londres | 29 | **42** |
| Barcelona | 29 | **43** |
| Dubai | 28 | **41** |

O diff é grande em linhas (−1274/+195) **sem que isso signifique perda de dado**: o `sync-catalog`
grava uma entrada por linha, e os arrays antigos estavam em formato multi-linha. Conferi
cidade a cidade, comparando o `HEAD` com a árvore de trabalho: **exatamente 4 arrays mudaram de
contagem; os outros 17 estão byte a byte idênticos.**

## 3) Hotéis — `sync-hotels`

O `sync-hotels` **regrava o arquivo inteiro**, então as cidades do piloto H1 tiveram de ser
repassadas junto — senão sairiam do arquivo sem erro nenhum:

```bash
npx tsx scripts/sync-hotels.ts Cartagena Gramado "Nova York" Londres Barcelona Dubai
```

| Cidade | Hotéis | Personas cobertas | Tiers |
|---|---|---|---|
| Cartagena (H1) | 10 | family, couple, solo | budget → resort |
| Gramado (H1) | 10 | family, couple, solo | budget → resort |
| **Nova York** | **3** | family, couple | mid, upscale |
| **Londres** | **2** | family, couple | budget, upscale |
| **Barcelona** | **3** | family, couple, solo | mid, upscale |
| **Dubai** | **5** | family, couple, solo | budget, resort, upscale |
| **Total** | **33** | | |

### Uma mudança de código no `sync-hotels.ts` (única fora de dado)

`DEFAULT_CITIES` passou de `['Cartagena', 'Gramado']` para as 6 cidades. Sem isso, um
`npx tsx scripts/sync-hotels.ts` **sem argumentos** regravaria o arquivo só com as 2 do piloto e
apagaria as 4 novas — sem erro, sem sintoma, exatamente o modo de falha silenciosa que já mordeu
este projeto. A const agora é a lista real de cidades com curadoria de hotel.

## 4) Validação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK (roda também dentro de cada sync) |
| `npx vitest run` | ✅ 1/1 |
| Contagem arquivo == banco, 4 cidades (atividades) | ✅ 43/42/43/41 |
| Contagem arquivo == banco, 6 cidades (hotéis) | ✅ 10/10/3/2/3/5 |
| Toda chave de `curatedHotels` existe em `CURATED_CITIES` | ✅ 6/6 (nenhuma chave morta) |
| Ids duplicados (atividades e hotéis) | ✅ nenhum |
| Cidade sem curadoria de hotel → `getCuratedHotels('Paris')` | ✅ `null` (seção some do prompt) |
| Demais cidades intocadas | ✅ 17/17 idênticas |

## 5) Produção — o de sempre

Este lote é **só dado do app**: `KinuAIContext` e `supabase/functions/kinu-ai/index.ts` não foram
tocados. As atividades novas chegam ao utilizador com o deploy normal do front (Lovable).

⚠️ **Os hotéis continuam sem efeito em produção.** A seção `🏨 HOTÉIS CURADOS` vive na edge
`kinu-ai`, que **nunca chegou a ser deployada** — bloqueio de token descrito em
`RELATORIO-DEPLOY-EDGE.md`. Até destravar, o app manda `hotels` no payload e a função antiga ignora
o campo, sem erro e sem sintoma visível. As 4 cidades novas de hotel entram nesse mesmo limbo.

## 6) Achado colateral — 6 cidades fora de sync com o banco

Ao comparar contagens do arquivo inteiro contra o banco, apareceram cidades **fora deste lote** cujo
app diverge do banco. Não mexi nelas (fora de escopo), mas ficam registadas:

| Cidade | App | Banco | Δ |
|---|---|---|---|
| Fortaleza | 51 | 56 | banco tem **+5** |
| Bangkok | 29 | 26 | app tem +3 |
| Cidade do Cabo | 28 | 25 | app tem +3 |
| Singapura | 29 | 26 | app tem +3 |
| Istambul | 28 | 26 | app tem +2 |
| Marrakech | 28 | 26 | app tem +2 |

Fortaleza é o caso a olhar primeiro: o banco tem 5 atividades publicadas que o app não mostra. Nas
outras cinco o app tem itens a mais — ou são anteriores à curadoria, ou foram despublicados no banco.
Um `sync-catalog` nessas cidades resolveria a divergência, mas **apagaria** os itens extra do app;
por isso não corri nada sem decisão.
