// Hotel Zones — Smart hotel recommendation based on travel interests

export interface HotelZone {
  name: string;
  neighborhood: string;
  whyGood: string;
  interests: string[];
}

export const HOTEL_ZONES: Record<string, HotelZone[]> = {
  'milao': [
    { name: 'Duomo/Centro', neighborhood: 'Centro', whyGood: 'Duomo, Galleria, La Scala a pe. O coracao de Milao. Shopping de luxo no Quadrilatero.', interests: ['culture', 'shopping', 'history', 'art'] },
    { name: 'Navigli', neighborhood: 'Navigli', whyGood: 'Canais historicos, vida noturna, restaurantes, galerias. O bairro mais charmoso de Milao.', interests: ['nightlife', 'gastronomy', 'art'] },
    { name: 'Brera', neighborhood: 'Brera', whyGood: 'Bairro artistico. Pinacoteca, galerias, cafes bohemios. Milao sofisticado e cultural.', interests: ['art', 'culture', 'gastronomy'] },
    { name: 'Porta Nuova/Isola', neighborhood: 'Isola', whyGood: 'Milao contemporaneo. Bosco Verticale, Eataly, design e inovacao.', interests: ['shopping', 'gastronomy', 'adventure'] },
  ],
  'bangkok': [
    { name: 'Sukhumvit (Asok/Nana)', neighborhood: 'Sukhumvit', whyGood: 'Epicentro de Bangkok. BTS Skytrain, rooftop bars, restaurantes internacionais.', interests: ['nightlife', 'gastronomy', 'shopping'] },
    { name: 'Riverside (Chao Phraya)', neighborhood: 'Riverside', whyGood: 'Hoteis premium a beira do rio. Acesso facil ao Grand Palace e Wat Arun de barco.', interests: ['culture', 'history', 'relaxation'] },
    { name: 'Khao San Road', neighborhood: 'Banglamphoo', whyGood: 'Coracao mochileiro de Bangkok. Barato, vibrante e perto dos templos historicos.', interests: ['adventure', 'nightlife'] },
    { name: 'Silom/Sathorn', neighborhood: 'Silom', whyGood: 'Distrito financeiro com excelentes restaurantes e vida noturna sofisticada.', interests: ['gastronomy', 'nightlife', 'shopping'] },
  ],
  'phuket': [
    { name: 'Patong Beach', neighborhood: 'Patong', whyGood: 'Principal praia de Phuket. Bangla Road, restaurantes, esportes aquaticos.', interests: ['beach', 'nightlife', 'shopping'] },
    { name: 'Kata/Karon Beach', neighborhood: 'Kata', whyGood: 'Praias mais tranquilas que Patong. Ideal para familias e surfistas iniciantes.', interests: ['beach', 'family', 'relaxation'] },
    { name: 'Old Phuket Town', neighborhood: 'Old Town', whyGood: 'Arquitetura sino-portuguesa, cafes artesanais e galerias. O lado cultural de Phuket.', interests: ['culture', 'art', 'gastronomy'] },
    { name: 'Cape Panwa/Rawai', neighborhood: 'Rawai', whyGood: 'Sul da ilha, longe do turismo de massa. Praias escondidas e mercado de frutos do mar.', interests: ['nature', 'relaxation', 'gastronomy'] },
  ],
  'paris': [
    { name: 'Le Marais (3e/4e)', neighborhood: 'Le Marais', whyGood: 'Bairro historico mais charmoso de Paris. Galerias, cafes, falafel na Rue des Rosiers.', interests: ['culture', 'art', 'gastronomy', 'history'] },
    { name: 'Saint-Germain (6e)', neighborhood: 'Saint-Germain', whyGood: 'Intelectual e sofisticado. Cafe de Flore, livrarias, galerias. Proximo ao Museu dOrsay.', interests: ['culture', 'art', 'gastronomy'] },
    { name: 'Montmartre (18e)', neighborhood: 'Montmartre', whyGood: 'Boemio e romantico. Sacre-Coeur, artistas de rua, bistrots autenticos.', interests: ['art', 'culture', 'nightlife'] },
    { name: 'Opera/Grands Boulevards (9e)', neighborhood: 'Opera', whyGood: 'Otima localizacao para compras (Galeries Lafayette) e proxima ao Louvre.', interests: ['shopping', 'culture', 'history'] },
  ],
  'roma': [
    { name: 'Centro Storico', neighborhood: 'Centro', whyGood: 'Piazza Navona, Pantheon, Fontana di Trevi a pe. O coracao de Roma.', interests: ['history', 'culture', 'art'] },
    { name: 'Trastevere', neighborhood: 'Trastevere', whyGood: 'Bairro mais charmoso de Roma. Ruelas, trattorias autenticas, vida noturna local.', interests: ['gastronomy', 'nightlife', 'culture'] },
    { name: 'Monti', neighborhood: 'Monti', whyGood: 'Bairro descolado proximo ao Coliseu. Boutiques, cafes artesanais e mercados vintage.', interests: ['art', 'shopping', 'gastronomy'] },
    { name: 'Vatican/Prati', neighborhood: 'Prati', whyGood: 'Proximo ao Vaticano. Ruas largas, restaurantes classicos. Otimo custo-beneficio.', interests: ['history', 'culture', 'family'] },
  ],
  'toquio': [
    { name: 'Shinjuku', neighborhood: 'Shinjuku', whyGood: 'Epicentro de Toquio. Kabukicho, Golden Gai, Gyoen Garden.', interests: ['nightlife', 'shopping', 'gastronomy'] },
    { name: 'Shibuya', neighborhood: 'Shibuya', whyGood: 'Jovem e energetico. Cruzamento famoso, Center Gai, Harajuku a pe.', interests: ['shopping', 'culture', 'nightlife'] },
    { name: 'Asakusa', neighborhood: 'Asakusa', whyGood: 'Toquio tradicional. Senso-ji, Nakamise, ryokans. Acesso ao Skytree.', interests: ['history', 'culture', 'gastronomy'] },
    { name: 'Ginza', neighborhood: 'Ginza', whyGood: 'Luxo e sofisticacao. Galerias de arte, sushi premium, lojas de grife.', interests: ['shopping', 'gastronomy', 'art'] },
  ],
  'londres': [
    { name: 'South Bank/Southwark', neighborhood: 'South Bank', whyGood: 'Tate Modern, Borough Market, Shakespeare Globe. Vista do Thames.', interests: ['art', 'gastronomy', 'culture'] },
    { name: 'Covent Garden/West End', neighborhood: 'Covent Garden', whyGood: 'Teatros, mercados cobertos, ruas vibrantes. Central para tudo.', interests: ['culture', 'shopping', 'nightlife'] },
    { name: 'Kensington/Chelsea', neighborhood: 'Kensington', whyGood: 'V&A, Natural History Museum, Hyde Park. Elegante e familiar.', interests: ['history', 'art', 'family'] },
    { name: 'Shoreditch', neighborhood: 'Shoreditch', whyGood: 'East London criativo. Street art, mercados vintage, bares alternativos.', interests: ['art', 'nightlife', 'gastronomy', 'adventure'] },
  ],
  'dubai': [
    { name: 'Downtown/Burj Khalifa', neighborhood: 'Downtown', whyGood: 'Burj Khalifa, Dubai Mall, Dubai Fountain. O epicentro do luxo.', interests: ['shopping', 'culture', 'family'] },
    { name: 'JBR/Marina', neighborhood: 'JBR', whyGood: 'Praia, restaurantes a beira-mar, roda-gigante, vida noturna.', interests: ['beach', 'nightlife', 'gastronomy'] },
    { name: 'Deira/Al Fahidi', neighborhood: 'Deira', whyGood: 'Dubai historico. Souks de ouro e especiarias, Creek, abra rides.', interests: ['history', 'culture', 'shopping'] },
    { name: 'Palm Jumeirah', neighborhood: 'Palm', whyGood: 'Resorts exclusivos na ilha artificial. Atlantis, praias privativas.', interests: ['beach', 'relaxation', 'family'] },
  ],
  'nova york': [
    { name: 'Midtown Manhattan', neighborhood: 'Midtown', whyGood: 'Times Square, Broadway, MoMA, Central Park a pe.', interests: ['culture', 'shopping', 'nightlife'] },
    { name: 'SoHo/Greenwich Village', neighborhood: 'SoHo', whyGood: 'Galerias de arte, boutiques, restaurantes farm-to-table, jazz clubs.', interests: ['art', 'gastronomy', 'nightlife', 'shopping'] },
    { name: 'Lower East Side/Williamsburg', neighborhood: 'LES', whyGood: 'Bares alternativos, street food, mercados, cena musical.', interests: ['nightlife', 'adventure', 'gastronomy'] },
    { name: 'Upper West Side', neighborhood: 'UWS', whyGood: 'Museum of Natural History, Lincoln Center, Central Park. Familiar.', interests: ['family', 'culture', 'history'] },
  ],
  'lisboa': [
    { name: 'Alfama/Castelo', neighborhood: 'Alfama', whyGood: 'Bairro mais antigo de Lisboa. Fado, miradouros, Castelo de Sao Jorge.', interests: ['history', 'culture', 'gastronomy'] },
    { name: 'Chiado/Bairro Alto', neighborhood: 'Chiado', whyGood: 'Elegante e boemio. Livrarias, teatros, bares de fado. Vida noturna.', interests: ['culture', 'nightlife', 'art'] },
    { name: 'Belem', neighborhood: 'Belem', whyGood: 'Pasteis de Belem, Torre de Belem, Mosteiro dos Jeronimos. Historico.', interests: ['history', 'gastronomy', 'family'] },
  ],
  'barcelona': [
    { name: 'Barrio Gotico', neighborhood: 'Gotico', whyGood: 'Medieval e labirintico. Catedral, pracas escondidas, tapas autenticos.', interests: ['history', 'culture', 'gastronomy'] },
    { name: 'Eixample', neighborhood: 'Eixample', whyGood: 'Sagrada Familia, Casa Batllo, Passeig de Gracia. Gaudi por todo lado.', interests: ['art', 'shopping', 'culture'] },
    { name: 'Barceloneta', neighborhood: 'Barceloneta', whyGood: 'A praia de Barcelona. Chiringuitos, frutos do mar, calcadao.', interests: ['beach', 'gastronomy', 'relaxation'] },
    { name: 'El Born', neighborhood: 'El Born', whyGood: 'Museu Picasso, boutiques, cocktail bars. O bairro mais cool.', interests: ['art', 'nightlife', 'shopping'] },
  ],
  'buenos aires': [
    { name: 'Palermo Soho/Hollywood', neighborhood: 'Palermo', whyGood: 'O bairro mais descolado. Restaurantes de autor, bares craft, design.', interests: ['gastronomy', 'nightlife', 'art', 'shopping'] },
    { name: 'San Telmo', neighborhood: 'San Telmo', whyGood: 'Tango nas ruas, feira de antiguidades, parillas tradicionais.', interests: ['culture', 'history', 'gastronomy'] },
    { name: 'Recoleta', neighborhood: 'Recoleta', whyGood: 'Elegante e classico. MALBA, cemiterio monumental, cafes historicos.', interests: ['history', 'art', 'culture', 'family'] },
  ],
  'amsterdam': [
    { name: 'Jordaan', neighborhood: 'Jordaan', whyGood: 'Canais historicos, cafes acolhedores, galerias, Anne Frank House.', interests: ['culture', 'art', 'history'] },
    { name: 'De Pijp', neighborhood: 'De Pijp', whyGood: 'Albert Cuyp Market, Heineken Experience, restaurantes multiculturais.', interests: ['gastronomy', 'nightlife', 'culture'] },
    { name: 'Museumkwartier', neighborhood: 'Museum Quarter', whyGood: 'Rijksmuseum, Van Gogh, Stedelijk. Vondelpark para relaxar.', interests: ['art', 'history', 'family'] },
  ],
  'cairo': [
    { name: 'Zamalek', neighborhood: 'Zamalek', whyGood: 'Ilha no Nilo, embaixadas, restaurantes sofisticados. Cosmopolita.', interests: ['culture', 'gastronomy', 'relaxation'] },
    { name: 'Giza', neighborhood: 'Giza', whyGood: 'Vista direta para as Piramides. Hoteis com terracos panoramicos.', interests: ['history', 'culture', 'family'] },
    { name: 'Downtown/Islamic Cairo', neighborhood: 'Downtown', whyGood: 'Khan el-Khalili, mesquitas historicas, Museu Egipcio. Autentico.', interests: ['history', 'culture', 'shopping', 'adventure'] },
  ],
  'bali': [
    { name: 'Ubud', neighborhood: 'Ubud', whyGood: 'Terracos de arroz, templos, ioga, gastronomia organica. Espiritual.', interests: ['nature', 'culture', 'relaxation', 'gastronomy'] },
    { name: 'Seminyak/Canggu', neighborhood: 'Seminyak', whyGood: 'Praias com beach clubs, restaurantes trendy, surf. Bali jovem.', interests: ['beach', 'nightlife', 'gastronomy'] },
    { name: 'Nusa Dua', neighborhood: 'Nusa Dua', whyGood: 'Resorts all-inclusive, praias calmas, water sports. Luxo e familias.', interests: ['beach', 'family', 'relaxation'] },
  ],
  'cancun': [
    { name: 'Zona Hoteleira', neighborhood: 'Zona Hoteleira', whyGood: 'Strip de resorts all-inclusive. Mar caribenho, shoppings, vida noturna.', interests: ['beach', 'nightlife', 'family', 'relaxation'] },
    { name: 'Centro/Downtown', neighborhood: 'Centro', whyGood: 'Mexico autentico. Mercados locais, tacos de rua, precos reais.', interests: ['culture', 'gastronomy', 'adventure'] },
    { name: 'Isla Mujeres', neighborhood: 'Isla Mujeres', whyGood: 'Ilha tranquila a 20min de ferry. Praias paradisiacas, snorkeling.', interests: ['beach', 'nature', 'relaxation'] },
  ],
  'miami': [
    { name: 'South Beach', neighborhood: 'South Beach', whyGood: 'Art Deco, Ocean Drive, praias iconicas, vida noturna lendaria.', interests: ['beach', 'nightlife', 'art'] },
    { name: 'Wynwood/Design District', neighborhood: 'Wynwood', whyGood: 'Murais de street art, galerias contemporaneas, cervejarias artesanais.', interests: ['art', 'gastronomy', 'shopping'] },
    { name: 'Brickell', neighborhood: 'Brickell', whyGood: 'Restaurantes sofisticados, rooftop bars. Miami cosmopolita.', interests: ['gastronomy', 'nightlife', 'shopping'] },
  ],
  'singapura': [
    { name: 'Marina Bay', neighborhood: 'Marina Bay', whyGood: 'Marina Bay Sands, Gardens by the Bay, ArtScience Museum. Iconico.', interests: ['culture', 'shopping', 'family'] },
    { name: 'Chinatown/Tanjong Pagar', neighborhood: 'Chinatown', whyGood: 'Templos chineses, hawker centres, cocktail bars escondidos.', interests: ['gastronomy', 'culture', 'nightlife'] },
    { name: 'Kampong Glam/Little India', neighborhood: 'Kampong Glam', whyGood: 'Sultan Mosque, Haji Lane, Little India. Multiculturalismo.', interests: ['culture', 'art', 'gastronomy', 'shopping'] },
  ],
};

// ── Hotel Recommendations — Real hotel names by destination × budget tier ──

export interface HotelRecommendation {
  name: string;
  stars: number;
  neighborhood: string;
  whyGood: string;
  perNight: number;
}

export const HOTEL_RECOMMENDATIONS: Record<string, Record<string, HotelRecommendation[]>> = {
  'paris': {
    'economic': [
      { name: 'Generator Paris', stars: 2, neighborhood: 'Le Marais', whyGood: 'Hostel design no coracao de Paris. Otimo custo-beneficio.', perNight: 350 },
    ],
    'comfort': [
      { name: 'Hotel Le Marais', stars: 3, neighborhood: 'Le Marais', whyGood: 'Charmoso e central. Praca des Vosges a 5 min a pe.', perNight: 550 },
      { name: 'Hotel Monge', stars: 4, neighborhood: 'Quartier Latin', whyGood: 'Boutique hotel no coracao intelectual de Paris.', perNight: 650 },
    ],
    'premium': [
      { name: 'Hotel Montalembert', stars: 4, neighborhood: 'Saint-Germain', whyGood: 'Rive Gauche sofisticada. Museu dOrsay a 3 min.', perNight: 900 },
    ],
    'luxury': [
      { name: 'Le Bristol Paris', stars: 5, neighborhood: 'Champs-Elysees', whyGood: 'Palace parisino com 3 estrelas Michelin (Epicure).', perNight: 2000 },
    ],
  },
  'roma': {
    'economic': [
      { name: 'Hotel Centro Budget Roma', stars: 2, neighborhood: 'Termini', whyGood: 'Perto da estacao central. Acesso facil a tudo.', perNight: 250 },
    ],
    'comfort': [
      { name: 'Hotel Raffaello', stars: 3, neighborhood: 'Monti', whyGood: 'Entre Termini e o bairro Monti. Coliseu a 15 min a pe.', perNight: 450 },
    ],
    'premium': [
      { name: 'Hotel Artemide', stars: 4, neighborhood: 'Via Nazionale', whyGood: 'Art Nouveau elegante. Spa, rooftop com vista.', perNight: 750 },
    ],
    'luxury': [
      { name: 'Hotel de Russie', stars: 5, neighborhood: 'Piazza del Popolo', whyGood: 'Rocco Forte no coracao de Roma. Jardim italiano.', perNight: 1500 },
    ],
  },
  'milao': {
    'economic': [
      { name: 'Ostello Bello Grande', stars: 2, neighborhood: 'Stazione Centrale', whyGood: 'Melhor hostel de Milao. Rooftop, bar, cozinha.', perNight: 200 },
    ],
    'comfort': [
      { name: 'Hotel Milano Scala', stars: 4, neighborhood: 'Brera', whyGood: 'Boutique eco-friendly a 5 min do Duomo e La Scala.', perNight: 500 },
    ],
    'premium': [
      { name: 'Palazzo Parigi', stars: 5, neighborhood: 'Brera', whyGood: 'Palazzo do sec. XIX com spa e jardim privativo.', perNight: 900 },
    ],
    'luxury': [
      { name: 'Four Seasons Milano', stars: 5, neighborhood: 'Montenapoleone', whyGood: 'Convento do sec. XV convertido. Spa, jardim.', perNight: 1800 },
    ],
  },
  'londres': {
    'comfort': [
      { name: 'The Hoxton Southwark', stars: 4, neighborhood: 'South Bank', whyGood: 'Design hotel cool. Tate Modern e Borough Market a pe.', perNight: 500 },
    ],
    'premium': [
      { name: 'The Ned', stars: 5, neighborhood: 'City of London', whyGood: 'Banco dos anos 20 convertido. 9 restaurantes, rooftop pool.', perNight: 900 },
    ],
    'luxury': [
      { name: 'The Savoy', stars: 5, neighborhood: 'Strand', whyGood: 'Lendario desde 1889. Thames Suite com vista para o rio.', perNight: 2000 },
    ],
  },
  'toquio': {
    'comfort': [
      { name: 'Hotel Gracery Shinjuku', stars: 3, neighborhood: 'Shinjuku', whyGood: 'Famoso hotel do Godzilla. Kabukicho na porta.', perNight: 550 },
    ],
    'premium': [
      { name: 'Park Hyatt Tokyo', stars: 5, neighborhood: 'Shinjuku', whyGood: 'O hotel de Lost in Translation. New York Bar no 52o andar.', perNight: 1100 },
    ],
    'luxury': [
      { name: 'Aman Tokyo', stars: 5, neighborhood: 'Otemachi', whyGood: 'Minimalismo japones elevado ao maximo. Spa Aman.', perNight: 2500 },
    ],
  },
  'barcelona': {
    'comfort': [
      { name: 'Hotel Brummell', stars: 3, neighborhood: 'Poble Sec', whyGood: 'Boutique artsy com pool no rooftop. Montjuic a pe.', perNight: 380 },
    ],
    'premium': [
      { name: 'Hotel Arts Barcelona', stars: 5, neighborhood: 'Port Olimpic', whyGood: 'Torre iconica a beira-mar. Enoteca (2 Michelin).', perNight: 700 },
    ],
    'luxury': [
      { name: 'Mandarin Oriental Barcelona', stars: 5, neighborhood: 'Passeig de Gracia', whyGood: 'Entre Casa Batllo e La Pedrera. Moments (2 Michelin).', perNight: 1400 },
    ],
  },
  'lisboa': {
    'comfort': [
      { name: 'Hotel Lisboa Plaza', stars: 4, neighborhood: 'Avenida da Liberdade', whyGood: 'Familiar e acolhedor. A melhor avenida de Lisboa.', perNight: 350 },
    ],
    'premium': [
      { name: 'Four Seasons Ritz Lisbon', stars: 5, neighborhood: 'Marques de Pombal', whyGood: 'Classico de Lisboa. Spa, jardim, vista Eduardo VII.', perNight: 600 },
    ],
    'luxury': [
      { name: 'Olissippo Lapa Palace', stars: 5, neighborhood: 'Lapa', whyGood: 'Palacio do sec. XIX com jardim tropical.', perNight: 1200 },
    ],
  },
  'amsterdam': {
    'comfort': [
      { name: 'Hotel V Nesplein', stars: 3, neighborhood: 'Centro', whyGood: 'Design hotel nos canais. Dam Square a 5 min.', perNight: 500 },
    ],
    'premium': [
      { name: 'Pulitzer Amsterdam', stars: 5, neighborhood: 'Jordaan', whyGood: '25 casas historicas conectadas nos canais.', perNight: 850 },
    ],
  },
  'bangkok': {
    'comfort': [
      { name: 'Riva Surya Bangkok', stars: 4, neighborhood: 'Riverside', whyGood: 'Boutique a beira do Chao Phraya. Grand Palace a 10 min.', perNight: 350 },
    ],
    'premium': [
      { name: 'Mandarin Oriental Bangkok', stars: 5, neighborhood: 'Riverside', whyGood: 'Lendario desde 1876. Somerset Maugham hospedou aqui.', perNight: 800 },
    ],
    'luxury': [
      { name: 'The Siam', stars: 5, neighborhood: 'Dusit', whyGood: 'Boutique art-deco a beira do rio. Muay Thai ring.', perNight: 1500 },
    ],
  },
  'dubai': {
    'comfort': [
      { name: 'Rove Downtown', stars: 3, neighborhood: 'Downtown', whyGood: 'Vista para o Burj Khalifa. Dubai Mall a pe.', perNight: 400 },
    ],
    'premium': [
      { name: 'Address Downtown', stars: 5, neighborhood: 'Downtown', whyGood: 'Ao lado do Dubai Mall. Vista iconica da Fountain.', perNight: 900 },
    ],
    'luxury': [
      { name: 'Burj Al Arab', stars: 5, neighborhood: 'Jumeirah', whyGood: 'O hotel mais luxuoso do mundo. Suites duplex.', perNight: 5000 },
    ],
  },
  'buenos aires': {
    'comfort': [
      { name: 'Mine Hotel', stars: 4, neighborhood: 'Palermo', whyGood: 'Boutique intimo em Palermo Soho. Jardim com pool.', perNight: 300 },
    ],
    'premium': [
      { name: 'Alvear Palace Hotel', stars: 5, neighborhood: 'Recoleta', whyGood: 'O grand hotel de Buenos Aires. Spa Alvear.', perNight: 600 },
    ],
  },
  'nova york': {
    'comfort': [
      { name: 'citizenM New York Bowery', stars: 4, neighborhood: 'Lower East Side', whyGood: 'Tech-forward. Rooftop bar com vista para Manhattan.', perNight: 600 },
    ],
    'premium': [
      { name: 'The Standard High Line', stars: 4, neighborhood: 'Meatpacking', whyGood: 'Sobre o High Line. Le Bain rooftop.', perNight: 900 },
    ],
    'luxury': [
      { name: 'The Mark', stars: 5, neighborhood: 'Upper East Side', whyGood: 'MET Museum na esquina. Jean-Georges restaurante.', perNight: 2000 },
    ],
  },
  'singapura': {
    'comfort': [
      { name: 'Naumi Hotel', stars: 4, neighborhood: 'City Hall', whyGood: 'Boutique design. National Gallery e Marina Bay a pe.', perNight: 400 },
    ],
    'premium': [
      { name: 'Marina Bay Sands', stars: 5, neighborhood: 'Marina Bay', whyGood: 'Infinity pool no rooftop mais famoso do mundo.', perNight: 900 },
    ],
  },
  'bali': {
    'comfort': [
      { name: 'Bisma Eight Ubud', stars: 4, neighborhood: 'Ubud', whyGood: 'Pool infinita sobre a floresta. Eco-luxury.', perNight: 300 },
    ],
    'premium': [
      { name: 'Four Seasons Sayan', stars: 5, neighborhood: 'Ubud', whyGood: 'Sobre o vale do rio Ayung. Chegada pela ponte suspensa.', perNight: 800 },
    ],
  },
  'cancun': {
    'comfort': [
      { name: 'Hyatt Ziva Cancun', stars: 4, neighborhood: 'Zona Hoteleira', whyGood: 'All-inclusive premium. Praia privativa, 6 restaurantes.', perNight: 500 },
    ],
    'premium': [
      { name: 'Nizuc Resort & Spa', stars: 5, neighborhood: 'Punta Nizuc', whyGood: 'Isolado no extremo da zona hoteleira. 2 praias.', perNight: 1200 },
    ],
  },
  'miami': {
    'comfort': [
      { name: 'The Confidante', stars: 4, neighborhood: 'Mid Beach', whyGood: 'Art Deco renovado. 2 pools, Birds & Bees bar.', perNight: 500 },
    ],
    'premium': [
      { name: 'Faena Hotel Miami Beach', stars: 5, neighborhood: 'Mid Beach', whyGood: 'Obra-prima de Baz Luhrmann. Los Fuegos (Mallmann).', perNight: 1000 },
    ],
  },
  'phuket': {
    'comfort': [
      { name: 'Katathani Phuket Beach Resort', stars: 4, neighborhood: 'Kata', whyGood: 'Resort a beira-mar em Kata Noi. 6 pools, spa.', perNight: 350 },
    ],
    'premium': [
      { name: 'Trisara', stars: 5, neighborhood: 'Nai Thon', whyGood: 'Vilas privativas com piscina e vista para o mar.', perNight: 1200 },
    ],
  },
  'cairo': {
    'comfort': [
      { name: 'Kempinski Nile Hotel', stars: 5, neighborhood: 'Garden City', whyGood: 'Elegante a beira do Nilo. Museo Egipcio a pe.', perNight: 400 },
    ],
    'premium': [
      { name: 'Marriott Mena House', stars: 5, neighborhood: 'Giza', whyGood: 'Vista direta para as Piramides do quarto.', perNight: 700 },
    ],
  },
};

function getTierKey(budgetTier: string): string {
  const map: Record<string, string> = {
    'budget': 'economic', 'economic': 'economic', 'backpacker': 'economic',
    'comfort': 'comfort', 'conforto': 'comfort', 'midrange': 'comfort',
    'premium': 'premium', 'elite': 'luxury', 'luxury': 'luxury',
  };
  return map[budgetTier?.toLowerCase()] || 'comfort';
}

export function getHotelRecommendation(
  destination: string,
  budgetTier: string,
  interests: string[]
): HotelRecommendation | null {
  const destKey = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const tierKey = getTierKey(budgetTier);

  let destHotels: Record<string, HotelRecommendation[]> | undefined;
  for (const [k, v] of Object.entries(HOTEL_RECOMMENDATIONS)) {
    const nk = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (destKey === nk || destKey.includes(nk) || nk.includes(destKey)) {
      destHotels = v;
      break;
    }
  }
  if (!destHotels) return null;

  const hotels = destHotels[tierKey] || destHotels['comfort'] || Object.values(destHotels)[0];
  if (!hotels || hotels.length === 0) return null;

  const zone = getIdealHotelZone(destination, interests);
  if (zone) {
    const zoneN = zone.neighborhood.toLowerCase();
    const matched = hotels.find(h => h.neighborhood.toLowerCase().includes(zoneN) || zoneN.includes(h.neighborhood.toLowerCase()));
    if (matched) return matched;
  }

  return hotels[0];
}

export function getIdealHotelZone(
  destination: string,
  interests: string[]
): HotelZone | null {
  const key = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  let zones: HotelZone[] | undefined;

  for (const [k, v] of Object.entries(HOTEL_ZONES)) {
    if (v.length === 0) continue; // skip empty alias entries
    const normalK = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key === normalK || key.includes(normalK) || normalK.includes(key)) {
      zones = v;
      break;
    }
  }
  if (!zones || zones.length === 0) return null;
  if (!interests || interests.length === 0) return zones[0];

  const scored = zones.map(zone => ({
    zone,
    score: zone.interests.filter(i => interests.includes(i)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].zone;
}
