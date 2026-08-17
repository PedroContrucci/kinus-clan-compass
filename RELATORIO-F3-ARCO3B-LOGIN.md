# Relatório — F3/Arco 3b+3c: Login real, corte seco do mock e o fim do `kinu_user`

**Data:** 16/ago/2026 · **Status:** ✅ APLICADO — tsc/vitest/build verdes
**Base:** `RELATORIO-RECON-AUTH.md` §6(c) passos 3-7, §6(d) opção A com verniz B,
§2.2, §4, §5.2, §5.4 · `RELATORIO-F3-ARCO3A-AUTH.md` (hook pronto, anon key no
`.env`, Confirm email desligado no painel).
**Decisão do arquiteto:** escopo **ampliado** — 3b e 3c no mesmo commit, para
não abrir a janela em que `/viagens` ficaria inacessível. Verniz em duas frases ·
módulo `legacyAuth.ts` · botão do Google visível.

---

## O que este arco entregou

O KINU passou a ter contas de verdade. O formulário que fingia autenticar virou
`signIn`/`signUp`/`signInWithGoogle` contra o kinu-beta; a chave `kinu_user`
deixou de ser escrita, foi consumida uma última vez para pré-preencher o
cadastro de quem já estava "logado" no mock, e morreu. As quatro telas que a
liam cru passaram pelo hook — **todas respeitando `isLoading`**, que é o que
separa um guard assíncrono de um flash de logout. E o PDF, que é lib e não pode
usar hook, passou a receber o nome por argumento.

| # | Arquivo | Ação | Diff |
|---|---|---|---|
| 1 | `src/lib/legacyAuth.ts` | **NOVO** — `consumeLegacyUser()` | 61 linhas |
| 2 | `src/pages/Login.tsx` | auth real + corte seco + Google + mapa de erros | +181/−14 |
| 3 | `src/pages/Conta.tsx` | hook, guard assíncrono, logout único | +22/−16 |
| 4 | `src/pages/Viagens.tsx` | hook, guard assíncrono, `exporterName` | +32/−13 |
| 5 | `src/pages/DestinationDetail.tsx` | hook, guard assíncrono | +16/−5 |
| 6 | `src/lib/tripPdfExport.ts` | `displayName` por argumento | +30/−24 |
| 7 | `src/components/cockpit/TripPanel.tsx` | prop `exporterName` | +11/−2 |
| 8 | `src/pages/Dashboard.tsx` | passa `user?.name` ao PDF | +1/−1 |

**Total: 8 arquivos, 291 inserções, 77 remoções** (7 modificados + 1 novo).

---

## 1. A prova do arco — `kinu_user` tem uma porta só

```
$ grep -rn "kinu_user" src/
src/hooks/useAuth.ts:17         → comentário
src/lib/legacyAuth.ts:4,5,15    → comentários
src/lib/legacyAuth.ts:17        → const LEGACY_USER_KEY = 'kinu_user'   ← A PORTA
src/lib/legacyAuth.ts:48,58     → mensagens de console.warn
src/lib/tripPdfExport.ts:755,897 → comentários (lápides)
src/test/tripStore.test.ts:247,252,260 → o canário
```

**Zero acesso a `kinu_user` fora do `legacyAuth.ts`.** Nenhum `setItem` em
código de produção — o mock não tem mais produtor. É a mesma prova que encerrou
o Arco 1 com o `kinu_trips`, no mesmo formato.

O **canário do teste** (`tripStore.test.ts:247`) fica como está: ele escreve e
lê a chave direto para provar que `clearTrips()` não a toca. Não passa pelo
Login nem pelo `legacyAuth`, e continua válido enquanto a chave existir como
conceito. Quando o `legacyAuth` for deletado (Arco 4+), trocar o canário por
outra chave estrangeira — `kinu_tester_name` é a candidata natural.

---

## 2. O corte seco (`src/lib/legacyAuth.ts`)

Uma função, um efeito colateral: `consumeLegacyUser()`. O nome é `consume` de
propósito — **ler já é apagar**. Não existe um `readLegacyUser` que alguém possa
chamar duas vezes esperando o mesmo resultado.

| Situação | Retorno | Chave depois |
|---|---|---|
| Chave ausente | `null` | ausente |
| `{"email":"a@b.c","name":"Ana"}` | `{email, name}` | **apagada** |
| `{}` / campos não-string | `{email:'', name:''}` | **apagada** (verniz aparece, prefill vazio) |
| JSON torto | `null` + `console.warn` | **apagada** |
| `localStorage` indisponível | `null` | — |

**JSON torto também apaga:** um mock corrompido não vai virar conta de verdade;
mantê-lo vivo só adiaria o corte para o próximo reload.

**Quando dispara** (`Login.tsx`): `authLoading === false` **e**
`isAuthenticated === false` **e** ainda não rodou nesta montagem. A ordem é o
detalhe que importa — cortar antes de a sessão resolver apagaria a chave de
quem está legitimamente logado. Se **há** sessão e **há** `kinu_user`, não corta:
o efeito de redirect leva para `/dashboard` e a chave sobrevive inofensiva até
alguém abrir `/` deslogado.

Idempotência vem de graça (a segunda chamada não acha chave); o `useRef` no
Login é só para o verniz não piscar no StrictMode do dev.

---

## 3. Os guards — o que mudou de verdade

O ponto de ruptura nº 1 apontado pelo recon §4 era o tempo: guard síncrono
lendo `localStorage` → guard assíncrono esperando a rede. Três telas não tinham
noção de `isLoading` e chutariam todo usuário logado para `/` a cada reload.

| Tela | Guard antes | Guard agora |
|---|---|---|
| `/conta` | `loadJson('kinu_user')` no efeito → `navigate('/')` | `if (!user && !authLoading) navigate('/')` + spinner enquanto carrega |
| `/viagens` | idem (+ carregava as trips no mesmo efeito) | idem, com o **efeito das trips separado** |
| `/destino/:id` | `localStorage.getItem` cru | idem, spinner no tema escuro da tela |

**Em `Viagens.tsx` o efeito foi partido em dois de propósito.** O antigo fazia
guard e `setTrips(listTrips())` no mesmo bloco: amarrar a leitura das viagens
ao `authLoading` faria a tela principal esperar a rede para mostrar dados que
são locais. Agora o guard depende de `user`/`authLoading` e as viagens carregam
no mount, independentes. O sino do storage (`subscribeTrips`) não foi tocado.

Nas três telas o `if (authLoading) return <spinner>` vem **antes** do
`if (!user) return null` — mesma forma do `Cla.tsx:213`. Sem ele, o reload
mostraria tela branca durante a janela assíncrona; com ele, mostra que está
pensando.

---

## 4. O PDF — a lib que não pode usar hook

`exportTripPDF(trip)` virou `exportTripPDF(trip, displayName?)`. Os quatro
chamadores passaram a threadar o nome:

| Chamador | Fonte do nome |
|---|---|
| `Dashboard.tsx:191` | `user?.name` (já tinha `useAuth`) |
| `Viagens.tsx:1832` | `user?.name` (agora tem `useAuth`) |
| `TripPanel.tsx:684, 693` | prop **`exporterName`**, vinda da Viagens |

**Por que prop e não `useAuth()` dentro do TripPanel:** o painel monta a cada
seleção de viagem, e um hook de auth ali abriria uma segunda assinatura do
GoTrue e um `getSession()` extra por montagem. A Viagens já tem o usuário —
passa. O motivo está escrito na interface da prop, não só aqui.

### Uma mudança de comportamento declarada

A heurística antiga rejeitava qualquer nome sem espaço/ponto/hífen
(`isProperName`), porque a fonte era um mock que podia guardar um slug de email
no campo `name`. Agora o nome vem do `toAppUser`, e a regra ficou:

- `'Viajante'` → **omite** (é o último degrau da cascata, ou seja "não sei teu
  nome"; imprimir isso é pior que não imprimir nada);
- contém dígito → **omite** (cheiro de local part de email: `pedro123`);
- resto → title-case e imprime.

**Efeito prático:** um nome próprio de uma palavra só — "Pedro" — **agora
imprime**, e antes não imprimia. É melhoria, não regressão, mas está aqui
declarada porque muda o que sai no papel.

---

## 5. Strings visíveis ao usuário — lista consolidada para a Rachel

Tudo que o usuário pode ler nas telas tocadas. **Novas** = criadas neste arco;
**herdadas** = já existiam e não foram alteradas (listadas para contexto).

### 5.1 Login — corte seco e avisos

| # | String | Quando aparece | Status |
|---|---|---|---|
| 1 | 🌿 O KINU agora tem contas de verdade — crie sua senha pra continuar. Suas viagens continuam salvas neste navegador. | Ao abrir `/` com sessão do mock e sem conta real. Uma vez só | **NOVA** |
| 2 | Conta criada! Confira seu email para confirmar o cadastro e depois entre por aqui. | Só se "Confirm email" for religado no painel. Hoje não aparece | **NOVA** |
| 3 | ou | Separador entre o form e o Google | **NOVA** |
| 4 | Entrar com Google | Botão | **NOVA** |

### 5.2 Login — erros de autenticação (todos novos)

| # | String | Gatilho |
|---|---|---|
| 5 | Email ou senha incorretos. | `invalid_credentials` (senha errada ou conta inexistente) |
| 6 | Esse email já tem conta no KINU — toque em "Entrar". | `user_already_exists` / `email_exists` |
| 7 | Senha muito fraca — use pelo menos 6 caracteres. | `weak_password` (regra do painel) |
| 8 | Sua conta ainda não foi confirmada — confira o link no seu email. | `email_not_confirmed` |
| 9 | Email inválido. | `email_address_invalid` / `validation_failed` (recusa do servidor) |
| 10 | Muitas tentativas seguidas. Espere alguns segundos e tente de novo. | rate limit |
| 11 | O cadastro por email está desligado no momento. | `signup_disabled` |
| 12 | Esse login não está habilitado no momento. | `provider_disabled` — **é o que aparece se o Google não estiver configurado no painel** |
| 13 | Esta conta está bloqueada. Fale com a gente. | `user_banned` |
| 14 | Sem conexão com o servidor. Verifique sua internet e tente de novo. | falha de rede |
| 15 | Não consegui entrar agora. Tente de novo em instantes. | genérico, modo entrar |
| 16 | Não consegui criar sua conta agora. Tente de novo em instantes. | genérico, modo criar |

Os dois genéricos também mandam o erro cru inteiro para o console — erro de
auth engolido vira chamado de suporte sem pista.

### 5.3 Login — validação local e textos de tela (herdados, não mexi)

| # | String | Observação |
|---|---|---|
| 17 | Email inválido | validação local (`includes('@')`) — **note que a #9 tem ponto final e esta não**; se quiser uniformizar, é uma linha |
| 18 | Senha deve ter pelo menos 6 caracteres | validação local, antes de chamar o servidor |
| 19 | Bem-vindo ao clã. O seu próximo horizonte começa aqui. | herdada |
| 20 | Sua jornada, nossa inteligência coletiva. 🌿 | herdada |
| 21 | Entrar no Clã / Criar minha conta | botão, alterna com o modo |
| 22 | Ainda não faz parte do clã? / Já tem conta? | toggle |
| 23 | Junte-se a nós → / Entrar | toggle |
| 24 | Nome / Email / Senha | placeholders |

### 5.4 PDF

| # | String | Quando |
|---|---|---|
| 25 | Preparado para {Nome} | Capa do PDF. Texto **inalterado**; mudou **quando** aparece (§4) |

### 5.5 Conta, Viagens, DestinationDetail

**Nenhuma string nova.** As três só ganharam um spinner (ícone, sem texto). O
card de perfil da Conta continua mostrando `user.name` e `user.email` — agora
vindos da sessão real, com o `name` garantido pelo adaptador do hook.

### 5.6 Perguntas abertas para a revisão

1. **#1 tem duas frases.** A segunda existe para desarmar o pânico de "perdi
   tudo" (é literalmente verdade: `kinu_trips` não foi tocado). Corta?
2. **Tom das mensagens de erro:** hoje é neutro-direto ("Email ou senha
   incorretos."). O resto do app é mais caloroso ("clã", "🌿"). Consistente ou
   frio demais?
3. **#12** é a mensagem que a pessoa vai ver se clicar em "Entrar com Google"
   antes de o provider estar configurado no painel. Vale um texto mais
   específico?
4. **#17 vs #9** — mesma ideia, pontuação diferente.

---

## 6. Prova

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit -p tsconfig.app.json` | 4 erros — **os mesmos 4 do HEAD limpo**, em `GeneratedItineraryStage.tsx` (não tocado). **Zero erro novo** |
| `npx vitest run` | **34/34 passam** (3 arquivos) — inclusive o canário `kinu_user` |
| `npm run build` | ✓ `built in 21.80s` |
| `npx eslint` nos 8 arquivos | **zero problema novo**. Baseline do HEAD nos arquivos tocados: 122; agora: **121** (o corte removeu um). `Login.tsx`, `DestinationDetail.tsx` e `legacyAuth.ts` saem **limpos** |
| `grep -rn "kinu_user" src/` | só `legacyAuth.ts` + comentários + canário do teste (§1) |
| `grep -rn "setItem('kinu_user'" src/` | só o canário do teste. **Zero em produção** |

O baseline do eslint foi medido num worktree limpo do HEAD (`git worktree add`)
para não confundir dívida herdada com regressão — mesmo método do Arco 3a.

---

## 7. Estado do app agora

| Tela | Antes (3a) | Agora |
|---|---|---|
| `/` Login | gravava o mock | **auth real**; com sessão → `/dashboard`; com mock → corte + verniz |
| `/dashboard` | bounce para `/` | **entra** |
| `/cla` | bounce para `/` | **entra** |
| `/conta` | lia o mock cru | **entra** pelo hook; logout único, de verdade |
| `/viagens` | lia o mock cru | **entra** pelo hook, guard assíncrono |
| `/destino/:id` | lia o mock cru | **entra** pelo hook, guard assíncrono |
| `/planejar` | sem guard | **igual** (intencional, decisão do arquiteto) |
| PDF | lia o mock cru | nome por argumento |

**A janela que a 3b sozinha abriria não existe** — foi essa a razão de puxar a
3c para dentro do commit. Não sobrou tela inacessível.

**Nenhum dado se perde:** `kinu_trips` não tem escopo de usuário e ninguém o
tocou. Quem estava no mock cria conta com email e nome já preenchidos e
reencontra as viagens do navegador intactas.

### Teste manual sugerido (Codespace, sem publicar)

1. Com `kinu_user` no storage, abrir `/` → verniz + campos preenchidos + modo
   "criar conta".
2. Criar conta → cai em `/dashboard` sem passar por email.
3. Recarregar → continua dentro (sem flash de logout).
4. `/viagens` e `/destino/:id` → entram; as viagens locais estão lá.
5. Exportar PDF → "Preparado para {seu nome}".
6. `/conta` → "Sair da Conta" → volta para `/`; recarregar `/` → **não** vai
   para o dashboard (a sessão morreu de verdade).
7. Entrar de novo com a mesma senha → volta para o dashboard.

---

## 8. Pendências

1. **Google OAuth no painel do kinu-beta** — Site URL + Redirect URLs
   (Codespace **e** produção). O botão já está na tela; sem a configuração o
   clique cai na mensagem #12, sem quebrar nada.
2. **Aviso `Multiple GoTrueClient instances`** — segue valendo o registrado na
   3a (§6.4): inofensivo, `storageKey` distintos.
3. **Tipos do kinu-beta** — gerar quando o Arco 4 encostar em `trips`.
4. **Canário do teste** — trocar por `kinu_tester_name` no dia em que o
   `legacyAuth.ts` for deletado.
5. **Viagens órfãs** — decisão de ADOÇÃO já tomada; é o Arco 4. Hoje elas
   continuam locais e visíveis, sem dono no banco.
6. **`legacyAuth.ts` tem prazo de validade.** Ele existe para o parque de
   navegadores do beta. Passado o período, o arquivo inteiro se apaga e o grep
   de `kinu_user` no `src/` vai a zero absoluto.
7. **Poeira herdada** (`useSupabaseData.ts:14-15`, tipos sem importador) —
   segue para o Arco 4, como registrado na 3a.

---

## 9. Nenhum Publish

Conforme instruído: **nada foi publicado no Lovable**. O arco fecha completo
(3b+3c juntas), então não há janela pendente — mas a publicação é sua chamada.

---

## Commit

```
feat(f3): arco 3b+3c - Login real, corte seco do mock, Conta/Viagens/DestinationDetail no hook, PDF por argumento (kinu_user: uma porta)
```

**Hash:** `ba120b5` — 9 arquivos (8 de código + este relatório), 657 inserções,
77 remoções.

**Push:**

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   3141d9b..ba120b5  main -> main
```

(O adendo com hash e push é um commit à parte porque a saída de um push não cabe
dentro do commit que ela publica — mesmo padrão do `1e527b3` no Arco 2 e do
`092fea3` na 3a.)

**`STEP1-AUTH-3B.md` deletado** após a aplicação, como combinado — não entrou em
commit nenhum.

## Adendo (17/ago) — Prova manual do Arco 3
- Ambiente: app local no Codespace (npm run dev), storage virgem (dominio novo).
- Login com conta inexistente → 'Email ou senha incorretos.' (mapa de erros OK).
- Criar conta (Confirm email desligado) → /dashboard direto → F5 mantem sessao (guard assincrono OK) → /viagens entra (guard mais caro OK).
- /conta → Sair → / → F5 continua deslogado (sessao Supabase morta de verdade; logout paralelo eliminado) → re-login volta ao dashboard.
- Verniz do corte seco NAO testado (storage virgem, sem kinu_user para consumir; nao foi possivel plantar a chave via DevTools) — codigo revisado, prova fica para primeiro navegador do beta com mock antigo. PDF displayName nao testado (sem viagem) — check leve pos-publish.
- Primeiro usuario real do kinu-beta criado (pedrocontrucci@hotmail.com); conferir profile via trigger no painel.
