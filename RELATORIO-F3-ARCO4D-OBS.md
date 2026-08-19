# Relatório — F3 / Arco 4d: observabilidade do espelho

**Data:** 19/ago/2026 · **Missão:** `kinu_sync_log` + `getSyncStatus()` + painel "Espelho" no
`/smoke`.
**Base:** `RELATORIO-RECON-ARCO4.md` §7.1, §7.2, §7.3, §7.4 · `RELATORIO-F3-ARCO4C-SYNC.md`
§9 itens 3-4 · `src/pages/SmokeTest.tsx` (571 linhas, lido inteiro antes de tocar).

**Arquivos:**

| Arquivo | Mudança | Inserções / Deleções |
|---|---|---|
| `src/lib/tripSync.ts` | anel de log + `getSyncStatus` + `getSyncLog` + `clearSyncLog` | **+171 / −0** |
| `src/pages/SmokeTest.tsx` | import + `MirrorPanel` + 1 linha de JSX | **+250 / −0** |
| `src/test/tripSync.test.ts` | 5 testes novos + 2 helpers | +125 / −7 |

**Zero deleções nos dois arquivos de código** — o `git diff --numstat` é a prova de que a
missão foi aditiva. As 7 linhas removidas do arquivo de teste são o `boot()` saindo de dentro
do `fresh()` (§4).

`tripStore.ts`, `session.ts`, `useAuth.ts`, `src/data/`, `hotelZones`, `michelinData`,
`types/trip.ts`, `supabase/` e `src/integrations/*` **não foram tocados**. Nenhum `select` foi
escrito.

---

## 1. O placar do `/smoke` não mudou — 319/320, provado em A/B

A missão pedia para rodar o `/smoke` localmente. **Este Codespace não tem navegador**: nada de
`chromium`/`google-chrome` no PATH, sem cache do Playwright, e nenhum dos dois no
`package.json`. Em vez de instalar um browser inteiro (~150 MB e mudança de dependências, fora
do escopo), o placar foi medido em **A/B com o React renderizado em jsdom**, via o
`@testing-library/react` que já é dependência — a mesma técnica do `flight-fallback.test.tsx`.

```
ANTES de tocar em SmokeTest.tsx:  PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
DEPOIS da seção Espelho:          PLACAR>>> 🧪 KINU Smoke Test — 319/320 PASS
```

**A === B.** E o render de B ainda prova uma segunda coisa de graça: o `<MirrorPanel />` monta
sem lançar em storage vazio e sem sessão (o estado "resolvendo…"), porque ele já estava dentro
da árvore renderizada.

O arquivo da medição (`src/test/__scoreboard.tmp.test.tsx`) foi **deletado** e não entra no
commit. Um assert fixo em "319/320" seria frágil de propósito: o `useEffect` da geração usa
`new Date()` como data de partida, então o número pode variar legitimamente com o dia — o que
importa é A === B no mesmo dia, na mesma máquina.

**Pendência do seu lado:** a confirmação visual em navegador de verdade.

```bash
npm run dev   # e abrir /smoke
```

### Por que o placar era estruturalmente impossível de mudar

`totals` é um `useMemo` sobre `outcomes`, e `outcomes` só é escrito pelo `useEffect` que roda
`generateItinerary`. O `MirrorPanel` é um componente irmão, com estado próprio, que não escreve
em nenhum dos dois. O `copyReport` também ficou intacto: o painel do espelho **não** entra no
texto copiado — misturar diagnóstico de persistência no relatório de geração estragaria o
formato já em uso.

---

## 2. `kinu_sync_log` — o anel de 50

```ts
export interface SyncLogEvent {
  ts: string;         // ISO
  op: OutboxOp;       // 'upsert' | 'delete'
  id: string;
  ok: boolean;
  code?: string | null;
}
```

- **Sucesso e falha, os dois.** Um log que só registra erro não responde "o espelho está
  funcionando?", só "o espelho quebrou".
- **`code` só existe em falha**, e vem `null` quando a falha não trouxe código do PostgREST
  (rede caída): `null` é "falhou sem código", diferente de ausente. O painel mostra
  `🔴 sem código`.
- **Anel de 50**, `while (events.length > LOG_LIMIT) events.shift()` — o mesmo idioma do
  `PRICE_HISTORY_LIMIT` do `tripStore`. Read-modify-write, porque duas abas espelhando
  compartilham a chave.
- **`logAttempt` nunca lança.** Requisito, não zelo: um `QuotaExceededError` gravando
  diagnóstico não pode derrubar o flush que estava funcionando. E o `lastFlushAt` é marcado
  **antes** da gravação — a tentativa aconteceu mesmo que o registro dela não caiba.

**"Cada tentativa" é literal.** No caminho do `42501` o lote é reenviado uma linha por vez para
isolar a culpada (4c §4), e **cada reenvio aparece no log como tentativa própria**. O mesmo
vale para o repeteco do `23503`. Um lote de 5 que bate em `42501` numa linha produz 5 eventos
de falha + 5 eventos individuais — 4 `ok` e 1 `🔴 42501`. É verboso de propósito: é exatamente
essa sequência que explica o que aconteceu.

**O que NÃO é logado, declarado:** o descarte de upsert órfão (viagem que não existe mais
localmente) não gera evento — nenhuma request foi feita, e `ok: true/false` ali seria mentira
nas duas direções. O `console.warn` que já existia segue sendo o registro desse caminho.

A máquina de flush não mudou: `enqueue`, `settle`, `markBlocked`, `diffLocal`, `sendUpserts`,
`sendDelete` e o laço de `flush()` estão idênticos à 4c. Entraram **três** chamadas de
`logAttempt` e nada mais.

---

## 3. `getSyncStatus()` — os três casos, finalmente separados

O relatório da 4c registrou como pendência (§9 item 4) que `getOutboxLength()` somava três
situações diferentes num número só. Agora:

```ts
{
  ownerUserId: string | null,
  sessionResolved: boolean,
  outbox: {
    pending: number,        // meu, não bloqueado  -> vai subir
    blocked: number,        // meu, recusado (42501) -> não será retentado
    foreignOwner: number,   // de outro uid -> não é meu para drenar
    ids: { pending: string[], blocked: string[], foreignOwner: string[] },
  },
  lastFlushAt: string | null,
  lastFlushError: FlushError | null,
  errors24h: number,
  inFlight: boolean,
}
```

**A invariante:** `pending + blocked + foreignOwner === getOutboxLength()`, sempre — sem sobra
e sem dupla contagem. O teste 21 assere isso diretamente contra `getOutboxLength()`, em vez de
contra um número escrito à mão.

Três detalhes que valem registro:

1. **Sessão não resolvida (ou anônima) → TODA op cai em `foreignOwner`.** Não é gambiarra: com
   `ownerUserId === null`, nenhuma op pode subir neste instante, e é isso que o campo diz. A
   classificação é a mesma regra do `flush()`, com um só classificador para as duas.
2. **`errors24h` ignora `ts` ilegível.** `Date.parse` de lixo dá `NaN`, e `NaN >= cutoff` é
   `false` — evento com data corrompida fica fora da conta em vez de virar "erro de hoje".
3. **`lastFlushAt` tem fallback no storage.** A variável de módulo zera quando a aba recarrega;
   o anel não. Sem sessão nenhuma de flush, o status ainda mostra quando foi a última tentativa
   registrada — o anel é cronológico por construção, então o último elemento é o mais recente.

`getSyncStatus()` **funciona sem `startTripSync()`**: é leitura de storage e de estado de
módulo. Dá para inspecionar uma aba onde o espelho nunca ligou.

### Os três acréscimos ao contrato (aprovados no STEP 1)

| # | Acréscimo | Por que |
|---|---|---|
| 1 | `outbox.ids` | o painel mostra contagem **e ids** (pedido da missão). As três contagens ficaram exatamente como especificadas; os ids saem do mesmo classificador, em vez de a tela reclassificar por conta própria — uma pergunta, uma fonte |
| 2 | `sessionResolved` | `ownerUserId: null` significa "anônimo" **e** "resolvendo"; o painel tem de distinguir os dois |
| 3 | `clearSyncLog()` | o botão "Limpar log". Faz `removeItem(kinu_sync_log)` e **nada mais** — apagar o outbox seria descartar escrita do usuário que ainda não subiu, e nenhum botão de painel tem esse direito |

---

## 4. O painel — `/smoke` § "🪞 Espelho (Arco 4) — lado local"

Entre o grid dos cartões e o `<pre>` do relatório. Estilo herdado do arquivo: fundo
`slate-900/40`, borda `slate-800`, número em `font-mono`, `emerald`/`amber`/`red`. Nenhum
design novo foi inventado.

**Mostra:**

- **Sessão:** o `userId`, ou `anônimo (espelho desligado)`, ou `resolvendo…` · e o `inFlight`
- **5 tiles:** Pendente · Blocked (42501) · Outro dono · Erros 24h · Último flush
- **os ids** de cada um dos três casos (uuid encurtado para 8 chars, com o inteiro no `title`)
- **Último erro:** `[code] message`
- **`kinu_sync_log`:** tabela dos 50, **mais recente no topo**, com `quando / op / id /
  resultado`
- **Botões:** "Forçar flush" e "Limpar log", cada um com confirmação em texto do que aconteceu
  — inclusive o caso `Sem sessão resolvida com userId: o flush é no-op e nenhuma chamada foi
  feita.`
- **Aviso fixo em âmbar:** a comparação local × banco chega na 4f

**Semáforo:** `pending` e `foreignOwner` ficam âmbar quando > 0 (é espera, não defeito);
`blocked` e `errors24h` ficam vermelhos quando > 0; zero é verde.

**Polling de 2 s** em vez de assinatura: o espelho não expõe sino próprio, e um painel de soak
precisa se mexer sozinho enquanto você usa o app em outra aba.

---

## 5. Testes — 22 no arquivo, 81 na suíte

Dois helpers mudaram, ambos aditivos: `fresh()` ganhou a opção `log?` (semeia `kinu_sync_log`
antes do import, como já fazia com `seed` e `outbox`), e o boot manual saiu para uma função
`boot()` — o teste 21 precisa roteirizar a resposta do banco **antes** de a sessão resolver, e
o `fresh()` reseta o roteiro. **Os 17 testes da 4c não mudaram uma linha.**

| # | Cenário | Resultado |
|---|---|---|
| 18 | flush com sucesso | ✅ evento `{op:'upsert', id:A, ok:true}` sem `code`; `lastFlushAt === log[0].ts` |
| 19 | flush com falha | ✅ evento `ok:false, code:'42501'`; `errors24h === 1` |
| 20 | anel de 50 | ✅ 51º evento → length **50**, o primeiro saiu pela frente, o novo entrou pelo fim |
| 21 | outbox misto | ✅ `pending:1 [A]`, `blocked:1 [B]`, `foreignOwner:1 [C]`; soma dos três `=== getOutboxLength()` |
| 22 | `errors24h` | ✅ 30 h atrás não conta · `ts` ilegível não conta · `ok:true` não conta · 2 h atrás conta = **1**; e o `lastFlushAt` cai no fallback do storage |

### Saída

```
✓ src/test/flight-fallback.test.tsx  (5 tests) 223ms
✓ src/test/tripSync.test.ts         (22 tests) 405ms
✓ src/test/session.test.ts          (13 tests)  45ms
✓ src/test/tripStore.test.ts        (31 tests)  29ms
✓ src/test/tripIdMigration.test.ts   (9 tests)  11ms
✓ src/test/example.test.ts           (1 test)    2ms

Test Files  6 passed (6)
     Tests  81 passed (81)
```

**`tsc`:** `npx tsc --noEmit -p tsconfig.app.json` → **4 erros**, os mesmos quatro de
`GeneratedItineraryStage.tsx` (1099, 1106, 1107, 1108). Baseline intacto.
**`build`:** `✓ built in 22.06s` (o aviso de chunk > 500 kB é pré-existente).

O `SmokeTest` não ganhou teste unitário permanente, como a missão previu — a prova dele foi o
A/B do §1.

---

## 6. O que este arco NÃO resolve

1. **Comparação local × banco.** Só-no-local, só-no-banco, payload divergente e a ordem
   `created_at asc` do recon §7.3 exigem `select`. É a **4f**, junto com a hidratação — e o
   painel declara isso na tela, em âmbar, para quem for usá-lo num soak.
2. **A checklist do §7.4** (11 passos, duas execuções, `errors24h == 0`) só fica executável
   quando a hidratação existir: o passo 8 ("outra aba, mesma conta, mesmas viagens") é
   literalmente leitura do banco.
3. **Ops órfãs de outro dono** ganharam visibilidade aqui, mas quem decide o destino delas é a
   **4e**, com o `kinu_trips_owner`.
4. **Sem telemetria central.** 50 eventos, uma origem, um localStorage. Soak com histórico
   entre navegadores está fora do Arco 4.

---

## 7. Pendências acumuladas do Arco 4

1. **Prova de runtime da 4a** no navegador de produção (herdada do 4b §7 e do 4c §9).
2. **Confirmação visual do `/smoke`** em navegador de verdade — o A/B em jsdom prova que o
   placar não mudou, mas não substitui bater o olho no painel novo (§1).
3. **`prova-espelho.md`** contra o banco real, dois usuários: RLS, trigger de `updated_at`,
   coluna gerada, FK (recon §6.3).
4. **`clearTrips()` agora apaga o banco** (risco 7): o texto do modal "Reiniciar jornada"
   (`Viagens.tsx:493`) ainda não avisa que a exclusão virou permanente e multi-dispositivo.
5. **Tamanho real do payload** (recon §10.3) — confirma se lote 5 é o número certo. Agora dá
   para medir com o painel aberto.
6. **`schema_version != 1`** ignorado com aviso é regra de leitura: 4f.
7. **Ordem `created_at asc`** na hidratação (recon §2.4, risco 5): 4f.
8. **Histórico de preços não espelhado** (recon §2.5, risco 12): dívida registrada, fora do
   Arco 4.

---

## 8. Commit e push

**Commit:** `8eb6bbb` — `feat(f3): arco 4d - observabilidade do espelho (kinu_sync_log + getSyncStatus + painel Espelho no /smoke)`

```
 RELATORIO-F3-ARCO4D-OBS.md | 256 +++++++++++++++++++++++++++++++++++++++++++++
 src/lib/tripSync.ts        | 171 ++++++++++++++++++++++++++++++
 src/pages/SmokeTest.tsx    | 250 +++++++++++++++++++++++++++++++++++++++++++
 src/test/tripSync.test.ts  | 132 +++++++++++++++++++++--
 4 files changed, 802 insertions(+), 7 deletions(-)
```

**Push** (`git push origin main`):

```
To https://github.com/PedroContrucci/kinus-clan-compass
   83ea030..8eb6bbb  main -> main
```

Sem `--amend` depois do push, sem `--force` — esta linha entra num commit `docs:` separado, em
cima do commit do código.
