# RELATORIO M19g-2 — must_see em 13 cidades (FECHADO)

## Estado
- `mustSee.ts` (sync, 23 itens, 13 cidades) commitado como está. Nenhum src/lib, src/components ou outro src/data tocado.
- Fixture: só a chave "Tóquio" regravada. m19g: assert multi-cidade (Paris = Louvre/Orsay; todo must_see essencial manhã/tarde do catálogo, buscado na cidade de cada id; 13 cidades; ≤3 por cidade). `deno.lock` no .gitignore.
- Gates: tsc limpo; vitest 881 passed, 3 skipped, 1 todo, 0 failed; build ok; eslint sem problema em m19g.test.ts.

## Diff de Tóquio (snapshot antigo × saída nova)
"Dia N" = posição em `days`; ids usam `day-(N-1)`.
- Dia 3 (3→5): sai Hakone e Gonpachi; entram Senso-ji (must_see), Yadoroku, Skytree, Kura Sushi.
- Dia 4 (5→3): sai Bills, Senso-ji, Yadoroku, Akihabara, Afuri; entram café no hotel, Kamakura (day-trip), Gonpachi.
- Dia 5: jantar Monjayaki → Afuri.
- Dia 6: Kamakura → Hakone.
- Dia 7: jantar Kura Sushi → Izakaya Yurakucho.
- Dia 8 (5→7): sai Café de l'Ambre e Sushi Dai; entram Bills, Pokémon Center, Maisen, Shinjuku Gyoen.
- Dias 1 e 2 sem mudança. Meiji Jingu segue no Dia 2.
- Orçamento: experiências 1768→2238, comida 4130→3950, total 25098→25388.

## Verificação do diff
- Ícone perdido: não (Hakone e Kamakura só trocaram de dia).
- Dia vazio: não.
- Refeição sumida: não; Dias 4 e 6 com 3 itens é o padrão de day-trip.
- Item repetido: não.
- Itens que saem do roteiro: Akihabara, Monjayaki, Café de l'Ambre, Sushi Dai (consequência do reordenamento).

## Observação
- Não existe `zz-regen` no repo nem no histórico. Usado `src/test/zz-regen.test.ts`
  temporário (não commitado, será removido) gravando em `/tmp/tokyo-new.json`.

## Commits
- 6404c4c data(catalog): must_see em 13 cidades (23 itens)
- 2f7a8f0 test(m19g): must_see multi-cidade + snapshot de Tóquio

## Saída do push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   29073d4..2f7a8f0  main -> main
```
