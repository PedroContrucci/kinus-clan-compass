import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

describe("fontes da marca no index.html", () => {
  const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
  it("tem <link rel=stylesheet> do Google Fonts com Outfit e Plus Jakarta Sans", () => {
    const m = html.match(/<link[^>]*rel="stylesheet"[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"/);
    expect(m).not.toBeNull();
    expect(m![1]).toContain("family=Outfit");
    expect(m![1]).toContain("Plus+Jakarta+Sans");
    expect(m![1]).toContain("display=swap");
  });
});
