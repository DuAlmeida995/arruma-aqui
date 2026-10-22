const express = require("express");
const { professionals, getReviews } = require("../data/mockData");

const router = express.Router();

function parseDist(dist) {
  return parseFloat(dist.replace(",", "."));
}

// GET /api/professionals?q=eletricista&cat=eletrica&maxDist=3&sort=rating|dist
router.get("/", (req, res) => {
  const { q, cat, maxDist, sort } = req.query;
  let list = [...professionals];

  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term) ||
        p.cat.toLowerCase().includes(term) ||
        p.desc.toLowerCase().includes(term)
    );
  }

  if (cat) {
    list = list.filter((p) => p.cat === cat);
  }

  if (maxDist) {
    const max = parseFloat(maxDist);
    if (!Number.isNaN(max)) {
      list = list.filter((p) => parseDist(p.dist) <= max);
    }
  }

  if (sort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === "dist") {
    list.sort((a, b) => parseDist(a.dist) - parseDist(b.dist));
  }

  res.json({ total: list.length, results: list });
});

// GET /api/professionals/:id
router.get("/:id", (req, res) => {
  const pro = professionals.find((p) => p.id === Number(req.params.id));
  if (!pro) return res.status(404).json({ error: "Profissional não encontrado." });
  res.json({ ...pro, reviewsList: getReviews(pro.id) });
});

module.exports = router;
