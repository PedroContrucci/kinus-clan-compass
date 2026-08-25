# RELATÓRIO DE RECONHECIMENTO — F3 / Arco 5

## Rate limiting + CORS nas edge functions

**Data:** 2026-08-25
**Escopo:** `supabase/functions/` (11 funções), `supabase/config.toml`, call sites em `src/`,
projeto `kinu-beta` (só leitura pública).
**Natureza:** somente leitura. **Zero arquivo do app foi modificado.** O único arquivo criado é
este relatório.
**Contexto herdado:** `RELATORIO-RECON-AUTH.md` §5.3 (a bifurcação), `AUDITORIA-SEGURANCA.md`
(R-01 a R-05, M-01), `RELATORIO-DEPLOY-EDGE.md` + `RELATORIO-CORRECAO-LOTE6.md` (o ref de
produção).

---

## 0. Veredicto em cinco linhas

1. **Nenhuma das 11 funções tem rate limiting, validação de origem ou identidade.** Confirmado por
   leitura integral: zero ocorrências de `req.headers.get('authorization')` no diretório inteiro.
2. **11/11 devolvem `Access-Control-Allow-Origin: *`.** Sem `Vary`, sem `Max-Age`, sem
   `Allow-Credentials`.
3. **A bifurcação tem saída barata e ela foi provada nesta sessão:** o kinu-beta **publica um JWKS
   com chave assimétrica ES256**. Dá para verificar o JWT do usuário dentro da function do Lovable
   com chave pública, sem mover nenhum segredo entre projetos.
4. **`verify_jwt = true` não resolve nada.** As duas anon keys do `.env` são JWT **HS256 válidos**
   (decodificados aqui). O gateway aceitaria a própria anon key que já viaja em todo bundle.
5. **A rota recomendada é a (c) híbrida, com a identidade vinda da (a).** Nada muda de projeto,
   nada de service key viajando, e o freio que importa (teto de gasto na Anthropic) é configuração
   de painel — deve vir antes de qualquer linha de código.

---

## 1. INVENTÁRIO DAS 11 FUNÇÕES

### 1.1 Tabela mestra

| # | Função | Linhas | O que faz | Quem chama (`src/`) | Recebe dado do usuário? | API paga / cota | Dano de abuso |
|---|---|---|---|---|---|---|---|
| 1 | `kinu-ai` | 709 | Agente conversacional Claude com *tools*, laço de até 3 turnos por request | `KinuAIContext.tsx:175`, `DashboardKinuTip.tsx:27`, `ApiStatus.tsx:35` (só `debugMode`) | **Sim, muito** — mensagem livre 2.000 ch, histórico 10×5.000 ch, destino, país, datas, budget, gasto, catálogo curado, itinerário | **Anthropic** `claude-sonnet-4-6` + **Google Places** (via `consultar_lugares`, `:250`) | 🔴 **Financeiro máximo.** ~$0,70/req no pior caso medido (AUDITORIA R-03) + ~$0,032 por consulta de lugares. Também: prompt injection (M-08) e contexto de viagem indo para terceiro |
| 2 | `generate-itinerary` | 193 | Gera roteiro JSON completo via Claude, `max_tokens: 4096` | **NINGUÉM** — zero chamadores no repo | Sim: destino, datas, viajantes, tipo, budget, prioridades | **Anthropic** | 🔴 **Proxy Claude gratuito exposto à internet.** ~$0,06/req. Órfã: nenhum usuário perde nada se morrer hoje |
| 3 | `google-places` | 153 | Places API: `search`, `search_many`, `details` | `usePlaceDetails.ts:33` + **servidor→servidor** de `kinu-ai:250` | Sim: query livre + destino | **Google Places** (~$0,032/chamada) | 🔴 Fatura Google **e vazamento de chave**: `photoUrl` devolve `…&key=${API_KEY}` (`:50` e `:116`) |
| 4 | `maps-embed` | 31 | Monta a URL do Google Maps Embed | `TripPanel.tsx:502` | Sim: `query`, `zoom` | Google Maps Embed | 🟡 Devolve `GOOGLE_MAPS_EMBED_KEY` na URL (`:22`) — **por design**, mitigado no commit `d9cfd42` (chave separada, restrita por referrer). Sem `try` na leitura de body antes do `json()` |
| 5 | `amadeus-flights` | 314 | Apesar do nome, consulta **Travelpayouts** (`api.travelpayouts.com`, `:144`) | `useFlightSearch.ts:56,99,158,197`, `Viagens.tsx:796`, `TripPanel.tsx:723` | Sim: origem, destino, data, `flexibleDays` | Travelpayouts (`TRAVELPAYOUTS_TOKEN`) | 🟡 Queima de cota / bloqueio de parceiro. `action:'flexible'` faz 1 fetch mensal (`limit 30`) — não multiplica |
| 6 | `viator-search` | 257 | Busca produtos na Viator Partner API | `useViatorSearch.ts:43` (**`fetch` cru**) | Sim: destino, nome/tipo de atividade, moeda, contagem | Viator (`VIATOR_API_KEY`) | 🟡 Cota / relação com parceiro. `VIATOR_PARTNER_ID` tem default hardcoded (`:144`) |
| 7 | `unsplash` | 174 | Busca fotos, cache em memória 24 h por `(query, perPage, orientation)` (`:19-20`) | `useUnsplash.ts:97`, `tripPdfExport.ts:694`, `DestinationImage.tsx:31` (**`fetch` cru**), `ApiStatus.tsx:25` | Sim: query livre | Unsplash (`UNSPLASH_ACCESS_KEY`) | 🟡 **DoS de cota, não financeiro:** estourar o limite apaga as imagens do app inteiro. É a função de **maior volume legítimo** |
| 8 | `weather` | 208 | Previsão OpenWeather, cache 1 h por cidade (`:19-20`) | `useWeather.ts:47`, `ApiStatus.tsx:30` | Sim: cidade, país | OpenWeather | 🟢 Cota. Dano baixo |
| 9 | `exchange-rates` | 197 | Cotações. `live` → `open.er-api.com` (grátis, `:70`), cache global 6 h (`:19-21`) | `useExchangeRates.ts:106,112`, `ApiStatus.tsx:40` | Pouco: base + lista de moedas | `api.exchangerate.host` (**paga**) só em `action:'history'` (`:119`) | 🟡 O caminho `history` **passa por cima do cache** — o `return handleHistory` está na `:49`, antes da verificação de cache na `:53` |
| 10 | `feedback-notify` | 154 | Classifica feedback com Claude (`max_tokens: 400`), manda e-mail (Resend) e **WhatsApp para o telefone do fundador** (CallMeBot, `:137`) | `FeedbackButton.tsx:97` | Sim: nome do testador, nota, categoria, mensagem livre, página | Anthropic + Resend + CallMeBot | 🔴 **Spam direto no WhatsApp e no e-mail do dono**, disparável por qualquer um. R-05 da auditoria, **ainda aberta** |
| 11 | `feedback-digest` | 138 | Digest dos feedbacks via Claude, lendo `beta_feedback` com **service_role** | **NINGUÉM** | — | — | ✅ **Já neutralizada**: 403 duro em `:27-30`, código inerte abaixo (commit `d7cbd0d`, fecha R-04) |

### 1.2 Leituras que a tabela não comporta

**Duas funções são órfãs.** `generate-itinerary` não tem um único chamador em `src/`, `scripts/`
ou `package.json` — e ainda assim é um endpoint Claude aberto com `max_tokens: 4096`. É o alvo
mais barato de fechar em todo o Arco 5: fechar não pode regredir nada, porque não serve ninguém.
`feedback-digest` já foi tratada e serve de **precedente de estilo** para como neutralizar
(403 no topo, código preservado inerte para reversão).

**`kinu-ai` chama outra function como cliente.** `kinu-ai/index.ts:250-263` faz um POST para
`${SUPABASE_URL}/functions/v1/google-places` usando a `SUPABASE_ANON_KEY` do ambiente. Duas
consequências para o Arco 5: (i) essa chamada **não tem header `Origin`**, então qualquer
allowlist de CORS ingênua a mata; (ii) se `google-places` ganhar rate limit por IP, o IP que
chega lá é o da própria infraestrutura da edge, não o do usuário — todos os usuários compartilham
um balde. É o tipo de detalhe que só aparece depois do deploy se não for registrado agora.

**Quatro call sites usam `fetch` cru, não `functions.invoke`.** `useUnsplash.ts:97`,
`tripPdfExport.ts:694`, `DestinationImage.tsx:31` e `useViatorSearch.ts:43` montam a URL à mão e
colam `Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}`. Qualquer mudança de contrato de
header (adicionar `x-kinu-authorization`, por exemplo) tem que passar por esses quatro além dos
`invoke`. E o de `tripPdfExport.ts` roda durante a exportação de PDF, possivelmente sem `Origin`
previsível.

**O painel de debug não é um vetor.** `ApiStatus.tsx` dispara 4 funções (incluindo `kinu-ai`) num
`useEffect` sem dependências, mas está atrás de `debugMode` em `Dashboard.tsx:110`. Não é volume
de produção — só não pode ser esquecido ao calibrar limites, porque com o debug ligado uma única
carga do Dashboard já gasta duas chamadas de `kinu-ai` (esta e a `DashboardKinuTip`).

**Volume legítimo é assimétrico.** `unsplash` é consumida por 6 componentes
(`UnsplashImage`, `ItineraryCard`, `TripCardWithPhoto`, `DestinationImage`, `ActivityCard`,
mais o PDF) e `DestinationImage` renderiza **por card** em `Viagens.tsx`, `Cla.tsx` e
`TripPanel.tsx`. Uma tela de Viagens com 8 viagens dispara ~8 requisições em paralelo do mesmo IP,
em ~1 segundo. `kinu-ai`, no extremo oposto, é 1 requisição por mensagem digitada. **Um número
único de "requests por minuto por IP" para todas as funções está errado por construção.**

---

## 2. CORS HOJE

### 2.1 O padrão: wildcard em 11 de 11

Todas as funções, sem exceção:

```
Access-Control-Allow-Origin: *
```

`kinu-ai:14` · `generate-itinerary:14` · `google-places:4` · `maps-embed:4` ·
`amadeus-flights:8` · `viator-search:14` · `unsplash:14` · `weather:14` ·
`exchange-rates:14` · `feedback-notify:14` · `feedback-digest:14`

É o achado M-01 da auditoria, e continua exatamente como estava.

### 2.2 Dois dialetos de `Allow-Headers`

**Dialeto longo** (8 funções — `kinu-ai`, `generate-itinerary`, `google-places`, `maps-embed`,
`viator-search`, `unsplash`, `weather`, `exchange-rates`):

```
authorization, x-client-info, apikey, content-type,
x-supabase-client-platform, x-supabase-client-platform-version,
x-supabase-client-runtime, x-supabase-client-runtime-version
```

**Dialeto curto** (3 funções — `amadeus-flights:9`, `feedback-notify:15`, `feedback-digest:15`):

```
authorization, x-client-info, apikey, content-type
```

O dialeto curto é o antigo; o longo foi ampliado quando o `supabase-js` passou a enviar os headers
de plataforma. **Consequência prática para o Arco 5:** qualquer header novo (`x-kinu-authorization`)
tem que ser adicionado nos **onze** arquivos, ou o *preflight* falha só em algumas funções — o pior
tipo de bug, porque funciona em metade do app.

### 2.3 O que não existe em nenhuma

- **`Access-Control-Allow-Methods`** — só `feedback-digest:16` declara (`POST, GET, OPTIONS`).
  As outras 10 omitem. Funciona porque o preflight de método simples passa por padrão, mas é
  omissão, não decisão.
- **`Vary: Origin`** — ausente em 11/11. Irrelevante hoje (a resposta é sempre `*`), **obrigatório
  no dia em que a origem for ecoada**: sem `Vary`, qualquer cache intermediário pode servir a um
  site a resposta autorizada para outro.
- **`Access-Control-Max-Age`** — ausente. Todo preflight vai até a função. Custo pequeno, mas é
  uma requisição a mais por chamada em navegador.
- **`Access-Control-Allow-Credentials`** — ausente, e **está certo assim**: com `*` seria inválido,
  e o app não usa cookie nessas chamadas.

### 2.4 Duas formas de responder ao OPTIONS

`exchange-rates:36` e `feedback-digest:21` devolvem `new Response('ok', ...)`; as outras nove
devolvem `new Response(null, ...)`. Ambas funcionam. Registra-se só porque um helper compartilhado
vai ter que escolher uma e a outra vira diferença de comportamento observável.

### 2.5 O limite do CORS como controle

Já provado ao vivo na auditoria: um `POST` com `Origin: https://evil.example.com` recebeu
**HTTP 200**. CORS é uma política que o **navegador** aplica; `curl` a ignora inteiramente.
Restringir a origem **não é rate limiting e não substitui autenticação**. O que ele resolve, e é
real: impede que um site hostil gaste o orçamento da Anthropic usando o navegador dos visitantes
dele. É defesa em profundidade, e vale exatamente isso.

---

## 3. AUTENTICAÇÃO HOJE

### 3.1 `config.toml`: 9 declaradas, 11 existentes

```toml
project_id = "lnhbamzhturwkhcwiohr"

[functions.generate-itinerary]  verify_jwt = false
[functions.kinu-ai]             verify_jwt = false
[functions.weather]             verify_jwt = false
[functions.unsplash]            verify_jwt = false
[functions.amadeus-flights]     verify_jwt = false
[functions.viator-search]       verify_jwt = false
[functions.exchange-rates]      verify_jwt = false
[functions.google-places]       verify_jwt = false
[functions.maps-embed]          verify_jwt = false
```

`feedback-notify` e `feedback-digest` **não constam**. Pelo padrão do Supabase isso significaria
`verify_jwt = true`. A auditoria testou em produção: **as duas responderam sem nenhum header de
auth**. Chegaram ao `JSON.parse` da própria função, o que só acontece se o gateway não barrou nada.

### 3.2 O achado operacional que condiciona todo o Arco 5

Duas explicações possíveis para a divergência acima, e as duas são ruins da mesma forma:

1. O pipeline do Lovable deploya ignorando/sobrescrevendo o `config.toml`; ou
2. **O ref que atende a produção não é o do `config.toml`.** Foi isso que
   `RELATORIO-DEPLOY-EDGE.md` (correção de 03/08) e `RELATORIO-CORRECAO-LOTE6.md` (Correção 2)
   registraram: o ref real de produção *"vive no ambiente de deploy do Lovable"* e não foi
   identificado; o token local dá 403 nele.

**Conclusão para o Arco 5: `config.toml` não é superfície de controle confiável.** Qualquer
proteção que dependa de uma linha nesse arquivo é uma proteção que talvez nunca chegue à produção.
**O controle tem que estar dentro do corpo da função**, onde ele viaja junto com o código que o
Lovable de fato deploya. Isso não é preferência de estilo — é a única forma de o controle ser
verificável a partir daqui.

### 3.3 O que chega no `Authorization` hoje

O cliente do Lovable (`src/integrations/supabase/client.ts`) **não autentica ninguém** — quem faz
login é o `kinuBeta` (`src/integrations/kinu-beta/client.ts:36-48`, `storageKey: 'kinu-beta-auth'`).
Logo, `supabase.functions.invoke(...)` manda a **publishable key** no `Authorization`, e os quatro
`fetch` crus colam a mesma chave à mão. **A function recebe uma credencial que está no bundle de
todo mundo. Identidade: zero.**

### 3.4 Nenhuma função valida coisa alguma

`grep` por `Authorization|authorization|getUser|jwt|verify` em `supabase/functions/`: as únicas
ocorrências são (a) a string `authorization` dentro do `Allow-Headers`, (b) o `Authorization`
**de saída** para Resend (`feedback-notify:113`) e Unsplash (`unsplash:110`), (c) o
`Authorization: Bearer ${SUPABASE_ANON_KEY}` que `kinu-ai:254` usa para chamar `google-places`.
**Nenhuma função lê o header de entrada.** O único controle existente em todo o diretório é o 403
duro de `feedback-digest:27`.

### 3.5 Por que `verify_jwt = true` não é a resposta — o fato decisivo

Decodifiquei os headers das duas chaves do `.env` (anon keys são públicas por design):

```
VITE_SUPABASE_PUBLISHABLE_KEY → {"alg":"HS256","typ":"JWT"}
                                 {"iss":"supabase","ref":"lnhbamzhturwkhcwiohr","role":"anon",…}
VITE_KINU_BETA_ANON_KEY       → {"alg":"HS256","typ":"JWT"}
                                 {"iss":"supabase","ref":"qbhcrwndkfzqeviiayvq","role":"anon",…}
```

**As duas são JWT legado HS256 com `role: anon`.** Ligar `verify_jwt = true` faz o gateway exigir
"um JWT válido deste projeto" — e a anon key **é** um JWT válido deste projeto. O atacante que já
tem a URL da function também tem a chave (ela está no `main.js`). O gateway passaria a devolver
401 para quem não manda header nenhum, o que filtra o script de uma linha e **nada mais**.
Não identifica usuário, não conta nada, não limita nada.

Isto reformula o R-02 da auditoria: *"`verify_jwt = true` + Supabase Auth"* só faz sentido no
projeto **onde o usuário realmente loga** — e não é o Lovable. É exatamente a bifurcação anotada
em `RELATORIO-RECON-AUTH.md` §5.3.

---

## 4. A BIFURCAÇÃO — TRÊS ROTAS

### 4.0 O fato novo desta sessão: o kinu-beta publica JWKS assimétrico

```
GET https://qbhcrwndkfzqeviiayvq.supabase.co/auth/v1/.well-known/jwks.json
→ HTTP 200
→ {"keys":[{"alg":"ES256","crv":"P-256","kty":"EC","use":"sig","key_ops":["verify"],
            "kid":"0cff482f-f6c2-43aa-8b7a-4e7e1ffee463","x":"…","y":"…"}]}
```

Endpoint público, leitura, nenhum segredo envolvido. **Isto derruba a principal objeção à rota (a).**
A pergunta original era: *"o Lovable não verifica JWT de outro projeto nativamente — dá para
verificar na mão?"* A resposta é sim, **com chave pública**, sem que o segredo do kinu-beta precise
existir dentro do projeto Lovable. Se o kinu-beta ainda estivesse no segredo HS256 legado, a
verificação exigiria copiar o JWT secret (a chave que **assina** tokens) para dentro do Lovable —
o que seria inaceitável. Não é o caso.

**A ressalva honesta:** o JWKS ter uma chave ES256 prova que o projeto tem *signing keys*
assimétricas configuradas. **Não prova, sozinho, que os access tokens emitidos hoje são assinados
com ela** — um projeto pode manter o segredo legado como chave corrente. A prova definitiva custa
30 segundos e nenhum código, está no Arco 5.a abaixo.

---

### 4.1 Rota (a) — verificar o JWT do kinu-beta DENTRO das functions do Lovable

**Como funciona.** Um helper `_shared/verifyKinuBetaJwt.ts`:

1. Busca o JWKS uma vez e guarda em escopo de módulo (vive enquanto o isolate viver).
2. Importa a chave com `crypto.subtle.importKey` (JWK → ECDSA P-256) — WebCrypto nativo do Deno,
   sem dependência externa; `jose` via `npm:` se quiser conforto.
3. Verifica assinatura + `exp` + `iss` (`https://qbhcrwndkfzqeviiayvq.supabase.co/auth/v1`) +
   `aud`. Rejeita `role: anon`.
4. `payload.sub` é o uuid do usuário → **é a chave do rate limit**.
5. Em `kid` desconhecido, refaz o fetch do JWKS uma vez (rotação de chave sem downtime).

**Custo por request.** Verificação ECDSA P-256 em WebCrypto: sub-milissegundo. O fetch do JWKS é
um round-trip HTTPS (~50-150 ms para SP) **uma vez por isolate**, amortizado por todas as
requisições que aquele isolate atender. Comparado com uma chamada à Anthropic (segundos), é ruído.
**Não há custo por request depois do primeiro.**

**O detalhe que precisa ser decidido: por onde o token viaja.** O `Authorization` já está ocupado
pela anon key do Lovable. Duas opções:

- **Header próprio `x-kinu-authorization`** — limpo, não colide com o gateway, e **exige adicionar
  o header ao `Allow-Headers` das 11 funções** (senão o preflight reprova). Recomendado.
- **Sobrescrever `Authorization`** via a opção `headers` do `invoke` — funciona enquanto
  `verify_jwt = false`, e quebra silenciosamente no dia em que alguém ligar o `verify_jwt`.
  Não recomendado: acopla a solução exatamente ao switch que não controlamos (§3.2).

**Balanço.** Nenhuma function muda de projeto. Nenhum segredo se move. Nenhum pipeline de deploy
novo. É a rota com o menor delta operacional e a única que não depende de descobrir o ref de
produção antes de começar.

---

### 4.2 Rota (b) — mover as funções sensíveis para o kinu-beta

**Quais mudariam.** As caras e abusáveis: `kinu-ai`, `feedback-notify` e — se não for morta antes —
`generate-itinerary`. As baratas (imagens, clima, câmbio, voos, atividades) não têm motivo para
migrar.

**O ganho real.** Dentro do kinu-beta, o token do usuário é nativo: `supabase.auth.getUser()`
funciona, `verify_jwt = true` passa a significar alguma coisa, e o contador pode viver no mesmo
Postgres, sem round-trip entre regiões. É o estado final arquitetonicamente correto.

**A armadilha que sobrevive à mudança.** Mesmo lá, `verify_jwt = true` **continua aceitando a anon
key do kinu-beta** (§3.5 vale para os dois projetos). A function ainda precisa ler o claim e
recusar `role: anon` explicitamente. É código de 5 linhas — mas quem achar que a migração dispensa
esse código migra e continua aberto.

**Impacto no front — a parte barata.** Três call sites trocariam
`supabase.functions.invoke(...)` por `kinuBeta.functions.invoke(...)`:
`KinuAIContext.tsx:175`, `DashboardKinuTip.tsx:27`, `FeedbackButton.tsx:97`. O cliente
`kinuBeta` **já anexa o token da sessão automaticamente** — some a necessidade do header
customizado inteira. Uma troca de import por arquivo.

**Impacto fora do front — a parte cara.** Quatro itens, todos reais:

1. **Segredos.** `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`, `RESEND_API_KEY`, `CALLMEBOT_PHONE`,
   `CALLMEBOT_APIKEY` teriam que existir também no kinu-beta. Duplicar segredo é duplicar
   superfície e duplicar rotação.
2. **Pipeline de deploy novo.** `supabase-beta/README.md` regra 2: *"Aplicação à mão, pelo SQL
   Editor... Não há CLI apontando para cá."* Deployar edge function no kinu-beta é uma
   **capacidade que hoje não existe** e teria que ser construída e provada.
3. **`kinu-ai` chama `google-places` por URL** (`:250`, com `Deno.env.get("SUPABASE_URL")`
   auto-referente). Migrar `kinu-ai` sozinha ou arrasta `google-places` junto, ou passa a
   atravessar projetos numa chamada servidor→servidor. Nenhuma das duas é grátis.
4. **Quebra a regra da casa escrita no código.** `src/integrations/kinu-beta/client.ts:10`:
   *"Nada de auth no primeiro; nada de edge function no segundo."* Essa regra teria que ser
   reescrita conscientemente — é decisão do fundador, não efeito colateral de um patch.

**Balanço.** Melhor destino final, maior custo de uma vez só, e mexe justamente na parte do sistema
que hoje é a menos compreendida (o caminho de deploy). **Não deve ser o mesmo arco que introduz
rate limiting.**

---

### 4.3 Rota (c) — híbrido: IP nas baratas, usuário nas caras

**As caras** (identidade obrigatória, limite apertado):

| Função | Por que é cara |
|---|---|
| `kinu-ai` | ~$0,70/req no pior caso; encadeia Anthropic + Places |
| `feedback-notify` | Anthropic + Resend + **WhatsApp no telefone do fundador** |
| `generate-itinerary` | ~$0,06/req — mas é órfã: **fechar, não limitar** |

**As baratas / públicas** (limite por IP, generoso):
`unsplash`, `weather`, `exchange-rates`, `maps-embed`, `google-places`, `amadeus-flights`,
`viator-search`.

**Por que elas não podem exigir identidade.** Rodam em telas que existem antes do login e em
contextos sem sessão — `DestinationImage` em páginas públicas, `tripPdfExport` durante a exportação.
Exigir usuário nelas quebra funcionalidade real para conter um risco que é de cota, não de fatura.

**IP na edge do Supabase:** primeira entrada de `x-forwarded-for`. Duas limitações a declarar antes
de escolher números:

- **CGNAT.** Operadora móvel compartilha IP entre milhares de assinantes. Limite apertado por IP
  bloqueia usuários reais em bloco. Os limites das baratas têm que ser **medidos contra o pior caso
  legítimo** (a tela de Viagens disparando ~8 `unsplash` em paralelo), não chutados.
- **Rotação.** Quem tem pool de proxies passa por cima. **Limite por IP contém acidente e script
  ingênuo; não contém atacante determinado.** O teto real contra um atacante determinado é o
  **teto de gasto na conta Anthropic** — configuração de painel, zero código, e por isso deve
  vir primeiro.

**Balanço.** É a rota que casa a proteção com o risco de cada função em vez de aplicar uma política
única a onze coisas diferentes. **É a recomendada** — usando a rota (a) como mecanismo de
identidade nas caras.

---

## 5. ONDE GUARDAR OS CONTADORES

### 5.1 Memória da function (`Map` em escopo de módulo)

**Custo:** zero. **Latência:** zero. **Precedente já no código:** `unsplash:19-20`, `weather:19-20`
e `exchange-rates:19-21` já mantêm cache em escopo de módulo — o padrão e seus limites já são
conhecidos aqui.

**A limitação, dita com precisão:** o contador é **por isolate**. O Supabase sobe N isolates
conforme a carga e mata o isolate após ociosidade (e a cada deploy). O limite efetivo vira
`N × limite`, com N desconhecido e variável, e zera em cold start.

**Veredicto:** não serve como livro-caixa. **Serve muito bem como primeiro estágio anti-rajada**
(ex.: no máximo 1 req/s por IP numa janela de 10 s). Custo zero, sem banco, sem segredo, e
já barra o flood ingênuo enquanto o resto não existe.

### 5.2 Tabela no kinu-beta — e a pergunta sobre `events`

**`events` não serve, e a razão é dupla.**

Primeiro, **não dá para saber daqui**: `supabase-beta/README.md` a lista como *"esqueleto de
iteração anterior; mantida"*, com 0 linhas, e **nenhuma das migrations 000–003 a cria ou toca**.
O schema dela não existe no repositório. Responder "serve?" exige um `\d public.events` no painel.

Segundo, e mais forte: **mesmo que o schema coubesse, não deveria ser usada.** Contador de rate
limit quer uma tabela estreita, com PK em `(bucket_key, window_start)`, escrita por upsert atômico
e limpeza por janela. Log de eventos quer append irrestrito e política de retenção. Misturar os
dois degrada os dois — o índice do contador fica sob a carga de escrita do log, e o log herda a
contenção de linha do contador. **Recomendação: `public.rate_limits`, tabela nova, 4 colunas,
RLS deny-all, escrita só por service_role.**

**O custo de a tabela morar no kinu-beta** (com as functions no Lovable): a function do Lovable
teria que falar com o kinu-beta por PostgREST usando a **service_role key do kinu-beta guardada
como segredo do Lovable**. Isso é um rebaixamento de segurança real — é a chave que ignora a RLS
do banco de **identidade**, guardada no projeto de **serviços**, para contar requisições. Some-se
+30-80 ms por request (região do Lovable ↔ SP) em **toda** chamada, inclusive as baratas.

Se as functions estiverem **dentro** do kinu-beta (rota b), esse custo evapora quase todo — mesmo
projeto, mesma região, e dá para resolver em SQL puro.

### 5.3 Tabela no projeto Lovable — o lugar mais barato que está correto

**Nenhum segredo novo.** `SUPABASE_SERVICE_ROLE_KEY` já está disponível para as functions do
Lovable — `feedback-digest:34` prova (é literalmente como o R-04 acontecia). **Latência de mesmo
projeto.** E o ponto que decide: **o contador não precisa morar no banco de identidade**, porque
ele guarda uma chave opaca (`user:<uuid>` ou `ip:<hash>`), não dado pessoal. Contar não exige
saber quem é.

**A ressalva:** o banco do Lovable é o que o Lovable regenera. Uma tabela feita à mão lá corre
risco de ser esquecida ou atropelada. Mitigável com migration versionada em
`supabase/migrations/`, no mesmo padrão dos 8 arquivos que já existem lá.

**Veredicto: é o lugar certo para a fase 1.**

### 5.4 Deno KV / Redis externo

Deno KV é recurso do **Deno Deploy**; **assumir indisponível no Edge Runtime do Supabase** até
prova em contrário. Redis externo (Upstash) é a resposta clássica — `INCR` + `EXPIRE` atômicos,
~10-30 ms — mas adiciona fornecedor, segredo e fatura. **Excesso para este estágio.**

### 5.5 Dois detalhes que decidem se a implementação funciona

**Atomicidade.** O incremento tem que ser **uma instrução**:

```sql
insert into rate_limits (bucket_key, window_start, hits) values ($1, $2, 1)
on conflict (bucket_key, window_start) do update set hits = rate_limits.hits + 1
returning hits;
```

Via PostgREST isso significa **uma RPC** (`rate_limit_hit(key, window_seconds, limit)`), não duas
chamadas REST. Um `select` seguido de `update` a partir da function **perde a corrida exatamente
na rajada que deveria conter** — é o erro clássico, e o mais fácil de cometer.

**Fail-open ou fail-closed.** Se o armazenamento do contador cair, a function serve ou recusa?
Não há resposta única: para `kinu-ai` e `feedback-notify`, **fail-closed** é defensável (o risco é
a fatura). Para `unsplash` e `weather`, **fail-open** — senão uma instabilidade de banco apaga as
imagens do app inteiro. **Tem que ser decisão declarada por função, escrita no código**, não
consequência acidental de um `try/catch`.

---

## 6. RECOMENDAÇÃO

### 6.1 A rota

**(c) híbrido no escopo, com a identidade vinda da (a).**

Cada função ganha a proteção proporcional ao seu risco; a identidade das caras vem da verificação
do JWT do kinu-beta por JWKS, dentro da function do Lovable. Nada muda de projeto, nenhum segredo
viaja, nenhum pipeline de deploy novo é necessário, e **não depende de descobrir o ref de produção
primeiro**.

A **rota (b)** fica registrada como estado final desejável para `kinu-ai`, para quando o caminho de
deploy de edge functions no kinu-beta existir e estiver provado. É outro arco, e o §4.2 acima é o
briefing dele.

### 6.2 Faseamento em missões atômicas

| Arco | O que é | Toca código? | Depende de |
|---|---|---|---|
| **5.0** | **Teto de gasto na conta Anthropic** + alerta de billing. Conferir restrições de referrer/IP da `GOOGLE_PLACES_API_KEY` no Google Cloud | ❌ painel | nada |
| **5.a** | **Prova do `alg`**: com o app logado, decodificar o header de `JSON.parse(localStorage['kinu-beta-auth']).access_token` e registrar `alg` e `kid` | ❌ 30 s, manual | nada |
| **5.b** | **Matar o órfão**: neutralizar `generate-itinerary` no padrão de `feedback-digest` (403 no topo, código inerte) | 1 arquivo, ~4 linhas | nada |
| **5.c** | **CORS allowlist + burst guard em memória**: helper `_shared/http.ts` aplicado às 10 funções vivas | 11 arquivos | nada |
| **5.d** | **Identidade nas caras**: `_shared/verifyKinuBetaJwt.ts` + header `x-kinu-authorization`, em `kinu-ai` e `feedback-notify`, **em modo sombra** | 2 functions + 3 call sites | 5.a |
| **5.e** | **Contador persistente**: `public.rate_limits` no Lovable + RPC atômica + RLS deny-all; contagem por `user:<sub>` ou `ip:<hash>` | 1 migration + 2 functions | 5.d |
| **5.f** | **Aperto**: modo sombra vira bloqueio; publicar os limites; só então reabrir a discussão da rota (b) | 2 functions | 5.e + observação |

**Por que 5.0 vem antes de tudo:** é o único freio que funciona mesmo se cada linha de código do
Arco 5 falhar. A auditoria mediu ~$60.000/dia a 1 req/s contra `kinu-ai`, e registrou que *"o
controle de custo do sistema é a fatura chegando"*. Um teto na conta é um clique.

**Por que 5.a existe como missão separada:** é a única incerteza que separa a rota (a) de "viável"
para "provada". Se o token vier `ES256` com o `kid` do JWKS, 5.d é mecânica. Se vier `HS256`, a
correção é ativar signing keys no painel do kinu-beta — também sem código, mas é decisão que
precisa ser tomada **antes** de escrever o verificador, não depois.

**Detalhe do 5.c que quebra a implementação ingênua, registrado agora:** a allowlist **tem que
permitir requisição sem header `Origin`**. Três caminhos legítimos não mandam `Origin`: a chamada
servidor→servidor `kinu-ai:250` → `google-places`, o `fetch` de `tripPdfExport.ts:694`, e qualquer
consumo não-navegador. A regra correta é *"se veio `Origin`, tem que estar na lista; se não veio,
passa"* — CORS protege navegador, e requisição sem `Origin` não é navegador fazendo cross-site.
A lista em si deve vir de env (`ALLOWED_ORIGINS`), porque precisa conter produção
(`https://kinu-travel.app`), os previews do Lovable e a origem do Codespace, que muda.

**Por que 5.d entra em modo sombra:** ligar bloqueio por identidade no primeiro deploy derruba
todo usuário deslogado e todo caminho que ainda não manda o header. Em modo sombra a function
marca `identified=false`, cai no limite por IP, e **loga** — assim os números do 5.f saem de
observação, não de chute.

### 6.3 O que NÃO fazer

1. **Não ligar `verify_jwt = true` achando que resolve.** A anon key é um JWT HS256 válido
   (provado no §3.5) e viaja em todo bundle. O gateway aceitaria e nada mudaria, exceto quebrar
   os quatro call sites de `fetch` cru se o formato da chave mudar.
2. **Não confiar no `config.toml`.** O ref de produção não é o dele, e `feedback-notify` /
   `feedback-digest` já provaram ficar abertas apesar de não constarem do arquivo. **Todo controle
   dentro do corpo da função.**
3. **Não trazer a service_role key do kinu-beta para dentro das functions do Lovable** só para
   contar requisições. É a chave que ignora a RLS do banco de identidade — a que o Arco 2 provou
   11/11. Contador não justifica.
4. **Não reutilizar `events`.** O schema não está no repo, e mesmo que coubesse, misturar log de
   eventos com contador de rate limit degrada os dois.
5. **Não implementar o contador como read-then-write.** Dois round-trips perdem a corrida
   exatamente na rajada. RPC atômica ou nada.
6. **Não restringir CORS achando que é rate limiting.** `curl` ignora CORS; a auditoria já provou
   HTTP 200 com `Origin` forjada.
7. **Não mover functions para o kinu-beta no mesmo arco que introduz rate limiting.** São dois
   riscos independentes — pipeline de deploy inédito e lógica nova. Juntos, um deploy quebrado
   fica indepurável, e o ref de produção ainda é desconhecido.
8. **Não chutar o limite por IP de `unsplash`.** Uma tela de Viagens dispara ~8 requisições em
   paralelo do mesmo IP. O número tem que sair de medição do pior caso legítimo.
9. **Não fechar `google-places` sem lembrar de `kinu-ai:250`.** Ela é chamada servidor→servidor,
   sem `Origin` e com o IP da infraestrutura. Uma allowlist ou um limite por IP aplicado sem isso
   em mente **mata o agente**, e o sintoma vai aparecer como "o KINU parou de recomendar lugares".
10. **Não tratar `maps-embed` como resolvida.** O commit `d9cfd42` trocou a chave por uma de embed
    separada e restrita por referrer, o que reduz o impacto — mas a função continua devolvendo uma
    chave para quem pedir, e a restrição de referrer nunca foi verificada no console (segue em
    "não verificado" desde a auditoria).

---

## 7. FATO vs. INCERTEZA

### 7.1 Provado nesta sessão

| Fato | Como |
|---|---|
| O kinu-beta publica JWKS com chave **ES256**, `kid 0cff482f-f6c2-43aa-8b7a-4e7e1ffee463` | `curl` no endpoint público → HTTP 200 |
| As duas anon keys do `.env` são **JWT HS256**, `role: anon` | decodificação local do header/payload |
| **11/11** funções devolvem `Access-Control-Allow-Origin: *` | leitura dos 11 arquivos |
| **Nenhuma** função lê o header `Authorization` de entrada | `grep` no diretório inteiro |
| `generate-itinerary` e `feedback-digest` **não têm chamador** em `src/`, `scripts/` ou `package.json` | `grep` |
| `feedback-digest` está neutralizada por 403 em `:27-30` | leitura + commit `d7cbd0d` |
| `google-places` devolve a `GOOGLE_PLACES_API_KEY` embutida em `photoUrl` (`:50`, `:116`) | leitura |
| `amadeus-flights` consome **Travelpayouts**, não Amadeus | `:144`, `TP_BASE_URL` |
| `exchange-rates` desvia para a API paga **antes** de checar o cache | `:49` vs `:53` |
| `ApiStatus` está atrás de `debugMode` | `Dashboard.tsx:110` |

### 7.2 Não verificado — o que a próxima missão precisa buscar no painel

1. **O `alg` do access token real do kinu-beta.** Único item que separa a rota (a) de provada.
   É o Arco 5.a. *(30 segundos, sem código.)*
2. **O schema de `public.events`** no kinu-beta. Não existe no repositório. (A recomendação de não
   usá-la não depende disso — mas a pergunta da missão só fecha com o `\d`.)
3. **O ref real de produção das edge functions.** Aberto desde 03/08. Sem ele, nenhuma sonda feita
   daqui prova nada sobre produção.
4. **Se `feedback-notify` continua aberta hoje.** A prova é de 10/ago; nada no `git log` de
   `supabase/functions/` a alterou desde então, mas o deploy do Lovable não passa pelo `git log`.
5. **Plano e cota** de Travelpayouts, Viator, Unsplash e OpenWeather. Sem isso, o "dano de abuso"
   das funções baratas é qualitativo — sei que é cota, não sei quanta.
6. **Se existe teto de gasto configurado na conta Anthropic.** É o Arco 5.0, e é a diferença entre
   um incidente caro e um incidente ilimitado.
7. **Restrições de referrer/IP** da `GOOGLE_PLACES_API_KEY` e da `GOOGLE_MAPS_EMBED_KEY` no console
   do Google Cloud. Herdado da auditoria, nunca fechado.

---

## 8. Commit e push

**Commit:** `5ecf20d` — `docs: recon arco 5 - rate limiting + CORS nas edge functions`

```
 RELATORIO-RECON-ARCO5.md | 1 file changed (novo)
```

`git status --short` antes do commit: uma única linha, `?? RELATORIO-RECON-ARCO5.md`. Nenhum
arquivo do app foi modificado, como exigido pela missão.

**Push** (`git push origin main`):

```
To https://github.com/PedroContrucci/kinus-clan-compass
   edc18b5..5ecf20d  main -> main
```

Sem `--amend` depois do push, sem `--force`. Esta seção entra em commit `docs:` separado,
conforme a regra da casa.

---

## 9. Conformidade da missão

- **Somente leitura:** nenhum arquivo do app foi tocado. `git status` antes do commit deste
  relatório mostra apenas `RELATORIO-RECON-ARCO5.md` como novo.
- **Regra da casa:** sem `amend`, sem `force`. Este é um relatório novo, em commit novo.
  Relatórios já commitados (`AUDITORIA-SEGURANCA.md`, `RELATORIO-RECON-AUTH.md`,
  `RELATORIO-DEPLOY-EDGE.md`) foram **lidos e citados**, nunca editados.
- **A saída do push** vai em commit `docs:` separado, conforme a regra.

## Adendo (25/ago) — Arco 5.a: PROVADO
- Access token real do kinu-beta decodificado: alg ES256, kid 0cff482f-f6c2-43aa-8b7a-4e7e1ffee463 — o MESMO kid do JWKS publico.
- Rota (a) do recon (verificacao JWT por JWKS dentro das functions do Lovable) sai de 'viavel' para PROVADA. O 5.d e mecanica.
- Arco 5.0 (teto Anthropic) ja cumprido de manha (teto de US$50 bateu e foi ajustado conscientemente).
