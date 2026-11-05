import { describe, it, expect } from "vitest";
import { expandRadius } from "../services/radiusExpansion.js";

const cfg = { expansionStepsKm: [15, 25, 40], minResults: 3, allowOutsideServiceArea: true };
const row = (id, km, inArea = true) => ({ id, distance_km: km, in_area: inArea });

describe("ampliação gradual do raio", () => {
  it("fica no raio inicial quando já há o mínimo", () => {
    const out = expandRadius([row(1, 2), row(2, 5), row(3, 9), row(4, 20)], cfg);
    expect(out).toMatchObject({ radiusKm: 15, expanded: false, outsideServiceArea: false });
    expect(out.rows.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("amplia para o próximo raio quando faltam candidatos", () => {
    const out = expandRadius([row(1, 2), row(2, 18), row(3, 22), row(4, 35)], cfg);
    expect(out).toMatchObject({ radiusKm: 25, expanded: true, outsideServiceArea: false });
    expect(out.rows).toHaveLength(3);
  });

  it("nunca inclui quem está além do maior raio", () => {
    const out = expandRadius([row(1, 2), row(2, 45), row(3, 60)], { ...cfg, allowOutsideServiceArea: false });
    expect(out.radiusKm).toBe(40);
    expect(out.rows.map((r) => r.id)).toEqual([1]);
  });

  it("como último recurso inclui prestadores próximos fora da área habitual, marcados", () => {
    const out = expandRadius([row(1, 3), row(2, 5, false), row(3, 8, false), row(4, 9, false)], cfg);
    expect(out.outsideServiceArea).toBe(true);
    expect(out.rows.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(out.rows[0].outside_service_area).toBeUndefined();
    expect(out.rows[1].outside_service_area).toBe(true);
  });

  it("sem permissão para fora da área, devolve só os da área", () => {
    const out = expandRadius([row(1, 3), row(2, 5, false)], { ...cfg, allowOutsideServiceArea: false });
    expect(out.rows.map((r) => r.id)).toEqual([1]);
    expect(out.outsideServiceArea).toBe(false);
  });

  it("lista vazia não quebra", () => {
    expect(expandRadius([], cfg)).toMatchObject({ rows: [], radiusKm: 40, expanded: true, outsideServiceArea: false });
  });
});

describe("ordem com prestadores fora da área", () => {
  it("quem atende a região vem antes, mesmo com score menor", async () => {
    const { sortAndView } = await import("../services/professionalView.js");
    const mk = (id, km, rating, outside) => ({
      id, name: `P${id}`, role_title: "X", distance_km: km, rating_avg: rating, rating_count: 20,
      contacts_count: 20, services_done: 20, weekdays: [1], categories: ["eletrica"], services: [],
      ...(outside ? { outside_service_area: true } : {}),
    });
    const out = sortAndView([mk(1, 2, 5, true), mk(2, 9, 3.2, false)], { sort: "relevance", radiusKm: 40 });
    expect(out.map((p) => p.id)).toEqual([2, 1]);
    expect(out[1].outsideServiceArea).toBe(true);
  });
});
