const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s === "troque-isto") throw new Error("JWT_SECRET não configurado no backend/.env");
  return s;
}

const hashPassword = (plain) => bcrypt.hash(plain, 10);
const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });
}

function verifyToken(token) {
  const p = jwt.verify(token, secret());
  return { id: Number(p.sub), role: p.role };
}

// Nunca devolver hash de senha nem coordenadas exatas
function publicUser(u) {
  return { id: Number(u.id), name: u.name, email: u.email, role: u.role, bairro: u.bairro ?? null, city: u.city ?? null, phone: u.phone ?? null };
}

module.exports = { hashPassword, checkPassword, signToken, verifyToken, publicUser };
