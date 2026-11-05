// Validação de entrada e proteção contra força bruta (sem banco: usa repositório em memória)
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { fakeUsers } from "./helpers/fakeUsers.js";

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-de-teste-123";
});

describe("entrada inválida", () => {
  const app = createApp({ users: fakeUsers() });

  it("JSON malformado dá 400 com mensagem em português", async () => {
    const res = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{oops");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON/);
  });

  it("corpo grande demais dá 413", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "x".repeat(200_000) });
    expect(res.status).toBe(413);
  });

  it("cabeçalhos de segurança estão presentes", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("limite de tentativas de login", () => {
  let app;
  beforeAll(() => {
    process.env.RATE_LIMIT_IN_TESTS = "1";
    process.env.AUTH_RATE_LIMIT = "3";
    app = createApp({ users: fakeUsers() });
  });
  afterAll(() => {
    delete process.env.RATE_LIMIT_IN_TESTS;
    delete process.env.AUTH_RATE_LIMIT;
  });

  it("bloqueia depois de 3 tentativas com 429 e mensagem clara", async () => {
    const tryLogin = () => request(app).post("/api/auth/login").send({ email: "x@exemplo.com", password: "errada-123" });
    for (let i = 0; i < 3; i++) expect((await tryLogin()).status).toBe(401);
    const blocked = await tryLogin();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Muitas tentativas/);
  });
});
