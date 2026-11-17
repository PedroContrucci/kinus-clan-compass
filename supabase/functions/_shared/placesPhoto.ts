// Resolve a foto do Google Places (New) no SERVIDOR e devolve uma URL SEM chave (ou null).
// M26: antes o photoUrl embutia a chave da Places API e ia ao navegador.
// Sem imports (exercitável no Node). A chave vai no header, nunca na URL.
// 1 chamada paga (Place Photo) por foto resolvida; a imagem em si é servida pelo CDN do Google, sem chave.

const PHOTO_NAME_OK = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export async function resolvePhotoUrl(
  photoName: unknown,
  apiKey: string,
  maxW: number,
  maxH: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (typeof photoName !== "string" || !PHOTO_NAME_OK.test(photoName)) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetchImpl(
      `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxH}&maxWidthPx=${maxW}&skipHttpRedirect=true`,
      { headers: { "X-Goog-Api-Key": apiKey }, signal: ctl.signal },
    );
    if (!r.ok) return null;
    const j = await r.json();
    const uri = j?.photoUri;
    if (typeof uri !== "string" || !/^https:\/\//.test(uri)) return null;
    if (/[?&]key=/i.test(uri)) return null; // defesa: nunca devolver URL com chave
    return uri;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
