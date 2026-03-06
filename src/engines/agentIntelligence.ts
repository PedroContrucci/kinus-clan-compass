import { differenceInDays } from 'date-fns';
import { SavedTrip } from '@/types/trip';
import { getMichelinCountForCity } from '@/lib/michelinData';

export interface AgentInsight {
  id: string;
  agent: 'icarus' | 'hestia' | 'hermes';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: { label: string; tab: string };
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function analyzeTrip(trip: SavedTrip): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const now = new Date();
  const daysUntilTrip = trip.startDate
    ? differenceInDays(new Date(trip.startDate), now)
    : 999;

  // ─── HÉSTIA — Financial Intelligence ───
  if (trip.finances) {
    const { confirmed, total, available } = trip.finances;
    const budgetUsedPct = total > 0 ? (confirmed / total) * 100 : 0;

    if (budgetUsedPct > 100) {
      insights.push({
        id: 'hestia-overbudget',
        agent: 'hestia',
        priority: 'critical',
        title: 'Orçamento estourado',
        message: `Gastos confirmados ultrapassaram o orçamento em R$ ${fmt(confirmed - total)}. Revise os custos.`,
        action: { label: 'Ver Financeiro', tab: 'financeiro' },
      });
    } else if (budgetUsedPct > 80 && budgetUsedPct <= 100) {
      insights.push({
        id: 'hestia-budget-warning',
        agent: 'hestia',
        priority: 'high',
        title: 'Orçamento quase no limite',
        message: `Já usou ${Math.round(budgetUsedPct)}% do orçamento. Restam R$ ${fmt(available)} disponíveis.`,
        action: { label: 'Ver Financeiro', tab: 'financeiro' },
      });
    }

    if (trip.flights?.outbound?.status !== 'confirmed' && daysUntilTrip < 30 && daysUntilTrip > 0) {
      insights.push({
        id: 'hestia-flight-warning',
        agent: 'hestia',
        priority: 'high',
        title: 'Voo não confirmado',
        message: `Faltam ${daysUntilTrip} dias e o voo ainda não está confirmado. Preços sobem perto da data.`,
        action: { label: 'Ver Painel', tab: 'painel' },
      });
    }

    if (trip.accommodation?.status !== 'confirmed' && daysUntilTrip < 21 && daysUntilTrip > 0) {
      insights.push({
        id: 'hestia-hotel-warning',
        agent: 'hestia',
        priority: 'medium',
        title: 'Hospedagem não confirmada',
        message: `Faltam ${daysUntilTrip} dias e a hospedagem ainda não foi reservada. Disponibilidade pode diminuir.`,
        action: { label: 'Ver Painel', tab: 'painel' },
      });
    }
  }

  // ─── HERMES — Logistics Intelligence ───
  const checklist = trip.checklist || [];
  const checklistDone = checklist.filter(i => i.checked).length;
  const checklistPct = checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0;

  if (daysUntilTrip < 7 && daysUntilTrip > 0 && checklistPct < 80) {
    insights.push({
      id: 'hermes-checklist-urgent',
      agent: 'hermes',
      priority: 'critical',
      title: 'Checklist incompleto!',
      message: `Viagem em ${daysUntilTrip} dias mas só ${Math.round(checklistPct)}% do checklist está pronto.`,
      action: { label: 'Ver Checklist', tab: 'preparacao' },
    });
  } else if (daysUntilTrip < 14 && daysUntilTrip > 0 && checklistPct < 50) {
    insights.push({
      id: 'hermes-checklist-low',
      agent: 'hermes',
      priority: 'high',
      title: 'Checklist em atraso',
      message: `Apenas ${Math.round(checklistPct)}% concluído a ${daysUntilTrip} dias da viagem. Hora de acelerar!`,
      action: { label: 'Ver Checklist', tab: 'preparacao' },
    });
  }

  if (
    daysUntilTrip < 14 &&
    daysUntilTrip > 0 &&
    !checklist.some(i => i.label.toLowerCase().includes('passaporte') && i.checked)
  ) {
    insights.push({
      id: 'hermes-passport',
      agent: 'hermes',
      priority: 'critical',
      title: 'Passaporte verificado?',
      message: 'Confira se o passaporte tem pelo menos 6 meses de validade da data da viagem.',
      action: { label: 'Ver Checklist', tab: 'preparacao' },
    });
  }

  if (daysUntilTrip <= 3 && daysUntilTrip > 0) {
    insights.push({
      id: 'hermes-departure-imminent',
      agent: 'hermes',
      priority: 'critical',
      title: 'Partida iminente!',
      message: `Faltam apenas ${daysUntilTrip} dia${daysUntilTrip > 1 ? 's' : ''}! Confira malas, documentos e horários.`,
      action: { label: 'Preparação', tab: 'preparacao' },
    });
  }

  // ─── ÍCARO — Experience Intelligence ───
  const confirmedActivities = trip.days?.reduce(
    (sum, d) => sum + d.activities.filter(a => a.status === 'confirmed').length,
    0
  ) || 0;
  const totalActivities = trip.days?.reduce(
    (sum, d) => sum + d.activities.length,
    0
  ) || 0;

  if (confirmedActivities === 0 && totalActivities > 0 && daysUntilTrip < 14 && daysUntilTrip > 0) {
    insights.push({
      id: 'icarus-no-confirmations',
      agent: 'icarus',
      priority: 'high',
      title: 'Nenhuma atividade confirmada',
      message: 'Seu roteiro tem atividades planejadas mas nenhuma confirmada. Reserve as mais populares antes que esgotem.',
      action: { label: 'Ver Roteiro', tab: 'roteiro' },
    });
  } else if (totalActivities > 0 && confirmedActivities < totalActivities * 0.3 && daysUntilTrip < 21 && daysUntilTrip > 0) {
    insights.push({
      id: 'icarus-low-confirmations',
      agent: 'icarus',
      priority: 'medium',
      title: 'Poucas atividades confirmadas',
      message: `Apenas ${confirmedActivities} de ${totalActivities} atividades confirmadas. Garanta as imperdíveis!`,
      action: { label: 'Ver Roteiro', tab: 'roteiro' },
    });
  }

  // Ícaro — everything looks great
  if (
    daysUntilTrip > 0 &&
    daysUntilTrip < 30 &&
    checklistPct >= 80 &&
    confirmedActivities > totalActivities * 0.5 &&
    trip.flights?.outbound?.status === 'confirmed' &&
    trip.accommodation?.status === 'confirmed'
  ) {
    insights.push({
      id: 'icarus-all-good',
      agent: 'icarus',
      priority: 'low',
      title: 'Tudo encaminhado! 🎉',
      message: `${trip.destination} vai ser incrível! Voo, hotel e roteiro confirmados. Explore o guia para dicas locais.`,
      action: { label: 'Ver Guia', tab: 'preparacao' },
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
