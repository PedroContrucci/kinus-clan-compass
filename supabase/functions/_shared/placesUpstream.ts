// M27: interpreta a resposta do Google Places e extrai o MOTIVO da recusa sem vazar nada ao cliente.
// Sem imports (exercitável no Node). A mensagem completa vai só para o log (cortada e sem chave).

export interface UpstreamInfo {
  httpStatus: number;
  status: string | null;
  reason: string | null;
}

export type UpstreamResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; upstream: UpstreamInfo; logMessage: string };

export function maskKeys(s: string): string {
  return s.replace(/AIza[A-Za-z0-9_-]*/g, "AIza***");
}

// Lê o corpo (texto → JSON, tolerando corpo que não é JSON) e decide se o Google recusou.
export async function readUpstream(response: Response): Promise<UpstreamResult> {
  let raw = "";
  try { raw = await response.text(); } catch { raw = ""; }
  let data: Record<string, unknown> | null = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

  const err = (data ? data.error : undefined) as { status?: unknown; message?: unknown; details?: unknown } | undefined;
  if (response.ok && !err && data !== null) return { ok: true, data };

  const status = err && typeof err.status === "string" ? err.status : null;
  let reason: string | null = null;
  if (err && Array.isArray(err.details)) {
    for (const d of err.details as Array<{ reason?: unknown } | null>) {
      if (d && typeof d.reason === "string") { reason = d.reason; break; }
    }
  }
  const msg = err && typeof err.message === "string" ? err.message : raw;
  return {
    ok: false,
    upstream: { httpStatus: response.status, status, reason },
    logMessage: maskKeys(String(msg ?? "")).slice(0, 500),
  };
}
