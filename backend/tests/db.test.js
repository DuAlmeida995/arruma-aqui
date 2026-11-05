import { describe, it, expect, afterAll, vi } from "vitest";
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

// Falha de transporte não prova que o servidor deixou de executar o SQL.
describe.skipIf(!db.pool)("falhas de consulta", () => {
  it.each([
    "select nextval('sequencia')",
    "with escrita as (insert into events default values returning *) select * from escrita",
    "insert into events default values",
  ])("não repete automaticamente uma operação ambígua: %s", async (sql) => {
    const error = Object.assign(new Error("Connection terminated"), { code: "ECONNRESET" });
    const query = vi.spyOn(db.pool, "query").mockRejectedValue(error);
    try {
      await expect(db.query(sql)).rejects.toBe(error);
      expect(query).toHaveBeenCalledTimes(1);
    } finally {
      query.mockRestore();
    }
  });
});
