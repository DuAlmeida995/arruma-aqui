const express = require("express");
const cors = require("cors");
const { checkDb } = require("./db");

const categoriesRouter = require("./routes/categories");
const professionalsRouter = require("./routes/professionals");
const conversationsRouter = require("./routes/conversations");
const userRouter = require("./routes/user");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  res.json({ status: "ok", db: await checkDb() });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/professionals", professionalsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/user", userRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

module.exports = app;
