# RELATÓRIO C.2.2 — cosméticos do cockpit e do item de voo

Commit `cf73b18` (feat). Só apresentação: motor e objeto gravado intocados (`itineraryEngine.ts` não tocado).

## O que mudou
1. **Hotel** (`onboardingFlow.ts`): `hotelTierZone` recebe o nome; se ele já contém a zona
   (sem acento/caixa), a zona sai → "Hotel Gran Marquise — Meireles, Fortaleza: tier Conforto".
2. **Painel de voo embutido** (`FlightSelectionStage.tsx`): com `embedded`, sem "Defina seus voos…" e sem
   "Resumo dos voos selecionados". Sem `embedded` (SmokeTest), idêntico.
3–5. **Item de voo** (`GeneratedItineraryStage.tsx`): a perna é achada pelo id (`-slot-flight-out` /
   `-slot-flight-back`) e tudo vem das props `outboundFlight`/`returnFlight` (o voo da viagem):
   - rota: `flightRouteLabel` → "São Paulo → Fortaleza · 1 conexão" (`airportCity`, código cru se não
     mapeado; "N conexões"); "(2 pax)" sai (a linha de preço já mostra);
   - 💡: `flightWhyLine` → "com escala · chega 23:35 · R$ 718/pessoa" (+ razões quando `chosenBy 'kinu'`;
     "duração a confirmar" quando a duração é estimada). Voo sem `chosenBy`: 💡 como antes;
   - selo: `confirmed` → "✓ Confirmado" (verde) · `kinu` → "Sugestão do KINU" (âmbar) ·
     `user` → "Escolhido por você" (primária). Sem origem: selo de status de antes.
6. **explainPick** (`flightRanking.ts`): ressalva de média só se o preço estiver acima (> PRICE_TIE_PCT).
7. **Aba Feedback** (`FeedbackButton.tsx`): `top-1/2 -translate-y-1/2` → `bottom-[calc(10rem+env(safe-area-inset-bottom))]`.
   **Não verificado visualmente** (sem browser nesta missão): conferir no celular depois do Publish. Se
   cobrir o Ativar, volta no C.3.

## Testes
- Nenhum teste existente fixava os textos antigos (as asserções "acima da média" continuam valendo).
- Novos: hotel com zona no nome (`cockpitCard.test.tsx`); abaixo da média sem ressalva, rota legível
  e porquê sem sujeito (`flightRanking.test.tsx`).
- `SMOKE_FULL=1 npx vitest run` (1 rodada): **49 arquivos, 599 passed**, 1 skipped, 1 todo.
- Smoke = C.2.1: `R13 55/61 PASS · 6 WARN | R14 12/12 | R15 57/63 PASS · 6 WARN | R16 63/63 PASS`.
- tsc zero · build ok · eslint nos arquivos tocados: 8 problemas antes e depois (nenhum novo).

## Deploy
Só front (nenhuma edge function tocada): Publish pelo botão do Lovable.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   eee2a34..cf73b18  main -> main
```
