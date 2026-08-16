# Relatório — Reconhecimento do Arco 3: Auth real substituindo o mock

**Data:** 16/ago/2026 · **Tipo:** somente leitura (zero modificação em `src/`)
**Escopo:** mapear o mock `src/hooks/useAuth.ts`, seus consumidores, o cliente
Supabase atual, os guards de tela e os riscos da troca — mais a recomendação de
estratégia para o Arco 3.

**Contexto herdado:** Arco 1 entregou o funil hermético de trips
(`src/lib/tripStore.ts`, 12 exports, zero acesso cru a `kinu_trips` fora do
store). Arco 2 entregou o schema do kinu-beta (`profiles`, `trips`,
`kinu_sessions`) com RLS provado 11/11. Falta a identidade que liga os dois.

---

## Sumário executivo (o que este recon achou)

1. **O mock tem duas fontes de verdade divergentes.** `useAuth.login()` monta um
   `User` com `id`; **ninguém chama `login()`**. Quem realmente escreve
   `kinu_user` é `Login.tsx:31`, e ele grava `{ email, name }` — **sem `id`**.
   Ou seja: na prática, o usuário logado hoje **não tem id nenhum**.
2. **O mesmo padrão de vazamento do Arco 1, em escala menor:** 6 acessos crus a
   `kinu_user` em 5 arquivos de produção, fora do hook. O hook cobre 2
   consumidores (Dashboard, Cla); os outros 5 falam com o `localStorage` direto.
3. **O cliente Supabase do app aponta para o Lovable Cloud** (ref `lnhbam…`),
   não para o kinu-beta (ref `qbhcrw…`). **Não existe segundo cliente** em
   lugar nenhum do `src/` — os scripts de sync falam com o kinu-beta via REST +
   service key, fora do browser.
4. **Falta uma credencial:** o kinu-beta só tem *service key* declarada
   (`.env.sync`, git-ignorada). Para o browser é preciso a **anon/publishable
   key** do kinu-beta — ela ainda não existe em lugar nenhum do repo.
5. **O maior risco da troca não é o id: é o tempo.** Hoje o guard resolve
   síncrono (`localStorage.getItem` no primeiro efeito). Com Supabase,
   `getSession()` é assíncrono. As três telas que leem `kinu_user` direto
   (`Viagens`, `Conta`, `DestinationDetail`) **não têm noção de `isLoading`** e
   chutariam todo usuário logado para `/` a cada reload.
6. **Risco silencioso já armado:** `Dashboard.tsx:31` faz
   `useUserTrips(user?.id)`. Hoje `user.id` é `undefined` → a query fica
   desabilitada e ninguém percebe. No dia em que `user.id` virar um uuid real do
   kinu-beta, essa query **acorda e vai consultar a tabela `trips` do Lovable**
   com um id de outro banco.
7. **`user.name` é campo obrigatório na renderização e não existe no Supabase.**
   `Dashboard.tsx:122` faz `user.name.split(' ')[0]`; `Conta.tsx:81` faz
   `user.name.charAt(0)`. `supabase.auth.getUser()` devolve `user_metadata`, não
   `name`. Sem um adaptador que garanta string, é tela branca.
8. **`kinu_tester_name`/FeedbackButton não têm relação com auth** — é uma
   identidade paralela, digitada à mão, que vai para `beta_feedback` **do
   Lovable**. Nada a migrar; no máximo, um pré-preenchimento opcional.

---

## 1. O MOCK HOJE — `src/hooks/useAuth.ts` (62 linhas)

### 1.1 Interface exposta (o contrato a preservar)

```ts
return {
  user,            // User | null
  isLoading,       // boolean — true até o primeiro efeito rodar
  isAuthenticated, // boolean — Boolean(user)
  login,           // (name: string, email?: string) => User   [SÍNCRONO]
  logout,          // () => void  — remove a chave e navega para '/'
  requireAuth,     // () => boolean — navega para '/' se !user && !isLoading
};
```

### 1.2 Formato do objeto `user`

```ts
interface User {
  id: string;      // `user_${Date.now()}`  — só quando criado por login()
  name: string;
  email?: string;  // opcional
}
```

### 1.3 Persistência

- Chave única: **`kinu_user`** no `localStorage`, valor = `JSON.stringify(User)`.
- Leitura: um único `useEffect` de mount (linhas 17-27), com `try/catch` que
  **apaga a chave** se o JSON estiver torto. `setIsLoading(false)` no fim —
  portanto `isLoading` só é `true` durante o primeiro render.
- Escrita: `login()` (linha 35). Remoção: `logout()` (linha 41).
- **Sem TTL, sem expiração, sem refresh, sem verificação de senha.** A sessão
  vale para sempre até alguém limpar o storage.

### 1.4 A divergência estrutural (achado principal do §1)

| Produtor de `kinu_user` | Grava | Chamadores |
|---|---|---|
| `useAuth.login()` (hook) | `{ id, name, email }` | **nenhum** — código morto |
| `Login.tsx:31` | `{ email, name }` — **sem `id`** | é o caminho real |

Consequência: `useAuth().user.id` é **`undefined` em 100% das sessões reais**.
Também são código morto hoje: `isAuthenticated` (nenhum consumidor) e
`requireAuth` (nenhum consumidor — todas as telas escreveram seu próprio guard à
mão). Isso é bom para o Arco 3: **três dos seis membros da interface podem ser
redesenhados sem quebrar ninguém.**

---

## 2. OS CONSUMIDORES — grep de `useAuth` e `kinu_user` em todo o `src/`

### 2.1 Pelo hook (o caminho certo) — 2 arquivos

| Arquivo | Linhas | O que usa | Do objeto user |
|---|---|---|---|
| `src/pages/Dashboard.tsx` | 8, 27, 31, 38-43, 110, 122, 128 | `user`, `isLoading`, `logout` | **`user.id`** (→ `useUserTrips`), **`user.name`** (`user.name.split(' ')[0]`, linha 122) |
| `src/pages/Cla.tsx` | 13, 71, 214, 222 | `user`, `isLoading` | só existência (`if (!user)`) — nenhum campo lido |

### 2.2 Acesso cru ao `localStorage kinu_user` fora do hook — 5 arquivos, 6 pontos

> Mesmo tipo de vazamento que o recon do Arco 1 encontrou em `kinu_trips`
> (28 operações cruas em 8 arquivos). Aqui é menor, mas é a mesma doença.

| Arquivo:linha | Operação | O que faz | Campos lidos |
|---|---|---|---|
| `src/pages/Login.tsx:31` | `setItem` | **único produtor real** da sessão | grava `{ email, name }` |
| `src/pages/Conta.tsx:18` | `loadJson` | guard de tela + preenche perfil | `name`, `email` |
| `src/pages/Conta.tsx:38` | `removeItem` | **logout paralelo** (não usa `useAuth.logout`) | — |
| `src/pages/Viagens.tsx:238` | `loadJson` | guard de tela | `name` |
| `src/pages/DestinationDetail.tsx:17` | `getItem` cru | guard de tela (sem estado, só redirect) | nenhum |
| `src/lib/tripPdfExport.ts:894` | `getItem` cru | personaliza o PDF com o nome | `name`, `email` |

Notas de cada um:

- **`Login.tsx:31`** — a senha é validada só por `length >= 6` (linha 24) e o
  email só por `includes('@')` (linha 19). O toggle `isLogin` muda **apenas o
  texto e o campo Nome**: entrar e criar conta fazem exatamente a mesma coisa.
  Não existe autenticação; existe um formulário.
- **`Conta.tsx:38`** — logout duplicado: remove `kinu_user` e navega. Se o Arco 3
  trocar só o hook, este botão **deslogaria o mock e deixaria a sessão Supabase
  viva** (usuário "sai" e volta logado).
- **`tripPdfExport.ts:894`** — é uma lib, não um componente: **não pode usar
  hook**. Tem heurística própria (nome do perfil → local part do email →
  omite a linha). Precisa receber o nome por argumento.

### 2.3 Testes

`src/test/tripStore.test.ts:247-260` usa `kinu_user` como **canário**: prova que
`clearTrips()` apaga tudo de viagem e **não toca** em `kinu_user`. Não é
consumidor de auth — é uma chave estrangeira que o store deve respeitar. Não
precisa mudar no Arco 3 (o canário continua válido enquanto a chave existir; se
ela morrer, trocar o canário por outra chave estrangeira, p.ex.
`kinu_tester_name`).

---

## 3. O CLIENTE SUPABASE ATUAL

### 3.1 Para onde aponta

`src/integrations/supabase/client.ts` (17 linhas, marcado *"automatically
generated. Do not edit"* — é do Lovable):

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
});
```

**Aponta para o Lovable Cloud.** Prova pelos refs de projeto:

| Origem | Variável | Ref do projeto | Quem é |
|---|---|---|---|
| `.env` (versionado no git) | `VITE_SUPABASE_URL` / `VITE_SUPABASE_PROJECT_ID` | `lnhbamzhturwkhcwiohr` | **Lovable Cloud** |
| `.env.sync` (git-ignorado) | `KINU_BETA_URL` | `qbhcrw…` | **kinu-beta** |

Refs diferentes ⇒ projetos diferentes. Confirmado também pelo
`supabase-beta/README.md`: *"Dois bancos, duas pastas — não misturar"*.

Detalhe: o bloco `auth` já está com `persistSession: true` e
`autoRefreshToken: true`, **mas esse cliente nunca autentica ninguém** — todo o
uso é anônimo.

### 3.2 Existe segundo cliente para o kinu-beta?

**Não.** Grep por `createClient` em todo o repo devolve **um único ponto**:
`src/integrations/supabase/client.ts`. Os três scripts que falam com o kinu-beta
(`scripts/sync-catalog.ts`, `scripts/sync-hotels.ts`,
`scripts/writeback-catalog.ts`) montam URL REST na mão a partir de
`KINU_BETA_URL` + `KINU_BETA_SERVICE_KEY` — rodam em Node, fora do browser, com
a **service key** (que jamais pode entrar no bundle do front).

### 3.3 Mapa das env vars

| Variável | Arquivo | Versionada? | Uso | Vale no browser? |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | **sim (rastreada pelo git)** | cliente Lovable | sim |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | **sim** | cliente Lovable | sim (é pública por design) |
| `VITE_SUPABASE_PROJECT_ID` | `.env` | **sim** | metadado (não usado em código) | — |
| `KINU_BETA_URL` | `.env.sync` | não (`.gitignore`) | scripts de sync | não (sem prefixo `VITE_`) |
| `KINU_BETA_SERVICE_KEY` | `.env.sync` | não | scripts de sync | **NUNCA** |
| `VITE_KINU_BETA_URL` | — | **não existe** | *a criar no Arco 3* | sim |
| `VITE_KINU_BETA_ANON_KEY` | — | **não existe** | *a criar no Arco 3* | sim |

Observação de segurança: `.env` **está rastreado pelo git** (`git ls-files`
confirma; `.gitignore` não o cobre). A publishable/anon key é pública por
projeto — é a RLS que protege — então não é vazamento de segredo, mas a chave
nova do kinu-beta vai herdar esse mesmo destino. Decidir conscientemente
(aceitável) e **jamais** deixar a service key perto desse arquivo.

### 3.4 Quem depende do cliente Lovable hoje (o que a troca NÃO pode desligar)

16 arquivos importam `@/integrations/supabase/client`. O uso é de dois tipos:

- **Edge functions** (o grosso): `kinu-ai` (KinuAIContext, DashboardKinuTip),
  `amadeus-flights` (useFlightSearch, Viagens, TripPanel), `weather`,
  `unsplash`, `exchange-rates`, `google-places`, `maps-embed`,
  `feedback-notify`, além do painel `ApiStatus`.
- **Tabelas do Lovable** via `useSupabaseData.ts`: países, cidades,
  `community_activities`, `community_itineraries`, `community_photos`,
  `trips` (`useUserTrips`) — e `beta_feedback` (insert do FeedbackButton).

Conclusão: **o cliente Lovable fica.** O kinu-beta entra como cliente
*adicional*, não substituto.

---

## 4. FLUXOS DE TELA — guards e redirects (o que a troca não pode quebrar)

`src/App.tsx:77-87` — **nenhuma rota é protegida no router**. Todos os guards
são efeitos dentro de cada página:

| Rota | Página | Guard | Como resolve hoje | Sobrevive ao async? |
|---|---|---|---|---|
| `/` | `Login.tsx` | nenhum | — | — (mas precisa do inverso: redirecionar quem **já** tem sessão) |
| `/dashboard` | `Dashboard.tsx` | `useAuth` + efeito `if (!user && !authLoading) navigate('/')` (38-43); `if (!user) return null` (110) | respeita `isLoading` | **sim** |
| `/cla` | `Cla.tsx` | `useAuth`; spinner se `authLoading` (214); `if (!user) { navigate('/'); return null }` (222) | respeita `isLoading` | **sim**, com ressalva: navega **dentro do render** (efeito colateral em render — funciona, mas é frágil) |
| `/viagens` | `Viagens.tsx` | `loadJson('kinu_user')` no efeito; `if (!user) return null` (1474) | **síncrono** | **NÃO** — sem `isLoading`, chuta todo mundo para `/` |
| `/conta` | `Conta.tsx` | `loadJson('kinu_user')` no efeito (18-22); `if (!user) return null` (49) | **síncrono** | **NÃO** |
| `/destino/:id` | `DestinationDetail.tsx` | `localStorage.getItem` no efeito (16-21) | **síncrono** | **NÃO** |
| `/planejar` | `Planejar.tsx` | **nenhum** | — | — (hoje é rota aberta; decidir se deve virar protegida) |
| `/smoke`, `*` | SmokeTest, NotFound | nenhum | — | — |

**Este é o ponto de ruptura número 1 do Arco 3.** Guard síncrono lendo
`localStorage` → guard assíncrono esperando `getSession()`. Toda tela que não
espere o `isLoading` vira um "flash de logout" no reload.

Redirects existentes que a troca precisa preservar:
- pós-login: `Login.tsx:32` → `/dashboard`
- logout: `useAuth.logout` → `/` e `Conta.tsx:40` → `/`
- guard falho: sempre `/`

---

## 5. RISCOS DA TROCA

### 5.1 `user.id` vira uuid real — o que muda

Hoje o id é `user_${Date.now()}` **quando existe** (e não existe, porque
`Login.tsx` não o grava). Portanto:

**Boa notícia:** nada persistido depende do id do mock. `kinu_trips` **não tem
campo de dono** (o `tripStore` guarda um array global, sem escopo por usuário) e
o `kinu_price_history_*` é indexado por `tripId`, não por usuário. **Não há
migração de dados amarrada ao id antigo.**

**Risco real e único encontrado — `Dashboard.tsx:31`:**

```ts
const { data: supabaseTrips } = useUserTrips(user?.id);
// useSupabaseData.ts:234-260 → supabase.from('trips').eq('user_id', userId)
//                              (no projeto LOVABLE, com enabled: Boolean(userId))
```

Hoje `user?.id === undefined` → `enabled: false` → a query nunca roda e o
Dashboard mostra só as viagens locais. **No dia em que o id virar um uuid do
kinu-beta, essa query acorda** e vai perguntar à tabela `trips` **do Lovable**
por linhas de um usuário que não existe lá. Melhor caso: `[]` silencioso e um
round-trip inútil (o merge das linhas 54-78 vira no-op). Pior caso: erro do
PostgREST derrubando a query, ou — se a RLS do `trips` do Lovable for permissiva
— linhas de **outro** projeto entrando no merge. **Tem que ser tratado no mesmo
passo da troca**, não depois.

Nenhum outro lugar do `src/` lê `user.id`.

### 5.2 `user.name` — o campo que o Supabase não tem

`supabase.auth.getUser()` devolve `{ id, email, user_metadata, ... }` — **não
existe `name`**. Mas o app trata `name` como obrigatório:

- `Dashboard.tsx:122` → `user.name.split(' ')[0]` → **TypeError → tela branca**
- `Conta.tsx:81` → `user.name.charAt(0).toUpperCase()` → idem
- `Conta.tsx:84-85` → renderiza `user.name` e `user.email`
- `tripPdfExport.ts:897` → `String(parsed?.name || '')` (já é defensivo)

O adaptador tem que **garantir string não-nula**, com cascata explícita:
`user_metadata.name` → `profiles.name` (o Arco 2 já popula isso no signup via
`handle_new_user`, lendo `name`/`full_name`/`nome` do metadata) → local part do
email → `'Viajante'`. Em login com Google, `full_name` vem no metadata — a
migration 001 já cobre esse alias.

### 5.3 Dois clientes GoTrue na mesma página

Refs diferentes ⇒ `storageKey` padrão diferente (`sb-<ref>-auth-token`) ⇒ **sem
colisão de sessão**. Mas o `supabase-js` (v2.93) emite o aviso *"Multiple
GoTrueClient instances detected in the same browser context"* e ambos instalam
listeners/refresh timers. Mitigação barata: `storageKey` explícito nos dois e
**desligar `persistSession`/`autoRefreshToken` no cliente Lovable** — ele não
autentica ninguém.

Consequência arquitetural a registrar: as edge functions do Lovable continuarão
recebendo a **anon key**, não o JWT do usuário. Se algum dia uma function
precisar saber *quem* é o usuário, o JWT do kinu-beta **não é verificável** pelo
projeto Lovable. É uma bifurcação futura (Arco 5 / rate limiting), não um
problema do Arco 3 — mas é o motivo pelo qual o rate limiting por usuário terá
que morar no kinu-beta.

### 5.4 Confirmação de email e OAuth

- Se **"Confirm email"** estiver ligado no kinu-beta, `signUp` **não devolve
  sessão** — devolve usuário pendente. `Login.tsx` navegaria para `/dashboard`
  sem sessão e o guard o mandaria de volta para `/`: loop visual. Decidir antes:
  desligar confirmação no beta, ou tratar o estado "confira sua caixa".
- **Google** exige configurar Site URL + Redirect URLs no painel do kinu-beta
  (URL do Codespace **e** a de produção) e `detectSessionInUrl: true` no cliente
  novo. Sem isso o callback volta para lugar nenhum.

### 5.5 FeedbackButton / `kinu_tester_name` — relação com auth: **nenhuma**

`FeedbackButton.tsx:12,50,161` mantém uma identidade **paralela e independente**:
o nome é digitado à mão pelo testador, guardado em `kinu_tester_name`, e enviado
para `beta_feedback.tester_name` **do projeto Lovable** (linha 81) mais a edge
function `feedback-notify` (linha 97). Nunca lê `kinu_user`.

- **Nada a migrar.** Trocar auth não afeta o feedback.
- **Oportunidade (não obrigação):** pré-preencher `testerName` com `user.name`
  após a troca, mantendo o campo editável. Se fizer, cuidado com o
  `!localStorage.getItem('kinu_tester_name')` da linha 161, que decide se o
  campo de nome aparece.
- **Não confundir bancos:** o kinu-beta tem uma tabela `feedback` (vazia, 0
  linhas, esqueleto de iteração anterior — ver `supabase-beta/README.md`) que
  **não é** o `beta_feedback` do Lovable. Unificar isso é outro arco.

### 5.6 Riscos menores catalogados

- `Cla.tsx:222` navega durante o render. Continua funcionando (o `authLoading`
  cobre a janela assíncrona), mas é dívida — mover para efeito quando encostar.
- `Conta.tsx:38` (logout paralelo) deixaria sessão Supabase órfã se esquecido.
- `useAuth.login()` é síncrono e devolve `User`. Virar `async` **não quebra
  ninguém** (zero chamadores) — mas é uma mudança de assinatura a declarar.
- `src/integrations/supabase/types.ts` é o schema **do Lovable**. O cliente do
  kinu-beta precisa dos seus próprios tipos (gerados à parte) ou fica sem
  tipagem no começo — aceitável, desde que declarado.
- O arquivo do cliente Lovable diz *"Do not edit"* porque o Lovable o
  regenera. Qualquer ajuste ali (storageKey, persistSession) **pode ser
  sobrescrito** — outra razão para o cliente novo morar em pasta própria.

---

## 6. RECOMENDAÇÃO DE ESTRATÉGIA

### (a) Hook novo com a MESMA interface, por cima do Supabase Auth do kinu-beta

Manter o contrato `{ user, isLoading, isAuthenticated, login, logout,
requireAuth }` — Dashboard e Cla **não mudam uma linha**. Por baixo:

- `getSession()` no mount + `onAuthStateChange` (a assinatura é o "sino" do
  auth, exatamente como `subscribeTrips` é o sino do storage — mesmo padrão do
  Arco 1: uma porta, um sino).
- `isLoading` só vira `false` depois da **primeira** resolução da sessão. Esse é
  o contrato que segura os guards.
- **Adaptador de `user`**: `{ id: uuid, name: string /* garantido */, email }`,
  com a cascata do §5.2. O resto do app nunca vê o `User` do Supabase.
- `login` passa a ser assíncrono e ganha irmãos: `signIn(email, password)`,
  `signUp(email, password, name)` (com `options.data.name` → o trigger
  `handle_new_user` do Arco 2 já grava em `profiles.name`),
  `signInWithGoogle()`. Custo de quebra: **zero** (nenhum chamador hoje).
- `logout` → `signOut()` + `navigate('/')`, mesmo comportamento externo.
- `requireAuth` continua existindo (é a ferramenta pronta para migrar os guards
  crus das telas do §4).

Regra de ouro do arco, herdada do Arco 1: **uma porta só.** Ao final, `grep -rn
"kinu_user" src/` deve dar zero fora de um eventual módulo de migração de
legado.

### (b) Como os dois clientes convivem

```
src/integrations/supabase/client.ts   → export supabase   (Lovable Cloud)
                                         SERVIÇOS: edge functions + catálogo
                                         community_* + beta_feedback
                                         auth: persistSession false,
                                               autoRefreshToken false,
                                               storageKey explícito
                                         (arquivo gerado pelo Lovable — evitar
                                          editar; se editar, documentar)

src/integrations/kinu-beta/client.ts  → export kinuBeta   (kinu-beta, SP)
                                         IDENTIDADE + DADOS DO USUÁRIO:
                                         auth, profiles, trips, kinu_sessions
                                         env: VITE_KINU_BETA_URL
                                              VITE_KINU_BETA_ANON_KEY
                                         auth: { storage: localStorage,
                                                 storageKey: 'kinu-beta-auth',
                                                 persistSession: true,
                                                 autoRefreshToken: true,
                                                 detectSessionInUrl: true }
```

Frase-regra para o `README` (do mesmo naipe do "dois bancos, duas pastas"):
**`supabase` = serviços; `kinuBeta` = identidade.** Nada de auth no primeiro,
nada de edge function no segundo.

Pré-requisito operacional: obter a **anon key** do kinu-beta no painel e criar
as duas `VITE_KINU_BETA_*`. A service key **nunca** entra em variável `VITE_`.

### (c) Ordem de migração dos consumidores (cada passo verde antes do próximo)

| # | Passo | Arquivo(s) | Por que nessa ordem |
|---|---|---|---|
| 0 | Env + `kinuBeta` client + Auth habilitado no painel (provider email; Google depois) | `.env`, `src/integrations/kinu-beta/client.ts` | sem credencial não há arco |
| 1 | Trocar as **tripas** do `useAuth`, mantendo a interface | `src/hooks/useAuth.ts` | Dashboard e Cla passam a andar de graça; ninguém consegue logar ainda (Login ainda grava o mock) |
| 2 | **Neutralizar `useUserTrips(user?.id)`** | `Dashboard.tsx:31` (+ decidir sobre `useSupabaseData.ts:234`) | o §5.1 tem que morrer **antes** de existir uuid real |
| 3 | `Login.tsx` → `signIn`/`signUp` pelo hook; remover o `setItem` | `src/pages/Login.tsx` | **ponto de não retorno** do `kinu_user`; aplicar aqui a decisão (d) |
| 4 | `Conta.tsx` → `useAuth` (user + logout), matar o `removeItem` próprio | `src/pages/Conta.tsx` | mata o logout paralelo |
| 5 | `Viagens.tsx:238` → `useAuth` **respeitando `isLoading`** | `src/pages/Viagens.tsx` | o guard mais caro de errar (tela principal do produto) |
| 6 | `DestinationDetail.tsx:17` → `useAuth` | `src/pages/DestinationDetail.tsx` | guard simples, sem estado |
| 7 | `tripPdfExport` recebe `displayName` **por argumento** | `src/lib/tripPdfExport.ts:894` + chamadores | é lib, não pode usar hook — a thread vem de quem exporta |
| 8 | Grep de encerramento: zero `kinu_user` fora do módulo de legado; decidir o canário do teste | `src/test/tripStore.test.ts:252` | prova do arco, no mesmo formato do Arco 1 |

Fora de escopo deste arco (registrar, não fazer): subir `kinu_trips` para
`trips.user_id` no kinu-beta. Isso é o Arco 4 — mas a decisão (d) o condiciona.

### (d) Quem está logado no mock hoje — decisão de produto

Situação: existem sessões locais (`kinu_user` com `{email, name}`) que **não
correspondem a conta nenhuma**. A senha nunca foi verificada nem guardada, e o
email nunca foi validado além do `@`. **Não existe caminho técnico que
transforme isso em conta real sem participação da pessoa.**

Atenuante importante: as **viagens não estão em risco**. `kinu_trips` não é
escopado por usuário; apagar `kinu_user` não apaga viagem nenhuma.

| Opção | O que acontece | Custo | Risco |
|---|---|---|---|
| **A — Corte seco** *(recomendada)* | No boot, se há `kinu_user` e não há sessão Supabase, apaga a chave e manda para `/`. Todo mundo cria conta de verdade. | baixo | testador precisa se cadastrar (beta pequeno, custo real ~zero) |
| **B — Ponte de conveniência** | Igual A, mas antes de apagar guarda `email`/`name` e **pré-preenche** o formulário com a mensagem *"o Kinu agora tem contas de verdade — crie sua senha"* | baixo+ | nenhum; é A com boa educação |
| **C — Migração silenciosa** | Criar a conta pelo app sem a pessoa | **inviável** | sem senha; magic link exigiria email válido, que nunca foi validado |
| **D — Convivência (mock + real)** | Manter os dois caminhos por um tempo | alto | dois donos da verdade — exatamente o que o Arco 1 gastou 6 fases para matar |

**Recomendação: A com o verniz de B** — corte seco, com pré-preenchimento do
email/nome e uma frase explicando. Uma linha de código a mais, e o testador não
sente que perdeu nada.

**Decisão acoplada (levar junto para o sócio):** feito o corte, as viagens
locais continuam órfãs no `localStorage`. Duas saídas, a decidir agora porque
condiciona o Arco 4:
1. **Adoção** — a primeira conta que logar naquele navegador "adota" as viagens
   locais e as sobe para `trips.user_id`. Ninguém perde nada; risco de um
   navegador compartilhado doar viagens para a conta errada.
2. **Linha d'água** — o que foi criado no mock fica só local; o banco começa
   limpo. Mais honesto, mais simples de auditar; alguém pode reclamar de "sumiu"
   (não sumiu — só não subiu).

---

## 7. Inventário de referência

**Chaves do `localStorage` no `src/`** (para a decisão (d) e o Arco 4):

| Chave | Dono | Relação com auth |
|---|---|---|
| `kinu_user` | mock de auth (12 ocorrências) | **é o alvo do arco** |
| `kinu_trips` | `tripStore` (funil hermético) | sem escopo de usuário |
| `kinu_price_history_*` | `tripStore` | por `tripId` |
| `kinu_tester_name` | FeedbackButton | identidade paralela — não mexer |
| `kinu_feedback` | FeedbackButton / Conta | fila local de feedback |
| `kinu_saved_activities` | órfã (pendência do Arco 1, §4.7) | nenhuma |
| `kinu_trip_panel_sections` | UI do cockpit | nenhuma |

**Arquivos que o Arco 3 vai tocar (previsão):** `src/hooks/useAuth.ts`,
`src/integrations/kinu-beta/client.ts` (novo), `src/pages/Login.tsx`,
`src/pages/Conta.tsx`, `src/pages/Viagens.tsx`, `src/pages/DestinationDetail.tsx`,
`src/pages/Dashboard.tsx` (só a linha 31), `src/lib/tripPdfExport.ts` +
chamadores, `.env`.
**Não toca:** `src/data/`, `hotelZones`, `michelinData`, `types/trip.ts`,
`tripStore.ts`, `src/integrations/supabase/types.ts`.

---

## 8. Pendências que este recon abre

1. **Anon key do kinu-beta** — não existe no repo; obter no painel.
2. **Confirmação de email no kinu-beta** — ligada ou desligada? Muda o fluxo do
   `Login.tsx` (§5.4).
3. **Site URL / Redirect URLs** para o Google (Codespace + produção).
4. **Decisão (d)** — corte seco e destino das viagens órfãs.
5. **`useUserTrips` do Lovable** — remover de vez ou manter desabilitada? (§5.1)
6. **`/planejar` sem guard** — é intencional ou é lacuna?
7. **Tipos do kinu-beta** — gerar `types.ts` próprio ou seguir sem tipagem no
   primeiro momento.
8. **`.env` rastreado pelo git** — aceitar conscientemente (chave publishable é
   pública) e blindar contra a service key encostar ali.

**Status:** reconhecimento concluído. Zero arquivos modificados; este relatório é
a única escrita da missão.
