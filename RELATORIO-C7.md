# RELATORIO-C7 — Uma aba só: Início = suas viagens + planejar nova

**Commit:** `87d9047` feat. Suíte 61 arquivos / 712 verdes (2 rodadas), tsc zero, build ok, eslint 64 → 63 nos arquivos tocados (nada novo). Smoke não foi tocado. Motor, edge functions e intocáveis sem alteração. **Sem function tocada → sem prompt de redeploy.**

## Aba Início (`src/pages/Inicio.tsx`, helpers em `src/lib/inicioTrips.ts`)
- Topo: "Olá, {nome}!" + uma linha de estado ("1 viagem ativa · 1 rascunho" / "Nenhuma viagem ainda").
- Linhas de 44 px: `emoji · destino · dd/MM–dd/MM · status · Planejado R$ · abrir/continuar/ver ▸ · …`. O "…" abre "🗑 excluir → sim/não", uma linha aberta por vez. Planejado = `razaoTotals(razaoLines(trip)).planned` em todas (D1). Ordem: ativas pela data mais próxima, rascunhos, concluídas (D2) e `ViagensVividas` abaixo.
- "➕ Planejar nova viagem ▸" abre o `FirstTripFlow` com "← Minhas viagens". Sem viagem, a aba é o próprio fluxo.
- Fluxo curto (B.1b): prioridades = chips de `interestsFor(city)` → `travelInterests`. O teto opcional entra como `budgetAmount` com `budgetSource: 'user'` (D3-b: bastou ligar o fio, o `followPlanEnvelope` já respeita `'user'`).
- `/inicio?trip=<id>` abre a tela da viagem (rascunho = DraftCockpit, ativa = 4 abas). **Bug corrigido:** a Viagens ignorava `?trip=`, então o onboarding, o wizard e o chat caíam na lista em vez de abrir a viagem.

## Navegação
BottomNav e TopNav: Início · Clã · Perfil, com safe-area. `/dashboard`, `/viagens`, `/planejar` → `RedirectInicio`, que preserva query e state: `?guia=1` da Conta, `openWizardFor` do Clã, `?trip=`. Clã e Perfil intocados. FAB intocado.

## Mapa final
| Origem | MORRE | MIGRA → Início | FICA |
|---|---|---|---|
| Home (`Dashboard.tsx`, **deletado**) | LogOut do header, "Não sabe para onde ir?" (o FAB cobre), AgentCards, CountdownCard, TripCardWithPhoto, stats inventados das concluídas | saudação, CTA → linha ➕, rascunhos/ativas/concluídas → linhas, `?debug=true` (ApiStatus) | FirstTripFlow para 0 viagens / `?guia=1` |
| Viagens (`Viagens.tsx`) | lista em cards, sidebar desktop (coluna única agora), **"Modo Teste · Reiniciar Jornada"** | CheckinBanner compacto (acima da linha ativa), ViagensVividas, excluir (✕ + `window.confirm` → "…" 🗑 sim/não) | DraftCockpit, 4 abas, modais |
| Planejar (`Planejar.tsx`, **deletado**) | hub de 4 cards, mapa-múndi, lista região/país/cidade, modo quiz | `openWizardFor` → FirstTripFlow com `initialCity`; `wizardPrefill` do KINU AI → NewPlanningWizard por cima do Início | — |

## Pendências do C.5e/C.6
- **0a:** `RoteiroRascunho` usa `EnhancedDayTimeline` + um `RoteiroDia` por vez, os mesmos componentes da viagem ativa. Trocar de dia fecha a rota e o painel de troca.
- **0b:** `KinuQuickActions` mostra o chip por viagem + "Pergunta geral" sempre que não há `chosenTripId`, com ou sem mensagens. Depois da escolha os chips somem (D4); para trocar de viagem, o 🗑 do chat zera a escolha. `accountTrips` recarrega a cada envio.

## Testes
`src/test/inicio.test.tsx` (12): 0 viagens → fluxo · 1 ativa + 1 rascunho → 2 linhas na ordem, Planejado = razaoTotals · continuar/abrir → viagem pelo id · seleção por tripId e DraftCockpit no rascunho (fonte) · 🗑 exclui · redirects com query/state · BottomNav = 3 · 0b (com mensagens, após escolha, reload) · teto D3. `roteiroRascunho.test.tsx` adaptado à tira + teste 0a.

## Registrar
- **Guia do testador muda:** "Reiniciar Jornada" saiu. `clearTrips` continua no store; a exclusão agora é por linha.
- Os botões "trocar" de origem/orçamento no "O que o KINU fez" levam ao Início (antes ao hub da Planejar). Nenhum dos dois abre um editor; fica para depois.

## Órfãos no disco (pendência de limpeza)
Ficaram órfãos agora: `components/dashboard/AgentCards`, `CountdownCard`, `TripCardWithPhoto`. Já eram órfãos antes, pelo grep: `ActiveTripKPIs`, `AuctionSavings`, `ChecklistProgress`, `CompletedTripStats`, `DashboardWeather`, `NewPlanningButton`, `PaymentStatus`, `TripCard`, `TripCockpit`, `pages/NewPlanejar.tsx` e `DashboardKinuTip` (só teste). `ActiveTripCard` e o modo quiz eram internos às páginas deletadas e saíram junto. **`DestinationWorldMap` NÃO é órfão:** o passo 1 do wizard ainda o usa.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   c17a0b6..87d9047  main -> main
```
