const express = require("express");
const repo = require("../repositories/professionals");
const { currentUser } = require("../middleware/currentUser");
const { sortAndView, toCandidate, toView } = require("../services/professionalView");

const router = express.Router();
router.use(currentUser);

// GET /api/professionals?q=&cat=&maxDist=&sort=relevance|rating|dist&weekday=
router.get("/", async (req, res, next) => {
  try {
    const { q, cat, sort } = req.query;
    const maxDist = parseFloat(req.query.maxDist);
    const weekday = req.query.weekday != null && req.query.weekday !== "" ? Number(req.query.weekday) : undefined;
    const rows = await repo.search({
      lat: req.me.lat,
      lng: req.me.lng,
      q,
      cat,
      maxDistKm: Number.isFinite(maxDist) && maxDist > 0 ? maxDist : null,
    });
    const results = sortAndView(rows, { sort, weekday, radiusKm: Number.isFinite(maxDist) && maxDist > 0 ? maxDist : 10 });
    res.json({ total: results.length, results });
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
