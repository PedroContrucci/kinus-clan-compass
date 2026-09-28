# STEP1 — fallback de fotos dos cards do Clã

## Achados que mudam o plano
- `ClaLazyImage` envia hoje apenas `<nome> <cidade>` ao `DestinationImage`.
- `DestinationImage` já tenta candidatos em sequência, mantém cache em memória/sessionStorage e para no primeiro resultado.
- Quando todos falham, seu fallback interno cobre o gradiente semântico do card com um gradiente genérico escuro.
- `Sorveteria 50 Sabores` tem categoria temporal `afternoon`; o termo visual precisa considerar nome e `styleTags`, não só `category`.

## Diff proposto
- `DestinationImage.tsx`: aceitar uma lista opcional e ordenada de consultas alternativas; consultar cache por chave; manter o fallback visual configurável.
- `ClaLazyImage.tsx`: receber `categoryKeyword`; montar a cadeia exata `<nome> <cidade>` → `<palavra-chave> <cidade>` → `<cidade>`; preservar o gradiente da categoria durante carregamento e falha total.
- `Cla.tsx`: derivar a palavra-chave visual dos dados já carregados e passá-la aos cards:
  - sorveteria pelo nome;
  - praia por etiqueta praia/beach;
  - museu para arte/cultura/história;
  - restaurante para gastronomia e refeições;
  - hotel, roteiro e restaurante Michelin diretamente pelo tipo do card;
  - experiência como fallback semântico das demais atividades.

## Escopo
- Nenhum arquivo de dados, tipos ou backend será tocado.
- Sem mudança de catálogo, filtros, navegação ou ações dos cards.
- Validação: suíte Vitest, typecheck, build e eslint apenas nos arquivos tocados.

## Decisões abertas
- Nenhuma: o pedido já definiu a ordem da cadeia e o comportamento de falha.
