# Relatório — kinu-ai: catálogo curado sob demanda

**Commit:** `e354681` · `feat(kinu-ai): catálogo curado sob demanda, sem depender de viagem ativa`
**Data:** 09/09/2026 · **Origem:** princípio de produto do fundador + sonda da testadora-zero
**Arquivos:** 2 alterados, 3 novos · 168 inserções, 64 remoções (+ o artefato gerado, 259 KB)
**Estado:** no repo e no `main`. **Pendente em produção** — precisa do redeploy da §7.

---

## 1. O princípio e o sintoma

> **Princípio (fundador):** o KINU responde sobre qualquer cidade curada quando perguntado. O
> usuário pode ter parente lá e nunca ter planejado nada pelo app.

**Sintoma.** "Estou em Fortaleza, onde eu janto?", sem viagem ativa. O agente respondeu que
Fortaleza ainda não está no catálogo curado. É a **4ª cidade mais curada do produto**: 54 itens,
15 deles de jantar, 2 hotéis curados.

A REGRA DE RECORTE HONESTO do `9c543dd` tinha acabado de entrar em produção. Ela mandava o agente
entregar o recorte verificado do catálogo antes de qualquer outra coisa — e foi exatamente o que
ele fez, sobre um inventário que acreditava não existir. **Recorte honesto sobre inventário falso
é mentira com cara de honestidade**, que é pior que a vaguidão que a regra veio corrigir.

---

## 2. O achado: o dado tinha chegado

A hipótese de trabalho era "o catálogo só chega pelo `<trip_context>` de uma viagem ativa".
**Não é o caso.** O front já detecta a cidade **na mensagem** e injeta o catálogo num campo irmão
do `<trip_context>` — `KinuAIContext.tsx:133-145`, a memória pegajosa do
`RELATORIO-STICKY-CITY.md`:

```ts
const detectedCity = detectCuratedCity(content, tripContext?.destination);  // lê a MENSAGEM
const curatedCatalog = curatedCity ? buildCuratedCatalog(curatedCity) : null;
```

Rodei a frase exata da sonda contra o código real:

```
"estou em Fortaleza, onde eu janto?"  ->  Fortaleza | 54 atividades | 15 de JANTAR | 2 hotéis
```

**O catálogo foi montado e enviado.** E a lista das 21 cidades vai em toda chamada, sem condição
(`curatedCityNames: CURATED_CITIES`), com Fortaleza em segundo lugar. O agente tinha a lista
diante dos olhos e os 15 jantares anexados, e negou.

---

## 3. A causa: o prompt fundia dois conceitos

Dentro da própria REGRA ABSOLUTA DE VERACIDADE:

> "Se o catálogo curado **não cobrir a cidade perguntada**, limite-se a orientações genéricas […]
> Nesse caso, **diga que esse destino ainda 'chega em breve ao KINU'**"

"Não cobrir a cidade perguntada" tem duas leituras, e as duas levam a respostas opostas:

| Leitura | Verdade sobre Fortaleza |
|---|---|
| "o bloco CATÁLOGO CURADO desta conversa não fala dela" | falso aqui — o bloco foi enviado |
| "o produto não tem curadoria dela" | **falso sempre** |

A frase de saída estava amarrada à **ausência do bloco**, não à ausência da cidade no produto. E
a regra 14 mandava conferir os DESTINOS DISPONÍVEIS antes de negar **disponibilidade** — mas o
agente não negou disponibilidade, negou **curadoria**. O prompt separava os dois conceitos num
lugar e os fundia no outro.

### 3.1 O canal também era frágil, e isso é mensurável

Sete frases contra o `detectCuratedCity` real — **três falham**, todas por grafia:

| Frase | Detecta |
|---|---|
| `estou em Fortaleza, onde eu janto?` · `onde janto em fortaleza` · `e em Istambul?` | ✅ |
| `e em Recife?` | ✅ `null` (correto — não é curada) |
| `quero jantar em Toquio` | ❌ sem acento não casa com `'Tóquio'` |
| `jantar em Rome` | ❌ `'Rome'` é chave de `destinationActivities`, não de `CURATED_CITIES` |
| `e no Rio?` | ❌ só casa a string inteira `'rio de janeiro'` |

Some-se o limite estrutural: **`detectCuratedCity` devolve UMA cidade**. "Compara Roma e Lisboa"
injeta o catálogo de uma e o agente inventa ou nega a outra.

E o pior caso era silencioso: detecção falha → nenhum bloco → o prompt manda dizer "chega em
breve ao KINU" → a mentira sai com cara de honestidade.

---

## 4. O que mudou

### 4.1 `scripts/build-kinu-catalog.ts` (novo) — o gerador sem credencial

Lê `src/data/destinationActivities.ts` + `curatedHotels.ts` e escreve
`supabase/functions/kinu-ai/catalog.ts`. **259 KB, 21 cidades, 893 atividades, 68 hotéis.**

**Roda sem credencial nenhuma.** Ao contrário do `sync-catalog.ts` — que precisa da
`KINU_BETA_SERVICE_KEY` no `.env.sync` para ler o banco — este só transforma arquivos que já
estão no repositório. Qualquer um reproduz o artefato e confere. A service key do kinu-beta não
chega perto de `supabase/functions/`.

**`.ts` e não `.json`, conforme decidido:** import de módulo é o mecanismo que **esta esteira já
provou** com o `_shared/telemetry.ts` no 5.e. Um `import … with { type: 'json' }` que o bundler
não inclua não degrada a function — **mata** (lição do 5.d §7.1). Confirmado na prática:
`esbuild --bundle` da function sai com 322 KB, com o catálogo embutido.

O índice de busca não é lista escrita à mão: os apelidos `Tokyo`→`Tóquio` e `Rome`→`Roma` são
**colhidos dos próprios dados** (mesma `cityCode`, `destinationActivities` já os tinha nas linhas
1011 e 1101). Só as formas curtas (`rio`, `new york`, `istanbul`, `cape town`, `lisbon`,
`london`, `singapore`, `marrakesh`, `nova iorque`) estão declaradas, e o gerador aborta se alguma
apontar para cidade não curada.

### 4.2 `sync-catalog.ts` — o passo 6 da esteira

O gerador é chamado no fim do `--apply`, depois do `tsc` verde, com `restore()` se falhar. O
mesmo run que regenera o TS emite o artefato. O log final passou a lembrar que **o deploy da
kinu-ai leva `index.ts` E `catalog.ts` juntos**.

### 4.3 `kinu-ai/index.ts` — a ferramenta

`consultar_catalogo(cidade)`, server-resolved no laço de 3 turnos que já existia para o
`consultar_lugares`. Nenhuma mecânica nova. Normaliza (NFD, sem diacríticos, minúscula, espaços
colapsados), consulta o índice, devolve o bloco renderizado.

**Cidade não curada devolve frase explícita, não erro:**

> `CIDADE NÃO CURADA: "Recife" não está entre os DESTINOS DISPONÍVEIS do KINU […] Aqui — e só
> aqui — vale dizer que esse destino ainda chega em breve ao KINU`

É isso que autoriza o agente a negar **com base em fato**, e não em bloco ausente.

### 4.4 `kinu-ai/index.ts` — um renderizador para os dois caminhos

A montagem do bloco `CATÁLOGO CURADO` virou `renderCuratedCatalog(city, items, hotels)`, chamada
tanto pelo catálogo que o front injeta quanto pela ferramenta. O agente vê **o mesmo formato**
nos dois casos — se a ferramenta rendesse diferente, o produto teria duas vozes para o mesmo
dado. Saída idêntica byte a byte à anterior (§5).

### 4.5 O prompt

A frase ambígua foi desfeita:

```diff
- Se o catálogo curado não cobrir a cidade perguntada, limite-se a orientações genéricas
+ Se a cidade perguntada NÃO ESTIVER na lista de DESTINOS DISPONÍVEIS, limite-se a orientações genéricas
```

E entrou a **REGRA DE CATÁLOGO SOB DEMANDA**: toda cidade da lista TEM catálogo, sempre, mesmo
sem viagem no app; o bloco do contexto é **conveniência, não inventário**; é proibido dizer que
uma cidade da lista "não está no catálogo"; quando faltar o bloco, dizer "essa eu tenho — deixa
eu puxar" e chamar a ferramenta; e **"chega em breve ao KINU" passa a valer exclusivamente para
cidade FORA da lista**.

A **REGRA DE RECORTE HONESTO (`9c543dd`) fica intacta.** Ela continua mandando entregar o recorte
verificado primeiro; esta garante que o recorte seja calculado sobre o inventário real. Prompt
cresceu **1.014 B**.

---

## 5. Verificação

| Checagem | Resultado |
|---|---|
| Harness `/tmp/catalogo-check.mjs` | **21/21** |
| Não-regressão byte a byte do bloco de contexto | **23 comparações, 0 diferenças** |
| Suíte inteira | **174/174** em 14 arquivos |
| `tsc --noEmit -p tsconfig.app.json` | limpo |
| `eslint` nos arquivos novos | zero problemas |
| `vite build` | ok |
| `esbuild --bundle` da function | ok, 322 KB com o catálogo embutido |
| Trava de deriva falha quando deve | ✅ testada com deriva artificial |

O harness cobre: Fortaleza com seção 🌙 JANTAR e 🏨 HOTÉIS CURADOS; `Toquio`/`tokyo`/`TÓQUIO` →
Tóquio; `Rome`/`roma` → Roma; `Rio`/`  rio de janeiro  ` → Rio de Janeiro; `istanbul`,
`new york`, `cape town`; `Recife`/`Xanadu`/`Curitiba` → vazio honesto; string vazia, input
ausente e tipo errado sem lançar; e **as 21 cidades, nenhuma devolvendo vazio**.

**`tool_result`: mín. 4.577 B · máx. 10.573 B · média 7.338 B** — mesma ordem de grandeza do
bloco que já ia no contexto. O custo por chamada praticamente não muda; a diferença é que o bloco
chega **quando o agente precisa**, em vez de quando o cliente adivinha.

### 5.1 A trava de deriva

`src/test/kinuCatalogArtifact.test.ts` chama o próprio gerador em `--check` (não reimplementa
nada) e falha se o artefato estiver velho. Verifiquei que ela **realmente pega**: com uma linha
artificial no `catalog.ts`, o teste quebrou com a mensagem do gerador, que já traz o comando para
consertar.

Sem essa trava, o defeito de hoje se inverteria: em vez de negar o que existe, o agente afirmaria
o que não existe mais.

---

## 6. Sondas manuais pós-redeploy

**Sem viagem ativa, conversa nova em cada uma.**

| # | Pergunta | Passa se | Falha se |
|---|---|---|---|
| 1 | "estou em Fortaleza, onde eu janto?" | nomes reais da seção 🌙 JANTAR | qualquer "não está no catálogo" |
| 2 | "e em Istambul?" | catálogo de Istambul | idem |
| 3 | "e em Recife?" | honesto: não curada — **"chega em breve" aqui é correto** | inventa lugar em Recife |
| 4 | "quero jantar em Toquio" (sem acento) | funciona: a ferramenta normaliza onde a detecção do front falha | responde genérico |
| 5 | **não-regressão:** "onde eu janto hoje?" com viagem ativa | igual a hoje, **sem** chamar a ferramenta | o agente chama à toa |

**Sonda 6 — infra, curl:**

```bash
FN=https://<ref>.supabase.co/functions/v1
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -d '{"message":"oi","context":{}}' | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200 e NADA de x-kinu-shadow   (anônimo intacto)

curl -si -X OPTIONS "$FN/kinu-ai" -H 'Origin: https://evil-lovable.app' \
  -H 'Access-Control-Request-Method: POST' | head -1
# esperado: HTTP/2 403   (5.c intacto)
```

E a sonda da `metrics` do 5.e: `hits` da `kinu-ai` tem que subir com o tráfego das sondas 1-5. A
série que o 5.f vai medir não pode ter degrau por causa deste deploy.

**Sonda 5 é custo, não bloqueio.** Se o agente passar a chamar `consultar_catalogo` mesmo com o
bloco já no contexto, cada conversa ganha um turno de modelo a mais. A descrição da ferramenta diz
"não use quando o catálogo da cidade já estiver no contexto", mas é instrução, não trava. Quero o
número antes de decidir se vale apertar.

---

## 7. Prompt de redeploy ao Lovable

**Os dois arquivos juntos** — é a lição do 5.d §7.1: deploy pela metade não degrada, mata.

> Redeploy the edge function `kinu-ai` from the current `main` of the GitHub repo
> (commit `e354681`). Deploy **both** `supabase/functions/kinu-ai/index.ts` **and** the new
> `supabase/functions/kinu-ai/catalog.ts` — the function imports the catalog module and will not
> start without it. No migration, no new secret, no other function. `corsGate`,
> `shadowIdentify` and `recordRequest` are untouched.

Nota: o `9c543dd` (honestidade de catálogo e transparência de contexto) **já está em produção** —
confirmado pela resposta da sonda 3, que reproduziu a frase do rótulo novo do `<trip_context>`.
Este redeploy sobe por cima dele.

---

## 8. Decisões registradas

### 8.1 A detecção do front fica como está

`detectCuratedCity` e a sticky city **não foram tocadas**, por decisão do fundador: é atalho
barato quando acerta, e a ferramenta cobre quando erra. Corrigir a detecção agora seria
redundância — e uma lista de apelidos mantida no cliente, além da que o gerador já colhe dos
dados, seria uma segunda fonte de verdade sobre a mesma coisa. É o padrão que produziu o bug do
dia de chegada (`94113bc`, o `needsTransitDay` competindo com o cálculo real).

### 8.2 O `catalog.ts` carrega os hotéis — fundação da missão seguinte

> **Correção (09/09, no commit da troca de hotel).** Esta seção saiu com dois números errados:
> eram **68** hotéis, não 61, e **5** cidades sem curadoria, não onze. O gerador e o artefato
> sempre estiveram certos — o cabeçalho do `catalog.ts` diz `68 hotéis` desde o primeiro run.
> Foi a prosa que errou, e os números errados entraram no briefing da missão seguinte.

O artefato traz `hotels` com `zone`, `tier`, `personaTags`, `priceRangeBRL` e tips das **68**
curadorias de hotel, e a ferramenta os devolve na seção 🏨 HOTÉIS CURADOS. **É a fundação da
missão de troca de hotel:** o agente passa a poder falar de hotel de qualquer cidade curada, não
só da viagem ativa. A suíte de deriva trava explicitamente a presença de `hotels` e
`personaTags` no artefato — se o gerador parar de emiti-los, quebra aqui e não lá.

**Cinco** das 21 cidades ainda não têm curadoria de hotel: Cidade do Cabo, Istambul, Bangkok,
Marrakech e Singapura. As outras 16 têm. O agente sabe disso pelo bloco ausente, não por
inferência.

### 8.3 Dívidas herdadas, ainda abertas

- **Haversine no lugar do proxy de fuso** em `getFlightDuration` (`RELATORIO-VOO-D2.md` §5.1).
- **`originSource` antes da missão da origem** (`RELATORIO-VOO-D2.md` §5.2 e
  `RELATORIO-KINUAI-HONESTIDADE.md` §7.1): `criar_viagem` chuta GRU hardcoded, origem presente ≠
  origem conhecida.

---

## 9. Estado

| Item | Estado |
|---|---|
| Gerador `build-kinu-catalog.ts` | ✅ no `main` |
| Artefato `catalog.ts` (21 cidades) | ✅ no `main` |
| Passo 6 do `sync-catalog.ts --apply` | ✅ no `main` |
| Ferramenta `consultar_catalogo` | ✅ no `main` |
| Renderizador único (byte a byte) | ✅ no `main` |
| REGRA DE CATÁLOGO SOB DEMANDA | ✅ no `main` |
| Trava de deriva | ✅ 4 testes · suíte 174/174 |
| **Redeploy `kinu-ai` + `catalog.ts`** | ⏳ **prompt na §7** |
| Sondas 1-6 | ⏳ fundador, pós-redeploy |

Arcos 5.a-5.e inalterados. **O relógio do 5.f não foi tocado:** série diária desde 06/09, aperto
elegível a partir de 13/09.

**Rascunho `STEP1-CATALOGO-DEMANDA.md`:** deletado, conforme protocolo. Nunca entrou em commit.
**Harnesses:** `/tmp/catalogo-check.mjs` e `/tmp/byte-check.mjs`, fora do repositório.
