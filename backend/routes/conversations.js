const express = require("express");
const { conversations } = require("../data/mockData");

const router = express.Router();

// GET /api/conversations
router.get("/", (req, res) => {
  const list = conversations.map((c) => ({
    id: c.id,
    proId: c.proId,
    name: c.name,
    role: c.role,
    time: c.time,
    last: c.messages[c.messages.length - 1]?.text || "",
  }));
  res.json(list);
});

// GET /api/conversations/:id
router.get("/:id", (req, res) => {
  const conv = conversations.find((c) => c.id === Number(req.params.id));
  if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
  res.json(conv);
});

// POST /api/conversations/:id/messages  { text: "..." }
router.post("/:id/messages", (req, res) => {
  const conv = conversations.find((c) => c.id === Number(req.params.id));
  if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });

  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Mensagem vazia." });
  }

  const message = { from: "me", text: text.trim() };
  conv.messages.push(message);
  conv.time = "agora";

  res.status(201).json(message);
});

module.exports = router;
