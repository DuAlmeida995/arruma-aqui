const express = require("express");
const cors = require("cors");

const categoriesRouter = require("./routes/categories");
const professionalsRouter = require("./routes/professionals");
const conversationsRouter = require("./routes/conversations");
const userRouter = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/categories", categoriesRouter);
app.use("/api/professionals", professionalsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/user", userRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`Arruma Aqui API rodando em http://localhost:${PORT}`);
});
