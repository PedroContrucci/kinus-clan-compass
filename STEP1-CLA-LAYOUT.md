# STEP1 — Clã: comunidade primeiro

## Achados que mudam o plano
- A última versão anterior ao Clã Vivo v1 está no commit `9490483e`.
- Ela contém busca; filtros de país, cidade, categoria e estilo; dica contextual da viagem ativa; Meus Roteiros; Top Roteiros Curados; Favoritos da Comunidade; Top Picks; Roteiros do Clã; Atividades mais bem avaliadas; modais de detalhe; e CTA final.
- O formulário v2 já é global e abre por `openClaSuggest({ city })`; não será alterado.
- A página atual já carrega indicações, confirmações e estatísticas necessárias para a nova folha secundária.
- “Mais amados pelo clã” duplica a lista pedida de atividades; será incorporado em “Atividades mais bem avaliadas”.
- A nota Google do catálogo curado está em `getDestinationActivities(city).rating`; o placar do Clã vem de `claStats(city)`.

## Diff proposto
- Reestruturar somente `src/pages/Cla.tsx`.
- Manter cabeçalho e seletor da cidade curada, seguido por dois botões iguais: “Indicar um lugar” e “Ver indicações”.
- “Indicar um lugar” abre, sem mudanças, a folha v2 existente.
- “Ver indicações” abre uma folha secundária com “Indicações do clã em <cidade>”, “Suas indicações” e “Também fui”.
- Restaurar como conteúdo padrão os blocos comunitários anteriores, preservando busca, filtros, roteiros, atividades, fotos e detalhes.
- Em “Atividades mais bem avaliadas”, listar atividades curadas da cidade com Google e Clã lado a lado.
- Ordenação: atividades com 5+ reações priorizam score do Clã; as demais seguem nota Google. Incluir a legenda solicitada.
- Não manter seção separada “Mais amados pelo clã”.
- Não tocar formulário, check-in, dados, tipos, funções do servidor ou regras de comunidade.

## Validação
- Testar abertura das duas folhas, troca de cidade, confirmação “Também fui” e conteúdo padrão.
- Rodar suíte completa, checagem de tipos, build e eslint apenas nos arquivos tocados.

## Decisões abertas
- Nenhuma.
