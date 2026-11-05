import { describe, it, expect } from "vitest";
import { buildSeed, bairros } from "../db/seed/data.js";

const data = buildSeed();
const byTag = (t) => data.providers.filter((p) => p.tags.includes(t));

describe("base fictícia", () => {
  it("é determinística", () => {
    expect(buildSeed()).toEqual(data);
  });

  it("tem ~60 prestadores e e-mails únicos de exemplo", () => {
    expect(data.providers).toHaveLength(60);
    const emails = data.users.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
    expect(emails.every((e) => e.endsWith("@exemplo.com"))).toBe(true);
  });

  it("tem contas de demo de cliente e admin", () => {
    expect(data.users.find((u) => u.email === "cliente@exemplo.com")?.role).toBe("client");
    expect(data.users.find((u) => u.email === "admin@exemplo.com")?.role).toBe("admin");
  });

  it("todo prestador tem ao menos uma categoria válida", () => {
    const cats = new Set(data.categories.map((c) => c.id));
    for (const p of data.providers) {
      const pcs = data.providerCategories.filter((pc) => pc.provider_id === p.user_id);
      expect(pcs.length).toBeGreaterThan(0);
      pcs.forEach((pc) => expect(cats.has(pc.category_id)).toBe(true));
    }
  });

  it("inclui os casos-limite", () => {
    expect(byTag("sem_avaliacao").length).toBeGreaterThanOrEqual(3);
    byTag("sem_avaliacao").forEach((p) => expect(data.reviews.some((r) => r.provider_id === p.user_id)).toBe(false));
    expect(data.providers.filter((p) => p.bairro === "Parelheiros")).toHaveLength(2);
    expect(byTag("inativo")[0].active).toBe(false);
    expect(byTag("raio_pequeno")[0].radius_km).toBeLessThanOrEqual(1);
    const semDisp = byTag("sem_disponibilidade")[0];
    expect(data.availability.some((a) => a.provider_id === semDisp.user_id)).toBe(false);
  });

  it("empatados têm mesma categoria, média e quantidade", () => {
    const [a, b] = byTag("empate");
    const stars = (p) => data.reviews.filter((r) => r.provider_id === p.user_id).map((r) => r.stars);
    const cat = (p) => data.providerCategories.find((pc) => pc.provider_id === p.user_id).category_id;
    expect(cat(a)).toBe(cat(b));
    expect(stars(a)).toEqual(stars(b));
  });

  it("relacionamentos e valores são consistentes", () => {
    const ids = new Set(data.users.map((u) => u.id));
    const contactIds = new Set(data.contacts.map((c) => c.id));
    const serviceIds = new Set(data.services.map((s) => s.id));
    data.reviews.forEach((r) => {
      expect(r.stars).toBeGreaterThanOrEqual(1);
      expect(r.stars).toBeLessThanOrEqual(5);
      expect(serviceIds.has(r.service_id)).toBe(true);
      expect(ids.has(r.client_id)).toBe(true);
    });
    data.services.forEach((s) => expect(contactIds.has(s.contact_id)).toBe(true));
    expect(new Set(data.reviews.map((r) => r.service_id)).size).toBe(data.reviews.length);
  });

  it("coordenadas ficam perto do centro do bairro (sem endereço exato)", () => {
    for (const p of data.providers) {
      const [lat, lng] = bairros[p.bairro];
      expect(Math.abs(p.lat - lat)).toBeLessThan(0.004);
      expect(Math.abs(p.lng - lng)).toBeLessThan(0.004);
    }
  });
});
