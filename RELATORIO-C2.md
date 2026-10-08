# RELATORIO-C2 — Cockpit = card + Ativar, cabendo no celular

Commit `8c3eeed` (feat). STEP1-C2.md deletado (nunca commitado).

## Decisões do fundador
- **D1** Card + Ativar em **todo** rascunho (onboarding v2, wizard, KINU AI). O card agora é renderizado dentro do `DraftCockpit`; o único Ativar chama `handleActivate` → `onActivate(trip.id)` → `activateDraft`.
- **D2** "N dias de praia" aparece só se o catálogo marca `styleTags` com 'beach'. Nunca pelo nome da cidade.
- **D3** "tentar encaixar" devolve o item ao fim do dia original (ou ao último dia que ainda existe) e passa pela janela R16 do motor. O que não cabe fica em `unplacedEdits`, e o toast diz "não coube".
- **D4** `RELATORIO-A4.md` estava com 54 linhas apagadas no working tree. Restaurei com `git checkout -- RELATORIO-A4.md` antes de qualquer edição. O commit `d1048f0` está intacto.

## O que mudou (arquivos)
- `DraftCockpit.tsx`: saem a trilha de pílulas e os 3 renders por estágio. Fica um render só: voltar + card com painéis hotel/voo/roteiro (`openRow`), mais as linhas de análise e de itens que não couberam. Escolher um voo fecha o painel (`setOpenRow(null)`).
- `KinuDidCard.tsx`: props `panels`/`openRow`/`onToggleRow`/`extraRows`. Sem `panels`, o comportamento é o de antes.
- `FlightSelectionStage.tsx` e `GeneratedItineraryStage.tsx`: só a prop `embedded`. Sem ela, o JSX é idêntico ao de antes.
- `TripPanel.tsx`: o confirmar vira `Drawer` (`max-h-[85dvh]`, corpo rolável). O Confirmar fica no rodapé do sheet com `env(safe-area-inset-bottom)`. Ficam visíveis Valor pago + Horário da ida/volta; companhia, nº e link ficam em `<details>`. O payload de `onConfirm` não mudou (`retimeConfirmedLegs` e `source 'confirmed'` seguem no Viagens).
- `Viagens.tsx`: rascunho = só `<DraftCockpit>`.
- `onboardingFlow.ts`: `hotelTierZone`. A frase "melhor opção disponível…" saiu do código.
- `timezone.ts`: SAO/RIO/BHZ entram como Brasil. `flightModel.ts`: `formatDurationHM` e `durationTextToMinutes`, usados só na apresentação (lista de voos e capa do PDF).
- `itineraryValidator.ts`: `dayWindowUsage` extraído do R16 (mesma conta) pro "tentar encaixar". Novo `src/lib/cockpitLines.ts` (puro).
- `KinuAIButton.tsx`: `bottom-[calc(6rem+safe-area)]`. O cockpit ganha `pb` com safe-area. O sheet fica em z-[70], acima do botão.

## No celular (5 linhas)
1. O rascunho abre como um card só: cada linha tem porquê e "trocar/ver", e há um só botão Ativar.
2. Hotel, voo e roteiro abrem abaixo da linha. Trocar o voo volta pro card com a linha nova, não pra lista.
3. Confirmar voo sobe de baixo pra cima com 3 campos à vista, e o Confirmar fica sempre alcançável, inclusive com o teclado aberto.
4. A análise é uma linha ("Análise: dentro do teto · …"), e os itens que sobraram têm "tentar encaixar".
5. Voo nacional SAO→FOR conta como doméstico (aeroporto 2h antes) e a duração aparece como "3h25".

## Verificação
- `SMOKE_FULL=1 npx vitest run`: **49 arquivos, 590 passed** (583 + 7 novos), 1 skipped, 1 todo. Rodei a suíte 1 vez.
- Smoke 63, antes (A4) = depois: `R13 55/61 · R14 12/12 · R15 57/63 PASS 6 WARN · R16 63/63 PASS`.
- `npx tsc -p tsconfig.app.json --noEmit`: zero erros. `npm run build`: ok.
- eslint nos arquivos tocados: nenhum problema novo (DraftCockpit 6→5, Viagens 40→39). Os 2 arquivos novos estão limpos.
- Testes novos em `src/test/cockpitCard.test.tsx`:
  - rascunho = card + 1 Ativar + 0 estágio;
  - sheet com os 2 horários + Valor pago + Confirmar, e companhia em Detalhes;
  - hotel sem reasons → `tier Conforto · Chiado`;
  - SAO→FOR com `international` false e transfer às 16:00 para volta às 18:00;
  - `unplacedEdits` vazio não renderiza a linha;
  - "tentar encaixar" fora da janela mantém o item;
  - "3h25".
- Ajustado: `oneActivate (a)` agora checa o fio novo (card dentro do cockpit, mesmo `activateDraft`).

## Fora / limites
- Não testado em browser (a missão vetou). O caso do teclado em 390×660 está garantido pela estrutura (`85dvh` + rodapé `shrink-0` + reposicionamento de input do vaul), sem medição real.
- Item criado à mão que não coube volta só com o nome e 0 h. Ele não tem duração, então sempre cabe no R16.
- Nenhuma edge function tocada → sem prompt de redeploy.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   d1048f0..8c3eeed  main -> main
```

/cost: não dá pra consultar de dentro da sessão. Rodar `/cost` no terminal para anotar.
