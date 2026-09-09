# RELATÓRIO — Reuso não troca a casa de papel + 9 casas novas no catálogo

**Data:** 2026-09-09
**Commits:** `e6d7edc` (fix do gerador) · `21b746f` (catálogo)
**Ponto de partida:** working tree suja herdada da sessão anterior — 9 casas
novas em Fortaleza/Cartagena, a remoção da `cpt-peninsula` e o `catalog.ts` já
regenerado, tudo sem commit e **com a suíte vermelha**.

---

## 1. Placar

| Verificação | Ao pegar | Agora |
|---|---|---|
| Vitest | **220/221 — 1 falha** | **225/225** (+4 testes novos) |
| `tsc -p tsconfig.app.json --noEmit` | limpo | **limpo** |
| ESLint (arquivos tocados) | 53 erros pré-existentes (`no-explicit-any` em `Viagens.tsx`) | **53** — nenhum novo |
| `build-kinu-catalog --check` | em dia | **em dia** |
| Cross-papel na matriz 21 cidades × 4 configs | **1** | **0** |

A falha herdada, literal:

```
Fortaleza d=12 tr=2 luxury: "cabana del primo" em d3/dinner d11/lunch
```

Confirmei que era regressão dos dados novos e não ruído: com a working tree
guardada (`git stash`), `generatorNoRepeat.test.ts` passava 9/9 no `2030caf`.

---

## 2. O que quebrou — o esgotamento reabria a porta

O arco de 03/09 (`RELATORIO-NOREPEAT.md`) fechou a unicidade **por nome
normalizado**, atravessando categorias: `for-cabana-del-primo` (lunch) e
`for-rest-cabana-del-primo` (dinner) são a mesma casa, e o caminho de escolha
inédita passou a enxergar isso.

O que ficou aberto foi o **último recurso**. Quando o pool de uma refeição
esgota, `pickReusableByGap` recebe o pool inteiro da categoria e ordena por
"menos usado, usado há mais tempo". O id de almoço do Cabaña del Primo continua
nesse pool mesmo depois do id de jantar ter sido escalado — e, com o jantar lá
no d3, ele chegava ao d11 como o candidato *mais antigo*, ou seja, o preferido.
A regra de unicidade tinha fechado a porta da frente; o esgotamento abria a dos
fundos.

Por que só apareceu agora: Fortaleza tinha 6 almoços curados para até 10 slots
de almoço numa viagem de 12 dias. O pool sempre esgotava; o que mudou foi
*quem* estava no topo da ordenação quando esgotou. Ou seja — os dados novos não
criaram o defeito, tiraram ele do esconderijo.

---

## 3. A correção

`src/lib/placeIdentity.ts`:

- o tracker passa a guardar **o papel de cada uso** (`mark(name, dayIndex, role)`),
  indexado pelo nome normalizado, não pelo id — é o mesmo eixo da unicidade;
- novo predicado `usedInOtherRole(name, role)`;
- `pickReusableByGap(candidates, tracker, dayIndex, role?)` descarta, antes da
  cascata de espaçamento, quem já ocupou outro papel.

O filtro **cede** se esvaziar o slot: um almoço repetido é melhor que um dia sem
almoço. Nas 21 cidades × 4 configurações da matriz do teste, essa cessão nunca
foi acionada — o caminho existe para não transformar um bug de cardápio em um
buraco no roteiro.

Uso gravado **sem** papel (nome vindo do tema, não do pool curado) não bloqueia
papel nenhum: `usedInOtherRole` só responde `true` diante de um papel gravado e
diferente. É o comportamento conservador certo — sem saber o papel, não dá para
afirmar que houve troca.

Aplicado nos **três** geradores que compartilham o tracker, não só no que a
falha apontou:

| Local | O que mudou |
|---|---|
| `GeneratedItineraryStage.tsx` `pickActivity` | `mark(..., category)` e `pickReusableByGap(..., category)` |
| `createTrip.ts` `pickExp` / `pickRestaurant` / `claim` | idem; `claim` agora exige `'lunch' \| 'dinner'` no tipo |
| `Viagens.tsx` `pickActivity` | idem |

`claim` recebe papel obrigatório de propósito: são os nomes que entram pelo tema
do dia (jantar de chegada, casa Michelin promovida) e ocupam a viagem do mesmo
jeito. Deixar o papel opcional ali seria deixar um buraco novo com a cara do que
acabou de ser tapado.

---

## 4. Um ajuste no teste — e por que ele é legítimo

`generatorNoRepeat.test.ts` tem dois invariantes que, com a correção, passaram a
brigar:

- **A.** nenhum nome em dois papéis;
- **B.** todo nome disponível na categoria é usado antes de qualquer repetição.

B contava como "disponível" todo nome do pool da categoria. Só que uma casa que
a viagem já gastou como jantar **não está disponível** para o almoço — é
exatamente isso que A proíbe. Com A valendo de verdade, B cobrava do gerador
algo que A proíbe, e a suíte ficava insatisfazível por construção.

O ajuste: `available` passa a descontar os nomes que a viagem serviu em outro
slot. É a mesma aritmética que o primeiro teste do arquivo já declarava em
comentário desde 03/09 ("uma repetição é aritmeticamente inevitável"). Nenhuma
cobertura foi afrouxada: A continua exigindo zero, e B continua exigindo que
todo nome **de fato** disponível entre antes da primeira repetição.

Mais 4 testes unitários em `placeIdentity.test.ts` travam a regra no nível certo,
sem depender das contagens do catálogo: reuso não cruza papel, o filtro cede
quando esvaziaria o slot, uso sem papel não bloqueia nada, e o papel viaja pelo
nome normalizado (`"Jantar: Cabaña del Primo"` → `cabana del primo`).

---

## 5. O catálogo (`21b746f`)

Pools antes → depois:

| Cidade | breakfast | lunch | dinner | total |
|---|---|---|---|---|
| Fortaleza | 5 | **6 → 9** | 15 | 54 → **57** |
| Cartagena | **4 → 6** | **4 → 6** | **6 → 8** | 32 → **38** |
| Cidade do Cabo | 3 | 6 | 7 | 30 → **29** |

Casas novas: Cemoara, Giz Cozinha Afetiva e Recanto Praiano (Fortaleza);
Café del Mural, Café Stepping Stone, La Cocina de Pepina, La Mulata,
El Barón e María (Cartagena).

**Sai `cpt-peninsula`.** O passeio de 9h ("pinguins de Boulders + Cabo da Boa
Esperança") já existia repartido em `cpt-boulders` (1h30) e `cpt-cape-point`
(4h), ambos `morning` — a Cidade do Cabo tinha o mesmo dia cadastrado duas vezes.
Ninguém referenciava o id fora do catálogo, exceto o `DAY_OCCUPANCY` do
`sync-catalog.ts`, que saiu junto. Conferi o mapa inteiro contra o arquivo: as 13
chaves restantes batem uma a uma com os `dayOccupancy` do TS.

Corrigi uma contradição interna nos dados novos antes de commitar: `Cemoara`
vinha com `neighborhood: 'Meireles'` e dica dizendo "na Aldeota". Virou "na
divisa Meireles/Aldeota", que é onde a casa fica.

`catalog.ts` da kinu-ai regenerado **pelo script** (`build-kinu-catalog.ts`), não
à mão: 21 cidades, **901 atividades**, 68 hotéis. `--check` limpo e
`kinuCatalogArtifact.test.ts` verde.

---

## 6. Ordem dos commits

Os dois commits foram separados e nessa ordem de propósito: o fix do gerador
primeiro, os dados depois. Commitar os dados antes deixaria um commit vermelho
no meio do `main`. Validei a ordem na prática — guardei os dados, rodei a suíte
só com o fix (225/225 sobre o catálogo antigo), commitei, restaurei os dados,
rodei de novo (225/225).

---

## 7. Pendências e observações

- **`stash@{0}` de 18:48 ("WIP pré-sync") pode ser descartado.** É a mesma
  correção, derivada de forma independente antes de eu ver que ela existia, e
  cobre menos: só `placeIdentity` + `GeneratedItineraryStage`, sem `createTrip`,
  sem `Viagens` e sem testes. Tudo que ele tem está no `e6d7edc`. Não dropei por
  ser destrutivo — `git stash drop stash@{0}` quando quiser.
- **`cpt-cape-point` sem `dayOccupancy`.** São 4h de passeio (mais o
  deslocamento) e o `cpt-robben-island`, de mesma duração, é `'half'`. Com a
  saída da `cpt-peninsula`, a Cidade do Cabo ficou sem nenhum marcador de dia
  cheio na península — o gerador vai empilhar uma tarde por cima. Não mexi:
  muda a forma do roteiro e é decisão de curadoria, não de conserto. Se for pra
  ir, é uma linha no `DAY_OCCUPANCY` + o campo no TS.
- **ESLint de `Viagens.tsx`** segue com os 53 `no-explicit-any` de sempre
  (dívida anotada em `RELATORIO-TSC-DIVIDA.md`). Nenhum veio destes commits.
- **Nada foi deployado.** A edge function `kinu-ai` continua servindo o
  `catalog.ts` de 893 atividades até o próximo deploy.
