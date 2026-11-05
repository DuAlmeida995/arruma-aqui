// Serviço realizado (a partir de uma conversa) e a avaliação do cliente
const db = require("../db");

async function forContact(contactId) {
  const { rows } = await db.query(
    `select s.id, s.status, s.completed_at, r.stars, r.text as review_text
       from services s left join reviews r on r.service_id = s.id
      where s.contact_id = $1`,
    [contactId]
  );
  return rows[0] || null;
}

// Idempotente: marcar duas vezes não cria dois serviços
async function markDone(contact) {
  await db.query(
    `insert into services (contact_id, client_id, provider_id) values ($1, $2, $3)
     on conflict (contact_id) do nothing`,
    [contact.id, contact.client_id, contact.provider_id]
  );
  // a solicitação ligada à conversa (se houver) é encerrada
  await db.query("update requests set status = 'closed' where id = (select request_id from contacts where id = $1)", [contact.id]);
  return forContact(contact.id);
}

async function review(contact, { stars, text }) {
  const s = await forContact(contact.id);
  if (!s) return { error: "not_done" };
  if (s.stars != null) return { error: "already" };
  await db.query(
    "insert into reviews (service_id, client_id, provider_id, stars, text) values ($1, $2, $3, $4, $5)",
    [s.id, contact.client_id, contact.provider_id, stars, text]
  );
  return { service: await forContact(contact.id) };
}

module.exports = { forContact, markDone, review };
