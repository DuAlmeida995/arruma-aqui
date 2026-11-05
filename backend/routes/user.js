const express = require("express");
const history = require("../repositories/history");
const { currentUser } = require("../middleware/currentUser");
const { shortDate } = require("../services/format");

const router = express.Router();
router.use(currentUser);

// GET /api/user/me — perfil + histórico de pedidos e avaliações
router.get("/me", async (req, res, next) => {
  try {
    const me = req.me;
    const h = await history.forClient(me.id);
    res.json({
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      bairro: me.bairro,
      city: me.city,
      requests: h.contacts.map((c) => ({
        proId: Number(c.provider_id),
        pro: `${c.name} - ${c.role_title}`,
        date: c.completed_at ? shortDate(c.completed_at) : "Em conversa",
        status: c.completed_at ? "Concluído" : "Em andamento",
      })),
      myReviews: h.reviews.map((r) => ({
        proId: Number(r.provider_id),
        pro: `${r.name} — ${r.role_title}`,
        stars: r.stars,
        text: r.text,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
