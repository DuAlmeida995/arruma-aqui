// Identifica o usuário logado (token JWT) e carrega sua localização aproximada.
const db = require("../db");
const { verifyToken } = require("../services/auth");

const FALLBACK_POINT = { lat: -23.5505, lng: -46.6333 }; // centro de SP, se o usuário não tiver bairro

async function loadUser(where, value) {
  const { rows } = await db.query(
    `select id, name, email, role, bairro, city,
            ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
       from users where ${where} = $1 and deleted_at is null`,
    [value]
  );
  return rows[0] || null;
}

async function currentUser(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    let user = null;
    if (h.startsWith("Bearer ")) {
      let payload;
      try {
        payload = verifyToken(h.slice(7));
      } catch {
        return res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
      }
      user = await loadUser("id", payload.id);
      if (!user) return res.status(401).json({ error: "Conta não encontrada. Entre novamente." });
    }
    if (!user) return res.status(401).json({ error: "Faça login para continuar." });
    if (user.lat == null) Object.assign(user, FALLBACK_POINT);
    req.me = { ...user, id: Number(user.id), lat: Number(user.lat), lng: Number(user.lng) };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { currentUser };
