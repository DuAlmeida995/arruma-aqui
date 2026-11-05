// Área administrativa (só admin): métricas da pesquisa
const express = require("express");
const metrics = require("../repositories/metrics");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// GET /api/admin/metrics?from=AAAA-MM-DD&to=AAAA-MM-DD (to é exclusivo)
router.get("/metrics", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if ((from && !isDate(from)) || (to && !isDate(to))) {
      return res.status(400).json({ error: "Use datas no formato AAAA-MM-DD." });
    }
    res.json(await metrics.compute({ from: from || null, to: to || null }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
