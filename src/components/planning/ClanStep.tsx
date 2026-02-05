// ClanStep — Step 2: Travelers (adults + children with ages)

import { Users, Baby, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClanMember } from '@/types/dashboard';

interface ClanStepProps {
  clan: ClanMember[];
  onChange: (clan: ClanMember[]) => void;
}

export const ClanStep = ({ clan, onChange }: ClanStepProps) => {
  const adults = clan.filter((m) => m.type === 'adult');
  const children = clan.filter((m) => m.type === 'child');

  const updateAdults = (count: number) => {
    const newCount = Math.max(1, Math.min(10, count));
    const currentAdults = adults.length;
    
    if (newCount > currentAdults) {
      const newAdults = Array.from({ length: newCount - currentAdults }, (_, i) => ({
        id: `adult-${Date.now()}-${i}`,
        name: `Adulto ${currentAdults + i + 1}`,
        type: 'adult' as const,
      }));
      onChange([...clan, ...newAdults]);
    } else {
      const remainingAdults = adults.slice(0, newCount);
      onChange([...remainingAdults, ...children]);
    }
  };

  const updateChildren = (count: number) => {
    const newCount = Math.max(0, Math.min(8, count));
    const currentChildren = children.length;
    
    if (newCount > currentChildren) {
      const newChildren = Array.from({ length: newCount - currentChildren }, (_, i) => ({
        id: `child-${Date.now()}-${i}`,
        name: `Criança ${currentChildren + i + 1}`,
        type: 'child' as const,
        age: 5,
      }));
      onChange([...clan, ...newChildren]);
    } else {
      const remainingChildren = children.slice(0, newCount);
      onChange([...adults, ...remainingChildren]);
    }
  };

  const updateChildAge = (childId: string, age: number) => {
    onChange(
      clan.map((m) => (m.id === childId ? { ...m, age } : m))
    );
  };

  return (
    <div className="space-y-6">
      {/* Adults */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={22} className="text-emerald-400" />
            <div>
              <h3 className="font-medium text-foreground">Adultos</h3>
              <p className="text-sm text-muted-foreground">13 anos ou mais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateAdults(adults.length - 1)}
              disabled={adults.length <= 1}
              className="w-10 h-10 rounded-xl bg-[#334155] text-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/20 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold text-foreground font-['Outfit']">
              {adults.length}
            </span>
            <button
              onClick={() => updateAdults(adults.length + 1)}
              disabled={adults.length >= 10}
              className="w-10 h-10 rounded-xl bg-[#334155] text-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/20 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Children */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Baby size={22} className="text-amber-400" />
            <div>
              <h3 className="font-medium text-foreground">Crianças</h3>
              <p className="text-sm text-muted-foreground">0 a 12 anos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateChildren(children.length - 1)}
              disabled={children.length <= 0}
              className="w-10 h-10 rounded-xl bg-[#334155] text-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/20 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold text-foreground font-['Outfit']">
              {children.length}
            </span>
            <button
              onClick={() => updateChildren(children.length + 1)}
              disabled={children.length >= 8}
              className="w-10 h-10 rounded-xl bg-[#334155] text-foreground font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/20 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Children Ages */}
        <AnimatePresence>
          {children.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[#334155] pt-4 space-y-3"
            >
              {children.map((child, idx) => (
                <div key={child.id} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Idade da criança {idx + 1}:
                  </span>
                  <select
                    value={child.age || 5}
                    onChange={(e) => updateChildAge(child.id, parseInt(e.target.value))}
                    className="bg-[#334155] border border-[#475569] rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: 13 }, (_, i) => (
                      <option key={i} value={i}>
                        {i} {i === 1 ? 'ano' : 'anos'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lap Infant Info */}
      {children.some((c) => c.age !== undefined && c.age < 2) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
        >
          <Info size={18} className="text-amber-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Lap Infant — Sem custo de assento</p>
            <p className="text-xs text-muted-foreground mt-1">
              Crianças menores de 2 anos viajam no colo e não pagam assento na maioria das companhias.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ClanStep;
