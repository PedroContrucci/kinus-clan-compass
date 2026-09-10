# RELATÓRIO — Motor de conquistas v2: Camada Local (troféus por destino)

**Data:** 10/set/2026 · **Base:** `8b0a4f5` (motor) + `1029266` (check-in do Lovable, chegou no meio da missão)
**Commits:** `96a7d1b` (feat) · `7bb736c` (docs) · **Suíte: 363 → 418** · tsc limpo · build ✅

---

## 1. O que passou a existir

105 troféus (5 moldes × 21 cidades) que premiam o que a família **viveu**, não o que planejou.

| Molde | Chave | Critério | XP |
|---|---|---|---|
| Carimbo | `local.<slug>.carimbo` | 1ª `trip.completed` na cidade | 25 |
| Ícone | `local.<slug>.icone` | viveu o id `landmark_tier='icon'` | 25 |
| Coração | `local.<slug>.coracao` | viveu 5 ids `essential` | 50 |
| Garfo | `local.<slug>.garfo` | viveu 3 ids gastronômicos | 25 |
| Segredo | `local.<slug>.segredo` | viveu 1 id `hidden_gem` | 50 |

Acumulam entre viagens na mesma cidade: 3 essenciais numa viagem + 2 em outra fazem um Coração.

---

## 2. Cinco decisões, e por quê

**1. O tier chega por arquivo gerado, não por rede.**
`landmark_tier` vive só em `curated_activities`, e o motor roda no cliente. `sync-catalog.ts --apply` passou a emitir `src/data/generated/landmarkTiers.ts` (469 linhas, 21 KB): `id → tier`, a gastronomia da cidade e os apelidos do catálogo.

Escolhi `src/data/generated/` contra as duas opções propostas. `src/data/` na raiz mistura o arquivo com sete curados **à mão** e convida o primeiro tier corrigido no editor, que o próximo `--apply` apaga; `src/lib/` é lógica, e isto é uma tabela. A rota nova diz as duas coisas: é dado, e é gerado. Nenhum arquivo existente de `src/data/` foi tocado.

**2. Casamento por ID, nunca por nome.** O roteiro embute o id do catálogo no id do item (`GeneratedItineraryStage.tsx:229`), então `day-1-for-mercado-peixes` **é** `for-mercado-peixes`. Nome é texto de tela e muda com uma correção de acento — levando o troféu junto.

Itens locais (`breakfast-hotel`, `ambient-walk`, `free-morning`, `transit`…) não entraram numa lista de exceções: quem filtra é a **pertinência** ao mapa da cidade. Lista de exceção envelhece a cada item novo do gerador; pertinência não.

**3. O check-in SUBSTITUI o confirmado, não soma.** Havendo `trip.checkin` na viagem, os ids vividos dela são só os do check-in. Somar o confirmado devolveria o troféu para o restaurante reservado e cancelado — e apagaria justamente a diferença promessa-vs-entrega que o §2 quer medir (é o que o `skipped` conta). Viagem **sem** check-in cai no fallback: item confirmado **em viagem concluída**.

**4. O catálogo virou dinâmico.** 12 fixos + 5 por cidade classificada = 117. Quantos existem é pergunta para o arquivo gerado, não para uma constante. O XP passou a **somar o valor de cada molde** (`Achievement.xp`) em vez de contar × 25 — a Camada Mundo não declara `xp` e continua valendo 25, byte por byte igual.

**5. A trava de deriva não chama o gerador.** A do `catalog.ts` roda `--check` porque reconstrói o artefato offline. Esta não pode: o tier só existe no banco, e reconstruir exigiria a `KINU_BETA_SERVICE_KEY` — que a suíte não tem e não deve ter. Teste que bate na rede quebra no avião, e num CI sem credencial passaria **por omissão**, que é pior.

Então `landmarkTiersArtifact.test.ts` trava o que é conferível offline contra `src/data/`: as 21 cidades e só elas · todo id classificado ainda existe no catálogo · `food` é **exatamente** a gastronomia do catálogo (igualdade de conjunto) · cada cidade fecha os limiares dos cinco moldes · os 21 slugs literais, porque chave de troféu vai para a tabela e fica lá. **Conferido que morde:** renomeei um id no artefato e o teste falhou apontando o órfão.

Fica de fora só o tier mudado no banco sem `--apply`. Está declarado no cabeçalho do teste.

---

## 3. Achados que mudaram alguma coisa

**O banco desmente o §4 em duas cidades.** O desenho afirmava "1 icon · 8 essential · 5 hidden_gem cada". **Fortaleza e Gramado têm 4 hidden_gem** (292 itens classificados, não 294). Nenhum molde depende de 5 — o Segredo pede 1 —, mas o número estava errado e foi corrigido no desenho. O gerador agora **aborta** se uma cidade não fechar os limiares: cidade classificada pela metade produziria troféu que nunca destrava, e é melhor não escrever o arquivo do que escrever a promessa quebrada.

**O banco fala `Rome` e `Tokyo`; o app fala `Roma` e `Tóquio`.** O gerador canoniza pelo registry de `destinationActivities` (os dois apelidos apontam para a mesma const) e emite os apelidos no artefato. É o que faz um check-in com `city: 'Rome'` cair em `Roma` sem tabela de sinônimos escrita à mão.

**O `tsc` estava vermelho no `main` antes desta missão.** `src/test/tripEvents.test.ts` tinha dois `finances` sem o campo `categories`, de `01ba151`. Isso impedia o `sync-catalog --apply` de terminar (ele roda type-check antes de escrever). Corrigido com um helper `finances()` tipado.

**Um `for-cemoara` mais novo veio do banco e foi devolvido.** O `--apply` trouxe uma correção de dica ("divisa Meireles/Aldeota" → "Aldeota") que **não** é desta missão. Revertido: `src/data/destinationActivities.ts` e `supabase/functions/kinu-ai/catalog.ts` estão idênticos ao que estavam. **Fica pendente** — quem rodar o próximo sync leva essa linha junto.

---

## 4. ⚠️ A divergência que sobrou, e é sua para decidir

O check-in chegou do Lovable no meio da missão (`1029266`). O cabeçalho do `src/lib/tripCheckin.ts` diz:

> *"Não existe referência ao catálogo na atividade: o gerador cria ids derivados do nome (`activity-<slug>`, `free-<slug>`)... Por isso o evento carrega `lived_ids` E `lived_names`, **para o motor casar por nome normalizado contra o catálogo**."*

**Isso está incorreto para o gerador que roda.** `GeneratedItineraryStage.tsx:229` monta `day-${dia}-${atividade.id}` com o id do catálogo, e foi o que o check-in de Fortaleza provou. Os `activity-<slug>`/`free-<slug>` que o comentário cita vivem no `economicGenerator.ts` e no `TripPanel.tsx`, e são ids de **FinOps/lista de reservas** — não entram em `trip.days[].activities[].id`. (O `economicGenerator` não tem nenhum importador hoje.)

Segui a missão: **id exato, nome só como diagnóstico** — o motor nem lê `lived_names`. Se um roteiro antigo ou uma superfície futura gerar id sem catálogo, ele simplesmente não vale troféu, em silêncio. O `lived_names` está no evento e habilitaria um fallback por nome normalizado a qualquer momento; é uma decisão de uma missão, não de uma linha. **Não fiz porque não foi pedido.**

**Segunda observação:** o check-in subiu **sem nenhum teste** (28 arquivos de suíte antes e depois do rebase, `tripCheckin.ts` sem suíte própria). Não estava no escopo, não escrevi.

---

## 5. A escada de níveis ficou curta (registrado, não mexido)

O §3 calibrou os níveis só para a Camada Mundo. Com a Local, uma cidade bem vivida vale até 175 XP extras: uma Fortaleza completa passa de 600 XP e chega perto de Guardião das Rotas na **primeira** viagem. É o que o §4 pede. Recalibrar a escada é outra missão — registrei no desenho.

---

## 6. Testes — 363 → 418 (+55)

`achievementsLocal.test.ts` (48) sobre os ids **reais** de Fortaleza, não inventados:
split da string (`','` e `' | '`, array, lixo) · extração do id (dia de dois dígitos, id cru, `day-3-day-tour`) · **cada molde no limiar** (4 essenciais não fazem Coração, 5 fazem; 2 gastronômicos não fazem Garfo, 3 fazem) · acumular entre 2 viagens · fallback com e sem conclusão · **precedência** (confirmou 3 restaurantes, declarou 1 → sem Garfo) · `Tokyo`/`Rome`/`tóquio` · `Porto` **não** casa `Porto Seguro` · cidade sem tier não gera troféu nenhum · XP por molde · check-in torto não lança · e o retroativo real: viagem concluída + check-in do mercado dos peixes → `carimbo` + `segredo`.

`landmarkTiersArtifact.test.ts` (7): a trava do §2.

Duas suítes existentes tiveram o **fixture** trocado, não a expectativa afrouxada: `livedTrip` usa **Porto** e **Milão** (fora das 21) porque testam idempotência e sino — fixture que destrava demais testa o motor por acidente.

---

## 7. Saída do push

```
$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   1029266..7bb736c  main -> main
```

O `git pull --rebase` conflitou em `src/test/tripEvents.test.ts`: o Lovable tinha consertado o mesmo `tsc` vermelho com `as any`. Resolvi pelo helper tipado. Sem `--amend`, sem `--force`.

---

## 8. Arquivos

**Novos:** `src/data/generated/landmarkTiers.ts` (gerado) · `src/lib/localAchievements.ts` · `src/test/achievementsLocal.test.ts` · `src/test/landmarkTiersArtifact.test.ts`
**Modificados:** `scripts/sync-catalog.ts` · `src/lib/achievements.ts` · `src/lib/achievementEngine.ts` (uma linha: `trip.checkin` em `TRACKED_NAMES`) · `src/components/conquistas/AchievementsPanel.tsx` · 3 suítes · `DESENHO-CONQUISTAS-v2.md`
**Não tocados:** `src/data/*.ts` existentes · `src/types/` · gerador de roteiro · `supabase/functions/` · `tripEvents.ts` · `tripCheckin.ts`
