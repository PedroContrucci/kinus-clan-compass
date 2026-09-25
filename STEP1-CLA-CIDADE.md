# STEP1 — Clã por cidade

## Achados que mudam o plano
- A tela abaixo dos chips ainda mistura duas fontes globais do backend (`useCommunityActivities` e `useCommunityItineraries`) com o catálogo local da cidade.
- O contador de Hotéis já usa `getCuratedHotels(city)`, mas o chip legado `hotel` também pode receber atividades globais classificadas como hotel; a reconstrução elimina essa colisão usando uma fonte tipada por chip.
- “Roteiros do KINU” atual é uma lista fixa de dez cidades; a fonte curada por cidade disponível é `destinations.ts`.
- `ActivityDetailDrawer` aceita `TripActivity`; será adaptado sem mudar tipos para receber a atividade curada e uma ação opcional de adicionar.
- `DestinationImage` busca ao montar e só guarda cache em memória; um invólucro do Clã fará IntersectionObserver e cache por sessão/chave `cidade + nome`.
- Atividades do catálogo usam categorias de horário: breakfast/lunch/dinner são Restaurantes; demais viram Experiências, exceto itens com `styleTags` de praia/beach, que viram Praias.
- “Dicas” serão as dicas (`tips[]`) das atividades da cidade, mantendo vínculo com nome, bairro e nota do lugar.

## Diff proposto
- Reescrever somente o conteúdo abaixo dos chips em `src/pages/Cla.tsx`; preservar cabeçalho, seletor único, dois botões, busca e folhas v2.
- Remover Favoritos da Comunidade, Top Picks da Comunidade, ranking isolado, CTA final e roteiros fixos de outras cidades.
- Parar de usar as consultas comunitárias globais nessa tela; montar uma única visão memoizada da cidade com atividades, hotéis, Michelin, roteiros KINU e roteiros compartilhados.
- Trocar os chips roláveis por uma linha flexível com quebra em mobile e contagens derivadas exatamente das listas exibidas.
- Adicionar o filtro `⭐ Top` junto ao conjunto de chips; limita a categoria ativa aos cinco melhores pela regra Google/Clã já adotada.
- Exibir “Todos” como uma grade única de itens da cidade; chips específicos mostram apenas sua fonte.
- Em Roteiros, separar “Roteiros do KINU” e “Roteiros do Clã”; nunca mostrar roteiro de outra cidade.
- Criar cards do Clã em grade 1/2/3 colunas, paginação explícita de 12 itens e imagem carregada ao entrar na tela.
- Criar drawer Michelin somente leitura e ligar cards de atividades/hotéis aos drawers existentes com a ação de viagem.
- Manter a dica do Ícaro apenas quando houver texto realmente específico para a cidade selecionada.

## Decisões aplicadas
- Top de atividades/hotéis/dicas: regra Clã primeiro com ≥5 reações; depois Google.
- Michelin: ordenação por estrelas, pois a fonte não possui nota Google nem id de reação.
- Roteiros: KINU antes do Clã; não há nota Google comparável, então o Top limita os primeiros cinco preservando os dois grupos.
- Busca e estilo refinam as listas; as contagens dos chips refletem o mesmo conjunto já filtrado.
- Michelin e Dicas permanecem sem ação de adicionar, conforme o pedido anterior preservado.

## Verificação
- Conferir visualmente Todos, cada chip, Top, Ver mais e drawers em mobile, tablet e desktop.
- Validar troca de cidade sem conteúdo residual e Fortaleza sem Michelin com a frase exata.
- Rodar suíte inteira, TypeScript, build e eslint dos arquivos tocados.
