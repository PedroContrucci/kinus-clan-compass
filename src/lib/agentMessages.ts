// Agent Messages — Contextual messages for Ícaro, Héstia, Hermes

import type { SavedTrip } from '@/types/trip';

// ─── Ícaro (Explorador) ───

export function getIcarusRoteiro(trip: SavedTrip, dayNum: number): string {
  const totalDays = trip.days?.length || 7;
  const dest = trip.destination || 'o destino';
  const day = trip.days?.find(d => d.day === dayNum);
  const destKey = dest.toLowerCase();
  const theme = day?.title?.replace(/[^\w\sà-ú]/gi, '').trim() || '';

  if (dayNum === 1) return `Boa viagem para ${dest}! Descanse no voo — ajuste o relógio para o fuso local.`;
  if (dayNum === 2 && trip.jetLagMode) return 'Dia leve de adaptação ao fuso. Amanhã você ataca!';
  if (dayNum === 2) return `Primeiro dia em ${dest}! Explore o bairro do hotel.`;
  if (dayNum === totalDays) return `Último dia em ${dest}! Guarde as compras de última hora para o duty free.`;

  // Bangkok-specific
  if (destKey.includes('bangkok')) {
    if (theme.includes('Cultura')) return 'O Grand Palace abre às 8:30 — chegue cedo para evitar filas! Vista calça comprida e ombros cobertos (obrigatório).';
    if (theme.includes('Gastronomia')) return 'Rua Yaowarat (Chinatown) tem o melhor street food de Bangkok. Peça pad thai no Thipsamai — fila de 1h mas vale cada minuto!';
    if (theme.includes('Aventura')) return 'Se for ao mercado flutuante, saia antes das 7h. Após as 10h fica lotado de turistas.';
  }

  // Paris-specific
  if (destKey.includes('paris')) {
    if (theme.includes('Cultura')) return 'Reserve ingressos do Louvre online (15€) — a fila sem reserva passa de 2 horas. Quarta e sexta o museu fica aberto até 21:45!';
    if (theme.includes('Gastronomia')) return 'Evite restaurantes colados em pontos turísticos. Os melhores bistrots ficam nas ruas laterais de Saint-Germain e Le Marais.';
  }

  // Roma-specific
  if (destKey.includes('roma')) {
    if (theme.includes('Cultura')) return 'Compre o Roma Pass (72h/52€) — inclui Coliseu, Fórum e transporte público ilimitado. Economiza tempo e dinheiro!';
    if (theme.includes('Gastronomia')) return 'Regra de ouro em Roma: se o restaurante tem fotos no cardápio, saia correndo. Os melhores são os que só têm lousa na parede.';
  }

  // Tóquio-specific
  if (destKey.includes('toquio') || destKey.includes('tóquio') || destKey.includes('tokyo')) {
    if (theme.includes('Cultura')) return 'O templo Senso-ji em Asakusa abre às 6h — vá cedo para fotos sem multidão. Compre um omikuji (papel da sorte) por ¥100!';
    if (theme.includes('Gastronomia')) return 'Tóquio tem mais estrelas Michelin que qualquer cidade do mundo. Mas o melhor ramen custa ¥900 numa bancada de 8 lugares.';
  }

  // Londres-specific
  if (destKey.includes('londres')) {
    if (theme.includes('Cultura')) return 'O British Museum e o Tate Modern são gratuitos! Reserve o dia inteiro — são dos melhores museus do mundo.';
    if (theme.includes('Gastronomia')) return 'Borough Market é obrigatório. Queijos artesanais, ostras frescas e o melhor fish and chips de Londres.';
  }

  // Generic with more personality
  if (theme.includes('Cultura')) return `Dia de cultura em ${dest}! Dica: museus costumam ter entrada gratuita no primeiro domingo do mês.`;
  if (theme.includes('Gastronomia')) return `Dia gastronômico! Pergunte aos locais onde ELES comem — as melhores experiências raramente estão no TripAdvisor.`;
  if (theme.includes('Aventura')) return `Dia de aventura! Leve protetor solar, água e sapato confortável. Câmera carregada é obrigatório!`;
  if (theme.includes('Passeios')) return `Explore ${dest} hoje! Perca-se nas ruas — as melhores descobertas acontecem quando você sai do mapa.`;
  if (theme.includes('Descobertas')) return `Dia de descobertas em ${dest}! Saia do roteiro turístico e explore bairros alternativos.`;

  return `Aproveite ${dest}! Cada momento conta. Dica: baixe o mapa offline do Google Maps para não depender de internet.`;
}

export function getIcarusGuia(trip: SavedTrip): string {
  const dest = trip.destination || 'o destino';
  return `${dest} é rico em culinária local. Explore mercados e restaurantes de bairro! 🍜`;
}

export function getIcarusHeroFlight(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  if (confirmed) return `Voo confirmado! Agora é só aguardar o embarque para ${dest}. ✈️`;
  return `Voos para ${dest} costumam cair com antecedência. Quer que eu monitore? 📉`;
}

export function getIcarusHeroHotel(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  if (confirmed) return `Hospedagem garantida em ${dest}! Ótima escolha. 🎉`;
  return `Hotéis centrais em ${dest} oferecem melhor custo-benefício. Reserve cedo! 🏨`;
}

export function getIcarusLeilao(): string {
  return 'Quanto mais cedo buscar ofertas, melhores os preços! 🎯';
}

// ─── Héstia (Guardiã Financeira) ───

export function getHestiaFinOps(trip: SavedTrip): string {
  const finances = trip.finances;
  if (!finances) return 'Orçamento montado! Agora é confirmar cada item. 💰';

  const confirmedPct = finances.total > 0 ? Math.round((finances.confirmed / finances.total) * 100) : 0;
  const diff = finances.confirmed - finances.total;

  if (diff > 0) return `⚠️ Atenção: gastos confirmados ultrapassaram a estimativa em R$ ${diff.toLocaleString('pt-BR')}. Revise os custos.`;
  if (confirmedPct >= 90) return 'Quase lá! Sua viagem está praticamente fechada! 🎉';
  if (confirmedPct >= 30) return `Já confirmou ${confirmedPct}% do orçamento. Continue assim! 📊`;
  return 'Orçamento montado! Comece pelo voo — é o maior custo. ✈️';
}

export function getHestiaCambio(trip: SavedTrip): string {
  const currency = (trip as any).destinationCurrency || 'USD';
  const volatileCurrencies = ['ARS', 'TRY', 'EGP', 'COP'];
  const strongCurrencies = ['USD', 'EUR', 'GBP', 'CHF'];

  if (volatileCurrencies.includes(currency)) {
    return `Moedas como ${currency} podem variar muito. Considere levar USD como backup. 💡`;
  }
  if (strongCurrencies.includes(currency)) {
    return `Dica: compre ${currency} aos poucos ao longo das semanas para diluir o risco cambial. 📈`;
  }
  return `Câmbio atualizado. Fique de olho nas tendências do ${currency}. 💱`;
}

export function getHestiaLeilao(): string {
  return 'Cada oferta aceita atualiza seu FinOps automaticamente. 📊';
}

// ─── Hermes (Logístico) ───

export function getHermesChecklist(trip: SavedTrip): string {
  const checklist = trip.checklist || [];
  const total = checklist.length;
  const completed = checklist.filter(i => i.checked).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pending = checklist.filter(i => !i.checked);
  const dest = trip.destination || 'o destino';

  if (pct === 100) return `Tudo pronto! Você está oficialmente preparado para ${dest}! 🎉`;
  if (pct > 70) return `Quase pronto! Só falta: ${pending.slice(0, 2).map(i => i.label).join(', ')}. 💪`;
  if (pct > 30) return `Bom progresso! Faltam ${pending.length} itens. O próximo: ${pending[0]?.label || 'verificar documentos'}. 📋`;
  return 'Muita coisa pendente! Comece pelo passaporte e seguro viagem — são os mais críticos. 🛂';
}

export function getHermesPacking(trip: SavedTrip): string {
  const dest = trip.destination || 'o destino';
  const month = trip.startDate ? new Date(trip.startDate).getMonth() : 6;
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const monthName = monthNames[month];

  // Simple heuristic for climate
  const coldDestinations = ['londres', 'paris', 'berlim', 'praga', 'viena', 'amsterdã', 'dublin', 'zurique', 'budapeste', 'tóquio', 'seul', 'auckland', 'toronto', 'vancouver'];
  const tropicalDestinations = ['bangkok', 'phuket', 'cancún', 'miami', 'dubai', 'singapura', 'rio de janeiro', 'salvador', 'bali', 'malé', 'cartagena'];
  const normalized = dest.toLowerCase();

  const isCold = coldDestinations.some(c => normalized.includes(c)) && (month >= 10 || month <= 2);
  const isTropical = tropicalDestinations.some(c => normalized.includes(c));

  if (isCold) return `${dest} em ${monthName} pede casacos! Não esqueça adaptador de tomada. 🧥`;
  if (isTropical) return `${dest} em ${monthName} é quente! Protetor solar, chapéu e roupas leves. ☀️`;
  return 'Checou a franquia de bagagem da sua companhia aérea? ✈️';
}

