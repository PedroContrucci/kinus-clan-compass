import { useEffect, useRef, useState } from "react";
import { DESTINATION_PHOTO_HINTS } from "@/hooks/useUnsplash";

const cache = new Map<string, string>();

function sessionKey(query: string): string {
  return `kinu:destination-image:${query.toLowerCase()}`;
}

function readSession(query: string): string | null {
  try {
    const value = window.sessionStorage.getItem(sessionKey(query));
    return isUsableUrl(value) ? value : null;
  } catch {
    return null;
  }
}

function writeSession(query: string, url: string): void {
  try {
    window.sessionStorage.setItem(sessionKey(query), url);
  } catch {
    // A imagem continua disponível no cache em memória quando o storage está bloqueado.
  }
}

function isUsableUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed);
}

interface DestinationImageProps {
  query: string;
  destination?: string;
  className?: string;
  alt?: string;
  /** Identidade da entidade dona da imagem (ex.: trip.id). Troca de id = reset do estado. */
  resetKey?: string;
  /** URL de capa já gravada na viagem. Só é usada se for uma URL http(s) válida. */
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
  // Quando a URL gravada quebra no <img>, ignoramos ela e buscamos de novo.
  const [ignoreStored, setIgnoreStored] = useState(false);
  const loggedRef = useRef(false);

  const logOnce = (reason: string) => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    console.log(`[hero] fallback: ${reason}`);
  };

  useEffect(() => {
    setIgnoreStored(false);
    loggedRef.current = false;
  }, [resetKey, effectiveQuery]);

  useEffect(() => {
    const usableStored = !ignoreStored && isUsableUrl(storedUrl);

    if (usableStored) {
      setSrc((storedUrl as string).trim());
      setLoading(false);
      return;
    }

    // Motivo do fallback — vale para undefined, null, "", espaços e URL inválida.
    if (ignoreStored) logOnce("stored cover failed to load");
    else if (storedUrl === undefined) logOnce("no cover field on trip");
    else if (storedUrl === null) logOnce("cover field is null");
    else if (typeof storedUrl !== "string") logOnce(`cover field is ${typeof storedUrl}`);
    else if (!storedUrl.trim()) logOnce("cover field is empty string");
    else logOnce(`cover field is not an http(s) URL: ${storedUrl.slice(0, 60)}`);

    const cached = cache.get(effectiveQuery) || readSession(effectiveQuery);
    if (cached) {
      cache.set(effectiveQuery, cached);
      setSrc(cached);
      setLoading(false);
      onResolved?.(cached);
      return;
    }

    // Reset imediato: nunca mostrar a foto da viagem anterior.
    setSrc(null);
    setLoading(true);

    let cancelled = false;

    // Frases muito específicas (ex.: "Fortaleza Ceara Beira Mar beach") voltam ZERO
    // resultados do Unsplash — era esse o hero vazio. Tentamos do mais específico
    // ao mais simples até vir foto.
    const candidates = Array.from(
      new Set(
        [effectiveQuery, query, destination?.trim(), `${destination?.trim() || query} city`]
          .map((c) => (c || "").trim())
          .filter(Boolean),
      ),
    );

    async function searchOnce(term: string): Promise<string | null> {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsplash?query=${encodeURIComponent(term)}&per_page=1&orientation=landscape`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      if (!res.ok) throw new Error(`unsplash ${res.status}`);
      const data = await res.json();
      const photoUrl = data.photos?.[0]?.urls?.regular as string | undefined;
      return isUsableUrl(photoUrl) ? photoUrl : null;
    }

    async function fetchImage() {
      try {
        for (const term of candidates) {
          if (cancelled) return;
          let photoUrl: string | null = null;
          try {
            photoUrl = await searchOnce(term);
          } catch {
            photoUrl = null;
          }
          if (!photoUrl) {
            console.log(`[hero] fallback: no photo for "${term}", tentando termo mais simples`);
            continue;
          }
          if (cancelled) return;
          cache.set(effectiveQuery, photoUrl);
          cache.set(term, photoUrl);
          writeSession(effectiveQuery, photoUrl);
          setSrc(photoUrl);
          onResolved?.(photoUrl);
          return;
        }
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
  }, [effectiveQuery, storedUrl, resetKey, ignoreStored]);

  if (loading || !src) {
    return <div className={`bg-gradient-to-br from-[#0f172a] to-[#1e293b] ${className}`} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        cache.delete(effectiveQuery);
        setSrc(null);
        setIgnoreStored(true);
      }}
    />
  );
}
