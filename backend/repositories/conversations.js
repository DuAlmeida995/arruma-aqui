const db = require("../db");

async function listForUser(userId) {
  const { rows } = await db.query(
    `select c.id, c.client_id, c.provider_id, u.name as provider_name, p.role_title,
            cu.name as client_name, m.text as last_text, coalesce(m.created_at, c.created_at) as last_at
       from contacts c
       join provider_profiles p on p.user_id = c.provider_id
       join users u on u.id = c.provider_id
       join users cu on cu.id = c.client_id
       left join lateral (
         select text, created_at from messages where contact_id = c.id order by created_at desc, id desc limit 1
       ) m on true
      where c.client_id = $1 or c.provider_id = $1
      order by last_at desc`,
    [userId]
  );
  return rows;
}

async function findForUser(id, userId) {
  const { rows } = await db.query(
    `select c.id, c.client_id, c.provider_id, u.name as provider_name, p.role_title, cu.name as client_name, c.created_at
       from contacts c
       join provider_profiles p on p.user_id = c.provider_id
       join users u on u.id = c.provider_id
       join users cu on cu.id = c.client_id
      where c.id = $1 and (c.client_id = $2 or c.provider_id = $2)`,
    [id, userId]
  );
  return rows[0] || null;
}

async function messages(contactId) {
  const { rows } = await db.query(
    "select id, sender_id, text, created_at from messages where contact_id = $1 order by created_at, id",
    [contactId]
  );
  return rows;
}

async function addMessage(contactId, senderId, text) {
  const { rows } = await db.query(
    "insert into messages (contact_id, sender_id, text) values ($1, $2, $3) returning id, sender_id, text, created_at",
    [contactId, senderId, text]
  );
  // primeira resposta do prestador → registra o tempo de resposta e recalcula a média (usada no ranking)
  const first = await db.query(
    "update contacts set responded_at = now() where id = $1 and provider_id = $2 and responded_at is null",
    [contactId, senderId]
  );
  if (first.rowCount) {
    await db.query(
      `update provider_profiles set avg_response_minutes = (
         select round(avg(extract(epoch from (responded_at - created_at)) / 60))
           from contacts where provider_id = $1 and responded_at is not null)
       where user_id = $1`,
      [senderId]
    );
  }
  return rows[0];
}

// Conversa cliente ↔ prestador: reaproveita a existente do par, senão cria
async function findOrCreate(clientId, providerId, requestId = null) {
  const found = await db.query(
    "select id from contacts where client_id = $1 and provider_id = $2 order by created_at desc limit 1",
    [clientId, providerId]
  );
  if (found.rows[0]) {
    if (requestId) {
      await db.query("update contacts set request_id = coalesce(request_id, $2) where id = $1", [found.rows[0].id, requestId]);
    }
    return { id: Number(found.rows[0].id), created: false };
  }
  const { rows } = await db.query(
    "insert into contacts (client_id, provider_id, request_id) values ($1, $2, $3) returning id",
    [clientId, providerId, requestId]
  );
  return { id: Number(rows[0].id), created: true };
}

module.exports = { listForUser, findForUser, messages, addMessage, findOrCreate };
