// Acesso a usuários no Postgres
const db = require("../db");

module.exports = {
  async findByEmail(email) {
    const { rows } = await db.query("select id, name, email, password_hash, role, phone, bairro, city from users where lower(email) = lower($1) and deleted_at is null", [email]);
    return rows[0] || null;
  },
  async findById(id) {
    const { rows } = await db.query("select id, name, email, password_hash, role, phone, bairro, city from users where id = $1 and deleted_at is null", [id]);
    return rows[0] || null;
  },
  async create({ name, email, passwordHash, role, phone, bairro, city, lat, lng }) {
    const { rows } = await db.query(
      `insert into users (name, email, password_hash, role, phone, bairro, city, location)
       values ($1, lower($2), $3, $4, $5, $6, $7,
               case when $8::float8 is null then null else ST_MakePoint($9::float8, $8::float8)::geography end)
       returning id, name, email, password_hash, role, phone, bairro, city`,
      [name, email, passwordHash, role, phone ?? null, bairro ?? null, city ?? null, lat ?? null, lng ?? null]
    );
    return rows[0];
  },
};
