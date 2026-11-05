// Testes da busca geográfica (Atividade 3 do doc FAPESP) contra o banco real.
// Critérios: exclui fora da categoria/área, distâncias corretas e resposta < 1 s.
import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import app from "../app.js";
import db from "../db/index.js";
import repo from "../repositories/professionals.js";
import { haversineKm } from "../services/geo.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
let token;
let client; // { lat, lng } da conta de demo
const get = (url) => supertest(app).get(url).set("Authorization", `Bearer ${token}`);

beforeAll(async () => {
  if (!dbReady) return;
  token = (await supertest(app).post("/api/auth/login").send({ email: "cliente@exemplo.com", password: "demo1234" })).body.token;
  const { rows } = await db.query(
    "select ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng from users where email = 'cliente@exemplo.com'"
  );
  client = { lat: Number(rows[0].lat), lng: Number(rows[0].lng) };
});

describe.skipIf(!dbReady)("busca geográfica", () => {
  it("distância do PostGIS bate com Haversine (erro < 0,5%)", async () => {
    const rows = await repo.search({ ...client, withinServiceArea: false, maxDistKm: 50 });
    const { rows: coords } = await db.query(
      "select user_id, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng from provider_profiles"
    );
    const byId = new Map(coords.map((c) => [Number(c.user_id), c]));
    expect(rows.length).toBeGreaterThan(20);
    for (const r of rows) {
      const c = byId.get(Number(r.id));
      const expected = haversineKm(client.lat, client.lng, Number(c.lat), Number(c.lng));
      const got = Number(r.distance_km);
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(Math.max(0.005 * expected, 0.01));
    }
  });

  it("cada categoria só devolve prestadores daquela categoria", async () => {
    const cats = (await get("/api/categories")).body.map((c) => c.id);
    for (const cat of cats) {
      const res = await get(`/api/professionals?cat=${cat}`);
      expect(res.status).toBe(200);
      res.body.results.forEach((p) => expect(p.categories).toContain(cat));
    }
  });

  it("resultados respeitam o raio da busca e a área de atendimento", async () => {
    const res = await get("/api/professionals");
    const raw = await repo.search({ ...client, withinServiceArea: false, maxDistKm: 50 });
    const byId = new Map(raw.map((r) => [Number(r.id), r]));
    for (const p of res.body.results) {
      const r = byId.get(p.id);
      expect(Number(r.distance_km)).toBeLessThanOrEqual(res.body.search.radiusKm);
      if (!p.outsideServiceArea) expect(r.in_area).toBe(true);
    }
  });

  it("a distância exibida é arredondada (nunca a exata)", async () => {
    const res = await get("/api/professionals");
    res.body.results.forEach((p) => expect(p.dist).toMatch(/^(menos de 1 km|\d+ km)$/));
  });

  it("tempo de resposta da busca < 1 s (p95 de 10 buscas variadas)", async () => {
    const urls = [
      "/api/professionals",
      "/api/professionals?cat=eletrica",
      "/api/professionals?cat=hidraulica&weekday=2",
      "/api/professionals?q=pintura",
      "/api/professionals?maxDist=3&sort=dist",
      "/api/professionals?cat=reparos&sort=rating",
      "/api/professionals?weekday=6",
      "/api/professionals?q=montagem&cat=montagem",
      "/api/professionals?cat=limpeza&maxDist=10",
      "/api/professionals?cat=costura",
    ];
    const times = [];
    for (const u of urls) {
      const t = performance.now();
      const res = await get(u);
      times.push(performance.now() - t);
      expect(res.status).toBe(200);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.ceil(0.95 * times.length) - 1];
    console.log(`busca: mediana ${times[4].toFixed(0)} ms, p95 ${p95.toFixed(0)} ms`);
    expect(p95).toBeLessThan(1000);
  });
});
