const db = require("../db");

module.exports = {
  async list() {
    const { rows } = await db.query("select id, label, icon from categories order by label");
    return rows;
  },
};
