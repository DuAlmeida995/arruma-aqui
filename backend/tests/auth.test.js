import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { fakeUsers } from "./helpers/fakeUsers.js";

beforeAll(() => {
  process.env.JWT_SECRET = "segredo-de-teste-123";
  process.env.JWT_EXPIRES_IN = "1h";
});

const valid = { name: "Teste Silva", email: "Teste@Exemplo.com", password: "senha-forte-1", role: "client" };

function setup() {
  const users = fakeUsers();
  return { users, app: createApp({ users }) };
}

describe("auth", () => {
  it("cadastra, devolve token e não expõe o hash da senha", async () => {
    const { app, users } = setup();
    const res = await request(app).post("/api/auth/register").send(valid);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: "teste@exemplo.com", role: "client" });
    expect(JSON.stringify(res.body)).not.toContain("password");
    expect(users.rows[0].password_hash).not.toBe(valid.password);
  });

  it("recusa e-mail repetido", async () => {
    const { app } = setup();
    await request(app).post("/api/auth/register").send(valid);
    const res = await request(app).post("/api/auth/register").send({ ...valid, email: "teste@exemplo.com" });
    expect(res.status).toBe(409);
  });

  it("valida entrada com mensagem em português", async () => {
    const { app } = setup();
    const res = await request(app).post("/api/auth/register").send({ ...valid, password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/);
  });

  it("não permite se cadastrar como admin", async () => {
    const { app } = setup();
    const res = await request(app).post("/api/auth/register").send({ ...valid, role: "admin" });
    expect(res.status).toBe(400);
  });

  it("login com senha certa funciona e /me devolve o usuário", async () => {
    const { app } = setup();
    await request(app).post("/api/auth/register").send(valid);
    const login = await request(app).post("/api/auth/login").send({ email: valid.email, password: valid.password });
    expect(login.status).toBe(200);
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.name).toBe("Teste Silva");
  });

  it("login com senha errada ou e-mail inexistente dá a mesma mensagem", async () => {
    const { app } = setup();
    await request(app).post("/api/auth/register").send(valid);
    const a = await request(app).post("/api/auth/login").send({ email: valid.email, password: "errada-123" });
    const b = await request(app).post("/api/auth/login").send({ email: "nao@existe.com", password: "errada-123" });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
  });

  it("/me sem token, com token inválido ou expirado dá 401", async () => {
    const { app } = setup();
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Authorization", "Bearer lixo")).status).toBe(401);
    const expired = jwt.sign({ sub: "1", role: "client", exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expirou/);
  });

  it("requireRole bloqueia papel errado", async () => {
    const app = express();
    app.get("/so-prestador", requireAuth, requireRole("provider"), (req, res) => res.json({ ok: true }));
    const token = (role) => jwt.sign({ sub: "1", role }, process.env.JWT_SECRET);
    expect((await request(app).get("/so-prestador").set("Authorization", `Bearer ${token("client")}`)).status).toBe(403);
    expect((await request(app).get("/so-prestador").set("Authorization", `Bearer ${token("provider")}`)).status).toBe(200);
  });
});
