// Perfil profissional do prestador logado (onboarding e edição)
const express = require("express");
const { z } = require("zod");
const repo = require("../repositories/providerProfile");
const categoriesRepo = require("../repositories/categories");
const bairros = require("../config/bairros");
const { requireAuth, requireRole } = require("../middleware/auth");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (use HH:MM).");

const schema = z.object({
  roleTitle: z.string().trim().min(3, "Informe sua profissão (ex.: Eletricista).").max(60),
  description: z.string().trim().max(600, "A descrição pode ter no máximo 600 caracteres.").default(""),
  experienceYears: z.coerce.number().int().min(0).max(70).nullable().optional(),
  bairro: z.string().refine((b) => Object.hasOwn(bairros, b), "Escolha um bairro da lista."),
  radiusKm: z.coerce.number().min(1, "O raio mínimo é 1 km.").max(50, "O raio máximo é 50 km."),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{8,20}$/, "WhatsApp inválido. Use só números, ex.: 11 91234-5678.")
    .or(z.literal(""))
    .optional(),
  active: z.boolean().default(true),
  categories: z
    .array(
      z.object({
        id: z.string(),
        services: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
      })
    )
    .min(1, "Escolha pelo menos uma categoria."),
  availability: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), start: time, end: time }))
    .refine((list) => list.every((a) => a.end > a.start), "O horário final precisa ser depois do inicial."),
});

const router = express.Router();
router.use(requireAuth, requireRole("provider"));

// GET /api/provider/profile → perfil ou null (ainda não fez o onboarding)
router.get("/profile", async (req, res, next) => {
  try {
    res.json({ profile: await repo.get(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// GET /api/provider/dashboard → números, serviços e avaliações (null se ainda não montou o perfil)
router.get("/dashboard", async (req, res, next) => {
  try {
    res.json({ dashboard: await repo.dashboard(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/provider/profile
router.put("/profile", async (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const data = parsed.data;
    const valid = new Set((await categoriesRepo.list()).map((c) => c.id));
    if (data.categories.some((c) => !valid.has(c.id))) return res.status(400).json({ error: "Categoria inválida." });
    const [lat, lng] = bairros[data.bairro];
    res.json({ profile: await repo.save(req.user.id, data, { lat, lng }) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
