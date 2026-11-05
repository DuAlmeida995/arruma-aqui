// Onboarding do prestador contra o banco real (pulado sem DATABASE_URL + CA)
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const stamp = Date.now();
const emails = [`prestador.${stamp}@exemplo.com`, `cliente.${stamp}@exemplo.com`];
let providerToken, clientToken, providerId;

const profile = {
  roleTitle: "Eletricista",
  description: "Instalações e reparos elétricos residenciais.",
  experienceYears: 5,
  bairro: "Penha",
  radiusKm: 8,
  whatsapp: "11 91234-5678",
  categories: [{ id: "eletrica", services: ["Troca de disjuntores", "Chuveiro elétrico"] }],
  availability: [
    { weekday: 1, start: "08:00", end: "17:00" },
    { weekday: 3, start: "08:00", end: "12:00" },
  ],
};

beforeAll(async () => {
  if (!dbReady) return;
  const reg = (email, role) =>
    request(app).post("/api/auth/register").send({ name: "Teste Onboarding", email, password: "senha-forte-1", role, bairro: "Penha" });
  const p = await reg(emails[0], "provider");
  providerToken = p.body.token;
  providerId = p.body.user.id;
  clientToken = (await reg(emails[1], "client")).body.token;
});

afterAll(async () => {
  if (dbReady) await db.query("delete from users where email = any($1)", [emails]);
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe.skipIf(!dbReady)("onboarding do prestador", () => {
  it("prestador novo ainda não tem perfil", async () => {
    const res = await request(app).get("/api/provider/profile").set(auth(providerToken));
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeNull();
  });

  it("cliente não acessa a área do prestador", async () => {
    const res = await request(app).put("/api/provider/profile").set(auth(clientToken)).send(profile);
    expect(res.status).toBe(403);
  });

  it("painel é null antes de montar o perfil e cliente não acessa", async () => {
    expect((await request(app).get("/api/provider/dashboard").set(auth(providerToken))).body.dashboard).toBeNull();
    expect((await request(app).get("/api/provider/dashboard").set(auth(clientToken))).status).toBe(403);
  });

  it("valida categoria, bairro e horários", async () => {
    const put = (body) => request(app).put("/api/provider/profile").set(auth(providerToken)).send(body);
    expect((await put({ ...profile, categories: [] })).body.error).toMatch(/categoria/);
    expect((await put({ ...profile, categories: [{ id: "inexistente", services: [] }] })).status).toBe(400);
    expect((await put({ ...profile, bairro: "Rua X" })).body.error).toMatch(/bairro/);
    expect((await put({ ...profile, availability: [{ weekday: 1, start: "18:00", end: "08:00" }] })).body.error).toMatch(/horário/);
  });

  it("salva o perfil e devolve igual", async () => {
    const res = await request(app).put("/api/provider/profile").set(auth(providerToken)).send(profile);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      roleTitle: "Eletricista",
      bairro: "Penha",
      radiusKm: 8,
      active: true,
      categories: profile.categories,
      availability: profile.availability,
    });
  });

  it("atualizar substitui categorias e disponibilidade", async () => {
    const res = await request(app)
      .put("/api/provider/profile")
      .set(auth(providerToken))
      .send({ ...profile, categories: [{ id: "reparos", services: [] }], availability: [{ weekday: 6, start: "09:00", end: "13:00" }] });
    expect(res.body.profile.categories).toEqual([{ id: "reparos", services: [] }]);
    expect(res.body.profile.availability).toHaveLength(1);
  });

  it("prestador passa a aparecer na busca de clientes", async () => {
    const res = await request(app).get("/api/professionals?cat=reparos&sort=dist").set(auth(clientToken));
    expect(res.body.results.map((p) => p.id)).toContain(providerId);
  });

  it("painel do prestador traz números zerados de um perfil novo", async () => {
    const res = await request(app).get("/api/provider/dashboard").set(auth(providerToken));
    expect(res.body.dashboard.stats).toMatchObject({ ratingAvg: null, ratingCount: 0, contacts: 0, servicesDone: 0, active: true });
    expect(res.body.dashboard.services).toEqual([]);
    expect(res.body.dashboard.reviews).toEqual([]);
  });

  it("desativar o perfil tira o prestador da busca", async () => {
    await request(app).put("/api/provider/profile").set(auth(providerToken)).send({ ...profile, active: false });
    const res = await request(app).get("/api/professionals?cat=eletrica").set(auth(clientToken));
    expect(res.body.results.map((p) => p.id)).not.toContain(providerId);
  });
});
