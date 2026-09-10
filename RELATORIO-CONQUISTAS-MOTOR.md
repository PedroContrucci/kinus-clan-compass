# RELATÓRIO — Motor de conquistas v1 (Camada Mundo) + UI do Perfil

**Missão:** ligar o motor que transforma os fatos de viagem em troféus, e mostrar isso no Perfil.
**Base:** `DESENHO-CONQUISTAS-v2.md` §1 e §3 (ad0bf8f) · `tripEvents.ts` (01ba151) · `kinuEvents.ts`
**Commit:** `8b0a4f5` · **Suíte:** 308 → 363 · **tsc:** limpo · **build:** limpo

---

## 1. O que passou a existir

| Arquivo | Papel |
|---|---|
| `src/lib/achievements.ts` | **puro** — catálogo dos 12 troféus, critérios, XP e níveis. Sem rede, sem storage, sem React. |
| `src/lib/achievementEngine.ts` | o motor — lê os eventos do usuário, computa, grava `achievement.unlocked` uma vez por chave. |
| `src/components/conquistas/AchievementsPanel.tsx` | nível + barra de XP + grade de troféus, no `/conta`. |
| `src/components/conquistas/AchievementCelebration.tsx` | o toast do troféu novo, pendurado no App. |
| `src/lib/kinuEvents.ts` | + `subscribeEvents`, e a correção de um bug de entrega (§5). |
| `src/pages/Conta.tsx`, `src/App.tsx` | a fiação. |
| `src/test/achievements.test.ts` (37) · `src/test/achievementEngine.test.ts` (15) | as provas. |

---

## 2. A decisão que sustenta o arco: idempotência por chave natural, lida do servidor

Antes de gravar qualquer coisa, o motor lê da tabela os `achievement.unlocked` **do próprio
usuário** e só emite as chaves que faltam. A chave natural é `(usuário, key)`.

Não é o dedupe do emissor que protege aqui, e não poderia ser: ele compara a emissão com o
**evento imediatamente anterior** (`kinuEvents.ts:105`) — nunca saberia que esta pessoa tem
`primeira_fogueira` desde março. O dedupe do emissor resolve re-render; este problema é outro.

Três consequências que valem mais que a regra:

- **Erro de leitura aborta a passada inteira.** Sem saber o que já está gravado, gravar é
  reemitir a coleção a cada boot offline. Melhor não destravar agora.
- **`emittedThisSession`** cobre a janela entre o `trackEvent` e a linha aparecer na tabela: dois
  fatos seguidos abrem duas passadas, e a segunda leria um servidor que ainda não recebeu a
  primeira.
- **Uma passada por vez**, com volta extra para quem chegou no meio — o mesmo idioma do
  `flushEvents` e do `scheduleSweep`. Sem isso, três `trip.completed` da varredura do boot abrem
  três leituras concorrentes, as três leem a tabela antes de qualquer gravação, e as três emitem
  `pe_na_estrada`.

**A leitura vem antes da drenagem, não depois.** Cada passada faz `await flushEvents()` **antes**
de ler: o fato que acabou de acontecer ainda está no anel, e ler a tabela sem esperar a entrega
computaria o mundo de um segundo atrás — o troféu só apareceria na próxima passada, que pode
nunca vir, porque é a emissão que acorda o motor.

### Retroativo não é um modo

Não existe "primeira execução" no código. Toda passada lê o histórico inteiro do usuário, então a
Rachel e o fundador acordam com `Primeira Fogueira` porque os eventos já estão na tabela. Zero
migração, zero script.

### Sem RPC

O §6 do desenho previa uma RPC `security definer` para o motor ler `events`. Ela não existe e não
vai existir: aquilo era necessário para um motor rodando no servidor com `service_role`, que não
tem SELECT na tabela. Rodando no cliente, a RLS *own* (provada em 10/09) deixa o usuário ler os
próprios eventos direto.

---

## 3. Quando o motor acorda

`subscribeSession` (o login e o retorno do OAuth — é ali que o retroativo acontece) e
`subscribeEvents`, a única adição ao emissor: um sino que toca depois de cada emissão aceita.

Assinar o emissor e não o `tripStore` foi decisão, não conveniência: arrastar uma atividade no
roteiro toca o sino do store e não é fato nenhum — seriam dezenas de leituras da tabela por
sessão para nada. `achievement.unlocked` fica de fora da escuta, senão o motor se acorda com o
próprio evento.

---

## 4. Os 12 troféus, e as duas diferenças em relação ao §3

Implementados: `primeira_fogueira`, `pe_na_estrada`, `cla_em_movimento`, `maratonista`,
`bandeirante`, `cartografo`, `cidadao_do_mundo`, `raizes_fortes`, `capitao_do_orcamento`,
`tesoureiro_do_cla`, `tudo_no_lugar`, `co_piloto`. As duas linhas reservadas do §3
(`primeiro_registro`, `album_do_cla`) ficaram fora: são de memórias, 2027, e troféu sem critério
é troféu que nunca destrava ocupando lugar na grade.

**Duas diferenças, as duas por falta de dado no evento — e as duas registradas no desenho:**

1. **`tudo_no_lugar` perdeu o "antes da partida".** Nenhum evento carrega `startDate` —
   `trip.activated` tem `days`, não a data. Dá para saber *o que* foi confirmado, não *quando* em
   relação à partida. Implementei a parte verificável: voo + hotel + 3 atividades distintas na
   mesma viagem. Fingir a comparação de datas com dado que não existe seria pior que a diferença.
   O caminho, se o "antes da partida" for inegociável, é pôr `start_date` no `trip.activated` — e
   isso é mudança de taxonomia (§1), que este arco não abriu.
2. **`cla_em_movimento` é um join.** `trip.completed` não carrega `children`, só a ativação
   carrega; o critério cruza os dois pelo `trip_id`. Consequência honesta: viagem ativada **antes
   de 01ba151** não tem `trip.activated` na tabela e não destrava o troféu, mesmo tendo criança.
   Vale para todos os troféus, aliás: o retroativo é sobre o que a tabela tem, não sobre o passado
   do storage local.

**O índice deduplica por `trip_id`.** O `tripEvents` protege cada fato com uma marca na própria
viagem, mas o motor não pode depender da higiene do emissor: a tabela é append-only e um
dispositivo antigo ou um F5 no meio de uma entrega podem deixar duas linhas do mesmo
`trip.completed`. Uma viagem conta uma vez. Destino fora do catálogo chega sem `country` e sem
`continent` (o `geoOf` omite as props) e não conta como "mais um país" — "não sei" não é lugar.

---

## 5. O bug que apareceu no caminho — e é de produção

O motor grava dois troféus em laço. Nos testes, só o primeiro chegava na tabela. O segundo não
ficava pendente: ficava marcado como **enviado**.

`keyOf`, a identidade de uma entrada do anel na hora de marcar o que foi entregue, era
`ts|name`. Dois eventos do **mesmo nome no mesmo milissegundo** têm a mesma chave. A drenagem lê a
fila, entrega o que leu, e depois marca como enviado por essa chave — pegando as duas entradas
quando só uma tinha sido inserida. A segunda sumia em silêncio.

Não é caso de laboratório e não nasceu neste arco: **a varredura do `tripEvents` já emite
`trip.completed` para três viagens dentro do mesmo milissegundo** desde 01ba151. Duas dessas
conclusões podiam nunca ter chegado no kinu-beta.

Correção: as props entram na identidade (`ts|name|props`). Duas entradas com mesmo ts, mesmo nome
E mesmas props são o mesmo evento — aí colapsar é o certo.

O teste de regressão congela o relógio de propósito: solto, ele passa quando as duas emissões
caem em milissegundos diferentes, que foi exatamente como o bug se escondeu por um arco inteiro.
Verificado que ele falha com o `keyOf` antigo e passa com o novo.

---

## 6. UI

**Perfil (`/conta`):** faixa de nível, barra de XP com o quanto falta para a próxima ("Faltam 50
XP para Desbravador"), contagem `n de 12`, e a grade. Destravado: emoji colorido, borda `primary`.
Bloqueado: silhueta com **o critério em uma linha** — silhueta que não diz o que falta é enfeite;
com o critério, a grade vira o mapa do que ainda dá para viver.

**Celebração:** o toast mora no `App.tsx`, não no Perfil. A conquista destrava quando a pessoa
confirma um hotel em `/viagens` ou quando a varredura do boot conclui uma viagem — quase nunca em
`/conta`. Vários de uma vez (o caso do retroativo) viram **um** toast: quatro empilhados é ruído,
um que diz quatro é notícia.

O balão do Perfil parou de prometer "(em breve) suas conquistas".

---

## 7. Testes — 308 → 363

`achievements.test.ts` (37) prova os 12 critérios **no limiar**: 4 países não fazem Cartógrafo, 5
fazem; 9 dias não fazem Maratonista, 10 fazem; três viagens ao mesmo destino não fazem
Bandeirante; a mesma atividade confirmada três vezes não fecha `tudo_no_lugar`; peças espalhadas
por viagens diferentes não fecham nenhuma; a criança de outra viagem não vale para esta. Teste que
só prova o caminho feliz aceita `return true`.

`achievementEngine.test.ts` (15) tem uma tabela mockada **com memória de verdade**: o `insert` do
fake empurra a linha para a mesma lista que o `select` devolve. Sem isso, "a segunda passada não
regrava" passaria mesmo com o motor cego, porque o servidor falso nunca lembraria da primeira.
Cobre: retroativo sobre histórico frio · segunda passada · **outro dispositivo, módulos novos,
mesma tabela** · histórico que já traz o troféu · troféu de outro usuário não conta como gravado ·
sem sessão não lê nem grava · erro de leitura não grava nada · o motor não se acorda com o próprio
evento · o cache pinta a tela sem falar com o servidor.

```
$ npx vitest run
 Test Files  26 passed (26)
      Tests  363 passed (363)
```

`npx tsc --noEmit` e `npm run build` limpos; eslint limpo nos arquivos novos.

---

## 8. O que não foi tocado

`src/data/`, `src/types/`, gerador, edge functions e a **Camada Local** (os 105 troféus de cidade),
que espera o check-in pós-viagem — a fonte da verdade da vivência do §2 do desenho. Sem ele, um
troféu de cidade seria "o app te vendeu um passeio", não "você viveu".

Encontrei a árvore com 8 linhas removidas do `RELATORIO-EVENTOS-VIAGEM.md` — exatamente o bloco de
saída do `git push` que o `05c5609` tinha acrescentado. Restaurei antes de começar; não era parte
de nenhuma missão.

---

## 9. Próximo passo

Check-in pós-viagem (Lovable) → é ele que destrava a Camada Local inteira. O motor já está pronto
para recebê-la: o catálogo é uma lista, e `unlockedKeys` não sabe quantos troféus existem.

---

## 10. A saída do push

```
$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   ad0bf8f..8b0a4f5  main -> main
```

E o push deste relatório, no commit `docs:` separado:

```
$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   8b0a4f5..fb2282d  main -> main
```
