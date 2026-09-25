# RELATÓRIO — Clã por cidade

## Entregue
- Tudo abaixo dos chips foi reconstruído com uma única visão da cidade selecionada.
- Chips quebram linha no mobile e mostram contagens da mesma lista que exibem.
- `⭐ Top` limita a cinco e usa Clã primeiro quando há 5+ reações; abaixo disso usa Google.
- Grade em 1/2/3 colunas, 12 itens por vez e botão `Ver mais`; sem carrossel ou rolagem infinita.
- Imagens entram sob demanda, têm placeholder por categoria e cache de sessão por busca do lugar.
- Atividades e hotéis abrem os detalhes existentes; Michelin ganhou detalhe somente leitura.
- As ações `Adicionar à minha viagem` e `Usar este hotel` continuam usando `AddToTripSheet`.
- Ícaro aparece somente nas cidades que têm uma dica específica cadastrada na apresentação.

## Seções removidas
- Favoritos da Comunidade.
- Top Picks da Comunidade.
- Atividades mais bem avaliadas como seção independente.
- Carrossel fixo Roteiros do KINU com cidades diferentes.
- Chamada final global para planejar.
- Consultas e modais comunitários globais que alimentavam conteúdo fora da cidade.

## Fonte por chip
- Todos: união das listas abaixo, já filtradas pela cidade, busca e estilo.
- Roteiros: `destinations.ts` pelo nome exato da cidade + `cla_shared_trips_public(p_city)`.
- Restaurantes: `getDestinationActivities(city)`, categorias breakfast/lunch/dinner.
- Hotéis: somente `getCuratedHotels(city)`.
- Michelin: `MICHELIN_RESTAURANTS[city normalizada]`.
- Experiências: catálogo da cidade, sem refeições e sem tag beach/praia.
- Praias: catálogo da cidade com styleTags beach/praia.
- Dicas: cada entrada de `tips[]` do catálogo da cidade.

## Causa do Hotéis 8 × 2
- O contador antigo começava com os 2 hotéis de `getCuratedHotels(city)`.
- Depois o laço das atividades globais somava novamente toda atividade com `category = hotel`.
- A lista mostrava só os 2 curados, mas o chip combinava duas fontes e chegava a 8.
- Agora contador e lista leem exclusivamente `getCuratedHotels(city)`.

## Escopo preservado
- Nenhum arquivo em `src/data/`, tipos, formulário de indicação, check-in, conquistas, eventos de viagem ou gerador foi alterado.
- As folhas v2 e o topo da aba foram preservados.

## Validação
- TypeScript limpo.
- ESLint sem problema novo nos arquivos tocados.
- Build automático da prévia OK.
- A inspeção autenticada local ficou bloqueada porque a conta beta de teste não abriu sessão neste ambiente.
- Nenhum deploy ou Publish executado.
