import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolvePhotoUrl } from "../../supabase/functions/_shared/placesPhoto";

const NAME = "places/ChIJabc123/photos/AUy1_xyz";
const mk = (res: Partial<Response> & { json?: () => Promise<unknown> }) =>
  vi.fn().mockResolvedValue(res) as unknown as typeof fetch;

describe("google-places: leitura do código", () => {
  const src = readFileSync("supabase/functions/google-places/index.ts", "utf8");
  const helper = readFileSync("supabase/functions/_shared/placesPhoto.ts", "utf8");
  it("nenhuma string monta key= no index", () => expect(src).not.toMatch(/key=/i));
  it("helper não monta key= em URL (só no teste defensivo)", () => {
    expect(helper.match(/key=/gi)?.length ?? 0).toBe(1);
    expect(helper).toMatch(/\[\?&\]key=/);
    expect(helper).toContain("skipHttpRedirect=true");
  });
});

describe("resolvePhotoUrl", () => {
  it("photoUri presente → URL sem chave", async () => {
    const f = mk({ ok: true, json: async () => ({ photoUri: "https://lh3.googleusercontent.com/p/abc" }) });
    expect(await resolvePhotoUrl(NAME, "SEGREDO", 400, 300, f)).toBe("https://lh3.googleusercontent.com/p/abc");
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).not.toMatch(/key=/i);
    expect(init.headers["X-Goog-Api-Key"]).toBe("SEGREDO");
  });
  it("photoUri ausente → null", async () => {
    expect(await resolvePhotoUrl(NAME, "k", 1, 1, mk({ ok: true, json: async () => ({}) }))).toBeNull();
  });
  it("erro HTTP → null", async () => {
    expect(await resolvePhotoUrl(NAME, "k", 1, 1, mk({ ok: false }))).toBeNull();
  });
  it("fetch lança → null", async () => {
    expect(await resolvePhotoUrl(NAME, "k", 1, 1, vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch)).toBeNull();
  });
  it("photoUri com key= → null", async () => {
    const f = mk({ ok: true, json: async () => ({ photoUri: "https://x.com/a?key=Z" }) });
    expect(await resolvePhotoUrl(NAME, "k", 1, 1, f)).toBeNull();
  });
  it("nome inválido/ausente → null sem chamar rede", async () => {
    const f = mk({ ok: true });
    expect(await resolvePhotoUrl("../x", "k", 1, 1, f)).toBeNull();
    expect(await resolvePhotoUrl(undefined, "k", 1, 1, f)).toBeNull();
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });
});
