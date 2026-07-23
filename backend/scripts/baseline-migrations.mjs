/**
 * Baseline manual y explícito para una base existente.
 *
 * Este comando nunca ejecuta migraciones. Solo registra checksums después de
 * una validación conservadora del esquema.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { checksum, discoverMigrations, LOCK_KEY, MIGRATIONS_DIR } from './migrate-official.mjs';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
const args = process.argv.slice(2);
const throughArg = args.find((arg) => arg.startsWith('--through='));
const through = throughArg?.slice('--through='.length);
const dryRun = args.includes('--dry-run');
const confirmed = args.includes('--confirm=BASELINE');

function fail(message) {
  throw new Error(message);
}

if (!url) fail('DATABASE_URL es obligatoria');
if (!through) fail('Uso: npm run db:baseline -- --through=039_nombre.sql [--dry-run|--confirm=BASELINE]');
if (!dryRun && !confirmed) {
  fail('La ejecución real requiere --confirm=BASELINE; use --dry-run para revisar');
}

const client = new Client({
  connectionString: url,
  ssl: process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(url)
    ? false
    : { rejectUnauthorized: false },
});

async function ensureRegistry() {
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
      'filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, ' +
      "status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applying', 'applied', 'failed')), " +
      "source TEXT NOT NULL DEFAULT 'runner', started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), " +
      'applied_at TIMESTAMPTZ, error_message TEXT)',
  );
  await client.query(
    "ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'runner'",
  );
}

async function validateSchema(target) {
  const relationResult = await client.query(
    "SELECT COUNT(*)::int AS count FROM pg_class c " +
      "JOIN pg_namespace n ON n.oid = c.relnamespace " +
      "WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')",
  );
  if (relationResult.rows[0].count === 0) {
    fail('El esquema está vacío; no se permite baseline sobre una base vacía');
  }

  const tables = ['usuarios', 'oposiciones', 'accesos_oposicion', 'preguntas', 'tests', 'admin_tests'];
  if (target >= '039_add_stripe_webhook_events.sql') tables.push('stripe_webhook_events');
  const tableResult = await client.query(
    "SELECT table_name FROM information_schema.tables " +
      "WHERE table_schema = 'public' AND table_name = ANY($1::text[])",
    [tables],
  );
  const found = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = tables.filter((table) => !found.has(table));
  if (missingTables.length) fail('Faltan tablas esenciales: ' + missingTables.join(', '));

  const columnResult = await client.query(
    "SELECT table_name, column_name FROM information_schema.columns " +
      "WHERE table_schema = 'public' AND ((table_name = 'usuarios' AND column_name = 'id') " +
      "OR (table_name = 'oposiciones' AND column_name = 'id') " +
      "OR (table_name = 'accesos_oposicion' AND column_name IN ('usuario_id', 'oposicion_id')) " +
      "OR (table_name = 'tests' AND column_name IN ('id', 'usuario_id')) " +
      "OR (table_name = 'admin_tests' AND column_name = 'id'))",
  );
  const columns = new Set(columnResult.rows.map((row) => row.table_name + '.' + row.column_name));
  const requiredColumns = [
    'usuarios.id', 'oposiciones.id', 'accesos_oposicion.usuario_id',
    'accesos_oposicion.oposicion_id', 'tests.id', 'tests.usuario_id', 'admin_tests.id',
  ];
  const missingColumns = requiredColumns.filter((column) => !columns.has(column));
  if (missingColumns.length) fail('Faltan columnas esenciales: ' + missingColumns.join(', '));
}

try {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

  const migrations = await discoverMigrations(MIGRATIONS_DIR);
  const index = migrations.indexOf(through);
  if (index < 0) fail('Migración límite inexistente: ' + through);

  const registryExists = await client.query("SELECT to_regclass('public.schema_migrations') AS name");
  const existing = registryExists.rows[0].name
    ? await client.query('SELECT filename, checksum, status FROM schema_migrations')
    : { rows: [] };
  if (existing.rows.length) fail('schema_migrations no está vacío; baseline bloqueado');
  await validateSchema(through);

  const rows = [];
  for (const filename of migrations.slice(0, index + 1)) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
    rows.push({ filename, checksum: checksum(sql) });
  }
  console.log(JSON.stringify({ through, count: rows.length, dryRun, rows }, null, 2));

  if (!dryRun) {
    await ensureRegistry();
    await client.query('BEGIN');
    try {
      for (const row of rows) {
        await client.query(
          "INSERT INTO schema_migrations (filename, checksum, status, source, applied_at) " +
          "VALUES ($1, $2, 'applied', 'baseline', NOW())",
          [row.filename, row.checksum],
        );
      }
      await client.query('COMMIT');
      console.log('Baseline registrada correctamente');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    }
  }
} catch (error) {
  console.error('ERROR BASELINE: ' + error.message);
  process.exitCode = 1;
} finally {
  try {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
  } catch {}
  await client.end().catch(() => {});
}
