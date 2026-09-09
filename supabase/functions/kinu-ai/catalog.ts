// GERADO por scripts/build-kinu-catalog.ts — NÃO EDITAR À MÃO.
// Fonte: src/data/destinationActivities.ts + src/data/curatedHotels.ts
// 21 cidades · 901 atividades · 68 hotéis
//
// Este arquivo é o que permite ao KINU responder sobre uma cidade curada SEM viagem
// ativa e SEM o front ter adivinhado a cidade na mensagem. Ele viaja com o deploy da
// function: nenhuma rede, nenhum segredo, nenhuma leitura de banco.
//
// Para regerar:  npx tsx scripts/build-kinu-catalog.ts
// A suíte src/test/kinuCatalogArtifact.test.ts falha se este arquivo estiver velho.

export interface CatalogItem {
  name: string;
  category: string;
  neighborhood: string;
  costBRL: number | null;
  tip: string;
}

export interface CatalogHotel {
  name: string;
  zone: string;
  tier: string;
  personaTags: string[];
  priceRangeBRL: string;
  tip: string;
}

export interface CatalogCity {
  city: string;
  items: CatalogItem[];
  hotels: CatalogHotel[];
}

export const CATALOG: Record<string, CatalogCity> = {
  "Paris": {
    "city": "Paris",
    "items": [
      {
        "name": "Le Baratin",
        "category": "dinner",
        "neighborhood": "Belleville",
        "costBRL": 90,
        "tip": "O bistrô de chef cultuado pelos próprios chefs — Belleville autêntica · Reserve; casa pequena"
      },
      {
        "name": "Le Barav (bar à vins)",
        "category": "night",
        "neighborhood": "Marais",
        "costBRL": 50,
        "tip": "Wine bar querido do Marais — escolhe a garrafa na loja e paga rolha simbólica"
      },
      {
        "name": "Bercy Village",
        "category": "afternoon",
        "neighborhood": "Bercy",
        "costBRL": 40,
        "tip": "Antigos armazéns de vinho virados vila de lojas e cafés — passeio leve com crianças"
      },
      {
        "name": "Berthillon (Île Saint-Louis)",
        "category": "afternoon",
        "neighborhood": "Île Saint-Louis",
        "costBRL": 20,
        "tip": "O sorvete mais famoso da França na ilha mais charmosa — combine com o passeio"
      },
      {
        "name": "Fim de tarde no Canal Saint-Martin",
        "category": "afternoon",
        "neighborhood": "Canal Saint-Martin",
        "costBRL": 20,
        "tip": "Baguete + queijo + vinho na beira do canal — o programa jovem-parisiense por excelência"
      },
      {
        "name": "Musée Carnavalet",
        "category": "morning",
        "neighborhood": "Marais",
        "costBRL": 0,
        "tip": "A história de Paris contada de graça num palacete do Marais"
      },
      {
        "name": "Cité des Sciences (La Villette)",
        "category": "morning",
        "neighborhood": "La Villette",
        "costBRL": 60,
        "tip": "O forte é a Cité des Enfants — reserve a sessão online e vá direto nela · O museu geral é gigante e um pouco datado; com crianças, o dia rende"
      },
      {
        "name": "Coulée Verte (Promenade Plantée)",
        "category": "morning",
        "neighborhood": "Bastille",
        "costBRL": 0,
        "tip": "O parque suspenso sobre um viaduto — a High Line original é parisiense"
      },
      {
        "name": "Disneyland Paris (dia inteiro)",
        "category": "morning",
        "neighborhood": "Marne-la-Vallée",
        "costBRL": 450,
        "tip": "A Disney europeia a 40 min de RER — castelo da Bela Adormecida exclusivo · Compre datado online; evite feriados franceses"
      },
      {
        "name": "Du Pain et des Idées",
        "category": "breakfast",
        "neighborhood": "Canal Saint-Martin",
        "costBRL": 25,
        "tip": "A boulangerie de peregrinação — o escargot pistache-chocolate é lendário · Fecha fim de semana: vá seg-sex"
      },
      {
        "name": "Marché des Enfants Rouges",
        "category": "lunch",
        "neighborhood": "Marais",
        "costBRL": 50,
        "tip": "O mercado coberto mais antigo de Paris (1615) — almoce entre bancas do mundo todo"
      },
      {
        "name": "Galerie Vivienne",
        "category": "afternoon",
        "neighborhood": "Palais-Royal",
        "costBRL": 0,
        "tip": "A passagem coberta mais bonita de Paris — mosaicos, livrarias e chá · Roteiro de chuva perfeito com as passagens vizinhas"
      },
      {
        "name": "Day-trip a Giverny (jardins de Monet)",
        "category": "morning",
        "neighborhood": "Giverny",
        "costBRL": 120,
        "tip": "A ponte japonesa e os nenúfares reais dos quadros — abril a outubro · Fecha no inverno: confirmar temporada"
      },
      {
        "name": "Jardin d'Acclimatation",
        "category": "morning",
        "neighborhood": "Bois de Boulogne",
        "costBRL": 80,
        "tip": "Parque de diversões clássico no bosque — o programa família dos parisienses"
      },
      {
        "name": "Marionetes do Jardim de Luxemburgo",
        "category": "afternoon",
        "neighborhood": "Luxembourg",
        "costBRL": 20,
        "tip": "O teatro de fantoches centenário que encanta crianças francesas há gerações · Confira horários (qua/sáb/dom em geral)"
      },
      {
        "name": "Rue Mouffetard (mercado de rua)",
        "category": "morning",
        "neighborhood": "Quartier Latin",
        "costBRL": 30,
        "tip": "A rua-mercado medieval — queijarias, rôtisseries e a Paris que faz feira · Manhã de domingo é o auge"
      },
      {
        "name": "Musée de l'Orangerie",
        "category": "morning",
        "neighborhood": "Tuileries",
        "costBRL": 45,
        "tip": "As Ninfeias de Monet em salas ovais imersivas — 1h de puro deslumbre · Bem menor que o Orsay: cabe em qualquer roteiro"
      },
      {
        "name": "Le Perchoir (rooftop)",
        "category": "night",
        "neighborhood": "Ménilmontant",
        "costBRL": 60,
        "tip": "A vista de Paris é o produto — vá pelo pôr do sol e releve o serviço corrido"
      },
      {
        "name": "Pierre Hermé (macarons)",
        "category": "afternoon",
        "neighborhood": "Saint-Germain",
        "costBRL": 30,
        "tip": "O Picasso da pâtisserie — Ispahan é o macaron que muda vidas"
      },
      {
        "name": "Le Procope (1686)",
        "category": "dinner",
        "neighborhood": "Saint-Germain",
        "costBRL": 90,
        "tip": "O café mais antigo de Paris — Voltaire e Napoleão frequentaram; coq au vin histórico"
      },
      {
        "name": "Musée Rodin (jardins)",
        "category": "afternoon",
        "neighborhood": "Invalides",
        "costBRL": 40,
        "tip": "O Pensador entre roseirais — o museu-jardim mais romântico de Paris"
      },
      {
        "name": "Stohrer (1730)",
        "category": "breakfast",
        "neighborhood": "Montorgueil",
        "costBRL": 20,
        "tip": "A pâtisserie mais antiga de Paris — baba au rhum inventado aqui · Rue Montorgueil inteira vale o passeio"
      },
      {
        "name": "Day-trip a Versalhes",
        "category": "morning",
        "neighborhood": "Versailles",
        "costBRL": 150,
        "tip": "O palácio dos palácios + jardins infinitos — RER C, 45 min · Ingresso com horário marcado; fonte musicais em dias específicos"
      },
      {
        "name": "Angelina",
        "category": "breakfast",
        "neighborhood": "Tuileries",
        "costBRL": 110,
        "tip": "Chocolate quente mais famoso de Paris · Monte-Blanc é a sobremesa clássica"
      },
      {
        "name": "Bistrô em Saint-Germain-des-Prés",
        "category": "night",
        "neighborhood": "Saint-Germain",
        "costBRL": 250,
        "tip": "Ambiente literário histórico · Reserve com antecedência"
      },
      {
        "name": "Bistrot Paul Bert",
        "category": "dinner",
        "neighborhood": "11ème",
        "costBRL": 280,
        "tip": "Bistrô parisiense clássico, steak au poivre de referência · Menu no quadro-negro, ambiente autêntico"
      },
      {
        "name": "Bouillon Pigalle",
        "category": "lunch",
        "neighborhood": "Pigalle",
        "costBRL": 100,
        "tip": "Comida francesa tradicional e barata · Ambiente anos 1900"
      },
      {
        "name": "Breizh Café",
        "category": "lunch",
        "neighborhood": "Le Marais",
        "costBRL": 90,
        "tip": "Melhores crêpes de Paris · Ingredientes orgânicos da Bretanha"
      },
      {
        "name": "Café de Flore",
        "category": "breakfast",
        "neighborhood": "Saint-Germain-des-Prés",
        "costBRL": 120,
        "tip": "Peça o croissant aux amandes - é divino! · Chegue antes das 9h para pegar mesa externa"
      },
      {
        "name": "Café Kitsuné",
        "category": "breakfast",
        "neighborhood": "Palais Royal",
        "costBRL": 90,
        "tip": "Hipster e moderno · Ótimo café especial"
      },
      {
        "name": "Catacumbas de Paris",
        "category": "morning",
        "neighborhood": "Denfert-Rochereau",
        "costBRL": 110,
        "tip": "Reserve online ou enfrenta 2h de fila · Não recomendado para claustrofóbicos"
      },
      {
        "name": "Jazz no Caveau de la Huchette",
        "category": "night",
        "neighborhood": "Quartier Latin",
        "costBRL": 180,
        "tip": "Clube de jazz desde 1946 · Apareceu em La La Land"
      },
      {
        "name": "Centre Pompidou",
        "category": "morning",
        "neighborhood": "Le Marais",
        "costBRL": 90,
        "tip": "Arte moderna e contemporânea · Vista do terraço"
      },
      {
        "name": "Champs-Élysées & Arco do Triunfo",
        "category": "afternoon",
        "neighborhood": "8º Arrondissement",
        "costBRL": 65,
        "tip": "Suba no Arco do Triunfo no pôr do sol · Vista 360° de Paris"
      },
      {
        "name": "Le Bouillon Chartier",
        "category": "dinner",
        "neighborhood": "Grands Boulevards",
        "costBRL": 200,
        "tip": "Desde 1896 - ambiente histórico · Não aceita reserva - chegue 18:30 para evitar fila"
      },
      {
        "name": "Chez Janou",
        "category": "dinner",
        "neighborhood": "Le Marais",
        "costBRL": 250,
        "tip": "Provençal autêntico · Mousse de chocolate infinito - literalmente!"
      },
      {
        "name": "Le Comptoir du Panthéon",
        "category": "dinner",
        "neighborhood": "Quartier Latin",
        "costBRL": 180,
        "tip": "Vista linda do Panthéon · Ótimo para jantar romântico"
      },
      {
        "name": "Les Deux Magots",
        "category": "breakfast",
        "neighborhood": "Saint-Germain-des-Prés",
        "costBRL": 130,
        "tip": "Sartre e Simone frequentavam aqui · O chocolate quente é famoso"
      },
      {
        "name": "Torre Eiffel Iluminada",
        "category": "night",
        "neighborhood": "Champ de Mars",
        "costBRL": 0,
        "tip": "Pisca a cada hora cheia até meia-noite · Melhor vista do Trocadéro"
      },
      {
        "name": "L'As du Fallafel",
        "category": "lunch",
        "neighborhood": "Le Marais",
        "costBRL": 60,
        "tip": "Melhor falafel de Paris · Fila enorme mas vale a pena"
      },
      {
        "name": "Galeries Lafayette",
        "category": "afternoon",
        "neighborhood": "Opéra",
        "costBRL": 0,
        "tip": "Vá ao terraço para vista grátis de Paris · Cúpula art nouveau é linda"
      },
      {
        "name": "Jazz em Saint-Germain",
        "category": "night",
        "neighborhood": "Saint-Germain",
        "costBRL": 50,
        "tip": "Caveau de la Huchette é o mais famoso · Shows começam às 22h"
      },
      {
        "name": "Ladurée",
        "category": "breakfast",
        "neighborhood": "Champs-Élysées",
        "costBRL": 100,
        "tip": "Macarons famosos no mundo todo · Ótimo para fotos instagramáveis"
      },
      {
        "name": "Museu do Louvre",
        "category": "morning",
        "neighborhood": "1º Arrondissement",
        "costBRL": 80,
        "tip": "Reserve ingresso online para evitar fila de 2h · Vá direto para Mona Lisa e depois explore"
      },
      {
        "name": "Jardins de Luxembourg",
        "category": "afternoon",
        "neighborhood": "6º Arrondissement",
        "costBRL": 0,
        "tip": "Leve um livro e relaxe · Crianças podem alugar barquinhos no lago"
      },
      {
        "name": "Passeio pelo Marais",
        "category": "afternoon",
        "neighborhood": "Le Marais",
        "costBRL": 0,
        "tip": "Melhor bairro para flanar · Pare na Place des Vosges para descansar"
      },
      {
        "name": "Montmartre & Sacré-Cœur",
        "category": "morning",
        "neighborhood": "18º Arrondissement",
        "costBRL": 0,
        "tip": "Comece cedo para evitar multidões · Suba pelo funicular ou escadas"
      },
      {
        "name": "Moulin Rouge (show)",
        "category": "night",
        "neighborhood": "Pigalle",
        "costBRL": 400,
        "tip": "Reserve com semanas de antecedência · Show icônico desde 1889"
      },
      {
        "name": "Île de la Cité & Notre-Dame",
        "category": "morning",
        "neighborhood": "Île de la Cité",
        "costBRL": 0,
        "tip": "Catedral em reconstrução após incêndio · Sainte-Chapelle é imperdível ao lado"
      },
      {
        "name": "Catedral de Notre-Dame (parte externa pós-incêndio)",
        "category": "morning",
        "neighborhood": "Île de la Cité",
        "costBRL": 0,
        "tip": "Reconstrução em andamento · Praça em frente é gratuita"
      },
      {
        "name": "Ópera Garnier (visita noturna)",
        "category": "night",
        "neighborhood": "Opéra",
        "costBRL": 120,
        "tip": "Arquitetura deslumbrante · Inspirou O Fantasma da Ópera"
      },
      {
        "name": "Museu d'Orsay",
        "category": "morning",
        "neighborhood": "7º Arrondissement",
        "costBRL": 70,
        "tip": "Impressionistas no 5º andar · Relógio gigante rende foto icônica"
      },
      {
        "name": "Palais Garnier (Ópera de Paris)",
        "category": "afternoon",
        "neighborhood": "Opéra",
        "costBRL": 80,
        "tip": "Inspirou O Fantasma da Ópera · Visite o teto pintado por Chagall"
      },
      {
        "name": "Panthéon",
        "category": "morning",
        "neighborhood": "Quartier Latin",
        "costBRL": 70,
        "tip": "Túmulos de personalidades francesas · Vista panorâmica do topo"
      },
      {
        "name": "Le Petit Cler",
        "category": "lunch",
        "neighborhood": "7º Arrondissement",
        "costBRL": 180,
        "tip": "Peça o menu du jour - melhor custo-benefício · Bistrô tradicional parisiense"
      },
      {
        "name": "Pink Mamma",
        "category": "lunch",
        "neighborhood": "10º Arrondissement",
        "costBRL": 150,
        "tip": "Italiano instagramável · Chegue cedo para evitar fila de 1h"
      },
      {
        "name": "Bairro Latino e Shakespeare & Co",
        "category": "afternoon",
        "neighborhood": "Quartier Latin",
        "costBRL": 0,
        "tip": "Livraria histórica · Ruas medievais ao redor"
      },
      {
        "name": "Le Relais de l'Entrecôte",
        "category": "dinner",
        "neighborhood": "Saint-Germain",
        "costBRL": 220,
        "tip": "Só serve um prato: entrecôte com molho secreto · Não aceita reserva"
      },
      {
        "name": "Mercado de Saint-Ouen (Pulgas)",
        "category": "afternoon",
        "neighborhood": "Saint-Ouen",
        "costBRL": 0,
        "tip": "Maior mercado de antiguidades do mundo · Vá nos fins de semana"
      },
      {
        "name": "Sainte-Chapelle",
        "category": "morning",
        "neighborhood": "Île de la Cité",
        "costBRL": 80,
        "tip": "Vitrais góticos espetaculares · Combine com Conciergerie"
      },
      {
        "name": "Cruzeiro no Sena",
        "category": "afternoon",
        "neighborhood": "Torre Eiffel",
        "costBRL": 80,
        "tip": "Melhor ao pôr do sol · Veja todos os monumentos do rio"
      },
      {
        "name": "Passeio Noturno pelo Sena",
        "category": "night",
        "neighborhood": "Batobus",
        "costBRL": 150,
        "tip": "Paris iluminada do rio · Romântico! Torre Eiffel pisca à meia-noite"
      },
      {
        "name": "Septime",
        "category": "dinner",
        "neighborhood": "11º Arrondissement",
        "costBRL": 350,
        "tip": "Estrela Michelin acessível · Reserve com 3 semanas de antecedência"
      },
      {
        "name": "Torre Eiffel (subir até o topo)",
        "category": "morning",
        "neighborhood": "Champ de Mars",
        "costBRL": 320,
        "tip": "Reserve com antecedência · Vá cedo para evitar fila"
      },
      {
        "name": "Pôr do sol no Trocadéro",
        "category": "night",
        "neighborhood": "Trocadéro",
        "costBRL": 0,
        "tip": "Vista mais icônica da Torre Eiffel · Chegue 30min antes do pôr do sol"
      },
      {
        "name": "Tuileries Garden",
        "category": "afternoon",
        "neighborhood": "entre Louvre e Place de la Concorde",
        "costBRL": 0,
        "tip": "Caminhada perfeita ao pôr do sol · Cadeiras públicas para descansar"
      }
    ],
    "hotels": [
      {
        "name": "Citadines Tour Eiffel",
        "zone": "15e",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Apart-hotel com cozinha perto da Torre - o formato que família agradece"
      },
      {
        "name": "Le Pavillon de la Reine",
        "zone": "Marais",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 2.200-3.800",
        "tip": "Escondido na Place des Vosges - romance absoluto no Marais"
      },
      {
        "name": "Hôtel Plaza Athénée",
        "zone": "Champs-Élysées",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 5.000-9.000",
        "tip": "As sacadas de gerânios da Avenue Montaigne - alta-costura em hotel"
      }
    ]
  },
  "Fortaleza": {
    "city": "Fortaleza",
    "items": [
      {
        "name": "Praia de Águas Belas",
        "category": "afternoon",
        "neighborhood": "Cascavel",
        "costBRL": 90,
        "tip": "Encontro do Rio Mal Cozinhado com o mar · Dá para escolher banho de água doce ou salgada"
      },
      {
        "name": "Dia de praia na Atlantiz",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 85,
        "tip": "🌊 Tem parque aquático — vibe família confirmada pelos curadores locais · Boa estrutura para passar o dia inteiro com crianças"
      },
      {
        "name": "Dia de praia no Chico do Caranguejo",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 85,
        "tip": "🌊 Tem parque aquático com piscina e brinquedos — ótimo para famílias com crianças (info dos curadores locais) · Quinta-feira é o dia da caranguejada mais famosa do Brasil — música e mesa farta"
      },
      {
        "name": "Dia de praia no Crocobeach",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 110,
        "tip": "Uma das maiores estruturas da orla — coquetéis, frutos do mar e grelhados entre palmeiras · Acessibilidade completa (entrada, assentos, banheiro e estacionamento adaptados)"
      },
      {
        "name": "Dia de praia na Itapariká",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 80,
        "tip": "Atmosfera familiar com pacote completo para crianças: cardápio infantil, cadeirinhas e fraldário · Música ao vivo, mesas na cobertura e acessibilidade completa"
      },
      {
        "name": "Dia de praia na Santa Praia",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 85,
        "tip": "Estrutura moderna com eventos e boa cozinha — meio-termo entre família e agito"
      },
      {
        "name": "Dia de praia no Vira Verão",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 100,
        "tip": "DJ, festa e público jovem — o lado agito da Praia do Futuro · Melhor para grupos de amigos do que para famílias com crianças pequenas"
      },
      {
        "name": "Beach Park",
        "category": "afternoon",
        "neighborhood": "Aquiraz",
        "costBRL": 350,
        "tip": "Maior parque aquático da América Latina · Obrigatório se for com crianças"
      },
      {
        "name": "Calçadão da Beira-Mar",
        "category": "afternoon",
        "neighborhood": "Meireles",
        "costBRL": 0,
        "tip": "Calçadão renovado, ótimo para caminhar · Feirinha de artesanato à noite"
      },
      {
        "name": "Cabaña del Primo",
        "category": "lunch",
        "neighborhood": "Meireles",
        "costBRL": 130,
        "tip": "Parrilla uruguaia premiada, carnes no ponto perfeito · Ambiente familiar e atendimento elogiado"
      },
      {
        "name": "Café da manhã na Beira-Mar",
        "category": "breakfast",
        "neighborhood": "Meireles",
        "costBRL": 35,
        "tip": "Tapioca e cuscuz cearense são a pedida local · Caminhada matinal no calçadão antes do calor"
      },
      {
        "name": "Café Santa Clara (Dragão do Mar)",
        "category": "breakfast",
        "neighborhood": "Praia de Iracema",
        "costBRL": 35,
        "tip": "Torrefação tradicional cearense · Peça o café coado na hora com tapioca"
      },
      {
        "name": "Cantinho do Faustino",
        "category": "lunch",
        "neighborhood": "Varjota",
        "costBRL": 100,
        "tip": "Peixada cearense tradicional, receita de família · Porções fartas — peça para dividir"
      },
      {
        "name": "Caranguejada de quinta (Iate Clube)",
        "category": "dinner",
        "neighborhood": "Mucuripe",
        "costBRL": 110,
        "tip": "Quinta é a noite da caranguejada em Fortaleza · Iate Clube é aberto ao público, a partir das 18h"
      },
      {
        "name": "Caravaggio Cucina (Varjota)",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 120,
        "tip": "Italiano romantico de ambiente intimista · Camarao na vodka e tournedos com risoto sao destaques"
      },
      {
        "name": "Carneiro do Ordones (Varjota)",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 100,
        "tip": "Churrasco de carneiro, favorito dos locais · Prova de que Fortaleza tem além de frutos do mar"
      },
      {
        "name": "Catedral Metropolitana de Fortaleza",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Arquitetura neogótica impressionante com vitrais coloridos · A poucos passos do Mercado Central — combine os dois"
      },
      {
        "name": "CEART — Centro de Artesanato",
        "category": "afternoon",
        "neighborhood": "Aldeota",
        "costBRL": 60,
        "tip": "Artesanato de qualidade superior, com curadoria · Peças mais autênticas que a Feirinha turística"
      },
      {
        "name": "Cemoara",
        "category": "lunch",
        "neighborhood": "Meireles",
        "costBRL": 180,
        "tip": "Frutos do mar de décadas na divisa Meireles/Aldeota — peixada e camarão no coco"
      },
      {
        "name": "Coco Bambu Beira-Mar",
        "category": "lunch",
        "neighborhood": "Meireles",
        "costBRL": 120,
        "tip": "A casa-mãe da rede que nasceu em Fortaleza — frutos do mar em pratos fartos com vista para o mar · Camarão Internacional serve bem uma família inteira — peçam menos do que o instinto manda"
      },
      {
        "name": "Coco Bambu (Varjota)",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 130,
        "tip": "O ícone dos frutos do mar em Fortaleza — unidade da Varjota · Moqueca de camarão e bobó de camarão são os destaques"
      },
      {
        "name": "Praia do Cumbuco",
        "category": "morning",
        "neighborhood": "Caucaia",
        "costBRL": 120,
        "tip": "Dunas, lagoas e kitesurf · Passeio de buggy pelas dunas até a Lagoa do Banana"
      },
      {
        "name": "Sorveteria 50 Sabores",
        "category": "afternoon",
        "neighborhood": "Meireles",
        "costBRL": 30,
        "tip": "A sorveteria símbolo da cidade — prove os sabores regionais: cajá, seriguela, tapioca"
      },
      {
        "name": "Centro Dragão do Mar",
        "category": "morning",
        "neighborhood": "Praia de Iracema",
        "costBRL": 20,
        "tip": "Complexo cultural com museus, cinema e planetário · Entrada gratuita em vários espaços"
      },
      {
        "name": "Estação das Artes",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Complexo cultural em antiga estação ferroviária (2022) · Programação noturna de teatro, festivais e gastronomia"
      },
      {
        "name": "Feirinha da Beira-Mar",
        "category": "afternoon",
        "neighborhood": "Meireles",
        "costBRL": 0,
        "tip": "Feira de artesanato tradicional no calçadão, todos os dias a partir do fim da tarde · Rendas, redes e castanha — melhor lugar para lembranças"
      },
      {
        "name": "Giz Cozinha Afetiva",
        "category": "lunch",
        "neighborhood": "Meireles",
        "costBRL": 150,
        "tip": "Cozinha afetiva autoral — almoço tranquilo perto da Beira-Mar"
      },
      {
        "name": "Pôr do sol e noite na Ponte dos Ingleses",
        "category": "night",
        "neighborhood": "Praia de Iracema",
        "costBRL": 0,
        "tip": "Pôr do sol icônico na Ponte dos Ingleses · Região boêmia, mais agitada à noite"
      },
      {
        "name": "Mar & Terra (Varjota)",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 100,
        "tip": "Melhor custo-beneficio de frutos do mar na Varjota · Mais autentico e tranquilo que os grandes"
      },
      {
        "name": "Mercado Central de Fortaleza",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 50,
        "tip": "Mais de 600 lojas de artesanato — rede, bordado, couro, castanhas · Arquitetura com rampas inspiradas em Niemeyer"
      },
      {
        "name": "Mercado dos Peixes (Mucuripe)",
        "category": "lunch",
        "neighborhood": "Mucuripe",
        "costBRL": 90,
        "tip": "Compre o peixe fresco e os quiosques preparam na hora · Peça o pargo frito inteiro ou camarão no bafo"
      },
      {
        "name": "Museu da Fotografia Fortaleza",
        "category": "morning",
        "neighborhood": "Varjota",
        "costBRL": 40,
        "tip": "Um dos acervos fotográficos mais relevantes da América Latina · Climatizado — ótima opção para fugir do calor"
      },
      {
        "name": "Parque do Cocó",
        "category": "morning",
        "neighborhood": "Cocó",
        "costBRL": 0,
        "tip": "Maior parque urbano do Nordeste · Trilhas e passeio de barco entre os manguezais"
      },
      {
        "name": "Picanha do Cowboy",
        "category": "dinner",
        "neighborhood": "Aldeota",
        "costBRL": 110,
        "tip": "Instituição fortalezense de carnes · Porções generosas — bom para dividir em família"
      },
      {
        "name": "Praia do Futuro",
        "category": "morning",
        "neighborhood": "Praia do Futuro",
        "costBRL": 0,
        "tip": "A praia das barracas gigantes — estrutura completa para o dia todo · ⚠️ Mar forte com correntes: banho com muita cautela; com crianças, fique nas piscinas das barracas ou nas piscinas naturais da maré baixa"
      },
      {
        "name": "Praia de Iracema e Ponte dos Ingleses",
        "category": "morning",
        "neighborhood": "Praia de Iracema",
        "costBRL": 0,
        "tip": "Caminhada histórica com a estátua de Iracema e vista do mar · A Ponte dos Ingleses é o point do pôr do sol"
      },
      {
        "name": "Recanto Praiano",
        "category": "lunch",
        "neighborhood": "Praia de Iracema",
        "costBRL": 120,
        "tip": "Peixada cearense honesta perto da Ponte dos Ingleses"
      },
      {
        "name": "Boteco Praia",
        "category": "dinner",
        "neighborhood": "Meireles",
        "costBRL": 70,
        "tip": "O happy-hour clássico de frente pro mar — caldinho, petiscos e fim de tarde cearense"
      },
      {
        "name": "Cabaña del Primo",
        "category": "dinner",
        "neighborhood": "Meireles",
        "costBRL": 140,
        "tip": "Parrilla uruguaia referência da cidade — ojo de bife e provoleta obrigatórios · Fila real em fim de semana: chegue cedo ou reserve"
      },
      {
        "name": "Chico do Caranguejo Aldeota",
        "category": "dinner",
        "neighborhood": "Aldeota",
        "costBRL": 90,
        "tip": "A instituição do caranguejo em versão urbana — pra quem não pega a quinta na praia"
      },
      {
        "name": "Geppos Italiano",
        "category": "dinner",
        "neighborhood": "Aldeota",
        "costBRL": 120,
        "tip": "Tradição de décadas — massas e frutos do mar na Av. Desembargador Moreira"
      },
      {
        "name": "L'Ô Restaurante",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 160,
        "tip": "Franco-contemporâneo na Av. Pessoa Anta — o fine dining do Centro histórico"
      },
      {
        "name": "Moleskine Gastrobar",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 110,
        "tip": "Cozinha autoral e coquetelaria no coração da Varjota"
      },
      {
        "name": "Ryori Sushi",
        "category": "dinner",
        "neighborhood": "Meireles",
        "costBRL": 130,
        "tip": "Referência japonesa da cidade — unidade do Shopping Buganvília (Av. Dom Luís)"
      },
      {
        "name": "Santa Grelha",
        "category": "dinner",
        "neighborhood": "Aldeota",
        "costBRL": 150,
        "tip": "Carnes premium e ambiente de ocasião — o jantar de fechamento da viagem"
      },
      {
        "name": "Vasto Restaurante",
        "category": "dinner",
        "neighborhood": "Meireles",
        "costBRL": 130,
        "tip": "Carnes e cozinha contemporânea na Senador Virgílio Távora"
      },
      {
        "name": "Praia da Taíba",
        "category": "afternoon",
        "neighborhood": "São Gonçalo do Amarante",
        "costBRL": 100,
        "tip": "Vila pacata com trechos quase desertos · Encontro do rio com o mar formando lagoa (Barramar)"
      },
      {
        "name": "Tapioqueiras",
        "category": "breakfast",
        "neighborhood": "Messejana",
        "costBRL": 30,
        "tip": "Polo de tapiocarias autênticas, longe do circuito turístico · Experimente a tapioca de queijo coalho com carne de sol"
      },
      {
        "name": "Theatro José de Alencar",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 20,
        "tip": "Teatro-monumento em ferro art nouveau / neoclássico · Visita guiada disponível"
      },
      {
        "name": "Varjota (bairro gastronômico)",
        "category": "lunch",
        "neighborhood": "Varjota",
        "costBRL": 110,
        "tip": "Epicentro gastronômico de Fortaleza · Frutos do mar frescos e ambiente animado"
      },
      {
        "name": "Passeio de veleiro ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Beira-Mar",
        "costBRL": 100,
        "tip": "Saída do Iate Clube ou Marina Park no fim da tarde · O pôr do sol visto do mar é o cartão-postal da viagem"
      },
      {
        "name": "Vojnilô (frutos do mar)",
        "category": "lunch",
        "neighborhood": "Varjota",
        "costBRL": 130,
        "tip": "Frutos do mar frescos com toque autoral, queridinho dos locais · O polvo grelhado é o prato-assinatura"
      },
      {
        "name": "Café Viriato",
        "category": "breakfast",
        "neighborhood": "Aldeota",
        "costBRL": 35,
        "tip": "Café de especialidade torrado na casa — o terceiro-onda de Fortaleza · Métodos coados e doces da casa"
      },
      {
        "name": "Moendo Café",
        "category": "breakfast",
        "neighborhood": "Fátima",
        "costBRL": 30,
        "tip": "Café de especialidade torrado na casa — o terceiro-onda de Fortaleza (bairro de Fátima)"
      },
      {
        "name": "Órbita Bar",
        "category": "night",
        "neighborhood": "Praia de Iracema",
        "costBRL": 60,
        "tip": "O rock alternativo e os indies da cidade — clássico do Dragão do Mar"
      },
      {
        "name": "Pirata Bar",
        "category": "night",
        "neighborhood": "Praia de Iracema",
        "costBRL": 120,
        "tip": "A lendária \"segunda-feira mais louca do mundo\" — forró e axé até o sol raiar · Programa-símbolo da noite cearense; melhor às segundas"
      },
      {
        "name": "Vila Azul do Mar",
        "category": "night",
        "neighborhood": "Praia de Iracema",
        "costBRL": 80,
        "tip": "Polo de bares e música na orla revitalizada da Iracema"
      }
    ],
    "hotels": [
      {
        "name": "Gran Marquise",
        "zone": "Mucuripe",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.400",
        "tip": "O 5 estrelas da Beira-Mar - serviço impecável e mar na janela"
      },
      {
        "name": "Vila Galé Fortaleza",
        "zone": "Praia do Futuro",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Resort pé na areia da Praia do Futuro - piscinas e all-inclusive opcional"
      }
    ]
  },
  "Rio de Janeiro": {
    "city": "Rio de Janeiro",
    "items": [
      {
        "name": "Academia da Cachaça",
        "category": "dinner",
        "neighborhood": "Leblon",
        "costBRL": 90,
        "tip": "Feijoadinha famosa e carta com centenas de cachaças · Ótima porta de entrada pra cachaça artesanal brasileira"
      },
      {
        "name": "Aconchego Carioca",
        "category": "dinner",
        "neighborhood": "Praça da Bandeira",
        "costBRL": 110,
        "tip": "O bolinho de feijoada premiado nasceu aqui · Boa carta de cervejas artesanais brasileiras"
      },
      {
        "name": "Adega Pérola",
        "category": "night",
        "neighborhood": "Copacabana",
        "costBRL": 70,
        "tip": "Balcão de petiscos portugueses icônico desde 1957 — polvo, bacalhau e bolinhos · Vai de tira-gosto em tira-gosto com chope — instituição de Copacabana"
      },
      {
        "name": "Angu do Gomes",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 50,
        "tip": "O angu histórico que alimentou gerações de cariocas desde os anos 50"
      },
      {
        "name": "Aprazível",
        "category": "lunch",
        "neighborhood": "Santa Teresa",
        "costBRL": 180,
        "tip": "Casarão em Santa Teresa com vista panorâmica da cidade · Cozinha brasileira contemporânea"
      },
      {
        "name": "AquaRio",
        "category": "afternoon",
        "neighborhood": "Centro (Gamboa)",
        "costBRL": 140,
        "tip": "Maior aquário marinho da América do Sul · O túnel submerso é o ponto alto para as crianças"
      },
      {
        "name": "Armazém São Thiago (Bar do Gomez)",
        "category": "night",
        "neighborhood": "Santa Teresa",
        "costBRL": 70,
        "tip": "Armazém centenário que virou o coração boêmio de Santa Teresa · Cerveja gelada, torresmo e história nas paredes"
      },
      {
        "name": "Pedra do Arpoador ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Ipanema",
        "costBRL": 0,
        "tip": "A multidão aplaude o pôr do sol — tradição carioca · Chegue 40 minutos antes para pegar lugar na pedra"
      },
      {
        "name": "Assador Rio's",
        "category": "dinner",
        "neighborhood": "Flamengo (Aterro)",
        "costBRL": 220,
        "tip": "Rodízio de carnes com vista para o Pão de Açúcar · Varanda no fim de tarde pega o pôr do sol na baía"
      },
      {
        "name": "Bar dos Descasados",
        "category": "night",
        "neighborhood": "Santa Teresa",
        "costBRL": 90,
        "tip": "Drinks ao pôr do sol no terraço do Hotel Santa Teresa — vista e clima de cinema"
      },
      {
        "name": "Bar do David",
        "category": "lunch",
        "neighborhood": "Leme",
        "costBRL": 60,
        "tip": "Boteco premiado no Chapéu Mangueira — comida de raiz com vista de comunidade · Feijoada de frutos do mar é a assinatura"
      },
      {
        "name": "Bar do Mineiro",
        "category": "dinner",
        "neighborhood": "Santa Teresa",
        "costBRL": 90,
        "tip": "Comida mineira no coração boêmio de Santa Teresa · A feijoadinha e o pastel de feijão são os clássicos"
      },
      {
        "name": "Bar Jobi",
        "category": "night",
        "neighborhood": "Leblon",
        "costBRL": 80,
        "tip": "O botequim mais clássico do Leblon, aberto até de madrugada desde 1956 · Chope gelado e bolinho de bacalhau — point de músicos e boêmios"
      },
      {
        "name": "Bar Lagoa",
        "category": "dinner",
        "neighborhood": "Lagoa",
        "costBRL": 110,
        "tip": "Botequim Art Déco de 1934 à beira da Lagoa · Bolinho de bacalhau e chope como manda a tradição"
      },
      {
        "name": "Bar Urca (salão)",
        "category": "dinner",
        "neighborhood": "Urca",
        "costBRL": 90,
        "tip": "O salão histórico por trás da famosa mureta — frutos do mar com vista pra baía · Complemento perfeito do fim de tarde na mureta"
      },
      {
        "name": "Bibi Sucos",
        "category": "lunch",
        "neighborhood": "Leblon",
        "costBRL": 40,
        "tip": "Clássico dos sucos e lanches do Leblon — parada leve entre praia e passeio"
      },
      {
        "name": "BioParque do Rio",
        "category": "morning",
        "neighborhood": "São Cristóvão",
        "costBRL": 80,
        "tip": "O zoológico renovado na Quinta da Boa Vista — imersivo e ótimo com crianças"
      },
      {
        "name": "Boteco Belmonte",
        "category": "dinner",
        "neighborhood": "Copacabana",
        "costBRL": 90,
        "tip": "As empadas gigantes são a fama da casa · Chope gelado e mesa na calçada"
      },
      {
        "name": "Braseiro da Gávea",
        "category": "lunch",
        "neighborhood": "Gávea",
        "costBRL": 100,
        "tip": "Picanha no ponto perfeito, instituição carioca · Ponto de encontro no fim de semana"
      },
      {
        "name": "Bráz Pizzaria",
        "category": "dinner",
        "neighborhood": "Jardim Botânico",
        "costBRL": 100,
        "tip": "A paulistana consagrada com casa no Rio — pão de calabresa obrigatório"
      },
      {
        "name": "Café do Alto",
        "category": "breakfast",
        "neighborhood": "Santa Teresa",
        "costBRL": 45,
        "tip": "Café da manhã nordestino no alto de Santa Teresa · Tapioca, cuscuz e bolo de rolo"
      },
      {
        "name": "Cafeína",
        "category": "breakfast",
        "neighborhood": "Ipanema",
        "costBRL": 45,
        "tip": "Café da manhã completo a duas quadras da praia de Ipanema"
      },
      {
        "name": "Capricciosa",
        "category": "dinner",
        "neighborhood": "Ipanema",
        "costBRL": 110,
        "tip": "Pizza napolitana premium que virou clássico de Ipanema · Massa fina e ingredientes importados — pedida pós-praia chique"
      },
      {
        "name": "Carioca da Gema",
        "category": "night",
        "neighborhood": "Lapa",
        "costBRL": 80,
        "tip": "O templo do samba de raiz na Lapa — música boa toda noite"
      },
      {
        "name": "Casa Cavé",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 35,
        "tip": "Confeitaria mais antiga do Rio, fundada em 1860 · Sonho e mate gelado no piso de ladrilhos originais"
      },
      {
        "name": "Casa da Feijoada",
        "category": "lunch",
        "neighborhood": "Ipanema",
        "costBRL": 130,
        "tip": "Feijoada completa servida todos os dias da semana · Caipirinha de boas-vindas na entrada"
      },
      {
        "name": "CCBB Rio",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Exposições de nível internacional num palácio no Centro histórico · A melhor carta na manga pra dia de chuva no Rio"
      },
      {
        "name": "Cervantes",
        "category": "lunch",
        "neighborhood": "Copacabana",
        "costBRL": 60,
        "tip": "O sanduíche de pernil com abacaxi é lendário · Balcão histórico aberto até de madrugada"
      },
      {
        "name": "Circo Voador",
        "category": "night",
        "neighborhood": "Lapa",
        "costBRL": 100,
        "tip": "A casa de shows histórica sob os Arcos — confira a agenda da semana"
      },
      {
        "name": "Confeitaria Colombo",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 90,
        "tip": "Belle Époque carioca desde 1894 — espelhos e vitrais originais · Salgados e doces históricos no salão de chá"
      },
      {
        "name": "Cristo Redentor (Corcovado)",
        "category": "morning",
        "neighborhood": "Cosme Velho",
        "costBRL": 115,
        "tip": "Suba de trem pelo Cosme Velho e vá cedo — antes das 9h o dia está mais limpo e vazio"
      },
      {
        "name": "Empório Jardim",
        "category": "breakfast",
        "neighborhood": "Jardim Botânico",
        "costBRL": 55,
        "tip": "Café da manhã farto e charmoso pertinho do Jardim Botânico — combina com a visita"
      },
      {
        "name": "Escadaria Selarón e Lapa",
        "category": "afternoon",
        "neighborhood": "Lapa",
        "costBRL": 0,
        "tip": "215 degraus cobertos de azulejos de mais de 60 países · Os Arcos da Lapa ficam a 5 minutos a pé"
      },
      {
        "name": "Feira de São Cristóvão",
        "category": "night",
        "neighborhood": "São Cristóvão",
        "costBRL": 60,
        "tip": "O Nordeste inteiro dentro do Rio — forró, carne de sol e repente · Sexta e sábado à noite são o auge"
      },
      {
        "name": "Ferro e Farinha",
        "category": "dinner",
        "neighborhood": "Catete",
        "costBRL": 90,
        "tip": "A pizza de fermentação natural mais celebrada do Rio — consenso de crítica e público · Casa original no Catete; unidades também em Botafogo, Leblon e Barra"
      },
      {
        "name": "Forte de Copacabana",
        "category": "afternoon",
        "neighborhood": "Copacabana",
        "costBRL": 20,
        "tip": "Museu histórico do Exército na ponta da praia · A filial da Confeitaria Colombo tem mesas de frente para o mar"
      },
      {
        "name": "Galeto Sat's",
        "category": "lunch",
        "neighborhood": "Copacabana",
        "costBRL": 80,
        "tip": "Galeto na brasa desde 1962, no balcão · A farofa de dendê é obrigatória"
      },
      {
        "name": "Garota de Ipanema",
        "category": "dinner",
        "neighborhood": "Ipanema",
        "costBRL": 120,
        "tip": "Foi aqui que Tom Jobim e Vinícius compuseram a música · Picanha na chapa é o pedido clássico"
      },
      {
        "name": "Jardim Botânico",
        "category": "morning",
        "neighborhood": "Jardim Botânico",
        "costBRL": 75,
        "tip": "A aleia de palmeiras imperiais é o cartão-postal · Orquidário e casa dos beija-flores imperdíveis"
      },
      {
        "name": "Lagoa Rodrigo de Freitas (pedalinho e quiosques)",
        "category": "afternoon",
        "neighborhood": "Lagoa",
        "costBRL": 50,
        "tip": "Pedalinho com as crianças e fim de tarde nos quiosques da orla · O cartão-postal mais tranquilo da zona sul"
      },
      {
        "name": "Marchezinho",
        "category": "dinner",
        "neighborhood": "Botafogo",
        "costBRL": 80,
        "tip": "Gastrobar descolado de Botafogo — vinhos naturais e pratos pra dividir"
      },
      {
        "name": "Mirante Dona Marta",
        "category": "morning",
        "neighborhood": "Santa Teresa",
        "costBRL": 60,
        "tip": "A vista mais completa do Rio — Cristo, Pão de Açúcar e baía num quadro só · Vá cedo pela luz e pelo trânsito"
      },
      {
        "name": "Momo Gelato",
        "category": "afternoon",
        "neighborhood": "Ipanema",
        "costBRL": 25,
        "tip": "O gelato artesanal mais disputado do Rio — sabores que mudam todo dia"
      },
      {
        "name": "Mureta da Urca",
        "category": "afternoon",
        "neighborhood": "Urca",
        "costBRL": 40,
        "tip": "Programa carioca raiz: petiscos do Bar Urca sentado na mureta · Vista da enseada de Botafogo com o Cristo ao fundo"
      },
      {
        "name": "Museu do Amanhã",
        "category": "morning",
        "neighborhood": "Centro (Praça Mauá)",
        "costBRL": 30,
        "tip": "Arquitetura futurista de Santiago Calatrava · Combine com o Boulevard Olímpico e o AquaRio ao lado"
      },
      {
        "name": "MAR — Museu de Arte do Rio",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Arte brasileira com vista pra Praça Mauá — vizinho do Museu do Amanhã · Combine os dois museus na mesma manhã"
      },
      {
        "name": "Nova Capela",
        "category": "dinner",
        "neighborhood": "Lapa",
        "costBRL": 80,
        "tip": "Clássico de 1903 — cabrito com arroz de brócolis é o prato-lenda · Abre até tarde: parada obrigatória pós-Lapa"
      },
      {
        "name": "Pão de Açúcar (bondinho)",
        "category": "afternoon",
        "neighborhood": "Urca",
        "costBRL": 170,
        "tip": "Vá no fim da tarde e assista o pôr do sol lá de cima — a Mureta da Urca fica ao lado para emendar a noite"
      },
      {
        "name": "Parque Lage",
        "category": "afternoon",
        "neighborhood": "Jardim Botânico",
        "costBRL": 0,
        "tip": "O palacete tem café no pátio interno — cenário de cinema · Vista do Cristo emoldurada pela mata"
      },
      {
        "name": "Pavão Azul",
        "category": "dinner",
        "neighborhood": "Copacabana",
        "costBRL": 60,
        "tip": "Botequim premiado — pataniscas de bacalhau e pastéis famosos · Simples, barato e delicioso: o Rio raiz"
      },
      {
        "name": "Roda de samba na Pedra do Sal",
        "category": "night",
        "neighborhood": "Saúde",
        "costBRL": 20,
        "tip": "Samba de rua no berço histórico da Pequena África — segundas e sextas · Experiência gratuita e autêntica; vá de transporte por app"
      },
      {
        "name": "Pista Cláudio Coutinho",
        "category": "morning",
        "neighborhood": "Urca",
        "costBRL": 0,
        "tip": "Caminhada fácil entre o mar e a mata aos pés do Pão de Açúcar — micos garantidos · Gratuita e plana: perfeita com crianças ou pra manhã leve"
      },
      {
        "name": "Planetário da Gávea",
        "category": "afternoon",
        "neighborhood": "Gávea",
        "costBRL": 40,
        "tip": "Sessões de cúpula que encantam crianças — programa certeiro pra dia nublado"
      },
      {
        "name": "Polis Sucos",
        "category": "lunch",
        "neighborhood": "Ipanema",
        "costBRL": 35,
        "tip": "O balcão de sucos mais amado de Ipanema — açaí e sanduíche natural pós-praia · Rápido, barato e carioca até o osso"
      },
      {
        "name": "Praia de Copacabana",
        "category": "morning",
        "neighborhood": "Copacabana",
        "costBRL": 0,
        "tip": "O calçadão de pedras portuguesas é assinatura de Burle Marx · Quiosques servem água de coco gelada o dia todo"
      },
      {
        "name": "Praia de Ipanema (Posto 9)",
        "category": "morning",
        "neighborhood": "Ipanema",
        "costBRL": 0,
        "tip": "Posto 9 é o coração jovem da praia · Aos domingos a orla fecha para carros — ótimo para pedalar"
      },
      {
        "name": "Real Gabinete Português de Leitura",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Uma das bibliotecas mais bonitas do mundo — entrada gratuita · Rápido, gratuito e inesquecível: combine com o CCBB e a Colombo"
      },
      {
        "name": "Rio Scenarium",
        "category": "night",
        "neighborhood": "Lapa",
        "costBRL": 120,
        "tip": "Casarão de antiquário com samba ao vivo — a noite mais cenográfica da Lapa · Reserve ou chegue antes das 20h"
      },
      {
        "name": "Rubaiyat Rio (Jockey)",
        "category": "dinner",
        "neighborhood": "Gávea",
        "costBRL": 180,
        "tip": "Carnes premium com vista pro Cristo iluminado no Jockey Club · Jantar de ocasião especial — romântico e imponente"
      },
      {
        "name": "The Slow Bakery",
        "category": "breakfast",
        "neighborhood": "Botafogo",
        "costBRL": 50,
        "tip": "A padaria artesanal que mudou o pão no Rio — fermentação longa e croissants de referência"
      },
      {
        "name": "Sobrenatural",
        "category": "lunch",
        "neighborhood": "Santa Teresa",
        "costBRL": 110,
        "tip": "Frutos do mar honestos no coração de Santa Teresa — moqueca respeitada · Combina com o passeio pelo bairro e o bondinho"
      },
      {
        "name": "Sushi Leblon",
        "category": "dinner",
        "neighborhood": "Leblon",
        "costBRL": 250,
        "tip": "Referência de culinária japonesa no Rio há décadas · O balcão é disputado — reserve"
      },
      {
        "name": "Talho Capixaba",
        "category": "breakfast",
        "neighborhood": "Leblon",
        "costBRL": 50,
        "tip": "Padaria-butique clássica do Leblon · Pão na chapa, sucos e sanduíches de padaria elevados"
      },
      {
        "name": "Theatro Municipal (visita guiada)",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "O interior mais suntuoso do Rio — visita guiada revela os bastidores · Confira os horários das visitas no dia"
      }
    ],
    "hotels": [
      {
        "name": "Copacabana Palace",
        "zone": "Copacabana",
        "tier": "resort",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 3.000-6.000",
        "tip": "O hotel-lenda do Brasil - piscina icônica e glamour centenário"
      },
      {
        "name": "Fairmont Rio Copacabana",
        "zone": "Copacabana",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.500-2.800",
        "tip": "Moderno no Posto 6 - piscinas com vista e estrutura família"
      },
      {
        "name": "Janeiro Hotel",
        "zone": "Leblon",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "Boutique design com vista pro mar do Leblon - romance carioca"
      },
      {
        "name": "Santa Teresa Hotel MGallery",
        "zone": "Santa Teresa",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.400-2.500",
        "tip": "Casarão colonial no alto boêmio - piscina entre árvores"
      }
    ]
  },
  "Lisboa": {
    "city": "Lisboa",
    "items": [
      {
        "name": "Passeio a pé por Alfama até o Miradouro das Portas do Sol",
        "category": "morning",
        "neighborhood": "Alfama",
        "costBRL": 0,
        "tip": "Desça do castelo se perdendo pelas vielas — o miradouro é o prêmio"
      },
      {
        "name": "Baixa, Chiado e Praça do Comércio",
        "category": "morning",
        "neighborhood": "Baixa",
        "costBRL": 0,
        "tip": "Do Rossio à Praça do Comércio pela Rua Augusta · Livraria Bertrand no Chiado é a mais antiga do mundo em atividade"
      },
      {
        "name": "Bonjardim (Rei dos Frangos)",
        "category": "dinner",
        "neighborhood": "Baixa",
        "costBRL": 80,
        "tip": "O frango de churrasco com piri-piri que virou lenda · Simples, farto e barato"
      },
      {
        "name": "Casa do Alentejo",
        "category": "lunch",
        "neighborhood": "Baixa",
        "costBRL": 110,
        "tip": "Palácio neomourisco escondido atrás de uma porta discreta · Cozinha alentejana: açorda e carne de porco à alentejana"
      },
      {
        "name": "Castelo de São Jorge",
        "category": "morning",
        "neighborhood": "Alfama",
        "costBRL": 95,
        "tip": "Vista panorâmica; subida íngreme — com crianças pequenas, considere tuk-tuk"
      },
      {
        "name": "A Cevicheria",
        "category": "lunch",
        "neighborhood": "Príncipe Real",
        "costBRL": 150,
        "tip": "Ceviches criativos do chef Kiko sob o polvo gigante do teto · Não aceita reserva — a fila anda rápido"
      },
      {
        "name": "Jantar com Fado ao vivo (Clube de Fado)",
        "category": "dinner",
        "neighborhood": "Alfama",
        "costBRL": 280,
        "tip": "Fado autêntico na Alfama com jantar completo · Silêncio absoluto durante as canções — é a etiqueta"
      },
      {
        "name": "Fábrica Coffee Roasters",
        "category": "breakfast",
        "neighborhood": "Baixa",
        "costBRL": 50,
        "tip": "Café de especialidade torrado na casa · Brunch com tostas e ovos"
      },
      {
        "name": "O Frade dos Mares",
        "category": "dinner",
        "neighborhood": "Santos",
        "costBRL": 150,
        "tip": "Peixe fresco e polvo à lagareiro elogiadíssimos · Ambiente acolhedor de bairro"
      },
      {
        "name": "Museu Calouste Gulbenkian",
        "category": "morning",
        "neighborhood": "Avenidas Novas",
        "costBRL": 60,
        "tip": "Coleção de arte do Egito antigo a Monet · Os jardins do museu são um oásis na cidade"
      },
      {
        "name": "Mosteiro dos Jerónimos",
        "category": "morning",
        "neighborhood": "Belém",
        "costBRL": 75,
        "tip": "Compre ingresso online e chegue antes das 10h — a fila cresce rápido; fecha às segundas"
      },
      {
        "name": "LX Factory",
        "category": "afternoon",
        "neighborhood": "Alcântara",
        "costBRL": 0,
        "tip": "Fábrica antiga convertida em polo criativo · A livraria Ler Devagar é cenográfica"
      },
      {
        "name": "Manteigaria",
        "category": "breakfast",
        "neighborhood": "Chiado",
        "costBRL": 25,
        "tip": "O rival moderno do pastel de Belém — muitos preferem · O sino toca quando sai fornada fresca"
      },
      {
        "name": "Miradouros: Senhora do Monte e Graça",
        "category": "afternoon",
        "neighborhood": "Graça",
        "costBRL": 0,
        "tip": "Os dois miradouros mais bonitos, a 10 minutos um do outro · Fim de tarde tem a luz dourada sobre o casario"
      },
      {
        "name": "Museu Nacional do Azulejo",
        "category": "afternoon",
        "neighborhood": "Xabregas",
        "costBRL": 45,
        "tip": "A história de Portugal contada em azulejos · O painel panorâmico de Lisboa pré-terremoto é o destaque"
      },
      {
        "name": "O Trevo (bifanas)",
        "category": "lunch",
        "neighborhood": "Chiado",
        "costBRL": 40,
        "tip": "A bifana do Bourdain — sanduíche de porco no balcão · Rápido, barato e no coração do Chiado"
      },
      {
        "name": "Oceanário de Lisboa",
        "category": "morning",
        "neighborhood": "Parque das Nações",
        "costBRL": 130,
        "tip": "Um dos melhores aquários do mundo — tanque central gigante · Ótimo programa com crianças"
      },
      {
        "name": "Pap'Açôrda",
        "category": "dinner",
        "neighborhood": "Cais do Sodré (Mercado da Ribeira)",
        "costBRL": 160,
        "tip": "Clássico moderno da cozinha portuguesa no andar do mercado · A açorda de marisco dá nome à casa"
      },
      {
        "name": "Pastéis de Belém (café da manhã)",
        "category": "breakfast",
        "neighborhood": "Belém",
        "costBRL": 35,
        "tip": "A receita original e secreta desde 1837 · Coma quente com canela e açúcar em pó"
      },
      {
        "name": "Ponto Final (Cacilhas)",
        "category": "lunch",
        "neighborhood": "Almada (barco de 10min)",
        "costBRL": 120,
        "tip": "Atravesse o Tejo de barco no Cais do Sodré · Mesas na beira do rio com Lisboa inteira de frente"
      },
      {
        "name": "Cervejaria Ramiro",
        "category": "dinner",
        "neighborhood": "Intendente",
        "costBRL": 200,
        "tip": "A catedral do marisco em Lisboa · Gambas al ajillo, sapateira e o prego no final como sobremesa"
      },
      {
        "name": "Ribeira das Naus e Cais do Sodré",
        "category": "afternoon",
        "neighborhood": "Cais do Sodré",
        "costBRL": 0,
        "tip": "Calçadão à beira do Tejo para caminhar sem pressa · O Mercado da Ribeira (Time Out) fica ao lado"
      },
      {
        "name": "Elevador de Santa Justa e Convento do Carmo",
        "category": "afternoon",
        "neighborhood": "Baixa/Chiado",
        "costBRL": 45,
        "tip": "O elevador de ferro de 1902 liga a Baixa ao Chiado · As ruínas góticas do Carmo a céu aberto são únicas"
      },
      {
        "name": "Solar dos Presuntos",
        "category": "dinner",
        "neighborhood": "Restauradores",
        "costBRL": 170,
        "tip": "Clássico lisboeta de cozinha minhota e mariscos · As paredes têm caricaturas de todos os famosos que passaram"
      },
      {
        "name": "Taberna da Rua das Flores",
        "category": "dinner",
        "neighborhood": "Chiado",
        "costBRL": 130,
        "tip": "Petiscos portugueses com toque contemporâneo · Menu no quadro muda todo dia"
      },
      {
        "name": "Time Out Market (Mercado da Ribeira)",
        "category": "lunch",
        "neighborhood": "Cais do Sodré",
        "costBRL": 100,
        "tip": "Os melhores chefs de Lisboa em bancas num mercado histórico · Cada um pede numa banca e senta junto nas mesas comunitárias"
      },
      {
        "name": "Torre de Belém",
        "category": "morning",
        "neighborhood": "Belém",
        "costBRL": 50,
        "tip": "Combine com Jerónimos na mesma manhã — 15 min a pé entre eles"
      },
      {
        "name": "Elétrico 28 (Tram histórico)",
        "category": "afternoon",
        "neighborhood": "Graça a Estrela",
        "costBRL": 20,
        "tip": "O bonde amarelo atravessa os bairros históricos · Pegue no início da linha (Martim Moniz) para conseguir lugar"
      },
      {
        "name": "Zé da Mouraria",
        "category": "lunch",
        "neighborhood": "Mouraria",
        "costBRL": 85,
        "tip": "Tasca tradicional com doses fartas · O bacalhau assado é referência na cidade"
      },
      {
        "name": "Bate-volta a Cascais + Boca do Inferno",
        "category": "morning",
        "neighborhood": "Cascais",
        "costBRL": 120,
        "tip": "Trem do Cais do Sodré pela costa — vila charmosa, praias e a falésia da Boca do Inferno · Sorvete na Santini original de Cascais fecha o passeio"
      },
      {
        "name": "Chapitô à Mesa",
        "category": "dinner",
        "neighborhood": "Alfama",
        "costBRL": 90,
        "tip": "Jantar com uma das vistas mais bonitas de Lisboa, numa escola de circo · Reserve mesa na esplanada e chegue pro pôr do sol"
      },
      {
        "name": "Dear Breakfast",
        "category": "breakfast",
        "neighborhood": "Santos",
        "costBRL": 40,
        "tip": "Brunch bonito e caprichado — a versão moderna do café da manhã lisboeta"
      },
      {
        "name": "Feira da Ladra",
        "category": "morning",
        "neighborhood": "Alfama",
        "costBRL": 20,
        "tip": "O mercado de pulgas histórico — terças e sábados, atrás do Panteão · Pechinche com simpatia; azulejos antigos são o souvenir raiz"
      },
      {
        "name": "A Ginjinha (Largo de São Domingos)",
        "category": "night",
        "neighborhood": "Rossio",
        "costBRL": 10,
        "tip": "O ritual do licor de ginja em pé, no balcão centenário — com ou sem fruta · Rápido, barato e obrigatório antes do jantar"
      },
      {
        "name": "MAAT — Museu de Arte, Arquitetura e Tecnologia",
        "category": "afternoon",
        "neighborhood": "Belém",
        "costBRL": 45,
        "tip": "O prédio-onda à beira do Tejo — arte contemporânea e telhado-mirante · Encaixa no dia de Belém, entre os Pastéis e a Torre"
      },
      {
        "name": "Miradouro de Santa Catarina (Adamastor)",
        "category": "afternoon",
        "neighborhood": "Santa Catarina",
        "costBRL": 0,
        "tip": "O pôr do sol jovem de Lisboa — violões, cerveja e o Tejo dourado"
      },
      {
        "name": "Park Bar (rooftop)",
        "category": "night",
        "neighborhood": "Bairro Alto",
        "costBRL": 50,
        "tip": "Rooftop em cima de um estacionamento — pôr do sol com vista pro Tejo · Sobe de elevador até o último andar e segue as plantas"
      },
      {
        "name": "Pavilhão do Conhecimento",
        "category": "morning",
        "neighborhood": "Parque das Nações",
        "costBRL": 60,
        "tip": "Museu de ciência interativo — crianças não querem ir embora · Combina com Oceanário e teleférico no mesmo dia"
      },
      {
        "name": "Pink Street (Rua Nova do Carvalho)",
        "category": "night",
        "neighborhood": "Cais do Sodré",
        "costBRL": 60,
        "tip": "A rua cor-de-rosa dos bares — o epicentro da noite lisboeta · Começa depois das 23h; antes disso, jantar no Time Out ao lado"
      },
      {
        "name": "Gelados Santini",
        "category": "afternoon",
        "neighborhood": "Chiado",
        "costBRL": 20,
        "tip": "A gelataria histórica de Lisboa desde 1949 — morango é a lenda"
      },
      {
        "name": "Bate-volta a Sintra (Palácio da Pena)",
        "category": "morning",
        "neighborhood": "Sintra",
        "costBRL": 180,
        "tip": "Trem da Estação do Rossio (40 min) — o palácio de conto de fadas nas montanhas · Compre ingresso do Pena com antecedência e vá CEDO; Quinta da Regaleira na sequência"
      },
      {
        "name": "Sol e Pesca (conservas)",
        "category": "dinner",
        "neighborhood": "Cais do Sodré",
        "costBRL": 45,
        "tip": "Petiscar conservas portuguesas premium num antigo armazém de pesca · Experiência 100% portuguesa antes da Pink Street"
      },
      {
        "name": "Tasca do Chico (fado vadio)",
        "category": "night",
        "neighborhood": "Bairro Alto",
        "costBRL": 35,
        "tip": "Fado espontâneo e apertado — a versão popular (e gratuita) do fado · Chegue 21h30 pra pegar lugar; consome-se chouriço e vinho"
      },
      {
        "name": "Telecabine do Parque das Nações",
        "category": "afternoon",
        "neighborhood": "Parque das Nações",
        "costBRL": 40,
        "tip": "Teleférico sobre o Tejo ligando o Oceanário à Torre Vasco da Gama"
      }
    ],
    "hotels": [
      {
        "name": "Bairro Alto Hotel",
        "zone": "Bairro Alto",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.600-2.800",
        "tip": "Boutique histórico entre o Chiado e o Bairro Alto - rooftop pro Tejo"
      },
      {
        "name": "Martinhal Lisbon Chiado",
        "zone": "Chiado",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.100-2.000",
        "tip": "O apart-hotel DESENHADO pra famílias - kids club no centro de Lisboa"
      },
      {
        "name": "Memmo Alfama",
        "zone": "Alfama",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.000-1.800",
        "tip": "Escondido na Alfama com piscina vermelha sobre os telhados"
      },
      {
        "name": "Pestana Palace",
        "zone": "Alcântara",
        "tier": "resort",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.200-2.200",
        "tip": "Palácio nacional com jardins e piscinas - viver como rei"
      }
    ]
  },
  "Orlando": {
    "city": "Orlando",
    "items": [
      {
        "name": "4 Rivers Smokehouse",
        "category": "lunch",
        "neighborhood": "Winter Park",
        "costBRL": 120,
        "tip": "O melhor barbecue texano da Flórida · Brisket defumado 18 horas é o pedido certo"
      },
      {
        "name": "Bahama Breeze",
        "category": "dinner",
        "neighborhood": "International Drive",
        "costBRL": 140,
        "tip": "Clima caribenho com música ao vivo no deck · Coconut shrimp e drinks tropicais"
      },
      {
        "name": "The Boathouse (Disney Springs)",
        "category": "dinner",
        "neighborhood": "Walt Disney World",
        "costBRL": 260,
        "tip": "Frutos do mar à beira do lago do Disney Springs · Os carros anfíbios saem do deck do restaurante"
      },
      {
        "name": "Cafe Tu Tu Tango",
        "category": "dinner",
        "neighborhood": "International Drive",
        "costBRL": 150,
        "tip": "Tapas internacionais num ateliê de artistas · Pintores trabalham ao vivo entre as mesas"
      },
      {
        "name": "The Cheesecake Factory (Mall at Millenia)",
        "category": "dinner",
        "neighborhood": "Millenia",
        "costBRL": 180,
        "tip": "O clássico americano favorito dos brasileiros · Cardápio com mais de 250 itens — porções enormes"
      },
      {
        "name": "Chicken Guy! (Disney Springs)",
        "category": "lunch",
        "neighborhood": "Walt Disney World",
        "costBRL": 90,
        "tip": "Frango crocante do chef Guy Fieri com 22 molhos · Rápido e barato para o padrão Disney"
      },
      {
        "name": "Universal CityWalk",
        "category": "afternoon",
        "neighborhood": "Universal Orlando",
        "costBRL": 0,
        "tip": "Entrada gratuita — a \"Disney Springs\" da Universal · Cinema, minigolfe e restaurantes temáticos"
      },
      {
        "name": "Disney Springs",
        "category": "afternoon",
        "neighborhood": "Walt Disney World",
        "costBRL": 0,
        "tip": "Entrada gratuita — compras, restaurantes e shows de rua · A loja World of Disney é a maior do mundo"
      },
      {
        "name": "First Watch",
        "category": "breakfast",
        "neighborhood": "Vários (Lake Buena Vista)",
        "costBRL": 80,
        "tip": "Café da manhã saudável e farto, favorito local · Sucos prensados na hora e omeletes generosos"
      },
      {
        "name": "Ford's Garage",
        "category": "lunch",
        "neighborhood": "International Drive",
        "costBRL": 130,
        "tip": "Hamburgueria temática de oficina Ford anos 20 · Carros clássicos pendurados sobre o bar"
      },
      {
        "name": "The Glass Knife",
        "category": "lunch",
        "neighborhood": "Winter Park",
        "costBRL": 120,
        "tip": "Café e confeitaria premiada com salgados de brunch · As sobremesas na vitrine são obras de arte"
      },
      {
        "name": "Chef Art Smith's Homecomin'",
        "category": "dinner",
        "neighborhood": "Walt Disney World (Disney Springs)",
        "costBRL": 220,
        "tip": "Comfort food sulista do chef Art Smith · O frango frito é considerado o melhor da Flórida"
      },
      {
        "name": "ICON Park (International Drive)",
        "category": "afternoon",
        "neighborhood": "International Drive",
        "costBRL": 160,
        "tip": "A roda-gigante The Wheel tem vista de toda Orlando · Museu de cera e aquário SEA LIFE no mesmo complexo"
      },
      {
        "name": "Lake Eola Park (Downtown)",
        "category": "morning",
        "neighborhood": "Downtown Orlando",
        "costBRL": 0,
        "tip": "O lago com a fonte é o cartão-postal de Orlando fora dos parques · Pedalinhos em forma de cisne"
      },
      {
        "name": "Magic Kingdom (dia inteiro)",
        "category": "morning",
        "neighborhood": "Walt Disney World",
        "costBRL": 650,
        "tip": "Reserve o parque no app My Disney Experience — ingresso sem reserva não entra · Chegue antes da abertura (rope drop) e deixe o castelo iluminado e os fogos para o fim"
      },
      {
        "name": "Maple Street Biscuit Company",
        "category": "breakfast",
        "neighborhood": "Vários (I-Drive / Winter Park)",
        "costBRL": 70,
        "tip": "Biscuits artesanais com combinações criativas · O \"Five and Dime\" com frango frito é o pedido certo"
      },
      {
        "name": "Old Town Kissimmee",
        "category": "afternoon",
        "neighborhood": "Kissimmee",
        "costBRL": 60,
        "tip": "Parque de diversões retrô à moda antiga · Sábado à noite tem desfile de carros clássicos"
      },
      {
        "name": "Prato",
        "category": "lunch",
        "neighborhood": "Winter Park (Park Avenue)",
        "costBRL": 160,
        "tip": "Italiano contemporâneo na charmosa Park Avenue · Massas frescas e pizzas de forno a lenha"
      },
      {
        "name": "Orlando Premium Outlets (Vineland)",
        "category": "afternoon",
        "neighborhood": "Vineland Ave",
        "costBRL": 0,
        "tip": "O outlet favorito dos brasileiros — Nike, Coach, Tommy · Vá de manhã em dia de semana para evitar multidão"
      },
      {
        "name": "Raglan Road (Disney Springs)",
        "category": "dinner",
        "neighborhood": "Walt Disney World",
        "costBRL": 190,
        "tip": "Pub irlandês com música e sapateado ao vivo toda noite · Fish and chips de referência"
      },
      {
        "name": "Se7en Bites",
        "category": "breakfast",
        "neighborhood": "Milk District",
        "costBRL": 90,
        "tip": "Brunch sulista premiado — apareceu em vários programas de TV · O biscuit com gravy é o carro-chefe"
      },
      {
        "name": "Sofrito Latin Cafe",
        "category": "lunch",
        "neighborhood": "International Drive",
        "costBRL": 100,
        "tip": "Comida porto-riquenha farta e saborosa · O mofongo é o prato para conhecer"
      },
      {
        "name": "Universal Studios + Islands of Adventure",
        "category": "morning",
        "neighborhood": "Universal Orlando",
        "costBRL": 680,
        "tip": "O passe park-to-park libera o trem do Harry Potter entre os dois parques — é a atração · Single rider corta filas pela metade para os maiores"
      },
      {
        "name": "Winter Park e Scenic Boat Tour",
        "category": "morning",
        "neighborhood": "Winter Park",
        "costBRL": 110,
        "tip": "O lado charmoso e arborizado da região · O passeio de barco atravessa canais entre mansões"
      },
      {
        "name": "Yard House (ICON Park)",
        "category": "dinner",
        "neighborhood": "International Drive",
        "costBRL": 160,
        "tip": "Mais de 100 torneiras de chope artesanal · Cardápio americano extenso que agrada todo mundo"
      },
      {
        "name": "Airboat no Boggy Creek",
        "category": "morning",
        "neighborhood": "Kissimmee",
        "costBRL": 250,
        "tip": "Aerobarco pelos pântanos — jacarés e águias no habitat de verdade"
      },
      {
        "name": "Celebration Town",
        "category": "afternoon",
        "neighborhood": "Celebration",
        "costBRL": 30,
        "tip": "A cidade planejada pela Disney — calçadas perfeitas, lago e sorvete · Charmosa pra tarde leve pós-parque"
      },
      {
        "name": "Mini-golf Congo River",
        "category": "night",
        "neighborhood": "I-Drive",
        "costBRL": 80,
        "tip": "O mini-golf temático com jacarés de verdade — o programa noturno leve da I-Drive"
      },
      {
        "name": "The Donut King",
        "category": "breakfast",
        "neighborhood": "Winter Park",
        "costBRL": 20,
        "tip": "Donuts quentes saindo de madrugada — culto local legítimo"
      },
      {
        "name": "East End Market",
        "category": "lunch",
        "neighborhood": "Audubon Park",
        "costBRL": 60,
        "tip": "O food hall dos produtores locais — o lado foodie de Orlando fora do circuito turístico"
      },
      {
        "name": "Gatorland",
        "category": "morning",
        "neighborhood": "South Orlando",
        "costBRL": 180,
        "tip": "O parque dos jacarés raiz da Flórida — shows e tirolesa sobre eles"
      },
      {
        "name": "Jeremiahs Italian Ice",
        "category": "night",
        "neighborhood": "várias unidades",
        "costBRL": 15,
        "tip": "O gelato-ice da Flórida que os locais idolatram — camadas com soft serve"
      },
      {
        "name": "Day-trip Kennedy Space Center",
        "category": "morning",
        "neighborhood": "Cabo Canaveral",
        "costBRL": 400,
        "tip": "Ônibus espacial Atlantis de verdade e foguetes na garagem — 1h de carro · Reserve o dia inteiro; chegue na abertura"
      },
      {
        "name": "Harry P. Leu Gardens",
        "category": "morning",
        "neighborhood": "Audubon Park",
        "costBRL": 60,
        "tip": "20 hectares de jardins e camélias à beira do lago — o respiro verde da cidade"
      },
      {
        "name": "Medieval Times (dinner show)",
        "category": "night",
        "neighborhood": "Kissimmee",
        "costBRL": 350,
        "tip": "Jantar assistindo justas de cavaleiros — brega, delicioso e as crianças amam"
      },
      {
        "name": "Orlando Science Center",
        "category": "morning",
        "neighborhood": "Loch Haven",
        "costBRL": 150,
        "tip": "4 andares de ciência mão-na-massa — o melhor dia de chuva com crianças"
      },
      {
        "name": "The Wheel no ICON Park (noite)",
        "category": "night",
        "neighborhood": "I-Drive",
        "costBRL": 120,
        "tip": "A roda-gigante iluminada — Orlando inteira aos seus pés à noite"
      },
      {
        "name": "Winter Garden + Farmers Market",
        "category": "morning",
        "neighborhood": "Winter Garden",
        "costBRL": 40,
        "tip": "A cidadezinha charmosa com mercado de sábado e ciclovia — a Flórida de interior · Sábado de manhã é o auge"
      }
    ],
    "hotels": [
      {
        "name": "Disney Art of Animation Resort",
        "zone": "Disney World",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.000-1.700",
        "tip": "Suítes temáticas Carros/Nemo - imersão Disney com transporte grátis"
      },
      {
        "name": "Universal Cabana Bay Beach Resort",
        "zone": "Universal",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 800-1.400",
        "tip": "Retrô anos 50 com lazy river - o melhor valor da Universal (early access!)"
      },
      {
        "name": "Drury Plaza Hotel Disney Springs",
        "zone": "Lake Buena Vista",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Refeições e happy hour INCLUSOS - a conta fecha bonito pra família"
      },
      {
        "name": "Four Seasons Resort Orlando",
        "zone": "Disney World",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 3.500-6.500",
        "tip": "O luxo dentro da Disney - lazy river e adults pool separada"
      },
      {
        "name": "Hyatt Regency Grand Cypress",
        "zone": "Lake Buena Vista",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.200-2.000",
        "tip": "Piscina-caverna com tobogãs a minutos da Disney"
      }
    ]
  },
  "Tóquio": {
    "city": "Tóquio",
    "items": [
      {
        "name": "Ameyoko (mercado de rua)",
        "category": "afternoon",
        "neighborhood": "Ueno",
        "costBRL": 40,
        "tip": "O mercado pós-guerra sob os trilhos — pescado, doces e pechincha barulhenta"
      },
      {
        "name": "Chatei Hatou (kissaten)",
        "category": "breakfast",
        "neighborhood": "Shibuya",
        "costBRL": 45,
        "tip": "A cafeteria de outra era — café coado em cerimônia e chiffon cake, silêncio reverente"
      },
      {
        "name": "Tokyo DisneySea (dia inteiro)",
        "category": "morning",
        "neighborhood": "Urayasu",
        "costBRL": 450,
        "tip": "O parque Disney mais bonito do mundo — só existe aqui · Compre datado; app do parque pros tempos de fila"
      },
      {
        "name": "Fuunji (tsukemen)",
        "category": "lunch",
        "neighborhood": "Shinjuku",
        "costBRL": 60,
        "tip": "O tsukemen de peregrinação — macarrão pra mergulhar no caldo denso de frango e peixe · Fila de 30-60 min que os locais encaram felizes"
      },
      {
        "name": "Museu Ghibli (Mitaka)",
        "category": "morning",
        "neighborhood": "Mitaka",
        "costBRL": 80,
        "tip": "O mundo de Totoro e Miyazaki em museu-obra-de-arte · ⚠️ Ingressos ANTECIPADOS (meses): venda dia 10 de cada mês para o mês seguinte"
      },
      {
        "name": "Day-trip a Hakone (onsen + Fuji)",
        "category": "morning",
        "neighborhood": "Hakone",
        "costBRL": 250,
        "tip": "Teleférico, lago com vista do Fuji e banho termal — o respiro das montanhas · Hakone Free Pass compensa; Fuji aparece de manhã"
      },
      {
        "name": "Hoppy Street (Asakusa)",
        "category": "lunch",
        "neighborhood": "Asakusa",
        "costBRL": 60,
        "tip": "A rua dos izakayas diurnos — guisado de carne e cerveja depois do Senso-ji"
      },
      {
        "name": "Parque Inokashira (Kichijoji)",
        "category": "morning",
        "neighborhood": "Kichijoji",
        "costBRL": 20,
        "tip": "Pedalinhos-cisne, cerejeiras e o zoo pequenino — a manhã de domingo dos tokyotas · Porta de entrada do Museu Ghibli ao lado"
      },
      {
        "name": "Day-trip a Kamakura",
        "category": "morning",
        "neighborhood": "Kamakura",
        "costBRL": 120,
        "tip": "O Grande Buda de bronze + templos + praia — 1h de trem · Alugue bici ou use o trenzinho Enoden até Enoshima"
      },
      {
        "name": "Kappabashi (rua da cozinha)",
        "category": "morning",
        "neighborhood": "Asakusa",
        "costBRL": 50,
        "tip": "A rua das facas japonesas e da comida de plástico — souvenir de quem cozinha"
      },
      {
        "name": "Rio Meguro (sakura ou passeio)",
        "category": "afternoon",
        "neighborhood": "Nakameguro",
        "costBRL": 20,
        "tip": "Na sakura, o túnel rosa mais bonito de Tóquio; fora dela, cafés e lojinhas na margem · Sazonal no auge (fim mar-início abr)"
      },
      {
        "name": "Miraikan (Museu do Futuro)",
        "category": "morning",
        "neighborhood": "Odaiba",
        "costBRL": 60,
        "tip": "Robôs, espaço e o globo de LED gigante — ciência que criança e adulto amam"
      },
      {
        "name": "Santuário Nezu (torii escondidos)",
        "category": "morning",
        "neighborhood": "Nezu",
        "costBRL": 0,
        "tip": "O corredor de torii vermelhos sem as multidões de Kyoto — azaleias em abril"
      },
      {
        "name": "Omoide Yokocho (beco dos yakitoris)",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 80,
        "tip": "O beco da memória — espetinhos na fumaça em barraquinhas de 6 lugares desde 1940"
      },
      {
        "name": "Pokémon Center Mega Tokyo",
        "category": "afternoon",
        "neighborhood": "Ikebukuro",
        "costBRL": 60,
        "tip": "A loja-santuário — Pikachus do chão ao teto; peluche exclusivo garante lágrima de alegria"
      },
      {
        "name": "Manhã de sumô em Ryogoku",
        "category": "morning",
        "neighborhood": "Ryogoku",
        "costBRL": 50,
        "tip": "O bairro do sumô — museu no Kokugikan e chanko-nabe (o ensopado dos lutadores) no almoço · Treinos matinais precisam agendamento; museu é livre"
      },
      {
        "name": "Shimokitazawa (vintage)",
        "category": "afternoon",
        "neighborhood": "Shimokitazawa",
        "costBRL": 60,
        "tip": "O bairro dos brechós, discos e cafés — a Tóquio alternativa e sem pressa"
      },
      {
        "name": "Tokyo Skytree",
        "category": "afternoon",
        "neighborhood": "Sumida",
        "costBRL": 150,
        "tip": "A torre mais alta do Japão — 634m com aquário e shopping na base"
      },
      {
        "name": "teamLab Planets (Toyosu)",
        "category": "afternoon",
        "neighborhood": "Toyosu",
        "costBRL": 120,
        "tip": "A versão descalça-na-água do teamLab — imersão total, joelhos molhados · Diferente do Borderless; compre datado"
      },
      {
        "name": "Onsen urbano (Thermae-Yu Shinjuku)",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 90,
        "tip": "Banho termal de verdade no meio de Shinjuku — o reset perfeito pós-caminhada · Tatuagem pode ter restrição: verificar política"
      },
      {
        "name": "Mirante grátis do Governo Metropolitano",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 0,
        "tip": "45º andar de graça — no dia limpo, o Fuji no horizonte; à noite, o mar de luzes"
      },
      {
        "name": "Sushi em pé (Uogashi Nihon-Ichi)",
        "category": "lunch",
        "neighborhood": "Shibuya",
        "costBRL": 50,
        "tip": "Sushi de balcão, em pé, rápido e honesto — o almoço-relâmpago dos locais"
      },
      {
        "name": "Onigiri Asakusa Yadoroku",
        "category": "lunch",
        "neighborhood": "Asakusa",
        "costBRL": 30,
        "tip": "A casa de onigiri mais antiga de Tóquio (1954) — o triângulo de arroz elevado a arte"
      },
      {
        "name": "Yanaka Ginza (Tóquio retrô)",
        "category": "afternoon",
        "neighborhood": "Yanaka",
        "costBRL": 40,
        "tip": "O bairro que sobreviveu ao tempo — comércio de rua, gatos e croquetes de 100 ienes"
      },
      {
        "name": "Afuri Ramen (yuzu)",
        "category": "dinner",
        "neighborhood": "Ebisu",
        "costBRL": 75,
        "tip": "Ramen leve de caldo com yuzu — refrescante e único · Pedido na máquina de tickets na entrada"
      },
      {
        "name": "Akihabara Electric Town",
        "category": "afternoon",
        "neighborhood": "Akihabara",
        "costBRL": 0,
        "tip": "Paraíso de eletrônicos e anime · Maid cafés são experiência única"
      },
      {
        "name": "Bills (Pancakes)",
        "category": "breakfast",
        "neighborhood": "Omotesando",
        "costBRL": 120,
        "tip": "Ricotta pancakes mundialmente famosos · Fila de 30min nos fins de semana"
      },
      {
        "name": "Depachika do Isetan (food hall)",
        "category": "lunch",
        "neighborhood": "Shinjuku",
        "costBRL": 90,
        "tip": "O porão gastronômico da loja de departamento mais famosa do Japão · Bentôs de nível estrelado por preço de almoço"
      },
      {
        "name": "Passeio por Ginza",
        "category": "afternoon",
        "neighborhood": "Ginza",
        "costBRL": 0,
        "tip": "A avenida mais elegante do Japão · Fim de semana a rua principal fecha para pedestres"
      },
      {
        "name": "Gonpachi (Kill Bill)",
        "category": "dinner",
        "neighborhood": "Roppongi",
        "costBRL": 250,
        "tip": "Cenário do filme Kill Bill · Yakitori e soba são excelentes"
      },
      {
        "name": "Gyukaku (yakiniku)",
        "category": "dinner",
        "neighborhood": "Shibuya",
        "costBRL": 160,
        "tip": "Churrasco japonês grelhado na própria mesa · Peça o combo de cortes para provar variedade"
      },
      {
        "name": "Harajuku & Takeshita Street",
        "category": "afternoon",
        "neighborhood": "Harajuku",
        "costBRL": 0,
        "tip": "Moda kawaii e cultura jovem · Crepe de Harajuku é tradição"
      },
      {
        "name": "Ichiran Ramen",
        "category": "lunch",
        "neighborhood": "Shibuya",
        "costBRL": 70,
        "tip": "Cabines individuais para focar no ramen · Peça chashu extra"
      },
      {
        "name": "Izakaya em Yurakucho",
        "category": "dinner",
        "neighborhood": "Yurakucho",
        "costBRL": 150,
        "tip": "Debaixo dos trilhos do trem · Atmosfera autêntica de salaryman"
      },
      {
        "name": "Karaoke em Shibuya",
        "category": "night",
        "neighborhood": "Shibuya",
        "costBRL": 80,
        "tip": "Big Echo ou Karaoke Kan · Salas privativas - sem vergonha!"
      },
      {
        "name": "Café da manhã no Konbini",
        "category": "breakfast",
        "neighborhood": "Qualquer bairro",
        "costBRL": 30,
        "tip": "7-Eleven, Lawson ou FamilyMart · Onigiri e café são deliciosos"
      },
      {
        "name": "Kura Sushi (esteira gigante)",
        "category": "dinner",
        "neighborhood": "Asakusa",
        "costBRL": 80,
        "tip": "A cada 5 pratos, um gashapon de brinde — jantar vira brincadeira · Cardápio com fotos, fácil para crianças"
      },
      {
        "name": "Tonkatsu Maisen",
        "category": "lunch",
        "neighborhood": "Omotesando",
        "costBRL": 110,
        "tip": "O tonkatsu mais famoso de Tóquio, num antigo balneário · Corte kurobuta derrete na boca"
      },
      {
        "name": "Meiji Jingu",
        "category": "morning",
        "neighborhood": "Harajuku",
        "costBRL": 0,
        "tip": "Floresta no coração de Tóquio · Às vezes há casamentos tradicionais"
      },
      {
        "name": "Monjayaki em Tsukishima",
        "category": "dinner",
        "neighborhood": "Tsukishima",
        "costBRL": 100,
        "tip": "A rua Monja Street tem dezenas de casas do prato típico de Tóquio · Você mesmo prepara na chapa da mesa"
      },
      {
        "name": "Odaiba: Gundam e orla da baía",
        "category": "afternoon",
        "neighborhood": "Odaiba",
        "costBRL": 30,
        "tip": "O Gundam gigante em tamanho real se move em horários marcados · Vista da Rainbow Bridge ao entardecer"
      },
      {
        "name": "Robot Restaurant",
        "category": "dinner",
        "neighborhood": "Shinjuku",
        "costBRL": 350,
        "tip": "Show bizarro e divertido · Comida é secundária ao espetáculo"
      },
      {
        "name": "Templo Senso-ji",
        "category": "morning",
        "neighborhood": "Asakusa",
        "costBRL": 0,
        "tip": "Chegue antes das 8h para fotos sem multidão · Nakamise-dori tem souvenirs tradicionais"
      },
      {
        "name": "Shibuya Crossing",
        "category": "afternoon",
        "neighborhood": "Shibuya",
        "costBRL": 0,
        "tip": "Atravessamento mais movimentado do mundo · Starbucks no 2º andar tem melhor vista"
      },
      {
        "name": "Shibuya Sky (mirante)",
        "category": "night",
        "neighborhood": "Shibuya",
        "costBRL": 100,
        "tip": "Vista 360° de Tóquio à noite · Reserve horário do pôr do sol"
      },
      {
        "name": "Jardim Shinjuku Gyoen",
        "category": "afternoon",
        "neighborhood": "Shinjuku",
        "costBRL": 25,
        "tip": "Oásis de calma no meio do caos de Shinjuku · Três jardins: japonês, francês e inglês"
      },
      {
        "name": "Golden Gai (Shinjuku)",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 100,
        "tip": "Vielas com bares minúsculos · Cada bar tem tema diferente"
      },
      {
        "name": "Sushi Dai",
        "category": "lunch",
        "neighborhood": "Toyosu Market",
        "costBRL": 200,
        "tip": "Fila de 3h mas vale a pena · Omakase é a melhor escolha"
      },
      {
        "name": "teamLab Borderless",
        "category": "morning",
        "neighborhood": "Odaiba",
        "costBRL": 150,
        "tip": "Reserve ingresso com 2 semanas de antecedência · Use roupas claras para fotos"
      },
      {
        "name": "Tempura Kondo",
        "category": "lunch",
        "neighborhood": "Ginza",
        "costBRL": 350,
        "tip": "Melhor tempura de Tóquio · Reserve com antecedência"
      },
      {
        "name": "Tsukiji Outer Market",
        "category": "breakfast",
        "neighborhood": "Tsukiji",
        "costBRL": 80,
        "tip": "Chegue às 7h para pegar fresquinho · Tamagoyaki (omelete) é imperdível"
      },
      {
        "name": "Parque Ueno e Museu Nacional",
        "category": "morning",
        "neighborhood": "Ueno",
        "costBRL": 45,
        "tip": "O maior acervo de arte japonesa do mundo · Na primavera é o epicentro das cerejeiras"
      },
      {
        "name": "Uobei Sushi (esteira digital)",
        "category": "lunch",
        "neighborhood": "Shibuya",
        "costBRL": 70,
        "tip": "Pedido no tablet e o sushi chega de trenzinho — as crianças amam · Pratos a partir de ¥110"
      }
    ],
    "hotels": [
      {
        "name": "Hoshinoya Tokyo",
        "zone": "Otemachi",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.500-6.000",
        "tip": "Ryokan de luxo vertical - onsen no topo de um arranha-céu"
      },
      {
        "name": "Mimaru Tokyo Ueno",
        "zone": "Ueno",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Apart-hotel DESENHADO pra famílias - quartos amplos e cozinha (raridade no Japão)"
      },
      {
        "name": "Park Hyatt Tokyo",
        "zone": "Shinjuku",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 2.800-5.000",
        "tip": "O hotel de Lost in Translation - piscina no céu e o bar New York"
      }
    ]
  },
  "Roma": {
    "city": "Roma",
    "items": [
      {
        "name": "Bioparco (Villa Borghese)",
        "category": "morning",
        "neighborhood": "Villa Borghese",
        "costBRL": 60,
        "tip": "O zoológico dentro da Villa Borghese — fecha o combo com barquinho e bicicleta"
      },
      {
        "name": "Musei Capitolini",
        "category": "morning",
        "neighborhood": "Campidoglio",
        "costBRL": 45,
        "tip": "Os museus da colina de Michelangelo — a Loba, o Marco Aurélio e a vista do Fórum · O plano perfeito de chuva com história de sobra"
      },
      {
        "name": "Galleria Doria Pamphilj",
        "category": "afternoon",
        "neighborhood": "Via del Corso",
        "costBRL": 50,
        "tip": "Palácio privado com Caravaggios e o Velázquez do Papa — quase sem filas · O segredo bem guardado dos museus romanos"
      },
      {
        "name": "Explora — Museo dei Bambini",
        "category": "morning",
        "neighborhood": "Flaminio",
        "costBRL": 50,
        "tip": "O museu das crianças de Roma — tudo é pra tocar · Sessões com horário marcado: reserve online"
      },
      {
        "name": "Freni e Frizioni (aperitivo)",
        "category": "night",
        "neighborhood": "Trastevere",
        "costBRL": 25,
        "tip": "O aperitivo clássico de Trastevere — drink + buffet numa antiga oficina · Das 19h às 22h; depois, as vielas são suas"
      },
      {
        "name": "Frigidarium",
        "category": "night",
        "neighborhood": "Navona",
        "costBRL": 10,
        "tip": "O gelato banhado em chocolate perto da Piazza Navona — fila que anda rápido"
      },
      {
        "name": "Giolitti",
        "category": "afternoon",
        "neighborhood": "Centro Storico",
        "costBRL": 15,
        "tip": "A gelateria mais famosa de Roma desde 1900 — a dois passos do Pantheon · Paga no caixa primeiro, escolhe depois — e aceita a panna"
      },
      {
        "name": "Enoteca em Monti (La Barrique)",
        "category": "night",
        "neighborhood": "Monti",
        "costBRL": 45,
        "tip": "Vinhos naturais no bairro mais charmoso — o lado wine bar de Roma"
      },
      {
        "name": "Barquinho no Laghetto di Villa Borghese",
        "category": "afternoon",
        "neighborhood": "Villa Borghese",
        "costBRL": 15,
        "tip": "Remar no laguinho do templo de Esculápio — o clichê romântico que funciona"
      },
      {
        "name": "Mercato Centrale (Termini)",
        "category": "lunch",
        "neighborhood": "Termini",
        "costBRL": 35,
        "tip": "Food hall de artesãos dentro da estação — trapizzino, pasta e pizza al taglio · Salva refeição pré-trem ou dia de chuva"
      },
      {
        "name": "Nonna Betta (Ghetto)",
        "category": "lunch",
        "neighborhood": "Ghetto Ebraico",
        "costBRL": 60,
        "tip": "Carciofo alla giudia no coração do Ghetto — a alcachofra frita histórica · Passeie pelo Portico dOttavia depois"
      },
      {
        "name": "Terrazza del Pincio ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Villa Borghese",
        "costBRL": 0,
        "tip": "A vista da Piazza del Popolo com São Pedro ao fundo — o entardecer clássico"
      },
      {
        "name": "Pompi — il Re del Tiramisù",
        "category": "afternoon",
        "neighborhood": "Spagna",
        "costBRL": 12,
        "tip": "O \"rei do tiramisù\" — clássico e de pistache pra viagem"
      },
      {
        "name": "Supplizio",
        "category": "lunch",
        "neighborhood": "Centro Storico",
        "costBRL": 15,
        "tip": "O supplì gourmet do chef Arcangelo — street food romana elevada"
      },
      {
        "name": "La Casa del Caffè Tazza d'Oro",
        "category": "breakfast",
        "neighborhood": "Pantheon",
        "costBRL": 8,
        "tip": "O granita di caffè com panna em frente ao Pantheon — ritual de verão romano"
      },
      {
        "name": "Armando al Pantheon",
        "category": "lunch",
        "neighborhood": "Pantheon",
        "costBRL": 150,
        "tip": "Tradicional desde 1961 · Reserve com antecedência"
      },
      {
        "name": "Aventino: Jardim das Laranjeiras e Buraco da Fechadura",
        "category": "afternoon",
        "neighborhood": "Aventino",
        "costBRL": 0,
        "tip": "Espie pelo buraco da fechadura dos Cavaleiros de Malta — a cúpula emoldurada · O Giardino degli Aranci tem vista serena da cidade"
      },
      {
        "name": "Mercado de Campo de Fiori",
        "category": "morning",
        "neighborhood": "Centro Storico",
        "costBRL": 0,
        "tip": "Mercado de rua histórico — frutas, flores e especiarias · Prove o suco de romã espremido na hora"
      },
      {
        "name": "Castel Sant Angelo",
        "category": "morning",
        "neighborhood": "Vaticano/Prati",
        "costBRL": 85,
        "tip": "Mausoléu, fortaleza e castelo em 2 mil anos de camadas · O terraço tem uma das melhores vistas de Roma"
      },
      {
        "name": "Coliseu e Fórum Romano",
        "category": "morning",
        "neighborhood": "Centro Storico",
        "costBRL": 110,
        "tip": "Ingresso combinado cobre Coliseu + Fórum + Palatino; compre online com horário marcado — a fila sem reserva come a manhã"
      },
      {
        "name": "Da Enzo al 29",
        "category": "lunch",
        "neighborhood": "Trastevere",
        "costBRL": 120,
        "tip": "Cacio e pepe memorável · Fila enorme - chegue às 12:30"
      },
      {
        "name": "Da Francesco (Piazza del Fico)",
        "category": "dinner",
        "neighborhood": "Centro Storico",
        "costBRL": 120,
        "tip": "Trattoria histórica numa pracinha charmosa · Antipasti fartos e massas clássicas"
      },
      {
        "name": "Pizzeria Da Remo",
        "category": "dinner",
        "neighborhood": "Testaccio",
        "costBRL": 60,
        "tip": "A pizza romana fininha e crocante em estado puro · Barata, barulhenta e perfeita"
      },
      {
        "name": "Escadaria de Espanha e Via del Corso",
        "category": "afternoon",
        "neighborhood": "Piazza di Spagna",
        "costBRL": 0,
        "tip": "A escadaria mais famosa do mundo — sentar é proibido, multa real · Via Condotti ao lado é a rua do luxo"
      },
      {
        "name": "Felice a Testaccio",
        "category": "dinner",
        "neighborhood": "Testaccio",
        "costBRL": 140,
        "tip": "O cacio e pepe é finalizado na sua mesa — teatro puro · Instituição de 1936, reserva obrigatória"
      },
      {
        "name": "Osteria da Fortunata",
        "category": "lunch",
        "neighborhood": "Centro Storico",
        "costBRL": 110,
        "tip": "A senhora fazendo massa fresca na vitrine é o cartão de visita · Cacio e pepe e carbonara de referência"
      },
      {
        "name": "Galleria Borghese",
        "category": "morning",
        "neighborhood": "Villa Borghese",
        "costBRL": 95,
        "tip": "Berninis e Caravaggios na coleção mais elegante de Roma · Ingresso SÓ com reserva antecipada — sessões de 2h"
      },
      {
        "name": "Gelato noturno em Piazza Navona",
        "category": "night",
        "neighborhood": "Centro Storico",
        "costBRL": 40,
        "tip": "Giolitti ou Frigidarium são excelentes · Evite gelaterias muito coloridas"
      },
      {
        "name": "Janículo ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Gianicolo",
        "costBRL": 0,
        "tip": "A vista panorâmica clássica de Roma inteira · Suba a pé de Trastevere em 15 minutos"
      },
      {
        "name": "Mercato Testaccio",
        "category": "lunch",
        "neighborhood": "Testaccio",
        "costBRL": 70,
        "tip": "O mercado onde os romanos realmente comem · Bancas de street food premiadas"
      },
      {
        "name": "Osteria Bonelli",
        "category": "dinner",
        "neighborhood": "Torpignattara",
        "costBRL": 90,
        "tip": "A osteria que os romanos escondem dos turistas · Cardápio no quadro-negro, preços honestos"
      },
      {
        "name": "Panteão e centro histórico",
        "category": "morning",
        "neighborhood": "Centro Storico",
        "costBRL": 30,
        "tip": "A cúpula de 2 mil anos com o óculo aberto — entre cedo · Caminhe até a Piazza Navona e o Campo de Fiori"
      },
      {
        "name": "Pizzarium Bonci",
        "category": "lunch",
        "neighborhood": "Vaticano/Prati",
        "costBRL": 65,
        "tip": "A pizza al taglio mais famosa do mundo, do mestre Bonci · Pesa-se e come-se em pé — combine com o Vaticano ao lado"
      },
      {
        "name": "Pasticceria Regoli",
        "category": "breakfast",
        "neighborhood": "Esquilino",
        "costBRL": 40,
        "tip": "Desde 1916 — o maritozzo com panna mais famoso de Roma · Café em pé no balcão, à moda italiana"
      },
      {
        "name": "Roscioli Caffè",
        "category": "breakfast",
        "neighborhood": "Campo de Fiori",
        "costBRL": 50,
        "tip": "Cornetto recheado divino · Padaria premiada"
      },
      {
        "name": "Roscioli Salumeria",
        "category": "dinner",
        "neighborhood": "Centro Storico",
        "costBRL": 200,
        "tip": "Carbonara perfeita · Seleção de queijos e vinhos excelente"
      },
      {
        "name": "Basílica de San Pietro",
        "category": "morning",
        "neighborhood": "Vaticano",
        "costBRL": 0,
        "tip": "Entrada gratuita; suba à cúpula cedo e emende com os Museus na mesma manhã"
      },
      {
        "name": "Sant'Eustachio Il Caffè",
        "category": "breakfast",
        "neighborhood": "Centro Storico",
        "costBRL": 30,
        "tip": "Melhor café de Roma · Gran Caffè já vem adoçado"
      },
      {
        "name": "Tonnarello",
        "category": "dinner",
        "neighborhood": "Trastevere",
        "costBRL": 120,
        "tip": "O clássico de Trastevere — tonnarelli cacio e pepe servido na frigideira · Mesas na viela com músico de rua"
      },
      {
        "name": "Trapizzino (Testaccio)",
        "category": "lunch",
        "neighborhood": "Testaccio",
        "costBRL": 50,
        "tip": "Invenção romana: triângulo de pizza recheado de clássicos · O de rabada e o de frango à cacciatora são os campeões"
      },
      {
        "name": "Jantar em Trastevere",
        "category": "dinner",
        "neighborhood": "Trastevere",
        "costBRL": 180,
        "tip": "Bairro mais charmoso para jantar · Escolha qualquer trattoria com locais"
      },
      {
        "name": "Noite em Trastevere",
        "category": "night",
        "neighborhood": "Trastevere",
        "costBRL": 60,
        "tip": "Bares e vida noturna local · Piazza Santa Maria é o point"
      },
      {
        "name": "Trastevere: vielas e Santa Maria",
        "category": "afternoon",
        "neighborhood": "Trastevere",
        "costBRL": 0,
        "tip": "Perca-se nas vielas de pedra e hera · A basílica de Santa Maria tem mosaicos dourados do século XII"
      },
      {
        "name": "Fontana di Trevi & Centro",
        "category": "afternoon",
        "neighborhood": "Centro Storico",
        "costBRL": 0,
        "tip": "Jogue moeda de costas para voltar · Vá à noite para menos gente"
      },
      {
        "name": "Museus do Vaticano e Capela Sistina",
        "category": "morning",
        "neighborhood": "Vaticano",
        "costBRL": 150,
        "tip": "Reserve o primeiro horário e vá direto à Sistina antes das multidões; ombros e joelhos cobertos"
      },
      {
        "name": "Villa Borghese",
        "category": "afternoon",
        "neighborhood": "Pinciano",
        "costBRL": 80,
        "tip": "Parque lindo para descansar · Galeria Borghese precisa reserva"
      }
    ],
    "hotels": [
      {
        "name": "Hotel Artemide",
        "zone": "Via Nazionale",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "O queridinho de avaliações - rooftop e serviço acima do preço"
      },
      {
        "name": "Hotel de Russie",
        "zone": "Popolo",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.000-5.500",
        "tip": "Jardins secretos entre o Popolo e a Spagna - refúgio de estrelas"
      },
      {
        "name": "Hotel Santa Maria",
        "zone": "Trastevere",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Claustro com laranjeiras em Trastevere - térreo e tranquilo pra família"
      }
    ]
  },
  "Salvador": {
    "city": "Salvador",
    "items": [
      {
        "name": "Acarajé da Cira",
        "category": "afternoon",
        "neighborhood": "Itapuã",
        "costBRL": 30,
        "tip": "A eterna rival (e prima) da Dinha — acarajé quente saindo na hora · Prove os dois no mesmo fim de tarde e escolha seu lado"
      },
      {
        "name": "Acarajé da Dinha",
        "category": "lunch",
        "neighborhood": "Rio Vermelho",
        "costBRL": 40,
        "tip": "O acarajé mais famoso de Salvador, no Largo de Santana · Peça completo: vatapá, caruru, camarão e salada"
      },
      {
        "name": "Acarajé da Regina",
        "category": "afternoon",
        "neighborhood": "Largo de Santana",
        "costBRL": 25,
        "tip": "Tabuleiro tradicional do largo mais charmoso do Rio Vermelho"
      },
      {
        "name": "Barracas do Alto da Sereia",
        "category": "afternoon",
        "neighborhood": "Rio Vermelho",
        "costBRL": 50,
        "tip": "Barracas rústicas com vista alta pro mar do Rio Vermelho — cerveja e peixe frito ao entardecer"
      },
      {
        "name": "Amado",
        "category": "dinner",
        "neighborhood": "Comércio (orla)",
        "costBRL": 220,
        "tip": "Contemporâneo à beira da baía — deck sobre a água · Chegue antes do pôr do sol e jante com o espetáculo"
      },
      {
        "name": "Axego",
        "category": "lunch",
        "neighborhood": "Pelourinho",
        "costBRL": 90,
        "tip": "Moqueca honesta escondida num sobrado do Pelô — favorito de quem trabalha no Centro Histórico"
      },
      {
        "name": "Balé Folclórico da Bahia",
        "category": "night",
        "neighborhood": "Pelourinho",
        "costBRL": 80,
        "tip": "O espetáculo de dança afro-baiana aclamado no mundo inteiro — Teatro Miguel Santana · Compre com antecedência; sessões curtas e lotadas"
      },
      {
        "name": "Blue Praia Bar",
        "category": "afternoon",
        "neighborhood": "Barra",
        "costBRL": 120,
        "tip": "Beach club pé na areia na Barra — conforto de espreguiçadeira com drinks"
      },
      {
        "name": "Igreja do Bonfim e fitinhas",
        "category": "morning",
        "neighborhood": "Bonfim",
        "costBRL": 0,
        "tip": "Amarre a fitinha na grade com três nós e três pedidos · A sala dos milagres é comovente"
      },
      {
        "name": "Boteco do França",
        "category": "dinner",
        "neighborhood": "Rio Vermelho",
        "costBRL": 90,
        "tip": "O boteco mais querido de Salvador · Lambreta (marisco) e cerveja gelada — o ritual"
      },
      {
        "name": "Cafélier",
        "category": "breakfast",
        "neighborhood": "Santo Antônio Além do Carmo",
        "costBRL": 45,
        "tip": "Café com varanda debruçada sobre a Baía de Todos os Santos · Bolos caseiros e a melhor vista de café da cidade"
      },
      {
        "name": "Camafeu de Oxóssi (Mercado Modelo)",
        "category": "lunch",
        "neighborhood": "Comércio",
        "costBRL": 110,
        "tip": "Varanda com vista para a baía no andar do Mercado Modelo · Casquinha de siri histórica"
      },
      {
        "name": "Carvão",
        "category": "dinner",
        "neighborhood": "Rio Vermelho",
        "costBRL": 150,
        "tip": "Parrilla contemporânea premiada — fogo, carne e criatividade baiana"
      },
      {
        "name": "Casa da Mãe",
        "category": "night",
        "neighborhood": "Rio Vermelho",
        "costBRL": 80,
        "tip": "Música baiana ao vivo e cozinha afetiva — a noite do Rio Vermelho em versão aconchego"
      },
      {
        "name": "Casa de Tereza",
        "category": "dinner",
        "neighborhood": "Rio Vermelho",
        "costBRL": 140,
        "tip": "A cozinha baiana contemporânea mais premiada da cidade — moqueca de peixe com dendê equilibrado · Carta de cachaças e clima acolhedor"
      },
      {
        "name": "Casa do Carnaval da Bahia",
        "category": "afternoon",
        "neighborhood": "Pelourinho",
        "costBRL": 30,
        "tip": "O museu que explica o maior carnaval do mundo — imersivo e emocionante · Programa perfeito pra dia de chuva"
      },
      {
        "name": "Casa do Rio Vermelho (Jorge Amado)",
        "category": "afternoon",
        "neighborhood": "Rio Vermelho",
        "costBRL": 40,
        "tip": "A casa onde Jorge Amado e Zélia Gattai viveram 40 anos · Museografia moderna e emocionante"
      },
      {
        "name": "Cidade da Música da Bahia",
        "category": "morning",
        "neighborhood": "Comércio",
        "costBRL": 30,
        "tip": "Museu interativo da música baiana — do samba de roda ao axé · Diversão garantida com crianças e dia de chuva"
      },
      {
        "name": "Coffeetown",
        "category": "breakfast",
        "neighborhood": "Barra",
        "costBRL": 40,
        "tip": "Café de especialidade a passos do Farol da Barra · Tapiocas e pães na chapa reforçados"
      },
      {
        "name": "Bar Cravinho",
        "category": "night",
        "neighborhood": "Pelourinho",
        "costBRL": 40,
        "tip": "A cachaça de cravo lendária do Terreiro de Jesus — ritual obrigatório no Pelô à noite"
      },
      {
        "name": "Dique do Tororó",
        "category": "afternoon",
        "neighborhood": "Tororó",
        "costBRL": 0,
        "tip": "Os orixás gigantes de Tatti Moreno flutuando no lago · Calçadão bom para caminhar com as crianças"
      },
      {
        "name": "Dona Mariquita",
        "category": "lunch",
        "neighborhood": "Rio Vermelho",
        "costBRL": 100,
        "tip": "Cozinha de raiz do Recôncavo — receitas de festa popular · O cardápio conta a história de cada prato"
      },
      {
        "name": "Dulce Vanille",
        "category": "breakfast",
        "neighborhood": "Caminho das Árvores",
        "costBRL": 50,
        "tip": "Confeitaria premiada — croissants de referência · Brunch reforçado para dia de passeio longo"
      },
      {
        "name": "Elevador Lacerda e Mercado Modelo",
        "category": "afternoon",
        "neighborhood": "Comércio",
        "costBRL": 15,
        "tip": "O elevador art déco liga a Cidade Alta à Baixa por centavos · Mercado Modelo: 250 lojas de artesanato para as lembranças"
      },
      {
        "name": "Passeio de escuna pela Baía (Ilha dos Frades)",
        "category": "morning",
        "neighborhood": "Comércio",
        "costBRL": 150,
        "tip": "Dia inteiro navegando a Baía de Todos-os-Santos com parada na Ilha dos Frades · Compre com operadora estabelecida no terminal náutico"
      },
      {
        "name": "Farol da Barra ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Barra",
        "costBRL": 25,
        "tip": "O pôr do sol mais aplaudido de Salvador · O museu náutico dentro do farol vale a subida"
      },
      {
        "name": "Feira de São Joaquim",
        "category": "morning",
        "neighborhood": "Comércio",
        "costBRL": 30,
        "tip": "A feira mais autêntica da Bahia — ervas, folhas sagradas, temperos e vida real · Intensa: vá com espírito aberto e sem pressa"
      },
      {
        "name": "Igreja do Rosário dos Pretos",
        "category": "morning",
        "neighborhood": "Pelourinho",
        "costBRL": 10,
        "tip": "A igreja azul do Pelô, erguida por mãos escravizadas — missa com atabaques é única no mundo · Terças costumam ter celebração especial"
      },
      {
        "name": "JAM no MAM (jazz no Solar do Unhão)",
        "category": "night",
        "neighborhood": "Comércio",
        "costBRL": 40,
        "tip": "Jazz ao pôr do sol com a baía de fundo — o sábado mais elegante de Salvador · Ingressos acabam: chegue cedo"
      },
      {
        "name": "La Taperia",
        "category": "dinner",
        "neighborhood": "Rio Vermelho",
        "costBRL": 100,
        "tip": "Tapas espanholas no coração boêmio — boa pedida antes da noite no bairro"
      },
      {
        "name": "Lagoa do Abaeté",
        "category": "afternoon",
        "neighborhood": "Itapuã",
        "costBRL": 20,
        "tip": "Águas escuras entre dunas brancas — paisagem única e cheia de lenda · Combine com Itapuã na mesma saída"
      },
      {
        "name": "Noite no Largo de Santana",
        "category": "night",
        "neighborhood": "Rio Vermelho",
        "costBRL": 40,
        "tip": "Acarajé, cerveja gelada e gente bonita no largo — a esquina mais democrática de Salvador à noite"
      },
      {
        "name": "MAFRO — Museu Afro-Brasileiro",
        "category": "morning",
        "neighborhood": "Pelourinho",
        "costBRL": 15,
        "tip": "Os painéis de Carybé dos orixás — uma das obras mais importantes do Brasil · No Terreiro de Jesus: âncora do passeio pelo Pelô"
      },
      {
        "name": "Mamma Jamma",
        "category": "dinner",
        "neighborhood": "Salvador Shopping",
        "costBRL": 90,
        "tip": "A pizza napolitana mais consistente de Salvador — programa certo com família"
      },
      {
        "name": "Maria Mata Mouro",
        "category": "dinner",
        "neighborhood": "Pelourinho",
        "costBRL": 150,
        "tip": "Refúgio elegante com jardim escondido no Pelô · Boa parada após noite de música no centro histórico"
      },
      {
        "name": "Cuco Bistrô do Pelô",
        "category": "dinner",
        "neighborhood": "Santo Antônio Além do Carmo",
        "costBRL": 110,
        "tip": "Bistrô charmoso no bairro mais bonito do centro histórico · Pratos baianos com toque autoral"
      },
      {
        "name": "Mistura",
        "category": "lunch",
        "neighborhood": "Amaralina",
        "costBRL": 120,
        "tip": "Frutos do mar frescos com toque contemporâneo — almoço de qualidade fora do circuito turístico"
      },
      {
        "name": "Museu Náutico (Farol da Barra)",
        "category": "morning",
        "neighborhood": "Barra",
        "costBRL": 30,
        "tip": "Dentro do Farol da Barra — naufrágios, mapas e a melhor vista do pôr do sol lá de cima · Combine com a praia do Porto da Barra"
      },
      {
        "name": "Ori Restaurante",
        "category": "dinner",
        "neighborhood": "Pituba",
        "costBRL": 180,
        "tip": "A casa-irmã do Origem — alta cozinha baiana em formato mais acessível"
      },
      {
        "name": "Origem",
        "category": "dinner",
        "neighborhood": "Horto Florestal",
        "costBRL": 260,
        "tip": "Eleito entre os melhores do Brasil — ingredientes do sertão e do mar · Menu degustação conta a Bahia em capítulos"
      },
      {
        "name": "Palacete das Artes",
        "category": "afternoon",
        "neighborhood": "Graça",
        "costBRL": 20,
        "tip": "Palacete com esculturas de Rodin e jardins — respiro elegante na Graça"
      },
      {
        "name": "Paraíso Tropical",
        "category": "lunch",
        "neighborhood": "Cabula",
        "costBRL": 160,
        "tip": "Premiado — cozinha baiana com frutas do pomar próprio · A moqueca de aratu é a assinatura"
      },
      {
        "name": "Pasta em Casa",
        "category": "dinner",
        "neighborhood": "Caminho das Árvores",
        "costBRL": 110,
        "tip": "Massas frescas artesanais — o italiano querido das famílias soteropolitanas"
      },
      {
        "name": "Pelourinho e Largo do Cruzeiro",
        "category": "morning",
        "neighborhood": "Pelourinho",
        "costBRL": 0,
        "tip": "Vá de manhã em dia de semana — as ladeiras ficam suas; emende com a Igreja de São Francisco ao lado"
      },
      {
        "name": "Pereira",
        "category": "dinner",
        "neighborhood": "Barra",
        "costBRL": 160,
        "tip": "Varanda de frente para o Farol da Barra · Cozinha variada que agrada família inteira"
      },
      {
        "name": "Perini",
        "category": "breakfast",
        "neighborhood": "Graça",
        "costBRL": 45,
        "tip": "A delicatessen tradicional de Salvador — café da manhã farto e doces históricos"
      },
      {
        "name": "Pôr do sol na Ponta de Humaitá",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 0,
        "tip": "Igrejinha branca, farol e o pôr do sol mais amado dos soteropolitanos · Menos turístico que o Farol da Barra — e igualmente lindo"
      },
      {
        "name": "Praia do Porto da Barra",
        "category": "morning",
        "neighborhood": "Barra",
        "costBRL": 0,
        "tip": "Mar calmo de baía — a melhor praia urbana para crianças · Chegue cedo: é pequena e enche rápido"
      },
      {
        "name": "Bate-volta Praia do Forte (Projeto Tamar)",
        "category": "morning",
        "neighborhood": "Litoral Norte",
        "costBRL": 180,
        "tip": "Tartarugas do Tamar + vila charmosa + praias de piscinas naturais · O bate-volta favorito das famílias — 1h de estrada"
      },
      {
        "name": "Praia de Itapuã",
        "category": "morning",
        "neighborhood": "Itapuã",
        "costBRL": 40,
        "tip": "A praia cantada por Dorival e Vinicius — coqueiros, farol e baianidade · Barracas simples e mar bom em maré baixa"
      },
      {
        "name": "Ribeira no fim de tarde",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 25,
        "tip": "Orla histórica + o sorvete da Ribeira — programa de domingo dos locais"
      },
      {
        "name": "Rio Vermelho no fim de tarde",
        "category": "afternoon",
        "neighborhood": "Rio Vermelho",
        "costBRL": 0,
        "tip": "O bairro boêmio de Salvador — largo, mar e música · Casa de Iemanjá e os pescadores no largo"
      },
      {
        "name": "Bairro de Santo Antônio Além do Carmo",
        "category": "afternoon",
        "neighborhood": "Santo Antônio",
        "costBRL": 0,
        "tip": "Casarios coloridos, pousadas charmosas e mirantes pra Baía — o fim de tarde mais bonito do Centro · Emenda com o Cafélier e a Ladeira do Carmo"
      },
      {
        "name": "Igreja de São Francisco",
        "category": "morning",
        "neighborhood": "Pelourinho",
        "costBRL": 20,
        "tip": "Interior coberto de ouro — uma das igrejas mais ricas do mundo · Os azulejos portugueses do claustro contam fábulas"
      },
      {
        "name": "Restaurante-Escola do SENAC (Pelourinho)",
        "category": "lunch",
        "neighborhood": "Pelourinho",
        "costBRL": 120,
        "tip": "Buffet com dezenas de pratos típicos baianos — aula de gastronomia · Perfeito para provar de tudo um pouco na primeira vez"
      },
      {
        "name": "Soho (Bahia Marina)",
        "category": "dinner",
        "neighborhood": "Comércio (marina)",
        "costBRL": 230,
        "tip": "Japonês de referência com vista para os barcos da marina · Combinados generosos"
      },
      {
        "name": "Solar do Unhão e MAM ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Comércio",
        "costBRL": 0,
        "tip": "Casarão colonial à beira-mar virou museu de arte moderna · Sábado tem jam de jazz ao pôr do sol — programa imperdível"
      },
      {
        "name": "Sorveteria Cubana",
        "category": "afternoon",
        "neighborhood": "Barra",
        "costBRL": 20,
        "tip": "Desde 1931 — sorvete de tapioca e coco verde que atravessa gerações"
      },
      {
        "name": "Sorveteria da Ribeira",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 25,
        "tip": "Desde 1931 — sabores de frutas regionais como tapioca e umbu · Programa de família soteropolitana aos domingos"
      },
      {
        "name": "Praia de Stella Maris",
        "category": "morning",
        "neighborhood": "Stella Maris",
        "costBRL": 60,
        "tip": "Barracas estruturadas e mar aberto — o dia de praia com serviço completo · Boa com crianças pela infraestrutura"
      },
      {
        "name": "Terça da Bênção no Pelourinho",
        "category": "night",
        "neighborhood": "Pelourinho",
        "costBRL": 30,
        "tip": "A noite mais tradicional do Pelô — música nas ladeiras e o show do Geronimo · Só às terças: encaixe o dia da semana no roteiro"
      },
      {
        "name": "Restaurante Yemanjá",
        "category": "lunch",
        "neighborhood": "Armação",
        "costBRL": 150,
        "tip": "A moqueca clássica de Salvador há décadas · Porções servem bem duas pessoas"
      }
    ],
    "hotels": [
      {
        "name": "Deville Prime Salvador",
        "zone": "Itapuã",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Resort urbano pé na areia de Itapuã - piscinas e recreação"
      },
      {
        "name": "Fasano Salvador",
        "zone": "Comércio",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.500-2.800",
        "tip": "Art déco restaurado com rooftop pra Baía - o luxo soteropolitano"
      },
      {
        "name": "Fera Palace Hotel",
        "zone": "Comércio",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.600",
        "tip": "O palácio de 1934 renascido - piscina de borda na proa do Centro"
      }
    ]
  },
  "Buenos Aires": {
    "city": "Buenos Aires",
    "items": [
      {
        "name": "El Ateneo Grand Splendid",
        "category": "afternoon",
        "neighborhood": "Recoleta",
        "costBRL": 0,
        "tip": "Teatro de 1919 convertido na livraria mais bonita do mundo · O café fica no antigo palco"
      },
      {
        "name": "Café San Juan",
        "category": "dinner",
        "neighborhood": "San Telmo",
        "costBRL": 210,
        "tip": "Bistrô cult do chef Lele Cristóbal · Cozinha de mercado com alma portenha"
      },
      {
        "name": "Caminito e La Boca",
        "category": "morning",
        "neighborhood": "La Boca",
        "costBRL": 0,
        "tip": "As casas de chapa coloridas são o cartão-postal da cidade · Fique no circuito turístico e vá de dia"
      },
      {
        "name": "Chori (choripán de autor)",
        "category": "lunch",
        "neighborhood": "Palermo Soho",
        "costBRL": 50,
        "tip": "O clássico de rua argentino em versão gourmet · Chimichurri da casa é à parte"
      },
      {
        "name": "Cocu Boulangerie",
        "category": "breakfast",
        "neighborhood": "Palermo Soho",
        "costBRL": 50,
        "tip": "Padaria francesa queridinha de Palermo · Croissants e pain au chocolat de referência"
      },
      {
        "name": "El Cuartito",
        "category": "lunch",
        "neighborhood": "Retiro",
        "costBRL": 60,
        "tip": "Pizzaria de 1934 com paredes cobertas de pôsteres esportivos · A fugazzeta (cebola e queijo) é obrigatória"
      },
      {
        "name": "Don Julio",
        "category": "dinner",
        "neighborhood": "Palermo",
        "costBRL": 320,
        "tip": "Eleita a melhor parrilla do mundo — reserve com semanas · Enquanto espera, servem espumante na calçada"
      },
      {
        "name": "Calle Florida e Galerías Pacífico",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O calçadão comercial histórico da cidade · Os afrescos da cúpula das Galerías são obra de mestres argentinos"
      },
      {
        "name": "Gran Parrilla del Plata",
        "category": "dinner",
        "neighborhood": "San Telmo",
        "costBRL": 170,
        "tip": "Parrilla clássica de esquina em San Telmo · Provoleta e molleja para começar como manda a tradição"
      },
      {
        "name": "Pizzería Güerrín",
        "category": "lunch",
        "neighborhood": "Centro (Av. Corrientes)",
        "costBRL": 55,
        "tip": "A pizza porteña de meio metro de muçarela, desde 1932 · Coma em pé no balcão como os locais"
      },
      {
        "name": "Rapa Nui (helado argentino)",
        "category": "afternoon",
        "neighborhood": "Recoleta/Palermo",
        "costBRL": 40,
        "tip": "O sorvete argentino no seu melhor — chocolates da Patagônia · Dulce de leche granizado é lei"
      },
      {
        "name": "La Cabrera",
        "category": "dinner",
        "neighborhood": "Palermo",
        "costBRL": 260,
        "tip": "Parrilla famosa pelas guarnições que lotam a mesa · Porções gigantes — um corte serve dois"
      },
      {
        "name": "Cabaña Las Lilas",
        "category": "lunch",
        "neighborhood": "Puerto Madero",
        "costBRL": 280,
        "tip": "Parrilla clássica de frigorífico próprio à beira do dique · O bife de chorizo referência da cidade"
      },
      {
        "name": "Las Violetas",
        "category": "breakfast",
        "neighborhood": "Almagro",
        "costBRL": 85,
        "tip": "Confeitaria art nouveau de 1884 — vitrais deslumbrantes · A merienda completa é um banquete"
      },
      {
        "name": "Mercado de San Telmo",
        "category": "lunch",
        "neighborhood": "San Telmo",
        "costBRL": 80,
        "tip": "Mercado de 1897 com bancas gastronômicas modernas · Do choripán ao café de especialidade"
      },
      {
        "name": "La Mezzetta (fugazzeta em pé)",
        "category": "dinner",
        "neighborhood": "Villa Ortúzar",
        "costBRL": 45,
        "tip": "A fugazzeta rellena mais famosa de Buenos Aires, desde 1939 · Só balcão, em pé, do jeito clássico"
      },
      {
        "name": "Milonga La Viruta",
        "category": "night",
        "neighborhood": "Palermo",
        "costBRL": 60,
        "tip": "Onde os portenhos dançam de verdade — não é show, é vida · Aulas para iniciantes antes da pista abrir"
      },
      {
        "name": "Bosques de Palermo e Rosedal",
        "category": "morning",
        "neighborhood": "Palermo",
        "costBRL": 0,
        "tip": "O Central Park portenho — lagos, pedalinho e roseiral · Alugue bike e rode os parques"
      },
      {
        "name": "Palermo Soho: lojas e arte de rua",
        "category": "afternoon",
        "neighborhood": "Palermo Soho",
        "costBRL": 0,
        "tip": "Praça Serrano cercada de bares e design independente · Murais de arte urbana em cada esquina"
      },
      {
        "name": "Parrilla Peña",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 150,
        "tip": "Parrilla raiz sem turismo — garçons de colete e carne no ponto · Preço honesto para qualidade alta"
      },
      {
        "name": "Plaza de Mayo e Casa Rosada",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O coração político da Argentina desde 1810 · Catedral Metropolitana guarda o mausoléu de San Martín"
      },
      {
        "name": "El Preferido de Palermo",
        "category": "dinner",
        "neighborhood": "Palermo",
        "costBRL": 190,
        "tip": "Bodegón centenário reformado pela equipe do Don Julio · Milanesa e fiambres artesanais de referência"
      },
      {
        "name": "Puerto Madero e Puente de la Mujer",
        "category": "afternoon",
        "neighborhood": "Puerto Madero",
        "costBRL": 0,
        "tip": "Antigos docks virados no bairro mais moderno · A ponte de Calatrava ao entardecer rende as fotos"
      },
      {
        "name": "Cemitério da Recoleta e entorno",
        "category": "morning",
        "neighborhood": "Recoleta",
        "costBRL": 35,
        "tip": "Labirinto de mausoléus onde está Evita Perón · Pegue o mapa na entrada ou se perca de propósito"
      },
      {
        "name": "San Telmo e Feira da Praça Dorrego",
        "category": "morning",
        "neighborhood": "San Telmo",
        "costBRL": 0,
        "tip": "Domingo a Calle Defensa vira feira de antiguidades a céu aberto · Tango de rua na Praça Dorrego"
      },
      {
        "name": "El Sanjuanino",
        "category": "lunch",
        "neighborhood": "Recoleta",
        "costBRL": 70,
        "tip": "Empanadas do norte argentino assadas no forno de barro · A de carne cortada a faca é a campeã"
      },
      {
        "name": "Show de tango em San Telmo",
        "category": "night",
        "neighborhood": "San Telmo",
        "costBRL": 260,
        "tip": "Casas históricas com jantar-show · Reserve com antecedência — casais na pista de verdade"
      },
      {
        "name": "Teatro Colón (visita guiada)",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 95,
        "tip": "Um dos teatros de ópera com melhor acústica do mundo · A visita guiada mostra bastidores e o salão dourado"
      },
      {
        "name": "Café Tortoni",
        "category": "breakfast",
        "neighborhood": "Centro (Av. de Mayo)",
        "costBRL": 75,
        "tip": "O café mais antigo da Argentina (1858) — mármore, vitrais e história · Chocolate con churros é o pedido clássico"
      },
      {
        "name": "Museo Nacional de Bellas Artes",
        "category": "afternoon",
        "neighborhood": "Recoleta",
        "costBRL": 0,
        "tip": "Goya, Van Gogh e Cándido López — de graça, ao lado do cemitério da Recoleta"
      },
      {
        "name": "La Bomba de Tiempo",
        "category": "night",
        "neighborhood": "Almagro",
        "costBRL": 40,
        "tip": "A percussão improvisada das segundas no Konex — energia inesquecível · SÓ segunda-feira: encaixe o dia certo"
      },
      {
        "name": "Tour La Bombonera (Boca)",
        "category": "morning",
        "neighborhood": "La Boca",
        "costBRL": 60,
        "tip": "O estádio-caldeirão do Boca — museu e arquibancadas lendárias · Combine com o Caminito ao lado"
      },
      {
        "name": "Heladería Cadore",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 15,
        "tip": "O dulce de leche premiado da Corrientes — parada pós-teatro"
      },
      {
        "name": "Ecoparque",
        "category": "morning",
        "neighborhood": "Palermo",
        "costBRL": 0,
        "tip": "O antigo zoológico virou parque de conservação gratuito — maras soltas no caminho"
      },
      {
        "name": "Milonga tradicional (El Beso)",
        "category": "night",
        "neighborhood": "Congreso",
        "costBRL": 20,
        "tip": "A milonga dos milongueros de verdade — tango dançado, não performado · Vá pra observar com respeito; aula antes ajuda"
      },
      {
        "name": "Florería Atlántico",
        "category": "night",
        "neighborhood": "Retiro",
        "costBRL": 80,
        "tip": "O speakeasy atrás da floricultura — entre os melhores bares do mundo · Reserve; peça os drinks de imigrantes"
      },
      {
        "name": "Empanadas La Cocina",
        "category": "lunch",
        "neighborhood": "Recoleta",
        "costBRL": 20,
        "tip": "As empanadas riojanas picantes que os porteños defendem com a vida"
      },
      {
        "name": "MALBA",
        "category": "morning",
        "neighborhood": "Palermo",
        "costBRL": 50,
        "tip": "Frida, Berni e a arte latino-americana num prédio lindo — o museu imperdível de BA · Quarta é dia de entrada reduzida"
      },
      {
        "name": "Feria de Mataderos",
        "category": "morning",
        "neighborhood": "Mataderos",
        "costBRL": 30,
        "tip": "A feira gaúcha dentro da cidade — folclore, destreza a cavalo e empanadas · Domingos; confirme temporada"
      },
      {
        "name": "Planetario Galileo Galilei",
        "category": "afternoon",
        "neighborhood": "Palermo",
        "costBRL": 30,
        "tip": "A nave espacial dos Bosques de Palermo — sessões que hipnotizam crianças"
      },
      {
        "name": "Day-trip ao Delta do Tigre",
        "category": "morning",
        "neighborhood": "Tigre",
        "costBRL": 80,
        "tip": "Trem + catamarã pelos rios do delta — a Buenos Aires anfíbia · Domingo tem o Puerto de Frutos a pleno"
      },
      {
        "name": "Usina del Arte",
        "category": "afternoon",
        "neighborhood": "La Boca",
        "costBRL": 0,
        "tip": "A antiga usina virou centro cultural com concertos gratuitos — joia da Boca"
      }
    ],
    "hotels": [
      {
        "name": "Alvear Palace Hotel",
        "zone": "Recoleta",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "O grande dame portenho - chá da tarde e mordomos desde 1932"
      },
      {
        "name": "Palacio Duhau - Park Hyatt",
        "zone": "Recoleta",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.600-2.800",
        "tip": "Palácio com jardins escalonados - elegância máxima"
      },
      {
        "name": "Four Seasons Buenos Aires",
        "zone": "Retiro",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.400-2.500",
        "tip": "Mansão belle époque + torre moderna - piscina e kids amados"
      },
      {
        "name": "Home Hotel",
        "zone": "Palermo Hollywood",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "O boutique que inventou Palermo Hollywood - jardim com piscina"
      }
    ]
  },
  "Cartagena": {
    "city": "Cartagena",
    "items": [
      {
        "name": "Ábaco Libros y Café",
        "category": "breakfast",
        "neighborhood": "Centro Histórico",
        "costBRL": 35,
        "tip": "Livraria-café charmosa — cantinho fresco com livros infantis pras crianças folhearem"
      },
      {
        "name": "Aviário Nacional da Colômbia",
        "category": "morning",
        "neighborhood": "Barú (1h de carro)",
        "costBRL": 90,
        "tip": "2.000 aves em trilhas sombreadas — o passeio que crianças pequenas mais amam na região · Combine com Playa Blanca na volta OU vá dedicado; trilha toda na sombra = amigo do calor"
      },
      {
        "name": "Fim de tarde em Bocagrande",
        "category": "afternoon",
        "neighborhood": "Bocagrande",
        "costBRL": 30,
        "tip": "A praia urbana da cidade — mar escuro mas água morna e pôr do sol bonito · Vendedores insistentes: um \"no, gracias\" firme e sorridente resolve; castelo de areia salva o dia"
      },
      {
        "name": "Las Bóvedas (compras)",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 40,
        "tip": "As antigas masmorras viradas lojinhas de artesanato — souvenir com história e sombra"
      },
      {
        "name": "Café del Mural",
        "category": "breakfast",
        "neighborhood": "Getsemaní",
        "costBRL": 50,
        "tip": "Café de especialidade colombiano com método na mesa"
      },
      {
        "name": "Café Havana (salsa)",
        "category": "night",
        "neighborhood": "Getsemaní",
        "costBRL": 80,
        "tip": "O templo da salsa ao vivo — banda cubana e pista fervendo · Programa dos pais: começa 22h; sem crianças"
      },
      {
        "name": "Candé",
        "category": "lunch",
        "neighborhood": "Centro Histórico",
        "costBRL": 110,
        "tip": "Cozinha cartagenera típica com música ao vivo — almoço-experiência"
      },
      {
        "name": "Carmen",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 250,
        "tip": "Alta gastronomia num pátio colonial — o jantar de celebração"
      },
      {
        "name": "Passeio noturno pela cidade iluminada",
        "category": "night",
        "neighborhood": "Centro Histórico",
        "costBRL": 60,
        "tip": "A cidade murada iluminada é outro cenário — caminhada leve pós-jantar com as crianças · Ruas cheias e seguras no circuito central à noite"
      },
      {
        "name": "Castillo San Felipe de Barajas",
        "category": "morning",
        "neighborhood": "Pie de la Popa",
        "costBRL": 60,
        "tip": "A maior fortaleza espanhola das Américas — túneis que crianças ADORAM explorar · Vá na ABERTURA (8h): sombra zero depois das 10h; leve água e boné"
      },
      {
        "name": "Celele",
        "category": "dinner",
        "neighborhood": "Getsemaní",
        "costBRL": 220,
        "tip": "O melhor restaurante do Caribe colombiano — cozinha de pesquisa da região · RESERVE com semanas; programa dos pais (babá ou noite especial)"
      },
      {
        "name": "La Cevichería",
        "category": "lunch",
        "neighborhood": "San Diego",
        "costBRL": 120,
        "tip": "O ceviche que Anthony Bourdain eternizou — clássico absoluto · Fila real: chegue 11h45 ou espere; tem opções sem pimenta pras crianças"
      },
      {
        "name": "Passeio pela Cidade Murada (Centro)",
        "category": "morning",
        "neighborhood": "Centro Histórico",
        "costBRL": 20,
        "tip": "Sacadas floridas, praças e as palenqueras de frutas — o cartão-postal vivo · Foto com palenquera: combine e PAGUE (é o trabalho delas); calçadas de pedra = carrinho de bebê sofre, prefira canguru"
      },
      {
        "name": "La Cocina de Pepina",
        "category": "lunch",
        "neighborhood": "Getsemaní",
        "costBRL": 140,
        "tip": "Cozinha das avós do Caribe colombiano — mote de queso e posta negra"
      },
      {
        "name": "Crepes & Waffles",
        "category": "breakfast",
        "neighborhood": "Bocagrande",
        "costBRL": 40,
        "tip": "A rede latino-americana que TODA família ama — menu infantil, rápido e confiável · Salva refeição em qualquer aperto; tem sorveteria própria"
      },
      {
        "name": "Demente (tapas no rooftop)",
        "category": "dinner",
        "neighborhood": "Getsemaní",
        "costBRL": 90,
        "tip": "Tapas e forno a lenha com teto retrátil na Plaza Trinidad — descontraído e delicioso"
      },
      {
        "name": "Di Silvio Trattoria",
        "category": "lunch",
        "neighborhood": "Getsemaní",
        "costBRL": 70,
        "tip": "Pizza napolitana honesta em Getsemaní — o coringa quando as crianças pedem \"comida normal\""
      },
      {
        "name": "El Barón Café & Liquor Bar",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 180,
        "tip": "Jantar leve + coquetelaria na Plaza San Pedro — pede mesa na praça"
      },
      {
        "name": "Época Espresso Bar",
        "category": "breakfast",
        "neighborhood": "Centro Histórico",
        "costBRL": 45,
        "tip": "Café de especialidade colombiano + arepa de huevo no coração murado · Ar-condicionado abençoado — refúgio do calor matinal"
      },
      {
        "name": "Restaurante Espíritu Santo",
        "category": "lunch",
        "neighborhood": "Centro Histórico",
        "costBRL": 60,
        "tip": "O almoço caseiro dos cartageneros — peixe frito, arroz de coco e patacón em porção farta · Barato, rápido e autêntico; ótimo custo pra família inteira"
      },
      {
        "name": "Getsemaní e Plaza de la Trinidad",
        "category": "morning",
        "neighborhood": "Getsemaní",
        "costBRL": 15,
        "tip": "O bairro do street art e das bandeirinhas — vibrante e fotogênico · De manhã é tranquilo pra família; à noite vira o point jovem"
      },
      {
        "name": "Palacio de la Inquisición",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 35,
        "tip": "O museu da história sombria da cidade num palacete lindo — melhor com crianças maiores; os pequenos curtem o pátio"
      },
      {
        "name": "Juan del Mar (Plaza San Diego)",
        "category": "dinner",
        "neighborhood": "San Diego",
        "costBRL": 130,
        "tip": "Jantar na praça mais charmosa — as crianças correm na praça enquanto os pratos chegam · A fórmula mágica de jantar com filhos pequenos: praça + mesa externa"
      },
      {
        "name": "La Mulata",
        "category": "lunch",
        "neighborhood": "Centro Histórico",
        "costBRL": 90,
        "tip": "Almoço caribenho de bandeja — chegue antes do meio-dia, a fila do executivo é real"
      },
      {
        "name": "Mar y Zielo",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 160,
        "tip": "Frutos do mar contemporâneos com rooftop — impressiona sem formalidade"
      },
      {
        "name": "María",
        "category": "dinner",
        "neighborhood": "San Diego",
        "costBRL": 260,
        "tip": "Contemporâneo elegante no Centro — reserve"
      },
      {
        "name": "Caminhada pelas Muralhas",
        "category": "morning",
        "neighborhood": "Centro Histórico",
        "costBRL": 0,
        "tip": "4km de muralhas do século XVII — gratuito e cinematográfico · Com crianças pequenas: trecho curto de manhã cedo; pôr do sol é a versão dos adultos"
      },
      {
        "name": "Pôr do sol nas muralhas (Baluarte)",
        "category": "night",
        "neighborhood": "Centro Histórico",
        "costBRL": 60,
        "tip": "Drinks sobre a muralha vendo o sol afundar no Caribe — clássico irresistível · Com crianças: sorvete na mão substitui o coquetel e funciona igual"
      },
      {
        "name": "Museo del Oro Zenú",
        "category": "morning",
        "neighborhood": "Centro Histórico",
        "costBRL": 0,
        "tip": "Ourivesaria pré-colombiana GRÁTIS e com ar-condicionado — o refúgio perfeito do meio-dia"
      },
      {
        "name": "La Paletería",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 15,
        "tip": "As paletas mexicanas que salvam QUALQUER tarde de calor — corozo e coco são as locais · Vai virar parada diária da família, aceite isso 😄"
      },
      {
        "name": "Pezetarian",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 70,
        "tip": "Poke e peixe fresco descomplicado — jantar leve e rápido com crianças cansadas"
      },
      {
        "name": "Noite na Plaza de la Trinidad",
        "category": "night",
        "neighborhood": "Getsemaní",
        "costBRL": 25,
        "tip": "Música de rua, dançarinos e famílias locais — a noite democrática de Cartagena · Cedo (19-21h) é totalmente família; esquenta depois"
      },
      {
        "name": "Convento de la Popa",
        "category": "afternoon",
        "neighborhood": "La Popa",
        "costBRL": 40,
        "tip": "A vista mais completa de Cartagena do alto do morro · Vá e volte de táxi/app combinado — não suba a pé"
      },
      {
        "name": "Portal de los Dulces",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 20,
        "tip": "O corredor centenário dos doces de coco — cocadas de todos os sabores · Deixe as crianças escolherem: é tradição, não turismada"
      },
      {
        "name": "Day-trip Islas del Rosario (beach club)",
        "category": "morning",
        "neighborhood": "Islas del Rosario",
        "costBRL": 250,
        "tip": "Mar caribenho manso e cristalino — escolha um beach club com day pass e estrutura kids · Lancha 45min: assentos na parte de trás balançam menos; protetor reef-safe"
      },
      {
        "name": "Café San Alberto",
        "category": "breakfast",
        "neighborhood": "Centro Histórico",
        "costBRL": 40,
        "tip": "O café premiado da Colômbia com degustação guiada — os pais agradecem · Peça o cold brew se o calor já tiver chegado"
      },
      {
        "name": "Café Stepping Stone",
        "category": "breakfast",
        "neighborhood": "Getsemaní",
        "costBRL": 60,
        "tip": "Brunch australiano com projeto social — emprega jovens locais"
      },
      {
        "name": "Passeio de barco ao pôr do sol na baía",
        "category": "afternoon",
        "neighborhood": "Marina",
        "costBRL": 150,
        "tip": "A cidade murada dourada vista do mar — o momento uau da viagem · Versões família saem mais cedo (17h); confirme colete infantil"
      }
    ],
    "hotels": [
      {
        "name": "Ananda Hotel Boutique",
        "zone": "Centro Histórico",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.200-2.000",
        "tip": "Boutique colonial com piscina no pátio — romance sem preço Sofitel"
      },
      {
        "name": "Hotel Caribe by Faranda",
        "zone": "Bocagrande",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "O resort clássico de Bocagrande — piscinas gigantes e jardim com bicho-preguiça · Melhor custo-família da cidade; praia em frente"
      },
      {
        "name": "Casa Lola Luxury Collection",
        "zone": "Getsemaní",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Design colorido no coração de Getsemaní — pra quem quer a vibe do bairro"
      },
      {
        "name": "Charleston Santa Teresa",
        "zone": "Centro Histórico",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.000",
        "tip": "Rooftop com a melhor vista da cidade murada — lua de mel clássica"
      },
      {
        "name": "Estelar Cartagena de Indias",
        "zone": "Bocagrande",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "Custo-benefício família com piscina no rooftop e praia perto"
      },
      {
        "name": "Hyatt Regency Cartagena",
        "zone": "Bocagrande",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Torre moderna com piscina de borda infinita — conforto internacional"
      },
      {
        "name": "Life is Good Hostel",
        "zone": "Getsemaní",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 80-200",
        "tip": "O hostel querido de Getsemaní — social, seguro e na rua certa"
      },
      {
        "name": "Radisson Cartagena Ocean Pavillion",
        "zone": "La Boquilla",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Resort pé na areia fora do burburinho — piscinas enormes pras crianças · Longe do Centro: carro/app pra passeios"
      },
      {
        "name": "Casa San Agustín",
        "zone": "Centro Histórico",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 2.200-3.800",
        "tip": "Boutique de charme absoluto — aquário privê e serviço impecável"
      },
      {
        "name": "Sofitel Legend Santa Clara",
        "zone": "Centro Histórico",
        "tier": "resort",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "Convento do século XVII virado lenda — piscina, tucanos no pátio e história · Família E casal cabem: kids adorados, spa idem"
      }
    ]
  },
  "Nova York": {
    "city": "Nova York",
    "items": [
      {
        "name": "230 Fifth Rooftop",
        "category": "night",
        "neighborhood": "Flatiron",
        "costBRL": 90,
        "tip": "O rooftop com o Empire State na cara — iglus aquecidos no inverno"
      },
      {
        "name": "Comedy Cellar",
        "category": "night",
        "neighborhood": "Greenwich Village",
        "costBRL": 120,
        "tip": "O clube onde Chris Rock aparece de surpresa — stand-up raiz · Reserve; line-up sai no dia"
      },
      {
        "name": "Coney Island",
        "category": "morning",
        "neighborhood": "Brooklyn",
        "costBRL": 80,
        "tip": "Montanha-russa centenária, calçadão e o hot dog original do Nathans · Verão é o auge; inverno fecha brinquedos"
      },
      {
        "name": "Dominique Ansel Bakery (Cronut)",
        "category": "breakfast",
        "neighborhood": "SoHo",
        "costBRL": 45,
        "tip": "O criador do Cronut — chegue cedo que esgota"
      },
      {
        "name": "Governors Island",
        "category": "morning",
        "neighborhood": "Harbor",
        "costBRL": 20,
        "tip": "Ilha-parque com bikes e redes de frente pra Estátua — verão nova-iorquino · Maio a outubro; balsa barata do Battery"
      },
      {
        "name": "Missa gospel no Harlem",
        "category": "morning",
        "neighborhood": "Harlem",
        "costBRL": 0,
        "tip": "Domingo de coral arrepiante — vá com respeito e roupa adequada · Chegue 30 min antes; igrejas como First Corinthian recebem visitantes"
      },
      {
        "name": "Intrepid Museum (porta-aviões)",
        "category": "morning",
        "neighborhood": "Hells Kitchen",
        "costBRL": 180,
        "tip": "Porta-aviões de verdade com ônibus espacial e Concorde — crianças em órbita"
      },
      {
        "name": "MoMA",
        "category": "morning",
        "neighborhood": "Midtown",
        "costBRL": 140,
        "tip": "Van Gogh, Monet e Warhol sob o mesmo teto — o museu de arte moderna definitivo"
      },
      {
        "name": "Bondinho de Roosevelt Island",
        "category": "afternoon",
        "neighborhood": "Upper East Side",
        "costBRL": 10,
        "tip": "O teleférico urbano sobre o East River — paga com o MetroCard"
      },
      {
        "name": "Staten Island Ferry",
        "category": "afternoon",
        "neighborhood": "Financial District",
        "costBRL": 0,
        "tip": "A vista da Estátua da Liberdade DE GRAÇA — vai e volta com pôr do sol"
      },
      {
        "name": "Village Vanguard (jazz)",
        "category": "night",
        "neighborhood": "West Village",
        "costBRL": 180,
        "tip": "O porão sagrado do jazz desde 1935 — Coltrane gravou aqui · Reserve online; sets 20h e 22h30"
      },
      {
        "name": "Wall Street e Charging Bull",
        "category": "morning",
        "neighborhood": "Financial District",
        "costBRL": 0,
        "tip": "O touro, a NYSE e a Trinity Church — o coração financeiro a pé"
      },
      {
        "name": "Whitney Museum",
        "category": "afternoon",
        "neighborhood": "Meatpacking",
        "costBRL": 120,
        "tip": "Arte americana com terraços pro High Line — combina com o passeio"
      },
      {
        "name": "Williamsburg (Brooklyn)",
        "category": "afternoon",
        "neighborhood": "Williamsburg",
        "costBRL": 50,
        "tip": "Brechós, cafés e o skyline de Manhattan do outro lado do rio"
      },
      {
        "name": "Bryant Park Winter Village",
        "category": "night",
        "neighborhood": "Midtown",
        "costBRL": 40,
        "tip": "Pista de gelo grátis e mercadinho de inverno — a NY de novembro a março"
      },
      {
        "name": "Musical da Broadway",
        "category": "night",
        "neighborhood": "Midtown",
        "costBRL": 450,
        "tip": "O Lion King e o Wicked são certeiros com crianças · TKTS em Times Square vende ingresso do dia com desconto"
      },
      {
        "name": "Brooklyn Bridge e Dumbo",
        "category": "morning",
        "neighborhood": "Brooklyn",
        "costBRL": 0,
        "tip": "Atravesse a pé do lado de Manhattan para o Brooklyn · Em Dumbo, a foto clássica é na Washington St"
      },
      {
        "name": "Carmine's (family style)",
        "category": "dinner",
        "neighborhood": "Times Square",
        "costBRL": 190,
        "tip": "Italiano em travessas gigantes para dividir — feito para famílias · Uma porção de massa serve 3-4 pessoas"
      },
      {
        "name": "Central Park",
        "category": "morning",
        "neighborhood": "Manhattan",
        "costBRL": 0,
        "tip": "Entre pela 59th e suba até o Bethesda Fountain · Alugue bike ou remo no lago"
      },
      {
        "name": "Chelsea Market",
        "category": "lunch",
        "neighborhood": "Chelsea",
        "costBRL": 100,
        "tip": "Mercado gastronômico na antiga fábrica da Oreo · Los Tacos No.1 e a lagosta do Lobster Place são os hits"
      },
      {
        "name": "Clinton St. Baking Company",
        "category": "breakfast",
        "neighborhood": "Lower East Side",
        "costBRL": 95,
        "tip": "As panquecas com manteiga de maple mais famosas da cidade · Espere fila no fim de semana — vá cedo"
      },
      {
        "name": "Ellen's Stardust Diner",
        "category": "dinner",
        "neighborhood": "Times Square",
        "costBRL": 160,
        "tip": "Os garçons cantam Broadway entre os pedidos — futuro elenco dos musicais · As crianças saem cantando"
      },
      {
        "name": "Empire State à noite",
        "category": "night",
        "neighborhood": "Midtown",
        "costBRL": 210,
        "tip": "A cidade acesa aos seus pés do deck 86 · Aberto até tarde — vá depois do jantar"
      },
      {
        "name": "Ess-a-Bagel",
        "category": "breakfast",
        "neighborhood": "Midtown East",
        "costBRL": 55,
        "tip": "O bagel nova-iorquino em estado de arte · Everything bagel com cream cheese e lox"
      },
      {
        "name": "Estátua da Liberdade e Ellis Island",
        "category": "morning",
        "neighborhood": "Battery Park",
        "costBRL": 130,
        "tip": "Ferry oficial sai do Battery Park; reserve o primeiro horário e inclua Ellis Island — a metade que os apressados perdem · Para só ver de perto sem desembarcar, o Staten Island Ferry é gratuito"
      },
      {
        "name": "Grand Central e Bryant Park",
        "category": "afternoon",
        "neighborhood": "Midtown",
        "costBRL": 0,
        "tip": "O teto celestial do salão principal é hipnotizante · A galeria dos sussurros diverte as crianças"
      },
      {
        "name": "The Halal Guys (53rd & 6th)",
        "category": "lunch",
        "neighborhood": "Midtown",
        "costBRL": 50,
        "tip": "O carrinho de rua que virou lenda mundial · Chicken over rice com white sauce — o pedido"
      },
      {
        "name": "High Line e Hudson Yards",
        "category": "afternoon",
        "neighborhood": "Chelsea",
        "costBRL": 0,
        "tip": "Parque suspenso sobre a antiga linha de trem · Termine no Vessel em Hudson Yards"
      },
      {
        "name": "Ippudo NY",
        "category": "dinner",
        "neighborhood": "East Village",
        "costBRL": 120,
        "tip": "O ramen que apresentou tonkotsu a NY · Os pork buns de entrada são obrigatórios"
      },
      {
        "name": "Joe's Pizza",
        "category": "lunch",
        "neighborhood": "Greenwich Village",
        "costBRL": 40,
        "tip": "A fatia nova-iorquina clássica — dobre ao meio e coma andando · Do Homem-Aranha aos moradores: todo mundo passa aqui"
      },
      {
        "name": "John's of Bleecker Street",
        "category": "dinner",
        "neighborhood": "Greenwich Village",
        "costBRL": 110,
        "tip": "Pizza de forno a carvão desde 1929 — sem fatias, só redondas inteiras · As mesas têm décadas de nomes entalhados"
      },
      {
        "name": "Junior's (cheesecake)",
        "category": "dinner",
        "neighborhood": "Times Square/Brooklyn",
        "costBRL": 140,
        "tip": "Diner clássico do cheesecake nova-iorquino original · Jante levinho e guarde espaço para a fatia"
      },
      {
        "name": "Katz's Delicatessen",
        "category": "lunch",
        "neighborhood": "Lower East Side",
        "costBRL": 130,
        "tip": "O pastrami on rye mais famoso do planeta, desde 1888 · Guarde o ticket que recebem na entrada — perder dá multa"
      },
      {
        "name": "Levain Bakery",
        "category": "breakfast",
        "neighborhood": "Upper West Side",
        "costBRL": 45,
        "tip": "O cookie de 170g que mudou o conceito de cookie · Chocolate chip walnut ainda morno — vá cedo"
      },
      {
        "name": "Los Tacos No.1",
        "category": "lunch",
        "neighborhood": "Chelsea/Times Sq",
        "costBRL": 55,
        "tip": "Considerado o melhor taco de NY · Adobada (porco marinado) na tortilla feita na hora"
      },
      {
        "name": "The Met (Metropolitan Museum)",
        "category": "morning",
        "neighborhood": "Upper East Side",
        "costBRL": 160,
        "tip": "Do Egito antigo aos impressionistas — escolha 3 alas e aceite não ver tudo · O terraço tem vista do Central Park (verão)"
      },
      {
        "name": "Museu de História Natural",
        "category": "morning",
        "neighborhood": "Upper West Side",
        "costBRL": 160,
        "tip": "Os dinossauros do filme Uma Noite no Museu · A baleia azul em tamanho real no salão dos oceanos"
      },
      {
        "name": "Peter Luger Steak House",
        "category": "dinner",
        "neighborhood": "Williamsburg (Brooklyn)",
        "costBRL": 380,
        "tip": "A steakhouse lendária de 1887 — porterhouse para dividir · Reserve com semanas e leve cartão de débito ou dinheiro"
      },
      {
        "name": "Serendipity 3 (frozen hot chocolate)",
        "category": "afternoon",
        "neighborhood": "Upper East Side",
        "costBRL": 90,
        "tip": "O frozen hot chocolate do filme — as crianças imploram · Casa cenográfica de 1954"
      },
      {
        "name": "Shake Shack (Madison Square Park)",
        "category": "lunch",
        "neighborhood": "Flatiron",
        "costBRL": 75,
        "tip": "O quiosque original onde a rede nasceu · ShackBurger + cheese fries + shake: o rito completo"
      },
      {
        "name": "SoHo e Little Italy",
        "category": "afternoon",
        "neighborhood": "SoHo",
        "costBRL": 0,
        "tip": "Fachadas de ferro fundido e vitrines de grife · Little Italy e Chinatown ficam coladas — três mundos numa tarde"
      },
      {
        "name": "SUMMIT One Vanderbilt",
        "category": "afternoon",
        "neighborhood": "Midtown",
        "costBRL": 230,
        "tip": "Mirante de espelhos infinitos — experiência imersiva · Reserve o pôr do sol com antecedência"
      },
      {
        "name": "Times Square e Distrito dos Teatros",
        "category": "afternoon",
        "neighborhood": "Midtown",
        "costBRL": 0,
        "tip": "O caos luminoso que precisa ser visto uma vez · As lojas gigantes (M&M, Disney) divertem as crianças"
      },
      {
        "name": "Top of the Rock",
        "category": "morning",
        "neighborhood": "Midtown (Rockefeller)",
        "costBRL": 190,
        "tip": "A melhor vista DO Empire State é daqui · Compre horário marcado — fim de tarde é o mais disputado"
      }
    ],
    "hotels": [
      {
        "name": "1 Hotel Brooklyn Bridge",
        "zone": "Dumbo",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 2.200-3.800",
        "tip": "Eco-chique com Manhattan inteira na janela"
      },
      {
        "name": "Hotel Beacon",
        "zone": "Upper West Side",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.200-2.000",
        "tip": "Suítes com kitchenette perto do Central Park — o favorito das famílias"
      },
      {
        "name": "The Plaza",
        "zone": "Central Park South",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 4.000-8.000",
        "tip": "O hotel-lenda de Home Alone na esquina do Central Park"
      }
    ]
  },
  "Gramado": {
    "city": "Gramado",
    "items": [
      {
        "name": "Aldeia do Papai Noel",
        "category": "afternoon",
        "neighborhood": "Bosque do Vovô Nicola",
        "costBRL": 110,
        "tip": "Natal o ano inteiro — a casa do Noel no meio dos pinheiros · O monorail pelo bosque encanta os pequenos"
      },
      {
        "name": "Bela Vista Café Colonial",
        "category": "lunch",
        "neighborhood": "Av. das Hortênsias",
        "costBRL": 140,
        "tip": "O café colonial mais tradicional da serra — dezenas de itens · Vá com MUITA fome: cucas, tortas, embutidos e chocolates"
      },
      {
        "name": "Belle du Valais (fondue)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 230,
        "tip": "A sequência de fondue mais premiada de Gramado · Queijo, carne e chocolate — o rito completo da serra"
      },
      {
        "name": "Cantina Pastasciutta",
        "category": "lunch",
        "neighborhood": "Av. Borges de Medeiros",
        "costBRL": 120,
        "tip": "Massas caseiras de tradição italiana da serra · O galeto com massa é o combo colono"
      },
      {
        "name": "Galeteria Casa di Paolo",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 130,
        "tip": "O galeto al primo canto da tradição italiana gaúcha · Sequência com massa, polenta e salada — rodízio de fartura"
      },
      {
        "name": "Café Coffee & Motion",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 55,
        "tip": "Café de especialidade com métodos e grãos da serra · Pães de fermentação natural"
      },
      {
        "name": "Colosseo Ristorante",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 130,
        "tip": "Massas fartas no coração da Rua Coberta · O rondelli da casa é o pedido certo"
      },
      {
        "name": "Gasthof Edelweiss",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 150,
        "tip": "Cozinha alemã clássica — eisbein e marreco recheado · Chope artesanal da casa"
      },
      {
        "name": "Fritz & Frida",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 120,
        "tip": "Bistrô de comida alemã descomplicada · As salsichas artesanais com chucrute são o carro-chefe"
      },
      {
        "name": "Josephina Café",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 110,
        "tip": "Casinha charmosa com brunch e pratos leves · As tortas da vitrine são perigosas"
      },
      {
        "name": "La Caceria",
        "category": "dinner",
        "neighborhood": "Hotel Casa da Montanha",
        "costBRL": 220,
        "tip": "Carnes de caça e cozinha de montanha premiada · Ambiente rústico-chique com lareira"
      },
      {
        "name": "Lago Joaquina Rita Bier",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O lago escondido a passos do centro · Esculturas e deck para fotos"
      },
      {
        "name": "Lago Negro",
        "category": "morning",
        "neighborhood": "Planalto",
        "costBRL": 45,
        "tip": "Pedalinho em forma de cisne no lago cercado de hortênsias · Manhã cedo tem névoa fotogênica na água"
      },
      {
        "name": "Le Jardin Parque de Lavanda",
        "category": "morning",
        "neighborhood": "Serra Grande",
        "costBRL": 60,
        "tip": "Campos de lavanda com a serra ao fundo · Sorvete de lavanda na saída é ritual"
      },
      {
        "name": "Chocolate Lugano (café)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 45,
        "tip": "Café da manhã com o chocolate quente símbolo da cidade · A vitrine de trufas é uma armadilha deliciosa"
      },
      {
        "name": "Madero Steak House Gramado",
        "category": "dinner",
        "neighborhood": "Av. Borges de Medeiros",
        "costBRL": 140,
        "tip": "O cheeseburger famoso em versão serra · Opção segura que agrada adultos e crianças"
      },
      {
        "name": "Mamma Gema Trattoria",
        "category": "dinner",
        "neighborhood": "Av. das Hortênsias",
        "costBRL": 160,
        "tip": "Trattoria de receitas de nonna com toque contemporâneo · O nhoque ao pomodoro é conforto puro no frio"
      },
      {
        "name": "Mini Mundo",
        "category": "morning",
        "neighborhood": "Planalto",
        "costBRL": 95,
        "tip": "Cidade em miniatura com riqueza de detalhes impressionante · As crianças procuram os personagens escondidos"
      },
      {
        "name": "Mundo a Vapor",
        "category": "afternoon",
        "neighborhood": "Canela",
        "costBRL": 95,
        "tip": "Máquinas a vapor funcionando de verdade — fábricas em miniatura · A locomotiva atravessando a fachada é o cartão-postal"
      },
      {
        "name": "Dreamland Museu de Cera e Harley Motor Show",
        "category": "afternoon",
        "neighborhood": "Av. das Hortênsias",
        "costBRL": 130,
        "tip": "Combo de atrações na mesma avenida · Fotos com ídolos de cera divertem a família"
      },
      {
        "name": "Olivas de Gramado",
        "category": "morning",
        "neighborhood": "Linha Nova",
        "costBRL": 85,
        "tip": "Fazenda de oliveiras com degustação de azeites premiados · Paisagem toscana em plena serra gaúcha"
      },
      {
        "name": "Per Voi Ristorante",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 200,
        "tip": "Italiano elegante para a noite especial da viagem · Massas frescas e carta de vinhos da serra"
      },
      {
        "name": "Café da Prawer Chocolates",
        "category": "breakfast",
        "neighborhood": "Av. das Hortênsias",
        "costBRL": 50,
        "tip": "A fábrica de chocolate pioneira de Gramado · Chocolate quente cremoso que justifica a viagem"
      },
      {
        "name": "Vinícola Ravanello",
        "category": "afternoon",
        "neighborhood": "Linha Tapera",
        "costBRL": 90,
        "tip": "Degustação com vista dos parreirais · Tour pela cantina conta a história da família"
      },
      {
        "name": "Rua Coberta e centro de Gramado",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O coração da cidade — cafés, chocolates e clima europeu · A Igreja São Pedro e a Praça Major Nicoletti no caminho"
      },
      {
        "name": "Gelateria Nono Belo",
        "category": "afternoon",
        "neighborhood": "Rua Coberta",
        "costBRL": 30,
        "tip": "Gelato artesanal para a pausa entre passeios · Sabores de chocolate da serra"
      },
      {
        "name": "Tarantino Ristorante",
        "category": "dinner",
        "neighborhood": "Av. Borges de Medeiros",
        "costBRL": 170,
        "tip": "Italiano acolhedor no centro, massas e carnes na medida · Bom meio-termo entre o fondue e o galeto"
      },
      {
        "name": "Acquamotion (parque termal indoor)",
        "category": "morning",
        "neighborhood": "Gramado",
        "costBRL": 180,
        "tip": "Parque aquático TERMAL coberto - a carta de chuva e frio com crianças"
      },
      {
        "name": "Parque do Caracol (cascata)",
        "category": "morning",
        "neighborhood": "Canela",
        "costBRL": 60,
        "tip": "A cachoeira de 131m no cânion - mirante e trilhas fáceis pra família"
      },
      {
        "name": "Catedral de Pedra (Canela)",
        "category": "morning",
        "neighborhood": "Canela",
        "costBRL": 0,
        "tip": "A catedral gótica de pedra a 10 min de Gramado - combine com o centrinho de Canela"
      },
      {
        "name": "Lugano Choco Show (fábrica)",
        "category": "afternoon",
        "neighborhood": "Gramado",
        "costBRL": 50,
        "tip": "A fábrica-museu do chocolate com esteira de verdade e degustação"
      },
      {
        "name": "Café Colonial Coelho",
        "category": "breakfast",
        "neighborhood": "Gramado",
        "costBRL": 120,
        "tip": "O rival histórico do Bela Vista - mesa colonial de mais de 80 itens · Vá com MUITA fome; vale como refeição do dia"
      },
      {
        "name": "Sabor & Cia Empanadas",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 40,
        "tip": "As empanadas argentinas queridas do centrinho - almoço rápido entre passeios"
      },
      {
        "name": "Vinícola Jolimont",
        "category": "afternoon",
        "neighborhood": "Canela",
        "costBRL": 70,
        "tip": "Degustação com vista pro vale - o brinde da serra"
      },
      {
        "name": "Natal Luz (temporada)",
        "category": "night",
        "neighborhood": "Gramado",
        "costBRL": 180,
        "tip": "O maior Natal do mundo - shows e desfiles de outubro a janeiro · SAZONAL: confirmar datas e comprar com antecedência"
      },
      {
        "name": "Pedalinho no Lago Negro",
        "category": "afternoon",
        "neighborhood": "Gramado",
        "costBRL": 50,
        "tip": "O pedalinho cisne entre hortênsias - o clássico que emociona"
      },
      {
        "name": "Noite na Rua Coberta",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 60,
        "tip": "Música ao vivo, chocolate quente e o friozinho da serra - a noite família de Gramado"
      },
      {
        "name": "Skyglass Canela",
        "category": "afternoon",
        "neighborhood": "Canela",
        "costBRL": 150,
        "tip": "A plataforma de vidro sobre o vale - adrenalina cenográfica · Compre online; dia limpo vale ouro"
      },
      {
        "name": "Snowland (neve indoor)",
        "category": "morning",
        "neighborhood": "Gramado",
        "costBRL": 250,
        "tip": "Neve de verdade o ano todo - patinação, esqui e boneco de neve com as crianças · Luvas e casacos inclusos; meia extra ajuda"
      },
      {
        "name": "Mirante do Vale do Quilombo",
        "category": "afternoon",
        "neighborhood": "Gramado",
        "costBRL": 0,
        "tip": "O vale verde de tirar o fôlego na descida pra Canela - parada gratuita de 15 min"
      }
    ],
    "hotels": [
      {
        "name": "Bavária Sport Hotel",
        "zone": "Centro",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Família com piscina térmica e salão de jogos sem preço de resort"
      },
      {
        "name": "Hotel Casa da Montanha",
        "zone": "Centro",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.300-2.300",
        "tip": "Clima alpino no centro — lareira, vinho quente na recepção e serviço afiado"
      },
      {
        "name": "Gramado Hostel",
        "zone": "Piratini",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 90-180",
        "tip": "A opção mochileira da serra — quartos compartilhados e cozinha equipada · A 1,5 km do centro — leve isso na conta do deslocamento"
      },
      {
        "name": "Jardim Secreto Pousada",
        "zone": "Planalto",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "Charme escondido com hidro e lareira — casal em conta"
      },
      {
        "name": "Laghetto Golden",
        "zone": "Centro",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Rooftop com borda infinita aquecida — o cartão-postal da rede no centro"
      },
      {
        "name": "Hotel Ritta Höppner",
        "zone": "Mini Mundo",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.500-2.500",
        "tip": "Os chalés-jardim icônicos ao lado do Mini Mundo — capricho alemão lendário · Reserve MUITO antes: lotação eterna"
      },
      {
        "name": "Hotel Saint Andrews",
        "zone": "Lago Negro",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.500-6.000",
        "tip": "O Relais & Châteaux da serra — mordomia, adega e exclusividade absoluta · Adults-oriented: a lua de mel de Gramado"
      },
      {
        "name": "Estalagem St. Hubertus",
        "zone": "Lago Negro",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.400-2.400",
        "tip": "Vista pro Lago Negro e café da manhã premiado — romance puro · Somente adultos: casais agradecem"
      },
      {
        "name": "Pousada Vovó Carolina",
        "zone": "Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 350-550",
        "tip": "A pousada de dono presente — café caseiro e preço honesto no centro"
      },
      {
        "name": "Wish Serrano Resort",
        "zone": "Centro",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.200-2.200",
        "tip": "O resort família de Gramado — piscina térmica coberta e recreação infantil · A 5 min a pé da Rua Coberta"
      }
    ]
  },
  "Londres": {
    "city": "Londres",
    "items": [
      {
        "name": "Afternoon Tea no Fortnum & Mason",
        "category": "afternoon",
        "neighborhood": "Piccadilly",
        "costBRL": 320,
        "tip": "O ritual inglês no salão Diamond Jubilee · Scones com clotted cream servidos em torres de prata"
      },
      {
        "name": "BAO Soho",
        "category": "dinner",
        "neighborhood": "Soho",
        "costBRL": 120,
        "tip": "Os baos taiwaneses que criaram filas históricas no Soho · O clássico de porco confitado é o must"
      },
      {
        "name": "Borough Market",
        "category": "lunch",
        "neighborhood": "London Bridge",
        "costBRL": 95,
        "tip": "O mercado gastronômico de mil anos de Londres · O sanduíche de queijo derretido do Kappacasein é lendário"
      },
      {
        "name": "The Breakfast Club",
        "category": "breakfast",
        "neighborhood": "Soho/Angel",
        "costBRL": 95,
        "tip": "O café da manhã cult com decoração anos 80 · Panquecas e o full English no capricho"
      },
      {
        "name": "British Museum",
        "category": "morning",
        "neighborhood": "Bloomsbury",
        "costBRL": 0,
        "tip": "Pedra de Roseta, múmias e Partenon — entrada GRATUITA · Escolha 3 galerias e aceite não ver tudo"
      },
      {
        "name": "Burger & Lobster",
        "category": "dinner",
        "neighborhood": "Soho/Mayfair",
        "costBRL": 180,
        "tip": "O cardápio de duas opções que virou fenômeno · Lagosta inteira a preço de Londres justo"
      },
      {
        "name": "Camden Market",
        "category": "afternoon",
        "neighborhood": "Camden",
        "costBRL": 0,
        "tip": "O mercado alternativo à beira do canal · Street food do mundo inteiro nos pátios"
      },
      {
        "name": "Covent Garden",
        "category": "afternoon",
        "neighborhood": "Covent Garden",
        "costBRL": 0,
        "tip": "Artistas de rua disputam a praça da Apple Market · O mercado coberto tem lojas e cafés charmosos"
      },
      {
        "name": "Dishoom",
        "category": "dinner",
        "neighborhood": "Covent Garden/Shoreditch",
        "costBRL": 150,
        "tip": "O indiano estilo café de Bombaim que virou obsessão em Londres · O black daal cozinha 24 horas — obrigatório"
      },
      {
        "name": "Ffiona's",
        "category": "dinner",
        "neighborhood": "Kensington",
        "costBRL": 170,
        "tip": "Bistrô de bairro à luz de velas com dona no salão · Comfort food britânico feito com carinho"
      },
      {
        "name": "Flat Iron",
        "category": "lunch",
        "neighborhood": "Soho/Covent Garden",
        "costBRL": 110,
        "tip": "Um corte só, feito com perfeição, preço único · Sorvete de cortesia na saída"
      },
      {
        "name": "Franco Manca",
        "category": "lunch",
        "neighborhood": "Várias (Soho/Brixton)",
        "costBRL": 65,
        "tip": "Pizza de fermentação natural a preço justo · Nasceu no mercado de Brixton e conquistou a cidade"
      },
      {
        "name": "Hawksmoor",
        "category": "dinner",
        "neighborhood": "Seven Dials/City",
        "costBRL": 290,
        "tip": "A steakhouse britânica de referência · Cortes de gado britânico maturado na brasa"
      },
      {
        "name": "Hyde Park e Kensington Gardens",
        "category": "morning",
        "neighborhood": "Hyde Park",
        "costBRL": 0,
        "tip": "Pedalinho na Serpentine e o memorial da Diana · O playground da Diana é temático de Peter Pan"
      },
      {
        "name": "London Eye",
        "category": "afternoon",
        "neighborhood": "South Bank",
        "costBRL": 190,
        "tip": "30 minutos de volta com Londres inteira aos pés · Compre horário marcado — fim de tarde é o ouro"
      },
      {
        "name": "Monmouth Coffee",
        "category": "breakfast",
        "neighborhood": "Covent Garden/Borough",
        "costBRL": 50,
        "tip": "O café que ensinou Londres a beber café de verdade · Croissants da padaria vizinha"
      },
      {
        "name": "Natural History Museum",
        "category": "morning",
        "neighborhood": "South Kensington",
        "costBRL": 0,
        "tip": "O esqueleto de baleia-azul no salão principal — gratuito · A ala dos dinossauros é festa para as crianças"
      },
      {
        "name": "Musical no West End",
        "category": "night",
        "neighborhood": "West End",
        "costBRL": 350,
        "tip": "O Rei Leão e Matilda são certeiros com crianças · A bilheteria TKTS de Leicester Square vende o dia com desconto"
      },
      {
        "name": "Notting Hill e Portobello Road",
        "category": "afternoon",
        "neighborhood": "Notting Hill",
        "costBRL": 0,
        "tip": "As casas coloridas do filme e o mercado de antiguidades · Sábado é o dia cheio do Portobello Market"
      },
      {
        "name": "Ottolenghi Spitalfields",
        "category": "dinner",
        "neighborhood": "Spitalfields",
        "costBRL": 190,
        "tip": "A cozinha mediterrânea vibrante do chef mais influente da cidade · Os pratos de legumes roubam a cena da proteína"
      },
      {
        "name": "Padella",
        "category": "lunch",
        "neighborhood": "Borough",
        "costBRL": 90,
        "tip": "Massa fresca com preço honesto — fila que vale a pena · O pici cacio e pepe é o pedido"
      },
      {
        "name": "Poppies Fish & Chips",
        "category": "lunch",
        "neighborhood": "Spitalfields/Camden",
        "costBRL": 85,
        "tip": "O fish and chips clássico em cenário anos 50 · Peça com mushy peas para a experiência completa"
      },
      {
        "name": "Regency Café",
        "category": "breakfast",
        "neighborhood": "Westminster",
        "costBRL": 60,
        "tip": "O full English breakfast num caff de 1946 — cenário de cinema · A dona grita os pedidos prontos: parte do show"
      },
      {
        "name": "Rules (1798)",
        "category": "dinner",
        "neighborhood": "Covent Garden",
        "costBRL": 260,
        "tip": "O restaurante mais antigo de Londres — Dickens era cliente · Cozinha britânica clássica: tortas e caça"
      },
      {
        "name": "Seven Dials Market",
        "category": "lunch",
        "neighborhood": "Covent Garden",
        "costBRL": 90,
        "tip": "Food hall moderno num armazém de bananas vitoriano · Do cheeseburger ao taiwanês — cada um pede o seu"
      },
      {
        "name": "Tate Modern e Millennium Bridge",
        "category": "afternoon",
        "neighborhood": "Bankside",
        "costBRL": 0,
        "tip": "Arte moderna numa usina elétrica — gratuita · O mirante do 10º andar tem vista da St Pauls"
      },
      {
        "name": "Westminster, Big Ben e troca da guarda",
        "category": "morning",
        "neighborhood": "Westminster",
        "costBRL": 0,
        "tip": "Big Ben, Abadia e Parlamento no mesmo quarteirão · Troca da guarda no Buckingham ~10h45 — confira o calendário oficial"
      },
      {
        "name": "Ye Olde Cheshire Cheese (pub)",
        "category": "night",
        "neighborhood": "Fleet Street",
        "costBRL": 60,
        "tip": "Pub reconstruído em 1667 — Dickens bebia aqui; desça aos porões"
      },
      {
        "name": "Columbia Road Flower Market",
        "category": "morning",
        "neighborhood": "East End",
        "costBRL": 20,
        "tip": "O mercado de flores de domingo — gritaria cockney e fotos lindas · SÓ domingo de manhã"
      },
      {
        "name": "Greenwich de barco",
        "category": "morning",
        "neighborhood": "Greenwich",
        "costBRL": 80,
        "tip": "Desça o Tâmisa de barco até o meridiano — Cutty Sark e o mercado"
      },
      {
        "name": "Leadenhall Market",
        "category": "lunch",
        "neighborhood": "City",
        "costBRL": 50,
        "tip": "O mercado vitoriano que virou Beco Diagonal no cinema — almoce sob os arcos"
      },
      {
        "name": "Little Venice e canais",
        "category": "afternoon",
        "neighborhood": "Maida Vale",
        "costBRL": 40,
        "tip": "Barcos coloridos e cafés flutuantes — caminhe até Camden pelo canal"
      },
      {
        "name": "Primrose Hill ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Primrose Hill",
        "costBRL": 0,
        "tip": "O skyline inteiro num morro de piquenique — o fim de tarde dos londrinos"
      },
      {
        "name": "Ronnie Scotts (jazz)",
        "category": "night",
        "neighborhood": "Soho",
        "costBRL": 200,
        "tip": "O clube de jazz lendário do Soho desde 1959 · Reserve mesa com jantar"
      },
      {
        "name": "Science Museum",
        "category": "morning",
        "neighborhood": "South Kensington",
        "costBRL": 0,
        "tip": "Gratuito e interativo — a ala infantil Wonderlab vale o dia de chuva"
      },
      {
        "name": "Sky Garden",
        "category": "afternoon",
        "neighborhood": "City",
        "costBRL": 0,
        "tip": "O jardim no 35º andar com vista total — DE GRAÇA · Reserva online obrigatória, abre semanas antes"
      },
      {
        "name": "St Dunstan in the East",
        "category": "morning",
        "neighborhood": "City",
        "costBRL": 0,
        "tip": "A igreja em ruínas tomada pelo verde — o jardim secreto da City"
      },
      {
        "name": "Tower of London",
        "category": "morning",
        "neighborhood": "Tower Hill",
        "costBRL": 220,
        "tip": "As Joias da Coroa e os corvos da lenda — reserve o tour dos Beefeaters"
      },
      {
        "name": "V&A Museum",
        "category": "afternoon",
        "neighborhood": "South Kensington",
        "costBRL": 0,
        "tip": "O museu de design mais bonito do mundo — grátis, com pátio pra descansar"
      },
      {
        "name": "Warner Bros Studio (Harry Potter)",
        "category": "morning",
        "neighborhood": "Watford",
        "costBRL": 350,
        "tip": "Os sets REAIS de Harry Potter — o day-trip que redime qualquer viagem · Ingresso esgota MESES antes; compre já"
      },
      {
        "name": "Day-trip a Windsor",
        "category": "morning",
        "neighborhood": "Windsor",
        "costBRL": 180,
        "tip": "O castelo habitado mais antigo do mundo — 40 min de trem · Troca da guarda em dias alternados: confira"
      },
      {
        "name": "London Zoo",
        "category": "morning",
        "neighborhood": "Regents Park",
        "costBRL": 220,
        "tip": "O zoo mais antigo do mundo em plena Regents Park"
      }
    ],
    "hotels": [
      {
        "name": "Premier Inn County Hall",
        "zone": "South Bank",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Ao lado do London Eye por preço de rede — o segredo das famílias"
      },
      {
        "name": "The Savoy",
        "zone": "Strand",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 4.500-8.000",
        "tip": "A lenda art déco do Tâmisa — chá, história e mordomia"
      }
    ]
  },
  "Barcelona": {
    "city": "Barcelona",
    "items": [
      {
        "name": "7 Portes (1836)",
        "category": "dinner",
        "neighborhood": "Barceloneta/Born",
        "costBRL": 190,
        "tip": "A casa histórica da paella barcelonesa · A paella Parellada (sem cascas) é a assinatura"
      },
      {
        "name": "Bar del Pla",
        "category": "lunch",
        "neighborhood": "El Born",
        "costBRL": 120,
        "tip": "Tapas catalãs com toque contemporâneo · A bomba (bolinho picante) é a estrela"
      },
      {
        "name": "Praia da Barceloneta",
        "category": "afternoon",
        "neighborhood": "Barceloneta",
        "costBRL": 0,
        "tip": "A praia urbana com calçadão vibrante · Chiringuitos servem tinto de verano na areia"
      },
      {
        "name": "Bo de B (bocadillos)",
        "category": "lunch",
        "neighborhood": "Gòtic (porto)",
        "costBRL": 45,
        "tip": "O sanduíche cult de Barcelona — fila de estudantes e locais · Frango com todos os molhos: peça completo"
      },
      {
        "name": "La Boqueria e Las Ramblas",
        "category": "morning",
        "neighborhood": "El Raval",
        "costBRL": 0,
        "tip": "O mercado mais famoso da Europa — cores, sucos e jamón · Vá cedo, antes dos grupos de turistas"
      },
      {
        "name": "El Born e Museu Picasso",
        "category": "afternoon",
        "neighborhood": "El Born",
        "costBRL": 70,
        "tip": "O bairro mais charmoso para caminhar sem rumo · O museu mostra o Picasso jovem em 5 palácios medievais"
      },
      {
        "name": "Brunch & Cake",
        "category": "breakfast",
        "neighborhood": "Eixample",
        "costBRL": 90,
        "tip": "Pratos fotogênicos e porções generosas · As torradas montadas são obras de arte comíveis"
      },
      {
        "name": "Bunkers del Carmel ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "El Carmel",
        "costBRL": 0,
        "tip": "A vista 360° que os locais preferem · Leve algo para beliscar e chegue 1h antes do pôr do sol"
      },
      {
        "name": "Cal Pep",
        "category": "dinner",
        "neighborhood": "El Born",
        "costBRL": 220,
        "tip": "Balcão lendário de frutos do mar — deixe o Pep decidir · Chegue na abertura ou espere em pé"
      },
      {
        "name": "Camp Nou / Barça Immersive Tour",
        "category": "afternoon",
        "neighborhood": "Les Corts",
        "costBRL": 190,
        "tip": "O templo do futebol — museu e vestiários · Fanáticos e crianças saem em êxtase"
      },
      {
        "name": "Can Culleretes (1786)",
        "category": "dinner",
        "neighborhood": "Gòtic",
        "costBRL": 140,
        "tip": "O restaurante mais antigo da Catalunha · Cozinha catalã de sempre: canelones e suquet"
      },
      {
        "name": "Casa Batlló",
        "category": "morning",
        "neighborhood": "Passeig de Gràcia",
        "costBRL": 170,
        "tip": "A casa-dragão de Gaudí com audioguia imersivo · A Casa Milà (La Pedrera) fica a 5 minutos"
      },
      {
        "name": "Cervecería Catalana",
        "category": "lunch",
        "neighborhood": "Eixample",
        "costBRL": 130,
        "tip": "O balcão de tapas mais concorrido da cidade · Aponte o que quiser no balcão — é assim que funciona"
      },
      {
        "name": "Ciudad Condal",
        "category": "lunch",
        "neighborhood": "Rambla de Catalunya",
        "costBRL": 120,
        "tip": "Irmã da Catalana, mesmo nível de tapas · Montaditos e frutos do mar frescos"
      },
      {
        "name": "Parc de la Ciutadella",
        "category": "afternoon",
        "neighborhood": "Ciutadella",
        "costBRL": 0,
        "tip": "Barquinho no lago e a cascata monumental · O Arco do Triunfo na entrada rende fotos"
      },
      {
        "name": "El Nacional",
        "category": "dinner",
        "neighborhood": "Passeig de Gràcia",
        "costBRL": 160,
        "tip": "Quatro restaurantes num salão modernista deslumbrante · Cada um do grupo escolhe seu balcão"
      },
      {
        "name": "Federal Café",
        "category": "breakfast",
        "neighborhood": "Sant Antoni/Gòtic",
        "costBRL": 75,
        "tip": "Brunch australiano que virou instituição local · Ovos beneditinos e café de especialidade"
      },
      {
        "name": "Font Màgica e Montjuïc à noite",
        "category": "night",
        "neighborhood": "Montjuïc",
        "costBRL": 0,
        "tip": "O show de água, luz e música aos pés do MNAC · Confira dias e horários da temporada"
      },
      {
        "name": "Bairro Gótico e Catedral",
        "category": "morning",
        "neighborhood": "Ciutat Vella",
        "costBRL": 0,
        "tip": "Vielas medievais entre a Catedral e a Plaça Reial · A ponte do Bisbe é o cartão-postal escondido"
      },
      {
        "name": "La Paradeta",
        "category": "lunch",
        "neighborhood": "El Born/Sagrada Família",
        "costBRL": 110,
        "tip": "Frutos do mar por peso, estilo peixaria: escolha, pese, aguarde a senha · Preço de mercado, frescor de barco"
      },
      {
        "name": "La Pepita",
        "category": "dinner",
        "neighborhood": "Gràcia",
        "costBRL": 130,
        "tip": "Tapas criativas no bairro mais boêmio · As pepitas (sanduichinhos) dão nome à casa"
      },
      {
        "name": "Bodega La Puntual",
        "category": "dinner",
        "neighborhood": "El Born",
        "costBRL": 130,
        "tip": "Bodega clássica de conservas e vermute · O jamón cortado na hora vale o pedido"
      },
      {
        "name": "Granja La Pallaresa (churros)",
        "category": "breakfast",
        "neighborhood": "Gòtic",
        "costBRL": 40,
        "tip": "Churros com suisse (chocolate com chantilly) desde 1947 · Café da manhã catalão raiz na Rua Petritxol"
      },
      {
        "name": "Park Güell",
        "category": "morning",
        "neighborhood": "Gràcia",
        "costBRL": 95,
        "tip": "O parque de mosaicos de Gaudí com vista da cidade · Compre horário marcado — acesso à zona monumental é limitado"
      },
      {
        "name": "Passeig de Gràcia e La Pedrera",
        "category": "afternoon",
        "neighborhood": "Eixample",
        "costBRL": 0,
        "tip": "O boulevard do modernismo e das vitrines · A fachada ondulada da Pedrera vale a parada"
      },
      {
        "name": "Els Quatre Gats",
        "category": "dinner",
        "neighborhood": "Gòtic",
        "costBRL": 160,
        "tip": "O café modernista onde Picasso fez a primeira exposição · Mais pela história e pelo salão que pela cozinha"
      },
      {
        "name": "Sagrada Família",
        "category": "morning",
        "neighborhood": "Eixample",
        "costBRL": 150,
        "tip": "A obra-prima inacabada de Gaudí — ingresso SÓ online com horário · A luz dos vitrais pela manhã é um espetáculo à parte"
      },
      {
        "name": "El Xampanyet",
        "category": "lunch",
        "neighborhood": "El Born",
        "costBRL": 95,
        "tip": "Taberna de 1929 com o espumante da casa e anchovas lendárias · Em pé, apertado e perfeito"
      },
      {
        "name": "Aquàrium Barcelona",
        "category": "afternoon",
        "neighborhood": "Port Vell",
        "costBRL": 140,
        "tip": "Túnel de tubarões no porto — carta na manga com crianças pequenas"
      },
      {
        "name": "Praia de Bogatell",
        "category": "morning",
        "neighborhood": "Poblenou",
        "costBRL": 30,
        "tip": "A praia dos locais — mais limpa e tranquila que a Barceloneta"
      },
      {
        "name": "Casa Vicens",
        "category": "morning",
        "neighborhood": "Gràcia",
        "costBRL": 110,
        "tip": "A primeira casa de Gaudí — mourisca, colorida e sem as filas da Batlló"
      },
      {
        "name": "CosmoCaixa",
        "category": "morning",
        "neighborhood": "Sarrià",
        "costBRL": 30,
        "tip": "Floresta amazônica indoor e ciência mão-na-massa — o melhor dia de chuva com filhos"
      },
      {
        "name": "Parc del Laberint d Horta",
        "category": "morning",
        "neighborhood": "Horta",
        "costBRL": 15,
        "tip": "O labirinto de ciprestes escondido — romântico e ótimo com crianças"
      },
      {
        "name": "Day-trip a Montserrat",
        "category": "morning",
        "neighborhood": "Montserrat",
        "costBRL": 150,
        "tip": "O mosteiro encravado na montanha serrada — trem + cremalheira · Escolada Escolania canta 13h (dias úteis)"
      },
      {
        "name": "Palau de la Música Catalana",
        "category": "afternoon",
        "neighborhood": "Sant Pere",
        "costBRL": 110,
        "tip": "O teatro com claraboia de vitral que derrete — tour ou concerto"
      },
      {
        "name": "Paradiso (speakeasy)",
        "category": "night",
        "neighborhood": "El Born",
        "costBRL": 90,
        "tip": "Entra pela geladeira da pastrameria — eleito melhor bar do mundo · Fila real; vá cedo (19h) ou tarde"
      },
      {
        "name": "Bike pelo Passeig Marítim",
        "category": "afternoon",
        "neighborhood": "Barceloneta",
        "costBRL": 60,
        "tip": "Pedalar da Barceloneta ao Fòrum com o Mediterrâneo do lado"
      },
      {
        "name": "Poble Espanyol",
        "category": "afternoon",
        "neighborhood": "Montjuïc",
        "costBRL": 90,
        "tip": "A Espanha em miniatura — vilas, artesãos e oficinas pras crianças"
      },
      {
        "name": "Mercat de Sant Antoni",
        "category": "morning",
        "neighborhood": "Sant Antoni",
        "costBRL": 40,
        "tip": "O mercado restaurado sem os turistas da Boqueria — domingo tem feira de livros"
      },
      {
        "name": "Recinte Modernista de Sant Pau",
        "category": "morning",
        "neighborhood": "Eixample",
        "costBRL": 90,
        "tip": "O hospital modernista irmão da Sagrada — pavilhões de conto de fadas sem multidão"
      },
      {
        "name": "Flamenco no Tablao Cordobés",
        "category": "night",
        "neighborhood": "Las Ramblas",
        "costBRL": 220,
        "tip": "Flamenco de verdade nas Ramblas desde 1970 — reserve o show com jantar"
      },
      {
        "name": "Teleférico de Montjuïc",
        "category": "afternoon",
        "neighborhood": "Montjuïc",
        "costBRL": 80,
        "tip": "A subida panorâmica até o castelo — combine com a Font Màgica à noite"
      },
      {
        "name": "Tibidabo (parque no topo)",
        "category": "morning",
        "neighborhood": "Tibidabo",
        "costBRL": 120,
        "tip": "Parque de diversões centenário com a cidade inteira aos pés — funicular histórico"
      }
    ],
    "hotels": [
      {
        "name": "Hotel Arts Barcelona",
        "zone": "Barceloneta",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "A torre de frente pro mar com piscina e o peixe do Gehry ao lado"
      },
      {
        "name": "Majestic Hotel & Spa",
        "zone": "Passeig de Gràcia",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "Clássico com rooftop pra Sagrada — elegância no Passeig"
      },
      {
        "name": "Yurbban Trafalgar",
        "zone": "Sant Pere",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Rooftop com piscina e a Catedral de fundo — valor imbatível"
      }
    ]
  },
  "Porto Seguro": {
    "city": "Porto Seguro",
    "items": [
      {
        "name": "Centrinho de Arraial d'Ajuda",
        "category": "night",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 60,
        "tip": "Ruelas charmosas, música e a igrejinha no alto - a noite boêmia-família da região"
      },
      {
        "name": "Day-trip a Caraíva",
        "category": "morning",
        "neighborhood": "Caraíva",
        "costBRL": 180,
        "tip": "Vila sem carros entre rio e mar - travessia de canoa e ruas de areia · Dia inteiro; leve dinheiro vivo e pouca coisa"
      },
      {
        "name": "Almoço pé na areia em Caraíva",
        "category": "lunch",
        "neighborhood": "Caraíva",
        "costBRL": 80,
        "tip": "Peixe na brasa à beira do rio - o almoço raiz da vila"
      },
      {
        "name": "Arraial d'Ajuda Eco Parque",
        "category": "morning",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 180,
        "tip": "O parque aquático pé na praia - toboáguas + mar no mesmo dia"
      },
      {
        "name": "Praia do Espelho",
        "category": "morning",
        "neighborhood": "Trancoso",
        "costBRL": 150,
        "tip": "Eleita uma das praias mais bonitas do Brasil - falésias e piscinas na maré baixa · Vá em MARÉ BAIXA (confira a tábua); acesso por estrada de terra"
      },
      {
        "name": "Reserva Pataxó da Jaqueira",
        "category": "morning",
        "neighborhood": "Porto Seguro",
        "costBRL": 80,
        "tip": "Vivência com o povo Pataxó na mata - pintura, trilha e história viva · Agende antes; experiência respeitosa e transformadora"
      },
      {
        "name": "Mercado Municipal + Casa de Farinha",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 25,
        "tip": "Beiju saindo na hora e frutas do cacau ao cupuaçu - o sabor local sem turismo"
      },
      {
        "name": "Praia do Parracho",
        "category": "afternoon",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 90,
        "tip": "Barracas estruturadas e mar calminho - a tarde de família em Arraial"
      },
      {
        "name": "Praia de Pitinga",
        "category": "morning",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 60,
        "tip": "Falésias coloridas e mar de cartão-postal - a praia-joia de Arraial"
      },
      {
        "name": "Quadrado de Trancoso",
        "category": "afternoon",
        "neighborhood": "Trancoso",
        "costBRL": 30,
        "tip": "O gramado mais famoso do Brasil - casinhas coloridas, igrejinha e o mar ao fundo · Fim de tarde é mágico; jantar nos restaurantes do próprio Quadrado"
      },
      {
        "name": "Recife de Fora (piscinas naturais)",
        "category": "morning",
        "neighborhood": "Porto Seguro",
        "costBRL": 150,
        "tip": "Snorkel nas piscinas de coral em maré baixa - saída de barco da Balsa · Só em maré baixa; protetor reef-safe"
      },
      {
        "name": "Sorvete artesanal no Quadrado",
        "category": "afternoon",
        "neighborhood": "Trancoso",
        "costBRL": 25,
        "tip": "Sabores de fruta do cacau pra rodar o Quadrado no fim de tarde"
      },
      {
        "name": "Axé pé na areia (Tôa Tôa)",
        "category": "afternoon",
        "neighborhood": "Taperapuã",
        "costBRL": 100,
        "tip": "O luau e axé das barracas históricas - dança, animação e Bahia raiz"
      },
      {
        "name": "Cabana na Praia do Espelho",
        "category": "lunch",
        "neighborhood": "Trancoso",
        "costBRL": 120,
        "tip": "Moqueca com a vista mais bonita da Bahia - reserve mesa na cabana clássica"
      },
      {
        "name": "Açaí e frutas na Orla Norte",
        "category": "breakfast",
        "neighborhood": "Orla Norte",
        "costBRL": 35,
        "tip": "Quiosques de açaí e frutas abrindo com o sol · Café da manhã leve antes da praia"
      },
      {
        "name": "Almoço pé na areia no Axé Moi",
        "category": "lunch",
        "neighborhood": "Taperapuã",
        "costBRL": 120,
        "tip": "A mega-barraca com estrutura de resort · Peixe frito e petiscos com o mar na frente"
      },
      {
        "name": "Jantar no Beco das Cores (Arraial)",
        "category": "dinner",
        "neighborhood": "Rua do Mucugê",
        "costBRL": 130,
        "tip": "Galeria a céu aberto com restaurantes e clima de festa · Escolha entre crepes, massas e frutos do mar"
      },
      {
        "name": "Cacau (Trancoso)",
        "category": "dinner",
        "neighborhood": "Quadrado de Trancoso",
        "costBRL": 180,
        "tip": "Bahia contemporânea no Quadrado aceso · A moqueca de cacau é a assinatura da casa"
      },
      {
        "name": "Cafés da Rua do Mucugê (Arraial)",
        "category": "breakfast",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 45,
        "tip": "A rua acorda com padarias e cafés artesanais · Pão na chapa, tapioca e sucos de frutas do cerrado baiano"
      },
      {
        "name": "Capim Santo (Trancoso)",
        "category": "dinner",
        "neighborhood": "Quadrado de Trancoso",
        "costBRL": 220,
        "tip": "A casa da chef Morena Leite — referência nacional · Menu que celebra o dendê e as ervas do quintal"
      },
      {
        "name": "Centro Histórico e Marco do Descobrimento",
        "category": "morning",
        "neighborhood": "Cidade Histórica",
        "costBRL": 20,
        "tip": "Onde o Brasil começou — casario colonial e o Marco de 1503 · Vista do alto da falésia para o mar"
      },
      {
        "name": "Colher de Pau (Arraial)",
        "category": "lunch",
        "neighborhood": "Rua do Mucugê",
        "costBRL": 130,
        "tip": "As moquecas mais elogiadas do Arraial · O bobó de camarão disputa com a moqueca"
      },
      {
        "name": "Praia de Coroa Vermelha e aldeia Pataxó",
        "category": "morning",
        "neighborhood": "Santa Cruz Cabrália",
        "costBRL": 0,
        "tip": "Onde foi rezada a primeira missa do Brasil · Artesanato Pataxó direto dos indígenas"
      },
      {
        "name": "Ilha dos Aquários (jantar na ilha)",
        "category": "dinner",
        "neighborhood": "Ilha no Rio Buranhém",
        "costBRL": 150,
        "tip": "Barco à noite até a ilha com aquários gigantes e restaurantes · Funciona em dias específicos — confirme a programação"
      },
      {
        "name": "La Tarrafa (Arraial)",
        "category": "dinner",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 140,
        "tip": "Frutos do mar com toque mediterrâneo · O polvo grelhado é o prato-desejo"
      },
      {
        "name": "Manguti (Arraial)",
        "category": "lunch",
        "neighborhood": "Estrada do Mucugê",
        "costBRL": 120,
        "tip": "Massas artesanais premiadas no meio da Bahia · O talharim com camarão é a assinatura"
      },
      {
        "name": "Memorial da Epopeia do Descobrimento",
        "category": "afternoon",
        "neighborhood": "Orla Norte",
        "costBRL": 65,
        "tip": "Réplica em tamanho real da nau de Cabral — dá para subir · Guias contam a chegada de 1500 com detalhes"
      },
      {
        "name": "Museu de Porto Seguro",
        "category": "afternoon",
        "neighborhood": "Cidade Histórica",
        "costBRL": 25,
        "tip": "No antigo paço municipal de 1772 · Acervo indígena e do descobrimento"
      },
      {
        "name": "Fim de tarde na Orla Norte",
        "category": "afternoon",
        "neighborhood": "Orla Norte",
        "costBRL": 0,
        "tip": "Calçadão à beira-mar entre coqueiros · Quiosques de água de coco e caldo de cana"
      },
      {
        "name": "Passarela do Descobrimento (Passarela do Álcool)",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O calçadão histórico de barraquinhas, artesanato e capeta (o drink!) · Prove os beijus e doces de tabuleiro"
      },
      {
        "name": "Paulinho Pescador (Arraial)",
        "category": "dinner",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 110,
        "tip": "Peixe fresco do dia, simples e certeiro · Preço justo raro em cidade turística"
      },
      {
        "name": "Portinha",
        "category": "lunch",
        "neighborhood": "Centro/Arraial",
        "costBRL": 85,
        "tip": "O self-service mais querido da região — comida por quilo de qualidade · Mesas na varanda com movimento da rua"
      },
      {
        "name": "Praia do Mutá",
        "category": "afternoon",
        "neighborhood": "Orla Norte (divisa Cabrália)",
        "costBRL": 0,
        "tip": "Mar de piscina e coqueiral — a praia tranquila da orla · Contraste perfeito com a agitação de Taperapuã"
      },
      {
        "name": "Rabanete (Trancoso)",
        "category": "lunch",
        "neighborhood": "Quadrado de Trancoso",
        "costBRL": 140,
        "tip": "Restaurante-fazenda no Quadrado, do forno a lenha · Ingredientes da horta própria"
      },
      {
        "name": "Recanto do Sol (Centro)",
        "category": "dinner",
        "neighborhood": "Centro de Porto Seguro",
        "costBRL": 100,
        "tip": "Cozinha regional farta perto da Passarela · Boa opção nas noites de centro"
      },
      {
        "name": "Praia de Taperapuã (barracas)",
        "category": "morning",
        "neighborhood": "Orla Norte",
        "costBRL": 0,
        "tip": "A praia das mega-barracas: Axé Moi e Toa Toa · Estrutura completa: espreguiçadeira, música e aula de lambaeróbica"
      },
      {
        "name": "Tapiocas e beijus da Passarela",
        "category": "breakfast",
        "neighborhood": "Passarela do Descobrimento",
        "costBRL": 30,
        "tip": "As bancas de tabuleiro fazem tapioca na hora · Coco, queijo e banana — o café baiano de rua"
      },
      {
        "name": "Tia Nenzinha",
        "category": "lunch",
        "neighborhood": "Passarela do Descobrimento",
        "costBRL": 110,
        "tip": "Cozinha baiana tradicional desde 1976 na Passarela · Moqueca de peixe com pirão é a pedida"
      }
    ],
    "hotels": [
      {
        "name": "Arraial d'Ajuda Eco Resort",
        "zone": "Arraial d Ajuda",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 900-1.600",
        "tip": "Resort de reserva ecológica entre a balsa e a vila - praia calma"
      },
      {
        "name": "Club Med Trancoso",
        "zone": "Trancoso",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "All-inclusive à beira da falésia - kids club que salva férias"
      },
      {
        "name": "Fasano Trancoso",
        "zone": "Trancoso",
        "tier": "resort",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.500-7.000",
        "tip": "Bangalôs com piscinas privadas sobre a praia de Itapororoca"
      },
      {
        "name": "Uxua Casa Hotel & Spa",
        "zone": "Trancoso",
        "tier": "resort",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.000-6.000",
        "tip": "As casas do Quadrado viradas hotel-lenda - design de Wilbert Das"
      }
    ]
  },
  "Dubai": {
    "city": "Dubai",
    "items": [
      {
        "name": "Al Fanar Restaurant",
        "category": "dinner",
        "neighborhood": "Festival City/Madinat",
        "costBRL": 150,
        "tip": "Cozinha emirati num cenário da Dubai dos anos 1960 · Machboos de camarão e luqaimat de sobremesa"
      },
      {
        "name": "Al Safadi",
        "category": "dinner",
        "neighborhood": "Sheikh Zayed Road",
        "costBRL": 130,
        "tip": "O libanês de confiança das famílias de Dubai · Mezzes fartos e carnes na brasa"
      },
      {
        "name": "Al Ustad Special Kabab",
        "category": "lunch",
        "neighborhood": "Bur Dubai",
        "costBRL": 70,
        "tip": "Kababs iranianos desde 1978 — paredes cobertas de fotos de clientes · O frango marinado no iogurte açafrão é o clássico"
      },
      {
        "name": "Arabian Tea House",
        "category": "lunch",
        "neighborhood": "Al Fahidi",
        "costBRL": 110,
        "tip": "Pátio de gaiolas brancas e buganvílias no bairro histórico · Pratos emirati tradicionais — prove o machboos"
      },
      {
        "name": "Bu Qtair",
        "category": "lunch",
        "neighborhood": "Jumeirah (Fishing Harbour)",
        "costBRL": 85,
        "tip": "Do contêiner de pescadores a lenda gastronômica · Peixe do dia frito com masala — aponte e pese"
      },
      {
        "name": "Burj Khalifa — At the Top",
        "category": "morning",
        "neighborhood": "Downtown",
        "costBRL": 260,
        "tip": "O prédio mais alto do mundo — decks 124/125 · Compre horário marcado; o pôr do sol esgota primeiro"
      },
      {
        "name": "The Cheesecake Factory (Dubai Mall)",
        "category": "dinner",
        "neighborhood": "Downtown",
        "costBRL": 160,
        "tip": "A aposta segura que toda a família aprova · Mesas com vista para a fonte em algumas alas"
      },
      {
        "name": "Comptoir 102",
        "category": "breakfast",
        "neighborhood": "Jumeirah",
        "costBRL": 95,
        "tip": "Café-conceito saudável num jardim escondido · Bowls e sucos prensados antes da praia"
      },
      {
        "name": "Din Tai Fung (Dubai Mall)",
        "category": "lunch",
        "neighborhood": "Downtown",
        "costBRL": 120,
        "tip": "Os xiao long bao mais famosos do mundo, no meio das compras · Veja os dumplings sendo dobrados na cozinha de vidro"
      },
      {
        "name": "Dubai Mall, Aquário e Fonte Dançante",
        "category": "afternoon",
        "neighborhood": "Downtown",
        "costBRL": 0,
        "tip": "O maior shopping do mundo — o aquário se vê de graça do corredor · Show da fonte a cada 30 min após as 18h"
      },
      {
        "name": "Show noturno da Dubai Fountain",
        "category": "night",
        "neighborhood": "Downtown",
        "costBRL": 0,
        "tip": "Água, luz e música aos pés do Burj Khalifa — gratuito · Shows a cada 30 minutos à noite"
      },
      {
        "name": "Dubai Frame",
        "category": "afternoon",
        "neighborhood": "Zabeel Park",
        "costBRL": 75,
        "tip": "A moldura dourada gigante: de um lado a Dubai antiga, do outro a nova · O chão de vidro do topo rende gritos e fotos"
      },
      {
        "name": "Karak House",
        "category": "breakfast",
        "neighborhood": "City Walk",
        "costBRL": 65,
        "tip": "O chai karak — o café com leite dos Emirados — em versão charmosa · Ovos shakshuka e pães árabes na chapa"
      },
      {
        "name": "Kite Beach",
        "category": "morning",
        "neighborhood": "Jumeirah",
        "costBRL": 0,
        "tip": "Praia pública com vista do Burj Al Arab · Calçadão com food trucks e quadras"
      },
      {
        "name": "Logma",
        "category": "dinner",
        "neighborhood": "Boxpark/Dubai Mall",
        "costBRL": 95,
        "tip": "Comfort food khaleeji descomplicada · Chapati de ovo com queijo e chai karak"
      },
      {
        "name": "Dubai Marina Walk",
        "category": "afternoon",
        "neighborhood": "Marina",
        "costBRL": 0,
        "tip": "Calçadão entre arranha-céus e iates · Fim de tarde acende os prédios espelhados"
      },
      {
        "name": "Mesquita de Jumeirah (visita guiada)",
        "category": "morning",
        "neighborhood": "Jumeirah",
        "costBRL": 60,
        "tip": "Aberta a não-muçulmanos com tour “Open Doors, Open Minds” · Café e chá emirati servidos na recepção"
      },
      {
        "name": "Ninive",
        "category": "dinner",
        "neighborhood": "Jumeirah Emirates Towers",
        "costBRL": 260,
        "tip": "Majlis a céu aberto — tenda chique de tapetes e lanternas · Cozinha do Oriente Médio e Norte da África"
      },
      {
        "name": "Old Dubai: Al Fahidi, abras e souks",
        "category": "morning",
        "neighborhood": "Bur Dubai/Deira",
        "costBRL": 25,
        "tip": "O bairro histórico de vento-torres e becos de areia · Atravesse o Creek de abra por 1 dirham — a melhor pechincha da cidade"
      },
      {
        "name": "Operation: Falafel",
        "category": "lunch",
        "neighborhood": "Várias (JBR/Downtown)",
        "costBRL": 55,
        "tip": "O street food levantino em versão moderna · Falafel crocante e shawarma no pão saj"
      },
      {
        "name": "The View at The Palm",
        "category": "afternoon",
        "neighborhood": "Palm Jumeirah",
        "costBRL": 160,
        "tip": "A palmeira artificial vista do 52º andar · Vá de monotrilho pela espinha da Palm"
      },
      {
        "name": "Pierchic",
        "category": "dinner",
        "neighborhood": "Al Qasr (píer sobre o mar)",
        "costBRL": 480,
        "tip": "Restaurante no fim de um píer com o Burj Al Arab de frente · A noite mais romântica da viagem — reserve o pôr do sol"
      },
      {
        "name": "Ravi Restaurant",
        "category": "lunch",
        "neighborhood": "Satwa",
        "costBRL": 60,
        "tip": "O paquistanês cult que alimenta Dubai desde 1978 · Butter chicken e pães saídos do tandoor"
      },
      {
        "name": "Ski Dubai (Mall of the Emirates)",
        "category": "afternoon",
        "neighborhood": "Al Barsha",
        "costBRL": 300,
        "tip": "Neve de verdade a -4°C no meio do deserto · Encontro com pinguins em horários marcados"
      },
      {
        "name": "Souk Madinat Jumeirah",
        "category": "afternoon",
        "neighborhood": "Jumeirah",
        "costBRL": 0,
        "tip": "Souk cenográfico com canais e vista do Burj Al Arab · A foto clássica do hotel-vela é do deck dos restaurantes"
      },
      {
        "name": "Tom&Serg",
        "category": "breakfast",
        "neighborhood": "Al Quoz",
        "costBRL": 90,
        "tip": "O café de especialidade que abriu o movimento em Dubai · Brunch australiano num galpão industrial"
      },
      {
        "name": "Day-trip a Abu Dhabi",
        "category": "morning",
        "neighborhood": "Abu Dhabi",
        "costBRL": 350,
        "tip": "A Mesquita Sheikh Zayed de mármore branco — 90 min de estrada · Dress code rigoroso; entrada gratuita com reserva"
      },
      {
        "name": "Al Seef (creek retrô)",
        "category": "night",
        "neighborhood": "Creek",
        "costBRL": 40,
        "tip": "A margem do creek reconstruída em estilo antigo — jantar com vista dos abras"
      },
      {
        "name": "Aquaventure (Atlantis)",
        "category": "morning",
        "neighborhood": "Palm Jumeirah",
        "costBRL": 450,
        "tip": "O maior parque aquático do mundo — tobogã que atravessa tanque de tubarões"
      },
      {
        "name": "AYA Universe",
        "category": "night",
        "neighborhood": "Wafi",
        "costBRL": 180,
        "tip": "Parque imersivo de luzes — o teamLab de Dubai"
      },
      {
        "name": "Dhow cruise na Marina",
        "category": "night",
        "neighborhood": "Marina",
        "costBRL": 180,
        "tip": "Jantar num barco de madeira tradicional entre arranha-céus iluminados"
      },
      {
        "name": "Global Village",
        "category": "night",
        "neighborhood": "Dubailand",
        "costBRL": 30,
        "tip": "90 países em pavilhões, comida e shows — o passeio noturno das famílias · Out-abr apenas (fecha no verão)"
      },
      {
        "name": "Day-trip a Hatta",
        "category": "morning",
        "neighborhood": "Hatta",
        "costBRL": 250,
        "tip": "Montanhas, caiaque na represa turquesa e vilarejo heritage — o outro Emirado"
      },
      {
        "name": "IMG Worlds of Adventure",
        "category": "morning",
        "neighborhood": "Dubailand",
        "costBRL": 320,
        "tip": "O maior parque coberto do mundo — Marvel e dinossauros no ar-condicionado"
      },
      {
        "name": "JBR The Beach",
        "category": "afternoon",
        "neighborhood": "Marina",
        "costBRL": 60,
        "tip": "O calçadão de praia da Marina — esportes, lojas e arranha-céus na areia"
      },
      {
        "name": "La Mer Beach",
        "category": "afternoon",
        "neighborhood": "Jumeirah",
        "costBRL": 60,
        "tip": "Praia urbana descolada com grafites, food trucks e mar calmo"
      },
      {
        "name": "Miracle Garden",
        "category": "morning",
        "neighborhood": "Dubailand",
        "costBRL": 120,
        "tip": "150 milhões de flores esculpidas no deserto — castelos e aviões floridos · Nov-mai apenas"
      },
      {
        "name": "Museum of the Future",
        "category": "morning",
        "neighborhood": "Financial District",
        "costBRL": 270,
        "tip": "O anel de caligrafia árabe mais fotografado do mundo — dentro, 2071 · Ingressos datados esgotam: compre antes"
      },
      {
        "name": "Dubai Opera",
        "category": "night",
        "neighborhood": "Downtown",
        "costBRL": 300,
        "tip": "A ópera em forma de dhow — confira a agenda de espetáculos"
      },
      {
        "name": "Desert Safari com jantar",
        "category": "afternoon",
        "neighborhood": "Deserto",
        "costBRL": 280,
        "tip": "Dunas na 4x4, camelo, sandboard e jantar beduíno com show · Reserve operadora avaliada; buscar no hotel incluso"
      },
      {
        "name": "Souk de Ouro e Especiarias (Deira)",
        "category": "morning",
        "neighborhood": "Deira",
        "costBRL": 20,
        "tip": "Atravesse o creek de abra (1 dirham) e regateie no ouro e no açafrão"
      }
    ],
    "hotels": [
      {
        "name": "Address Downtown",
        "zone": "Downtown",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "A fonte dançante e o Burj Khalifa na varanda"
      },
      {
        "name": "Atlantis The Palm",
        "zone": "Palm Jumeirah",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-5.000",
        "tip": "O resort-ícone com Aquaventure e aquário inclusos — férias dentro do hotel"
      },
      {
        "name": "Burj Al Arab",
        "zone": "Jumeirah",
        "tier": "resort",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 8.000-15.000",
        "tip": "A vela mais famosa do mundo — mordomo, Rolls e mar privado"
      },
      {
        "name": "Jumeirah Beach Hotel",
        "zone": "Jumeirah",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 2.200-3.800",
        "tip": "A onda de vidro com praia privada e Wild Wadi grátis"
      },
      {
        "name": "Rove Downtown",
        "zone": "Downtown",
        "tier": "budget",
        "personaTags": [
          "family",
          "solo"
        ],
        "priceRangeBRL": "R$ 400-650",
        "tip": "O budget-esperto de Dubai — vista do Burj por preço de gente"
      }
    ]
  },
  "Cidade do Cabo": {
    "city": "Cidade do Cabo",
    "items": [
      {
        "name": "Bo-Kaap",
        "category": "morning",
        "neighborhood": "Bo-Kaap",
        "costBRL": 0,
        "tip": "As casas coloridas do bairro malaio — patrimônio vivo · Manhã tem a melhor luz e menos gente"
      },
      {
        "name": "Bootlegger Coffee Company",
        "category": "breakfast",
        "neighborhood": "Sea Point/Várias",
        "costBRL": 60,
        "tip": "A rede local de café de especialidade · Ovos e abacate no capricho sul-africano"
      },
      {
        "name": "Pinguins de Boulders Beach",
        "category": "morning",
        "neighborhood": "Simon's Town",
        "costBRL": 60,
        "tip": "A passarela de Foxy Beach é o melhor ângulo; de manhã cedo os pinguins estão na areia"
      },
      {
        "name": "Camps Bay ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Camps Bay",
        "costBRL": 0,
        "tip": "A praia glamourosa aos pés dos Doze Apóstolos · Fim de tarde no calçadão com o sol caindo no Atlântico"
      },
      {
        "name": "Cabo da Boa Esperança e Cape Point",
        "category": "morning",
        "neighborhood": "Cape Peninsula",
        "costBRL": 120,
        "tip": "Emende com Boulders e Chapman's Peak num dia de península — alugue carro ou tour · Atenção aos babuínos: nada de comida à vista"
      },
      {
        "name": "Clarke's Bar & Dining",
        "category": "lunch",
        "neighborhood": "Bree Street",
        "costBRL": 90,
        "tip": "O diner descolado da rua mais cool do centro · Burgers e sanduíches caprichados"
      },
      {
        "name": "The Codfather",
        "category": "dinner",
        "neighborhood": "Camps Bay",
        "costBRL": 230,
        "tip": "Escolha o peixe na vitrine e pague por peso — sem cardápio · Sushi bar giratório para os indecisos"
      },
      {
        "name": "Vinhedos de Groot Constantia",
        "category": "afternoon",
        "neighborhood": "Constantia",
        "costBRL": 130,
        "tip": "A vinícola mais antiga do hemisfério sul (1685) · Degustação com vista dos parreirais na encosta"
      },
      {
        "name": "Den Anker",
        "category": "dinner",
        "neighborhood": "Waterfront",
        "costBRL": 180,
        "tip": "Belga histórico do píer — mexilhões e cervejas de abadia · Vista da Table Mountain sobre a água"
      },
      {
        "name": "El Burro",
        "category": "lunch",
        "neighborhood": "Green Point",
        "costBRL": 120,
        "tip": "Mexicano contemporâneo querido dos locais · Tacos de peixe fresco do Atlântico"
      },
      {
        "name": "GOLD Restaurant",
        "category": "dinner",
        "neighborhood": "Green Point",
        "costBRL": 280,
        "tip": "Jantar-experiência pan-africano de 14 pratos com tambores e dança · Aula de djembe antes do jantar — as crianças participam"
      },
      {
        "name": "Harbour House (Kalk Bay)",
        "category": "lunch",
        "neighborhood": "Kalk Bay",
        "costBRL": 180,
        "tip": "Frutos do mar com as ondas quebrando na janela · Versão elegante do almoço no porto"
      },
      {
        "name": "Jason Bakery",
        "category": "breakfast",
        "neighborhood": "Bree Street",
        "costBRL": 70,
        "tip": "A padaria que inventou o doughssant · Fila de sábado é evento social"
      },
      {
        "name": "Kalky's (Kalk Bay)",
        "category": "lunch",
        "neighborhood": "Kalk Bay",
        "costBRL": 70,
        "tip": "Fish and chips no porto de pescadores, direto do barco · Papel na mesa, gaivotas de olho e o melhor hake da região"
      },
      {
        "name": "Jardim Botânico de Kirstenbosch",
        "category": "morning",
        "neighborhood": "Newlands",
        "costBRL": 90,
        "tip": "Um dos jardins botânicos mais bonitos do planeta, na encosta da montanha · A passarela Boomslang serpenteia sobre as copas"
      },
      {
        "name": "Kloof Street House",
        "category": "dinner",
        "neighborhood": "Gardens",
        "costBRL": 210,
        "tip": "Casarão vitoriano de jardins iluminados por luzinhas · Clima de festa elegante no jantar"
      },
      {
        "name": "Mama Africa",
        "category": "dinner",
        "neighborhood": "Long Street",
        "costBRL": 160,
        "tip": "Carnes de caça (springbok, kudu) com marimba ao vivo · Turístico e divertido na medida"
      },
      {
        "name": "Ocean Basket (Waterfront)",
        "category": "lunch",
        "neighborhood": "Waterfront",
        "costBRL": 100,
        "tip": "A rede sul-africana de frutos do mar que agrada família inteira · Combinados fartos de camarão e calamares"
      },
      {
        "name": "Panama Jack's",
        "category": "dinner",
        "neighborhood": "Porto (docas)",
        "costBRL": 190,
        "tip": "Taverna de frutos do mar escondida no porto de trabalho · Lagostas e ostras sem frescura desde 1989"
      },
      {
        "name": "The Pot Luck Club",
        "category": "dinner",
        "neighborhood": "Old Biscuit Mill (Woodstock)",
        "costBRL": 290,
        "tip": "Tapas do chef Luke Dale-Roberts no topo do silo · Vista 360° de Woodstock à montanha"
      },
      {
        "name": "Robben Island",
        "category": "morning",
        "neighborhood": "V&A Waterfront (ferry)",
        "costBRL": 260,
        "tip": "A prisão onde Mandela passou 18 anos — tour guiado por ex-presos · Ferry + ilha = meio dia; reserve com antecedência"
      },
      {
        "name": "Sea Point Promenade",
        "category": "afternoon",
        "neighborhood": "Sea Point",
        "costBRL": 0,
        "tip": "O calçadão à beira-mar dos capetonianos · Playgrounds e esculturas pelo caminho"
      },
      {
        "name": "Signal Hill ao pôr do sol",
        "category": "afternoon",
        "neighborhood": "Signal Hill",
        "costBRL": 0,
        "tip": "O pôr do sol clássico com a cidade e o mar aos pés · Leve manta e algo para beliscar — é ritual local"
      },
      {
        "name": "Table Mountain (teleférico)",
        "category": "morning",
        "neighborhood": "Table Mountain",
        "costBRL": 180,
        "tip": "O teleférico fecha com vento — vá no primeiro dia de céu limpo da viagem, não deixe pro fim · Compre online e chegue antes das 8h30"
      },
      {
        "name": "Truth Coffee Roasting",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 80,
        "tip": "Eleito repetidas vezes o café mais legal do mundo — steampunk total · Baristas de cartola e máquinas a vapor"
      },
      {
        "name": "Two Oceans Aquarium",
        "category": "afternoon",
        "neighborhood": "Waterfront",
        "costBRL": 140,
        "tip": "Os dois oceanos da região em tanques espetaculares · O túnel dos predadores impressiona"
      },
      {
        "name": "V&A Food Market",
        "category": "lunch",
        "neighborhood": "Waterfront",
        "costBRL": 90,
        "tip": "Mercado gastronômico no armazém histórico do porto · Do biltong ao curry malaio — cada um monta o seu"
      },
      {
        "name": "V&A Waterfront",
        "category": "morning",
        "neighborhood": "Waterfront",
        "costBRL": 0,
        "tip": "O porto histórico virou o coração turístico da cidade · Focas de verdade descansam nos píeres"
      },
      {
        "name": "Zeitz MOCAA",
        "category": "afternoon",
        "neighborhood": "Waterfront",
        "costBRL": 120,
        "tip": "O maior museu de arte contemporânea africana, num silo de grãos esculpido · A arquitetura do átrio já vale o ingresso"
      }
    ],
    "hotels": []
  },
  "Istambul": {
    "city": "Istambul",
    "items": [
      {
        "name": "360 Istanbul",
        "category": "dinner",
        "neighborhood": "Istiklal (rooftop)",
        "costBRL": 220,
        "tip": "Rooftop panorâmico no topo de um prédio histórico da Istiklal · Jantar vira balada tarde da noite"
      },
      {
        "name": "Asitane",
        "category": "dinner",
        "neighborhood": "Edirnekapı",
        "costBRL": 210,
        "tip": "Receitas dos banquetes dos palácios otomanos, pesquisadas em arquivos · Jantar-viagem-no-tempo ao lado da igreja de Chora"
      },
      {
        "name": "Balat e Fener (casas coloridas)",
        "category": "afternoon",
        "neighborhood": "Balat",
        "costBRL": 0,
        "tip": "O bairro colorido das ladeiras fotogênicas · Cafés charmosos e antiquários pelo caminho"
      },
      {
        "name": "Balık ekmek em Eminönü",
        "category": "lunch",
        "neighborhood": "Eminönü",
        "costBRL": 35,
        "tip": "O sanduíche de peixe grelhado dos barcos do porto · Coma no cais vendo os ferries — ritual de Istambul"
      },
      {
        "name": "Cruzeiro pelo Bósforo",
        "category": "afternoon",
        "neighborhood": "Eminönü/Kabataş",
        "costBRL": 110,
        "tip": "Europa de um lado, Ásia do outro — palácios e fortalezas da água · O ferry público faz o trajeto por muito menos que os turísticos"
      },
      {
        "name": "Cisterna da Basílica",
        "category": "morning",
        "neighborhood": "Sultanahmet",
        "costBRL": 150,
        "tip": "A floresta subterrânea de 336 colunas do século VI · As cabeças de Medusa nas bases das colunas"
      },
      {
        "name": "Çiya Sofrası",
        "category": "lunch",
        "neighborhood": "Kadıköy",
        "costBRL": 90,
        "tip": "O restaurante que resgata receitas perdidas da Anatólia · Aponte no balcão de cozidos do dia"
      },
      {
        "name": "Palácio de Dolmabahçe",
        "category": "morning",
        "neighborhood": "Beşiktaş",
        "costBRL": 180,
        "tip": "O Versalhes otomano à beira do Bósforo · O lustre de 4,5 toneladas do salão cerimonial"
      },
      {
        "name": "Dürümzade",
        "category": "lunch",
        "neighborhood": "Beyoğlu",
        "costBRL": 45,
        "tip": "O dürüm que Anthony Bourdain eternizou · Pão lambido na gordura do kebab antes de enrolar"
      },
      {
        "name": "Torre de Gálata e Istiklal",
        "category": "afternoon",
        "neighborhood": "Beyoğlu",
        "costBRL": 110,
        "tip": "A torre genovesa com vista 360° do Corno de Ouro · Desça pela Istiklal com o bonde vermelho histórico"
      },
      {
        "name": "Grand Bazaar",
        "category": "afternoon",
        "neighborhood": "Beyazıt",
        "costBRL": 0,
        "tip": "4 mil lojas em 61 ruas cobertas desde 1461 · Pechinchar é esperado — comece em 50% do preço"
      },
      {
        "name": "Hafız Mustafa 1864",
        "category": "lunch",
        "neighborhood": "Sirkeci/Várias",
        "costBRL": 70,
        "tip": "Confeitaria otomana de 1864 — baklavas e lokum de vitrine · O künefe quente com pistache é almoço-sobremesa"
      },
      {
        "name": "Hagia Sophia",
        "category": "morning",
        "neighborhood": "Sultanahmet",
        "costBRL": 160,
        "tip": "1500 anos: catedral, mesquita, museu, mesquita — a história em camadas · Os mosaicos bizantinos dourados na galeria"
      },
      {
        "name": "Hamdi Restaurant",
        "category": "dinner",
        "neighborhood": "Eminönü",
        "costBRL": 140,
        "tip": "Kebabs do sudeste com vista do Corno de Ouro · Peça mesa no terraço ao pôr do sol"
      },
      {
        "name": "Ilhas dos Príncipes (Büyükada)",
        "category": "morning",
        "neighborhood": "Mar de Mármara (ferry 1h30)",
        "costBRL": 120,
        "tip": "Ilha sem carros — bicicletas e charretes elétricas · Ferry público barato saindo de Eminönü ou Kabataş"
      },
      {
        "name": "Kadıköy: o lado asiático",
        "category": "afternoon",
        "neighborhood": "Kadıköy (Ásia)",
        "costBRL": 30,
        "tip": "Pegue o ferry e mude de continente em 20 minutos · O mercado de rua de Kadıköy é festa gastronômica"
      },
      {
        "name": "Karabatak",
        "category": "breakfast",
        "neighborhood": "Karaköy",
        "costBRL": 55,
        "tip": "O café que ancorou a cena descolada de Karaköy · Mesas nas vielas de paralelepípedo"
      },
      {
        "name": "Karaköy Lokantası",
        "category": "lunch",
        "neighborhood": "Karaköy",
        "costBRL": 120,
        "tip": "Azulejos turquesa e cozinha turca impecável · Esnaf (pratos do dia) no almoço, meyhane à noite"
      },
      {
        "name": "Mesquita Azul e Hipódromo",
        "category": "morning",
        "neighborhood": "Sultanahmet",
        "costBRL": 0,
        "tip": "Os 20 mil azulejos de Iznik que dão o apelido · Entrada gratuita fora dos horários de oração"
      },
      {
        "name": "Mikla",
        "category": "dinner",
        "neighborhood": "Beyoğlu (rooftop)",
        "costBRL": 420,
        "tip": "O fine dining turco-escandinavo no topo do Marmara Pera · A vista da cidade antiga iluminada é o acompanhamento"
      },
      {
        "name": "Meyhanes de Nevizade (jantar com mezes)",
        "category": "dinner",
        "neighborhood": "Beyoğlu",
        "costBRL": 150,
        "tip": "A viela das tavernas turcas — mesas na rua e bandejas de mezes · Escolha os pratinhos frios da bandeja e o peixe do dia"
      },
      {
        "name": "Simit com chá no Bósforo",
        "category": "breakfast",
        "neighborhood": "Orla (qualquer cais)",
        "costBRL": 20,
        "tip": "O rosquinha de gergelim dos carrinhos vermelhos + chá em copo tulipa · Café da manhã de 20 lira olhando o estreito"
      },
      {
        "name": "Bazar das Especiarias e Eminönü",
        "category": "afternoon",
        "neighborhood": "Eminönü",
        "costBRL": 0,
        "tip": "Pirâmides de especiarias, lokum e chás · Prove antes de comprar — faz parte"
      },
      {
        "name": "Sultanahmet Köftecisi (1920)",
        "category": "lunch",
        "neighborhood": "Sultanahmet",
        "costBRL": 60,
        "tip": "O köfte centenário a passos da Hagia Sophia · Cardápio de 4 itens que não muda há um século"
      },
      {
        "name": "Sur Balık",
        "category": "dinner",
        "neighborhood": "Cihangir/Sarıyer",
        "costBRL": 230,
        "tip": "Peixes do Bósforo com vista do estreito · Levrek (robalo) no sal é o clássico"
      },
      {
        "name": "Palácio de Topkapi e Harém",
        "category": "morning",
        "neighborhood": "Sultanahmet",
        "costBRL": 95,
        "tip": "O ingresso do Harém é à parte e vale cada lira — compre junto · Emende com a Hagia Sophia na mesma manhã: são vizinhos"
      },
      {
        "name": "Van Kahvaltı Evi",
        "category": "breakfast",
        "neighborhood": "Cihangir",
        "costBRL": 85,
        "tip": "O café da manhã turco completo do leste — a mesa não cabe · Mel com kaymak (nata) é a dupla imortal"
      },
      {
        "name": "Zübeyir Ocakbaşı",
        "category": "dinner",
        "neighborhood": "Beyoğlu",
        "costBRL": 150,
        "tip": "Sente ao redor da grelha de cobre e veja o mestre trabalhar · Adana kebab e asinhas direto da brasa"
      }
    ],
    "hotels": []
  },
  "Bangkok": {
    "city": "Bangkok",
    "items": [
      {
        "name": "Asiatique The Riverfront",
        "category": "afternoon",
        "neighborhood": "Charoen Krung",
        "costBRL": 0,
        "tip": "Mercado noturno à beira-rio com roda-gigante · Barca gratuita do BTS Saphan Taksin ao entardecer"
      },
      {
        "name": "Bate-volta a Ayutthaya",
        "category": "morning",
        "neighborhood": "Ayutthaya (1h30)",
        "costBRL": 290,
        "tip": "A antiga capital do reino do Sião — ruínas Patrimônio da UNESCO · A cabeça de Buda abraçada pelas raízes é a foto da viagem"
      },
      {
        "name": "Baan Khanitha",
        "category": "dinner",
        "neighborhood": "Sukhumvit/Sathorn",
        "costBRL": 170,
        "tip": "Clássico elegante de cozinha tailandesa tradicional · Currys refinados sem sustos para paladares iniciantes"
      },
      {
        "name": "Baan Phadthai",
        "category": "lunch",
        "neighborhood": "Charoen Krung",
        "costBRL": 100,
        "tip": "O pad thai elevado a prato de chef, com receita de 100 anos · Casa charmosa no distrito criativo"
      },
      {
        "name": "Blue Elephant",
        "category": "dinner",
        "neighborhood": "Sathorn",
        "costBRL": 290,
        "tip": "Royal Thai cuisine numa mansão colonial centenária · A noite elegante da viagem"
      },
      {
        "name": "Cabbages & Condoms",
        "category": "dinner",
        "neighborhood": "Sukhumvit 12",
        "costBRL": 140,
        "tip": "Jardim de luzinhas com decoração... peculiar — renda vai para ONG de saúde · Comida tailandesa sólida com propósito"
      },
      {
        "name": "Mercado de Chatuchak (fim de semana)",
        "category": "morning",
        "neighborhood": "Chatuchak",
        "costBRL": 0,
        "tip": "15 mil barracas — o maior mercado de fim de semana do mundo · Só sábado e domingo; vá cedo antes do calor"
      },
      {
        "name": "Grand Palace e Wat Phra Kaew (Buda de Esmeralda)",
        "category": "morning",
        "neighborhood": "Phra Nakhon",
        "costBRL": 95,
        "tip": "Vá na abertura (8h30) — calor e multidão dobram a cada hora · Dress code rígido: ombros e joelhos cobertos; emende com o Wat Pho, vizinho de muro"
      },
      {
        "name": "ICONSIAM e a orla do Chao Phraya",
        "category": "afternoon",
        "neighborhood": "Thonburi",
        "costBRL": 0,
        "tip": "O mega-shopping com mercado flutuante indoor no térreo · Barca gratuita do píer Sathorn"
      },
      {
        "name": "Jay Fai",
        "category": "dinner",
        "neighborhood": "Phra Nakhon",
        "costBRL": 350,
        "tip": "A rainha do street food de óculos de esqui e wok flamejante · A omelete de caranguejo virou patrimônio mundial"
      },
      {
        "name": "Casa de Jim Thompson",
        "category": "afternoon",
        "neighborhood": "Siam",
        "costBRL": 100,
        "tip": "A casa de teca do americano que reviveu a seda tailandesa — e sumiu misteriosamente · Tour guiado incluso conta a história"
      },
      {
        "name": "Passeio de longtail pelos khlongs",
        "category": "afternoon",
        "neighborhood": "Thonburi",
        "costBRL": 130,
        "tip": "Os canais de Thonburi mostram a Bangkok que resiste sobre a água · Casas de palafita, templos e vendedores de barco"
      },
      {
        "name": "Krua Apsorn",
        "category": "lunch",
        "neighborhood": "Dusit",
        "costBRL": 90,
        "tip": "A cozinha tailandesa caseira que já serviu a família real · A omelete de caranguejo é lendária"
      },
      {
        "name": "Parque Lumpini",
        "category": "afternoon",
        "neighborhood": "Silom",
        "costBRL": 0,
        "tip": "O pulmão verde de Bangkok — pedalinho e sombra · Os lagartos-monitores gigantes passeiam livres (inofensivos!)"
      },
      {
        "name": "Mercado flutuante de Damnoen Saduak",
        "category": "morning",
        "neighborhood": "1h30 de Bangkok",
        "costBRL": 190,
        "tip": "Barcos carregados de frutas e comida nos canais · Saída cedo do hotel — o mercado morre até o meio-dia"
      },
      {
        "name": "On Lok Yun (1933)",
        "category": "breakfast",
        "neighborhood": "Charoen Krung",
        "costBRL": 40,
        "tip": "O café da manhã sino-tailandês que não muda há 90 anos · Ovos, toast com custard e café antigo"
      },
      {
        "name": "Mercado Or Tor Kor",
        "category": "lunch",
        "neighborhood": "Chatuchak",
        "costBRL": 80,
        "tip": "O mercado premium de frutas e comida da Tailândia · Manga com arroz de coco no auge da qualidade"
      },
      {
        "name": "Roast Coffee & Eatery",
        "category": "breakfast",
        "neighborhood": "Thonglor/EmQuartier",
        "costBRL": 90,
        "tip": "O brunch moderno queridinho de Bangkok · Café de especialidade e panquecas"
      },
      {
        "name": "Roti Mataba",
        "category": "lunch",
        "neighborhood": "Phra Athit",
        "costBRL": 50,
        "tip": "Rotis e currys muçulmano-tailandeses desde 1943 · O mataba de frango é o pedido"
      },
      {
        "name": "Sky Bar (Lebua) ao anoitecer",
        "category": "night",
        "neighborhood": "Silom (63º andar)",
        "costBRL": 220,
        "tip": "O rooftop do filme Se Beber, Não Case II · Um drink com Bangkok inteira acesa aos pés"
      },
      {
        "name": "Somtam Nua",
        "category": "lunch",
        "neighborhood": "Siam Square",
        "costBRL": 70,
        "tip": "O som tam (salada de mamão) que enlouquece Siam · Frango frito tailandês crocante para acompanhar"
      },
      {
        "name": "Sook Siam (food court ICONSIAM)",
        "category": "lunch",
        "neighborhood": "Thonburi",
        "costBRL": 60,
        "tip": "As 77 províncias tailandesas em bancas num mercado indoor · Preço de rua com conforto de shopping"
      },
      {
        "name": "Supanniga Eating Room",
        "category": "dinner",
        "neighborhood": "Thonglor/Riverside",
        "costBRL": 150,
        "tip": "Receitas da avó do dono, do leste da Tailândia · A unidade Riverside tem vista do Wat Arun iluminado"
      },
      {
        "name": "Terminal 21 (shopping temático)",
        "category": "afternoon",
        "neighborhood": "Asok",
        "costBRL": 0,
        "tip": "Cada andar é uma cidade: Tóquio, Paris, Londres, São Francisco · O food court Pier 21 tem preço de rua com ar-condicionado"
      },
      {
        "name": "Thipsamai Pad Thai",
        "category": "dinner",
        "neighborhood": "Phra Nakhon",
        "costBRL": 80,
        "tip": "O pad thai mais famoso do planeta, embrulhado em omelete · A fila da calçada é parte do ritual — anda rápido"
      },
      {
        "name": "Wat Arun (Templo do Amanhecer)",
        "category": "morning",
        "neighborhood": "Thonburi (barca)",
        "costBRL": 40,
        "tip": "Atravesse o rio de barca por centavos · As torres de porcelana brilham na luz da manhã"
      },
      {
        "name": "Wat Pho (Buda Reclinado)",
        "category": "morning",
        "neighborhood": "Rattanakosin",
        "costBRL": 80,
        "tip": "O Buda dourado de 46 metros deitado · Berço da massagem tailandesa — a escola funciona no templo"
      },
      {
        "name": "Wattana Panich (caldo eterno)",
        "category": "breakfast",
        "neighborhood": "Ekkamai",
        "costBRL": 60,
        "tip": "O panelão de caldo de carne que ferve há mais de 45 anos · Noodles matinais que curam qualquer jet lag"
      },
      {
        "name": "Street food de Yaowarat (Chinatown)",
        "category": "dinner",
        "neighborhood": "Chinatown",
        "costBRL": 70,
        "tip": "À noite a avenida vira o maior banquete de rua da Ásia · Siga as filas de locais: noodles, frutos do mar, pato"
      }
    ],
    "hotels": []
  },
  "Marrakech": {
    "city": "Marrakech",
    "items": [
      {
        "name": "Al Fassia",
        "category": "dinner",
        "neighborhood": "Gueliz",
        "costBRL": 190,
        "tip": "Cozinha de Fez comandada só por mulheres há décadas · O ombro de cordeiro confitado exige pedido antecipado"
      },
      {
        "name": "Amal (centro de mulheres)",
        "category": "lunch",
        "neighborhood": "Gueliz",
        "costBRL": 70,
        "tip": "ONG que treina mulheres em situação vulnerável para a gastronomia · Cuscuz de sexta-feira é o ritual — chegue cedo"
      },
      {
        "name": "Pâtisserie Amandine",
        "category": "breakfast",
        "neighborhood": "Gueliz",
        "costBRL": 60,
        "tip": "A confeitaria franco-marroquina de Gueliz · Cornes de gazelle e mil-folhas dividem a vitrine"
      },
      {
        "name": "Atay Café",
        "category": "breakfast",
        "neighborhood": "Medina",
        "costBRL": 50,
        "tip": "Terraço colorido de poufs e vista dos telhados · Café da manhã berbere: msemen, mel e amlou"
      },
      {
        "name": "Bacha Coffee (Dar el Bacha)",
        "category": "breakfast",
        "neighborhood": "Medina",
        "costBRL": 100,
        "tip": "Café-palácio de 1910 restaurado — zellige, mármore e ouro · Mais de 200 cafés servidos em bules de prata"
      },
      {
        "name": "Palácio Bahia",
        "category": "morning",
        "neighborhood": "Medina (Mellah)",
        "costBRL": 60,
        "tip": "Pátios de zellige e tetos de cedro pintado · A luz da manhã atravessa os vitrais coloridos"
      },
      {
        "name": "Barracas da Jemaa el-Fna (jantar na praça)",
        "category": "dinner",
        "neighborhood": "Medina",
        "costBRL": 70,
        "tip": "Ao anoitecer a praça vira o maior restaurante a céu aberto do Marrocos · Escolha a barraca mais cheia de marroquinos"
      },
      {
        "name": "Madraça Ben Youssef",
        "category": "morning",
        "neighborhood": "Medina",
        "costBRL": 70,
        "tip": "A escola corânica do século XVI, joia da arte islâmica · O pátio central é dos lugares mais fotogênicos do Marrocos"
      },
      {
        "name": "Café Clock",
        "category": "lunch",
        "neighborhood": "Kasbah",
        "costBRL": 90,
        "tip": "O famoso camel burger — sim, de camelo, e é bom · Centro cultural com música e contação de histórias"
      },
      {
        "name": "Rooftop do Café des Épices",
        "category": "afternoon",
        "neighborhood": "Medina (Rahba Kedima)",
        "costBRL": 45,
        "tip": "Chá de menta no terraço sobre a praça das especiarias · Observe os tapetes sendo negociados lá embaixo"
      },
      {
        "name": "Chez Lamine Hadj Mustapha (mechoui)",
        "category": "lunch",
        "neighborhood": "Medina (beco do mechoui)",
        "costBRL": 90,
        "tip": "O cordeiro assado em forno subterrâneo — tradição secular · Pede-se por peso, come-se com pão e cominho"
      },
      {
        "name": "Comptoir Darna",
        "category": "dinner",
        "neighborhood": "Hivernage",
        "costBRL": 270,
        "tip": "Jantar com show de dançarinas equilibrando velas · Franco-marroquino festivo — clima de celebração"
      },
      {
        "name": "Dar Yacout",
        "category": "dinner",
        "neighborhood": "Medina",
        "costBRL": 380,
        "tip": "Jantar-experiência num palácio das mil e uma noites · Começa com drinks no terraço sob o call to prayer"
      },
      {
        "name": "Hammam tradicional (Les Bains de Marrakech)",
        "category": "afternoon",
        "neighborhood": "Kasbah",
        "costBRL": 190,
        "tip": "O ritual marroquino: vapor, sabão negro e esfoliação kessa · Reserve — os bons hammams turísticos lotam"
      },
      {
        "name": "Le Jardin Secret",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 60,
        "tip": "Palácio-jardim restaurado escondido no coração da medina · Suba a torre para ver os telhados e o Atlas"
      },
      {
        "name": "Jemaa el-Fna ao entardecer",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "A praça-espetáculo: contadores de história, música gnawa, encantadores · Ao pôr do sol as barracas de comida armam o banquete"
      },
      {
        "name": "Kasbah Café (rooftop)",
        "category": "dinner",
        "neighborhood": "Kasbah",
        "costBRL": 90,
        "tip": "Terraço de frente para os túmulos Saadianos e as cegonhas · Tajines honestos a preço justo"
      },
      {
        "name": "Koutoubia e seus jardins",
        "category": "morning",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "O minarete de 77m que rege a cidade — irmã da Giralda de Sevilha · Interior só para muçulmanos; os jardins são de todos"
      },
      {
        "name": "La Famille",
        "category": "lunch",
        "neighborhood": "Medina",
        "costBRL": 110,
        "tip": "Jardim secreto vegetariano de mesas sob as oliveiras · Menu curto do dia, sempre fresco"
      },
      {
        "name": "Latitude31",
        "category": "dinner",
        "neighborhood": "Medina (Bab Doukkala)",
        "costBRL": 160,
        "tip": "Marroquino contemporâneo num pátio elegante · Releituras leves dos clássicos"
      },
      {
        "name": "Jardim Majorelle e Museu YSL",
        "category": "morning",
        "neighborhood": "Gueliz",
        "costBRL": 150,
        "tip": "O jardim azul-cobalto que Yves Saint Laurent salvou · Ingresso SÓ online com horário — esgota"
      },
      {
        "name": "Medina e souks",
        "category": "morning",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "O labirinto milenar de especiarias, lanternas e tapetes · Pechinchar é cultura: comece em 40% e sorria sempre"
      },
      {
        "name": "Jardins da Menara",
        "category": "afternoon",
        "neighborhood": "Menara",
        "costBRL": 20,
        "tip": "O tanque do século XII com o pavilhão e o Atlas ao fundo · O cartão-postal clássico do Marrocos"
      },
      {
        "name": "Naranj",
        "category": "dinner",
        "neighborhood": "Medina (Riad Zitoun)",
        "costBRL": 130,
        "tip": "O libanês que conquistou a medina · Mezzes frescos quando você já provou todos os tajines"
      },
      {
        "name": "Nomad",
        "category": "lunch",
        "neighborhood": "Medina (Rahba Kedima)",
        "costBRL": 130,
        "tip": "Cozinha marroquina moderna em terraço sobre a medina · O cordeiro com especiarias e os legumes assados brilham"
      },
      {
        "name": "Bate-volta ao Vale do Ourika (Atlas)",
        "category": "morning",
        "neighborhood": "Atlas (1h30)",
        "costBRL": 260,
        "tip": "As montanhas do Atlas e aldeias berberes a 1h da cidade · Caminhada leve até as cascatas de Setti Fatma"
      },
      {
        "name": "Passeio de camelo na Palmeraie",
        "category": "afternoon",
        "neighborhood": "Palmeraie",
        "costBRL": 160,
        "tip": "O palmeiral de 100 mil palmeiras nos arredores · Passeio curto de dromedário ao pôr do sol — as crianças amam"
      },
      {
        "name": "La Terrasse des Épices",
        "category": "lunch",
        "neighborhood": "Medina",
        "costBRL": 140,
        "tip": "Terraço amplo com tajines clássicos bem executados · Sombra, brisa e wi-fi no meio da medina"
      }
    ],
    "hotels": []
  },
  "Singapura": {
    "city": "Singapura",
    "items": [
      {
        "name": "ArtScience Museum (Future World)",
        "category": "afternoon",
        "neighborhood": "Marina Bay",
        "costBRL": 160,
        "tip": "O museu-flor com a exposição digital do teamLab · Salas imersivas que hipnotizam as crianças"
      },
      {
        "name": "Jardim Botânico e Orquidário Nacional",
        "category": "morning",
        "neighborhood": "Tanglin",
        "costBRL": 60,
        "tip": "Patrimônio UNESCO — 160 anos de jardins tropicais · O Orquidário tem 60 mil orquídeas; a ala VIP homenageia chefes de estado"
      },
      {
        "name": "Candlenut",
        "category": "dinner",
        "neighborhood": "Dempsey Hill",
        "costBRL": 320,
        "tip": "A alta cozinha peranakan (sino-malaia) reconhecida mundialmente · O buah keluak de chocolate na sobremesa é genial"
      },
      {
        "name": "Chinatown e Templo do Dente de Buda",
        "category": "morning",
        "neighborhood": "Chinatown",
        "costBRL": 0,
        "tip": "O templo de 4 andares guarda a relíquia no topo · Ruas de shophouses coloridas e lojinhas"
      },
      {
        "name": "Clarke Quay e passeio de bumboat",
        "category": "afternoon",
        "neighborhood": "Clarke Quay",
        "costBRL": 90,
        "tip": "Os armazéns coloridos do rio viraram polo de restaurantes · O bumboat desce o rio até o Merlion — vá no fim de tarde"
      },
      {
        "name": "Din Tai Fung",
        "category": "dinner",
        "neighborhood": "Marina Bay Sands/Várias",
        "costBRL": 120,
        "tip": "Os xiao long bao perfeitos — 18 dobras cada · Cozinha de vidro hipnotiza as crianças"
      },
      {
        "name": "Gardens by the Bay (Cloud Forest e Flower Dome)",
        "category": "morning",
        "neighborhood": "Marina Bay",
        "costBRL": 190,
        "tip": "A cachoeira indoor de 35m do Cloud Forest é surreal · As Supertrees se visitam de graça por fora"
      },
      {
        "name": "Hawker Chan (Chinatown)",
        "category": "lunch",
        "neighborhood": "Chinatown",
        "costBRL": 35,
        "tip": "O frango com molho de soja que fez história mundial · A refeição premiada mais barata que existe"
      },
      {
        "name": "Jewel Changi (cachoeira do aeroporto)",
        "category": "afternoon",
        "neighborhood": "Changi",
        "costBRL": 0,
        "tip": "A maior cachoeira indoor do mundo — dentro do aeroporto · PERFEITO para o dia da volta: chegue 3h antes e passeie"
      },
      {
        "name": "Jumbo Seafood (chilli crab)",
        "category": "dinner",
        "neighborhood": "Riverside/East Coast",
        "costBRL": 290,
        "tip": "O prato nacional: caranguejo no molho de pimenta e tomate · Peça os mantou fritos para afundar no molho"
      },
      {
        "name": "328 Katong Laksa",
        "category": "dinner",
        "neighborhood": "Katong",
        "costBRL": 45,
        "tip": "A laksa que venceu Gordon Ramsay em disputa televisionada · Macarrão cortado — come-se só de colher"
      },
      {
        "name": "Killiney Kopitiam",
        "category": "breakfast",
        "neighborhood": "Killiney Road",
        "costBRL": 30,
        "tip": "O kopitiam original de 1919 — rival eterno do Ya Kun · Kopi forte coado na meia de pano"
      },
      {
        "name": "Komala Vilas",
        "category": "lunch",
        "neighborhood": "Little India",
        "costBRL": 40,
        "tip": "O vegetariano sul-indiano de 1947 · Thali na folha de bananeira e dosas gigantes"
      },
      {
        "name": "Lau Pa Sat e a rua do satay",
        "category": "lunch",
        "neighborhood": "CBD",
        "costBRL": 60,
        "tip": "Mercado vitoriano de ferro fundido entre arranha-céus · À noite a rua lateral fecha e vira churrasco de satay"
      },
      {
        "name": "Little India e Haji Lane",
        "category": "afternoon",
        "neighborhood": "Little India/Kampong Glam",
        "costBRL": 0,
        "tip": "Dois mundos vizinhos: templos hindus e a mesquita dourada do Sultão · Haji Lane: a viela de murais e lojinhas indie"
      },
      {
        "name": "Marina Bay e Merlion",
        "category": "afternoon",
        "neighborhood": "Marina Bay",
        "costBRL": 0,
        "tip": "O circuito da baía: Merlion, Esplanade e o skyline · A foto “segurando” o jato do Merlion é obrigatória"
      },
      {
        "name": "Maxwell Food Centre",
        "category": "lunch",
        "neighborhood": "Chinatown",
        "costBRL": 40,
        "tip": "O hawker centre clássico — o chicken rice do Tian Tian é lenda · Guarde lugar com um pacote de lenços (chope!) como os locais"
      },
      {
        "name": "Newton Food Centre à noite",
        "category": "dinner",
        "neighborhood": "Newton",
        "costBRL": 70,
        "tip": "O hawker do filme Podres de Ricos · Satay, arraia grelhada e cerveja gelada ao ar livre"
      },
      {
        "name": "Night Safari",
        "category": "night",
        "neighborhood": "Mandai",
        "costBRL": 290,
        "tip": "O primeiro safári noturno do mundo — animais ativos no escuro · O bonde guiado cobre o essencial; as trilhas a pé completam"
      },
      {
        "name": "Old Airport Road Food Centre",
        "category": "lunch",
        "neighborhood": "Kallang",
        "costBRL": 45,
        "tip": "O hawker que os singapurianos elegem como o melhor · Char kway teow e rojak históricos"
      },
      {
        "name": "Orchard Road",
        "category": "afternoon",
        "neighborhood": "Orchard",
        "costBRL": 0,
        "tip": "A avenida das compras — do luxo ao eletrônico · ION e Takashimaya são os âncoras"
      },
      {
        "name": "Dia em Sentosa",
        "category": "morning",
        "neighborhood": "Sentosa Island",
        "costBRL": 220,
        "tip": "A ilha-parque: praias, teleférico, SkyHelix e aquário · Vá de Cable Car para chegar já passeando"
      },
      {
        "name": "Song Fa Bak Kut Teh",
        "category": "lunch",
        "neighborhood": "Clarke Quay",
        "costBRL": 60,
        "tip": "A sopa de costela com pimenta que conforta há 50 anos · Refil de caldo é grátis — aceite sempre"
      },
      {
        "name": "Spectra — show de luzes da Marina Bay",
        "category": "night",
        "neighborhood": "Marina Bay Sands",
        "costBRL": 0,
        "tip": "Água, laser e música na frente do MBS — gratuito · Dois horários por noite; chegue 20 min antes"
      },
      {
        "name": "Tiong Bahru Bakery",
        "category": "breakfast",
        "neighborhood": "Tiong Bahru",
        "costBRL": 60,
        "tip": "O croissant mais famoso de Singapura no bairro art déco · O kouign-amann esgota cedo"
      },
      {
        "name": "Universal Studios Singapore",
        "category": "morning",
        "neighborhood": "Sentosa",
        "costBRL": 480,
        "tip": "Compacto e intenso — dá para fazer tudo num dia · Transformers e a montanha do Battlestar são os hits"
      },
      {
        "name": "Violet Oon Singapore",
        "category": "dinner",
        "neighborhood": "National Gallery/Ion",
        "costBRL": 230,
        "tip": "A grande dama da cozinha peranakan num salão de época · Dry laksa e beef rendang de referência"
      },
      {
        "name": "Ya Kun Kaya Toast",
        "category": "breakfast",
        "neighborhood": "Chinatown/Várias",
        "costBRL": 30,
        "tip": "O café da manhã nacional: kaya toast, ovos moles e kopi · Mergulhe a torrada no ovo com shoyu — confie"
      },
      {
        "name": "Singapore Zoo (habitat aberto)",
        "category": "morning",
        "neighborhood": "Mandai",
        "costBRL": 290,
        "tip": "O zoológico sem jaulas mais premiado do mundo · Café da manhã com orangotangos em horário marcado"
      }
    ],
    "hotels": []
  }
};

/** Forma normalizada (minúscula, sem acento) -> chave canônica em CATALOG. */
export const CATALOG_INDEX: Record<string, string> = {
  "bangkok": "Bangkok",
  "barcelona": "Barcelona",
  "buenos aires": "Buenos Aires",
  "cape town": "Cidade do Cabo",
  "cartagena": "Cartagena",
  "cidade do cabo": "Cidade do Cabo",
  "dubai": "Dubai",
  "fortaleza": "Fortaleza",
  "gramado": "Gramado",
  "istambul": "Istambul",
  "istanbul": "Istambul",
  "lisboa": "Lisboa",
  "lisbon": "Lisboa",
  "london": "Londres",
  "londres": "Londres",
  "marrakech": "Marrakech",
  "marrakesh": "Marrakech",
  "new york": "Nova York",
  "nova iorque": "Nova York",
  "nova york": "Nova York",
  "orlando": "Orlando",
  "paris": "Paris",
  "porto seguro": "Porto Seguro",
  "rio": "Rio de Janeiro",
  "rio de janeiro": "Rio de Janeiro",
  "roma": "Roma",
  "rome": "Roma",
  "salvador": "Salvador",
  "singapore": "Singapura",
  "singapura": "Singapura",
  "tokyo": "Tóquio",
  "toquio": "Tóquio"
};

/** Nomes canônicos das cidades curadas, na ordem de CURATED_CITIES. */
export const CATALOG_CITIES: string[] = [
  "Paris",
  "Fortaleza",
  "Rio de Janeiro",
  "Lisboa",
  "Orlando",
  "Tóquio",
  "Roma",
  "Salvador",
  "Buenos Aires",
  "Cartagena",
  "Nova York",
  "Gramado",
  "Londres",
  "Barcelona",
  "Porto Seguro",
  "Dubai",
  "Cidade do Cabo",
  "Istambul",
  "Bangkok",
  "Marrakech",
  "Singapura"
];
