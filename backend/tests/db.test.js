import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);

afterAll(async () => {
  if (db.pool) await db.pool.end();
});

describe("conexão com o banco", () => {
  it.skipIf(!dbReady)("/api/health reporta db ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body.db).toBe("ok");
  });
});
