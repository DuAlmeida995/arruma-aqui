import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("GET /api/health", () => {
  it("responde status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("retorna 404 em JSON para rota inexistente", async () => {
    const res = await request(app).get("/api/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});
