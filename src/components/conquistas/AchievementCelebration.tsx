/**
 * AchievementCelebration — o toast de troféu novo. Não renderiza nada.
 *
 * POR QUE MORA NO App.tsx E NÃO NO PERFIL: a conquista destrava quando a pessoa confirma um hotel
 * em `/viagens` ou quando a varredura do boot conclui uma viagem — quase nunca em `/conta`. Um
 * toast pendurado no painel do Perfil é um toast que ninguém vê. Mesmo motivo escrito no cabeçalho
 * do `TripAdoptionDialog`.
 *
 * VÁRIOS DE UMA VEZ VIRAM UM. A primeira passada de quem já viaja destrava a coleção inteira de
 * uma vez (o retroativo). Quatro toasts empilhados é ruído; um toast que diz quatro é notícia.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { subscribeAchievements } from '@/lib/achievementEngine';

export function AchievementCelebration() {
  const location = useLocation();
  const onLogin = location.pathname === '/';

  useEffect(() => subscribeAchievements((_progress, unlockedNow) => {
    if (unlockedNow.length === 0) return;
    // Mesma regra do KinuAIWrapper e do diálogo de adoção: a tela de login não recebe nada por
    // cima. O troféu não se perde — ele está na tabela, e o Perfil o mostra.
    if (onLogin) return;

    if (unlockedNow.length === 1) {
      const [achievement] = unlockedNow;
      toast.success(`${achievement.emoji} ${achievement.name}`, {
        description: 'Conquista destravada — está no seu Perfil.',
      });
      return;
    }

    toast.success(`🏆 ${unlockedNow.length} conquistas destravadas`, {
      description: unlockedNow.map((a) => a.name).join(' · '),
    });
  }), [onLogin]);

  return null;
}
