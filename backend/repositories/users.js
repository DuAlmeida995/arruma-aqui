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
  async update(id, { name, phone, bairro, lat, lng }) {
    const { rows } = await db.query(
      `update users set name = $2, phone = $3, bairro = $4, city = 'São Paulo',
              location = ST_MakePoint($6::float8, $5::float8)::geography
        where id = $1 and deleted_at is null
        returning id, name, email, password_hash, role, phone, bairro, city`,
      [id, name, phone ?? null, bairro, lat, lng]
    );
    // prestador: a localização do perfil acompanha o bairro da conta
    await db.query(
      `update provider_profiles set bairro = $2, location = ST_MakePoint($4::float8, $3::float8)::geography where user_id = $1`,
      [id, bairro, lat, lng]
    );
    return rows[0] || null;
  },
  // LGPD: apaga dados pessoais e o perfil profissional; avaliações escritas ficam anônimas
  async anonymize(id) {
    const client = await db.pool.connect();
    try {
      await client.query("begin");
      await client.query("delete from messages where sender_id = $1", [id]);
      await client.query("delete from provider_profiles where user_id = $1", [id]);
      await client.query("delete from requests where client_id = $1", [id]);
      await client.query("update events set user_id = null where user_id = $1", [id]);
      await client.query(
        `update users set name = 'Usuário removido', email = 'removido-' || id || '@removido.invalid',
                password_hash = '!', phone = null, bairro = null, city = null, location = null, deleted_at = now()
          where id = $1`,
        [id]
      );
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  },
};
