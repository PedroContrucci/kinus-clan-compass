// Card de Progresso do Checklist (Ring Progress)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistProgressProps {
  total: number;
  completed: number;
  percent: number;
  pendingItems: { id: string; label: string }[];
}

export const ChecklistProgress = ({ 
  total, 
  completed, 
  percent, 
  pendingItems 
}: ChecklistProgressProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // SVG dimensions
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-md hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Ring Progress */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground font-['Outfit']">
              {percent}%
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Checklist</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {completed} de {total} itens
          </p>
          
          {pendingItems.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
            >
              Ver pendentes
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {/* Expandable pending items */}
      <AnimatePresence>
        {isExpanded && pendingItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-border overflow-hidden"
          >
            <ul className="space-y-1">
              {pendingItems.slice(0, 5).map(item => (
                <li 
                  key={item.id}
                  className="text-xs text-muted-foreground flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--kinu-gold))]" />
                  {item.label}
                </li>
              ))}
              {pendingItems.length > 5 && (
                <li className="text-xs text-muted-foreground italic">
                  +{pendingItems.length - 5} itens...
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChecklistProgress;
