// Serviço realizado (a partir de uma conversa) e a avaliação do cliente
const db = require("../db");

async function forContact(contactId) {
  const { rows } = await db.query(
    `select s.id, s.status, s.completed_at, s.satisfaction_score, r.stars, r.text as review_text
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

// Atualização e evento na mesma instrução: uma resposta por serviço, mesmo
// com dois envios simultâneos. Uma repetição retorna a nota já registrada.
async function answerSatisfaction(contact, score) {
  const s = await forContact(contact.id);
  if (!s || s.stars == null) return { error: "not_reviewed" };
  await db.query(
    `with answered as (
       update services set satisfaction_score = $2
        where id = $1 and satisfaction_score is null
        returning id, client_id, contact_id, satisfaction_score
     )
     insert into events (user_id, type, payload)
     select client_id, 'satisfaction_answered',
            jsonb_build_object('serviceId', id, 'conversationId', contact_id, 'score', satisfaction_score)
       from answered`,
    [s.id, score]
  );
  return { service: await forContact(contact.id) };
}

module.exports = { forContact, markDone, review, answerSatisfaction };
