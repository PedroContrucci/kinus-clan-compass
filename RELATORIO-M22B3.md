# RELATORIO-M22B3 — agente importa roteiro pronto
Commit `feat(import):` 5b9cffd. Function tocada: só `supabase/functions/kinu-ai/index.ts`. Intocáveis/proibidos intactos. STEP1-M22*.md não comitados.

## Function
- Ferramenta `importar_roteiro` (proposta, fora de `SERVER_RESOLVED_TOOLS`): destino, datas, viajantes, adultos, criancas_idades, origem, orcamento_total, `dias[]`≤10 × `itens[]`≤8 {hora?, nome≤80, tipo}; 40 itens no total (o teto de 40 é aplicado no front; o schema limita 10×8).
- Regra 10b substituída (a–g); 13 e 16 e `criar_viagem` intactos.
- `max_tokens` 1024 → 2048. Mensagem 2000 → 6000; se cortada, acrescenta nota de sistema (o agente avisa o usuário).
- Limite do histórico (:525 antes): é POR MENSAGEM (5000 cada, últimas 10), não total. Subi para a mesma constante `MAX_MESSAGE_CHARS = 6000`, assim o roteiro de 6000 não é cortado ao voltar no histórico. Estrutura do sanitize inalterada.

## Front
- `src/lib/importAgent.ts` (puro): `buildAgentImport` (recusa fora da lista com cidades próximas ANTES de casar; `planFromAgent`; `buildImportedDraft`; `finishFlowTrip`), `normalizeImportDays` (corta em 10/8/40), `importCardLines`.
- Handler em `KinuAIContext.tsx`: erro tipado ou recusa → aviso, nada criado; sucesso → `addTrip` + `trackTripCreated`.
- Cartão em `KinuAIMessage.tsx` (linhas 1–3 + "roteiro cortado em 40 itens"; botões "Importar roteiro"/"Recusar"); `criar_viagem` não mudou.
- "O que o KINU fez" (`onboardingFlow.ts`, um único ponto): só `importedFrom==='user'` → "N dias com N itens do seu roteiro · N reconhecidos no catálogo". N dias = dias da viagem (a cena tem 6 com o dia do voo, roteiro de 5). Sem o sufixo "montei por…" para importada.

## Testes (`m22b3-agente.test.ts`, 5)
Paris: 12 reconhecidos, 3 do seu roteiro, 1 em dia fechado (Louvre), textos do cartão e da tela; Cusco → recusa; 41 itens → 40 + sinal; leitura de `index.ts` (ferramenta, 2048, 6000, regra nova, 13/16, não server-resolved).

## Gates
deno check ok · tsc limpo · vitest 91 arquivos, 0 failed (suíte inteira rodada antes de ajustar 2 asserts do teste novo; o arquivo novo reroda verde) · build ok · eslint: 21 problemas = HEAD, nenhum novo.
Nenhum teste existente mudou de resultado.

## Custo, novo pior caso por requisição (estimativa, Sonnet 4.6 a US$3/15 por M tok)
Base citada no código: ~US$0,70/req. Delta: saída 3 turnos × +1024 tok ≈ +US$0,05; entrada: mensagem +~1,3k tok e histórico 10×+1000 chars (~+3k tok), ×3 turnos ≈ +US$0,04. Novo pior caso ≈ US$0,79/req (+~13%). Burst guard 12/10s inalterado: não recalibrado.

## Redeploy (Lovable): `supabase/functions/kinu-ai/index.ts` (único; `_shared/*` e `account.ts` não tocados).

## Push do feat
```
To https://github.com/PedroContrucci/kinus-clan-compass
   ea6de0f..5b9cffd  main -> main
```
