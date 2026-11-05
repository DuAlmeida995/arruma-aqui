// Solicitações do cliente contra o banco real (pulado sem DATABASE_URL + CA)
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const createdIds = [];
let token;
let providerToken;

const as = (t) => ({
  get: (u) => supertest(app).get(u).set("Authorization", `Bearer ${t}`),
  post: (u, body) => supertest(app).post(u).set("Authorization", `Bearer ${t}`).send(body),
});

// próxima segunda-feira (dia 1), no formato AAAA-MM-DD
function nextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  if (!dbReady) return;
  token = (await supertest(app).post("/api/auth/login").send({ email: "cliente@exemplo.com", password: "demo1234" })).body.token;
  const { rows } = await db.query(
    "select u.email from users u join provider_profiles p on p.user_id = u.id where p.active order by u.id limit 1"
  );
  providerToken = (await supertest(app).post("/api/auth/login").send({ email: rows[0].email, password: "demo1234" })).body.token;
});

afterAll(async () => {
  if (dbReady && createdIds.length) await db.query("delete from requests where id = any($1)", [createdIds]);
});

describe.skipIf(!dbReady)("solicitações", () => {
  it("cria a solicitação e devolve recomendados da categoria, disponíveis no dia", async () => {
    const res = await as(token).post("/api/requests", {
      categoryId: "hidraulica",
      description: "Vazamento embaixo da pia da cozinha.",
      desiredDate: nextMonday(),
    });
    expect(res.status).toBe(201);
    createdIds.push(res.body.request.id);
    expect(res.body.request).toMatchObject({ categoryId: "hidraulica", categoryLabel: "Hidráulica", status: "open" });
    expect(res.body.total).toBeGreaterThan(0);
    const { rows } = await db.query("select distinct provider_id from availability where weekday = 1");
    const monday = new Set(rows.map((r) => Number(r.provider_id)));
    res.body.results.forEach((p) => {
      expect(p.categories).toContain("hidraulica");
      expect(monday.has(p.id)).toBe(true);
      expect(Array.isArray(p.reasons)).toBe(true);
    });
  });

  it("valida categoria, descrição e data", async () => {
    const post = (body) => as(token).post("/api/requests", body);
    expect((await post({ categoryId: "xyz", description: "Descrição suficiente" })).status).toBe(400);
    expect((await post({ categoryId: "pintura", description: "curta" })).body.error).toMatch(/10 caracteres/);
    expect((await post({ categoryId: "pintura", description: "Pintar a sala inteira", desiredDate: "2020-01-01" })).body.error).toMatch(/hoje/);
  });

  it("sem data, não filtra por dia", async () => {
    const res = await as(token).post("/api/requests", { categoryId: "pintura", description: "Pintar dois quartos pequenos." });
    expect(res.status).toBe(201);
    createdIds.push(res.body.request.id);
    expect(res.body.request.desiredDate).toBeNull();
  });

  it("lista e reabre as minhas solicitações", async () => {
    const list = await as(token).get("/api/requests");
    expect(list.body.map((r) => r.id)).toEqual(expect.arrayContaining(createdIds));
    const one = await as(token).get(`/api/requests/${createdIds[0]}`);
    expect(one.status).toBe(200);
    expect(one.body.request.id).toBe(createdIds[0]);
    expect(one.body.results.length).toBeGreaterThan(0);
  });

  it("prestador não cria solicitação e ninguém vê a solicitação de outro", async () => {
    expect((await as(providerToken).post("/api/requests", { categoryId: "pintura", description: "Pintar a sala inteira" })).status).toBe(403);
    expect((await as(providerToken).get(`/api/requests/${createdIds[0]}`)).status).toBe(403);
  });

  it("cliente encerra a solicitação", async () => {
    const res = await as(token).post(`/api/requests/${createdIds[1]}/close`, {});
    expect(res.status).toBe(200);
    expect((await as(token).get(`/api/requests/${createdIds[1]}`)).body.request.status).toBe("closed");
  });
});
