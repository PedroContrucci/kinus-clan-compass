# Relatório — Encerramento do Arco 2: schema do kinu-beta (profiles, trips, kinu_sessions + RLS)
**Período:** 14-16/ago/2026 · **Status:** ✅ ENCERRADO — 4 migrations aplicadas, prova completa
**Commit dos arquivos:** 4ef0d06 (v2 reconciliada, schema em inglês)

## O caminho
- v1 (13/ago) assumiu banco virgem → abortou no 42703 (profiles já existia em outro formato).
- Raio-X do kinu-beta revelou 8 tabelas: catálogo vivo (curated_activities 883,
  curated_hotels 132) + 6 esqueletos vazios de iteração anterior, incluindo profiles
  (3 colunas) e trips (colunar). Todas as user_id FKs apontavam direto para auth.users.
- Decisões: schema em INGLÊS (alinhado ao existente); drops autorizados dos esqueletos
  vazios; 000/003 como estrutura de reconciliação; price_alerts.trip_id CASCADE
  (assinatura sem objeto é lixo) vs monitor_offers.trip_id SET NULL (observação é
  registro); user_id legadas permanecem em auth.users (cascade equivalente, sem
  dependência do trigger de signup).
- v2 gerada, versionada e aplicada à mão no SQL Editor: 000 → 001 → 002 → 003 → prova.

## Prova (16/ago)
| Bloco | Resultado |
|---|---|
| 000 | guardas OK; esqueletos derrubados; catálogo 883/132 intacto |
| 001 | schema criado; backfill auth_users=profiles=0 (Auth do kinu-beta ainda sem usuários) |
| 002 | RLS ligado, anon revogado, 12 policies |
| 003 | FKs religadas na trips nova: price_alerts cascade, monitor_offers set null; sem caveat de FK cascade offers→alerts |
| Prova A | signup trigger ✅, preferences default ✅, colunas geradas ✅ (destination refletiu updates), updated_at trigger ✅ (provado fora de transação) |
| Prova B | **11/11 PASSA** — isolamento completo incluindo forja (teste 6) e doação de linha (teste 7); caso feliz funciona (teste 8) |
| Prova C | cascade 0/0/0; catálogo 883/132 intacto; mapa de FKs conforme desenho |

## Lições do script de prova (corrigir no prova-rls.sql versionado)
1. Bloco B: `set_config('role','authenticated')` impede o próprio bloco de gravar na
   temp table de resultados → adicionar `grant insert, select on prova_rls to authenticated;`
   após o create temp table.
2. Bloco A: `now()` é congelado dentro da transação → `updated_at > created_at` dá false
   mesmo com trigger funcionando. Corrigir com split da transação ou pg_sleep antes do
   update. O trigger foi provado à parte (andou = true fora de transação).

## Lições operacionais
- Migration com `if not exists` silencia divergência de schema: raio-X do banco ANTES de
  desenhar, sempre (information_schema.columns + pg_constraint).
- Guarda de fingerprint (curated_* como impressão digital do kinu-beta) protege contra
  colar no banco errado — vira padrão de toda migration futura da pasta.
- Anexos .md nesta conversa chegam vazios; texto direto ou .docx funcionam.
- Claude Code no Codespace: OAuth expira e o redirect localhost não funciona em ambiente
  remoto — pendência de resolver o modo API key; enquanto isso, geração de arquivos
  pelo sócio + aplicação manual funcionou.

## Próximo: Arco 3 — Auth real
Supabase Auth (email + Google) no kinu-beta substituindo o mock src/hooks/useAuth.ts
mantendo a mesma interface do hook. Pré-requisito de trips.user_id e fundação do rate
limiting (Arco 5). A F3 agora tem funil hermético (Arco 1) + banco com RLS (Arco 2):
falta a identidade que liga os dois.
## Adendo (16/ago) — Claude Code restabelecido
- Causa: sessao retomada por --continue carregava vinculo com conta OAuth expirada; redirect localhost do /login nao funciona em Codespace.
- Solucao: removido oauthAccount e limpa lista rejected de customApiKeyResponses (~/.claude.json, backup .bak); Code atualizado para 2.1.233; sessao NOVA (claude sem --continue) entra pela ANTHROPIC_API_KEY do ambiente. Modo: API Usage Billing (teto US$50/mes protege).
- Regra: apos troca de modo de auth, sempre sessao nova. Contexto vive nos .md do repo.
