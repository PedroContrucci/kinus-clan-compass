# Corrigir a organização da aba Clã

## Resultado
A aba `/cla` volta a abrir como uma visão da comunidade. A contribuição fica acessível por dois botões equivalentes no topo, sem dominar a página.

## Implementação
- Recuperar seletivamente do histórico a busca, filtros, contexto da viagem ativa, Meus Roteiros, Top Roteiros Curados, Favoritos da Comunidade, Top Picks, Roteiros do Clã, atividades e janelas de detalhes.
- Manter o seletor de cidade curada e colocar logo abaixo os botões “Indicar um lugar” e “Ver indicações”.
- Reutilizar a folha v2 existente no primeiro botão, sem alterar seus campos ou comportamento.
- Criar a folha de leitura acionada pelo segundo botão, com indicações da cidade, indicações do usuário e “Também fui”.
- Unificar “Mais amados pelo clã” em “Atividades mais bem avaliadas”, mostrando “Google 4,6” e “Clã 👍 n”.
- Ordenar pela nota Google enquanto houver menos de cinco reações; com cinco ou mais, priorizar o saldo do Clã. Exibir a legenda informada.

## Limites
- Alterar somente a apresentação da aba Clã.
- Não modificar formulário, check-in, arquivos de dados, tipos ou regras existentes.

## Verificação
- Conferir visualmente a tela padrão e as duas folhas em viewport móvel.
- Rodar testes, checagem de tipos, build e lint do arquivo alterado.
