# Relatório — F3 / Arco 4b: módulo de sessão observável (sem React)

**Data:** 19/ago/2026 · **Natureza:** um módulo novo, sem React, e uma linha de boot.
Nenhum toque em `useAuth.ts`, `tripStore.ts`, `src/integrations/`, `supabase/`, `src/data/`,
`hotelZones`, `michelinData` ou `types/trip.ts`. Nenhuma rede nos testes.
**Base:** `RELATORIO-RECON-ARCO4.md` §4.1 (opção b), §4.2, §5.2, §6.2, §9 risco 14, §10.2 ·
`src/hooks/useAuth.ts:77-108` (padrão já provado).
**Avais do arquiteto aplicados:** primeira resolução emite mesmo com `null` (§3) ·
`subscribeSession` não chama o listener na assinatura · `getSession` tardio não sobrescreve
estado já resolvido · boot no `App.tsx`, depois da migração da 4a.

---

## 0. O que mudou

| Arquivo | Natureza | Linhas |
|---|---|---|
| `src/lib/session.ts` | **novo** — a sessão como estado observável, sem React | +151 |
| `src/App.tsx` | `startSession()` no boot, logo abaixo da migração da 4a | +6 |
| `src/test/session.test.ts` | **novo** — 13 testes, `vi.mock` do client | +282 |

Três arquivos, nenhum deles com consumidor ainda. Este arco entrega **capacidade**, não
comportamento: quem vai usar as quatro exports é o `tripSync` da 4c.

---

## 1. Por que um módulo, e não um parâmetro

O 4c precisa responder "quem é o usuário?" **no instante em que o sino do `tripStore`
toca** — caminho síncrono, fora de qualquer componente. As duas alternativas morreram no
recon §4.1 e continuam mortas:

| Opção | Por que não |
|---|---|
| (a) `user_id` por parâmetro | envenena a assinatura de `listTrips`/`addTrip`/`updateTrip`/`deleteTrip` e, com ela, os 28 pontos migrados no Arco 1 — empurra auth para handlers de UI que não têm nada com isso |
| (c) `getSession()` direto no store | é `async`: não serve a um `listTrips()` síncrono. E faria uma chamada por operação, acoplando o funil ao cliente do banco |

Sobrou a (b). O estado vive no módulo, não em `useState` — é essa a diferença que importa:
**quem lê não precisa ser componente nem estar montado.**

### 1.1 A API — quatro exports, nada mais

```ts
export function startSession(): void                    // idempotente, chamado uma vez no boot
export function getCurrentUserId(): string | null       // SÍNCRONO, do cache em memória
export function isSessionResolved(): boolean            // false até a primeira resolução
export function subscribeSession(fn): () => void        // devolve unsubscribe
```

Sem storage próprio: quem persiste a sessão é o GoTrue, na chave `kinu-beta-auth`
(`client.ts`). Este módulo é cache em memória e nada mais — não grava nem lê
`localStorage`.

### 1.2 `isSessionResolved()` — o bit que evita o dano

`getCurrentUserId()` devolvendo `null` quer dizer **duas coisas diferentes**: "sem sessão"
e "ainda não sei". Confundir as duas é o risco 1 do recon (🔴): o espelho leria o `null` de
200ms de boot como "usuário anônimo" e adotaria — ou limparia — viagens de alguém que
estava a um piscar de aparecer. `isSessionResolved()` é o mesmo papel do `isLoading` do
`useAuth`, legível de fora do React.

---

## 2. A ordem que fecha a janela

```ts
kinuBeta.auth.onAuthStateChange(...)   // 1. assina PRIMEIRO
kinuBeta.auth.getSession()             // 2. só então pergunta
  .then(...)   // if (resolved) return
  .catch(...)  // console.error + resolve como anônimo
```

Assinar depois abriria a janela em que um evento (login em outra aba, refresh de token,
retorno do OAuth) passa despercebido — a mesma razão documentada em `useAuth.ts:69-76`.

**Uma melhoria consciente sobre o `useAuth`:** lá, o último a escrever vence. Aqui, o
`getSession` **só aplica se o evento ainda não resolveu**. Motivo: o GoTrue v2 sempre emite
`INITIAL_SESSION`, então esse caminho é cinto de segurança; aplicá-lo tarde reabriria
exatamente a janela que a ordem acima fecha — um `SIGNED_IN` chegado no meio seria
sobrescrito pelo retrato **velho** que o `getSession` leu antes do login. Teste 5 prende
esse comportamento.

O `catch` resolve como anônimo em vez de deixar pendente para sempre: rede caída não pode
prender o 4c esperando uma resolução que não vem. "Sem sessão" é estado legítimo, e o
espelho sabe o que fazer com ele — nada.

### 2.1 A regra de emissão

```
1. primeira resolução  -> emite SEMPRE, mesmo com id null
2. depois              -> emite só quando o id MUDA
```

O item 2 é o que a missão pediu: refresh de token chega como evento novo carregando o
**mesmo** id e não acorda ninguém. Sem essa comparação, o espelho do 4c recalcularia o diff
da lista inteira a cada hora, para nada.

O item 1 foi a única decisão levada ao aval no STEP 1, e aprovada: quem assina antes do
boot — o caso exato do `startTripSync()` — precisa de um toque no instante em que a resposta
deixa de ser "ainda não sei". No caminho anônimo esse toque **nunca viria de um evento**, e
a alternativa seria polling em `isSessionResolved()`. Custo: uma emissão com `userId = null`
no boot, que para o assinante da 4c é literalmente um no-op (risco 9 do recon: "sem sessão →
espelho desligado").

`subscribeSession` **não** chama o listener na assinatura: quem assina já lê
`getCurrentUserId()` de forma síncrona na linha seguinte. Mesmo contrato do
`subscribeTrips` do Arco 1 (`tripStore.ts:216`) — uma porta, um sino. E um listener que
lança não derruba os outros, igual ao emit do store (`tripStore.ts:192-200`).

---

## 3. Ponto de chamada — `App.tsx`, escopo de módulo

```tsx
migrateLegacyTripIds();

// DEPOIS da migração, de propósito: quando o espelho do 4c entrar nesta mesma linha, ele já
// encontra todo id em uuid. startSession() não bloqueia nem devolve promessa — só assina o
// GoTrue e dispara o getSession inicial. Idempotente.
startSession();
```

`App.tsx` e não `main.tsx` porque o recon §4.3 já escreveu o destino — *"`startTripSync()` —
chamado uma vez no `App.tsx`, junto com `startSession()`"* — e a 4c encosta a terceira linha
no mesmo bloco. Boot em dois arquivos seria pior de ler e de **ordenar**: a ordem
migração → sessão → espelho vira uma coisa visível, não implícita entre módulos.

A garantia "não depende de render" é a mesma da 4a e não vem de `useEffect`: `main.tsx:2`
importa `App.tsx`, e o corpo de um módulo importado avalia **antes** da linha que chama
`createRoot(...).render()`.

---

## 4. Verificação pedida (recon §10.2 item 2) — o `vi.mock` é obrigatório?

Medido com sonda descartável, criada, rodada e apagada — não sobrou nada no repositório:

```
PROBE_MODE          = test
PROBE_URL_DEFINED   = string  "https://qbhc…"      ← o .env FOI carregado
PROBE_KEY_DEFINED   = string
PROBE_IMPORT        = ok, typeof kinuBeta.auth.onAuthStateChange = function
```

E o que aconteceria sem ele:

```
createClient(undefined, undefined)  →  THREW: supabaseUrl is required.
```

**Resposta:** o Vite **carrega o `.env` também no modo `test`** (é `.env`, não
`.env.<mode>` — vale para todos os modos). Então **hoje**, neste Codespace, o import real do
`client.ts` passaria e o mock não é *tecnicamente* obrigatório. A dúvida do recon fica
resolvida já na 4b, e não na 4c.

Adotado assim mesmo, por dois motivos que não são hipotéticos:

1. num CI sem `.env`, `createClient` lança **no import** — a mensagem exata está acima — e a
   suíte inteira morre antes do primeiro `it`;
2. sem mock não há como roteirizar o `getSession` (rejeitar, pendurar) nem disparar eventos
   do GoTrue. Os testes 3, 5 e 6 seriam impossíveis e os outros fariam **rede real**, que a
   missão proíbe.

Detalhe de implementação que vale registrar: o `vi.mock` é içado acima das declarações do
arquivo, então o duplo mock vive num `vi.hoisted(...)`. E como `startSession()` é idempotente
por design, cada teste precisa de um módulo virgem — `vi.resetModules()` + `import()`
dinâmico. Isso mantém a API pública **exatamente** nas quatro exports: nenhum
`__resetForTests` instalado em produção para servir ao teste.

---

## 5. Testes — 13, todos verdes

| # | Cenário | Asserção |
|---|---|---|
| 1 | resolução inicial **com** sessão | `userId` do `getSession`, `resolved` true, **uma** emissão |
| 2 | resolução inicial **sem** sessão | `null`, `resolved` true, emite `[null]` uma vez |
| 3 | `getSession` **rejeitando** | resolve como anônimo, `console.error`, não prende |
| 4 | ordem do boot | `['onAuthStateChange', 'getSession']` — nessa ordem |
| 5 | evento no meio da janela | `SIGNED_IN` antes do `getSession` resolver → o retrato velho **não** sobrescreve |
| 6 | login via evento | notifica com o `userId` |
| 7 | logout | notifica `null` |
| 8 | **refresh com o mesmo id** | **zero** notificações; `getCurrentUserId()` intacto |
| 9 | troca de conta | notifica o id novo |
| 10 | `unsubscribe` | quem saiu não recebe; quem ficou recebe |
| 11 | `startSession` 2× | `onAuthStateChange` 1×, `getSession` 1×, 1 callback, estado preservado |
| 12 | leitura síncrona | `null`/false antes; valor após resolução; valor logo após evento, **sem await** |
| 13 | listener que lança | não derruba o outro; `console.warn` |

Os 9 casos da missão estão em 1, 2, 3, 6, 7, 8, 10, 11, 12. Os quatro extras (4, 5, 9, 13)
prendem a ordem do boot, a janela do login rápido, a troca de conta e o isolamento de
listener.

| Passo | Resultado |
|---|---|
| `npx tsc --noEmit -p tsconfig.app.json` | **4 erros — exatamente o baseline**, todos pré-existentes em `GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108, `TS2339`). Nenhum novo |
| `npx vitest run` | **59 passando / 59** (5 arquivos). Baseline era 46 — +13 do arquivo novo |
| `npm run build` | ✓ built in 23.35s, sem erro |

```
 ✓ src/test/session.test.ts (13 tests) 65ms
 ✓ src/test/flight-fallback.test.tsx (5 tests) 215ms
 ✓ src/test/tripStore.test.ts (31 tests) 31ms
 ✓ src/test/tripIdMigration.test.ts (9 tests) 14ms
 ✓ src/test/example.test.ts (1 test) 4ms

 Test Files  5 passed (5)
      Tests  59 passed (59)
```

Os 46 testes anteriores seguem intactos: nenhum arquivo existente foi editado.

---

## 6. Efeito para o usuário, e custos declarados

Por fora, **o app é idêntico**. Nenhuma tela lê este módulo; ninguém o consome ainda.

| Efeito | Avaliação |
|---|---|
| **Terceira assinatura do GoTrue** | Risco 14 do recon, 🟡, já aceito. É assinatura no **mesmo** cliente, não cliente novo — o aviso `Multiple GoTrueClient instances` não muda |
| **Um `getSession()` a mais no boot**, inclusive no `/planejar` anônimo | Lê o token de `localStorage`; só vai à rede se precisar renovar. Hoje já acontece um por tela que usa `useAuth` (8 arquivos). Sem sessão não há 401: o GoTrue nem chama |
| **A subscription do GoTrue nunca é cancelada** | Proposital: o módulo vive o tempo do documento e `startSession` é idempotente. Não há `stopSession()` |
| **Estado em módulo** | Duas abas, dois estados independentes — correto: cada aba tem seu GoTrue e recebe seus próprios eventos |
| **`useAuth` intocado** | Confirmado, nenhuma linha. Os 8 consumidores não veem diferença |

**O que este arco NÃO faz:** nada de `trips`, `toRow`, outbox, adoção, hidratação ou diff —
isso é 4c. `session.ts` não importa `tripStore` e não sabe que viagens existem.

**Pré-requisito entregue:** o 4c já pode perguntar, de dentro de um caminho síncrono, quem é
o usuário — e distinguir "anônimo" de "ainda não sei".

---

## 7. Pendências que atravessam para a 4c

1. **Prova de runtime da 4a** segue pendente no navegador de produção (storage com viagens
   legadas); o Codespace tem storage virgem. Adendo da 4a, não resolvida aqui.
2. **Prova de runtime desta entrega:** que `getCurrentUserId()` devolve o uuid real depois de
   um login de verdade só se vê no browser. Vale medir junto com o item 1 — mesma sessão de
   teste manual. Um `console.log` no `/smoke` cobre, e o painel §7.3 do recon é o lugar.
3. **`Multiple GoTrueClient instances`** ganhou de fato a terceira assinatura. Continua
   inofensivo; unificar `useAuth` + `session.ts` é arco futuro.

`STEP1-ARCO4B.md` deletado antes do commit — não entrou no repositório em momento nenhum.

---

## 8. Commit e push

**Commit:** `feat(f3): arco 4b - session.ts: sessao observavel sem React (getCurrentUserId sincrono, subscribeSession)`

Arquivos:

```
src/App.tsx              +6  −0
src/lib/session.ts       (novo, 151 linhas)
src/test/session.test.ts (novo, 282 linhas)
```

Sem `--amend`, sem `--force`, sem `--force-with-lease` — regra da casa reafirmada no adendo
da 4a. A saída do `git push` entra num commit `docs:` **separado**, na seção abaixo, no
padrão dos Arcos 1-3.

### 8.1 Saída do push

<!-- PUSH-OUTPUT -->
