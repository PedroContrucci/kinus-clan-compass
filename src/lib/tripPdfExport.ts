// tripPdfExport — Premium PDF with KINU branding

import jsPDF from 'jspdf';
import type { SavedTrip } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Branding colors (RGB) ──
const C = {
  navy:    [15, 23, 42],
  slate:   [30, 41, 59],
  border:  [51, 65, 85],
  emerald: [16, 185, 129],
  white:   [248, 250, 252],
  muted:   [148, 163, 184],
  amber:   [234, 179, 8],
  sky:     [14, 165, 233],
};

// ── Destination descriptions (no accents — jsPDF Helvetica limitation) ──
const DESTINATION_DESCRIPTIONS: Record<string, string> = {
  'cairo': 'Cairo, capital do Egito, e uma das cidades mais antigas e fascinantes do mundo. Com mais de 20 milhoes de habitantes, a cidade e o coracao cultural do Oriente Medio. As lendarias Piramides de Giza, o Museu Egipcio e o vibrante bazar Khan el-Khalili sao imperdíveis. A culinaria local vai do koshari nas ruas ate sofisticados restaurantes a beira do Nilo.',
  'paris': 'Paris, a Cidade Luz, e sinonimo de arte, gastronomia e romance. Dos cafes de Montmartre a grandiosidade do Louvre, cada bairro conta uma historia. A Torre Eiffel, os Champs-Elysees e Notre-Dame sao apenas o comeco de uma cidade que abriga alguns dos melhores restaurantes e museus do mundo.',
  'roma': 'Roma, a Cidade Eterna, oferece uma jornada atraves de 2.800 anos de historia. Do Coliseu ao Vaticano, da Fontana di Trevi ao Pantheon, cada esquina revela uma obra-prima. A culinaria romana — carbonara, cacio e pepe, suppli — e tao iconica quanto seus monumentos.',
  'toquio': 'Toquio e onde o futuro encontra a tradicao. Templos milenares convivem com arranha-ceus futuristas, e robos servem ramen ao lado de mestres com decadas de pratica. De Shibuya a Asakusa, cada bairro e um mundo proprio com experiencias unicas.',
  'tokyo': 'Tokyo is where the future meets tradition. Centuries-old temples stand beside futuristic skyscrapers, offering a uniquely Japanese blend of innovation and culture. From Shibuya to Asakusa, Akihabara to Harajuku, each neighborhood offers its own world.',
  'londres': 'Londres e uma metropole global que combina historia regia com vanguarda cultural. Do Palacio de Buckingham ao Tate Modern, do Borough Market aos pubs centenarios, a cidade oferece experiencias para todos os gostos e orcamentos em qualquer estacao do ano.',
  'nova york': 'Nova York, a cidade que nunca dorme, e o epicentro cultural do mundo ocidental. Manhattan, Brooklyn, Queens — cada borough tem sua personalidade. De Broadway a Central Park, do MET ao Chelsea Market, a energia desta cidade e verdadeiramente inigualavel.',
  'barcelona': 'Barcelona combina praia, arquitetura e gastronomia como poucas cidades no mundo. As obras de Gaudi — Sagrada Familia, Park Guell, Casa Batllo — definem a paisagem urbana. Las Ramblas, o Bairro Gotico e o Mercado de La Boqueria completam uma experiencia incomparavel.',
  'buenos aires': 'Buenos Aires, o Paris da America do Sul, pulsa com tango, churrasco e cultura. De San Telmo a Palermo, a cidade combina elegancia europeia com energia latina. Os cafes historicos, as casas de tango e a cena gastronomica fazem desta cidade um destino inesquecível.',
  'bangkok': 'Bangkok e um festival sensorial: templos dourados, mercados flutuantes, street food lendaria e uma vida noturna vibrante. Do Grande Palacio ao Wat Pho, de Chinatown a Sukhumvit, a capital tailandesa surpreende a cada esquina com sabores e cores unicas.',
  'dubai': 'Dubai e onde o impossivel se torna realidade. O Burj Khalifa, o Dubai Mall, as ilhas artificiais — tudo e superlativo. Mas alem do luxo, ha o Dubai historico: o Creek, os souks de ouro e especiarias, e a calorosa hospitalidade arabe que conquistam todos os visitantes.',
  'lisboa': 'Lisboa e uma das capitais mais charmosas da Europa. Os bondes historicos sobem as colinas entre miradouros com vistas deslumbrantes. O pasteis de nata, o fado nos bares de Alfama e os azulejos nas fachadas criam uma atmosfera unica que mistura nostalgia e modernidade.',
  'amsterdam': 'Amsterdam encanta com seus canais, bicicletas e museus de classe mundial. O Rijksmuseum, o Museu Van Gogh e a Casa de Anne Frank estao a uma pedalada de distancia. A cidade e conhecida por sua tolerancia, vida noturna animada e mercados flutuantes coloridos.',
  'tóquio': 'Toquio e onde o futuro encontra a tradicao. Templos milenares convivem com arranha-ceus futuristas, e a culinaria japonesa — do sushi ao ramen — eleva qualquer refeicao a uma experiencia memoravel. De Shibuya a Asakusa, cada bairro oferece um mundo proprio.',
};

function getDestDescription(destination: string): string {
  const key = destination.toLowerCase().trim();
  if (DESTINATION_DESCRIPTIONS[key]) return DESTINATION_DESCRIPTIONS[key];
  for (const [k, v] of Object.entries(DESTINATION_DESCRIPTIONS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return `${destination} e um destino fascinante que oferece cultura rica, gastronomia autentica e experiencias inesqueciveis. Prepare-se para descobrir monumentos historicos, mercados vibrantes e a hospitalidade local que torna cada viagem unica e especial.`;
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function exportTripPDF(trip: SavedTrip) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();  // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  let y = 0;

  const setColor = (rgb: number[], fill = true) => {
    if (fill) doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    else doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color: number[]) => {
    setColor(color, true);
    doc.rect(x, yPos, w, h, 'F');
  };

  const addFooter = () => {
    setColor(C.muted, false);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    doc.text('KINU — Travel Intelligence', 14, ph - 8);
    doc.text(`Gerado em ${today}  |  kinu.travel`, pw - 14, ph - 8, { align: 'right' });
    // Footer line
    drawRect(14, ph - 12, pw - 28, 0.3, C.border);
  };

  const addPage = () => {
    addFooter();
    doc.addPage();
    // Thin navy header bar on new pages
    drawRect(0, 0, pw, 10, C.navy);
    setColor(C.muted, false);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('KINU', 14, 6.5);
    setColor(C.muted, false);
    doc.setFont('helvetica', 'normal');
    doc.text(`${trip.destination.toUpperCase()} — Roteiro`, pw - 14, 6.5, { align: 'right' });
    y = 18;
  };

  const checkPage = (needed: number) => {
    if (y + needed > ph - 20) addPage();
  };

  // ════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════

  // Navy header (45mm)
  drawRect(0, 0, pw, 45, C.navy);

  // KINU logotype
  setColor(C.white, false);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('KINU', pw / 2, 20, { align: 'center' });

  // Subtitle
  setColor(C.muted, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Travel Intelligence', pw / 2, 28, { align: 'center' });

  // Emerald accent line
  drawRect(14, 47, pw - 28, 0.6, C.emerald);

  // Destination
  y = 60;
  setColor(C.white, false);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const destTitle = `${trip.destination.toUpperCase()}, ${(trip.country || '').toUpperCase()}`;
  doc.text(destTitle, pw / 2, y, { align: 'center' });

  y += 9;
  setColor(C.muted, false);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const dateRange = trip.startDate && trip.endDate
    ? `${format(new Date(trip.startDate), "dd MMM yyyy", { locale: ptBR })} – ${format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}`
    : '';
  const totalDays = trip.days?.length || 0;
  const tierLabels: Record<string, string> = { backpacker: 'Mochileiro', economic: 'Economico', comfort: 'Conforto', luxury: 'Luxo' };
  const tierLabel = tierLabels[(trip as any).budgetTier || trip.budgetType || 'comfort'] || 'Conforto';

  doc.text(dateRange, pw / 2, y, { align: 'center' });
  y += 6;
  doc.text(`${totalDays} dias  •  ${trip.travelers} viajante(s)  •  Faixa ${tierLabel}`, pw / 2, y, { align: 'center' });

  // Divider
  y += 10;
  drawRect(14, y, pw - 28, 0.3, C.border);
  y += 8;

  // ── SECTION: Sobre o Destino ──
  setColor(C.emerald, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SOBRE O DESTINO', 14, y);
  y += 5;

  setColor(C.muted, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const desc = getDestDescription(trip.destination);
  const descLines = doc.splitTextToSize(desc, pw - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4.5;

  y += 5;
  drawRect(14, y, pw - 28, 0.3, C.border);
  y += 8;

  // ── SECTION: Resumo Financeiro ──
  setColor(C.emerald, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINANCEIRO', 14, y);
  y += 5;

  // Box with slate background
  const boxH = 32;
  drawRect(14, y, pw - 28, boxH, C.slate);
  drawRect(14, y, 2, boxH, C.emerald); // Left accent bar

  const finData = [
    { label: 'Orcamento total', value: `R$ ${fmt(trip.finances?.total || trip.budget || 0)}`, color: C.white },
    { label: 'Confirmado', value: `R$ ${fmt(trip.finances?.confirmed || 0)}`, color: C.emerald },
    { label: 'Planejado', value: `R$ ${fmt(trip.finances?.planned || 0)}`, color: C.amber },
    { label: 'Disponivel', value: `R$ ${fmt(Math.max(0, trip.finances?.available || 0))}`, color: C.muted },
  ];

  let finY = y + 6;
  finData.forEach(({ label, value, color }) => {
    setColor(C.muted, false);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, finY);
    setColor(color, false);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pw - 18, finY, { align: 'right' });
    finY += 6.5;
  });

  y += boxH + 8;

  // ── SECTION: Voo & Hospedagem ──
  setColor(C.emerald, false);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VOO & HOSPEDAGEM', 14, y);
  y += 5;

  const originCode = trip.flights?.outbound?.origin || 'GRU';
  const destCode = trip.flights?.outbound?.destination || trip.destination;
  const flightStatus = trip.flights?.outbound?.status === 'confirmed' ? 'Confirmado' : 'Planejado';
  const flightPrice = (trip.flights?.outbound?.price || 0) + (trip.flights?.return?.price || 0);

  setColor(C.white, false);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Voo: ${originCode} > ${destCode} > ${originCode}`, 14, y);
  y += 5;
  setColor(C.muted, false);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${flightStatus}  •  R$ ${fmt(flightPrice)}`, 14, y);
  y += 6;

  if (trip.accommodation) {
    const hotelStatus = trip.accommodation.status === 'confirmed' ? 'Confirmado' : 'Planejado';
    setColor(C.white, false);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hotel: ${trip.accommodation.totalNights} noites  •  Faixa ${tierLabel}`, 14, y);
    y += 5;
    setColor(C.muted, false);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${hotelStatus}  •  R$ ${fmt(trip.accommodation.totalPrice)}`, 14, y);
  }

  // Footer on page 1
  addFooter();

  // ════════════════════════════════════════
  // PAGE 2+ — ROTEIRO
  // ════════════════════════════════════════
  doc.addPage();
  // Thin navy bar on page 2
  drawRect(0, 0, pw, 10, C.navy);
  setColor(C.muted, false);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('KINU', 14, 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${trip.destination.toUpperCase()} — Roteiro`, pw - 14, 6.5, { align: 'right' });
  y = 18;

  // Section header
  setColor(C.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ROTEIRO DIA A DIA', 14, y);
  y += 8;

  (trip.days || []).forEach((day) => {
    checkPage(16);

    // Day header
    drawRect(14, y - 4, pw - 28, 0.3, C.border);
    y += 2;

    setColor(C.white, false);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`DIA ${day.day}  —  ${day.title}`, 14, y);

    // Emerald underline
    drawRect(14, y + 1.5, 40, 0.4, C.emerald);
    y += 7;

    (day.activities || []).forEach((act) => {
      checkPage(6);
      const isLogistics = act.category === 'voo' ||
        (act.category === 'hotel' && (act.name?.toLowerCase().includes('check-in') || act.name?.toLowerCase().includes('check-out')));

      setColor(isLogistics ? C.muted : C.white, false);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', isLogistics ? 'italic' : 'normal');

      // Time
      const timeStr = act.time ? `${act.time}` : '     ';
      doc.text(timeStr, 14, y);

      // Name with dots to price
      const actName = act.name || '';
      const priceStr = act.cost > 0 ? `R$ ${fmt(act.cost)}` : (act.cost === 0 ? 'Gratis' : '');

      if (priceStr) {
        // Activity name
        doc.text(actName, 28, y);
        // Price right-aligned
        setColor(act.status === 'confirmed' ? C.emerald : C.muted, false);
        doc.setFont('helvetica', 'bold');
        doc.text(priceStr, pw - 14, y, { align: 'right' });
        // Dotted line
        setColor(C.border, false);
        doc.setFont('helvetica', 'normal');
        const nameWidth = doc.getTextWidth(actName) + 30;
        const priceWidth = doc.getTextWidth(priceStr) + 2;
        const dotStart = nameWidth + 2;
        const dotEnd = pw - 14 - priceWidth - 2;
        if (dotEnd > dotStart + 4) {
          doc.setLineDashPattern([0.5, 1.5], 0);
          doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
          doc.setLineWidth(0.2);
          doc.line(dotStart, y - 0.5, dotEnd, y - 0.5);
          doc.setLineDashPattern([], 0);
        }
      } else {
        doc.text(actName, 28, y);
      }

      setColor(C.white, false);
      doc.setFont('helvetica', 'normal');
      y += 5;
    });

    y += 3;
  });

  // ════════════════════════════════════════
  // CHECKLIST
  // ════════════════════════════════════════
  checkPage(20);
  drawRect(14, y - 2, pw - 28, 0.3, C.border);
  y += 6;

  setColor(C.emerald, false);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHECKLIST DE PREPARACAO', 14, y);
  y += 8;

  (trip.checklist || []).forEach((item) => {
    checkPage(6);
    const box = item.checked ? '[x]' : '[ ]';
    setColor(item.checked ? C.emerald : C.muted, false);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${box}  ${item.label}`, 16, y);
    y += 5.5;
  });

  // Final footer
  addFooter();

  // ── Save ──
  const safeDest = trip.destination.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = trip.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : 'viagem';
  doc.save(`KINU_${safeDest}_${dateStr}.pdf`);
}
