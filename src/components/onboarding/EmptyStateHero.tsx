// EmptyStateHero — o "vazio" do dashboard vira convite, com as mesmas duas portas.

import { motion } from 'framer-motion';
import { Wand2, ArrowRight } from 'lucide-react';

interface EmptyStateHeroProps {
  onWizard: () => void;
  onAI: () => void;
}

export const EmptyStateHero = ({ onWizard, onAI }: EmptyStateHeroProps) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-2xl p-6"
  >
    <h2 className="text-2xl font-bold text-foreground font-['Outfit'] leading-tight">
      Sua primeira viagem começa aqui.
    </h2>
    <p className="text-muted-foreground mt-2">
      Escolha um caminho — o KINU cuida do resto: voos, hotel, roteiro e orçamento.
    </p>

    <div className="mt-5 space-y-3">
      <button
        onClick={onWizard}
        className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-5 rounded-xl shadow-lg shadow-emerald-500/20 group"
      >
        <span className="flex items-center gap-3">
          <Wand2 size={20} />
          <span className="text-left">
            <span className="block font-semibold font-['Outfit']">Montar com o assistente</span>
            <span className="block text-xs text-white/80">4 passos, 2 minutos</span>
          </span>
        </span>
        <ArrowRight size={20} className="opacity-80 group-hover:translate-x-1 transition-transform" />
      </button>

      <button
        onClick={onAI}
        className="w-full flex items-center justify-between gap-3 bg-muted/40 border border-border hover:border-emerald-500/40 py-4 px-5 rounded-xl transition-colors group"
      >
        <span className="flex items-center gap-3">
          <span className="text-lg">🧭</span>
          <span className="text-left">
            <span className="block font-semibold text-foreground font-['Outfit']">Pedir ao KINU AI</span>
            <span className="block text-xs text-emerald-400">Conte a ideia, ele monta</span>
          </span>
        </span>
        <ArrowRight size={20} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
      </button>
    </div>
  </motion.section>
);

export default EmptyStateHero;
