import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { fakeUsers } from "./helpers/fakeUsers.js";

const original = process.env.CORS_ORIGIN;
afterEach(() => {
  if (original === undefined) delete process.env.CORS_ORIGIN;
  else process.env.CORS_ORIGIN = original;
});

describe("CORS", () => {
  it("libera só o front configurado", async () => {
    process.env.CORS_ORIGIN = "https://arruma-aqui.vercel.app/";
    const app = createApp({ users: fakeUsers() });
    const ok = await request(app).get("/api/health").set("Origin", "https://arruma-aqui.vercel.app");
    expect(ok.headers["access-control-allow-origin"]).toBe("https://arruma-aqui.vercel.app");
    const evil = await request(app).get("/api/health").set("Origin", "https://site-malicioso.com");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("sem CORS_ORIGIN, libera o front local de desenvolvimento", async () => {
    delete process.env.CORS_ORIGIN;
    const app = createApp({ users: fakeUsers() });
    const res = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});
