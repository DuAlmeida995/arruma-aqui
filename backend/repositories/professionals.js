const db = require("../db");

const SELECT = `
  select p.user_id as id, u.name, p.role_title, p.description, p.experience_years, p.bairro, p.city,
         p.radius_km, p.active, p.whatsapp, p.avg_response_minutes,
         ST_Distance(p.location, ST_MakePoint($1, $2)::geography) / 1000 as distance_km,
         ST_DWithin(p.location, ST_MakePoint($1, $2)::geography, p.radius_km * 1000) as in_area,
         s.rating_avg, s.rating_count, s.contacts_count, s.services_done,
         (select array_agg(distinct a.weekday) from availability a where a.provider_id = p.user_id) as weekdays,
         (select array_agg(x.category_id order by x.category_id) from provider_categories x where x.provider_id = p.user_id) as categories,
         (select array_agg(distinct svc) from provider_categories x, unnest(x.services) svc where x.provider_id = p.user_id) as services
    from provider_profiles p
    join users u on u.id = p.user_id and u.deleted_at is null
    join provider_stats s on s.provider_id = p.user_id`;

// Candidatos com distância (km) calculada pelo PostGIS a partir do ponto (lat, lng) do cliente.
// Filtros eliminatórios (Atividade 3): ativo, categoria, área de atendimento do prestador
// (cliente dentro do raio dele), disponibilidade no dia pedido e raio máximo da busca.
async function search({ lat, lng, q, cat, maxDistKm, weekday, withinServiceArea = true, includeInactive = false }) {
  const params = [lng, lat];
  const where = [];
  const add = (v) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (!includeInactive) where.push("p.active");
  if (cat) {
    const c = add(cat);
    where.push(`exists (select 1 from provider_categories x where x.provider_id = p.user_id and x.category_id = ${c})`);
  }
  if (q && q.trim()) {
    const t = add(`%${q.trim().toLowerCase()}%`);
    where.push(`(lower(u.name) like ${t} or lower(p.role_title) like ${t} or lower(p.description) like ${t}
      or exists (select 1 from provider_categories x join categories c on c.id = x.category_id
                 where x.provider_id = p.user_id and (lower(c.label) like ${t} or x.category_id like ${t})))`);
  }
  if (maxDistKm) {
    const m = add(maxDistKm * 1000);
    where.push(`ST_DWithin(p.location, ST_MakePoint($1, $2)::geography, ${m})`);
  }
  if (withinServiceArea) {
    where.push("ST_DWithin(p.location, ST_MakePoint($1, $2)::geography, p.radius_km * 1000)");
  }
  if (Number.isInteger(weekday)) {
    const d = add(weekday);
    where.push(`exists (select 1 from availability a where a.provider_id = p.user_id and a.weekday = ${d})`);
  }

  const { rows } = await db.query(`${SELECT} ${where.length ? "where " + where.join(" and ") : ""}`, params);
  return rows;
}

async function findById(id, { lat, lng }) {
  const { rows } = await db.query(`${SELECT} where p.user_id = $3`, [lng, lat, id]);
  return rows[0] || null;
}

async function reviews(providerId, limit = 20) {
  const { rows } = await db.query(
    `select u.name, r.stars, r.text, r.created_at
       from reviews r join users u on u.id = r.client_id
      where r.provider_id = $1 order by r.created_at desc limit $2`,
    [providerId, limit]
  );
  return rows;
}

module.exports = { search, findById, reviews };
