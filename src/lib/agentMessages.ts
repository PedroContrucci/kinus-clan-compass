// Agent Messages — Contextual messages with destination + interest intelligence

import type { SavedTrip } from '@/types/trip';
import { tripTimezone } from '@/lib/timezone';

// ─── Ícaro (Explorador/Roteiro) ───

export function getIcarusRoteiro(trip: SavedTrip, dayNum: number): string {
  const dest = trip.destination?.toLowerCase() || '';
  const interests = trip.travelInterests || [];
  const day = trip.days?.find(d => d.day === dayNum);
  const totalDays = trip.days?.length || 7;
  const theme = (day?.title || '').replace(/[^\w\sà-ú]/gi, '').trim().toLowerCase();

  if (dayNum === 1) return `Boa viagem! Ajuste o relógio para o fuso local durante o voo.`;

  if (dayNum === 2 && trip.jetLagMode) {
    const severity = trip.jetLagSeverity || 'MODERADO';
    const tz = tripTimezone(trip);
    const diff = tz.tzKnown ? `de ${String(Math.abs(tz.diff)).replace('.', ',')}h` : 'a confirmar';
    if (severity === 'SEVERO') return `Fuso ${diff} e severo. Hoje é só descanso — seu corpo precisa. Amanhã começaremos devagar.`;
    if (severity === 'ALTO') return `Fuso ${diff} e significativo. Dia leve hoje: descanse até 15h, passeio leve ao pôr do sol.`;
    return `Fuso ${diff}. Dia de adaptação leve — explore o bairro do hotel e jante cedo!`;
  }

  if (dayNum === 3 && trip.jetLagSeverity === 'SEVERO') {
    return `Segundo dia pós-fuso severo. Corpo em adaptação — aproveite 70% do ritmo normal. Beba água!`;
  }

  if (dayNum === 2) return `Primeiro dia em ${trip.destination}! Explore o bairro do hotel.`;
  if (dayNum === totalDays) return `Último dia em ${trip.destination}! Guarde compras de última hora para o duty free.`;

  const tips = getDestinationTips(dest, theme, interests);
  if (tips) return tips;

  if (interests.includes('gastronomy') && theme.includes('gastro')) {
    return `Dia gastronômico! Regra de ouro: se o local só tem turistas, saia correndo. Pergunte ao concierge do hotel onde os locais comem.`;
  }
  if (interests.includes('beach') && (theme.includes('praia') || theme.includes('beach'))) {
    return `Dia de praia! Chegue cedo para garantir bom lugar. Protetor solar, chapéu e água são obrigatórios.`;
  }
  if (interests.includes('history') && theme.includes('cultur')) {
    return `Dia cultural! Compre ingressos online com antecedência — museus populares costumam esgotar.`;
  }
  if (interests.includes('adventure') && theme.includes('aventur')) {
    return `Dia de aventura! Use calçado fechado, leve água extra e carregue o celular na noite anterior.`;
  }

  if (theme.includes('cultur')) return `Dia de cultura em ${trip.destination}! Dica: museus costumam ter entrada gratuita no primeiro domingo do mês.`;
  if (theme.includes('gastro')) return `Dia gastronômico! Pergunte aos locais onde ELES comem — as melhores experiências raramente estão no TripAdvisor.`;
  if (theme.includes('aventur')) return `Dia de aventura! Leve protetor solar, água e sapato confortável. Câmera carregada é obrigatória!`;
  if (theme.includes('passeio')) return `Explore ${trip.destination} hoje! Perca-se nas ruas — as melhores descobertas acontecem quando você sai do mapa.`;
  if (theme.includes('descober')) return `Dia de descobertas em ${trip.destination}! Saia do roteiro turístico e explore bairros alternativos.`;

  return `Aproveite ${trip.destination}! Cada momento conta. Dica: baixe o mapa offline do Google Maps para não depender de internet.`;
}

function getDestinationTips(dest: string, theme: string, interests: string[]): string | null {
  if (dest.includes('bangkok')) {
    if (theme.includes('cultur')) return 'Grand Palace abre às 8:30 — chegue cedo! Obrigatório: calças compridas e ombros cobertos. Leve roupa extra na bolsa.';
    if (theme.includes('gastro')) return 'Rua Yaowarat (Chinatown) tem o melhor street food. Pad thai no Thipsamai — fila de 1h mas vale cada minuto!';
    if (theme.includes('aventur') || theme.includes('passeio')) return 'Mercado flutuante: saia antes das 7h, após as 10h fica lotado. Leve repelente!';
    if (theme.includes('descober')) return 'Charoen Krung é o bairro mais criativo de Bangkok. Galerias, cafés artesanais e rooftop bars escondidos.';
  }
  if (dest.includes('phuket')) {
    if (theme.includes('praia') || theme.includes('passeio')) return 'Freedom Beach é a praia mais bonita de Phuket — só acessível de longtail boat. Negocie R$50 ida/volta.';
    if (theme.includes('aventur')) return 'Phi Phi Islands: saia de Phuket às 7h para evitar multidões. Maya Bay limita visitantes, reserve online!';
    if (theme.includes('gastro')) return 'Mercado noturno de Chillva tem o melhor mee hokkien e oh tao (ostra frita) de Phuket. Preços locais!';
    if (theme.includes('descober') || theme.includes('cultur')) return 'Old Phuket Town: ruas Thalang e Soi Romanee têm grafites, cafés artesanais e a arquitetura sino-portuguesa mais bonita da Tailândia.';
  }
  if (dest.includes('paris')) {
    if (theme.includes('cultur')) return 'Louvre: reserve online (17EUR). Quarta e sexta fica aberto até 21:45 — vá à noite para evitar multidões!';
    if (theme.includes('gastro')) return 'Evite restaurantes colados em pontos turísticos. Os melhores bistrots estão nas ruas laterais de Saint-Germain e Le Marais.';
    if (theme.includes('passeio')) return 'Trocadéro ao pôr do sol é o melhor ângulo para fotos da Eiffel. Chegue 30min antes do sunset!';
  }
  if (dest.includes('roma')) {
    if (theme.includes('cultur')) return 'Roma Pass (72h, 52EUR) inclui Coliseu, Fórum e transporte ilimitado. Compre online — economiza tempo e dinheiro!';
    if (theme.includes('gastro')) return 'Regra de ouro em Roma: se o restaurante tem fotos no cardápio, saia correndo. Os melhores só têm lousa na parede.';
    if (theme.includes('passeio')) return 'Fontana di Trevi às 7h da manhã: só você e a fonte. Depois das 10h fica impossível tirar foto.';
  }
  if (dest.includes('toqu') || dest.includes('tokyo')) {
    if (theme.includes('cultur')) return 'Senso-ji em Asakusa: vá às 6h antes da multidão. O Nakamise-dori sem turistas é uma experiência diferente!';
    if (theme.includes('gastro')) return 'Tsukiji Outer Market para sushi no café da manhã. Ramen em Shinjuku: Fuunji tem a fila mais longa por um motivo!';
    if (theme.includes('passeio')) return 'Shibuya Crossing: vá ao Starbucks no 2º andar do TSUTAYA para a melhor vista. Grátis!';
  }
  if (dest.includes('londres')) {
    if (theme.includes('cultur')) return 'British Museum é gratuito e infinito. Foque na ala egípcia e nos mármores do Partenon. 3h é o mínimo.';
    if (theme.includes('gastro')) return 'Borough Market abre às 10h, mas os melhores vendedores esgotam até 13h. Vá cedo e com fome!';
  }
  if (dest.includes('dubai')) {
    if (theme.includes('cultur')) return 'Al Fahidi Historic District: casas com torres de vento do século XIX. Entrada gratuita. O melhor segredo de Dubai.';
    if (theme.includes('aventur')) return 'Safari no deserto: reserve o passeio das 15h para ver o pôr do sol sobre as dunas. Jantar beduíno incluso.';
  }
  return null;
}

// Insight do roteiro para o Painel
export function getIcarusRoteiroInsight(trip: SavedTrip): string {
  const interests = trip.travelInterests || [];
  const dest = trip.destination || 'o destino';
  const totalActivities = trip.days?.reduce((sum, d) => sum + (d.activities?.length || 0), 0) || 0;
  const confirmedCount = trip.days?.reduce((sum, d) => sum + (d.activities?.filter(a => a.status === 'confirmed').length || 0), 0) || 0;

  if (confirmedCount === totalActivities && totalActivities > 0) {
    return `Roteiro 100% confirmado! ${totalActivities} atividades em ${trip.days?.length || 0} dias.`;
  }
  if (interests.includes('gastronomy')) {
    return `Seu roteiro em ${dest} tem foco gastronômico. Reserve restaurantes populares com antecedência!`;
  }
  if (interests.includes('beach')) {
    return `${dest} tem praias incríveis no roteiro! Leve protetor solar e reserve passeios de barco cedo.`;
  }
  if (interests.includes('culture') || interests.includes('history')) {
    return `Roteiro cultural em ${dest}! Compre ingressos online para museus — economiza filas e dinheiro.`;
  }
  return `Roteiro em ${dest} com ${totalActivities} atividades em ${trip.days?.length || 0} dias. Revise e confirme os passeios!`;
}

export function getIcarusGuia(trip: SavedTrip): string {
  return `${trip.destination || 'O destino'} é rico em culinária local. Explore mercados e restaurantes de bairro!`;
}

export function getIcarusLeilao(): string { return 'Quanto mais cedo buscar ofertas, melhores os preços!'; }

export function getIcarusHeroFlight(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  if (confirmed) return `Voo confirmado para ${dest}!`;
  return `Voos para ${dest} costumam cair com antecedência. Quer que eu monitore?`;
}

export function getIcarusHeroHotel(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  const hotelName = trip.accommodation?.name || '';
  const neighborhood = trip.accommodation?.neighborhood || '';
  const description = trip.accommodation?.description || '';
  const stars = trip.accommodation?.stars || 3;

  if (confirmed) {
    return hotelName ? `${hotelName.split(' — ')[0]} confirmado! ${stars}★` : `Hotel confirmado em ${dest}!`;
  }

  if (hotelName && !hotelName.startsWith('Hotel em')) {
    return `Sugestão: ${hotelName.split(' — ')[0]} em ${neighborhood || dest} — ${stars}★. ${description}`;
  }

  if (neighborhood) {
    return `Recomendo hotéis em ${neighborhood} — combina com seu perfil de viagem!`;
  }

  return `Reserve o hotel em ${dest}. Hotéis centrais oferecem melhor custo-benefício.`;
}

// ─── Héstia (Financeiro/Câmbio) ───

export function getHestiaFinOps(trip: SavedTrip): string {
  const finances = trip.finances;
  if (!finances) return 'Orçamento montado! Agora é confirmar cada item.';
  const confirmedPct = finances.total > 0 ? Math.round((finances.confirmed / finances.total) * 100) : 0;
  const diff = finances.confirmed - finances.total;
  if (diff > 0) return `Atenção: gastos confirmados ultrapassaram a estimativa em R$ ${diff.toLocaleString('pt-BR')}. Revise os custos.`;
  if (confirmedPct >= 90) return `Quase lá! ${confirmedPct}% do orçamento confirmado. Viagem praticamente fechada!`;
  if (confirmedPct >= 30) return `Já confirmou ${confirmedPct}% do orçamento. Próximo passo: confirmar o ${!trip.flights?.outbound?.status ? 'voo' : 'hotel'}.`;
  return 'Orçamento montado! Comece pelo voo — é o maior custo e quanto antes, melhor o preço.';
}

export function getHestiaCambio(trip: SavedTrip): string {
  const currency = getDestinationCurrencyForTip(trip);

  // Domestic Brazil trips: no currency-pacing advice, show a budget-pacing tip instead
  if (currency === 'BRL') {
    return 'Viagem nacional! Separe um valor fixo por mês e pague no cartão que acumula milhas.';
  }

  const volatile = ['ARS', 'TRY', 'EGP', 'COP'];
  const strong = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
  if (volatile.includes(currency)) return `${currency} é volátil. Considere levar USD como backup e comprar moeda local gradualmente.`;
  if (strong.includes(currency)) return `Compre ${currency} aos poucos ao longo das semanas para diluir o risco cambial.`;
  return `Câmbio atualizado. Fique de olho nas tendências do ${currency}.`;
}

function getDestinationCurrencyForTip(trip: SavedTrip): string {
  const explicit = (trip as any).destinationCurrency as string | undefined;
  const destination = (trip.destination || '').toLowerCase().trim();
  const country = (trip.country || '').toLowerCase().trim();

  if (country.includes('brasil')) return 'BRL';

  const cityCurrency: Record<string, string> = {
    'paris': 'EUR', 'roma': 'EUR', 'amsterdam': 'EUR', 'barcelona': 'EUR',
    'madri': 'EUR', 'berlim': 'EUR', 'viena': 'EUR', 'atenas': 'EUR',
    'lisboa': 'EUR', 'londres': 'GBP', 'tóquio': 'JPY', 'tokyo': 'JPY',
    'nova york': 'USD', 'miami': 'USD', 'orlando': 'USD', 'los angeles': 'USD',
    'bangkok': 'THB', 'buenos aires': 'ARS', 'santiago': 'CLP',
    'toronto': 'CAD', 'sydney': 'AUD', 'dubai': 'AED', 'seul': 'KRW',
  };

  if (cityCurrency[destination]) return cityCurrency[destination];

  const normalized = destination.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [city, currency] of Object.entries(cityCurrency)) {
    const cityNA = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized === cityNA || normalized.includes(cityNA) || cityNA.includes(normalized)) {
      return currency;
    }
  }

  return explicit || 'USD';
}

export function getHestiaLeilao(): string { return 'Cada oferta aceita atualiza seu FinOps automaticamente.'; }

// ─── Hermes (Logística/Preparação) ───

export function getHermesChecklist(trip: SavedTrip): string {
  const checklist = trip.checklist || [];
  const total = checklist.length;
  const completed = checklist.filter(i => i.checked).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = checklist.filter(i => !i.checked);
  if (pct === 100) return `Tudo pronto para ${trip.destination}! Checklist completo.`;
  if (pct > 70) return `Quase pronto! Faltam: ${pending.slice(0, 2).map(i => i.label).join(', ')}.`;
  if (pct > 30) return `Bom progresso (${pct}%). Próximo: ${pending[0]?.label || 'verificar documentos'}.`;
  return 'Muita coisa pendente! Comece pelo passaporte e seguro viagem — são os mais críticos.';
}

function getAdapterTip(dest: string): string {
  const uk = ['londres', 'london', 'edimburgo', 'dublin'];
  const eu = ['paris', 'roma', 'barcelona', 'madrid', 'berlim', 'amsterdam', 'praga', 'viena', 'atenas', 'lisboa', 'istambul'];
  const us = ['nova york', 'miami', 'orlando', 'los angeles', 'las vegas', 'toronto', 'cancun', 'sao francisco'];
  const asia = ['toquio', 'tokyo', 'kyoto', 'seul', 'bangkok', 'phuket', 'singapura', 'bali'];
  const aus = ['sydney', 'auckland'];
  const d = dest.toLowerCase();
  if (uk.some(c => d.includes(c))) return 'Adaptador tipo G (três pinos retangulares)';
  if (eu.some(c => d.includes(c))) return 'Adaptador tipo C/F (dois pinos redondos)';
  if (us.some(c => d.includes(c))) return 'Adaptador tipo A/B (dois pinos chatos)';
  if (asia.some(c => d.includes(c))) return 'Adaptador universal recomendado';
  if (aus.some(c => d.includes(c))) return 'Adaptador tipo I (três pinos angulados)';
  return 'Leve adaptador universal';
}

export function getHermesPacking(trip: SavedTrip): string {
  const dest = (trip.destination || '').toLowerCase();
  const severity = trip.jetLagSeverity;

  if (severity === 'SEVERO') {
    return `Fuso severo para ${trip.destination}! Leve: melatonina, máscara de dormir, tampões de ouvido. ${getAdapterTip(dest)}.`;
  }
  if (severity === 'ALTO') {
    return `Fuso alto para ${trip.destination}. Leve máscara de dormir e snacks leves para o voo. ${getAdapterTip(dest)}.`;
  }

  const cold = ['londres', 'paris', 'berlim', 'praga', 'viena', 'toquio', 'seul', 'toronto'];
  const tropical = ['bangkok', 'phuket', 'cancun', 'miami', 'dubai', 'singapura', 'bali', 'cartagena'];
  if (cold.some(c => dest.includes(c))) return `${trip.destination} pede casacos! Não esqueça adaptador de tomada.`;
  if (tropical.some(c => dest.includes(c))) return `${trip.destination} é quente! Protetor solar, chapéu e roupas leves.`;
  return 'Checou a franquia de bagagem da sua companhia aérea?';
}

export function getHermesHotelInsight(trip: SavedTrip): string {
  const zone = (trip.accommodation as any)?.neighborhood;
  const desc = (trip.accommodation as any)?.description;
  if (zone && desc) return `Hotel em ${zone}: ${desc}`;
  return 'Dica: hotéis centrais economizam tempo e transporte. Priorize localização sobre estrelas!';
}

// ─── Biology AI Insight ───

export function getBiologyAIInsight(trip: SavedTrip): string {
  const severity = trip.jetLagSeverity;
  const tz = tripTimezone(trip);
  const diff = tz.tzKnown ? `de ${String(Math.abs(tz.diff)).replace('.', ',')}h` : 'a confirmar';
  const dest = trip.destination || '';

  if (!severity || severity === 'BAIXO') {
    return `${dest} tem fuso similar ao Brasil. Sem necessidade de adaptação — roteiro completo desde o dia 1!`;
  }
  if (severity === 'MODERADO') {
    return `Fuso ${diff} para ${dest}. Impacto moderado — dia 1 será leve, a partir do dia 2 roteiro completo.`;
  }
  if (severity === 'ALTO') {
    return `Fuso ${diff} para ${dest}. Impacto alto no corpo. Dias 1-2 com atividades reduzidas. Hidratação é fundamental!`;
  }
  return `Alerta: fuso ${diff} para ${dest}. Protocolo severo ativado: dia 1 = descanso total, dia 2 = leve, dia 3 = 70%. Seu corpo agradece!`;
}
