const express = require("express");
const { validate, id, idParam, z } = require("../middleware/validate");
const events = require("../services/events");
const repo = require("../repositories/professionals");
const { currentUser } = require("../middleware/currentUser");
const { toCandidate, toView } = require("../services/professionalView");
const { findProfessionals } = require("../services/findProfessionals");

const router = express.Router();
router.use(currentUser);

const emptyToUndef = (v) => (v === "" || v == null ? undefined : v);
const listQuery = z.object({
  q: z.string().trim().max(100, "Busca muito longa (máximo de 100 caracteres).").optional(),
  cat: z.preprocess(emptyToUndef, z.string().regex(/^[a-z]{2,30}$/, "Categoria inválida.").optional()),
  sort: z.preprocess(emptyToUndef, z.enum(["relevance", "rating", "dist"], { message: "Ordenação inválida." }).default("relevance")),
  maxDist: z.preprocess(emptyToUndef, z.coerce.number({ message: "Distância inválida." }).min(0.5, "Distância mínima de 0,5 km.").max(50, "Distância máxima de 50 km.").optional()),
  weekday: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(0).max(6, "Dia da semana inválido (use 0 = domingo a 6 = sábado).").optional()
  ),
});

// GET /api/professionals?q=&cat=&maxDist=&sort=relevance|rating|dist&weekday=
router.get("/", validate({ query: listQuery }), async (req, res, next) => {
  try {
    const { q, cat, sort, maxDist, weekday: wd } = req.valid.query;
    const maxDistKm = maxDist ?? null;
    const out = await findProfessionals(req.me, { q, cat, sort, maxDistKm, weekday: wd });
    events.track(req.me.id, "list_shown", {
      source: "search",
      q: q || null,
      cat: cat || null,
      sort: sort || "relevance",
      weekday: wd ?? null,
      total: out.total,
      radiusKm: out.search.radiusKm,
      expanded: out.search.expanded,
      top: out.results.slice(0, 10).map((p) => p.id),
    });
    res.json(out);
  } catch (err) {
    next(err);
  }
});

// GET /api/professionals/:id
router.get("/:id", validate({ params: idParam }), async (req, res, next) => {
  try {
    const { id } = req.valid.params;
    const row = await repo.findById(id, { lat: req.me.lat, lng: req.me.lng });
    if (!row || !row.active) return res.status(404).json({ error: "Profissional não encontrado." });
    const reviews = await repo.reviews(id);
    res.json({
      ...toView(toCandidate(row)),
      whatsapp: row.whatsapp,
      reviewsList: reviews.map((r) => ({ name: r.name, stars: r.stars, text: r.text })),
    });
    events.track(req.me.id, "profile_opened", { providerId: id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
