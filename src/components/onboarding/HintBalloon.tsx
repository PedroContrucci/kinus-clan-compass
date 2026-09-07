// HintBalloon — balão de dica contextual, uma vez por área, por usuário.
//
// Regras da casa:
//   • NUNCA mais de um balão na tela ao mesmo tempo (claim global abaixo).
//   • Nunca encadear balões numa sequência/tour.
//   • Nunca bloqueia interação: sem overlay, sem captura de eventos.
//   • Persistência: profiles.preferences.onboarding_hints (jsonb) do kinu-beta.
//     localStorage é só cache anti-flicker.

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchOnboardingPrefs,
  markHintSeen,
  readCachedPrefs,
  trackOnboarding,
} from '@/lib/onboarding';

// Claim de módulo: o primeiro balão a reivindicar é o único visível.
const claim: { area: string | null } = { area: null };

interface HintBalloonProps {
  /** chave da área dentro de onboarding_hints (ex.: 'viagens') */
  area: string;
  /** uma frase curta */
  text: string;
  /** para onde a setinha aponta */
  arrow?: 'up' | 'down' | 'none';
  className?: string;
}

export const HintBalloon = ({ area, text, arrow = 'up', className }: HintBalloonProps) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    // Cache primeiro: evita piscar um balão já dispensado.
    if ((readCachedPrefs().onboarding_hints ?? {})[area]) return;
    if (claim.area && claim.area !== area) return;

    void fetchOnboardingPrefs(user.id).then((p) => {
      if (!alive) return;
      if ((p.onboarding_hints ?? {})[area]) return;
      if (claim.area && claim.area !== area) return;
      claim.area = area;
      setVisible(true);
      trackOnboarding('onboarding.hint_shown', user.id, { area });
    });

    return () => {
      alive = false;
      if (claim.area === area) claim.area = null;
    };
  }, [user?.id, area]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (claim.area === area) claim.area = null;
    if (user) void markHintSeen(user.id, area);
  }, [area, user?.id]);

  // Toque em qualquer lugar fecha — sem capture, então o clique original
  // continua chegando normalmente ao elemento de baixo.
  useEffect(() => {
    if (!visible) return;
    const handler = () => dismiss();
    // timeout evita fechar no mesmo gesto que montou o balão
    const t = window.setTimeout(() => {
      document.addEventListener('pointerdown', handler);
    }, 150);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('pointerdown', handler);
    };
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: arrow === 'down' ? 6 : -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className={`relative z-30 ${className ?? ''}`}
        >
          {arrow === 'up' && (
            <span className="absolute left-6 -top-1.5 w-3 h-3 rotate-45 bg-[#0b3b30] border-l border-t border-emerald-500/40" />
          )}
          {arrow === 'down' && (
            <span className="absolute left-6 -bottom-1.5 w-3 h-3 rotate-45 bg-[#0b3b30] border-r border-b border-emerald-500/40" />
          )}
          <button
            type="button"
            onClick={dismiss}
            className="w-full flex items-start gap-2 text-left bg-[#0b3b30] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 shadow-lg shadow-emerald-950/40"
          >
            <span className="text-sm leading-none mt-0.5">🌿</span>
            <span className="flex-1 text-[13px] leading-snug text-emerald-50 font-['Plus_Jakarta_Sans']">
              {text}
            </span>
            <span className="text-[11px] text-emerald-300/70 font-['Outfit'] mt-0.5">ok</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HintBalloon;
