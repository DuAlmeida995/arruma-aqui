// Métricas calculadas sobre eventos sintéticos de dois usuários de teste (resultado conhecido).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import app from "../app.js";
import db from "../db/index.js";
import metrics from "../repositories/metrics.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const stamp = Date.now();
const ids = [];

async function user(n) {
  const { rows } = await db.query(
    "insert into users (name, email, password_hash, role) values ($1, $2, '!', 'client') returning id",
    [`Métrica ${n}`, `metrica.${n}.${stamp}@exemplo.com`]
  );
  ids.push(Number(rows[0].id));
  return Number(rows[0].id);
}

async function ev(userId, type, payload, minutesAgo) {
  await db.query("insert into events (user_id, type, payload, created_at) values ($1, $2, $3, now() - make_interval(mins => $4))", [
    userId,
    type,
    payload,
    minutesAgo,
  ]);
}

beforeAll(async () => {
  if (!dbReady) return;
  const a = await user("a");
  const b = await user("b");
  // A: viu a lista (top 101,102,103), contatou o 2º colocado 10 min depois, pedido 7 virou contato, avaliou 4
  await ev(a, "request_created", { requestId: 7 }, 60);
  await ev(a, "list_shown", { source: "request", requestId: 7, top: [101, 102, 103] }, 50);
  await ev(a, "contact_started", { providerId: 102, requestId: 7, conversationId: 1 }, 40);
  await ev(a, "provider_replied", { conversationId: 1, minutes: 30 }, 10);
  await ev(a, "review_created", { stars: 4 }, 5);
  // B: viu a lista e não contatou; criou um pedido sem contato
  await ev(b, "list_shown", { source: "search", top: [201] }, 30);
  await ev(b, "request_created", { requestId: 8 }, 20);
});

afterAll(async () => {
  if (!dbReady) return;
  await db.query("delete from events where user_id = any($1)", [ids]);
  await db.query("delete from users where id = any($1)", [ids]);
});

describe.skipIf(!dbReady)("métricas", () => {
  it("calcula as métricas a partir dos eventos", async () => {
    const m = await metrics.compute({ userIds: ids });
    expect(m.totals).toEqual({ requestsCreated: 2, listsShown: 2, profilesOpened: 0, contactsStarted: 1, providerReplies: 1, reviews: 1 });
    expect(m.contactRate).toBe(0.5); // 1 de 2 usuários que viram lista
    expect(m.timeToContactMinutes.median).toBeCloseTo(10, 0);
    expect(m.requestConversion).toBe(0.5); // pedido 7 de 2 pedidos
    expect(m.providerResponseRate).toBe(1);
    expect(m.providerResponseMinutesMedian).toBe(30);
    expect(m.satisfactionMean).toBe(4);
    expect(m.contactedPosition).toMatchObject({ mean: 2, top3Share: 1, n: 1 });
  });

  it("filtra por período", async () => {
    const m = await metrics.compute({ userIds: ids, from: new Date(Date.now() - 25 * 60000).toISOString() });
    expect(m.totals.requestsCreated).toBe(1); // só o pedido de 20 min atrás
    expect(m.totals.contactsStarted).toBe(0);
  });

  it("rota só para admin e valida datas", async () => {
    const login = (email) => supertest(app).post("/api/auth/login").send({ email, password: "demo1234" });
    const admin = (await login("admin@exemplo.com")).body.token;
    const client = (await login("cliente@exemplo.com")).body.token;
    expect((await supertest(app).get("/api/admin/metrics").set("Authorization", `Bearer ${client}`)).status).toBe(403);
    expect((await supertest(app).get("/api/admin/metrics?from=ontem").set("Authorization", `Bearer ${admin}`)).status).toBe(400);
    const ok = await supertest(app).get("/api/admin/metrics").set("Authorization", `Bearer ${admin}`);
    expect(ok.status).toBe(200);
    expect(ok.body).toHaveProperty("totals");
  });
});
