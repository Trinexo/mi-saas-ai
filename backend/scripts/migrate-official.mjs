/**
 * Runner oficial de migraciones del esquema.
 *
 * Fuente única: database/migrations/
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);
export const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');
export const LOCK_KEY = 1543271840;

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL es obligatoria para ejecutar migraciones');
  return value;
}

export async function discoverMigrations() {
  const names = await fs.readdir(MIGRATIONS_DIR);
  return names.filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
}

export function checksum(sql) {
  return crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
}

function sslConfig(url) {
  if (process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(url)) return false;
  return { rejectUnauthorized: false };
}

async function ensureRegistry(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('applying', 'applied', 'failed')),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      applied_at TIMESTAMPTZ,
      error_message TEXT
    )
  `);
}

async function applyBaseline(client, migrations) {
  const baseline = process.env.MIGRATIONS_BASELINE;
  if (!baseline) return;
  if (!migrations.includes(baseline)) {
    throw new Error(`MIGRATIONS_BASELINE no existe: ${baseline}`);
  }

  const existing = await client.query('SELECT COUNT(*)::int AS count FROM schema_migrations');
  if (existing.rows[0].count !== 0) {
    throw new Error('MIGRATIONS_BASELINE solo puede usarse sobre un registro vacío');
  }

  const baselineIndex = migrations.indexOf(baseline);
  for (const filename of migrations.slice(0, baselineIndex + 1)) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
    await client.query(
      `INSERT INTO schema_migrations
        (filename, checksum, status, applied_at)
       VALUES ($1, $2, 'applied', NOW())`,
      [filename, checksum(sql)],
    );
  }
  console.log(`Baseline registrada hasta ${baseline}`);
}

async function applyMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filePath, 'utf8');
  const digest = checksum(sql);
  const result = await client.query(
    'SELECT filename, checksum, status FROM schema_migrations WHERE filename = $1',
    [filename],
  );
  const applied = result.rows[0];

  if (applied && applied.checksum !== digest) {
    throw new Error(`Checksum incompatible para ${filename}`);
  }
  if (applied?.status === 'applied') {
    console.log(`✓ ${filename} ya aplicada`);
    return;
  }
  if (applied) {
    throw new Error(`${filename} quedó en estado ${applied.status}; requiere revisión manual`);
  }

  await client.query(
    `INSERT INTO schema_migrations (filename, checksum, status)
     VALUES ($1, $2, 'applying')`,
    [filename, digest],
  );

  try {
    await client.query(sql);
    await client.query(
      `UPDATE schema_migrations
          SET status = 'applied', applied_at = NOW(), error_message = NULL
        WHERE filename = $1`,
      [filename],
    );
    console.log(`✓ ${filename} aplicada`);
  } catch (error) {
    await client.query(
      `UPDATE schema_migrations
          SET status = 'failed', error_message = $2
        WHERE filename = $1`,
      [filename, error.message.slice(0, 4000)],
    );
    throw error;
  }
}

export async function run() {
  const url = databaseUrl();
  const client = new Client({ connectionString: url, ssl: sslConfig(url) });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await ensureRegistry(client);
    const migrations = await discoverMigrations();
    await applyBaseline(client, migrations);
    for (const filename of migrations) await applyMigration(client, filename);
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } finally { await client.end(); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  run().catch((error) => {
    console.error(`ERROR FATAL: ${error.message}`);
    process.exitCode = 1;
  });
}
