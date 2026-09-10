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
import type { Achievement } from '@/lib/achievements';
import { WORLD_ACHIEVEMENTS } from '@/lib/achievements';
import { getProgress, runAchievements, subscribeAchievements } from '@/lib/achievementEngine';
import { localAchievementsOf, LOCAL_CITIES } from '@/lib/localAchievements';

/** Um troféu na grade. Destravado colorido; bloqueado em silhueta, mas dizendo o que falta. */
function TrophyCard({ achievement, isUnlocked }: { achievement: Achievement; isUnlocked: boolean }) {
  return (
    <div
      // `title` para o desktop; o critério embaixo já serve ao celular, que é onde o KINU vive.
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
}

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

  // Um snapshot em cache de antes da Camada Local não tem `visitedCities`. O motor normaliza
  // na leitura, mas a tela não pode depender disso para não quebrar.
  const [showAllCities, setShowAllCities] = useState(false);

  const unlocked = new Set(progress.unlocked);
  const ratio = Math.max(0, Math.min(1, progress.ratio));

  const visited = (progress.visitedCities ?? []).filter((city) => LOCAL_CITIES.includes(city));
  const waiting = LOCAL_CITIES.filter((city) => !visited.includes(city));

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

      {/* Grade da Camada Mundo */}
      <div className="grid grid-cols-3 gap-3">
        {WORLD_ACHIEVEMENTS.map((achievement) => (
          <TrophyCard
            key={achievement.key}
            achievement={achievement}
            isUnlocked={unlocked.has(achievement.key)}
          />
        ))}
      </div>

      {/* Camada Local — por destino */}
      <h3 className="text-sm font-bold font-['Outfit'] text-foreground mt-6 mb-3">📍 Por destino</h3>

      {visited.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3 font-['Plus_Jakarta_Sans']">
          Os troféus de destino aparecem aqui quando você viver a primeira viagem numa cidade
          curada.
        </p>
      ) : (
        visited.map((city) => (
          <div key={city} className="mb-4">
            <p className="text-xs font-semibold text-foreground mb-2 font-['Outfit']">{city}</p>
            <div className="grid grid-cols-3 gap-3">
              {localAchievementsOf(city).map((achievement) => (
                <TrophyCard
                  key={achievement.key}
                  achievement={achievement}
                  isUnlocked={unlocked.has(achievement.key)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* As demais, em lista compacta. Sem contagem por cidade e sem barra: é convite de
          viagem, não placar — o §5 do desenho não quer comparação na v1. */}
      {waiting.length > 0 && (
        <div className="bg-card/40 border border-border rounded-xl p-3">
          <button
            type="button"
            onClick={() => setShowAllCities((open) => !open)}
            className="w-full text-left text-xs text-muted-foreground font-['Plus_Jakarta_Sans']"
          >
            🔒 {waiting.length} {waiting.length === 1 ? 'destino esperando' : 'destinos esperando'}
          </button>
          {showAllCities && (
            <p className="text-[11px] leading-relaxed text-muted-foreground/70 mt-2 font-['Plus_Jakarta_Sans']">
              {waiting.join(' · ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
