// Testes de integração contra o banco (Supabase com o seed carregado).
// São pulados se não houver DATABASE_URL + certificado CA.
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import supertest from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const created = [];
let token = null;

// Requisições autenticadas como a cliente de demo (cliente@exemplo.com)
const request = (a) => {
  const agent = supertest(a);
  const wrap = (m) => (url) => agent[m](url).set("Authorization", `Bearer ${token}`);
  return { get: wrap("get"), post: wrap("post") };
};

beforeAll(async () => {
  if (!dbReady) return;
  const res = await supertest(app).post("/api/auth/login").send({ email: "cliente@exemplo.com", password: "demo1234" });
  token = res.body.token;
});

afterAll(async () => {
  if (dbReady && created.length) await db.query("delete from messages where text = any($1)", [created]);
});

describe.skipIf(!dbReady)("API com banco", () => {
  it("rotas de dados exigem login", async () => {
    for (const url of ["/api/professionals", "/api/conversations", "/api/user/me"]) {
      expect((await supertest(app).get(url)).status).toBe(401);
    }
  });

  it("cadastro real grava localização e a busca usa o bairro do novo usuário", async () => {
    const email = `novo.${Date.now()}@exemplo.com`;
    const reg = await supertest(app)
      .post("/api/auth/register")
      .send({ name: "Novo Teste", email, password: "senha-forte-1", role: "client", bairro: "Penha" });
    expect(reg.status).toBe(201);
    try {
      const me = await supertest(app).get("/api/user/me").set("Authorization", `Bearer ${reg.body.token}`);
      expect(me.body.bairro).toBe("Penha");
      const list = await supertest(app).get("/api/professionals?sort=dist").set("Authorization", `Bearer ${reg.body.token}`);
      expect(list.body.results[0].bairro).toMatch(/Tatuapé|Mooca|Penha/);
    } finally {
      await db.query("delete from users where email = $1", [email]);
    }
  });

  it("lista as 8 categorias", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0]).toHaveProperty("icon");
  });

  it("lista profissionais no formato do front, sem coordenadas", async () => {
    const res = await request(app).get("/api/professionals");
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(40);
    const p = res.body.results[0];
    for (const k of ["id", "name", "role", "cat", "bairro", "rating", "reviews", "dist", "desc", "exp", "services"]) {
      expect(p).toHaveProperty(k);
    }
    expect(JSON.stringify(res.body)).not.toMatch(/"lat"|"lng"|location|password/);
  });

  it("não mostra prestador inativo", async () => {
    const { rows } = await db.query("select user_id from provider_profiles where not active");
    const res = await request(app).get("/api/professionals");
    const ids = res.body.results.map((p) => p.id);
    rows.forEach((r) => expect(ids).not.toContain(Number(r.user_id)));
    expect((await request(app).get(`/api/professionals/${rows[0].user_id}`)).status).toBe(404);
  });

  it("filtra por categoria e distância máxima", async () => {
    const res = await request(app).get("/api/professionals?cat=eletrica&maxDist=5&sort=dist");
    expect(res.status).toBe(200);
    res.body.results.forEach((p) => {
      expect(p.categories).toContain("eletrica");
      const km = p.dist === "menos de 1 km" ? 0 : parseInt(p.dist, 10);
      expect(km).toBeLessThanOrEqual(5);
    });
  });

  it("busca por texto encontra pela profissão", async () => {
    const res = await request(app).get("/api/professionals?q=eletricista");
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.results.every((p) => /eletric/i.test(p.role) || p.categories.includes("eletrica") || /eletric/i.test(p.desc))).toBe(true);
  });

  it("ordenação padrão é o ranking e traz explicação", async () => {
    const res = await request(app).get("/api/professionals?cat=hidraulica");
    const scores = res.body.results.map((p) => p.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(Array.isArray(res.body.results[0].reasons)).toBe(true);
  });

  it("responde a busca em menos de 1 segundo", async () => {
    const t = Date.now();
    await request(app).get("/api/professionals?cat=pintura&maxDist=10");
    expect(Date.now() - t).toBeLessThan(1000);
  });

  it("perfil traz avaliações", async () => {
    const list = await request(app).get("/api/professionals?sort=rating");
    const id = list.body.results[0].id;
    const res = await request(app).get(`/api/professionals/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.reviewsList.length).toBeGreaterThan(0);
  });

  it("conversas: lista, abre e envia mensagem persistida", async () => {
    const list = await request(app).get("/api/conversations");
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);
    const id = list.body[0].id;
    const text = `teste automático ${Date.now()}`;
    created.push(text);
    const sent = await request(app).post(`/api/conversations/${id}/messages`).send({ text });
    expect(sent.status).toBe(201);
    const conv = await request(app).get(`/api/conversations/${id}`);
    expect(conv.body.messages.at(-1)).toEqual({ from: "me", text });
  });

  it("não deixa abrir conversa de outra pessoa", async () => {
    const { rows } = await db.query(
      "select c.id from contacts c join users u on u.id = c.client_id where u.email <> 'cliente@exemplo.com' limit 1"
    );
    const res = await request(app).get(`/api/conversations/${rows[0].id}`);
    expect(res.status).toBe(404);
  });

  it("mensagem vazia é recusada", async () => {
    const list = await request(app).get("/api/conversations");
    const res = await request(app).post(`/api/conversations/${list.body[0].id}/messages`).send({ text: "  " });
    expect(res.status).toBe(400);
  });

  it("/api/user/me traz histórico do usuário", async () => {
    const res = await request(app).get("/api/user/me");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Mariana Costa");
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(Array.isArray(res.body.myReviews)).toBe(true);
  });
});
