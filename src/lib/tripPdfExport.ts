// tripPdfExport — Premium PDF with KINU branding + destination photos
// CRITICAL: NO emoji in PDF text — jsPDF Helvetica does not support Unicode emoji

import jsPDF from 'jspdf';
import type { SavedTrip } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTopMichelinForCity } from '@/lib/michelinData';

// ── Branding colors (RGB) ──
const B = {
  night:    [15, 23, 42] as const,
  deep:     [30, 41, 59] as const,
  surface:  [51, 65, 85] as const,
  emerald:  [16, 185, 129] as const,
  emeraldL: [110, 231, 183] as const,
  horizon:  [14, 165, 233] as const,
  gold:     [234, 179, 8] as const,
  white:    [248, 250, 252] as const,
  gray400:  [148, 163, 184] as const,
  gray500:  [100, 116, 139] as const,
};

// ── Destination cover photos (Unsplash direct links) ──
const DESTINATION_COVER_PHOTOS: Record<string, string[]> = {
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'roma': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'londres': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'bangkok': [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'toquio': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'dubai': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'nova york': [
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'lisboa': [
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1548707309-dcebeab426c8?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'barcelona': [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'buenos aires': [
    'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'amsterdam': [
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'cairo': [
    'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'phuket': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'bali': [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'cancun': [
    'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'miami': [
    'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'singapura': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
  'milao': [
    'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ],
};

// ── Destination descriptions (NO accents to avoid jsPDF encoding issues) ──
const DESTINATION_DESCRIPTIONS: Record<string, string> = {
  'cairo': 'Cairo, capital do Egito, e uma das cidades mais antigas e fascinantes do mundo. Com mais de 20 milhoes de habitantes, a cidade e o coracao cultural do Oriente Medio. As lendarias Piramides de Giza, o Museu Egipcio e o vibrante bazar Khan el-Khalili sao imperdiveis. A culinaria local vai do koshari nas ruas ate sofisticados restaurantes a beira do Nilo.',
  'paris': 'Paris, a Cidade Luz, e sinonimo de arte, gastronomia e romance. Dos cafes de Montmartre a grandiosidade do Louvre, cada bairro conta uma historia. A Torre Eiffel, os Champs-Elysees e Notre-Dame sao apenas o comeco de uma cidade que abriga alguns dos melhores restaurantes e museus do mundo.',
  'roma': 'Roma, a Cidade Eterna, oferece uma jornada atraves de 2.800 anos de historia. Do Coliseu ao Vaticano, da Fontana di Trevi ao Pantheon, cada esquina revela uma obra-prima. A culinaria romana — carbonara, cacio e pepe, suppli — e tao iconica quanto seus monumentos.',
  'toquio': 'Toquio e onde o futuro encontra a tradicao. Templos milenares convivem com arranha-ceus futuristas. De Shibuya a Asakusa, Akihabara a Harajuku, cada bairro e um mundo proprio. A culinaria japonesa — do sushi ao ramen — eleva qualquer refeicao a uma experiencia memoravel.',
  'tokyo': 'Tokyo is where the future meets tradition. Centuries-old temples stand beside futuristic skyscrapers. From Shibuya to Asakusa, Akihabara to Harajuku, each neighborhood offers a uniquely Japanese blend of innovation and culture.',
  'londres': 'Londres e uma metropole global que combina historia regia com vanguarda cultural. Do Palacio de Buckingham ao Tate Modern, do Borough Market aos pubs centenarios, a cidade oferece experiencias para todos os gostos e orcamentos em qualquer estacao do ano.',
  'nova york': 'Nova York, a cidade que nunca dorme, e o epicentro cultural do mundo ocidental. Manhattan, Brooklyn, Queens — cada borough tem sua personalidade. De Broadway a Central Park, do MET ao Chelsea Market, a energia desta cidade e verdadeiramente inigualavel.',
  'barcelona': 'Barcelona combina praia, arquitetura e gastronomia como poucas cidades no mundo. As obras de Gaudi — Sagrada Familia, Park Guell, Casa Batllo — definem a paisagem urbana. Las Ramblas, o Bairro Gotico e o Mercado de La Boqueria completam uma experiencia incomparavel.',
  'buenos aires': 'Buenos Aires, o Paris da America do Sul, pulsa com tango, churrasco e cultura. De San Telmo a Palermo, a cidade combina elegancia europeia com energia latina. Os cafes historicos, as casas de tango e a cena gastronomica fazem desta cidade um destino inesquecivel.',
  'bangkok': 'Bangkok e um festival sensorial: templos dourados, mercados flutuantes, street food lendaria e uma vida noturna vibrante. Do Grande Palacio ao Wat Pho, de Chinatown a Sukhumvit, a capital tailandesa surpreende a cada esquina com sabores e cores unicas.',
  'dubai': 'Dubai e onde o impossivel se torna realidade. O Burj Khalifa, o Dubai Mall, as ilhas artificiais — tudo e superlativo. Mas alem do luxo, ha o Dubai historico: o Creek, os souks de ouro e especiarias, e a calorosa hospitalidade arabe.',
  'lisboa': 'Lisboa e uma das capitais mais charmosas da Europa. Os bondes historicos sobem as colinas entre miradouros com vistas deslumbrantes. O pasteis de nata, o fado nos bares de Alfama e os azulejos nas fachadas criam uma atmosfera unica que mistura nostalgia e modernidade.',
  'amsterdam': 'Amsterdam encanta com seus canais, bicicletas e museus de classe mundial. O Rijksmuseum, o Museu Van Gogh e a Casa de Anne Frank estao a uma pedalada de distancia. A cidade e conhecida por sua tolerancia, vida noturna animada e mercados flutuantes coloridos.',
  'phuket': 'Phuket, a maior ilha da Tailandia, e um paraiso tropical que combina praias de areia branca, templos budistas e uma vibrante cultura local. De Patong Beach ao centro historico de Old Phuket Town, a ilha oferece desde aventuras aquaticas ate experiencias gastronomicas autenticas.',
  'milao': 'Milao e a capital da moda e do design, mas tambem guarda tesouros culturais impressionantes. O Duomo, a maior catedral gotica da Italia, domina a paisagem. La Scala e referencia mundial em opera. Os canais de Navigli, a Pinacoteca di Brera e a efervescente cena gastronomica fazem de Milao muito mais do que um destino de compras.',
};

// ── Day narratives by destination + theme ──
const DESTINATION_DAY_NARRATIVES: Record<string, Record<string, string>> = {
  'bangkok': {
    'Embarque': 'Saida de Guarulhos rumo a capital tailandesa. O voo para Bangkok dura em media 20 horas com conexao.',
    'Chegada': 'Bem-vindo a Bangkok! A cidade recebe voce com seu calor tropical e energia contagiante. Apos o transfer ao hotel, um passeio leve pelo bairro revela as primeiras impressoes: templos dourados, vendedores de rua e o aroma inconfundivel da culinaria thai.',
    'Cultura': 'Dia dedicado a riqueza cultural de Bangkok. O Grand Palace e o Wat Phra Kaew sao obrigatorios — o Buda de Esmeralda e a imagem mais sagrada da Tailandia, esculpida no seculo XV. O Wat Pho abriga o impressionante Buda Reclinado de 46 metros.',
    'Gastronomia': 'Bangkok e unanime entre chefs do mundo como a capital mundial do street food. Do pad thai na Rua Yaowarat ao som tam nos mercados de Chatuchak, cada refeicao e uma experiencia. Prove o mango sticky rice — a sobremesa mais iconica da Tailandia.',
    'Passeios': 'Explore os canais de Thonburi, o lado menos turistico de Bangkok que preserva o charme da "Veneza do Oriente". Os mercados flutuantes de Damnoen Saduak oferecem uma janela para o modo de vida tradicional thailandes.',
    'Descobertas': 'Descubra o lado contemporaneo de Bangkok: galerias de arte em Charoen Krung, rooftop bars em Silom, e o vibrante bairro de Ari com seus cafes artesanais.',
    'Aventura': 'Explore os arredores de Bangkok — um day trip ao mercado ferroviario de Maeklong ou ao parque historico de Ayutthaya (patrimonio UNESCO) revela outra dimensao da Tailandia.',
    'Retorno': 'Ultimo cafe da manha em Bangkok. Aproveite para compras de ultima hora no MBK Center ou Chatuchak Weekend Market antes do transfer ao aeroporto.',
  },
  'phuket': {
    'Embarque': 'Saida rumo ao paraiso tailandes. O voo para Phuket dura em media 22 horas com conexao, geralmente via Bangkok ou Singapura.',
    'Chegada': 'Bem-vindo a Phuket! A maior ilha da Tailandia recebe voce com praias de areia branca e agua cristalina. O centro historico de Old Phuket Town, com arquitetura sino-portuguesa, e uma surpresa charmosa.',
    'Cultura': 'Phuket guarda mais historia do que aparenta. O templo Wat Chalong, o mais importante da ilha, e o Big Buddha de 45 metros no topo da colina Nakkerd oferecem uma perspectiva contemplativa alem das praias.',
    'Gastronomia': 'A culinaria de Phuket tem identidade propria — o mee hokkien (macarrao frito), o oh tao (ostra frita) e o kanom jeen (curry com noodles) sao especialidades locais. O Night Market de Chillva e imperdivel.',
    'Passeios': 'As praias de Phuket sao diversas: Patong para agitacao, Kata para familias, Freedom Beach para isolamento. O mirante de Promthep Cape ao por do sol e uma das vistas mais bonitas da Tailandia.',
    'Descobertas': 'Explore Old Phuket Town — grafites coloridos, cafes artesanais e galerias escondidas nas ruas Thalang e Soi Romanee. Aos domingos, a Walking Street Market ganha vida com comida e artesanato.',
    'Aventura': 'Um dia nas ilhas Phi Phi e obrigatorio — Maya Bay (cenario do filme "A Praia"), snorkeling em Bamboo Island e almoco em Phi Phi Don. Outra opcao imperdivel: a baia de Phang Nga com seus monolitos calcarios.',
    'Retorno': 'Ultimo mergulho antes de partir! Aproveite o cafe da manha com vista para o mar e faca compras de ultima hora no Jungceylon Mall.',
  },
  'paris': {
    'Embarque': 'Saida rumo a Cidade Luz. O voo para Paris dura em media 11 horas direto de Guarulhos.',
    'Chegada': 'Bienvenue a Paris! Mesmo a primeira caminhada pelo bairro do hotel revela a elegancia parisiense — as boulangeries, os cafes nas calcadas e a arquitetura haussmanniana.',
    'Cultura': 'O Louvre merece um dia inteiro, mas se o tempo e curto, foque na ala Denon (Mona Lisa, Venus de Milo). Pela tarde, o Museu dOrsay abriga a maior colecao impressionista do mundo.',
    'Gastronomia': 'Paris e a capital mundial da gastronomia. Dos bistrots classicos de Saint-Germain aos mercados de rua do Marais, cada refeicao e uma celebracao.',
    'Passeios': 'Montmartre e o coracao boemio de Paris. Suba ate a Basilica de Sacre-Coeur para a melhor vista da cidade. Um cruzeiro pelo Sena ao por do sol revela Paris de um angulo inesquecivel.',
    'Descobertas': 'Paris fora do obvio: a Sainte-Chapelle tem os vitrais mais impressionantes da Europa (sec. XIII). O Canal Saint-Martin e o bairro preferido dos parisienses — bistrots e boutiques longe dos turistas. O rooftop das Galeries Lafayette oferece vista gratuita de 360 graus.',
    'Aventura': 'Versalhes merece um dia inteiro. O Palacio de Luis XIV tem 2.300 salas, mas o jardim de 800 hectares e onde a magia acontece. Alugue bicicleta para explorar o Grand e Petit Trianon — o refugio privado de Maria Antonieta.',
    'Retorno': 'Dernier jour! Um cafe final nos Champs-Elysees antes de partir. Bon voyage!',
  },
  'roma': {
    'Embarque': 'Saida rumo a Cidade Eterna. O voo para Roma dura em media 12 horas com conexao.',
    'Chegada': 'Benvenuti a Roma! A cidade milenar revela sua historia a cada esquina — ruinas romanas convivem com trattorias animadas.',
    'Cultura': 'O Coliseu, o Forum Romano e o Palatino formam o coracao da Roma antiga. Construido em 80 d.C., o Coliseu podia receber 50 mil espectadores. O Vaticano, com a Capela Sistina de Michelangelo, e uma experiencia transcendente.',
    'Gastronomia': 'A culinaria romana e simples e genial. Carbonara, cacio e pepe, amatriciana — cada prato e uma aula de sabor com poucos ingredientes. Prove um suppli na rua.',
    'Passeios': 'Trastevere e o bairro mais charmoso de Roma — ruelas de paralelepipedos, fachadas cobertas de hera e cantinas onde os romanos de verdade jantam.',
    'Descobertas': 'A Galleria Borghese exige reserva antecipada mas e a colecao de arte mais preciosa de Roma — Bernini, Caravaggio, Raphael em uma villa renascentista. A Via Appia Antica oferece catacumbas e ruinas fora do circuito turistico.',
    'Aventura': 'Tivoli, a 30km de Roma, abriga duas joias UNESCO: a Villa dEste com suas 500 fontes renascentistas e a Villa Adriana, o retiro do imperador Adriano. O jardim da Villa dEste e o mais fotografado da Italia.',
    'Retorno': 'Ultimo espresso italiano. Arrivederci, Roma!',
  },
  'toquio': {
    'Embarque': 'Saida rumo ao Japao. O voo para Toquio dura em media 24 horas com conexao.',
    'Chegada': 'Yokoso! Toquio impressiona desde o aeroporto — a organizacao, a limpeza e a gentileza japonesa sao impactantes.',
    'Cultura': 'Asakusa e o coracao tradicional de Toquio. O templo Senso-ji, fundado em 645 d.C., e o mais antigo da cidade. O santuario Meiji em Harajuku oferece um oasis de paz.',
    'Gastronomia': 'Toquio tem mais estrelas Michelin que qualquer cidade do mundo. Do sushi no Tsukiji ao ramen em Shinjuku, cada refeicao e uma obra-prima.',
    'Passeios': 'Shibuya, Akihabara, Ginza — cada bairro e um universo. O cruzamento de Shibuya e o mais movimentado do mundo.',
    'Descobertas': 'TeamLab Borderless e arte digital imersiva que redefine museus — caminhe dentro das obras. Akihabara e o epicentro da cultura otaku. Ginza Six combina arte contemporanea com compras de luxo.',
    'Aventura': 'Kamakura, a 1h de trem, foi a capital do Japao medieval. O Grande Buda de bronze (13m, 1252 d.C.) e impressionante. A ilha de Enoshima oferece grutas, santuarios e vista do Monte Fuji em dias claros.',
    'Retorno': 'Sayonara! Um ultimo bento no aeroporto de Narita e a despedida perfeita.',
  },
  'londres': {
    'Embarque': 'Saida rumo ao Reino Unido. O voo para Londres dura em media 11 horas direto.',
    'Chegada': 'Welcome to London! A cidade combina historia regia com vanguarda cultural. Dos black cabs aos pubs centenarios, Londres tem uma energia unica.',
    'Cultura': 'O British Museum e gratuito e abriga tesouros de toda a historia humana. A Tower of London guarda as Joias da Coroa e 1.000 anos de historia.',
    'Gastronomia': 'Borough Market e obrigatorio — queijos artesanais, ostras frescas e o melhor fish and chips. Brick Lane oferece o melhor curry fora da India.',
    'Passeios': 'Um passeio pelo Thames Path revela Londres de outra perspectiva — do Big Ben ao Tate Modern, da St Pauls ao Shakespeare Globe.',
    'Descobertas': 'Notting Hill encanta com casas coloridas e o Portobello Road Market (sabados). Camden Town mistura punk, street food e mercados alternativos. O Sky Garden (gratuito com reserva) tem a melhor vista de Londres.',
    'Aventura': 'Stonehenge e Bath em um dia: o misterio neolitico de 5.000 anos seguido dos banhos romanos mais preservados do mundo. A cidade georgiana de Bath e um charme a parte.',
    'Retorno': 'Cheerio! Um ultimo afternoon tea antes de partir.',
  },
  'dubai': {
    'Embarque': 'Saida rumo aos Emirados. O voo para Dubai dura em media 14 horas com conexao.',
    'Chegada': 'Ahlan wa sahlan! Dubai impressiona desde a chegada — o skyline futurista com o Burj Khalifa dominando o horizonte.',
    'Cultura': 'Alem do luxo, Dubai guarda historia no bairro Al Fahidi — casas tradicionais com torres de vento, o Creek e os souks de ouro e especiarias.',
    'Gastronomia': 'A culinaria de Dubai e um mosaico do Oriente Medio — shawarma, falafel, machboos. Restaurantes como Al Mallah em Satwa oferecem comida autentica.',
    'Passeios': 'O deserto e tao impressionante quanto a cidade. Um safari com jantar beduino sob as estrelas e uma experiencia transformadora.',
    'Descobertas': 'O bairro de Alserkal Avenue e o polo de arte contemporanea de Dubai — galerias, estudio de artistas e cafes criativos escondidos em armazens industriais.',
    'Aventura': 'Safari no deserto com 4x4, sandboarding nas dunas e jantar beduino sob as estrelas. O por do sol sobre as dunas e hipnotizante.',
    'Retorno': 'Ma al-salama! Ultimas compras no Dubai Mall antes do voo.',
  },
  'milao': {
    'Embarque': 'Saida de Guarulhos rumo a capital da moda italiana. O voo para Milao (Malpensa) dura em media 12 horas com conexao.',
    'Chegada': 'Benvenuti a Milano! A cidade surpreende ja na chegada — o design italiano esta em cada detalhe, da arquitetura do aeroporto ate o metro elegante.',
    'Cultura': 'Dia dedicado a grandiosidade de Milao. O Duomo levou 6 seculos para ser construido — suba ao terraco para vistas de tirar o folego. A Pinacoteca di Brera abriga obras de Caravaggio e Raphael.',
    'Gastronomia': 'Milao tem uma cena gastronomica surpreendente. O risotto alla milanese (com acafrao), o ossobuco e a cotoletta sao os classicos. O Mercato Centrale e obrigatorio.',
    'Passeios': 'A Galleria Vittorio Emanuele II e o shopping mais bonito do mundo — mosaicos no teto, lojas de luxo e o famoso touro da sorte no chao. O Castelo Sforzesco abriga a ultima escultura de Michelangelo.',
    'Descobertas': 'O bairro Isola e o novo polo criativo de Milao — Bosco Verticale, galerias independentes e restaurantes de autor. Navigli ao por do sol e imperdivel para aperitivo.',
    'Aventura': 'O Lago di Como esta a apenas 1h de trem. Bellagio, a perola do lago, tem vilas historicas, jardins e vistas que parecem pintura.',
    'Retorno': 'Ultimo espresso italiano! Aproveite para compras de ultima hora na Via Montenapoleone ou no Eataly Milano antes do transfer a Malpensa.',
  },
  'barcelona': {
    'Embarque': 'Saida rumo a capital catala. O voo para Barcelona dura em media 12 horas com conexao.',
    'Chegada': 'Benvinguts a Barcelona! A cidade de Gaudi recebe voce com sol, mar e uma energia contagiante.',
    'Cultura': 'A Sagrada Familia e a obra-prima inacabada de Gaudi — 140 anos em construcao. As fachadas contam a historia de Cristo em pedra. A Casa Batllo e a Casa Mila completam o trio modernista.',
    'Gastronomia': 'La Boqueria e um dos mercados mais vibrantes do mundo — frutas exoticas, presunto iberico, frutos do mar. As tapas no El Born sao uma experiencia social: bar em bar, prato a prato.',
    'Passeios': 'Park Guell e Gaudi em modo natureza — mosaicos ondulantes, colunas inclinadas e a melhor vista de Barcelona. Barceloneta ao por do sol e obrigatoria.',
    'Descobertas': 'O Bunkers del Carmel e o segredo mais mal guardado de Barcelona — mirante 360 graus. O Palau de la Musica e art nouveau em estado puro.',
    'Aventura': 'Montserrat, a 1h de trem, e uma montanha sagrada com mosteiro beneditino e trilhas com vistas absurdas. O coral Escolania canta ao meio-dia.',
    'Retorno': 'Adeu Barcelona! Um ultimo passeio pela Barceloneta antes de partir.',
  },
  'lisboa': {
    'Embarque': 'Saida rumo a capital portuguesa. O voo para Lisboa dura em media 10 horas direto.',
    'Chegada': 'Bem-vindo a Lisboa! A cidade das sete colinas recebe voce com luz dourada, azulejos e o aroma de pasteis de nata.',
    'Cultura': 'O Mosteiro dos Jeronimos (1502) e obra-prima do estilo manuelino. A Torre de Belem guardava a entrada do Tejo. O Castelo de Sao Jorge oferece a melhor vista de Lisboa.',
    'Gastronomia': 'O Time Out Market (Mercado da Ribeira) reune os melhores chefs de Portugal sob um teto. O pastel de nata da fabrica original em Belem usa receita secreta de monges do sec. XVIII.',
    'Passeios': 'O Bonde 28 corta os bairros historicos — Alfama, Graca, Baixa. Os miradouros de Lisboa sao o melhor programa gratuito da cidade.',
    'Descobertas': 'LX Factory e uma antiga fabrica convertida em polo criativo — livrarias, restaurantes, galerias. O Museu Nacional do Azulejo conta 5 seculos de historia.',
    'Aventura': 'Sintra e magia pura: o Palacio da Pena, a Quinta da Regaleira (tuneis secretos) e o Cabo da Roca — o ponto mais ocidental da Europa continental.',
    'Retorno': 'Ate breve, Lisboa! Um ultimo cafe no Chiado e pasteis de nata para levar.',
  },
  'nova york': {
    'Embarque': 'Saida rumo a Big Apple. O voo para Nova York dura em media 10 horas direto de GRU.',
    'Chegada': 'Welcome to New York! A energia e palpavel desde o momento em que voce sai do JFK. O skyline de Manhattan e hipnotizante.',
    'Cultura': 'O MET e um dos maiores museus do mundo — 2 milhoes de obras. O MoMA abriga Starry Night de Van Gogh. Central Park e o pulmao verde de Manhattan.',
    'Gastronomia': 'NY e a capital culinaria mais diversa do mundo — pizza artesanal no Village, pastrami no Katzs, dim sum em Chinatown.',
    'Passeios': 'O High Line transformou uma ferrovia abandonada em parque aereo. Brooklyn Bridge a pe oferece vistas iconicas. DUMBO tem as melhores fotos de Manhattan.',
    'Descobertas': 'Top of the Rock supera o Empire State em vistas. SoHo e Greenwich Village sao o coracao criativo de NY. Little Italy e Chinatown ficam a metros uma da outra.',
    'Aventura': 'A Estatua da Liberdade e Ellis Island contam a historia da imigracao americana. Reserve ingresso para a coroa com antecedencia.',
    'Retorno': 'See you later, NYC! Um ultimo bagel e cafe no Upper West Side antes do JFK.',
  },
  'buenos aires': {
    'Embarque': 'Saida rumo a capital argentina. O voo para Buenos Aires dura apenas 3 horas direto.',
    'Chegada': 'Bienvenido a Buenos Aires! A energia portena e contagiante desde a primeira empanada.',
    'Cultura': 'O Teatro Colon e um dos teatros de opera mais importantes do mundo. O MALBA abriga arte latino-americana contemporanea. O Cemiterio da Recoleta e arte e historia a ceu aberto.',
    'Gastronomia': 'Buenos Aires e a capital do asado. Don Julio e La Cabrera sao referencias de parrilla. O alfajor e sobremesa obrigatoria.',
    'Passeios': 'San Telmo aos domingos e uma festa — feira de antiguidades, tango na rua e parillas. La Boca (Caminito) e pura cor e energia.',
    'Descobertas': 'Palermo Soho e o bairro mais descolado — restaurantes de autor, bares craft, design argentino. Os murais de street art estao em cada esquina.',
    'Aventura': 'Tigre, a 1h de trem, e o delta do Parana com canais, ilhas e natureza. Passeio de barco e almoco a beira do rio.',
    'Retorno': 'Hasta luego, Buenos Aires! Ultimo cafe com medialunas antes de partir.',
  },
  'amsterdam': {
    'Embarque': 'Saida rumo a Holanda. O voo para Amsterdam dura em media 12 horas com conexao.',
    'Chegada': 'Welkom in Amsterdam! A cidade dos canais e bicicletas recebe voce com charme e liberdade.',
    'Cultura': 'O Rijksmuseum e o museu mais importante da Holanda — A Ronda Noturna de Rembrandt e monumental. O Museu Van Gogh e a Casa de Anne Frank completam o trio cultural.',
    'Gastronomia': 'O Albert Cuyp Market e o maior mercado de rua de Amsterdam. Stroopwafels frescos, arenque, bitterballen. O Foodhallen reune o melhor street food sob um teto.',
    'Passeios': 'Um passeio de barco pelos canais e a melhor forma de conhecer Amsterdam. Jordaan e o bairro mais charmoso — galerias, cafes acolhedores e flores.',
    'Descobertas': 'De Pijp e o bairro mais multicultural — Heineken Experience, restaurantes surinameses e indonesios. Vondelpark e o Central Park de Amsterdam.',
    'Aventura': 'Zaanse Schans (30min de trem) tem os classicos moinhos holandeses, fabricas de queijo e tamancos. Edam e o paraiso do queijo holandes.',
    'Retorno': 'Tot ziens! Ultimo pannenkoek e compras de queijo antes do voo.',
  },
  'cairo': {
    'Embarque': 'Saida rumo ao Egito. O voo para Cairo dura em media 14 horas com conexao.',
    'Chegada': 'Ahlan wa sahlan! O Cairo e caos e magia — buzinas, minaretes e as Piramides no horizonte.',
    'Cultura': 'As Piramides de Giza e a Esfinge sao a unica Maravilha do Mundo Antigo que sobreviveu. O Museu Egipcio abriga o tesouro de Tutankhamon.',
    'Gastronomia': 'O koshari e o prato nacional — arroz, lentilha, macarrao e molho de tomate. Prove o ful medames (fava) e o ta\'amiya (falafel egipcio).',
    'Passeios': 'Khan el-Khalili e o bazar mais antigo do Oriente Medio — especiarias, perfumes, artesanato. Pechinche sem medo!',
    'Descobertas': 'Zamalek, a ilha no Nilo, e o bairro mais cosmopolita — galerias, restaurantes e a vista do Cairo Tower.',
    'Aventura': 'Um passeio de felucca (barco a vela) pelo Nilo ao por do sol e uma experiencia atemporal.',
    'Retorno': 'Ma al-salama! Ultimas compras no Khan el-Khalili antes do aeroporto.',
  },
};

const GENERIC_DAY_NARRATIVES: Record<string, string> = {
  'Embarque': 'Dia de embarque! Confira documentos, pesos de bagagem e chegue ao aeroporto com antecedencia.',
  'Chegada': 'Primeiro contato com o destino. Apos o transfer ao hotel, um passeio leve pelo bairro e a melhor forma de sentir a energia local.',
  'Cultura': 'Dia dedicado a cultura local — museus, monumentos e sitios historicos que contam a historia deste lugar fascinante.',
  'Gastronomia': 'Dia de explorar a culinaria local. Mercados, restaurantes tipicos e street food revelam a alma gastronomica do destino.',
  'Passeios': 'Dia de explorar o destino a pe ou de transporte local. Bairros historicos, parques e mirantes oferecem perspectivas unicas.',
  'Descobertas': 'Dia de descobertas — galerias, bairros alternativos e experiencias fora do roteiro convencional.',
  'Aventura': 'Dia de aventura! Excursoes aos arredores, trilhas ou experiencias ao ar livre para quem quer explorar alem da cidade.',
  'Retorno': 'Ultimo dia. Aproveite para compras, um ultimo passeio pelo bairro e prepare a bagagem para o voo de volta.',
};

// ── Destination practical info ──
const DESTINATION_INFO: Record<string, { timezone: string; voltage: string; language: string; currency: string; visa: string }> = {
  'bangkok': { timezone: 'UTC+7 (10h a frente do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Tailandes (ingles turistico)', currency: 'Baht Tailandes (THB)', visa: 'Isento para brasileiros ate 90 dias' },
  'phuket': { timezone: 'UTC+7 (10h a frente do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Tailandes (ingles turistico)', currency: 'Baht Tailandes (THB)', visa: 'Isento para brasileiros ate 90 dias' },
  'paris': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/E', language: 'Frances', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'roma': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'toquio': { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '100V - Tomada tipo A/B', language: 'Japones', currency: 'Iene Japones (JPY)', visa: 'Isento para brasileiros ate 90 dias' },
  'londres': { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Ingles', currency: 'Libra Esterlina (GBP)', visa: 'Necessario ETA (autorizacao eletronica)' },
  'dubai': { timezone: 'UTC+4 (7h a frente do Brasil)', voltage: '220V - Tomada tipo G', language: 'Arabe (ingles universal)', currency: 'Dirham (AED)', visa: 'Isento para brasileiros ate 90 dias' },
  'buenos aires': { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/I', language: 'Espanhol', currency: 'Peso Argentino (ARS)', visa: 'Isento para brasileiros - apenas RG' },
  'lisboa': { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Portugues', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'nova york': { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
  'barcelona': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Espanhol/Catalao', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'amsterdam': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Holandes (ingles universal)', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'cairo': { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Arabe', currency: 'Libra Egipcia (EGP)', visa: 'Visto na chegada (USD 25)' },
  'milao': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'bali': { timezone: 'UTC+8 (11h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Indonesio (ingles turistico)', currency: 'Rupia Indonesa (IDR)', visa: 'Isento para brasileiros ate 30 dias' },
  'cancun': { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '127V - Tomada tipo A/B', language: 'Espanhol', currency: 'Peso Mexicano (MXN)', visa: 'Isento para brasileiros com visto EUA valido ou autorizacao eletronica' },
  'miami': { timezone: 'UTC-5 (2h atras do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Ingles/Espanhol', currency: 'Dolar Americano (USD)', visa: 'Necessario visto B1/B2' },
  'singapura': { timezone: 'UTC+8 (11h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Ingles/Mandarim/Malaio/Tamil', currency: 'Dolar de Singapura (SGD)', visa: 'Isento para brasileiros ate 30 dias' },
  'seul': { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Coreano', currency: 'Won Sul-Coreano (KRW)', visa: 'Isento para brasileiros ate 90 dias' },
  'berlim': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Alemao', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
  'marrakech': { timezone: 'UTC+1', voltage: '220V - Tomada tipo C/E', language: 'Arabe/Frances', currency: 'Dirham Marroquino (MAD)', visa: 'Isento para brasileiros ate 90 dias' },
  'santorini': { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Grego', currency: 'Euro (EUR)', visa: 'Isento para brasileiros ate 90 dias (Schengen)' },
};

// ── Destination tips (phrases, embassy, tipping, water) ──
const DESTINATION_TIPS: Record<string, { tips: string; water: string; tipping: string; phrases: string[]; embassy: string }> = {
  'paris': {
    tips: 'Sempre cumprimente com "Bonjour" ao entrar em lojas. Metro e o transporte mais eficiente.',
    water: 'Segura da torneira',
    tipping: 'Service compris (gorjeta inclusa). Arredondar a conta e gentileza.',
    phrases: ['Bonjour (Ola)', 'Merci (Obrigado)', 'Sil vous plait (Por favor)', 'Combien? (Quanto?)', 'Parlez-vous anglais? (Fala ingles?)', 'Au revoir (Adeus)'],
    embassy: 'Embaixada do Brasil: +33 1 45 61 63 00 | 34 Cours Albert 1er, 75008',
  },
  'roma': {
    tips: 'Cuidado com golpes perto do Coliseu. Fontes nasoni tem agua potavel gratis pela cidade.',
    water: 'Segura da torneira (e das fontes)',
    tipping: 'Coperto (taxa de servico) ja incluso. Gorjeta extra nao e esperada.',
    phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Per favore (Por favor)', 'Quanto costa? (Quanto custa?)', 'Il conto (A conta)', 'Scusi (Com licenca)'],
    embassy: 'Embaixada do Brasil: +39 06 6835 7800 | Piazza Navona 14',
  },
  'milao': {
    tips: 'Reserve a Ultima Ceia de Da Vinci com meses de antecedencia. Metro linha M1 (vermelha) conecta tudo.',
    water: 'Segura da torneira',
    tipping: 'Nao obrigatoria. Coperto incluso na conta.',
    phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Quanto costa? (Quanto custa?)', 'Il conto (A conta)', 'Dove...? (Onde fica...?)', 'Scusi (Com licenca)'],
    embassy: 'Consulado do Brasil em Milao: +39 02 7602 5524 | Corso Europa 12',
  },
  'londres': {
    tips: 'Oyster Card ou contactless no transporte. Museus nacionais sao gratuitos.',
    water: 'Segura da torneira',
    tipping: '10-12.5% em restaurantes (verifique se service charge ja esta incluso).',
    phrases: ['Cheers (Obrigado/Saude)', 'Excuse me (Com licenca)', 'Could I have the bill? (A conta?)', 'Mind the gap (Cuidado com o vao)'],
    embassy: 'Embaixada do Brasil: +44 20 7399 9000 | 14-16 Cockspur Street, SW1',
  },
  'toquio': {
    tips: 'Compre Suica/Pasmo card para transporte. Sapatos saem antes de entrar em casas e templos.',
    water: 'Segura da torneira',
    tipping: 'NUNCA de gorjeta — e considerado ofensivo no Japao.',
    phrases: ['Konnichiwa (Ola)', 'Arigatou gozaimasu (Muito obrigado)', 'Sumimasen (Com licenca)', 'Ikura desu ka? (Quanto custa?)', 'Oishii! (Delicioso!)'],
    embassy: 'Embaixada do Brasil: +81 3 5488 5531 | 2-11-12 Kita-Aoyama, Minato-ku',
  },
  'barcelona': {
    tips: 'Cuidado com batedores de carteira em Las Ramblas e metro. Jantar so comeca as 21h.',
    water: 'Segura mas com gosto. Muitos preferem engarrafada.',
    tipping: 'Arredondar a conta. 5-10% em restaurantes finos.',
    phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto cuesta? (Quanto custa?)', 'Perdon (Com licenca)'],
    embassy: 'Consulado do Brasil: +34 93 488 2288 | Av. Diagonal 468',
  },
  'lisboa': {
    tips: 'Use calcados confortaveis — Lisboa e feita de ladeiras. Bonde 28 lota rapido, va cedo.',
    water: 'Segura da torneira',
    tipping: '5-10% em restaurantes. Nao obrigatoria.',
    phrases: ['Ola (Ola)', 'Obrigado/a', 'Por favor', 'A conta (A conta)', 'Quanto custa? (Quanto custa?)'],
    embassy: 'Embaixada do Brasil: +351 21 724 8510 | Estrada das Laranjeiras 144',
  },
  'amsterdam': {
    tips: 'Bike e rei. Cuidado ao cruzar ciclovias. OV-chipkaart para transporte.',
    water: 'Segura da torneira',
    tipping: 'Arredondar a conta. 5-10% em restaurantes.',
    phrases: ['Hallo (Ola)', 'Dank je wel (Obrigado)', 'Alsjeblieft (Por favor)', 'Hoeveel? (Quanto?)', 'Spreekt u Engels? (Fala ingles?)'],
    embassy: 'Embaixada do Brasil: +31 70 302 3959 | Mauritskade 19, Haia',
  },
  'bangkok': {
    tips: 'Wai (curvatura com maos juntas) e o cumprimento local. Nunca toque a cabeca de alguem.',
    water: 'NAO beba da torneira. Use engarrafada.',
    tipping: 'Nao obrigatoria. 20-50 baht em restaurantes e gentileza.',
    phrases: ['Sawadee krap/ka (Ola)', 'Khop khun krap/ka (Obrigado)', 'Tao rai? (Quanto?)', 'Aroy! (Delicioso!)', 'Mai phet (Sem pimenta)'],
    embassy: 'Embaixada do Brasil: +66 2 285 6081 | Sathorn 34, Sathorn Road',
  },
  'phuket': {
    tips: 'Negocie preco de longtail boats. Cuidado com golpes de tuk-tuk. Protetor solar e obrigatorio.',
    water: 'NAO beba da torneira. Use engarrafada.',
    tipping: 'Nao obrigatoria. 20-50 baht em restaurantes.',
    phrases: ['Sawadee krap/ka (Ola)', 'Khop khun krap/ka (Obrigado)', 'Tao rai? (Quanto?)', 'Aroy! (Delicioso!)'],
    embassy: 'Embaixada do Brasil em Bangkok: +66 2 285 6081',
  },
  'dubai': {
    tips: 'Vestimenta modesta fora dos resorts. Alcool so em bares de hotel licenciados.',
    water: 'Dessalinizada, segura mas com sabor. Engarrafada recomendada.',
    tipping: '10-15% em restaurantes (verifique se service charge ja esta).',
    phrases: ['As-salamu alaykum (Paz)', 'Shukran (Obrigado)', 'Bikam? (Quanto?)', 'Yalla! (Vamos!)', 'Inshallah (Se Deus quiser)'],
    embassy: 'Embaixada do Brasil: +971 2 632 6600 | Abu Dhabi (cobre Dubai)',
  },
  'nova york': {
    tips: 'MetroCard ou OMNY (contactless) no subway. Gorjeta e obrigatoria em restaurantes.',
    water: 'Segura da torneira (famosa por ser boa)',
    tipping: '18-22% OBRIGATORIO em restaurantes. $1-2 por drink em bares.',
    phrases: ['How much? (Quanto?)', 'Check please (A conta)', 'Excuse me (Com licenca)', 'Thank you (Obrigado)'],
    embassy: 'Consulado do Brasil: +1 917 777 7777 | 225 E 41st Street, Manhattan',
  },
  'buenos aires': {
    tips: 'Leve dolares em especie — cambio paralelo (dolar blue) pode ser vantajoso.',
    water: 'Segura da torneira',
    tipping: '10% em restaurantes (propina).',
    phrases: ['Che! (informal, Ei!)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto sale? (Quanto custa?)', 'Barbaro! (Legal!)'],
    embassy: 'Embaixada do Brasil: +54 11 4515 2400 | Cerrito 1350',
  },
  'cairo': {
    tips: 'Pechinche SEMPRE nos bazares. Leve dolares em especie para cambio.',
    water: 'NAO beba da torneira. Use engarrafada.',
    tipping: 'Baksheesh e esperado em toda parte. 10-15% em restaurantes.',
    phrases: ['Marhaba (Ola)', 'Shukran (Obrigado)', 'Bikam? (Quanto?)', 'La shukran (Nao obrigado)', 'Inshallah (Se Deus quiser)'],
    embassy: 'Embaixada do Brasil: +20 2 2749 6688 | 1125 Corniche El Nil, Cairo',
  },
  'bali': {
    tips: 'Alugue scooter so com CNH internacional. Templos exigem sarong (disponivel na entrada).',
    water: 'NAO beba da torneira. Use engarrafada.',
    tipping: 'Nao obrigatoria. 5-10% em restaurantes finos.',
    phrases: ['Selamat siang (Boa tarde)', 'Terima kasih (Obrigado)', 'Berapa? (Quanto?)', 'Tolong (Por favor)'],
    embassy: 'Embaixada do Brasil em Jacarta: +62 21 526 5656',
  },
  'cancun': {
    tips: 'Negocie passeios na praia. Leve pesos mexicanos para mercados locais.',
    water: 'NAO beba da torneira. Use engarrafada.',
    tipping: '10-15% em restaurantes. Propina e esperada.',
    phrases: ['Hola (Ola)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto cuesta? (Quanto custa?)'],
    embassy: 'Embaixada do Brasil: +52 55 5164 5959 | Cidade do Mexico',
  },
  'miami': {
    tips: 'Uber e Lyft funcionam bem. Outlets sao mais baratos que os shoppings.',
    water: 'Segura da torneira',
    tipping: '18-22% OBRIGATORIO em restaurantes. $1-2 por drink.',
    phrases: ['How much? (Quanto?)', 'Check please (A conta)', 'Thank you (Obrigado)'],
    embassy: 'Consulado do Brasil em Miami: +1 305 285 6200 | 80 SW 8th Street',
  },
  'singapura': {
    tips: 'Mascar chiclete e proibido. Metro (MRT) e o transporte mais eficiente.',
    water: 'Segura da torneira',
    tipping: 'Nao esperada. Service charge de 10% ja incluso.',
    phrases: ['Hello (Ola)', 'Thank you (Obrigado)', 'How much? (Quanto?)', 'Can lah! (Pode sim!)'],
    embassy: 'Embaixada do Brasil: +65 6256 6001 | 101 Thomson Road',
  },
};

function getDestTips(destination: string) {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_TIPS)) {
    const nk = normalizeForMatch(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  return null;
}

// ── Helpers ──

function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function getDestDescription(destination: string): string {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_DESCRIPTIONS)) {
    if (normalizeForMatch(k) === key || key.includes(normalizeForMatch(k)) || normalizeForMatch(k).includes(key)) return v;
  }
  return `${destination} e um destino fascinante que oferece cultura rica, gastronomia autentica e experiencias inesqueciveis. Prepare-se para descobrir monumentos historicos, mercados vibrantes e a hospitalidade local que torna cada viagem unica e especial.`;
}

function getDayNarrative(destination: string, dayTitle: string): string {
  const key = normalizeForMatch(destination);
  const cleanTitle = dayTitle.replace(/[^\w\sà-úÀ-Ú—·•\-,]/gi, '').trim();

  for (const [destKey, narratives] of Object.entries(DESTINATION_DAY_NARRATIVES)) {
    const ndk = normalizeForMatch(destKey);
    if (key.includes(ndk) || ndk.includes(key)) {
      for (const [theme, narrative] of Object.entries(narratives)) {
        if (cleanTitle.toLowerCase().includes(theme.toLowerCase())) return narrative;
      }
    }
  }

  for (const [theme, narrative] of Object.entries(GENERIC_DAY_NARRATIVES)) {
    if (cleanTitle.toLowerCase().includes(theme.toLowerCase())) return narrative;
  }

  return '';
}

function getDestInfo(destination: string) {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_INFO)) {
    const nk = normalizeForMatch(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  return null;
}

function cleanText(text: string): string {
  return text.replace(/[^\w\sà-úÀ-Ú—·•\-,.;:!?()\/'"@#$%&*+=<>{}[\]|\\~`^°ºª§¢£¥€]/gi, '').trim();
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

// ── Image fetching ──

function getDestCoverPhotos(destination: string): string[] {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_COVER_PHOTOS)) {
    const nk = normalizeForMatch(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  return ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80'];
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  const tryFetch = (attemptUrl: string, timeout: number): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 800;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), timeout);
      img.src = attemptUrl;
    });
  };

  // Attempt 1: original URL with longer timeout
  const result = await tryFetch(url, 10000);
  if (result) return result;

  // Attempt 2: slightly different URL params for better CORS
  const retryUrl = url.includes('?')
    ? url + '&fit=crop&fm=jpg'
    : url + '?w=1200&fit=crop&fm=jpg&q=80';
  const result2 = await tryFetch(retryUrl, 8000);
  if (result2) return result2;

  return null;
}

// ── Main Export Function (ASYNC for image fetching) ──

export async function exportTripPDF(trip: SavedTrip) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  let y = 0;

  // Fetch cover photos in parallel
  const coverUrls = getDestCoverPhotos(trip.destination);
  const [coverBase64, secondBase64] = await Promise.all([
    fetchImageAsBase64(coverUrls[0]),
    coverUrls.length > 1 ? fetchImageAsBase64(coverUrls[1]) : Promise.resolve(null),
  ]);

  const setC = (rgb: readonly number[], fill = true) => {
    if (fill) doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    else doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color: readonly number[]) => {
    setC(color, true);
    doc.rect(x, yPos, w, h, 'F');
  };

  const drawStatusDot = (x: number, yPos: number, color: readonly number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x, yPos, 1.2, 'F');
  };

  const addFooter = () => {
    drawRect(14, ph - 14, pw - 28, 0.3, B.surface);
    setC(B.gray400, false);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    doc.text('KINU — Travel Intelligence', 14, ph - 8);
    doc.text(`Gerado em ${today}  |  kinu.travel`, pw - 14, ph - 8, { align: 'right' });
  };

  const addPageHeader = () => {
    drawRect(0, 0, pw, 10, B.night);
    setC(B.gray400, false);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('KINU', 14, 6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cleanText(trip.destination).toUpperCase()} — Roteiro`, pw - 14, 6.5, { align: 'right' });
    y = 18;
  };

  const addPage = () => {
    addFooter();
    doc.addPage();
    drawRect(0, 0, pw, ph, B.night); // Navy background on EVERY page
    addPageHeader();
  };

  const checkPage = (needed: number) => {
    if (y + needed > ph - 22) addPage();
  };

  const tierLabels: Record<string, string> = { backpacker: 'Mochileiro', economic: 'Economico', comfort: 'Conforto', luxury: 'Luxo' };
  const tierLabel = tierLabels[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';
  const totalDays = trip.days?.length || 0;

  // ════════════════════════════════════════
  // PAGE 1 — COVER WITH PHOTO
  // ════════════════════════════════════════

  // Full navy background
  drawRect(0, 0, pw, ph, B.night);

  // Cover photo in top section
  let hasCover = false;
  if (coverBase64) {
    try {
      doc.addImage(coverBase64, 'JPEG', 0, 0, pw, 130);
      // Solid navy block at bottom of photo for smooth transition
      drawRect(0, 105, pw, 25, B.night);
      hasCover = true;
    } catch {
      // Fallback below
    }
  }

  // Fallback visual header when no photo loads
  if (!hasCover) {
    drawRect(0, 0, pw, 42, B.surface);
    drawRect(0, 0, pw / 3, 42, B.emerald);
    drawRect(0, 40, pw, 2, B.emerald);
  }

  // KINU branding — below photo area
  const titleY = hasCover ? 140 : 55;

  setC(B.white, false);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KINU', pw / 2, titleY, { align: 'center' });

  setC(B.gray400, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Travel Intelligence', pw / 2, titleY + 8, { align: 'center' });

  // Emerald accent line
  drawRect(pw / 2 - 30, titleY + 13, 60, 0.6, B.emerald);
  drawRect(pw / 2 - 20, titleY + 15, 40, 0.3, B.gold);

  // Destination
  y = titleY + 28;
  setC(B.white, false);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanText(trip.destination).toUpperCase(), pw / 2, y, { align: 'center' });
  y += 8;
  setC(B.gray400, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text((trip.country || '').toUpperCase(), pw / 2, y, { align: 'center' });

  y += 12;
  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM yyyy", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';
  setC(B.gray400, false);
  doc.setFontSize(10);
  doc.text(dateRange, pw / 2, y, { align: 'center' });
  y += 6;
  doc.text(`${totalDays} dias  |  ${trip.travelers} viajante(s)  |  Faixa ${tierLabel}`, pw / 2, y, { align: 'center' });

  // About destination section (only if space, i.e. no photo pushed it down too much)
  if (y + 40 < ph - 22) {
    y += 14;
    drawRect(14, y, pw - 28, 0.3, B.surface);
    y += 10;

    setC(B.emerald, false);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SOBRE O DESTINO', 14, y);
    y += 6;

    setC(B.gray400, false);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const desc = getDestDescription(trip.destination);
    const maxDescWidth = pw - 28;
    const descLines = doc.splitTextToSize(desc, maxDescWidth);
    const availableLines = Math.floor((ph - 22 - y) / 4.2);
    const linesToShow = descLines.slice(0, Math.min(descLines.length, availableLines));
    doc.text(linesToShow, 14, y);
    y += linesToShow.length * 4.2;
  }

  addFooter();

  // ════════════════════════════════════════
  // PAGE 2 — OVERVIEW (Photo strip + Financial + Flight/Hotel)
  // ════════════════════════════════════════
  doc.addPage();
  drawRect(0, 0, pw, ph, B.night); // Navy background
  addPageHeader();

  // Second photo strip
  if (secondBase64) {
    try {
      doc.addImage(secondBase64, 'JPEG', 14, y, pw - 28, 50);
      y += 54;
    } catch {
      // Skip
    }
  }

  // Resumo Financeiro
  checkPage(45);
  setC(B.emerald, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINANCEIRO', 14, y);
  y += 6;

  const boxH = 34;
  drawRect(14, y, pw - 28, boxH, B.deep);
  drawRect(14, y, 2, boxH, B.emerald);

  const finData = [
    { label: 'Orcamento total', value: `R$ ${fmt(trip.finances?.total || trip.budget || 0)}`, color: B.white },
    { label: 'Confirmado', value: `R$ ${fmt(trip.finances?.confirmed || 0)}`, color: B.emerald },
    { label: 'Planejado', value: `R$ ${fmt(trip.finances?.planned || 0)}`, color: B.gold },
    { label: 'Disponivel', value: `R$ ${fmt(Math.max(0, trip.finances?.available || 0))}`, color: B.gray400 },
  ];

  let finY = y + 7;
  finData.forEach(({ label, value, color }) => {
    setC(B.gray400, false);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, finY);
    setC(color, false);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pw - 18, finY, { align: 'right' });
    finY += 6.5;
  });

  // Progress bar
  const barY = y + boxH + 3;
  const barW = pw - 28;
  const total = trip.finances?.total || trip.budget || 1;
  const confirmedPct = Math.min(100, (trip.finances?.confirmed || 0) / total * 100);
  const plannedPct = Math.min(100 - confirmedPct, (trip.finances?.planned || 0) / total * 100);

  drawRect(14, barY, barW, 2.5, B.surface);
  if (confirmedPct > 0) drawRect(14, barY, barW * confirmedPct / 100, 2.5, B.emerald);
  if (plannedPct > 0) drawRect(14 + barW * confirmedPct / 100, barY, barW * plannedPct / 100, 2.5, B.gold);

  y = barY + 10;

  // Voo & Hospedagem
  checkPage(30);
  drawRect(14, y, pw - 28, 0.3, B.surface);
  y += 8;
  setC(B.emerald, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VOO & HOSPEDAGEM', 14, y);
  y += 7;

  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || trip.destination;
  const flightStatus = trip.flights?.outbound?.status === 'confirmed' ? 'Confirmado' : 'Planejado';
  const flightPrice = (trip.flights?.outbound?.price || 0) + (trip.flights?.return?.price || 0);

  drawStatusDot(16, y - 1, flightStatus === 'Confirmado' ? B.emerald : B.gold);
  setC(B.white, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`VOO: ${originCode} > ${destCode} > ${originCode}`, 20, y);
  y += 5;
  setC(B.gray400, false);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${flightStatus}  |  R$ ${fmt(flightPrice)}`, 20, y);
  y += 7;

  if (trip.accommodation) {
    const hotelStatus = trip.accommodation.status === 'confirmed' ? 'Confirmado' : 'Planejado';
    const hotelNeighborhood = trip.accommodation?.neighborhood || '';
    const hotelDescription = trip.accommodation?.description || '';
    const hotelStars = trip.accommodation.stars || 3;

    drawStatusDot(16, y - 1, hotelStatus === 'Confirmado' ? B.emerald : B.gold);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const displayName = trip.accommodation.name || `Hotel em ${trip.destination}`;
    doc.text(displayName, 20, y);
    y += 5;

    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    const starsStr = Array(hotelStars).fill('*').join('');
    doc.text(`${starsStr}  |  ${trip.accommodation.totalNights} noites  |  Faixa ${tierLabel}  |  R$ ${fmt(trip.accommodation.nightlyRate)}/noite`, 20, y);
    y += 5;
    doc.text(`Status: ${hotelStatus}  |  Total: R$ ${fmt(trip.accommodation.totalPrice)}`, 20, y);
    y += 5;

   if (hotelDescription) {
      setC(B.gray500, false);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      const descLines = doc.splitTextToSize(hotelDescription, pw - 40);
      doc.text(descLines, 20, y);
      y += descLines.length * 3.2 + 2;
    }

    // Google Maps link for hotel
    if (hotelNeighborhood || trip.accommodation.name) {
      const mapsQuery = encodeURIComponent((trip.accommodation.name || '') + ', ' + trip.destination);
      const mapsLink = `https://www.google.com/maps/search/${mapsQuery}`;
      setC(B.emerald, false);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.textWithLink('> Ver no Google Maps', 20, y, { url: mapsLink });
      y += 5;
    }
  }

  addFooter();

  // ════════════════════════════════════════
  // PAGE 3+ — ROTEIRO DIA A DIA
  // ════════════════════════════════════════
  doc.addPage();
  drawRect(0, 0, pw, ph, B.night); // Navy background
  addPageHeader();

  setC(B.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ROTEIRO DIA A DIA', 14, y);
  y += 8;

  (trip.days || []).forEach((day) => {
    checkPage(22);

    drawRect(14, y - 4, pw - 28, 0.3, B.surface);
    y += 2;

    const cleanTitle = cleanText(day.title || '');

    setC(B.white, false);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DIA ${day.day}  —  ${cleanTitle}`, 14, y);

    if (trip.startDate) {
      const dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + day.day - 1);
      setC(B.gray500, false);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(format(dayDate, "dd MMM yyyy", { locale: ptBR }), pw - 14, y, { align: 'right' });
    }

    drawRect(14, y + 2, 40, 0.4, B.emerald);
    y += 6;

    const narrative = getDayNarrative(trip.destination, day.title || '');
    if (narrative) {
      checkPage(12);
      setC(B.gray400, false);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const narrativeLines = doc.splitTextToSize(narrative, pw - 32);
      doc.text(narrativeLines, 16, y);
      y += narrativeLines.length * 3.8 + 3;
    }

    (day.activities || []).forEach((act) => {
      checkPage(7);
      const isLogistics = act.category === 'voo' ||
        (act.category === 'hotel' && (act.name?.toLowerCase().includes('check-in') || act.name?.toLowerCase().includes('check-out'))) ||
        act.name?.toLowerCase().includes('transfer');

      setC(isLogistics ? B.gray500 : B.white, false);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', isLogistics ? 'italic' : 'normal');
      const timeStr = act.time || '     ';
      doc.text(timeStr, 16, y);

      const actName = cleanText(act.name || '');
      doc.text(actName, 30, y);

      const priceStr = act.cost > 0 ? `R$ ${fmt(act.cost)}` : '';
      if (priceStr) {
        if (act.status === 'confirmed') {
          drawStatusDot(pw - 16 - doc.getTextWidth(priceStr) - 4, y - 0.5, B.emerald);
        }
        setC(act.status === 'confirmed' ? B.emerald : B.gray400, false);
        doc.setFont('helvetica', 'bold');
        doc.text(priceStr, pw - 16, y, { align: 'right' });

        const nameWidth = doc.getTextWidth(actName) + 32;
        const priceWidth = doc.getTextWidth(priceStr) + 6;
        const dotStart = nameWidth;
        const dotEnd = pw - 16 - priceWidth;
        if (dotEnd > dotStart + 4) {
          doc.setLineDashPattern([0.5, 1.5], 0);
          doc.setDrawColor(B.surface[0], B.surface[1], B.surface[2]);
          doc.setLineWidth(0.2);
          doc.line(dotStart, y - 0.5, dotEnd, y - 0.5);
          doc.setLineDashPattern([], 0);
        }
      }

      setC(B.white, false);
      doc.setFont('helvetica', 'normal');
      y += 5;

      // Activity description line
      if (act.description && act.description !== act.name && !isLogistics && act.description.length > 5) {
        checkPage(4);
        setC(B.gray500, false);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'italic');
        const descText = act.description.length > 80 ? act.description.substring(0, 77) + '...' : act.description;
        doc.text(descText, 30, y);
        y += 3.5;
      }
    });

    y += 4;
  });

  // ════════════════════════════════════════
  // GASTRONOMIA MICHELIN
  // ════════════════════════════════════════
  const michelinList = getTopMichelinForCity(trip.destination, 5);
  if (michelinList && michelinList.length > 0) {
    checkPage(40);
    drawRect(14, y, pw - 28, 0.3, B.surface);
    y += 8;

    setC(B.emerald, false);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('GASTRONOMIA MICHELIN', 14, y);
    y += 4;

    setC(B.gray400, false);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Restaurantes com estrela Michelin proximos ao seu roteiro', 14, y);
    y += 7;

    michelinList.forEach((r) => {
      checkPage(10);
      const starsStr = Array(r.stars).fill('*').join('');

      setC(B.white, false);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanText(r.name), 20, y);

      setC(B.gold, false);
      doc.setFontSize(7);
      doc.text(starsStr, 20 + doc.getTextWidth(cleanText(r.name)) + 3, y);

      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const details = `${r.cuisine}  |  ${r.priceRange}${r.neighborhood ? '  |  ' + r.neighborhood : ''}`;
      doc.text(details, 20, y + 3.5);

      y += 10;
    });

    y += 3;
  }

  // ════════════════════════════════════════
  // CHECKLIST
  // ════════════════════════════════════════
  checkPage(24);
  drawRect(14, y - 2, pw - 28, 0.3, B.surface);
  y += 8;

  setC(B.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE PREPARACAO', 14, y);
  y += 8;

  const categories = ['documentos', 'reservas', 'packing', 'pre-viagem'];
  const categoryLabels: Record<string, string> = {
    documentos: 'Documentos',
    reservas: 'Reservas',
    packing: 'Packing',
    'pre-viagem': 'Pre-Viagem',
  };

  categories.forEach((cat) => {
    const items = (trip.checklist || []).filter(i => i.category === cat);
    if (items.length === 0) return;

    checkPage(10);
    setC(B.white, false);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(categoryLabels[cat] || cat, 16, y);
    y += 5;

    items.forEach((item) => {
      checkPage(6);
      const box = item.checked ? '[x]' : '[ ]';
      setC(item.checked ? B.emerald : B.gray400, false);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${box}  ${cleanText(item.label)}`, 20, y);
      y += 5;
    });

    y += 3;
  });

  // ════════════════════════════════════════
  // INFORMACOES UTEIS + DICAS + FRASES + EMERGENCIA
  // ════════════════════════════════════════
  const destInfo = getDestInfo(trip.destination);
  if (destInfo) {
    checkPage(40);
    drawRect(14, y - 2, pw - 28, 0.3, B.surface);
    y += 8;

    setC(B.emerald, false);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACOES UTEIS', 14, y);
    y += 8;

    const infoItems = [
      { label: 'Fuso horario', value: destInfo.timezone },
      { label: 'Voltagem / Tomada', value: destInfo.voltage },
      { label: 'Idioma', value: destInfo.language },
      { label: 'Moeda', value: destInfo.currency },
      { label: 'Visto (brasileiros)', value: destInfo.visa },
    ];

    infoItems.forEach(({ label, value }) => {
      checkPage(7);
      setC(B.gray400, false);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 16, y);
      setC(B.white, false);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 55, y);
      y += 6;
    });
  }

  // ── Dicas locais, agua, gorjeta ──
  const tips = getDestTips(trip.destination);
  if (tips) {
    y += 4;

    // Dica local
    checkPage(10);
    setC(B.white, false);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Dica local:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    const tipLines = doc.splitTextToSize(tips.tips, pw - 50);
    doc.text(tipLines, 38, y);
    y += tipLines.length * 3.5 + 3;

    // Agua
    checkPage(6);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text('Agua:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    doc.text(tips.water, 38, y);
    y += 5;

    // Gorjeta
    checkPage(6);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text('Gorjeta:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    const tipTipLines = doc.splitTextToSize(tips.tipping, pw - 50);
    doc.text(tipTipLines, 38, y);
    y += tipTipLines.length * 3.5 + 3;

    // Frases uteis
    if (tips.phrases && tips.phrases.length > 0) {
      checkPage(18);
      y += 3;
      drawRect(14, y - 2, pw - 28, 0.3, B.surface);
      y += 6;
      setC(B.emerald, false);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FRASES UTEIS', 14, y);
      y += 6;

      tips.phrases.forEach(phrase => {
        checkPage(5);
        setC(B.white, false);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${phrase}`, 16, y);
        y += 4.5;
      });
      y += 2;
    }

    // Embaixada / Emergencia
    if (tips.embassy) {
      checkPage(18);
      drawRect(14, y, pw - 28, 0.3, B.surface);
      y += 6;
      setC(B.emerald, false);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EMERGENCIA', 14, y);
      y += 6;

      setC(B.white, false);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Consulado/Embaixada do Brasil:', 16, y);
      y += 4;
      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      const embLines = doc.splitTextToSize(tips.embassy, pw - 36);
      doc.text(embLines, 16, y);
      y += embLines.length * 3.5 + 4;

      setC(B.white, false);
      doc.setFont('helvetica', 'bold');
      doc.text('Emergencia geral (Europa): 112  |  Global: ligue operadora local', 16, y);
      y += 4;
      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      doc.text('Seguro viagem: ligue para a central do cartao ou seguradora ANTES do atendimento', 16, y);
      y += 5;
    }
  }

  // ════════════════════════════════════════
  // FINAL FOOTER
  // ════════════════════════════════════════
  y += 8;
  checkPage(20);
  drawRect(14, y, pw - 28, 0.3, B.emerald);
  y += 6;
  setC(B.gray500, false);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Este roteiro foi criado com inteligencia artificial e deve ser validado antes da viagem.', 14, y);

  addFooter();

  // ── Save ──
  const safeDest = trip.destination.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : 'viagem';
  doc.save(`KINU_${safeDest}_${dateStr}.pdf`);
}
