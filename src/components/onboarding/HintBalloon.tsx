// HintBalloon — balão de dica contextual FLUTUANTE, uma vez por área, por usuário.
//
// Regras da casa:
//   • NUNCA mais de um balão na tela ao mesmo tempo (claim global abaixo).
//   • Nunca encadear balões numa sequência/tour.
//   • Nunca bloqueia interação: sem overlay, sem captura de eventos.
//   • Flutua sobre o conteúdo via portal (position: fixed) — NÃO empurra o layout.
//   • Persistência: profiles.preferences.onboarding_hints (jsonb) do kinu-beta.
//     localStorage é só cache anti-flicker.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchOnboardingPrefs,
  markHintSeen,
  readCachedPrefs,
  trackOnboarding,
} from '@/lib/onboarding';

// Claim de módulo: o primeiro balão a reivindicar é o único visível.
const claim: { area: string | null } = { area: null };

const GAP = 8;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface HintBalloonProps {
  /** chave da área dentro de onboarding_hints (ex.: 'viagens') */
  area: string;
  /** uma frase curta */
  text: string;
  /** preferência de onde a setinha aponta; a posição real pode inverter por espaço */
  arrow?: 'up' | 'down' | 'none';
  /**
   * Elemento-âncora opcional. Quando presente, o balão se posiciona em torno dele.
   * Quando ausente, usa o ponto onde o componente foi declarado (sentinela).
   * Se a âncora não estiver no DOM, o balão não aparece (skip if anchor missing).
   */
  anchorRef?: { current: HTMLElement | null };
  className?: string;
}

export const HintBalloon = ({ area, text, arrow = 'up', anchorRef, className }: HintBalloonProps) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: 'up' | 'down' } | null>(null);

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

  // Posicionamento fixo (portal) em torno da âncora — ou da sentinela.
  useLayoutEffect(() => {
    if (!visible) {
      setPos(null);
      return;
    }
    let raf = 0;

    const compute = () => {
      const anchor = (anchorRef?.current ?? null) || sentinelRef.current;
      // âncora exigida mas ausente → skip
      if (!anchor) {
        setPos(null);
        return;
      }
      const r = anchor.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setPos(null);
        return;
      }
      const bubble = bubbleRef.current;
      const w = bubble?.offsetWidth ?? 320;
      const h = bubble?.offsetHeight ?? 72;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const fitsBelow = r.bottom + GAP + h <= vh;
      const preferAbove = arrow === 'down';
      const above = preferAbove ? r.top - GAP - h >= 8 : !fitsBelow;
      const top = above
        ? Math.max(8, r.top - h - GAP)
        : Math.min(vh - h - 8, r.bottom + GAP);

      let left = Math.max(r.left, 8);
      left = Math.min(left, Math.max(8, vw - w - 8));

      setPos({ top, left, side: above ? 'down' : 'up' });
    };

    raf = requestAnimationFrame(compute);
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    // recompute depois das animações de entrada (ex.: slide do painel de chat)
    const settle = window.setTimeout(compute, 350);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
      window.clearTimeout(settle);
    };
  }, [visible, arrow, anchorRef]);

  const reduced = prefersReducedMotion();
  const showTail = arrow !== 'none' && pos?.side;

  return (
    <>
      {/* Sentinela — marca a posição declarada, tamanho zero, não empurra o layout. */}
      <span ref={sentinelRef} aria-hidden style={{ display: 'inline-block', width: 0, height: 0 }} />

      {createPortal(
        <AnimatePresence>
          {visible && pos && (
            <motion.div
              ref={bubbleRef}
              role="status"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: pos.side === 'up' ? -8 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: pos.side === 'up' ? -8 : 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: 'min(340px, calc(100vw - 16px))',
                zIndex: 70,
              }}
              className={className ?? ''}
            >
              {/* setinha apontando para a âncora */}
              {showTail && pos.side === 'up' && (
                <span className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-[#0b3b30] border-l border-t border-emerald-500/40" />
              )}
              {showTail && pos.side === 'down' && (
                <span className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45 bg-[#0b3b30] border-r border-b border-emerald-500/40" />
              )}

              <div
                className="flex items-start gap-2 bg-[#0b3b30]/95 backdrop-blur-sm border border-emerald-500/50 rounded-xl px-3.5 py-2.5"
                style={{
                  boxShadow:
                    '0 8px 30px -8px rgba(16,185,129,0.35), 0 0 18px rgba(16,185,129,0.18)',
                }}
              >
                <span className="text-sm leading-none mt-0.5">🌿</span>
                <span className="flex-1 text-[13px] leading-snug text-emerald-50 font-['Plus_Jakarta_Sans']">
                  {text}
                </span>
                <button
                  type="button"
                  aria-label="Fechar dica"
                  onClick={dismiss}
                  className="shrink-0 -mr-1 -mt-0.5 p-1 rounded-md text-emerald-200/70 hover:text-emerald-50 hover:bg-emerald-500/20 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default HintBalloon;
