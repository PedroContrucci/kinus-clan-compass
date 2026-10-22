# RELATORIO-C11 — Painel enxuto + PDF lê o razão

**Data:** 21–22/out/2026 · **Ferramenta:** Lovable (11 prompts atômicos, zero Claude Code) · **Faixa de commits:** `f9b2108..d68d4ac` (30 commits do Lovable; 1 `Work in progress` é da plataforma — `previewAuthStorage.ts`, arquivo gerado, sem efeito em produção) · **Publicado:** 22/10 ~08:10 · **Provado:** celular, viagem nova, 4/4.

## Origem
Auditoria do zip (21/10, `claude/AUDITORIA-ZIP-21-10.md`): três leitores ainda liam os acumuladores `finances.planned/confirmed` (PDF, Painel, `getHestiaFinOps`), contrariando a decisão do C.5c (tiles = Σ razão). Prova: PDF de 18/10 mostrava Planejado 11.750 contra 11.970 nas linhas — os R$ 220 do transfer, que o razão conta e o acumulador não. Decisão de produto na mesma sessão: **o Painel resume e redireciona; não é um segundo app.**

## O que saiu
- `tripPdfExport.ts`: rodapé `kinu.travel` → `kinu-travel.app`; RESUMO FINANCEIRO e barra lendo `razaoTotals(razaoLines(trip))`, `budget = trip.budget` (mesma função dos tiles).
- `TripPanel.tsx` (1.839 → ~1.280 linhas): "Resumo Financeiro Compacto" + badge de câmbio + aviso de overflow (acumuladores) · "Voos encontrados" + botão "Preços de referência" (lista sem decisão; `amadeus-flights` = Travelpayouts) · Insights do KINU + Atividades por Categoria + Próximos Passos (`getOrchestratedActions`, `AGENTS`, 130 linhas) · KPIs "gasto" e `DualProgressKPI` (acumuladores) · badge "↓ R$ X desde" + `savePriceSnapshot`/`getPriceChangeInfo` (histórico em localStorage) · "Ofertas de Experiências" (link genérico por atividade paga, ignorava `booking_mode` — Crocobeach walk-in recebia "Ver ofertas") · órfãos `insightsOpen`, `handleAction`, `getPendingItems`, `OrchestratedAction`, `Check`.
- `Viagens.tsx`: cards Héstia do `analyzeTrip` acima do Painel (com "Ver Painel →" estando no Painel) · card "🎯 Roteiro curado para você" (já coberto por "Fontes da curadoria") · barra "Exportar Roteiro em PDF" (3º botão de PDF na tela) · badge vermelho da aba Painel (contava insights que não existem mais) · imports `exportTripPDF`, `TRAVEL_INTERESTS`, `analyzeTrip`.

## O que entrou
- `src/components/cockpit/PainelResumo.tsx` (77 linhas): três linhas que **só leem** — 🗺️ Roteiro "N dias · M atividades · K exigem reserva" (`roteiroKind` passeio/restaurante, `requiresBooking`) · 💰 Financeiro "Orçamento · Planejado · Confirmado" (`razaoTotals`) · ✅ Prontidão "X de Y itens fechados" (`prontidao`). Cada uma com "Ver ▸" → `onNavigateTab`. Bloco vazio não aparece (sem dias e sem orçamento → `null`).
- "📈 Voos subiram" → botão "Ver no Financeiro" (antes rolava para `#central-ofertas`, id inexistente).

## Ordem final do Painel
Faixa "Agora no KINU" → PainelResumo → Voo & Hospedagem (colapsável: foto, datas, "N dias", cards Voo/Hotel com confirmar/trocar/buscar) → Compartilhar / Exportar PDF → Mapa · Clima · Fontes da curadoria (colapsados).
Decisão: mapa **não** vai para o topo — é visualização, não decisão; a rota que importa é a do dia, no Roteiro.

## Prova (produção, celular, viagem nova, 22/10)
1. Painel na ordem acima, aba sem badge ✅ 2. "Ver ▸" abre a aba certa; linha Financeiro = tiles (16.263 · 14.142 · 0; Disponível 2.121) ✅ 3. PDF: rodapé `kinu-travel.app`, Planejado 14.142 = tile ✅ 4. Roteiro, Preparação, KINU AI pela Home abrem ✅
Conferências cruzadas: Voo 1.158 + 2.984 = 4.142 (card) · Prontidão 7 = voo + hotel + 5 que exigem reserva · 6 dias = D1–D6.

## Invariantes mantidos
Dados curados intocados (`git diff --stat`: só os 4 arquivos + o gerado). `tsc` zero. 740 testes. Nenhuma conta nova: PainelResumo só agrega funções existentes.

## Pendências abertas por este arco
- Acumuladores ainda **escritos** (`flightFinance`, `hotelSwap`, `tripItineraryOps`, `replanItinerary`); leitor restante `getHestiaFinOps` (agentMessages). Beta final.
- Órfãos: `PriceSnapshot`/`getPriceHistory` (TripPanel), import `AgentInsight` (Viagens), barrels `components/*/index.ts` e ~4–5k linhas que só eles importavam. `chore:` no Code.
- PDF: ~42 strings sem acento (helvetica) → fonte TTF; rótulo total/por pessoa no voo. KPI "N dias" virar texto na linha das datas.
- "Fontes da curadoria" afirma "Conde Nast Traveler, Lonely Planet" — conferir antes da onda 2.
- Lição: o Lovable travou uma vez em "Thinking" (13 min) com um prompt de 4 partes; dividido em 2 passou. Prompts de remoção com ≤3 alvos.
