const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

// Verificação TLS completa. Se existir o certificado CA do Supabase
// (Dashboard > Project Settings > Database > SSL), ele é usado como raiz confiável.
const caPath = process.env.DB_CA_CERT || path.join(__dirname, "supabase-ca.crt");
const ssl = fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, "utf8") } : true;

// Conexões com o pooler do Supabase às vezes "morrem" no caminho sem aviso (a consulta fica
// pendurada por minutos). Limite a espera e mantenha o TCP ativo. Não repita SQL
// automaticamente: até SELECT pode chamar funções com efeitos colaterais.
const QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS || 8000);

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl,
      // o pooler do Supabase (plano gratuito) tem poucas conexões: nos testes, 2 por arquivo
      max: Number(process.env.DB_POOL_MAX || (process.env.VITEST ? 2 : 5)),
      idleTimeoutMillis: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
      connectionTimeoutMillis: 10000,
      query_timeout: QUERY_TIMEOUT_MS,
    })
  : null;

if (pool) {
  // erro numa conexão ociosa (ex.: derrubada pela rede) não pode derrubar o servidor
  pool.on("error", (err) => console.error("[db] conexão ociosa com erro:", err.message));
}

async function query(text, params) {
  if (!pool) throw new Error("DATABASE_URL não configurada no backend/.env");
  // pg-pool descarta a conexão quando a consulta falha, inclusive por timeout.
  // Uma escrita pode ter sido confirmada antes da conexão cair; repetir aqui
  // poderia duplicar operações. O chamador recebe a falha sem uma nova tentativa.
  return pool.query(text, params);
}

async function checkDb() {
  if (!pool) return "não configurado";
  try {
    await query("select 1");
    return "ok";
  } catch (err) {
    return `erro: ${err.message}`;
  }
}

module.exports = { pool, query, checkDb };
