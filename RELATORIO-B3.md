# RELATÓRIO B.3 — Motor por interesse, tempo e dia

Commit `239c7db` (feat). Arquivos: `src/lib/itineraryEngine.ts`, `src/lib/itineraryValidator.ts` (só o autorizado em D1),
`src/test/itineraryEngine.test.ts`, `src/test/fixtures/itineraryEngine.before.json`. Nenhuma edge function → sem redeploy.

## Smoke (`SMOKE_FULL=1 npx vitest run src/test/planRules.test.ts`, FROM 10/11/2026)
```
ANTES:  SMOKE SUMMARY: R13 43/61 PASS · 18 WARN · 2 SKIP | R14 12/12 PASS · 0 WARN · 51 SKIP | R15 16/63 PASS · 47 WARN · 0 SKIP | R16 32/63 PASS · 31 WARN · 0 SKIP
DEPOIS: SMOKE SUMMARY: R13 54/61 PASS · 7 WARN · 2 SKIP | R14 12/12 PASS · 0 WARN · 51 SKIP | R15 57/63 PASS · 6 WARN · 0 SKIP | R16 63/63 PASS · 0 WARN · 0 SKIP
```
Aceite: R15 ≥ 50 ✅ · R16 ≥ 58 ✅ · R14 sem regressão ✅ · **R13 ≥ 55 ❌ (54/61, falta 1)**.

## O que entrou
- **Pick:** dentro de `maxHopKmFor` da parada anterior > top-2 interesses (`interestsFor` ∩ viagem, via `matchesPriority`)
  > tema > casa de papel único > preço do tier. Âncora da manhã prefere quem tem almoço inédito a ≤ salto. A tarde é
  escolhida antes do almoço (perto da manhã) e o almoço fica perto das duas. Sem interesse válido, sai o mesmo que sem
  interesse (teste novo).
- **Cota:** interesse sempre na frente do tema enquanto houver um dentro do salto. Testei limiar 0,6/0,75/1: o R13
  não mudou (53–54) e o R15 é melhor com 1. A noite também abre quando há item noturno inédito do interesse que cabe.
- **Tempo:** a janela segue o R16 (Σh + 0,5 h/salto). Exploração 14 h, chegada 22 h − pouso, último dia via
  `lastDayWindowHours` (doméstico = região Brasil). Quando estoura, sai o item de menor afinidade: sintético < fora
  do tema < tema < interesse, e no empate o mais longo. Nunca sai refeição, Michelin nem bate-volta. O jantar do dia
  de chegada prefere um que caiba na janela (Dubai pousa 20:00).
- **Bate-volta:** é âncora só em dia de exploração elegível, nunca colado no anterior nem no dia do Michelin pendente,
  e só se cabe na janela (D3). O dia fica café no hotel → bate-volta 09:00 → par `-almoco`/`-jantar` → jantar a ≤ 5 km
  do hotel (D1 = B). Par = mesmo prefixo, reservado ao bate-volta.
- **Hotel:** `engineHotelCoord` usa `resolveHotelCoord` por nome. Sem casamento, a mediana das coords do catálogo,
  com comentário no código.
- **Validador:** em dia de bate-volta, refeições ficam fora do stray e dos saltos (3 linhas, nada mais).
- **Não-repetição:** a repetição forçada respeita o "menos usado primeiro" antes da geografia. A casa de dois papéis
  (Cabaña del Primo) vai por último, porque a ordem geográfica a escalava como jantar e forçava repetir almoço
  (`generatorNoRepeat` pegou isso, e corrigi).

## R13 — por que 54 e não 55 (WARNs restantes = estoque/dado, não motor)
Roma, Buenos Aires (família), Gramado (cultura+aventura) e Singapura já usam **todos** os itens de interesse
que têm (5, 5, 5, 3). Orlando tem 4 (1 deles é o Kennedy, bate-volta). Lisboa (família) só passaria com
Sintra/Cascais, que são "Bate-volta…" **sem tag `daytrip`**, isolados a 25 km. A única saída no motor seria
deixar slots vazios em vez de "preencher o resto por tema". Não fiz isso. Precisa de catálogo ou tag.

## R15 — WARNs restantes (6)
Gramado ×3 = Mamma Gema a 70 km (dado em arbitragem; não contornei). Orlando 24,8 km, Cartagena/Aviário 24,8 km
(último morning inédito, isolado), Tóquio 10,3 km (noite em Shibuya). Porto Seguro e Cidade do Cabo passaram.

## Snapshot (`itineraryEngine.before.json`) — só dias que mudaram de propósito (+464/−592)
Dias idênticos ficaram no formato antigo, byte a byte. Michelin igual (Lisboa 1, Tóquio 1). Mudanças:
- **Tóquio:** Kamakura e Hakone estavam em dias seguidos (d3/d4) e com mais 3 itens. Agora ficam em d4 e d6, cada
  um com café no hotel + jantar. Dias comuns reagrupados por bairro.
- **Cartagena:** Rosário no d4 virou dia só dele (saíram Popa, veleiro e almoço). O último dia ganhou passeio e
  deixou de repetir La Cocina de Pepina. O Aviário (isolado) saiu.
- **Lisboa:** Sintra/Cascais saíram (sem almoço a ≤ 8 km). Entraram Castelo, Gulbenkian, Pavilhão e Jerónimos.
- **Fortaleza:** Águas Belas virou bate-volta (d4: café no hotel + jantar). Taíba foi para o d6. Cabaña del Primo
  saiu do almoço.

## Provas
`npx vitest run` → 45 arquivos, 523 passed · 2 skipped · 1 todo. `tsc` limpo. `npm run build` ok.
ESLint nos tocados: 4 → 2 (os 2 restantes são `as any` antigos dos segmentos de voo).
Suíte completa rodada 2× (a 1ª pegou a regressão de não-repetição). Testes novos (6): janela, bate-volta
(dias/forma), par + jantar ≤ 5 km (Caraíva), cota ≥ 50 %, interesse inválido = nenhum, Michelin preservado.
`/cost`: é comando do CLI e não consigo chamá-lo pelas ferramentas. Fica para o fundador colar.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   7cc33a0..239c7db  main -> main
```
