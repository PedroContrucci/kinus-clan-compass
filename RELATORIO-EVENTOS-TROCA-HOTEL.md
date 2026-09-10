# `hotel.swapped`: uma linha por troca

**Missão:** a ficha gravava duas linhas idênticas; a lista do modal não gravava nenhuma.
**Commit:** `77897a5` — `fix(events): hotel.swapped sai uma vez por troca, e é entregue uma vez`

---

## 1. O diagnóstico não bateu com a hipótese — e é uma boa notícia

A hipótese da missão era um caminho duplo na ficha: dois handlers encadeados no mesmo
`onSelect`. **Não é isso.** Auditei os dois emissores (`HotelPlanBlock` e `HotelSwapModal`) e
eles nunca disparam no mesmo clique: a ficha aberta de dentro do modal FECHA o modal (`view`
é uma máquina de uma posição só), então o `handlePick` de lá não chega a rodar.

A duplicação era **entrega dobrada, com UMA entrada no anel**. Reproduzi antes de mexer:

```
INSERTED: ["hotel.swapped","hotel.swapped","hotel.reasons_viewed"]
RING:     ["hotel.swapped","hotel.reasons_viewed"]
```

O anel tem uma entrada, a tabela recebe duas. O mecanismo está em `flushEvents`: ele lê os
pendentes e só grava `sent: true` **depois** dos inserts. Duas drenagens no ar ao mesmo tempo
leem a mesma fila.

E a troca pela ficha é exatamente o caso que produz duas drenagens coladas:

| tempo | o que acontece |
|---|---|
| t0 | clique na ficha → `hotel.swapped` entra no anel → **drenagem A** sai, com o `swapped` pendente |
| t0+ε | `onSelectHotel` troca o hotel → re-render → o efeito emite `hotel.reasons_viewed` → **drenagem B** |
| t0+ε | B lê a fila: o `swapped` de A ainda está `sent: false` → **insere de novo** |
| ~10ms | A e B terminam: duas linhas idênticas, seguidas do `reasons_viewed` |

Isso explica por que só o `hotel.swapped` duplicou: ele é o único evento que tem outro evento
nascendo ~1 render depois dele. O `reasons_viewed` e o `detail_opened` são os últimos da rajada,
ninguém abre uma segunda drenagem em cima deles.

O sintoma já estava escrito na suíte, e ninguém leu como bug: o teste da falha na cabeça da fila
esperava `['e1','e1','e1']` — três emissões, três drenagens paralelas, o mesmo evento três vezes.

## 2. Por que a lista do modal não gravava nada

Não é bug ativo: **até `4bf404f` (ontem, 23:41) o `HotelSwapModal` não importava `trackEvent`.**
As trocas do Sofitel e do Copacabana Palace são de um build anterior a esse commit. O modal emite
desde então; o que fiz foi trocar o valor do campo (`surface: 'modal'` → `'swap'`, como pedido) e
cobrir com teste os dois caminhos que emitem lá dentro — `handlePick` e `confirmPending`.

## 3. O que mudou

**`src/lib/kinuEvents.ts`**

- **Uma drenagem por vez.** `flushEvents` virou uma casca em cima de `drainOnce`: se já há uma
  drenagem no ar, quem chega marca `drainAgain` e recebe a mesma promise. Serializar não pode
  custar evento — por isso a volta extra, em vez de descartar: o último evento não fica esperando
  a próxima emissão para ser entregue.
- **Dedupe contra a última emissão ACEITA, não contra a última persistida.** A referência agora é
  uma assinatura em memória (`nome + props + dono`), decidida antes de qualquer ida ao storage ou
  à rede. Isso fecha o buraco real: com o storage bloqueado (cota, navegador privado) não existia
  anel para comparar, e duas emissões idênticas no mesmo tick iam as duas direto para a tabela. O
  anel continua sendo a referência na primeira emissão da sessão — é o que segura o `reasons_viewed`
  do remonte depois de um F5.

**`src/lib/hotelSwapEvent.ts` (novo, 35 linhas)** — o único lugar que monta as props do
`hotel.swapped`, com o vocabulário de superfície fechado num tipo: `'swap'` (a lista do modal,
venha ela do bloco ou do stepper) e `'detail'` (o botão da ficha). Vive fora do `hotelSwap.ts`
de propósito: aquele módulo é domínio puro e é importado por testes que não mockam o cliente do
kinu-beta.

**As duas superfícies** passam a chamar `trackHotelSwap`, e o `onSelect` que o bloco passa para o
modal ganhou o comentário que faltava: ali não se emite, porque o evento daquela superfície é do
modal.

## 4. Testes

`src/test/hotelSwapEvent.test.tsx` (novo, 6 testes) — conta EMISSÕES por troca:

- bloco → modal → "Escolher este": uma linha, `surface: 'swap'`, `from`/`to`/`city` conferidos;
- modal direto, sem ficha (o do `TripPanel`/`DraftCockpit`): uma linha, `surface: 'swap'`;
- bloco → modal → ficha → escolher (o caminho que dobrou em produção): **uma** linha, `'detail'`;
- a ficha aberta pelo bloco é a do hotel atual — botão desabilitado, zero emissão;
- hotel confirmado: o primeiro toque só pergunta, quem emite é o "Trocar mesmo assim";
- duplo clique no mesmo botão: uma linha.

A casca do vaul é mockada por div, pelo motivo que o próprio `HotelDetailDrawer` já documenta: o
`Drawer` não tem lógica, e montá-lo no jsdom custa pointer/resize e portal para testar as mesmas
chamadas.

`src/test/kinuEvents.test.ts` — dois testes novos para a drenagem serializada (evento seguido de
outro no mesmo tick é entregue uma vez; e quem chega no meio não fica esperando a próxima emissão)
e dois para o dedupe same-tick, com e sem storage. O teste da cabeça da fila passou a esperar
`['e1','e1']`: duas tentativas em vez de três, porque as emissões seguintes agora entram na
drenagem que já estava no ar. A invariante que ele protege — o mais antigo primeiro, sempre — não
mudou.

**Suíte inteira: 281 testes, 21 arquivos, tudo verde.** `tsc --noEmit` e `eslint` limpos.

## 5. Push

```
$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   a24868a..77897a5  main -> main
```

## 6. Uma coisa que vi e não mexi

A marcação de entregue usa `keyOf = ts|name`. Dois eventos de mesmo nome emitidos no mesmo
milissegundo com props diferentes colidem nessa chave, e um deles seria marcado como enviado sem
ter sido. É perda de evento, não duplicação — o oposto desta missão —, e o dedupe torna o caso
estreito. Fica anotado: a correção é um `JSON.stringify(props)` na chave.

**Publish é seu** — nada foi publicado além do push para `main`.
