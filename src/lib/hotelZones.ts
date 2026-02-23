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
  // ═══ Europa ═══
  'florenca': [
    { name: 'Centro/Duomo', neighborhood: 'Centro', whyGood: 'Duomo, Uffizi, Ponte Vecchio a pe. O coracao de Firenze.', interests: ['culture', 'art', 'history'] },
    { name: 'Oltrarno', neighborhood: 'Oltrarno', whyGood: 'Artesaos, Palazzo Pitti, trattorias autenticas. O lado local.', interests: ['art', 'gastronomy', 'culture'] },
    { name: 'Santa Croce', neighborhood: 'Santa Croce', whyGood: 'Basilica, mercado de couro, vida noturna local.', interests: ['culture', 'nightlife', 'shopping'] },
    { name: 'San Lorenzo', neighborhood: 'San Lorenzo', whyGood: 'Mercato Centrale, Capelas Medici, otimo custo-beneficio.', interests: ['gastronomy', 'history', 'shopping'] },
  ],
  'veneza': [
    { name: 'San Marco', neighborhood: 'San Marco', whyGood: 'Basilica, Palazzo Ducale, Ponte dos Suspiros. Epicentro.', interests: ['culture', 'history', 'art'] },
    { name: 'Dorsoduro', neighborhood: 'Dorsoduro', whyGood: 'Accademia, Guggenheim, bares locais. Universitario e artistico.', interests: ['art', 'culture', 'nightlife'] },
    { name: 'Cannaregio', neighborhood: 'Cannaregio', whyGood: 'Ghetto judaico, bacari autenticos, menos turistas.', interests: ['gastronomy', 'culture', 'history'] },
    { name: 'Rialto', neighborhood: 'Rialto', whyGood: 'Ponte de Rialto, mercado de peixes, cicchetti bars.', interests: ['gastronomy', 'shopping', 'culture'] },
  ],
  'porto': [
    { name: 'Ribeira/Centro', neighborhood: 'Ribeira', whyGood: 'UNESCO, rio Douro, Ponte Dom Luis. Charmoso e central.', interests: ['culture', 'history', 'gastronomy'] },
    { name: 'Cedofeita/Bolhao', neighborhood: 'Bolhao', whyGood: 'Mercado do Bolhao, Rua Santa Catarina, vida local.', interests: ['shopping', 'gastronomy', 'culture'] },
    { name: 'Foz do Douro', neighborhood: 'Foz', whyGood: 'Praia, farol, restaurantes de peixe. Mais tranquilo.', interests: ['nature', 'relaxation', 'gastronomy'] },
    { name: 'Vila Nova de Gaia', neighborhood: 'Gaia', whyGood: 'Caves de vinho do Porto, vista da Ribeira. Custo-beneficio.', interests: ['gastronomy', 'culture', 'relaxation'] },
  ],
  'madri': [
    { name: 'Sol/Centro', neighborhood: 'Centro', whyGood: 'Puerta del Sol, Gran Via, Prado a pe. O coracao de Madrid.', interests: ['culture', 'shopping', 'nightlife'] },
    { name: 'La Latina/Lavapies', neighborhood: 'La Latina', whyGood: 'Tapas, Rastro, multiculturalismo. O Madrid autentico.', interests: ['gastronomy', 'culture', 'nightlife'] },
    { name: 'Salamanca', neighborhood: 'Salamanca', whyGood: 'Compras de luxo, Retiro, restaurantes refinados.', interests: ['shopping', 'gastronomy', 'culture'] },
    { name: 'Malasana/Chueca', neighborhood: 'Malasana', whyGood: 'Boemio, vintage, vida noturna. Madrid alternativo.', interests: ['nightlife', 'art', 'shopping'] },
  ],
  'berlim': [
    { name: 'Mitte', neighborhood: 'Mitte', whyGood: 'Portao de Brandemburgo, Ilha dos Museus, Unter den Linden.', interests: ['culture', 'history', 'art'] },
    { name: 'Kreuzberg', neighborhood: 'Kreuzberg', whyGood: 'Multicultural, arte urbana, vida noturna lendaria.', interests: ['nightlife', 'art', 'gastronomy'] },
    { name: 'Prenzlauer Berg', neighborhood: 'Prenzlauer Berg', whyGood: 'Cafes, mercados bio, Mauerpark. Familiar e charmoso.', interests: ['family', 'gastronomy', 'culture'] },
    { name: 'Friedrichshain', neighborhood: 'Friedrichshain', whyGood: 'East Side Gallery, clubes, cervejarias artesanais.', interests: ['nightlife', 'art', 'culture'] },
  ],
  'praga': [
    { name: 'Stare Mesto (Cidade Velha)', neighborhood: 'Stare Mesto', whyGood: 'Praca do Relogio, Ponte Carlos, sinecura. Central.', interests: ['culture', 'history', 'art'] },
    { name: 'Mala Strana', neighborhood: 'Mala Strana', whyGood: 'Barroco, embaixadas, Lennon Wall. Romantico.', interests: ['culture', 'art', 'relaxation'] },
    { name: 'Vinohrady', neighborhood: 'Vinohrady', whyGood: 'Bairro local com cafes, parques, restaurantes. Custo-beneficio.', interests: ['gastronomy', 'nightlife', 'relaxation'] },
    { name: 'Nove Mesto', neighborhood: 'Nove Mesto', whyGood: 'Praca Venceslau, Museu Nacional, Dancing House.', interests: ['shopping', 'culture', 'history'] },
  ],
  'viena': [
    { name: 'Innere Stadt (1o distrito)', neighborhood: 'Centro', whyGood: 'Catedral, Opera, Hofburg. Tudo a pe.', interests: ['culture', 'history', 'art', 'shopping'] },
    { name: 'Neubau (7o distrito)', neighborhood: 'Neubau', whyGood: 'MuseumsQuartier, lojas independentes, cafes modernos.', interests: ['art', 'shopping', 'gastronomy'] },
    { name: 'Leopoldstadt (2o distrito)', neighborhood: 'Leopoldstadt', whyGood: 'Prater, Danubio, vibe local. Custo-beneficio.', interests: ['nature', 'nightlife', 'family'] },
    { name: 'Josefstadt (8o distrito)', neighborhood: 'Josefstadt', whyGood: 'Teatro, cafes tradicionais, residencial charmoso.', interests: ['culture', 'relaxation', 'gastronomy'] },
  ],
  'budapeste': [
    { name: 'Belvaros (Centro Pest)', neighborhood: 'Centro', whyGood: 'Parlamento, basilica, compras. Tudo a pe.', interests: ['culture', 'shopping', 'history'] },
    { name: 'Erzsebetvaros (Bairro Judeu)', neighborhood: 'Bairro Judeu', whyGood: 'Ruin bars, sinagogas, vida noturna. O mais animado.', interests: ['nightlife', 'culture', 'gastronomy'] },
    { name: 'Buda/Castelo', neighborhood: 'Buda', whyGood: 'Bastiao dos Pescadores, castelo, vista do Danubio.', interests: ['history', 'culture', 'art'] },
    { name: 'Terézváros (Andrassy)', neighborhood: 'Andrassy', whyGood: 'Avenida elegante, Opera, Casa do Terror. Sofisticado.', interests: ['culture', 'shopping', 'history'] },
  ],
  'istambul': [
    { name: 'Sultanahmet', neighborhood: 'Sultanahmet', whyGood: 'Hagia Sophia, Mesquita Azul, Topkapi. Historico.', interests: ['history', 'culture', 'art'] },
    { name: 'Beyoglu/Galata', neighborhood: 'Beyoglu', whyGood: 'Torre Galata, Istiklal, vida noturna, cafes modernos.', interests: ['nightlife', 'art', 'gastronomy'] },
    { name: 'Kadikoy (lado asiatico)', neighborhood: 'Kadikoy', whyGood: 'Mercado de comida, vida local, ferry panoramico.', interests: ['gastronomy', 'culture', 'relaxation'] },
    { name: 'Besiktas/Ortakoy', neighborhood: 'Besiktas', whyGood: 'Bosforo, Dolmabahce, brunch de fim de semana.', interests: ['culture', 'gastronomy', 'relaxation'] },
  ],
  'atenas': [
    { name: 'Plaka/Monastiraki', neighborhood: 'Plaka', whyGood: 'Sob a Acropole, tavernas, compras. Classico.', interests: ['culture', 'history', 'gastronomy'] },
    { name: 'Koukaki', neighborhood: 'Koukaki', whyGood: 'Proximo a Acropole, local, cafes otimos.', interests: ['culture', 'relaxation', 'gastronomy'] },
    { name: 'Psyrri', neighborhood: 'Psyrri', whyGood: 'Street art, tavernas, vida noturna. Alternativo.', interests: ['nightlife', 'art', 'gastronomy'] },
    { name: 'Kolonaki', neighborhood: 'Kolonaki', whyGood: 'Chique, galerias, museu Benaki. Sofisticado.', interests: ['shopping', 'art', 'culture'] },
  ],
  // ═══ Américas ═══
  'cidade do mexico': [
    { name: 'Roma/Condesa', neighborhood: 'Roma', whyGood: 'Art deco, cafes, restaurantes top. O Brooklyn da CDMX.', interests: ['gastronomy', 'art', 'nightlife'] },
    { name: 'Polanco', neighborhood: 'Polanco', whyGood: 'Museu de Antropologia, compras de luxo, restaurantes.', interests: ['culture', 'shopping', 'gastronomy'] },
    { name: 'Centro Historico', neighborhood: 'Centro', whyGood: 'Zocalo, Templo Mayor, Palacio. Historia viva.', interests: ['history', 'culture', 'art'] },
    { name: 'Coyoacan', neighborhood: 'Coyoacan', whyGood: 'Casa Frida Kahlo, mercados, vibe universitaria.', interests: ['art', 'culture', 'gastronomy'] },
  ],
  'lima': [
    { name: 'Miraflores', neighborhood: 'Miraflores', whyGood: 'Oceanico, seguro, Larcomar, Parque del Amor. Turistas.', interests: ['shopping', 'gastronomy', 'relaxation'] },
    { name: 'Barranco', neighborhood: 'Barranco', whyGood: 'Boemio, galerias, Ponte dos Suspiros, vida noturna.', interests: ['art', 'nightlife', 'culture'] },
    { name: 'San Isidro', neighborhood: 'San Isidro', whyGood: 'Financeiro, parques, restaurantes finos. Tranquilo.', interests: ['gastronomy', 'relaxation', 'shopping'] },
    { name: 'Centro Historico', neighborhood: 'Centro', whyGood: 'Plaza Mayor, catacomba, colonial. Historia.', interests: ['history', 'culture'] },
  ],
  'santiago': [
    { name: 'Providencia', neighborhood: 'Providencia', whyGood: 'Seguro, metro, restaurantes, vida noturna. Moderno.', interests: ['gastronomy', 'shopping', 'nightlife'] },
    { name: 'Lastarria/Bellas Artes', neighborhood: 'Lastarria', whyGood: 'Cultural, cafes, museus. Charmoso e caminhavel.', interests: ['culture', 'art', 'gastronomy'] },
    { name: 'Las Condes/Vitacura', neighborhood: 'Las Condes', whyGood: 'Alto padrao, shopping, vinhos. Sofisticado.', interests: ['shopping', 'gastronomy', 'relaxation'] },
    { name: 'Bellavista', neighborhood: 'Bellavista', whyGood: 'Casa Neruda, Cerro San Cristobal, noite. Boemio.', interests: ['nightlife', 'culture', 'art'] },
  ],
  // ═══ Ásia ═══
  'kyoto': [
    { name: 'Higashiyama', neighborhood: 'Higashiyama', whyGood: 'Templos, gueixas, lojas tradicionais. Kyoto classica.', interests: ['culture', 'history', 'art'] },
    { name: 'Gion', neighborhood: 'Gion', whyGood: 'Bairro das gueixas, machiya, chas. Atmosferico.', interests: ['culture', 'gastronomy', 'history'] },
    { name: 'Estacao Central', neighborhood: 'Estacao', whyGood: 'Hub de transporte, shinkansen, compras. Pratico.', interests: ['shopping', 'family'] },
    { name: 'Arashiyama', neighborhood: 'Arashiyama', whyGood: 'Bambu, templos, rio. Natureza dentro da cidade.', interests: ['nature', 'culture', 'relaxation'] },
  ],
  'seul': [
    { name: 'Jongno/Bukchon', neighborhood: 'Jongno', whyGood: 'Palacios, hanok villages, Insadong. Historico.', interests: ['culture', 'history', 'art'] },
    { name: 'Myeongdong/Jung-gu', neighborhood: 'Myeongdong', whyGood: 'Compras, skincare, street food. Movimentado.', interests: ['shopping', 'gastronomy'] },
    { name: 'Hongdae', neighborhood: 'Hongdae', whyGood: 'K-pop, arte de rua, clubes, indie. Jovem.', interests: ['nightlife', 'art', 'culture'] },
    { name: 'Gangnam/Apgujeong', neighborhood: 'Gangnam', whyGood: 'Moderno, luxuoso, cafes trendy, K-beauty.', interests: ['shopping', 'gastronomy', 'nightlife'] },
  ],
  'hanoi': [
    { name: 'Old Quarter', neighborhood: 'Old Quarter', whyGood: '36 ruas tradicionais, street food, mercados. Autentico.', interests: ['culture', 'gastronomy', 'history'] },
    { name: 'Hoan Kiem', neighborhood: 'Hoan Kiem', whyGood: 'Lago, Opera, French Quarter. Central e elegante.', interests: ['culture', 'relaxation', 'art'] },
    { name: 'West Lake', neighborhood: 'Tay Ho', whyGood: 'Lago, templos, expatriados, restaurantes. Tranquilo.', interests: ['relaxation', 'gastronomy', 'nature'] },
    { name: 'Ba Dinh', neighborhood: 'Ba Dinh', whyGood: 'Mausoleu Ho Chi Minh, Templo da Literatura. Historico.', interests: ['history', 'culture'] },
  ],
  // ═══ África ═══
  'cidade do cabo': [
    { name: 'V&A Waterfront/De Waterkant', neighborhood: 'Waterfront', whyGood: 'Porto, restaurantes, Table Mountain de fundo. Turistico e seguro.', interests: ['shopping', 'gastronomy', 'culture'] },
    { name: 'Camps Bay/Clifton', neighborhood: 'Camps Bay', whyGood: 'Praias com montanhas, restaurantes na orla, por do sol.', interests: ['nature', 'relaxation', 'gastronomy'] },
    { name: 'Gardens/Oranjezicht', neighborhood: 'Gardens', whyGood: 'Proximo a Table Mountain, mercado OZ, cafes artesanais.', interests: ['nature', 'gastronomy', 'culture'] },
    { name: 'Woodstock/Observatory', neighborhood: 'Woodstock', whyGood: 'Artistico, Old Biscuit Mill, cervejarias craft. Boemio.', interests: ['art', 'gastronomy', 'nightlife'] },
  ],
  'marrakech': [
    { name: 'Medina (Riad)', neighborhood: 'Medina', whyGood: 'Riads tradicionais, souks, Jemaa el-Fnaa. Imersivo.', interests: ['culture', 'history', 'gastronomy'] },
    { name: 'Gueliz (Ville Nouvelle)', neighborhood: 'Gueliz', whyGood: 'Moderno, galerias, cafes europeus, jardim Majorelle.', interests: ['art', 'shopping', 'gastronomy'] },
    { name: 'Kasbah', neighborhood: 'Kasbah', whyGood: 'Tumbas Sadianas, Palacio Bahia, tranquilo. Historico.', interests: ['history', 'culture', 'relaxation'] },
    { name: 'Hivernage', neighborhood: 'Hivernage', whyGood: 'Hoteis de luxo, teatro real, piscinas. Sofisticado.', interests: ['relaxation', 'shopping', 'gastronomy'] },
  ],
  // ═══ Oceania ═══
  'sydney': [
    { name: 'The Rocks/Circular Quay', neighborhood: 'The Rocks', whyGood: 'Opera House, Harbour Bridge, restaurantes. Iconico.', interests: ['culture', 'history', 'gastronomy'] },
    { name: 'Surry Hills', neighborhood: 'Surry Hills', whyGood: 'Cafes, bares, galerias. O bairro mais descolado.', interests: ['gastronomy', 'art', 'nightlife'] },
    { name: 'Bondi', neighborhood: 'Bondi', whyGood: 'Praia iconica, coastal walk, brunch. Lifestyle.', interests: ['nature', 'relaxation', 'gastronomy'] },
    { name: 'Darling Harbour', neighborhood: 'Darling Harbour', whyGood: 'Aquario, museus, restaurantes no porto. Familiar.', interests: ['family', 'culture', 'shopping'] },
  ],
  // ═══ Brasil ═══
  'rio de janeiro': [
    { name: 'Copacabana/Leme', neighborhood: 'Copacabana', whyGood: 'Praia iconica, metro, restaurantes, vida noturna.', interests: ['nature', 'nightlife', 'gastronomy'] },
    { name: 'Ipanema/Leblon', neighborhood: 'Ipanema', whyGood: 'Praia premium, compras, restaurantes finos. Sofisticado.', interests: ['gastronomy', 'shopping', 'nature'] },
    { name: 'Botafogo/Urca', neighborhood: 'Botafogo', whyGood: 'Pao de Acucar, startups, bares artesanais. Moderno.', interests: ['culture', 'nightlife', 'gastronomy'] },
    { name: 'Santa Teresa', neighborhood: 'Santa Teresa', whyGood: 'Boemio, atelies, mirantes, casaroes. Charmoso.', interests: ['art', 'culture', 'gastronomy'] },
  ],
  'salvador': [
    { name: 'Pelourinho', neighborhood: 'Pelourinho', whyGood: 'UNESCO, igrejas barrocas, musica, cultura. Historico.', interests: ['culture', 'history', 'art'] },
    { name: 'Barra', neighborhood: 'Barra', whyGood: 'Farol, praia, por do sol, forte. Turistico.', interests: ['nature', 'culture', 'relaxation'] },
    { name: 'Rio Vermelho', neighborhood: 'Rio Vermelho', whyGood: 'Boemio, bares, musica ao vivo, acaraje. Noturno.', interests: ['nightlife', 'gastronomy', 'culture'] },
    { name: 'Itapua', neighborhood: 'Itapua', whyGood: 'Praias bonitas, menos turistas, vida local.', interests: ['nature', 'relaxation'] },
  ],
  'florianopolis': [
    { name: 'Centro/Beira-Mar', neighborhood: 'Centro', whyGood: 'Mercado Publico, restaurantes, vida urbana.', interests: ['culture', 'gastronomy', 'shopping'] },
    { name: 'Lagoa da Conceicao', neighborhood: 'Lagoa', whyGood: 'Lagoa, dunas, restaurantes, vida noturna. Hub social.', interests: ['nature', 'nightlife', 'gastronomy'] },
    { name: 'Jurere/Canasvieiras', neighborhood: 'Jurere', whyGood: 'Praias calmas, beach clubs, familia.', interests: ['relaxation', 'nature', 'family'] },
    { name: 'Campeche/Morro das Pedras', neighborhood: 'Campeche', whyGood: 'Praias selvagens, surfe, tranquilidade.', interests: ['nature', 'relaxation'] },
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
  'cidade do cabo': {
    'budget': [{ name: 'Once in Cape Town', stars: 2, neighborhood: 'City Centre', whyGood: 'Hostel boutique premiado no centro.', perNight: 180 }],
    'comfort': [{ name: 'Southern Sun Waterfront', stars: 3, neighborhood: 'V&A Waterfront', whyGood: 'Vista do porto e Table Mountain. Localizacao privilegiada.', perNight: 450 }],
    'premium': [{ name: 'Cape Grace Hotel', stars: 4, neighborhood: 'V&A Waterfront', whyGood: 'Elegancia sul-africana com vista da marina e Table Mountain.', perNight: 900 }],
    'luxury': [{ name: 'One&Only Cape Town', stars: 5, neighborhood: 'V&A Waterfront', whyGood: 'O hotel mais luxuoso da Africa do Sul. Spa, piscina e vistas absurdas.', perNight: 3500 }],
  },
  'santiago': {
    'budget': [{ name: 'Ibis Santiago Providencia', stars: 2, neighborhood: 'Providencia', whyGood: 'Metro na porta. Bairro seguro e com vida noturna.', perNight: 200 }],
    'comfort': [{ name: 'Hotel Cumbres Lastarria', stars: 3, neighborhood: 'Lastarria', whyGood: 'Bairro bohemio com galerias e restaurantes.', perNight: 380 }],
    'premium': [{ name: 'The Singular Santiago', stars: 4, neighborhood: 'Lastarria', whyGood: 'Design hotel no bairro mais descolado de Santiago.', perNight: 700 }],
    'luxury': [{ name: 'The Ritz-Carlton Santiago', stars: 5, neighborhood: 'Las Condes', whyGood: 'Luxo com vista dos Andes.', perNight: 1800 }],
  },
  'lima': {
    'budget': [{ name: 'Selina Miraflores', stars: 2, neighborhood: 'Miraflores', whyGood: 'Hostel moderno perto do Malecon.', perNight: 150 }],
    'comfort': [{ name: 'Casa Andina Premium Miraflores', stars: 3, neighborhood: 'Miraflores', whyGood: 'Excelente custo-beneficio no melhor bairro.', perNight: 350 }],
    'premium': [{ name: 'JW Marriott Lima', stars: 4, neighborhood: 'Miraflores', whyGood: 'Beira-mar com vista do Pacifico.', perNight: 650 }],
    'luxury': [{ name: 'Belmond Miraflores Park', stars: 5, neighborhood: 'Miraflores', whyGood: 'O hotel mais sofisticado de Lima. Rooftop pool com vista.', perNight: 1500 }],
  },
  'cusco': {
    'budget': [{ name: 'Milhouse Cusco', stars: 2, neighborhood: 'Centro Historico', whyGood: 'Hostel com charme colonial na Plaza de Armas.', perNight: 120 }],
    'comfort': [{ name: 'Casa Andina Premium Cusco', stars: 3, neighborhood: 'Centro Historico', whyGood: 'Hotel em casarao colonial. Cha de coca no lobby!', perNight: 300 }],
    'premium': [{ name: 'Palacio del Inka', stars: 4, neighborhood: 'Centro Historico', whyGood: 'Antigo palacio inca convertido em hotel de luxo.', perNight: 600 }],
    'luxury': [{ name: 'Belmond Hotel Monasterio', stars: 5, neighborhood: 'Centro Historico', whyGood: 'Mosteiro do seculo XVI. Um dos hoteis mais especiais do mundo.', perNight: 2000 }],
  },
  'praga': {
    'budget': [{ name: 'Mosaic House', stars: 2, neighborhood: 'Nove Mesto', whyGood: 'Design hostel premiado perto da Cidade Velha.', perNight: 180 }],
    'comfort': [{ name: 'Hotel Leonardo Prague', stars: 3, neighborhood: 'Stare Mesto', whyGood: 'Localizacao perfeita na Cidade Velha.', perNight: 350 }],
    'premium': [{ name: 'Alcron Hotel Prague', stars: 4, neighborhood: 'Nove Mesto', whyGood: 'Art Deco classico com restaurante Michelin.', perNight: 600 }],
    'luxury': [{ name: 'Four Seasons Prague', stars: 5, neighborhood: 'Stare Mesto', whyGood: 'Vista da Ponte Carlos e do Castelo. Incomparavel.', perNight: 2200 }],
  },
  'istambul': {
    'budget': [{ name: 'Cheers Hostel', stars: 2, neighborhood: 'Sultanahmet', whyGood: 'Rooftop com vista do Bosforo. Localizacao imbativel.', perNight: 150 }],
    'comfort': [{ name: 'Hotel Amira Istanbul', stars: 3, neighborhood: 'Sultanahmet', whyGood: 'Boutique hotel a 5min da Hagia Sophia.', perNight: 300 }],
    'premium': [{ name: 'Raffles Istanbul', stars: 4, neighborhood: 'Zorlu Center', whyGood: 'Luxo contemporaneo com vista do Bosforo.', perNight: 700 }],
    'luxury': [{ name: 'Four Seasons Sultanahmet', stars: 5, neighborhood: 'Sultanahmet', whyGood: 'Antiga prisao otomana. Vista da Hagia Sophia do terraço.', perNight: 2500 }],
  },
  'marrakech': {
    'budget': [{ name: 'Riad Dar Zaman', stars: 2, neighborhood: 'Medina', whyGood: 'Riad autentico com patio e terraço.', perNight: 120 }],
    'comfort': [{ name: 'Riad Kniza', stars: 3, neighborhood: 'Medina', whyGood: 'Riad de charme com piscina e hammam.', perNight: 350 }],
    'premium': [{ name: 'La Mamounia', stars: 5, neighborhood: 'Hivernage', whyGood: 'Palacio lendario. Churchill era hospede habitual.', perNight: 1200 }],
    'luxury': [{ name: 'Royal Mansour', stars: 5, neighborhood: 'Medina', whyGood: 'Riads privados dentro do hotel. Propriedade do Rei Mohammed VI.', perNight: 4000 }],
  },
  'atenas': {
    'budget': [{ name: 'AthenStyle', stars: 2, neighborhood: 'Monastiraki', whyGood: 'Rooftop com vista da Acropole.', perNight: 150 }],
    'comfort': [{ name: 'Electra Metropolis', stars: 4, neighborhood: 'Syntagma', whyGood: 'Rooftop pool com vista panoramica da Acropole.', perNight: 350 }],
    'premium': [{ name: 'Hotel Grande Bretagne', stars: 5, neighborhood: 'Syntagma', whyGood: 'O hotel mais iconico de Atenas. Desde 1874.', perNight: 800 }],
    'luxury': [{ name: 'Four Seasons Astir Palace', stars: 5, neighborhood: 'Riviera Ateniense', whyGood: 'Resort de praia a 30min do centro. Spa extraordinario.', perNight: 2000 }],
  },
  'seul': {
    'budget': [{ name: 'Lotte L7 Myeongdong', stars: 3, neighborhood: 'Myeongdong', whyGood: 'Moderno e central. Street food na porta.', perNight: 250 }],
    'comfort': [{ name: 'Glad Hotel Mapo', stars: 3, neighborhood: 'Hongdae', whyGood: 'No bairro mais jovem de Seul. Metro na porta.', perNight: 300 }],
    'premium': [{ name: 'Josun Palace', stars: 5, neighborhood: 'Gangnam', whyGood: 'O Luxury Collection de Seul. Design coreano contemporaneo.', perNight: 700 }],
    'luxury': [{ name: 'The Shilla Seoul', stars: 5, neighborhood: 'Jangchung', whyGood: 'O hotel mais prestigiado da Coreia. Jardim centenario.', perNight: 1500 }],
  },
  'berlim': {
    'budget': [{ name: 'Generator Berlin Mitte', stars: 2, neighborhood: 'Mitte', whyGood: 'Design hostel no coracao de Berlim.', perNight: 150 }],
    'comfort': [{ name: 'Hotel Adlon Kempinski', stars: 3, neighborhood: 'Mitte', whyGood: 'Em frente ao Portao de Brandemburgo.', perNight: 400 }],
    'premium': [{ name: 'The Ritz-Carlton Berlin', stars: 5, neighborhood: 'Potsdamer Platz', whyGood: 'Luxo classico na Potsdamer Platz.', perNight: 800 }],
    'luxury': [{ name: 'Hotel de Rome', stars: 5, neighborhood: 'Mitte', whyGood: 'Antigo banco convertido. Piscina no cofre subterraneo.', perNight: 1500 }],
  },
  'kyoto': {
    'budget': [{ name: 'Piece Hostel Sanjo', stars: 2, neighborhood: 'Downtown', whyGood: 'Design hostel japones premiado.', perNight: 150 }],
    'comfort': [{ name: 'Hotel Kanra Kyoto', stars: 3, neighborhood: 'Gojo', whyGood: 'Design japones minimalista. Onsen privado nos quartos.', perNight: 400 }],
    'premium': [{ name: 'The Ritz-Carlton Kyoto', stars: 5, neighborhood: 'Kamogawa', whyGood: 'A beira do rio Kamogawa. O mais luxuoso de Kyoto.', perNight: 1500 }],
    'luxury': [{ name: 'Aman Kyoto', stars: 5, neighborhood: 'Kita-ku', whyGood: 'Floresta privada de 32 hectares. Experiencia zen suprema.', perNight: 3500 }],
  },
  'hanoi': {
    'budget': [{ name: 'Hanoi La Siesta Hotel', stars: 3, neighborhood: 'Old Quarter', whyGood: 'No coracao do Old Quarter. Cafe da manha no terraço.', perNight: 120 }],
    'comfort': [{ name: "Hotel de l'Opera Hanoi", stars: 4, neighborhood: 'Hoan Kiem', whyGood: 'Estilo colonial frances. Em frente a Opera.', perNight: 300 }],
    'premium': [{ name: 'Sofitel Legend Metropole', stars: 5, neighborhood: 'Hoan Kiem', whyGood: 'Hotel lendario desde 1901. Bunker da Guerra do Vietna no subsolo.', perNight: 600 }],
    'luxury': [{ name: 'Capella Hanoi', stars: 5, neighborhood: 'Hoan Kiem', whyGood: 'Boutique de luxo inspirado na opera. 47 suites apenas.', perNight: 1200 }],
  },
  'rio de janeiro': {
    'budget': [{ name: 'Selina Copacabana', stars: 2, neighborhood: 'Copacabana', whyGood: 'Hostel moderno na praia mais famosa do mundo.', perNight: 180 }],
    'comfort': [{ name: 'Arena Copacabana', stars: 3, neighborhood: 'Copacabana', whyGood: 'Vista frontal do mar. Custo-beneficio excelente.', perNight: 350 }],
    'premium': [{ name: 'Fairmont Copacabana', stars: 5, neighborhood: 'Copacabana', whyGood: 'O antigo Sofitel. Piscina com vista do Pao de Acucar.', perNight: 900 }],
    'luxury': [{ name: 'Belmond Copacabana Palace', stars: 5, neighborhood: 'Copacabana', whyGood: 'O hotel mais iconico do Brasil desde 1923.', perNight: 3000 }],
  },
};

function getTierKey(budgetTier: string): string {
  const map: Record<string, string> = {
    'budget': 'budget', 'economic': 'budget', 'backpacker': 'budget',
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
  if (!destHotels) {
    // Smart fallback: generate reasonable hotel name for any city
    const fallbackHotels: Record<string, HotelRecommendation[]> = {
      'budget': [{ name: `Ibis ${destination}`, stars: 2, neighborhood: 'Centro', whyGood: 'Boa localizacao central com preco acessivel.', perNight: 250 }],
      'comfort': [{ name: `Novotel ${destination}`, stars: 3, neighborhood: 'Centro', whyGood: 'Conforto e localizacao privilegiada.', perNight: 450 }],
      'premium': [{ name: `Hilton ${destination}`, stars: 4, neighborhood: 'Centro', whyGood: 'Luxo e servico premium no coracao da cidade.', perNight: 800 }],
      'luxury': [{ name: `Four Seasons ${destination}`, stars: 5, neighborhood: 'Centro', whyGood: 'A melhor experiencia hoteleira da cidade.', perNight: 2000 }],
    };
    const fb = fallbackHotels[tierKey] || fallbackHotels['comfort'];
    return fb ? fb[0] : null;
  }

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
