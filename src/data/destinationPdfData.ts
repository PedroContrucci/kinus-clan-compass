// ══════════════════════════════════════════════════════════════════════════
// destinationPdfData.ts — Expanded curated data for PDF generation
// Covers ALL 82 cities from destinationActivities.ts
// NO ACCENTS in strings — jsPDF Helvetica cannot render them
// ══════════════════════════════════════════════════════════════════════════

export interface CityPdfData {
  photos: string[];
  description: string;
  info: { timezone: string; voltage: string; language: string; currency: string; visa: string };
  tips: { tips: string; water: string; tipping: string; phrases: string[]; embassy: string };
  narratives: Record<string, string>;
}

// ── All city data (keys normalized: lowercase, no accents, no spaces) ──
const EXPANDED_CITY_DATA: Record<string, CityPdfData> = {

  // ═══ AFRICA ═══════════════════════════════════════════════════════════
  'cidade do cabo': {
    photos: [
      'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Cidade do Cabo e uma das cidades mais espetaculares do planeta. A Table Mountain domina o horizonte, praias como Camps Bay e Clifton rivalizam com as melhores do mundo, e a historia da luta contra o apartheid da profundidade a cada visita. Vinhedos de classe mundial ficam a apenas 40 minutos do centro.',
    info: { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo M (unica!)', language: 'Ingles/Afrikaans/Xhosa', currency: 'Rand Sul-Africano (ZAR)', visa: 'Isento para brasileiros ate 90 dias' },
    tips: {
      tips: 'Reserve o teleferico da Table Mountain online — filas podem passar de 2h. Uber funciona muito bem na cidade.',
      water: 'Segura da torneira (a cidade enfrentou crise hidrica, use com consciencia)',
      tipping: '10-15% em restaurantes. Esperada para guardadores de carros (R5-10).',
      phrases: ['Hello (Ola)', 'Thank you (Obrigado)', 'How much? (Quanto?)', 'Howzit! (Ola, giriia local)', 'Sharp sharp! (Tudo certo!)'],
      embassy: 'Embaixada do Brasil: +27 12 366 5200 | Pretoria (cobre Cape Town)',
    },
    narratives: {
      'Embarque': 'Saida rumo a Africa do Sul. O voo para Cidade do Cabo dura em media 12 horas com conexao em Joanesburgo ou via Addis Abeba.',
      'Chegada': 'Welcome to Cape Town! A vista da Table Mountain desde a rodovia e a primeira de muitas que vao tirar seu folego. Apos o check-in, um passeio pelo V&A Waterfront ao por do sol e a recepcao perfeita.',
      'Cultura': 'A Table Mountain e a icone maxima — o teleferico sobe 1.085m em 5 minutos para vistas de 360 graus. Robben Island, onde Mandela ficou preso por 18 anos, e uma visita profundamente emocionante. O Zeitz MOCAA e o maior museu de arte africana contemporanea do mundo.',
      'Gastronomia': 'Cape Town e uma capital gastronomica emergente. O V&A Food Market reune os melhores chefs locais. A culinaria Cape Malay no bairro de Bo-Kaap — bobotie, samoosas, koeksisters — e unica no mundo.',
      'Passeios': 'O V&A Waterfront combina compras, restaurantes e vistas do porto. Camps Bay tem a praia mais cinematografica da cidade — montanhas atras, oceano a frente. Kirstenbosch, aos pes da Table Mountain, e um dos jardins botanicos mais bonitos do mundo.',
      'Descobertas': 'Woodstock e o bairro criativo de Cape Town — a Old Biscuit Mill aos sabados e um mercado gastro/artesanal imperdivel. Greenmarket Square tem artesanato africano autentico.',
      'Aventura': 'A rota ate Cape Point (Cabo da Boa Esperanca) e uma das drives mais cenarias do mundo. Boulders Beach tem uma colonia de pinguins africanos. Chapman\'s Peak Drive serpenteia entre montanhas e oceano.',
      'Retorno': 'Ultimo cafe com vista para a Table Mountain. Leve biltong e rooibos como lembrancas!',
    },
  },

  'joanesburgo': {
    photos: [
      'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Joanesburgo, a cidade do ouro, e o coracao economico e cultural da Africa do Sul. O Museu do Apartheid e uma visita obrigatoria. Soweto, bairro de Mandela, conta a historia da luta pela liberdade. A cena artistica e gastronomica de Maboneng e Braamfontein surpreende.',
    info: { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo M', language: 'Ingles/Zulu/Sotho', currency: 'Rand Sul-Africano (ZAR)', visa: 'Isento para brasileiros ate 90 dias' },
    tips: {
      tips: 'Use Uber em vez de andar sozinho a noite. Sandton City e a area mais segura para turistas.',
      water: 'Segura da torneira',
      tipping: '10-15% em restaurantes.',
      phrases: ['Sawubona (Ola em Zulu)', 'Ngiyabonga (Obrigado em Zulu)', 'Sharp sharp! (Tudo certo!)'],
      embassy: 'Embaixada do Brasil: +27 12 366 5200 | Hillcrest Office Park, Pretoria',
    },
    narratives: {
      'Cultura': 'O Museu do Apartheid e uma das experiencias mais impactantes do mundo — reserve pelo menos 3 horas. Constitution Hill conta a historia da democracia sul-africana. Soweto, com a casa de Mandela e o Memorial Hector Pieterson, e essencial.',
      'Gastronomia': 'Neighbourgoods Market em Braamfontein aos sabados reune o melhor da culinaria multicultural de Joburg. A cena de parrilla e craft beer em Maboneng e surpreendente.',
      'Aventura': 'Pilanesberg, a 2h de carro, oferece safari Big Five sem malaria. O Cradle of Humankind (UNESCO) abriga fosseis de 3 milhoes de anos.',
    },
  },

  'marrakech': {
    photos: [
      'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Marrakech e um assalto aos sentidos: cores, aromas e sons da medina UNESCO se misturam em labirintos milenares. Dos souks vibrantes ao Jardin Majorelle de Yves Saint Laurent, a cidade vermelha e uma experiencia unica entre Africa e Oriente.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '220V - Tomada tipo C/E', language: 'Arabe/Frances/Berbere', currency: 'Dirham Marroquino (MAD)', visa: 'Isento para brasileiros ate 90 dias' },
    tips: {
      tips: 'Pechinche em TUDO nos souks — comece oferecendo 1/3 do preco. Contrate guia oficial na medina.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes. Guias e motoristas esperam gorjeta.',
      phrases: ['Salam (Ola)', 'Shukran (Obrigado)', 'Bshhal? (Quanto?)', 'La shukran (Nao obrigado)', 'Inshallah (Se Deus quiser)'],
      embassy: 'Embaixada do Brasil: +212 537 73 47 48 | Rabat',
    },
    narratives: {
      'Cultura': 'A Medina de Marrakech (UNESCO) e um labirinto de 600 anos. O Palais Bahia e a Madrasa Ben Youssef sao joias da arquitetura islamica.',
      'Gastronomia': 'Jemaa el-Fnaa ao anoitecer transforma-se no maior restaurante a ceu aberto do mundo. Tagine, couscous e cha de menta sao obrigatorios.',
      'Aventura': 'As montanhas do Atlas ficam a 1h — vale de Ourika, cascatas e aldeias berberes. Essaouira na costa oferece brisa oceanica e medina tranquila.',
    },
  },

  'nairobi': {
    photos: [
      'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Nairobi e a porta de entrada para o safari africano. O David Sheldrick Wildlife Trust (elefantes orfaos) e o Giraffe Centre sao experiencias unicas. O Nairobi National Park oferece safari com skyline de fundo — unico no mundo.',
    info: { timezone: 'UTC+3 (6h a frente do Brasil)', voltage: '240V - Tomada tipo G', language: 'Ingles/Suaili', currency: 'Xelim Queniano (KES)', visa: 'eVisa obrigatorio para brasileiros' },
    tips: {
      tips: 'Contrate safari com operador certificado. Nairobi pode ser fria (1.600m altitude).',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes. Gorjeta para guias de safari: USD 10-20/dia.',
      phrases: ['Jambo (Ola)', 'Asante sana (Muito obrigado)', 'Hakuna matata (Sem problemas)', 'Karibu (Bem-vindo)'],
      embassy: 'Embaixada do Brasil: +254 20 271 3092 | Nairobi',
    },
    narratives: {
      'Cultura': 'O Giraffe Centre permite alimentar girafas Rothschild ameacadas. O David Sheldrick cuida de elefantes orfaos — a visita das 11h e emocionante.',
      'Aventura': 'Masai Mara e o santo graal dos safaris — a grande migracao (jul-out) e um dos maiores espetaculos da natureza.',
    },
  },

  // ═══ SOUTH AMERICA ═══════════════════════════════════════════════════
  'santiago': {
    photos: [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Santiago combina uma cena gastronomica emergente com a cordilheira dos Andes como cenario permanente. Do Cerro San Cristobal ao bairro bohemio de Bellavista, a capital chilena surpreende com cultura, vinhos e natureza a poucos minutos do centro.',
    info: { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/L', language: 'Espanhol', currency: 'Peso Chileno (CLP)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Metro e eficiente e seguro. Cerro San Cristobal tem a melhor vista dos Andes.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes (propina).',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto vale? (Quanto custa?)', 'Cachai? (Entendeu? - giria)'],
      embassy: 'Embaixada do Brasil: +56 2 2820 5800 | Alonso Ovalle 1665',
    },
    narratives: {
      'Cultura': 'O Cerro San Cristobal oferece vista panoramica dos Andes nevados. O Museu de la Memoria conta a historia do Chile sob Pinochet — visita poderosa e gratuita.',
      'Gastronomia': 'O Mercado Central e patrimonio nacional — ceviche, caldillo de congrio e centolla (caranguejo gigante). A rota dos vinhos no Vale do Maipo fica a 45 min.',
      'Aventura': 'Cajon del Maipo, a 1h30, oferece rafting, termas e vistas andinas. No inverno, estacoes de esqui como Valle Nevado ficam a apenas 1h.',
    },
  },

  'lima': {
    photos: [
      'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Lima e a capital gastronomica das Americas. Com 3 dos 50 melhores restaurantes do mundo (Central, Maido, Kjolle), a cidade surpreende com sua culinaria. O centro historico UNESCO, Miraflores a beira-mar e o bairro bohemio de Barranco completam a experiencia.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Espanhol/Quechua', currency: 'Sol Peruano (PEN)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Reserve Central e Maido com semanas de antecedencia. Miraflores e a zona mais segura.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Chevere (Legal!)', 'La cuenta (A conta)'],
      embassy: 'Embaixada do Brasil: +51 1 512 0830 | Av. Jose Pardo 850, Miraflores',
    },
    narratives: {
      'Gastronomia': 'Lima e a capital gastronomica das Americas. Ceviche no Mercado de Surquillo, anticuchos nas barracas de Miraflores, e alta cozinha peruana em Central (Top 1 do mundo em 2023).',
      'Cultura': 'O centro historico (UNESCO) abriga a Plaza de Armas, a catedral e o convento de San Francisco com catacumbas subterraneas.',
    },
  },

  'cusco': {
    photos: [
      'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1580968989703-33b3087abfb0?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Cusco e a antiga capital do Imperio Inca e porta de entrada para Machu Picchu. A 3.400m de altitude, a cidade mistura ruinas incas com arquitetura colonial espanhola. O Vale Sagrado e o complexo de Sacsayhuaman sao tao impressionantes quanto a cidadela perdida.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Espanhol/Quechua', currency: 'Sol Peruano (PEN)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Chegue 1-2 dias antes de Machu Picchu para aclimatar. Cha de coca ajuda com a altitude.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes. Gorjeta para guias de trekking.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Allillanchu (Como vai? em Quechua)'],
      embassy: 'Consulado do Brasil em Lima: +51 1 512 0830',
    },
    narratives: {
      'Cultura': 'A Plaza de Armas de Cusco foi o coracao do Imperio Inca. O Qoricancha (Templo do Sol) tinha paredes cobertas de ouro. Sacsayhuaman tem pedras de 120 toneladas encaixadas sem argamassa.',
      'Aventura': 'Machu Picchu e uma das novas 7 maravilhas — reserve ingresso com meses de antecedencia. O Vale Sagrado (Ollantaytambo, Pisac, Moray) merece um dia inteiro.',
    },
  },

  'bogota': {
    photos: [
      'https://images.unsplash.com/photo-1568832232966-0e0e2a5e420c?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1593453076117-e tried-of-bogota?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Bogota surpreende com cultura, gastronomia e arte. O bairro La Candelaria tem museus de classe mundial (Museu do Ouro, Botero). A cena gastronomica explodiu — restaurantes como El Chato e Leo estao entre os melhores da America Latina.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '110V - Tomada tipo A/B', language: 'Espanhol', currency: 'Peso Colombiano (COP)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Altitude de 2.600m — aclimate antes de caminhar muito. TransMilenio e o transporte principal.',
      water: 'Segura da torneira em Bogota',
      tipping: '10% em restaurantes (propina voluntaria).',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Chevere (Legal!)', 'Parcero (Amigo)', 'Que mas? (E ai?)'],
      embassy: 'Embaixada do Brasil: +57 1 218 0800 | Calle 93 No. 14-20',
    },
    narratives: {
      'Cultura': 'O Museu do Ouro tem 55.000 pecas pre-colombianas — a sala escura com a balsa Muisca e hipnotizante. Monserrate, a 3.150m, oferece vista total da cidade.',
      'Gastronomia': 'La Candelaria tem restaurantes de autor em casas coloniais. Prove o ajiaco bogotano (sopa tipica) e a changua no cafe da manha.',
    },
  },

  'cartagena': {
    photos: [
      'https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1536350385691-e5e7d0a7a1c7?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Cartagena e a perola do Caribe colombiano. A cidade amuralhada (UNESCO) tem ruas de paralelepipedos, fachadas coloridas e bougainvilleas em cada balcao. Getsemani e o bairro mais vibrante — street art, musica e vida noturna.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '110V - Tomada tipo A/B', language: 'Espanhol', currency: 'Peso Colombiano (COP)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Negocie passeios de barco. Caminhe pela cidade amuralhada de manha (menos calor).',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Chevere (Legal!)', 'Que frio! (Que legal!)'],
      embassy: 'Consulado do Brasil: +57 5 665 0498 | Cartagena',
    },
    narratives: {
      'Cultura': 'A cidade amuralhada (UNESCO) foi construida pelos espanhois para proteger o ouro do Novo Mundo. O Castelo de San Felipe e a maior fortaleza colonial das Americas.',
      'Aventura': 'As Ilhas do Rosario (1h de barco) tem praias caribenhas perfeitas. Playa Blanca em Baru e a mais famosa da regiao.',
    },
  },

  'montevideu': {
    photos: [
      'https://images.unsplash.com/photo-1597934301324-15e56f66038c?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1610991149688-c1321006bcc1?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Montevideu e uma capital descontraida com rambla a beira-mar, mercados historicos e a melhor carne do mundo. A Ciudad Vieja tem vida cultural intensa, o Mercado del Puerto e obrigatorio para parrilla, e a Rambla tem 22km de calma uruguaia.',
    info: { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/F/L', language: 'Espanhol', currency: 'Peso Uruguaio (UYU)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'A Rambla e perfeita para caminhada/corrida. Mercado del Puerto e melhor aos sabados.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Ta (OK)', 'Bo (Vamos!)'],
      embassy: 'Embaixada do Brasil: +598 2 707 2119 | Bvd. Artigas 1394',
    },
    narratives: {},
  },

  'bariloche': {
    photos: [
      'https://images.unsplash.com/photo-1551279880-03041633c546?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1599578992643-0a3fdd03bf7b?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Bariloche e a Suica argentina — lagos cristalinos, montanhas nevadas e chocolaterias em cada esquina. No inverno, Cerro Catedral e a maior estacao de esqui da America do Sul. No verao, trilhas, rafting e circuitos de cerveja artesanal.',
    info: { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/I', language: 'Espanhol', currency: 'Peso Argentino (ARS)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Leve dolares em especie. A Ruta de los Siete Lagos e imperdivel de carro.',
      water: 'Segura da torneira (agua de degelo)',
      tipping: '10% em restaurantes.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Che (Ei!)', 'Barbaro! (Legal!)'],
      embassy: 'Consulado do Brasil em Buenos Aires: +54 11 4515 2400',
    },
    narratives: {
      'Aventura': 'Cerro Catedral no inverno e o maior centro de esqui da America do Sul. No verao, a Ruta de los Siete Lagos conecta lagos de cor irreal.',
    },
  },

  'mendoza': {
    photos: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Mendoza e a capital mundial do Malbec. Mais de 1.500 vinicolas produzem vinhos excepcionais com os Andes como cenario. Alem do vinho, a cidade oferece rafting, montanhismo e a proximidade do Aconcagua, o pico mais alto das Americas.',
    info: { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/I', language: 'Espanhol', currency: 'Peso Argentino (ARS)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'Alugue bicicleta para visitar vinicolas em Maipu. Leve dolares em especie.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Salud! (Saude, ao brindar)', 'Che (Ei!)', 'Gracias (Obrigado)'],
      embassy: 'Consulado do Brasil em Buenos Aires: +54 11 4515 2400',
    },
    narratives: {},
  },

  'medellin': {
    photos: [
      'https://images.unsplash.com/photo-1599413987323-b2b8c0d187a2?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1577587230708-187fdbef4d91?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Medellin, a cidade da eterna primavera, e uma das transformacoes urbanas mais impressionantes do mundo. O metro, os parques-biblioteca e a Comuna 13 (de zona de conflito a galeria de street art) contam uma historia de resiliencia.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '110V - Tomada tipo A/B', language: 'Espanhol', currency: 'Peso Colombiano (COP)', visa: 'Isento para brasileiros - apenas RG' },
    tips: {
      tips: 'O metro de Medellin e orgulho local — mantenha-o limpo. Comuna 13 so com guia local.',
      water: 'Segura da torneira em Medellin',
      tipping: '10% em restaurantes.',
      phrases: ['Hola (Ola)', 'Parcero (Amigo)', 'Que mas pues? (E ai?)'],
      embassy: 'Consulado do Brasil: +57 4 381 0033 | Medellin',
    },
    narratives: {},
  },

  // ═══ EUROPE (MISSING) ═══════════════════════════════════════════════
  'praga': {
    photos: [
      'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Praga e um museu a ceu aberto — o Castelo, a Ponte Carlos e a Praca da Cidade Velha com o Relogio Astronomico (1410) formam um conjunto gotico e barroco incomparavel. A cerveja tcheca e a melhor e mais barata da Europa.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/E', language: 'Tcheco', currency: 'Coroa Tcheca (CZK)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Praga e muito acessivel a pe. Cerveja e mais barata que agua — prove a Pilsner Urquell.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes. Arredondar em bares.',
      phrases: ['Ahoj (Ola)', 'Dekuji (Obrigado)', 'Kolik? (Quanto?)', 'Pivo prosim (Uma cerveja, por favor)'],
      embassy: 'Embaixada do Brasil: +420 233 371 661 | Panenska 4, Praga 6',
    },
    narratives: {
      'Cultura': 'O Castelo de Praga e o maior complexo de castelo do mundo — a Catedral de Sao Vito levou 600 anos para ser construida. A Ponte Carlos (1357) tem 30 estatuas barrocas.',
      'Gastronomia': 'A cerveja tcheca e patrimonio nacional. Prove a Pilsner Urquell, a Kozel e a Staropramen nas pivovarnas tradicionais de Mala Strana.',
    },
  },

  'viena': {
    photos: [
      'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Viena e a capital da musica classica, dos palacios imperiais e dos cafes centenarios. O Palacio de Schonbrunn, a Opera Estatal e os museus do Ringstrasse fazem desta cidade uma das mais elegantes do mundo.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Alemao', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Vienna Pass inclui transporte + museus. Cafes vienenses sao patrimonio UNESCO.',
      water: 'Segura da torneira (agua alpina excelente)',
      tipping: '5-10% em restaurantes.',
      phrases: ['Gruss Gott (Ola)', 'Danke (Obrigado)', 'Bitte (Por favor)', 'Wie viel? (Quanto?)'],
      embassy: 'Embaixada do Brasil: +43 1 512 0631 | Pestalozzigasse 4',
    },
    narratives: {},
  },

  'berlim': {
    photos: [
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1546726747-421c6d69c929?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Berlim e uma cidade que reinventa o passado. O Muro, o Portao de Brandemburgo, a Ilha dos Museus (UNESCO) — a historia e onipresente. Mas Berlim tambem e a capital da arte contemporanea, da techno e da contracultura europeia.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Alemao', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'U-Bahn e S-Bahn cobrem tudo. Domingo o Mauerpark Flea Market e imperdivel.',
      water: 'Segura da torneira',
      tipping: '5-10% em restaurantes.',
      phrases: ['Hallo (Ola)', 'Danke (Obrigado)', 'Bitte (Por favor)', 'Wie viel? (Quanto?)'],
      embassy: 'Embaixada do Brasil: +49 30 726 280 | Wallstrasse 57',
    },
    narratives: {
      'Cultura': 'A Ilha dos Museus (UNESCO) reune 5 museus de classe mundial — o Pergamon com o Altar de Zeus e o Portal de Ishtar e imperdivel. O Memorial do Holocausto e profundamente impactante.',
    },
  },

  'madri': {
    photos: [
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Madri e energia pura — da vida noturna que comeca a meia-noite ate os museus do Triangulo da Arte (Prado, Reina Sofia, Thyssen). O Retiro, a Gran Via e o mercado de San Miguel completam uma capital que vive intensamente.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Espanhol', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Jantar so comeca as 21h-22h. O Prado e gratuito das 18h as 20h.',
      water: 'Segura da torneira',
      tipping: 'Arredondar a conta. 5-10% em restaurantes finos.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Que guay! (Que legal!)'],
      embassy: 'Embaixada do Brasil: +34 91 700 4650 | Fernando el Santo 6',
    },
    narratives: {},
  },

  'florenca': {
    photos: [
      'https://images.unsplash.com/photo-1543429776-2782f8b79a71?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Florenca e o berco do Renascimento. A Galleria degli Uffizi, o Duomo de Brunelleschi e o David de Michelangelo estao a poucos passos um do outro. A culinaria toscana — bistecca alla fiorentina, ribollita, cantucci — e simples e genial.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Reserve Uffizi e Accademia (David) com antecedencia. Ponte Vecchio ao por do sol e magico.',
      water: 'Segura da torneira',
      tipping: 'Coperto incluso. Nao e esperada.',
      phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Quanto costa? (Quanto custa?)'],
      embassy: 'Consulado do Brasil em Roma: +39 06 6835 7800',
    },
    narratives: {},
  },

  'veneza': {
    photos: [
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Veneza e unica no mundo — 118 ilhas conectadas por 400 pontes sobre 150 canais. A Piazza San Marco, o Palazzo Ducale e um passeio de gondola sao experiencias que nenhuma foto consegue capturar.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Vaporetto (barco-bus) e o transporte. Evite restaurantes na Piazza San Marco (precos absurdos).',
      water: 'Segura da torneira',
      tipping: 'Coperto incluso. Nao e esperada.',
      phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Un spritz per favore! (Um spritz!)'],
      embassy: 'Consulado do Brasil em Roma: +39 06 6835 7800',
    },
    narratives: {},
  },

  'dublin': {
    photos: [
      'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1564959130747-897fb406b9af?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Dublin e a capital dos pubs, da literatura e do humor irlandes. O Trinity College (Book of Kells), o Temple Bar e a Guinness Storehouse sao imperdíveis. Os falésias de Moher ficam a 3h e valem cada minuto de estrada.',
    info: { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Ingles/Irlandes', currency: 'Euro (EUR)', visa: 'Necessario visto para brasileiros' },
    tips: {
      tips: 'Leve capa de chuva sempre. Temple Bar e turistico — pubs autenticos ficam nas ruas laterais.',
      water: 'Segura da torneira',
      tipping: '10-15% em restaurantes.',
      phrases: ['Hello (Ola)', 'Cheers (Obrigado/Saude)', 'Craic (Diversao/Novidades)', 'Slainte! (Saude, ao brindar)'],
      embassy: 'Embaixada do Brasil: +353 1 475 6000 | Harcourt Centre, Dublin 2',
    },
    narratives: {},
  },

  'budapeste': {
    photos: [
      'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Budapeste e duas cidades em uma — Buda (colinas, castelo, banhos termais) e Peste (parlamento, ruinbars, vida noturna). O Parlamento a noite refletido no Danubio e uma das vistas mais bonitas da Europa.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Hungaro', currency: 'Florim Hungaro (HUF)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Os banhos termais Szechenyi sao obrigatorios. Ruinbars como Szimpla Kert sao unicos.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Szia (Ola)', 'Koszonom (Obrigado)', 'Mennyibe kerul? (Quanto custa?)', 'Egeszsegere! (Saude!)'],
      embassy: 'Embaixada do Brasil: +36 1 351 0060 | Nagykovacsi ut 3-5',
    },
    narratives: {},
  },

  'atenas': {
    photos: [
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Atenas e o berco da civilizacao ocidental. A Acropole e o Partenon dominam o horizonte. Plaka, aos pes da colina sagrada, e um labirinto de tavernas, lojas e historia. A comida grega — moussaka, souvlaki, baklava — e simples e deliciosa.',
    info: { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Grego', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Va a Acropole logo cedo (abre as 8h) para evitar calor e multidoes.',
      water: 'Segura da torneira',
      tipping: 'Arredondar a conta. 5-10% em restaurantes.',
      phrases: ['Yassas (Ola)', 'Efharisto (Obrigado)', 'Poso? (Quanto?)', 'Opa! (Saude!)'],
      embassy: 'Embaixada do Brasil: +30 210 721 3039 | Vass. Sofias 23',
    },
    narratives: {
      'Cultura': 'A Acropole e o Partenon (447 a.C.) sao a quintessencia da civilizacao classica. O novo Museu da Acropole e arquitetura moderna sobre ruinas de 2.500 anos.',
    },
  },

  'santorini': {
    photos: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Santorini e a ilha dos sonhos — casas brancas com cupulas azuis sobre falesias vulcanicas, por do sol em Oia que faz o mundo parar, e praias de areia preta e vermelha. Uma das experiencias mais fotografadas do planeta.',
    info: { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Grego', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Reserve restaurantes em Oia para o por do sol com semanas de antecedencia.',
      water: 'Segura da torneira (dessalinizada)',
      tipping: '5-10% em restaurantes.',
      phrases: ['Yassas (Ola)', 'Efharisto (Obrigado)', 'Opa! (Saude!)'],
      embassy: 'Embaixada do Brasil em Atenas: +30 210 721 3039',
    },
    narratives: {},
  },

  'istambul': {
    photos: [
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Istambul e a unica cidade em dois continentes — Europa e Asia divididas pelo Bosforo. A Hagia Sophia, a Mesquita Azul e o Grande Bazar formam um trio historico incomparavel. A culinaria turca e uma das mais ricas do mundo.',
    info: { timezone: 'UTC+3 (6h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Turco', currency: 'Lira Turca (TRY)', visa: 'eVisa para brasileiros' },
    tips: {
      tips: 'Istanbulkart e obrigatorio para transporte. O Grande Bazar tem 4.000 lojas — va com mapa.',
      water: 'Prefira engarrafada',
      tipping: '10-15% em restaurantes.',
      phrases: ['Merhaba (Ola)', 'Tesekkur ederim (Obrigado)', 'Ne kadar? (Quanto?)', 'Guzel! (Bonito!)'],
      embassy: 'Consulado do Brasil: +90 212 293 9838 | Istiklal Cad. 8, Beyoglu',
    },
    narratives: {
      'Cultura': 'A Hagia Sophia (537 d.C.) ja foi igreja, mesquita e museu — hoje e mesquita novamente. A Mesquita Azul, com seus 20 mil azulejos azuis, fica em frente. A Cisterna Basilica e um palacio subterraneo com 336 colunas.',
    },
  },

  'porto': {
    photos: [
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'O Porto e a alma de Portugal — o vinho do Porto, os azulejos da Estacao de Sao Bento, a Livraria Lello (inspiracao para Harry Potter) e a Ribeira (UNESCO) fazem desta cidade uma das mais encantadoras da Europa.',
    info: { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Portugues', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Degustacao de vinho do Porto em Vila Nova de Gaia e obrigatoria. A Livraria Lello exige ingresso.',
      water: 'Segura da torneira',
      tipping: '5-10% em restaurantes.',
      phrases: ['Ola', 'Obrigado/a', 'Quanto custa?', 'A conta, por favor'],
      embassy: 'Consulado do Brasil no Porto: +351 22 600 7010',
    },
    narratives: {},
  },

  'dubrovnik': {
    photos: [
      'https://images.unsplash.com/photo-1555990793-da11153b2473?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Dubrovnik, a Perola do Adriatico, e uma cidade medieval amuralhada que se tornou cenario de Game of Thrones (Kings Landing). As muralhas do seculo XIII, o Stradun e o mar turquesa fazem desta cidade um destino inesquecivel.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Croata', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Caminhe pelas muralhas logo cedo (7h30). Kayak ate a ilha de Lokrum e imperdivel.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Bok (Ola)', 'Hvala (Obrigado)', 'Koliko? (Quanto?)'],
      embassy: 'Embaixada do Brasil em Zagreb: +385 1 468 0522',
    },
    narratives: {},
  },

  'sevilha': {
    photos: [
      'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Sevilha e a alma da Espanha — flamenco, tapas e arquitetura moura em cada esquina. O Real Alcazar, a Catedral (maior do mundo gotico) e a Plaza de Espana formam um trio tao impressionante quanto Barcelona, com menos turistas.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Espanhol', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'No verao passa de 40C — visite monumentos pela manha. Tapas sao gratuitas com a bebida!',
      water: 'Segura da torneira',
      tipping: 'Arredondar a conta.',
      phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'Ole! (expressao de entusiasmo)'],
      embassy: 'Consulado do Brasil em Madri: +34 91 700 4650',
    },
    narratives: {},
  },

  'nice': {
    photos: [
      'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Nice e a joia da Cote dAzur — a Promenade des Anglais, o Vieux Nice com seus mercados de flores e a luz que inspirou Matisse e Chagall. Monaco, Cannes e Eze ficam a menos de 30 minutos.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/E', language: 'Frances', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'O trem regional conecta Nice a Monaco (20min) e Cannes (30min) por menos de 5 euros.',
      water: 'Segura da torneira',
      tipping: 'Service compris. Arredondar a conta.',
      phrases: ['Bonjour (Ola)', 'Merci (Obrigado)', 'Combien? (Quanto?)'],
      embassy: 'Consulado do Brasil em Paris: +33 1 45 61 63 00',
    },
    narratives: {},
  },

  'munique': {
    photos: [
      'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1577462281852-42b900e76c50?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Munique combina tradicao bavara com modernidade alema. A Marienplatz, o Englischer Garten e as cervejarias centenarias (Hofbrauhaus!) definem a cidade. Os castelos de Ludwig II (Neuschwanstein) ficam a apenas 2h.',
    info: { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Alemao', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
    tips: {
      tips: 'Hofbrauhaus e turistico mas vale a visita. Augustiner e a cervejaria preferida dos locals.',
      water: 'Segura da torneira (agua alpina excelente)',
      tipping: '5-10% em restaurantes.',
      phrases: ['Gruss Gott (Ola bavaro)', 'Danke (Obrigado)', 'Ein Bier bitte (Uma cerveja!)'],
      embassy: 'Consulado do Brasil: +49 89 210 3160 | Munique',
    },
    narratives: {
      'Aventura': 'O Castelo de Neuschwanstein (inspiracao para a Disney) fica a 2h de trem. Reserve ingresso online.',
    },
  },

  // ═══ ASIA (MISSING) ═══════════════════════════════════════════════
  'hanoi': {
    photos: [
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1555921015-5532091f6026?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Hanoi e um caos encantador — motos por todos os lados, street food nas calcadas, lagos serenos e templos milenares. O Old Quarter, o Templo da Literatura e o Ho Chi Minh Mausoleum contam mil anos de historia. Halong Bay fica a 3h.',
    info: { timezone: 'UTC+7 (10h a frente do Brasil)', voltage: '220V - Tomada tipo A/C', language: 'Vietnamita', currency: 'Dong Vietnamita (VND)', visa: 'eVisa para brasileiros' },
    tips: {
      tips: 'Grab (como Uber) funciona bem. Atravesse a rua com calma — as motos desviam de voce.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: 'Nao esperada. Arredondar e gentileza.',
      phrases: ['Xin chao (Ola)', 'Cam on (Obrigado)', 'Bao nhieu? (Quanto?)', 'Ngon qua! (Delicioso!)'],
      embassy: 'Embaixada do Brasil: +84 24 3843 2544 | Hanoi',
    },
    narratives: {
      'Gastronomia': 'Hanoi e a capital mundial do pho — prove no Pho Thin (desde 1979). O bun cha (carne grelhada com noodles) foi o prato que Obama comeu com Bourdain. Egg coffee no Giang Cafe e unico.',
      'Aventura': 'Halong Bay (UNESCO) tem 1.600 ilhas calcarias — um cruzeiro de 1-2 noites e imperdivel.',
    },
  },

  'seul': {
    photos: [
      'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Seul e onde palacios do seculo XV convivem com arranha-ceus futuristas. O Gyeongbokgung, os bairros de Hongdae e Gangnam, o street food de Myeongdong e a cultura K-pop fazem desta cidade uma das mais dinamicas da Asia.',
    info: { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Coreano', currency: 'Won Sul-Coreano (KRW)', visa: 'Isento para brasileiros ate 90 dias' },
    tips: {
      tips: 'T-money card para transporte. Comida de rua em Myeongdong e Gwangjang Market e imperdivel.',
      water: 'Segura da torneira (mas coreanos preferem engarrafada)',
      tipping: 'NUNCA de gorjeta — nao e costume.',
      phrases: ['Annyeonghaseyo (Ola)', 'Kamsahamnida (Obrigado)', 'Eolmayeyo? (Quanto?)', 'Mashisseoyo! (Delicioso!)'],
      embassy: 'Embaixada do Brasil: +82 2 738 4970 | Seul',
    },
    narratives: {
      'Cultura': 'O Gyeongbokgung (1395) e o maior palacio real — a troca de guarda e diaria. Alugue hanbok (roupa tradicional) para entrada gratuita. Bukchon Hanok Village tem casas tradicionais preservadas.',
    },
  },

  'kyoto': {
    photos: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Kyoto e o Japao eterno — 17 sitios UNESCO, 2.000 templos e santuarios, geishas em Gion e jardins zen que silenciam a mente. O Fushimi Inari (10.000 torii vermelhos), o Kinkaku-ji (Pavilhao Dourado) e o Arashiyama (bambuzal) sao iconicos.',
    info: { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '100V - Tomada tipo A/B', language: 'Japones', currency: 'Iene Japones (JPY)', visa: 'Isento para brasileiros ate 90 dias' },
    tips: {
      tips: 'Alugue bicicleta — Kyoto e plana e ciclavel. Fushimi Inari e gratuito e aberto 24h.',
      water: 'Segura da torneira',
      tipping: 'NUNCA de gorjeta — ofensivo no Japao.',
      phrases: ['Konnichiwa (Ola)', 'Arigatou (Obrigado)', 'Sumimasen (Com licenca)'],
      embassy: 'Consulado do Brasil em Nagoia: +81 52 222 1867',
    },
    narratives: {
      'Cultura': 'O Fushimi Inari tem 10.000 torii vermelhos subindo a montanha — chegue as 6h para fotos sem multidao. O Kinkaku-ji (Pavilhao Dourado) refletido no lago e a imagem mais iconica do Japao.',
    },
  },

  'nova delhi': {
    photos: [
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Nova Delhi e a porta de entrada para a India — o Taj Mahal (Agra, 3h), o Forte Vermelho e o caos vibrante de Old Delhi. A culinaria indiana aqui e a mais diversa do mundo — do butter chicken de Chandni Chowk ao fine dining de Connaught Place.',
    info: { timezone: 'UTC+5:30 (8h30 a frente do Brasil)', voltage: '230V - Tomada tipo C/D/M', language: 'Hindi/Ingles', currency: 'Rupia Indiana (INR)', visa: 'eVisa para brasileiros' },
    tips: {
      tips: 'Uber e Ola funcionam bem. O metro e seguro e eficiente. Leve adaptador universal.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: '10% em restaurantes.',
      phrases: ['Namaste (Ola)', 'Dhanyavaad (Obrigado)', 'Kitna? (Quanto?)', 'Shukriya (Obrigado, informal)'],
      embassy: 'Embaixada do Brasil: +91 11 3018 9999 | Nova Delhi',
    },
    narratives: {
      'Aventura': 'O Taj Mahal em Agra (3h de trem) e uma das novas 7 maravilhas — va ao nascer do sol para luz perfeita e menos turistas.',
    },
  },

  'male': {
    photos: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'As Maldivas sao o paraiso na Terra — aguas cristalinas em 26 atois, overwater bungalows, snorkeling com raias manta e tubaroes-baleia. Male e apenas a porta de entrada para resorts que redefinem o significado de luxo.',
    info: { timezone: 'UTC+5 (8h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Divehi/Ingles', currency: 'Rufiyaa (MVR), USD aceito', visa: 'Visto gratuito na chegada (30 dias)' },
    tips: {
      tips: 'Resorts all-inclusive sao recomendados — ilhas habitadas sao mais baratas. Sexta e dia de descanso.',
      water: 'Use engarrafada ou dessalinizada do resort.',
      tipping: '10% em resorts (service charge geralmente incluso).',
      phrases: ['Assalaam Alaikum (Ola)', 'Shukuriyyaa (Obrigado)'],
      embassy: 'Embaixada do Brasil em Colombo (Sri Lanka): +94 11 258 8922',
    },
    narratives: {},
  },

  'pequim': {
    photos: [
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Pequim e o coracao da China milenar. A Cidade Proibida (9.999 salas), a Grande Muralha e o Templo do Ceu formam o trio mais impressionante da Asia. A culinaria de Pequim — pato laqueado, jiaozi, hotpot — e uma experiencia a parte.',
    info: { timezone: 'UTC+8 (11h a frente do Brasil)', voltage: '220V - Tomada tipo A/C/I', language: 'Mandarim', currency: 'Yuan/Renminbi (CNY)', visa: 'Visto necessario para brasileiros (144h transit visa gratuito)' },
    tips: {
      tips: 'WeChat Pay e Alipay sao essenciais — dinheiro quase nao e aceito. VPN necessario para Google/WhatsApp.',
      water: 'NAO beba da torneira. Use engarrafada.',
      tipping: 'NAO de gorjeta — nao e costume na China.',
      phrases: ['Ni hao (Ola)', 'Xie xie (Obrigado)', 'Duo shao qian? (Quanto?)', 'Hao chi! (Delicioso!)'],
      embassy: 'Embaixada do Brasil: +86 10 6532 2881 | Pequim',
    },
    narratives: {
      'Aventura': 'A Grande Muralha — a secao Mutianyu (1h30 de Pequim) e a melhor combinacao de restauracao + paisagem + menos turistas que Badaling.',
    },
  },

  // ═══ USA (MISSING) ═══════════════════════════════════════════════
  'sao francisco': {
    photos: [
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Sao Francisco e uma das cidades mais iconicas dos EUA — a Golden Gate Bridge, o bondinho, Fishermans Wharf e Alcatraz. A diversidade cultural de Chinatown, Mission District e Castro faz desta cidade progressista e vibrante.',
    info: { timezone: 'UTC-8 (5h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
    tips: {
      tips: 'Leve agasalho mesmo no verao — o nevoeiro e gelado. Cable car custa USD 8.',
      water: 'Segura da torneira',
      tipping: '18-22% OBRIGATORIO em restaurantes.',
      phrases: ['How much? (Quanto?)', 'Check please (A conta)'],
      embassy: 'Consulado do Brasil em San Francisco: +1 415 981 8170',
    },
    narratives: {},
  },

  'los angeles': {
    photos: [
      'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Los Angeles e a capital do entretenimento — Hollywood, praias de Santa Monica, Venice Beach, museus como o Getty e o LACMA. A diversidade gastronomica e cultural e tao vasta quanto a cidade.',
    info: { timezone: 'UTC-8 (5h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles/Espanhol', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
    tips: {
      tips: 'Carro e essencial em LA. Trafego e pesado nas freeways no rush hour.',
      water: 'Segura da torneira',
      tipping: '18-22% OBRIGATORIO em restaurantes.',
      phrases: ['How much? (Quanto?)', 'Check please (A conta)'],
      embassy: 'Consulado do Brasil em LA: +1 323 651 2664',
    },
    narratives: {},
  },

  'las vegas': {
    photos: [
      'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Las Vegas e superlativos — os maiores cassinos, os melhores shows, buffets monumentais e a Strip iluminada como nenhum outro lugar no mundo. O Grand Canyon fica a 4h e Valley of Fire a 1h.',
    info: { timezone: 'UTC-8 (5h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
    tips: {
      tips: 'Hoteis na Strip sao baratos na semana. Calor extremo no verao (45C+). Shows Cirque du Soleil sao imperdíveis.',
      water: 'Segura da torneira',
      tipping: '18-22% em restaurantes. USD 1-2 por drink para dealers e bartenders.',
      phrases: ['How much? (Quanto?)', 'Hit me (Mais uma carta, blackjack)'],
      embassy: 'Consulado do Brasil em LA: +1 323 651 2664',
    },
    narratives: {},
  },

  'orlando': {
    photos: [
      'https://images.unsplash.com/photo-1575089776834-8be34696a180?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Orlando e a capital mundial dos parques tematicos — Walt Disney World, Universal Studios, SeaWorld e LEGOLAND. Para alem dos parques, International Drive, outlets e restaurantes brasileiros completam a experiencia.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles/Portugues (muitos brasileiros)', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
    tips: {
      tips: 'Compre ingressos dos parques com antecedencia. Genie+ da Disney economiza filas. Outlets sao mais baratos que shoppings.',
      water: 'Segura da torneira',
      tipping: '18-22% OBRIGATORIO em restaurantes.',
      phrases: ['How much? (Quanto?)', 'Check please (A conta)'],
      embassy: 'Consulado do Brasil em Miami: +1 305 285 6200',
    },
    narratives: {},
  },

  'toronto': {
    photos: [
      'https://images.unsplash.com/photo-1517090504332-4b65ee80bb84?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1507992781348-310259076fe0?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Toronto e a cidade mais multicultural do mundo — 200+ etnias, bairros tematicos (Chinatown, Little Italy, Greektown) e a CN Tower dominando o skyline. As Cataratas do Niagara ficam a apenas 1h30.',
    info: { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles/Frances', currency: 'Dolar Canadense (CAD)', visa: 'eTA para brasileiros com visto EUA valido' },
    tips: {
      tips: 'PATH e um sistema subterraneo de 30km conectando lojas e estacoes no inverno.',
      water: 'Segura da torneira',
      tipping: '15-20% em restaurantes.',
      phrases: ['Hello (Ola)', 'Thank you (Obrigado)', 'Eh? (ne? - giria canadense)'],
      embassy: 'Consulado do Brasil: +1 416 922 2503 | Toronto',
    },
    narratives: {},
  },

  // ═══ OCEANIA ═══════════════════════════════════════════════════════
  'sydney': {
    photos: [
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1524820197278-540916411e20?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Sydney combina praias espetaculares com vida urbana vibrante. A Opera House, a Harbour Bridge, Bondi Beach e os jardins botanicos reais formam um cenario incomparavel. A cena gastronomica multicultural e surpreendente.',
    info: { timezone: 'UTC+10 (13h a frente do Brasil)', voltage: '230V - Tomada tipo I', language: 'Ingles', currency: 'Dolar Australiano (AUD)', visa: 'eVisa para brasileiros' },
    tips: {
      tips: 'Opal Card para transporte. Bondi to Coogee coastal walk e gratuita e espetacular.',
      water: 'Segura da torneira',
      tipping: 'Nao obrigatoria. 10% em restaurantes finos e gentileza.',
      phrases: ["G'day (Ola)", 'Cheers (Obrigado)', 'No worries (Sem problemas)', 'Arvo (Tarde)'],
      embassy: 'Embaixada do Brasil: +61 2 6273 2372 | Canberra',
    },
    narratives: {},
  },

  'auckland': {
    photos: [
      'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Auckland, a Cidade das Velas, e cercada por 48 vulcoes extintos e dois oceanos. Sky Tower, Waiheke Island (vinicolas a 35min de ferry) e a cultura Maori fazem desta cidade a porta de entrada para a Nova Zelandia.',
    info: { timezone: 'UTC+12 (15h a frente do Brasil)', voltage: '230V - Tomada tipo I', language: 'Ingles/Maori', currency: 'Dolar Neozelandes (NZD)', visa: 'NZeTA para brasileiros' },
    tips: {
      tips: 'Waiheke Island e obrigatoria — vinicolas, praias e arte em 35min de ferry.',
      water: 'Segura da torneira',
      tipping: 'Nao esperada.',
      phrases: ['Kia ora (Ola em Maori)', 'Sweet as (Legal!)', 'Cheers (Obrigado)'],
      embassy: 'Embaixada do Brasil em Wellington: +64 4 473 3516',
    },
    narratives: {},
  },

  // ═══ BRAZIL ═══════════════════════════════════════════════════════
  'rio de janeiro': {
    photos: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'O Rio de Janeiro e a Cidade Maravilhosa — Cristo Redentor, Pao de Acucar, Copacabana e Ipanema sao apenas o comeco. A cultura carioca, o samba, a feijoada e o por do sol do Arpoador fazem do Rio um destino unico.',
    info: { timezone: 'UTC-3 (fuso de Brasilia)', voltage: '127V/220V - Tomada tipo N', language: 'Portugues', currency: 'Real (BRL)', visa: 'N/A (domestico)' },
    tips: {
      tips: 'Use VLT para o centro historico. Uber funciona bem. Evite ostentar objetos de valor.',
      water: 'Segura da torneira (mas cariocas preferem filtrada)',
      tipping: '10% em restaurantes (gorjeta geralmente inclusa na conta).',
      phrases: ['E ai? (Ola)', 'Valeu (Obrigado)', 'Tranquilo (De nada)'],
      embassy: 'N/A (destino domestico)',
    },
    narratives: {
      'Cultura': 'O Cristo Redentor no Corcovado (710m) e o Pao de Acucar oferecem as vistas mais iconicas do Rio. O Museu do Amanha e o Boulevard Olimpico revitalizaram a zona portuaria.',
      'Passeios': 'Copacabana, Ipanema e Leblon sao as praias mais famosas. O por do sol no Arpoador (entre Copacabana e Ipanema) e ritual carioca — a plateia aplaude quando o sol se poe.',
    },
  },

  'gramado': {
    photos: [
      'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Gramado e o destino mais charmoso do Sul do Brasil — arquitetura europeia, chocolaterias artesanais, fondue e o Natal Luz (maior evento natalino do Brasil). Canela ao lado tem o Parque do Caracol com cascata de 131m.',
    info: { timezone: 'UTC-3 (fuso de Brasilia)', voltage: '220V - Tomada tipo N', language: 'Portugues', currency: 'Real (BRL)', visa: 'N/A (domestico)' },
    tips: {
      tips: 'No inverno, temperaturas podem chegar perto de 0C. Chocolate Prawer e Lugano sao obrigatorios.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Bah (expressao gaucha)', 'Tchê (amigo)'],
      embassy: 'N/A (destino domestico)',
    },
    narratives: {},
  },

  'salvador': {
    photos: [
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1586793744669-1a48b9d59a8c?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'Salvador e o berco da cultura afro-brasileira — o Pelourinho (UNESCO), o acaraje, o candomble e a capoeira definem a identidade desta cidade vibrante. As praias urbanas e a musica (axe, pagode) completam a experiencia.',
    info: { timezone: 'UTC-3 (fuso de Brasilia)', voltage: '127V - Tomada tipo N', language: 'Portugues', currency: 'Real (BRL)', visa: 'N/A (domestico)' },
    tips: {
      tips: 'Elevador Lacerda conecta Cidade Alta e Cidade Baixa. Acaraje da Dinha no Rio Vermelho e lendario.',
      water: 'Segura da torneira (muitos preferem filtrada)',
      tipping: '10% em restaurantes.',
      phrases: ['Oi, meu rei/minha rainha (Ola afetuoso)', 'Oxe! (expressao de surpresa)'],
      embassy: 'N/A (destino domestico)',
    },
    narratives: {},
  },

  'foz do iguacu': {
    photos: [
      'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?w=1200&h=800&fit=crop&fm=jpg&q=80',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&h=800&fit=crop&fm=jpg&q=80',
    ],
    description: 'As Cataratas do Iguacu sao uma das 7 Novas Maravilhas da Natureza — 275 quedas dagua em 2,7km de extensao. A Garganta do Diabo e a mais impressionante. O lado brasileiro oferece a vista panoramica; o argentino permite caminhar sobre as quedas.',
    info: { timezone: 'UTC-3 (fuso de Brasilia)', voltage: '220V - Tomada tipo N', language: 'Portugues/Espanhol', currency: 'Real (BRL)', visa: 'N/A (domestico)' },
    tips: {
      tips: 'Visite os dois lados (brasileiro e argentino). Macuco Safari permite chegar de barco ate as quedas. Itaipu a noite e impressionante.',
      water: 'Segura da torneira',
      tipping: '10% em restaurantes.',
      phrases: ['Oi (Ola)', 'Obrigado/a'],
      embassy: 'N/A (destino domestico)',
    },
    narratives: {},
  },
};

// ── Export functions ──

export function getExpandedCityData(destination: string): CityPdfData | null {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const key = normalize(destination);
  
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    const nk = normalize(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  return null;
}

export function getAllExpandedPhotos(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    result[k] = v.photos;
  }
  return result;
}

export function getAllExpandedDescriptions(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    if (v.description) result[k] = v.description;
  }
  return result;
}

export function getAllExpandedInfo(): Record<string, CityPdfData['info']> {
  const result: Record<string, CityPdfData['info']> = {};
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    if (v.info) result[k] = v.info;
  }
  return result;
}

export function getAllExpandedTips(): Record<string, CityPdfData['tips']> {
  const result: Record<string, CityPdfData['tips']> = {};
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    if (v.tips) result[k] = v.tips;
  }
  return result;
}

export function getAllExpandedNarratives(): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [k, v] of Object.entries(EXPANDED_CITY_DATA)) {
    if (v.narratives && Object.keys(v.narratives).length > 0) result[k] = v.narratives;
  }
  return result;
}
