import { describe, it, expect, vi, afterEach } from "vitest";
import { readUpstream } from "../../supabase/functions/_shared/placesUpstream";
import { readFileSync } from "node:fs";

const up = (r: unknown) => (r as { upstream: unknown }).upstream;
const res = (status: number, body: unknown, raw = false) =>
  new Response(raw ? (body as string) : JSON.stringify(body), { status });

describe("readUpstream", () => {
  it("403 PERMISSION_DENIED + reason", async () => {
    const r = await readUpstream(res(403, { error: { code: 403, status: "PERMISSION_DENIED", message: "blocked key AIzaSyABC_def-123 x",
      details: [{ "@type": "t", reason: "API_KEY_SERVICE_BLOCKED" }] } }));
    expect(r.ok).toBe(false);
    expect(up(r)).toEqual({ httpStatus: 403, status: "PERMISSION_DENIED", reason: "API_KEY_SERVICE_BLOCKED" });
    expect((r as { logMessage: string }).logMessage).not.toMatch(/AIza[A-Za-z0-9_-]{3}/);
    expect(JSON.stringify(up(r))).not.toMatch(/blocked key/);
  });
  it("429", async () => {
    const r = await readUpstream(res(429, { error: { status: "RESOURCE_EXHAUSTED", message: "q" } }));
    expect(up(r)).toEqual({ httpStatus: 429, status: "RESOURCE_EXHAUSTED", reason: null });
  });
  it("400", async () => {
    const r = await readUpstream(res(400, { error: { status: "INVALID_ARGUMENT" } }));
    expect((up(r) as { status: string }).status).toBe("INVALID_ARGUMENT");
  });
  it("corpo não-JSON", async () => {
    const r = await readUpstream(res(502, "<html>bad</html>", true));
    expect(up(r)).toEqual({ httpStatus: 502, status: null, reason: null });
  });
  it("200 com error no corpo", async () => {
    const r = await readUpstream(res(200, { error: { status: "PERMISSION_DENIED" } }));
    expect(r.ok).toBe(false);
  });
  it("log cortado em 500", async () => {
    const r = await readUpstream(res(500, { error: { message: "x".repeat(900) } }));
    expect((r as { logMessage: string }).logMessage.length).toBe(500);
  });
  it("sucesso devolve o corpo", async () => {
    const r = await readUpstream(res(200, { places: [{ id: "a" }] }));
    expect(r).toEqual({ ok: true, data: { places: [{ id: "a" }] } });
  });
});

describe("google-places index: handler simulado", () => {
  afterEach(() => vi.unstubAllGlobals());
  async function call(body: unknown, upstream: Response, extraFetch?: Response) {
    vi.resetModules();
    let handler: (req: Request) => Promise<Response>;
    vi.stubGlobal("Deno", { env: { get: () => "AIzaSECRETKEY123" } });
    vi.doMock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: (h: typeof handler) => { handler = h; } }));
    vi.doMock("../../supabase/functions/_shared/http.ts", () => ({ corsGate: () => ({ headers: { "X-T": "1" } }) }));
    const f = vi.fn().mockResolvedValueOnce(upstream);
    if (extraFetch) f.mockResolvedValue(extraFetch);
    vi.stubGlobal("fetch", f);
    const idx = "../../supabase/functions/google-places/index.ts";
    await import(/* @vite-ignore */ idx);
    const r: Response = await handler(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
    return { status: r.status, text: await r.text(), headers: r.headers };
  }
  const denied = () => res(403, { error: { status: "PERMISSION_DENIED", message: "key AIzaSECRETKEY123 bad",
    details: [{ reason: "API_KEY_SERVICE_BLOCKED" }] } });
  const upO = { httpStatus: 403, status: "PERMISSION_DENIED", reason: "API_KEY_SERVICE_BLOCKED" };

  it("search recusado", async () => {
    const r = await call({ action: "search", query: "q", destination: "d" }, denied());
    expect(r.status).toBe(200);
    expect(JSON.parse(r.text)).toEqual({ found: false, unavailable: true, upstream: upO });
    expect(r.text).not.toMatch(/AIza|bad/);
  });
  it("search_many recusado mantém results []", async () => {
    const r = await call({ action: "search_many", query: "q", destination: "d" }, denied());
    expect(JSON.parse(r.text)).toEqual({ found: false, unavailable: true, upstream: upO, results: [] });
  });
  it("details recusado → found:false", async () => {
    const r = await call({ action: "details", placeId: "p" }, denied());
    expect(JSON.parse(r.text)).toEqual({ found: false, unavailable: true, upstream: upO });
  });
  it("search sucesso inalterado", async () => {
    const r = await call({ action: "search", query: "q", destination: "d" },
      res(200, { places: [{ id: "i", displayName: { text: "N" }, formattedAddress: "A", rating: 4 }] }));
    expect(JSON.parse(r.text)).toEqual({ found: true, id: "i", name: "N", address: "A", rating: 4, photoUrl: null });
  });
  it("search_many sucesso inalterado", async () => {
    const r = await call({ action: "search_many", query: "q", destination: "d" },
      res(200, { places: [{ displayName: { text: "N" } }] }));
    expect(JSON.parse(r.text)).toEqual({ found: true, results: [{ name: "N" }] });
  });
  it("search sem resultado continua found:false simples", async () => {
    const r = await call({ action: "search", query: "q", destination: "d" }, res(200, {}));
    expect(JSON.parse(r.text)).toEqual({ found: false });
  });
  it("details sucesso inalterado", async () => {
    const r = await call({ action: "details", placeId: "p" },
      res(200, { id: "i", displayName: { text: "N" }, reviews: [{ rating: 5, text: { text: "ok" } }] }));
    expect(JSON.parse(r.text)).toEqual({ found: true, id: "i", name: "N", photoUrl: null, reviews: [{ rating: 5, text: "ok" }] });
  });
});
