import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listMigrationFiles, pendingMigrations, migrate } from "../db/migrate.js";

function tmpDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-"));
  for (const [name, sql] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), sql);
  return dir;
}

function fakeClient({ applied = [], failOn } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push(sql.trim().split(/\s+/).slice(0, 3).join(" "));
      if (failOn && sql.includes(failOn)) throw new Error("boom");
      if (sql.startsWith("select name from schema_migrations")) {
        return { rows: applied.map((name) => ({ name })) };
      }
      return { rows: [] };
    },
  };
}

describe("migrations", () => {
  it("lista só arquivos NNN_*.sql em ordem", () => {
    const dir = tmpDir({ "002_b.sql": "", "001_a.sql": "", "README.md": "", "x.sql": "" });
    expect(listMigrationFiles(dir)).toEqual(["001_a.sql", "002_b.sql"]);
  });

  it("calcula pendentes ignorando as já aplicadas", () => {
    expect(pendingMigrations(["001_a.sql", "002_b.sql"], ["001_a.sql"])).toEqual(["002_b.sql"]);
  });

  it("aplica pendentes em transação e registra", async () => {
    const dir = tmpDir({ "001_a.sql": "create table a();", "002_b.sql": "create table b();" });
    const client = fakeClient({ applied: ["001_a.sql"] });
    const applied = await migrate(client, { dir, log: () => {} });
    expect(applied).toEqual(["002_b.sql"]);
    expect(client.calls).toContain("begin");
    expect(client.calls).toContain("commit");
  });

  it("faz rollback e informa o arquivo quando falha", async () => {
    const dir = tmpDir({ "001_a.sql": "QUEBRA" });
    const client = fakeClient({ failOn: "QUEBRA" });
    await expect(migrate(client, { dir, log: () => {} })).rejects.toThrow("001_a.sql");
    expect(client.calls).toContain("rollback");
  });

  it("migration 001 existe e habilita PostGIS", () => {
    const files = listMigrationFiles();
    expect(files[0]).toBe("001_schema_inicial.sql");
    const sql = fs.readFileSync(path.join(__dirname, "..", "db", "migrations", files[0]), "utf8");
    expect(sql).toMatch(/create extension if not exists postgis/);
  });
});
