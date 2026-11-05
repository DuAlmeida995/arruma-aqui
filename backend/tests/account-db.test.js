// Editar e excluir conta contra o banco real (pulado sem DATABASE_URL + CA)
import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import app from "../app.js";
import db from "../db/index.js";

const caPath = process.env.DB_CA_CERT || path.join(__dirname, "..", "db", "supabase-ca.crt");
const dbReady = Boolean(process.env.DATABASE_URL) && fs.existsSync(caPath);
const stamp = Date.now();
const created = [];
const ids = [];

async function register(role, bairro = "Penha") {
  const email = `conta.${role}.${stamp}.${created.length}@exemplo.com`;
  created.push(email);
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Teste Conta", email, password: "senha-forte-1", role, bairro });
  ids.push(res.body.user.id);
  return { email, token: res.body.token, id: res.body.user.id };
}

afterAll(async () => {
  if (!dbReady) return;
  await db.query("delete from users where id = any($1)", [ids]);
});

describe.skipIf(!dbReady)("conta no banco", () => {
  it("editar o bairro muda a localização usada na busca", async () => {
    const c = await register("client");
    const auth = { Authorization: `Bearer ${c.token}` };
    const before = await request(app).get("/api/professionals?sort=dist").set(auth);
    await request(app).patch("/api/auth/me").set(auth).send({ name: "Teste Conta", bairro: "Pinheiros" });
    const after = await request(app).get("/api/professionals?sort=dist").set(auth);
    expect(after.body.results[0].bairro).not.toBe(before.body.results[0].bairro);
    expect(after.body.results[0].bairro).toMatch(/Pinheiros|Butantã|Perdizes/);
  });

  it("excluir conta de prestador remove o perfil da busca e anonimiza os dados", async () => {
    const p = await register("provider");
    const auth = { Authorization: `Bearer ${p.token}` };
    await request(app)
      .put("/api/provider/profile")
      .set(auth)
      .send({
        roleTitle: "Jardineiro",
        bairro: "Penha",
        radiusKm: 10,
        categories: [{ id: "jardinagem", services: [] }],
        availability: [{ weekday: 2, start: "08:00", end: "12:00" }],
      });
    const del = await request(app).delete("/api/auth/me").set(auth).send({ password: "senha-forte-1" });
    expect(del.status).toBe(200);

    const { rows } = await db.query("select name, email, phone, location, deleted_at from users where id = $1", [p.id]);
    expect(rows[0]).toMatchObject({ name: "Usuário removido", phone: null, location: null });
    expect(rows[0].email).not.toBe(p.email);
    expect(rows[0].deleted_at).not.toBeNull();

    const client = await register("client", "Penha");
    const list = await request(app).get("/api/professionals?cat=jardinagem").set({ Authorization: `Bearer ${client.token}` });
    expect(list.body.results.map((x) => x.id)).not.toContain(p.id);

    // token antigo deixa de funcionar
    expect((await request(app).get("/api/user/me").set(auth)).status).toBe(401);
  });
});
