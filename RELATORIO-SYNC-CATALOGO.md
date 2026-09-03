# RELATÓRIO — Sync catálogo banco→app (Etapa 5 da esteira)

**Data:** 03/09/2026 · **Commit de dados:** `bea61d8` · **Base:** `654e23b` (pull `--ff-only` antes de tudo)
**Proposta aprovada:** `STEP1-SYNC1.md` (rascunho, deletado após o APLICAR)

---

## 1. O que aconteceu, em cinco linhas

1. **Write-back app→banco primeiro** (`writeback-catalog.ts --apply`): 11 atividades que existiam
   só no app entraram no banco. Sem esse passo, o sync as teria apagado.
2. **`bkk-grande-palacio` marcado `retired`** no banco logo em seguida, com `notes` explicando a
   substituição por `bkk-grand-palace`.
3. **`scripts/sync-catalog.ts` reescrito**: regenera as **21 cidades num run só** e **recusa** cidade
   por argumento. Export parcial deixou de ser possível.
4. **Sync aplicado**: `src/data/destinationActivities.ts` foi de **880 → 893** entradas.
   **16 entram, 3 saem.**
5. **Provas completas**: vitest 133/133, tsc exit 0, e re-diff campo a campo do arquivo gerado
   contra o banco com **0 divergências em 893 ids**.

---

## 2. Contagem por cidade — banco vs arquivo

Coluna "banco" = `curated_activities` com `status='published'` após o write-back.
Coluna "arquivo depois" = medida no arquivo gerado, por dump real via Node 24 (não por regex).

| Cidade | const | arquivo antes | banco | arquivo depois | entram | saem |
|---|---|---:|---:|---:|---:|---:|
| Bangkok | `bangkokActivities` | 29 | 29 | **29** | 1 | 1 |
| Barcelona | `barcelonaActivities` | 43 | 43 | **43** | 0 | 0 |
| Buenos Aires | `buenosAiresActivities` | 42 | 42 | **42** | 0 | 0 |
| Cartagena | `cartagenaActivities` | 32 | 32 | **32** | 0 | 0 |
| Cidade do Cabo | `cidadeDoCaboActivities` | 28 | 30 | **30** | 2 | 0 |
| Dubai | `dubaiActivities` | 41 | 41 | **41** | 0 | 0 |
| Fortaleza | `fortalezaActivities` | 56 | 54 | **54** | 0 | 2 |
| Gramado | `gramadoActivities` | 40 | 40 | **40** | 0 | 0 |
| Istambul | `istambulActivities` | 28 | 28 | **28** | 0 | 0 |
| Lisboa | `lisboaActivities` | 40 | 44 | **44** | 4 | 0 |
| Londres | `londresActivities` | 42 | 42 | **42** | 0 | 0 |
| Marrakech | `marrakechActivities` | 28 | 28 | **28** | 0 | 0 |
| Nova York | `novaYorkActivities` | 43 | 44 | **44** | 1 | 0 |
| Orlando | `orlandoActivities` | 36 | 38 | **38** | 2 | 0 |
| Paris | `parisActivities` | 66 | 66 | **66** | 0 | 0 |
| Porto Seguro | `portoSeguroActivities` | 38 | 38 | **38** | 0 | 0 |
| Rio de Janeiro | `rioActivities` | 62 | 64 | **64** | 2 | 0 |
| Rome | `romeActivities` | 43 | 46 | **46** | 3 | 0 |
| Salvador | `salvadorActivities` | 61 | 62 | **62** | 1 | 0 |
| Singapura | `singapuraActivities` | 29 | 29 | **29** | 0 | 0 |
| Tokyo | `tokyoActivities` | 53 | 53 | **53** | 0 | 0 |
| **TOTAL** | | **880** | **893** | **893** | **16** | **3** |

**Arquivo == banco em todas as 21 cidades.** As chaves `'Roma'` e `'Tóquio'` do registry são
aliases de `'Rome'`/`'Tokyo'` e apontam para a mesma const — conferido: mesmas 46 e 53 entradas.

Estado final do banco: **912 linhas** — 893 `published`, 18 `retired`, 1 `needs_review`.

---

## 3. Diff resumido

### 3.1 Entram (16) — todas da leva de verificadas

| id | cidade | `landmark_tier` |
|---|---|---|
| `rio-cristo-redentor` | Rio de Janeiro | icon |
| `rio-pao-acucar` | Rio de Janeiro | essential |
| `rome-colosseo` | Rome | icon |
| `rome-vaticano` | Rome | essential |
| `rome-san-pietro` | Rome | essential |
| `nyc-estatua-liberdade` | Nova York | icon |
| `orl-magic-kingdom` | Orlando | icon |
| `orl-universal-studios` | Orlando | essential |
| `bkk-grand-palace` | Bangkok | icon |
| `cpt-boulders` | Cidade do Cabo | essential |
| `cpt-cape-point` | Cidade do Cabo | essential |
| `ssa-pelourinho` | Salvador | icon |
| `lis-jeronimos` | Lisboa | essential |
| `lis-torre-belem` | Lisboa | icon |
| `lis-castelo-sao-jorge` | Lisboa | essential |
| `lis-alfama-walk` | Lisboa | essential |

As outras **2 das 18 verificadas** já existiam no app com o mesmo id e entraram como **atualização
de curadoria** — não aparecem como "entram" porque a linha não é nova:

```
cpt-table-mountain   custo 230 → 180   duração 4 → 3   rating 4.9 → 4.7   tips reescritas
ist-topkapi          custo 200 →  95   duração 4 → 3   rating 4.7 → 4.5   tips reescritas
                                                        styleTags + 'art'
```

### 3.2 Saem (3) — todas `retired` no banco

| id | cidade | motivo |
|---|---|---|
| `for-santa-grelha` | Fortaleza | duplicata — `for-rest-santa-grelha` fica |
| `for-rest-mercado-peixes` | Fortaleza | `retired` sem substituto |
| `bkk-grande-palacio` | Bangkok | substituído por `bkk-grand-palace` (§4) |

### 3.3 Rename e churn de conteúdo

**`for-iracema-pontes`** — o **id não mudou**; o `name` foi de
`'Praia de Iracema e Ponte dos Ingleses'` para `'Pôr do sol e noite na Ponte dos Ingleses'`,
desambiguando-o de `for-praia-iracema`, que coexiste. Nenhum código casa por `name`.

**Dos 867 ids já presentes nos dois lados antes do sync, só 3 tinham conteúdo divergente** — este
rename e as duas recuradas do §3.1. Os outros 864 vieram idênticos. É o número que mede a saúde da
esteira: o banco não estava divergindo do app às escondidas.

---

## 4. O write-back que precedeu o sync

`writeback-catalog.ts:43` já listava, desde o levantamento de 03/08, as 5 cidades onde o app tinha
itens ausentes do banco — e o cabeçalho do script já avisava por escrito que sincronizar antes do
write-back apagaria esses itens. **O write-back nunca tinha sido rodado com `--apply`.**

Dry-run (a íntegra, como pedido):

```
🔁 Write-back app -> banco  [dry-run]
   cidades: Cidade do Cabo, Istambul, Bangkok, Marrakech, Singapura

── Cidade do Cabo — app=28 banco=28
   + INSERT   cpt-peninsula                Península do Cabo: pinguins de Boulders e Cabo da Boa Esperança
   + INSERT   cpt-robben-island            Robben Island
   ⚠ db-only  cpt-boulders                 Pinguins de Boulders Beach  [não tocado — falta no app]
   ⚠ db-only  cpt-cape-point               Cabo da Boa Esperança e Cape Point  [não tocado — falta no app]

── Istambul — app=28 banco=27
   + INSERT   ist-ilhas-principes          Ilhas dos Príncipes (Büyükada)

── Bangkok — app=29 banco=27
   + INSERT   bkk-grande-palacio           Grande Palácio e Wat Phra Kaew
   + INSERT   bkk-mercado-flutuante        Mercado flutuante de Damnoen Saduak
   + INSERT   bkk-ayutthaya                Bate-volta a Ayutthaya
   ⚠ db-only  bkk-grand-palace             Grand Palace e Wat Phra Kaew (Buda de Esmeralda)  [não tocado — falta no app]

── Marrakech — app=28 banco=26
   + INSERT   mrk-medina-souks             Medina e souks
   + INSERT   mrk-ourika                   Bate-volta ao Vale do Ourika (Atlas)

── Singapura — app=29 banco=26
   + INSERT   sin-sentosa                  Dia em Sentosa
   + INSERT   sin-universal                Universal Studios Singapore
   + INSERT   sin-zoo                      Singapore Zoo (habitat aberto)

── Total: 11 a inserir · 3 db-only (aviso)
```

`--apply` confirmou linha a linha, com backup prévio de 134 linhas em
`.writeback-backups/writeback-2026-09-03-*.json` (diretório git-ignorado):

```
   • INSERT devolveu 11 linha(s)
   ✅ Cidade do Cabo   28 -> 30 (esperado 30)
   ✅ Istambul         27 -> 28 (esperado 28)
   ✅ Bangkok          27 -> 30 (esperado 30)
   ✅ Marrakech        26 -> 28 (esperado 28)
   ✅ Singapura        26 -> 29 (esperado 29)
```

### 4.1 `bkk-grande-palacio` → `retired`

`PATCH` via REST com a service key, imediatamente após o write-back e antes do sync:

```
status: published -> retired
notes: "retired 2026-09-03 — substituido por bkk-grand-palace (mesmo lugar real:
        Grande Palacio / Wat Phra Kaew). Id duplicado para o mesmo local burla a
        nao-repeticao do gerador de roteiro. Entrada canonica: bkk-grand-palace."
```

O sync então o removeu do app e `bkk-grand-palace` entrou no lugar — Bangkok fechou em 29, igual
ao que tinha antes.

### 4.2 ⚠️ As 10 linhas do write-back que aguardam sua revisão de curadoria

Entraram no banco com `source: 'kinu'`, `status: 'published'`, `notes: 'write-back app->banco ·
2026-09-03'`, e **sem** `landmark_tier`, `google_rating`, `google_status` ou `place_id` — o
write-back só copia o que o TS tem.

| id | cidade | nome |
|---|---|---|
| `bkk-ayutthaya` | Bangkok | Bate-volta a Ayutthaya |
| `bkk-mercado-flutuante` | Bangkok | Mercado flutuante de Damnoen Saduak |
| `cpt-peninsula` | Cidade do Cabo | Península do Cabo: pinguins de Boulders e Cabo da Boa Esperança |
| `cpt-robben-island` | Cidade do Cabo | Robben Island |
| `ist-ilhas-principes` | Istambul | Ilhas dos Príncipes (Büyükada) |
| `mrk-medina-souks` | Marrakech | Medina e souks |
| `mrk-ourika` | Marrakech | Bate-volta ao Vale do Ourika (Atlas) |
| `sin-sentosa` | Singapura | Dia em Sentosa |
| `sin-universal` | Singapura | Universal Studios Singapore |
| `sin-zoo` | Singapura | Singapore Zoo (habitat aberto) |

**O primeiro item da sua fila deveria ser `cpt-peninsula`.** Ele é o mesmo padrão do
`bkk-grande-palacio`: um id que cobre *Boulders + Cabo da Boa Esperança* enquanto `cpt-boulders` e
`cpt-cape-point` agora existem separados e verificados. São três ids para dois lugares reais —
exatamente a duplicata que burla a não-repetição do gerador. Não mexi porque você pediu só o
`bkk-grande-palacio`; a decisão de aposentar ou reescrever é curadoria, não sync.

---

## 5. Mapeamento banco → TS (o que ficou valendo)

| Campo TS | Coluna banco | Regra aplicada |
|---|---|---|
| `id` | `id` | literal |
| `name` | `name` | literal escapado |
| `category` | `category` | validado contra a união de 6; fora dela **aborta** |
| `neighborhood` | `neighborhood` | literal escapado |
| `rating` | `rating` ?? `google_rating` | **curadoria ganha do Google, sempre** |
| `estimatedCostBRL` | `estimated_cost_brl` | `Number`, finito |
| `durationHours` | `duration_hours` | `Number`, finito (`3.0` → `3`) |
| `tips` | `tips` | array; `null` → `[]` |
| `styleTags` | `style_tags` | array; `null` → `[]` |
| `bestTime?` | *(sem coluna)* | omitido — 0 usos nos dados e 0 na lógica |
| `dayOccupancy?` | *(sem coluna)* | overlay `DAY_OCCUPANCY` por id — §6 |
| — | `landmark_tier` | **não exportada** |
| — | `place_id`, `notes`, `source`, `google_reviews`, `google_status`, `google_address`, `auto_check`, `created_at`, `updated_at`, `status` | não exportadas |

**Sobre `rating`:** as 18 verificadas entraram no banco com `rating` NULL e `google_rating`
preenchido — é o único caso em que a nota do Google chega ao app. As outras 875 mantiveram a nota
curada, inclusive as **206** que têm `google_rating` divergente (ex.: `bcn6-passeig-bike`, curado
4.6 contra 5,0 do Google). Trocar essas 206 seria uma mudança de produto disfarçada de sync.

**`SuggestedActivity` está intocado.** Verificado no arquivo gerado: nenhuma das 893 entradas tem
campo fora do tipo, e `landmark_tier` não aparece em lugar nenhum.

---

## 6. `dayOccupancy` — o campo preservado à mão

É o único campo do TS sem coluna no banco que tem **lógica viva**:
`GeneratedItineraryStage.tsx:665,790,827,841,851,861`, `itineraryValidator.ts:63`,
`Viagens.tsx:1159`. Um regen sem tratamento o teria apagado das 21 cidades.

O script o reaplica por id a partir da const `DAY_OCCUPANCY`. **14 ids preservados no arquivo
gerado**, conferidos um a um após a escrita:

```
full : bkk-ayutthaya · cpt-peninsula · ist-ilhas-principes · mrk-ourika
       orl-magic-kingdom · orl-universal-studios · sin-sentosa · sin-universal
half : bkk-mercado-flutuante · cpt-robben-island · cpt-table-mountain · ist-topkapi
       mrk-medina-souks · sin-zoo
```

Os dois de Orlando são novos nesta rodada, por sua decisão: `orl-magic-kingdom` e
`orl-universal-studios` declaram `durationHours: 10` e agora ocupam o dia inteiro no gerador.
`bkk-grande-palacio` saiu da const junto com a linha.

---

## 7. Provas

| # | Prova | Resultado |
|---|---|---|
| 1 | `npx vitest run` | **133/133 verde**, 10 suítes — igual à baseline pré-sync |
| 2 | `npx tsc -p tsconfig.app.json --noEmit` | **exit 0** — igual à baseline |
| 3 | Contagem por cidade: arquivo gerado vs banco | **21/21 OK**, 893 = 893 (§2) |
| 4 | Re-diff campo a campo, dump real do arquivo vs banco | **0 divergências em 893 ids**; 0 ids só no arquivo, 0 só no banco |
| 5 | Ordenação `id asc` em todas as cidades | **21/21 OK** |
| 6 | `git status` antes do commit | exatamente 2 arquivos |

Além disso, o próprio script revalida a partir do arquivo escrito (ids e ordem, const a const) e
roda o `tsc`, **restaurando o original** se qualquer um falhar.

**Uma ressalva honesta sobre a prova 1:** nenhuma das 10 suítes lê `destinationActivities`. O verde
delas prova ausência de regressão colateral, não a correção do dado. Quem prova o dado são as
provas 3, 4 e 5.

### 7.1 Diff real vs. orçado

| | orçado no STEP1 §9 | real |
|---|---|---|
| `scripts/sync-catalog.ts` | ~+230 / −257 | +374 / −257 |
| `src/data/destinationActivities.ts` | ~+35 / −185 | +84 / −1508 |
| arquivo de dados, total de linhas | ~2900 | **1728** (era 3209) |

**Subestimei a queda de linhas por um fator de 8.** A causa: as 5 cidades escritas à mão em formato
multi-linha gastavam ~11 linhas por entrada, e as ~140 entradas delas colapsaram para 140 one-liners
— sozinhas, isso são ~1400 linhas a menos. O conteúdo está integralmente preservado (prova 4, 0
divergências); o que encolheu foi só a formatação. O arquivo agora tem **um único formato de
entrada**, o que estava valendo para 738 das 880 linhas antigas.

---

## 8. O script — o que mudou de desenho

`scripts/sync-catalog.ts` foi reescrito, não duplicado. A mudança que importa:

**A versão antiga exigia uma cidade em `argv[2]`.** Ou seja, a única ferramenta de sync commitada no
repo só sabia fazer o export parcial que apaga as demais cidades — a lição do sync-hotels vivia no
comentário, não no código. A nova **recusa** cidade por argumento e regenera as 21 sempre.

Guardas, todas **antes** de escrever um byte:

1. **Paginação conferida** — `Prefer: count=exact` + `content-range`; página perdida no meio aborta.
2. **Cobertura** — toda cidade do banco precisa de chave no registry, e toda const do arquivo
   precisa ser alcançada por alguma cidade. Uma query incompleta não consegue esvaziar cidade.
3. **Piso de 80 %** — cidade que vier com menos de 80 % da contagem atual aborta o run e lista quais.
4. **Ids únicos** no export.
5. **`category` validada** contra a união do TS.
6. **`rating` obrigatório** — `rating ?? google_rating`; os dois nulos abortam.

E depois de escrever: revalidação de ids e ordem const a const, `tsc`, e **restauração do original**
se qualquer uma falhar. Não existe caminho que deixe o arquivo pela metade.

`npx tsx scripts/sync-catalog.ts` é dry-run; `--apply` escreve. Mesma convenção do
`writeback-catalog.ts`. A versão de cidade única continua recuperável em
`git show 654e23b:scripts/sync-catalog.ts`.

---

## 9. Dívidas registradas

1. **Coluna `day_occupancy` em `curated_activities`.** Enquanto não existir, a const
   `DAY_OCCUPANCY` do script é a fonte de verdade de um campo que o gerador de roteiro usa para
   decidir se cabe outra atividade no dia. É a única parte do catálogo que não vive no banco.
   Quando a coluna existir, a const some num commit só.
   `ALTER TABLE curated_activities ADD COLUMN day_occupancy text;`
2. **Enrich das 10 linhas do write-back** (§4.2), numa rodada futura: `landmark_tier`,
   `google_rating`/`google_status`/`place_id`, e a decisão de curadoria sobre `cpt-peninsula`.
3. **Leitura anônima de `curated_activities` segue fechada** — o papel `anon` não tem `SELECT`
   (`42501`). A esteira usa a service key do `.env.sync` (git-ignorado), e **decidimos manter
   assim**: abrir a tabela para a anon key, que está no bundle público do browser, exporia o
   catálogo curado inteiro. Registrado para que a próxima pessoa não interprete o 401 como bug.

---

## 10. Prompt de Publish para o Lovable

> O catálogo de atividades foi sincronizado com o banco curado. O commit `bea61d8` regenera
> `src/data/destinationActivities.ts` (880 → 893 atividades, 21 cidades) e reescreve
> `scripts/sync-catalog.ts`.
>
> **São só dados e um script de linha de comando.** Nenhum tipo, componente, hook, rota ou Edge
> Function mudou — `SuggestedActivity` está intocado. `npx vitest run` passa 133/133 e
> `tsc -p tsconfig.app.json` fecha com zero erros.
>
> Por favor dê **Publish** para o build de produção pegar o catálogo novo. **Não é preciso deploy
> de Edge Function.**
>
> O que o usuário vai ver de diferente: aparecem 16 atrações-ícone que faltavam (Cristo Redentor,
> Pão de Açúcar, Coliseu, Museus do Vaticano, San Pietro, Estátua da Liberdade, Magic Kingdom,
> Universal, Grand Palace, Cape Point, Boulders, Pelourinho, Jerónimos, Torre de Belém, Castelo de
> São Jorge e Alfama), e saem 3 entradas duplicadas ou aposentadas.

---

## 11. Rito de fechamento

| Passo | Estado |
|---|---|
| `git pull --ff-only` antes de tudo | ✅ `b33e4be..654e23b` |
| Write-back dry-run + `--apply` | ✅ 11 linhas, com backup |
| `bkk-grande-palacio` → `retired` com `notes` | ✅ |
| Sync dry-run conferido, depois `--apply` | ✅ 880 → 893 |
| Provas do §7 completas antes do commit | ✅ 6/6 |
| Commit `feat(data)` | ✅ `bea61d8` |
| `push` (sem `amend`, sem `force`) | ✅ `654e23b..bea61d8` |
| Relatório em commit `docs:` separado | este |
| `STEP1-SYNC1.md` deletado | ✅ |
| `STEP1-ARCO5D.md` deletado (lixo de mesa, nunca commitado) | ✅ |
