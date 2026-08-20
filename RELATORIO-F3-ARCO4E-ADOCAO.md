# Relatório — F3 / Arco 4e: adoção consentida das viagens locais

**Data:** 20/ago/2026 · **Missão:** `kinu_trips_owner` + diálogo de consentimento no primeiro
login + semeadura do outbox com o passado.
**Base:** `RELATORIO-RECON-ARCO4.md` §3 e §9 (riscos 1, 5, 6, 7) ·
`RELATORIO-F3-ARCO4C-SYNC.md` (o outbox com `uid`) · `RELATORIO-F3-ARCO4D-OBS.md` §6 item 3 ·
STEP 1 aprovado com as três decisões respondidas.

**Arquivos:**

| Arquivo | Mudança | Inserções / Deleções |
|---|---|---|
| `src/lib/tripAdoption.ts` | **NOVO** — a chave, a máquina de decisão, o estado observável | **+281 / −0** |
| `src/test/tripAdoption.test.ts` | **NOVO** — 17 cenários | **+432 / −0** |
| `src/components/shared/TripAdoptionDialog.tsx` | **NOVO** — o diálogo (UI fina) | **+113 / −0** |
| `src/lib/tripSync.ts` | `enqueueUpserts` — 1 export estreito | **+15 / −0** |
| `src/pages/SmokeTest.tsx` | linha "Adoção (4e)" no painel Espelho | **+17 / −0** |
| `src/App.tsx` | `startTripAdoption()` + 1 linha de JSX | +10 / −1 |

**Zero deleções em cinco dos seis arquivos.** A única linha removida é o comentário do
`App.tsx` que dizia "não adota o que já estava aqui (4e)" — deixou de ser verdade nesta linha.

`tripStore.ts`, `session.ts`, `useAuth.ts`, `src/data/`, `hotelZones`, `michelinData`,
`types/trip.ts`, `supabase/` e `src/integrations/*` **não foram tocados**. **Nenhum `select`
foi escrito** — a hidratação continua sendo a 4f.

---

## 1. A tese

A 4c deixou uma invariante deliberada: *o snapshot é semeado no boot sem enfileirar nada*,
logo escrita anterior ao login **não sobe nunca**. Se subisse, o primeiro login adotaria em
silêncio o que estivesse no navegador — inclusive de outra pessoa (recon §3.4a, risco 1).

A adoção é o ato de desfazer essa regra **uma vez, com o usuário dizendo sim**. E ela não
ganhou máquina própria: enfileira `upsert` para os ids que já estão ali e devolve o problema
ao outbox, que desde a 4c sabe lotear, retentar, marcar `blocked` e registrar no
`kinu_sync_log`. **O arco é uma decisão persistida + um diálogo, não um pipeline novo.**

A prova disso está no `git diff`: `enqueue`, `settle`, `markBlocked`, `diffLocal`,
`sendUpserts`, `sendPreparedRows`, `sendDelete`, `flush` e `handleLocalChange` estão
**idênticos** à 4d. As 15 linhas que entraram no `tripSync.ts` são uma função de três linhas
e o comentário que a explica.

---

## 2. `kinu_trips_owner` — quatro estados, e a ordem de leitura é o desenho

```
(chave ausente)                   -> nunca foi perguntado
{ userId: 'X', adoptedAt: iso }   -> X adotou o passado nesta data
{ userId: 'X', adoptedAt: null }  -> X é o dono e NÃO HAVIA nada para adotar
{ userId: null, adoptedAt: null } -> alguém RECUSOU: ninguém adota, ninguém mais pergunta
```

Conforme a decisão (1), a recusa é `{ userId: null }` — vale para o **navegador**, não para a
conta. Isso cria uma armadilha que o STEP 1 apontou e que o código trata explicitamente:
`null` também é "diferente do uid atual", então a recusa cairia no ramo "dono diferente" por
acidente aritmético se a ordem dos testes fosse a ingênua. A leitura é:

```
1. owner ausente          -> avalia (talvez pergunte)
2. owner.userId === null  -> RECUSA: fim
3. owner.userId === uid   -> já é meu: fim
4. owner.userId !== uid   -> DONO DIFERENTE: não pergunta, não adota (4f decide)
```

O **teste 4** existe só para prender essa ordem: recusa gravada + sessão de um `u-9` que nunca
esteve neste navegador → nenhuma pergunta.

**Marcador torto → tratado como ausente** (teste 16). Das três leituras possíveis para lixo,
é a única recuperável: perguntar custa um diálogo e a re-adoção é idempotente. Ler lixo como
recusa silenciaria o app para sempre; lê-lo como adoção subiria o passado sem consentimento.

---

## 3. O gatilho — uma avaliação por resolução de sessão

Assinante do `subscribeSession` (4b) mais um empurrão síncrono no `startTripAdoption()`,
porque `subscribeSession` não replica o estado atual na assinatura — o mesmo cuidado do
`startTripSync()`.

**Nunca no sino do `tripStore`, e isso não é estilo.** Se a avaliação rodasse a cada escrita,
criar uma viagem logo depois de um login sem viagens dispararia o diálogo sobre uma viagem que
o espelho está subindo naquele instante. *A pergunta é sobre o passado, e o passado se define
no momento em que a sessão resolve.*

### 3.1 O buraco que o login "vazio" fecha (§4.1 do STEP 1)

Login com `kinu_trips` vazio grava `{ userId, adoptedAt: null }` **sem diálogo** — não há o
que consentir quando não há o que adotar. Sem essa gravação existe um bug real e chato: o
usuário loga com 0 viagens, cria 3 (que o espelho já sobe, por serem escritas pós-login), e na
sessão seguinte o app pergunta *"trazer estas 3 viagens para a sua conta?"* sobre viagens que
já estão na conta dele há dias. O **teste 5** encena exatamente essa sequência.

### 3.2 A sessão que muda com o modal aberto

O pedido carrega o `userId` para quem a pergunta foi feita, e as duas respostas revalidam
antes de gravar:

- **logout no meio** → decisão descartada, nada gravado, nada enfileirado (teste 14);
- **outra conta loga no meio** → o pedido antigo é retirado (`null` no sino) e **um novo é
  emitido em nome do novo usuário** (teste 15), porque `owner` continua ausente: ninguém
  decidiu nada ainda. Consentimento dado por A não vale para B.

---

## 4. Aceitar — e por que a ordem das duas escritas é o desenho

```
vivos = prompt.tripIds ∩ listTrips()
enqueueUpserts(vivos, uid)                        // 1º
writeOwner({ userId: uid, adoptedAt: agora })     // 2º
setPrompt(null); void flush()                     // 3º
```

**Enfileira antes de gravar o marcador.** Se a gravação falhar (`QuotaExceededError`), a
próxima sessão pergunta de novo e a re-adoção é inofensiva — `upsert` por PK no banco, dedupe
por id no `enqueue`. Na ordem inversa, um marcador gravado com a fila vazia seria "adotado"
com o passado nunca enviado, e ninguém mais perguntaria. **Falhar re-perguntando é
recuperável; falhar em silêncio, não.**

**A interseção** cobre o id apagado entre a pergunta e o clique: sem ela, viraria upsert órfão
que o `sendUpserts` descarta com aviso — barulho sem função (teste 11). Viagens **criadas**
depois da pergunta não entram aqui de propósito: são escrita pós-login, e o espelho da 4c já
as enfileirou.

**Divergência declarada do recon §3.2(d):** o recon mandava gravar o `owner` só quando o
outbox drenasse por completo. Gravamos no ato do enfileiramento, como a missão pediu. O motivo
é que esperar a drenagem faz **uma queda de rede virar uma segunda pergunta ao usuário** — e o
`owner` responde "esta pessoa já decidiu?", não "os bytes chegaram?". A segunda pergunta já
tem dono desde a 4d: `getSyncStatus()`. O **teste 9** fixa isso: flush falhando, marcador
gravado, as 2 entradas intactas no outbox, `lastFlushError` legível.

---

## 5. Recusar — e a implicação que ficou na tela (decisão 2)

`declineAdoption()` grava `{ userId: null, adoptedAt: null }`, não enfileira nada e **não fala
com o banco** (teste 12).

**O que a recusa NÃO faz: desligar o espelho.** O sino do `tripStore` não distingue viagem
velha de nova, então editar uma viagem antiga depois de logado faz a viagem inteira subir. O
**teste 13** encena isso e existe para que ninguém trate o comportamento como regressão no
futuro.

A alternativa avaliada no STEP 1 (quarentena de ids no `handleLocalChange`) foi recusada por
prometer o que o produto não consegue cumprir: um id em quarentena permanente vira dado de
segunda classe que a hidratação da 4f atropela, e transforma uma edição feita pelo dono da
conta em dado invisível nos outros dispositivos dele — o oposto da promessa do login. **O que
a recusa preserva é o que importa:** o passado de outra pessoa não é apropriado em bloco no
primeiro login (risco 1). O que sobe depois é ato deliberado do usuário logado, uma viagem por
vez.

**Conforme sua condição, o rodapé e o botão secundário estão amarrados no código** — a nota
está no cabeçalho do `TripAdoptionDialog.tsx`, onde quem for mexer no texto vai lê-la:

> O TEXTO DO RODAPÉ E O BOTÃO SECUNDÁRIO SÃO UM PAR. Se o rodapé cair na revisão de texto, o
> rótulo do botão muda junto (reserva: "Agora não"). Um botão que promete o que o app não
> cumpre é pior que nenhum botão.

---

## 6. O diálogo

`src/components/shared/TripAdoptionDialog.tsx`, montado no `App.tsx` como irmão do
`<BetaFeedbackWrapper />` — a sessão resolve em qualquer rota, então pendurar no Dashboard
perderia `/viagens`, `/planejar` e `/conta`.

- **Não decide nada.** Lê o pedido, chama `acceptAdoption()`/`declineAdoption()`, mostra dois
  toasts. Toda a regra é testável sem React.
- **Estado inicial síncrono** (`useState(getAdoptionPrompt)`): o pedido costuma ser emitido
  **antes** desta montagem, porque a sessão resolve na rota `/`, onde o componente devolve
  `null`. `subscribeAdoption` não replica o estado atual na assinatura (contrato do 4b).
- **Não renderiza em `/`** — mesma regra do `KinuAIWrapper` e do `BetaFeedbackWrapper`. O
  pedido não se perde: ele vive no módulo, e o `Login.tsx:80-82` manda todo autenticado para
  `/dashboard`, onde o diálogo aparece.
- **Não fecha sem resposta:** `onOpenChange` ignora o `false` e o X é escondido com
  `[&>button]:hidden` (idioma já usado no `sidebar.tsx`). Duas opções, as duas gravam decisão.
- **Estilo herdado**, não inventado: as classes do modal "Reiniciar Jornada?"
  (`Viagens.tsx`) — `bg-[#1e293b] border-[#334155] max-w-sm`, botões `rounded-xl`.

### Strings para a Rachel (pt-BR) — como foram implementadas

| Onde | Texto |
|---|---|
| Título | **Trazer suas viagens para a conta?** |
| Corpo | Encontramos **1 viagem salva** / **{N} viagens salvas** neste navegador. Quer trazer para a sua conta? Assim você as encontra em qualquer dispositivo. |
| Rodapé (âmbar) | Se você editar uma delas depois de entrar, ela vai para a sua conta mesmo assim. |
| Botão primário | **Trazer para minha conta** |
| Botão secundário | **Deixar só neste navegador** |
| Toast do aceite | Viagens trazidas para a sua conta ✨ · *Elas vão aparecer nos seus outros dispositivos.* |
| Toast da recusa | Tudo bem — elas ficam neste navegador. |

O plural é decidido no código, por extenso — **não existe "viagem(ns)" na tela**. O toast do
aceite diz "vão aparecer" (futuro) e não "apareceram": a entrega é eventual, o outbox pode
demorar.

---

## 7. O painel Espelho ganhou a linha da adoção (decisão 3)

`/smoke` § 🪞 Espelho, logo abaixo da linha "Sessão":

```
Adoção (4e): nunca perguntado
Adoção (4e): b5c1c62c-… · adotado em 14:32:07
Adoção (4e): b5c1c62c-… · sem passado a adotar
Adoção (4e): recusada — ninguém adota neste navegador
```

Os quatro estados de `kinu_trips_owner` são indistinguíveis no DevTools para quem não conhece
a convenção; aqui viram texto. Entra no mesmo polling de 2 s do resto do painel. **Não entra
no placar**: `totals` é um `useMemo` sobre `outcomes`, e nada aqui escreve em `outcomes`.

---

## 8. Testes — 17 novos, 98 na suíte

`src/test/tripAdoption.test.ts`. O harness é **cópia** do idioma do `tripSync.test.ts`, não
import: `vi.hoisted` + `vi.mock` precisam morar no arquivo que os usa. `session.ts`,
`tripStore.ts` e `tripSync.ts` são os **reais** por cima do GoTrue falso — o que se testa é a
adoção conversando com o espelho de verdade, não com um dublê dele.

| # | Cenário | Resultado |
|---|---|---|
| 1 | sessão + 2 trips + owner ausente | ✅ pergunta uma vez, com os 2 ids · **nada** no banco, no outbox ou no marcador |
| 2 | owner do mesmo usuário | ✅ não pergunta |
| 3 | owner de outro usuário | ✅ não pergunta, não adota, **não reescreve** o marcador |
| 4 | recusa `{null,null}` + usuário novo | ✅ não pergunta — prende a ordem de leitura do §2 |
| 5 | login sem viagens | ✅ grava `{uid, adoptedAt:null}`; a viagem criada depois sobe pelo espelho normal |
| 6 | sessão anônima com viagens | ✅ não pergunta e **não grava nada** |
| 7 | aceitar | ✅ marcador com `adoptedAt` ≥ o instante do clique · 1 request, 2 linhas, `user_id` e `schema_version` certos · outbox drenado |
| 8 | o outbox antes do voo resolver | ✅ 2 entradas `upsert`, `uid` certo, nenhuma `blocked` |
| 9 | aceitar com flush falhando | ✅ marcador **gravado**, 2 entradas **preservadas**, `lastFlushError` legível |
| 10 | aceitar duas vezes | ✅ a 2ª é no-op — nenhum request extra |
| 11 | id apagado entre a pergunta e o clique | ✅ sobe só o que sobrou |
| 12 | recusar | ✅ `{null,null}` · outbox vazio · zero chamadas ao banco |
| 13 | editar viagem antiga depois de recusar | ✅ **sobe** — a implicação declarada do §5 |
| 14 | aceitar com a sessão já trocada | ✅ nada gravado, nada enfileirado |
| 15 | troca de conta com o pedido aberto | ✅ pedido retirado e refeito em nome do novo usuário |
| 16 | marcador torto | ✅ tratado como ausente: pergunta de novo |
| 17 | `getTripsOwner()` | ✅ devolve o marcador — é o que o painel lê |

### Saída

```
✓ src/test/tripSync.test.ts        (22 tests) 312ms
✓ src/test/tripAdoption.test.ts    (17 tests) 157ms
✓ src/test/flight-fallback.test.tsx (5 tests) 698ms
✓ src/test/session.test.ts         (13 tests)  43ms
✓ src/test/tripStore.test.ts       (31 tests)  28ms
✓ src/test/tripIdMigration.test.ts  (9 tests)  11ms
✓ src/test/example.test.ts          (1 test)    3ms

Test Files  7 passed (7)
     Tests  98 passed (98)
```

**Nenhum teste existente foi tocado**: 81 → 98.

### O placar do `/smoke` não mudou — A/B de verdade

O `App.tsx` e o painel mudaram, então o placar foi medido em A/B com o React em jsdom (a
técnica da 4d §1; este Codespace não tem navegador). Desta vez o "antes" foi medido de fato,
com `git stash` das três mudanças rastreadas, **no mesmo dia e na mesma máquina**:

```
DEPOIS das mudanças:              PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
ANTES (git stash das mudanças):   PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
```

**A === B.** O arquivo de medição (`src/test/__scoreboard.tmp.test.tsx`) foi **deletado** e não
entra no commit — um assert fixo em "319/320" seria frágil de propósito, porque a geração usa
`new Date()` e o número pode variar legitimamente com o dia.

### O diálogo montou (prova temporária, também deletada)

Um `__dialog.tmp.test.tsx` provou 4 coisas antes de sair: monta sem pedido (renderiza vazio),
**não renderiza em `/` mesmo com pedido em aberto**, faz o singular/plural certo, e os dois
botões chamam a lógica. Não virou teste permanente porque o STEP 1 previu a UI como camada
fina — mas rodar uma vez custou nada e teria pego um `null` mal colocado.

### `tsc`, `build` e lint

- `npx tsc --noEmit -p tsconfig.app.json` → **4 erros**, os mesmos quatro de
  `GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108). **Baseline intacto.**
- `npm run build` → `✓ built in 31.53s` (o aviso de chunk > 500 kB é pré-existente).
- `eslint` nos arquivos de produção novos e alterados → **0 problemas**. O arquivo de teste tem
  13 `no-explicit-any`, **exatamente os mesmos 13** que o `tripSync.test.ts` já tinha — vêm do
  harness copiado, não de código novo.

---

## 9. O que este arco NÃO resolve

1. **Nenhum `select`.** O ramo "dono diferente" apenas **deixa de adotar**; limpar o local e
   puxar do banco do novo dono (recon §3.2 ramo 2) exige leitura e é a **4f**.
2. **A recusa não desliga o espelho** (§5) — decisão consciente, com teste que a fixa.
3. **Não há como desfazer uma decisão pela UI.** Quem recusou e se arrependeu edita a viagem
   (que então sobe) ou apaga a chave no DevTools. Um "trazer agora" no `/conta` é candidato a
   arco futuro, não foi pedido aqui.
4. **`clearTrips()` continua sem aviso** (risco 7 / pendência 4 da 4d): o texto do modal
   "Reiniciar jornada" (`Viagens.tsx`) ainda não diz que a exclusão virou permanente e
   multi-dispositivo. Fora do escopo desta missão, de propósito.
5. **Ordem `created_at asc`** (risco 5) e **`schema_version != 1`** (risco 11) são regras de
   leitura: 4f.
6. **Last-write-wins mudo** (risco 6) segue aceito na Fase B.

---

## 10. Pendências acumuladas do Arco 4

1. **Prova de runtime da 4a** no navegador de produção (herdada de 4b/4c/4d).
2. **Confirmação visual** em navegador de verdade: o diálogo aparecendo no primeiro login e a
   linha "Adoção (4e)" no `/smoke`. O A/B em jsdom prova que o placar não mudou e o teste
   temporário prova que o componente monta — nenhum dos dois substitui bater o olho.
3. **`prova-espelho.md`** contra o banco real, dois usuários (recon §6.3) — agora com um passo
   novo: adotar num navegador, e confirmar que o segundo usuário **não** recebe a pergunta.
4. **`clearTrips()` sem aviso** (item 9.4 acima).
5. **Tamanho real do payload** (recon §10.3) — a adoção é o melhor momento para medir: N
   viagens de uma vez, com o painel aberto.
6. **`profiles.name = NULL`** (achado do adendo de 19/ago) segue no backlog.
7. **Histórico de preços não espelhado** (risco 12): dívida registrada, fora do Arco 4.

---

## 11. Commit e push

*(preenchido no commit `docs:` seguinte, conforme a regra da casa)*
