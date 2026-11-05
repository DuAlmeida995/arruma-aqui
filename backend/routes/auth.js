const express = require("express");
const { z } = require("zod");
const { hashPassword, checkPassword, signToken, publicUser } = require("../services/auth");
const { requireAuth } = require("../middleware/auth");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  role: z.enum(["client", "provider"], { message: "Escolha se você é cliente ou prestador." }),
  phone: z.string().trim().max(20).optional(),
  bairro: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
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
      const user = await users.create({ ...data, passwordHash: await hashPassword(data.password) });
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

  return router;
}

module.exports = { createAuthRouter };
