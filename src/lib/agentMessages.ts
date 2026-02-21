// Agent Messages — Contextual messages with destination + interest intelligence

import type { SavedTrip } from '@/types/trip';

// ─── Ícaro (Explorador/Roteiro) ───

export function getIcarusRoteiro(trip: SavedTrip, dayNum: number): string {
  const dest = trip.destination?.toLowerCase() || '';
  const interests = trip.travelInterests || [];
  const day = trip.days?.find(d => d.day === dayNum);
  const totalDays = trip.days?.length || 7;
  const theme = (day?.title || '').replace(/[^\w\sà-ú]/gi, '').trim().toLowerCase();

  if (dayNum === 1) return `Boa viagem! Ajuste o relogio para o fuso local durante o voo.`;
  if (dayNum === 2 && trip.jetLagMode) return 'Dia leve de adaptacao ao fuso. Amanha voce ataca!';
  if (dayNum === 2) return `Primeiro dia em ${trip.destination}! Explore o bairro do hotel.`;
  if (dayNum === totalDays) return `Ultimo dia em ${trip.destination}! Guarde compras de ultima hora para o duty free.`;

  const tips = getDestinationTips(dest, theme, interests);
  if (tips) return tips;

  if (interests.includes('gastronomy') && theme.includes('gastro')) {
    return `Dia gastronomico! Regra de ouro: se o local so tem turistas, saia correndo. Pergunte ao concierge do hotel onde os locais comem.`;
  }
  if (interests.includes('beach') && (theme.includes('praia') || theme.includes('beach'))) {
    return `Dia de praia! Chegue cedo para garantir bom lugar. Protetor solar, chapeu e agua sao obrigatorios.`;
  }
  if (interests.includes('history') && theme.includes('cultur')) {
    return `Dia cultural! Compre ingressos online com antecedencia — museus populares costumam esgotar.`;
  }
  if (interests.includes('adventure') && theme.includes('aventur')) {
    return `Dia de aventura! Use calcado fechado, leve agua extra e carregue o celular na noite anterior.`;
  }

  if (theme.includes('cultur')) return `Dia de cultura em ${trip.destination}! Dica: museus costumam ter entrada gratuita no primeiro domingo do mes.`;
  if (theme.includes('gastro')) return `Dia gastronomico! Pergunte aos locais onde ELES comem — as melhores experiencias raramente estao no TripAdvisor.`;
  if (theme.includes('aventur')) return `Dia de aventura! Leve protetor solar, agua e sapato confortavel. Camera carregada e obrigatorio!`;
  if (theme.includes('passeio')) return `Explore ${trip.destination} hoje! Perca-se nas ruas — as melhores descobertas acontecem quando voce sai do mapa.`;
  if (theme.includes('descober')) return `Dia de descobertas em ${trip.destination}! Saia do roteiro turistico e explore bairros alternativos.`;

  return `Aproveite ${trip.destination}! Cada momento conta. Dica: baixe o mapa offline do Google Maps para nao depender de internet.`;
}

function getDestinationTips(dest: string, theme: string, interests: string[]): string | null {
  if (dest.includes('bangkok')) {
    if (theme.includes('cultur')) return 'Grand Palace abre as 8:30 — chegue cedo! Obrigatorio: calcas compridas e ombros cobertos. Leve roupa extra na bolsa.';
    if (theme.includes('gastro')) return 'Rua Yaowarat (Chinatown) tem o melhor street food. Pad thai no Thipsamai — fila de 1h mas vale cada minuto!';
    if (theme.includes('aventur') || theme.includes('passeio')) return 'Mercado flutuante: saia antes das 7h, apos as 10h fica lotado. Leve repelente!';
    if (theme.includes('descober')) return 'Charoen Krung e o bairro mais criativo de Bangkok. Galerias, cafes artesanais e rooftop bars escondidas.';
  }
  if (dest.includes('phuket')) {
    if (theme.includes('praia') || theme.includes('passeio')) return 'Freedom Beach e a praia mais bonita de Phuket — so acessivel de longtail boat. Negocie R$50 ida/volta.';
    if (theme.includes('aventur')) return 'Phi Phi Islands: saia de Phuket as 7h para evitar multidoes. Maya Bay limita visitantes, reserve online!';
    if (theme.includes('gastro')) return 'Mercado noturno de Chillva tem o melhor mee hokkien e oh tao (ostra frita) de Phuket. Precos locais!';
    if (theme.includes('descober') || theme.includes('cultur')) return 'Old Phuket Town: ruas Thalang e Soi Romanee tem grafites, cafes artesanais e a arquitetura sino-portuguesa mais bonita da Tailandia.';
  }
  if (dest.includes('paris')) {
    if (theme.includes('cultur')) return 'Louvre: reserve online (17EUR). Quarta e sexta fica aberto ate 21:45 — va a noite para evitar multidoes!';
    if (theme.includes('gastro')) return 'Evite restaurantes colados em pontos turisticos. Os melhores bistrots estao nas ruas laterais de Saint-Germain e Le Marais.';
    if (theme.includes('passeio')) return 'Trocadero ao por do sol e o melhor angulo para fotos da Eiffel. Chegue 30min antes do sunset!';
  }
  if (dest.includes('roma')) {
    if (theme.includes('cultur')) return 'Roma Pass (72h, 52EUR) inclui Coliseu, Forum e transporte ilimitado. Compre online — economiza tempo e dinheiro!';
    if (theme.includes('gastro')) return 'Regra de ouro em Roma: se o restaurante tem fotos no cardapio, saia correndo. Os melhores so tem lousa na parede.';
    if (theme.includes('passeio')) return 'Fontana di Trevi as 7h da manha: so voce e a fonte. Depois das 10h fica impossivel tirar foto.';
  }
  if (dest.includes('toqu') || dest.includes('tokyo')) {
    if (theme.includes('cultur')) return 'Senso-ji em Asakusa: va as 6h antes da multidao. O Nakamise-dori sem turistas e uma experiencia diferente!';
    if (theme.includes('gastro')) return 'Tsukiji Outer Market para sushi no cafe da manha. Ramen em Shinjuku: Fuunji tem a fila mais longa por um motivo!';
    if (theme.includes('passeio')) return 'Shibuya Crossing: va ao Starbucks no 2o andar do TSUTAYA para a melhor vista. Gratis!';
  }
  if (dest.includes('londres')) {
    if (theme.includes('cultur')) return 'British Museum e gratuito e infinito. Foque na ala egipcia e nos marmores do Partenon. 3h e o minimo.';
    if (theme.includes('gastro')) return 'Borough Market abre as 10h, mas os melhores vendedores esgotam ate 13h. Va cedo e com fome!';
  }
  if (dest.includes('dubai')) {
    if (theme.includes('cultur')) return 'Al Fahidi Historic District: casas com torres de vento do seculo XIX. Entrada gratuita. O melhor segredo de Dubai.';
    if (theme.includes('aventur')) return 'Safari no deserto: reserve o passeio das 15h para ver o por do sol sobre as dunas. Jantar beduino incluso.';
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
    return `Seu roteiro em ${dest} tem foco gastronomico. Reserve restaurantes populares com antecedencia!`;
  }
  if (interests.includes('beach')) {
    return `${dest} tem praias incriveis no roteiro! Leve protetor solar e reserve passeios de barco cedo.`;
  }
  if (interests.includes('culture') || interests.includes('history')) {
    return `Roteiro cultural em ${dest}! Compre ingressos online para museus — economiza filas e dinheiro.`;
  }
  return `Roteiro em ${dest} com ${totalActivities} atividades em ${trip.days?.length || 0} dias. Revise e confirme os passeios!`;
}

export function getIcarusGuia(trip: SavedTrip): string {
  return `${trip.destination || 'O destino'} e rico em culinaria local. Explore mercados e restaurantes de bairro!`;
}

export function getIcarusLeilao(): string { return 'Quanto mais cedo buscar ofertas, melhores os precos!'; }

export function getIcarusHeroFlight(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  if (confirmed) return `Voo confirmado para ${dest}!`;
  return `Voos para ${dest} costumam cair com antecedencia. Quer que eu monitore?`;
}

export function getIcarusHeroHotel(trip: SavedTrip, confirmed: boolean): string {
  const dest = trip.destination || 'o destino';
  const zone = (trip.accommodation as any)?.neighborhood;
  if (confirmed) return zone ? `Hotel confirmado em ${zone}, ${dest}!` : `Hotel confirmado em ${dest}!`;
  return zone ? `Recomendo hoteis em ${zone} — combina com seu perfil!` : `Reserve o hotel em ${dest}. Hoteis centrais oferecem melhor custo-beneficio.`;
}

// ─── Héstia (Financeiro/Câmbio) ───

export function getHestiaFinOps(trip: SavedTrip): string {
  const finances = trip.finances;
  if (!finances) return 'Orcamento montado! Agora e confirmar cada item.';
  const confirmedPct = finances.total > 0 ? Math.round((finances.confirmed / finances.total) * 100) : 0;
  const diff = finances.confirmed - finances.total;
  if (diff > 0) return `Atencao: gastos confirmados ultrapassaram a estimativa em R$ ${diff.toLocaleString('pt-BR')}. Revise os custos.`;
  if (confirmedPct >= 90) return `Quase la! ${confirmedPct}% do orcamento confirmado. Viagem praticamente fechada!`;
  if (confirmedPct >= 30) return `Ja confirmou ${confirmedPct}% do orcamento. Proximo passo: confirmar o ${!trip.flights?.outbound?.status ? 'voo' : 'hotel'}.`;
  return 'Orcamento montado! Comece pelo voo — e o maior custo e quanto antes, melhor o preco.';
}

export function getHestiaCambio(trip: SavedTrip): string {
  const currency = (trip as any).destinationCurrency || 'USD';
  const volatile = ['ARS', 'TRY', 'EGP', 'COP'];
  const strong = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
  if (volatile.includes(currency)) return `${currency} e volatil. Considere levar USD como backup e comprar moeda local gradualmente.`;
  if (strong.includes(currency)) return `Compre ${currency} aos poucos ao longo das semanas para diluir o risco cambial.`;
  return `Cambio atualizado. Fique de olho nas tendencias do ${currency}.`;
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
  if (pct > 30) return `Bom progresso (${pct}%). Proximo: ${pending[0]?.label || 'verificar documentos'}.`;
  return 'Muita coisa pendente! Comece pelo passaporte e seguro viagem — sao os mais criticos.';
}

export function getHermesPacking(trip: SavedTrip): string {
  const dest = (trip.destination || '').toLowerCase();
  const cold = ['londres', 'paris', 'berlim', 'praga', 'viena', 'toquio', 'seul', 'toronto'];
  const tropical = ['bangkok', 'phuket', 'cancun', 'miami', 'dubai', 'singapura', 'bali', 'cartagena'];
  if (cold.some(c => dest.includes(c))) return `${trip.destination} pede casacos! Nao esqueca adaptador de tomada.`;
  if (tropical.some(c => dest.includes(c))) return `${trip.destination} e quente! Protetor solar, chapeu e roupas leves.`;
  return 'Checou a franquia de bagagem da sua companhia aerea?';
}

export function getHermesHotelInsight(trip: SavedTrip): string {
  const zone = (trip.accommodation as any)?.neighborhood;
  const desc = (trip.accommodation as any)?.description;
  if (zone && desc) return `Hotel em ${zone}: ${desc}`;
  return 'Dica: hoteis centrais economizam tempo e transporte. Priorize localizacao sobre estrelas!';
}
