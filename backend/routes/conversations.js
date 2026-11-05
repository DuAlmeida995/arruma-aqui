const express = require("express");
const events = require("../services/events");
const repo = require("../repositories/conversations");
const { currentUser } = require("../middleware/currentUser");
const { chatTime } = require("../services/format");
const db = require("../db");
const services = require("../repositories/services");
const { z } = require("zod");

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
    if (created) events.track(req.me.id, "contact_started", { conversationId: id, providerId, requestId });
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
    const svc = await services.forContact(conv.id);
    res.json({
      ...header(conv, req.me),
      time: chatTime(last ? last.created_at : conv.created_at),
      messages: msgs.map((m) => ({ from: Number(m.sender_id) === req.me.id ? "me" : "them", text: m.text })),
      service: serviceView(svc, conv, req.me),
    });
  } catch (err) {
    next(err);
  }
});

function serviceView(svc, conv, me) {
  const iAmClient = Number(conv.client_id) === me.id;
  if (!svc) return { done: false, canMarkDone: true };
  return {
    done: true,
    completedAt: svc.completed_at,
    review: svc.stars != null ? { stars: svc.stars, text: svc.review_text } : null,
    canReview: iAmClient && svc.stars == null,
  };
}

// POST /api/conversations/:id/service — qualquer um dos dois marca o serviço como realizado
router.post("/:id/service", async (req, res, next) => {
  try {
    const conv = await repo.findForUser(Number(req.params.id), req.me.id);
    if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
    const svc = await services.markDone(conv);
    res.json({ service: serviceView(svc, conv, req.me) });
  } catch (err) {
    next(err);
  }
});

const reviewSchema = z.object({
  stars: z.coerce.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5, "Escolha de 1 a 5 estrelas."),
  text: z.string().trim().max(600, "O comentário pode ter no máximo 600 caracteres.").default(""),
});

// POST /api/conversations/:id/review { stars, text } — só o cliente, depois do serviço realizado
router.post("/:id/review", async (req, res, next) => {
  try {
    const conv = await repo.findForUser(Number(req.params.id), req.me.id);
    if (!conv) return res.status(404).json({ error: "Conversa não encontrada." });
    if (Number(conv.client_id) !== req.me.id) return res.status(403).json({ error: "Só o cliente avalia o serviço." });
    const parsed = reviewSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const out = await services.review(conv, parsed.data);
    if (out.error === "not_done") return res.status(409).json({ error: "Marque o serviço como realizado antes de avaliar." });
    if (out.error === "already") return res.status(409).json({ error: "Você já avaliou este serviço." });
    events.track(req.me.id, "review_created", { conversationId: Number(conv.id), providerId: Number(conv.provider_id), stars: parsed.data.stars });
    res.status(201).json({ service: serviceView(out.service, conv, req.me) });
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
