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

function buildCards(trips: Trip[]): AgentCardData[] {
  const activeOrDraft = trips.filter(t => t.status === 'active' || t.status === 'draft' || t.status === 'ongoing');

  // Scenario A — no trips
  if (activeOrDraft.length === 0) {
    return [{
      agent: 'icarus',
      message: 'Ainda sem destino? Vou te ajudar a descobrir o lugar perfeito. Toque abaixo e me conte: praia, cultura ou aventura?',
      buttonLabel: '🧭 Planejar Viagem',
      buttonPath: '/planejar',
    }];
  }

  const trip = activeOrDraft[0];
  const dest = trip.destination || 'seu destino';
  const daysUntil = trip.startDate ? differenceInDays(new Date(trip.startDate), new Date()) : 999;
  const tierLabel = TIER_LABELS[trip.budgetTier || 'comfort'] || 'Conforto';
  const { percent, firstPending } = getChecklistStats(trip);
  const confirmed = trip.finances?.confirmed || trip.budgetUsed || 0;
  const estimateMin = trip.budgetEstimateMin || trip.budget || 0;
  const estimateMax = trip.budgetEstimateMax || trip.budget || 0;
  const available = Math.max(0, estimateMax - confirmed);

  // Scenario C — active trip < 30 days
  if ((trip.status === 'active' || trip.status === 'ongoing') && daysUntil <= 30 && daysUntil > 0) {
    return [
      {
        agent: 'icarus',
        message: `${dest} te espera! Quer que eu sugira os melhores restaurantes e experiências para a noite de chegada?`,
        buttonLabel: '📖 Ver Guia',
        buttonPath: `/viagens?trip=${trip.id}&tab=guia`,
      },
      {
        agent: 'hestia',
        message: `Orçamento ${tierLabel}: R$ ${fmt(estimateMin)}–${fmt(estimateMax)}. Já confirmou R$ ${fmt(confirmed)}. Ainda tem margem de R$ ${fmt(available)}.`,
        buttonLabel: '📊 Ver FinOps',
        buttonPath: `/viagens?trip=${trip.id}&tab=finops`,
      },
      {
        agent: 'hermes',
        message: `⚠️ ${daysUntil} dias! Checklist em ${percent}%. Pendente: ${firstPending}. Passaporte? Seguro? Vamos garantir tudo.`,
        buttonLabel: '✅ Checklist',
        buttonPath: `/viagens?trip=${trip.id}&tab=checklist`,
      },
    ];
  }

  // Scenario B — draft or active > 30 days
  return [
    {
      agent: 'hestia',
      message: `Vi que ${dest} está na faixa ${tierLabel}. Fique de olho no câmbio — pode ser bom momento para começar a comprar moeda.`,
      buttonLabel: '💱 Ver Câmbio',
      buttonPath: `/viagens?trip=${trip.id}&tab=cambio`,
    },
    {
      agent: 'hermes',
      message: `Faltam ${daysUntil > 0 ? daysUntil : '?'} dias para ${dest}. Sua checklist está em ${percent}%. Não esqueça: ${firstPending}.`,
      buttonLabel: '✅ Ver Checklist',
      buttonPath: `/viagens?trip=${trip.id}&tab=checklist`,
    },
  ];
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export const AgentCards = ({ trips, onNavigate }: AgentCardsProps) => {
  const cards = buildCards(trips);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.2 },
        },
      }}
      className="space-y-3"
    >
      {cards.map((card, i) => {
        const agent = AGENTS[card.agent];
        return (
          <motion.div
            key={`${card.agent}-${i}`}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0 },
            }}
            className={`relative bg-gradient-to-r ${agent.gradient} ${agent.border} border rounded-2xl p-4 overflow-hidden`}
          >
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
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default AgentCards;
