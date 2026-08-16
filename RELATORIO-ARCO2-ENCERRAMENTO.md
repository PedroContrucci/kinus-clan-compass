
## Adendo (16/ago) — Claude Code restabelecido
- Causa: sessao retomada por --continue carregava vinculo com conta OAuth expirada; redirect localhost do /login nao funciona em Codespace.
- Solucao: removido oauthAccount e limpa lista rejected de customApiKeyResponses (~/.claude.json, backup .bak); Code atualizado para 2.1.233; sessao NOVA (claude sem --continue) entra pela ANTHROPIC_API_KEY do ambiente. Modo: API Usage Billing (teto US$50/mes protege).
- Regra: apos troca de modo de auth, sempre sessao nova. Contexto vive nos .md do repo.
