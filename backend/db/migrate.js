// Aplica as migrations de db/migrations em ordem, uma vez cada.
// Uso: npm run db:migrate
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function listMigrationFiles(dir = MIGRATIONS_DIR) {
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();
}

function pendingMigrations(files, applied) {
  const done = new Set(applied);
  return files.filter((f) => !done.has(f));
}

async function migrate(client, { dir = MIGRATIONS_DIR, log = console.log } = {}) {
  await client.query(
    `create table if not exists schema_migrations (
       name text primary key,
       applied_at timestamptz not null default now()
     )`
  );
  const { rows } = await client.query("select name from schema_migrations");
  const pending = pendingMigrations(listMigrationFiles(dir), rows.map((r) => r.name));

  if (pending.length === 0) {
    log("Nenhuma migration pendente.");
    return [];
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
      log(`✓ ${file}`);
    } catch (err) {
      await client.query("rollback");
      throw new Error(`Falha na migration ${file}: ${err.message}`);
    }
  }
  return pending;
}

module.exports = { listMigrationFiles, pendingMigrations, migrate };

if (require.main === module) {
  const { pool } = require("./index");
  if (!pool) {
    console.error("DATABASE_URL não configurada no backend/.env");
    process.exit(1);
  }
  (async () => {
    const client = await pool.connect();
    try {
      await migrate(client);
    } catch (err) {
      console.error(err.message);
      process.exitCode = 1;
    } finally {
      client.release();
      await pool.end();
    }
  })();
}
