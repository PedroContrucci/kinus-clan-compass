// tripPdfExport — Premium PDF with KINU branding + destination photos
// CRITICAL: NO emoji in PDF text — jsPDF Helvetica does not support Unicode emoji

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { SavedTrip } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getExpandedCityData } from '@/data/destinationPdfData';

import { findCityInfo } from '@/data/destinationCatalog';
import { catalogVerifiedLabel } from '@/lib/catalogVerified';
import { seasonalRows, dayAlert } from '@/lib/seasonal';
import { pdfSafe, cuisinePt, localizeCuisineTip, plural, stopsLabel, baggageLabel, packingClimate, monthOf } from '@/lib/pdfText';
import { getFlightPlannedTotal } from '@/lib/flightFinance';
import { getDocsForDestination } from '@/data/destinationDocs';
import { tripTimezone, formatTzDiff, formatTzInfo, airportCity } from '@/lib/timezone';
import { formatDurationHM, durationTextToMinutes } from '@/lib/flightModel';
import { tripReferenceStamp } from '@/lib/aviasalesLink';
import { paxOf, paxLabel } from '@/lib/pax';
import { logisticsLine, itemCoord, michelinForTier } from '@/lib/itineraryEngine';
import { razaoLines, razaoTotals } from '@/lib/razaoLines';

// ── Branding colors (RGB) ──
const B = {
  night:    [15, 23, 42] as const,
  deep:     [30, 41, 59] as const,
  surface:  [51, 65, 85] as const,
  emerald:  [16, 185, 129] as const,
  emeraldL: [110, 231, 183] as const,
  horizon:  [14, 165, 233] as const,
  gold:     [234, 179, 8] as const,
  red:      [239, 68, 68] as const,
  amber:    [245, 158, 11] as const,
  white:    [248, 250, 252] as const,
  gray400:  [148, 163, 184] as const,
  gray500:  [100, 116, 139] as const,
};

// ── Destination cover photos (Unsplash direct links) ──
const DESTINATION_COVER_PHOTOS: Record<string, string[]> = {
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
  ],
  'roma': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1200&q=80',
  ],
  'londres': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
    'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1200&q=80',
  ],
  'bangkok': [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=80',
  ],
  'toquio': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80',
  ],
  'dubai': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
    'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80',
  ],
  'nova york': [
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
  ],
  'lisboa': [
    'https://images.unsplash.com/photo-1558383817-e83c8a641067?w=1200&q=80',
    'https://images.unsplash.com/photo-1548707309-dcebeab426c8?w=1200&q=80',
  ],
  'barcelona': [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80',
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=80',
  ],
  'buenos aires': [
    'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=80',
    'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&q=80',
  ],
  'amsterdam': [
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
    'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=1200&q=80',
  ],
  'cairo': [
    'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&q=80',
    'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
  ],
  'phuket': [
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=80',
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1200&q=80',
  ],
  'bali': [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=80',
  ],
  'cancun': [
    'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200&q=80',
    'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=1200&q=80',
  ],
  'miami': [
    'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200&q=80',
    'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1200&q=80',
  ],
  'singapura': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
    'https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=1200&q=80',
  ],
  'milao': [
    'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=1200&q=80',
    'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=1200&q=80',
  ],
};

// ── Destination descriptions (acentos ok: helvetica/WinAnsi codifica Latin-1; M8b) ──
const DESTINATION_DESCRIPTIONS: Record<string, string> = {
  'cairo': 'Cairo, capital do Egito, é uma das cidades mais antigas e fascinantes do mundo. Com mais de 20 milhões de habitantes, a cidade é o coração cultural do Oriente Médio. As lendárias Pirâmides de Giza, o Museu Egípcio e o vibrante bazar Khan el-Khalili são imperdíveis. A culinária local vai do koshari nas ruas até sofisticados restaurantes a beira do Nilo.',
  'paris': 'Paris, a Cidade Luz, é sinônimo de arte, gastronomia e romance. Dos cafés de Montmartre a grandiosidade do Louvre, cada bairro conta uma história. A Torre Eiffel, os Champs-Elysees e Notre-Dame são apenas o começo de uma cidade que abriga alguns dos melhores restaurantes e museus do mundo.',
  'roma': 'Roma, a Cidade Eterna, oferece uma jornada através de 2.800 anos de história. Do Coliseu ao Vaticano, da Fontana di Trevi ao Pantheon, cada esquina revela uma obra-prima. A culinária romana — carbonara, cacio e pepe, suppli — é tão icônica quanto seus monumentos.',
  'toquio': 'Tóquio é onde o futuro encontra a tradição. Templos milenares convivem com arranha-céus futuristas. De Shibuya a Asakusa, Akihabara a Harajuku, cada bairro é um mundo próprio. A culinária japonesa — do sushi ao ramen — eleva qualquer refeição a uma experiência memorável.',
  'tokyo': 'Tokyo is where the future meets tradition. Centuries-old temples stand beside futuristic skyscrapers. From Shibuya to Asakusa, Akihabara to Harajuku, each neighborhood offers a uniquely Japanese blend of innovation and culture.',
  'londres': 'Londres é uma metrópole global que combina história régia com vanguarda cultural. Do Palácio de Buckingham ao Tate Modern, do Borough Market aos pubs centenários, a cidade oferece experiências para todos os gostos e orçamentos em qualquer estação do ano.',
  'nova york': 'Nova York, a cidade que nunca dorme, é o epicentro cultural do mundo ocidental. Manhattan, Brooklyn, Queens — cada borough tem sua personalidade. De Broadway a Central Park, do MET ao Chelsea Market, a energia desta cidade e verdadeiramente inigualável.',
  'barcelona': 'Barcelona combina praia, arquitetura e gastronomia como poucas cidades no mundo. As obras de Gaudí — Sagrada Família, Park Güell, Casa Batllo — definem a paisagem urbana. Las Ramblas, o Bairro Gótico e o Mercado de La Boqueria completam uma experiência incomparável.',
  'buenos aires': 'Buenos Aires, o Paris da America do Sul, pulsa com tango, churrasco e cultura. De San Telmo a Palermo, a cidade combina elegância europeia com energia latina. Os cafés históricos, as casas de tango e a cena gastronômica fazem desta cidade um destino inesquecível.',
  'bangkok': 'Bangkok é um festival sensorial: templos dourados, mercados flutuantes, street food lendária é uma vida noturna vibrante. Do Grande Palácio ao Wat Pho, de Chinatown a Sukhumvit, a capital tailandesa surpreende a cada esquina com sabores e cores únicas.',
  'dubai': 'Dubai é onde o impossível se torna realidade. O Burj Khalifa, o Dubai Mall, as ilhas artificiais — tudo e superlativo. Mas além do luxo, há o Dubai histórico: o Creek, os souks de ouro e especiarias, e a calorosa hospitalidade árabe.',
  'lisboa': 'Lisboa é uma das capitais mais charmosas da Europa. Os bondes históricos sobem as colinas entre miradouros com vistas deslumbrantes. O pastéis de nata, o fado nos bares de Alfama e os azulejos nas fachadas criam uma atmosfera única que mistura nostalgia e modernidade.',
  'amsterdam': 'Amsterdam encanta com seus canais, bicicletas e museus de classe mundial. O Rijksmuseum, o Museu Van Gogh e a Casa de Anne Frank estão a uma pedalada de distância. A cidade e conhecida por sua tolerância, vida noturna animada e mercados flutuantes coloridos.',
  'phuket': 'Phuket, a maior ilha da Tailândia, é um paraíso tropical que combina praias de areia branca, templos budistas e uma vibrante cultura local. De Patong Beach ao centro histórico de Old Phuket Town, a ilha oferece desde aventuras aquáticas até experiências gastronômicas autênticas.',
  'milao': 'Milão é a capital da moda e do design, mas também guarda tesouros culturais impressionantes. O Duomo, a maior catedral gótica da Itália, domina a paisagem. La Scala e referência mundial em opera. Os canais de Navigli, a Pinacoteca di Brera e a efervescente cena gastronômica fazem de Milão muito mais do que um destino de compras.',
};

// ── Day narratives by destination + theme ──
const DESTINATION_DAY_NARRATIVES: Record<string, Record<string, string>> = {
  'bangkok': {
    'Embarque': 'Saída de Guarulhos rumo à capital tailandesa. O voo para Bangkok dura em media 20 horas com conexão.',
    'Chegada': 'Bem-vindo a Bangkok! A cidade recebe você com seu calor tropical e energia contagiante. Após o transfer ao hotel, um passeio leve pelo bairro revela as primeiras impressões: templos dourados, vendedores de rua e o aroma inconfundível da culinária thai.',
    'Cultura': 'Dia dedicado à riqueza cultural de Bangkok. O Grand Palace e o Wat Phra Kaew são obrigatórios — o Buda de Esmeralda é a imagem mais sagrada da Tailândia, esculpida no século XV. O Wat Pho abriga o impressionante Buda Reclinado de 46 metros.',
    'Gastronomia': 'Bangkok é unânime entre chefs do mundo como a capital mundial do street food. Do pad thai na Rua Yaowarat ao som tam nos mercados de Chatuchak, cada refeição é uma experiência. Prove o mango sticky rice — a sobremesa mais icônica da Tailândia.',
    'Passeios': 'Explore os canais de Thonburi, o lado menos turístico de Bangkok que preserva o charme da "Veneza do Oriente". Os mercados flutuantes de Damnoen Saduak oferecem uma janela para o modo de vida tradicional thailandes.',
    'Descobertas': 'Descubra o lado contemporâneo de Bangkok: galerias de arte em Charoen Krung, rooftop bars em Silom, é o vibrante bairro de Ari com seus cafés artesanais.',
    'Aventura': 'Explore os arredores de Bangkok — um day trip ao mercado ferroviario de Maeklong ou ao parque histórico de Ayutthaya (patrimônio UNESCO) revela outra dimensão da Tailândia.',
    'Retorno': 'Último café da manhã em Bangkok. Aproveite para compras de última hora no MBK Center ou Chatuchak Weekend Market antes do transfer ao aeroporto.',
  },
  'phuket': {
    'Embarque': 'Saída rumo ao paraíso tailandês. O voo para Phuket dura em media 22 horas com conexão, geralmente via Bangkok ou Singapura.',
    'Chegada': 'Bem-vindo a Phuket! A maior ilha da Tailândia recebe você com praias de areia branca e água cristalina. O centro histórico de Old Phuket Town, com arquitetura sino-portuguesa, é uma surpresa charmosa.',
    'Cultura': 'Phuket guarda mais história do que aparenta. O templo Wat Chalong, o mais importante da ilha, e o Big Buddha de 45 metros no topo da colina Nakkerd oferecem uma perspectiva contemplativa além das praias.',
    'Gastronomia': 'A culinária de Phuket tem identidade própria — o mee hokkien (macarrão frito), o oh tao (ostra frita) e o kanom jeen (curry com noodles) são especialidades locais. O Night Market de Chillva e imperdível.',
    'Passeios': 'As praias de Phuket são diversas: Patong para agitação, Kata para famílias, Freedom Beach para isolamento. O mirante de Promthep Cape ao por do sol é uma das vistas mais bonitas da Tailândia.',
    'Descobertas': 'Explore Old Phuket Town — grafites coloridos, cafés artesanais e galerias escondidas nas ruas Thalang e Soi Romanee. Aos domingos, a Walking Street Market ganha vida com comida e artesanato.',
    'Aventura': 'Um dia nas ilhas Phi Phi é obrigatório — Maya Bay (cenário do filme "A Praia"), snorkeling em Bamboo Island e almoço em Phi Phi Don. Outra opção imperdível: a baía de Phang Nga com seus monólitos calcários.',
    'Retorno': 'Último mergulho antes de partir! Aproveite o café da manhã com vista para o mar e faça compras de última hora no Jungceylon Mall.',
  },
  'paris': {
    'Embarque': 'Saída rumo à Cidade Luz. O voo para Paris dura em media 11 horas direto de Guarulhos.',
    'Chegada': 'Bienvenue a Paris! Mesmo a primeira caminhada pelo bairro do hotel revela a elegância parisiense — as boulangeries, os cafés nas calçadas e a arquitetura haussmanniana.',
    'Cultura': 'O Louvre merece um dia inteiro, mas se o tempo e curto, foque na ala Denon (Mona Lisa, Venus de Milo). Pela tarde, o Museu dOrsay abriga a maior coleção impressionista do mundo.',
    'Gastronomia': 'Paris é a capital mundial da gastronomia. Dos bistrots clássicos de Saint-Germain aos mercados de rua do Marais, cada refeição é uma celebração.',
    'Passeios': 'Montmartre é o coração boêmio de Paris. Suba até a Basílica de Sacré-Coeur para a melhor vista da cidade. Um cruzeiro pelo Sena ao por do sol revela Paris de um angulo inesquecível.',
    'Descobertas': 'Paris fora do óbvio: a Sainte-Chapelle tem os vitrais mais impressionantes da Europa (sec. XIII). O Canal Saint-Martin é o bairro preferido dos parisienses — bistrots e boutiques longe dos turistas. O rooftop das Galeries Lafayette oferece vista gratuita de 360 graus.',
    'Aventura': 'Versalhes merece um dia inteiro. O Palácio de Luis XIV tem 2.300 salas, mas o jardim de 800 hectares é onde a magia acontece. Alugue bicicleta para explorar o Grand e Petit Trianon — o refúgio privado de Maria Antonieta.',
    'Retorno': 'Dernier jour! Um café final nos Champs-Elysees antes de partir. Bon voyage!',
  },
  'roma': {
    'Embarque': 'Saída rumo à Cidade Eterna. O voo para Roma dura em media 12 horas com conexão.',
    'Chegada': 'Benvenuti a Roma! A cidade milenar revela sua história a cada esquina — ruínas romanas convivem com trattorias animadas.',
    'Cultura': 'O Coliseu, o Forum Romano e o Palatino formam o coração da Roma antiga. Construído em 80 d.C., o Coliseu podia receber 50 mil espectadores. O Vaticano, com a Capela Sistina de Michelangelo, é uma experiência transcendente.',
    'Gastronomia': 'A culinária romana é simples e genial. Carbonara, cacio e pepe, amatriciana — cada prato é uma aula de sabor com poucos ingredientes. Prove um suppli na rua.',
    'Passeios': 'Trastevere é o bairro mais charmoso de Roma — ruelas de paralelepípedos, fachadas cobertas de hera e cantinas onde os romanos de verdade jantam.',
    'Descobertas': 'A Galleria Borghese exige reserva antecipada mas é a coleção de arte mais preciosa de Roma — Bernini, Caravaggio, Raphael em uma villa renascentista. A Via Appia Antica oferece catacumbas e ruínas fora do circuito turístico.',
    'Aventura': 'Tivoli, a 30km de Roma, abriga duas joias UNESCO: a Villa dEste com suas 500 fontes renascentistas e a Villa Adriana, o retiro do imperador Adriano. O jardim da Villa dEste é o mais fotografado da Itália.',
    'Retorno': 'Último espresso italiano. Arrivederci, Roma!',
  },
  'toquio': {
    'Embarque': 'Saída rumo ao Japão. O voo para Tóquio dura em media 24 horas com conexão.',
    'Chegada': 'Yokoso! Tóquio impressiona desde o aeroporto — a organização, a limpeza e a gentileza japonesa são impactantes.',
    'Cultura': 'Asakusa é o coração tradicional de Tóquio. O templo Senso-ji, fundado em 645 d.C., é o mais antigo da cidade. O santuário Meiji em Harajuku oferece um oasis de paz.',
    'Gastronomia': 'Tóquio tem mais estrelas Michelin que qualquer cidade do mundo. Do sushi no Tsukiji ao ramen em Shinjuku, cada refeição é uma obra-prima.',
    'Passeios': 'Shibuya, Akihabara, Ginza — cada bairro é um universo. O cruzamento de Shibuya é o mais movimentado do mundo.',
    'Descobertas': 'TeamLab Borderless é arte digital imersiva que redefine museus — caminhe dentro das obras. Akihabara é o epicentro da cultura otaku. Ginza Six combina arte contemporânea com compras de luxo.',
    'Aventura': 'Kamakura, a 1h de trem, foi a capital do Japão medieval. O Grande Buda de bronze (13m, 1252 d.C.) e impressionante. A ilha de Enoshima oferece grutas, santuários e vista do Monte Fuji em dias claros.',
    'Retorno': 'Sayonara! Um último bento no aeroporto de Narita é a despedida perfeita.',
  },
  'londres': {
    'Embarque': 'Saída rumo ao Reino Unido. O voo para Londres dura em media 11 horas direto.',
    'Chegada': 'Welcome to London! A cidade combina história régia com vanguarda cultural. Dos black cabs aos pubs centenários, Londres tem uma energia única.',
    'Cultura': 'O British Museum é gratuito e abriga tesouros de toda a história humana. A Tower of London guarda as Joias da Coroa e 1.000 anos de história.',
    'Gastronomia': 'Borough Market é obrigatório — queijos artesanais, ostras frescas e o melhor fish and chips. Brick Lane oferece o melhor curry fora da Índia.',
    'Passeios': 'Um passeio pelo Thames Path revela Londres de outra perspectiva — do Big Ben ao Tate Modern, da St Pauls ao Shakespeare Globe.',
    'Descobertas': 'Notting Hill encanta com casas coloridas e o Portobello Road Market (sábados). Camden Town mistura punk, street food e mercados alternativos. O Sky Garden (gratuito com reserva) tem a melhor vista de Londres.',
    'Aventura': 'Stonehenge e Bath em um dia: o mistério neolítico de 5.000 anos seguido dos banhos romanos mais preservados do mundo. A cidade georgiana de Bath é um charme a parte.',
    'Retorno': 'Cheerio! Um último afternoon tea antes de partir.',
  },
  'dubai': {
    'Embarque': 'Saída rumo aos Emirados. O voo para Dubai dura em media 14 horas com conexão.',
    'Chegada': 'Ahlan wa sahlan! Dubai impressiona desde a chegada — o skyline futurista com o Burj Khalifa dominando o horizonte.',
    'Cultura': 'Além do luxo, Dubai guarda história no bairro Al Fahidi — casas tradicionais com torres de vento, o Creek e os souks de ouro e especiarias.',
    'Gastronomia': 'A culinária de Dubai é um mosaico do Oriente Médio — shawarma, falafel, machboos. Restaurantes como Al Mallah em Satwa oferecem comida autêntica.',
    'Passeios': 'O deserto é tão impressionante quanto a cidade. Um safari com jantar beduíno sob as estrelas é uma experiência transformadora.',
    'Descobertas': 'O bairro de Alserkal Avenue é o polo de arte contemporânea de Dubai — galerias, estudio de artistas e cafés criativos escondidos em armazéns industriais.',
    'Aventura': 'Safari no deserto com 4x4, sandboarding nas dunas e jantar beduíno sob as estrelas. O por do sol sobre as dunas e hipnotizante.',
    'Retorno': 'Ma al-salama! Últimas compras no Dubai Mall antes do voo.',
  },
  'milao': {
    'Embarque': 'Saída de Guarulhos rumo à capital da moda italiana. O voo para Milão (Malpensa) dura em media 12 horas com conexão.',
    'Chegada': 'Benvenuti a Milano! A cidade surpreende já na chegada — o design italiano está em cada detalhe, da arquitetura do aeroporto até o metrô elegante.',
    'Cultura': 'Dia dedicado a grandiosidade de Milão. O Duomo levou 6 séculos para ser construído — suba ao terraco para vistas de tirar o fôlego. A Pinacoteca di Brera abriga obras de Caravaggio e Raphael.',
    'Gastronomia': 'Milão tem uma cena gastronômica surpreendente. O risotto alla milanese (com açafrão), o ossobuco e a cotoletta são os clássicos. O Mercato Centrale é obrigatório.',
    'Passeios': 'A Galleria Vittorio Emanuele II é o shopping mais bonito do mundo — mosaicos no teto, lojas de luxo e o famoso touro da sorte no chao. O Castelo Sforzesco abriga a última escultura de Michelangelo.',
    'Descobertas': 'O bairro Isola é o novo polo criativo de Milão — Bosco Verticale, galerias independentes e restaurantes de autor. Navigli ao por do sol e imperdível para aperitivo.',
    'Aventura': 'O Lago di Como está a apenas 1h de trem. Bellagio, a pérola do lago, tem vilas históricas, jardins e vistas que parecem pintura.',
    'Retorno': 'Último espresso italiano! Aproveite para compras de última hora na Via Montenapoleone ou no Eataly Milano antes do transfer a Malpensa.',
  },
  'barcelona': {
    'Embarque': 'Saída rumo à capital catalã. O voo para Barcelona dura em media 12 horas com conexão.',
    'Chegada': 'Benvinguts a Barcelona! A cidade de Gaudí recebe você com sol, mar e uma energia contagiante.',
    'Cultura': 'A Sagrada Família é a obra-prima inacabada de Gaudí — 140 anos em construção. As fachadas contam a história de Cristo em pedra. A Casa Batllo e a Casa Mila completam o trio modernista.',
    'Gastronomia': 'La Boqueria é um dos mercados mais vibrantes do mundo — frutas exóticas, presunto ibérico, frutos do mar. As tapas no El Born são uma experiência social: bar em bar, prato a prato.',
    'Passeios': 'Park Güell e Gaudí em modo natureza — mosaicos ondulantes, colunas inclinadas e a melhor vista de Barcelona. Barceloneta ao por do sol é obrigatória.',
    'Descobertas': 'O Bunkers del Carmel é o segredo mais mal guardado de Barcelona — mirante 360 graus. O Palau de la Musica e art nouveau em estado puro.',
    'Aventura': 'Montserrat, a 1h de trem, é uma montanha sagrada com mosteiro beneditino e trilhas com vistas absurdas. O coral Escolania canta ao meio-dia.',
    'Retorno': 'Adeu Barcelona! Um último passeio pela Barceloneta antes de partir.',
  },
  'lisboa': {
    'Embarque': 'Saída rumo à capital portuguesa. O voo para Lisboa dura em media 10 horas direto.',
    'Chegada': 'Bem-vindo a Lisboa! A cidade das sete colinas recebe você com luz dourada, azulejos e o aroma de pastéis de nata.',
    'Cultura': 'O Mosteiro dos Jerónimos (1502) é obra-prima do estilo manuelino. A Torre de Belém guardava a entrada do Tejo. O Castelo de São Jorge oferece a melhor vista de Lisboa.',
    'Gastronomia': 'O Time Out Market (Mercado da Ribeira) reune os melhores chefs de Portugal sob um teto. O pastel de nata da fábrica original em Belém usa receita secreta de monges do sec. XVIII.',
    'Passeios': 'O Bonde 28 corta os bairros históricos — Alfama, Graça, Baixa. Os miradouros de Lisboa são o melhor programa gratuito da cidade.',
    'Descobertas': 'LX Factory é uma antiga fábrica convertida em polo criativo — livrarias, restaurantes, galerias. O Museu Nacional do Azulejo conta 5 séculos de história.',
    'Aventura': 'Sintra é magia pura: o Palácio da Pena, a Quinta da Regaleira (túneis secretos) é o Cabo da Roca — o ponto mais ocidental da Europa continental.',
    'Retorno': 'Até breve, Lisboa! Um último café no Chiado e pastéis de nata para levar.',
  },
  'nova york': {
    'Embarque': 'Saída rumo à Big Apple. O voo para Nova York dura em media 10 horas direto de GRU.',
    'Chegada': 'Welcome to New York! A energia é palpável desde o momento em que você sai do JFK. O skyline de Manhattan e hipnotizante.',
    'Cultura': 'O MET é um dos maiores museus do mundo — 2 milhões de obras. O MoMA abriga Starry Night de Van Gogh. Central Park é o pulmão verde de Manhattan.',
    'Gastronomia': 'NY é a capital culinária mais diversa do mundo — pizza artesanal no Village, pastrami no Katzs, dim sum em Chinatown.',
    'Passeios': 'O High Line transformou uma ferrovia abandonada em parque aéreo. Brooklyn Bridge a pe oferece vistas icônicas. DUMBO tem as melhores fotos de Manhattan.',
    'Descobertas': 'Top of the Rock supera o Empire State em vistas. SoHo e Greenwich Village são o coração criativo de NY. Little Italy e Chinatown ficam a metros uma da outra.',
    'Aventura': 'A Estátua da Liberdade e Ellis Island contam a história da imigração americana. Reserve ingresso para a coroa com antecedência.',
    'Retorno': 'See you later, NYC! Um último bagel e café no Upper West Side antes do JFK.',
  },
  'buenos aires': {
    'Embarque': 'Saída rumo à capital argentina. O voo para Buenos Aires dura apenas 3 horas direto.',
    'Chegada': 'Bienvenido a Buenos Aires! A energia portenha e contagiante desde a primeira empanada.',
    'Cultura': 'O Teatro Colon é um dos teatros de opera mais importantes do mundo. O MALBA abriga arte latino-americana contemporânea. O Cemitério da Recoleta é arte e história a céu aberto.',
    'Gastronomia': 'Buenos Aires é a capital do asado. Don Julio e La Cabrera são referências de parrilla. O alfajor e sobremesa obrigatória.',
    'Passeios': 'San Telmo aos domingos é uma festa — feira de antiguidades, tango na rua e parillas. La Boca (Caminito) e pura cor e energia.',
    'Descobertas': 'Palermo Soho é o bairro mais descolado — restaurantes de autor, bares craft, design argentino. Os murais de street art estao em cada esquina.',
    'Aventura': 'Tigre, a 1h de trem, é o delta do Parana com canais, ilhas e natureza. Passeio de barco e almoço a beira do rio.',
    'Retorno': 'Hasta luego, Buenos Aires! Último café com medialunas antes de partir.',
  },
  'amsterdam': {
    'Embarque': 'Saída rumo a Holanda. O voo para Amsterdam dura em media 12 horas com conexão.',
    'Chegada': 'Welkom in Amsterdam! A cidade dos canais e bicicletas recebe você com charme e liberdade.',
    'Cultura': 'O Rijksmuseum é o museu mais importante da Holanda — A Ronda Noturna de Rembrandt e monumental. O Museu Van Gogh e a Casa de Anne Frank completam o trio cultural.',
    'Gastronomia': 'O Albert Cuyp Market é o maior mercado de rua de Amsterdam. Stroopwafels frescos, arenque, bitterballen. O Foodhallen reune o melhor street food sob um teto.',
    'Passeios': 'Um passeio de barco pelos canais é a melhor forma de conhecer Amsterdam. Jordaan é o bairro mais charmoso — galerias, cafés acolhedores e flores.',
    'Descobertas': 'De Pijp é o bairro mais multicultural — Heineken Experience, restaurantes surinameses e indonésios. Vondelpark é o Central Park de Amsterdam.',
    'Aventura': 'Zaanse Schans (30min de trem) tem os clássicos moinhos holandeses, fábricas de queijo e tamancos. Edam é o paraíso do queijo holandês.',
    'Retorno': 'Tot ziens! Último pannenkoek e compras de queijo antes do voo.',
  },
  'cairo': {
    'Embarque': 'Saída rumo ao Egito. O voo para Cairo dura em media 14 horas com conexão.',
    'Chegada': 'Ahlan wa sahlan! O Cairo e caos e magia — buzinas, minaretes é as Pirâmides no horizonte.',
    'Cultura': 'As Pirâmides de Giza é a Esfinge são a única Maravilha do Mundo Antigo que sobreviveu. O Museu Egípcio abriga o tesouro de Tutankhamon.',
    'Gastronomia': 'O koshari é o prato nacional — arroz, lentilha, macarrão e molho de tomate. Prove o ful medames (fava) é o ta\'amiya (falafel egípcio).',
    'Passeios': 'Khan el-Khalili é o bazar mais antigo do Oriente Médio — especiarias, perfumes, artesanato. Pechinche sem medo!',
    'Descobertas': 'Zamalek, a ilha no Nilo, é o bairro mais cosmopolita — galerias, restaurantes e a vista do Cairo Tower.',
    'Aventura': 'Um passeio de felucca (barco a vela) pelo Nilo ao por do sol é uma experiência atemporal.',
    'Retorno': 'Ma al-salama! Últimas compras no Khan el-Khalili antes do aeroporto.',
  },
};

const GENERIC_DAY_NARRATIVES: Record<string, string> = {
  'Embarque': 'Dia de embarque! Confira documentos, pesos de bagagem e chegue ao aeroporto com antecedência.',
  'Chegada': 'Primeiro contato com o destino. Após o transfer ao hotel, um passeio leve pelo bairro é a melhor forma de sentir a energia local.',
  'Cultura': 'Dia dedicado a cultura local — museus, monumentos e sítios históricos que contam a história deste lugar fascinante.',
  'Gastronomia': 'Dia de explorar a culinária local. Mercados, restaurantes típicos e street food revelam a alma gastronômica do destino.',
  'Passeios': 'Dia de explorar o destino a pe ou de transporte local. Bairros históricos, parques e mirantes oferecem perspectivas únicas.',
  'Descobertas': 'Dia de descobertas — galerias, bairros alternativos e experiências fora do roteiro convencional.',
  'Aventura': 'Dia de aventura! Excursões aos arredores, trilhas ou experiências ao ar livre para quem quer explorar além da cidade.',
  'Retorno': 'Último dia. Aproveite para compras, um último passeio pelo bairro e prepare a bagagem para o voo de volta.',
};

// ── Destination practical info ──
const DESTINATION_INFO: Record<string, { timezone: string; voltage: string; language: string; currency: string; visa: string }> = {
  'bangkok': { timezone: 'UTC+7 (10h a frente do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Tailandês (inglês turístico)', currency: 'Baht Tailandês (THB)', visa: 'Isento para brasileiros até 90 dias' },
  'phuket': { timezone: 'UTC+7 (10h a frente do Brasil)', voltage: '220V - Tomada tipo A/B/C', language: 'Tailandês (inglês turístico)', currency: 'Baht Tailandês (THB)', visa: 'Isento para brasileiros até 90 dias' },
  'paris': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/E', language: 'Francês', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'roma': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'toquio': { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '100V - Tomada tipo A/B', language: 'Japonês', currency: 'Iene Japonês (JPY)', visa: 'Isento para brasileiros até 90 dias' },
  'londres': { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Inglês', currency: 'Libra Esterlina (GBP)', visa: 'Necessário ETA (autorização eletrônica)' },
  'dubai': { timezone: 'UTC+4 (7h a frente do Brasil)', voltage: '220V - Tomada tipo G', language: 'Árabe (inglês universal)', currency: 'Dirham (AED)', visa: 'Isento para brasileiros até 90 dias' },
  'buenos aires': { timezone: 'UTC-3 (mesmo fuso do Brasil)', voltage: '220V - Tomada tipo C/I', language: 'Espanhol', currency: 'Peso Argentino (ARS)', visa: 'Isento para brasileiros - apenas RG' },
  'lisboa': { timezone: 'UTC+0 (3h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Português', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'nova york': { timezone: 'UTC-5 (2h atrás do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Inglês', currency: 'Dólar Americano (USD)', visa: 'Necessário visto B1/B2' },
  'barcelona': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Espanhol/Catalão', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'amsterdam': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Holandês (inglês universal)', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'cairo': { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Árabe', currency: 'Libra Egípcia (EGP)', visa: 'Visto na chegada (USD 25)' },
  'milao': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F/L', language: 'Italiano', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'bali': { timezone: 'UTC+8 (11h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Indonésio (inglês turístico)', currency: 'Rupia Indonesa (IDR)', visa: 'Isento para brasileiros até 30 dias' },
  'cancun': { timezone: 'UTC-5 (2h atrás do Brasil)', voltage: '127V - Tomada tipo A/B', language: 'Espanhol', currency: 'Peso Mexicano (MXN)', visa: 'Isento para brasileiros com visto EUA válido ou autorização eletrônica' },
  'miami': { timezone: 'UTC-5 (2h atrás do Brasil)', voltage: '120V - Tomada tipo A/B', language: 'Inglês/Espanhol', currency: 'Dólar Americano (USD)', visa: 'Necessário visto B1/B2' },
  'singapura': { timezone: 'UTC+8 (11h a frente do Brasil)', voltage: '230V - Tomada tipo G', language: 'Inglês/Mandarim/Malaio/Tamil', currency: 'Dólar de Singapura (SGD)', visa: 'Isento para brasileiros até 30 dias' },
  'seul': { timezone: 'UTC+9 (12h a frente do Brasil)', voltage: '220V - Tomada tipo C/F', language: 'Coreano', currency: 'Won Sul-Coreano (KRW)', visa: 'Isento para brasileiros até 90 dias' },
  'berlim': { timezone: 'UTC+1 (4h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Alemão', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
  'marrakech': { timezone: 'UTC+1', voltage: '220V - Tomada tipo C/E', language: 'Árabe/Francês', currency: 'Dirham Marroquino (MAD)', visa: 'Isento para brasileiros até 90 dias' },
  'santorini': { timezone: 'UTC+2 (5h a frente do Brasil)', voltage: '230V - Tomada tipo C/F', language: 'Grego', currency: 'Euro (EUR)', visa: 'Isento para brasileiros até 90 dias (Schengen)' },
};

// ── Destination tips (phrases, embassy, tipping, water) ──
const DESTINATION_TIPS: Record<string, { tips: string; water: string; tipping: string; phrases: string[]; embassy: string }> = {
  'paris': {
    tips: 'Sempre cumprimente com "Bonjour" ao entrar em lojas. Metrô é o transporte mais eficiente.',
    water: 'Segura da torneira',
    tipping: 'Service compris (gorjeta inclusa). Arredondar a conta e gentileza.',
    phrases: ['Bonjour (Olá)', 'Merci (Obrigado)', "S'il vous plaît (Por favor)", 'Combien? (Quanto?)', 'Parlez-vous anglais? (Fala inglês?)', 'Au revoir (Adeus)'],
    embassy: 'Embaixada do Brasil: +33 1 45 61 63 00 | 34 Cours Albert 1er, 75008',
  },
  'roma': {
    tips: 'Cuidado com golpes perto do Coliseu. Fontes nasoni tem água potável grátis pela cidade.',
    water: 'Segura da torneira (e das fontes)',
    tipping: 'Coperto (taxa de serviço) já incluso. Gorjeta extra não e esperada.',
    phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Per favore (Por favor)', 'Quanto costa? (Quanto custa?)', 'Il conto (A conta)', 'Scusi (Com licença)'],
    embassy: 'Embaixada do Brasil: +39 06 6835 7800 | Piazza Navona 14',
  },
  'milao': {
    tips: 'Reserve a Última Ceia de Da Vinci com meses de antecedência. Metrô linha M1 (vermelha) conecta tudo.',
    water: 'Segura da torneira',
    tipping: 'Não obrigatória. Coperto incluso na conta.',
    phrases: ['Buongiorno (Bom dia)', 'Grazie (Obrigado)', 'Quanto costa? (Quanto custa?)', 'Il conto (A conta)', 'Dove...? (Onde fica...?)', 'Scusi (Com licença)'],
    embassy: 'Consulado do Brasil em Milão: +39 02 7602 5524 | Corso Europa 12',
  },
  'londres': {
    tips: 'Oyster Card ou contactless no transporte. Museus nacionais são gratuitos.',
    water: 'Segura da torneira',
    tipping: '10-12.5% em restaurantes (verifique se service charge já esta incluso).',
    phrases: ['Cheers (Obrigado/Saúde)', 'Excuse me (Com licença)', 'Could I have the bill? (A conta?)', 'Mind the gap (Cuidado com o vão)'],
    embassy: 'Embaixada do Brasil: +44 20 7399 9000 | 14-16 Cockspur Street, SW1',
  },
  'toquio': {
    tips: 'Compre Suica/Pasmo card para transporte. Sapatos saem antes de entrar em casas e templos.',
    water: 'Segura da torneira',
    tipping: 'NUNCA de gorjeta — e considerado ofensivo no Japão.',
    phrases: ['Konnichiwa (Olá)', 'Arigatou gozaimasu (Muito obrigado)', 'Sumimasen (Com licença)', 'Ikura desu ka? (Quanto custa?)', 'Oishii! (Delicioso!)'],
    embassy: 'Embaixada do Brasil: +81 3 5488 5531 | 2-11-12 Kita-Aoyama, Minato-ku',
  },
  'barcelona': {
    tips: 'Cuidado com batedores de carteira em Las Ramblas e metrô. Jantar só começa as 21h.',
    water: 'Segura mas com gosto. Muitos preferem engarrafada.',
    tipping: 'Arredondar a conta. 5-10% em restaurantes finos.',
    phrases: ['Hola (Olá)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto cuesta? (Quanto custa?)', 'Perdon (Com licença)'],
    embassy: 'Consulado do Brasil: +34 93 488 2288 | Av. Diagonal 468',
  },
  'lisboa': {
    tips: 'Use calçados confortáveis — Lisboa é feita de ladeiras. Bonde 28 lota rápido, va cedo.',
    water: 'Segura da torneira',
    tipping: '5-10% em restaurantes. Não obrigatória.',
    phrases: ['Olá (Olá)', 'Obrigado/a', 'Por favor', 'A conta (A conta)', 'Quanto custa? (Quanto custa?)'],
    embassy: 'Embaixada do Brasil: +351 21 724 8510 | Estrada das Laranjeiras 144',
  },
  'amsterdam': {
    tips: 'Bike e rei. Cuidado ao cruzar ciclovias. OV-chipkaart para transporte.',
    water: 'Segura da torneira',
    tipping: 'Arredondar a conta. 5-10% em restaurantes.',
    phrases: ['Hallo (Olá)', 'Dank je wel (Obrigado)', 'Alsjeblieft (Por favor)', 'Hoeveel? (Quanto?)', 'Spreekt u Engels? (Fala inglês?)'],
    embassy: 'Embaixada do Brasil: +31 70 302 3959 | Mauritskade 19, Haia',
  },
  'bangkok': {
    tips: 'Wai (curvatura com mãos juntas) e o cumprimento local. Nunca toque a cabeça de alguem.',
    water: 'NÃO beba da torneira. Use engarrafada.',
    tipping: 'Não obrigatória. 20-50 baht em restaurantes e gentileza.',
    phrases: ['Sawadee krap/ka (Olá)', 'Khop khun krap/ka (Obrigado)', 'Tao rai? (Quanto?)', 'Aroy! (Delicioso!)', 'Mai phet (Sem pimenta)'],
    embassy: 'Embaixada do Brasil: +66 2 285 6081 | Sathorn 34, Sathorn Road',
  },
  'phuket': {
    tips: 'Negocie preço de longtail boats. Cuidado com golpes de tuk-tuk. Protetor solar é obrigatório.',
    water: 'NÃO beba da torneira. Use engarrafada.',
    tipping: 'Não obrigatória. 20-50 baht em restaurantes.',
    phrases: ['Sawadee krap/ka (Olá)', 'Khop khun krap/ka (Obrigado)', 'Tao rai? (Quanto?)', 'Aroy! (Delicioso!)'],
    embassy: 'Embaixada do Brasil em Bangkok: +66 2 285 6081',
  },
  'dubai': {
    tips: 'Vestimenta modesta fora dos resorts. Álcool só em bares de hotel licenciados.',
    water: 'Dessalinizada, segura mas com sabor. Engarrafada recomendada.',
    tipping: '10-15% em restaurantes (verifique se service charge já esta).',
    phrases: ['As-salamu alaykum (Paz)', 'Shukran (Obrigado)', 'Bikam? (Quanto?)', 'Yalla! (Vamos!)', 'Inshallah (Se Deus quiser)'],
    embassy: 'Embaixada do Brasil: +971 2 632 6600 | Abu Dhabi (cobre Dubai)',
  },
  'nova york': {
    tips: 'MetroCard ou OMNY (contactless) no subway. Gorjeta é obrigatória em restaurantes.',
    water: 'Segura da torneira (famosa por ser boa)',
    tipping: '18-22% OBRIGATÓRIO em restaurantes. $1-2 por drink em bares.',
    phrases: ['How much? (Quanto?)', 'Check please (A conta)', 'Excuse me (Com licença)', 'Thank you (Obrigado)'],
    embassy: 'Consulado do Brasil: +1 917 777 7777 | 225 E 41st Street, Manhattan',
  },
  'buenos aires': {
    tips: 'Leve dólares em espécie — câmbio paralelo (dólar blue) pode ser vantajoso.',
    water: 'Segura da torneira',
    tipping: '10% em restaurantes (propina).',
    phrases: ['Che! (informal, Ei!)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto sale? (Quanto custa?)', 'Barbaro! (Legal!)'],
    embassy: 'Embaixada do Brasil: +54 11 4515 2400 | Cerrito 1350',
  },
  'cairo': {
    tips: 'Pechinche SEMPRE nos bazares. Leve dólares em espécie para câmbio.',
    water: 'NÃO beba da torneira. Use engarrafada.',
    tipping: 'Baksheesh e esperado em toda parte. 10-15% em restaurantes.',
    phrases: ['Marhaba (Olá)', 'Shukran (Obrigado)', 'Bikam? (Quanto?)', 'La shukran (Não obrigado)', 'Inshallah (Se Deus quiser)'],
    embassy: 'Embaixada do Brasil: +20 2 2749 6688 | 1125 Corniche El Nil, Cairo',
  },
  'bali': {
    tips: 'Alugue scooter só com CNH internacional. Templos exigem sarong (disponível na entrada).',
    water: 'NÃO beba da torneira. Use engarrafada.',
    tipping: 'Não obrigatória. 5-10% em restaurantes finos.',
    phrases: ['Selamat siang (Boa tarde)', 'Terima kasih (Obrigado)', 'Berapa? (Quanto?)', 'Tolong (Por favor)'],
    embassy: 'Embaixada do Brasil em Jacarta: +62 21 526 5656',
  },
  'cancun': {
    tips: 'Negocie passeios na praia. Leve pesos mexicanos para mercados locais.',
    water: 'NÃO beba da torneira. Use engarrafada.',
    tipping: '10-15% em restaurantes. Propina e esperada.',
    phrases: ['Hola (Olá)', 'Gracias (Obrigado)', 'La cuenta (A conta)', 'Cuanto cuesta? (Quanto custa?)'],
    embassy: 'Embaixada do Brasil: +52 55 5164 5959 | Cidade do Mexico',
  },
  'miami': {
    tips: 'Uber e Lyft funcionam bem. Outlets são mais baratos que os shoppings.',
    water: 'Segura da torneira',
    tipping: '18-22% OBRIGATÓRIO em restaurantes. $1-2 por drink.',
    phrases: ['How much? (Quanto?)', 'Check please (A conta)', 'Thank you (Obrigado)'],
    embassy: 'Consulado do Brasil em Miami: +1 305 285 6200 | 80 SW 8th Street',
  },
  'singapura': {
    tips: 'Mascar chiclete e proibido. Metrô (MRT) e o transporte mais eficiente.',
    water: 'Segura da torneira',
    tipping: 'Não esperada. Service charge de 10% já incluso.',
    phrases: ['Hello (Olá)', 'Thank you (Obrigado)', 'How much? (Quanto?)', 'Can lah! (Pode sim!)'],
    embassy: 'Embaixada do Brasil: +65 6256 6001 | 101 Thomson Road',
  },
};

function getDestTips(destination: string) {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_TIPS)) {
    const nk = normalizeForMatch(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  // Fallback: check expanded data
  const expanded = getExpandedCityData(destination);
  if (expanded?.tips) return expanded.tips;
  return null;
}

// ── Helpers ──

function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function isDomesticBrazil(trip: SavedTrip): boolean {
  const country = normalizeForMatch(trip.country || '');
  return country === 'brasil' || country === 'brazil';
}


function getDestDescription(destination: string): string {
  // Priority 1: real curated description from destinationPdfData
  const expanded = getExpandedCityData(destination);
  if (expanded?.description) return expanded.description;
  // Priority 2: legacy in-file map
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

  // Fallback: check expanded data narratives
  const expanded = getExpandedCityData(destination);
  if (expanded?.narratives) {
    for (const [theme, narrative] of Object.entries(expanded.narratives)) {
      if (cleanTitle.toLowerCase().includes(theme.toLowerCase())) return narrative;
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
  // Fallback: check expanded data
  const expanded = getExpandedCityData(destination);
  if (expanded?.info) return expanded.info;
  return null;
}

function cleanText(text: string): string {
  return text.replace(/[^\w\sà-úÀ-Ú—·•›\-,.;:!?()\/'"@#$%&*+=<>{}[\]|\\~`^°ºª§¢£¥€]/gi, '').trim();
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

// ── Compose an evocative day narrative from that day's own activities + tips ──
function composeDayNarrative(day: any): string {
  const acts = (day?.activities || []).filter((a: any) => {
    const n = (a?.name || '').toLowerCase();
    if (a?.category === 'voo' || a?.category === 'hotel' || a?.category === 'transporte') return false;
    if (n.includes('transfer') || n.includes('check-in') || n.includes('check-out')) return false;
    if (n.includes('cafe da manha') || n.includes('café da manhã')) return false;
    return Boolean(a?.name);
  });
  if (acts.length === 0) return '';

  const cleanName = (a: any) => cleanText((a.name || '').replace(/^(Almoco|Jantar|Cafe|Almoço|Café):\s*/i, ''));
  const essence = (a: any): string => {
    const raw = Array.isArray(a?.tips) && a.tips.length ? localizeCuisineTip(String(a.tips[0])) : '';
    if (!raw) return '';
    const stripped = String(raw).replace(/[⚠️✨🌟🔴🟡🟢📍•\-–—]+/g, '').trim();
    const firstSentence = stripped.split(/[.!?]/)[0].trim();
    if (!firstSentence) return '';
    const lower = firstSentence.charAt(0).toLowerCase() + firstSentence.slice(1);
    return cleanText(lower);
  };
  const slotOf = (a: any): 'manha' | 'tarde' | 'noite' => {
    const h = parseInt(String(a?.time || '12:00').split(':')[0], 10);
    if (Number.isNaN(h) || h < 12) return 'manha';
    if (h < 18) return 'tarde';
    return 'noite';
  };

  const morning = acts.find((a: any) => slotOf(a) === 'manha');
  const afternoon = acts.find((a: any) => slotOf(a) === 'tarde');
  const evening = acts.find((a: any) => slotOf(a) === 'noite');

  const chosen: Array<{ label: string; act: any }> = [];
  if (morning) chosen.push({ label: 'A manhã começa em', act: morning });
  if (afternoon) chosen.push({ label: 'A tarde segue em', act: afternoon });
  if (evening) chosen.push({ label: 'A noite fecha com', act: evening });

  if (chosen.length === 0) {
    acts.slice(0, 3).forEach((a: any, i: number) => {
      const label = i === 0 ? 'O dia começa em' : i === 1 ? 'Depois, passe por' : 'Para fechar,';
      chosen.push({ label, act: a });
    });
  }

  return chosen
    .map(({ label, act }) => {
      const name = cleanName(act);
      const ess = essence(act);
      return ess ? `${label} ${name} — ${ess}.` : `${label} ${name}.`;
    })
    .join(' ');
}


// ── Category icon text for PDF (no emoji — use text symbols) ──
function getCategoryIcon(category: string, type?: string): string {
  const cat = (category || type || '').toLowerCase();
  if (cat === 'voo' || cat === 'flight') return '[VOO]';
  if (cat === 'hotel' || cat === 'accommodation') return '[HTL]';
  if (cat === 'comida' || cat === 'food') return '[REST]';
  if (cat === 'transporte' || cat === 'transport') return '[TRS]';
  if (cat === 'compras' || cat === 'shopping') return '[SHP]';
  return '[EXP]';
}

// QR code generation uses the `qrcode` npm library — produces a real,
// scanner-readable QR. Do NOT overlay a logo on the modules (corrupts data
// beyond the built-in error correction).
async function generateQRBase64(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, { margin: 1, width: 220 });
  } catch {
    return null;
  }
}


// ── Emergency numbers by country/region ──
const EMERGENCY_NUMBERS: Record<string, string> = {
  'franca': '112 / 15 (SAMU) / 17 (Policia)',
  'paris': '112 / 15 (SAMU) / 17 (Policia)',
  'italia': '112 / 118 (Ambulancia)',
  'roma': '112 / 118 (Ambulancia)',
  'milao': '112 / 118 (Ambulancia)',
  'espanha': '112',
  'barcelona': '112',
  'portugal': '112',
  'lisboa': '112',
  'holanda': '112',
  'amsterdam': '112',
  'alemanha': '112',
  'berlim': '112',
  'grecia': '112',
  'atenas': '112',
  'reino unido': '999 / 112',
  'londres': '999 / 112',
  'estados unidos': '911',
  'nova york': '911',
  'miami': '911',
  'orlando': '911',
  'los angeles': '911',
  'canada': '911',
  'toronto': '911',
  'tailandia': '191 (Policia) / 1669 (Ambulancia)',
  'bangkok': '191 (Policia) / 1669 (Ambulancia)',
  'phuket': '191 (Policia) / 1669 (Ambulancia)',
  'japao': '110 (Policia) / 119 (Ambulancia)',
  'toquio': '110 (Policia) / 119 (Ambulancia)',
  'dubai': '999 (Policia) / 998 (Ambulancia)',
  'argentina': '911 / 107 (Ambulancia)',
  'buenos aires': '911 / 107 (Ambulancia)',
  'egito': '122 (Policia) / 123 (Ambulancia)',
  'cairo': '122 (Policia) / 123 (Ambulancia)',
  'indonesia': '110 (Policia) / 118 (Ambulancia)',
  'bali': '110 (Policia) / 118 (Ambulancia)',
  'mexico': '911',
  'cancun': '911',
  'singapura': '999 (Policia) / 995 (Ambulancia)',
  'coreia do sul': '112 (Policia) / 119 (Ambulancia)',
  'seul': '112 (Policia) / 119 (Ambulancia)',
  'marrocos': '19 (Policia) / 15 (Ambulancia)',
  'marrakech': '19 (Policia) / 15 (Ambulancia)',
  'australia': '000',
  'sydney': '000',
  'china': '110 (Policia) / 120 (Ambulancia)',
  'india': '100 (Policia) / 108 (Ambulancia)',
  'israel': '100 (Policia) / 101 (Ambulancia)',
  'africa do sul': '10111 (Policia) / 10177 (Ambulancia)',
};

function getEmergencyNumber(trip: SavedTrip): string {
  if (isDomesticBrazil(trip)) {
    return '190 (Policia) · 192 (SAMU) · 193 (Bombeiros)';
  }
  return '112';
}


// ── Image fetching ──

function getDestCoverPhotos(destination: string): string[] {
  const key = normalizeForMatch(destination);
  for (const [k, v] of Object.entries(DESTINATION_COVER_PHOTOS)) {
    const nk = normalizeForMatch(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  // Fallback: check expanded data
  const expanded = getExpandedCityData(destination);
  if (expanded?.photos?.length) return expanded.photos;
  return [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop&fm=jpg&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop&fm=jpg&q=80',
  ];
}

// Fetch destination-specific photos using the EXACT same query the wizard's
// destination cards use (useDestinationPhoto → UnsplashThumbnail). The wizard
// query `"${city} ${country} landmark"` (or DESTINATION_PHOTO_HINTS[city])
// produces correct city photos; "cidade turismo" did not.
// Returns [] on any failure — caller falls back to getDestCoverPhotos.
async function fetchUnsplashCoverUrls(destination: string): Promise<string[]> {
  try {
    const city = destination?.trim();
    if (!city) return [];
    const info = findCityInfo(city);
    const country = info?.country?.country || '';
    // PRIMARY: use EXACTLY the wizard destination card query pattern
    // (WizardStep1Logistics uses `${city} ${country} landmark`). This is the
    // verified-correct image source for the 20 curated cities. We deliberately
    // do NOT use DESTINATION_PHOTO_HINTS here because some hints ("Beira Mar
    // beach", etc.) return generic tropical stock (e.g. Maldives for Fortaleza).
    const query = country ? `${city} ${country} landmark` : `${city} landmark travel`;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsplash?query=${encodeURIComponent(query)}&per_page=2&orientation=landscape`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = await res.json();
    const photos = Array.isArray(data?.photos) ? data.photos : [];
    return photos.map((p: any) => p?.urls?.regular).filter(Boolean);
  } catch {
    return [];
  }
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
  const result = await tryFetch(url, 12000);
  if (result) return result;

  // Attempt 2: slightly modified URL for retry
  const retryUrl = url.includes('&fm=') ? url.replace('&q=80', '&q=75') : url + '&fm=jpg&q=75';
  const result2 = await tryFetch(retryUrl, 10000);
  if (result2) return result2;

  return null;
}

// ── Main Export Function (ASYNC for image fetching) ──

/**
 * @param displayName nome de quem exporta, vindo de useAuth().user.name.
 *   Esta lib NÃO é componente e não pode usar hook — antes ela lia `kinu_user`
 *   do localStorage direto (recon §2.2). A thread agora vem de quem exporta.
 *   Omitido = PDF sem a linha "Preparado para".
 * @param email e-mail de quem exporta: nome igual ao local do e-mail (fallback do useAuth) não é
 *   nome — sai "Preparado para você" (B.3.1 D4).
 */
export async function exportTripPDF(trip: SavedTrip, displayName?: string, email?: string) {
  // M8b: corpo do PDF (+2 pt sobre 10.5/9.5). Títulos, capa e rodapé ficam; passo de linha acompanha (LH_*).
  const FS_BODY = 12.5;
  const FS_SMALL = 11;
  const LH_SMALL = 4.8; // mm por linha de FS_SMALL (jsPDF usa 1.15 × corpo ≈ 4.5)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  let y = 0;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  // M8a: uma só porta de saída — texto fora da WinAnsi (⭐, setas, NFD) quebraria a string inteira.
  const safeArg = (v: any): any => (Array.isArray(v) ? v.map(pdfSafe) : typeof v === 'string' ? pdfSafe(v) : v);
  const _text = doc.text.bind(doc);
  (doc as any).text = (t: any, ...r: any[]) => _text(safeArg(t), ...r);
  const _split = doc.splitTextToSize.bind(doc);
  (doc as any).splitTextToSize = (t: any, ...r: any[]) => _split(safeArg(t), ...r);
  if (typeof doc.textWithLink === 'function') {
    const _link = doc.textWithLink.bind(doc);
    (doc as any).textWithLink = (t: any, ...r: any[]) => _link(safeArg(t), ...r);
  }
  if (typeof doc.getTextWidth === 'function') {
    const _w = doc.getTextWidth.bind(doc);
    (doc as any).getTextWidth = (t: any) => _w(safeArg(t));
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Fetch cover photos in parallel — try destination-specific unsplash first,
  // fall back to curated hardcoded arrays if the edge function fails.
  const fallbackUrls = getDestCoverPhotos(trip.destination);
  const unsplashUrls = await fetchUnsplashCoverUrls(trip.destination);
  const coverUrls = unsplashUrls.length > 0
    ? [...unsplashUrls, ...fallbackUrls]
    : fallbackUrls;
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
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'normal');
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    doc.text('KINU — Travel Intelligence', 14, ph - 8);
    doc.text(`Gerado em ${today}  |  kinu-travel.app`, pw - 14, ph - 8, { align: 'right' });
  };

  const addPageHeader = () => {
    drawRect(0, 0, pw, 10, B.night);
    setC(B.gray400, false);
    doc.setFontSize(11.5);
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

  const tierLabels: Record<string, string> = { backpacker: 'Mochileiro', economic: 'Econômico', comfort: 'Conforto', luxury: 'Luxo' };
  const tierLabel = tierLabels[(trip as unknown as { budgetTier?: string }).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';
  const totalDays = trip.days?.length || 0;

  // ════════════════════════════════════════
  // PAGE 1 — COVER WITH PHOTO
  // ════════════════════════════════════════

  // Full navy background
  drawRect(0, 0, pw, ph, B.night);

  // Cover photo in top section (130mm band)
  let coverRendered = false;
  if (coverBase64) {
    try {
      doc.addImage(coverBase64, 'JPEG', 0, 0, pw, 130);
      // Solid navy block at bottom of photo for smooth transition
      drawRect(0, 105, pw, 25, B.night);
      coverRendered = true;
    } catch {
      coverRendered = false;
    }
  }

  // LAYOUT GUARD: if the cover image failed to load or decode, render a solid
  // brand band (dark #0f172a with emerald rule) in the SAME 130mm area so the
  // rest of page 1 keeps its intended vertical rhythm (titleY = 140).
  if (!coverRendered) {
    drawRect(0, 0, pw, 130, B.night);
    drawRect(0, 128, pw, 2, B.emerald);
    drawRect(0, 131, pw, 0.4, B.gold);
  }

  // KINU branding — below cover band (fixed regardless of image load)
  const titleY = 140;

  setC(B.white, false);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KINU', pw / 2, titleY, { align: 'center' });

  setC(B.gray400, false);
  doc.setFontSize(10.5);
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
  doc.setFontSize(11.5);
  doc.text(dateRange, pw / 2, y, { align: 'center' });
  y += 6;
  doc.text(`${totalDays} dias  |  ${(() => { const px = paxOf(trip); return px.children > 0 ? cleanText(paxLabel(px)) : plural(Number(trip.travelers) || 1, 'viajante', 'viajantes'); })()}  |  Faixa ${tierLabel}`, pw / 2, y, { align: 'center' });

  // Personalizacao — nome de quem exporta, recebido por argumento.
  // A leitura crua de `kinu_user` morreu aqui (Arco 3c): a lib nao pode usar
  // hook, entao quem chama passa o useAuth().user.name.
  //
  // O filtro herdado do codigo antigo continua: melhor nenhuma linha do que
  // uma linha com slug. Duas rejeicoes, pelo mesmo motivo —
  //   'Viajante' = o ultimo degrau da cascata do toAppUser, ou seja "nao sei
  //                teu nome"; imprimir isso e pior que omitir;
  //   com digito = veio do local part de um email (pedro123), nao e nome.
  // Nome proprio de uma palavra so ("Pedro") AGORA IMPRIME — antes o
  // isProperName exigia espaco/ponto/hifen porque a fonte era um mock que
  // podia guardar slug no campo `name`.
  try {
    const raw = (displayName || '').trim();
    const isFallbackName = raw.toLowerCase() === 'viajante';
    const looksLikeSlug = /\d/.test(raw);
    const emailLocal = (email || '').split('@')[0].trim().toLowerCase();
    const isEmailLocal = !!emailLocal && raw.toLowerCase() === emailLocal;

    if (raw && !isFallbackName && !looksLikeSlug) {
      // B.3.1: só divide onde há separador (espaço, ., _, -); nunca cola nem inventa espaço.
      const pretty = isEmailLocal
        ? 'você'
        : raw
          .replace(/[._-]+/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

      y += 7;
      setC(B.emeraldL, false);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text(`Preparado para ${cleanText(pretty)}`, pw / 2, y, { align: 'center' });
    }
  } catch {}


  // About destination section (only if space, i.e. no photo pushed it down too much)
  if (y + 40 < ph - 22) {
    y += 14;
    drawRect(14, y, pw - 28, 0.3, B.surface);
    y += 10;

    setC(B.emerald, false);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SOBRE O DESTINO', 14, y);
    y += 6;

    setC(B.gray400, false);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    const desc = getDestDescription(trip.destination);
    const maxDescWidth = pw - 28;
    const descLines = doc.splitTextToSize(desc, maxDescWidth);
    const availableLines = Math.floor((ph - 22 - y) / 4.2);
    const linesToShow = descLines.slice(0, Math.min(descLines.length, availableLines));
    doc.text(linesToShow, 14, y);
    y += linesToShow.length * 4.2;

    // ── Flight summary on cover ──
    const flightDuration = trip.flights?.outbound?.duration || '';
    const flightDurNum = parseFloat(flightDuration) || 0;
    // Fuso na data da viagem (não o gap gravado na criação, que podia ser o de "hoje").
    const tz = tripTimezone(trip);
    const tzDiff = tz.diff;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const durationKnown = (trip.flights?.outbound as any)?.durationKnown !== false;
    // "3h25", nunca "3.42h": o gravado segue decimal, a capa formata.
    const flightDurMin = durationTextToMinutes(flightDuration);
    const durLabel = durationKnown ? (flightDurMin > 0 ? `~${formatDurationHM(flightDurMin)}` : '~?h') : 'duração a confirmar';
    const originIata = trip.flights?.outbound?.origin || 'GRU';
    const originCity = airportCity(originIata)?.city ?? originIata;
    const destCity = trip.destination || '';
    if (flightDurNum > 0 || Math.abs(tzDiff) > 0 || !tz.tzKnown) {
      y += 6;
      checkPage(12);
      setC(B.horizon, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heroOpt = (trip as any).outboundFlight?.option;
      const refStamp = tripReferenceStamp(trip);
      const flightLine = `Voo: ${cleanText(originCity)} › ${cleanText(destCity)}  |  ${durLabel}  |  ${stopsLabel(heroOpt)}  |  ${baggageLabel(heroOpt)}  |  Fuso: ${formatTzDiff(tz)}`;
      doc.text(flightLine, 14, y);
      y += 5;
      if (refStamp) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`referência Aviasales · ${refStamp.text}`, 14, y);
        y += 4;
      }

      const severity = trip.jetLagSeverity;
      if (severity === 'ALTO' || severity === 'SEVERO') {
        setC(severity === 'SEVERO' ? B.red : B.amber, false);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`Impacto de fuso: ${severity}`, 14, y);
        y += 4;
      }
    }
  }

  // ── QR code in bottom-right ──
  if (y + 40 < ph - 30) {
    const qrData = await generateQRBase64('https://kinu-travel.app');
    if (qrData) {
      try {
        // Emerald frame around the QR (2mm padding, 25mm QR)
        drawRect(pw - 41, ph - 46, 27, 27, B.emerald);
        drawRect(pw - 40.5, ph - 45.5, 26, 26, B.white);
        doc.addImage(qrData, 'PNG', pw - 40, ph - 45, 25, 25);
        setC(B.gray500, false);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Acesse seu roteiro digital', pw - 27.5, ph - 18, { align: 'center' });
      } catch {}
    }
  }

  // ── M18a: NESTA ÉPOCA (sem dado = nada) ──
  try {
    const rows = seasonalRows(trip);
    if (rows.length > 0) {
      y += 8;
      for (const r of rows) {
        const w = pw - 28 - (r.kind === 'item' ? 4 : 0);
        const size = r.kind === 'title' ? 11.5 : 10;
        doc.setFontSize(size);
        doc.setFont('helvetica', r.kind === 'title' || r.kind === 'label' ? 'bold' : 'normal');
        const lines: string[] = doc.splitTextToSize((r.kind === 'item' ? '• ' : '') + pdfSafe(r.text), w);
        // título nunca órfão: reserva espaço para ele + 2 linhas seguintes
        checkPage(r.kind === 'title' ? 20 : lines.length * 4.2 + 1);
        setC(r.kind === 'title' ? B.emerald : r.kind === 'label' ? B.white : B.gray400, false);
        doc.setFontSize(size);
        doc.setFont('helvetica', r.kind === 'title' || r.kind === 'label' ? 'bold' : 'normal');
        doc.text(lines, r.kind === 'item' ? 18 : 14, y);
        y += lines.length * 4.2 + (r.kind === 'title' ? 2 : 0);
      }
    }
  } catch { /* sazonalidade nunca derruba o PDF */ }

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
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINANCEIRO', 14, y);
  y += 6;

  const boxH = 34;
  drawRect(14, y, pw - 28, boxH, B.deep);
  drawRect(14, y, 2, boxH, B.emerald);

  const budgetTotal = Number(trip.budget) || trip.finances?.total || 0;
  const { planned: plannedVal, confirmed: confirmedVal } = razaoTotals(razaoLines(trip));
  // Canonical app formula: Disponível = orçamento − planejado − confirmado
  const availableCalc = budgetTotal - plannedVal - confirmedVal;
  const isOverBudget = availableCalc < 0;
  const finData = [
    { label: 'Orçamento total', value: `R$ ${fmt(budgetTotal)}`, color: B.white },
    { label: 'Confirmado', value: `R$ ${fmt(confirmedVal)}`, color: B.emerald },
    { label: 'Planejado', value: `R$ ${fmt(plannedVal)}`, color: B.gold },
    {
      label: isOverBudget ? 'Acima do orçamento' : 'Disponível',
      value: isOverBudget
        ? `R$ ${fmt(Math.abs(availableCalc))}`
        : `R$ ${fmt(availableCalc)}`,
      color: isOverBudget ? B.amber : B.gray400,
    },
  ];

  let finY = y + 7;
  finData.forEach(({ label, value, color }) => {
    setC(B.gray400, false);
    doc.setFontSize(11.5);
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
  const total = budgetTotal || 1;
  const confirmedPct = Math.min(100, confirmedVal / total * 100);
  const plannedPct = Math.min(100 - confirmedPct, plannedVal / total * 100);

  drawRect(14, barY, barW, 2.5, B.surface);
  if (confirmedPct > 0) drawRect(14, barY, barW * confirmedPct / 100, 2.5, B.emerald);
  if (plannedPct > 0) drawRect(14 + barW * confirmedPct / 100, barY, barW * plannedPct / 100, 2.5, B.gold);

  y = barY + 10;

  // ── SUA VIAGEM INCLUI (confirmados vs a confirmar) ──
  {
    const confirmedItems: string[] = [];
    const pendingItems: string[] = [];

    // Voo — priorizar dados reais do Amadeus (mesma fonte do hero card)
    const outb = trip.flights?.outbound;
    const ret = trip.flights?.return;
    const realOutb = (trip as any).outboundFlight?.option;
    const realRet = (trip as any).returnFlight?.option;
    if (outb || realOutb) {
      const parts = ['Voo ida e volta'];
      const outAirline = (realOutb?.airline && realOutb.airline !== 'A confirmar') ? realOutb.airline : outb?.airline;
      const retAirline = (realRet?.airline && realRet.airline !== 'A confirmar') ? realRet.airline : ret?.airline;
      const airlines = [outAirline, retAirline].filter(Boolean);
      if (airlines.length) parts.push(Array.from(new Set(airlines)).join(' / '));
      const outTime = realOutb?.departureTime || outb?.departureTime;
      const retTime = realRet?.departureTime || ret?.departureTime;
      parts.push(stopsLabel(realOutb ?? null));
      if (outTime) parts.push(`saída ${outTime}`);
      if (retTime) parts.push(`retorno ${retTime}`);
      const line = cleanText(parts.join(' · '));
      ((outb?.status === 'confirmed') ? confirmedItems : pendingItems).push(line);
    }

    // Hotel — evitar duplicar a palavra 'Hotel' quando o nome ja comeca com ela
    if (trip.accommodation) {
      const acc: any = trip.accommodation;
      const meal = acc.mealPlan || acc.regime || '';
      const rawName = String(acc.name || trip.destination || '').trim();
      const hasHotelPrefix = /^hotel\b/i.test(rawName);
      const namePart = hasHotelPrefix ? rawName : `Hotel ${rawName}`;
      const line = cleanText(`${namePart}${meal ? ' · ' + meal : ''}${acc.totalNights ? ' · ' + acc.totalNights + ' noites' : ''}`);
      (acc.status === 'confirmed' ? confirmedItems : pendingItems).push(line);
    }

    // Atividades confirmadas (limitadas a 8 para caber): apenas itens reservaveis com custo > 0, excluindo itens de sistema
    const confirmedActs: string[] = [];
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    (trip.days || []).forEach((d: any) => {
      (d.activities || []).forEach((a: any) => {
        if (a.status !== 'confirmed') return;
        if (a.category === 'voo' || a.category === 'hotel' || a.category === 'transporte') return;
        const cost = Math.round(a.estimatedCost || a.costPerPerson || a.totalCost || 0);
        if (cost <= 0) return;
        const n = normalize(a.name || '');
        if (n.includes('transfer') || n.includes('check-in') || n.includes('check-out')) return;
        if (n.includes('cafe da manha') || n.includes('caminhada leve') || n.includes('descanso')) return;
        confirmedActs.push(cleanText(`Dia ${d.day}: ${a.name}`));
      });
    });
    const shownActs = confirmedActs.slice(0, 8);
    const extraActs = confirmedActs.length - shownActs.length;
    shownActs.forEach((s) => confirmedItems.push(s));
    if (extraActs > 0) confirmedItems.push(`+ ${extraActs} outras atividades confirmadas`);

    if (confirmedItems.length > 0 || pendingItems.length > 0) {
      checkPage(20);
      drawRect(14, y, pw - 28, 0.3, B.surface);
      y += 8;
      setC(B.emerald, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      doc.text('SUA VIAGEM INCLUI', 14, y);
      y += 7;

      const renderBlock = (title: string, items: string[], dotColor: readonly number[]) => {
        if (items.length === 0) return;
        checkPage(6 + items.length * 6);
        setC(dotColor, false);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 16, y);
        y += 5;
        items.forEach((it) => {
          doc.setFontSize(FS_SMALL);
          doc.setFont('helvetica', 'normal');
          const wrapped = doc.splitTextToSize(it, pw - 44);
          checkPage(wrapped.length * LH_SMALL + 1);
          drawStatusDot(18, y - 1, dotColor);
          setC(B.white, false);
          doc.text(wrapped, 22, y);
          y += wrapped.length * LH_SMALL + 1;
        });
        y += 3;
      };

      renderBlock('Confirmado', confirmedItems, B.emerald);
      renderBlock('A confirmar', pendingItems, B.gold);
    }
  }


  // Voo & Hospedagem
  checkPage(30);
  drawRect(14, y, pw - 28, 0.3, B.surface);
  y += 8;
  setC(B.emerald, false);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VOO & HOSPEDAGEM', 14, y);
  y += 7;

  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || trip.destination;
  const flightStatus = trip.flights?.outbound?.status === 'confirmed' ? 'Confirmado' : 'Planejado';
  const flightPrice = flightStatus === 'Confirmado'
    ? (trip.finances?.categories?.flights?.confirmed || (trip.flights?.outbound?.price || 0) + (trip.flights?.return?.price || 0))
    : getFlightPlannedTotal(trip);

  drawStatusDot(16, y - 1, flightStatus === 'Confirmado' ? B.emerald : B.gold);
  setC(B.white, false);
  doc.setFontSize(10.5);
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
    doc.setFontSize(10.5);

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
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'italic');
      const descLines = doc.splitTextToSize(hotelDescription, pw - 40);
      checkPage(descLines.length * LH_SMALL + 2);
      doc.text(descLines, 20, y);
      y += descLines.length * LH_SMALL + 2;
    }

    // Google Maps link for hotel
    if (hotelNeighborhood || trip.accommodation.name) {
      const mapsQuery = encodeURIComponent((trip.accommodation.name || '') + ', ' + trip.destination);
      const mapsLink = `https://www.google.com/maps/search/${mapsQuery}`;
      setC(B.emerald, false);
      doc.setFontSize(11.5);
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
  y += 5;
  const verifiedLabel = catalogVerifiedLabel(trip.destination);
  if (verifiedLabel) {
    setC(B.gray400, false);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(pdfSafe(verifiedLabel), 14, y);
    y += 5;
  }
  y += 3;

  (trip.days || []).forEach((day) => {
    checkPage(22);

    drawRect(14, y - 4, pw - 28, 0.3, B.surface);
    y += 2;

    const cleanTitle = cleanText(day.title || '');

    setC(B.white, false);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`DIA ${day.day}  —  ${cleanTitle}`, 14, y);

    if (trip.startDate) {
      const dayDate = new Date(trip.startDate);
      dayDate.setDate(dayDate.getDate() + day.day - 1);
      setC(B.gray500, false);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      doc.text(format(dayDate, "dd MMM yyyy", { locale: ptBR }), pw - 14, y, { align: 'right' });
    }

    drawRect(14, y + 2, 40, 0.4, B.emerald);
    y += 6;

    // M18a: alerta de fechamento do dia
    try {
      if (trip.startDate) {
        const d0 = new Date(String(trip.startDate).slice(0, 10) + 'T00:00:00Z');
        d0.setUTCDate(d0.getUTCDate() + day.day - 1);
        const alert = dayAlert(trip.destination, d0.toISOString().slice(0, 10));
        if (alert) {
          setC(B.amber, false);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const al: string[] = doc.splitTextToSize(pdfSafe(`Atenção: ${alert}`), pw - 28);
          doc.text(al, 14, y + 1);
          y += al.length * 3.8 + 2;
        }
      }
    } catch { /* alerta nunca derruba o PDF */ }

    // ── Daily route summary (non-logistics days only) ──
    const isLogisticsDay = (day.title || '').toLowerCase().includes('embarque') ||
      (day.title || '').toLowerCase().includes('retorno');
    if (!isLogisticsDay && (day.activities || []).length > 1) {
      const routeStops = (day.activities || [])
        .filter((a: any) => {
          const n = (a.name || '').toLowerCase();
          return !n.includes('transfer') && !n.includes('check-in') && !n.includes('check-out') &&
            !n.includes('cafe da manha') && !n.includes('café da manhã') &&
            a.category !== 'voo' && a.category !== 'transporte';
        })
        .map((a: any) => {
          const n = (a.name || '');
          return pdfSafe(n.replace(/^(Almoco|Jantar|Cafe|Almoço|Café):\s*/i, '')).substring(0, 20);
        });
      if (routeStops.length >= 2) {
        checkPage(5.5);
        setC(B.gray500, false);
        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'italic');
        const routeText = `Rota: Hotel > ${routeStops.join(' > ')} > Hotel`;
        const truncated = routeText.length > 100 ? routeText.substring(0, 97) + '...' : routeText;
        doc.text(truncated, 16, y);
        y += 5.5;
      }
    }

    // Prose first, schedule below: prefer a narrative composed from the day's own activities+tips.
    const composed = composeDayNarrative(day);
    const narrative = composed || getDayNarrative(trip.destination, day.title || '');
    if (narrative) {
      checkPage(12);
      setC(B.gray400, false);
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'italic');
      const narrativeLines = doc.splitTextToSize(narrative, pw - 32);
      narrativeLines.forEach((ln: string) => {
        checkPage(LH_SMALL + 1);
        setC(B.gray400, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'italic');
        doc.text(ln, 16, y);
        y += LH_SMALL;
      });
      y += 3;
    }

    (day.activities || []).forEach((act) => {
      const isLogistics = act.category === 'voo' ||
        (act.category === 'hotel' && (act.name?.toLowerCase().includes('check-in') || act.name?.toLowerCase().includes('check-out'))) ||
        act.name?.toLowerCase().includes('transfer');

      const actIdx = (day.activities || []).indexOf(act);
      const nextAct = (day.activities || [])[actIdx + 1];
      // Logística real (coords nas duas pontas) ou nada — a mesma linha da tela do roteiro.
      const distHint = !isLogistics && nextAct && nextAct.category !== 'voo' && nextAct.category !== 'hotel' &&
        !(nextAct.name || '').toLowerCase().includes('transfer')
        ? logisticsLine(itemCoord(act, trip.destination), itemCoord(nextAct, trip.destination)) : undefined;
      const hasDistanceHint = !!distHint;

      const rawDescription = cleanText(localizeCuisineTip(String(act.description || '')));
      const hasDescription = rawDescription && rawDescription !== cleanText(act.name || '') && !isLogistics && rawDescription.length > 5;

      const actName = cleanText(act.name || '');
      const hasMapsLink = !isLogistics && actName && !actName.toLowerCase().includes('cafe da manha');

      // M20: ingresso com criança mostra o label de pax e o aviso (o preço infantil nunca é inventado).
      const paxMatch = !isLogistics ? /\((\d+ adultos?[^()]*crian[^()]*)\)/i.exec(String((act as { location?: string }).location || '')) : null;
      const paxHint = paxMatch ? cleanText(`${paxMatch[1]} - ingresso infantil a confirmar`) : '';

      const hasSubLine = hasDistanceHint || hasDescription || hasMapsLink || !!paxHint;
      const blockHeight = 5.5 + (paxHint ? 5.2 : 0) + (hasDistanceHint ? 5.4 : 0) + (hasDescription ? 5.2 : 0) + (hasMapsLink ? 5.2 : 0) + (hasSubLine ? 2 : 0);
      checkPage(blockHeight);

      setC(isLogistics ? B.gray500 : B.white, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', isLogistics ? 'italic' : 'normal');
      
      // Category icon prefix
      const catIcon = getCategoryIcon(act.category || '', act.type);
      setC(B.emerald, false);
      doc.setFontSize(10.5);
      doc.text(catIcon, 16, y);
      
      setC(isLogistics ? B.gray500 : B.white, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', isLogistics ? 'italic' : 'normal');
      // "00:35 (+1)": hora na coluna, "(+1)" junto ao nome (não invade a coluna).
      const nextDay = /\(\+1\)/.test(String(act.time || ''));
      const timeStr = String(act.time || '     ').replace(/\s*\(\+1\)/, '');
      doc.text(timeStr, 26, y);

      doc.text(nextDay ? `${actName} (+1)` : actName, 38, y);

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
      y += 5.5;

      // ── Distance hint between activities ──
      if (hasDistanceHint) {
        setC(B.gray500, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'italic');
        doc.text(cleanText(distHint as string), 30, y);
        y += 5.4;
      }

      if (paxHint) {
        setC(B.gray500, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'italic');
        doc.text(paxHint, 30, y);
        y += 5.2;
      }

      // Activity description line
      if (hasDescription) {
        setC(B.gray500, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'italic');
        const descText = rawDescription.length > 80 ? rawDescription.substring(0, 77) + '...' : rawDescription;
        doc.text(descText, 30, y);
        y += 5.2;
      }

      // Google Maps link for non-logistics activities
      if (hasMapsLink) {
        const cleanActName = actName.replace(/^(Almoco|Jantar|Cafe):\s*/i, '');
        const actMapsQuery = encodeURIComponent(cleanActName + ', ' + trip.destination);
        const actMapsUrl = 'https://www.google.com/maps/search/' + actMapsQuery;
        setC(B.horizon, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'normal');
        doc.textWithLink('Ver no Maps', 30, y, { url: actMapsUrl });
        y += 5.2;
      }

      if (hasSubLine) {
        y += 2;
      }
    });

    // Google Maps directions link for the entire day
    const dayVisitables = (day.activities || []).filter((a: any) =>
      !['voo', 'transporte', 'hotel'].includes(a.category || '') &&
      !a.name?.toLowerCase().includes('transfer') &&
      !a.name?.toLowerCase().includes('check-in') &&
      !a.name?.toLowerCase().includes('check-out') &&
      !a.name?.toLowerCase().includes('cafe da manha') &&
      !a.name?.toLowerCase().includes('café da manhã')
    );
    if (dayVisitables.length > 1) {
      checkPage(14);
      y += 1;
      drawRect(16, y, pw - 32, 10, B.deep);
      doc.setFillColor(B.deep[0], B.deep[1], B.deep[2]);
      doc.roundedRect(16, y, pw - 32, 10, 2, 2, 'F');
      setC(B.emerald, false);
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'bold');
      const waypoints = dayVisitables
        .map((a: any) => encodeURIComponent((a.name || '') + ', ' + trip.destination))
        .join('/');
      const dayMapsUrl = `https://www.google.com/maps/dir/${waypoints}`;
      doc.textWithLink('[MAP] Ver rota do dia no Google Maps', 20, y + 6, { url: dayMapsUrl });
      y += 14;
    }

    y += 4;
  });

  // ════════════════════════════════════════
  // GASTRONOMIA MICHELIN
  // ════════════════════════════════════════
  // M7: a mesma faixa do roteiro (Conforto 1★, Luxo 2–3★); Econômico ou sem estrela da faixa omite a seção.
  const michelinTier = (trip as unknown as { budgetTier?: string }).budgetTier || trip.budgetType || 'comfort';
  const michelinLevel = michelinTier === 'luxury' ? 'luxury' : michelinTier === 'backpacker' || michelinTier === 'economic' ? 'budget' : 'midrange';
  const michelinList = michelinForTier(trip.destination, michelinLevel).slice(0, 5);
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
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'italic');
    doc.text(michelinLevel === 'luxury' ? 'Restaurantes 2 e 3 estrelas Michelin - faixa Luxo' : 'Restaurantes 1 estrela Michelin - faixa Conforto', 14, y);
    y += 7;

    michelinList.forEach((r) => {
      checkPage(11);
      const starsStr = Array(r.stars).fill('*').join('');

      setC(B.white, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanText(r.name), 20, y);

      setC(B.gold, false);
      doc.setFontSize(11.5);
      doc.text(starsStr, 20 + doc.getTextWidth(cleanText(r.name)) + 3, y);

      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FS_SMALL);
      const details = `${cuisinePt(r.cuisine)}  |  ${r.priceRange}${r.neighborhood ? '  |  ' + r.neighborhood : ''}`;
      doc.text(details, 20, y + 4.5);

      y += 11;
    });

    y += 3;
  }


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
    doc.text('INFORMAÇÕES ÚTEIS', 14, y);
    y += 8;

    const infoItems = [
      // Fuso calculado na data (R-V7); a string fixa da tabela não é lida (R-V6 acima da tabela).
      { label: 'Fuso horário', value: formatTzInfo(tripTimezone(trip)) },
      { label: 'Voltagem / Tomada', value: destInfo.voltage },
      { label: 'Idioma', value: destInfo.language },
      { label: 'Moeda', value: destInfo.currency },
      { label: 'Visto (brasileiros)', value: destInfo.visa },
    ];

    infoItems.forEach(({ label, value }) => {
      checkPage(8);
      setC(B.gray400, false);
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'normal');
      doc.text(label, 16, y);
      setC(B.white, false);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 58, y);
      y += 7;
    });
  }

  // ── DOCUMENTACAO (visto, vacina, passaporte, moeda, tomada) ──
  const docs = getDocsForDestination(trip.destination);
  if (docs) {
    y += 4;
    checkPage(46);
    drawRect(14, y - 2, pw - 28, 0.3, B.surface);
    y += 8;
    setC(B.emerald, false);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTAÇÃO', 14, y);
    y += 4;
    setC(B.gray400, false);
    doc.setFontSize(FS_SMALL);
    doc.setFont('helvetica', 'italic');
    doc.text(`Regras para brasileiros · ${docs.country}`, 14, y);
    y += 6;

    const docRows: Array<{ label: string; value: string; accent: readonly number[] }> = [
      { label: 'Visto', value: docs.visto, accent: docs.vistoIsento ? B.emerald : B.amber },
      { label: 'Vacina', value: docs.vacina, accent: docs.vacinaObrigatoria ? B.red : B.emerald },
      { label: 'Passaporte', value: docs.passaporte, accent: B.horizon },
      { label: 'Moeda', value: docs.moeda, accent: B.gold },
      { label: 'Tomada', value: docs.tomada, accent: B.gray400 },
    ];

    docRows.forEach(({ label, value, accent }) => {
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(cleanText(value), pw - 50);
      const rowH = Math.max(9, 5 + wrapped.length * LH_SMALL);
      checkPage(rowH + 2);
      drawRect(14, y, pw - 28, rowH, B.deep);
      drawRect(14, y, 1.5, rowH, accent);
      setC(accent, false);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), 18, y + 5);
      setC(B.white, false);
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'normal');
      doc.text(wrapped, 46, y + 5);
      y += rowH + 2;
    });
    y += 2;
  }



  // ── Biology AI — Protocolo de Adaptacao ──
  const jetLagSev = trip.jetLagSeverity as string | undefined;
  if (trip.jetLagMode && jetLagSev && jetLagSev !== 'BAIXO') {
    y += 4;
    checkPage(30);
    drawRect(14, y - 2, pw - 28, 0.3, B.surface);
    y += 6;

    const protocolColor = jetLagSev === 'SEVERO' ? B.red : jetLagSev === 'ALTO' ? B.amber : B.gold;

    // Border box
    drawRect(14, y, pw - 28, 1, protocolColor);
    const boxStartY = y + 1;
    const protocolContent = jetLagSev === 'SEVERO'
      ? 'Dia 1: descanso total. Dia 2: atividades leves. Dia 3: 70% intensidade. Dia 4+: roteiro completo.'
      : jetLagSev === 'ALTO'
        ? 'Dia 1: descanso até 15h. Dia 2: retomada gradual. Evite álcool nas primeiras 24h.'
        : 'Dia 1: atividades leves. Dia 2+: roteiro normal. Hidrate-se!';
    doc.setFontSize(FS_SMALL);
    doc.setFont('helvetica', 'normal');
    const protocolLines = doc.splitTextToSize(protocolContent, pw - 44);
    const boxH2 = 12 + protocolLines.length * LH_SMALL;

    drawRect(14, boxStartY, pw - 28, boxH2, B.deep);
    drawRect(14, boxStartY, 2, boxH2, protocolColor);
    drawRect(14, boxStartY + boxH2, pw - 28, 1, protocolColor);

    setC(protocolColor, false);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Biology AI — Protocolo de Adaptação', 20, boxStartY + 6);

    setC(B.gray400, false);
    doc.setFontSize(FS_SMALL);
    doc.setFont('helvetica', 'normal');
    doc.text(protocolLines, 20, boxStartY + 12);

    y = boxStartY + boxH2 + 4;
  }

  // ── Dicas locais, agua, gorjeta ──
  const tips = getDestTips(trip.destination);
  if (tips) {
    y += 4;

    // Dica local
    doc.setFontSize(FS_SMALL);
    doc.setFont('helvetica', 'normal');
    const tipLines = doc.splitTextToSize(tips.tips, pw - 52);
    checkPage(tipLines.length * LH_SMALL + 3);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text('Dica local:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    doc.text(tipLines, 40, y);
    y += tipLines.length * LH_SMALL + 3;

    // Agua
    checkPage(7);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text('Água:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    doc.text(tips.water, 40, y);
    y += 6;

    // Gorjeta
    const tipTipLines = doc.splitTextToSize(tips.tipping, pw - 52);
    checkPage(tipTipLines.length * LH_SMALL + 3);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text('Gorjeta:', 16, y);
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    doc.text(tipTipLines, 40, y);
    y += tipTipLines.length * LH_SMALL + 3;

    // Frases uteis
    if (tips.phrases && tips.phrases.length > 0) {
      checkPage(18);
      y += 3;
      drawRect(14, y - 2, pw - 28, 0.3, B.surface);
      y += 6;
      setC(B.emerald, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      doc.text('FRASES ÚTEIS', 14, y);
      y += 6;

      tips.phrases.forEach(phrase => {
        checkPage(6);
        setC(B.white, false);
        doc.setFontSize(FS_SMALL);
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${phrase}`, 16, y);
        y += 5.3;
      });
      y += 2;
    }

    // Embaixada / Emergencia
    if (tips.embassy) {
      checkPage(18);
      drawRect(14, y, pw - 28, 0.3, B.surface);
      y += 6;
      setC(B.emerald, false);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      doc.text('EMERGÊNCIA', 14, y);
      y += 6;

      setC(B.white, false);
      doc.setFontSize(FS_SMALL);
      doc.setFont('helvetica', 'bold');
      doc.text('Consulado/Embaixada do Brasil:', 16, y);
      y += 5;
      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      const embLines = doc.splitTextToSize(tips.embassy, pw - 36);
      checkPage(embLines.length * LH_SMALL + 14);
      doc.text(embLines, 16, y);
      y += embLines.length * LH_SMALL + 4;

      setC(B.white, false);
      doc.setFont('helvetica', 'bold');
      doc.text(
        isDomesticBrazil(trip)
          ? `Emergência: ${getEmergencyNumber(trip)}`
          : 'Emergência geral (padrão internacional): 112',
        16,
        y
      );

      y += 5;
      setC(B.gray400, false);
      doc.setFont('helvetica', 'normal');
      doc.text('Seguro viagem: ligue para a central do cartão ou seguradora ANTES do atendimento', 16, y);
      y += 5;
    }
  }

  // ════════════════════════════════════════
  // PACKING CHECKLIST PAGE
  // ════════════════════════════════════════
  addPage();

  setC(B.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE VIAGEM', 14, y);
  y += 8;

  // M8a: clima por hemisfério (país do catálogo) + mês; praia só em cidade de praia.
  const { cold: isCold, beach: isBeach } = packingClimate({
    destination: trip.destination,
    country: findCityInfo(trip.destination)?.country.country,
    month: monthOf(trip.startDate),
  });

  const packingCategories: Array<{ title: string; items: string[] }> = [
    {
      title: 'Documentos',
      items: isDomesticBrazil(trip)
        ? ['RG ou CNH válidos (voo doméstico)', 'Cópias digitais dos documentos', 'Comprovante de hospedagem', 'Passagens aéreas impressas', 'Seguro viagem']
        : ['Passaporte (validade > 6 meses)', 'Cópias digitais dos documentos', 'Comprovante de hospedagem', 'Passagens aéreas impressas', 'Seguro viagem', 'Carteira de vacinação internacional', 'Cartão de crédito internacional'],
    },

    {
      title: 'Eletrônicos',
      items: ['Carregador de celular', 'Adaptador de tomada', 'Power bank', 'Fones de ouvido', 'Cabo USB extra'],
    },
    {
      title: 'Roupas',
      items: [
        ...(isCold
          ? ['Casaco pesado / parka', 'Luvas e gorro', 'Cachecol', 'Calças compridas (3-4)', 'Camisetas térmicas', 'Meias grossas', 'Botas impermeáveis']
          : ['Camisetas leves (5-7)', 'Shorts / bermudas', 'Vestido / roupa de passeio', 'Boné / chapéu']),
        ...(isBeach ? ['Roupa de banho', 'Chinelo', 'Canga / toalha de praia'] : []),
        'Guarda-chuva compacto', 'Tênis confortável', 'Roupa íntima (7+ unidades)',
      ],
    },
    {
      title: 'Higiene & Saúde',
      items: [...(isBeach ? ['Protetor solar', 'Repelente de insetos'] : []), 'Kit de remédios básicos', 'Escova e pasta de dente', 'Shampoo / condicionador (viagem)', 'Desodorante'],
    },
  ];

  packingCategories.forEach(({ title, items }) => {
    checkPage(10 + items.length * 6.2);

    setC(B.white, false);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 16, y);
    y += 6;

    items.forEach(item => {
      checkPage(7);
      setC(B.gray400, false);
      doc.setFontSize(FS_BODY);
      doc.setFont('helvetica', 'normal');
      doc.text(`[ ]  ${item}`, 20, y);
      y += 6.2;
    });

    y += 4;
  });

  // ════════════════════════════════════════
  // EMERGENCY INFO PAGE
  // ════════════════════════════════════════
  addPage();

  setC(B.red, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DE EMERGÊNCIA', 14, y);
  y += 3;
  drawRect(14, y, 50, 0.5, B.red);
  y += 8;

  // Embassy
  const tipsData = getDestTips(trip.destination);
  if (tipsData?.embassy) {
    setC(B.white, false);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Embaixada / Consulado do Brasil', 16, y);
    y += 5;

    doc.setFontSize(FS_SMALL);
    doc.setFont('helvetica', 'normal');
    const embLines = doc.splitTextToSize(tipsData.embassy, pw - 40);
    const embBoxH = Math.max(14, 6 + embLines.length * LH_SMALL);
    drawRect(14, y, pw - 28, embBoxH, B.deep);
    drawRect(14, y, 2, embBoxH, B.emerald);
    setC(B.gray400, false);
    doc.text(embLines, 20, y + 6);
    y += embBoxH + 4;
  }

  // Emergency numbers
  setC(B.white, false);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Números de Emergência', 16, y);
  y += 5;

  const emergencyNum = getEmergencyNumber(trip);
  drawRect(14, y, pw - 28, 14, B.deep);
  drawRect(14, y, 2, 14, B.red);
  setC(B.white, false);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.text(emergencyNum, 20, y + 9);
  y += 18;

  // Insurance
  setC(B.white, false);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Seguro Viagem', 16, y);
  y += 5;

  drawRect(14, y, pw - 28, 18, B.deep);
  drawRect(14, y, 2, 18, B.gold);
  setC(B.gray400, false);
  doc.setFontSize(FS_SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('Operadora: ___________________________________________', 20, y + 6);
  doc.text('Telefone:    ___________________________________________', 20, y + 12);
  y += 22;

  // Emergency contacts
  setC(B.white, false);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Contatos de Emergência', 16, y);
  y += 5;

  drawRect(14, y, pw - 28, 30, B.deep);
  drawRect(14, y, 2, 30, B.horizon);
  setC(B.gray400, false);
  doc.setFontSize(FS_SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('Nome 1:    ___________________________________________', 20, y + 6);
  doc.text('Telefone:   ___________________________________________', 20, y + 12);
  doc.text('Nome 2:    ___________________________________________', 20, y + 20);
  doc.text('Telefone:   ___________________________________________', 20, y + 26);
  y += 34;

  // Important notes
  y += 6;
  setC(B.gray500, false);
  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Ligue para a central do seguro ANTES de ir ao hospital.', 16, y);
  y += 4;
  doc.text('Tenha sempre uma cópia digital dos documentos no celular.', 16, y);

  // ════════════════════════════════════════
  // FINAL FOOTER
  // ════════════════════════════════════════
  y += 12;
  checkPage(20);
  drawRect(14, y, pw - 28, 0.3, B.emerald);
  y += 6;
  setC(B.gray500, false);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Este roteiro foi criado com inteligência artificial e deve ser validado antes da viagem.', 14, y);

  addFooter();

  // ── Save ──
  const safeDest = trip.destination.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : 'viagem';
  doc.save(`KINU_${safeDest}_${dateStr}.pdf`);
}
