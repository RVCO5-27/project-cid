const path = require('path');
const fs = require('fs');
const db = require('../config/db');

function migrationsDir() {
  return path.join(__dirname, 'migrations');
}

function listSqlMigrations() {
  const dir = migrationsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d+.*\.sql$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
}

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename varchar(255) NOT NULL PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT current_timestamp()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function alreadyAppliedSet() {
  const [rows] = await db.query('SELECT filename FROM schema_migrations');
  return new Set((rows || []).map((r) => r.filename));
}

async function applyMigration(filename) {
  const fullPath = path.join(migrationsDir(), filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  if (!sql.trim()) return;

  // mysql2 will send it as a single "query" (simple protocol) and can run multiple statements
  await db.query(sql);
  await db.query('INSERT INTO schema_migrations (filename) VALUES (?)', [filename]);
}

async function runMigrations() {
  await ensureMigrationsTable();

  const files = listSqlMigrations();
  if (files.length === 0) return { applied: 0 };

  const applied = await alreadyAppliedSet();
  let count = 0;

  for (const f of files) {
    if (applied.has(f)) continue;
    await applyMigration(f);
    count += 1;
  }

  return { applied: count };
}

module.exports = { runMigrations };

