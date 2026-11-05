// Controle de acesso (Atividade 7): ninguém lê ou altera dados de outra pessoa,
// e cada papel só faz o que lhe cabe. Contra o banco real (pulado sem DATABASE_URL + CA).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const stamp = Date.now();
const ids = [];
const U = {}; // clientA, clientB, proP, proQ, admin
let convId, requestId;

const as = (t) => ({
  get: (u) => supertest(app).get(u).set("Authorization", `Bearer ${t}`),
  post: (u, b = {}) => supertest(app).post(u).set("Authorization", `Bearer ${t}`).send(b),
  put: (u, b = {}) => supertest(app).put(u).set("Authorization", `Bearer ${t}`).send(b),
  patch: (u, b = {}) => supertest(app).patch(u).set("Authorization", `Bearer ${t}`).send(b),
  del: (u, b = {}) => supertest(app).delete(u).set("Authorization", `Bearer ${t}`).send(b),
});

async function register(key, role) {
  const res = await supertest(app)
    .post("/api/auth/register")
    .send({ name: `Acesso ${key}`, email: `acesso.${key}.${stamp}@exemplo.com`, password: "senha-forte-1", role, bairro: "Mooca" });
  ids.push(res.body.user.id);
  U[key] = { id: res.body.user.id, token: res.body.token };
}

const profile = {
  roleTitle: "Eletricista",
  bairro: "Mooca",
  radiusKm: 10,
  categories: [{ id: "eletrica", services: [] }],
  availability: [{ weekday: 1, start: "08:00", end: "18:00" }],
};

beforeAll(async () => {
  if (!dbReady) return;
  await register("clientA", "client");
  await register("clientB", "client");
  await register("proP", "provider");
  await register("proQ", "provider");
  await as(U.proP.token).put("/api/provider/profile", profile);
  await as(U.proQ.token).put("/api/provider/profile", profile);
  U.admin = { token: (await supertest(app).post("/api/auth/login").send({ email: "admin@exemplo.com", password: "demo1234" })).body.token };
  requestId = (await as(U.clientA.token).post("/api/requests", { categoryId: "eletrica", description: "Trocar o disjuntor da cozinha." })).body.request.id;
  convId = (await as(U.clientA.token).post("/api/conversations", { providerId: U.proP.id, text: "Olá", requestId })).body.id;
});

afterAll(async () => {
  if (dbReady) await db.query("delete from users where id = any($1)", [ids]);
});

describe.skipIf(!dbReady)("controle de acesso", () => {
  it("outro cliente não vê nem mexe na conversa de A (404, sem revelar que existe)", async () => {
    const b = as(U.clientB.token);
    expect((await b.get(`/api/conversations/${convId}`)).status).toBe(404);
    expect((await b.post(`/api/conversations/${convId}/messages`, { text: "invasão" })).status).toBe(404);
    expect((await b.post(`/api/conversations/${convId}/service`)).status).toBe(404);
    expect((await b.post(`/api/conversations/${convId}/review`, { stars: 1 })).status).toBe(404);
    expect((await b.get("/api/conversations")).body.map((c) => c.id)).not.toContain(convId);
  });

  it("outro prestador não vê a conversa de P", async () => {
    const q = as(U.proQ.token);
    expect((await q.get(`/api/conversations/${convId}`)).status).toBe(404);
    expect((await q.post(`/api/conversations/${convId}/messages`, { text: "oi" })).status).toBe(404);
  });

  it("pedido de A é invisível para B", async () => {
    const b = as(U.clientB.token);
    expect((await b.get(`/api/requests/${requestId}`)).status).toBe(404);
    expect((await b.post(`/api/requests/${requestId}/close`)).status).toBe(404);
    expect((await b.get("/api/requests")).body.map((r) => r.id)).not.toContain(requestId);
  });

  it("B não consegue ligar a conversa dele a um pedido de A", async () => {
    const res = await as(U.clientB.token).post("/api/conversations", { providerId: U.proP.id, text: "oi", requestId });
    expect(res.status).toBe(404);
  });

  it("cada papel só acessa a sua área", async () => {
    const a = as(U.clientA.token);
    const p = as(U.proP.token);
    expect((await a.put("/api/provider/profile", profile)).status).toBe(403);
    expect((await a.get("/api/provider/dashboard")).status).toBe(403);
    expect((await a.get("/api/admin/metrics")).status).toBe(403);
    expect((await p.get("/api/admin/metrics")).status).toBe(403);
    expect((await p.post("/api/requests", { categoryId: "eletrica", description: "Pedido de prestador" })).status).toBe(403);
    expect((await p.post("/api/conversations", { providerId: U.proQ.id, text: "oi" })).status).toBe(403);
    expect((await p.post(`/api/conversations/${convId}/review`, { stars: 5 })).status).toBe(403);
    expect((await as(U.admin.token).get("/api/admin/metrics")).status).toBe(200);
  });

  it("prestador só edita o próprio perfil (não há como apontar outro id)", async () => {
    await as(U.proQ.token).put("/api/provider/profile", { ...profile, roleTitle: "Encanador" });
    const pView = await as(U.clientA.token).get(`/api/professionals/${U.proP.id}`);
    expect(pView.body.role).toBe("Eletricista");
  });

  it("perfil público não expõe e-mail, senha nem coordenadas", async () => {
    const res = await as(U.clientA.token).get(`/api/professionals/${U.proP.id}`);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/acesso\.proP|password|"lat"|"lng"|location/);
  });

  it("tokens adulterados, de outro segredo ou expirados são recusados", async () => {
    const [h, p] = U.clientA.token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: String(U.proP.id), role: "admin" })).toString("base64url");
    const tampered = `${h}.${forgedPayload}.${U.clientA.token.split(".")[2]}`;
    const otherSecret = jwt.sign({ sub: String(U.clientA.id), role: "admin" }, "outro-segredo");
    const expired = jwt.sign({ sub: String(U.clientA.id), role: "client", exp: Math.floor(Date.now() / 1000) - 5 }, process.env.JWT_SECRET);
    for (const t of [tampered, otherSecret, expired, `${h}.${p}`]) {
      expect((await as(t).get("/api/user/me")).status).toBe(401);
      expect((await as(t).get("/api/admin/metrics")).status).toBe(401);
    }
  });

  it("o papel vem do banco, não do token: token de cliente com role=admin não abre as métricas", async () => {
    const fake = jwt.sign({ sub: String(U.clientA.id), role: "admin" }, process.env.JWT_SECRET);
    expect((await as(fake).get("/api/admin/metrics")).status).toBe(403);
  });

  it("conta excluída perde o acesso mesmo com token válido", async () => {
    await register("tmp", "client");
    await as(U.tmp.token).del("/api/auth/me", { password: "senha-forte-1" });
    expect((await as(U.tmp.token).get("/api/user/me")).status).toBe(401);
    expect((await as(U.tmp.token).get("/api/provider/dashboard")).status).toBe(401);
  });
});
