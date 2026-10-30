// GERADO por scripts/build-kinu-catalog.ts — NÃO EDITAR À MÃO.
// Fonte: src/data/destinationActivities.ts + src/data/curatedHotels.ts
// 28 cidades · 1652 atividades · 250 hotéis
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
        "name": "Bois de Vincennes e Parc Floral",
        "category": "morning",
        "neighborhood": "12e",
        "costBRL": 0,
        "tip": "O maior parque de Paris, com lago de barcos a remo, o Parc Floral e o castelo; metrô Château de Vincennes"
      },
      {
        "name": "Le Bon Marché",
        "category": "afternoon",
        "neighborhood": "Saint-Germain",
        "costBRL": 0,
        "tip": "A loja de departamentos mais antiga de Paris (1852), elegante e sem a multidão da Lafayette; La Grande Épicerie ao lado"
      },
      {
        "name": "Bouillon Chartier (1896)",
        "category": "lunch",
        "neighborhood": "Grands Boulevards",
        "costBRL": 80,
        "tip": "Salão de 1896 com garçons de colete e conta escrita na toalha; prato do dia a preço de bouillon, fila que anda"
      },
      {
        "name": "Parc des Buttes-Chaumont",
        "category": "afternoon",
        "neighborhood": "19e",
        "costBRL": 0,
        "tip": "O parque mais vertical de Paris: templo no alto do rochedo, cascata e gramados para piquenique"
      },
      {
        "name": "Caveau de la Huchette (jazz)",
        "category": "night",
        "neighborhood": "Quartier Latin",
        "costBRL": 100,
        "tip": "Porão medieval com jazz e swing para dançar desde 1946 — o do filme La La Land"
      },
      {
        "name": "Le Comptoir Général",
        "category": "night",
        "neighborhood": "Canal Saint-Martin",
        "costBRL": 60,
        "tip": "Bar-galeria de clima afro-tropical escondido numa viela do canal; entrada livre, chegue cedo"
      },
      {
        "name": "Duc des Lombards (jazz)",
        "category": "night",
        "neighborhood": "Châtelet",
        "costBRL": 120,
        "tip": "Clube de jazz pequeno e sério na rue des Lombards, dois shows por noite; reserve, 70 lugares"
      },
      {
        "name": "Experimental Cocktail Club",
        "category": "night",
        "neighborhood": "Montorgueil",
        "costBRL": 110,
        "tip": "O speakeasy que abriu a onda de coquetelaria em Paris; porta sem placa na rue Saint-Sauveur"
      },
      {
        "name": "Jardin d'Acclimatation (Bois de Boulogne)",
        "category": "morning",
        "neighborhood": "16e",
        "costBRL": 40,
        "tip": "Parque de diversões de 1860 dentro do Bois de Boulogne; entrada barata, brinquedos pagos à parte · Metrô Les Sablons"
      },
      {
        "name": "Jardin des Plantes e Ménagerie",
        "category": "morning",
        "neighborhood": "5e",
        "costBRL": 80,
        "tip": "Jardim botânico gratuito; o zoológico histórico (Ménagerie) e a Grande Galeria da Evolução são pagos"
      },
      {
        "name": "La Vallée Village (outlet)",
        "category": "morning",
        "neighborhood": "Serris",
        "costBRL": 40,
        "tip": "Outlet de grifes ao lado da Disneyland, 40 min de RER A; dá para combinar meio dia de cada"
      },
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
        "name": "Hôtel Fabric",
        "zone": "Oberkampf",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Antiga fábrica têxtil virada boutique industrial-chic"
      },
      {
        "name": "Generator Paris",
        "zone": "Canal Saint-Martin",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 150-350",
        "tip": "Hostel-design com rooftop pro Sacré-Coeur"
      },
      {
        "name": "Hôtel des Grands Boulevards",
        "zone": "Grands Boulevards",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Boutique gastronômico com pátio - o hype certo"
      },
      {
        "name": "Hôtel Jeanne d'Arc Le Marais",
        "zone": "Marais",
        "tier": "budget",
        "personaTags": [
          "couple",
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 600-900",
        "tip": "Hotel de família numa rua tranquila do Marais, quartos pequenos e limpos; reserve com meses, lota"
      },
      {
        "name": "Novotel Paris Les Halles",
        "zone": "Les Halles",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 900-1.400",
        "tip": "Central absoluto e família-friendly - metrô de tudo na porta"
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
      },
      {
        "name": "Relais Christine",
        "zone": "Saint-Germain",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.000",
        "tip": "Mansão do século XVI com jardim em Saint-Germain"
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
        "name": "Bate-volta a Canoa Quebrada",
        "category": "morning",
        "neighborhood": "Aracati",
        "costBRL": 180,
        "tip": "Falésias vermelhas, buggy pelas dunas e a Broadway à noite — 160 km, saia cedo com transporte de agência"
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
        "tip": "Frutos do mar de décadas na Beira-Mar do Meireles — peixada e camarão no coco"
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
        "name": "Iguatemi Bosque",
        "category": "afternoon",
        "neighborhood": "Edson Queiroz",
        "costBRL": 0,
        "tip": "Shopping tradicional ao lado do Parque do Cocó; combine com o parque no fim da tarde"
      },
      {
        "name": "Pôr do sol e noite na Ponte dos Ingleses",
        "category": "night",
        "neighborhood": "Praia de Iracema",
        "costBRL": 0,
        "tip": "Pôr do sol icônico na Ponte dos Ingleses · Região boêmia, mais agitada à noite"
      },
      {
        "name": "Jardim Japonês da Beira-Mar",
        "category": "afternoon",
        "neighborhood": "Meireles",
        "costBRL": 0,
        "tip": "Pequeno jardim com lago e ponte vermelha na Avenida Beira-Mar; pausa de sombra entre a praia e a Feirinha"
      },
      {
        "name": "Praia de Lagoinha",
        "category": "morning",
        "neighborhood": "Paraipaba",
        "costBRL": 120,
        "tip": "Coqueiral, dunas e lagoa — uma das praias mais fotografadas do litoral oeste, 120 km de Fortaleza"
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
        "name": "Bate-volta a Morro Branco e Praia das Fontes",
        "category": "morning",
        "neighborhood": "Beberibe",
        "costBRL": 150,
        "tip": "Labirinto de falésias coloridas e fontes de água doce na praia vizinha; ~90 km, meio dia de passeio"
      },
      {
        "name": "Museu da Fotografia Fortaleza",
        "category": "morning",
        "neighborhood": "Varjota",
        "costBRL": 40,
        "tip": "Um dos acervos fotográficos mais relevantes da América Latina · Climatizado — ótima opção para fugir do calor"
      },
      {
        "name": "North Shopping Fortaleza",
        "category": "afternoon",
        "neighborhood": "Presidente Kennedy",
        "costBRL": 0,
        "tip": "O shopping mais antigo da cidade, popular e grande; preços mais baixos que os da orla"
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
        "name": "Pipo Restaurante",
        "category": "dinner",
        "neighborhood": "Meireles",
        "costBRL": 200,
        "tip": "Cozinha contemporânea com frutos do mar da costa cearense, num dos jantares mais elogiados da cidade; reserve"
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
        "name": "Pulcinella (Varjota)",
        "category": "dinner",
        "neighborhood": "Varjota",
        "costBRL": 160,
        "tip": "Italiano tradicional da Varjota, salão discreto e massa feita na casa; o jantar a dois da cidade"
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
        "name": "RioMar Fortaleza",
        "category": "afternoon",
        "neighborhood": "Papicu",
        "costBRL": 0,
        "tip": "O maior shopping da cidade, a 10 min da Praia do Futuro; cinema, praça de alimentação e lojas de marca"
      },
      {
        "name": "Praia e dunas de Sabiaguaba",
        "category": "morning",
        "neighborhood": "Sabiaguaba",
        "costBRL": 30,
        "tip": "Onde o rio Cocó encontra o mar: dunas, mangue e barracas de caranguejo, a 20 min da Praia do Futuro"
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
        "name": "Shopping Via Sul",
        "category": "afternoon",
        "neighborhood": "Sapiranga",
        "costBRL": 0,
        "tip": "Shopping de bairro na saída para as praias do leste; parada prática antes de Aquiraz ou Porto das Dunas"
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
        "name": "Gran Mareiro",
        "zone": "Praia do Futuro",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Pé na areia com clube de praia próprio - família feliz"
      },
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
        "name": "Ibis Fortaleza Praia de Iracema",
        "zone": "Praia de Iracema",
        "tier": "budget",
        "personaTags": [
          "solo",
          "family"
        ],
        "priceRangeBRL": "R$ 200-350",
        "tip": "Econômico perto da noite de Iracema"
      },
      {
        "name": "Hotel Luzeiros",
        "zone": "Meireles",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Design frente-mar na Beira-Mar - café da manhã elogiado"
      },
      {
        "name": "Carmel Magna Praia",
        "zone": "Meireles",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 400-650",
        "tip": "Frente-mar funcional na Beira-Mar"
      },
      {
        "name": "Praiano Hotel",
        "zone": "Meireles",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Na Beira-Mar por preço de pousada — simples e bem localizado"
      },
      {
        "name": "Refúgio Hostel Fortaleza",
        "zone": "Praia de Iracema",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 70-180",
        "tip": "O hostel querido da cidade - clima de casa"
      },
      {
        "name": "Sonata de Iracema",
        "zone": "Praia de Iracema",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 350-550",
        "tip": "Em frente ao mar na Iracema, perto dos bares e do Dragão do Mar"
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
        "name": "BarraShopping",
        "category": "afternoon",
        "neighborhood": "Barra da Tijuca",
        "costBRL": 0,
        "tip": "O maior shopping do Rio, com 700 lojas e o parque de diversões coberto; a tarde da Barra fora da praia"
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
        "name": "Feira Hippie de Ipanema (domingo)",
        "category": "morning",
        "neighborhood": "Ipanema",
        "costBRL": 0,
        "tip": "Desde 1968 na Praça General Osório, só aos domingos: artesanato, roupa, arte e comida — melhor souvenir carioca"
      },
      {
        "name": "Feira do Rio Antigo (Rua do Lavradio)",
        "category": "afternoon",
        "neighborhood": "Lapa",
        "costBRL": 0,
        "tip": "No primeiro sábado do mês a rua dos antiquários vira feira com chorinho e samba na calçada; combine com a noite na Lapa"
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
        "name": "Galeria River (Arpoador)",
        "category": "afternoon",
        "neighborhood": "Arpoador",
        "costBRL": 0,
        "tip": "Galeria de lojas de surf e skate a 2 min da Pedra do Arpoador; prancha, biquíni e sunga de marca carioca"
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
        "name": "Praia da Barra da Tijuca",
        "category": "morning",
        "neighborhood": "Barra da Tijuca",
        "costBRL": 0,
        "tip": "18 km de praia: escolha um posto e fique por ali · Posto 8 concentra kite e stand-up"
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
        "name": "Praia do Leblon (Posto 12 e Baixo Bebê)",
        "category": "morning",
        "neighborhood": "Leblon",
        "costBRL": 0,
        "tip": "Baixo Bebê, no Posto 12, é o trecho com estrutura para famílias com crianças pequenas · Mais tranquila que Ipanema, mesma faixa de areia"
      },
      {
        "name": "Praia Vermelha (Urca)",
        "category": "morning",
        "neighborhood": "Urca",
        "costBRL": 0,
        "tip": "Mar calmo, boa para crianças · Fica ao lado do bondinho do Pão de Açúcar: combine os dois na mesma manhã"
      },
      {
        "name": "Prainha",
        "category": "morning",
        "neighborhood": "Recreio dos Bandeirantes",
        "costBRL": 60,
        "tip": "Reserva ambiental, quase sem construções em volta · Mar de surfe: ondas fortes, não é praia para nadar com crianças pequenas"
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
        "name": "Shopping Rio Sul",
        "category": "afternoon",
        "neighborhood": "Botafogo",
        "costBRL": 0,
        "tip": "O shopping clássico da zona sul, a 5 min de Copacabana; cinema e lojas de marca, bom para tarde de chuva"
      },
      {
        "name": "Rubaiyat Rio (Jockey)",
        "category": "dinner",
        "neighborhood": "Gávea",
        "costBRL": 180,
        "tip": "Carnes premium com vista pro Cristo iluminado no Jockey Club · Jantar de ocasião especial — romântico e imponente"
      },
      {
        "name": "Saara (comércio popular do Centro)",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Mais de mil lojas em ruas de pedestres, de fantasia de Carnaval a tecido e eletrônico; vá de manhã, em dia de semana, e negocie"
      },
      {
        "name": "Shopping Leblon",
        "category": "afternoon",
        "neighborhood": "Leblon",
        "costBRL": 0,
        "tip": "Marcas brasileiras de praia e moda (Farm, Osklen, Lenny) num shopping pequeno e elegante; terraço com vista para a Lagoa"
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
      },
      {
        "name": "VillageMall (Barra)",
        "category": "afternoon",
        "neighborhood": "Barra da Tijuca",
        "costBRL": 0,
        "tip": "O shopping de luxo da Barra, com grifes internacionais, restaurantes e Teatro Bradesco; combine com a praia da Barra"
      }
    ],
    "hotels": [
      {
        "name": "Arena Copacabana",
        "zone": "Copacabana",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Frente-mar honesto com rooftop - custo-benefício raro na orla"
      },
      {
        "name": "Arena Copacabana Hotel",
        "zone": "Copacabana",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 600-950",
        "tip": "Rooftop com piscina de frente para a praia de Copacabana"
      },
      {
        "name": "Atlantis Copacabana Hotel",
        "zone": "Copacabana",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "Hotel simples a 2 quadras da praia, na divisa com Ipanema; piscina no terraço e preço de Copacabana de antigamente"
      },
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
        "name": "Hilton Copacabana",
        "zone": "Copacabana",
        "tier": "upscale",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.000-1.800",
        "tip": "Rooftop com vista total da praia - confiável pra família"
      },
      {
        "name": "Ibis Copacabana Posto 2",
        "zone": "Copacabana",
        "tier": "budget",
        "personaTags": [
          "family",
          "solo"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "O básico bem-feito a 2 quadras da praia"
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
      },
      {
        "name": "Windsor Excelsior Copacabana",
        "zone": "Copacabana",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 550-900",
        "tip": "Rede carioca de frente para o mar, café da manhã elogiado"
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
        "name": "Bairro Alto (bares de rua)",
        "category": "night",
        "neighborhood": "Bairro Alto",
        "costBRL": 80,
        "tip": "As ruas enchem depois das 23h; a tradição é beber na rua com o copo na mão, de bar em bar · Subida íngreme — vá pelo Elevador da Glória ou de táxi"
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
        "name": "Jardim Botânico Tropical (Belém)",
        "category": "morning",
        "neighborhood": "Belém",
        "costBRL": 20,
        "tip": "Palmeiras, pavões e plantas das antigas colônias ao lado do Mosteiro dos Jerónimos; a pausa verde do circuito de Belém"
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
        "name": "Centro Colombo",
        "category": "afternoon",
        "neighborhood": "Benfica",
        "costBRL": 0,
        "tip": "O maior shopping da cidade, com Primark, Zara, FNAC e cinema; metrô Colégio Militar/Luz, bom para dia de chuva"
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
        "name": "Confeitaria Nacional (1829)",
        "category": "breakfast",
        "neighborhood": "Rossio",
        "costBRL": 30,
        "tip": "A confeitaria mais antiga de Lisboa, no Rossio, com bolo-rei o ano inteiro e pastéis no balcão de madeira"
      },
      {
        "name": "Conserveira de Lisboa",
        "category": "afternoon",
        "neighborhood": "Baixa",
        "costBRL": 0,
        "tip": "Loja de 1930 que embrulha latas de sardinha e atum em papel como antigamente — o presente comestível de Lisboa"
      },
      {
        "name": "Copenhagen Coffee Lab (Príncipe Real)",
        "category": "breakfast",
        "neighborhood": "Príncipe Real",
        "costBRL": 40,
        "tip": "Café dinamarquês com cardamomo buns e pão de fermentação natural; terraço na praça do Príncipe Real"
      },
      {
        "name": "El Corte Inglés Lisboa",
        "category": "afternoon",
        "neighborhood": "São Sebastião",
        "costBRL": 0,
        "tip": "Loja de departamentos com o Gourmet Experience no último andar; metrô São Sebastião, ao lado da Gulbenkian"
      },
      {
        "name": "Praia da Costa da Caparica",
        "category": "morning",
        "neighborhood": "Almada",
        "costBRL": 20,
        "tip": "Do outro lado do Tejo: ônibus a partir do Areeiro ou barco até Cacilhas + ônibus; quilômetros de areal com restaurantes de peixe à beira-mar"
      },
      {
        "name": "Embaixada (galeria no Príncipe Real)",
        "category": "afternoon",
        "neighborhood": "Príncipe Real",
        "costBRL": 0,
        "tip": "Palacete neo-árabe de 1877 com lojas de designers portugueses e um bar de gin no pátio"
      },
      {
        "name": "Fábrica Coffee Roasters",
        "category": "breakfast",
        "neighborhood": "Baixa",
        "costBRL": 50,
        "tip": "Café de especialidade torrado na casa · Brunch com tostas e ovos"
      },
      {
        "name": "Feira da Ladra (terça e sábado)",
        "category": "morning",
        "neighborhood": "Alfama",
        "costBRL": 0,
        "tip": "O mercado de pulgas de Lisboa desde o século XIII, no Campo de Santa Clara; azulejos antigos, vinil e bugigangas — negocie"
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
        "name": "Jardim Botânico de Lisboa (Príncipe Real)",
        "category": "afternoon",
        "neighborhood": "Príncipe Real",
        "costBRL": 20,
        "tip": "Jardim científico de 1878 escondido atrás do Museu de História Natural; palmeiras centenárias e silêncio no meio da cidade"
      },
      {
        "name": "Jardim da Estrela",
        "category": "afternoon",
        "neighborhood": "Estrela",
        "costBRL": 0,
        "tip": "Jardim romântico do século XIX em frente à Basílica, com coreto, lago de patos e parque infantil; o favorito das famílias lisboetas"
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
        "name": "Mesa de Frades (fado em Alfama)",
        "category": "night",
        "neighborhood": "Alfama",
        "costBRL": 250,
        "tip": "Antiga capela transformada em casa de fado; jantar com espetáculo, reserve com antecedência"
      },
      {
        "name": "Miradouros: Senhora do Monte e Graça",
        "category": "afternoon",
        "neighborhood": "Graça",
        "costBRL": 0,
        "tip": "Os dois miradouros mais bonitos, a 10 minutos um do outro · Fim de tarde tem a luz dourada sobre o casario"
      },
      {
        "name": "Miradouro dos Montes Claros (Monsanto)",
        "category": "afternoon",
        "neighborhood": "Monsanto",
        "costBRL": 0,
        "tip": "O pulmão verde de Lisboa, com trilhas e o miradouro sobre o Tejo e a Ponte 25 de Abril; vá de táxi ou carro"
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
        "name": "Parque Eduardo VII",
        "category": "afternoon",
        "neighborhood": "Marquês de Pombal",
        "costBRL": 0,
        "tip": "O maior parque do centro, com a vista enquadrada até o Tejo e a Estufa Fria; comece pelo alto, no miradouro"
      },
      {
        "name": "Pastéis de Belém (café da manhã)",
        "category": "breakfast",
        "neighborhood": "Belém",
        "costBRL": 35,
        "tip": "A receita original e secreta desde 1837 · Coma quente com canela e açúcar em pó"
      },
      {
        "name": "Pensão Amor",
        "category": "night",
        "neighborhood": "Cais do Sodré",
        "costBRL": 60,
        "tip": "Antiga pensão de marinheiros virou bar de decoração burlesca — fica na Pink Street, ótimo para começar a noite"
      },
      {
        "name": "Ponto Final (Cacilhas)",
        "category": "lunch",
        "neighborhood": "Almada (barco de 10min)",
        "costBRL": 120,
        "tip": "Atravesse o Tejo de barco no Cais do Sodré · Mesas na beira do rio com Lisboa inteira de frente"
      },
      {
        "name": "Praia da Adraga (Sintra)",
        "category": "morning",
        "neighborhood": "Colares",
        "costBRL": 60,
        "tip": "Praia selvagem entre falésias na costa de Sintra, com restaurante de peixe na areia; vá de carro ou táxi a partir de Sintra"
      },
      {
        "name": "Praia de Carcavelos",
        "category": "morning",
        "neighborhood": "Carcavelos",
        "costBRL": 15,
        "tip": "Trem da Linha de Cascais a partir do Cais do Sodré, 25 min — desça em Carcavelos e a praia fica a 10 min a pé · Areal largo com escolas de surf; leve protetor, há pouca sombra"
      },
      {
        "name": "Praia do Guincho",
        "category": "afternoon",
        "neighborhood": "Cascais",
        "costBRL": 40,
        "tip": "Praia selvagem de dunas e vento forte, a preferida de surf e kite — vá de carro ou táxi a partir de Cascais · Combine com o bate-volta a Cascais no mesmo dia"
      },
      {
        "name": "Praia do Tamariz (Estoril)",
        "category": "morning",
        "neighborhood": "Estoril",
        "costBRL": 15,
        "tip": "A praia do Estoril, com piscina oceânica e o calçadão até Cascais; trem da Linha de Cascais, estação Estoril na areia"
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
        "name": "Praia de Santo Amaro de Oeiras",
        "category": "afternoon",
        "neighborhood": "Oeiras",
        "costBRL": 15,
        "tip": "Praia de bandeira azul a 20 min de trem, com piscina oceânica e passeio marítimo; menos cheia que Carcavelos"
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
        "name": "Carmo Rooftop",
        "category": "night",
        "neighborhood": "Chiado",
        "costBRL": 70,
        "tip": "Terraço junto ao Elevador de Santa Justa com vista para o Castelo — vá ao pôr do sol"
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
        "name": "O Velho Eurico (Castelo)",
        "category": "lunch",
        "neighborhood": "Castelo",
        "costBRL": 90,
        "tip": "Tasca moderna aos pés do castelo, petiscos e vinho a copo; reserva só pelo Instagram, vale a tentativa"
      },
      {
        "name": "A Vida Portuguesa (Chiado)",
        "category": "afternoon",
        "neighborhood": "Chiado",
        "costBRL": 0,
        "tip": "Loja de marcas portuguesas antigas — sabonetes Claus Porto, pasta Couto, andorinhas de cerâmica; a loja mais bonita para souvenir"
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
        "name": "Browns Central",
        "zone": "Baixa",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 450-800",
        "tip": "Boutique acessível no miolo da Baixa"
      },
      {
        "name": "Corpo Santo Lisbon",
        "zone": "Cais do Sodré",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 800-1.400",
        "tip": "5 estrelas com muralha fernandina no subsolo - localização total"
      },
      {
        "name": "Home Lisbon Hostel",
        "zone": "Baixa",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 100-250",
        "tip": "Multi-premiado - o jantar da mamma é lendário entre mochileiros"
      },
      {
        "name": "LX Boutique Hotel",
        "zone": "Cais do Sodré",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 650-1.000",
        "tip": "Boutique de frente para o Tejo, Time Out Market na esquina"
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
        "name": "Hotel Mundial",
        "zone": "Baixa",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Clássico da Baixa com rooftop pro Castelo - prático pra tudo a pé"
      },
      {
        "name": "My Story Hotel Rossio",
        "zone": "Baixa",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 600-950",
        "tip": "Na praça do Rossio, a pé de Alfama e Chiado"
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
      },
      {
        "name": "Yes! Lisbon Hostel",
        "zone": "Baixa",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 120-250",
        "tip": "Um dos hostels mais premiados do mundo, no centro da Baixa"
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
        "name": "Voo de balão ao nascer do sol",
        "category": "morning",
        "neighborhood": "Kissimmee",
        "costBRL": 1200,
        "tip": "Uma hora sobre os lagos e laranjais ao amanhecer, com brinde no pouso; reserve pela Orlando Balloon Rides, saída às 5h30"
      },
      {
        "name": "Blue Spring State Park (peixes-boi)",
        "category": "morning",
        "neighborhood": "Orange City",
        "costBRL": 40,
        "tip": "De novembro a março, centenas de peixes-boi se aquecem na nascente; chegue antes das 9h, o parque fecha quando lota"
      },
      {
        "name": "The Boathouse (Disney Springs)",
        "category": "dinner",
        "neighborhood": "Walt Disney World",
        "costBRL": 260,
        "tip": "Frutos do mar à beira do lago do Disney Springs · Os carros anfíbios saem do deck do restaurante"
      },
      {
        "name": "Briarpatch (Winter Park)",
        "category": "breakfast",
        "neighborhood": "Winter Park",
        "costBRL": 90,
        "tip": "Café da manhã na Park Avenue com mesas na calçada e fatias de bolo exageradas; combine com o passeio de barco"
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
        "name": "Dr. Phillips Center (Broadway em Orlando)",
        "category": "night",
        "neighborhood": "Downtown",
        "costBRL": 300,
        "tip": "O centro de artes do Downtown recebe os musicais da Broadway em turnê; a noite de teatro fora dos parques"
      },
      {
        "name": "First Watch",
        "category": "breakfast",
        "neighborhood": "Vários (Lake Buena Vista)",
        "costBRL": 80,
        "tip": "Café da manhã saudável e farto, favorito local · Sucos prensados na hora e omeletes generosos"
      },
      {
        "name": "The Florida Mall",
        "category": "afternoon",
        "neighborhood": "South Orlando",
        "costBRL": 0,
        "tip": "O maior shopping da Flórida Central, com M&M's World e Crayola; perto do aeroporto, bom para o último dia"
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
        "name": "Hillstone (jantar no lago, Winter Park)",
        "category": "dinner",
        "neighborhood": "Winter Park",
        "costBRL": 250,
        "tip": "Jantar com mesa na varanda sobre o Lake Killarney ao pôr do sol; o restaurante onde Winter Park celebra"
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
        "name": "Orlando International Premium Outlets",
        "category": "morning",
        "neighborhood": "International Drive",
        "costBRL": 0,
        "tip": "O outlet do começo da I-Drive, Nike, Coach e Tommy com desconto; vá de manhã em dia de semana"
      },
      {
        "name": "Keke's Breakfast Cafe",
        "category": "breakfast",
        "neighborhood": "International Drive",
        "costBRL": 70,
        "tip": "Rede local de café da manhã com pancakes e omeletes gigantes; porções para dividir antes do parque"
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
        "name": "The Mall at Millenia",
        "category": "afternoon",
        "neighborhood": "Millenia",
        "costBRL": 0,
        "tip": "O shopping de grifes de Orlando, com Apple, Bloomingdale's e Neiman Marcus; a 10 min da Universal"
      },
      {
        "name": "Maple Street Biscuit Company",
        "category": "breakfast",
        "neighborhood": "Vários (I-Drive / Winter Park)",
        "costBRL": 70,
        "tip": "Biscuits artesanais com combinações criativas · O \"Five and Dime\" com frango frito é o pedido certo"
      },
      {
        "name": "Morse Museum (Tiffany, Winter Park)",
        "category": "morning",
        "neighborhood": "Winter Park",
        "costBRL": 80,
        "tip": "A maior coleção de vitrais e lâmpadas Tiffany do mundo, incluindo a capela da feira de 1893; Winter Park, grátis às sextas à noite no inverno"
      },
      {
        "name": "Orlando Museum of Art",
        "category": "afternoon",
        "neighborhood": "Loch Haven",
        "costBRL": 100,
        "tip": "Arte americana e pré-colombiana no parque dos museus de Loch Haven; combine com o Science Center ao lado"
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
        "name": "Tibet-Butler Preserve",
        "category": "afternoon",
        "neighborhood": "Lake Buena Vista",
        "costBRL": 0,
        "tip": "Trilhas de passarela por pântano e pinheiral a 10 min da Disney; gratuito, a pausa de silêncio entre os parques"
      },
      {
        "name": "Universal Studios + Islands of Adventure",
        "category": "morning",
        "neighborhood": "Universal Orlando",
        "costBRL": 680,
        "tip": "O passe park-to-park libera o trem do Harry Potter entre os dois parques — é a atração · Single rider corta filas pela metade para os maiores"
      },
      {
        "name": "Victoria & Albert's (Grand Floridian)",
        "category": "dinner",
        "neighborhood": "Walt Disney World",
        "costBRL": 900,
        "tip": "O único restaurante com estrela Michelin da Disney, menu degustação com harpa ao vivo; só adultos, reserve com 60 dias"
      },
      {
        "name": "Wekiwa Springs State Park",
        "category": "morning",
        "neighborhood": "Apopka",
        "costBRL": 40,
        "tip": "Nascente de água cristalina a 22 °C o ano inteiro, com caiaque pelo rio entre jacarés e tartarugas; 30 min do centro, lota aos fins de semana"
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
        "name": "Floridays Resort",
        "zone": "I-Drive",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 500-850",
        "tip": "Suítes de 2-3 quartos com cozinha - família grande cabe"
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
      },
      {
        "name": "Holiday Inn Express & Suites Lake Buena Vista",
        "zone": "Lake Buena Vista",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 450-750",
        "tip": "Café da manhã incluído e 10 min da Disney Springs; o budget de família que não parece budget"
      },
      {
        "name": "Rosen Inn International",
        "zone": "I-Drive",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 350-600",
        "tip": "Clássico da I-Drive com piscina, estacionamento grátis e ônibus para os parques; quartos simples, localização que resolve"
      },
      {
        "name": "Rosen Shingle Creek",
        "zone": "Universal Blvd",
        "tier": "resort",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Resort gigante com golfe e piscinas - espaço de sobra"
      },
      {
        "name": "Waldorf Astoria Orlando",
        "zone": "Disney World",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "Hotel de luxo em Bonnet Creek, dentro da área da Disney, com transfer para os parques e campo de golfe"
      }
    ]
  },
  "Tóquio": {
    "city": "Tóquio",
    "items": [
      {
        "name": "Bar High Five (Ginza)",
        "category": "night",
        "neighborhood": "Ginza",
        "costBRL": 200,
        "tip": "Coquetelaria clássica japonesa de balcão, entre os melhores bares do mundo; sem cardápio, diga o que gosta"
      },
      {
        "name": "Blue Note Tokyo",
        "category": "night",
        "neighborhood": "Aoyama",
        "costBRL": 350,
        "tip": "A filial japonesa do clube de jazz de Nova York, com nomes internacionais; dois shows por noite, reserve"
      },
      {
        "name": "Café de l'Ambre (Ginza, 1948)",
        "category": "breakfast",
        "neighborhood": "Ginza",
        "costBRL": 50,
        "tip": "Kissaten de 1948 que só serve café, com grãos envelhecidos por décadas; balcão, silêncio e xícara pequena"
      },
      {
        "name": "Jardim do Hotel Chinzanso (mar de nuvens)",
        "category": "night",
        "neighborhood": "Mejiro",
        "costBRL": 0,
        "tip": "Jardim de 1878 com pagode e cascata, onde a névoa artificial do \"mar de nuvens\" sobe de hora em hora; gratuito, melhor à noite"
      },
      {
        "name": "Ginza Six",
        "category": "afternoon",
        "neighborhood": "Ginza",
        "costBRL": 0,
        "tip": "O shopping de luxo de Ginza com arte no átrio, a livraria Tsutaya e um jardim no terraço; entre no Teatro Kanze no subsolo"
      },
      {
        "name": "Kappabashi (rua dos utensílios de cozinha)",
        "category": "afternoon",
        "neighborhood": "Asakusa",
        "costBRL": 0,
        "tip": "800 m de lojas de facas, cerâmica e comida de plástico entre Asakusa e Ueno; o souvenir de quem cozinha"
      },
      {
        "name": "Komeda's Coffee (morning set)",
        "category": "breakfast",
        "neighborhood": "Shinjuku",
        "costBRL": 40,
        "tip": "Rede de Nagoya onde o café de manhã vem com torrada grossa e ovo de graça (morning set); sofás e jornal"
      },
      {
        "name": "New York Bar (Park Hyatt)",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 250,
        "tip": "O bar do filme Encontros e Desencontros, no 52º andar com jazz ao vivo; consumação mínima depois das 20h"
      },
      {
        "name": "Nonbei Yokocho (Shibuya)",
        "category": "night",
        "neighborhood": "Shibuya",
        "costBRL": 100,
        "tip": "Beco dos bêbados: duas vielas de bares de 6 lugares a 2 min do cruzamento de Shibuya; entre onde houver banco vazio"
      },
      {
        "name": "Samurai Restaurant (Kabukicho)",
        "category": "night",
        "neighborhood": "Shinjuku",
        "costBRL": 350,
        "tip": "O sucessor do Robot Restaurant, no mesmo porão de Kabukicho: show de luzes, tambores e robôs; reserve pelo site"
      },
      {
        "name": "teamLab Planets",
        "category": "afternoon",
        "neighborhood": "Toyosu",
        "costBRL": 150,
        "tip": "Museu imersivo onde se anda descalço pela água entre luzes; reserve o horário com dias de antecedência"
      },
      {
        "name": "Tempura Tsunahachi (Shinjuku, 1923)",
        "category": "dinner",
        "neighborhood": "Shinjuku",
        "costBRL": 200,
        "tip": "Tempurá frito na sua frente num balcão de 1923; peça o set e deixe o chef mandar na ordem"
      },
      {
        "name": "Yakatabune (jantar em barco tradicional na baía)",
        "category": "night",
        "neighborhood": "Asakusa",
        "costBRL": 450,
        "tip": "Barco de madeira com tatames, tempurá e saquê navegando sob a Rainbow Bridge; reserve com a Amisei ou Funasei"
      },
      {
        "name": "Zauo (pesque o seu peixe)",
        "category": "dinner",
        "neighborhood": "Shinjuku",
        "costBRL": 220,
        "tip": "Restaurante-barco onde a família pesca o peixe do tanque e a cozinha prepara; crianças adoram, reserve"
      },
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
        "name": "Asakusa View Hotel",
        "zone": "Asakusa",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Vista do Senso-ji e da Skytree - a Tóquio tradicional na janela"
      },
      {
        "name": "Hotel Gracery Shinjuku",
        "zone": "Shinjuku",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "O hotel do Godzilla na fachada - crianças em êxtase em Kabukicho"
      },
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
      },
      {
        "name": "Shibuya Excel Hotel Tokyu",
        "zone": "Shibuya",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Em cima do cruzamento de Shibuya - localização cinematográfica"
      },
      {
        "name": "Hotel Sunroute Plaza Shinjuku",
        "zone": "Shinjuku",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Hotel grande e eficiente a 3 min da saída sul da estação Shinjuku, com ônibus direto para Narita e Haneda; quartos compactos"
      },
      {
        "name": "Tokyu Stay Shinjuku",
        "zone": "Shinjuku",
        "tier": "mid",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 450-750",
        "tip": "Máquina de lavar no quarto - o prático japonês perfeito"
      },
      {
        "name": "UNPLAN Kagurazaka",
        "zone": "Kagurazaka",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 130-280",
        "tip": "Hostel impecável no bairro-Paris de Tóquio"
      }
    ]
  },
  "Roma": {
    "city": "Roma",
    "items": [
      {
        "name": "Ai Tre Scalini (enoteca em Monti)",
        "category": "night",
        "neighborhood": "Monti",
        "costBRL": 90,
        "tip": "Enoteca de bairro desde 1895: vinho em taça, tábuas e mesa na calçada — chega cedo, não aceita reserva"
      },
      {
        "name": "Via Appia Antica de bicicleta",
        "category": "morning",
        "neighborhood": "Appia Antica",
        "costBRL": 90,
        "tip": "Alugue a bicicleta no centro de visitantes do parque e pedale sobre as pedras romanas até as catacumbas; aos domingos a via fecha para carros"
      },
      {
        "name": "Mercado de Campo de' Fiori",
        "category": "morning",
        "neighborhood": "Centro Storico",
        "costBRL": 0,
        "tip": "Feira de frutas, flores e especiarias na praça, de segunda a sábado de manhã; à noite a praça vira bar"
      },
      {
        "name": "Castel Romano Designer Outlet",
        "category": "morning",
        "neighborhood": "Castel Romano",
        "costBRL": 50,
        "tip": "Outlet das grifes italianas a 25 km, com ônibus direto de Termini; meio dia, vá em dia de semana"
      },
      {
        "name": "Castroni (Via Cola di Rienzo)",
        "category": "afternoon",
        "neighborhood": "Prati",
        "costBRL": 0,
        "tip": "Empório de 1932 com café no balcão e tudo de comida italiana para levar; a rua é a de compras de Prati, perto do Vaticano"
      },
      {
        "name": "Cesare al Casaletto (Monteverde)",
        "category": "dinner",
        "neighborhood": "Monteverde",
        "costBRL": 140,
        "tip": "Trattoria de bairro no fim da linha do bonde 8, a preferida dos romanos: fritti, carbonara e vinho natural; reserve"
      },
      {
        "name": "Cinecittà si Mostra (estúdios de cinema)",
        "category": "morning",
        "neighborhood": "Cinecittà",
        "costBRL": 110,
        "tip": "Os cenários de Roma antiga de filmes e séries, a 20 min de metrô (linha A, estação Cinecittà); fechado às terças"
      },
      {
        "name": "Eataly Roma",
        "category": "afternoon",
        "neighborhood": "Ostiense",
        "costBRL": 0,
        "tip": "Quatro andares de comida italiana para levar — azeite, massa, queijo — e restaurantes por tema; metrô Piramide"
      },
      {
        "name": "Faro (café de especialidade)",
        "category": "breakfast",
        "neighborhood": "Esquilino",
        "costBRL": 40,
        "tip": "O primeiro café de especialidade de Roma, filtrado e brunch, perto de Termini; a alternativa ao espresso em pé"
      },
      {
        "name": "Galleria Alberto Sordi",
        "category": "afternoon",
        "neighborhood": "Centro Storico",
        "costBRL": 0,
        "tip": "Galeria art nouveau de 1922 na Via del Corso, com lojas e café sob o vitral — refúgio no calor ou na chuva"
      },
      {
        "name": "Giardino degli Aranci (Aventino)",
        "category": "afternoon",
        "neighborhood": "Aventino",
        "costBRL": 0,
        "tip": "Laranjal com a melhor vista gratuita da cidade ao pôr do sol; a 2 min fica o buraco da fechadura dos Cavaleiros de Malta"
      },
      {
        "name": "Gregory's Jazz Club",
        "category": "night",
        "neighborhood": "Piazza di Spagna",
        "costBRL": 120,
        "tip": "Clube de jazz íntimo a 3 min da Escadaria Espanhola; shows todas as noites, reserve mesa"
      },
      {
        "name": "Il Goccetto (enoteca)",
        "category": "night",
        "neighborhood": "Centro Storico",
        "costBRL": 80,
        "tip": "Enoteca de bairro na Via dei Banchi Vecchi com 800 rótulos e tábuas; os romanos bebem na calçada"
      },
      {
        "name": "Jerry Thomas Speakeasy",
        "category": "night",
        "neighborhood": "Centro Storico",
        "costBRL": 120,
        "tip": "Porta sem placa no Vicolo Cellini e senha que muda — reserve pelo site e responda ao enigma; coquetelaria clássica"
      },
      {
        "name": "Praia em Lido di Ostia",
        "category": "morning",
        "neighborhood": "Ostia",
        "costBRL": 20,
        "tip": "A praia dos romanos, 40 min de trem a partir da Piramide; combine com as ruínas de Ostia Antica no caminho de volta"
      },
      {
        "name": "Mercato Monti (vintage)",
        "category": "morning",
        "neighborhood": "Monti",
        "costBRL": 0,
        "tip": "Mercado de designers e vintage aos fins de semana num hotel de Monti; roupa, joia e vinil de criadores romanos"
      },
      {
        "name": "Parco degli Acquedotti",
        "category": "afternoon",
        "neighborhood": "Cinecittà",
        "costBRL": 0,
        "tip": "Campo aberto com os aquedutos romanos de 2.000 anos — cenário de La Grande Bellezza; metrô Giulio Agricola, leve água"
      },
      {
        "name": "Pasticceria Boccione (Ghetto)",
        "category": "breakfast",
        "neighborhood": "Ghetto Ebraico",
        "costBRL": 25,
        "tip": "Confeitaria judaica sem placa, de balcão, com a torta de ricota e cereja; abre cedo, fecha ao esgotar"
      },
      {
        "name": "Rinascente (Via del Tritone)",
        "category": "afternoon",
        "neighborhood": "Centro Storico",
        "costBRL": 0,
        "tip": "Loja de departamentos com um aqueduto romano exposto no subsolo e terraço de bares no último andar"
      },
      {
        "name": "Scuola di Gladiatori (Gruppo Storico Romano)",
        "category": "morning",
        "neighborhood": "Appia Antica",
        "costBRL": 350,
        "tip": "Aula de 2h com túnica, espada de madeira e museu de armaduras — crianças a partir de 6 anos adoram; reserve com antecedência"
      },
      {
        "name": "Terrazza Borromini (rooftop)",
        "category": "night",
        "neighborhood": "Piazza Navona",
        "costBRL": 150,
        "tip": "Terraço sobre a Piazza Navona com vista para a cúpula de Sant'Agnese; reserve o entardecer, consumação mínima"
      },
      {
        "name": "Villa Doria Pamphilj",
        "category": "morning",
        "neighborhood": "Monteverde",
        "costBRL": 0,
        "tip": "O maior parque de Roma, onde os romanos correm e fazem piquenique; longe dos turistas, bom com crianças e bicicleta"
      },
      {
        "name": "Welcome To Rome (show imersivo)",
        "category": "afternoon",
        "neighborhood": "Centro Storico",
        "costBRL": 80,
        "tip": "Projeções e maquetes contam 2.700 anos da cidade em 30 min — bom para abrir a viagem com as crianças, ao lado do Castel Sant'Angelo"
      },
      {
        "name": "Bate-volta a Zoomarine (Torvaianica)",
        "category": "morning",
        "neighborhood": "Pomezia",
        "costBRL": 220,
        "tip": "Parque com golfinhos, piscinas e brinquedos a 35 km de Roma; ônibus próprio do parque sai de Termini na alta temporada"
      },
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
        "name": "Generator Rome",
        "zone": "Termini",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 300-550",
        "tip": "Hostel de design perto de Termini com quartos privativos e bar no terraço; bom para quem chega de trem"
      },
      {
        "name": "Nerva Boutique Hotel",
        "zone": "Monti",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 550-900",
        "tip": "Boutique aos pés do Fórum no charmoso Monti"
      },
      {
        "name": "Hotel Ponte Sisto",
        "zone": "Centro Storico",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.000-1.700",
        "tip": "Pátio tranquilo a uma ponte de Trastevere"
      },
      {
        "name": "Hotel Quirinale",
        "zone": "Via Nazionale",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Clássico com jardim - entrada secreta pra Ópera de Roma"
      },
      {
        "name": "The RomeHello",
        "zone": "Termini",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 120-280",
        "tip": "Hostel-design com propósito social - o melhor budget de Roma"
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
      },
      {
        "name": "Albergo del Senato",
        "zone": "Pantheon",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Janelas de frente pro Pantheon - acordar com 2 mil anos de vista"
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
        "name": "Bahia Café House (Pelourinho)",
        "category": "breakfast",
        "neighborhood": "Pelourinho",
        "costBRL": 40,
        "tip": "Café num sobrado colonial do Pelourinho com cuscuz, tapioca e café da Chapada; comece o dia no centro histórico"
      },
      {
        "name": "Bahia Outlet Center",
        "category": "afternoon",
        "neighborhood": "Paralela",
        "costBRL": 0,
        "tip": "Outlet de marcas nacionais na Paralela, com preços de fábrica; vá em dia de semana"
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
        "name": "Boteco do França (Rio Vermelho)",
        "category": "night",
        "neighborhood": "Rio Vermelho",
        "costBRL": 70,
        "tip": "Boteco de esquina na Praça da Mariquita, com cerveja gelada e a boemia do Rio Vermelho até tarde; emende com o acarajé"
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
        "name": "Mercado do Rio Vermelho (Ceasinha)",
        "category": "morning",
        "neighborhood": "Rio Vermelho",
        "costBRL": 30,
        "tip": "Mercado de frutas, flores e temperos da Bahia, com restaurantes e sucos no mezanino; o café da manhã dos soteropolitanos"
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
        "name": "Instituto Mauá (artesanato baiano)",
        "category": "afternoon",
        "neighborhood": "Pelourinho",
        "costBRL": 0,
        "tip": "Loja do governo com artesanato de todo o estado a preço justo — renda, cerâmica e palha, sem regateio"
      },
      {
        "name": "JAM no MAM (jazz no Solar do Unhão)",
        "category": "night",
        "neighborhood": "Comércio",
        "costBRL": 40,
        "tip": "Jazz ao pôr do sol com a baía de fundo — o sábado mais elegante de Salvador · Ingressos acabam: chegue cedo"
      },
      {
        "name": "Jardim Botânico de Salvador",
        "category": "morning",
        "neighborhood": "Paralela",
        "costBRL": 0,
        "tip": "Mata Atlântica preservada com trilhas, orquidário e borboletário na Avenida Luís Viana; gratuito, fecha às segundas"
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
        "name": "Parque da Cidade (Joventino Silva)",
        "category": "morning",
        "neighborhood": "Itaigara",
        "costBRL": 0,
        "tip": "Mata Atlântica no meio da cidade com trilhas, lago e parquinho; onde Salvador corre de manhã"
      },
      {
        "name": "Parque Metropolitano de Pituaçu",
        "category": "morning",
        "neighborhood": "Pituaçu",
        "costBRL": 0,
        "tip": "Lagoa com ciclovia de 15 km ao redor e esculturas de Mário Cravo; alugue bicicleta na entrada"
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
        "name": "Praia do Flamengo",
        "category": "morning",
        "neighborhood": "Flamengo",
        "costBRL": 0,
        "tip": "A praia mais ao norte da orla, de mar aberto e barracas estruturadas; vá de manhã, antes do vento"
      },
      {
        "name": "Praia de Itapuã",
        "category": "morning",
        "neighborhood": "Itapuã",
        "costBRL": 40,
        "tip": "A praia cantada por Dorival e Vinicius — coqueiros, farol e baianidade · Barracas simples e mar bom em maré baixa"
      },
      {
        "name": "Praia de Jaguaribe",
        "category": "afternoon",
        "neighborhood": "Jaguaribe",
        "costBRL": 0,
        "tip": "A praia dos surfistas e das barracas de tapioca na orla da Paralela; piscinas naturais na maré baixa"
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
        "name": "Rubi Café (Rio Vermelho)",
        "category": "breakfast",
        "neighborhood": "Rio Vermelho",
        "costBRL": 40,
        "tip": "Cafeteria de bairro no Rio Vermelho com pão de queijo, bolo de aipim e café coado; a manhã do bairro boêmio"
      },
      {
        "name": "Salvador Shopping",
        "category": "afternoon",
        "neighborhood": "Caminho das Árvores",
        "costBRL": 0,
        "tip": "O maior e mais moderno da cidade, com cinema e praça de alimentação ampla; metrô Pituaçu/Mussurunga não serve, vá de carro ou app"
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
        "name": "Shopping Barra",
        "category": "afternoon",
        "neighborhood": "Barra",
        "costBRL": 0,
        "tip": "A 5 min do Farol da Barra, com cinema e lojas de marca; refúgio com ar-condicionado entre a praia e o pôr do sol"
      },
      {
        "name": "Shopping da Bahia",
        "category": "afternoon",
        "neighborhood": "Caminho das Árvores",
        "costBRL": 0,
        "tip": "O shopping mais tradicional da cidade, no eixo do Iguatemi; bom para dia de chuva, ao lado da rodoviária"
      },
      {
        "name": "Shopping Paralela",
        "category": "afternoon",
        "neighborhood": "Paralela",
        "costBRL": 0,
        "tip": "Shopping grande na Avenida Paralela, com cinema e lojas de marca; a caminho do Jardim Botânico e de Pituaçu"
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
      },
      {
        "name": "Parque Zoobotânico Getúlio Vargas",
        "category": "morning",
        "neighborhood": "Ondina",
        "costBRL": 20,
        "tip": "Zoológico de Salvador em meio à mata de Ondina, com animais brasileiros; entrada barata, bom com crianças pequenas"
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
      },
      {
        "name": "Ibis Salvador Rio Vermelho",
        "zone": "Rio Vermelho",
        "tier": "budget",
        "personaTags": [
          "family",
          "solo"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Base econômica no melhor bairro gastronômico"
      },
      {
        "name": "Laranjeiras Hostel",
        "zone": "Pelourinho",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 80-200",
        "tip": "Hostel histórico no Pelô - mochileiro com cultura na porta"
      },
      {
        "name": "Mercure Salvador Rio Vermelho",
        "zone": "Rio Vermelho",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 400-700",
        "tip": "No bairro do acarajé e da noite - praticidade com vista"
      },
      {
        "name": "Hotel Villa Bahia",
        "zone": "Pelourinho",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Boutique colonial no coração do Pelô - café no pátio"
      },
      {
        "name": "Wish Hotel da Bahia",
        "zone": "Campo Grande",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "O clássico histórico com piscina e obras de Carybé"
      }
    ]
  },
  "Buenos Aires": {
    "city": "Buenos Aires",
    "items": [
      {
        "name": "Alto Palermo Shopping",
        "category": "afternoon",
        "neighborhood": "Palermo",
        "costBRL": 0,
        "tip": "O shopping mais movimentado da cidade, marcas argentinas de roupa e couro; metrô Bulnes, linha D"
      },
      {
        "name": "Atalaya (medialunas de Palermo)",
        "category": "breakfast",
        "neighborhood": "Palermo",
        "costBRL": 40,
        "tip": "A confeitaria das melhores medialunas de Palermo, fila na porta de manhã; peça as de manteiga"
      },
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
        "name": "Distrito Arcos (outlet)",
        "category": "afternoon",
        "neighborhood": "Palermo",
        "costBRL": 0,
        "tip": "Outlet a céu aberto sob os arcos de um antigo viaduto ferroviário em Palermo; marcas argentinas com desconto"
      },
      {
        "name": "Don Julio",
        "category": "dinner",
        "neighborhood": "Palermo",
        "costBRL": 320,
        "tip": "Eleita a melhor parrilla do mundo — reserve com semanas · Enquanto espera, servem espumante na calçada"
      },
      {
        "name": "Feria de Mataderos (domingo)",
        "category": "morning",
        "neighborhood": "Mataderos",
        "costBRL": 0,
        "tip": "Feira gaúcha com artesanato de couro e prata, empanadas e folclore ao vivo; só aos domingos, longe do centro, vá de táxi"
      },
      {
        "name": "Feria de Plaza Francia (Recoleta)",
        "category": "afternoon",
        "neighborhood": "Recoleta",
        "costBRL": 0,
        "tip": "Feira de artesãos nos fins de semana ao lado do Cemitério da Recoleta; mate, couro e prata com quem faz"
      },
      {
        "name": "Fervor (parrilla e peixes)",
        "category": "dinner",
        "neighborhood": "Recoleta",
        "costBRL": 220,
        "tip": "Brasa clássica de Recoleta que faz tão bem peixe quanto carne; salão elegante, reserve"
      },
      {
        "name": "Calle Florida e Galerías Pacífico",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O calçadão comercial histórico da cidade · Os afrescos da cúpula das Galerías são obra de mestres argentinos"
      },
      {
        "name": "Frank's Bar (speakeasy)",
        "category": "night",
        "neighborhood": "Palermo",
        "costBRL": 90,
        "tip": "Entrada por cabine telefônica com a senha do dia (publicada nas redes do bar); coquetelaria clássica"
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
        "name": "Jardín Botánico Carlos Thays",
        "category": "morning",
        "neighborhood": "Palermo",
        "costBRL": 0,
        "tip": "Jardim de 1898 com estufas, esculturas e gatos; gratuito, ao lado do Jardín Japonés e dos Bosques"
      },
      {
        "name": "Jardín Japonés",
        "category": "afternoon",
        "neighborhood": "Palermo",
        "costBRL": 30,
        "tip": "Lago com carpas, pontes e casa de chá — pequeno, cabe antes ou depois dos Bosques de Palermo"
      },
      {
        "name": "La Cabrera",
        "category": "dinner",
        "neighborhood": "Palermo",
        "costBRL": 260,
        "tip": "Parrilla famosa pelas guarnições que lotam a mesa · Porções gigantes — um corte serve dois"
      },
      {
        "name": "Confitería La Ideal (1912)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 60,
        "tip": "Confeitaria art nouveau restaurada, cenário de filmes de tango; medialunas e café com leite sob os lustres"
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
        "name": "Niceto Club",
        "category": "night",
        "neighborhood": "Palermo",
        "costBRL": 120,
        "tip": "Shows e festas que viram a madrugada; confira a programação da semana antes de ir"
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
        "name": "Parque Lezama",
        "category": "afternoon",
        "neighborhood": "San Telmo",
        "costBRL": 0,
        "tip": "Barranca onde a cidade foi fundada, com a igreja ortodoxa russa de cúpulas azuis; fim de tarde depois de San Telmo"
      },
      {
        "name": "Parrilla Peña",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 150,
        "tip": "Parrilla raiz sem turismo — garçons de colete e carne no ponto · Preço honesto para qualidade alta"
      },
      {
        "name": "Patio Bullrich",
        "category": "afternoon",
        "neighborhood": "Recoleta",
        "costBRL": 0,
        "tip": "Antigo mercado de leilões de gado virou o shopping de luxo de Recoleta; arquitetura de 1867 preservada"
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
        "name": "Presidente Bar",
        "category": "night",
        "neighborhood": "Recoleta",
        "costBRL": 110,
        "tip": "Casarão de 1900 com coquetéis autorais — figura entre os melhores bares da América Latina"
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
        "name": "Reserva Ecológica Costanera Sur",
        "category": "morning",
        "neighborhood": "Puerto Madero",
        "costBRL": 0,
        "tip": "Trilhas planas à beira do Rio de la Plata, a 10 min de Puerto Madero; dá para alugar bicicleta na entrada · Fechada às segundas"
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
        "name": "Trade Sky Bar (Edifício Comega)",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 100,
        "tip": "Rooftop no 19º andar do Comega, vista para o rio e o Obelisco — melhor no entardecer"
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
        "name": "CasaSur Palermo",
        "zone": "Palermo",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Conforto contemporâneo a passos dos bosques"
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
      },
      {
        "name": "Ibis Buenos Aires Obelisco",
        "zone": "Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Ibis a 1 quadra do Obelisco e da Corrientes; metrô na porta, padrão previsível"
      },
      {
        "name": "Milhouse Hostel Avenue",
        "zone": "Centro",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 90-220",
        "tip": "O hostel-festa clássico de BA - social ao extremo"
      },
      {
        "name": "Mine Hotel",
        "zone": "Palermo Soho",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 450-800",
        "tip": "Boutique no coração do Soho - base perfeita de bares e feiras"
      },
      {
        "name": "Hotel Pulitzer",
        "zone": "Centro",
        "tier": "mid",
        "personaTags": [
          "family",
          "solo"
        ],
        "priceRangeBRL": "R$ 400-700",
        "tip": "Design com rooftop perto da Corrientes - teatro na porta"
      },
      {
        "name": "Sofitel Buenos Aires Recoleta",
        "zone": "Recoleta",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.200-2.200",
        "tip": "Francês-portenho na Recoleta, a pé da Av. Alvear e do cemitério"
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
        "name": "Alma (Casa San Agustín)",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 300,
        "tip": "Jantar no pátio de um hotel colonial do século XVII, à luz de velas; cozinha caribenha contemporânea, reserve"
      },
      {
        "name": "Alquímico",
        "category": "night",
        "neighborhood": "Centro Histórico",
        "costBRL": 90,
        "tip": "Três andares de bar numa casa colonial, entre os 50 melhores do mundo; o rooftop lota, chegue antes das 21h"
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
        "name": "La Boquilla: canoa pelos manguezais e praia de pescadores",
        "category": "afternoon",
        "neighborhood": "La Boquilla",
        "costBRL": 90,
        "tip": "Passeio de canoa conduzido por pescadores locais pelos túneis de mangue · Combine o passeio com almoço de peixe nas barracas da praia"
      },
      {
        "name": "Las Bóvedas (compras)",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 40,
        "tip": "As antigas masmorras viradas lojinhas de artesanato — souvenir com história e sombra"
      },
      {
        "name": "Café del Mar (pôr do sol na muralha)",
        "category": "night",
        "neighborhood": "Centro Histórico",
        "costBRL": 100,
        "tip": "Bar sobre o Baluarte de Santo Domingo com o pôr do sol no Caribe; chegue 1h antes para pegar mesa de frente"
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
        "name": "Caribe Plaza (shopping)",
        "category": "afternoon",
        "neighborhood": "Pie de la Popa",
        "costBRL": 0,
        "tip": "O maior shopping da cidade, a 10 min de Getsemaní; cinema, praça de alimentação e ar-condicionado"
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
        "name": "Praia de Castillogrande",
        "category": "afternoon",
        "neighborhood": "Castillogrande",
        "costBRL": 0,
        "tip": "Bairro residencial ao lado de Bocagrande: praia mais vazia e tranquila · Boa para o fim de tarde, sem estrutura de barracas"
      },
      {
        "name": "Celele",
        "category": "dinner",
        "neighborhood": "Getsemaní",
        "costBRL": 220,
        "tip": "O melhor restaurante do Caribe colombiano — cozinha de pesquisa da região · RESERVE com semanas; programa dos pais (babá ou noite especial)"
      },
      {
        "name": "Cerro de la Popa (convento e mirante)",
        "category": "afternoon",
        "neighborhood": "La Popa",
        "costBRL": 50,
        "tip": "O ponto mais alto da cidade, com convento do século XVII e vista de toda a baía; vá de táxi e combine a volta"
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
        "name": "Donde Fidel (salsa na Plaza de los Coches)",
        "category": "night",
        "neighborhood": "Centro Histórico",
        "costBRL": 40,
        "tip": "Bar minúsculo de salsa com mesas na praça e cerveja gelada; o ponto de encontro mais tradicional da cidade murada"
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
        "name": "Galería Cano (joias pré-colombianas)",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 0,
        "tip": "Réplicas certificadas de ouro pré-colombiano desde 1970, na Plaza de Bolívar; a lembrança com história"
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
        "name": "Passeio de lancha às Islas del Rosario",
        "category": "morning",
        "neighborhood": "Muelle de la Bodeguita",
        "costBRL": 320,
        "tip": "Reserve na véspera com operadora do cais, não com abordagem na rua · Snorkel e almoço geralmente inclusos; confirme o que está no preço"
      },
      {
        "name": "Jardín Botánico Guillermo Piñeres",
        "category": "morning",
        "neighborhood": "Turbaco",
        "costBRL": 40,
        "tip": "Floresta seca tropical com trilhas, macacos e preguiças a 30 min da cidade; o mais verde que Cartagena oferece"
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
        "name": "La Serrezuela (praça de touros virou shopping)",
        "category": "afternoon",
        "neighborhood": "San Diego",
        "costBRL": 0,
        "tip": "Antiga praça de touros de madeira restaurada como shopping de luxo com teatro e restaurantes; vale pela arquitetura"
      },
      {
        "name": "Las Bóvedas (artesanato nas muralhas)",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 0,
        "tip": "23 antigas celas da muralha viraram lojas de artesanato, mochilas wayuu e esmeraldas; compare preços entre elas"
      },
      {
        "name": "Lucy Jewelry (esmeraldas)",
        "category": "afternoon",
        "neighborhood": "Centro Histórico",
        "costBRL": 0,
        "tip": "Joalheria de esmeraldas colombianas com certificado, desde 1969; peça para ver as pedras ao microscópio antes de comprar"
      },
      {
        "name": "Mall Plaza El Castillo",
        "category": "afternoon",
        "neighborhood": "Pie del Cerro",
        "costBRL": 0,
        "tip": "Shopping grande ao pé do Castelo de San Felipe, com cinema e supermercado; útil para abastecer antes das ilhas"
      },
      {
        "name": "Praia de Manzanillo del Mar",
        "category": "morning",
        "neighborhood": "Zona Norte",
        "costBRL": 40,
        "tip": "Praia de areia escura e mar mais calmo a 20 min ao norte, com beach clubs de preço justo; alternativa a Barú sem barco"
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
        "name": "Parque del Centenario (preguiças)",
        "category": "afternoon",
        "neighborhood": "Getsemaní",
        "costBRL": 0,
        "tip": "Praça entre Getsemaní e a cidade murada onde vivem preguiças, macacos e iguanas soltos; olhe para cima"
      },
      {
        "name": "Pezetarian",
        "category": "dinner",
        "neighborhood": "Centro Histórico",
        "costBRL": 70,
        "tip": "Poke e peixe fresco descomplicado — jantar leve e rápido com crianças cansadas"
      },
      {
        "name": "Playa Blanca (Barú)",
        "category": "morning",
        "neighborhood": "Isla de Barú",
        "costBRL": 180,
        "tip": "Areia branca e mar turquesa, a praia mais bonita perto da cidade · Vá cedo e em dia de semana: lota e os vendedores são insistentes"
      },
      {
        "name": "Plaza Bocagrande (shopping)",
        "category": "afternoon",
        "neighborhood": "Bocagrande",
        "costBRL": 0,
        "tip": "O shopping moderno de Bocagrande, com ar-condicionado e vista para o mar — refúgio do calor com crianças"
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
        "name": "Quiebra-Canto (salsa)",
        "category": "night",
        "neighborhood": "Getsemaní",
        "costBRL": 60,
        "tip": "Bar de salsa de 1979 em frente ao Parque del Centenario; pista pequena, locais dançando — chegue depois das 23h"
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
        "name": "Beach club em Tierra Bomba",
        "category": "morning",
        "neighborhood": "Isla de Tierra Bomba",
        "costBRL": 160,
        "tip": "Lancha de 15–20 min saindo de Bocagrande ou do centro · Day pass costuma incluir cadeira, transporte e consumo mínimo"
      },
      {
        "name": "Passeio de barco ao pôr do sol na baía",
        "category": "afternoon",
        "neighborhood": "Marina",
        "costBRL": 150,
        "tip": "A cidade murada dourada vista do mar — o momento uau da viagem · Versões família saem mais cedo (17h); confirme colete infantil"
      },
      {
        "name": "Volcán del Totumo (banho de lama)",
        "category": "morning",
        "neighborhood": "Santa Catalina",
        "costBRL": 120,
        "tip": "Cratera de lama morna a 50 km, onde se flutua; meio dia com agência, leve roupa que possa manchar"
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
        "name": "Media Luna Hostel",
        "zone": "Getsemaní",
        "tier": "budget",
        "personaTags": [
          "solo",
          "budget"
        ],
        "priceRangeBRL": "R$ 120-300",
        "tip": "O hostel mais famoso de Getsemaní, com piscina e festa na quarta; quartos privativos existem, mas é barulhento"
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
        "name": "Blue Note Jazz Club",
        "category": "night",
        "neighborhood": "Greenwich Village",
        "costBRL": 350,
        "tip": "O clube de jazz mais famoso do mundo; dois shows por noite, reserve com semanas de antecedência"
      },
      {
        "name": "Musical da Broadway",
        "category": "night",
        "neighborhood": "Midtown",
        "costBRL": 450,
        "tip": "O Lion King e o Wicked são certeiros com crianças · TKTS em Times Square vende ingresso do dia com desconto"
      },
      {
        "name": "Bronx Zoo",
        "category": "morning",
        "neighborhood": "Bronx",
        "costBRL": 220,
        "tip": "Um dos maiores zoológicos do mundo, com gorilas, tigres e o monotrilho da Ásia; dia inteiro, metrô linha 2 ou 5"
      },
      {
        "name": "Brooklyn Botanic Garden",
        "category": "morning",
        "neighborhood": "Prospect Heights",
        "costBRL": 100,
        "tip": "Jardim japonês, roseiral e as cerejeiras de abril; ao lado do Brooklyn Museum, metrô Eastern Parkway"
      },
      {
        "name": "Brooklyn Bridge e Dumbo",
        "category": "morning",
        "neighborhood": "Brooklyn",
        "costBRL": 0,
        "tip": "Atravesse a pé do lado de Manhattan para o Brooklyn · Em Dumbo, a foto clássica é na Washington St"
      },
      {
        "name": "Brooklyn Bridge Park",
        "category": "afternoon",
        "neighborhood": "DUMBO",
        "costBRL": 0,
        "tip": "Orla sob a ponte com a vista clássica de Manhattan, carrossel de 1922 e gramados; atravesse a ponte a pé e termine aqui"
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
        "name": "Century 21 (Financial District)",
        "category": "afternoon",
        "neighborhood": "Financial District",
        "costBRL": 0,
        "tip": "A loja de grifes com desconto reaberta em 2023 em frente ao World Trade Center; garimpo, não vitrine"
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
        "name": "The Cloisters e Fort Tryon Park",
        "category": "morning",
        "neighborhood": "Washington Heights",
        "costBRL": 150,
        "tip": "Museu medieval do Met num claustro sobre o Hudson, dentro de um parque de jardins; metrô A até 190th St"
      },
      {
        "name": "The Dead Rabbit",
        "category": "night",
        "neighborhood": "Financial District",
        "costBRL": 120,
        "tip": "Pub irlandês eleito melhor bar do mundo; térreo informal, andar de cima com coquetéis — a 5 min do ferry"
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
        "name": "Employees Only",
        "category": "night",
        "neighborhood": "West Village",
        "costBRL": 140,
        "tip": "Speakeasy com placa de cartomante na porta; coquetéis clássicos e cozinha aberta até as 3h"
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
        "name": "FAO Schwarz",
        "category": "afternoon",
        "neighborhood": "Rockefeller Center",
        "costBRL": 0,
        "tip": "A loja de brinquedos do piano gigante do filme Quero Ser Grande, de volta no Rockefeller Center"
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
        "name": "Lombardi's Pizza (1905)",
        "category": "dinner",
        "neighborhood": "Little Italy",
        "costBRL": 120,
        "tip": "A primeira pizzaria dos Estados Unidos, forno a carvão; só pizza inteira, só dinheiro"
      },
      {
        "name": "Los Tacos No.1",
        "category": "lunch",
        "neighborhood": "Chelsea/Times Sq",
        "costBRL": 55,
        "tip": "Considerado o melhor taco de NY · Adobada (porco marinado) na tortilla feita na hora"
      },
      {
        "name": "Macy's Herald Square",
        "category": "afternoon",
        "neighborhood": "Midtown",
        "costBRL": 0,
        "tip": "A maior loja de departamentos do mundo, com escadas rolantes de madeira de 1902; turista tem 10% de desconto no balcão de visitantes"
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
        "name": "Please Don't Tell (PDT)",
        "category": "night",
        "neighborhood": "East Village",
        "costBRL": 130,
        "tip": "Entrada pela cabine telefônica da lanchonete Crif Dogs; reserva por telefone no mesmo dia, a partir das 15h"
      },
      {
        "name": "Peter Luger Steak House",
        "category": "dinner",
        "neighborhood": "Williamsburg (Brooklyn)",
        "costBRL": 380,
        "tip": "A steakhouse lendária de 1887 — porterhouse para dividir · Reserve com semanas e leve cartão de débito ou dinheiro"
      },
      {
        "name": "Prospect Park",
        "category": "afternoon",
        "neighborhood": "Park Slope",
        "costBRL": 0,
        "tip": "O Central Park do Brooklyn, dos mesmos arquitetos e com menos turistas; lago, gramado para piquenique e carrossel"
      },
      {
        "name": "Russ & Daughters (Lower East Side)",
        "category": "breakfast",
        "neighborhood": "Lower East Side",
        "costBRL": 90,
        "tip": "Loja de 1914 de salmão defumado e bagels; pegue senha, peça o bagel com lox e coma no Seward Park"
      },
      {
        "name": "Saks Fifth Avenue",
        "category": "afternoon",
        "neighborhood": "Midtown",
        "costBRL": 0,
        "tip": "A loja de departamentos da Quinta Avenida em frente ao Rockefeller Center; em dezembro, o show de luzes na fachada"
      },
      {
        "name": "Sarabeth's (Upper West Side)",
        "category": "breakfast",
        "neighborhood": "Upper West Side",
        "costBRL": 110,
        "tip": "O brunch clássico nova-iorquino, pancakes e ovos; chegue antes das 10h ou enfrente a fila, ao lado do Central Park"
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
        "name": "Smalls Jazz Club",
        "category": "night",
        "neighborhood": "West Village",
        "costBRL": 150,
        "tip": "Porão minúsculo com jam sessions até as 4h; ingresso na porta, chegue cedo para sentar"
      },
      {
        "name": "SoHo e Little Italy",
        "category": "afternoon",
        "neighborhood": "SoHo",
        "costBRL": 0,
        "tip": "Fachadas de ferro fundido e vitrines de grife · Little Italy e Chinatown ficam coladas — três mundos numa tarde"
      },
      {
        "name": "Strand Bookstore",
        "category": "afternoon",
        "neighborhood": "Union Square",
        "costBRL": 0,
        "tip": "29 km de estantes de livros novos e usados desde 1927; a sacola é o souvenir de quem lê"
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
      },
      {
        "name": "Via Carota (West Village)",
        "category": "dinner",
        "neighborhood": "West Village",
        "costBRL": 250,
        "tip": "Trattoria de esquina com a salada verde mais famosa de Nova York e cacio e pepe; sem reserva, fila a partir das 17h"
      },
      {
        "name": "Westlight (rooftop no Brooklyn)",
        "category": "night",
        "neighborhood": "Williamsburg",
        "costBRL": 130,
        "tip": "Rooftop no 22º andar do William Vale com a melhor vista de Manhattan do outro lado do rio; vá ao pôr do sol"
      },
      {
        "name": "Woodbury Common Premium Outlets",
        "category": "morning",
        "neighborhood": "Central Valley",
        "costBRL": 150,
        "tip": "O maior outlet da região, 1h de ônibus do Port Authority; 250 lojas, dia inteiro, vá de semana"
      },
      {
        "name": "Xi'an Famous Foods",
        "category": "lunch",
        "neighborhood": "Midtown",
        "costBRL": 70,
        "tip": "Macarrão feito à mão com cominho e cordeiro, de uma barraca de Flushing que virou rede; rápido, picante, barato"
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
        "name": "Arlo Midtown",
        "zone": "Midtown West",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 850-1.400",
        "tip": "Micro-quartos bem desenhados a passos da Times Square"
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
        "name": "citizenM Times Square",
        "zone": "Times Square",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Design compacto e rooftop — dormir no meio do show"
      },
      {
        "name": "Moxy Chelsea",
        "zone": "Chelsea",
        "tier": "mid",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Jovem, com rooftop-jardim e localização esperta"
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
      },
      {
        "name": "Pod 51",
        "zone": "Midtown East",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Cabines espertas pra quem só quer dormir e explorar"
      },
      {
        "name": "Pod Times Square",
        "zone": "Times Square",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Quartos minúsculos e bem desenhados a 5 min da Times Square; o budget possível em Manhattan"
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
        "name": "Cacau Show Megastore Gramado",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A maior loja da marca, com cafeteria, fonte de chocolate e espaço para crianças"
      },
      {
        "name": "Café Colonial Mirante (Canela)",
        "category": "breakfast",
        "neighborhood": "Canela",
        "costBRL": 90,
        "tip": "Mesa farta de café colonial com cucas, geleias e embutidos, com vista para o vale; vá com fome, substitui o almoço"
      },
      {
        "name": "Cantina Pastasciutta",
        "category": "lunch",
        "neighborhood": "Av. Borges de Medeiros",
        "costBRL": 120,
        "tip": "Massas caseiras de tradição italiana da serra · O galeto com massa é o combo colono"
      },
      {
        "name": "Caracol Chocolates",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Chocolateria de 1976 na Borges de Medeiros, da mesma família do parque; trufa e chocolate quente"
      },
      {
        "name": "Galeteria Casa di Paolo",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 130,
        "tip": "O galeto al primo canto da tradição italiana gaúcha · Sequência com massa, polenta e salada — rodízio de fartura"
      },
      {
        "name": "Casa da Velha Bruxa",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Loja-casa de bruxas e fadas com café, na Avenida Borges de Medeiros; crianças pedem para voltar"
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
        "name": "Dreamland Museu de Cera",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 120,
        "tip": "Museu de cera na Avenida das Hortênsias, aberto até as 22h — o programa noturno com crianças depois do jantar"
      },
      {
        "name": "Gasthof Edelweiss",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 150,
        "tip": "Cozinha alemã clássica — eisbein e marreco recheado · Chope artesanal da casa"
      },
      {
        "name": "Fábrica de Chocolate Florybal",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Visita à produção e loja com degustação; a marca do parque Terra Mágica, bom para emendar com as crianças"
      },
      {
        "name": "Fritz & Frida",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 120,
        "tip": "Bistrô de comida alemã descomplicada · As salsichas artesanais com chucrute são o carro-chefe"
      },
      {
        "name": "Hofbier (cervejaria)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 110,
        "tip": "Cervejaria de estilo alemão no centro, com chope próprio, joelho de porco e música ao vivo nos fins de semana"
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
        "name": "Natal Luz de Gramado",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 250,
        "tip": "De outubro a janeiro, os espetáculos do maior evento natalino do país; compre com antecedência, lota"
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
        "name": "Chocolate Planalto",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Chocolateria familiar desde 1985 na Avenida das Hortênsias, menos turística que as grandes; trufas e licor de chocolate"
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
        "name": "Battersea Park",
        "category": "afternoon",
        "neighborhood": "Battersea",
        "costBRL": 0,
        "tip": "Parque vitoriano à beira do Tâmisa com o Pagode da Paz e um pequeno zoológico infantil; combine com a usina Battersea restaurada"
      },
      {
        "name": "Bicester Village (outlet)",
        "category": "morning",
        "neighborhood": "Bicester",
        "costBRL": 120,
        "tip": "Outlet de grifes a 1h de trem de Marylebone, com estação própria; devolução de imposto não vale mais para turista, compare preços"
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
        "name": "Cahoots (bar anos 1940)",
        "category": "night",
        "neighborhood": "Soho",
        "costBRL": 110,
        "tip": "Bar temático numa estação de metrô dos anos 1940, com vagão, piano e coquetéis; reserve, lota"
      },
      {
        "name": "Camden Market",
        "category": "afternoon",
        "neighborhood": "Camden",
        "costBRL": 0,
        "tip": "O mercado alternativo à beira do canal · Street food do mundo inteiro nos pátios"
      },
      {
        "name": "The Churchill Arms (pub)",
        "category": "night",
        "neighborhood": "Kensington",
        "costBRL": 80,
        "tip": "O pub coberto de flores de Kensington, com comida tailandesa surpreendente nos fundos; a 10 min de Notting Hill"
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
        "name": "Dishoom (Covent Garden)",
        "category": "breakfast",
        "neighborhood": "Covent Garden",
        "costBRL": 80,
        "tip": "Café indiano de Bombaim com o bacon naan roll mais famoso de Londres; sem reserva no café da manhã, chegue antes das 9h"
      },
      {
        "name": "E Pellicci (1900)",
        "category": "breakfast",
        "neighborhood": "Bethnal Green",
        "costBRL": 50,
        "tip": "Caff italiano de 1900 com interior art déco tombado e o full English servido por três gerações da mesma família"
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
        "name": "Gordon's Wine Bar",
        "category": "night",
        "neighborhood": "Embankment",
        "costBRL": 90,
        "tip": "O bar de vinhos mais antigo de Londres (1890), num porão à luz de velas; queijos e vinho, sem reserva"
      },
      {
        "name": "Hamleys (Regent Street)",
        "category": "afternoon",
        "neighborhood": "Regent Street",
        "costBRL": 0,
        "tip": "Sete andares de brinquedos desde 1760, com demonstrações ao vivo em cada piso — para crianças é programa, não loja"
      },
      {
        "name": "Hampstead Heath",
        "category": "morning",
        "neighborhood": "Hampstead",
        "costBRL": 0,
        "tip": "Campo aberto e lagos de nado dentro da cidade; suba o Parliament Hill para a vista e desça para o café de Hampstead"
      },
      {
        "name": "Harrods",
        "category": "afternoon",
        "neighborhood": "Knightsbridge",
        "costBRL": 0,
        "tip": "A loja de departamentos mais famosa do mundo; o Food Hall vale a visita mesmo sem comprar nada"
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
        "name": "Jazz Cafe (Camden)",
        "category": "night",
        "neighborhood": "Camden Town",
        "costBRL": 180,
        "tip": "Shows de jazz, soul e funk todas as noites na casa mais tradicional de Camden; jantar na varanda com vista para o palco"
      },
      {
        "name": "Kew Gardens",
        "category": "morning",
        "neighborhood": "Kew",
        "costBRL": 170,
        "tip": "O jardim botânico real, Patrimônio da Humanidade, com a estufa vitoriana e a passarela nas copas; metrô Kew Gardens, meio dia"
      },
      {
        "name": "Liberty London",
        "category": "afternoon",
        "neighborhood": "Soho",
        "costBRL": 0,
        "tip": "Loja de 1875 num prédio Tudor de madeira, famosa pelas estampas florais e pelo departamento de tecidos"
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
        "name": "Nightjar",
        "category": "night",
        "neighborhood": "Shoreditch",
        "costBRL": 130,
        "tip": "Speakeasy com jazz ao vivo e coquetéis premiados em Old Street; reserva obrigatória"
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
        "name": "Regent's Park e Primrose Hill",
        "category": "afternoon",
        "neighborhood": "Camden",
        "costBRL": 0,
        "tip": "Roseiral de Queen Mary e, do outro lado da rua, a colina com a vista clássica do skyline ao pôr do sol"
      },
      {
        "name": "Richmond Park (cervos)",
        "category": "morning",
        "neighborhood": "Richmond",
        "costBRL": 0,
        "tip": "O maior parque real, com 600 cervos soltos e vista da catedral de St Paul a 16 km; alugue bicicleta no portão"
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
        "name": "Sky Garden (jardim no 35º andar)",
        "category": "night",
        "neighborhood": "City",
        "costBRL": 60,
        "tip": "Entrada gratuita com reserva pelo site (abre 3 semanas antes); bar com vista 360º — vá ao anoitecer"
      },
      {
        "name": "Old Spitalfields Market",
        "category": "morning",
        "neighborhood": "Shoreditch",
        "costBRL": 0,
        "tip": "Mercado vitoriano coberto com designers independentes, vintage e comida de rua; mais calmo que Camden"
      },
      {
        "name": "St James's Park (pelicanos)",
        "category": "afternoon",
        "neighborhood": "Westminster",
        "costBRL": 0,
        "tip": "O parque real entre o Palácio de Buckingham e Westminster, com pelicanos alimentados às 14h30; a ponte do lago tem a melhor vista"
      },
      {
        "name": "Tate Modern e Millennium Bridge",
        "category": "afternoon",
        "neighborhood": "Bankside",
        "costBRL": 0,
        "tip": "Arte moderna numa usina elétrica — gratuita · O mirante do 10º andar tem vista da St Pauls"
      },
      {
        "name": "The Barbary (Neal's Yard)",
        "category": "dinner",
        "neighborhood": "Covent Garden",
        "costBRL": 200,
        "tip": "Balcão em ferradura com cozinha do norte da África e do Levante em brasa; sem reserva, fila vale a pena"
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
        "name": "citizenM Bankside",
        "zone": "South Bank",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 900-1.400",
        "tip": "Design compacto atrás da Tate Modern"
      },
      {
        "name": "The Hoxton Holborn",
        "zone": "Holborn",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 1.100-1.800",
        "tip": "O boutique descolado com lobby que é point"
      },
      {
        "name": "Park Plaza Westminster Bridge",
        "zone": "Westminster",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.100-1.800",
        "tip": "De frente pro Big Ben com piscina — família no epicentro"
      },
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
        "name": "Rosewood London",
        "zone": "Holborn",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 4.000-7.000",
        "tip": "Palácio eduardiano de 1914 em Holborn, pátio de pedra e o Scarfes Bar; a 10 min a pé de Covent Garden"
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
      },
      {
        "name": "Strand Palace",
        "zone": "Strand",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.400",
        "tip": "Clássico central a pé do Covent Garden"
      },
      {
        "name": "Zedwell Piccadilly",
        "zone": "Piccadilly",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 600-950",
        "tip": "Casulos silenciosos no meio do caos do Piccadilly"
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
        "name": "Bar Cañete (Raval)",
        "category": "dinner",
        "neighborhood": "Raval",
        "costBRL": 180,
        "tip": "Balcão de tapas de alto nível atrás do Liceu, movimento até tarde; reserve ou chegue às 20h"
      },
      {
        "name": "Bar del Pla",
        "category": "lunch",
        "neighborhood": "El Born",
        "costBRL": 120,
        "tip": "Tapas catalãs com toque contemporâneo · A bomba (bolinho picante) é a estrela"
      },
      {
        "name": "Bar Marsella",
        "category": "night",
        "neighborhood": "Raval",
        "costBRL": 40,
        "tip": "Aberto em 1820, frequentado por Picasso e Hemingway; absinto e lustres empoeirados, só dinheiro"
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
        "name": "Boadas Cocktails",
        "category": "night",
        "neighborhood": "Raval",
        "costBRL": 70,
        "tip": "O bar de coquetéis mais antigo de Barcelona (1933), na esquina da Rambla; peça o daiquiri da casa"
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
        "name": "Casa Gispert (frutos secos desde 1851)",
        "category": "afternoon",
        "neighborhood": "El Born",
        "costBRL": 0,
        "tip": "Loja com forno a lenha de 1851 torrando amêndoas e avelãs no Born; o presente comestível de Barcelona"
      },
      {
        "name": "Praia de Castelldefels",
        "category": "morning",
        "neighborhood": "Castelldefels",
        "costBRL": 15,
        "tip": "5 km de areia larga a 20 min de trem (R2 a partir de Sants); a praia que os barceloneses escolhem no fim de semana"
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
        "name": "Parc de Collserola (trilhas do Tibidabo)",
        "category": "morning",
        "neighborhood": "Collserola",
        "costBRL": 0,
        "tip": "A serra atrás da cidade: trilhas a partir do Tibidabo ou da estação Baixador de Vallvidrera, com javalis e vista do mar"
      },
      {
        "name": "El Corte Inglés (Plaça de Catalunya)",
        "category": "afternoon",
        "neighborhood": "Eixample",
        "costBRL": 0,
        "tip": "A loja de departamentos espanhola; o último andar tem restaurante com vista para a praça e a cidade"
      },
      {
        "name": "Dr. Stravinsky",
        "category": "night",
        "neighborhood": "El Born",
        "costBRL": 90,
        "tip": "Coquetéis autorais com destilados da casa, entre os melhores da Europa; sem reserva, chegue antes das 21h"
      },
      {
        "name": "El Nacional",
        "category": "dinner",
        "neighborhood": "Passeig de Gràcia",
        "costBRL": 160,
        "tip": "Quatro restaurantes num salão modernista deslumbrante · Cada um do grupo escolhe seu balcão"
      },
      {
        "name": "Mercat dels Encants",
        "category": "morning",
        "neighborhood": "Glòries",
        "costBRL": 0,
        "tip": "Mercado de pulgas centenário sob um teto espelhado de design; segunda, quarta, sexta e sábado — leilão às 8h"
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
        "name": "Forn Mistral (ensaïmada)",
        "category": "breakfast",
        "neighborhood": "Sant Antoni",
        "costBRL": 30,
        "tip": "Padaria de 1879 na Ronda de Sant Antoni, a ensaïmada mais famosa da cidade; leve para comer na praça"
      },
      {
        "name": "Praia de Garraf",
        "category": "afternoon",
        "neighborhood": "Garraf",
        "costBRL": 20,
        "tip": "Enseada pequena com as casinhas verdes e brancas de banho dos anos 1920, 30 min de trem; estação na própria praia"
      },
      {
        "name": "Bairro Gótico e Catedral",
        "category": "morning",
        "neighborhood": "Ciutat Vella",
        "costBRL": 0,
        "tip": "Vielas medievais entre a Catedral e a Plaça Reial · A ponte do Bisbe é o cartão-postal escondido"
      },
      {
        "name": "L'illa Diagonal",
        "category": "afternoon",
        "neighborhood": "Les Corts",
        "costBRL": 0,
        "tip": "Shopping horizontal na Avinguda Diagonal, com marcas espanholas e mercado gourmet no subsolo"
      },
      {
        "name": "Jamboree Jazz Club",
        "category": "night",
        "neighborhood": "Barri Gòtic",
        "costBRL": 120,
        "tip": "Jazz no porão da Plaça Reial desde 1960; dois shows por noite, depois vira pista"
      },
      {
        "name": "Jardins de Mossèn Costa i Llobera (Montjuïc)",
        "category": "afternoon",
        "neighborhood": "Montjuïc",
        "costBRL": 0,
        "tip": "Jardim de cactos na encosta de Montjuïc sobre o porto; ao lado do teleférico, melhor na luz do fim de tarde"
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
        "name": "La Roca Village (outlet)",
        "category": "morning",
        "neighborhood": "La Roca del Vallès",
        "costBRL": 60,
        "tip": "Outlet de grifes a 40 min, com ônibus direto da Plaça de Catalunya; meio dia"
      },
      {
        "name": "Praia de Mar Bella",
        "category": "afternoon",
        "neighborhood": "Poblenou",
        "costBRL": 0,
        "tip": "Praia jovem de Poblenou, com escola de vela e trecho naturista sinalizado; metrô Poblenou, menos turistas"
      },
      {
        "name": "Maremagnum",
        "category": "afternoon",
        "neighborhood": "Port Vell",
        "costBRL": 0,
        "tip": "Shopping sobre a água no porto velho, aberto aos domingos (raro em Barcelona); ao lado do aquário"
      },
      {
        "name": "Praia de Nova Icària",
        "category": "morning",
        "neighborhood": "Vila Olímpica",
        "costBRL": 0,
        "tip": "A praia mais tranquila e familiar da cidade, ao lado do Porto Olímpico; chiringuitos e quadras de vôlei"
      },
      {
        "name": "Praia de Ocata (El Masnou)",
        "category": "morning",
        "neighborhood": "El Masnou",
        "costBRL": 15,
        "tip": "Areia fina e água limpa a 25 min de trem para o norte (R1); a estação fica a 1 min da areia"
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
        "name": "Jardins do Palau de Pedralbes",
        "category": "afternoon",
        "neighborhood": "Pedralbes",
        "costBRL": 0,
        "tip": "Jardim de palácio com fonte de Gaudí e bambuzal, quase sem turistas; combine com o Mosteiro de Pedralbes"
      },
      {
        "name": "La Pedrera à noite (Night Experience)",
        "category": "night",
        "neighborhood": "Eixample",
        "costBRL": 180,
        "tip": "Visita noturna ao terraço de Gaudí com projeções sobre as chaminés e taça de cava; reserve, sessões limitadas"
      },
      {
        "name": "Els Quatre Gats",
        "category": "dinner",
        "neighborhood": "Gòtic",
        "costBRL": 160,
        "tip": "O café modernista onde Picasso fez a primeira exposição · Mais pela história e pelo salão que pela cozinha"
      },
      {
        "name": "Razzmatazz",
        "category": "night",
        "neighborhood": "Poblenou",
        "costBRL": 130,
        "tip": "Cinco pistas num galpão industrial — o clube mais famoso da cidade; abre à 1h, metrô Bogatell"
      },
      {
        "name": "Sagrada Família",
        "category": "morning",
        "neighborhood": "Eixample",
        "costBRL": 150,
        "tip": "A obra-prima inacabada de Gaudí — ingresso SÓ online com horário · A luz dos vitrais pela manhã é um espetáculo à parte"
      },
      {
        "name": "Sala Apolo",
        "category": "night",
        "neighborhood": "Poble-sec",
        "costBRL": 120,
        "tip": "Teatro de 1943 virou a casa de shows e festas mais querida da cidade; a Nasty Mondays das segundas é instituição"
      },
      {
        "name": "Satan's Coffee Corner (Gòtic)",
        "category": "breakfast",
        "neighborhood": "Gòtic",
        "costBRL": 50,
        "tip": "Café de especialidade com brunch japonês-catalão numa viela do Gòtic; sem wi-fi de propósito"
      },
      {
        "name": "Bate-volta a Sitges",
        "category": "morning",
        "neighborhood": "Sitges",
        "costBRL": 30,
        "tip": "Vila de praia com casario branco, 17 praias e calçadão, 40 min de trem; dia inteiro com almoço de frente para o mar"
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
        "name": "Hotel Jazz",
        "zone": "Eixample",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Piscina no terraço e Plaça Catalunya a 3 quadras"
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
        "name": "H10 Casa Mimosa",
        "zone": "Eixample",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.200-2.000",
        "tip": "Ao lado da Pedrera com jardim e rooftop — refúgio no centro"
      },
      {
        "name": "Motel One Barcelona-Ciutadella",
        "zone": "Born",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Rede alemã impecável na porta do parque"
      },
      {
        "name": "Praktik Bakery",
        "zone": "Eixample",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "O hotel com padaria de verdade no lobby — acorde com cheiro de croissant"
      },
      {
        "name": "TOC Hostel Barcelona",
        "zone": "Eixample",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 120-280",
        "tip": "Hostel-design com piscina — mochileiro com estilo"
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
      },
      {
        "name": "Barramares (axé pé na areia)",
        "category": "night",
        "neighborhood": "Taperapuã",
        "costBRL": 80,
        "tip": "A maior barraca da Praia de Taperapuã, com show de axé e lambaeróbica à noite; a alternativa ao Tôa Tôa"
      },
      {
        "name": "Beco das Cores (Arraial d'Ajuda)",
        "category": "afternoon",
        "neighborhood": "Arraial d Ajuda",
        "costBRL": 0,
        "tip": "Viela de lojas coloridas de moda praia, biojoias e artesanato no centro de Arraial; combine com a Rua do Mucugê à noite"
      },
      {
        "name": "Café Cultura (Trancoso)",
        "category": "breakfast",
        "neighborhood": "Trancoso",
        "costBRL": 45,
        "tip": "Café da manhã e lanches em Trancoso: tapiocas, pães artesanais e café especial antes do Quadrado"
      },
      {
        "name": "Falésias de Taípe (Arraial d'Ajuda)",
        "category": "afternoon",
        "neighborhood": "Arraial d'Ajuda",
        "costBRL": 0,
        "tip": "Paredão de falésias coloridas de 50 m sobre a praia deserta de Taípe; caminhe a partir de Pitinga na maré baixa"
      },
      {
        "name": "Feirinha da Coroa Vermelha (artesanato indígena)",
        "category": "afternoon",
        "neighborhood": "Santa Cruz Cabrália",
        "costBRL": 0,
        "tip": "Barracas de artesanato pataxó na praia onde foi rezada a primeira missa, 20 min ao norte; colares de semente, cocares, cerâmica"
      },
      {
        "name": "Natural Trancoso (café no Quadrado)",
        "category": "breakfast",
        "neighborhood": "Trancoso",
        "costBRL": 50,
        "tip": "Café de frutas, tapioca e pão de queijo numa casinha do Quadrado; o lugar de começar o dia em Trancoso"
      },
      {
        "name": "Praia dos Nativos (Trancoso)",
        "category": "morning",
        "neighborhood": "Trancoso",
        "costBRL": 0,
        "tip": "A praia do Quadrado, com a foz do rio Trancoso, coqueiral e barracas simples; desça pela trilha da igreja ao amanhecer"
      },
      {
        "name": "Santo Café (Trancoso)",
        "category": "breakfast",
        "neighborhood": "Trancoso",
        "costBRL": 40,
        "tip": "Cafeteria de Trancoso com café especial e bolos; o começo de dia calmo antes da praia"
      },
      {
        "name": "Silvana & Cia (Trancoso)",
        "category": "dinner",
        "neighborhood": "Trancoso",
        "costBRL": 180,
        "tip": "Moqueca baiana e peixe fresco numa casa do Quadrado, mesas no jardim; a tradicional de Trancoso"
      }
    ],
    "hotels": [
      {
        "name": "Pousada Alto da Pitinga",
        "zone": "Arraial d Ajuda",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 350-600",
        "tip": "Pousada com clima de vila perto do Mucugê"
      },
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
        "name": "Maitei Hotel",
        "zone": "Arraial d Ajuda",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.400",
        "tip": "Vista dos mirantes de Arraial - adults-friendly romântico"
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
      },
      {
        "name": "Villas de Trancoso",
        "zone": "Trancoso",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.500-2.800",
        "tip": "Pé na areia charmoso a caminhada do Quadrado"
      },
      {
        "name": "Pousada Capim Santo",
        "zone": "Trancoso",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.300",
        "tip": "Pousada no Quadrado com o restaurante do mesmo nome e piscina no jardim; café da manhã que vira almoço"
      },
      {
        "name": "Pousada Erva Doce",
        "zone": "Arraial d Ajuda",
        "tier": "budget",
        "personaTags": [
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-450",
        "tip": "Pousada de jardim na Estrada do Mucugê, a 10 min a pé das praias; café da manhã farto, dona presente"
      },
      {
        "name": "Pousada Quarto Crescente",
        "zone": "Trancoso",
        "tier": "budget",
        "personaTags": [
          "couple",
          "solo",
          "budget"
        ],
        "priceRangeBRL": "R$ 300-550",
        "tip": "Pousada de 1990 a 300 m do Quadrado, piscina pequena e preço honesto para Trancoso"
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
        "name": "Al Mallah (shawarma de Satwa)",
        "category": "lunch",
        "neighborhood": "Satwa",
        "costBRL": 40,
        "tip": "Shawarma e suco de frutas na calçada de Satwa desde 1979; o almoço de 15 minutos que os locais fazem"
      },
      {
        "name": "Al Mamzar Beach Park",
        "category": "morning",
        "neighborhood": "Al Mamzar",
        "costBRL": 10,
        "tip": "Parque de praia em Deira com cinco enseadas, piscinas e churrasqueiras; o mais familiar e mais barato da cidade"
      },
      {
        "name": "Al Qudra Lakes (Love Lake)",
        "category": "afternoon",
        "neighborhood": "Al Qudra",
        "costBRL": 60,
        "tip": "Lagos artificiais no deserto a 45 min, com pôr do sol, bicicleta e piquenique; vá de carro, leve água e lanterna"
      },
      {
        "name": "Arrows & Sparrows",
        "category": "breakfast",
        "neighborhood": "The Greens",
        "costBRL": 70,
        "tip": "Brunch de bairro em The Greens, ovos e pães de fermentação natural; o café da manhã dos moradores, longe dos hotéis"
      },
      {
        "name": "Atmosphere (lounge no 122º andar do Burj Khalifa)",
        "category": "night",
        "neighborhood": "Downtown",
        "costBRL": 250,
        "tip": "Chá da tarde ou coquetel no andar 122 — sai mais barato que o deck de observação e tem mesa; reserve e vá de roupa elegante"
      },
      {
        "name": "Bait Maryam (cozinha levantina caseira)",
        "category": "dinner",
        "neighborhood": "JLT",
        "costBRL": 150,
        "tip": "Restaurante de família com Bib Gourmand, pratos da mãe palestina-jordaniana da dona; sem álcool, reserve"
      },
      {
        "name": "Bla Bla Dubai (JBR)",
        "category": "night",
        "neighborhood": "JBR",
        "costBRL": 150,
        "tip": "20 bares num complexo só na praia de JBR, de pub a beach club; comece pelo terraço ao entardecer"
      },
      {
        "name": "Black Palace Beach",
        "category": "afternoon",
        "neighborhood": "Al Sufouh",
        "costBRL": 0,
        "tip": "Praia escondida entre palácios, sem estrutura e sem multidão, com a Palm ao fundo; leve tudo"
      },
      {
        "name": "Boston Lane (Al Quoz)",
        "category": "breakfast",
        "neighborhood": "Al Quoz",
        "costBRL": 70,
        "tip": "Café australiano num galpão de Al Quoz, entre galerias de arte; combine com a Alserkal Avenue"
      },
      {
        "name": "CÉ LA VI Dubai (rooftop do Address Sky View)",
        "category": "night",
        "neighborhood": "Downtown",
        "costBRL": 200,
        "tip": "Piscina infinita e bar no 54º andar de frente para o Burj Khalifa; reserve o pôr do sol"
      },
      {
        "name": "Dubai Creek Park",
        "category": "afternoon",
        "neighborhood": "Bur Dubai",
        "costBRL": 10,
        "tip": "Parque antigo à beira do Creek com teleférico, Children's City e vista dos barcos de madeira; entrada simbólica"
      },
      {
        "name": "Dragon Mart",
        "category": "afternoon",
        "neighborhood": "International City",
        "costBRL": 0,
        "tip": "O maior centro de produtos chineses fora da China, em forma de dragão; eletrônicos, decoração e preços de atacado"
      },
      {
        "name": "Ibn Battuta Mall",
        "category": "afternoon",
        "neighborhood": "Jebel Ali",
        "costBRL": 0,
        "tip": "Shopping temático com seis cortes (China, Índia, Pérsia, Egito…) seguindo a viagem do explorador; metrô Ibn Battuta"
      },
      {
        "name": "Bate-volta a Jebel Jais (tirolesa mais longa do mundo)",
        "category": "morning",
        "neighborhood": "Ras Al Khaimah",
        "costBRL": 300,
        "tip": "A montanha mais alta dos Emirados, a 2h de Dubai: estrada de curvas, mirantes e a tirolesa de 2,8 km; reserve a tirolesa com antecedência"
      },
      {
        "name": "Jumeirah Public Beach (vista do Burj Al Arab)",
        "category": "morning",
        "neighborhood": "Umm Suqeim",
        "costBRL": 0,
        "tip": "A praia pública com o Burj Al Arab de cenário; calçadão, chuveiros e cafés — vá cedo pelo calor"
      },
      {
        "name": "La Perle by Dragone (show aquático)",
        "category": "night",
        "neighborhood": "Al Habtoor City",
        "costBRL": 450,
        "tip": "Espetáculo de acrobacia com palco que vira piscina, do criador do O do Cirque du Soleil; cabe criança, reserve"
      },
      {
        "name": "Lock, Stock & Barrel (JBR)",
        "category": "night",
        "neighborhood": "JBR",
        "costBRL": 150,
        "tip": "Pub-rock em dois andares com banda ao vivo todas as noites e happy hour longo; o mais despretensioso de JBR"
      },
      {
        "name": "Mall of the Emirates (Ski Dubai)",
        "category": "afternoon",
        "neighborhood": "Al Barsha",
        "costBRL": 0,
        "tip": "Shopping com pista de esqui indoor e pinguins; metrô Mall of the Emirates, bom para a hora mais quente"
      },
      {
        "name": "Mushrif Park",
        "category": "morning",
        "neighborhood": "Mushrif",
        "costBRL": 5,
        "tip": "Floresta de árvores ghaf com trilhas de bicicleta, piscinas e uma aldeia de casas em miniatura do mundo; o parque dos emiradenses"
      },
      {
        "name": "Dubai Outlet Mall",
        "category": "afternoon",
        "neighborhood": "Dubailand",
        "costBRL": 0,
        "tip": "Outlet de grifes a 20 min do Downtown, com descontos de verdade fora da temporada de liquidação; vá de táxi"
      },
      {
        "name": "Palm West Beach (Palm Jumeirah)",
        "category": "afternoon",
        "neighborhood": "Palm Jumeirah",
        "costBRL": 0,
        "tip": "Orla de 1,6 km na Palm com restaurantes de pé na areia e o skyline da Marina em frente; melhor no fim de tarde"
      },
      {
        "name": "Dubai Safari Park",
        "category": "morning",
        "neighborhood": "Al Warqa",
        "costBRL": 80,
        "tip": "Zoológico moderno com safári de ônibus entre leões e girafas; fecha no verão (junho a setembro)"
      },
      {
        "name": "Zuma Dubai",
        "category": "dinner",
        "neighborhood": "DIFC",
        "costBRL": 450,
        "tip": "Izakaya contemporâneo no DIFC, o jantar de celebração da cidade; robata e sushi, reserve com dias"
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
        "name": "Anantara The Palm",
        "zone": "Palm Jumeirah",
        "tier": "resort",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.000",
        "tip": "Vilas sobre a água estilo Maldivas — lua de mel na Palm"
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
        "name": "Manzil Downtown",
        "zone": "Downtown",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Hotel boutique de arquitetura árabe a 10 min a pé do Dubai Mall e do Burj Khalifa; piscina no pátio"
      },
      {
        "name": "Palace Downtown",
        "zone": "Downtown",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "Palácio árabe à beira do lago da Dubai Fountain, com vista do show das fontes do quarto; a 5 min do Dubai Mall"
      },
      {
        "name": "Premier Inn Ibn Battuta",
        "zone": "Jebel Ali",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "Base econômica no metrô — família com orçamento curto"
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
      },
      {
        "name": "Vida Downtown",
        "zone": "Downtown",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Boutique descolado a pé do Dubai Mall"
      }
    ]
  },
  "Cidade do Cabo": {
    "city": "Cidade do Cabo",
    "items": [
      {
        "name": "Asoka (Kloof Street)",
        "category": "night",
        "neighborhood": "Gardens",
        "costBRL": 100,
        "tip": "Bar-lounge numa casa de 1860 com oliveira no pátio e jazz ao vivo às terças; cozinha asiática, reserve"
      },
      {
        "name": "The Athletic Club & Social",
        "category": "night",
        "neighborhood": "City Bowl",
        "costBRL": 110,
        "tip": "Bar de coquetéis em três andares de um clube de boxe dos anos 1920, na Buitengracht; reserve o rooftop"
      },
      {
        "name": "Bay Harbour Market (Hout Bay)",
        "category": "afternoon",
        "neighborhood": "Hout Bay",
        "costBRL": 0,
        "tip": "Mercado coberto de artesanato, comida e música ao vivo no porto de Hout Bay, sexta à noite e fins de semana"
      },
      {
        "name": "Bloubergstrand (a vista da Table Mountain)",
        "category": "morning",
        "neighborhood": "Bloubergstrand",
        "costBRL": 0,
        "tip": "A praia do cartão-postal: Table Mountain inteira do outro lado da baía; kitesurf à tarde, 25 min do centro"
      },
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
        "name": "Canal Walk",
        "category": "afternoon",
        "neighborhood": "Century City",
        "costBRL": 0,
        "tip": "O maior shopping da África Austral, com 500 lojas e cinema; a 15 min do centro, bom para dia de chuva ou vento"
      },
      {
        "name": "Cabo da Boa Esperança e Cape Point",
        "category": "morning",
        "neighborhood": "Cape Peninsula",
        "costBRL": 120,
        "tip": "Emende com Boulders e Chapman's Peak num dia de península — alugue carro ou tour · Atenção aos babuínos: nada de comida à vista"
      },
      {
        "name": "Cavendish Square",
        "category": "afternoon",
        "neighborhood": "Claremont",
        "costBRL": 0,
        "tip": "Shopping dos bairros do sul, ao lado da estação Claremont; combine com Kirstenbosch ou Constantia"
      },
      {
        "name": "Chapman's Peak Drive (mirante)",
        "category": "afternoon",
        "neighborhood": "Hout Bay",
        "costBRL": 60,
        "tip": "9 km de estrada esculpida no penhasco entre Hout Bay e Noordhoek, com mirantes para parar; pedágio, melhor no fim da tarde"
      },
      {
        "name": "Clarke's Bar & Dining",
        "category": "lunch",
        "neighborhood": "Bree Street",
        "costBRL": 90,
        "tip": "O diner descolado da rua mais cool do centro · Burgers e sanduíches caprichados"
      },
      {
        "name": "Clifton 4th Beach",
        "category": "afternoon",
        "neighborhood": "Clifton",
        "costBRL": 0,
        "tip": "Quatro enseadas de areia branca protegidas do vento; a 4ª é a mais tranquila e familiar — água gelada, sol forte"
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
        "name": "The Crypt Jazz Restaurant",
        "category": "night",
        "neighborhood": "City Bowl",
        "costBRL": 150,
        "tip": "Jazz ao vivo na cripta da Catedral de St George, com jantar; reserve, lota aos fins de semana"
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
        "name": "Praia de Fish Hoek",
        "category": "morning",
        "neighborhood": "Fish Hoek",
        "costBRL": 0,
        "tip": "Baía abrigada de água mais quente (False Bay) e rede contra tubarões; a praia mais segura para crianças, trem da linha sul"
      },
      {
        "name": "The Gin Bar",
        "category": "night",
        "neighborhood": "City Bowl",
        "costBRL": 90,
        "tip": "Pátio escondido atrás de uma chocolateria na Wale Street, só gins sul-africanos; sem reserva"
      },
      {
        "name": "GOLD Restaurant",
        "category": "dinner",
        "neighborhood": "Green Point",
        "costBRL": 280,
        "tip": "Jantar-experiência pan-africano de 14 pratos com tambores e dança · Aula de djembe antes do jantar — as crianças participam"
      },
      {
        "name": "Greenmarket Square (feira de artesanato)",
        "category": "morning",
        "neighborhood": "City Bowl",
        "costBRL": 0,
        "tip": "Feira de artesanato africano numa praça de 1696 no centro; máscaras, tecidos e miçangas, negocie com calma"
      },
      {
        "name": "Harbour House (Kalk Bay)",
        "category": "lunch",
        "neighborhood": "Kalk Bay",
        "costBRL": 180,
        "tip": "Frutos do mar com as ondas quebrando na janela · Versão elegante do almoço no porto"
      },
      {
        "name": "Harringtons Cocktail Lounge",
        "category": "night",
        "neighborhood": "City Bowl",
        "costBRL": 90,
        "tip": "Coquetelaria num casarão da Harrington Street, no bairro que virou polo de bares do centro"
      },
      {
        "name": "Praia de Hout Bay",
        "category": "afternoon",
        "neighborhood": "Hout Bay",
        "costBRL": 0,
        "tip": "Praia larga na baía das focas, com o Sentinel ao fundo e o porto de pescadores ao lado; combine com o mercado de fim de semana"
      },
      {
        "name": "Hout Bay e barco à ilha das focas",
        "category": "morning",
        "neighborhood": "Hout Bay",
        "costBRL": 120,
        "tip": "Barco de 40 min até Duiker Island, com centenas de focas; o mercado de fim de semana no porto vale o almoço"
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
        "name": "Kleinsky's Delicatessen (bagels)",
        "category": "breakfast",
        "neighborhood": "Sea Point",
        "costBRL": 60,
        "tip": "Deli judaica de Sea Point com bagels, salmão e latkes; combine com a caminhada na promenade"
      },
      {
        "name": "Kloof Street House",
        "category": "dinner",
        "neighborhood": "Gardens",
        "costBRL": 210,
        "tip": "Casarão vitoriano de jardins iluminados por luzinhas · Clima de festa elegante no jantar"
      },
      {
        "name": "Trilha do Lion's Head",
        "category": "morning",
        "neighborhood": "Signal Hill",
        "costBRL": 0,
        "tip": "Subida em espiral de 1h30 com escadas e correntes no trecho final; vista de 360º — vá ao nascer do sol ou em noite de lua cheia com lanterna"
      },
      {
        "name": "Praia de Llandudno",
        "category": "afternoon",
        "neighborhood": "Llandudno",
        "costBRL": 0,
        "tip": "Enseada de pedras de granito e areia branca entre Camps Bay e Hout Bay, sem comércio; vá de carro, estaciona cedo"
      },
      {
        "name": "Mama Africa",
        "category": "dinner",
        "neighborhood": "Long Street",
        "costBRL": 160,
        "tip": "Carnes de caça (springbok, kudu) com marimba ao vivo · Turístico e divertido na medida"
      },
      {
        "name": "Marco's African Place (Bo-Kaap)",
        "category": "dinner",
        "neighborhood": "Bo-Kaap",
        "costBRL": 150,
        "tip": "Jantar africano com música ao vivo e dança desde 1997; peça o prato de carnes de caça para dividir"
      },
      {
        "name": "Mariam's Kitchen (Cape Malay)",
        "category": "lunch",
        "neighborhood": "City Bowl",
        "costBRL": 60,
        "tip": "Curries e samosas da cozinha Cape Malay, almoço de balcão no centro; o sabor do Bo-Kaap no prato"
      },
      {
        "name": "Praia de Muizenberg (cabines coloridas)",
        "category": "morning",
        "neighborhood": "Muizenberg",
        "costBRL": 40,
        "tip": "A praia das cabines coloridas e das escolas de surf para iniciantes; trem da linha sul a partir da estação central, 40 min"
      },
      {
        "name": "Noordhoek (Long Beach)",
        "category": "afternoon",
        "neighborhood": "Noordhoek",
        "costBRL": 0,
        "tip": "8 km de areia branca quase vazia no fim do Chapman's Peak, com cavalgada e naufrágio; vento forte, leve casaco"
      },
      {
        "name": "Ocean Basket (Waterfront)",
        "category": "lunch",
        "neighborhood": "Waterfront",
        "costBRL": 100,
        "tip": "A rede sul-africana de frutos do mar que agrada família inteira · Combinados fartos de camarão e calamares"
      },
      {
        "name": "Old Biscuit Mill (mercado de sábado)",
        "category": "morning",
        "neighborhood": "Woodstock",
        "costBRL": 40,
        "tip": "Antiga fábrica de biscoitos com o Neighbourgoods Market aos sábados: comida, design e música; lota, chegue às 9h"
      },
      {
        "name": "Origin Coffee Roasting (De Waterkant)",
        "category": "breakfast",
        "neighborhood": "De Waterkant",
        "costBRL": 50,
        "tip": "A torrefação que começou o café de especialidade na cidade, em De Waterkant; brunch e cursos de barista"
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
        "name": "Publik Wine Bar",
        "category": "night",
        "neighborhood": "Gardens",
        "costBRL": 90,
        "tip": "Bar de vinhos naturais de pequenos produtores do Cabo, na Kloof Street; bom antes do jantar"
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
        "name": "Tjing Tjing Rooftop Bar",
        "category": "night",
        "neighborhood": "City Bowl",
        "costBRL": 110,
        "tip": "Rooftop de inspiração japonesa num prédio de 1800 na Longmarket Street; coquetéis e vista para a Table Mountain"
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
        "name": "Watershed (V&A Waterfront)",
        "category": "afternoon",
        "neighborhood": "V&A Waterfront",
        "costBRL": 0,
        "tip": "Galpão com 150 estandes de design e artesanato sul-africano dentro do Waterfront; o melhor souvenir sem regateio"
      },
      {
        "name": "Yours Truly (Kloof Street)",
        "category": "night",
        "neighborhood": "Gardens",
        "costBRL": 80,
        "tip": "Bar-café de esquina na Kloof Street com DJs, pizza e a turma jovem da cidade; comece a noite aqui"
      },
      {
        "name": "Zeitz MOCAA",
        "category": "afternoon",
        "neighborhood": "Waterfront",
        "costBRL": 120,
        "tip": "O maior museu de arte contemporânea africana, num silo de grãos esculpido · A arquitetura do átrio já vale o ingresso"
      }
    ],
    "hotels": [
      {
        "name": "Cape Town Lodge Hotel",
        "zone": "CBD",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "Central e sem frescura, a pé do Company Garden"
      },
      {
        "name": "Protea Hotel Fire & Ice! Cape Town",
        "zone": "CBD",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "Descolado, com milkshakes famosos e Long Street a duas quadras"
      },
      {
        "name": "Belmond Mount Nelson Hotel",
        "zone": "Gardens",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-5.000",
        "tip": "O hotel rosa de 1899 com jardins e o chá da tarde mais famoso da cidade"
      },
      {
        "name": "Once in Cape Town",
        "zone": "Gardens",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 150-350",
        "tip": "Hostel-boutique no sopé da Table Mountain, Kloof Street na porta"
      },
      {
        "name": "One&Only Cape Town",
        "zone": "V&A Waterfront",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 3.000-6.000",
        "tip": "Ilha privada no Waterfront com a Table Mountain emoldurada"
      },
      {
        "name": "Protea Hotel by Marriott Cape Town Sea Point",
        "zone": "Sea Point",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 350-550",
        "tip": "Calçadão de Sea Point e pôr do sol do Atlântico pela janela"
      },
      {
        "name": "Radisson RED Hotel V&A Waterfront",
        "zone": "V&A Waterfront",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 650-1.000",
        "tip": "Rooftop com piscina sobre o Waterfront — jovem e bem localizado"
      },
      {
        "name": "The Silo Hotel",
        "zone": "V&A Waterfront",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 4.000-8.000",
        "tip": "Janelas de vidro facetado sobre o museu Zeitz MOCAA — ícone de design"
      },
      {
        "name": "The Winchester Hotel",
        "zone": "Sea Point",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 600-950",
        "tip": "Clássico de frente para o mar com pátio de jazz aos domingos"
      }
    ]
  },
  "Istambul": {
    "city": "Istambul",
    "items": [
      {
        "name": "16 Roof (Swissôtel)",
        "category": "night",
        "neighborhood": "Beşiktaş",
        "costBRL": 130,
        "tip": "Rooftop sobre o Bósforo com a ponte iluminada; coquetéis caros, mas a vista é a melhor da margem europeia"
      },
      {
        "name": "360 Istanbul",
        "category": "dinner",
        "neighborhood": "Istiklal (rooftop)",
        "costBRL": 220,
        "tip": "Rooftop panorâmico no topo de um prédio histórico da Istiklal · Jantar vira balada tarde da noite"
      },
      {
        "name": "Istanbul Akvaryum",
        "category": "morning",
        "neighborhood": "Florya",
        "costBRL": 180,
        "tip": "Um dos maiores aquários temáticos da Europa, com túnel e percurso do Mar Negro ao Pacífico; Marmaray até Florya"
      },
      {
        "name": "Arasta Bazaar",
        "category": "afternoon",
        "neighborhood": "Sultanahmet",
        "costBRL": 0,
        "tip": "Bazar pequeno e tranquilo atrás da Mesquita Azul, com tapetes, cerâmica de İznik e preços sem o assédio do Grand Bazaar"
      },
      {
        "name": "Asitane",
        "category": "dinner",
        "neighborhood": "Edirnekapı",
        "costBRL": 210,
        "tip": "Receitas dos banquetes dos palácios otomanos, pesquisadas em arquivos · Jantar-viagem-no-tempo ao lado da igreja de Chora"
      },
      {
        "name": "Babylon (Bomontiada)",
        "category": "night",
        "neighborhood": "Bomonti",
        "costBRL": 120,
        "tip": "A principal casa de shows da cidade, numa antiga cervejaria convertida em complexo cultural; confira a agenda"
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
        "name": "Floresta de Belgrado",
        "category": "morning",
        "neighborhood": "Sarıyer",
        "costBRL": 0,
        "tip": "Floresta de 5.000 hectares com aquedutos otomanos e trilhas de corrida a 40 min do centro; o pulmão da cidade"
      },
      {
        "name": "Cruzeiro pelo Bósforo",
        "category": "afternoon",
        "neighborhood": "Eminönü/Kabataş",
        "costBRL": 110,
        "tip": "Europa de um lado, Ásia do outro — palácios e fortalezas da água · O ferry público faz o trajeto por muito menos que os turísticos"
      },
      {
        "name": "Colina de Çamlıca",
        "category": "afternoon",
        "neighborhood": "Üsküdar",
        "costBRL": 20,
        "tip": "O ponto mais alto do lado asiático, com a cidade e o Bósforo inteiros aos pés; chá no café do alto ao pôr do sol"
      },
      {
        "name": "Çınaraltı (kahvaltı sob o plátano, Çengelköy)",
        "category": "breakfast",
        "neighborhood": "Çengelköy",
        "costBRL": 70,
        "tip": "Café da manhã turco à beira do Bósforo sob um plátano de 800 anos, no lado asiático; vá de balsa e fique a manhã"
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
        "name": "Çiya Kebap (Kadıköy)",
        "category": "dinner",
        "neighborhood": "Kadıköy",
        "costBRL": 110,
        "tip": "A casa de kebabs do mesmo dono do Çiya Sofrası, do outro lado da rua; a noite no mercado de Kadıköy, volte de balsa"
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
        "name": "Parque Emirgan",
        "category": "morning",
        "neighborhood": "Sarıyer",
        "costBRL": 0,
        "tip": "O parque das tulipas na margem europeia do Bósforo, com pavilhões otomanos e café; explode de cor em abril"
      },
      {
        "name": "Fethi Paşa Korusu (bosque de Üsküdar)",
        "category": "afternoon",
        "neighborhood": "Üsküdar",
        "costBRL": 20,
        "tip": "Bosque com café de chá e a vista do Bósforo mais bonita do lado asiático; ao lado da ponte, pôr do sol"
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
        "name": "Ali Muhiddin Hacı Bekir (lokum desde 1777)",
        "category": "afternoon",
        "neighborhood": "Eminönü",
        "costBRL": 30,
        "tip": "A confeitaria que inventou o lokum em 1777, ainda na família; compre a caixa de presente na loja original de Bahçekapı"
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
        "name": "Cerimônia dos dervixes (Hodjapasha)",
        "category": "night",
        "neighborhood": "Sirkeci",
        "costBRL": 200,
        "tip": "Cerimônia sufi dos dervixes rodopiantes num hammam do século XV; é rito, não show — silêncio e sem fotos"
      },
      {
        "name": "Ilhas dos Príncipes (Büyükada)",
        "category": "morning",
        "neighborhood": "Mar de Mármara (ferry 1h30)",
        "costBRL": 120,
        "tip": "Ilha sem carros — bicicletas e charretes elétricas · Ferry público barato saindo de Eminönü ou Kabataş"
      },
      {
        "name": "Isfanbul (parque temático)",
        "category": "morning",
        "neighborhood": "Eyüp",
        "costBRL": 150,
        "tip": "O maior parque temático da cidade, com montanhas-russas e área infantil; combine com o teleférico de Eyüp e o Pierre Loti"
      },
      {
        "name": "İstinye Park",
        "category": "afternoon",
        "neighborhood": "Sarıyer",
        "costBRL": 0,
        "tip": "O shopping mais elegante da cidade, com grifes, mercado coberto e cinema; perto do Parque Emirgan"
      },
      {
        "name": "Kadıköy: o lado asiático",
        "category": "afternoon",
        "neighborhood": "Kadıköy (Ásia)",
        "costBRL": 30,
        "tip": "Pegue o ferry e mude de continente em 20 minutos · O mercado de rua de Kadıköy é festa gastronômica"
      },
      {
        "name": "Kanyon",
        "category": "afternoon",
        "neighborhood": "Levent",
        "costBRL": 0,
        "tip": "Shopping a céu aberto em forma de cânion, premiado de arquitetura; metrô Levent, cinemas e restaurantes"
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
        "name": "Parque Maçka Demokrasi (teleférico)",
        "category": "afternoon",
        "neighborhood": "Nişantaşı",
        "costBRL": 10,
        "tip": "Vale verde entre Nişantaşı e Beşiktaş com teleférico de 3 min, parquinho e piquenique; a pausa depois das compras"
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
        "name": "Miniatürk",
        "category": "afternoon",
        "neighborhood": "Sütlüce",
        "costBRL": 60,
        "tip": "A Turquia inteira em miniatura à beira do Chifre de Ouro; a 10 min do Museu Rahmi Koç, dá para emendar"
      },
      {
        "name": "Namlı Gurme (Karaköy)",
        "category": "breakfast",
        "neighborhood": "Karaköy",
        "costBRL": 60,
        "tip": "Empório-restaurante com o kahvaltı de balcão mais farto do cais: queijos, mel, pastırma; escolha e pese"
      },
      {
        "name": "Nardis Jazz Club",
        "category": "night",
        "neighborhood": "Galata",
        "costBRL": 150,
        "tip": "Clube de jazz íntimo aos pés da Torre de Gálata; shows diários, reserve mesa"
      },
      {
        "name": "Meyhanes de Nevizade (jantar com mezes)",
        "category": "dinner",
        "neighborhood": "Beyoğlu",
        "costBRL": 150,
        "tip": "A viela das tavernas turcas — mesas na rua e bandejas de mezes · Escolha os pratinhos frios da bandeja e o peixe do dia"
      },
      {
        "name": "Pandeli (1901, Bazar das Especiarias)",
        "category": "lunch",
        "neighborhood": "Eminönü",
        "costBRL": 150,
        "tip": "Salão de azulejos turquesa sobre a entrada do Bazar das Especiarias, cozinha otomana desde 1901; só almoço"
      },
      {
        "name": "Museu Rahmi M. Koç",
        "category": "morning",
        "neighborhood": "Hasköy",
        "costBRL": 60,
        "tip": "Museu industrial à beira do Chifre de Ouro: submarino, aviões, trens e carros para subir e tocar — o melhor programa com crianças da cidade"
      },
      {
        "name": "Salon İKSV (shows)",
        "category": "night",
        "neighborhood": "Beyoğlu",
        "costBRL": 120,
        "tip": "Sala de 500 lugares da fundação cultural de Istambul, com jazz, indie e música turca contemporânea; veja a agenda"
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
        "name": "Parque Yıldız",
        "category": "afternoon",
        "neighborhood": "Beşiktaş",
        "costBRL": 0,
        "tip": "Antigo jardim imperial atrás do Dolmabahçe, com lagos, mirantes e os pavilhões do sultão; combine com o palácio"
      },
      {
        "name": "Zorlu Center",
        "category": "afternoon",
        "neighborhood": "Beşiktaş",
        "costBRL": 0,
        "tip": "Shopping de luxo com a melhor sala de espetáculos da cidade e terraço-jardim; metrô Gayrettepe"
      },
      {
        "name": "Zübeyir Ocakbaşı",
        "category": "dinner",
        "neighborhood": "Beyoğlu",
        "costBRL": 150,
        "tip": "Sente ao redor da grelha de cobre e veja o mestre trabalhar · Adana kebab e asinhas direto da brasa"
      }
    ],
    "hotels": [
      {
        "name": "Agora Guesthouse",
        "zone": "Sultanahmet",
        "tier": "budget",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Café no terraço de frente para o Mármara, a pé de tudo"
      },
      {
        "name": "Hotel Amira Istanbul",
        "zone": "Sultanahmet",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 550-850",
        "tip": "Terraço com vista do Bósforo e serviço que vira elogio em toda avaliação"
      },
      {
        "name": "Cheers Hostel",
        "zone": "Sultanahmet",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 120-250",
        "tip": "Terraço com vista da Hagia Sophia — mochileiro no coração histórico"
      },
      {
        "name": "Çırağan Palace Kempinski",
        "zone": "Beşiktaş",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 3.000-7.000",
        "tip": "Palácio otomano à beira do Bósforo com piscina infinita sobre a água"
      },
      {
        "name": "Four Seasons Hotel Istanbul at Sultanahmet",
        "zone": "Sultanahmet",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.500-6.500",
        "tip": "A antiga prisão neoclássica virou o hotel mais charmoso da península"
      },
      {
        "name": "Hanedan Hotel",
        "zone": "Sultanahmet",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 250-420",
        "tip": "Familiar e silencioso a 5 min da Mesquita Azul"
      },
      {
        "name": "Ottoman Hotel Imperial",
        "zone": "Sultanahmet",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "Casarão otomano de frente para a Hagia Sophia"
      },
      {
        "name": "Pera Palace Hotel",
        "zone": "Beyoğlu",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "O hotel do Expresso do Oriente e de Agatha Christie — Beyoğlu histórico"
      },
      {
        "name": "Sirkeci Mansion",
        "zone": "Sirkeci",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 600-950",
        "tip": "Piscina coberta, aulas de culinária e Topkapi a pé — o favorito das famílias"
      }
    ]
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
        "name": "Bang Krachao de bicicleta (o pulmão verde)",
        "category": "morning",
        "neighborhood": "Phra Pradaeng",
        "costBRL": 60,
        "tip": "Barco de 1 min a partir do píer de Khlong Toei e bicicleta alugada na chegada; trilhas elevadas sobre o mangue, mercado flutuante aos fins de semana"
      },
      {
        "name": "Benjakitti Forest Park",
        "category": "afternoon",
        "neighborhood": "Khlong Toei",
        "costBRL": 0,
        "tip": "Parque-floresta novo com passarelas elevadas e vista do skyline; ao lado do MRT Queen Sirikit, melhor no fim da tarde"
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
        "name": "CentralWorld",
        "category": "afternoon",
        "neighborhood": "Ratchaprasong",
        "costBRL": 0,
        "tip": "Um dos maiores shoppings da Ásia, com o santuário Erawan na esquina e o food hall do último andar; BTS Chit Lom"
      },
      {
        "name": "Jantar-cruzeiro no Chao Phraya",
        "category": "night",
        "neighborhood": "Riverside",
        "costBRL": 250,
        "tip": "Barco de jantar passando por Wat Arun e o Grand Palace iluminados; escolha os menores (Manohra, Apsara) para evitar o show de turista"
      },
      {
        "name": "Mercado de Chatuchak (fim de semana)",
        "category": "morning",
        "neighborhood": "Chatuchak",
        "costBRL": 0,
        "tip": "15 mil barracas — o maior mercado de fim de semana do mundo · Só sábado e domingo; vá cedo antes do calor"
      },
      {
        "name": "Parque Chatuchak e Queen Sirikit",
        "category": "morning",
        "neighborhood": "Chatuchak",
        "costBRL": 0,
        "tip": "Três parques emendados ao lado do mercado de Chatuchak, com lagos e jardim botânico; a pausa verde do fim de semana de compras"
      },
      {
        "name": "Err Urban Rustic Thai",
        "category": "dinner",
        "neighborhood": "Tha Tien",
        "costBRL": 120,
        "tip": "Street food tailandês elevado pelos chefs do Bo.lan, a 2 min do Wat Pho; cerveja gelada e pratos para dividir"
      },
      {
        "name": "Grand Palace e Wat Phra Kaew (Buda de Esmeralda)",
        "category": "morning",
        "neighborhood": "Phra Nakhon",
        "costBRL": 95,
        "tip": "Vá na abertura (8h30) — calor e multidão dobram a cada hora · Dress code rígido: ombros e joelhos cobertos; emende com o Wat Pho, vizinho de muro"
      },
      {
        "name": "Havana Social (speakeasy)",
        "category": "night",
        "neighborhood": "Sukhumvit",
        "costBRL": 100,
        "tip": "Entrada por cabine telefônica com código numa viela da Soi 11; Havana dos anos 1940, rum e banda ao vivo"
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
        "name": "Jok Prince (mingau de arroz desde 1960)",
        "category": "breakfast",
        "neighborhood": "Charoen Krung",
        "costBRL": 25,
        "tip": "Jok (mingau de arroz com porco e ovo) de barraca com Bib Gourmand, aberto desde 6h; coma no balcão"
      },
      {
        "name": "Khao San Road à noite",
        "category": "night",
        "neighborhood": "Banglamphu",
        "costBRL": 60,
        "tip": "A rua dos mochileiros: bares, pad thai de rua e música até tarde — caótica de propósito, vá para ver, não para jantar"
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
        "name": "Luka Cafe (Sathorn)",
        "category": "breakfast",
        "neighborhood": "Sathorn",
        "costBRL": 60,
        "tip": "Brunch australiano num prédio de concreto de Sathorn; ovos benedict e café de especialidade, lota aos fins de semana"
      },
      {
        "name": "Parque Lumpini",
        "category": "afternoon",
        "neighborhood": "Silom",
        "costBRL": 0,
        "tip": "O pulmão verde de Bangkok — pedalinho e sombra · Os lagartos-monitores gigantes passeiam livres (inofensivos!)"
      },
      {
        "name": "Mahanakhon SkyWalk",
        "category": "night",
        "neighborhood": "Sathorn",
        "costBRL": 180,
        "tip": "Piso de vidro no 78º andar do prédio pixelado, a plataforma mais alta da cidade; reserve o pôr do sol, BTS Chong Nonsi"
      },
      {
        "name": "MBK Center",
        "category": "afternoon",
        "neighborhood": "Siam",
        "costBRL": 0,
        "tip": "Oito andares de eletrônicos, celulares e souvenirs a preço de rua, com ar-condicionado; negocie, é a regra"
      },
      {
        "name": "Mercado flutuante de Damnoen Saduak",
        "category": "morning",
        "neighborhood": "1h30 de Bangkok",
        "costBRL": 190,
        "tip": "Barcos carregados de frutas e comida nos canais · Saída cedo do hotel — o mercado morre até o meio-dia"
      },
      {
        "name": "Muay Thai no Rajadamnern Stadium",
        "category": "night",
        "neighborhood": "Phra Nakhon",
        "costBRL": 300,
        "tip": "O estádio mais antigo do muay thai (1945), lutas de verdade com banda ao vivo; ingresso pelo site, ringside vale o preço"
      },
      {
        "name": "Octave Rooftop Lounge",
        "category": "night",
        "neighborhood": "Sukhumvit",
        "costBRL": 120,
        "tip": "Três andares de rooftop no Marriott Sukhumvit, menos formal e mais barato que os famosos; BTS Thong Lo"
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
        "name": "Platinum Fashion Mall",
        "category": "morning",
        "neighborhood": "Pratunam",
        "costBRL": 0,
        "tip": "Seis andares de roupa no atacado e varejo a preço de fábrica; leve dinheiro, negocie a partir de 3 peças"
      },
      {
        "name": "Prachak Pet Yang (pato assado desde 1909)",
        "category": "lunch",
        "neighborhood": "Bang Rak",
        "costBRL": 40,
        "tip": "Pato assado e macarrão de ovo numa casa de 1909 em Charoen Krung; almoço rápido e barato a caminho do rio"
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
        "name": "Safari World e Marine Park",
        "category": "morning",
        "neighborhood": "Khlong Sam Wa",
        "costBRL": 350,
        "tip": "Safári de carro entre girafas e tigres, mais shows de golfinhos e orangotangos; dia inteiro, vá de táxi ou transfer"
      },
      {
        "name": "Saxophone Pub (jazz e blues)",
        "category": "night",
        "neighborhood": "Victory Monument",
        "costBRL": 80,
        "tip": "Desde 1987, bandas tailandesas de jazz e blues todas as noites; entrada livre, chegue antes das 21h para sentar"
      },
      {
        "name": "SEA LIFE Bangkok Ocean World",
        "category": "afternoon",
        "neighborhood": "Siam",
        "costBRL": 180,
        "tip": "Aquário no subsolo do Siam Paragon — a saída perfeita para a hora mais quente do dia com crianças"
      },
      {
        "name": "Siam Paragon",
        "category": "afternoon",
        "neighborhood": "Siam",
        "costBRL": 0,
        "tip": "O shopping de luxo de Siam, com o aquário no subsolo e o maior food hall da cidade; BTS Siam, refúgio do calor"
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
        "name": "Tep Bar (Chinatown)",
        "category": "night",
        "neighborhood": "Yaowarat",
        "costBRL": 90,
        "tip": "Bar de coquetéis com música tailandesa tradicional ao vivo, escondido numa viela de Chinatown; emende com o street food de Yaowarat"
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
        "name": "Wat Saket (Golden Mount)",
        "category": "morning",
        "neighborhood": "Phra Nakhon",
        "costBRL": 20,
        "tip": "300 degraus suaves em espiral até o chedi dourado, com vista 360º da cidade velha; vá cedo, antes do calor"
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
    "hotels": [
      {
        "name": "Amara Bangkok",
        "zone": "Silom",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Piscina infinita no rooftop com Silom aos pés"
      },
      {
        "name": "Centre Point Prime Hotel Pratunam",
        "zone": "Pratunam",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 400-650",
        "tip": "Suítes com cozinha — família que fica mais dias"
      },
      {
        "name": "Holiday Inn Express Bangkok Siam",
        "zone": "Siam",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 300-450",
        "tip": "Café incluso e BTS na porta — base prática para a família"
      },
      {
        "name": "ibis Bangkok Riverside",
        "zone": "Riverside",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Rede confiável à beira do Chao Phraya com barco gratuito para o píer"
      },
      {
        "name": "Lub d Bangkok Siam",
        "zone": "Siam",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 150-350",
        "tip": "Hostel-design a passos do BTS National Stadium e dos shoppings de Siam"
      },
      {
        "name": "Mandarin Oriental Bangkok",
        "zone": "Riverside",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 3.500-6.500",
        "tip": "A lenda de 1876 à beira do rio — serviço que virou referência mundial"
      },
      {
        "name": "Novotel Bangkok Platinum Pratunam",
        "zone": "Pratunam",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Colado ao Platinum Fashion Mall — compras e street food de Pratunam"
      },
      {
        "name": "The Peninsula Bangkok",
        "zone": "Riverside",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "Todos os quartos com vista do rio e piscina de três níveis"
      },
      {
        "name": "Shangri-La Bangkok",
        "zone": "Riverside",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "Jardins à beira do Chao Phraya e BTS Saphan Taksin ao lado"
      }
    ]
  },
  "Marrakech": {
    "city": "Marrakech",
    "items": [
      {
        "name": "33 Rue Majorelle (concept store)",
        "category": "afternoon",
        "neighborhood": "Guéliz",
        "costBRL": 0,
        "tip": "Loja de design marroquino contemporâneo em frente ao Jardim Majorelle; caftans, cerâmica e joias de criadores locais"
      },
      {
        "name": "Noite no deserto de Agafay",
        "category": "night",
        "neighborhood": "Agafay",
        "costBRL": 400,
        "tip": "Deserto de pedra a 40 km: pôr do sol de camelo, jantar sob as estrelas e música gnawa; transfer incluído nos pacotes"
      },
      {
        "name": "Al Fassia",
        "category": "dinner",
        "neighborhood": "Gueliz",
        "costBRL": 190,
        "tip": "Cozinha de Fez comandada só por mulheres há décadas · O ombro de cordeiro confitado exige pedido antecipado"
      },
      {
        "name": "Al Nour (bordado, cooperativa de mulheres)",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "Cooperativa de mulheres com deficiência que borda roupa de casa e de mesa; compra com causa, perto da Mouassine"
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
        "name": "Jardim Anima (André Heller)",
        "category": "morning",
        "neighborhood": "Route de l'Ourika",
        "costBRL": 120,
        "tip": "Jardim-obra de arte a 27 km, com esculturas entre cactos e palmeiras; ônibus gratuito do jardim sai do centro"
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
        "name": "Baromètre (bar de coquetéis)",
        "category": "night",
        "neighborhood": "Guéliz",
        "costBRL": 100,
        "tip": "Coquetelaria de autor num porão de Guéliz, com infusões de ervas do Atlas; reserve"
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
        "name": "Carré Eden Shopping Center",
        "category": "afternoon",
        "neighborhood": "Guéliz",
        "costBRL": 0,
        "tip": "Shopping moderno de Guéliz com marcas internacionais, cafés e ar-condicionado; a tarde fora da medina"
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
        "name": "Cyber Park Arsat Moulay Abdeslam",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "Jardim do século XVIII a 5 min da Koutoubia, com fontes, sombra e wi-fi gratuito; pausa fácil entre a medina e Guéliz"
      },
      {
        "name": "Dar Cherifa (café literário)",
        "category": "lunch",
        "neighborhood": "Medina",
        "costBRL": 110,
        "tip": "Riad do século XVI com pátio de cedro esculpido, exposições e almoço marroquino leve; silêncio no meio dos souks"
      },
      {
        "name": "Dar Yacout",
        "category": "dinner",
        "neighborhood": "Medina",
        "costBRL": 380,
        "tip": "Jantar-experiência num palácio das mil e uma noites · Começa com drinks no terraço sob o call to prayer"
      },
      {
        "name": "Ensemble Artisanal",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "Centro de artesanato do governo com preço fixo e artesãos trabalhando; veja aqui o preço justo antes de negociar nos souks"
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
        "name": "Kabana Rooftop (vista da Koutoubia)",
        "category": "night",
        "neighborhood": "Medina",
        "costBRL": 120,
        "tip": "Rooftop com a Koutoubia iluminada em frente, DJ e coquetéis — raro na medina; reserve o pôr do sol"
      },
      {
        "name": "Kasbah Café (rooftop)",
        "category": "dinner",
        "neighborhood": "Kasbah",
        "costBRL": 90,
        "tip": "Terraço de frente para os túmulos Saadianos e as cegonhas · Tajines honestos a preço justo"
      },
      {
        "name": "Kechmara (Guéliz)",
        "category": "night",
        "neighborhood": "Guéliz",
        "costBRL": 80,
        "tip": "Bar-restaurante de terraço no bairro moderno, com DJ e cerveja — a Marrakech fora da medina"
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
        "name": "Le Foundouk",
        "category": "dinner",
        "neighborhood": "Medina",
        "costBRL": 200,
        "tip": "Antigo caravançarai virou restaurante de velas e terraço na medina; cozinha franco-marroquina, reserve"
      },
      {
        "name": "Le Jardin (café no riad)",
        "category": "breakfast",
        "neighborhood": "Medina",
        "costBRL": 60,
        "tip": "Pátio verde com tartarugas no meio dos souks, café da manhã marroquino à sombra das bananeiras"
      },
      {
        "name": "Jardim Majorelle e Museu YSL",
        "category": "morning",
        "neighborhood": "Gueliz",
        "costBRL": 150,
        "tip": "O jardim azul-cobalto que Yves Saint Laurent salvou · Ingresso SÓ online com horário — esgota"
      },
      {
        "name": "Max & Jan (concept store)",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "Moda e design marroquino contemporâneo numa casa da medina com rooftop-café; preço fixo, sem regateio"
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
        "name": "Menara Mall",
        "category": "afternoon",
        "neighborhood": "Hivernage",
        "costBRL": 0,
        "tip": "Shopping moderno com ar-condicionado, praça de alimentação e cinema — a pausa do calor da medina com crianças"
      },
      {
        "name": "Mustapha Blaoui (decoração)",
        "category": "afternoon",
        "neighborhood": "Medina",
        "costBRL": 0,
        "tip": "Depósito-labirinto de lanternas, tapetes e móveis onde os decoradores do mundo compram; envia para o exterior"
      },
      {
        "name": "Naranj",
        "category": "dinner",
        "neighborhood": "Medina (Riad Zitoun)",
        "costBRL": 130,
        "tip": "O libanês que conquistou a medina · Mezzes frescos quando você já provou todos os tajines"
      },
      {
        "name": "Nectarome (jardim de ervas no Ourika)",
        "category": "morning",
        "neighborhood": "Vale do Ourika",
        "costBRL": 60,
        "tip": "Jardim bio-aromático com 50 plantas medicinais, oficina de óleos e banho de pés; combine com o bate-volta ao Ourika"
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
        "name": "Bate-volta às Cascatas de Ouzoud",
        "category": "morning",
        "neighborhood": "Ouzoud",
        "costBRL": 200,
        "tip": "Quedas de 110 m com macacos nas trilhas e barcos sob a cascata; 150 km, dia inteiro com agência"
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
      },
      {
        "name": "Terres d'Amanar (aventura no Atlas)",
        "category": "morning",
        "neighborhood": "Tahanaout",
        "costBRL": 350,
        "tip": "Tirolesas, arvorismo e trilhas a 40 min da cidade, com almoço berbere; bom para adolescentes"
      },
      {
        "name": "Théâtro (clube)",
        "category": "night",
        "neighborhood": "Hivernage",
        "costBRL": 150,
        "tip": "Teatro antigo virou a boate mais famosa da cidade, dentro do Hotel Es Saadi; abre à meia-noite"
      },
      {
        "name": "Zwin Zwin Café (Guéliz)",
        "category": "breakfast",
        "neighborhood": "Guéliz",
        "costBRL": 50,
        "tip": "Café moderno de Guéliz com msemen, amlou e suco de laranja; a versão fora da medina"
      }
    ],
    "hotels": [
      {
        "name": "Equity Point Marrakech",
        "zone": "Medina",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 100-250",
        "tip": "Piscina no pátio e Jemaa el-Fna a 10 minutos a pé"
      },
      {
        "name": "Four Seasons Resort Marrakech",
        "zone": "Hivernage",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "Piscinas, kids club e Atlas no horizonte — o resort de família"
      },
      {
        "name": "Les Jardins de la Koutoubia",
        "zone": "Medina",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.600",
        "tip": "Hotel com três piscinas a passos da Koutoubia e da praça"
      },
      {
        "name": "La Mamounia",
        "zone": "Hivernage",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 4.000-9.000",
        "tip": "O palácio de Churchill — jardins de 8 hectares e o hotel mais famoso da África"
      },
      {
        "name": "Riad Le Clos des Arts",
        "zone": "Medina",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 550-900",
        "tip": "Riad de artista com piscina, hammam e jantar no terraço"
      },
      {
        "name": "Riad Dar Anika",
        "zone": "Medina",
        "tier": "budget",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "Riad pequeno e impecável perto da praça — o custo-benefício da medina"
      },
      {
        "name": "Riad Kniza",
        "zone": "Medina",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Riad do século XVIII de uma família de antiquários — serviço de palácio"
      },
      {
        "name": "Rodamon Riad Marrakech",
        "zone": "Medina",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple"
        ],
        "priceRangeBRL": "R$ 120-280",
        "tip": "Riad-hostel com piscina e terraço — mochileiro dentro da medina"
      },
      {
        "name": "Royal Mansour Marrakech",
        "zone": "Medina",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 8.000-15.000",
        "tip": "Riads privados do rei, mordomo e spa de mármore — o topo absoluto"
      }
    ]
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
        "name": "ATLAS Bar",
        "category": "night",
        "neighborhood": "Bugis",
        "costBRL": 130,
        "tip": "Salão art déco com uma torre de 1.300 gins; dress code elegante, reserve"
      },
      {
        "name": "Jardim Botânico e Orquidário Nacional",
        "category": "morning",
        "neighborhood": "Tanglin",
        "costBRL": 60,
        "tip": "Patrimônio UNESCO — 160 anos de jardins tropicais · O Orquidário tem 60 mil orquídeas; a ala VIP homenageia chefes de estado"
      },
      {
        "name": "Bugis Street Market",
        "category": "afternoon",
        "neighborhood": "Bugis",
        "costBRL": 0,
        "tip": "O mercado de rua mais barato da cidade: roupa, souvenir e suco de frutas; ao lado do metrô Bugis"
      },
      {
        "name": "Candlenut",
        "category": "dinner",
        "neighborhood": "Dempsey Hill",
        "costBRL": 320,
        "tip": "A alta cozinha peranakan (sino-malaia) reconhecida mundialmente · O buah keluak de chocolate na sobremesa é genial"
      },
      {
        "name": "Changi Beach Park",
        "category": "afternoon",
        "neighborhood": "Changi",
        "costBRL": 0,
        "tip": "Praia de pescadores com coqueiros e churrasqueiras, onde os locais veem os aviões pousarem; combine com Pulau Ubin"
      },
      {
        "name": "Chin Mee Chin Confectionery (Katong)",
        "category": "breakfast",
        "neighborhood": "Katong",
        "costBRL": 30,
        "tip": "Confeitaria de 1925 em Katong, kaya toast no carvão e café no copo de vidro; a versão original, antes das redes"
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
        "name": "Coney Island Park",
        "category": "morning",
        "neighborhood": "Punggol",
        "costBRL": 0,
        "tip": "Ilha selvagem ligada por ponte, com trilhas, praias vazias e bicicleta; alugue em Punggol, leve repelente"
      },
      {
        "name": "Din Tai Fung",
        "category": "dinner",
        "neighborhood": "Marina Bay Sands/Várias",
        "costBRL": 120,
        "tip": "Os xiao long bao perfeitos — 18 dobras cada · Cozinha de vidro hipnotiza as crianças"
      },
      {
        "name": "East Coast Park de bicicleta",
        "category": "afternoon",
        "neighborhood": "East Coast",
        "costBRL": 60,
        "tip": "15 km de orla com ciclovia, praia e barracas de satay; alugue bicicleta no parque e termine no Lagoon Food Village"
      },
      {
        "name": "Garden Rhapsody (show das Supertrees)",
        "category": "night",
        "neighborhood": "Marina Bay",
        "costBRL": 0,
        "tip": "Show gratuito de luz e som nas Supertrees, às 19h45 e 20h45; deite no gramado e combine com o Spectra depois"
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
        "name": "ION Orchard",
        "category": "afternoon",
        "neighborhood": "Orchard Road",
        "costBRL": 0,
        "tip": "O shopping-ícone de Orchard Road, com mirante gratuito no 56º andar (ION Sky) e food court no subsolo"
      },
      {
        "name": "Jewel Changi (cachoeira do aeroporto)",
        "category": "afternoon",
        "neighborhood": "Changi",
        "costBRL": 0,
        "tip": "A maior cachoeira indoor do mundo — dentro do aeroporto · PERFEITO para o dia da volta: chegue 3h antes e passeie"
      },
      {
        "name": "Jigger & Pony",
        "category": "night",
        "neighborhood": "Tanjong Pagar",
        "costBRL": 130,
        "tip": "Entre os melhores bares da Ásia, no Amara Hotel; carta em formato de revista, reserve"
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
        "name": "Keng Eng Kee Seafood (zi char)",
        "category": "dinner",
        "neighborhood": "Bukit Merah",
        "costBRL": 120,
        "tip": "Zi char de bairro desde 1970, caranguejo com pimenta e \"moonlight hor fun\"; o jantar que os singapurianos fazem em família"
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
        "name": "Lantern (rooftop do Fullerton Bay)",
        "category": "night",
        "neighborhood": "Marina Bay",
        "costBRL": 130,
        "tip": "Rooftop à beira da água de frente para o Marina Bay Sands; reserve para o show de luzes das 20h"
      },
      {
        "name": "Lau Pa Sat e a rua do satay",
        "category": "lunch",
        "neighborhood": "CBD",
        "costBRL": 60,
        "tip": "Mercado vitoriano de ferro fundido entre arranha-céus · À noite a rua lateral fecha e vira churrasco de satay"
      },
      {
        "name": "Lazarus Island (balsa de Marina South)",
        "category": "morning",
        "neighborhood": "Southern Islands",
        "costBRL": 60,
        "tip": "Balsa de 30 min do Marina South Pier até a praia mais bonita de Singapura, sem comércio; leve água e comida"
      },
      {
        "name": "Little India e Haji Lane",
        "category": "afternoon",
        "neighborhood": "Little India/Kampong Glam",
        "costBRL": 0,
        "tip": "Dois mundos vizinhos: templos hindus e a mesquita dourada do Sultão · Haji Lane: a viela de murais e lojinhas indie"
      },
      {
        "name": "MacRitchie TreeTop Walk",
        "category": "morning",
        "neighborhood": "Central Catchment",
        "costBRL": 0,
        "tip": "Ponte suspensa de 250 m sobre a floresta tropical, com macacos no caminho; trilha de 10 km ida e volta, leve água"
      },
      {
        "name": "Manhattan (Regent Singapore)",
        "category": "night",
        "neighborhood": "Tanglin",
        "costBRL": 140,
        "tip": "Bar de hotel inspirado na Nova York do século XIX, com a primeira sala de envelhecimento de coquetéis em barril; reserve"
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
        "name": "Mustafa Centre (24 h)",
        "category": "night",
        "neighborhood": "Little India",
        "costBRL": 0,
        "tip": "Loja de departamentos aberta 24 h em Little India, de eletrônicos a especiarias; o lugar para a compra de madrugada"
      },
      {
        "name": "Native (Amoy Street)",
        "category": "night",
        "neighborhood": "Chinatown",
        "costBRL": 120,
        "tip": "Coquetéis com ingredientes do Sudeste Asiático (formigas, folhas de pandan, arak); pequeno, chegue antes das 20h"
      },
      {
        "name": "Newton Food Centre à noite",
        "category": "dinner",
        "neighborhood": "Newton",
        "costBRL": 70,
        "tip": "O hawker do filme Podres de Ricos · Satay, arraia grelhada e cerveja gelada ao ar livre"
      },
      {
        "name": "Ngee Ann City (Takashimaya)",
        "category": "afternoon",
        "neighborhood": "Orchard Road",
        "costBRL": 0,
        "tip": "A loja de departamentos japonesa de Orchard, com a livraria Kinokuniya e o food hall no subsolo"
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
        "name": "Palawan Beach (Sentosa)",
        "category": "afternoon",
        "neighborhood": "Sentosa",
        "costBRL": 0,
        "tip": "A praia das famílias, com a ponte suspensa até o \"ponto mais ao sul da Ásia continental\" e parque aquático infantil gratuito"
      },
      {
        "name": "Bate-volta a Pulau Ubin",
        "category": "morning",
        "neighborhood": "Changi",
        "costBRL": 60,
        "tip": "Barco de 10 min a partir de Changi Point para a ilha que parou nos anos 1960; bicicleta alugada no cais e mangue de Chek Jawa"
      },
      {
        "name": "Dia em Sentosa",
        "category": "morning",
        "neighborhood": "Sentosa Island",
        "costBRL": 220,
        "tip": "A ilha-parque: praias, teleférico, SkyHelix e aquário · Vá de Cable Car para chegar já passeando"
      },
      {
        "name": "The Shoppes at Marina Bay Sands",
        "category": "afternoon",
        "neighborhood": "Marina Bay",
        "costBRL": 0,
        "tip": "Shopping de luxo com canal e gôndolas dentro, pista de patinação e o casino ao lado; combine com o Spectra à noite"
      },
      {
        "name": "Siloso Beach (Sentosa)",
        "category": "morning",
        "neighborhood": "Sentosa",
        "costBRL": 0,
        "tip": "A praia mais animada de Sentosa, com bares, vôlei e tirolesa; vá de monotrilho ou a pé pela passarela do VivoCity"
      },
      {
        "name": "Singapore Flyer",
        "category": "afternoon",
        "neighborhood": "Marina Bay",
        "costBRL": 150,
        "tip": "Roda-gigante de 165 m com vista da baía; volta de 30 min, melhor no entardecer para pegar dia e noite"
      },
      {
        "name": "Song Fa Bak Kut Teh",
        "category": "lunch",
        "neighborhood": "Clarke Quay",
        "costBRL": 60,
        "tip": "A sopa de costela com pimenta que conforta há 50 anos · Refil de caldo é grátis — aceite sempre"
      },
      {
        "name": "Southern Ridges e Henderson Waves",
        "category": "morning",
        "neighborhood": "Mount Faber",
        "costBRL": 0,
        "tip": "10 km de trilhas e pontes sobre a copa das árvores ligando parques; comece em Mount Faber, vá cedo pelo calor"
      },
      {
        "name": "Spectra — show de luzes da Marina Bay",
        "category": "night",
        "neighborhood": "Marina Bay Sands",
        "costBRL": 0,
        "tip": "Água, laser e música na frente do MBS — gratuito · Dois horários por noite; chegue 20 min antes"
      },
      {
        "name": "Swee Choon Tim Sum (madrugada)",
        "category": "dinner",
        "neighborhood": "Jalan Besar",
        "costBRL": 80,
        "tip": "Dim sum de 1962 aberto até as 6h; o jantar tardio depois da noite em Little India, fila que anda"
      },
      {
        "name": "Tanjong Beach Club (Sentosa)",
        "category": "afternoon",
        "neighborhood": "Sentosa",
        "costBRL": 120,
        "tip": "A ponta mais tranquila de Sentosa, com o beach club de piscina e espreguiçadeiras; melhor dos três para casais"
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
        "name": "VivoCity",
        "category": "afternoon",
        "neighborhood": "HarbourFront",
        "costBRL": 0,
        "tip": "O maior shopping da ilha, com terraço de vista para Sentosa e o monotrilho que leva até lá; combine com o dia em Sentosa"
      },
      {
        "name": "Wings of Time (Sentosa)",
        "category": "night",
        "neighborhood": "Sentosa",
        "costBRL": 80,
        "tip": "Show noturno de água, laser e fogos na praia de Siloso; sessões às 19h40 e 20h40, fecha o dia em Sentosa"
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
      },
      {
        "name": "Zouk Singapore",
        "category": "night",
        "neighborhood": "Clarke Quay",
        "costBRL": 150,
        "tip": "O clube mais famoso do Sudeste Asiático, em Clarke Quay; DJs internacionais, abre às 22h e vai até as 4h"
      }
    ],
    "hotels": [
      {
        "name": "Carlton Hotel Singapore",
        "zone": "City Hall",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Ao lado do Raffles e do CHIJMES, piscina no terraço"
      },
      {
        "name": "The Fullerton Hotel Singapore",
        "zone": "Marina Bay",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "O antigo prédio dos Correios na foz do rio — clássico com vista da Marina"
      },
      {
        "name": "Hotel G Singapore",
        "zone": "Bugis",
        "tier": "budget",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Design compacto, café bom e metrô Bencoolen na porta"
      },
      {
        "name": "ibis Singapore on Bencoolen",
        "zone": "Bugis",
        "tier": "budget",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 450-700",
        "tip": "Rede previsível no meio de tudo — base barata numa cidade cara"
      },
      {
        "name": "Marina Bay Sands",
        "zone": "Marina Bay",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "A piscina infinita no 57º andar — o cartão-postal em que se dorme"
      },
      {
        "name": "Park Regis Singapore",
        "zone": "Clarke Quay",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Clarke Quay e Chinatown a pé — piscina e quartos modernos"
      },
      {
        "name": "The Pod @ Beach Road",
        "zone": "Bugis",
        "tier": "budget",
        "personaTags": [
          "solo"
        ],
        "priceRangeBRL": "R$ 200-350",
        "tip": "Cápsulas limpas e silenciosas a pé de Bugis e Kampong Glam"
      },
      {
        "name": "Raffles Singapore",
        "zone": "City Hall",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 5.000-9.000",
        "tip": "O hotel colonial de 1887 onde nasceu o Singapore Sling"
      }
    ]
  },
  "Porto": {
    "city": "Porto",
    "items": [
      {
        "name": "Abadia do Porto (1939)",
        "category": "dinner",
        "neighborhood": "Baixa",
        "costBRL": 120,
        "tip": "Salão de azulejos de 1939 com tripas à moda do Porto e bacalhau à Gomes de Sá; cozinha de sempre"
      },
      {
        "name": "Adega São Nicolau (Ribeira)",
        "category": "dinner",
        "neighborhood": "Ribeira",
        "costBRL": 130,
        "tip": "Peixe grelhado e polvo numa adega de pedra escondida na Ribeira; reserve a mesa da rua"
      },
      {
        "name": "Mercado Municipal da Afurada",
        "category": "afternoon",
        "neighborhood": "Vila Nova de Gaia",
        "costBRL": 60,
        "tip": "Vila de pescadores na foz, do lado de Gaia, com sardinha na brasa na rua e roupa secando ao vento; vá de barco a partir da Ribeira"
      },
      {
        "name": "Antiqvvm (Palácio de Cristal)",
        "category": "dinner",
        "neighborhood": "Massarelos",
        "costBRL": 600,
        "tip": "Duas estrelas Michelin nos jardins do Palácio de Cristal, com vista para o Douro; menu degustação, reserve com semanas"
      },
      {
        "name": "Base (jardim-bar dos Clérigos)",
        "category": "night",
        "neighborhood": "Clérigos",
        "costBRL": 50,
        "tip": "Bar ao ar livre no jardim das Oliveiras, atrás dos Clérigos, com espreguiçadeiras; primavera a outono"
      },
      {
        "name": "Bate-volta a Braga e Bom Jesus do Monte",
        "category": "morning",
        "neighborhood": "Braga",
        "costBRL": 60,
        "tip": "A escadaria barroca do Bom Jesus (ou o elevador a água de 1882) e a cidade das igrejas; 1h de trem"
      },
      {
        "name": "Estação Ferroviária do Pinhão (bate-volta Vale do Douro)",
        "category": "morning",
        "neighborhood": "Pinhão",
        "costBRL": 250,
        "tip": "Trem da Linha do Douro até o Pinhão beirando o rio, almoço numa quinta e barco rabelo; o dia mais bonito de Portugal"
      },
      {
        "name": "Castelo de Guimarães (bate-volta)",
        "category": "morning",
        "neighborhood": "Guimarães",
        "costBRL": 60,
        "tip": "A cidade onde Portugal nasceu, 1h de trem: castelo, Paço dos Duques e centro medieval Patrimônio da Humanidade"
      },
      {
        "name": "Café Santiago (francesinha)",
        "category": "lunch",
        "neighborhood": "Baixa",
        "costBRL": 80,
        "tip": "A francesinha de referência da cidade, molho secreto e fila na porta; peça com ovo e batata, divida se for a primeira"
      },
      {
        "name": "Cantina 32",
        "category": "dinner",
        "neighborhood": "Baixa",
        "costBRL": 140,
        "tip": "Cozinha portuguesa de partilha na Rua das Flores, com o \"vaso de chocolate\" de sobremesa; reserve, lota todo dia"
      },
      {
        "name": "Cantinho do Avillez",
        "category": "dinner",
        "neighborhood": "Baixa",
        "costBRL": 200,
        "tip": "A casa do chef José Avillez no Porto, cozinha portuguesa moderna; reserve, perto da estação São Bento"
      },
      {
        "name": "Casa da Música (visita guiada)",
        "category": "afternoon",
        "neighborhood": "Boavista",
        "costBRL": 60,
        "tip": "O prédio de Rem Koolhaas por dentro, com a sala de concertos de vidro ondulado; visitas diárias em inglês e português"
      },
      {
        "name": "Casa Guedes (sandes de pernil)",
        "category": "lunch",
        "neighborhood": "Poveiros",
        "costBRL": 40,
        "tip": "Sandes de pernil com queijo da serra, o lanche mais famoso do Porto; balcão, rápido, barato"
      },
      {
        "name": "Caves Graham's (vinho do Porto)",
        "category": "afternoon",
        "neighborhood": "Vila Nova de Gaia",
        "costBRL": 120,
        "tip": "Visita e prova numa das caves mais bonitas de Gaia, no alto, com vista para o Porto; reserve o horário"
      },
      {
        "name": "Centro Comercial Bombarda (Rua Miguel Bombarda)",
        "category": "afternoon",
        "neighborhood": "Cedofeita",
        "costBRL": 0,
        "tip": "Galeria de lojas de design, joias e ilustração na rua das galerias de arte; no sábado de inauguração simultânea a rua inteira abre"
      },
      {
        "name": "Cervejaria Brasão Aliados",
        "category": "lunch",
        "neighborhood": "Aliados",
        "costBRL": 90,
        "tip": "Francesinha e pratos do dia num salão bonito perto dos Aliados; alternativa com reserva ao Santiago"
      },
      {
        "name": "Claus Porto (Rua das Flores)",
        "category": "afternoon",
        "neighborhood": "Baixa",
        "costBRL": 0,
        "tip": "A loja-museu dos sabonetes de 1887 na Rua das Flores 22, três andares de embalagens art déco; o souvenir do Porto, de verdade"
      },
      {
        "name": "Combi Coffee Roasters",
        "category": "breakfast",
        "neighborhood": "Bonfim",
        "costBRL": 40,
        "tip": "Torrefação de especialidade que começou numa Kombi; brunch e café filtrado no bairro do Bonfim"
      },
      {
        "name": "Confeitaria do Bolhão (1896)",
        "category": "breakfast",
        "neighborhood": "Bolhão",
        "costBRL": 25,
        "tip": "Pastelaria histórica em frente ao mercado; pão de ló, bolinhos de bacalhau e café ao balcão com os portuenses"
      },
      {
        "name": "Cruzeiro das Seis Pontes no Douro",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 90,
        "tip": "50 minutos de barco rabelo passando sob as seis pontes; saída do cais da Ribeira ou de Gaia, sem reserva"
      },
      {
        "name": "Fado in Porto (Caves Cálem)",
        "category": "night",
        "neighborhood": "Vila Nova de Gaia",
        "costBRL": 150,
        "tip": "Espetáculo de fado dentro das caves Cálem, com prova de vinho do Porto; todos os dias às 18h30, reserve"
      },
      {
        "name": "Foz do Douro (orla e Pérgola)",
        "category": "afternoon",
        "neighborhood": "Foz do Douro",
        "costBRL": 0,
        "tip": "Onde o rio encontra o mar: o bonde 1 da Ribeira até a Foz, a Pérgola, o farol e as esplanadas; pôr do sol"
      },
      {
        "name": "Galerias de Paris (rua dos bares)",
        "category": "night",
        "neighborhood": "Baixa",
        "costBRL": 60,
        "tip": "A rua dos bares da Baixa, que enche depois das 23h; comece no Galeria de Paris (o bar-museu) e vá de porta em porta"
      },
      {
        "name": "Gazela (cachorrinhos)",
        "category": "lunch",
        "neighborhood": "Batalha",
        "costBRL": 40,
        "tip": "Os \"cachorrinhos\" (hot dog prensado com molho picante) desde 1962, ao lado do Coliseu; Anthony Bourdain veio aqui"
      },
      {
        "name": "Hot Five Jazz & Blues Club",
        "category": "night",
        "neighborhood": "Batalha",
        "costBRL": 80,
        "tip": "Clube de jazz e blues com shows todas as noites de quarta a sábado; pequeno, reserve mesa"
      },
      {
        "name": "Igreja de São Francisco (talha dourada)",
        "category": "morning",
        "neighborhood": "Ribeira",
        "costBRL": 50,
        "tip": "Interior gótico coberto por 300 kg de ouro em talha barroca, e as catacumbas no subsolo"
      },
      {
        "name": "Jardim Botânico do Porto",
        "category": "afternoon",
        "neighborhood": "Campo Alegre",
        "costBRL": 0,
        "tip": "Jardim da universidade com estufas, cactos e a casa de Sophia de Mello Breyner; gratuito e quase vazio"
      },
      {
        "name": "Jardins do Palácio de Cristal",
        "category": "afternoon",
        "neighborhood": "Massarelos",
        "costBRL": 0,
        "tip": "Jardins românticos com pavões soltos e os melhores miradouros sobre o Douro; gratuito, pôr do sol"
      },
      {
        "name": "Livraria Lello",
        "category": "morning",
        "neighborhood": "Clérigos",
        "costBRL": 40,
        "tip": "A livraria de 1906 da escadaria vermelha; ingresso com hora marcada pelo site, descontado se comprar um livro; vá na abertura"
      },
      {
        "name": "Majestic Café (1921)",
        "category": "breakfast",
        "neighborhood": "Santa Catarina",
        "costBRL": 60,
        "tip": "O café art nouveau mais famoso de Portugal; caro para o que serve, mas a sala vale o café com rabanada; vá cedo"
      },
      {
        "name": "Manteigaria (pastel de nata)",
        "category": "breakfast",
        "neighborhood": "Baixa",
        "costBRL": 20,
        "tip": "Pastel de nata saindo do forno a cada 20 min, com sino; a filial do Porto fica ao lado dos Clérigos"
      },
      {
        "name": "Maus Hábitos",
        "category": "night",
        "neighborhood": "Baixa",
        "costBRL": 60,
        "tip": "Espaço cultural no 4º andar de uma garagem: exposições, shows, festas e um restaurante; a noite alternativa do Porto"
      },
      {
        "name": "Mercado Beira-Rio (Gaia)",
        "category": "afternoon",
        "neighborhood": "Vila Nova de Gaia",
        "costBRL": 60,
        "tip": "Mercado gastronômico no cais de Gaia, bancas de petiscos e vinho do Porto com a Ribeira em frente"
      },
      {
        "name": "Mercado do Bolhão",
        "category": "lunch",
        "neighborhood": "Bolhão",
        "costBRL": 50,
        "tip": "Mercado de 1914 restaurado em 2022; bancas de peixe, queijo e flores, e balcões para almoçar; feche com uma ginjinha"
      },
      {
        "name": "NorteShopping",
        "category": "afternoon",
        "neighborhood": "Matosinhos",
        "costBRL": 0,
        "tip": "O maior shopping da região, com cinema e marcas europeias; metrô linha A ou B, estação Sete Bicas"
      },
      {
        "name": "O Gaveto (marisqueira, Matosinhos)",
        "category": "dinner",
        "neighborhood": "Matosinhos",
        "costBRL": 220,
        "tip": "A marisqueira clássica de Matosinhos, sapateira e peixe do dia; metrô até Mercado, 25 min do centro"
      },
      {
        "name": "Padaria Ribeiro (1878)",
        "category": "breakfast",
        "neighborhood": "Baixa",
        "costBRL": 25,
        "tip": "A padaria mais antiga da cidade, na Praça Guilherme Gomes Fernandes; pão de Deus e croissant brioche"
      },
      {
        "name": "Palácio da Bolsa (Salão Árabe)",
        "category": "morning",
        "neighborhood": "Ribeira",
        "costBRL": 80,
        "tip": "Visita guiada obrigatória ao palácio da associação comercial, com o Salão Árabe dourado; combine com São Francisco ao lado"
      },
      {
        "name": "Parque da Cidade",
        "category": "morning",
        "neighborhood": "Boavista",
        "costBRL": 0,
        "tip": "O maior parque urbano do país, 83 hectares de lagos e trilhas que desembocam na praia; bicicleta e piquenique"
      },
      {
        "name": "A Pérola do Bolhão (1917)",
        "category": "afternoon",
        "neighborhood": "Bolhão",
        "costBRL": 0,
        "tip": "Mercearia de 1917 com fachada art nouveau em frente ao mercado; bacalhau, frutos secos, vinho do Porto e chocolates para levar"
      },
      {
        "name": "Ponte Luís I (travessia pelo tabuleiro superior)",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 0,
        "tip": "Atravesse a pé pelo tabuleiro de cima (60 m) até o Jardim do Morro, em Gaia, e desça pelo teleférico ou pelas escadas"
      },
      {
        "name": "Praia da Luz (Foz do Douro)",
        "category": "afternoon",
        "neighborhood": "Foz do Douro",
        "costBRL": 0,
        "tip": "Pequena praia de rochas na Foz com o bar-esplanada do mesmo nome em cima; o pôr do sol da Foz com os pés na areia"
      },
      {
        "name": "Praia do Homem do Leme (Foz)",
        "category": "morning",
        "neighborhood": "Foz do Douro",
        "costBRL": 0,
        "tip": "A praia de família da Foz, areia larga, parque infantil e a estátua do homem do leme; bonde 1 até o fim da linha"
      },
      {
        "name": "Praia dos Ingleses (Foz)",
        "category": "afternoon",
        "neighborhood": "Foz do Douro",
        "costBRL": 0,
        "tip": "Pequena enseada de areia entre rochas na Foz, com o Praia da Luz ao lado para o fim de tarde; água fria, sol bom"
      },
      {
        "name": "Praia de Matosinhos",
        "category": "morning",
        "neighborhood": "Matosinhos",
        "costBRL": 0,
        "tip": "A praia grande do Porto, de areia larga e escolas de surf; metrô linha A, e o almoço nas grelhas de peixe da Rua Heróis de França"
      },
      {
        "name": "Ribeira (cais e casario)",
        "category": "afternoon",
        "neighborhood": "Ribeira",
        "costBRL": 0,
        "tip": "Patrimônio da Humanidade: casas coloridas, cais e esplanadas de frente para Gaia; melhor no fim da tarde, com a luz no rio"
      },
      {
        "name": "Rua de Santa Catarina (compras)",
        "category": "afternoon",
        "neighborhood": "Santa Catarina",
        "costBRL": 0,
        "tip": "A rua de pedestres do comércio, do Majestic à Capela das Almas (azulejos azuis); Via Catarina shopping no meio"
      },
      {
        "name": "Estação de São Bento (azulejos)",
        "category": "morning",
        "neighborhood": "Baixa",
        "costBRL": 0,
        "tip": "20 mil azulejos contando a história de Portugal no saguão da estação; gratuito, 15 minutos que valem a cidade"
      },
      {
        "name": "Sé do Porto e claustro",
        "category": "morning",
        "neighborhood": "Sé",
        "costBRL": 25,
        "tip": "Catedral-fortaleza do século XII no alto da cidade velha; o claustro de azulejos e o terreiro com vista para o rio"
      },
      {
        "name": "Sea Life Porto",
        "category": "morning",
        "neighborhood": "Foz do Douro",
        "costBRL": 90,
        "tip": "Aquário com túnel de tubarões junto ao Parque da Cidade; o programa de chuva com crianças pequenas"
      },
      {
        "name": "Serralves (museu e parque)",
        "category": "morning",
        "neighborhood": "Boavista",
        "costBRL": 80,
        "tip": "Museu de arte contemporânea de Siza Vieira, a casa art déco e 18 hectares de parque com passarela nas copas"
      },
      {
        "name": "Taberna dos Mercadores",
        "category": "lunch",
        "neighborhood": "Ribeira",
        "costBRL": 120,
        "tip": "Taberna minúscula na Ribeira com arroz de polvo e bacalhau no forno; reserve, são 8 mesas"
      },
      {
        "name": "Taberna Santo António",
        "category": "dinner",
        "neighborhood": "Virtudes",
        "costBRL": 110,
        "tip": "Tasca familiar nas Virtudes com rojões, tripas e vinho verde; lota, reserve ou vá cedo"
      },
      {
        "name": "Tapabento (São Bento)",
        "category": "dinner",
        "neighborhood": "Baixa",
        "costBRL": 150,
        "tip": "Tapas portuguesas e risotos num espaço pequeno ao lado da estação; reserve, lota todo dia"
      },
      {
        "name": "Tasquinha Zé Povinho",
        "category": "lunch",
        "neighborhood": "Bolhão",
        "costBRL": 70,
        "tip": "Tasca de bairro ao lado do Bolhão: tripas à moda do Porto, bacalhau e vinho da casa; preço de portuense"
      },
      {
        "name": "Teleférico de Gaia",
        "category": "afternoon",
        "neighborhood": "Vila Nova de Gaia",
        "costBRL": 40,
        "tip": "5 minutos entre o Jardim do Morro e o cais de Gaia, com a Ribeira inteira do outro lado; combine com as caves"
      },
      {
        "name": "Torre dos Clérigos",
        "category": "morning",
        "neighborhood": "Clérigos",
        "costBRL": 50,
        "tip": "225 degraus até a vista de 360º da cidade; a igreja barroca e o museu entram no mesmo bilhete"
      },
      {
        "name": "Vila do Conde Porto Fashion Outlet",
        "category": "morning",
        "neighborhood": "Vila do Conde",
        "costBRL": 0,
        "tip": "Outlet de 150 lojas a 30 min pelo metrô (estação Modivas Centro); marcas europeias e esportivas, devolução de IVA"
      },
      {
        "name": "World of Discoveries",
        "category": "afternoon",
        "neighborhood": "Miragaia",
        "costBRL": 110,
        "tip": "Museu interativo dos Descobrimentos com passeio de barco por cenários; feito para crianças de 5 a 12"
      }
    ],
    "hotels": [
      {
        "name": "Hotel Teatro",
        "zone": "Ribeira/Centro",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Boutique inspirado no teatro que existiu no prédio, a 2 min dos Aliados; bar escuro e bonito"
      },
      {
        "name": "InterContinental Porto — Palácio das Cardosas",
        "zone": "Ribeira/Centro",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "Palácio do século XVIII na Praça da Liberdade, de frente para os Aliados; o grande hotel clássico do centro"
      },
      {
        "name": "Mercure Porto Centro Aliados",
        "zone": "Cedofeita/Bolhao",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Rede francesa a 3 min dos Aliados e de São Bento; padrão previsível, bom para família"
      },
      {
        "name": "Moov Hotel Porto Centro",
        "zone": "Cedofeita/Bolhao",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 300-500",
        "tip": "Antigo cinema virou hotel econômico a 5 min do Bolhão; quartos pequenos, limpos, preço honesto"
      },
      {
        "name": "The Passenger Hostel (São Bento)",
        "zone": "Ribeira/Centro",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 200-400",
        "tip": "Hostel de design dentro da estação de São Bento, quartos privativos e cozinha; não dá para ficar mais central"
      },
      {
        "name": "Pestana Vintage Porto",
        "zone": "Ribeira/Centro",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.500-2.800",
        "tip": "Casario do século XVI na Praça da Ribeira, quartos com o rio e a Ponte Luís I na janela"
      },
      {
        "name": "Porto A.S. 1829 Hotel",
        "zone": "Ribeira/Centro",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Antiga papelaria de 1829 na Rua das Flores, com o balcão original na recepção; a rua mais bonita para ficar"
      },
      {
        "name": "The Yeatman",
        "zone": "Vila Nova de Gaia",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "Hotel vínico no alto de Gaia, piscina infinita de frente para o Porto e restaurante com 2 estrelas Michelin"
      }
    ]
  },
  "Madri": {
    "city": "Madri",
    "items": [
      {
        "name": "Catedral de la Almudena",
        "category": "morning",
        "neighborhood": "Ópera",
        "costBRL": 40,
        "tip": "A catedral ao lado do Palácio Real, terminada em 1993; suba à cúpula pelo museu para a vista da Casa de Campo"
      },
      {
        "name": "Bar La Campana (bocadillo de calamares)",
        "category": "lunch",
        "neighborhood": "Sol",
        "costBRL": 30,
        "tip": "O sanduíche de calamares da Plaza Mayor, na Calle Botoneras; de pé, com uma caña, 5 euros"
      },
      {
        "name": "Casa Museo Lope de Vega (Barrio de las Letras)",
        "category": "afternoon",
        "neighborhood": "Huertas",
        "costBRL": 0,
        "tip": "A casa onde Lope de Vega viveu 25 anos, visita guiada grátis com reserva; saia andando pela Calle Huertas com versos no chão e as tabernas do bairro"
      },
      {
        "name": "Bate-volta a El Escorial",
        "category": "morning",
        "neighborhood": "San Lorenzo de El Escorial",
        "costBRL": 100,
        "tip": "O mosteiro-palácio de Felipe II, 1h de trem Cercanías; a biblioteca e o panteão dos reis"
      },
      {
        "name": "Bate-volta a Segóvia (aqueduto e Alcázar)",
        "category": "morning",
        "neighborhood": "Segóvia",
        "costBRL": 120,
        "tip": "28 min de AVE: aqueduto romano intacto, o Alcázar que inspirou a Disney e o leitão do Mesón de Cándido"
      },
      {
        "name": "Catedral Primada de Toledo (bate-volta)",
        "category": "morning",
        "neighborhood": "Toledo",
        "costBRL": 120,
        "tip": "33 min de AVE até a cidade das três culturas: catedral, El Greco, sinagogas e a vista do Mirador del Valle"
      },
      {
        "name": "Tour Estadio Santiago Bernabéu",
        "category": "morning",
        "neighborhood": "Chamartín",
        "costBRL": 180,
        "tip": "O estádio reformado do Real Madrid, museu com as 15 Champions e o túnel do gramado; compre antes, lota nos fins de semana"
      },
      {
        "name": "Bodega de la Ardosa (1892)",
        "category": "dinner",
        "neighborhood": "Malasaña",
        "costBRL": 90,
        "tip": "Taberna de 1892 com a melhor tortilha de Malasaña e vermute de barril; passe por baixo do balcão para o salão de trás"
      },
      {
        "name": "Sobrino de Botín (1725)",
        "category": "dinner",
        "neighborhood": "La Latina",
        "costBRL": 250,
        "tip": "O restaurante mais antigo do mundo em funcionamento (Guinness), leitão no forno a lenha; reserve, peça o andar de baixo"
      },
      {
        "name": "Café Central (jazz)",
        "category": "night",
        "neighborhood": "Huertas",
        "costBRL": 100,
        "tip": "Clube de jazz art déco na Plaza del Ángel desde 1982, show todas as noites às 21h; reserve a mesa"
      },
      {
        "name": "Café Comercial (1887)",
        "category": "breakfast",
        "neighborhood": "Malasaña",
        "costBRL": 50,
        "tip": "O café mais antigo de Madri, na Glorieta de Bilbao; espelhos, mármore e tostada com tomate"
      },
      {
        "name": "Calle de Serrano (compras de luxo)",
        "category": "afternoon",
        "neighborhood": "Salamanca",
        "costBRL": 0,
        "tip": "A milha de ouro de Madri: Loewe, Zara flagship, El Corte Inglés e as ruas Ortega y Gasset e Claudio Coello ao lado"
      },
      {
        "name": "Cardamomo Tablao Flamenco",
        "category": "night",
        "neighborhood": "Huertas",
        "costBRL": 250,
        "tip": "Flamenco mais cru e perto do público, no Barrio de las Letras; três sessões por noite, bom para quem não quer jantar"
      },
      {
        "name": "Casa Dani (Mercado de la Paz)",
        "category": "lunch",
        "neighborhood": "Salamanca",
        "costBRL": 50,
        "tip": "A tortilha de batata mais premiada da Espanha, numa banca do Mercado de la Paz; menu do dia barato no bairro caro"
      },
      {
        "name": "Casa Labra (1860)",
        "category": "lunch",
        "neighborhood": "Sol",
        "costBRL": 40,
        "tip": "Taberna de 1860 ao lado da Puerta del Sol, onde o PSOE foi fundado; tapas de bacalhau empanado e croquetes, de pé, fila que anda"
      },
      {
        "name": "Casa Lucio (huevos rotos)",
        "category": "dinner",
        "neighborhood": "La Latina",
        "costBRL": 220,
        "tip": "Os ovos estrelados com batata que viraram prato nacional, na Cava Baja; reserve com dias, celebridades na mesa ao lado"
      },
      {
        "name": "Casa Revuelta (bacalao rebozado)",
        "category": "lunch",
        "neighborhood": "La Latina",
        "costBRL": 40,
        "tip": "Taberna de bairro com o bacalhau empanado mais famoso da cidade; só balcão, vá antes das 13h"
      },
      {
        "name": "Azotea del Círculo de Bellas Artes",
        "category": "night",
        "neighborhood": "Gran Vía",
        "costBRL": 40,
        "tip": "O terraço no alto do Círculo, com a Gran Vía e o Metrópolis aos pés; drinque ao pôr do sol, ingresso de 5 euros"
      },
      {
        "name": "Corral de la Morería (flamenco)",
        "category": "night",
        "neighborhood": "Ópera",
        "costBRL": 350,
        "tip": "O tablao mais premiado do mundo, desde 1956; dois shows por noite, jantar opcional com estrela Michelin, reserve"
      },
      {
        "name": "DiverXO (Dabiz Muñoz)",
        "category": "dinner",
        "neighborhood": "Chamartín",
        "costBRL": 2500,
        "tip": "Três estrelas Michelin e eleito melhor restaurante do mundo; reservas abrem meses antes, menu único; o jantar da vida"
      },
      {
        "name": "El Corte Inglés Callao (Gourmet Experience)",
        "category": "afternoon",
        "neighborhood": "Gran Vía",
        "costBRL": 0,
        "tip": "A loja de departamentos da Espanha; o terraço Gourmet Experience do 9º andar tem a vista da Gran Vía e tapas"
      },
      {
        "name": "El Rastro (feira de domingo)",
        "category": "morning",
        "neighborhood": "La Latina",
        "costBRL": 0,
        "tip": "A feira de rua de 500 anos, todo domingo de manhã na Ribera de Curtidores; antiguidades nas galerias, vermute em La Latina depois"
      },
      {
        "name": "Mirador Faro de Moncloa",
        "category": "afternoon",
        "neighborhood": "Moncloa",
        "costBRL": 20,
        "tip": "Mirante de 92 m com vista 360º da cidade e da serra; barato e vazio, ao lado do Museo de América"
      },
      {
        "name": "Gran Vía (caminhada)",
        "category": "afternoon",
        "neighborhood": "Gran Vía",
        "costBRL": 0,
        "tip": "A Broadway madrilena: Metrópolis, Telefónica, cinemas e teatros; caminhe do Alcalá até a Plaza de España ao anoitecer"
      },
      {
        "name": "HanSo Café",
        "category": "breakfast",
        "neighborhood": "Malasaña",
        "costBRL": 50,
        "tip": "Café de especialidade e brunch asiático-espanhol em Malasaña; matcha e bolos, lota no fim de semana"
      },
      {
        "name": "Real Jardín Botánico",
        "category": "afternoon",
        "neighborhood": "Paseo del Arte",
        "costBRL": 30,
        "tip": "Jardim de 1781 ao lado do Prado, estufas e bonsais; o respiro entre dois museus"
      },
      {
        "name": "Juana La Loca (pintxos)",
        "category": "dinner",
        "neighborhood": "La Latina",
        "costBRL": 150,
        "tip": "Pintxos bascos na Puerta de Moros, com a tortilha de cebola caramelizada que todo mundo pede; mesas na rua"
      },
      {
        "name": "La Barraca (paella, 1935)",
        "category": "dinner",
        "neighborhood": "Chueca",
        "costBRL": 200,
        "tip": "A casa de paellas de Madri desde 1935, azulejos valencianos e arroz feito na hora; reserve"
      },
      {
        "name": "La Mallorquina (Puerta del Sol)",
        "category": "breakfast",
        "neighborhood": "Sol",
        "costBRL": 25,
        "tip": "Pastelaria de 1894 na Puerta del Sol; napolitana de chocolate ao balcão, de pé, como os madrilenos"
      },
      {
        "name": "Las Rozas Village (outlet)",
        "category": "morning",
        "neighborhood": "Las Rozas",
        "costBRL": 0,
        "tip": "Outlet de marcas europeias a 30 min do centro, ônibus Shopping Express saindo da Plaza de Oriente; devolução de IVA no local"
      },
      {
        "name": "Lhardy (1839)",
        "category": "lunch",
        "neighborhood": "Sol",
        "costBRL": 250,
        "tip": "Restaurante de 1839 na Carrera de San Jerónimo, o cozido madrileno dos reis; a loja da frente serve consomé de pé"
      },
      {
        "name": "Madrid Río (parque linear)",
        "category": "afternoon",
        "neighborhood": "Arganzuela",
        "costBRL": 0,
        "tip": "10 km de parque sobre a rodovia enterrada, pontes, fontes para crianças e aluguel de bicicleta; termina no Matadero"
      },
      {
        "name": "Matadero Madrid",
        "category": "afternoon",
        "neighborhood": "Arganzuela",
        "costBRL": 0,
        "tip": "Antigo matadouro virou centro cultural de 150 mil m²: exposições grátis, cinema, feiras e o Madrid Río ao lado"
      },
      {
        "name": "Mercado de San Antón",
        "category": "lunch",
        "neighborhood": "Chueca",
        "costBRL": 80,
        "tip": "Mercado de três andares em Chueca: compras embaixo, tapas no meio e terraço em cima"
      },
      {
        "name": "Mercado de San Miguel",
        "category": "lunch",
        "neighborhood": "Sol",
        "costBRL": 100,
        "tip": "Mercado de ferro de 1916 ao lado da Plaza Mayor, só bancas de tapas; caro e cheio, mas é a melhor primeira hora na cidade"
      },
      {
        "name": "Museo del Ferrocarril de Madrid",
        "category": "morning",
        "neighborhood": "Delicias",
        "costBRL": 40,
        "tip": "Locomotivas a vapor na antiga estação de Delicias; o programa de criança pequena que os adultos gostam"
      },
      {
        "name": "Palacio Real de Madrid",
        "category": "morning",
        "neighborhood": "Ópera",
        "costBRL": 80,
        "tip": "O maior palácio real da Europa Ocidental, 3.000 salas; compre com hora, veja a Armaria e a troca da guarda às quartas"
      },
      {
        "name": "Parque Warner Madrid",
        "category": "morning",
        "neighborhood": "San Martín de la Vega",
        "costBRL": 350,
        "tip": "Parque dos Looney Tunes, Batman e Superman a 30 km do centro; trem C-3 + ônibus ou carro, dia inteiro"
      },
      {
        "name": "Plaza Mayor",
        "category": "afternoon",
        "neighborhood": "Sol",
        "costBRL": 0,
        "tip": "A praça fechada de 1619, com a Casa de la Panadería pintada; evite os restaurantes da praça, use-a só como palco"
      },
      {
        "name": "Museo del Prado",
        "category": "morning",
        "neighborhood": "Paseo del Arte",
        "costBRL": 90,
        "tip": "Velázquez, Goya e Bosch numa das três maiores pinacotecas do mundo; grátis nas últimas 2h do dia, compre antes para pular fila"
      },
      {
        "name": "Primark Gran Vía",
        "category": "afternoon",
        "neighborhood": "Gran Vía",
        "costBRL": 0,
        "tip": "A maior Primark do mundo num palácio de 1924 com o átrio restaurado; roupa barata para a mala de volta"
      },
      {
        "name": "Puerta del Sol (Km 0 e El Oso y el Madroño)",
        "category": "afternoon",
        "neighborhood": "Sol",
        "costBRL": 0,
        "tip": "O centro da Espanha: o quilômetro zero no chão, o urso e o medronheiro e o relógio da virada do ano"
      },
      {
        "name": "Museo Reina Sofía (Guernica)",
        "category": "afternoon",
        "neighborhood": "Atocha",
        "costBRL": 70,
        "tip": "O Guernica de Picasso, Dalí e Miró no antigo hospital; grátis das 19h às 21h, de segunda a sábado"
      },
      {
        "name": "Parque de El Retiro (Palacio de Cristal e lago)",
        "category": "afternoon",
        "neighborhood": "Retiro",
        "costBRL": 0,
        "tip": "Barco a remo no lago, o Palácio de Cristal e o Anjo Caído; Patrimônio da Humanidade com o Paseo del Prado"
      },
      {
        "name": "Sala de Despiece",
        "category": "dinner",
        "neighborhood": "Chamberí",
        "costBRL": 180,
        "tip": "Balcão de aço inox onde cada prato é montado na sua frente; sem reserva, chegue às 20h30"
      },
      {
        "name": "Sala Equis",
        "category": "night",
        "neighborhood": "La Latina",
        "costBRL": 60,
        "tip": "Antigo cinema de filme adulto virou bar com telão, redes e sessões de cinema; a noite alternativa perto de Tirso de Molina"
      },
      {
        "name": "Chocolatería San Ginés (1894)",
        "category": "breakfast",
        "neighborhood": "Sol",
        "costBRL": 40,
        "tip": "Chocolate com churros desde 1894, aberto 24h; a fila é parte do rito, vá antes das 9h ou depois da meia-noite"
      },
      {
        "name": "StreetXO (El Corte Inglés Serrano)",
        "category": "dinner",
        "neighborhood": "Salamanca",
        "costBRL": 350,
        "tip": "A versão street food do DiverXO no último andar do El Corte Inglés de Serrano; balcão, fila, música alta"
      },
      {
        "name": "Templo de Debod (pôr do sol)",
        "category": "afternoon",
        "neighborhood": "Moncloa",
        "costBRL": 0,
        "tip": "Templo egípcio do século II a.C. doado à Espanha, no alto do Parque del Oeste; o pôr do sol mais fotografado de Madri"
      },
      {
        "name": "Museo Thyssen-Bornemisza",
        "category": "morning",
        "neighborhood": "Paseo del Arte",
        "costBRL": 75,
        "tip": "Coleção particular do gótico ao pop, o mais fácil dos três museus para quem não é de museu; segunda grátis"
      },
      {
        "name": "Toma Café",
        "category": "breakfast",
        "neighborhood": "Malasaña",
        "costBRL": 40,
        "tip": "A torrefação que começou a terceira onda em Madri; café filtrado e poucos lugares, para levar"
      },
      {
        "name": "Zoo Aquarium de Madrid",
        "category": "morning",
        "neighborhood": "Casa de Campo",
        "costBRL": 160,
        "tip": "Zoológico com pandas, aquário e golfinário dentro da Casa de Campo; metrô Casa de Campo, combine com o teleférico"
      }
    ],
    "hotels": [
      {
        "name": "Catalonia Puerta del Sol",
        "zone": "Sol/Centro",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Palácio do século XVIII com pátio interno e piscina no terraço, na Calle Atocha a 3 min do Sol"
      },
      {
        "name": "Four Seasons Hotel Madrid",
        "zone": "Sol/Centro",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 4.500-8.000",
        "tip": "Sete prédios históricos da Calle de Alcalá unidos em 2020, com a Galería Canalejas embaixo; o rooftop Dani Brasserie"
      },
      {
        "name": "Hostal Persal",
        "zone": "Sol/Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 400-650",
        "tip": "Hostal de família na Plaza del Ángel, quartos limpos com banheiro privativo a 3 min da Puerta del Sol"
      },
      {
        "name": "Only YOU Hotel Atocha",
        "zone": "La Latina/Lavapies",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Hotel de design em frente à estação de Atocha e ao Reina Sofía; o Trotamundos no térreo é ponto da cidade"
      },
      {
        "name": "Petit Palace Puerta del Sol",
        "zone": "Sol/Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "Rede espanhola econômica a 1 min da Puerta del Sol, quartos familiares com beliche"
      },
      {
        "name": "Room Mate Alba",
        "zone": "Sol/Centro",
        "tier": "mid",
        "personaTags": [
          "couple",
          "solo"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Boutique de design no Barrio de las Letras, terraço no telhado e café da manhã até meio-dia"
      },
      {
        "name": "Rosewood Villa Magna",
        "zone": "Salamanca",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 4.000-7.000",
        "tip": "O palácio moderno do Paseo de la Castellana, a 2 min da Calle Serrano; serviço de referência da cidade"
      },
      {
        "name": "The Westin Palace, Madrid",
        "zone": "Sol/Centro",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "O grande hotel de 1912 entre o Prado e o Thyssen, com a cúpula de vitral na rotunda do café"
      }
    ]
  },
  "Santiago": {
    "city": "Santiago",
    "items": [
      {
        "name": "Ambrosía Bistró",
        "category": "dinner",
        "neighborhood": "Providencia",
        "costBRL": 350,
        "tip": "A chef Carolina Bazán no Latin America's 50 Best, cozinha de mercado com vinhos naturais; reserve"
      },
      {
        "name": "Aquí Está Coco",
        "category": "dinner",
        "neighborhood": "Providencia",
        "costBRL": 280,
        "tip": "A marisqueira clássica de Santiago, congrio e centolla num casarão reconstruído; família chilena há 40 anos"
      },
      {
        "name": "Baco Vino y Bistró",
        "category": "dinner",
        "neighborhood": "Providencia",
        "costBRL": 220,
        "tip": "Bistrô francês com a melhor carta de vinhos por taça de Providencia; steak tartare e bife chorizo, reserve"
      },
      {
        "name": "Bar Nacional (Centro)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 60,
        "tip": "Restaurante de balcão de 1950 na Bandera, onde o centro almoça: lomo a lo pobre e cazuela; rápido e honesto"
      },
      {
        "name": "Bar The Clinic",
        "category": "night",
        "neighborhood": "Lastarria",
        "costBRL": 70,
        "tip": "O bar do jornal satírico, pisco sour e humor político nas paredes; o happy hour de Lastarria"
      },
      {
        "name": "Barrio Bellavista e Patio Bellavista",
        "category": "afternoon",
        "neighborhood": "Bellavista",
        "costBRL": 0,
        "tip": "Bairro boêmio de casas coloridas entre o Mapocho e o San Cristóbal; o Patio Bellavista concentra restaurantes e artesanato"
      },
      {
        "name": "Barrio Italia (design e antiquários)",
        "category": "afternoon",
        "neighborhood": "Providencia",
        "costBRL": 0,
        "tip": "Ruas de antiquários, lojas de design e cafés em casarões; o bairro para comprar o que não tem em shopping"
      },
      {
        "name": "Centro Gabriela Mistral GAM (Barrio Lastarria)",
        "category": "afternoon",
        "neighborhood": "Lastarria",
        "costBRL": 0,
        "tip": "O centro cultural GAM é a porta do bairro mais bonito do centro: feira de livros, cafés nas calçadas, o Santa Lucía em frente; onde ficar hospedado"
      },
      {
        "name": "Bate-volta ao Cajón del Maipo (Embalse El Yeso)",
        "category": "morning",
        "neighborhood": "San José de Maipo",
        "costBRL": 250,
        "tip": "Vale andino a 1h30 com a represa turquesa El Yeso a 2.500 m; tour ou carro 4x4, leve casaco mesmo no verão"
      },
      {
        "name": "Bate-volta a Isla Negra (casa de Neruda)",
        "category": "morning",
        "neighborhood": "El Quisco",
        "costBRL": 200,
        "tip": "A casa-museu de Neruda de frente para o Pacífico, 1h30 de ônibus; combine com as praias de El Quisco e Algarrobo"
      },
      {
        "name": "Bate-volta a Valle Nevado (neve)",
        "category": "morning",
        "neighborhood": "Lo Barnechea",
        "costBRL": 400,
        "tip": "A estação de esqui a 1h30 do centro, junho a setembro; fora da temporada, o passeio é a estrada de 60 curvas e a vista"
      },
      {
        "name": "Paseo 21 de Mayo, Valparaíso (bate-volta Valparaíso e Viña del Mar)",
        "category": "morning",
        "neighborhood": "Valparaíso",
        "costBRL": 150,
        "tip": "1h30 de ônibus: os elevadores e murais de Valparaíso de manhã, a praia e o relógio de flores de Viña à tarde"
      },
      {
        "name": "Museo Nacional de Bellas Artes",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Palácio de 1910 inspirado no Petit Palais, no Parque Forestal; gratuito, arte chilena e exposições temporárias"
      },
      {
        "name": "Bistró de la Barra",
        "category": "breakfast",
        "neighborhood": "Lastarria",
        "costBRL": 50,
        "tip": "Café de esquina em frente ao Bellas Artes, ovos, waffles e café de verdade; o café da manhã de Lastarria, lota no fim de semana"
      },
      {
        "name": "Bocanáriz (vinhos chilenos)",
        "category": "dinner",
        "neighborhood": "Lastarria",
        "costBRL": 200,
        "tip": "Wine bar com 300 vinhos chilenos por taça e voos de degustação; a aula de vinho do Chile num jantar, reserve"
      },
      {
        "name": "Boragó (Rodolfo Guzmán)",
        "category": "dinner",
        "neighborhood": "Vitacura",
        "costBRL": 900,
        "tip": "O restaurante do Chile no World's 50 Best, ingredientes endêmicos do deserto à Patagônia; menu único, reserve com semanas"
      },
      {
        "name": "Buin Zoo",
        "category": "morning",
        "neighborhood": "Buin",
        "costBRL": 110,
        "tip": "O maior zoológico do Chile, 40 min ao sul de carro ou trem Metrotren até Buin Zoo; dia inteiro com crianças"
      },
      {
        "name": "Café Cultura (Providencia)",
        "category": "breakfast",
        "neighborhood": "Providencia",
        "costBRL": 45,
        "tip": "Café de bairro com livros e café da manhã completo em Providencia; o jeito calmo de começar o dia"
      },
      {
        "name": "Castaño (padaria)",
        "category": "breakfast",
        "neighborhood": "Providencia",
        "costBRL": 25,
        "tip": "A rede de padarias dos chilenos, em toda esquina; marraqueta quente, café e pastel de folhado, de pé e barato"
      },
      {
        "name": "Cementerio General (tour)",
        "category": "morning",
        "neighborhood": "Recoleta",
        "costBRL": 0,
        "tip": "O cemitério-museu onde estão Allende, Violeta Parra e os presidentes do Chile; tours guiados nos fins de semana"
      },
      {
        "name": "Centro Cultural La Moneda",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Centro cultural subterrâneo sob a praça do palácio, exposições internacionais e a Cineteca Nacional"
      },
      {
        "name": "Cerro San Cristóbal (funicular e teleférico)",
        "category": "morning",
        "neighborhood": "Bellavista",
        "costBRL": 60,
        "tip": "Funicular de 1925 em Bellavista até a Virgem, teleférico até Providencia; vá cedo antes da neblina, mote con huesillo no topo"
      },
      {
        "name": "Cerro Santa Lucía",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O morro onde Santiago foi fundada em 1541, escadarias, fontes e mirante no meio do centro; gratuito"
      },
      {
        "name": "Chipe Libre (pisco)",
        "category": "dinner",
        "neighborhood": "Lastarria",
        "costBRL": 150,
        "tip": "A \"república independente do pisco\": piscos chilenos e peruanos lado a lado, pátio em Lastarria"
      },
      {
        "name": "Club La Feria",
        "category": "night",
        "neighborhood": "Bellavista",
        "costBRL": 100,
        "tip": "A pista de música eletrônica de Bellavista desde 1998, DJs internacionais; abre depois da meia-noite"
      },
      {
        "name": "Colmado Coffee & Bakery (Merced, Lastarria)",
        "category": "breakfast",
        "neighborhood": "Lastarria",
        "costBRL": 50,
        "tip": "Café de especialidade e padaria própria em Lastarria; o brunch de sábado com pão de fermentação natural"
      },
      {
        "name": "Viña Concha y Toro (Casillero del Diablo)",
        "category": "afternoon",
        "neighborhood": "Pirque",
        "costBRL": 150,
        "tip": "A vinícola mais visitada do Chile, 1h ao sul: tour com a lenda da adega do diabo e degustação; metrô Las Mercedes + táxi"
      },
      {
        "name": "Costanera Center",
        "category": "afternoon",
        "neighborhood": "Providencia",
        "costBRL": 0,
        "tip": "O maior shopping da América do Sul, embaixo da torre do Sky Costanera; Falabella, Paris e marcas que não chegam ao Brasil"
      },
      {
        "name": "El Hoyo (1912)",
        "category": "lunch",
        "neighborhood": "Estación Central",
        "costBRL": 80,
        "tip": "Picada de 1912 perto da Estación Central, pernil, arrollado e o terremoto original; só almoço, feche com o vinho da casa"
      },
      {
        "name": "Fuente Alemana (lomito)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 60,
        "tip": "O lomito e o churrasco italiano mais famosos do Chile, no balcão da Alameda desde 1958; Anthony Bourdain veio aqui"
      },
      {
        "name": "Galindo (Bellavista)",
        "category": "lunch",
        "neighborhood": "Bellavista",
        "costBRL": 70,
        "tip": "Picada de 1960 em Bellavista com pastel de choclo, porotos granados e terremoto; comida chilena de casa"
      },
      {
        "name": "La Chascona (casa de Pablo Neruda)",
        "category": "afternoon",
        "neighborhood": "Bellavista",
        "costBRL": 60,
        "tip": "A casa que Neruda construiu para a amante no pé do San Cristóbal, labirinto de objetos; audioguia incluído"
      },
      {
        "name": "La Mar Cebichería (Vitacura)",
        "category": "dinner",
        "neighborhood": "Vitacura",
        "costBRL": 250,
        "tip": "A cevicheria de Gastón Acurio em Vitacura, peixe do Pacífico chileno com técnica peruana; terraço"
      },
      {
        "name": "Palacio de La Moneda",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O palácio presidencial de 1805; troca da guarda em dias alternados às 10h, visita guiada grátis com agendamento"
      },
      {
        "name": "La Vega Central",
        "category": "lunch",
        "neighborhood": "Recoleta",
        "costBRL": 40,
        "tip": "O mercado popular de frutas e comida do outro lado do Mapocho; cazuela e pastel de choclo no andar de cima, preço de chileno"
      },
      {
        "name": "Liguria (Providencia)",
        "category": "lunch",
        "neighborhood": "Providencia",
        "costBRL": 90,
        "tip": "Bar-restaurante boêmio com paredes de cartazes antigos, comida chilena e pisco sour; lota à noite, almoce tranquilo"
      },
      {
        "name": "Mercado Central de Santiago",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 100,
        "tip": "Mercado de ferro de 1872, peixe e frutos do mar; coma nas bancas da periferia, não no centro turístico (Donde Augusto é a exceção)"
      },
      {
        "name": "Museo Interactivo Mirador (MIM)",
        "category": "morning",
        "neighborhood": "La Granja",
        "costBRL": 70,
        "tip": "O melhor museu de ciência interativo da América do Sul, 14 salas para tocar em tudo; metrô Mirador, dia de chuva resolvido"
      },
      {
        "name": "Museo de la Memoria y los Derechos Humanos",
        "category": "afternoon",
        "neighborhood": "Quinta Normal",
        "costBRL": 0,
        "tip": "Museu da ditadura de 1973–1990, gratuito e necessário; pesado para crianças pequenas, essencial para adultos"
      },
      {
        "name": "Museo Chileno de Arte Precolombino",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 50,
        "tip": "O melhor museu da cidade: 3.000 anos de arte das Américas, a sala Chile antes de Chile no subsolo"
      },
      {
        "name": "Parque Arauco",
        "category": "afternoon",
        "neighborhood": "Las Condes",
        "costBRL": 0,
        "tip": "O shopping de luxo de Las Condes, Distrito de Lujo e boulevard de restaurantes ao ar livre"
      },
      {
        "name": "Parque Bicentenario",
        "category": "afternoon",
        "neighborhood": "Vitacura",
        "costBRL": 0,
        "tip": "Parque de Vitacura com lagoa de flamingos e cisnes, parquinhos e a cordilheira ao fundo; piquenique de domingo"
      },
      {
        "name": "Parque Quinta Normal (Museo de Historia Natural)",
        "category": "morning",
        "neighborhood": "Quinta Normal",
        "costBRL": 0,
        "tip": "Parque de 1841 com lago de pedalinho e o Museu de História Natural gratuito; o esqueleto de baleia é o ímã das crianças"
      },
      {
        "name": "Peumayén Ancestral Food",
        "category": "dinner",
        "neighborhood": "Bellavista",
        "costBRL": 250,
        "tip": "Cozinha dos povos originários (mapuche, rapa nui, aimará) em Bellavista; comece pela cesta de pães ancestrais"
      },
      {
        "name": "Plaza de Armas e Catedral Metropolitana",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A praça fundadora com a catedral, o Correio Central e os artistas de rua; comece a cidade aqui"
      },
      {
        "name": "Pueblito Los Dominicos (artesanato)",
        "category": "afternoon",
        "neighborhood": "Las Condes",
        "costBRL": 0,
        "tip": "Vila de artesãos ao lado da igreja colonial, lápis-lazúli, cerâmica e lã; fim da linha 1 do metrô, o souvenir certo"
      },
      {
        "name": "Siete Negronis",
        "category": "night",
        "neighborhood": "Providencia",
        "costBRL": 90,
        "tip": "Coquetelaria de autor em Providencia, sempre no ranking dos melhores bares da América Latina; reserve"
      },
      {
        "name": "Sky Costanera",
        "category": "afternoon",
        "neighborhood": "Providencia",
        "costBRL": 110,
        "tip": "O mirante mais alto da América Latina (300 m) na Gran Torre; vá ao pôr do sol para ver a cordilheira acender"
      },
      {
        "name": "Teatro Municipal de Santiago",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 150,
        "tip": "A ópera de 1857, temporada de ópera, balé e concertos; ingressos baratos na galeria, visitas guiadas de dia"
      },
      {
        "name": "Thelonious, Lugar de Jazz",
        "category": "night",
        "neighborhood": "Bellavista",
        "costBRL": 80,
        "tip": "O clube de jazz de Santiago numa casa antiga de Bellavista, show todas as noites; pequeno, chegue cedo"
      },
      {
        "name": "Wonderland Café",
        "category": "breakfast",
        "neighborhood": "Lastarria",
        "costBRL": 50,
        "tip": "Café temático de Alice no País das Maravilhas, mesas no pátio; waffles e chocolate quente, crianças adoram"
      }
    ],
    "hotels": [
      {
        "name": "Hotel Cumbres Lastarria",
        "zone": "Lastarria/Bellas Artes",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.100",
        "tip": "Rede chilena no coração de Lastarria, piscina no terraço e quartos amplos; bom para família"
      },
      {
        "name": "Hostal Forestal",
        "zone": "Lastarria/Bellas Artes",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 150-350",
        "tip": "Hostel em casarão em frente ao Parque Forestal, quartos privativos e terraço; a 2 min do metrô Bellas Artes"
      },
      {
        "name": "Ibis Santiago Providencia",
        "zone": "Providencia",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 300-450",
        "tip": "Ibis a 3 min do metrô Manuel Montt, padrão previsível e café da manhã barato; base segura para família"
      },
      {
        "name": "Hotel Boutique Le Rêve",
        "zone": "Providencia",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Casa francesa de 1920 em Providencia com jardim e 31 quartos; café da manhã elogiado, rua tranquila"
      },
      {
        "name": "Hotel Magnolia",
        "zone": "Lastarria/Bellas Artes",
        "tier": "mid",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Casarão de 1929 em Lastarria com anexo de vidro e terraço com vista do Santa Lucía; o boutique da cidade"
      },
      {
        "name": "Mandarin Oriental, Santiago",
        "zone": "Las Condes/Vitacura",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.800-3.200",
        "tip": "O antigo Grand Hyatt, torre com átrio de 24 andares e a piscina de lagoa com cascata; família com crianças aprova"
      },
      {
        "name": "The Ritz-Carlton, Santiago",
        "zone": "Las Condes/Vitacura",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.000-3.500",
        "tip": "Ritz no bairro El Golf, piscina sob cúpula de vidro no último andar; metrô El Golf na porta"
      },
      {
        "name": "The Singular Santiago, Lastarria",
        "zone": "Lastarria/Bellas Artes",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 1.800-3.000",
        "tip": "O hotel de luxo de Lastarria, estilo parisiense, rooftop com piscina e bar de vista; serviço chileno de ponta"
      }
    ]
  },
  "Miami": {
    "city": "Miami",
    "items": [
      {
        "name": "Art Deco Walking Tour (Miami Design Preservation League)",
        "category": "morning",
        "neighborhood": "South Beach",
        "costBRL": 150,
        "tip": "Tour guiado diário às 10h30 saindo do Art Deco Welcome Center, Ocean Drive; o jeito de entender os prédios pastel"
      },
      {
        "name": "Aventura Mall (19501 Biscayne Blvd)",
        "category": "afternoon",
        "neighborhood": "Aventura",
        "costBRL": 0,
        "tip": "O terceiro maior shopping dos EUA, 300 lojas, Apple, Zara e o escorregador de 28 m; 30 min ao norte"
      },
      {
        "name": "Bal Harbour Shops",
        "category": "afternoon",
        "neighborhood": "Bal Harbour",
        "costBRL": 0,
        "tip": "O shopping de luxo ao ar livre com carpas e jardins, Chanel a Gucci; só olhar já vale, almoce no Makoto"
      },
      {
        "name": "Ball & Chain (Little Havana)",
        "category": "night",
        "neighborhood": "Little Havana",
        "costBRL": 120,
        "tip": "O clube de 1935 da Calle Ocho reaberto com salsa ao vivo e o palco em forma de abacaxi; mojito e dança, sem ingresso"
      },
      {
        "name": "Bate-volta ao Everglades National Park (aerobarco)",
        "category": "morning",
        "neighborhood": "Everglades",
        "costBRL": 250,
        "tip": "1h a oeste: aerobarco entre os jacarés em Everglades Safari Park ou Shark Valley de bicicleta; leve repelente, vá de manhã"
      },
      {
        "name": "Bate-volta a Fort Lauderdale (canais e Las Olas)",
        "category": "morning",
        "neighborhood": "Fort Lauderdale",
        "costBRL": 150,
        "tip": "A Veneza da América a 40 min pela Brightline: barco pelos canais das mansões, Las Olas Boulevard e a praia mais calma"
      },
      {
        "name": "Bate-volta a Key West",
        "category": "morning",
        "neighborhood": "Key West",
        "costBRL": 400,
        "tip": "3h30 pela Overseas Highway e a Ponte das 7 Milhas até o fim dos EUA; a casa de Hemingway e o pôr do sol em Mallory Square. Longo: considere dormir lá"
      },
      {
        "name": "Bayside Marketplace e passeio de barco pela baía",
        "category": "afternoon",
        "neighborhood": "Downtown",
        "costBRL": 200,
        "tip": "Centro de compras na marina de Downtown, saída dos barcos de 90 min pela Biscayne Bay com as mansões de Star Island"
      },
      {
        "name": "Big Pink (South Beach)",
        "category": "breakfast",
        "neighborhood": "South Beach",
        "costBRL": 90,
        "tip": "Diner rosa gigante de South Beach com panquecas de prato e cardápio de 200 itens; aberto até tarde, crianças adoram"
      },
      {
        "name": "Bill Baggs Cape Florida State Park (farol)",
        "category": "afternoon",
        "neighborhood": "Key Biscayne",
        "costBRL": 50,
        "tip": "A ponta de Key Biscayne com o farol de 1825 e a praia sempre entre as melhores dos EUA; suba os 109 degraus do farol"
      },
      {
        "name": "Bodega Taqueria y Tequila (South Beach)",
        "category": "night",
        "neighborhood": "South Beach",
        "costBRL": 120,
        "tip": "Taqueria de frente, speakeasy atrás da porta de banheiro químico; tacos e tequila até as 3h"
      },
      {
        "name": "Brickell City Centre",
        "category": "afternoon",
        "neighborhood": "Brickell",
        "costBRL": 0,
        "tip": "Shopping aberto de arquitetura moderna no coração de Brickell, Saks e restaurantes; ande pela Brickell Avenue depois"
      },
      {
        "name": "Carbone Miami",
        "category": "dinner",
        "neighborhood": "South Beach",
        "costBRL": 600,
        "tip": "O ítalo-americano de Nova York em South Beach, rigatoni à vodca e garçons de smoking; reservas abrem 30 dias antes e somem"
      },
      {
        "name": "Coconut Grove (CocoWalk e Peacock Park)",
        "category": "afternoon",
        "neighborhood": "Coconut Grove",
        "costBRL": 0,
        "tip": "O bairro mais antigo e arborizado de Miami, à beira da baía; CocoWalk, pavões soltos e o Peacock Park"
      },
      {
        "name": "COTE Miami",
        "category": "dinner",
        "neighborhood": "Design District",
        "costBRL": 500,
        "tip": "Churrasco coreano com estrela Michelin no Design District; o Butcher's Feast para dividir, reserve"
      },
      {
        "name": "Coyo Taco (Wynwood)",
        "category": "lunch",
        "neighborhood": "Wynwood",
        "costBRL": 80,
        "tip": "Tacos de rua em Wynwood com bar escondido atrás; fila, mas anda rápido"
      },
      {
        "name": "Crandon Park Beach (Key Biscayne)",
        "category": "morning",
        "neighborhood": "Key Biscayne",
        "costBRL": 40,
        "tip": "Praia de família em Key Biscayne, água rasa e calma, palmeiras e churrasqueiras; estacionamento pago, chegue antes das 10h"
      },
      {
        "name": "Institute of Contemporary Art Miami (Design District)",
        "category": "afternoon",
        "neighborhood": "Design District",
        "costBRL": 0,
        "tip": "Museu de arte contemporânea gratuito no meio do bairro de lojas de luxo e arquitetura de assinatura; saia andando até o Fly's Eye Dome"
      },
      {
        "name": "Do Not Sit On The Furniture",
        "category": "night",
        "neighborhood": "South Beach",
        "costBRL": 150,
        "tip": "Clube pequeno de house e techno em South Beach, sem VIP e sem celebridade; a pista para quem quer dançar, não ser visto"
      },
      {
        "name": "Dolphin Mall (outlet)",
        "category": "afternoon",
        "neighborhood": "Sweetwater",
        "costBRL": 0,
        "tip": "O outlet mais perto do centro, 240 lojas e preço de outlet; o shopping dos brasileiros, com motivo"
      },
      {
        "name": "Fairchild Tropical Botanic Garden",
        "category": "morning",
        "neighborhood": "Coral Gables",
        "costBRL": 140,
        "tip": "Jardim botânico tropical de 34 hectares, estufa de borboletas e o bonde que percorre os lagos; manhã, antes do calor"
      },
      {
        "name": "Frost Science Museum",
        "category": "morning",
        "neighborhood": "Downtown",
        "costBRL": 170,
        "tip": "Museu de ciência com aquário de 3 andares que se olha por baixo e planetário; ao lado do PAMM, meio dia com crianças"
      },
      {
        "name": "Garcia's Seafood Grille & Fish Market",
        "category": "lunch",
        "neighborhood": "Downtown",
        "costBRL": 130,
        "tip": "Peixaria com mesas no deck do Miami River, peixe do dia grelhado e stone crab na temporada; só almoço e começo de noite"
      },
      {
        "name": "Haulover Beach Park",
        "category": "morning",
        "neighborhood": "Bal Harbour",
        "costBRL": 40,
        "tip": "Praia larga e tranquila ao norte com o Haulover Inlet (os barcos pulando onda são atração); a parte norte é naturista, fique ao sul"
      },
      {
        "name": "Joe's Stone Crab (1913)",
        "category": "dinner",
        "neighborhood": "South Beach",
        "costBRL": 450,
        "tip": "A instituição de 1913 em South Beach, garras de stone crab com mostarda (outubro a maio); sem reserva, fila de 1h, ou o take away ao lado"
      },
      {
        "name": "Jungle Island",
        "category": "morning",
        "neighborhood": "Watson Island",
        "costBRL": 250,
        "tip": "Parque de animais e aventura na ilha entre Downtown e South Beach, tirolesa e preguiças; dia inteiro com crianças pequenas"
      },
      {
        "name": "KYU (Wynwood)",
        "category": "dinner",
        "neighborhood": "Wynwood",
        "costBRL": 400,
        "tip": "Asiático na brasa de madeira em Wynwood, as costelas e o bolo de coco que todo mundo pede; reserve com dias"
      },
      {
        "name": "La Sandwicherie (South Beach)",
        "category": "lunch",
        "neighborhood": "South Beach",
        "costBRL": 70,
        "tip": "Balcão francês de sanduíches em South Beach desde 1988, aberto até as 5h; peça com o molho da casa"
      },
      {
        "name": "Lagniappe House",
        "category": "night",
        "neighborhood": "Midtown",
        "costBRL": 120,
        "tip": "Jardim de luzes com vinho, queijo e jazz ao vivo todas as noites em Midtown; a noite sem fila de Miami"
      },
      {
        "name": "Las Olas Café (South Beach)",
        "category": "breakfast",
        "neighborhood": "South Beach",
        "costBRL": 40,
        "tip": "Janela cubana a 2 quadras da praia: cafecito, pastelito de goiaba e sanduíche cubano; de pé, barato"
      },
      {
        "name": "Lincoln Road Mall",
        "category": "afternoon",
        "neighborhood": "South Beach",
        "costBRL": 0,
        "tip": "Rua de pedestres de compras e cafés de South Beach, da praia à baía; o Lincoln Road 1111 (garagem de Herzog & de Meuron) no fim"
      },
      {
        "name": "Little Havana (Calle Ocho e Domino Park)",
        "category": "afternoon",
        "neighborhood": "Little Havana",
        "costBRL": 0,
        "tip": "A Calle Ocho entre a 12th e a 17th Avenue: Domino Park, charutarias, Ball & Chain e o sorvete Azucar; sexta é o Viernes Culturales"
      },
      {
        "name": "Mandolin Aegean Bistro",
        "category": "lunch",
        "neighborhood": "Design District",
        "costBRL": 200,
        "tip": "Pátio grego-turco de azul e branco no Design District, o almoço bonito de Miami; reserve a mesa do jardim"
      },
      {
        "name": "Mango's Tropical Cafe",
        "category": "night",
        "neighborhood": "South Beach",
        "costBRL": 200,
        "tip": "O show de dança latina de Ocean Drive, turístico e divertido; jantar com espetáculo, famílias cabem cedo"
      },
      {
        "name": "Michael's Genuine Food & Drink",
        "category": "dinner",
        "neighborhood": "Design District",
        "costBRL": 300,
        "tip": "O restaurante que inventou o Design District gastronômico, cozinha americana de produto; pátio, bom para família"
      },
      {
        "name": "Ocean Drive",
        "category": "afternoon",
        "neighborhood": "South Beach",
        "costBRL": 0,
        "tip": "A avenida art déco de frente para a praia, com a Villa Casa Casuarina (Versace); caminhe ao anoitecer com os neons acesos, coma em outro lugar"
      },
      {
        "name": "Pérez Art Museum Miami (PAMM)",
        "category": "morning",
        "neighborhood": "Downtown",
        "costBRL": 90,
        "tip": "Museu de arte contemporânea de Herzog & de Meuron com jardins suspensos sobre a baía; o deck é o melhor lugar da cidade para um café"
      },
      {
        "name": "Panther Coffee (Wynwood)",
        "category": "breakfast",
        "neighborhood": "Wynwood",
        "costBRL": 50,
        "tip": "A torrefação que fez Wynwood acordar; café filtrado e pátio, antes de ver os murais"
      },
      {
        "name": "Prime 112",
        "category": "dinner",
        "neighborhood": "South Beach",
        "costBRL": 600,
        "tip": "A steakhouse de celebridades de South Beach, no hotel Browns de 1915; caro, barulhento e exatamente o que promete"
      },
      {
        "name": "Puerto Sagua (cubano em South Beach)",
        "category": "lunch",
        "neighborhood": "South Beach",
        "costBRL": 80,
        "tip": "Diner cubano de 1962 na Collins, o antídoto aos preços de Ocean Drive; vaca frita e batido de mamey"
      },
      {
        "name": "Rusty Pelican (Key Biscayne)",
        "category": "dinner",
        "neighborhood": "Key Biscayne",
        "costBRL": 350,
        "tip": "A vista do skyline de Miami sobre a baía, a partir da ilha de Key Biscayne; vá para o pôr do sol, peça o terraço"
      },
      {
        "name": "Sanguich de Miami (Little Havana)",
        "category": "lunch",
        "neighborhood": "Little Havana",
        "costBRL": 80,
        "tip": "O sanduíche cubano levado a sério, pão e carnes feitos na casa, na Calle Ocho; balcão pequeno, fila que vale"
      },
      {
        "name": "Sawgrass Mills (outlet)",
        "category": "morning",
        "neighborhood": "Sunrise",
        "costBRL": 0,
        "tip": "O maior outlet dos EUA, 350 lojas e o Colonnade de luxo, 50 min ao norte; dia inteiro, vá de carro ou shuttle"
      },
      {
        "name": "South Beach (praia e guaritas coloridas)",
        "category": "morning",
        "neighborhood": "South Beach",
        "costBRL": 0,
        "tip": "A praia dos postais, da 5th à 15th Street; cadeiras alugadas são caras, leve a sua, e fotografe as guaritas de salva-vidas"
      },
      {
        "name": "South Pointe Park",
        "category": "afternoon",
        "neighborhood": "South Beach",
        "costBRL": 0,
        "tip": "O parque na ponta sul de South Beach, onde os navios de cruzeiro passam colados; parquinho com água, pôr do sol"
      },
      {
        "name": "Stubborn Seed",
        "category": "dinner",
        "neighborhood": "South Beach",
        "costBRL": 550,
        "tip": "Estrela Michelin do chef Jeremy Ford em South Beach, menu degustação de 7 pratos; reserve"
      },
      {
        "name": "Sugar (rooftop do EAST Miami)",
        "category": "night",
        "neighborhood": "Brickell",
        "costBRL": 150,
        "tip": "Jardim-bar no 40º andar do EAST, em Brickell, a vista mais alta da noite; drinques asiáticos, vá cedo para pegar lugar"
      },
      {
        "name": "Threefold Café (Coral Gables)",
        "category": "breakfast",
        "neighborhood": "Coral Gables",
        "costBRL": 80,
        "tip": "Brunch australiano em Coral Gables, avocado toast e café flat white; fila no fim de semana"
      },
      {
        "name": "Venetian Pool (Coral Gables)",
        "category": "afternoon",
        "neighborhood": "Coral Gables",
        "costBRL": 120,
        "tip": "Piscina pública de 1924 escavada numa pedreira de coral, com cavernas e cascatas; crianças a partir de 3 anos, fecha no inverno"
      },
      {
        "name": "Versailles Restaurant (Little Havana)",
        "category": "lunch",
        "neighborhood": "Little Havana",
        "costBRL": 90,
        "tip": "O restaurante cubano mais famoso do mundo, desde 1971; ropa vieja, moros e a janela de cafecito onde Miami discute política"
      },
      {
        "name": "Vizcaya Museum & Gardens",
        "category": "morning",
        "neighborhood": "Coconut Grove",
        "costBRL": 130,
        "tip": "Vila renascentista italiana de 1916 na baía, com jardins formais e a barcaça de pedra; compre antes, fecha terça"
      },
      {
        "name": "Wynwood Walls",
        "category": "morning",
        "neighborhood": "Wynwood",
        "costBRL": 70,
        "tip": "O museu a céu aberto de grafite que transformou o bairro de armazéns; ingresso para o pátio, as ruas em volta são grátis"
      },
      {
        "name": "Zak the Baker",
        "category": "breakfast",
        "neighborhood": "Wynwood",
        "costBRL": 60,
        "tip": "Padaria kosher de fermentação natural, a melhor de Miami; babka, challah e sanduíches, fecha no sábado"
      },
      {
        "name": "Zoo Miami",
        "category": "morning",
        "neighborhood": "South Miami-Dade",
        "costBRL": 150,
        "tip": "O maior zoológico da Flórida, sem jaulas, 45 min do centro de carro; alugue o carrinho elétrico, o parque é enorme"
      }
    ],
    "hotels": [
      {
        "name": "1 Hotel South Beach",
        "zone": "South Beach",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 3.500-6.000",
        "tip": "Hotel sustentável de madeira e plantas na Collins com a 23rd, 4 piscinas e a melhor rooftop de South Beach"
      },
      {
        "name": "Hotel Croydon",
        "zone": "South Beach",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Art déco de 1937 restaurado em Mid-Beach, piscina e praia a 1 quadra; o preço justo de Miami Beach"
      },
      {
        "name": "Fontainebleau Miami Beach",
        "zone": "South Beach",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 2.500-4.500",
        "tip": "O resort de 1954 de Frank Sinatra, 11 piscinas, praia privativa e a LIV; grande, cheio e icônico"
      },
      {
        "name": "Four Seasons Hotel Miami",
        "zone": "Brickell",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 3.000-5.000",
        "tip": "Torre de 70 andares em Brickell com terraço de piscinas no 7º andar e vista da baía; o luxo da cidade, não da praia"
      },
      {
        "name": "Freehand Miami",
        "zone": "South Beach",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Hostel de design em Mid-Beach com quartos privativos, piscina e o Broken Shaker, um dos melhores bares dos EUA"
      },
      {
        "name": "Generator Miami",
        "zone": "South Beach",
        "tier": "budget",
        "personaTags": [
          "solo",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 450-800",
        "tip": "Hostel-hotel na Collins com piscina e quartos privativos; a 2 quadras da praia, preço de hostel em Miami Beach"
      },
      {
        "name": "Hyatt Centric South Beach Miami",
        "zone": "South Beach",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.200-2.000",
        "tip": "Hyatt moderno na Collins com a 16th, piscina no terraço e 3 min da praia e da Lincoln Road"
      },
      {
        "name": "Novotel Miami Brickell",
        "zone": "Brickell",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 800-1.300",
        "tip": "Novotel no coração de Brickell com piscina no 10º andar, a 5 min do Brickell City Centre; base para quem vai de carro aos outlets"
      }
    ]
  },
  "Florianópolis": {
    "city": "Florianópolis",
    "items": [
      {
        "name": "Fortaleza de Anhatomirim (escuna)",
        "category": "morning",
        "neighborhood": "Canasvieiras",
        "costBRL": 150,
        "tip": "Escuna de Canasvieiras com golfinhos no caminho até a fortaleza de 1744 numa ilha; parada para banho, dia inteiro"
      },
      {
        "name": "Arbor Café (Lagoa da Conceição)",
        "category": "breakfast",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 45,
        "tip": "Cafeteria de especialidade no Centro com brunch e pães da casa; mesa na rua, bom para trabalhar"
      },
      {
        "name": "Artusi Ristorante (Centro)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 160,
        "tip": "Italiano clássico do Centro, massas frescas e carta de vinhos; o jantar de ocasião perto da Beira-Mar"
      },
      {
        "name": "Bar do Arante (Pântano do Sul)",
        "category": "lunch",
        "neighborhood": "Pântano do Sul",
        "costBRL": 120,
        "tip": "Restaurante de pé na areia desde 1958 com o teto coberto de bilhetes dos clientes; peixe frito e sequência de camarão"
      },
      {
        "name": "Projeto Tamar (Barra da Lagoa)",
        "category": "afternoon",
        "neighborhood": "Barra da Lagoa",
        "costBRL": 40,
        "tip": "Centro de visitantes das tartarugas marinhas na Barra da Lagoa; combine com a ponte pênsil e a Prainha"
      },
      {
        "name": "Basílico Pizzaria (Lagoa da Conceição)",
        "category": "dinner",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 90,
        "tip": "Pizza napolitana na Lagoa, forno a lenha e fila na porta; crianças e grupos, sem reserva"
      },
      {
        "name": "Bate-volta ao Beto Carrero World (Penha)",
        "category": "morning",
        "neighborhood": "Penha",
        "costBRL": 350,
        "tip": "O maior parque temático da América Latina, 1h30 ao norte; compre online, chegue na abertura, dia inteiro"
      },
      {
        "name": "Bate-volta à Guarda do Embaú",
        "category": "morning",
        "neighborhood": "Palhoça",
        "costBRL": 50,
        "tip": "Vila de surfe 50 min ao sul: atravesse o rio de canoa até a praia e suba a Pedra do Urubu; reserva mundial de surfe"
      },
      {
        "name": "Bate-volta a Balneário Camboriú (Parque Unipraias)",
        "category": "morning",
        "neighborhood": "Balneário Camboriú",
        "costBRL": 200,
        "tip": "Bondinho sobre a mata até a Praia de Laranjeiras e a roda-gigante da orla; 1h30 de carro, combine com o Beto Carrero no dia seguinte"
      },
      {
        "name": "Beira-Mar Norte (orla à noite)",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A avenida da orla do Centro iluminada, caminhada e bares com a Ponte Hercílio Luz acesa ao fundo"
      },
      {
        "name": "Beiramar Shopping",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O shopping da Beira-Mar Norte, cinema e praça de alimentação; o programa de chuva do Centro"
      },
      {
        "name": "Box 32 (Mercado Público)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 80,
        "tip": "O bar mais famoso do Mercado Público, bolinho de bacalhau e chope no vão central; lota na sexta à tarde"
      },
      {
        "name": "Café Cultura (Lagoa da Conceição)",
        "category": "breakfast",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 45,
        "tip": "A rede de cafés da ilha, pão na chapa e café coado; a unidade da Lagoa é a base para o dia de praia do leste"
      },
      {
        "name": "Café das Artes (Lagoa da Conceição)",
        "category": "breakfast",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 50,
        "tip": "Café com ateliê e livros na Lagoa, bolos caseiros e brunch no fim de semana"
      },
      {
        "name": "Praia do Campeche",
        "category": "morning",
        "neighborhood": "Campeche",
        "costBRL": 0,
        "tip": "Praia longa e aberta do sul, com a Ilha do Campeche em frente; o Riozinho tem água calma para crianças"
      },
      {
        "name": "Chef Fedoca (Praia Mole)",
        "category": "lunch",
        "neighborhood": "Praia Mole",
        "costBRL": 130,
        "tip": "Frutos do mar na beira da Praia Mole, o almoço depois do mar; o chef comanda a cozinha aberta"
      },
      {
        "name": "Costa da Lagoa (barco pela Lagoa)",
        "category": "afternoon",
        "neighborhood": "Costa da Lagoa",
        "costBRL": 30,
        "tip": "Barco de linha da Lagoa da Conceição pelos vilarejos sem carro da costa; desça para a cachoeira e volte no fim da tarde"
      },
      {
        "name": "Casa da Alfândega (artesanato)",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "Artesanato catarinense na antiga alfândega de 1875 ao lado do Mercado Público: renda de bilro, cerâmica, cestaria"
      },
      {
        "name": "Floripa Shopping",
        "category": "afternoon",
        "neighborhood": "Saco Grande",
        "costBRL": 0,
        "tip": "Shopping da SC-401, a caminho das praias do norte; Decathlon e supermercado para abastecer a casa de praia"
      },
      {
        "name": "Fogo e Mar (Jurerê Internacional)",
        "category": "dinner",
        "neighborhood": "Jurerê Internacional",
        "costBRL": 200,
        "tip": "Frutos do mar e carnes na brasa em Jurerê Internacional; o jantar do norte da ilha, reserve no verão"
      },
      {
        "name": "Fortaleza de São José da Ponta Grossa",
        "category": "morning",
        "neighborhood": "Jurerê",
        "costBRL": 20,
        "tip": "Forte de 1740 entre Jurerê e a Daniela, canhões e vista da baía; trilha curta, ingresso barato"
      },
      {
        "name": "Freguesia Oyster Bar (Santo Antônio de Lisboa)",
        "category": "dinner",
        "neighborhood": "Santo Antônio de Lisboa",
        "costBRL": 150,
        "tip": "Ostras frescas e drinques de frente para a baía, no vilarejo açoriano; o pôr do sol vira jantar"
      },
      {
        "name": "Iguatemi Florianópolis",
        "category": "afternoon",
        "neighborhood": "Santa Mônica",
        "costBRL": 0,
        "tip": "O shopping das marcas na Santa Mônica, a caminho da Lagoa; Zara, Apple e restaurantes"
      },
      {
        "name": "Ilha do Campeche",
        "category": "morning",
        "neighborhood": "Campeche",
        "costBRL": 150,
        "tip": "Barco da Armação ou da Barra da Lagoa até a ilha de água transparente e inscrições rupestres; vagas limitadas, compre antes"
      },
      {
        "name": "Bistrô Isadora Duncan",
        "category": "breakfast",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 70,
        "tip": "Bistrô de brunch de frente para a Lagoa, ovos, waffles e mesa no jardim; reserve no domingo"
      },
      {
        "name": "Praia da Joaquina e Dunas",
        "category": "morning",
        "neighborhood": "Joaquina",
        "costBRL": 30,
        "tip": "Praia do surfe e as dunas de sandboard ao lado (prancha alugada na entrada); vento forte, leve casaco mesmo no verão"
      },
      {
        "name": "John Bull Pub (Lagoa da Conceição)",
        "category": "night",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 80,
        "tip": "O pub de rock da Lagoa desde 1998, shows ao vivo quase toda noite; o começo da noite da ilha"
      },
      {
        "name": "Praia de Jurerê Internacional",
        "category": "afternoon",
        "neighborhood": "Jurerê Internacional",
        "costBRL": 0,
        "tip": "A praia de mar calmo e beach clubs do norte, Open Shopping e mansões; família de manhã, festa à tarde"
      },
      {
        "name": "Lagoinha do Leste (trilha)",
        "category": "morning",
        "neighborhood": "Pântano do Sul",
        "costBRL": 0,
        "tip": "Trilha de 1h30 a partir do Pântano do Sul até a praia deserta mais bonita da ilha; água, protetor, sem estrutura"
      },
      {
        "name": "Lighthouse Coffee (Centro)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 40,
        "tip": "Café de especialidade no Centro, torra própria e métodos; para começar o dia antes do Mercado Público"
      },
      {
        "name": "Macarronada Italiana (Centro)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 100,
        "tip": "Cantina do Centro desde 1979, massas de família e pizza; o jantar barato e farto depois do Mercado"
      },
      {
        "name": "Mangue Seco (Lagoa da Conceição)",
        "category": "dinner",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 120,
        "tip": "Moqueca e frutos do mar na Avenida das Rendeiras, de frente para a Lagoa; mesa na rua no verão"
      },
      {
        "name": "Mercado Público de Florianópolis",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Mercado de 1899 restaurado, café da manhã nos boxes do vão central com pastel de camarão e café; o Centro começa aqui"
      },
      {
        "name": "Mirante do Morro da Cruz",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O mirante sobre o Centro, as duas pontes e o continente; de carro ou táxi, pôr do sol"
      },
      {
        "name": "Restaurante Oliveira (sequência de camarão)",
        "category": "lunch",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 110,
        "tip": "A sequência de camarão da Lagoa: casquinha, à milanesa, ao bafo, no alho; preço fixo, divide a mesa inteira"
      },
      {
        "name": "Jurerê Open Shopping",
        "category": "afternoon",
        "neighborhood": "Jurerê Internacional",
        "costBRL": 0,
        "tip": "Shopping a céu aberto de Jurerê, moda praia, restaurantes e sorvete; a tarde de compras do norte"
      },
      {
        "name": "Ostradamus (Ribeirão da Ilha)",
        "category": "dinner",
        "neighborhood": "Ribeirão da Ilha",
        "costBRL": 200,
        "tip": "A casa das ostras de Santa Catarina, deck sobre o mar no Ribeirão da Ilha; 12 preparos de ostra, reserve"
      },
      {
        "name": "P12 Parador (Jurerê Internacional)",
        "category": "night",
        "neighborhood": "Jurerê Internacional",
        "costBRL": 300,
        "tip": "O beach club de Jurerê, piscina, DJs e festas de verão; ingresso antecipado, dress code de praia chique"
      },
      {
        "name": "Pirão Restaurante (Ingleses)",
        "category": "lunch",
        "neighborhood": "Ingleses",
        "costBRL": 90,
        "tip": "Frutos do mar e pirão na praia dos Ingleses, o almoço do norte depois do mar; família, porções grandes"
      },
      {
        "name": "Ponta das Caranhas (Lagoa da Conceição)",
        "category": "dinner",
        "neighborhood": "Lagoa da Conceição",
        "costBRL": 130,
        "tip": "Peixe e camarão num casarão na ponta da Lagoa, mesas na água; reserve a varanda"
      },
      {
        "name": "Ponte Hercílio Luz",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A ponte pênsil de 1926 reaberta em 2019, símbolo da ilha; atravesse a pé no fim da tarde e veja iluminada da Beira-Mar"
      },
      {
        "name": "Praça XV de Novembro e Catedral Metropolitana",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A figueira centenária de 1871, a catedral e o Palácio Cruz e Sousa (museu grátis); o Centro histórico num quarteirão"
      },
      {
        "name": "Praia Mole (Leste da Ilha)",
        "category": "morning",
        "neighborhood": "Praia Mole",
        "costBRL": 0,
        "tip": "A praia da juventude, ondas fortes e areia fofa; bares na encosta, cuidado com o mar para crianças"
      },
      {
        "name": "Rancho Açoriano (Santo Antônio de Lisboa)",
        "category": "lunch",
        "neighborhood": "Santo Antônio de Lisboa",
        "costBRL": 130,
        "tip": "Ostras e peixe num casarão açoriano de frente para o pôr do sol da baía norte; combine com a caminhada pelo vilarejo"
      },
      {
        "name": "Ribeirão da Ilha (freguesia e fazendas de ostra)",
        "category": "afternoon",
        "neighborhood": "Ribeirão da Ilha",
        "costBRL": 0,
        "tip": "A freguesia açoriana do sul, casario colorido, igreja de 1806 e as fazendas de ostra na água; dia de almoço longo"
      },
      {
        "name": "Rosso Restaurante (Santo Antônio de Lisboa)",
        "category": "dinner",
        "neighborhood": "Santo Antônio de Lisboa",
        "costBRL": 180,
        "tip": "Frutos do mar contemporâneos no vilarejo açoriano, de frente para o pôr do sol da baía norte; reserve"
      },
      {
        "name": "Santo Antônio de Lisboa (vilarejo açoriano)",
        "category": "afternoon",
        "neighborhood": "Santo Antônio de Lisboa",
        "costBRL": 0,
        "tip": "Vilarejo colonial de 1750 na baía norte, igreja, casario, ateliês e o melhor pôr do sol da ilha; vá para ficar para o jantar"
      },
      {
        "name": "Teatro Álvaro de Carvalho (TAC)",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 60,
        "tip": "O teatro de 1875 do Centro, programação de música e teatro a preço baixo; veja a agenda do mês"
      }
    ],
    "hotels": [
      {
        "name": "Costão do Santinho Resort",
        "zone": "Jurere/Canasvieiras",
        "tier": "upscale",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.800-3.500",
        "tip": "Resort all-inclusive de pé na praia do Santinho, recreação para todas as idades, golfe e inscrições rupestres na trilha"
      },
      {
        "name": "Hotel Faial Prime",
        "zone": "Centro/Beira-Mar",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Hotel tradicional do Centro a 2 quadras da Praça XV, quartos simples e café farto; honesto"
      },
      {
        "name": "Ibis Florianópolis",
        "zone": "Centro/Beira-Mar",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Ibis na Beira-Mar Norte, a 10 min a pé do Mercado Público; base de preço fixo para quem vai de carro às praias"
      },
      {
        "name": "Il Campanario Villaggio Resort",
        "zone": "Jurere/Canasvieiras",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.500-2.800",
        "tip": "Resort de estilo italiano no coração de Jurerê, piscinas, spa e Open Shopping ao lado; o verão de Jurerê"
      },
      {
        "name": "Jurerê Beach Village",
        "zone": "Jurere/Canasvieiras",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 700-1.200",
        "tip": "Hotel de pé na areia em Jurerê Internacional, piscinas e recreação infantil; a família no norte"
      },
      {
        "name": "LK Design Hotel",
        "zone": "Centro/Beira-Mar",
        "tier": "upscale",
        "personaTags": [
          "couple"
        ],
        "priceRangeBRL": "R$ 900-1.500",
        "tip": "Boutique de design na Beira-Mar Norte, rooftop com piscina e vista da ponte; o hotel para casal no Centro"
      },
      {
        "name": "Majestic Palace Hotel",
        "zone": "Centro/Beira-Mar",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 500-800",
        "tip": "O hotel da Beira-Mar Norte com vista da baía e piscina; o clássico do Centro para quem quer cidade e praia"
      },
      {
        "name": "Pousada Natur Campeche",
        "zone": "Campeche/Morro das Pedras",
        "tier": "mid",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 500-900",
        "tip": "Pousada de jardim a 200 m da Praia do Campeche, café da manhã caseiro; o sul da ilha sem resort"
      }
    ]
  },
  "Maceió": {
    "city": "Maceió",
    "items": [
      {
        "name": "Armazém Guimarães (Jatiúca)",
        "category": "dinner",
        "neighborhood": "Jatiúca",
        "costBRL": 100,
        "tip": "Bar-restaurante de Jatiúca com música ao vivo e feira de arte nos fins de semana; o jantar que vira noite"
      },
      {
        "name": "Bate-volta a Barra de São Miguel",
        "category": "morning",
        "neighborhood": "Barra de São Miguel",
        "costBRL": 100,
        "tip": "Praia de água calma de piscina natural a 35 km, barracas e o rio; o dia fácil com crianças pequenas"
      },
      {
        "name": "Praia do Gunga",
        "category": "morning",
        "neighborhood": "Roteiro",
        "costBRL": 120,
        "tip": "A praia de coqueiral entre a lagoa e o mar, 1h ao sul; barco de Barra de São Miguel ou buggy pelas falésias coloridas"
      },
      {
        "name": "Galés de Maragogi (piscinas naturais)",
        "category": "morning",
        "neighborhood": "Maragogi",
        "costBRL": 250,
        "tip": "2h ao norte até as piscinas naturais das Galés, o \"Caribe brasileiro\"; só na maré baixa, tour inclui catamarã e almoço"
      },
      {
        "name": "Praia do Patacho",
        "category": "morning",
        "neighborhood": "Porto de Pedras",
        "costBRL": 200,
        "tip": "A praia deserta de coqueiros da Rota Ecológica, eleita entre as mais bonitas do país; sem estrutura, leve o que precisar"
      },
      {
        "name": "Praia do Toque (São Miguel dos Milagres)",
        "category": "morning",
        "neighborhood": "São Miguel dos Milagres",
        "costBRL": 200,
        "tip": "Rota Ecológica a 1h30: praias vazias, piscinas naturais do Toque e jangadas; o litoral mais bonito de Alagoas, sem resort"
      },
      {
        "name": "Bodega do Sertão (Pajuçara)",
        "category": "lunch",
        "neighborhood": "Pajuçara",
        "costBRL": 90,
        "tip": "Buffet de comida nordestina num cenário de bodega do interior, forró ao vivo; baião de dois e carne de sol, bom com crianças"
      },
      {
        "name": "Casa Nunes Marisqueira (Jaraguá)",
        "category": "dinner",
        "neighborhood": "Jaraguá",
        "costBRL": 130,
        "tip": "Marisqueira do bairro histórico de Jaraguá, camarão e lagosta sem frescura; combine com a noite do bairro"
      },
      {
        "name": "Catedral Metropolitana de Maceió e Praça Dom Pedro II",
        "category": "morning",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A catedral de 1859 e a praça do Centro histórico; combine com o Museu Théo Brandão e o comércio de rua"
      },
      {
        "name": "Divina Gula (Jatiúca)",
        "category": "dinner",
        "neighborhood": "Jatiúca",
        "costBRL": 130,
        "tip": "O restaurante mineiro-nordestino mais famoso da cidade, pratos para dividir e fila na porta; vá cedo ou reserve"
      },
      {
        "name": "Dunas de Marapé (buggy)",
        "category": "morning",
        "neighborhood": "Jequiá da Praia",
        "costBRL": 150,
        "tip": "Buggy pelas dunas e pela lagoa de Marapé, com esquibunda e banho de rio; 1h ao sul, tour sai dos hotéis"
      },
      {
        "name": "Feirinha de Pajuçara (artesanato à noite)",
        "category": "afternoon",
        "neighborhood": "Pajuçara",
        "costBRL": 0,
        "tip": "A feira de artesanato da orla que abre no fim da tarde: filé, redes, cerâmica e tapioca; a caminhada de todo dia"
      },
      {
        "name": "Imperador dos Camarões (Pajuçara)",
        "category": "lunch",
        "neighborhood": "Pajuçara",
        "costBRL": 120,
        "tip": "Camarão em todas as versões há 30 anos na orla de Pajuçara; peça a sequência para dividir"
      },
      {
        "name": "Janga Praia (Jatiúca)",
        "category": "dinner",
        "neighborhood": "Jatiúca",
        "costBRL": 140,
        "tip": "Frutos do mar de frente para a praia de Jatiúca, música ao vivo no fim de semana; moqueca alagoana"
      },
      {
        "name": "Associação Comercial de Maceió (Jaraguá)",
        "category": "afternoon",
        "neighborhood": "Jaraguá",
        "costBRL": 0,
        "tip": "O antigo porto com casarões e armazéns restaurados, a Associação Comercial e museus pequenos; vivo à noite"
      },
      {
        "name": "Kanoa Beach Bar (Ponta Verde)",
        "category": "lunch",
        "neighborhood": "Ponta Verde",
        "costBRL": 130,
        "tip": "Beach bar de pé na areia em Cruz das Almas, cadeiras na praia e pratos de peixe; o dia inteiro na praia com estrutura"
      },
      {
        "name": "Kanoa Beach Bar à noite (Ponta Verde)",
        "category": "night",
        "neighborhood": "Ponta Verde",
        "costBRL": 120,
        "tip": "Festas de sunset e DJs no beach bar de Cruz das Almas; o fim de tarde que vira noite na areia"
      },
      {
        "name": "Le Corbu (francês, Ponta Verde)",
        "category": "dinner",
        "neighborhood": "Ponta Verde",
        "costBRL": 180,
        "tip": "Bistrô francês em Ponta Verde, poucas mesas e carta curta; o jantar de casal da cidade, reserve"
      },
      {
        "name": "Lopana (quiosque, Ponta Verde)",
        "category": "lunch",
        "neighborhood": "Ponta Verde",
        "costBRL": 120,
        "tip": "O quiosque mais famoso da orla, pé na areia em Ponta Verde; camarão, peixe e caipirinha, e o pôr do sol depois"
      },
      {
        "name": "Pôr do sol no Lopana (Ponta Verde)",
        "category": "night",
        "neighborhood": "Ponta Verde",
        "costBRL": 80,
        "tip": "O quiosque vira bar ao pôr do sol, música ao vivo e drinques na areia; o happy hour da cidade"
      },
      {
        "name": "Maikai Maceió (beach club)",
        "category": "night",
        "neighborhood": "Jatiúca",
        "costBRL": 150,
        "tip": "Beach club de Jatiúca com festas, shows e pôr do sol; ingresso antecipado nos fins de semana"
      },
      {
        "name": "Marechal Deodoro (centro histórico)",
        "category": "afternoon",
        "neighborhood": "Marechal Deodoro",
        "costBRL": 0,
        "tip": "A antiga capital de Alagoas, igrejas barrocas e a casa do primeiro presidente; combine com a Praia do Francês e a Massagueira"
      },
      {
        "name": "Maria Antonieta (café da manhã)",
        "category": "breakfast",
        "neighborhood": "Ponta Verde",
        "costBRL": 60,
        "tip": "Restaurante-padaria de Ponta Verde com café da manhã servido, pães, tapiocas e cuscuz; o brunch da orla"
      },
      {
        "name": "Maria Antonieta (jantar)",
        "category": "dinner",
        "neighborhood": "Ponta Verde",
        "costBRL": 150,
        "tip": "Cozinha italiana e frutos do mar num casarão de Ponta Verde; o jantar bonito da orla, reserve"
      },
      {
        "name": "Massagueirinha (sururu, Ponta Verde)",
        "category": "lunch",
        "neighborhood": "Ponta Verde",
        "costBRL": 90,
        "tip": "A filial de Ponta Verde do restaurante do sururu e da caldeirada; a matriz fica na beira da Lagoa Manguaba, em Marechal Deodoro"
      },
      {
        "name": "Massarella Cantina (Jatiúca)",
        "category": "dinner",
        "neighborhood": "Jatiúca",
        "costBRL": 110,
        "tip": "Cantina italiana de Jatiúca, massas e pizzas de família; barato e bom com crianças"
      },
      {
        "name": "Mercado do Artesanato de Maceió",
        "category": "lunch",
        "neighborhood": "Levada",
        "costBRL": 40,
        "tip": "Mercado coberto de filé, renda e cerâmica com lanchonetes de comida regional; combine compras e almoço rápido"
      },
      {
        "name": "Mirante de São Gonçalo",
        "category": "afternoon",
        "neighborhood": "São Gonçalo",
        "costBRL": 0,
        "tip": "A vista da lagoa Mundaú, do mar e da cidade inteira do alto do tabuleiro; pôr do sol, vá de carro"
      },
      {
        "name": "Orla de Pajuçara à noite",
        "category": "night",
        "neighborhood": "Pajuçara",
        "costBRL": 0,
        "tip": "Calçadão iluminado, feirinha, sorvete no Bali e jangadas na areia; a noite de família na orla"
      },
      {
        "name": "Padaria Pão de Açúcar Ponta Verde",
        "category": "breakfast",
        "neighborhood": "Ponta Verde",
        "costBRL": 30,
        "tip": "Padaria de bairro da orla de Ponta Verde, pão quente e café coado para começar o dia de praia"
      },
      {
        "name": "Parmegianno Ponta Verde",
        "category": "dinner",
        "neighborhood": "Ponta Verde",
        "costBRL": 100,
        "tip": "Parmegianas e carne de sol com queijo coalho em porções para dividir; o jantar farto da orla"
      },
      {
        "name": "Parque Municipal de Maceió",
        "category": "morning",
        "neighborhood": "Bebedouro",
        "costBRL": 0,
        "tip": "Mata atlântica no meio da cidade, trilhas, lago e parquinho; gratuito, manhã fresca com crianças"
      },
      {
        "name": "Parque Shopping Maceió",
        "category": "afternoon",
        "neighborhood": "Cruz das Almas",
        "costBRL": 0,
        "tip": "Shopping mais novo, ao lado de Cruz das Almas, com marcas nacionais e boa praça de alimentação"
      },
      {
        "name": "Picuí (carne de sol, Jaraguá)",
        "category": "lunch",
        "neighborhood": "Jaraguá",
        "costBRL": 110,
        "tip": "A casa da carne de sol alagoana desde 1989, com macaxeira e manteiga de garrafa; o almoço sertanejo na praia"
      },
      {
        "name": "Piscinas Naturais da Pajuçara",
        "category": "morning",
        "neighborhood": "Pajuçara",
        "costBRL": 60,
        "tip": "Jangada da orla de Pajuçara até as piscinas de coral a 2 km da praia, na maré baixa; confira a tábua das marés, leve máscara"
      },
      {
        "name": "Pontal da Barra (rendeiras de filé)",
        "category": "afternoon",
        "neighborhood": "Pontal da Barra",
        "costBRL": 0,
        "tip": "Bairro de pescadores onde as rendeiras fazem o filé alagoano nas calçadas; compre direto, veja o pôr do sol na lagoa"
      },
      {
        "name": "Praia do Francês, Alagoas",
        "category": "morning",
        "neighborhood": "Marechal Deodoro",
        "costBRL": 0,
        "tip": "A praia de piscinas naturais e barracas a 25 min do centro, lado esquerdo calmo para crianças, direito com ondas; vá de manhã"
      },
      {
        "name": "Praia de Ipioca e Riacho Doce",
        "category": "morning",
        "neighborhood": "Ipioca",
        "costBRL": 0,
        "tip": "As praias de coqueiral do litoral norte da cidade, 30 min do centro; barracas simples, água morna, pouca gente"
      },
      {
        "name": "Praia de Jatiúca",
        "category": "morning",
        "neighborhood": "Jatiúca",
        "costBRL": 0,
        "tip": "A praia dos hotéis e das barracas, com ondas um pouco maiores; o calçadão segue até Cruz das Almas"
      },
      {
        "name": "Praia de Ponta Verde (orla)",
        "category": "morning",
        "neighborhood": "Ponta Verde",
        "costBRL": 0,
        "tip": "A praia urbana mais bonita do Nordeste, mar verde e calçadão de coqueiros; água rasa e calma para crianças"
      },
      {
        "name": "Maceió Shopping",
        "category": "afternoon",
        "neighborhood": "Mangabeiras",
        "costBRL": 0,
        "tip": "O shopping grande da cidade, cinema e praça de alimentação; o programa de chuva, 10 min da orla"
      },
      {
        "name": "Sorveteria Bali (Pajuçara)",
        "category": "breakfast",
        "neighborhood": "Pajuçara",
        "costBRL": 25,
        "tip": "A sorveteria clássica da orla de Pajuçara, sabores de frutas da região; mangaba e cajá, qualquer hora do dia"
      },
      {
        "name": "Feirinha de Pajuçara (tapiocas)",
        "category": "breakfast",
        "neighborhood": "Pajuçara",
        "costBRL": 20,
        "tip": "As barracas de tapioca da feirinha da orla, com recheios de coco, queijo coalho e carne de sol; de pé, com a praia na frente"
      },
      {
        "name": "Teatro Deodoro",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 40,
        "tip": "O teatro de 1910 do Centro, programação de música e dança a preço baixo; confira a agenda do mês"
      },
      {
        "name": "Wanchako (peruano, Ponta Verde)",
        "category": "dinner",
        "neighborhood": "Ponta Verde",
        "costBRL": 200,
        "tip": "Cozinha peruana com peixe alagoano, o melhor restaurante da cidade nos rankings; ceviche e tiradito, reserve"
      }
    ],
    "hotels": [
      {
        "name": "Brisa Tower Hotel",
        "zone": "Jatiúca",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 400-700",
        "tip": "Torre na orla de Jatiúca com quartos amplos e vista do mar; bom custo para família"
      },
      {
        "name": "Ibis Maceió Pajuçara",
        "zone": "Pajuçara",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Ibis de frente para a praia de Pajuçara, a 2 min da feirinha e das jangadas; preço fixo, quarto simples"
      },
      {
        "name": "Jatiúca Hotel & Resort",
        "zone": "Jatiúca",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.000-1.800",
        "tip": "Resort de pé na areia de Jatiúca com piscinas, recreação infantil e restaurante; o clássico de luxo da cidade"
      },
      {
        "name": "Maceió Mar Hotel",
        "zone": "Pajuçara",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 450-750",
        "tip": "Hotel grande de frente para Pajuçara com piscina e recreação; família que quer praia urbana"
      },
      {
        "name": "Meliá Maceió",
        "zone": "Jatiúca",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 900-1.600",
        "tip": "Hotel internacional de frente para Jatiúca, piscina na cobertura com vista e serviço de rede; casal e família"
      },
      {
        "name": "Hotel Ponta Verde Maceió",
        "zone": "Ponta Verde",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 400-700",
        "tip": "Hotel de frente para a praia mais bonita da cidade, piscina no terraço; o meio-termo da orla"
      },
      {
        "name": "Hotel Praia Bonita Jatiúca",
        "zone": "Jatiúca",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-450",
        "tip": "Hotel simples a 1 quadra da praia de Jatiúca, piscina e café da manhã nordestino farto"
      },
      {
        "name": "Ritz Lagoa da Anta Hotel & Spa",
        "zone": "Lagoa da Anta",
        "tier": "upscale",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 1.200-2.200",
        "tip": "Resort entre a praia e a lagoa, no fim de Cruz das Almas, com spa e recreação; o mais completo de Maceió"
      }
    ]
  },
  "Foz do Iguaçu": {
    "city": "Foz do Iguaçu",
    "items": [
      {
        "name": "Bar do Alemão (Jardim Central)",
        "category": "night",
        "neighborhood": "Jardim Central",
        "costBRL": 90,
        "tip": "Bar e restaurante de cozinha alemã com chope e música ao vivo; o jantar tardio que vira noite"
      },
      {
        "name": "Restaurante Barracão (Vila A)",
        "category": "lunch",
        "neighborhood": "Vila A",
        "costBRL": 60,
        "tip": "Buffet caseiro brasileiro na Vila A, perto de Itaipu; almoço de família a preço de Foz"
      },
      {
        "name": "Bate-volta às Cataratas argentinas (Puerto Iguazú)",
        "category": "morning",
        "neighborhood": "Puerto Iguazú",
        "costBRL": 250,
        "tip": "O lado de cima das quedas: trem até a Garganta do Diabo, circuitos superior e inferior; passaporte ou RG, dia inteiro, leve pesos"
      },
      {
        "name": "Bate-volta a Ciudad del Este (compras)",
        "category": "morning",
        "neighborhood": "Ciudad del Este",
        "costBRL": 0,
        "tip": "A cidade das compras pela Ponte da Amizade: Shopping China, Paris, Monalisa e as galerias; vá de manhã cedo, cota de US$ 500"
      },
      {
        "name": "Bate-volta ao Salto del Monday (Paraguai)",
        "category": "afternoon",
        "neighborhood": "Presidente Franco",
        "costBRL": 60,
        "tip": "Cachoeira de 40 m a 20 min de Ciudad del Este, com mirantes e rapel; o parque que ninguém conhece, quase vazio"
      },
      {
        "name": "Bendito Bar e Restaurante (Centro)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 70,
        "tip": "Executivos no almoço e buffet no fim de semana, no Centro; onde Foz come de segunda a sexta"
      },
      {
        "name": "Black Bill Smokedhouse",
        "category": "dinner",
        "neighborhood": "Vila Yolanda",
        "costBRL": 120,
        "tip": "Churrasco texano defumado e cerveja; o jantar descontraído com adolescentes"
      },
      {
        "name": "Blue Park (parque aquático)",
        "category": "morning",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 200,
        "tip": "Parque aquático de águas termais do complexo Mabu, piscina de ondas e toboáguas; aberto a não hóspedes, dia inteiro"
      },
      {
        "name": "Búfalo Branco Churrascaria",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 130,
        "tip": "A churrascaria tradicional de Foz desde 1992, rodízio com buffet de saladas e sobremesas; família depois do parque"
      },
      {
        "name": "Café Colonial Bavária",
        "category": "breakfast",
        "neighborhood": "Vila Yolanda",
        "costBRL": 70,
        "tip": "Café colonial de mesa farta com cucas, embutidos e geleias; o café que vira almoço, bom com crianças"
      },
      {
        "name": "Capitão Bar",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 80,
        "tip": "O bar mais tradicional do Centro, música ao vivo e varanda na Avenida Jorge Schimmelpfeng; o começo da noite de Foz"
      },
      {
        "name": "Castelo Libanês (almoço)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 90,
        "tip": "Restaurante libanês da família Khalil, quibe, charuto de folha de uva e cordeiro; a cozinha da colônia árabe de Foz"
      },
      {
        "name": "Castelo Libanês (café árabe)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 50,
        "tip": "A comunidade árabe de Foz à mesa: pão sírio quente, zaatar, labneh e café; o café da manhã que só existe aqui"
      },
      {
        "name": "Parque Nacional do Iguaçu (Cataratas, lado brasileiro)",
        "category": "morning",
        "neighborhood": "Parque Nacional",
        "costBRL": 120,
        "tip": "A trilha de 1,2 km com a vista panorâmica e a passarela da Garganta do Diabo; compre com hora, vá na abertura, leve capa de chuva"
      },
      {
        "name": "Catedral São João Batista e Praça da Paz",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "A catedral do Centro e a praça; o Centro de Foz é pequeno, 20 minutos de caminhada o resolvem"
      },
      {
        "name": "Chef Lopes Restaurante",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 90,
        "tip": "Buffet por quilo de qualidade no Centro, pratos regionais e peixe de rio; onde Foz almoça"
      },
      {
        "name": "Dona Maria Ranch Steakhouse",
        "category": "dinner",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 180,
        "tip": "Steakhouse em estilo rancho na Rodovia das Cataratas, cortes nobres e música ao vivo; reserve"
      },
      {
        "name": "Dreamland Museu de Cera",
        "category": "afternoon",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 90,
        "tip": "Museu de cera de celebridades no complexo Dreams Park Show; programa de chuva com adolescentes"
      },
      {
        "name": "Dreams Park Show (noite no complexo)",
        "category": "night",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 120,
        "tip": "Complexo com Museu de Cera, Movie Cars, bar de gelo e ultravioleta; a noite de família com adolescentes"
      },
      {
        "name": "Duty Free Shop Puerto Iguazú",
        "category": "afternoon",
        "neighborhood": "Puerto Iguazú",
        "costBRL": 0,
        "tip": "Free shop argentino logo depois da ponte Tancredo Neves, perfumes e bebidas sem imposto; combine com o lado argentino"
      },
      {
        "name": "Ecomuseu de Itaipu",
        "category": "afternoon",
        "neighborhood": "Itaipu",
        "costBRL": 0,
        "tip": "Museu gratuito sobre a construção da usina e a natureza da região; bom para crianças antes da visita à barragem"
      },
      {
        "name": "Eliane Balena Pastifício",
        "category": "lunch",
        "neighborhood": "Vila Yolanda",
        "costBRL": 100,
        "tip": "Massas frescas vênetas feitas na casa; o almoço italiano de Foz, reserve no fim de semana"
      },
      {
        "name": "Empório com Arte (café)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 50,
        "tip": "Café de especialidade com loja de arte e design no Centro, café da manhã servido e brunch de domingo"
      },
      {
        "name": "Feirinha do Jardim Jupira (artesanato paraguaio)",
        "category": "afternoon",
        "neighborhood": "Jardim Jupira",
        "costBRL": 0,
        "tip": "Feira de rua com artesanato e produtos paraguaios sem atravessar a ponte; roupas, erva-mate e chipas"
      },
      {
        "name": "Voo panorâmico de helicóptero (Helisul)",
        "category": "afternoon",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 700,
        "tip": "10 minutos sobre as Cataratas a partir do heliponto ao lado do Parque das Aves; o ângulo que só se vê do céu"
      },
      {
        "name": "Ipê Grill (Belmond Hotel das Cataratas)",
        "category": "dinner",
        "neighborhood": "Parque Nacional",
        "costBRL": 350,
        "tip": "Churrasco e buffet no hotel dentro do parque, com show de folclore; o jantar com as Cataratas ao lado, reserve"
      },
      {
        "name": "Itaipu Binacional (visita panorâmica)",
        "category": "afternoon",
        "neighborhood": "Itaipu",
        "costBRL": 80,
        "tip": "Ônibus pelo alto da barragem da maior hidrelétrica em geração do mundo; o circuito especial entra na usina, reserve"
      },
      {
        "name": "Cataratas JL Shopping",
        "category": "afternoon",
        "neighborhood": "Centro",
        "costBRL": 0,
        "tip": "O shopping do Centro, cinema e praça de alimentação; programa de chuva e compras nacionais"
      },
      {
        "name": "La Mafia Trattoria",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 130,
        "tip": "Trattoria italiana no Centro com massas frescas e ambiente de filme; reserve no fim de semana"
      },
      {
        "name": "Le Mir (árabe, menu degustação)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 180,
        "tip": "Menu degustação árabe-libanês, o jantar de ocasião da colônia árabe de Foz; reserve"
      },
      {
        "name": "Luigia Napoletana (pizza)",
        "category": "dinner",
        "neighborhood": "Maracanã",
        "costBRL": 90,
        "tip": "Pizza napolitana de forno a lenha no Centro; a alternativa sem fila à Vó Bertila"
      },
      {
        "name": "Macuco Safari (barco sob as quedas)",
        "category": "morning",
        "neighborhood": "Parque Nacional",
        "costBRL": 400,
        "tip": "Jipe pela mata e bote até debaixo das cataratas; molha tudo, leve roupa seca; crianças a partir de 7 anos"
      },
      {
        "name": "Marco das Três Fronteiras à noite (show de luzes)",
        "category": "night",
        "neighborhood": "Porto Meira",
        "costBRL": 50,
        "tip": "Show de água e luzes e apresentações de folclore das três fronteiras no fim da tarde; jantar nos restaurantes do marco"
      },
      {
        "name": "Marco das Três Fronteiras",
        "category": "afternoon",
        "neighborhood": "Porto Meira",
        "costBRL": 50,
        "tip": "O encontro dos rios Iguaçu e Paraná, com Argentina e Paraguai do outro lado; pôr do sol e show de luzes à noite"
      },
      {
        "name": "Mercado Municipal de Foz do Iguaçu",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 40,
        "tip": "Mercado revitalizado com cafés, padarias e comida das três fronteiras; café da manhã antes de ir às Cataratas"
      },
      {
        "name": "Mesquita Omar Ibn Al-Khattab",
        "category": "morning",
        "neighborhood": "Jardim Central",
        "costBRL": 0,
        "tip": "A mesquita da comunidade árabe de Foz, visitas gratuitas fora do horário de oração; mulheres com véu, fornecido na entrada"
      },
      {
        "name": "Panificadora Ikeda (Centro)",
        "category": "breakfast",
        "neighborhood": "Centro",
        "costBRL": 30,
        "tip": "Padaria tradicional do Centro, pão de queijo e café coado de balcão; para quem sai cedo para o parque"
      },
      {
        "name": "Parque das Aves",
        "category": "morning",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 110,
        "tip": "Viveiros de imersão com tucanos, araras e flamingos ao lado da entrada do parque; faça antes ou depois das Cataratas"
      },
      {
        "name": "Restaurante Porto Canoas (dentro do parque)",
        "category": "lunch",
        "neighborhood": "Parque Nacional",
        "costBRL": 150,
        "tip": "Buffet no fim da trilha das Cataratas, com deck sobre o rio Iguaçu acima das quedas; o único almoço dentro do parque"
      },
      {
        "name": "Rafain Churrascaria Show",
        "category": "dinner",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 250,
        "tip": "Churrascaria com show de danças latino-americanas todas as noites; turístico e a família adora, reserve"
      },
      {
        "name": "Refúgio Biológico Bela Vista",
        "category": "morning",
        "neighborhood": "Itaipu",
        "costBRL": 60,
        "tip": "Trilha guiada no refúgio da Itaipu com onças, antas e harpias resgatadas; reserve, horários fixos"
      },
      {
        "name": "Shopping China (Ciudad del Este)",
        "category": "afternoon",
        "neighborhood": "Ciudad del Este",
        "costBRL": 0,
        "tip": "A loja de departamentos mais organizada do Paraguai, logo depois da Ponte da Amizade; eletrônicos, perfumes e bebidas, pague em dólar"
      },
      {
        "name": "Restaurante Tempero da Bahia",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 120,
        "tip": "Moqueca e bobó de camarão em Foz há mais de 20 anos, no Centro; o jantar de ocasião da cidade, reserve"
      },
      {
        "name": "Templo Budista Chen Tien",
        "category": "morning",
        "neighborhood": "Jardim Califórnia",
        "costBRL": 0,
        "tip": "Templo chinês com o Buda de 7 m e 120 estátuas no jardim, vista de Ciudad del Este; gratuito, roupa discreta"
      },
      {
        "name": "Vale dos Dinossauros",
        "category": "afternoon",
        "neighborhood": "Rodovia das Cataratas",
        "costBRL": 90,
        "tip": "Dinossauros animatrônicos em tamanho real num bosque; crianças de 3 a 10 anos, combine com o Dreamland ao lado"
      },
      {
        "name": "Vó Bertila (pizza e massas)",
        "category": "lunch",
        "neighborhood": "Centro",
        "costBRL": 90,
        "tip": "A pizzaria mais famosa de Foz, massas de família e fila na porta desde 1995; rodízio à noite, almoço mais calmo"
      },
      {
        "name": "Vó Bertila (rodízio de pizza à noite)",
        "category": "dinner",
        "neighborhood": "Centro",
        "costBRL": 80,
        "tip": "Rodízio de pizza da casa mais famosa de Foz, fila a partir das 19h30; o jantar barato com crianças"
      },
      {
        "name": "Zeppelin Old Bar",
        "category": "night",
        "neighborhood": "Centro",
        "costBRL": 80,
        "tip": "Bar de rock com shows ao vivo no Centro, cerveja e petiscos; quando o Capitão lota"
      }
    ],
    "hotels": [
      {
        "name": "Hotel das Cataratas, A Belmond Hotel",
        "zone": "Parque Nacional",
        "tier": "upscale",
        "personaTags": [
          "couple",
          "family"
        ],
        "priceRangeBRL": "R$ 2.500-5.000",
        "tip": "O único hotel dentro do parque, as Cataratas a 5 min a pé antes da abertura e depois do fechamento; o luxo que vale o preço"
      },
      {
        "name": "Bourbon Cataratas do Iguaçu Thermas Eco Resort",
        "zone": "Rodovia das Cataratas",
        "tier": "upscale",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 900-1.600",
        "tip": "Resort de família na Rodovia das Cataratas, piscinas termais, trilha e recreação o dia inteiro; o preferido com crianças"
      },
      {
        "name": "Del Rey Quality Hotel",
        "zone": "Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "budget"
        ],
        "priceRangeBRL": "R$ 250-400",
        "tip": "Hotel de família no Centro com piscina e café da manhã elogiado; o budget que não parece budget"
      },
      {
        "name": "Ibis Foz do Iguaçu",
        "zone": "Centro",
        "tier": "budget",
        "personaTags": [
          "family",
          "couple",
          "budget"
        ],
        "priceRangeBRL": "R$ 200-350",
        "tip": "Ibis no Centro ao lado do JL Shopping, a 20 min do parque; preço fixo e padrão previsível"
      },
      {
        "name": "Mabu Thermas Grand Resort",
        "zone": "Rodovia das Cataratas",
        "tier": "upscale",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 1.000-1.800",
        "tip": "Resort com o Blue Park aquático incluído na hospedagem, piscinas termais e recreação; família de férias"
      },
      {
        "name": "Nadai Confort Hotel & Spa",
        "zone": "Centro",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 400-650",
        "tip": "Hotel do Centro com spa e piscina na cobertura; bom para quem quer sair à noite a pé"
      },
      {
        "name": "Recanto Cataratas Thermas Resort & Convention",
        "zone": "Rodovia das Cataratas",
        "tier": "mid",
        "personaTags": [
          "family"
        ],
        "priceRangeBRL": "R$ 600-1.000",
        "tip": "Resort de águas termais com piscinas e recreação, a 10 min do parque; família que quer piscina depois das Cataratas"
      },
      {
        "name": "Viale Cataratas Hotel & Eventos",
        "zone": "Rodovia das Cataratas",
        "tier": "mid",
        "personaTags": [
          "family",
          "couple"
        ],
        "priceRangeBRL": "R$ 400-700",
        "tip": "Hotel moderno na Rodovia das Cataratas, piscina e café farto, a 10 min do parque; o meio-termo da cidade"
      }
    ]
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
  "florianopolis": "Florianópolis",
  "fortaleza": "Fortaleza",
  "foz do iguacu": "Foz do Iguaçu",
  "gramado": "Gramado",
  "istambul": "Istambul",
  "istanbul": "Istambul",
  "lisboa": "Lisboa",
  "lisbon": "Lisboa",
  "london": "Londres",
  "londres": "Londres",
  "maceio": "Maceió",
  "madri": "Madri",
  "marrakech": "Marrakech",
  "marrakesh": "Marrakech",
  "miami": "Miami",
  "new york": "Nova York",
  "nova iorque": "Nova York",
  "nova york": "Nova York",
  "orlando": "Orlando",
  "paris": "Paris",
  "porto": "Porto",
  "porto seguro": "Porto Seguro",
  "rio": "Rio de Janeiro",
  "rio de janeiro": "Rio de Janeiro",
  "roma": "Roma",
  "rome": "Roma",
  "salvador": "Salvador",
  "santiago": "Santiago",
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
  "Singapura",
  "Porto",
  "Madri",
  "Santiago",
  "Miami",
  "Florianópolis",
  "Maceió",
  "Foz do Iguaçu"
];
