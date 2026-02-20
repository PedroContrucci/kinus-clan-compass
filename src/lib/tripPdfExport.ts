// tripPdfExport — Premium PDF with KINU branding
// CRITICAL: NO emoji in PDF text — jsPDF Helvetica does not support Unicode emoji

import jsPDF from 'jspdf';
import type { SavedTrip } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  'paris': {
    'Embarque': 'Saida rumo a Cidade Luz. O voo para Paris dura em media 11 horas direto de Guarulhos.',
    'Chegada': 'Bienvenue a Paris! Mesmo a primeira caminhada pelo bairro do hotel revela a elegancia parisiense — as boulangeries, os cafes nas calcadas e a arquitetura haussmanniana.',
    'Cultura': 'O Louvre merece um dia inteiro, mas se o tempo e curto, foque na ala Denon (Mona Lisa, Venus de Milo). Pela tarde, o Museu dOrsay abriga a maior colecao impressionista do mundo.',
    'Gastronomia': 'Paris e a capital mundial da gastronomia. Dos bistrots classicos de Saint-Germain aos mercados de rua do Marais, cada refeicao e uma celebracao.',
    'Passeios': 'Montmartre e o coracao boemio de Paris. Suba ate a Basilica de Sacre-Coeur para a melhor vista da cidade. Um cruzeiro pelo Sena ao por do sol revela Paris de um angulo inesquecivel.',
    'Retorno': 'Dernier jour! Um cafe final nos Champs-Elysees antes de partir. Bon voyage!',
  },
  'roma': {
    'Embarque': 'Saida rumo a Cidade Eterna. O voo para Roma dura em media 12 horas com conexao.',
    'Chegada': 'Benvenuti a Roma! A cidade milenar revela sua historia a cada esquina — ruinas romanas convivem com trattorias animadas.',
    'Cultura': 'O Coliseu, o Forum Romano e o Palatino formam o coracao da Roma antiga. Construido em 80 d.C., o Coliseu podia receber 50 mil espectadores. O Vaticano, com a Capela Sistina de Michelangelo, e uma experiencia transcendente.',
    'Gastronomia': 'A culinaria romana e simples e genial. Carbonara, cacio e pepe, amatriciana — cada prato e uma aula de sabor com poucos ingredientes. Prove um suppli na rua.',
    'Passeios': 'Trastevere e o bairro mais charmoso de Roma — ruelas de paralelepipedos, fachadas cobertas de hera e cantinas onde os romanos de verdade jantam.',
    'Retorno': 'Ultimo espresso italiano. Arrivederci, Roma!',
  },
  'toquio': {
    'Embarque': 'Saida rumo ao Japao. O voo para Toquio dura em media 24 horas com conexao.',
    'Chegada': 'Yokoso! Toquio impressiona desde o aeroporto — a organizacao, a limpeza e a gentileza japonesa sao impactantes.',
    'Cultura': 'Asakusa e o coracao tradicional de Toquio. O templo Senso-ji, fundado em 645 d.C., e o mais antigo da cidade. O santuario Meiji em Harajuku oferece um oasis de paz.',
    'Gastronomia': 'Toquio tem mais estrelas Michelin que qualquer cidade do mundo. Do sushi no Tsukiji ao ramen em Shinjuku, cada refeicao e uma obra-prima.',
    'Passeios': 'Shibuya, Akihabara, Ginza — cada bairro e um universo. O cruzamento de Shibuya e o mais movimentado do mundo.',
    'Retorno': 'Sayonara! Um ultimo bento no aeroporto de Narita e a despedida perfeita.',
  },
  'londres': {
    'Embarque': 'Saida rumo ao Reino Unido. O voo para Londres dura em media 11 horas direto.',
    'Chegada': 'Welcome to London! A cidade combina historia regia com vanguarda cultural. Dos black cabs aos pubs centenarios, Londres tem uma energia unica.',
    'Cultura': 'O British Museum e gratuito e abriga tesouros de toda a historia humana. A Tower of London guarda as Joias da Coroa e 1.000 anos de historia.',
    'Gastronomia': 'Borough Market e obrigatorio — queijos artesanais, ostras frescas e o melhor fish and chips. Brick Lane oferece o melhor curry fora da India.',
    'Passeios': 'Um passeio pelo Thames Path revela Londres de outra perspectiva — do Big Ben ao Tate Modern, da St Pauls ao Shakespeare Globe.',
    'Retorno': 'Cheerio! Um ultimo afternoon tea antes de partir.',
  },
  'dubai': {
    'Embarque': 'Saida rumo aos Emirados. O voo para Dubai dura em media 14 horas com conexao.',
    'Chegada': 'Ahlan wa sahlan! Dubai impressiona desde a chegada — o skyline futurista com o Burj Khalifa dominando o horizonte.',
    'Cultura': 'Alem do luxo, Dubai guarda historia no bairro Al Fahidi — casas tradicionais com torres de vento, o Creek e os souks de ouro e especiarias.',
    'Gastronomia': 'A culinaria de Dubai e um mosaico do Oriente Medio — shawarma, falafel, machboos. Restaurantes como Al Mallah em Satwa oferecem comida autentica.',
    'Passeios': 'O deserto e tao impressionante quanto a cidade. Um safari com jantar beduino sob as estrelas e uma experiencia transformadora.',
    'Retorno': 'Ma al-salama! Ultimas compras no Dubai Mall antes do voo.',
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
};

// ── Helpers ──

function getDestDescription(destination: string): string {
  const key = destination.toLowerCase().trim();
  if (DESTINATION_DESCRIPTIONS[key]) return DESTINATION_DESCRIPTIONS[key];
  for (const [k, v] of Object.entries(DESTINATION_DESCRIPTIONS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return `${destination} e um destino fascinante que oferece cultura rica, gastronomia autentica e experiencias inesqueciveis. Prepare-se para descobrir monumentos historicos, mercados vibrantes e a hospitalidade local que torna cada viagem unica e especial.`;
}

function getDayNarrative(destination: string, dayTitle: string): string {
  const key = destination.toLowerCase().trim();
  const cleanTitle = dayTitle.replace(/[^\w\sà-úÀ-Ú—·•\-,]/gi, '').trim();

  // Check destination-specific narratives
  for (const [destKey, narratives] of Object.entries(DESTINATION_DAY_NARRATIVES)) {
    if (key.includes(destKey) || destKey.includes(key)) {
      for (const [theme, narrative] of Object.entries(narratives)) {
        if (cleanTitle.toLowerCase().includes(theme.toLowerCase())) return narrative;
      }
    }
  }

  // Fallback to generic
  for (const [theme, narrative] of Object.entries(GENERIC_DAY_NARRATIVES)) {
    if (cleanTitle.toLowerCase().includes(theme.toLowerCase())) return narrative;
  }

  return '';
}

function getDestInfo(destination: string) {
  const key = destination.toLowerCase().trim();
  if (DESTINATION_INFO[key]) return DESTINATION_INFO[key];
  for (const [k, v] of Object.entries(DESTINATION_INFO)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// Remove emojis and special Unicode from text
function cleanText(text: string): string {
  return text.replace(/[^\w\sà-úÀ-Ú—·•\-,.;:!?()\/'"@#$%&*+=<>{}[\]|\\~`^°ºª§¢£¥€]/gi, '').trim();
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

// ── Main Export Function ──

export function exportTripPDF(trip: SavedTrip) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  let y = 0;

  const setC = (rgb: readonly number[], fill = true) => {
    if (fill) doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    else doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color: readonly number[]) => {
    setC(color, true);
    doc.rect(x, yPos, w, h, 'F');
  };

  // Status indicator circle
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
    addPageHeader();
  };

  const checkPage = (needed: number) => {
    if (y + needed > ph - 22) addPage();
  };

  const tierLabels: Record<string, string> = { backpacker: 'Mochileiro', economic: 'Economico', comfort: 'Conforto', luxury: 'Luxo' };
  const tierLabel = tierLabels[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';
  const totalDays = trip.days?.length || 0;

  // ════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════

  // Full page navy background
  drawRect(0, 0, pw, ph, B.night);

  // KINU logotype
  setC(B.white, false);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KINU', pw / 2, 25, { align: 'center' });

  // Subtitle
  setC(B.gray400, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Travel Intelligence', pw / 2, 33, { align: 'center' });

  // Emerald accent line
  drawRect(pw / 2 - 30, 38, 60, 0.6, B.emerald);

  // Gold thin accent
  drawRect(pw / 2 - 20, 40, 40, 0.3, B.gold);

  // Destination
  y = 58;
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

  // Divider
  y += 14;
  drawRect(14, y, pw - 28, 0.3, B.surface);
  y += 10;

  // ── SECTION: Sobre o Destino ──
  setC(B.emerald, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SOBRE O DESTINO', 14, y);
  y += 6;

  setC(B.gray400, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const desc = getDestDescription(trip.destination);
  const descLines = doc.splitTextToSize(desc, pw - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4.2 + 6;

  drawRect(14, y, pw - 28, 0.3, B.surface);
  y += 10;

  // ── SECTION: Resumo Financeiro ──
  checkPage(45);
  setC(B.emerald, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINANCEIRO', 14, y);
  y += 6;

  // Financial box
  const boxH = 34;
  drawRect(14, y, pw - 28, boxH, B.deep);
  drawRect(14, y, 2, boxH, B.emerald); // Left accent

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

  // ── SECTION: Voo & Hospedagem ──
  checkPage(30);
  drawRect(14, y, pw - 28, 0.3, B.surface);
  y += 8;
  setC(B.emerald, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VOO & HOSPEDAGEM', 14, y);
  y += 7;

  // Flight
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

  // Hotel
  if (trip.accommodation) {
    const hotelStatus = trip.accommodation.status === 'confirmed' ? 'Confirmado' : 'Planejado';
    drawStatusDot(16, y - 1, hotelStatus === 'Confirmado' ? B.emerald : B.gold);
    setC(B.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text(`HOTEL: ${trip.accommodation.totalNights} noites  |  Faixa ${tierLabel}`, 20, y);
    y += 5;
    setC(B.gray400, false);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${hotelStatus}  |  R$ ${fmt(trip.accommodation.totalPrice)}`, 20, y);
  }

  addFooter();

  // ════════════════════════════════════════
  // PAGE 2+ — ROTEIRO DIA A DIA
  // ════════════════════════════════════════
  doc.addPage();
  addPageHeader();

  setC(B.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ROTEIRO DIA A DIA', 14, y);
  y += 8;

  (trip.days || []).forEach((day) => {
    checkPage(22);

    // Day header with emerald underline
    drawRect(14, y - 4, pw - 28, 0.3, B.surface);
    y += 2;

    const cleanTitle = cleanText(day.title || '');

    setC(B.white, false);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DIA ${day.day}  —  ${cleanTitle}`, 14, y);

    // Date if available
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

    // Day narrative
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

    // Activities
    (day.activities || []).forEach((act) => {
      checkPage(7);
      const isLogistics = act.category === 'voo' ||
        (act.category === 'hotel' && (act.name?.toLowerCase().includes('check-in') || act.name?.toLowerCase().includes('check-out'))) ||
        act.name?.toLowerCase().includes('transfer');

      // Time
      setC(isLogistics ? B.gray500 : B.white, false);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', isLogistics ? 'italic' : 'normal');
      const timeStr = act.time || '     ';
      doc.text(timeStr, 16, y);

      // Activity name (cleaned of emojis)
      const actName = cleanText(act.name || '');
      doc.text(actName, 30, y);

      // Cost right-aligned with dots
      const priceStr = act.cost > 0 ? `R$ ${fmt(act.cost)}` : '';
      if (priceStr) {
        // Status dot
        if (act.status === 'confirmed') {
          drawStatusDot(pw - 16 - doc.getTextWidth(priceStr) - 4, y - 0.5, B.emerald);
        }
        setC(act.status === 'confirmed' ? B.emerald : B.gray400, false);
        doc.setFont('helvetica', 'bold');
        doc.text(priceStr, pw - 16, y, { align: 'right' });

        // Dotted line
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
    });

    y += 4;
  });

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
  // INFORMACOES UTEIS
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
