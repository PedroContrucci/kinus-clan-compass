# RELATORIO-M19G — essencial obrigatório ausente quando o dia natural está fechado

Commits: `13ef431` data(catalog) — mustSee.ts · `85d85d3` feat(engine) — motor, validador, smoke, testes.

## Diagnóstico (Passo 0b)
Na cena Paris 20–27/12 2+2, a reserva da M19c nunca chegou a agir: o pré-passe `_dry` também não escolhia o Louvre, e o reserve map ficava vazio. Ele perdia por ordenação. No 23/12, o `themeKey` ("Passeios" casa com `romantic`) deu a manhã a Montmartre. A partir do 24/12, a cota de 4 essenciais já estava cheia (os de tarde contam), e o 26/12 caiu no tema "Gastronomia".

## O que mudou
- **Dado:** `sync-catalog.ts` lê `must_see` e emite `src/data/generated/mustSee.ts` (Louvre e Orsay); outra categoria aborta o sync. Helper `isMustSee` em `src/lib/mustSee.ts`. O restante do catálogo não mudou (o sync relatou "sem mudança" nos outros gerados).
- **B1:** no tierPlan, entre os essenciais, o must_see vem primeiro, por rating. O ícone pendente continua na frente.
- **B2:** must_see ainda fora do roteiro tem `force` próprio no último dia de exploração em que abre. Fica fora da cota de 4 essenciais e não fura o `force` do ícone.
- **Guardas** (achadas na aplicação, não estavam no STEP1). B1 e B2 só agem com **≥ 4 dias de exploração** (o mesmo piso do R17 OBRIGATÓRIO), **fora do `_dry`** e **fora de item reservado**. Sem elas, o Orsay tomava a manhã de Versalhes em Paris 10–15/12 (teste da M19c), e o `_dry` alterava o mapa da reserva. Com elas, a reserva da M19c segue intocada (D2).
- **R17 OBRIGATÓRIO** (`validateMustSee`, `r17must` no smoke): FAIL quando um must_see abre (dia da semana **e** closedIds) em estadia com ≥ 4 dias de exploração e está ausente, com os dias em que abriria. WARN quando dois só abrem na mesma manhã. PASS com nota quando fecha a estadia toda.
- **R17 ESSENCIAIS:** dia fechado por `closedIds` também não conta mais como "cabia".

## Antes/depois — manhãs
| Cena | 23/12 | 24/12 | 26/12 | R17 OBRIG. |
|---|---|---|---|---|
| Natal 2+2, antes | Montmartre | Versalhes | Mouffetard | (Louvre e Orsay ausentes) |
| Natal 2+2, agora | **Louvre** | Versalhes | **Orsay** | PASS 2/2 |
| Natal gastrô 2 ad., agora | **Louvre** | Versalhes | **Orsay** | PASS 2/2 |
O R19 do Natal 2+2 passou de PASS a WARN: Louvre 09:10–13:10 e almoço às 13:20, salto de ~15 min. É o mesmo WARN que o gastrô já tinha antes.

## Assert alterado (autorizado pelo fundador)
`src/test/m18b.test.ts:94`, Paris 24/12–02/01.
- **Antigo:** Louvre exatamente em `2026-12-31`.
- **Novo:** Louvre presente uma vez, nunca em 01/01, nunca numa terça, nunca num dia de closedIds. Hoje sai em 26/12.
- **Motivo:** o 31/12 era acidente da ordenação daquela época. O que a M18b garante é "não no dia fechado", não "no último dia". O B1 adianta o Louvre pelo mesmo mecanismo que o põe em 23/12 no Natal.

## Cenários e testes
- Smoke: novo **"Paris Natal gastrô 20–27/12 2 adultos"**. O nome pedido ("Paris gastrô Natal…") casava com o filtro `/^Paris (gastrô|família)/` de `m6c.test.ts:92` e quebrava o assert de lá.
- `src/test/m19g.test.ts` (13 testes): o gerado; os 2 cenários de Natal (R17 OBRIG. ≠ FAIL, ÍCONE/R18/R23 PASS); Louvre em 23/24/26 e **Versalhes em 24/12** no 2+2; os sintéticos de Lisboa (B1 contra o tema, B2 no último dia, `force` do ícone vencendo); validador (FAIL, PASS, nota, WARN, SKIP, closedIds).
- Fixture `itineraryEngine.before.json`: **byte a byte igual**.
- vitest **881 passam** (82 arquivos, 3 skipped, 1 todo). tsc limpo. Build ok. eslint: os 2 `no-explicit-any` já existentes (`itineraryEngine.ts:722`), nenhum novo.
- O `pull` antes do commit trouxe um update do Lovable (`previewAuthStorage.ts`), que não toca nada desta missão.

## Riscos abertos
- No Natal 2+2, a Sainte-Chapelle, Notre-Dame e Montmartre seguem fora (R17 ESSENCIAIS WARN). Não são must_see.
- O piso de 4 dias usa `explorationTotal` do motor. O validador conta os dias pelo título; os dois podem divergir em dia de recuperação.

## SQL — candidatos a must_see (rodar no kinu-beta)
O nome da coluna de contagem de reviews não está no sync. Confirmar antes:
```sql
select column_name from information_schema.columns
where table_name = 'curated_activities' and column_name ilike '%review%';
```
```sql
select city, id, name, category, google_rating, google_reviews, must_see
from curated_activities
where status = 'published' and landmark_tier = 'essential'
  and category in ('morning','afternoon') and google_reviews >= 50000
order by city, google_reviews desc;
```

Nenhuma edge function tocada: sem prompt de redeploy.

## Saída do push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   6a87cec..85d85d3  main -> main
```
