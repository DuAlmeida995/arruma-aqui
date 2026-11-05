const express = require("express");
const { z } = require("zod");
const { hashPassword, checkPassword, signToken, publicUser } = require("../services/auth");
const { requireAuth } = require("../middleware/auth");
const bairros = require("../config/bairros");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: z.enum(["client", "provider"], { message: "Escolha se você é cliente ou prestador." }),
  phone: z.string().trim().max(20).optional(),
  bairro: z
    .string({ message: "Escolha seu bairro." })
    .refine((b) => Object.hasOwn(bairros, b), "Escolha um bairro da lista."),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

function firstError(result) {
  return result.error.issues[0]?.message || "Dados inválidos.";
}

function createAuthRouter({ users }) {
  const router = express.Router();

  router.post("/register", async (req, res, next) => {
    try {
      const parsed = registerSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: firstError(parsed) });
      const data = parsed.data;
      if (await users.findByEmail(data.email)) {
        return res.status(409).json({ error: "Este e-mail já está cadastrado. Tente entrar." });
      }
      const [lat, lng] = bairros[data.bairro];
      const user = await users.create({
        ...data,
        city: "São Paulo",
        lat,
        lng,
        passwordHash: await hashPassword(data.password),
      });
      res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: firstError(parsed) });
      const user = await users.findByEmail(parsed.data.email);
      if (!user || !(await checkPassword(parsed.data.password, user.password_hash))) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }
      res.json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/me", requireAuth, async (req, res, next) => {
    try {
      const user = await users.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "Conta não encontrada." });
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  const updateSchema = z.object({
    name: z.string().trim().min(2, "Informe seu nome.").max(80),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
    bairro: z.string().refine((b) => Object.hasOwn(bairros, b), "Escolha um bairro da lista."),
  });

  // PATCH /api/auth/me — editar nome, telefone e bairro
  router.patch("/me", requireAuth, async (req, res, next) => {
    try {
      const parsed = updateSchema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ error: firstError(parsed) });
      const [lat, lng] = bairros[parsed.data.bairro];
      const user = await users.update(req.user.id, { ...parsed.data, lat, lng });
      if (!user) return res.status(404).json({ error: "Conta não encontrada." });
      res.json({ user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/auth/me { password } — exclusão da conta (LGPD), exige confirmar a senha
  router.delete("/me", requireAuth, async (req, res, next) => {
    try {
      const user = await users.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "Conta não encontrada." });
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!(await checkPassword(password, user.password_hash))) {
        // 403 (não 401): a sessão continua válida, só a confirmação falhou
        return res.status(403).json({ error: "Senha incorreta. Digite sua senha para confirmar a exclusão." });
      }
      await users.anonymize(user.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAuthRouter };
