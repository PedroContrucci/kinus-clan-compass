import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface Trip {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetUsed?: number;
  budgetTier?: string;
  budgetEstimateMin?: number;
  budgetEstimateMax?: number;
  status: string;
  progress?: number;
  checklist?: { item: string; is_completed?: boolean }[];
  finances?: { total?: number; confirmed?: number; available?: number };
  flights?: { outbound?: { status?: string } };
  accommodation?: { status?: string };
}

interface AgentCardsProps {
  trips: Trip[];
  onNavigate: (path: string) => void;
}

const AGENTS = {
  icarus: {
    name: 'Ícaro',
    role: 'Explorador',
    emoji: '🦅',
    gradient: 'from-sky-500/20 to-cyan-500/20',
    border: 'border-sky-500/30',
    accentColor: 'text-sky-400',
    barColor: 'bg-sky-500',
  },
  hestia: {
    name: 'Héstia',
    role: 'Guardiã Financeira',
    emoji: '🏛️',
    gradient: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/30',
    accentColor: 'text-amber-400',
    barColor: 'bg-amber-500',
  },
  hermes: {
    name: 'Hermes',
    role: 'Logístico',
    emoji: '⚡',
    gradient: 'from-emerald-500/20 to-green-500/20',
    border: 'border-emerald-500/30',
    accentColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
  },
};

const TIER_LABELS: Record<string, string> = {
  backpacker: 'Mochileiro',
  economic: 'Econômico',
  comfort: 'Conforto',
  luxury: 'Luxo',
};

interface AgentCardData {
  agent: keyof typeof AGENTS;
  message: string;
  buttonLabel: string;
  buttonPath: string;
}

function getChecklistStats(trip: Trip) {
  const checklist = trip.checklist || [];
  const total = checklist.length;
  const completed = checklist.filter(i => i.is_completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const firstPending = checklist.find(i => !i.is_completed)?.item || 'verificar documentos';
  return { percent, firstPending };
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function buildPriorityCard(trips: Trip[]): AgentCardData {
  const activeOrDraft = trips.filter(t => t.status === 'active' || t.status === 'ongoing');

  // No trips
  if (activeOrDraft.length === 0) {
    return {
      agent: 'icarus',
      message: 'Ainda sem destino? Vou te ajudar a descobrir o lugar perfeito. Toque abaixo e me conte: praia, cultura ou aventura?',
      buttonLabel: '🧭 Planejar Viagem',
      buttonPath: '/planejar',
    };
  }

  const trip = activeOrDraft[0];
  const dest = trip.destination || 'seu destino';
  const daysUntil = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) : 999;
  const { percent, firstPending } = getChecklistStats(trip);
  const flightConfirmed = trip.flights?.outbound?.status === 'confirmed';
  const hotelConfirmed = trip.accommodation?.status === 'confirmed';

  // Priority 1: < 7 days → Hermes urgency
  if (daysUntil <= 7 && daysUntil > 0) {
    return {
      agent: 'hermes',
      message: `⚠️ ${daysUntil} DIAS para ${dest}! Checklist em ${percent}%. Falta: ${firstPending}. Passaporte? Seguro? AGORA!`,
      buttonLabel: '✅ Checklist',
      buttonPath: `/viagens?trip=${trip.id}&tab=checklist`,
    };
  }

  // Priority 2: Flight not confirmed → Ícaro
  if (!flightConfirmed) {
    return {
      agent: 'icarus',
      message: `${dest} te espera! Próximo passo: confirmar o voo. Quer que eu busque as melhores ofertas?`,
      buttonLabel: '📊 Ir ao Painel',
      buttonPath: `/viagens?trip=${trip.id}&tab=painel`,
    };
  }

  // Priority 3: Hotel not confirmed → Ícaro
  if (!hotelConfirmed) {
    return {
      agent: 'icarus',
      message: `Voo fechado para ${dest}! Agora é hora de garantir a hospedagem.`,
      buttonLabel: '📊 Ir ao Painel',
      buttonPath: `/viagens?trip=${trip.id}&tab=painel`,
    };
  }

  // Priority 4: Checklist < 50% → Hermes
  if (percent < 50) {
    return {
      agent: 'hermes',
      message: `Checklist em ${percent}% para ${dest}. Pendente: ${firstPending}. Vamos resolver!`,
      buttonLabel: '✅ Checklist',
      buttonPath: `/viagens?trip=${trip.id}&tab=checklist`,
    };
  }

  // Priority 5: Over budget → Héstia
  const confirmed = trip.finances?.confirmed || 0;
  const total = trip.finances?.total || 0;
  if (confirmed > total && total > 0) {
    return {
      agent: 'hestia',
      message: `⚠️ Gastos ultrapassaram o orçamento em R$ ${fmt(confirmed - total)}. Quer que eu sugira onde economizar?`,
      buttonLabel: '💱 Ver Câmbio',
      buttonPath: `/viagens?trip=${trip.id}&tab=cambio`,
    };
  }

  // Priority 6: All good → Ícaro inspiration
  return {
    agent: 'icarus',
    message: `${dest} vai ser demais! Tudo encaminhado. Explore o guia para descobrir experiências imperdíveis. 🌍`,
    buttonLabel: '📖 Ver Guia',
    buttonPath: `/viagens?trip=${trip.id}&tab=guia`,
  };
}

export const AgentCards = ({ trips, onNavigate }: AgentCardsProps) => {
  const card = buildPriorityCard(trips);
  const agent = AGENTS[card.agent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative bg-gradient-to-r ${agent.gradient} ${agent.border} border rounded-2xl p-4 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${agent.barColor} rounded-l-2xl`} />

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pl-2">
          <span className="text-xl">{agent.emoji}</span>
          <span className={`font-bold text-sm font-['Outfit'] ${agent.accentColor}`}>
            {agent.name}
          </span>
          <span className="text-xs text-muted-foreground">• {agent.role}</span>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground pl-2 mb-3 leading-relaxed">
          "{card.message}"
        </p>

        {/* Action button */}
        <div className="flex justify-end pl-2">
          <button
            onClick={() => onNavigate(card.buttonPath)}
            className={`flex items-center gap-1.5 text-xs font-medium ${agent.accentColor} hover:opacity-80 transition-opacity`}
          >
            {card.buttonLabel}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentCards;
