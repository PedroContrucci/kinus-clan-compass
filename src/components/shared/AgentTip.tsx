// AgentTip — Reusable agent tip component (compact or full)

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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

interface AgentTipProps {
  agent: 'icarus' | 'hestia' | 'hermes';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'compact' | 'full';
}

export const AgentTip = ({ agent, message, action, variant = 'compact' }: AgentTipProps) => {
  const a = AGENTS[agent];

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative flex items-center gap-2 bg-gradient-to-r ${a.gradient} ${a.border} border rounded-xl px-3 py-2 mb-4 overflow-hidden`}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.barColor}`} />
        <span className="text-sm pl-1">{a.emoji}</span>
        <span className={`text-xs font-bold ${a.accentColor} font-['Outfit']`}>{a.name}:</span>
        <span className="text-xs text-muted-foreground flex-1 truncate">"{message}"</span>
        {action && (
          <button
            onClick={action.onClick}
            className={`flex-shrink-0 text-xs font-medium ${a.accentColor} hover:opacity-80 transition-opacity`}
          >
            {action.label}
          </button>
        )}
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-r ${a.gradient} ${a.border} border rounded-2xl p-4 mb-4 overflow-hidden`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.barColor} rounded-l-2xl`} />
      <div className="flex items-center gap-2 mb-2 pl-2">
        <span className="text-xl">{a.emoji}</span>
        <span className={`font-bold text-sm font-['Outfit'] ${a.accentColor}`}>{a.name}</span>
        <span className="text-xs text-muted-foreground">• {a.role}</span>
      </div>
      <p className="text-sm text-muted-foreground pl-2 mb-3 leading-relaxed">"{message}"</p>
      {action && (
        <div className="flex justify-end pl-2">
          <button
            onClick={action.onClick}
            className={`flex items-center gap-1.5 text-xs font-medium ${a.accentColor} hover:opacity-80 transition-opacity`}
          >
            {action.label}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AgentTip;
