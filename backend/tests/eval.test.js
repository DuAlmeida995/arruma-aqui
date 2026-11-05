import { describe, it, expect } from "vitest";
import { evaluate } from "../scripts/eval.js";

describe("avaliação offline do ranking", () => {
  const out = evaluate();

  it("roda todos os cenários em menos de 1s cada", () => {
    expect(out.rows.length).toBeGreaterThanOrEqual(10);
    out.rows.forEach((r) => expect(r.ms).toBeLessThan(1000));
  });

  it("ranking não fica abaixo da busca simples", () => {
    expect(out.ranking).toBeGreaterThanOrEqual(out.simples);
  });
});
