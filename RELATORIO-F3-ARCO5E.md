# RELATÓRIO — F3 / Arco 5.e

## Contador persistente + TELEMETRIA da sombra

**Data:** 2026-09-06
**Escopo:** 1 migração + `_shared/telemetry.ts` + `metrics` + o ponto de chamada em `kinu-ai` e
`feedback-notify`. **Cinco arquivos, nada além deles. Zero em `src/`.**
**Base:** `RELATORIO-F3-ARCO5D.md` §6 (o que a sombra tem que dizer) · `RELATORIO-RECON-ARCO5.md`
§5.3, §5.5, §6.2 (fase 5.e), §6.3 itens 3, 4 e 5.
**Commit:** `1f16b40` · **Push:** `c28135b..1f16b40  main -> main`
**Regra da casa respeitada:** `git pull --ff-only` antes, sem `amend`, sem `force`. Este relatório
vai em commit `docs:` separado. `STEP1-ARCO5E.md` nunca entrou em commit.

---

## 0. Veredicto em oito linhas

1. **Aplicado no repositório: 5 arquivos, +15/−0 nos existentes + 3 novos.** As duas functions
   caras agora **persistem** o veredicto da sombra em vez de só logá-lo.
2. **A dupla função foi entregue inteira:** `rate_limits` é o insumo do aperto do 5.f;
   `shadow_daily` é o **telêmetro** — sem ele o critério do 5.f é imensurável, porque a leitura de
   logs pelo Lovable retém só o boot atual.
3. **Nada bloqueia.** Nenhum limite é aplicado, nem por este SQL, nem pelas functions.
   `bump_rate` devolve `hits` e **ninguém lê o retorno** neste arco.
4. **`recordRequest` é síncrona e devolve `void`** — a única forma de o call site não ter como
   esperar por ela nem por engano. §3.1.
5. **O achado do arco:** `alg` é lido **antes** de a assinatura conferir, logo é string controlada
   pelo atacante — sem allowlist, a tabela de telemetria vira amplificador de escrita. §2.3.
6. **28/28 em dois harnesses sobre os arquivos reais**, `158/158` no vitest (baseline atual) e
   `tsc -p tsconfig.app.json` em zero. §6.
7. **A `metrics` é a primeira porta do Arco 5 que fecha** — e nasce fechada: sem
   `METRICS_ALLOWED_SUBS`, 503 e não lê nada. §5.
8. ⚠️ **Nada disso está em produção.** A migração chega por prompt ao Lovable, e a razão está
   documentada com evidência no §4. O roteiro e as sondas estão no §7.

---

## 1. O que foi aplicado

| Arquivo | Estado | Tamanho |
|---|---|---|
| `supabase/migrations/20260906120000_arco5e_rate_limits_shadow.sql` | **novo** | 2 tabelas, 5 funções |
| `supabase/functions/_shared/telemetry.ts` | **novo** | 137 linhas |
| `supabase/functions/metrics/index.ts` | **novo** | 199 linhas |
| `supabase/functions/kinu-ai/index.ts` | tocado | **+7 / −0** |
| `supabase/functions/feedback-notify/index.ts` | tocado | **+8 / −0** |

O patch dentro de cada function é um import e uma chamada que não espera:

```ts
  const who = await shadowIdentify(req, "kinu-ai");
  const corsHeaders = { ...gate.headers, ...shadowHeader(who) };

  recordRequest(req, "kinu-ai", who);   // ← o arco inteiro, do lado da function
```

`corsGate`, `_shared/http.ts`, `verifyKinuBetaJwt.ts`, `config.toml`, `src/` e as outras 8
functions: **intocados** — conferido no `git diff --stat` (15 inserções, 0 deleções).

---

## 2. O banco: duas tabelas, e por quê

### 2.1 Duas, e o argumento que decide é RETENÇÃO

Avaliei a tabela única a sério, como o escopo mandou: uma `counters(scope, key, fn, window, hits)`
genérica cobre os dois papéis com um `upsert` só. **Não serve**, e o motivo que não se dissolve é
o ciclo de vida:

- A linha de `rate_limits` é **lixo** minutos depois de a janela fechar.
- A linha de `shadow_daily` é o **registro histórico** que o critério do 5.f lê em 7 dias e que
  vamos querer guardar por meses.

Uma tabela só força uma política de retenção: ou a faxina do contador apaga a história da sombra,
ou a história obriga a carregar milhões de linhas mortas. Não há terceira opção.

Três argumentos menores, na ordem: postura de privacidade diferente (chave pseudônima por pessoa
de um lado, agregado sem nada ligável a ninguém do outro — juntar faz a tabela permanente herdar
as obrigações da efêmera); padrões de leitura opostos (a varredura do relatório fica fora do
índice quente do `upsert`); e o preço de separar é **15 linhas de SQL**.

É o mesmo princípio que o recon §5.2 usou para recusar a tabela `events` como contador — mas por
uma razão diferente e mais forte: lá a forma era incompatível, aqui a forma é parecida e o **ciclo
de vida** é que não é.

### 2.2 Janela de 1 hora

A rajada já é contida em memória pelo burst guard do 5.c (12/10 s na `kinu-ai`, 3/10 s na
`feedback-notify`). O que falta ao 5.f é **quota**, e quota se escreve em hora ou em dia. Hora é a
granularidade mais fina que ainda agrega para dia **sem perda** — a soma das 24 linhas dá o
diário, e `max(hits)` dá o pico horário do usuário mais pesado, que é exatamente o número que o
critério 3 do 5.d §6.2 pede ("limite por usuário calibrado com número medido").

Por isso `bump_rate(key, fn)` **não recebe parâmetro de janela**: janela parametrizável convida
chamadores a discordarem do balde, e aí os números não somam.

### 2.3 O achado: `alg` é controlado pelo atacante

`verifyKinuBetaJwt.ts:176` recusa `alg !== "ES256"` **antes** de tocar em rede — e portanto antes
de a assinatura conferir. O que significa que o motivo `alg:<qualquer coisa>` que chega à
telemetria é **string escolhida por quem manda o token**.

Sem defesa, alguém que mande 100 mil `alg` distintos escreve 100 mil linhas em `shadow_daily`: a
tabela de telemetria vira **amplificador de escrita**, e o telêmetro do 5.f fica inútil justamente
sob ataque, que é quando ele mais importa.

A defesa é `shadow_outcome_bucket()`: allowlist de desfechos conhecidos, com dois baldes de
prefixo (`alg:other`, `role:other`) e `other` para o resto. Ela mora **no SQL**, de propósito:
corrigir a lista não exige redeploy de function nenhuma — e redeploy aqui custa um prompt ao
Lovable.

Detalhe que quase passou: `role:*` **não** é controlado pelo atacante (a claim só é lida depois de
a assinatura conferir), mas ganhou balde próprio mesmo assim, porque o critério do 5.f conta
`role:*` como motivo de bug. Colapsar em `other` faria o critério **subcontar** exatamente o
defeito que ele existe para detectar.

### 2.4 Atomicidade e privilégio

- **`bump_rate` é um `insert ... on conflict do update ... returning`** — uma instrução. O
  `select`+`update` que o recon §5.5 proíbe perderia a corrida exatamente na rajada.
- **`record_request` faz as duas escritas em UM round-trip** e na mesma transação.
  `bump_rate` e `record_shadow` continuam existindo sozinhas porque o 5.f vai precisar do retorno
  de `bump_rate` de forma síncrona, sem escrever telemetria de novo.
- **RLS ligado, zero policy** = deny-all. Mais `revoke all ... from anon, authenticated`, que é o
  segundo cadeado do Arco 2 §3: sem privilégio de tabela, a requisição nem chega a ser avaliada.
- **`revoke execute ... from public` em todas as 5 funções.** No Postgres, função nasce com
  `EXECUTE` para `PUBLIC` — e `security definer` sozinho **não fecha nada**, só desacopla o
  privilégio da função do de quem chama. Sem o revoke, a anon key (que viaja em todo bundle)
  poderia inflar os contadores, e o insumo do 5.f nasceria forjável.
- **`set search_path` travado** nas 5, que é o pareamento obrigatório de `security definer`.

### 2.5 Contenção de linha — o limite declarado

`shadow_daily` tem uma linha por `(dia, função, desfecho)`. A linha `(hoje, kinu-ai, no-header)` é
atualizada por **toda** requisição anônima: é um ponto de serialização por lock de linha. No
volume do beta é irrelevante (microssegundos). O ponto em que deixa de ser é a casa das **centenas
de escritas por segundo na mesma linha** — se o KINU chegar lá, o desenho vira
`(dia, função, desfecho, shard)` com `shard = random(0..15)` e um `sum()` na leitura. Fica escrito
para não ser redescoberto sob pressão.

---

## 3. O módulo de telemetria

### 3.1 Síncrona, devolvendo `void` — e por que isso é a decisão central

```ts
export function recordRequest(req: Request, fn: string, who: ShadowVerdict | null): void
```

A missão exigiu que falha de telemetria nunca atrase nem derrube a resposta. Havia duas formas de
obedecer: disciplina no call site (`não use await aqui`) ou **um tipo que torna a desobediência
impossível**. Devolvendo `void`, um `await recordRequest(...)` escrito por distração amanhã é um
no-op — em vez de acoplar a resposta do KINU à latência do PostgREST.

Medido: com o `fetch` pendurado, `recordRequest` retorna em **0,18 ms**, e 200 chamadas seguidas
custam **15,5 ms** no total (casos 10 e 12).

### 3.2 Os quatro detalhes que decidem se isto sobrevive em produção

1. **`EdgeRuntime.waitUntil` com guard de `typeof`.** O Edge Runtime do Supabase pode congelar o
   isolate assim que a resposta sai; sem `waitUntil`, a escrita se perde às vezes. Sem o guard,
   seria `ReferenceError` no boot fora do Deno — e é justamente o guard que permite exercitar o
   arquivo real no harness.
2. **Timeout de 2 s no `AbortSignal`.** Não protege a resposta (ela já foi enviada) — protege o
   isolate de ficar preso a um PostgREST pendurado enquanto o runtime espera o `waitUntil`.
3. **`try/catch` em volta de tudo, inclusive da criação da promise**, mais um `.catch()` na
   própria promise. Provado: RPC 500, corpo ilegível, `fetch` que lança sincronamente, `who` nulo
   — nada propaga, e nenhuma rejeição escapa para o processo (caso 19).
4. **Env ausente ⇒ zero fetch.** Sem `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, loga uma vez por
   isolate e sai. Uma function deployada antes da migração não fica batendo em rede à toa.

### 3.3 A chave: `user:<sub>` inteiro, `ip:<hash>` salgado

- **Identificado ⇒ `user:<uuid inteiro>`.** O log da sombra trunca o `sub` em 8 caracteres para
  não virar identificador; o contador precisa do uuid inteiro, porque distinguir pessoas é
  literalmente a função dele.
- **Senão ⇒ `ip:` + SHA-256 salgado, truncado em 16 hex.** O contador não precisa saber quem é,
  só distinguir (recon §5.3: *"ele guarda uma chave opaca, não dado pessoal"*). O sal
  (`KINU_TELEMETRY_SALT`, env com fallback embutido no padrão do 5.c/5.d) eleva o custo de
  reverter — varrer os 4 bilhões de IPv4 e casar o hash é trabalho de minutos sem ele. Não torna
  impossível; a proteção de verdade é a tabela ser deny-all.
- **Sem `x-forwarded-for` ⇒ `ip:unknown`**, e **nenhum hash é calculado** (caso 4). É o balde da
  chamada servidor→servidor `kinu-ai:250` → `google-places` e de todo consumo sem proxy. Conta
  separado de propósito: **no 5.f ele não pode virar limite**, porque todos caem nele juntos.

### 3.4 service_role, e por que isso não amplia superfície

`SUPABASE_SERVICE_ROLE_KEY` **já está no ambiente de toda function deste projeto** —
`feedback-digest:34` a lê literalmente. Lê-la na `kinu-ai` não cria segredo novo: a chave está lá,
sendo lida ou não.

E não é o que o recon §6.3 item 3 proíbe. Aquilo proíbe trazer a service key do **kinu-beta** (o
banco de identidade, cuja RLS o Arco 2 provou 11/11) para dentro das functions do Lovable. Isso
continua proibido e continua não acontecendo: a chave usada aqui é a do **próprio projeto** da
function, para escrever em duas tabelas que este arco criou.

A alternativa — conceder `execute` a `anon` — foi recusada explicitamente: deixaria qualquer
pessoa da internet inflar o contador com a chave que viaja em todo bundle do browser.

---

## 4. Como a migração chega em produção — a pergunta do escopo, respondida com evidência

### 4.1 A descoberta

```
$ git log --format=%an -- supabase/migrations/
gpt-engineer-app[bot]   × 7
```

**As 8 migrations do repositório são todas do bot do Lovable. Nenhuma nossa jamais entrou por
ali.** O fluxo é **Lovable→repo**: o arquivo `.sql` é o *registro* do que o Lovable já aplicou,
não uma instrução que alguém vá ler. Somando ao que já sabíamos:

| Fato | Fonte |
|---|---|
| O Publish não redeploya nem edge function | 5.b, confirmado no 5.d §7 |
| O painel do Supabase do projeto Lovable é inacessível (org deles) | 5.c, adendo |
| Segredo por prompt ao Lovable **funciona** (`ALLOWED_ORIGINS`) | 5.c, Ato 2 |
| Deploy de function por prompt ao Lovable **funciona** | 5.d, adendo de 26/ago |

**Conclusão: um arquivo nosso em `supabase/migrations/` não aplica nada, em nenhuma hipótese.**

### 4.2 Recomendação aplicada: prompt ao Lovable com o SQL inteiro

É o único canal provado duas vezes, não exige painel, não exige credencial que não temos, e o
Lovable é quem tem permissão de DDL neste banco.

**E o arquivo foi commitado assim mesmo**, por três razões: é o que o recon §5.3 pediu (migration
versionada, "no mesmo padrão dos 8 que já existem"); é o registro que sobrevive se o Lovable
regenerar o banco; e é o texto exato que vai no prompt, sem risco de eu reescrever o SQL de
memória.

**Consequência esperada, para não assustar:** o Lovable vai criar **o arquivo dele**, com
timestamp e uuid próprios, e provavelmente regenerar `src/integrations/supabase/types.ts` — tudo
num commit `Changes`. Vamos ficar com dois arquivos com o mesmo DDL. **É por isso que o SQL é
idempotente de ponta a ponta**: aqui isso não é higiene, é requisito operacional.

### 4.3 As alternativas, e por que caem

| Rota | Por que não |
|---|---|
| Edge function que roda o DDL com service_role | PostgREST **não executa DDL**. Exigiria um `exec_sql` que não existe (`types.ts` lista 2 funções no schema, nenhuma delas) — e criá-lo é o mesmo problema de novo |
| `supabase db push` / CLI | Não temos a senha do banco do Lovable, e o painel que a mostra é inacessível. O `.env.sync` guarda a service key do **kinu-beta**, outro projeto |
| Fundador colar no SQL Editor | É o rito do Arco 2 — mas vale para o **kinu-beta**, onde ele é dono. No projeto do Lovable ele não tem painel |
| Criar a tabela na primeira chamada da function | Mesmo problema da primeira linha, com corrida de concorrência de brinde |

---

## 5. A leitura pro fundador — a function `metrics`

### 5.1 Por que uma function, e não um prompt

O 5.d §6.1 já tinha registrado o limite do prompt: serve para a proporção agregada ("80/20 ou
20/80?"), não para série temporal. E o critério do 5.f é **literalmente uma série de 7 dias** —
pedir ao Lovable que leia e transcreva sete números, sete vezes, é frágil no lugar exato onde a
decisão vai ser tomada.

A identidade para fechar a porta **já existe e já está provada em produção** (sonda 2 do 5.d
devolveu `identified` com token real). Reusá-la custou um import.

O prompt ao Lovable fica como **fallback declarado**: se a `metrics` não subir, dá para pedir
`select * from shadow_daily order by day desc limit 50` e seguir. A telemetria não depende da
`metrics` para **existir** — só para ser cômoda.

### 5.2 Fail-closed por construção

| Situação | Resposta |
|---|---|
| `METRICS_ALLOWED_SUBS` não configurado | **503**, e não lê nada |
| Sem `x-kinu-authorization` | **403** |
| Token inválido/expirado/anon key | **403**, motivo só no log |
| `sub` válido mas fora da allowlist | **403**, motivo só no log |
| `sub` na allowlist | 200 com os agregados |

Um deploy sem o segredo não abre coisa alguma. E quem bate na porta não aprende nada sobre por que
ela não abriu.

**Sobre o PROIBIDO:** esta é a primeira porta do Arco 5 que fecha. A proibição de bloquear protege
o **tráfego existente** de `kinu-ai` e `feedback-notify`; uma porta administrativa que nasce
fechada não muda requisição nenhuma que hoje existe. O contrário — endpoint admin aberto — é
exatamente o R-04 que matou a `feedback-digest`.

### 5.3 O que ela devolve, já somado

Não devolve linha crua para o fundador somar à mão. Devolve o **critério do 5.d §6.2** calculado:

| Campo | Critério do 5.f |
|---|---|
| `identifiedPct` | #1 — estável por 7 dias, variação < 10 p.p. de um dia para o outro |
| `bugPctComHeader` | #1 — motivos de bug < 1 % das requisições **que vieram com header** |
| `jwksUnavailablePct` | #2 — < 0,1 % |
| `rate[].max_hits_hour` (kind `user`) | #3 — o número que calibra o limite por usuário |

**O denominador é o ponto.** `bugPctComHeader` divide por `total − no-header`, não por `total`.
Medir motivo de bug contra o total misturaria tráfego anônimo legítimo no divisor e faria qualquer
defeito parecer pequeno — é a correção que o 5.d §6.2 registrou, e agora ela está em código.
O caso 20 do harness a mede: os mesmos dados dão **1 %** com o denominador certo e **0,1 %** com o
errado. Fator 10 na decisão de apertar ou não.

---

## 6. Verificação antes do commit

### 6.1 Harness sobre os arquivos reais — 19/19 + 9/9

`deno` não existe nesta máquina e o `vitest.config.ts:11` só varre `src/**`. Mas nenhum dos dois
arquivos tem import de valor (o `import type` é apagado em compilação) e o Node 24 remove tipos
nativamente — então dá para carregar os **arquivos reais** com `Deno`, `fetch`, `crypto.subtle` e
`EdgeRuntime` falsos.

```
== CHAVE E DESFECHO ==
  ok   1 · identificado => p_key = user:<uuid INTEIRO>, p_outcome = identified
  ok   2 · sem header => outcome no-header e chave ip:<hash>            → ip:7235c18ce69150db
  ok   3 · XFF com vários IPs => usa o PRIMEIRO, sem espaço
  ok   4 · sem XFF => ip:unknown e NENHUM hash calculado                → digests=0
  ok   5 · hash: 16 hex, estável, diferente p/ outro IP, sem o IP em claro
  ok   6 · sal diferente => hash diferente (o sal entra mesmo)
  ok   7 · corpo tem EXATAMENTE p_fn/p_outcome/p_key + auth de service_role

== FALHA DE REDE — o coração deste arco ==
  ok   8 · RPC devolve 500 => não lança, nada propaga
  ok   9 · corpo ilegível (text() lança) => não lança para fora
  ok  10 · fetch PENDURADO => retorna sem esperar; abort ~2s, sem lançar → sync=0.18ms abort=2000ms
  ok  11 · fetch lança SINCRONAMENTE => não propaga
  ok  12 · 200 chamadas com fetch pendurado => total < 50 ms            → 15.51ms
  ok  13 · SUPABASE_SERVICE_ROLE_KEY ausente => zero fetch, zero throw
  ok  14 · SUPABASE_URL ausente => zero fetch, zero throw

== AMBIENTE E LIXO ==
  ok  15 · EdgeRuntime presente => waitUntil recebe a promise; ausente => segue sem lançar
  ok  16 · `who` esquisito (null / sem reason / userId vazio / fn vazio) => não lança
  ok  17 · reason com CRLF => sanitizado antes de sair                  → alg:ES256X-Injetado:1
  ok  18 · recordRequest devolve undefined (contrato da assinatura síncrona)
  ok  19 · nenhuma rejeição escapou para o processo (unhandledRejection)

19 passaram, 0 falharam.
```

```
== CRITÉRIO DO 5.f ==
  ok  20 · bugPctComHeader usa `total − no-header`, não o total  → 1% (contra o total daria 0.1%)
  ok  21 · identifiedPct é sobre o TOTAL                          → 99/1000 = 9.9%
  ok  22 · agrupa por (dia, função) e não mistura funções
  ok  23 · jwksUnavailablePct é sobre o total (critério 2: < 0,1 %)
  ok  24 · role:* conta como BUG NOSSO; malformed e alg:* NÃO (é lixo de terceiro)
  ok  25 · dia 100 % anônimo => bugPctComHeader = null, sem divisão por zero
  ok  26 · ordena por dia DESC e função ASC
  ok  27 · entrada vazia => []
  ok  28 · hits como string ou null não viram NaN (PostgREST devolve bigint como string)

9 passaram, 0 falharam.
```

O STEP1 previa 18 casos; saíram 28. Os extras nasceram de olhar o código depois de escrito — o
caso 9 (corpo ilegível), o 19 (rejeição escapada) e os 6 do `criterio()`, que o STEP1 não previa
testar e que são a aritmética em que o fundador vai agir.

**Um achado do caminho, que vale além deste arco:** o caso 10 travou o harness na primeira
execução. Causa: **`AbortSignal.timeout()` usa timer *unref'd* no Node** — ele não segura o event
loop, e o processo drenou antes de o abort disparar. É andaime de harness (no Deno a requisição em
voo segura o loop), mas é o tipo de coisa que faz um teste de timeout parecer passar sem ter
testado nada. Resolvido com um `setTimeout` ref'd explícito durante a espera.

Os harnesses ficaram em `/tmp/telemetry-check.mjs` e `/tmp/metrics-check.mjs` — **fora do
repositório**, como combinado.

### 6.2 Vitest e `tsc`

- **`npx vitest run` → 158/158, 12 arquivos.** Nenhum teste novo, nenhum arquivo de `src/`
  tocado. A baseline subiu de 133 (do 5.d) para 158 por causa de
  `src/test/generatorNoRepeat.test.ts` e `src/test/placeIdentity.test.ts`, que entraram nos arcos
  no-repeat e sync-catálogo — `git diff --stat 95a8d33..HEAD -- src/test/` confirma que a
  diferença é essa e só essa.
- **`npx tsc --noEmit -p tsconfig.app.json` → exit 0.** A dívida zerada do `tsc`
  (`RELATORIO-TSC-DIVIDA.md`) segue zerada.
- **`tsc --noResolve` sobre `telemetry.ts` e `metrics/index.ts` → zero `TS1xxx`** (nenhum erro de
  sintaxe). O resto é o atrito conhecido de rodar Deno no `tsc` do Node.

### 6.3 Lacuna de verificação — declarada

**Não há Postgres nesta máquina** (mesma lacuna do Arco 2 §6). O SQL do §2 foi **revisado, não
executado**. O que fecha a lacuna é o rito do §7: aplicar a migração, deployar, gerar tráfego e
ver `shadow_daily` com linha. Até lá este arco está *aplicado no repo*, **não** *fechado em
produção* — a mesma distinção que o 5.d fez e honrou.

### 6.4 Escopo do diff

`git diff --stat` antes do commit: **2 arquivos modificados, 15 inserções, 0 deleções**, mais 3
novos. `_shared/http.ts`, `verifyKinuBetaJwt.ts`, `config.toml`, `src/` e as outras 8 functions
intocados. `STEP1-ARCO5E.md` ficou de fora do `git add` e foi deletado depois.

---

## 7. ⚠️ O rito de fechamento — nesta ordem

**A ordem importa e é esta: migração → functions → secret → sondas.**

### Passo 1 — a migração, por prompt ao Lovable

> Apply the following SQL migration to this project's database. It creates two new tables
> (`public.rate_limits`, `public.shadow_daily`) and five functions, all with RLS deny-all and
> `execute` revoked from `PUBLIC`. It does not touch any existing table. The SQL is fully
> idempotent — running it twice is a no-op. Do not modify any edge function in this step.
>
> *(colar o conteúdo INTEIRO de `supabase/migrations/20260906120000_arco5e_rate_limits_shadow.sql`)*

**Esperado:** o Lovable aplica, cria o arquivo de migração dele e provavelmente regenera
`src/integrations/supabase/types.ts`, num commit `Changes`. **Isso é normal** — ver §4.2.

### Passo 2 — as functions, por prompt ao Lovable

> Redeploy the edge functions `kinu-ai` and `feedback-notify`, and deploy the new edge function
> `metrics`. They import a new shared file, `supabase/functions/_shared/telemetry.ts`, which must
> be deployed **together** — deploying any of them without it will fail to boot. `metrics` also
> imports the existing `_shared/verifyKinuBetaJwt.ts` and `_shared/http.ts`. No other function
> should be modified.

**Por que "juntas" está em negrito:** deploy pela metade (function com o import, arquivo
compartilhado ausente) **não sobe a function**, e o sintoma é o KINU mudo, não degradado — é a
lição do 5.d §7.1.

### Passo 3 — o `sub` do fundador e o secret

**Primeiro obtenha seu `sub`.** Logado no app, no Console do DevTools:

```js
JSON.parse(atob(JSON.parse(localStorage['kinu-beta-auth']).access_token.split('.')[1])).sub
```

**Depois, prompt ao Lovable** (mesmo canal que pôs o `ALLOWED_ORIGINS` no ar no 5.c — vale sem
redeploy, assim que o isolate atender a próxima chamada):

> Set the secret `METRICS_ALLOWED_SUBS` for this project to `<o uuid do passo acima>`.

**Sem este passo a sonda 3 devolve 503 — e é o comportamento correto**, não uma falha.

Opcional, no mesmo prompt: `KINU_TELEMETRY_SALT` com qualquer string longa aleatória. Sem ele o
fallback embutido funciona; com ele, o hash de IP fica mais caro de reverter. **Trocar o sal
depois muda todos os hashes** — as chaves antigas viram baldes órfãos que a faxina de 7 dias
recolhe. Se for pôr, ponha agora.

### Passo 4 — a matriz de sondas

A **primeira** é sem header, de propósito: prova que o caminho anônimo — o de 99 % do tráfego —
continua respondendo antes de qualquer teste novo.

```bash
FN=https://<ref>.supabase.co/functions/v1

# 1) NÃO-REGRESSÃO PRIMEIRO: anônimo continua 200, e sem x-kinu-shadow
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -d '{"message":"oi","context":{}}' | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200   e NADA de x-kinu-shadow   (idêntico ao 5.d)

# 2) token válido: a sombra do 5.d segue intacta
curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "x-kinu-authorization: Bearer $TOKEN" \
  -d '{"message":"oi","context":{}}' | grep -i "x-kinu-shadow"
# esperado: x-kinu-shadow: identified

# 3) metrics SEM token => 403 (a porta está fechada)
curl -si -X POST "$FN/metrics" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -d '{}' | head -1
# esperado: HTTP/2 403      (se vier 503, o passo 3 não foi feito)

# 4) metrics com a ANON KEY como token => 403 (o caso do recon §3.5)
curl -si -X POST "$FN/metrics" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "x-kinu-authorization: Bearer $ANON" -d '{}' | head -1
# esperado: HTTP/2 403

# 5) metrics com o SEU token => 200 + os agregados
curl -s -X POST "$FN/metrics" -H 'content-type: application/json' \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "x-kinu-authorization: Bearer $TOKEN" -d '{"days":7}' | jq
# esperado: criterio[] com pelo menos a linha de hoje da kinu-ai, hits > 0
#           ESTA É A PROVA DE QUE A MIGRAÇÃO ENTROU. Se vier
#           {"error":"read-failed"}, a tabela não existe: passo 1 não rodou.

# 6) CORS não regrediu: preflight de origem hostil continua 403 (prova do 5.c)
curl -si -X OPTIONS "$FN/kinu-ai" -H 'Origin: https://evil-lovable.app' \
  -H 'Access-Control-Request-Method: POST' | head -1
# esperado: HTTP/2 403
```

Os dois cabeçalhos (`Authorization: Bearer $ANON` **e** `x-kinu-authorization: Bearer $TOKEN`) vão
juntos de propósito: o primeiro satisfaz o gateway caso a function nova nasça com
`verify_jwt = true`, o segundo é a identidade que a function lê. Assim a sonda funciona nos dois
mundos, sem depender de descobrir qual é.

**Fecho de navegação:** Dashboard → Clã → Viagens com o DevTools aberto e o KINU respondendo uma
mensagem — zero erro de CORS, zero 429. Depois, rode a sonda 5 de novo: `hits` tem que ter subido.
**É a prova de ponta a ponta do arco: tráfego real virou linha no banco.**

### 7.1 Se der errado

| Sintoma | Leitura | Ação |
|---|---|---|
| Sonda 1 não devolve 200 | regressão real | reverter `1f16b40`; a telemetria é aditiva, o revert é limpo |
| KINU mudo, function não responde | deploy sem o `_shared/telemetry.ts` | redeploy com o arquivo compartilhado junto |
| Sonda 5 devolve `read-failed` | migração não chegou | repetir o passo 1 |
| Sonda 5 devolve 503 | `METRICS_ALLOWED_SUBS` ausente | passo 3 |
| Sonda 5 devolve 403 com token bom | `sub` errado na allowlist | reconferir o uuid do passo 3 |
| `criterio[]` vazio mas 200 | tabela existe, sem linha ainda | gerar tráfego e repetir |
| Log com `[5e] record_request respondeu 404` | PostgREST ainda não recarregou o cache de schema | esperar; passa sozinho |
| Log com `[5e] telemetria desligada` | env do projeto sem `SUPABASE_URL`/service key | é anômalo — investigar sem pressa, nada quebra |

---

## 8. O que este arco deliberadamente NÃO fez

- **Não bloqueou nada no tráfego existente.** Nem token ausente, nem inválido, nem contagem
  estourada. `bump_rate` devolve `hits` e ninguém lê o retorno. O aperto é o 5.f.
- **Não tocou no `corsGate`, no `_shared/http.ts`, no `verifyKinuBetaJwt.ts` nem no
  `config.toml`** (recon §6.3 item 2: todo controle no corpo da função).
- **Não tocou em `src/`** — nem código, nem teste, nem dado.
- **Não trouxe a service_role key do kinu-beta** para dentro das functions do Lovable (recon §6.3
  item 3). A chave usada é a do próprio projeto da function, que já estava no ambiente dela.
- **Não instrumentou as outras 8 functions.** As baratas são limite por IP no 5.f e não precisam
  de telemetria de identidade.
- **Não criou retenção para `shadow_daily`.** São ~6 linhas por função por dia; apagar o histórico
  seria destruir exatamente o que este arco existe para construir.
- **Não usou `pg_cron`.** Não dá para verificar se está disponível neste projeto sem painel; a
  faxina oportunista dentro do `bump_rate` não depende de nada.

---

## 9. Estado dos arcos

| Item | Estado |
|---|---|
| 5.0 — teto de gasto na Anthropic | ✅ feito (25/ago) · pendência arquitetural de setembro: separar workspaces kinu-prod / kinu-dev |
| 5.a — identidade via JWKS ES256 | ✅ provado |
| 5.b — matar o órfão `generate-itinerary` | ✅ fechado em produção |
| 5.c — CORS allowlist + burst guard | ✅ fechado em produção |
| 5.d — identidade nas caras (modo sombra) | ✅ fechado em produção (26/ago, 6/6 na matriz) |
| **5.e — contador persistente + telemetria** | **aplicado no repo (`1f16b40`); pendente em produção — §7** |
| 5.f — aperto: sombra vira bloqueio | depende dos **7 dias de série** que o 5.e passa a produzir + do critério do 5.d §6.2 |

**O relógio do 5.f só começa a correr quando o passo 4 do §7 fechar.** Antes disso não há série,
e sem série o critério de estabilidade de 7 dias não tem o que medir.

**Rascunho `STEP1-ARCO5E.md`:** deletado, conforme protocolo. Nunca entrou em commit.
**Harnesses:** `/tmp/telemetry-check.mjs` e `/tmp/metrics-check.mjs`, fora do repositório.

---

## 10. Saída do push

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   c28135b..1f16b40  main -> main
```

O `git pull --ff-only` do início trouxe 26 commits de front (`bae1117..c28135b`) — nenhum deles
tocou em `supabase/`, conferido com `git diff --stat bae1117..c28135b -- supabase/` (vazio). As
premissas do STEP1 seguiram válidas.
