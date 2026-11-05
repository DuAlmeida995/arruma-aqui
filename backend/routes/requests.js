// Solicitações do cliente: descreve o que precisa e recebe a lista recomendada
const { validate, id, idParam, z } = require("../middleware/validate");
const events = require("../services/events");
const express = require("express");
const repo = require("../repositories/requests");
const categoriesRepo = require("../repositories/categories");
const { currentUser } = require("../middleware/currentUser");
const { requireRole } = require("../middleware/auth");
const { findProfessionals } = require("../services/findProfessionals");

const router = express.Router();
router.use(currentUser, (req, res, next) => {
  req.user = { id: req.me.id, role: req.me.role };
  next();
}, requireRole("client"));

// "hoje" no fuso de São Paulo (en-CA formata como AAAA-MM-DD)
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const schema = z.object({
  categoryId: z.string({ message: "Escolha o tipo de serviço." }).min(1, "Escolha o tipo de serviço."),
  description: z.string().trim().min(10, "Descreva o serviço em pelo menos 10 caracteres.").max(1000),
  desiredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .refine((d) => d >= today(), "Escolha uma data a partir de hoje.")
    .nullable()
    .optional(),
});

function view(r) {
  return {
    id: Number(r.id),
    categoryId: r.category_id,
    categoryLabel: r.category_label,
    categoryIcon: r.category_icon,
    description: r.description,
    desiredDate: r.desired_date,
    status: r.status,
    createdAt: r.created_at,
  };
}

// dia da semana da data pedida (0 = domingo), sem depender do fuso do servidor
const weekdayOf = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).getUTCDay() : undefined);

async function withRecommendations(r, me) {
  const found = await findProfessionals(me, { cat: r.category_id, weekday: weekdayOf(r.desired_date) });
  events.track(me.id, "list_shown", {
    source: "request",
    requestId: Number(r.id),
    cat: r.category_id,
    total: found.total,
    radiusKm: found.search.radiusKm,
    expanded: found.search.expanded,
    top: found.results.slice(0, 10).map((p) => p.id),
  });
  return { request: view(r), ...found };
}

// POST /api/requests
router.post("/", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const d = parsed.data;
    const cats = new Set((await categoriesRepo.list()).map((c) => c.id));
    if (!cats.has(d.categoryId)) return res.status(400).json({ error: "Tipo de serviço inválido." });
    const r = await repo.create({
      clientId: req.me.id,
      categoryId: d.categoryId,
      description: d.description,
      desiredDate: d.desiredDate || null,
      lat: req.me.lat,
      lng: req.me.lng,
    });
    events.track(req.me.id, "request_created", { requestId: Number(r.id), cat: d.categoryId, hasDate: Boolean(d.desiredDate) });
    res.status(201).json(await withRecommendations(r, req.me));
  } catch (err) {
    next(err);
  }
});

// GET /api/requests — minhas solicitações
router.get("/", async (req, res, next) => {
  try {
    res.json((await repo.listForClient(req.me.id)).map(view));
  } catch (err) {
    next(err);
  }
});

// GET /api/requests/:id — solicitação + recomendados
router.get("/:id", validate({ params: idParam }), async (req, res, next) => {
  try {
    const r = await repo.findForClient(req.valid.params.id, req.me.id);
    if (!r) return res.status(404).json({ error: "Solicitação não encontrada." });
    res.json(await withRecommendations(r, req.me));
  } catch (err) {
    next(err);
  }
});

// POST /api/requests/:id/close — cliente encerra (já resolveu ou desistiu)
router.post("/:id/close", validate({ params: idParam }), async (req, res, next) => {
  try {
    const ok = await repo.setStatus(req.valid.params.id, req.me.id, "closed");
    if (!ok) return res.status(404).json({ error: "Solicitação não encontrada." });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
