const express = require("express");
const repo = require("../repositories/conversations");
const { currentUser } = require("../middleware/currentUser");
const { chatTime } = require("../services/format");
const db = require("../db");

const router = express.Router();
router.use(currentUser);

// Do ponto de vista de quem está logado: o "outro lado" da conversa
function header(c, me) {
  const iAmClient = Number(c.client_id) === me.id;
  return {
    id: Number(c.id),
    proId: Number(c.provider_id),
    otherId: Number(iAmClient ? c.provider_id : c.client_id),
    otherIsProvider: iAmClient,
    name: iAmClient ? c.provider_name : c.client_name,
    role: iAmClient ? c.role_title : "Cliente",
  };
}

// POST /api/conversations { providerId, text, requestId? } — cliente inicia o contato direto
router.post("/", async (req, res, next) => {
  try {
    if (req.me.role !== "client") return res.status(403).json({ error: "Só clientes podem iniciar uma conversa." });
    const providerId = Number(req.body?.providerId);
    const requestId = req.body?.requestId ? Number(req.body.requestId) : null;
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Escreva uma mensagem antes de enviar." });
    if (text.length > 2000) return res.status(400).json({ error: "Mensagem muito longa (máximo de 2000 caracteres)." });
    const pro = await db.query(
      "select 1 from provider_profiles p join users u on u.id = p.user_id where p.user_id = $1 and p.active and u.deleted_at is null",
      [providerId]
    );
    if (!pro.rowCount) return res.status(404).json({ error: "Profissional não encontrado." });
    if (requestId) {
      const own = await db.query("select 1 from requests where id = $1 and client_id = $2", [requestId, req.me.id]);
      if (!own.rowCount) return res.status(404).json({ error: "Solicitação não encontrada." });
    }
    const { id, created } = await repo.findOrCreate(req.me.id, providerId, requestId);
    await repo.addMessage(id, req.me.id, text);
    res.status(created ? 201 : 200).json({ id, created });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations
router.get("/", async (req, res, next) => {
  try {
    const rows = await repo.listForUser(req.me.id);
    res.json(rows.map((c) => ({ ...header(c, req.me), time: chatTime(c.last_at), last: c.last_text || "" })));
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id
router.get("/:id", async (req, res, next) => {
  try {
    const conv = await repo.findForUser(Number(req.params.id), req.me.id);
    if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
    const msgs = await repo.messages(conv.id);
    const last = msgs[msgs.length - 1];
    res.json({
      ...header(conv, req.me),
      time: chatTime(last ? last.created_at : conv.created_at),
      messages: msgs.map((m) => ({ from: Number(m.sender_id) === req.me.id ? "me" : "them", text: m.text })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages  { text: "..." }
router.post("/:id/messages", async (req, res, next) => {
  try {
    const conv = await repo.findForUser(Number(req.params.id), req.me.id);
    if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Escreva uma mensagem antes de enviar." });
    if (text.length > 2000) return res.status(400).json({ error: "Mensagem muito longa (máximo de 2000 caracteres)." });
    const m = await repo.addMessage(conv.id, req.me.id, text);
    res.status(201).json({ from: "me", text: m.text });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
