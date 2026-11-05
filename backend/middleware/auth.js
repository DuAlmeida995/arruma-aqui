const { verifyToken } = require("../services/auth");

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Faça login para continuar." });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: "Você não tem permissão para esta ação." });

module.exports = { requireAuth, requireRole };
