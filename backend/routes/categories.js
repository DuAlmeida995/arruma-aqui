const express = require("express");
const repo = require("../repositories/categories");

const router = express.Router();

// GET /api/categories
router.get("/", async (req, res, next) => {
  try {
    res.json(await repo.list());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
