import { useEffect, useRef, useState } from 'react';
import { DestinationImage } from '@/components/shared/DestinationImage';

interface ClaLazyImageProps {
  name: string;
  city: string;
  className?: string;
}

export function ClaLazyImage({ name, city, className = '' }: ClaLazyImageProps) {
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
    <div ref={hostRef} className={`bg-gradient-to-br from-card via-secondary to-muted ${className}`}>
      {visible && (
        <DestinationImage
          query={`${name} ${city}`}
          destination={city}
          resetKey={`${city}:${name}`}
          alt={`${name}, ${city}`}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}