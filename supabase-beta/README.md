# supabase-beta

Migrations do **kinu-beta** — o projeto Supabase próprio do Kinu (região São Paulo).

## Dois bancos, duas pastas — não misturar

| Pasta | Projeto | Quem escreve | O que vive lá |
|---|---|---|---|
| `supabase/` | Supabase do **Lovable Cloud** | O Lovable (automático) e edge functions | `community_itineraries`, feedback, functions do app hoje em produção |
| `supabase-beta/` | **kinu-beta** (conta do fundador, SP) | Só a mão humana / Fábrica | `profiles`, `trips`, `kinu_sessoes` — o destino da migração F3 |

Regras:

1. **Nunca** rodar migration de `supabase-beta/` no Lovable Cloud, nem o contrário.
2. Estas migrations são aplicadas **à mão**, pelo SQL Editor do painel do kinu-beta,
   na ordem numérica dos arquivos. Não há CLI apontando para cá.
3. `price_alerts` e `events` já existem no kinu-beta (criadas em sessão anterior,
   fora deste versionamento). Nenhuma migration daqui toca nelas.
4. Toda migration é idempotente (`if not exists` / `or replace` / `drop ... if exists`):
   rodar duas vezes não quebra.

## Conteúdo

| Arquivo | O que faz |
|---|---|
| `migrations/001_profiles_trips_sessoes.sql` | As 3 tabelas, colunas geradas, índices, trigger de `atualizado_em` e auto-criação do profile no signup |
| `migrations/002_rls.sql` | RLS ligado nas 3 tabelas + 12 policies (`select`/`insert`/`update`/`delete` por tabela) |
| `prova-rls.sql` | Script de prova em 3 blocos: cria 2 usuários fake, prova que A não vê B, e limpa tudo |

Ordem de aplicação: `001` → `002` → `prova-rls.sql` (blocos A, B, C, um por vez).
O passo a passo detalhado está em `RELATORIO-F3-ARCO2-MIGRATIONS.md`, na raiz do repo.
