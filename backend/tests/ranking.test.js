import { describe, it, expect } from "vitest";
import { rank, simpleSort, bayesianRating, formatKm } from "../services/ranking.js";
import cfg from "../config/ranking.json";

const base = { availableWeekdays: [1, 2, 3, 4, 5], avgResponseMinutes: 60, contactsCount: 5, servicesDone: 4 };
const pro = (o) => ({ ...base, ...o });

describe("ranking", () => {
  it("pesos somam 1", () => {
    const sum = Object.values(cfg.weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("scores ficam entre 0 e 1", () => {
    const out = rank([pro({ id: 1, distanceKm: 0, ratingAvg: 5, ratingCount: 100 }), pro({ id: 2, distanceKm: 50, ratingAvg: 1, ratingCount: 3 })]);
    out.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(1);
    });
  });

  it("com o resto igual, o mais perto vem primeiro", () => {
    const out = rank([pro({ id: 1, distanceKm: 8, ratingAvg: 4.5, ratingCount: 10 }), pro({ id: 2, distanceKm: 1, ratingAvg: 4.5, ratingCount: 10 })]);
    expect(out[0].id).toBe(2);
  });

  it("com o resto igual, o melhor avaliado vem primeiro", () => {
    const out = rank([pro({ id: 1, distanceKm: 3, ratingAvg: 3.8, ratingCount: 20 }), pro({ id: 2, distanceKm: 3, ratingAvg: 4.9, ratingCount: 20 })]);
    expect(out[0].id).toBe(2);
  });

  it("nota bayesiana: 5.0 com 1 avaliação não supera 4.8 com 80", () => {
    expect(bayesianRating(5, 1, cfg.priors)).toBeLessThan(bayesianRating(4.8, 80, cfg.priors));
  });

  it("novato sem avaliação recebe nota neutra e não fica com score zero", () => {
    const [p] = rank([pro({ id: 1, distanceKm: 2, ratingAvg: null, ratingCount: 0, contactsCount: 0, servicesDone: 0 })]);
    expect(p.factors.rating).toBeCloseTo((cfg.priors.ratingMean - cfg.ratingFloor) / (5 - cfg.ratingFloor), 6);
    expect(p.score).toBeGreaterThan(0.3);
    expect(p.reasons).toContain("Novo na plataforma");
  });

  it("disponibilidade no dia pedido pesa", () => {
    const out = rank(
      [pro({ id: 1, distanceKm: 2, ratingAvg: 4.5, ratingCount: 10, availableWeekdays: [1] }), pro({ id: 2, distanceKm: 2, ratingAvg: 4.5, ratingCount: 10, availableWeekdays: [6] })],
      { weekday: 6 }
    );
    expect(out[0].id).toBe(2);
    expect(out[0].reasons).toContain("Disponível no dia pedido");
  });

  it("empate total é desempatado de forma estável", () => {
    const a = pro({ id: 7, distanceKm: 2, ratingAvg: 4.75, ratingCount: 4 });
    const b = pro({ id: 3, distanceKm: 2, ratingAvg: 4.75, ratingCount: 4 });
    expect(rank([a, b]).map((p) => p.id)).toEqual([3, 7]);
    expect(rank([b, a]).map((p) => p.id)).toEqual([3, 7]);
  });

  it("explica o motivo da recomendação", () => {
    const [p] = rank([pro({ id: 1, distanceKm: 0.6, ratingAvg: 4.9, ratingCount: 30, avgResponseMinutes: 10, servicesDone: 25, contactsCount: 26 })]);
    expect(p.reasons).toEqual(
      expect.arrayContaining(["Perto de você (menos de 1 km)", "Muito bem avaliado (4.9 em 30 avaliações)", "Costuma responder rápido"])
    );
  });

  it("busca simples ordena só por distância", () => {
    const out = simpleSort([pro({ id: 1, distanceKm: 5 }), pro({ id: 2, distanceKm: 1 })]);
    expect(out.map((p) => p.id)).toEqual([2, 1]);
  });

  it("distância exibida é arredondada", () => {
    expect(formatKm(0.42)).toBe("menos de 1 km");
    expect(formatKm(2.6)).toBe("3 km");
  });
});
