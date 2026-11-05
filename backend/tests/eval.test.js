import { describe, it, expect } from "vitest";
import { evaluate, evaluateRobust, generateScenarios } from "../scripts/eval.js";

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

describe("avaliação robusta", () => {
  it("gera um cenário por categoria × bairro", () => {
    expect(generateScenarios().cenarios).toHaveLength(8 * 12);
  });

  it("agrega várias bases e o ranking supera a busca simples", () => {
    const out = evaluateRobust({ seeds: [1, 2] });
    expect(out.bases).toBe(2);
    expect(out.ranking.media).toBeGreaterThan(out.simples.media);
    expect(out.ranking.min).toBeLessThanOrEqual(out.ranking.max);
  });
});
