# supabase-beta

Migrations do **kinu-beta** — o projeto Supabase próprio do Kinu (região São Paulo).

## Dois bancos, duas pastas — não misturar

| Pasta | Projeto | Quem escreve | O que vive lá |
|---|---|---|---|
| `supabase/` | Supabase do **Lovable Cloud** | O Lovable (automático) e edge functions | `community_itineraries`, feedback do app, functions em produção |
| `supabase-beta/` | **kinu-beta** (conta do fundador, SP) | Só a mão humana / Fábrica | catálogo curado + schema da F3 (`profiles`, `trips`, `kinu_sessions`) |

## Estado real do kinu-beta (raio-X de 14/ago/2026)

O banco **não é virgem**. Tabelas existentes antes do Arco 2:

| Tabela | Linhas | Situação |
|---|---|---|
| `curated_activities` | 883 | **DADO VIVO** — catálogo do pipeline de curadoria. Intocável |
| `curated_hotels` | 132 | **DADO VIVO** — idem |
| `events` | 0 | esqueleto de iteração anterior; mantida |
| `feedback` | 0 | idem |
| `price_alerts` | 0 | mantida; FK `trip_id` religada pela 003 (cascade) |
| `monitor_offers` | 0 | mantida; FK `trip_id` religada pela 003 (set null) |
| `profiles` (antiga, 3 colunas) | 0 | **derrubada** pela 000 e recriada pela 001 |
| `trips` (antiga, colunar) | 0 | **derrubada** pela 000 e recriada pela 001 (payload-cru) |

As migrations da primeira tentativa (v1, em português: `001_profiles_trips_sessoes.sql`)
nunca foram aplicadas com sucesso — o 42703 abortou na primeira `profiles` conflitante.
Foram substituídas pela v2 (inglês, com reconciliação). O git guarda a história.

## Ordem de aplicação (SQL Editor do painel do kinu-beta, à mão)

```
migrations/000_reconcile.sql               # guardas + drops dos esqueletos
migrations/001_profiles_trips_sessions.sql # schema novo (inglês) + backfill
migrations/002_rls.sql                     # RLS + policies
migrations/003_reconcile_refks.sql         # religa price_alerts/monitor_offers
prova-rls.sql                              # blocos A, B, C — um por vez
```

## Regras

1. **Nunca** rodar migration de `supabase-beta/` no Lovable Cloud, nem o contrário.
   A guarda 1a da 000 aborta se `curated_*` não existirem (fingerprint do banco).
2. Aplicação **à mão**, pelo SQL Editor, na ordem numérica. Não há CLI apontando para cá.
3. Nenhuma migration daqui toca em `curated_activities`/`curated_hotels`.
4. Toda migration é idempotente: rodar duas vezes não quebra.
5. Vocabulário do schema: **inglês** (alinhado ao banco existente).
