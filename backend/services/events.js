// Registro de eventos para as métricas da pesquisa (Atividade 1 do doc FAPESP):
// request_created, list_shown, profile_opened, contact_started, provider_replied, review_created.
//
// - Nunca derruba a requisição: falha ao gravar só vira log.
// - Desligado nos testes automáticos (para não sujar as métricas do banco compartilhado);
//   um teste liga com process.env.EVENTS_IN_TESTS = "1" (lido a cada chamada).
const db = require("../db");

const enabled = () => !process.env.VITEST || process.env.EVENTS_IN_TESTS === "1";

async function track(userId, type, payload = {}) {
  if (!enabled()) return;
  try {
    await db.query("insert into events (user_id, type, payload) values ($1, $2, $3)", [userId ?? null, type, payload]);
  } catch (err) {
    console.error(`[eventos] falha ao registrar ${type}:`, err.message);
  }
}

module.exports = { track };
