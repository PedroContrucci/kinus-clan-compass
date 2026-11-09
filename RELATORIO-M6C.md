# RELATORIO-M6C — refeições por qualidade/proximidade; almoço do bate-volta (M6c+)

Commit `9f219c1` (feat). Decisões aplicadas: D1 faixa de 4 km antes da qualidade · D2 almoço do bate-volta como dica na âncora · D3 qualidade = Michelin do catálogo → `rating`, sem styleTags.

## O que mudou (src/lib/itineraryEngine.ts, só motor)
- `pickActivity` ganhou `meal { band, ref, alt, chain }`. Ordem das refeições de exploração: reservado → `michelinOverCap` → salto da cidade (R15, 8/20 km) → **dia raro (R18)** → faixa → [gastronomia: Michelin do catálogo → rating → km] → interesse → tema → preço.
- Com gastronomia: faixa 4 km da parada anterior. Sem: almoço ≤ 1,5 km do passeio da manhã; jantar ≤ 2 km da parada anterior **ou do hotel**. Fora da faixa cai no mais próximo.
- Dicas: gastronomia, > 1,5 km → `~N min de deslocamento (…) — escolhido pela qualidade`; sem gastronomia, fora da faixa → `A N,N km … — nenhum restaurante mais perto disponível`.
- Bate-volta sem par `-almoco`: dica na âncora `Almoço no local: <nome>` (lunch inédito no bairro da âncora) ou `Almoço no local — a confirmar`. Nenhum item e nenhum custo somado ao dia (nome só informativo).
- Não tocados: M6b (chegada ≤ 1 km, véspera, ícone longo via `pickNearHotelDinner`), café, chegada/partida, jantar do bate-volta, Michelin injetado.
- `PlanRulesMatrix.tsx` (embutido em /smoke): `SMOKE_SCENARIOS` viram linhas iguais às 63 (+5 linhas líquidas). `smokeMatrix.ts`: 2 cenários Paris.

## Duas correções que o desenho original não previa (achadas pelos testes existentes)
1. **c43 (Caranguejada, "só quinta")** quebrou: a faixa de 2 km passava na frente do item de dia raro. Resolvido pondo `weekdayKey` antes da faixa nas refeições.
2. **Pôr do sol (R15)**: a tarde de 15:00 re-escolhida após um pôr do sol agora leva a coordenada dele como 2ª ponta (`alsoNear`). Resolveu um buraco antigo (hop tarde→17:30 > limite) que a mudança de estado expôs.

## R15 no smoke (matriz 28 cidades × 3 + cenários, 10/11/2026)
- **Antes 18 WARN / 85 linhas → depois 15 WARN / 87.** Nenhum WARN novo. Resolvidos: Rio gastro-cultura, Orlando gastro-cultura, Cartagena cultura-aventura. Os dois cenários Paris: PASS.
- Rio cultura-aventura chegou a virar WARN (8,4 km) numa versão intermediária; com a ordem final voltou a PASS.
- Atenção: cidades com poucos almoços (Rio: 11) esgotam os próximos ao passeio e o fim da semana pode cair no "mais próximo" — o risco continua, medido hoje em zero.

## Fixture (itineraryEngine.before.json), diff por cidade
- **Cartagena** (comida 4140→3940): refeições dias 2,3,4,6,7,8; nada mais.
- **Lisboa** (5370→5360): refeições dias 2,3,4,5,6,8; nada mais.
- **Tóquio** (4280→4130): refeições dias 2–8. **Exceção à regra "só refeições":** no dia da volta o almoço mudou (Tempura Kondo → Sushi Dai) e o item da tarde `tok3-pokemon` deixou de caber no empacotamento. Consequência da refeição, não regra nova.
- **Fortaleza** (2970→3290): refeições dias 2,3,5,7,8; nada mais.
- Nenhum assert existente alterado; só comentário de adendo no `itineraryEngine.test.ts`. Nenhum teste quebrou por nome de refeição fora do snapshot (c43/m19dFix quebraram no 1º rascunho, corrigidos no motor — não regravados).

## Cenários de smoke (SMOKE_SCENARIOS)
- `Paris gastrô 2 adultos 10–15/12`: refeições pela qualidade a ≤ 4 km, "~N min" quando > 1,5 km; R15 PASS.
- `Paris família sem gastronomia 2+2 10–15/12`: almoço/jantar dentro das faixas ou com a distância na dica; R15 PASS.
- `src/test/m6c.test.ts` (5 testes): dica "~N min"; faixas/distância sem gastronomia; salto de refeição ≤ limite da cidade; bate-volta (Paris, Fortaleza) sempre com a dica de almoço e sem custo de almoço; os 2 cenários.

## Verificação
`vitest` 80 arquivos, **857 passed** (852 antes + 5) · `tsc -p tsconfig.app.json` limpo · `npm run build` ok · eslint: 2 erros `any` em itineraryEngine.ts:717 já existiam (mesma contagem sem a mudança).

## Riscos / pendências
- Michelin do catálogo agora vence a qualidade dentro dos 4 km em **todo** perfil com gastronomia (Conforto/Luxo, sem criança); o teto de preço (M7) e a trava de criança (M20) continuam por cima.
- Bate-volta: se aparecer um lunch no bairro da âncora, o nome é marcado como usado mas sem item/custo — a decisão D2 pode pedir linha própria depois.
- Edge functions: nenhuma tocada, sem prompt de redeploy. Publish é do fundador.
- `/cost` da sessão: é comando local, não consigo executá-lo daqui — rode `/cost` no prompt.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   d556d43..9f219c1  main -> main
```
