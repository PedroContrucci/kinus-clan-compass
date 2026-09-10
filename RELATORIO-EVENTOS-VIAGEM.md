# Relatório — os fatos de viagem viraram eventos

**Commit:** `01ba151` — `feat(events): os fatos de viagem entram na tabela, uma vez cada`
**Data:** 10/09/2026
**STEP 1:** aprovado nos defaults das 7 decisões (`continue` lido como "vai nos defaults").

---

## 1. O que passou a ser medido

Seis eventos, seis fatos. Nenhum deles é "o usuário viu uma tela" — são coisas que
aconteceram com a viagem.

| Evento | Props | Onde nasce |
|---|---|---|
| `trip.created` | `trip_id, destination, origin` | `NewPlanningWizard.tsx:162`, `KinuAIContext.tsx:392` |
| `trip.activated` | `trip_id, destination, country?, continent?, days, travelers, children?` | `Viagens.tsx:1104` (botão) e `:361` (implícita) |
| `trip.item_confirmed` | `trip_id, kind, item_id` | `Viagens.tsx:354` (atividade), `:712` (voo/hotel) |
| `trip.completed` | `trip_id, destination, country?, continent?, days` | varredura no boot (`App.tsx:59`) |
| `budget.closed_under` | `trip_id, budget, planned` | colado no `trip.completed` |
| `cla.feedback_sent` | `page` | `FeedbackButton.tsx:61` |

O módulo novo é `src/lib/tripEvents.ts` (306 linhas). Ele é o único lugar do app que sabe
montar as props de um fato de viagem — mesmo motivo do `hotelSwapEvent.ts`: formato montado
na tela é formato que diverge no segundo ponto de emissão, e a análise só compara o que tem
exatamente o mesmo formato.

Ele vive **fora** do `tripStore` e isso não é gosto: `kinuEvents` importa
`@/integrations/kinu-beta/client`, que roda `createClient` **no import** e morre sem as
`VITE_KINU_BETA_*`. Puxar o emissor para dentro do store arrastaria esse import para o grafo
de `tripStore.test.ts`, `hotelSwapPersistence.test.ts`, `tripAdoption.test.ts` e
`tripHydration.test.ts`, que não mockam o cliente. O store continua sendo storage puro; quem
conhece telemetria é o módulo novo, que importa o store.

---

## 2. As três coisas que valem ser ditas em voz alta

### 2.1 A idempotência é por chave natural, e a marca vive na viagem

`trip.activated` e `trip.completed` acontecem **uma vez por viagem**, não uma por sessão.
A marca é um campo fora do tipo na própria viagem (`activatedEventAt`, `completedEventAt`),
exatamente o padrão do `createdVia`. Dois motivos concretos para ser ali e não numa chave
própria de `localStorage`:

1. `normalizeTrip` é um spread raso, então campo extra atravessa toda leitura e escrita sem
   ninguém declará-lo (e `src/types/` estava fora do escopo).
2. `toRow` do `tripSync` manda a **viagem inteira** como `payload`. A marca sobe no espelho e
   desce na hidratação — o segundo dispositivo já encontra a viagem marcada.

E ela é **reivindicada dentro do `updateTrip`**, não antes dele. É isso que torna a chave
atômica: `updateTrip` relê o storage, aplica o updater e regrava. Se duas telas tentarem no
mesmo tick, a segunda lê a marca da primeira e desiste.

```ts
updateTrip(tripId, (trip) => {
  if (trip[mark]) return trip;            // já emitido: nada muda, nada sobe pro espelho
  const marked = { ...trip, [mark]: new Date().toISOString() };
  claimed = marked;
  return marked;
});
```

**Marca primeiro, evento depois**, de propósito: `trackEvent` é síncrono, nunca lança e
enfileira no anel antes de qualquer rede, então a janela entre as duas linhas é nula. Se a
*entrega* falhar, a marca existe e o evento fica `sent: false` no anel — a fila do emissor
cobre. Marca sem evento entregue se resolve sozinha; evento sem marca duplicaria.

### 2.2 O achado que mais importou: sem `item_id`, "confirmou 5 itens" nunca chegava a 5

O emissor descarta a emissão **idêntica** à última aceita (`kinuEvents.ts:105`, `isDuplicate`)
— proteção contra remonte de React, e ela está certa. Mas com as props originalmente pedidas
(`{trip_id, kind}`), confirmar duas atividades seguidas na mesma viagem produzia duas emissões
byte a byte iguais, e **a segunda era descartada**.

Daí o `item_id`: `activity.id` (`day3-2`), `'flight-outbound'` ou `'accommodation'`. É id local
e opaco — não é conteúdo de roteiro — e faz cada confirmação ser o fato distinto que ela é.
Mexer no dedupe seria o conserto errado.

Tem um teste dedicado a essa regressão (`conta DUAS confirmações seguidas como duas`).

### 2.3 A ativação implícita estava muda

Confirmar um item de um rascunho promove `draft → active` **sem passar pelo botão Ativar**
(`Viagens.tsx:346`). A viagem foi ativada e nenhum evento sairia. Agora sai: o status é lido
do storage **antes** da escrita (a `selectedTrip` da closure pode estar velha), e só emite se
era `draft` e virou `active`. A marca garante uma emissão por viagem venha ela por qual
caminho vier, então não há como duplicar com o botão.

---

## 3. Os limites, sem maquiagem

- **Rascunho vencido não conta como viagem concluída.** A varredura só olha
  `status ∈ {active, ongoing, completed}`. Ao pé da letra da definição original (`endDate <
  hoje`), um rascunho abandonado em janeiro emitiria `trip.completed` e o motor comemoraria uma
  viagem que não aconteceu.
- **`Américas` não separa norte de sul.** "Visitou 3 continentes" conta Nova York e Buenos
  Aires como um só. Separar exige mapa país→continente (~40 países); fica para o dia em que
  existir uma conquista que dependa disso.
- **Destino fora do catálogo omite `country`/`continent`.** Não inventa `'desconhecido'` — o
  motor conta valores distintos, e `'desconhecido'` viraria um continente na contagem.
- **Sem dono não emite.** A varredura exige sessão resolvida com usuário. O `/planejar` anônimo
  é caminho real e evento com `user_id` nulo não serve a um motor de conquistas. Quando a
  sessão resolve, `subscribeSession` traz a varredura de volta.
- **Dois dispositivos offline** que completam a mesma viagem antes de sincronizar geram dois
  eventos. A marca é best-effort entre dispositivos; dedupe de verdade é no servidor, e isso é
  do motor.
- **Storage recusado** (cota, aba privada): a marca não grava e o anel não grava. O evento vai
  direto para a tabela e o próximo boot tenta de novo — duplica. É o mesmo caminho já
  documentado no `kinuEvents.ts` como "o único em que não há onde guardar".
- **O updater constante** do `handleActivateDraft`/`handleSaveDraft` (`() => updatedTrip`,
  ignora a viagem que o store leu) continua lá. Se o cockpit gravar depois da ativação
  segurando uma cópia anterior à marca, a marca some e a próxima ativação reemite. Na prática
  o cockpit fecha na ativação, e o dedupe do emissor engole a repetição idêntica na mesma
  sessão. Consertar é mudança de lógica de handler — fora do escopo desta missão, e fica
  registrado aqui como dívida.
- **A fiação dos handlers não tem teste de renderização.** Ver §5.

---

## 4. `childrenCount`, e a linha vizinha que melhorou de graça

`SavedTrip` guarda só `travelers` (o total: adultos + crianças + bebês). Crianças existiam no
wizard (`data.children`) e sumiam na gravação — sem elas, "viajou com criança" é indecidível.
Agora os dois pontos de criação gravam `childrenCount`, do lado de fora do gerador
(`createTrip.ts` não foi tocado). Viagem antiga não tem o campo e o evento **omite** a prop.

Escrito pela index signature do `StoredTrip`, que é a porta declarada para campo que o tipo
ainda não tem — e não por `(trip as any)`. Consequência: o `(trip as any).createdVia = 'kinu'`
vizinho no `KinuAIContext` foi para o mesmo idioma. É mudança só de tipo, zero
comportamento, e o lint tem **um erro a menos** por causa dela (§6).

---

## 5. O teste que eu não gosto, e digo que não gosto

`src/test/eventWiring.test.ts` lê os fontes e afirma que as chamadas estão nos pontos certos.
41 linhas. É feio.

O motivo: `tripEvents.test.ts` prova o que cada fato **emite**, mas nada provava que a chamada
continua no handler certo. `Viagens.tsx` tem 2.9k linhas e zero harness; montar um custa mais
que este arco inteiro. Sem esse teste, um refactor apaga a emissão com a suíte toda verde.

Ele não sabe se a chamada roda — só que ela está escrita. É o degrau entre "nada" e um harness
de página, e some no dia em que o harness existir.

---

## 6. Portões, com a saída real

### `npx tsc --noEmit`

```
(nenhuma saída — exit 0)
```

### `npx vitest run`

```
 Test Files  24 passed (24)
      Tests  308 passed (308)
   Start at  14:21:43
   Duration  26.95s (transform 1.33s, setup 1.23s, collect 5.84s, tests 3.77s, environment 9.57s, prepare 1.80s)
```

281 → **308**. Os 27 novos: 20 em `tripEvents.test.ts`, 2 em `feedbackButton.test.tsx`,
5 em `eventWiring.test.ts`.

### `npx eslint .`

Medido contra o baseline num worktree de `HEAD` (`3d0b447`), porque o repo já tem erro
herdado e um número absoluto não diz nada:

```
baseline (3d0b447):  ✖ 313 problems (283 errors, 30 warnings)
depois (01ba151):    ✖ 312 problems (282 errors, 30 warnings)
```

Um erro **a menos** — o `(trip as any).createdVia` que virou `stored.createdVia`.
`tripEvents.ts` e os três testes novos: zero erro.

### `npm run build`

```
dist/assets/index-CGqL-OMZ.js            3,036.92 kB │ gzip: 899.01 kB
✓ built in 21.68s
```

### `git push`

```
$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   3d0b447..01ba151  main -> main
```

---

## 7. O que não foi tocado

- `src/data/`, `src/types/`, o gerador (`createTrip.ts`, `economicGenerator.ts`) e as edge
  functions. `childrenCount` é escrito nos dois pontos de criação, fora do gerador; a
  geografia é **lida** do catálogo.
- A lógica dos handlers. As únicas linhas novas em `Viagens.tsx` são chamadas de emissão e uma
  leitura (`statusAntes`) que existe só para decidir se emite.
- O updater constante do `handleActivateDraft`/`handleSaveDraft` (§3).
- `achievement.unlocked` — reservado, é do motor.
- Dedupe no servidor — decisão do motor.

## 8. Uma pendência de documento

`DESENHO-CONQUISTAS-v2.md` **não está no repositório** — nem na raiz, nem em `docs/`, nem em
nenhum commit. Trabalhei com a taxonomia que veio escrita na missão. Se o desenho disser algo
diferente sobre **nomes de props**, me manda o arquivo: renomear prop depois que o evento
começou a gravar é dívida de análise, e agora ele começou a gravar.

Publish continua sendo seu — não publiquei nada.
