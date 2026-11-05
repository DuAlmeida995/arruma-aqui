const express = require("express");
const repo = require("../repositories/conversations");
const { currentUser } = require("../middleware/currentUser");
const { chatTime } = require("../services/format");

const router = express.Router();
router.use(currentUser);

// Do ponto de vista de quem está logado: o "outro lado" da conversa
function header(c, me) {
  const iAmClient = Number(c.client_id) === me.id;
  return {
    id: Number(c.id),
    proId: Number(c.provider_id),
    name: iAmClient ? c.provider_name : c.client_name,
    role: iAmClient ? c.role_title : "Cliente",
  };
}

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
