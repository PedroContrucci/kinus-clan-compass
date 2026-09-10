/**
 * AchievementsPanel — nível, XP e a grade de troféus no Perfil. UI FINA, de propósito.
 *
 * Não decide nada: lê o snapshot do `achievementEngine` e desenha. Quem sabe o que destrava, o
 * que vale XP e quando recalcular é o motor — a mesma fronteira do `TripAdoptionDialog`.
 *
 * O BLOQUEADO MOSTRA O CRITÉRIO. Silhueta muda sem dizer o que falta é enfeite; com o critério em
 * uma linha, a grade vira o mapa do que ainda dá para viver. É a régua do §0 do desenho: a pessoa
 * contaria num churrasco.
 */

import { useEffect, useState } from 'react';
import { WORLD_ACHIEVEMENTS } from '@/lib/achievements';
import { getProgress, runAchievements, subscribeAchievements } from '@/lib/achievementEngine';

export function AchievementsPanel() {
  // Estado inicial SÍNCRONO: o motor já pode ter computado antes desta montagem — e mesmo sem
  // rede o snapshot do cache pinta a tela na hora. `subscribeAchievements` não replica o estado
  // atual na assinatura (contrato do Arco 1).
  const [progress, setProgress] = useState(getProgress);

  useEffect(() => {
    const unsubscribe = subscribeAchievements((next) => setProgress(next));
    // Uma passada na montagem: entrar no Perfil é o momento em que a pessoa quer ver o número
    // certo, e o motor pode estar parado desde o último fato.
    void runAchievements();
    return unsubscribe;
  }, []);

  const unlocked = new Set(progress.unlocked);
  const ratio = Math.max(0, Math.min(1, progress.ratio));

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold font-['Outfit'] text-foreground mb-3">🏆 Conquistas do Clã</h2>

      {/* Nível + XP */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-3">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <p className="font-semibold text-foreground font-['Outfit']">{progress.level.name}</p>
          <p className="text-sm text-muted-foreground font-['Plus_Jakarta_Sans']">{progress.xp} XP</p>
        </div>

        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-2 font-['Plus_Jakarta_Sans']">
          {progress.nextLevel
            ? `Faltam ${progress.toNext} XP para ${progress.nextLevel.name}`
            : 'Você chegou ao topo do Clã.'}
          {' · '}
          {progress.unlocked.length} de {progress.total} troféus
        </p>
      </div>

      {/* Grade */}
      <div className="grid grid-cols-3 gap-3">
        {WORLD_ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.key);
          return (
            <div
              key={achievement.key}
              // `title` para o desktop; o critério embaixo já serve ao celular, que é onde o
              // KINU vive.
              title={achievement.criterion}
              className={
                isUnlocked
                  ? 'bg-card border border-primary/40 rounded-xl p-3 text-center'
                  : 'bg-card/40 border border-border rounded-xl p-3 text-center'
              }
            >
              <div className={isUnlocked ? 'text-2xl' : 'text-2xl grayscale opacity-30'}>
                {achievement.emoji}
              </div>
              <p
                className={`text-xs mt-1 font-['Outfit'] ${
                  isUnlocked ? 'text-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                {achievement.name}
              </p>
              {!isUnlocked && (
                <p className="text-[10px] leading-tight text-muted-foreground/70 mt-1 font-['Plus_Jakarta_Sans']">
                  {achievement.criterion}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
