# RELATÓRIO — fallback de fotos dos cards do Clã

## O que mudou
- `ClaLazyImage` passou a enviar uma cadeia ordenada de consultas ao `DestinationImage`.
- `DestinationImage` agora aceita consultas alternativas, para no primeiro resultado válido e reaproveita cache em memória e `sessionStorage` por chave consultada.
- O gradiente semântico do card permanece visível durante o carregamento e quando todas as consultas falham; o card nunca fica com uma área vazia.
- Nenhum arquivo em `src/data/` foi alterado.

## Cadeia usada
1. `<nome> <cidade>`
2. `<palavra-chave da categoria> <cidade>`
3. `<cidade>`

Exemplo solicitado:
1. `Sorveteria 50 Sabores Fortaleza`
2. `sorveteria Fortaleza`
3. `Fortaleza`

Palavras-chave: `sorveteria`, `praia`, `museu`, `restaurante`, `natureza`, `vida noturna`, `hotel`, `turismo` e `experiência` como fallback das demais atividades.

## Validação
- Vitest: 31 arquivos, 440 testes aprovados.
- Typecheck: limpo.
- Build: concluído.
- ESLint dos 3 arquivos alterados: limpo.
- Prévia autenticada: não executada; não há conta do solicitante cadastrada no app para abrir a sessão automática.
