import { useEffect, useState } from "react";

const cache = new Map<string, string>();

interface DestinationImageProps {
  query: string;
  className?: string;
  alt?: string;
}

export function DestinationImage({ query, className = "", alt = "" }: DestinationImageProps) {
  const [src, setSrc] = useState<string | null>(cache.get(query) ?? null);
  const [loading, setLoading] = useState(!cache.has(query));

  useEffect(() => {
    if (cache.has(query)) {
      setSrc(cache.get(query)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchImage() {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsplash?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch image");
        const data = await res.json();
        const photoUrl = data.photos?.[0]?.urls?.regular as string | undefined;
        if (photoUrl && !cancelled) {
          cache.set(query, photoUrl);
          setSrc(photoUrl);
        }
      } catch {
        // leave src as null
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchImage();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (loading || !src) {
    return <div className={`bg-gradient-to-br from-[#0f172a] to-[#1e293b] ${className}`} />;
  }

  return <img src={src} alt={alt} className={className} />;
}
