# RELATÓRIO — F3 / Arco 4g: o corte MÍNIMO (Fase C formalizada)

**Data:** 2026-08-26
**Status:** ✅ APLICADO. Commit `1d92c8b`.
**Base:** `RELATORIO-F3-ARCO4F-HIDRATACAO.md` (soak 2/2 🟢).
**Decisão do arquiteto:** formalizar, não rearquitetar. `tripStore` síncrono fica
como cache. Leitura não é reescrita.

---

## 0. O que foi decidido e aplicado

As três decisões pendentes no STEP 1 foram respondidas pelo fundador e seguidas
sem desvio:

| # | decisão | resultado |
|---|---|---|
| §2.4 | `online` entra? | **NÃO.** Só `visibilitychange`. |
| §1.4 | texto do modal | **Variante A completa**, incluindo o botão `Apagar tudo`. |
| §4 | `consumeLegacyUser` | **MANTIDO**, revisão em ~meados de nov/2026 (§5). |
| §3 | `ARQUITETURA-DADOS.md` | aprovado **na íntegra**, criado sem edição. |

**Quatro arquivos tocados. Nada além.** `tripStore.ts`, `tripSync.ts`,
`legacyAuth.ts`, `SmokeTest.tsx`, `src/data/`, `supabase/` e
`src/integrations/*` ficaram intactos.

---

## 1. O texto do "Reiniciar Jornada" — `src/pages/Viagens.tsx`

### 1.1 O que mudou

| onde | antes | agora |
|---|---|---|
| título | `Reiniciar Jornada?` | *(mantido)* |
| descrição | `Isso vai remover o roteiro atual e todos os dados salvos.` | `Isso apaga todas as suas viagens: roteiros, orçamentos e histórico de preços.` |
| caixa ⚠️ | `Esta ação não pode ser desfeita.` | `A exclusão é permanente e vale para a sua conta — as viagens somem deste e dos outros dispositivos onde você entrar. Não dá para desfazer.` |
| botão | `Confirmar Reset` | `Apagar tudo` |

### 1.2 A verificação que veio antes das palavras

O texto novo afirma que a exclusão **propaga para a conta**. Isso só podia ser
escrito depois de provar no código que é verdade — e é, por um caminho indireto:

**`clearTrips()` não enfileira nada.** Ele remove `kinu_trips`, varre os
`kinu_price_history_*` e toca o sino (`emit()`). Quem enfileira é o **espelho**,
pelo diff de snapshot: com `kinu_trips` recém-apagado, `next` é vazio e **todo id
do snapshot vira `delete`** (`tripSync.ts`, `diffLocal()`). Já era testado —
`tripSync.test.ts`, teste 5, afirma os dois deletes e o outbox drenado.

**E a hidratação não desfaz o que foi apagado.** Enquanto o `delete` está no
outbox ele entra no `skipRemote` do `getOutboxProtection()` e a linha é pulada na
importação (`tripHydration.ts`, comentário "`delete` pendente: a linha está
prestes a morrer no banco"). Depois do flush, a linha não existe mais no banco.
As duas pontas fechadas.

### 1.3 Onde o texto promete um pouco mais do que entrega

Registrado com franqueza, porque o fundador aprovou sabendo:

- **(a) Sem sessão resolvida, nada sobe.** `handleLocalChange` para no
  `if (!userId) return`. Anônimo apaga só localmente — e não há conta para
  apagar. A frase não se aplica; não mente.
- **(b) O que este navegador nunca viu, não morre.** O diff só conhece o
  snapshot, que é o `localStorage`. Viagem que existe no banco e **nunca foi
  hidratada aqui** não recebe delete. No fluxo normal (logado, adoção decidida,
  hidratação em dia) local == banco e a ressalva é vazia. **Este é o único ponto
  onde "todos os dispositivos" vira "todas as viagens que este dispositivo
  conhece"** — e está declarado no contrato (§3).
- **(c) Permanente ≠ instantâneo.** Offline, os deletes esperam no outbox. Por
  isso a palavra "imediato" não foi usada.

### 1.4 O que NÃO mudou, de propósito

O toast de sucesso (`"Jornada reiniciada! 🌿"`) continua igual. O momento de
avisar do peso é **antes** do clique; um toast sombrio depois de uma ação já
confirmada só gera arrependimento sem oferecer saída.

### 1.5 Ressalva honesta de escopo

O STEP 1 previa "3 strings, zero lógica". Foram as 3 strings **mais uma
className**: `items-center` → `items-start` na caixa ⚠️. Com o texto novo, que
ocupa três linhas, o emoji centralizado verticalmente ficava fora de lugar. É
consequência visual direta da mudança de texto, não escopo novo — mas está
declarado aqui porque não estava na proposta aprovada.

---

## 2. O gatilho de retorno de aba — `src/lib/tripHydration.ts`

### 2.1 O desenho

```ts
const AUTO_HYDRATION_MIN_INTERVAL_MS = 60_000;
let lastAutoHydrationAt = 0;

function hydrateOnReturn(): void {
  const now = Date.now();
  if (now - lastAutoHydrationAt < AUTO_HYDRATION_MIN_INTERVAL_MS) return;
  lastAutoHydrationAt = now;   // carimba na TENTATIVA, não no sucesso
  void hydrateNow();
}
```

e, em `startTripHydration()`, o listener com a guarda `=== 'visible'` mais a
semente `lastAutoHydrationAt = Date.now()`.

Quatro decisões, uma linha cada:

- **O debounce mora no gatilho, não em `hydrateNow()`.** Dentro, ele
  estrangularia o aceite da adoção (que precisa hidratar no instante em que o
  marcador é gravado) e o botão do `/smoke` (instrumento de soak — um instrumento
  que se recusa a medir não serve). **`hydrateNow()` ficou intocado.**
- **Carimba na tentativa.** Erro de rede não vira martelada de um request por
  troca de aba.
- **A semente do boot.** Sem ela, ir e voltar em 5s hidrataria duas vezes no
  boot. É o teste 28.
- **`started` já torna idempotente.** O listener é registrado uma vez; este
  módulo vive o tempo do documento, como os outros três.

### 2.2 `online` ficou de fora — e é escolha, não esquecimento

A diferença entre os dois eventos **não é a frequência, é o que cada um
implica**. `visibilitychange → visible` significa que a pessoa estava **fora da
aba** — ou seja, não estava digitando. É essa implicação, e não o debounce, que
sustenta o "não hidrata enquanto o usuário digita" declarado no cabeçalho da 4f.
`online` não implica nada: dispara numa oscilação de Wi-Fi com o formulário
aberto na tela, que é precisamente o cenário que o arquivo evita.

**O piso de 60s limita QUANTAS vezes; só a escolha do evento limita QUANDO.**
Esse parágrafo está no cabeçalho do arquivo, não só neste relatório, porque é a
pergunta que o próximo a mexer ali vai fazer.

### 2.3 Corridas — a análise que a missão pediu

**(a) Flush e hidratação no MESMO evento — não é corrida nova.** O `tripSync`
já escutava `visibilitychange` para `flush()`; agora o `tripHydration` escuta
para hidratar. A fila pode drenar com o `select` no ar — que é **literalmente** o
cenário que o `prepare()` documenta e fecha com a união `before ∪ after` do
outbox, provada nos testes 15-17 da 4f. **O gatilho novo entra numa janela já
fechada.**

**(b) Hidratações simultâneas:** `if (inFlight) return skip('em-voo')`. Coberto
desde a 4f.

**(c) Sessão trocando durante o voo:** recheca `getCurrentUserId() !== uid`
depois do select. Coberto.

**(d) Hidratar "enquanto digita" — mitigado, não eliminado.** Toda escrita que
passou pelo `updateTrip` está no outbox → `keepLocal` → o banco não a sobrescreve.
Estado de formulário React não é tocado (a hidratação só mexe em `kinu_trips`).
**O caso ruim que sobra:** a viagem foi apagada em OUTRO dispositivo, a hidratação
a remove daqui, e o "Salvar" seguinte cai no `updateTrip: viagem "id" não existe
no storage — nada gravado`; o trabalho não salvo se perde com um `console.warn`.
Exige apagar a viagem noutro aparelho enquanto ela está aberta aqui. **Declarado
no contrato.**

**(e) Eco entre abas — pré-existente, e o gatilho novo o torna mais provável.**
`absorbLocalWrite()` silencia o espelho **da aba que hidratou**; a gravação em
`kinu_trips` dispara `storage` nas OUTRAS abas, cujo diff vê N viagens "mudadas" e
enfileira N upserts de conteúdo que acabou de vir do banco. **Já acontece hoje**
com a hidratação de boot em segunda aba — o 4g não cria o buraco, aumenta a
frequência com que ele pode ser visitado. Aceito e **declarado**: o payload
reenviado é idêntico ao que está no banco (inofensivo no conteúdo, barulhento no
`updated_at`). Fechá-lo pede um marcador cross-tab, que é rearquitetura e não é
4g.

### 2.4 O cabeçalho da 4f foi corrigido

A linha "Nada de `visibilitychange`, `online` ou polling" **deixou de ser
verdade** no instante em que este arco foi aplicado. Um cabeçalho que mente é pior
do que nenhum: foi reescrito para declarar o gatilho novo, o piso e o argumento do
`online`.

---

## 3. O contrato — `ARQUITETURA-DADOS.md`

Criado na raiz, **na íntegra como aprovado**, uma página. Arquivo próprio e não
seção de relatório porque **o contrato sobrevive ao arco**: quem chegar em
novembro para mexer no `tripStore` não vai procurar a doutrina do projeto no meio
do relatório do 4g — vai procurar um arquivo com esse nome.

Contém: a doutrina em cinco linhas, a tabela de quem-lê-e-escreve-o-quê, as cinco
regras que não se quebram, e — a parte que mais importa — **o que o contrato NÃO
promete**: sem tempo real, hidratação pode remover viagem aberta, eco entre abas,
exclusão propaga pelo diff (não por chamada), `schema_version` diferente é
ignorada e nunca apagada.

---

## 4. Testes — `src/test/tripHydration.test.ts`

**126 testes, 8 arquivos, todos verdes.** O arquivo da hidratação foi de 22 para
28.

| # | nome | o que prova |
|---|---|---|
| 23 | aba volta a ficar visível: hidrata | o gatilho existe e chega ao `select` |
| 24 | segundo retorno dentro de 60s: não hidrata | o piso morde |
| 25 | passados 60s, o retorno hidrata de novo | o piso **libera** |
| 26 | `visibilitychange` para hidden: não hidrata | a guarda `=== 'visible'` |
| 27 | o gatilho novo respeita o gate: recusa continua sem hidratar | o gate não foi contornado |
| 28 | o boot semeia o relógio: ir e voltar na hora não hidrata de novo | a semente |

**O par 24+25 anda junto.** Sozinho, o 24 é o teste que passa quando o gatilho
nunca foi registrado — o modo de falha mais fácil de não perceber. O 25 é o que
transforma o 24 em prova.

### 4.1 Duas ferramentas novas, e por que cada uma existe

**`vi.useFakeTimers({ toFake: ['Date'] })` — só `Date`.** O `tick()` do harness
depende de um `setTimeout` real; falsificar os timers inteiros travaria o arquivo.
O relógio do debounce é `Date.now()`, então falsificar `Date` basta.

**Um dublê de `document.addEventListener` que registra e ENGOLE.** Esta merece
explicação, porque sem ela os testes **contariam errado**: `vi.resetModules()`
cria uma instância nova do módulo a cada `fresh()`, mas as instâncias
**anteriores continuam vivas** — o listener delas ficou no mesmo `document` e não
existe `stopTripHydration()` para removê-lo. Um `dispatchEvent` de verdade
acordaria a hidratação de todos os testes já rodados, cada uma somando `select` ao
mesmo `db.state`. Capturando os handlers da rodada atual e chamando só eles, o que
se mede é a instância sob teste. O handler do `tripSync` entra na captura junto,
de propósito: é o cenário real dos dois no mesmo evento.

### 4.2 O painel do `/smoke` NÃO mudou

`SmokeTest.tsx` já lê `getHydrationStatus()` e mostra `lastHydrationAt` — o
gatilho novo aparece lá de graça, com o horário passando a se atualizar sozinho ao
voltar para a aba. Expor `lastAutoHydrationAt` no `HydrationStatus` (para
distinguir "não hidratou porque o piso mordeu" de "porque o gate barrou") foi
**considerado e cortado**: campo novo em tipo público mais linha nova de painel,
para uma pergunta que os testes 24/25 já respondem em CI.

**Consequência declarada: nenhum A/B do smoke nesta rodada.**

---

## 5. Pendências herdadas

### `consumeLegacyUser` — MANTIDO, revisão em ~meados de novembro/2026

61 linhas em `src/lib/legacyAuth.ts`, **um único chamador** (`Login.tsx`). A meta
do Arco 3 (`grep kinu_user` limpo fora do arquivo) **já está cumprida** — ele não
é vazamento pendente, é parede terminada.

Por que fica: o custo é um `getItem` por montagem do `/login`, sem rede, banco,
timer ou listener; **ele se autoextingue** (cada uso destrói a própria chave, a
população só diminui); e **a assimetria decide** — manter e estar errado são 61
linhas mortas no bundle, remover e estar errado faz alguém que não abre o app há
mais de nove dias digitar e-mail e nome de novo, que é exatamente o que o arquivo
existe para evitar. Nove dias de corte seco é pouco, e não há telemetria: remover
agora seria decidir no palpite.

**Gatilho da revisão:** ~meados de novembro/2026 (90 dias do corte seco), **ou**
antes se houver telemetria dizendo que `consumeLegacyUser()` não devolve
não-`null` há N semanas. A remoção será um commit de 3 linhas: apagar o arquivo,
o import e a chamada.

### Eco entre abas

Não é dívida deste arco (§2.3e), mas é a limitação declarada mais provável de
aparecer num soak com duas janelas lado a lado. Fechá-la pede um marcador
cross-tab (`kinu_trips_hydrated_at` lido pelo handler de `storage`) — candidata
natural a um arco próprio, se o barulho no `updated_at` incomodar.

---

## 6. Verificação

| passo | resultado |
|---|---|
| `npx tsc --noEmit -p tsconfig.app.json` | **0 erros** (baseline morreu em `2122dbf`; qualquer erro agora seria meu) |
| `npx vitest run` | **126 passed** (8 arquivos) — 120 + 6 novos |
| `npm run build` | ✓ verde em 21.89s |
| arquivos tocados | 4, exatamente os previstos |

Commit `1d92c8b`, sem `amend` e sem `force`. `RELATORIO-TSC-DIVIDA.md` foi
restaurado pelo fundador antes da aplicação e não aparece no diff.

---

## 7. O que este arco fechou

A Fase B construiu o mecanismo; o 4g **fez o app contar a verdade sobre ele** em
dois lugares: para o usuário, no modal que agora diz que apagar é da conta e não
só do aparelho (risco 7 do recon, aberto desde a 4d); e para quem programa, no
`ARQUITETURA-DADOS.md`, que diz o que o sistema promete e — mais raro — o que ele
não promete.

O gatilho de retorno de aba é a única linha de comportamento novo, e entrou pelo
caminho mais estreito possível: um evento que implica que o usuário não está
digitando, um piso de 60s, e nenhuma mudança em `hydrateNow()`.

## Adendo (26/ago) — PUBLISH: F3 COMPLETA EM PRODUCAO
- Publish levou 4g + fix do tsc juntos. Build do Lovable: sem card vermelho novo (o visivel e o antigo de 25/ago) — peer dependency resolvida, divida quitada em producao.
- Site de pe, /smoke 319/320.
- Prova visual do modal novo: pendente (cosmetica — strings conferidas no diff, testes verdes, texto na fila da Rachel lote 3).
- MARCO: F3 'A Fabrica' completa e publicada — Arcos 0-4g + 5.0-5.b. De localStorage-only com auth mock para: identidade real (kinu-beta), RLS provada, espelho com entrega garantida, hidratacao multi-dispositivo, adocao consentida, contrato formalizado (ARQUITETURA-DADOS.md), proxy orfao morto, build verde.
- Proxima fronteira: Arco 5.c (CORS + burst guard nas 10 functions vivas), depois UI generativa + onboarding.
