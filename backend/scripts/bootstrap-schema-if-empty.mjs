/**
 * Bootstrap local/autohospedado.
 *
 * Solo crea el esquema base si la base está vacía. No carga seeds ni sustituye
 * al runner oficial de migraciones.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { checksum, discoverMigrations, LOCK_KEY, MIGRATIONS_DIR } from './migrate-official.mjs';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
const SCHEMA_BASELINE = '038_accesos_ranking_publico.sql';
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL es obligatoria para el bootstrap del esquema');
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) || process.env.PGSSLMODE === 'disable'
    ? false
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
  const relations = await client.query(
    "SELECT COUNT(*)::int AS count FROM pg_class c " +
      "JOIN pg_namespace n ON n.oid = c.relnamespace " +
      "WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')",
  );
  const core = await client.query(
    "SELECT table_name FROM information_schema.tables " +
      "WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
    [['usuarios', 'oposiciones', 'accesos_oposicion', 'preguntas', 'tests']],
  );
  const coreTables = new Set(core.rows.map((row) => row.table_name));

  if (relations.rows[0].count !== 0 && coreTables.size < 5) {
    throw new Error('Base parcialmente inicializada o ajena; no se carga schema.sql');
  }
  if (relations.rows[0].count !== 0) {
    console.log('Esquema existente: no se carga schema.sql');
  } else {
    await client.query(await fs.readFile(schemaPath, 'utf8'));
    const migrations = await discoverMigrations(MIGRATIONS_DIR);
    const baselineIndex = migrations.indexOf(SCHEMA_BASELINE);
    if (baselineIndex < 0) throw new Error('No existe la baseline del schema.sql: ' + SCHEMA_BASELINE);
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (" +
        "filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, " +
        "status TEXT NOT NULL DEFAULT 'applied', source TEXT NOT NULL DEFAULT 'schema', " +
        "started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), applied_at TIMESTAMPTZ, error_message TEXT)",
    );
    await client.query('BEGIN');
    try {
      for (const filename of migrations.slice(0, baselineIndex + 1)) {
        const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum, status, source, applied_at) " +
            "VALUES ($1, $2, 'applied', 'schema', NOW())",
          [filename, checksum(sql)],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
    console.log('Esquema base creado');
  }
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
  await client.end();
}
