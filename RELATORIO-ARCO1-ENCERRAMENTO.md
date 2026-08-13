# Relatório — Encerramento do Arco 1: tripStore, o funil único
**Período:** 11-13/ago/2026 · **Status:** ✅ ENCERRADO — prova final 6/6

## O que o arco entregou
De 28 operações cruas sobre kinu_trips em 8 arquivos (recon) para UMA porta:
src/lib/tripStore.ts — 12 exports, 28 testes unitários, grep final com zero
acesso cru fora do store em todo o src/.

| Fase | Commit | Entrega |
|---|---|---|
| 1a | c4bb752 | Fundação: tripStore.ts, 12 exports, regra de ouro (read-modify-write) |
| 1b | 70009c5 | 28 testes + 4 leitores puros migrados + sino (subscribeTrips) estreando |
| 1c | 044504a | 2 criadores → addTrip; metade "criação" do §4.2 morta |
| 1d-i | c90fd4a | /viagens: mount via listTrips + sino + escrita genérica; §4.2 morto na prática (Lisboa sobrevive) |
| 1d-ii | 3e433f1 | 10 handlers de edição → updateTrip; FinOps calculando sobre o disco |
| 1d-iii | 7524426 | Ciclo de vida (draft/activate/delete/reset); ressurreição de viagens apagadas desativada; Viagens.tsx com zero localStorage |
| 1e | bb69f01 | GeneratedItineraryStage no funil; §4.1 e §4.4 mortos; loop latente eliminado por construção; FUNIL HERMÉTICO |
| 1f | — | Prova final do fluxo completo: 6/6 |

## Bugs estruturais mortos (do recon §4)
- §4.1 escrita concorrente Stage×Viagens: morto (1e)
- §4.2 escrita concorrente KinuAI×Viagens: morto (1c criação + 1d-i/ii edição) — reproduzido ao vivo antes e depois
- §4.3 mount quebrando com storage torto: morto (listTrips garante array)
- §4.4 busca por conteúdo com return silencioso: morto (1e, updateTrip por id)
- §4.5 normalização assimétrica + escrita-no-read: morto (1d-i)
- §4.9 vazamento de price_history: morto (deleteTrip/clearTrips limpam)
- §4.10 sem sincronização entre abas: morto (sino + evento storage)
- Bônus: ressurreição de viagens apagadas (1d-iii) e loop latente do Stage (1e)

## Pendências herdadas (endereços definidos)
- **Decisão de produto — limbo do draft:** edições de roteiro no cockpit de
  rascunho não persistem porque o Stage regenera determinístico e descarta
  days salvos (void existingDays). 4 opções documentadas no
  RELATORIO-F3-FASE1E-STAGE.md; candidatas: opção 2 (pragmática) vs 4 (ideal).
- Deep-link ?trip= ignorado (§4.11) — getTrip(id) pronto no store; melhoria de UX
- Divergência do cost no swap (§4.8) — decisão de produto
- Teste automatizado do fallback onError — lacuna declarada
- Campos extras do SavedTrip (§4.6) — fechar tipo em arco futuro
- kinu_saved_activities órfã (§4.7) — bug de produto
- Feedback exportado sem contexto de viagem — investigar

## Próximo: Arco 2 da Fábrica
Migrations no kinu-beta: profiles, trips, kinu_sessoes + RLS testado com 2
usuários fake. O funil hermético é o pré-requisito que este arco existia para
criar — a dupla leitura da F3 agora tem um único ponto de acoplamento.