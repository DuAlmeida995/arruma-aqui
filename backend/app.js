const express = require("express");
const cors = require("cors");
const { checkDb } = require("./db");

const categoriesRouter = require("./routes/categories");
const professionalsRouter = require("./routes/professionals");
const conversationsRouter = require("./routes/conversations");
const userRouter = require("./routes/user");
const { createAuthRouter } = require("./routes/auth");
const usersRepo = require("./repositories/users");

function createApp({ users = usersRepo } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", db: await checkDb() });
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
