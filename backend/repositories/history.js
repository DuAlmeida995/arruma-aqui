const db = require("../db");

// Histórico do cliente: contatos (com ou sem serviço concluído) e avaliações feitas
async function forClient(userId) {
  const contacts = await db.query(
    `select c.id, c.provider_id, u.name, p.role_title, s.completed_at
       from contacts c
       join users u on u.id = c.provider_id
       join provider_profiles p on p.user_id = c.provider_id
       left join services s on s.contact_id = c.id and s.status = 'done'
      where c.client_id = $1
      order by coalesce(s.completed_at, c.created_at) desc`,
    [userId]
  );
  const reviews = await db.query(
    `select r.provider_id, u.name, p.role_title, r.stars, r.text
       from reviews r
       join users u on u.id = r.provider_id
       join provider_profiles p on p.user_id = r.provider_id
      where r.client_id = $1 order by r.created_at desc`,
    [userId]
  );
  return { contacts: contacts.rows, reviews: reviews.rows };
}

module.exports = { forClient };
