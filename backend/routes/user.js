const express = require("express");
const { user } = require("../data/mockData");

const router = express.Router();

// GET /api/user/me
router.get("/me", (req, res) => {
  res.json(user);
});

module.exports = router;
