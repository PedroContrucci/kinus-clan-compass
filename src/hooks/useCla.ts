// Hooks finos por cima de src/lib/cla.ts — nada de regra aqui, só estado de tela.
import { useCallback, useEffect, useState } from 'react';
import {
  claStats,
  hasLivedCity,
  myReactions,
  type ClaStat,
  type MyReaction,
  type ReactionKind,
} from '@/lib/cla';

/** Só as estatísticas da cidade (prova social do roteiro). Cache por sessão no lib. */
export function useClaStats(city?: string) {
  const [stats, setStats] = useState<Map<string, ClaStat>>(new Map());

  useEffect(() => {
    let alive = true;
    if (!city) { setStats(new Map()); return; }
    void claStats(city).then((s) => { if (alive) setStats(s); });
    return () => { alive = false; };
  }, [city]);

  return stats;
}

/** Stats do clã da cidade + as reações do próprio usuário. Nunca bloqueia a renderização. */
export function useClaCity(city?: string) {
  const [stats, setStats] = useState<Map<string, ClaStat>>(new Map());
  const [mine, setMine] = useState<Map<string, ReactionKind>>(new Map());
  const [lived, setLived] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (force = false) => {
      if (!city) return;
      setLoading(true);
      const [s, l, r] = await Promise.all([claStats(city, force), hasLivedCity(city), myReactions(city, force)]);
      setStats(s);
      setLived(l);
      setMine(new Map((r as MyReaction[]).map((x) => [x.activity_id, x.kind])));
      setLoading(false);
    },
    [city]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const setLocalReaction = useCallback((activityId: string, kind: ReactionKind | null) => {
    setMine((prev) => {
      const next = new Map(prev);
      if (kind) next.set(activityId, kind);
      else next.delete(activityId);
      return next;
    });
  }, []);

  return { stats, mine, lived, loading, reload: load, setLocalReaction };
}
