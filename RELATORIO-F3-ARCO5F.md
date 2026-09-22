# RELATÓRIO — F3 / Arco 5.f: a sombra virou porta (rate limit persistente)

**Data:** 22/09/2026 · **Implementação:** Lovable (Code em reserva), commit `53bc43d` · **Deploy:** kinu-ai + `_shared/telemetry.ts`, provado por sonda
**Base:** RELATORIO-F3-ARCO5D.md §6 (critério), RELATORIO-F3-ARCO5E.md (telêmetro)

## Leitura da série (06–22/09, 16 dias)
bugs (expired/bad-iss/bad-aud/bad-signature/role:*) = **0** · jwks-unavailable = **0** · pico medido por usuário = **8/h** · tráfego nulo após 10/09 (beta dormente). Calibração por primeiro princípio, folgada; recalibrar após a onda.

## O que mudou
- `_shared/telemetry.ts`: `checkRate(req, fn, who)` — AGUARDA o RPC `record_request` (timeout 1,5 s) e devolve hits. **Fail-open** em erro/timeout. Tetos: `user:*` 30/h · `ip:*` 15/h · `ip:unknown` nunca bloqueia (servidor→servidor). `recordRequest` intacta.
- `kinu-ai/index.ts`: `checkRate` antes de qualquer chamada à Anthropic; excesso → **429** com `Retry-After: 900` e mensagem do KINU; toda resposta leva `x-kinu-rate: <hits>/<limit>`; log `[5f] …`.
- **`feedback-notify` intocada** (decisão do 5.d: nunca aperta por identidade).

## Provas (22/09, sondas anônimas com mensagem vazia — custo zero de API, passam pelo contador)
1–14: `x-kinu-rate` 1/15 → 14/15 · 15ª: `n/a/15` (timeout do RPC → fail-open, como desenhado) · 16ª: `15/15` · 17ª: **`HTTP/2 429`, `retry-after: 900`, `x-kinu-rate: 16/15`**, mensagem "Você está indo rápido demais…".

## Pendências
- Mensagem do 429 cita "30 por hora" também para anônimo (teto 15) — tornar dinâmica quando houver motivo para redeploy.
- Recalibrar tetos com dados da onda.
- Workspaces Anthropic prod/dev antes da onda (pendência de agosto).

**Fase de segurança (5.0–5.f) fechada em produção. Bloqueador técnico do gate F4 removido.**
