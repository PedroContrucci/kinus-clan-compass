import { useEffect, useRef, useState } from 'react';
import { DestinationImage } from '@/components/shared/DestinationImage';

interface ClaLazyImageProps {
  name: string;
  city: string;
  className?: string;
  tone?: 'food' | 'hotel' | 'culture' | 'beach' | 'tip';
}

const TONE_CLASS: Record<NonNullable<ClaLazyImageProps['tone']>, string> = {
  food: 'from-amber-500/25 via-card to-rose-500/15',
  hotel: 'from-sky-500/25 via-card to-emerald-500/15',
  culture: 'from-violet-500/25 via-card to-sky-500/15',
  beach: 'from-cyan-500/25 via-card to-amber-500/15',
  tip: 'from-emerald-500/25 via-card to-amber-500/15',
};

export function ClaLazyImage({ name, city, className = '', tone = 'culture' }: ClaLazyImageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '240px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={hostRef} className={`bg-gradient-to-br ${TONE_CLASS[tone]} ${className}`}>
      {visible && (
        <DestinationImage
          query={`${name} ${city}`}
          resetKey={`${city}:${name}`}
          alt={`${name}, ${city}`}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}