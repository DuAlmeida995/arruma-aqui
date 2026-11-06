const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { checkDb } = require("./db");

const categoriesRouter = require("./routes/categories");
const professionalsRouter = require("./routes/professionals");
const conversationsRouter = require("./routes/conversations");
const userRouter = require("./routes/user");
const { createAuthRouter } = require("./routes/auth");
const usersRepo = require("./repositories/users");

function createApp({ users = usersRepo } = {}) {
  const app = express();

  // Atrás do proxy do Render, TRUST_PROXY=1 faz o limite de tentativas usar o IP real do cliente
  app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
  app.use(helmet());
  // CORS: o app (Capacitor) sempre pode chamar a API — no iOS a origem é capacitor://localhost
  // e no Android https://localhost. Além disso, os endereços em CORS_ORIGIN (separados por vírgula);
  // sem a variável, libera o front local de desenvolvimento.
  const APP_ORIGINS = ["capacitor://localhost", "https://localhost", "http://localhost"];
  const allowed = [
    ...APP_ORIGINS,
    ...(process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""))
      .filter(Boolean),
  ];
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
    })
  );
  app.use(express.json({ limit: "100kb" }));

  // Limite de tentativas de login/cadastro por IP (contra força bruta).
  // Nos testes automáticos fica desligado, salvo RATE_LIMIT_IN_TESTS=1.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT || 20),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => Boolean(process.env.VITEST) && process.env.RATE_LIMIT_IN_TESTS !== "1",
    message: { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
  });
  app.use(["/api/auth/login", "/api/auth/register"], authLimiter);

  app.get("/api/health", async (req, res) => {
    // versão = commit em produção (o Render define RENDER_GIT_COMMIT); útil para conferir deploys
    res.json({ status: "ok", db: await checkDb(), version: (process.env.RENDER_GIT_COMMIT || "local").slice(0, 7) });
  });

  app.get("/api/bairros", (req, res) => res.json(Object.keys(require("./config/bairros"))));
  app.use("/api/auth", createAuthRouter({ users }));
  app.use("/api/categories", categoriesRouter);
  app.use("/api/professionals", professionalsRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/user", userRouter);
  app.use("/api/provider", require("./routes/provider"));
  app.use("/api/requests", require("./routes/requests"));
  app.use("/api/admin", require("./routes/admin"));

  app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Corpo da requisição não é um JSON válido." });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "Requisição grande demais." });
    console.error(err);
    res
      .status(500)
      .json({
        error: "Algo deu errado no servidor. Tente novamente em instantes.",
      });
  });

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
