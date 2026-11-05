const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

// Verificação TLS completa. Se existir o certificado CA do Supabase
// (Dashboard > Project Settings > Database > SSL), ele é usado como raiz confiável.
const caPath = process.env.DB_CA_CERT || path.join(__dirname, "supabase-ca.crt");
const ssl = fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, "utf8") } : true;

const pool = connectionString
  ? new Pool({ connectionString, ssl, max: 5, connectionTimeoutMillis: 5000 })
  : null;

async function query(text, params) {
  if (!pool) throw new Error("DATABASE_URL não configurada no backend/.env");
  return pool.query(text, params);
}

async function checkDb() {
  if (!pool) return "não configurado";
  try {
    await pool.query("select 1");
    return "ok";
  } catch (err) {
    return `erro: ${err.message}`;
  }
}

module.exports = { pool, query, checkDb };
