const express = require("express");
const repo = require("../repositories/professionals");
const { currentUser } = require("../middleware/currentUser");
const { sortAndView, toCandidate, toView } = require("../services/professionalView");
const { expandRadius } = require("../services/radiusExpansion");
const searchCfg = require("../config/search.json");

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
    const weekday = wd;
    const explicitRadius = Number.isFinite(maxDist) && maxDist > 0 ? maxDist : null;
    const base = { lat: req.me.lat, lng: req.me.lng, q, cat, weekday };

    let rows;
    let search;
    if (explicitRadius) {
      // raio escolhido pelo usuário: fixo, sem ampliação
      rows = await repo.search({ ...base, maxDistKm: explicitRadius });
      search = { radiusKm: explicitRadius, expanded: false, outsideServiceArea: false };
    } else {
      // raio padrão com ampliação gradual (uma consulta só, até o maior raio)
      const maxKm = Math.max(...searchCfg.expansionStepsKm);
      const all = await repo.search({ ...base, maxDistKm: maxKm, withinServiceArea: false });
      const out = expandRadius(all);
      rows = out.rows;
      search = { radiusKm: out.radiusKm, expanded: out.expanded, outsideServiceArea: out.outsideServiceArea };
    }
    const results = sortAndView(rows, { sort, weekday, radiusKm: search.radiusKm });
    res.json({ total: results.length, results, search });
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
