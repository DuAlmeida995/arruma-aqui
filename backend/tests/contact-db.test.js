// Contato direto cliente ↔ prestador contra o banco real (pulado sem DATABASE_URL + CA)
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
let client, provider;

const as = (t) => ({
  get: (u) => supertest(app).get(u).set("Authorization", `Bearer ${t}`),
  post: (u, body) => supertest(app).post(u).set("Authorization", `Bearer ${t}`).send(body),
  put: (u, body) => supertest(app).put(u).set("Authorization", `Bearer ${t}`).send(body),
});

async function register(role) {
  const res = await supertest(app)
    .post("/api/auth/register")
    .send({ name: `Teste ${role}`, email: `contato.${role}.${stamp}@exemplo.com`, password: "senha-forte-1", role, bairro: "Moema" });
  userIds.push(res.body.user.id);
  return { id: res.body.user.id, token: res.body.token };
}

beforeAll(async () => {
  if (!dbReady) return;
  client = await register("client");
  provider = await register("provider");
  await as(provider.token).put("/api/provider/profile", {
    roleTitle: "Encanador",
    bairro: "Moema",
    radiusKm: 10,
    whatsapp: "11 98888-7777",
    categories: [{ id: "hidraulica", services: [] }],
    availability: [{ weekday: 1, start: "08:00", end: "18:00" }],
  });
});

afterAll(async () => {
  if (dbReady) await db.query("delete from users where id = any($1)", [userIds]);
});

describe.skipIf(!dbReady)("contato direto", () => {
  let convId;

  it("cliente inicia conversa com o prestador", async () => {
    const res = await as(client.token).post("/api/conversations", { providerId: provider.id, text: "Olá! Pode vir amanhã?" });
    expect(res.status).toBe(201);
    convId = res.body.id;
    const conv = await as(client.token).get(`/api/conversations/${convId}`);
    expect(conv.body).toMatchObject({ otherIsProvider: true, role: "Encanador" });
    expect(conv.body.messages).toEqual([{ from: "me", text: "Olá! Pode vir amanhã?" }]);
  });

  it("segunda mensagem pelo perfil reaproveita a mesma conversa", async () => {
    const res = await as(client.token).post("/api/conversations", { providerId: provider.id, text: "Esqueci: é um vazamento." });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(convId);
  });

  it("prestador vê a conversa com o cliente e responde", async () => {
    const list = await as(provider.token).get("/api/conversations");
    const item = list.body.find((c) => c.id === convId);
    expect(item).toMatchObject({ name: "Teste client", role: "Cliente", otherIsProvider: false });
    const sent = await as(provider.token).post(`/api/conversations/${convId}/messages`, { text: "Posso sim, às 9h." });
    expect(sent.status).toBe(201);
    const conv = await as(client.token).get(`/api/conversations/${convId}`);
    expect(conv.body.messages.at(-1)).toEqual({ from: "them", text: "Posso sim, às 9h." });
  });

  it("a primeira resposta registra o tempo de resposta do prestador", async () => {
    const { rows } = await db.query(
      "select c.responded_at, p.avg_response_minutes from contacts c join provider_profiles p on p.user_id = c.provider_id where c.id = $1",
      [convId]
    );
    expect(rows[0].responded_at).not.toBeNull();
    expect(Number(rows[0].avg_response_minutes)).toBeGreaterThanOrEqual(0);
  });

  it("perfil público mostra o WhatsApp", async () => {
    const res = await as(client.token).get(`/api/professionals/${provider.id}`);
    expect(res.body.whatsapp).toBe("11 98888-7777");
  });

  it("não dá para avaliar antes de marcar o serviço como realizado", async () => {
    const conv = await as(client.token).get(`/api/conversations/${convId}`);
    expect(conv.body.service).toEqual({ done: false, canMarkDone: true });
    const res = await as(client.token).post(`/api/conversations/${convId}/review`, { stars: 5, text: "Ótimo" });
    expect(res.status).toBe(409);
  });

  it("prestador marca o serviço como realizado (idempotente)", async () => {
    const a = await as(provider.token).post(`/api/conversations/${convId}/service`, {});
    const b = await as(provider.token).post(`/api/conversations/${convId}/service`, {});
    expect(a.status).toBe(200);
    expect(b.body.service).toMatchObject({ done: true, canReview: false, review: null });
    const { rows } = await db.query("select count(*) from services where contact_id = $1", [convId]);
    expect(Number(rows[0].count)).toBe(1);
  });

  it("prestador não avalia; nota fora de 1–5 é recusada", async () => {
    expect((await as(provider.token).post(`/api/conversations/${convId}/review`, { stars: 5 })).status).toBe(403);
    expect((await as(client.token).post(`/api/conversations/${convId}/review`, { stars: 6 })).status).toBe(400);
  });

  it("cliente avalia uma vez e a média do prestador é atualizada", async () => {
    const res = await as(client.token).post(`/api/conversations/${convId}/review`, { stars: 4, text: "Pontual e caprichoso." });
    expect(res.status).toBe(201);
    expect(res.body.service).toMatchObject({ done: true, canReview: false, review: { stars: 4, text: "Pontual e caprichoso." } });
    expect((await as(client.token).post(`/api/conversations/${convId}/review`, { stars: 5 })).status).toBe(409);
    const pro = await as(client.token).get(`/api/professionals/${provider.id}`);
    expect(pro.body).toMatchObject({ rating: 4, reviews: 1 });
    expect(pro.body.reviewsList[0]).toMatchObject({ stars: 4, text: "Pontual e caprichoso." });
  });

  it("prestador não inicia conversa; mensagem vazia e prestador inexistente dão erro", async () => {
    expect((await as(provider.token).post("/api/conversations", { providerId: provider.id, text: "oi" })).status).toBe(403);
    expect((await as(client.token).post("/api/conversations", { providerId: provider.id, text: "  " })).status).toBe(400);
    expect((await as(client.token).post("/api/conversations", { providerId: 999999, text: "oi" })).status).toBe(404);
  });
});
