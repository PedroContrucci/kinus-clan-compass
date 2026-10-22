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

## Adendo 22/10 08:45 — C.11.1 (publicado)
Três prompts, três arquivos, `dd4a84b..27dbf69`: `WeatherBadge.tsx` — fora o fallback sazonal hardcoded (Paris/Tóquio/Dubai, mês em inglês); sem previsão viva, mostra "Previsão disponível a partir de 7 dias antes da viagem" em vez de caixa vazia · `TripPanel.tsx` (CurationSources) e `WizardStep4Summary.tsx` — fora a linha "Base curada KINU: Conde Nast Traveler, Lonely Planet…" (afirmação sem origem; o catálogo vem de Google Places + Michelin + curadoria própria). Decisão: nenhum texto no lugar; fonte citável (Wikivoyage, CC BY-SA) entra na esteira só pós-onda. Clima com média histórica (Open-Meteo ERA5, rotulada) = primeiro item do beta final, não antes da onda (toca edge function). Guia do Testador v4 entregue (Doc + PDF). Texto a corrigir (Rachel): "Hotels 4★" em Fontes da curadoria.

## Adendo 22/10 09:50 — C.11.2 (publicado): origem
`a2d0e97..13650e3`, 4 arquivos, 740 testes. **Bug real corrigido em `createTrip.ts`:** `getFlightDuration` usava `São Paulo-${destino}` para qualquer origem (Fortaleza → Lisboa herdava 9h de GRU; Fortaleza → Rio herdava 1h). Agora: linha exata › tabela SP só para SP/Campinas › outra origem: doméstico 3h estimado, internacional proxy SP estimado › faixa por fuso; `durationKnown = fromTable` (estimativa mostra "duração a confirmar" até oferta real). `FirstTripFlow.tsx`: campo "Saindo de" antes de Datas (`WIZARD_ORIGINS`, default do perfil, escolha → `originSource:'user'`). `timezone.ts`: 13 origens com fuso (SP, Campinas, BH, Brasília, Curitiba, POA, Rio, Fortaleza, Recife, Salvador, Natal, Florianópolis, Manaus); 8 sem fuso no gerador ficaram fora (Maceió, João Pessoa, Goiânia, Vitória, Belém, São Luís, Cuiabá, Campo Grande) → fonte do gerador + sync, pós-onda. Prova: Fortaleza → Lisboa sem "(assumido)", busca FOR → LIS. Pendente: KINU AI ainda assume SP (prompt da function). Dashboard da onda: schema `onda` no kinu-beta (`convidados` + view `painel`); dia 1 = 5 contas, 2 ativas, 0 confirmações; `kinu_sessions` nunca é escrita pelo front (uso do agente só por log).

## Adendo 22/10 14:10 — C.11.3 (publicado): /onda
`a0e1938..43e7801`. Rota privada `/onda` (`src/pages/Onda.tsx`, 1 linha em `App.tsx`), só para `pedrocontrucci@hotmail.com` (gate no front + nas functions). Lê o kinu-beta por RPC security definer: `onda_painel()` (view `onda.painel`: convidados ∪ contas novas desde 22/10 como `nao_convidado`, sem `kinu-test.dev`), `onda_feedback()` (só feedback ≥ 22/10; 52 históricos fora), `onda_triage(id, status, nota)`. Colunas novas em `feedback`: `triage` (novo/fila/feito/nao_fara) e `triage_note` (= "Ação", arco). UI: tiles clicáveis → tudo colapsável (Feedbacks aberto, Pessoas e Por grupo fechados), atualização a cada 60 s, horário local. Lição: `create or replace view` trava enquanto o `/onda` está aberto (lock) — fechar a página antes de mexer na view. Dia 1 da onda: 6 convidados, 5 com conta, 3 criaram viagem, 0 confirmações, 4 feedbacks (Rachel, 2 no app + 2 fora) → todos "na fila": **C.12** hotel/voo opcionais + tipo de hospedagem (hotel · Airbnb/casa alugada · casa de alguém) + "Por conta" no restaurante; **C.13** viagem multi-estadia (N trechos, catálogo por cidade). Decisão: nada disso antes de 02/11.
