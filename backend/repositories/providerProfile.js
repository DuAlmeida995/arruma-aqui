const db = require("../db");

async function get(userId) {
  const { rows } = await db.query(
    `select user_id, role_title, description, experience_years, bairro, city, radius_km, active, whatsapp
       from provider_profiles where user_id = $1`,
    [userId]
  );
  if (!rows[0]) return null;
  const cats = await db.query(
    "select category_id, services from provider_categories where provider_id = $1 order by category_id",
    [userId]
  );
  const avail = await db.query(
    `select weekday, to_char(start_time, 'HH24:MI') as start, to_char(end_time, 'HH24:MI') as "end"
       from availability where provider_id = $1 order by weekday, start_time`,
    [userId]
  );
  const p = rows[0];
  return {
    roleTitle: p.role_title,
    description: p.description,
    experienceYears: p.experience_years,
    bairro: p.bairro,
    city: p.city,
    radiusKm: Number(p.radius_km),
    active: p.active,
    whatsapp: p.whatsapp,
    categories: cats.rows.map((c) => ({ id: c.category_id, services: c.services })),
    availability: avail.rows.map((a) => ({ weekday: a.weekday, start: a.start, end: a.end })),
  };
}

// Cria ou atualiza o perfil inteiro numa transação
async function save(userId, data, { lat, lng }) {
  const client = await db.pool.connect();
  try {
    await client.query("begin");
    const point = "ST_MakePoint($2::float8, $3::float8)::geography";
    await client.query(
      `insert into provider_profiles (user_id, location, role_title, description, experience_years, bairro, city, radius_km, active, whatsapp)
       values ($1, ${point}, $4, $5, $6, $7, 'São Paulo', $8, $9, $10)
       on conflict (user_id) do update set
         location = excluded.location, role_title = excluded.role_title, description = excluded.description,
         experience_years = excluded.experience_years, bairro = excluded.bairro, city = excluded.city,
         radius_km = excluded.radius_km, active = excluded.active, whatsapp = excluded.whatsapp`,
      [userId, lng, lat, data.roleTitle, data.description, data.experienceYears ?? null, data.bairro, data.radiusKm, data.active, data.whatsapp || null]
    );
    await client.query(`update users set bairro = $4, city = 'São Paulo', location = ${point} where id = $1`, [
      userId,
      lng,
      lat,
      data.bairro,
    ]);
    await client.query("delete from provider_categories where provider_id = $1", [userId]);
    for (const c of data.categories) {
      await client.query("insert into provider_categories (provider_id, category_id, services) values ($1, $2, $3)", [
        userId,
        c.id,
        c.services,
      ]);
    }
    await client.query("delete from availability where provider_id = $1", [userId]);
    for (const a of data.availability) {
      await client.query("insert into availability (provider_id, weekday, start_time, end_time) values ($1, $2, $3, $4)", [
        userId,
        a.weekday,
        a.start,
        a.end,
      ]);
    }
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
  return get(userId);
}

// Painel do prestador: números, serviços realizados e avaliações recebidas
async function dashboard(userId) {
  const stats = await db.query(
    `select s.rating_avg, s.rating_count, s.contacts_count, s.services_done, p.avg_response_minutes, p.active
       from provider_profiles p join provider_stats s on s.provider_id = p.user_id
      where p.user_id = $1`,
    [userId]
  );
  if (!stats.rows[0]) return null;
  const services = await db.query(
    `select s.contact_id, s.completed_at, u.name as client_name, r.stars
       from services s join users u on u.id = s.client_id
       left join reviews r on r.service_id = s.id
      where s.provider_id = $1 and s.status = 'done'
      order by s.completed_at desc limit 50`,
    [userId]
  );
  const reviews = await db.query(
    `select u.name as client_name, r.stars, r.text, r.created_at
       from reviews r join users u on u.id = r.client_id
      where r.provider_id = $1 order by r.created_at desc limit 50`,
    [userId]
  );
  const st = stats.rows[0];
  return {
    stats: {
      ratingAvg: Number(st.rating_count) > 0 ? Number(st.rating_avg) : null,
      ratingCount: Number(st.rating_count),
      contacts: Number(st.contacts_count),
      servicesDone: Number(st.services_done),
      avgResponseMinutes: st.avg_response_minutes == null ? null : Number(st.avg_response_minutes),
      active: st.active,
    },
    services: services.rows.map((r) => ({
      conversationId: Number(r.contact_id),
      clientName: r.client_name,
      completedAt: r.completed_at,
      stars: r.stars,
    })),
    reviews: reviews.rows.map((r) => ({ clientName: r.client_name, stars: r.stars, text: r.text, createdAt: r.created_at })),
  };
}

module.exports = { get, save, dashboard };
