# Reconstruir a comunidade do Clã por cidade

## Resultado
A aba Clã exibirá somente hotéis, restaurantes, experiências, praias, dicas, Michelin e roteiros da cidade selecionada, sem seções globais nem carrosséis.

## Implementação
- Preservar sem alterações o cabeçalho, seletor único, botões de indicação, busca e folhas v2.
- Substituir tudo abaixo dos chips por uma visão única e memoizada do catálogo da cidade.
- Fazer cada contador usar exatamente a mesma lista exibida pelo chip.
- Separar Restaurantes, Experiências, Praias e Dicas a partir das atividades curadas; usar hotéis curados, Michelin local e roteiros KINU/Clã da cidade.
- Adicionar filtro `⭐ Top`, com até cinco resultados e prioridade do Clã a partir de cinco reações; usar estrelas para Michelin.
- Exibir cards em grade responsiva, 12 por vez com “Ver mais”, sem rolagem infinita ou carrossel.
- Carregar imagens somente quando os cards entrarem na tela e guardar resultados por `cidade + nome` durante a sessão.
- Abrir os detalhes existentes para atividades e hotéis, incluindo a ação de adicionar à viagem; criar detalhe Michelin somente leitura.
- Mostrar a dica do Ícaro apenas quando existir recomendação específica da cidade.

## Remoções
- Favoritos da Comunidade.
- Top Picks da Comunidade.
- Ranking separado “Atividades mais bem avaliadas”.
- Carrossel fixo “Roteiros do KINU” com outras cidades.
- Consultas e modais legados globais que deixarem de alimentar a tela.

## Verificação
- Testar troca de cidade, busca, estilos, chips, Top, “Ver mais”, detalhes e ações em mobile, tablet e desktop.
- Confirmar a mensagem Michelin exata para Fortaleza e ausência de dados de outras cidades.
- Rodar a suíte inteira, TypeScript, build e lint dos arquivos alterados.
