import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(process.cwd(), "supabase/functions/kinu-ai/index.ts"), "utf-8");

describe("prompt do agente: orçamento sem número de memória (M22c)", () => {
  it("não contém mais os textos antigos de sanidade de orçamento", () => {
    expect(src).not.toContain("12-16k");
    expect(src).not.toContain("números aproximados");
    expect(src).not.toContain("números concretos");
  });
  it("regra 13 proíbe citar preço sem fonte", () => {
    const r13 = src.split("\n").find((l) => l.startsWith("13. "));
    expect(r13).toContain("PROIBIDO citar preço");
  });
});
