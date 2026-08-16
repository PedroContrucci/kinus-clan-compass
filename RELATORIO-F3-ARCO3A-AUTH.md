# Relatório — F3/Arco 3a: cliente kinu-beta + useAuth sobre Supabase Auth

**Data:** 16/ago/2026 · **Status:** ✅ APLICADO — tsc/vitest/build verdes
**Base:** `RELATORIO-RECON-AUTH.md` §6(a), §6(b), §6(c) passos 0-2, §5.1, §5.2
**Decisões do arquiteto:** corte seco com verniz B → 3b · viagens órfãs =
ADOÇÃO (Arco 4) · `/planejar` sem guard, intencional · `useUserTrips`
**removida** · kinu-beta **sem tipagem gerada** · `.env` rastreado aceito ·
**Opção A** (3a+3b em sequência, sem publicar no meio) · helpers órfãos
removidos · "Confirm email" será desligado no painel antes da 3b.

---

## O que este arco entregou

A identidade do Kinu passou a ser do **kinu-beta**, mas **a interface do hook não
mudou**: `{ user, isLoading, isAuthenticated, login, logout, requireAuth }`
continua igual ao mock. Dashboard e Cla não mudaram uma linha — trocamos as
tripas debaixo deles. E o código adormecido que apontava para o banco errado
morreu antes de ter chance de acordar.

| # | Arquivo | Ação | Antes | Depois |
|---|---|---|---|---|
| 1 | `src/integrations/kinu-beta/client.ts` | **NOVO** — `kinuBeta` | — | 48 linhas |
| 2 | `.env` | +2 vars (`VITE_KINU_BETA_URL`, `VITE_KINU_BETA_ANON_KEY`) | 3 | 5 vars |
| 3 | `src/hooks/useAuth.ts` | tripas reescritas, interface preservada | 62 | 184 linhas |
| 4 | `src/pages/Dashboard.tsx` | `useUserTrips` + merge + 2 helpers órfãos removidos | 481 | 419 linhas |
| 5 | `src/hooks/useSupabaseData.ts` | `useUserTrips` removida | 336 | 357* linhas |

\* o arquivo cresceu 21 linhas líquidas porque a função (28 linhas) saiu e
entrou uma lápide de 4 — a diferença vem do diff real: `-32/+4`. Total do arco:
**215 inserções, 119 remoções, 5 arquivos**.

---

## 1. O cliente novo — `kinuBeta`

Regra gravada no cabeçalho do arquivo, no mesmo espírito do "dois bancos, duas
pastas" do `supabase-beta/README.md`:

> **`supabase` = SERVIÇOS** (Lovable Cloud): edge functions — kinu-ai,
> amadeus-flights, weather, unsplash, exchange-rates, google-places, maps-embed,
> feedback-notify — mais catálogo `community_*` e `beta_feedback`.
> **`kinuBeta` = IDENTIDADE** (kinu-beta, SP): auth, profiles, trips,
> kinu_sessions.
> Nada de auth no primeiro; nada de edge function no segundo.

Config: `storage: localStorage`, `storageKey: 'kinu-beta-auth'`,
`persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
(este último para o retorno do OAuth do Google, na 3b).

**Sem tipagem gerada, por decisão.** O `Database` de
`src/integrations/supabase/types.ts` descreve o schema do **Lovable** — usá-lo
aqui seria mentira tipada: os nomes coincidem (`trips`), as tabelas não (a do
Lovable é colunar; a do kinu-beta é payload-cru, ver migration 001). Até os
tipos do kinu-beta serem gerados, as queries de `profiles`/`trips`/
`kinu_sessions` vêm `any`. Pendência declarada, não esquecida.

**Falha barulhenta:** se faltar `VITE_KINU_BETA_URL` ou `VITE_KINU_BETA_ANON_KEY`,
o console recebe um erro explícito antes do `createClient` reclamar. Credencial
ausente falhando em silêncio é o pior modo de falhar.

---

## 2. O hook — mesma porta, tripas novas

### O que ficou igual (o contrato)

| Membro | Antes | Depois | Quebra? |
|---|---|---|---|
| `user` | `{id?, name, email?}` do localStorage | `{id: uuid, name: string, email?}` da sessão | não — mesmo shape, e agora o `id` **existe de verdade** |
| `isLoading` | true só no 1º render | true até a 1ª resolução da sessão | não — mesmo contrato, janela maior |
| `isAuthenticated` | `Boolean(user)` | idêntico | não |
| `logout` | `() => void` | `() => Promise<void>` | não — usado como `onClick`, retorno ignorado |
| `requireAuth` | `() => boolean` | idêntico | não |

### O que mudou de assinatura (declarado)

`login(name, email?) => User` **síncrono** virou
`login(email, password) => Promise<User | null>` — alias de `signIn`. Custo de
quebra: **zero**. O recon §1.4 provou que `login` não tinha nenhum chamador em
todo o `src/`; quem gravava a sessão era o `Login.tsx` na mão.

### O que é novo (aditivo, para a 3b)

`signIn(email, password)` · `signUp(email, password, name?)` ·
`signInWithGoogle()`.

O `name` do `signUp` viaja em `options.data` → `raw_user_meta_data` no
`auth.users`, que é **exatamente** de onde o trigger `handle_new_user` (migration
001 do Arco 2) tira o `profiles.name`. Um único ponto de entrada para o nome.

O `signUp` devolve `{ user, session }` — e não só `user` — porque com "Confirm
email" ligado a `session` vem `null`: a conta existe, sessão ainda não. Quem
chama é que decide o que dizer. Como o painel vai ter a confirmação desligada
antes da 3b, o caminho normal trará sessão; o retorno em pares fica de rede de
segurança para o dia em que ela for religada.

### Duas decisões de engenharia dentro do hook

**O sino vem antes da leitura.** `onAuthStateChange` é assinado **antes** do
`getSession()`. Assinar depois abriria uma janela em que um refresh de token ou
um logout em outra aba passaria despercebido. Mesmo padrão do `subscribeTrips`
do Arco 1: uma porta, um sino.

**`isLoading` cai na primeira resolução, venha de onde vier** — do evento
`INITIAL_SESSION` ou do `getSession`. E cai **também no `catch`**: rede caída
não pode deixar o app preso no spinner para sempre. "Sem sessão" é um estado
legítimo, e o guard sabe o que fazer com ele.

### O adaptador de `name` (recon §5.2)

`Dashboard.tsx:122` faz `user.name.split(' ')[0]`; `Conta.tsx:81` faz
`user.name.charAt(0)`. Um `name` nulo não é campo vazio — é tela branca. O
Supabase não tem `name`, tem `user_metadata`, que varia por provider. Cascata
implementada em `toAppUser`:

```
user_metadata.name → full_name → nome → local part do email → 'Viajante'
```

Nunca devolve string vazia. `profiles.name` ficou fora da cascata **de
propósito**: exigiria uma query e, no signup, o trigger do Arco 2 grava esse
mesmo metadata lá — as duas pontas leem da mesma fonte.

---

## 3. O código adormecido que morreu (recon §5.1)

`Dashboard.tsx:31` chamava `useUserTrips(user?.id)` → `supabase.from('trips')`
**no projeto Lovable**. Ela nunca rodou de verdade: dependia de um `user.id` que
o mock nunca gravou, então `enabled: Boolean(userId)` a manteve desligada a vida
inteira. Com o uuid real do kinu-beta ela **acordaria** — para perguntar à
tabela `trips` do banco **errado**, por um usuário que não existe lá.

Removidos:
- `Dashboard.tsx`: o import, a chamada, o merge de ~28 linhas, o spinner
  `tripsLoading` e os helpers `getDestinationEmoji`/`calculateProgress` — que só
  eram chamados **dentro** do merge.
- `useSupabaseData.ts`: a função `useUserTrips` inteira.

Os outros 10 hooks do `useSupabaseData` (catálogo do Lovable, usados por Cla,
LogisticsStep, CityAutocomplete e RouteInfo) ficaram intactos. `allTrips`
manteve o nome, então `<AgentCards trips={allTrips}>` e os filtros de
active/draft/completed não mudaram: o Dashboard passa a mostrar **só o
`listTrips()`** — que é literalmente o que ele já mostrava na prática.

Nos dois arquivos ficou uma **lápide** no lugar: um comentário curto dizendo o
que vivia ali e por que saiu. Código adormecido acorda em hora ruim; o registro
impede que ele seja "restaurado" por engano.

---

## 4. Prova

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit -p tsconfig.app.json` | 4 erros — **os mesmos 4 do HEAD limpo**, em `GeneratedItineraryStage.tsx` (arquivo não tocado). **Zero erro novo** |
| `npx vitest run` | **34/34 passam** (3 arquivos) — tripStore 28, flight-fallback 5, example 1 |
| `npm run build` | ✓ 4392 módulos, `built in 22.41s` |
| grep `useUserTrips` no `src/` | 1 ocorrência — **a lápide** em `useSupabaseData.ts:233`. Zero código |
| grep `kinu_user` em `useAuth.ts` | 1 ocorrência — **um comentário** (linha 17). Zero acesso |
| grep `kinu-beta/client` | 1 importador: `useAuth.ts`. Nenhum outro arquivo fala com o kinu-beta ainda |

O baseline do `tsc` foi medido num worktree limpo do HEAD (`git worktree add`)
para não confundir dívida herdada com regressão — os 4 erros são idênticos,
linha por linha.

---

## 5. Estado do app agora (a janela declarada da Opção A)

| Tela | Antes da 3a | Depois da 3a |
|---|---|---|
| `/` Login | grava `kinu_user`, navega para `/dashboard` | **igual** (não tocado) |
| `/dashboard` | lê o mock pelo hook → entra | sem sessão Supabase → `user = null` → guard manda para `/` |
| `/cla` | idem → entra | idem → volta para `/` |
| `/viagens`, `/conta`, `/destino/:id` | lêem `kinu_user` cru → entram | **igual** (não tocados — são a 3b) |
| `/planejar` | sem guard | **igual** (intencional) |

**Quem tem `kinu_user` hoje perde Dashboard e Clã até a 3b.** É bounce, não loop:
Login → `/dashboard` → volta para `/`, e o Login não redireciona sozinho.
**Nenhum dado se perde:** `kinu_trips` não tem escopo de usuário e ninguém o
tocou. Os 6 acessos crus a `kinu_user` (`Login`, `Conta` ×2,
`DestinationDetail`, `Viagens`, `tripPdfExport`) continuam de pé — são
exatamente a lista de trabalho da 3b.

**Condição operacional:** não publicar entre a 3a e a 3b.

---

## 6. Pendências abertas por este arco

1. **`VITE_KINU_BETA_ANON_KEY` está com placeholder** `<A_PREENCHER_PELO_FUNDADOR>`.
   Painel do kinu-beta → Settings → API → **anon / public** (jamais a
   `service_role`). Sem ela nada loga — o que na 3a não muda nada, porque a 3a
   não loga ninguém. **Precisa estar preenchida antes de publicar a 3b.**
2. **"Confirm email"** — desligar no painel antes da 3b (confirmado pelo
   arquiteto). O `signUp` já está preparado para os dois casos.
3. **Google OAuth** — Site URL + Redirect URLs no painel do kinu-beta (URL do
   Codespace **e** a de produção). O `signInWithGoogle` já existe e usa
   `${window.location.origin}/dashboard`.
4. **Aviso `Multiple GoTrueClient instances`** vai aparecer no console. É
   inofensivo aqui: os `storageKey` são distintos (`kinu-beta-auth` × o padrão
   do Lovable) — e storage key compartilhada é justamente a condição que o aviso
   pede para evitar. Custo real: um par de listeners e um timer ociosos.
   **Mitigação futura:** `persistSession: false` + `autoRefreshToken: false` no
   cliente Lovable, que hoje os tem ligados sem autenticar ninguém. Não foi
   feita agora porque o arquivo é gerado pelo Lovable ("Do not edit") e a
   mudança voltaria atrás sem avisar — quando for a hora, num wrapper nosso.
5. **Tipos do kinu-beta** — gerar quando o Arco 4 encostar em `trips`.
6. **Poeira herdada:** `useSupabaseData.ts:14-15` (`export type Trip`,
   `TripActivity`, apontando para a `trips` do Lovable) ficou sem importador.
   São tipos puros — não geram query, não "acordam". Limpar no Arco 4.

---

## 7. Próximo: Arco 3b — Login real e o corte seco

Escopo já desenhado no recon §6(c) passos 3-6 e §6(d): `Login.tsx` usando
`signUp`/`signIn`/`signInWithGoogle`; corte seco do `kinu_user` com verniz B
(pré-preenche email/nome e explica que agora há senha de verdade);
`Conta.tsx` (incluindo matar o logout paralelo da linha 38); `Viagens.tsx:238`
**respeitando `isLoading`** — o guard mais caro de errar; `DestinationDetail`;
e o `tripPdfExport` recebendo `displayName` por argumento (é lib, não pode usar
hook).

Meta de encerramento do Arco 3: `grep -rn "kinu_user" src/` com **zero**
ocorrências fora do módulo de corte de legado.

---

## Commit

```
feat(f3): arco 3a - cliente kinu-beta + useAuth sobre Supabase Auth (interface preservada) + remove useUserTrips do Lovable
```

**Hash:** `8fd915e` — 7 arquivos (5 de código/config + este relatório + o
`RELATORIO-RECON-AUTH.md` do reconhecimento), 215 inserções, 119 remoções.

**Push:**

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   d50dc50..8fd915e  main -> main
```

(O adendo com hash e push é um commit à parte porque a saída de um push não cabe
dentro do commit que ela publica — mesmo padrão do `1e527b3` no Arco 2.)
