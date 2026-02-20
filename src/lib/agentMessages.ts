// Agent Messages — Contextual messages for Ícaro, Héstia, Hermes

import type { SavedTrip } from '@/types/trip';

// ─── Ícaro (Explorador) ───

export function getIcarusRoteiro(trip: SavedTrip, dayNum: number): string {
  const totalDays = trip.days?.length || 7;
  const dest = trip.destination || 'o destino';
  const day = trip.days?.find(d => d.day === dayNum);

  if (dayNum === 1) return `Boa viagem para ${dest}! Descanse no voo.`;
  if (dayNum === 2 && trip.jetLagMode) return 'Dia leve de adaptacao ao fuso. Amanha voce ataca!';
  if (dayNum === 2) return `Primeiro dia em ${dest}! Explore o bairro do hotel.`;
  if (dayNum === totalDays) return `Ultimo dia! Confira a mala antes de sair do hotel.`;

  const theme = day?.title?.replace(/[^\w\sà-ú]/gi, '').trim() || '';
  if (theme.includes('Cultura')) return `Dia de cultura em ${dest}! Museus e monumentos te esperam.`;
  if (theme.includes('Gastronomia')) return `Dia de sabores! Prove tudo que ${dest} tem a oferecer.`;
  if (theme.includes('Aventura')) return `Dia de aventura! Explore os arredores de ${dest}.`;
  return `Aproveite ${dest}! Cada momento conta.`;
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

