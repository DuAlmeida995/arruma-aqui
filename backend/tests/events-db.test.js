// Eventos das métricas: percorre o fluxo completo e confere que os 6 eventos foram gravados.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const stamp = Date.now();
const userIds = [];

const as = (t) => ({
  get: (u) => supertest(app).get(u).set("Authorization", `Bearer ${t}`),
  post: (u, body = {}) => supertest(app).post(u).set("Authorization", `Bearer ${t}`).send(body),
  put: (u, body) => supertest(app).put(u).set("Authorization", `Bearer ${t}`).send(body),
});

async function register(role) {
  const res = await supertest(app)
    .post("/api/auth/register")
    .send({ name: `Evento ${role}`, email: `evento.${role}.${stamp}@exemplo.com`, password: "senha-forte-1", role, bairro: "Santana" });
  userIds.push(res.body.user.id);
  return { id: res.body.user.id, token: res.body.token };
}

// os eventos são gravados sem bloquear a resposta; espera até aparecerem
async function waitForEvents(types, timeoutMs = 8000) {
  const start = Date.now();
  for (;;) {
    const { rows } = await db.query("select type, user_id, payload from events where user_id = any($1)", [userIds]);
    const got = new Set(rows.map((r) => r.type));
    if (types.every((t) => got.has(t)) || Date.now() - start > timeoutMs) return rows;
    await new Promise((r) => setTimeout(r, 300));
  }
}

beforeAll(() => {
  process.env.EVENTS_IN_TESTS = "1";
});

afterAll(async () => {
  delete process.env.EVENTS_IN_TESTS;
  if (!dbReady) return;
  await db.query("delete from events where user_id = any($1)", [userIds]);
  await db.query("delete from users where id = any($1)", [userIds]);
});

describe.skipIf(!dbReady)("eventos das métricas", () => {
  it("registra os 6 eventos do fluxo cliente → prestador → avaliação", async () => {
    const client = await register("client");
    const provider = await register("provider");
    await as(provider.token).put("/api/provider/profile", {
      roleTitle: "Pintor",
      bairro: "Santana",
      radiusKm: 10,
      categories: [{ id: "pintura", services: [] }],
      availability: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: "08:00", end: "18:00" })),
    });

    const c = as(client.token);
    await c.get("/api/professionals?cat=pintura");
    await c.get(`/api/professionals/${provider.id}`);
    const req = await c.post("/api/requests", { categoryId: "pintura", description: "Pintar a sala e o corredor." });
    const conv = await c.post("/api/conversations", { providerId: provider.id, text: "Olá!", requestId: req.body.request.id });
    await as(provider.token).post(`/api/conversations/${conv.body.id}/messages`, { text: "Olá! Posso ir amanhã." });
    await as(provider.token).post(`/api/conversations/${conv.body.id}/service`);
    await c.post(`/api/conversations/${conv.body.id}/review`, { stars: 5, text: "Ótimo." });

    const types = ["list_shown", "profile_opened", "request_created", "contact_started", "provider_replied", "review_created"];
    const rows = await waitForEvents(types);
    const byType = (t) => rows.filter((r) => r.type === t);

    for (const t of types) expect(byType(t).length, t).toBeGreaterThan(0);
    expect(byType("list_shown").map((r) => r.payload.source).sort()).toEqual(["request", "search"]);
    expect(byType("profile_opened")[0].payload.providerId).toBe(provider.id);
    expect(byType("contact_started")[0].payload).toMatchObject({ providerId: provider.id, requestId: req.body.request.id });
    expect(Number(byType("provider_replied")[0].user_id)).toBe(provider.id);
    expect(byType("review_created")[0].payload.stars).toBe(5);
  });
});
