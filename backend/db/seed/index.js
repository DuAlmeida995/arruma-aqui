// Popula o banco com a base fictícia. APAGA os dados existentes.
// Uso: npm run db:seed
const bcrypt = require("bcryptjs");
const { buildSeed } = require("./data");

const point = (lat, lng) => (lat == null ? null : `SRID=4326;POINT(${lng} ${lat})`);
const ago = (days) => `now() - interval '${Number(days)} days'`;

async function seed(client, { log = console.log } = {}) {
  const data = buildSeed();
  const hash = await bcrypt.hash(data.password, 10);

  await client.query("begin");
  try {
    await client.query(
      `truncate events, reviews, services, messages, contacts, requests, availability,
               provider_categories, provider_profiles, categories, users restart identity cascade`
    );

    for (const c of data.categories) {
      await client.query("insert into categories (id, label, icon) values ($1,$2,$3)", [c.id, c.label, c.icon]);
    }
    for (const u of data.users) {
      await client.query(
        `insert into users (id, name, email, password_hash, role, phone, bairro, city, location)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::geography)`,
        [u.id, u.name, u.email, hash, u.role, u.phone, u.bairro, u.city, point(u.lat, u.lng)]
      );
    }
    for (const p of data.providers) {
      await client.query(
        `insert into provider_profiles (user_id, role_title, description, experience_years, bairro, city,
           location, radius_km, active, whatsapp, avg_response_minutes)
         values ($1,$2,$3,$4,$5,$6,$7::geography,$8,$9,$10,$11)`,
        [p.user_id, p.role_title, p.description, p.experience_years, p.bairro, p.city,
         point(p.lat, p.lng), p.radius_km, p.active, p.whatsapp, p.avg_response_minutes]
      );
    }
    for (const pc of data.providerCategories) {
      await client.query("insert into provider_categories (provider_id, category_id, services) values ($1,$2,$3)",
        [pc.provider_id, pc.category_id, pc.services]);
    }
    for (const a of data.availability) {
      await client.query("insert into availability (provider_id, weekday, start_time, end_time) values ($1,$2,$3,$4)",
        [a.provider_id, a.weekday, a.start_time, a.end_time]);
    }
    for (const c of data.contacts) {
      await client.query(
        `insert into contacts (id, client_id, provider_id, created_at, responded_at)
         values ($1,$2,$3, ${ago(c.days_ago)}, ${ago(c.days_ago)} + make_interval(mins => $4))`,
        [c.id, c.client_id, c.provider_id, c.responded_after_min]
      );
    }
    for (const m of data.messages) {
      await client.query(`insert into messages (contact_id, sender_id, text, created_at) values ($1,$2,$3, ${ago(m.days_ago)})`,
        [m.contact_id, m.sender_id, m.text]);
    }
    for (const s of data.services) {
      await client.query(
        `insert into services (id, contact_id, client_id, provider_id, completed_at) values ($1,$2,$3,$4, ${ago(s.days_ago)})`,
        [s.id, s.contact_id, s.client_id, s.provider_id]);
    }
    for (const r of data.reviews) {
      await client.query(
        `insert into reviews (service_id, client_id, provider_id, stars, text, created_at) values ($1,$2,$3,$4,$5, ${ago(r.days_ago)})`,
        [r.service_id, r.client_id, r.provider_id, r.stars, r.text]);
    }
    // ids explícitos → acertar as sequences
    for (const t of ["users", "contacts", "services"]) {
      await client.query(`select setval(pg_get_serial_sequence('${t}', 'id'), (select coalesce(max(id), 1) from ${t}))`);
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  }

  log(`Seed ok: ${data.users.length} usuários, ${data.providers.length} prestadores, ${data.reviews.length} avaliações.`);
  log(`Contas de demo: cliente@exemplo.com / admin@exemplo.com — senha ${data.password}`);
  return data;
}

module.exports = { seed };

if (require.main === module) {
  const { pool } = require("../index");
  if (!pool) {
    console.error("DATABASE_URL não configurada no backend/.env");
    process.exit(1);
  }
  (async () => {
    const client = await pool.connect();
    try {
      await seed(client);
    } catch (err) {
      console.error("Falha no seed:", err.message);
      process.exitCode = 1;
    } finally {
      client.release();
      await pool.end();
    }
  })();
}
