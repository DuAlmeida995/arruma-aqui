const db = require("../db");

const COLS = `r.id, r.client_id, r.category_id, c.label as category_label, c.icon as category_icon,
              r.description, to_char(r.desired_date, 'YYYY-MM-DD') as desired_date, r.status, r.created_at`;

async function create({ clientId, categoryId, description, desiredDate, lat, lng }) {
  const { rows } = await db.query(
    `insert into requests (client_id, category_id, description, desired_date, location)
     values ($1, $2, $3, $4, ST_MakePoint($6::float8, $5::float8)::geography)
     returning id`,
    [clientId, categoryId, description, desiredDate, lat, lng]
  );
  return findForClient(rows[0].id, clientId);
}

async function findForClient(id, clientId) {
  const { rows } = await db.query(
    `select ${COLS} from requests r join categories c on c.id = r.category_id
      where r.id = $1 and r.client_id = $2`,
    [id, clientId]
  );
  return rows[0] || null;
}

async function listForClient(clientId) {
  const { rows } = await db.query(
    `select ${COLS} from requests r join categories c on c.id = r.category_id
      where r.client_id = $1 order by r.created_at desc`,
    [clientId]
  );
  return rows;
}

async function setStatus(id, clientId, status) {
  const { rowCount } = await db.query("update requests set status = $3 where id = $1 and client_id = $2", [id, clientId, status]);
  return rowCount > 0;
}

module.exports = { create, findForClient, listForClient, setStatus };
