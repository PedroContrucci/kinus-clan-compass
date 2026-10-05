# RELATÓRIO — Bloco 0 · Um roteiro só (o rascunho é a verdade)

**Período:** 01–02/out/2026 · **Executor:** Lovable (STEP1 → APLICAR, um por vez) · **Base:** `4fe6e45` → `a468bfd`
**Contexto:** dívida de agosto ("unificar os 3 geradores") nunca paga. Veio à tona no onboarding v2: card dizia "0 atividades", card e Resumo somavam roteiros diferentes, card e cockpit mostravam hotéis diferentes.

## O que foi feito
| Passo | Entrega | Prova |
|---|---|---|
| 0.1 | ids `day-N-<catalogId>` no gerador; não-catálogo `day-N-slot-<slug>`; colisão `slot-dup-<k>` + warn | card "6 dias com 31 atividades"; conquistas/check-in voltam a casar |
| 0.2 | diagnóstico de paridade gen 1 (`generateDays`) × gen 2 (`generateItinerary`) | tabela: gen 2 mais rico (chegada real, volta encurta, preço por tier, pôr do sol, Michelin 1/viagem) |
| 0.3 | motor extraído: `src/lib/itineraryEngine.ts` puro (sem React), `SelectedFlight`/`FlightOption` movidos, `RECOVERY_BY_SEVERITY`, `hotel?` input | fixture "antes" gravada (`src/test/fixtures/itineraryEngine.before.json`); igualdade exata após extração, 4 cidades |
| 0.4 | `buildDraftTrip` chama o motor; `generateDays` deletado; `flightModel.ts` (estimativa como `SelectedFlight`, source `estimate`); tela renderiza `trip.days` (`timeSlot`/`kind`/`location` preservados em `normalizeTripDays`); "Regerar roteiro" explícito com confirmação se houver trocas; baldes lidos de `trip.finances` em todo lugar | card = Resumo centavo a centavo (15.690 / 7.000 / 4.000 / 3.280 / 1.410); check-in "Casa Lola Luxury Collection • Getsemaní" |
| 0.5 | `src/lib/activateDraft.ts`: um Ativar (card e cockpit); `generateBasicDays` deletado; edições gravam em `trip.days` a cada toque; recusa sem roteiro / sem voo; placeholder de voo removido | troca → reload → Ativar: troca persiste; evento 1×; lint caiu (Viagens 42→40, DraftCockpit 12→6, Stage 6→3) |

Também no período (pré-requisitos): onboarding v2 (`4fe6e45`), regex "7.5h"→450 min, estimativa de voo vale como selecionada + card honesto, orçamento = custo real + 15% com fonte única (`d223dc3`).

## Estado
vitest **494/494** · tsc zero · build ok · nenhum arquivo intocável tocado · STEP1s deletados antes do commit.

## Regra que nasceu
**Uma fonte de verdade por dado.** O rascunho é a verdade; telas leem, nunca calculam. Quando duas telas discordarem, o defeito é a segunda fonte.

## Dívidas registradas (não bloqueiam)
- Dica do check-in ainda mostra diária estimada (R$ 800), não a do curado
- Rascunhos salvos antes de 02/10 perderam `timeSlot`/`location`; só "Regerar" recupera
- Michelin → `day-N-michelin-<slug>` (feito no motor); conquista "garfo" precisa ler esse prefixo
- "trocar" atividade sorteia — deve abrir alternativas (C.3)
- ALTO e MODERADO recebem recovery day igual (`RECOVERY_BY_SEVERITY`) — calibrar na matriz A.1
- Preço do voo ainda genérico por tier (A.5)
- Pergunta aberta: o roteiro deve aparecer no rascunho ou só na viagem ativa? Decidir após C.2

## Próximo
A.1 matriz de voo/fuso (Claude) · A.5 preço por rota (Lovable) · B.1 `interestsFor` (Lovable) · D.2 workspaces antes de qualquer Code.
