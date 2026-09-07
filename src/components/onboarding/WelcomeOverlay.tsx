// WelcomeOverlay — card único de boas-vindas (sem carrossel, sem tour).
// Duas portas: as MESMAS duas já existentes (wizard do /planejar e KINU AI).

import { motion } from 'framer-motion';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';

interface WelcomeOverlayProps {
  name: string;
  onWizard: () => void;
  onAI: () => void;
  onDismiss: () => void;
}

export const WelcomeOverlay = ({ name, onWizard, onAI, onDismiss }: WelcomeOverlayProps) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-emerald-400" />
      </div>

      <h2 className="text-2xl font-bold text-foreground font-['Outfit'] leading-tight">
        Bem-vindo ao clã, {name}.
      </h2>
      <p className="text-muted-foreground mt-2">
        Vamos montar sua primeira viagem em 2 minutos?
      </p>

      <div className="mt-6 space-y-3">
        <button
          onClick={onWizard}
          className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-5 rounded-xl shadow-lg shadow-emerald-500/20 group"
        >
          <span className="flex items-center gap-3">
            <Wand2 size={20} />
            <span className="font-semibold font-['Outfit']">Montar com o assistente</span>
          </span>
          <ArrowRight size={20} className="opacity-80 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={onAI}
          className="w-full flex items-center justify-between gap-3 bg-muted/40 border border-border hover:border-emerald-500/40 text-foreground py-4 px-5 rounded-xl transition-colors group"
        >
          <span className="flex items-center gap-3">
            <span className="text-lg">🧭</span>
            <span className="font-semibold font-['Outfit']">Pedir ao KINU AI</span>
          </span>
          <ArrowRight size={20} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>

      <button
        onClick={onDismiss}
        className="w-full mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Explorar sozinho
      </button>
    </motion.div>
  </div>
);

export default WelcomeOverlay;
