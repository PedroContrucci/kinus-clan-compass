# RELATORIO M6b — roteiro denso parte 2 (C.20) — FECHADO

**Estado:** commit `0952776` (feat) na main. Base: `d15be7d`.
Arquivos: `itineraryEngine.ts`, `itineraryValidator.ts`, `smokeMatrix.ts`, `test/itineraryEngine.test.ts`, `test/c43.test.ts`, `test/fixtures/itineraryEngine.before.json`. Nada em `src/data/`, `hotelZones`, `michelinData`, `types/trip.ts`. `STEP1-M6B.md` deletado.

## Implementado
- (i) Item ≥ 4 h: a tarde ganha 1 EXP curto (≤ 2,5 h), perto, terminando até 18:30 (17:00 na véspera leve). Sem candidato → `meta.thinDays` com `longo-sem-tarde-curta`.
- (ii) `pickNearHotelDinner`: ≤ 1 km → ≤ 2 km → o mais próximo. Dica "Perto do hotel", ou "a X,X km do hotel" acima de 2 km (nas 3 chegadas e na véspera).
- (iii) Véspera leve = `earlyExit` (check-out < 06:00, o que já cobre voo < 09:00): sem bate-volta, sem noite, sem pôr do sol, passeio termina ≤ 17:00 (trava pós-layout), Michelin não cai nela (`michelin-fora-da-vespera`).
- (iv) Cota ⌊dias de exploração/3⌋ + espaçamento; nada em D+1 com jet lag ALTO/SEVERO.
- `meta.thinDays` (`manha-sem-candidato`, `tarde-sem-candidato`, `janela-14h`, `layout-nao-coube`, `vespera-apos-17h`) e `meta.lightEve`.
- Validador: R20 DIA DENSO (WARN) e R21 VÉSPERA (FAIL: bate-volta/passeio > 17:00 na véspera cedo; WARN: jantar de chegada > 2 km, só com `ctx.hotelCoord`). O smoke não passa `hotelCoord`, então esse WARN não roda lá.

## Fixture (zz-regen temporário, removido)
- Cartagena: Cerro de la Popa D8→D5; Convento de la Popa entra no D8 15:00. Experiências 1882→1962.
- Lisboa: Fado e Solar dos Presuntos trocam de dia entre si. Valores iguais.
- Tóquio: Tsunahachi e Gonpachi trocam de dia entre si. Valores iguais.
- Fortaleza: entra Caravaggio (D1), sai Santa Grelha (D7); trocam de dia Catedral D7→D5, Jardim Japonês D8→D7, Pipo D1→D4, Pulcinella D4→D6, L'Ô D6→D7, veleiro D8→D7. Comida 3150→3090. `thinDays`: D6 `layout-nao-coube`.

## Testes alterados
1. `itineraryEngine.test.ts` Crocobeach — antes: `afternoon` = []; agora: ≤ 1 item de tarde, ≤ 150 min, começa após o fim + 5 min, termina ≤ 18:30. Motivo: decisão 6 (intencional).
2. `itineraryEngine.test.ts` Paris D2 — antes: busca `Septime`; agora: o item de jantar; mesmas asserções (19:30, dica de descanso, último item). Motivo: jantar de chegada = o mais próximo do hotel (Chez Janou).
3. `c43.test.ts` Fortaleza D11 — antes: `days[10]` com `for-aguas-belas`, café anterior, ≥ 10:00 e `logisticsLine` = "~1h de carro". Agora: **≥ 2 bate-voltas em 11 noites** (novo) e, em cada bate-volta (qualquer id `daytrip` de Fortaleza): café no hotel antes, ≥ 10:00, `logisticsLine` terminando em "de carro". Motivo: a cota e a véspera mudaram quais bate-voltas entram (Águas Belas perdeu a ordenação para Morro Branco/Lagoinha). O "~1h" exato foi afrouxado para "de carro", porque a duração da estrada varia por destino.
4. Novos (5) em `itineraryEngine.test.ts`: jantar de chegada, véspera leve (8 cidades, volta 06:00), cota de bate-volta (3 severidades), ≥ 2 EXP ou motivo no meta, R20/R21 unitário.

## Verificação
- `tsc` limpo · `npm run build` ok · eslint: só os 2 `any` antigos de `itineraryEngine.ts:698` · vitest: 67 arquivos, 785 passam, 3 skipped, 1 todo.
- Iterações vermelhas: (1) fixture + Crocobeach + Septime (esperadas); (2) c43; (3) ajuste liberado do c43 → verde.

## Decisões fechadas
- Véspera leve = `earlyExit` (cobre voo até ~10:15 internacional / ~09:15 doméstico, mais amplo que "< 09:00").
- Michelin na véspera: omitido e registrado (`michelin-fora-da-vespera`); só vai para outro dia se já houver dia gastronômico antes.
- R21 no smoke: `smokeMatrix` passa `hotelCoord` via `stayHotelCoord(days, city)` (2 linhas; sem `meta.hotelCoord`). O WARN de distância roda nas cidades em que o hotel casa por nome.
- Limite: Fortaleza 11 noites escolhe 2 bate-voltas de 3 possíveis (a cota é só teto); causa exata do 3º dia não rastreada.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   d15be7d..0952776  main -> main
```
