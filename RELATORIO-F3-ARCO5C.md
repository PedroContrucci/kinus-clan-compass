# RELATÓRIO — F3 / Arco 5.c

## CORS allowlist + burst guard nas 10 functions vivas

**Data:** 2026-08-26
**Escopo:** `supabase/functions/_shared/http.ts` (novo) + 10 `index.ts`. **Onze arquivos, nada
além deles.**
**Base:** `RELATORIO-RECON-ARCO5.md` §2, §5.1, §6.2, §6.3 (itens 6, 8, 9) ·
`RELATORIO-F3-ARCO5B.md` adendo de 25/ago (manual de deploy do Lovable).
**Commit:** `1f2ad08`
**Regra da casa respeitada:** sem `amend`, sem `force`. Este relatório vai em commit `docs:`
separado.

---

## 0. Veredicto em seis linhas

1. **Aplicado no repositório: 11 arquivos, +280 / −95.** As 10 functions vivas passaram a montar o
   envelope CORS a partir de um helper único e a ter freio anti-rajada.
2. **11/11 wildcard virou 1/11.** O único `Access-Control-Allow-Origin: '*'` fixo que sobrou é o de
   `generate-itinerary` — fora de escopo por ordem sua, e inócuo (é 403 desde o 5.b). §6.
3. **A regra crítica está provada, não presumida:** requisição **sem `Origin` passa**. É o que
   mantém vivo o `kinu-ai:250` → `google-places` (recon §6.3 item 9) e todo `curl`.
4. **14/14 no harness** sobre o arquivo real do helper, incluindo os três casos que quebram
   allowlist ingênua: `evil-lovable.app`, `x.lovable.app.evil.com` e `http://` numa zona `https`. §3.
5. **Sem `ALLOWED_ORIGINS`, o comportamento é o de hoje.** Um redeploy antes da configuração do
   secret **não pode** derrubar produção. É de propósito, e é o que torna o roteiro do §5.2 seguro.
6. ⚠️ **Isto ainda não mudou nada em produção.** O Lovable não redeploya edge function no
   Publish (descoberta do 5.b). Ver §5 — é a parte que importa deste relatório.

---

## 1. O que foi aplicado

### 1.1 O helper — `supabase/functions/_shared/http.ts` (novo, 192 linhas)

Primeiro `_shared/` da história deste repositório (`git log --all` confirmou: nunca existiu um).
**Zero imports**, de propósito: nenhuma dependência de rede no boot, e é o que permitiu exercitar o
arquivo real no Node (§3).

```ts
export function corsGate(req: Request, opts: GateOptions): Gate
// Gate = { headers: Record<string,string>, response: Response | null }
```

Uma chamada resolve as quatro coisas — montar os headers, responder o preflight, recusar a origem,
cortar a rajada. Foi a sua decisão (1) e ela se pagou: **menos superfície para alguém esquecer uma
das quatro linhas numa função futura.**

### 1.2 A forma do patch nas 9 do padrão

```diff
+import { corsGate } from "../_shared/http.ts";
 …
-const corsHeaders = {
-  "Access-Control-Allow-Origin": "*",
-  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, …",
-};
 …
 serve(async (req) => {
-  if (req.method === "OPTIONS") {
-    return new Response(null, { headers: corsHeaders });
-  }
+  // Arco 5.c: envelope CORS (allowlist ALLOWED_ORIGINS) + burst guard em memória.
+  const gate = corsGate(req, { fn: "weather", limit: 30, windowMs: 10_000 });
+  if (gate.response) return gate.response;
+  const corsHeaders = gate.headers;
```

O truque que fez o diff ser pequeno: o `const` local **se chama `corsHeaders`**, então os ~60
`{ ...corsHeaders, "Content-Type": "application/json" }` espalhados pelos arquivos continuaram
resolvendo — agora para o objeto por-requisição em vez do de módulo. **Nenhum deles foi tocado.**

Aspas: cada arquivo manteve o dialeto dele (`"` em `weather`/`kinu-ai`/`google-places`/`maps-embed`/
`viator-search`; `'` em `unsplash`/`amadeus-flights`/`feedback-*`), como no 5.b.

### 1.3 `exchange-rates` — a exceção do lote

`jsonResponse()` (`:194`) usa os headers e vive **fora** do handler; é chamada por `handleHistory()`
e `returnFallback()`, que também são de módulo. Tornar `corsHeaders` local ao handler deixaria as
três órfãs — a função quebraria no boot.

**A alternativa que foi recusada e por quê:** `let corsHeaders` de módulo, reatribuído a cada
requisição. Um isolate atende requisições **concorrentes**; a origem de um usuário apareceria na
resposta de outro. Não é hipótese remota — é o modelo de execução normal do Edge Runtime.

Solução aplicada: os headers viajam por parâmetro. Nove pontos, todos mecânicos:

| Assinatura | De | Para |
|---|---|---|
| `handleHistory` | `(body, base)` | `(body, base, cors)` |
| `returnFallback` | `(targets, base)` | `(targets, base, cors)` |
| `jsonResponse` | `(data, status = 200)` | `(data, cors, status = 200)` |

O reordenamento de `jsonResponse` é seguro: **nenhuma das 5 chamadas passava `status`** — todas
usam o default 200. Verificado antes de mexer.

### 1.4 `feedback-digest` — envelope sim, 403 intacto

`corsGate(..., { burst: false })` entrou onde estava o handler de `OPTIONS`. O bloco 403 do R-04
ficou **exatamente onde estava**, uma linha abaixo. Perdeu só o `Access-Control-Allow-Methods`
local — que o helper agora emite para as 10.

`burst: false` porque o 403 não custa cota nem fatura: contar seria cerimônia.

### 1.5 Orçamento real do diff

```
 supabase/functions/_shared/http.ts          | 192 ++++++++++  (novo)
 supabase/functions/exchange-rates/index.ts  |  44 ++++---
 supabase/functions/feedback-digest/index.ts |  17 ++-
 supabase/functions/google-places/index.ts   |  17 +--
 supabase/functions/feedback-notify/index.ts |  16 +--
 supabase/functions/kinu-ai/index.ts         |  16 +--
 supabase/functions/unsplash/index.ts        |  16 +--
 supabase/functions/amadeus-flights/index.ts |  15 +--
 supabase/functions/maps-embed/index.ts      |  14 +-
 supabase/functions/viator-search/index.ts   |  14 +-
 supabase/functions/weather/index.ts         |  14 +-
 11 files changed, 280 insertions(+), 95 deletions(-)
```

Fora as 192 do helper, as 10 functions somaram **+88 / −95** — saldo **negativo**. Quase tudo o que
entrou é comentário explicando o número escolhido.

---

## 2. As decisões, e o que cada uma custa

### 2.1 A regra crítica: sem `Origin`, passa

```ts
if (!origin) {
  headers["Access-Control-Allow-Origin"] = "*";
}
```

Três caminhos legítimos dependem disso (recon §6.2): a chamada servidor→servidor `kinu-ai:250` →
`google-places`, qualquer consumo não-navegador, e o `curl` do rito de fechamento. Uma allowlist
que exigisse `Origin` mataria o `consultar_lugares` do agente, e o sintoma apareceria como
*"o KINU parou de recomendar lugares"* — recon §6.3 item 9, ao pé da letra.

**Correção ao recon:** `tripPdfExport.ts:694` **não** é um desses caminhos. Ele roda no navegador
(usa `import.meta.env`, `document`, `new Image()`) e manda `Origin` normal, como todo o resto do
app. O recon §1.2 suspeitava do contrário.

### 2.2 Origem recusada: 403 — sua decisão (2)

As duas alternativas terminam com o navegador bloqueando a leitura. A diferença é **quando o
dinheiro é gasto**: sem o 403, a função executa a chamada à Anthropic/Google/Unsplash inteira e só
então o navegador joga o resultado fora. Com o 403, a porta fecha antes.

Aplicado igual em `OPTIONS` e em `POST`/`GET`, sem `Access-Control-Allow-Origin` na resposta, com
corpo `{"error":"Origem não autorizada"}` e um `console.warn` nomeando a origem recusada — o log é
o que vai calibrar o 5.f.

### 2.3 Headers que passaram a existir em 10/10

| Header | Antes | Agora |
|---|---|---|
| `Vary: Origin` | ausente em 11/11 | **sempre presente** |
| `Access-Control-Max-Age` | ausente em 11/11 | `86400` (o navegador impõe o teto dele) |
| `Access-Control-Allow-Methods` | só `feedback-digest` | `GET, POST, OPTIONS` nas 10 |
| `Access-Control-Allow-Headers` | dois dialetos (recon §2.2) | **um só**, o longo + `x-kinu-authorization` |

`Vary: Origin` sai **sempre**, inclusive no modo wildcard. É deliberado: a resposta *pode* depender
da `Origin`, e sem `Vary` um cache intermediário poderia servir a um site a resposta autorizada
para outro. Foi exatamente o alerta do recon §2.3 — *"obrigatório no dia em que a origem for
ecoada"*. Esse dia é hoje.

O `x-kinu-authorization` entra **agora, antes de ser usado**. É o que impede o bug do recon §2.2:
adicionar o header só em algumas funções faz o preflight reprovar em metade do app.

### 2.4 `OPTIONS` unificado

`new Response(null, { headers })`, status 200 — a forma da maioria (9 de 11). **Mudança de
comportamento registrada:** `exchange-rates` e `feedback-digest` deixaram de devolver o corpo
`"ok"`. Ninguém lê corpo de preflight, mas o recon §2.4 pediu que a escolha fosse declarada.

### 2.5 Os limites do burst guard — e de onde saiu cada número

Janela de 10 s. **Generosos de propósito:** isto é anti-flood, não quota (a quota é o 5.e).

| Função | Limite / 10 s | Pico legítimo | Por quê esse número |
|---|---|---|---|
| `unsplash` | **120** | **~35 em ~2 s** | Ver §2.6 — o pior caso foi medido, não herdado. ×2 para navegação Clã → Viagens na mesma janela, mais folga. O cache de 24 h da função fica *depois* do guard, então cache hit também conta. |
| `google-places` | **90** | 1-3 por interação | Alto **não** pelo front: `kinu-ai:250` chega com o IP da infraestrutura da edge, então *todos* os usuários do agente somam num balde só. |
| `amadeus-flights` | **30** | 2 (`search` + `flexible`) | Cota de parceiro. `fetchCheapestFlightPrice` é 1 viagem por vez (`Viagens.tsx:831`, `:1019`) — não há `Promise.all` sobre a lista. |
| `viator-search` | **30** | 1 | Cota de parceiro. |
| `weather` | **30** | 1-2 | Cache de 1 h na função. Dano baixo. |
| `exchange-rates` | **30** | 2-3 | `useExchangeRates.ts:106,112` dispara 2 em `Promise.all`. |
| `maps-embed` | **30** | 1 | Barata. |
| `kinu-ai` | **12** | 2 (Dashboard com `debugMode`) | ~$0,70/req no pior caso (auditoria R-03). Ninguém digita 12 mensagens em 10 s — e ainda assim é 6× o pico medido. |
| `feedback-notify` | **3** | 1 | Cada chamada é um **WhatsApp no telefone do fundador** (R-05). |
| `feedback-digest` | *(desligado)* | 0 | `burst: false`. |

**Janela fixa, não deslizante.** Consequência aceita e registrada: na virada de janela é possível
passar até 2× o limite. Para anti-flood é irrelevante, e o código fica trivial de auditar.

### 2.6 O achado que corrige o recon §6.3 item 8

O recon proibia chutar o limite do `unsplash` e dizia que o pior caso legítimo era *"~8 requisições
em paralelo"* da tela de Viagens. **A medição desmente: são ~35, e a tela é outra.**

| Origem, na tela do Clã | Requisições |
|---|---|
| grade de destinos curados (`Cla.tsx:425-434`) | **9** |
| `ItineraryCard` via `useDestinationPhoto` (`Cla.tsx:521`, `slice(0, 20)`) | **até 20** |
| `ActivityCard` via `useCategoryPhoto` — o cache de cliente dedupa por categoria | **~6** |
| **Total, em ~2 s** | **~35** |

Viagens com 8 cards é o caso *menor*, não o maior. Se o limite tivesse saído do número do recon,
**a tela do Clã tomaria 429 numa carga normal.** É a diferença entre medir e herdar.

### 2.7 Fail-open, em três lugares, escrito no código

1. **Sem `x-forwarded-for`** → passa. Se os "sem IP" caíssem num balde comum, o `kinu-ai` →
   `google-places` e todo `curl` legítimo dividiriam um único contador.
2. **Exceção dentro do guard** → `catch` que loga e passa. Um bug do envelope nunca pode apagar as
   imagens do app.
3. **Cold start / isolate novo** → contador zerado.

E a limitação estrutural, dita sem maquiagem (recon §5.1): **o contador é por isolate.** O Supabase
sobe N isolates, o limite efetivo é `N × limite` com `N` desconhecido, e cada deploy zera tudo.
**Isto não é livro-caixa e não pretende ser** — é o primeiro estágio anti-rajada, e a contagem de
verdade é o Arco 5.e.

**E o que o guard não contém:** `x-forwarded-for` é forjável pelo cliente. Ele contém acidente,
laço maluco e script ingênuo. **Não contém atacante determinado.** O recon §4.3 já dizia isso; este
arco não muda.

---

## 3. Verificação antes do commit

### 3.1 Harness sobre o arquivo real — 14/14

`deno` não existe nesta máquina e o `vitest.config.ts:11` só varre `src/**` (fora de escopo). Mas o
helper não tem imports e o Node 24 remove tipos nativamente, então deu para carregar o
**arquivo real** com um `Deno` falso e exercitar a tabela-verdade:

```
== CORS ==
  ok   1 · env ausente + Origin hostil => passa com wildcard  → resp=null ACAO=*
  ok   2 · origem exata => eco + Vary  → ACAO=https://kinu-travel.app Vary=Origin
  ok   3 · curinga *.lovable.app => passa
  ok   4 · evil-lovable.app NAO casa a zona => 403  → status=403
  ok   5 · sufixo forjado x.lovable.app.evil.com => 403
  ok   6 · curinga so vale em https => 403
  ok   7 · Origin: null (iframe sandbox) => 403
  ok   8 · SEM Origin => PASSA (regra critica: kinu-ai->google-places, curl)  → ACAO=*

== PREFLIGHT ==
  ok   9 · OPTIONS permitido => 200, corpo vazio, Max-Age, x-kinu-authorization  → status=200 maxage=86400
  ok  10 · OPTIONS de origem hostil => 403 sem Allow-Origin

== BURST GUARD ==
  ok  11 · limit 3 => a 4a requisicao leva 429 + Retry-After  → codigos=[200,200,200,429] Retry-After=1
  ok  12 · apos a janela expirar => volta a passar
  ok  13 · sem x-forwarded-for => fail-open (guard nao roda)
  ok  14 · burst:false (feedback-digest) => nunca 429

14 passaram, 0 falharam.
```

Os casos 4, 5 e 6 são os que quebram uma allowlist ingênua. `"https://evil-lovable.app"` não casa
`*.lovable.app` porque a zona comparada começa com ponto (`.lovable.app`); `x.lovable.app.evil.com`
não casa porque a comparação é sufixo do *hostname* inteiro; e `http://x.lovable.app` não casa
porque as zonas com curinga exigem `https`.

O `/tmp/http-check.mjs` **não entrou no repositório**, como combinado.

### 3.2 Sintaxe dos 11 arquivos

`tsc --noEmit --noResolve` sobre o helper + as 11 `index.ts`:

```
     25 error TS2304: Cannot find name 'Deno'.
     10 error TS5097: An import path can only end with a '.ts' extension when …
      9 error TS2307: Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'
      1 error TS2307: Cannot find module 'npm:@supabase/supabase-js@2'
```

**Zero erros de sintaxe (nenhum `TS1xxx`).** Os 45 são todos o atrito conhecido de rodar Deno no
`tsc` do Node: global `Deno`, imports por URL, especificador `npm:`. Existiam antes deste arco e
continuam existindo — nenhum entra no `tsconfig.app.json`, então a baseline zerada da dívida do
`tsc` (commit `2122dbf`) segue zerada.

Detalhe útil: os **10** `TS5097` são exatamente os 10 imports novos de `../_shared/http.ts` — a
confirmação, por contagem, de que nenhuma função ficou de fora.

### 3.3 Escopo do diff

```
$ git status --porcelain
 M supabase/functions/amadeus-flights/index.ts
 M supabase/functions/exchange-rates/index.ts
 M supabase/functions/feedback-digest/index.ts
 M supabase/functions/feedback-notify/index.ts
 M supabase/functions/google-places/index.ts
 M supabase/functions/kinu-ai/index.ts
 M supabase/functions/maps-embed/index.ts
 M supabase/functions/unsplash/index.ts
 M supabase/functions/viator-search/index.ts
 M supabase/functions/weather/index.ts
?? supabase/functions/_shared/
?? STEP1-ARCO5C.md          (rascunho, não commitado — deletado ao fim)
```

**Zero em `src/`. Zero em `supabase/config.toml`. Zero em `generate-itinerary`.** Exatamente o
proposto no STEP 1, e exatamente o que a missão proibia tocar.

---

## 4. Commit e push

```
$ git commit
[main 1f2ad08] feat(f3): arco 5.c - CORS allowlist + burst guard (10 functions, helper _shared)
 11 files changed, 280 insertions(+), 95 deletions(-)
 create mode 100644 supabase/functions/_shared/http.ts

$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   a9e26f7..1f2ad08  main -> main
```

Sem `amend`. Sem `force`. Fast-forward limpo de `a9e26f7` para `1f2ad08`.

---

## 5. ⚠️ RESSALVA DE PRODUÇÃO — nada disso está no ar

**Este commit não mudou o runtime. Ainda.**

É a lição do 5.b, e ela é específica: **o Publish / git-sync do Lovable não redeploya edge
functions.** O adendo de 25/ago registrou o ciclo inteiro — curl pós-publish devolveu 200 (proxy
ainda aberto), e só o prompt de redeploy no chat fez o 403 aparecer.

Consequência direta: até o rito de fechamento, **as 10 functions em produção continuam com
wildcard, sem `Vary`, sem `Max-Age`, sem freio de rajada** — exatamente como o recon as encontrou.

### 5.1 O secret `ALLOWED_ORIGINS` — como configurar

Ref de produção confirmado desde o 5.b: **`lnhbamzhturwkhcwiohr`** (P-1 fechada).

**Caminho recomendado — painel do Supabase**, não prompt ao Lovable:
`supabase.com/dashboard/project/lnhbamzhturwkhcwiohr` → **Edge Functions → Secrets** →
`Add new secret` → nome `ALLOWED_ORIGINS`. É o mesmo lugar onde `ANTHROPIC_API_KEY`,
`UNSPLASH_ACCESS_KEY` e as outras já vivem, e o secret é **do projeto**: uma configuração cobre as
10 funções de uma vez.

Valor a colar:

```
https://kinu-travel.app,https://www.kinu-travel.app,*.lovableproject.com,*.lovable.app,*.lovableproject-dev.com,*.gpt-eng.com,*.gptengineer.run,https://scaling-couscous-x5qx9vj4p9q9cxj-8080.app.github.dev,http://localhost:8080
```

| Entrada | Por quê |
|---|---|
| `https://kinu-travel.app` + `www` | produção (`tripPdfExport.ts:981` gera QR para ela) |
| 5 zonas `*.` do Lovable | copiadas de `previewAuthStorage.ts:8` — são as zonas onde o app roda em preview. `lovable.dev` e `gptengineer.app` **não** entram: são o editor, que embute o app num iframe; o `Origin` do `fetch` é o da zona de preview |
| Codespace `scaling-couscous-…-8080` | esta máquina, porta 8080 (`vite.config.ts:10`) |
| `http://localhost:8080` | dev local; `http`, então nunca casaria uma regra de curinga |

**Não exige redeploy.** O helper lê `Deno.env.get("ALLOWED_ORIGINS")` **por requisição**, então o
secret novo vale assim que o isolate atender a próxima chamada.

**Ressalva registrada, conforme sua decisão (3):** `*.lovable.app` e as outras quatro zonas
autorizam o preview de **qualquer** projeto Lovable, não só o nosso, a chamar estas functions de
dentro de um navegador. É o preço de manter os previews funcionando sem saber o host exato de
antemão. Contenção atual: o teto de gasto da Anthropic (Arco 5.0, já feito). **Aperto previsto para
o 5.f** — e é barato, porque trocar as 5 zonas pelo host exato do preview é editar o secret, sem
redeploy e sem commit.

**Ressalva sobre o Codespace:** o nome muda quando um Codespace novo é criado. Ficou origem exata
em vez de `*.app.github.dev` de propósito — o curinga liberaria o Codespace de qualquer pessoa no
GitHub.

### 5.2 O roteiro de deploy — quatro atos, nesta ordem

**Por que existe um piloto:** nenhum commit deste repositório jamais criou um `_shared/`, e ninguém
nunca provou que o pipeline do Lovable empacota um import relativo para fora do diretório da
função. Se não empacotar, a função sobe em `BOOT_ERROR` e **100% das requisições dela morrem**. O
piloto faz essa descoberta custar uma função barata, não dez.

**Ato 1 — piloto `weather`, ainda SEM o secret.**

> `redeploy weather from current repository code, do not modify`

Esperado: `Deployed edge functions: weather`. Depois, a matriz do §5.3. Como `ALLOWED_ORIGINS`
ainda não existe, o esperado é **wildcard em tudo** — a prova 2 devolve **200, não 403** — mas com
`Vary`, `Max-Age` e o `Allow-Headers` novo, e com o 429 da prova 5. **Isso prova as duas coisas que
importam de uma vez: o `_shared` empacotou, e o fallback sem env não muda nada.**

**Ato 2 — ligar o secret** (§5.1) e **repetir as provas 1-4 em `weather`, sem redeploy.** Agora a
prova 2 tem que virar **403** e a prova 3 tem que ecoar `https://kinu-travel.app`. Só depois disso
o resto do lote é seguro.

**Ato 3 — as outras 9.** Uma tentativa em lote:

> `redeploy the following edge functions from current repository code, do not modify: unsplash, maps-embed, exchange-rates, viator-search, amadeus-flights, feedback-notify, feedback-digest, google-places, kinu-ai`

**Conferir a resposta nome a nome.** Se o Lovable não listar as 9, cair para um prompt por função,
na ordem acima. A ordem é deliberada: `google-places` e `kinu-ai` por último, porque o agente
depende da primeira — e `google-places` leva curl próprio **antes** de `kinu-ai` subir.

**Ato 4 — matriz de curl nas 9**, adaptando corpo e método (§5.3), e o fecho de navegação.

### 5.3 A matriz de prova — cinco probes por função

`$ANON` = `VITE_SUPABASE_PUBLISHABLE_KEY` do `.env`.

```bash
F=weather; U=https://lnhbamzhturwkhcwiohr.supabase.co/functions/v1/$F
B='{"city":"Paris","country":"FR"}'

# 1) preflight, origem permitida -> 200 + eco + Vary + Max-Age + x-kinu-authorization
curl -si -X OPTIONS $U -H "Origin: https://kinu-travel.app" \
  -H "Access-Control-Request-Method: POST" | head -20

# 2) preflight, origem hostil -> 403 e SEM access-control-allow-origin
curl -si -X OPTIONS $U -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: POST" | head -20

# 3) POST com origem permitida -> 200 + access-control-allow-origin: https://kinu-travel.app
curl -si -X POST $U -H "Origin: https://kinu-travel.app" \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d "$B" | head -20

# 4) POST SEM Origin (o caminho do kinu-ai:250 e do curl) -> 200 + allow-origin: *
curl -si -X POST $U -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -d "$B" | head -20

# 5) rajada: limite+2 requisicoes -> as ultimas 429 com Retry-After
for i in $(seq 1 32); do
  curl -s -o /dev/null -w "%{http_code} " -X POST $U \
    -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d "$B"
done; echo
```

Corpo e método por função:

| Função | Método | Corpo / query |
|---|---|---|
| `unsplash` | GET | `?query=paris&per_page=1&orientation=landscape` |
| `maps-embed` | POST | `{"query":"Paris","zoom":12}` |
| `exchange-rates` | POST | `{"base":"BRL","targets":["USD"]}` |
| `viator-search` | POST | `{"destination":"Paris","count":1}` |
| `amadeus-flights` | POST | `{"action":"search","origin":"GRU","destination":"CDG","date":"2026-10-01","adults":1}` |
| `feedback-notify` | POST | ⚠️ **dispara WhatsApp no seu telefone.** Provar só com OPTIONS (probes 1-2); combinar antes um POST único de teste |
| `feedback-digest` | POST | `{}` → tem que continuar **403 `"Esta função foi desativada."`** |
| `google-places` | POST | `{"action":"search","query":"Louvre","destination":"Paris"}` |
| `kinu-ai` | POST | ⚠️ **custa dinheiro.** `{"message":"oi","context":{}}` — 1 chamada, depois do OPTIONS ter passado |

**Aviso honesto sobre a probe 5:** o contador é por isolate. Se o Supabase distribuir a rajada por
vários isolates, o 429 pode não aparecer na primeira tentativa. **Isso não é falha do guard — é
exatamente a limitação declarada no §2.7.** Repetir mais rápido (ou com `xargs -P`) tende a cair no
mesmo isolate. Registrar o que vier, sem forçar narrativa. **As probes 1-4 são determinísticas, e é
sobre elas que o fechamento se decide.**

**Fecho de verdade:** abrir o app em produção e navegar **Clã → Viagens → um TripPanel** com o
DevTools aberto, conferindo que não há erro de CORS e não há 429. A matriz de curl prova o
mecanismo; **a navegação prova os limites do §2.5** — e o Clã é justamente o pior caso do §2.6.

### 5.4 Se der errado — a resposta de cada caso

| # | Risco | Sintoma | Resposta |
|---|---|---|---|
| **R1** | O Lovable não empacota `_shared/` | `weather` em 5xx / `BOOT_ERROR` no log | **Plano B:** inlinar o helper nos 10 arquivos (mesmo código, copiado). Feio, mas sem import externo. O piloto existe para essa descoberta custar uma função barata. |
| **R2** | Uma origem legítima ficou de fora | tela em branco / erro de CORS numa superfície específica | Editar o secret. **Sem redeploy.** Se for urgente: **apagar o secret ⇒ volta ao wildcard imediatamente.** É o botão de pânico do arco. |
| **R3** | Limite apertado demais | 429 em navegação normal (o Clã é o pior caso) | Subir o número no arquivo e redeployar. É por isso que os números são generosos. |
| **R4** | `google-places` estrangulada por `kinu-ai` | "o KINU parou de recomendar lugares" | Mitigado com 90/10 s. Se acontecer, o 5.d dá identidade e o balde deixa de ser o IP da infra. |
| **R5** | `exchange-rates` quebrada pelo threading | 5xx só nela | É a função com o patch menos mecânico; leva curl próprio no Ato 3. |
| **R6** | `x-forwarded-for` forjado | nenhum sintoma visível | Fora do escopo, declarado no §2.7. O teto real é o da Anthropic (5.0, feito) e a identidade do 5.d. |

**Pendências abertas:**

- **P-3** — rodar os Atos 1-4 do §5.2. Só então 5.c vira ✅.
- **P-4** — configurar `ALLOWED_ORIGINS` (§5.1). Sem ela, o código está no ar mas a allowlist está
  desligada: ganha-se `Vary`/`Max-Age`/`Allow-Headers` unificado e o burst guard, **não** a
  restrição de origem.

---

## 6. O que este arco deliberadamente NÃO fez

- **Não substitui autenticação nem rate limiting** (recon §6.3 item 6). `curl` ignora CORS; a
  auditoria já provou HTTP 200 com `Origin` forjada. O ganho real e limitado: um site hostil não
  gasta mais o nosso orçamento usando o navegador dos visitantes dele.
- **Não conta nada de forma confiável** — §2.7. A contagem é o 5.e.
- **Não tocou em `generate-itinerary`**, por ordem sua. **Pendência declarada:** ela segue com
  `Access-Control-Allow-Origin: '*'` no repositório. O "11/11 wildcard" do recon virou **1/11**.
  Impacto real ≈ zero (é 403 desde o 5.b), mas é uma inconsistência conhecida, não um esquecimento.
  Patch de ~5 linhas quando quiser.
- **Não tocou nos 4 call sites de `fetch` cru** (`useUnsplash.ts:97`, `tripPdfExport.ts:694`,
  `DestinationImage.tsx:31`, `useViatorSearch.ts:43`). Não precisou: o `Allow-Headers` ficou mais
  **permissivo**, nunca menos. O contrato de header só muda quando o 5.d passar a **mandar**
  `x-kinu-authorization` — e é por isso que ele já entrou na lista agora.
- **Não adicionou `Access-Control-Expose-Headers`.** O `Retry-After` do 429 não é legível pelo JS
  sem isso; por ora o front lê `retryAfterMs` do corpo. É uma linha, quando o 5.f precisar.
- **Não tocou em `supabase/config.toml`** — recon §6.3 item 2: todo controle dentro do corpo da
  função, porque é o único que viaja junto com o código que o Lovable de fato deploya.

---

## 7. Estado dos arcos

| Item | Estado |
|---|---|
| 5.0 — teto de gasto na Anthropic | ✅ feito (25/ago, teto de US$50 ajustado conscientemente) |
| 5.a — identidade via JWKS ES256 | ✅ provado (`4eb95f7` + adendo do recon) |
| 5.b — matar o órfão `generate-itinerary` | ✅ fechado em produção (`371f45d` + prompt de redeploy) |
| **5.c — CORS allowlist + burst guard** | **aplicado no repo (`1f2ad08`); pendente em produção (P-3, P-4)** |
| 5.d — identidade nas caras (`x-kinu-authorization`) | próximo. O header já está no `Allow-Headers` das 10 |
| 5.e — contador persistente (`public.rate_limits`) | depende do 5.d |
| 5.f — aperto: modo sombra vira bloqueio; apertar as zonas curinga | depende do 5.e + observação |

**Rascunho `STEP1-ARCO5C.md`:** deletado, conforme protocolo. Nunca entrou em commit.
**Harness `/tmp/http-check.mjs`:** fora do repositório, como combinado.
