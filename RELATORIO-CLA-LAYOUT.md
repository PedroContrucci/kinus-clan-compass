# RELATÓRIO — Clã: comunidade primeiro

## Entregue
- `/cla` volta a abrir na visão comunitária anterior.
- No topo, logo abaixo do seletor da cidade curada, há dois botões iguais:
  - `Indicar um lugar`: abre o formulário Clã Vivo v2 existente.
  - `Ver indicações`: abre a folha secundária de indicações.
- A folha secundária preserva “Indicações do clã em <cidade>”, “Suas indicações”, status, nota da curadoria e “Também fui”.

## Conteúdo padrão restaurado
- Busca por destinos, restaurantes e experiências.
- Filtros de país, cidade, estilo e categoria.
- Recomendação contextual de Ícaro para a viagem ativa.
- Meus Roteiros.
- Top Roteiros Curados.
- Favoritos da Comunidade.
- Top Picks da Comunidade.
- Roteiros do Clã, com abertura dos detalhes.
- Atividades, com fotos, filtros e abertura dos detalhes.
- Chamada final para planejar uma viagem.

## Ranking de atividades
- “Atividades mais bem avaliadas” reúne a antiga prova social e o ranking do Clã.
- Cada item mostra `Google 4,6` quando há nota no catálogo.
- Mostra `Clã 👍 n` somente quando existem reações.
- Com 5 ou mais reações, o saldo do Clã ganha prioridade.
- Abaixo desse volume, a nota Google determina a ordem.
- A regra aparece na legenda solicitada.
- “Mais amados pelo clã” não foi mantido como seção duplicada.

## Escopo preservado
- Formulário v2, check-in, arquivos de dados, tipos e regras não foram alterados.
- Único arquivo funcional alterado: `src/pages/Cla.tsx`.

## Validação
- `npx vitest run`: 30 arquivos, 436 testes verdes.
- TypeScript: limpo.
- Build de produção: concluído.
- ESLint do arquivo tocado: limpo.
- Observabilidade da prévia: build OK, sem erro de execução registrado.
- Inspeção autenticada local bloqueada porque a sessão temporária disponível pertence ao backend Lovable Cloud, enquanto este app autentica no ambiente beta separado.

## Git/deploy
- Nenhum deploy ou Publish executado.
- Commit/push não executados: o ambiente gerencia o Git e proíbe comandos mutáveis.
