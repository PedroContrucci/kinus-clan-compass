import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ClaLazyImage } from '@/components/cla/ClaLazyImage';
import { placePhotoUrl, isPlacePhotoMissing, markPlacePhotoMissing, fetchPlacePhotoAttribution, type PlacePhotoWidth } from '@/lib/placePhoto';

type Tone = 'food' | 'hotel' | 'culture' | 'beach' | 'tip';

const TONE_CLASS: Record<Tone, string> = {
  food: 'from-amber-500/25 via-card to-rose-500/15',
  hotel: 'from-sky-500/25 via-card to-emerald-500/15',
  culture: 'from-violet-500/25 via-card to-sky-500/15',
  beach: 'from-cyan-500/25 via-card to-amber-500/15',
  tip: 'from-emerald-500/25 via-card to-amber-500/15',
};

interface PlacePhotoProps {
  id?: string | null;
  name: string;
  city: string;
  w?: PlacePhotoWidth;
  categoryKeyword?: string;
  tone?: Tone;
  className?: string;
  /** Substitui a cadeia Unsplash padrão quando a foto real não existe. */
  fallback?: ReactNode;
}

/** Foto real do lugar primeiro; 404/erro → cadeia Unsplash. Nunca uma caixa vazia. */
export function PlacePhoto({ id, name, city, w = 640, categoryKeyword, tone = 'culture', className = '', fallback }: PlacePhotoProps) {
  const url = placePhotoUrl(id, w);
  const [failed, setFailed] = useState(() => !url || isPlacePhotoMissing(id));
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setFailed(!url || isPlacePhotoMissing(id)); setLoaded(false); }, [url, id]);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || visible || failed) return;
    const obs = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '240px' });
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible, failed]);

  if (failed) {
    return <>{fallback ?? <ClaLazyImage name={name} city={city} categoryKeyword={categoryKeyword} tone={tone} className={className} />}</>;
  }
  return (
    <div ref={hostRef} className={`relative bg-gradient-to-br ${TONE_CLASS[tone]} ${className}`}>
      {visible && url && (
        <img
          src={url}
          alt={`${name}, ${city}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => { if (id) markPlacePhotoMissing(id); setFailed(true); }}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

/** Linha "Foto: <autor>" — só nos drawers. */
export function PlacePhotoCredit({ id }: { id?: string | null }) {
  const [credit, setCredit] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setCredit(null);
    if (!id || isPlacePhotoMissing(id)) return;
    fetchPlacePhotoAttribution(id).then((c) => { if (alive) setCredit(c); });
    return () => { alive = false; };
  }, [id]);
  if (!credit) return null;
  return <p className="text-[10px] text-muted-foreground">Foto: {credit}</p>;
}
