# RELATORIO-M6 — tiers no gerador, noite só com interesse, compras fora da cultura (C.20)

Commit `68f3681` · Suíte: 64 arquivos, 760 verdes (741 + 19 novos) · tsc limpo · build ok ·
eslint: os 2 `no-explicit-any` de `itineraryEngine.ts:682` já existiam (idênticos sem as mudanças).

## Diagnóstico (STEP1)
- **Noite (b):** `interestNight` usava `matchesTop2`, que casa por *styleTag*. Item `night` com tag
  `family`/`culture`/`gastronomy` (ICON Park, Blue Note, pubs) virava "interesse" de quem nunca pediu vida
  noturna e abria a noite. Os 3 perfis do smoke não têm `nightlife` → R7 falha em 17/21. O `'21:30'` fixo
  só é o encaixe; os 21:55 vêm do `layoutDay`.
- **Compras (c):** `lis-corte-ingles` tem tags `shopping, family, gastronomy`; `gastronomy` passa no
  `interestKey` e `shopping` casa o tema Descobertas/Passeios.
- **Ícones (a):** o motor não lia `landmarkTiers`; o R17 era só relatório.

## Decisões
1. Veto de `shopping` em todo slot EXP sem interesse `shopping`, exceto tier `icon`/`essential`.
2. `icon` força uma vez (ignora `maxHop`) no último dia de exploração se ainda não saiu; `essential` é
   preferência (R17 segue WARN). R7 segue FAIL no validador (não mexi).
3. Meta de essenciais conta `icon ∪ essential` (mesma definição do `essentialsOf`).

## O que mudou
- `itineraryValidator.ts`: `+tiersOf(city)`.
- `itineraryEngine.ts`: `wantsNightlife`/`wantsShopping`; noite só com `wantsNightlife`; veto de compras em
  `eligible`; `shopping` fora de `Descobertas`; `tierPlan` em `pickActivity`; trava pós-layout.
- Tier: restringe o conjunto **depois** da ordenação [salto, interesse, tema, dual, preço], que fica intocada.
  Só entra o que cabe no salto (exceto `force`) e **cabe na janela** (item + almoço + jantar mínimos + saltos).
  Exceção: pôr do sol/lanche na frente da fila continua mandando (é o item das 17:30).
- Trava pós-layout: sem `nightlife`, nada não-logístico começa ≥ 21:00. **Refeições ficam isentas** (tirar o
  jantar quebraria o dia; o R7 original também mirava experiência). Descanso/Caminhada leve isentos, como no R7.
- Ícone cortado pela janela volta ao pool (`releasedIcons`); contadores recontados do roteiro final.
- `src/test/itineraryTiers.test.ts` (19 testes) e fixture `itineraryEngine.before.json` regravado
  (teste temporário `zz-regen`, já deletado).

## Saem / entram (4 cidades do fixture)
- **Cartagena** — saem: Restaurante Espíritu Santo, Caribe Plaza (shopping) · entram: Passeio de barco ao pôr do sol na baía, Di Silvio Trattoria, Convento de la Popa
- **Lisboa** — saem: Conserveira de Lisboa, Jardim Botânico Tropical (Belém), Bate-volta a Cascais + Boca do Inferno, Dear Breakfast, El Corte Inglés Lisboa · entram: LX Factory, Torre de Belém, Jardim da Estrela, Museu Calouste Gulbenkian, Zé da Mouraria, Miradouros: Senhora do Monte e Graça
- **Tóquio** — saem: Kappabashi (rua da cozinha), Ameyoko, Onigiri Asakusa Yadoroku, teamLab Planets, Izakaya em Yurakucho, Parque Ueno e Museu Nacional, Yanaka Ginza, Ginza Six, Kappabashi (utensílios) · entram: Meiji Jingu, Akihabara Electric Town, Templo Senso-ji, Tokyo Skytree, Zauo, Shibuya Crossing, Tonkatsu Maisen, Pokémon Center Mega Tokyo
- **Fortaleza** — saem: Dia de praia no Crocobeach, CEART — Centro de Artesanato · entram: Centro Dragão do Mar, Sorveteria 50 Sabores, Passeio de veleiro ao pôr do sol, Coco Bambu Beira-Mar, Jardim Japonês da Beira-Mar

## Testes existentes: nenhum assert alterado
- `b31.test.ts` "Lisboa gc: Gelados Santini ≥ 17:30" quebrou na 1ª versão (tier antes da ordenação
  escondia o item das 17:30). Corrigido no **código** (1 iteração), assert intacto.
- Único teste que mudou de conteúdo: o fixture `before.json` (esperado). Testes novos: ≥ 1 ícone quando algum
  cabe num dia, sem noite/≥ 21:00 em perfil família, sem compras em slot EXP, noite continua com `nightlife`.

## Ressalvas
- **Orlando:** o único ícone (Magic Kingdom, 10 h) não cabe com almoço e jantar; o R17 aceita a ausência.
  O teste só exige ícone quando existe um de ≤ 6 h.
- Meta de 4 essenciais é preferência: depende de salto e janela; R17 pode seguir WARN em cidade dispersa.
- Veto de compras pode virar "tarde livre" em cidade com muito item `shopping`. **Rodar /smoke** (R7 deve
  zerar; conferir R17/R19) antes do Publish — não rodei o smoke aqui (precisa de rede/banco).
- Sem function tocada: nenhum prompt de redeploy. Trava de dados respeitada (`src/data/`, `hotelZones`,
  `michelinData`, `types/trip.ts` intocados).

## git push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   293e33e..68f3681  main -> main
```
