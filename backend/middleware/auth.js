const { verifyToken } = require("../services/auth");

// O token só prova QUEM é a pessoa; o papel e se a conta ainda existe vêm sempre do banco.
// Assim um token antigo (conta excluída, papel alterado) ou com papel adulterado não abre nada.
function makeRequireAuth(findById) {
  return async function requireAuth(req, res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Faça login para continuar." });
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Sua sessão expirou. Entre novamente." });
    }
    try {
      const find = findById || require("../repositories/users").findById;
      const user = await find(payload.id);
      if (!user) return res.status(401).json({ error: "Conta não encontrada. Entre novamente." });
      req.user = { id: Number(user.id), role: user.role };
      next();
    } catch (err) {
      next(err);
    }
  };
}

const requireAuth = makeRequireAuth();

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: "Você não tem permissão para esta ação." });

module.exports = { requireAuth, requireRole, makeRequireAuth };
