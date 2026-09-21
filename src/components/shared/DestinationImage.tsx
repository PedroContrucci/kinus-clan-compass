import { useEffect, useState } from "react";
import { DESTINATION_PHOTO_HINTS } from "@/hooks/useUnsplash";

const cache = new Map<string, string>();

interface DestinationImageProps {
  query: string;
  destination?: string;
  className?: string;
  alt?: string;
  /** Identidade da entidade dona da imagem (ex.: trip.id). Troca de id = reset do estado. */
  resetKey?: string;
  /** URL de capa já gravada na viagem. Se vier, é usada direto, sem buscar. */
  storedUrl?: string | null;
  /** Chamado quando uma capa nova é resolvida (para persistir na viagem). */
  onResolved?: (url: string) => void;
}

export function DestinationImage({
  query,
  destination,
  className = "",
  alt = "",
  resetKey,
  storedUrl,
  onResolved,
}: DestinationImageProps) {
  const destKey = (destination || "").trim().toLowerCase();
  const effectiveQuery = DESTINATION_PHOTO_HINTS[destKey] || query;

  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset imediato: nunca mostrar a foto da viagem anterior.
    if (storedUrl) {
      setSrc(storedUrl);
      setLoading(false);
      return;
    }

    const cached = cache.get(effectiveQuery);
    if (cached) {
      setSrc(cached);
      setLoading(false);
      onResolved?.(cached);
      return;
    }

    setSrc(null);
    setLoading(true);

    let cancelled = false;

    async function fetchImage() {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsplash?query=${encodeURIComponent(effectiveQuery)}&per_page=1&orientation=landscape`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch image");
        const data = await res.json();
        const photoUrl = data.photos?.[0]?.urls?.regular as string | undefined;
        if (photoUrl && !cancelled) {
          cache.set(effectiveQuery, photoUrl);
          setSrc(photoUrl);
          onResolved?.(photoUrl);
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
    // onResolved é fire-and-forget; não entra nas deps para não refazer o fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuery, storedUrl, resetKey]);

  if (loading || !src) {
    return <div className={`bg-gradient-to-br from-[#0f172a] to-[#1e293b] ${className}`} />;
  }

  return <img src={src} alt={alt} className={className} />;
}
