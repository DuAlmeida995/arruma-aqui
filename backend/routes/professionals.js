const express = require("express");
const repo = require("../repositories/professionals");
const { currentUser } = require("../middleware/currentUser");
const { toCandidate, toView } = require("../services/professionalView");
const { findProfessionals } = require("../services/findProfessionals");

const router = express.Router();
router.use(currentUser);

// GET /api/professionals?q=&cat=&maxDist=&sort=relevance|rating|dist&weekday=
router.get("/", async (req, res, next) => {
  try {
    const { q, cat, sort } = req.query;
    const maxDist = parseFloat(req.query.maxDist);
    const wd = req.query.weekday != null && req.query.weekday !== "" ? Number(req.query.weekday) : undefined;
    if (wd !== undefined && !(Number.isInteger(wd) && wd >= 0 && wd <= 6)) {
      return res.status(400).json({ error: "Dia da semana inválido (use 0 = domingo a 6 = sábado)." });
    }
    const maxDistKm = Number.isFinite(maxDist) && maxDist > 0 ? maxDist : null;
    res.json(await findProfessionals(req.me, { q, cat, sort, maxDistKm, weekday: wd }));
  } catch (err) {
    next(err);
  }
});

// GET /api/professionals/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(404).json({ error: "Profissional não encontrado." });
    const row = await repo.findById(id, { lat: req.me.lat, lng: req.me.lng });
    if (!row || !row.active) return res.status(404).json({ error: "Profissional não encontrado." });
    const reviews = await repo.reviews(id);
    res.json({
      ...toView(toCandidate(row)),
      whatsapp: row.whatsapp,
      reviewsList: reviews.map((r) => ({ name: r.name, stars: r.stars, text: r.text })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
