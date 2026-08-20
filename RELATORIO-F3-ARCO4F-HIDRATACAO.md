# Relatório — F3 / Arco 4f: hidratação (banco → localStorage). **Fecha a Fase B**

**Data:** 20/ago/2026 · **Missão:** o primeiro `select` do Arco 4 — banco vence, menos o que
está no outbox — mais o painel comparativo do recon §7.3.
**Base:** `RELATORIO-RECON-ARCO4.md` §2.3, §2.4, §3.2, §3.3, §4.4, §6.2, §7.3 ·
`RELATORIO-F3-ARCO4C-SYNC.md` (o outbox) · `RELATORIO-F3-ARCO4D-OBS.md` §6 item 1 ·
`RELATORIO-F3-ARCO4E-ADOCAO.md` §9 item 1 · STEP 1 aprovado com as três decisões respondidas:
**(A)** painel completo, **(B)** banco vence e apaga, **(C)** troca de dono completa + recusa
nunca hidrata.

**Arquivos:**

| Arquivo | Mudança | Inserções / Deleções |
|---|---|---|
| `src/lib/tripHydration.ts` | **NOVO** — o `select`, o gate, a fusão, a comparação | **+455 / −0** |
| `src/test/tripHydration.test.ts` | **NOVO** — 22 cenários | **+543 / −0** |
| `src/pages/SmokeTest.tsx` | painel §7.3 + 2 botões; sai o aviso âmbar da 4d | +165 / −12 |
| `src/lib/tripStore.ts` | `hydrateTrips` — 1 export novo | **+110 / −0** |
| `src/lib/tripSync.ts` | 3 exports estreitos + a trava de absorção | +84 / −1 |
| `src/lib/tripAdoption.ts` | `claimOwnership` — 1 export novo | **+17 / −0** |
| `src/App.tsx` | `startTripHydration()` | **+6 / −0** |

As 13 linhas removidas são o aviso âmbar do painel ("comparação chega na 4f") e a linha do
`handleLocalChange` que ganhou a checagem da trava. `session.ts`, `useAuth.ts`, `src/data/`,
`types/trip.ts`, `supabase/` e `src/integrations/*` **não foram tocados**.

---

## 1. A tese

Os arcos 4a–4e construíram **uma porta só**. Esta é a de volta — e ela é mais perigosa que a de
ida por um motivo que organizou o arco inteiro: **a de ida acrescenta, a de volta apaga.** Um
`upsert` errado grava lixo recuperável; uma hidratação errada remove viagem do usuário do
navegador dele.

Por isso o código não pergunta "o que o banco tem?" antes de perguntar, nesta ordem:

1. **quem tem direito de hidratar** → o marcador `kinu_trips_owner` da 4e (§3);
2. **o que não pode ser tocado** → o outbox da 4c (§4);
3. **só então**, o que some.

---

## 2. O `select`, e cada pedaço dele é uma regra

```ts
kinuBeta.from('trips')
  .select('id, payload, schema_version')
  .eq('user_id', uid)
  .order('created_at', { ascending: true })
```

**`created_at asc` é obrigatório** (recon §2.4, risco 5). O índice da tabela é
`(user_id, updated_at desc)`; aceitar a ordem "natural" faria a **última da lista** virar a
menos recentemente atualizada — e `getActiveTrip()` (`tripStore.ts:296`) usa exatamente "a
última da lista" como fallback. A viagem ativa do `/cla` e do `FeedbackButton` mudaria sozinha,
sem ninguém tocar em nada. O **teste 3** prende isso de um jeito que não depende de ninguém ler
o comentário: semeia o local em ordem **invertida** em relação ao banco e exige
`getActiveTrip()?.id === B`.

**`.eq('user_id', uid)` mesmo com RLS** — a policy já restringe, mas a disciplina é a do
`toRow()`: não confiar em política para definir o que é meu. **`created_at` não é
selecionado**: ele só ordena.

**`schema_version != 1` → ignorada com aviso** (recon §2.3), sem regravar e sem apagar do banco.
E — o que o recon não disse — **o id entra na lista de proteção**: tratá-la como "ausente do
banco" faria a hidratação apagar a cópia local de uma viagem que existe, só que num formato que
este cliente não entende (**teste 12**).

---

## 3. O gate — decisão (C)

Os quatro estados de `kinu_trips_owner` lidos pela segunda vez no projeto (a primeira é o
`decideFor` da 4e):

| Marcador | Sessão | O que a 4f faz |
|---|---|---|
| ausente | X | **não hidrata** — quem decide é o diálogo da 4e (teste 7) |
| `{X, …}` | X | hidrata: banco vence, menos o outbox |
| `{A, …}` | B | **troca de dono** (§5) |
| `{null, null}` | qualquer | **nunca hidrata** (teste 8) |

O gate não é zelo. Sem ele, um navegador com viagens locais de quem **recusou** a adoção mais
uma conta nova de banco vazio = "banco vence" apagando tudo, sem pergunta e sem desfazer.

**O preço da recusa, declarado:** quem recusou não vê, naquele navegador, as viagens da própria
conta. É coerente com o que a 4e prometeu na tela ("deixar só neste navegador") e é a direção
conservadora — mas é uma promessa de login parcialmente não cumprida, e está registrado aqui em
vez de escondido.

---

## 4. A fusão, e o que ela não pode tocar — decisão (B)

> **Hidrata tudo, menos o que está no outbox** (recon §3.3), por op:

| Id | Decisão | Teste |
|---|---|---|
| no banco, sem op | **banco vence** | 1 |
| no banco + `upsert` pendente | **local vence** — a edição ainda vai subir | 9 |
| no banco + `delete` pendente | **não volta** — ressuscitaria viagem apagada | 10 |
| só no local, com op | preservada | 9 |
| só no local, **sem** op | **removida**, com o `kinu_price_history_<id>` junto | 14 |
| `schema_version` futuro / payload torto | ignorada, cópia local protegida | 12, 13 |

**`blocked` conta como pendente** (teste 11): a entrada recusada pela policy nunca será
retentada, mas o que ela significa continua sendo "esta escrita não chegou ao banco".

### 4.1 A corrida que quase apagou a adoção — a confirmação pedida (teste 17)

`acceptAdoption()` faz três coisas quase ao mesmo tempo: enfileira A e B, retira o pedido (o que
**dispara o gatilho desta hidratação**) e chama `flush()`. Se o flush drenar **enquanto o
`select` está no ar**, a leitura volta com a resposta anterior aos upserts — **banco vazio** — e
um outbox já vazio não protege nada. "Banco vence" apagaria A e B do navegador no segundo
seguinte ao usuário ter dito *"trazer para minha conta"*.

A correção: **o outbox é lido dos dois lados do request** e os conjuntos são unidos — o que
estava pendente ao pedir e o que foi enfileirado durante. O preço é ser conservador: uma viagem
que drenou no meio do voo não recebe a versão do banco nesta rodada, e a próxima hidratação a
pega.

O **teste 17 rotula a corrida na ponta perigosa**: o `select` do fake é roteirizado para
demorar **mais** que o upsert, e o teste exige `outbox vazio` **e** as duas viagens vivas — ou
seja, a única coisa que pode tê-las salvado é a leitura feita antes do request. Foi verificado
por mutação: revertendo a união para ler só o outbox de depois, o teste falha com
`expected [] to deeply equal [A, B]`. Antes dessa reescrita ele passava dos dois jeitos — um
teste que não prendia nada.

### 4.2 Sem eco (teste 15)

Hidratar grava em `kinu_trips` → o sino toca → o diff do espelho veria N viagens "mudadas" e
enfileiraria upsert de **tudo que acabou de chegar do banco**. Seriam N requests inúteis por
sessão, `updated_at` batido à toa e um last-write-wins ao contrário: o dispositivo que acabou de
ligar sobrescrevendo o que outro escreveu há um segundo.

`absorbLocalWrite(fn)` liga uma trava de módulo no `tripSync`: com ela, o `handleLocalChange`
faz o `diffLocal()` (**atualiza o snapshot**) e não enfileira — letra por letra o que ele já
fazia no caminho anônimo. A janela é uma chamada síncrona.

### 4.3 Idempotência (teste 16)

Fusão que dá o array já gravado → **não grava e não toca o sino**. É o que torna o botão
"Recarregar do banco" barato de apertar durante o soak. O teste assina o `subscribeTrips` e
exige **zero** toques na segunda hidratação.

---

## 5. A troca de dono — e por que ela não é um caminho de dados próprio

`{A, …}` + sessão de B:

```
select do banco de B          # 1º, sempre
discardForeignUpserts(B)      # 2º
hydrateTrips(linhas, keep)    # 3º — a MESMA função de sempre
claimOwnership(B)             # 4º
```

As viagens de A somem porque **não estão no banco de B e não estão no outbox de B** — a mesma
regra que remove qualquer outra, sem exceção nova. É seguro porque o marcador de A significa que
A decidiu: as viagens dela estão no banco dela.

**O `select` vem antes de qualquer escrita** (teste 20): se a leitura falhar, o navegador
continua com o passado de A e com o marcador de A, em vez de ficar sem um e sem o outro. O preço
declarado é que B vê as viagens de A até o próximo sucesso — o status quo da 4e, recuperável no
gatilho seguinte.

**`discardForeignUpserts` descarta só os `upsert` alheios** (teste 19). O upsert de A fica órfão
no instante em que o local é substituído — sem payload, não tem o que enviar, e o `sendUpserts`
o descartaria com aviso quando A logasse aqui de novo. Tirá-lo agora é a mesma decisão, sem
deixar o painel do soak em âmbar permanente. **O `delete` de A FICA:** não precisa de payload,
continua executável, e perdê-lo faria uma viagem que A apagou voltar a existir na conta dela.

`claimOwnership(B)` grava **depois** da escrita local: se falhar (quota), a próxima sessão repete
a troca, e repetir é inofensivo porque o local já é o banco de B. Mesma filosofia de ordem da 4e.

---

## 6. O segundo export dentro do `tripStore.ts` — exceção aprovada

`hydrateTrips(incoming, keepLocalIds)`. O recon §1.4 previa **uma** mudança no store (o
`newTripId`); esta é a segunda, e a justificativa foi aprovada no STEP 1 §3.1:

A regra de ouro proíbe **regravar o todo a partir de estado React em memória** — o padrão que
produz a perda silenciosa do recon §4.1/§4.2. `hydrateTrips` **relê o storage por dentro** e
funde; o array que entra não é "o estado do app", é o retrato do banco. Read-modify-write
continua valendo — o "modify" é que passou a ter duas fontes.

A alternativa (o `tripHydration` gravar `kinu_trips` direto) fura o funil que 28 pontos de acesso
respeitam e **não toca o sino**: `emit` é privado, e sem ele as 4 telas assinantes não acordariam.

Dois detalhes do contrato que valem registro:

- **remove o `kinu_price_history_<id>` das viagens que removeu** — o mesmo contrato do
  `deleteTrip` (recon §4.9). Sem isso a hidratação vazaria chaves órfãs a cada delete
  multi-dispositivo (teste 14);
- **entrada local sem id sobrevive sempre.** Ela não tem PK, o banco nunca a viu e nunca a verá.
  Apagar dado do usuário por não conseguir identificá-lo é a pior das falhas possíveis aqui.

---

## 7. Gatilhos — e os que ficaram de fora

1. **resolução de sessão** (boot e login);
2. **decisão da adoção** — `subscribeAdoption` recebendo `null`. No aceite, o marcador acabou de
   ser gravado em nome do usuário, e esta é a primeira vez que o gate deixa passar; sem isto, quem
   adota só hidrataria no boot seguinte. Na recusa o toque acontece e o gate barra na hora
   (teste 18);
3. **botão "Recarregar do banco"** no `/smoke`.

**Fora, de propósito:** `visibilitychange`, `online` e polling. Hidratar é destrutivo por
natureza e não deve rodar sozinho enquanto o usuário digita. **Frescor multi-dispositivo na Fase
B é por recarga de página** — que é literalmente o passo 8 da checklist do recon §7.4 ("outra
aba, mesma conta"). Limitação declarada, não esquecida.

---

## 8. O painel do `/smoke` — decisão (A)

O aviso âmbar da 4d saiu da tela; entraram:

- **linha "Hidratação (4f)"** ao lado da "Adoção (4e)": em voo, motivo do skip em português
  (`sem sessão`, `esperando a decisão da adoção`, `recusada`), erro com código, ou
  `14:32:07 · +2 ~1 −0 · 1 preservada(s)`;
- **as quatro métricas do §7.3**: só-no-local, só-no-banco, payload divergente, ordem — com os
  ids abaixo de cada uma;
- **dois botões**: "Recarregar do banco" (`hydrateNow`) e "Comparar local × banco"
  (`compareWithDatabase`).

**A comparação é sob demanda, não entra no polling de 2 s**: ela custa um request, e um
instrumento que mede sozinho o tempo todo vira ruído no soak. **`compareWithDatabase()` é leitura
pura** — não grava em lugar nenhum, nem local nem no banco (teste 21 confirma o `kinu_trips`
byte a byte antes e depois). Um instrumento que altera o que mede não serve de critério de corte.

`divergent` usa o **mesmo** `hashTrip` do espelho de escrita, dos dois lados e sobre o payload
normalizado — comparar cru acusaria diferença de normalização como divergência real. A **ordem é
comparada só sobre os ids comuns aos dois lados**: um "só no local" já tem métrica própria, e
deixá-lo entrar aqui faria a linha da ordem acusar vermelho por um problema que não é dela.

**Nada disso entra no placar**: `totals` é um `useMemo` sobre `outcomes`, e o painel tem estado
próprio.

---

## 9. Testes — 22 novos, 120 na suíte

`src/test/tripHydration.test.ts`. Harness **cópia** do idioma do `tripSync.test.ts` (o
`vi.hoisted` + `vi.mock` precisam morar no arquivo que os usam), acrescido de um
`select().eq().order()` encadeável e roteirizável. `session.ts`, `tripStore.ts`, `tripSync.ts` e
`tripAdoption.ts` são os **reais** por cima do GoTrue falso.

| # | Cenário | Resultado |
|---|---|---|
| 1 | hidratação feliz | ✅ 2 linhas viram 2 viagens normalizadas |
| 2 | forma do `select` | ✅ `eq(user_id)` + `order(created_at asc)` — **recon teste 12** |
| 3 | ordem | ✅ vem do banco; `getActiveTrip()` acompanha |
| 4 | `select` com erro | ✅ localStorage **intacto**, código legível — **recon teste 7** |
| 5 | rede caída (promessa rejeitada) | ✅ idem |
| 6 | sem sessão | ✅ zero chamadas ao banco |
| 7 | marcador ausente | ✅ não hidrata; a 4e pergunta, como sempre |
| 8 | recusa | ✅ nunca hidrata |
| 9 | `upsert` pendente | ✅ local vence; a dívida continua no outbox |
| 10 | `delete` pendente | ✅ a linha do banco não ressuscita |
| 11 | `blocked` | ✅ protege igual a pendente |
| 12 | `schema_version: 2` | ✅ ignorada, local preservado, resto hidrata |
| 13 | payload torto | ✅ ignorada, resto hidrata |
| 14 | só no local, sem outbox | ✅ removida **com** o histórico de preços |
| 15 | sem eco | ✅ hidratar não enfileira nada |
| 16 | hidratar 2× | ✅ 2ª não grava e não toca o sino |
| 17 | **aceite + hidratação imediata** | ✅ as adotadas sobrevivem com o outbox **já drenado** (§4.1) |
| 18 | recusa pelo diálogo | ✅ o gatilho roda, o gate barra |
| 19 | dono diferente | ✅ limpa, grava `{u-1, null}`, hidrata; upsert alheio sai, delete alheio fica |
| 20 | troca de dono com `select` falhando | ✅ nada gravado, **nem o marcador** |
| 21 | `compareWithDatabase` | ✅ divergente/só-no-banco corretos, `kinu_trips` intocado |
| 22 | comparação sem sessão | ✅ diz por quê, em vez de fingir verde |

### Saída

```
✓ src/test/tripHydration.test.ts   (22 tests) 329ms
✓ src/test/flight-fallback.test.tsx (5 tests) 627ms
✓ src/test/tripSync.test.ts        (22 tests) 207ms
✓ src/test/tripAdoption.test.ts    (17 tests) 142ms
✓ src/test/session.test.ts         (13 tests)  47ms
✓ src/test/tripStore.test.ts       (31 tests)  27ms
✓ src/test/tripIdMigration.test.ts  (9 tests)  14ms
✓ src/test/example.test.ts          (1 test)    3ms

Test Files  8 passed (8)
     Tests  120 passed (120)
```

**Nenhum teste existente foi tocado**: 98 → 120.

### O placar do `/smoke` não mudou — A/B de verdade

`SmokeTest.tsx` e `App.tsx` mudaram, então o placar foi medido em A/B com o React em jsdom (a
técnica da 4d §1), com `git stash` das cinco mudanças rastreadas, no mesmo dia e na mesma máquina:

```
DEPOIS das mudanças:              PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
ANTES (git stash das mudanças):   PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
```

**A === B.** O arquivo de medição foi **deletado** e não entra no commit.

### O painel montou (prova temporária, também deletada)

Um `__panel.tmp.test.tsx` provou 4 coisas antes de sair: a linha "Hidratação (4f)" aparece, o
aviso âmbar da 4d **sumiu**, "Recarregar do banco" chama a hidratação (e a tela explica o skip
`sem sessão`), e "Comparar local × banco" mostra o motivo em vez de verde falso.

### `tsc`, `build` e lint

- `npx tsc --noEmit -p tsconfig.app.json` → **4 erros**, os mesmos quatro de
  `GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108). **Baseline intacto.**
- `npm run build` → `✓ built in 22.19s` (o aviso de chunk > 500 kB é pré-existente).
- `eslint`: `tripHydration.ts`, `tripSync.ts`, `tripAdoption.ts`, `SmokeTest.tsx` e `App.tsx` →
  **0 problemas**. `tripStore.ts` → **10**, exatamente os 10 de antes (medidos com `git stash`):
  os três `any` que a primeira versão do `hydrateTrips` trouxe foram tipados como `StoredTrip`.
  O arquivo de teste tem 10 `no-explicit-any`, do harness copiado.

---

## 10. O que este arco NÃO resolve

1. **Tempo real.** Sem realtime e sem polling: frescor por recarga (§7).
2. **Last-write-wins mudo** (risco 6) segue aceito na Fase B — comparar `updated_at` antes de
   gravar é arco futuro. A hidratação torna o efeito mais visível, não mais provável.
3. **`clearTrips()` sem aviso** (risco 7) **piora com este arco**: a exclusão agora também volta
   dos outros dispositivos. O texto do "Reiniciar jornada" (`Viagens.tsx`) continua não dizendo
   que a exclusão virou permanente e multi-dispositivo. É a pendência mais madura para o 4g.
4. **Quem recusou não vê as viagens da própria conta** naquele navegador (§3).
5. **Histórico de preços** (risco 12) segue local e não hidrata — só é apagado junto com a
   viagem que a hidratação remover.
6. **`profiles.name = NULL`** segue no backlog.

---

## 11. Commit e push

**Commit:** `e3d822d` — `feat(f3): arco 4f - hidratacao banco->localStorage (banco vence menos o
outbox) + painel comparativo`

```
 RELATORIO-F3-ARCO4F-HIDRATACAO.md |  ...
 src/App.tsx                       |    6 +
 src/lib/tripAdoption.ts           |   17 +
 src/lib/tripHydration.ts          |  455 +++++++++++++
 src/lib/tripStore.ts              |  110 +++
 src/lib/tripSync.ts               |   85 ++-
 src/pages/SmokeTest.tsx           |  177 ++++--
 src/test/tripHydration.test.ts    |  543 ++++++++++++++++
```

**Push** (`git push origin main`):

```
To https://github.com/PedroContrucci/kinus-clan-compass
   ff538ee..e3d822d  main -> main
```

Sem `--amend` depois do push, sem `--force`. O `STEP1-ARCO4F.md` foi deletado após a aplicação e
não entrou em nenhum commit.

---

## 12. Pendências acumuladas do Arco 4

1. **Prova de runtime da 4a** no navegador de produção (herdada de 4b/4c/4d/4e).
2. **Confirmação visual** em navegador de verdade: as quatro métricas do painel e os dois botões.
3. **`prova-espelho.md`** contra o banco real, dois usuários (recon §6.3) — agora com dois passos
   novos: o **passo 8** da checklist (outra aba/navegador, mesma conta, mesmas viagens) e a troca
   de dono ponta a ponta.
4. **A checklist §7.4 completa, duas vezes, em dias diferentes** — o soak. Este arco entrega o
   instrumento; o critério de corte da Fase C é execução, não código.
5. **`clearTrips()` sem aviso** (item 10.3).
6. **Tamanho real do payload** (recon §10.3).
7. **`profiles.name = NULL`** (achado de 19/ago).
8. **Histórico de preços não espelhado** (risco 12).
