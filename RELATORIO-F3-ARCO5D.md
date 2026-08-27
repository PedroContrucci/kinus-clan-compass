# RELATÓRIO — F3 / Arco 5.d

## Identidade do kinu-beta nas functions caras — MODO SOMBRA

**Data:** 2026-08-26
**Escopo:** `_shared/verifyKinuBetaJwt.ts` (novo) + `kinu-ai` + `feedback-notify` + 4 arquivos do
front. **Nove arquivos, nada além deles.**
**Base:** `RELATORIO-RECON-ARCO5.md` §4.0, §4.1, §3.5, §6.2 (fase 5.d) ·
`RELATORIO-F3-ARCO5C.md` §1.1, §2.3, adendo de 26/ago (painel inacessível, deploy por prompt).
**Commit:** `95a8d33` · **Push:** `9f024cb..95a8d33  main -> main`
**Regra da casa respeitada:** sem `amend`, sem `force`. Este relatório vai em commit `docs:` separado.

---

## 0. Veredicto em sete linhas

1. **Aplicado no repositório: 9 arquivos, +27/−2 nos existentes + 4 arquivos novos.** As duas
   functions mais caras passaram a saber **quem** está chamando — sem bloquear ninguém.
2. **WebCrypto puro, zero dependência.** A assinatura ES256 do JWS é `r||s` de 64 bytes, que é
   exatamente o que `crypto.subtle.verify` consome. Nenhum `npm:jose`, nenhum import no boot. §3.1.
3. **Sombra absoluta mantida:** nenhuma requisição é bloqueada, com ou sem header, válido ou
   inválido. O verificador não lança em caminho nenhum — 21/21 no harness prova isso caso a caso.
4. **O veredicto virou observável sem tocar em um único `return`:** o `x-kinu-shadow` entra pelo
   `corsHeaders`, que as **10** respostas das duas functions já espalhavam. §2 — é a resposta ao
   seu ajuste (a).
5. **`role === 'authenticated'`, estrito.** `anon` e `service_role` caem juntos, e um papel novo do
   Supabase falha **fechado** e aparece no log em vez de entrar calado. §3.3 — ajuste (b).
6. **133/133 no vitest** (126 da baseline + 7 novos) e **`tsc -p tsconfig.app.json` continua em
   zero**. §5.
7. ⚠️ **Nada disso está em produção.** O Lovable não redeploya edge function no Publish. O roteiro
   e as sondas estão no §7.

---

## 1. O que foi aplicado

| Arquivo | Estado | Linhas |
|---|---|---|
| `supabase/functions/_shared/verifyKinuBetaJwt.ts` | **novo** | 268 |
| `supabase/functions/kinu-ai/index.ts` | tocado | +10 / −1 |
| `supabase/functions/feedback-notify/index.ts` | tocado | +9 / −1 |
| `src/lib/kinuAuthHeader.ts` | **novo** | 31 |
| `src/contexts/KinuAIContext.tsx` | tocado | +3 |
| `src/components/dashboard/DashboardKinuTip.tsx` | tocado | +3 |
| `src/components/shared/FeedbackButton.tsx` | tocado | +4 |
| `src/test/kinuAuthHeader.test.ts` | **novo** | 46 |
| `src/test/kinuTipHeader.test.tsx` | **novo** | 54 |

O patch dentro de cada function é **uma linha de comportamento e uma de envelope**:

```ts
const who = await shadowIdentify(req, "kinu-ai");
const corsHeaders = { ...gate.headers, ...shadowHeader(who) };
```

O `corsGate` do 5.c e o `_shared/http.ts` **não foram tocados** — conferido no diff.

---

## 2. O ajuste (a): onde o `x-kinu-shadow` chega, e por que nenhum `return` mudou

Você pediu o inventário **antes** de escrever, e ele mudou o desenho. As dez respostas das duas
functions já montavam os headers do mesmo jeito — `{ ...corsHeaders, 'Content-Type': … }`. Logo,
**mesclar o header do veredicto dentro do `corsHeaders`, uma vez, no topo, alcança as dez sem tocar
em nenhuma delas.** É estritamente melhor que o `withShadowHeader(res, who)` que você autorizou
como alternativa: menos linhas, zero risco de esquecer um caminho de erro, e nada a manter quando
alguém acrescentar a décima primeira resposta amanhã.

### 2.1 `kinu-ai` — 6 respostas, todas cobertas

| Linha | Situação | Status |
|---|---|---|
| 389 | `ANTHROPIC_API_KEY` ausente | 503 |
| 400 | mensagem vazia após sanitização | 400 |
| 655 | upstream da Anthropic devolveu 429 | 429 |
| 661 | upstream da Anthropic não-OK | 502 |
| 701 | **resposta boa** (mensagem + `proposedActions` + `usage`) | 200 |
| 712 | `catch` geral | 500 |

`grep -c '\.\.\.corsHeaders'` = **6**. Seis respostas, seis usos: nenhuma escapa.

### 2.2 `feedback-notify` — 4 respostas, todas cobertas

Linhas 112 (`missing-email-config`), 134 (`resend-failed`), 152 (**sucesso**) e 157 (`catch`).
`grep -c` = **4**. Idem.

### 2.3 Streaming / SSE: **não existe em nenhuma das duas**

`grep -n "ReadableStream\|text/event-stream\|stream"` nas duas functions: **zero ocorrências**. A
`kinu-ai` conversa com a Anthropic em modo não-streaming e devolve JSON de uma vez (`data =
await response.json()`, linha 667). Não há caminho em que os headers já tenham sido enviados antes
de o veredicto existir — que era o risco real por trás da sua pergunta.

### 2.4 Os dois caminhos que **não** recebem o header, de propósito

O 403 de origem hostil e o 429 do burst guard saem do `corsGate` e retornam **antes** do
`shadowIdentify`. É correto: são portas fechadas antes de gastar qualquer coisa, e identificar
quem bateu numa porta fechada custaria uma verificação de assinatura por requisição de ataque.

### 2.5 O recorte que preserva a sombra absoluta

`shadowHeader()` devolve `{}` quando o motivo é `no-header`. Ou seja: **quem não mandou token não
vê header novo nenhum.** Tráfego anônimo — usuário deslogado, `curl`, a chamada servidor→servidor
`kinu-ai:250` → `google-places`, a sonda do `ApiStatus` — sai byte-a-byte igual ao de ontem. O
header só aparece para quem se identificou, e diz apenas o veredicto sobre o token que o próprio
chamador acabou de enviar. Não há o que vazar.

Valores possíveis: `identified` · `rejected:<motivo>` (ex.: `rejected:expired`,
`rejected:role:anon`, `rejected:jwks-unavailable`).

---

## 3. As decisões, e o que cada uma custa

### 3.1 WebCrypto puro, sem `npm:jose`

Três razões, na ordem em que pesam:

1. **O formato bate sem adaptador.** ES256 em JWS é `r||s` cru, 64 bytes — o que
   `crypto.subtle.verify({name:'ECDSA', hash:'SHA-256'})` consome. O caso em que WebCrypto puro
   fica frágil é ECDSA em DER (X.509/OpenSSL); não é o nosso. Não há conversão para errar.
2. **A regra que nos protege, o `jose` não faz sozinho.** `jwtVerify` confere `exp`/`iss`/`aud`,
   mas não recusa `role` errado — e essa é a lição do recon §3.5. Seriam escritas à mão de qualquer
   jeito as ~25 linhas de checagem; o `jose` pouparia o que é fácil, não o que é difícil.
3. **Dependência npm no caminho crítico das duas functions mais caras** faz o cold start depender
   de resolução de módulo, e quebra a regra do `_shared/` sem imports estabelecida no 5.c — que é o
   que permite exercitar o arquivo **real** fora do Deno (§5.1).

**Onde eu voltaria atrás:** RS256, múltiplos `alg`, ou OIDC de verdade. O kinu-beta publica **uma**
chave, ES256 — nada disso está no horizonte.

### 3.2 A ordem da verificação: assinatura ANTES das claims

`exp`, `iss`, `aud`, `role` e `sub` só são lidos depois de `crypto.subtle.verify` dizer que a
assinatura confere. Validar claim de payload não verificado é ler dado do atacante — qualquer
outra ordem é bug esperando data. Está escrito no arquivo, com o comentário
`--- daqui para baixo as claims são confiáveis ---`.

### 3.3 Ajuste (b): `role === 'authenticated'`, ESTRITO — e por quê

Lista branca de um item, e não "diferente de `anon`". As razões, para o registro:

- **`service_role` não é usuário.** Um token de serviço não deve virar identidade de rate limit por
  usuário: ele é infraestrutura, e trataria o 5.e como se fosse uma pessoa. Com a regra frouxa ele
  entraria; com a estrita, cai em `role:service_role`.
- **Lista branca falha FECHADA.** Se o Supabase introduzir um papel novo amanhã, a regra frouxa o
  aceitaria em silêncio; a estrita o recusa e **grava o nome dele no log da sombra** — a diferença
  entre descobrir e não descobrir.
- O alvo declarado do recon §3.5 (a anon key, que viaja em todo bundle) morre nas duas versões, mas
  morre duas vezes na estrita: `alg` HS256 já a barra antes de tocar em rede.

Custo honesto: se o GoTrue mudar o papel padrão, a sombra vai marcar `identified=false` em 100 % do
tráfego até alguém ler o log. Em modo sombra isso não derruba nada — e é exatamente o tipo de coisa
que o 5.f precisa saber antes de apertar.

### 3.4 Os quatro detalhes que decidem se isto sobrevive em produção

1. **JWKS em cache de escopo de módulo** — uma busca por isolate, não por requisição (recon §4.1).
   Provado pelo caso 16 do harness: duas verificações válidas, **um** fetch.
2. **Cooldown de 60 s no refetch.** Sem ele, `kid` aleatório vira **uma chamada de rede por
   requisição** — o mecanismo de rotação de chave viraria amplificador de ataque. Um JWKS buscado
   há instantes não fica menos velho ao ser buscado de novo. Casos 9 e 10.
3. **Timeout de 3 s** (`AbortSignal.timeout`) — JWKS pendurado não segura resposta do KINU.
   Medido: 3001 ms e erro limpo (caso 13).
4. **Sanitização de tudo que vem do token** antes de entrar em header ou log. Um `alg` com `\r\n`
   viraria injeção de header (que o runtime rejeita com 500) ou forja de linha de log. Casos 11 e
   20 — `alg:ES256X-Injetado:1`, sem CR/LF.

### 3.5 Custo por requisição

- **Sem header:** uma leitura de header. **Zero rede** — provado no caso 15.
- **Com header:** ECDSA P-256 em WebCrypto, sub-milissegundo. O único custo real é o primeiro fetch
  do JWKS por isolate (~100–300 ms), pago uma vez na vida do isolate.

### 3.6 O front

`kinuAuthHeaders()` usa `kinuBeta.auth.getSession()` e **não** o `src/lib/session.ts` do 4c: aquele
cacheia o `userId`, não o token, e o token expira em 1 h. O `getSession()` lê do cache em memória
do GoTrue e **renova sozinho se estiver vencido** — é o que impede a sombra de encher de
`reason=expired` por culpa nossa.

Sem sessão, com `error` ou com exceção, o retorno é `{}`. E um `{}` é inócuo no `invoke`: a
condição de `functions-js` (`FunctionsClient.js:69`) entra no **mesmo ramo** de quando `headers` é
`undefined` — o `Content-Type: application/json` continua sendo posto. Verificado no código
instalado (2.93.3), não no doc. Os headers de chamada têm prioridade **acima** dos do cliente
(`FunctionsClient.js:126`), e como só mandamos uma chave nova, o `apikey` e o `Authorization` do
projeto Lovable continuam intactos.

**`ApiStatus.tsx` ficou sem header, de propósito.** É componente de debug; deixá-lo anônimo lhe dá
uma segunda utilidade — passa a ser a sonda que exercita o ramo `identified=false` de dentro do
app, pelo mesmo caminho de um `curl` de estranho. Se mandasse token, o log da sombra misturaria
tráfego real com sonda e a proporção do §6 sairia suja.

---

## 4. O risco que vale escrever

**O access token do kinu-beta passa a trafegar para uma function hospedada na org do Lovable.** É
ampliação real de superfície de confiança: quem interceptasse a requisição teria, por até 1 h, os
direitos RLS daquele usuário no kinu-beta. Três mitigações, todas dentro deste arco:

1. **O header é `x-kinu-authorization`, não `Authorization`.** O gateway do Supabase não o
   interpreta, nada o encaminha por engano, e ele não colide com o `apikey`/`Authorization` do
   projeto Lovable.
2. **O token nunca é logado** — nem truncado, nem em caminho de erro. Só o `sub`, em 8 caracteres:
   bastam para contar usuários distintos, não bastam para o log virar identificador.
3. **Só vai quando existe sessão**, e só para as 2 functions caras. As outras 8 continuam sem
   receber token nenhum.

O que isto **não** é: autenticação. Ninguém é barrado por não mandar token, e quem omite o header
cai no ramo anônimo — como cai hoje, sem nenhuma perda para ele. O ganho deste arco é **medição**;
a proteção é o 5.f, e ela depende de a medição existir primeiro.

---

## 5. Verificação antes do commit

### 5.1 Harness sobre o arquivo real — 21/21

`deno` não existe nesta máquina e o `vitest.config.ts:11` só varre `src/**`. Mas o verificador não
tem imports e o Node 24 remove tipos nativamente — então dá para carregar o **arquivo real** com um
`Deno` falso, um `fetch` falso servindo o JWKS e `Date.now` controlado. O par ES256 é gerado no
próprio harness: **nenhum token real entrou em arquivo nenhum**.

```
== CAMINHO FELIZ ==
  ok   1 · token válido ES256 => userId  → userId=b5c1a2f8-…
  ok  16 · 2ª chamada válida NÃO refaz fetch (cache do isolate)  → fetches=1

== CLAIMS ==
  ok   2 · expirado (exp = agora−120s) => expired
  ok   3 · expirado dentro dos 60s de folga => PASSA
  ok   4 · iss de outro projeto => bad-iss
  ok   5 · aud errada => bad-aud
  ok   6 · ESTRITO: anon, service_role e role ausente => role:anon / role:service_role / role:none
  ok  6.5 · sub ausente => no-sub

== ASSINATURA ==
  ok   7 · assinada por OUTRA chave, kid certo => bad-signature
  ok   8 · payload adulterado após assinar => bad-signature

== JWKS / ROTAÇÃO ==
  ok   9 · kid desconhecido => refetch => aceita a chave nova  → fetches=+1
  ok  10 · kid desconhecido de novo => NÃO refaz fetch (cooldown)  → unknown-kid fetches=+0

== ALG / LIXO (sem tocar em rede) ==
  ok  11 · alg none/HS256/com CRLF => rejeita, sanitiza e não toca em rede
           → alg:none / alg:HS256 / alg:ES256X-Injetado:1 / fetches=+0
  ok  14 · lixo não lança e devolve erro  → malformed ×5

== JWKS FORA DO AR ==
  ok  12 · JWKS 500 no 1º acesso => jwks-unavailable, sem lançar
  ok  13 · JWKS pendurado => aborta em ~3s e devolve erro  → jwks-unavailable em 3001ms

== SOMBRA (envelope + header) ==
  ok  15 · sem header => identified=false reason=no-header e ZERO fetch  → fetches=+0
  ok  17 · sem header => shadowHeader vazio (anônimo sai igual a hoje)
  ok  18 · com token válido => identified=true + header identified
  ok  19 · com token anon => header rejected:role:anon
  ok  20 · reason com CRLF => header sanitizado (sem injeção)

21 passaram, 0 falharam.
```

O STEP1 previa 16 casos; os cinco extras (6.5, 17, 18, 19, 20) cobrem `no-sub`, o recorte do header
e injeção de CRLF — este último nasceu de olhar o próprio código depois de escrito.

O `/tmp/jwt-check.mjs` **não entrou no repositório**, como combinado.

### 5.2 Vitest — 133/133

7 casos novos: 5 em `kinuAuthHeader.test.ts` (com sessão / sem sessão / `error` / exceção /
sessão sem `access_token`) e 2 em `kinuTipHeader.test.tsx`, que renderiza o `DashboardKinuTip` de
verdade e assere que o `invoke` de `kinu-ai` levou o header quando logado e saiu com `{}` quando
deslogado. As 126 da baseline continuam verdes; nenhuma suite alheia foi tocada.

**Um achado do caminho, que vale para o repositório inteiro:** o primeiro `beforeEach` que escrevi
era `beforeEach(() => getSession.mockReset())`. O arrow **devolve o mock**, e o Vitest trata
função devolvida por hook como *teardown* — ele chamava `getSession()` depois de cada teste, e o
`throw` do caso de falha estourava fora do `try/catch` do helper. O teste falhava com um erro que
não era do código. As chaves de `beforeEach(() => { … })` não são estilo: são correção.

### 5.3 `tsc`

`npx tsc --noEmit -p tsconfig.app.json` → **exit 0**. A baseline zerada da dívida do `tsc`
(`RELATORIO-TSC-DIVIDA.md`, commit `2122dbf`) segue zerada.

`tsc --noEmit --noResolve` sobre o verificador + as 2 functions: **zero `TS1xxx`** (nenhum erro de
sintaxe). Os 60 restantes são o atrito conhecido de rodar Deno no `tsc` do Node — `Cannot find name
'Deno'`, imports por URL, `.ts` no import. Detalhe útil: os **2** `TS5097` são exatamente os 2
imports novos de `../_shared/verifyKinuBetaJwt.ts` — confirmação por contagem de que as duas
functions receberam o import.

### 5.4 Escopo do diff

`git status` antes do commit: **9 arquivos, exatamente os da tabela do §1**. `_shared/http.ts`,
`config.toml`, as outras 8 functions e `src/data/` intocados. O `STEP1-ARCO5D.md` ficou de fora do
`git add` e foi deletado depois — nunca entrou em commit.

---

## 6. O que a sombra vai nos dizer, e quando o 5.f pode apertar

### 6.1 Como vamos LER a sombra — (A) + (B)

O painel do Supabase do projeto Lovable é inacessível (adendo do 5.c), então `console.log` sozinho
não é observação. As duas saídas aplicadas:

- **(A) Logs por prompt ao Lovable.** Foi assim que o `ALLOWED_ORIGINS` entrou no ar no 5.c — o
  caminho está provado. Serve para a proporção agregada ("80/20 ou 20/80?"), não para série
  temporal.
- **(B) `x-kinu-shadow` na resposta**, só para quem mandou token. Dá prova pontual e determinística
  por `curl`, de qualquer lugar, sem painel — é o que transforma "deployei" em "provei". Não
  precisa de `Access-Control-Expose-Headers`: quem lê é `curl`, e o JS do app não lê nem precisa.

O que a leitura dessas duas fontes tem que produzir:

- **`identified=true` / total, por função** — a fatia do tráfego que o 5.f poderá limitar por
  usuário em vez de por IP.
- **A distribuição dos motivos.** `no-header` é esperado (deslogado, `curl`, sonda). Mas `expired`,
  `bad-iss`, `bad-aud` ou `role:*` em volume seriam **bug nosso**, não abuso — e a sombra é o único
  lugar onde isso aparece antes de virar 403 na cara do usuário.
- **`unknown-kid` ≠ 0** = rotação de chave no kinu-beta, ou alguém sondando.
- **`jwks-unavailable` ≠ 0** = a confiabilidade real do endpoint; é o número que decide, no 5.f, se
  a política de falha de rede pode ser *fail-closed* em alguma função.

### 6.2 O critério para o 5.f apertar `kinu-ai` — ajuste (c)

Aperta-se quando as quatro forem verdade, e nenhuma antes:

1. **`identified=true` ESTÁVEL por 7 dias corridos — variação < 10 pontos percentuais de um dia
   para o outro — E os motivos de bug (`expired` + `bad-iss` + `bad-aud` + `bad-signature` +
   `role:*`) somando < 1 % das requisições QUE VIERAM COM HEADER.**
   O denominador é o que corrige a versão anterior deste critério: medir motivo de bug contra o
   total misturaria tráfego anônimo legítimo no divisor e faria qualquer defeito parecer pequeno.
2. `jwks-unavailable` < 0,1 %.
3. Existe limite por usuário **calibrado com número medido** — o que exige o contador do 5.e.
4. O comportamento sob falha de verificação está decidido por função e escrito (fail-open ou
   fail-closed), não deixado ao acaso.

### 6.3 `feedback-notify`: DECISÃO, não inclinação — ajuste (d)

**`feedback-notify` NUNCA será apertada por identidade.** Fica registrado como decisão do arco, e
está escrito no código, no comentário do gate da própria function.

O motivo é assimetria de dano: um falso positivo custa o WhatsApp do fundador tocando à toa; um
falso negativo custa **um feedback de testador beta que se perde para sempre** — e feedback de beta
é matéria-prima escassa, não é requisição. O burst guard de 3/10 s por IP do 5.c já resolve o caso
do robô, e é barato porque não depende de o testador estar logado. A sombra continua ligada nela,
mas como **medição pura**: o que ela produz é o número de quantos testadores estão autenticados na
hora de mandar feedback, não um gatilho.

---

## 7. ⚠️ Nada disso está no ar — o roteiro

O Lovable **não redeploya edge function no Publish** (descoberta do 5.b). O código está no `main`;
as duas functions em produção continuam sem sombra até serem redeployadas.

### 7.1 Prompt para o Lovable

> Redeploy the edge functions `kinu-ai` and `feedback-notify`. They now import a new shared file,
> `supabase/functions/_shared/verifyKinuBetaJwt.ts`, which must be deployed together — deploying
> either function without it will fail to boot. No secrets or config changes are needed: the module
> falls back to the public kinu-beta issuer when `KINU_BETA_ISSUER` is unset. Do not modify any
> other function.

**Por que "juntas" está em negrito no prompt:** deploy pela metade (função com o import, arquivo
compartilhado ausente) **não sobe a function** — e o sintoma é o KINU mudo, não degradado.

### 7.2 A matriz de sondas — nesta ordem

A **primeira** sonda de cada função é sem header, de propósito: prova que o caminho anônimo — o de
99 % do tráfego — continua respondendo antes de qualquer teste de identidade.

```bash
FN=https://<ref>.supabase.co/functions/v1

# 1) ANÔNIMO PRIMEIRO: 200 e NENHUM x-kinu-shadow na resposta
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -d '{"message":"oi","context":{}}' | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200   e NADA de x-kinu-shadow

# 2) token válido (pegar no navegador logado:
#    JSON.parse(localStorage['kinu-beta-auth']).access_token)
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "x-kinu-authorization: Bearer $TOKEN" \
  -d '{"message":"oi","context":{}}' | grep -i "x-kinu-shadow"
# esperado: x-kinu-shadow: identified

# 3) lixo no header: rejeita e RESPONDE do mesmo jeito (a sombra não bloqueia)
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "x-kinu-authorization: Bearer nao.e.um.jwt" \
  -d '{"message":"oi","context":{}}' | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200  +  x-kinu-shadow: rejected:malformed

# 4) a anon key do PRÓPRIO Lovable como token (o caso do recon §3.5)
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "x-kinu-authorization: Bearer $ANON" \
  -d '{"message":"oi","context":{}}' | grep -i "x-kinu-shadow"
# esperado: x-kinu-shadow: rejected:alg:HS256   (barrada ANTES de tocar no JWKS)

# 5) feedback-notify anônima — cuidado: dispara WhatsApp de verdade. UMA vez.
curl -si -X POST "$FN/feedback-notify" -H 'content-type: application/json' \
  -H "apikey: $ANON" -d '{"tester_name":"sonda 5d","rating":5,"category":"love","message":"sonda","page":"/probe"}' \
  | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200 e NENHUM x-kinu-shadow

# 6) CORS não regrediu: preflight de origem hostil continua 403 (prova do 5.c intacta)
curl -si -X OPTIONS "$FN/kinu-ai" -H 'Origin: https://evil-lovable.app' \
  -H 'Access-Control-Request-Method: POST' | head -1
# esperado: HTTP/2 403
```

**Fecho de navegação:** Dashboard → Clã → Viagens com o DevTools aberto, e o KINU respondendo uma
mensagem — zero erro de CORS, zero 429, e a dica do dashboard aparecendo. É o mesmo rito que fechou
o 5.c.

### 7.3 Se der errado

| Sintoma | Leitura | Ação |
|---|---|---|
| KINU mudo, function não responde | deploy sem o `_shared/verifyKinuBetaJwt.ts` | redeploy com o arquivo compartilhado junto |
| Sonda 2 devolve `rejected:bad-iss` | o `iss` do token não bate com o do fallback embutido | conferir o ref; se mudou, secret `KINU_BETA_ISSUER` via prompt (sem redeploy, como no 5.c) |
| Sonda 2 devolve `rejected:jwks-unavailable` | rede da function não alcança o kinu-beta | é *fail-open*: nada quebra. Investigar sem pressa |
| Sonda 2 devolve `rejected:expired` | token colado do navegador já venceu | pegar de novo; o app renova sozinho |
| Sonda 1 ou 5 **não** devolve 200 | regressão real do modo sombra | reverter `95a8d33` — as 4 linhas de front são inertes sem as functions |

---

## 8. O que este arco deliberadamente NÃO fez

- **Não bloqueou nada.** Nem token ausente, nem inválido, nem expirado. É a definição do modo
  sombra, e o bloqueio é o 5.f — depois de os números do §6.2 existirem.
- **Não contou nada de forma persistente.** O contador é o 5.e; a sombra só loga e marca.
- **Não tocou nas outras 8 functions**, nem no `_shared/http.ts`, nem no `corsGate`, nem no
  `config.toml` (recon §6.3 item 2: todo controle no corpo da função).
- **Não anexou o header no `ApiStatus.tsx`** — §3.6, é a sonda do ramo anônimo.
- **Não trouxe a service_role key do kinu-beta para dentro das functions do Lovable** (recon §6.3
  item 3). O JWKS é público; verificar assinatura não exige segredo nenhum. Esta é, aliás, a
  propriedade que torna a rota (a) viável.
- **Não mexeu no `generate-itinerary`** — segue com o wildcard herdado do 5.c. Inócuo (é 403 desde
  o 5.b), pendência declarada, ~5 linhas quando quiser.

---

## 9. Estado dos arcos

| Item | Estado |
|---|---|
| 5.0 — teto de gasto na Anthropic | ✅ feito (25/ago) |
| 5.a — identidade via JWKS ES256 | ✅ provado (`4eb95f7` + adendo do recon) |
| 5.b — matar o órfão `generate-itinerary` | ✅ fechado em produção (`371f45d`) |
| 5.c — CORS allowlist + burst guard | ✅ fechado em produção (26/ago, 4 atos) |
| **5.d — identidade nas caras (modo sombra)** | **aplicado no repo (`95a8d33`); pendente em produção — §7** |
| 5.e — contador persistente (`public.rate_limits`) | próximo; depende dos números do 5.d |
| 5.f — aperto: sombra vira bloqueio | depende do 5.e + do critério do §6.2 |

**Rascunho `STEP1-ARCO5D.md`:** deletado, conforme protocolo. Nunca entrou em commit.
**Harness `/tmp/jwt-check.mjs`:** fora do repositório, como combinado.

## Adendo (26/ago, tarde) — Arco 5.d FECHADO EM PRODUCAO
- Deploy via prompt no Lovable: kinu-ai + feedback-notify + _shared/verifyKinuBetaJwt.ts juntos (confirmado pelo Lovable).
- Matriz 6/6: (1) anonimo 200 sem x-kinu-shadow ✅ (2) token real → identified ✅ (3) header invalido → 200 + rejected:malformed ✅ (4) anon key como token → rejected:alg:HS256, sem tocar no JWKS ✅ (5) feedback-notify anonima 200 sem header ✅ (6) preflight hostil 403 — 5.c intacto ✅.
- Front provado em producao: request do app leva x-kinu-authorization (KinuAIContext), response volta x-kinu-shadow: identified. Console sem CORS, sem 429.
- INCIDENTE (nao-regressao): sonda 1 inicial deu 502 (linha 661, upstream Anthropic). Causa: teto mensal da conta Anthropic (US$75) atingido pelas missoes do Claude Code — a chave de producao do kinu-ai divide conta e teto com a chave de dev. Producao ficou sem KINU AI ate a correcao. Correcao: teto 75 → 87, dentro do saldo (17,95 → para em 5,95, acima do gatilho de recarga de 5). REVISAR EM 01/09: contador zera com teto 87 e saldo ~6 → recarga automatica dispara no 1o dolar.
- ADENDO AO 5.0 (pendencia arquitetural, setembro): separar workspaces Anthropic — kinu-prod (chave do kinu-ai, teto proprio) e kinu-dev (Claude Code). Uma missao cara do Code nunca mais derruba producao.
- Consequencia de orcamento: Claude Code em silencio ate 01/09. O 5.e ja precisava de 7 dias de sombra observada — calendario e orcamento alinhados.
- Rito: read -s NAO recebe colagem no terminal do Codespace. Usar ' TOKEN='"..."'' com ESPACO inicial (fora do historico) + clear. Token obtido em DevTools Console: JSON.parse(localStorage['kinu-beta-auth']).access_token.
