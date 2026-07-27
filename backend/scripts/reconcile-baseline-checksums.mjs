import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import {
  checksum,
  discoverMigrations,
  LOCK_KEY,
  MIGRATIONS_DIR,
  normalizeSql,
} from './migrate-official.mjs';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
export const BASELINE_COUNT = 36;
export const BASELINE_THROUGH = '038_accesos_ranking_publico.sql';
export const RECONCILE_CONFIRMATION = 'RECONCILE_BASELINE_CHECKSUMS';

function fail(message) {
  throw new Error(message);
}

function usageError(message) {
  fail(
    `${message}\nUso: node scripts/reconcile-baseline-checksums.mjs `
      + '--dry-run | --confirm=RECONCILE_BASELINE_CHECKSUMS',
  );
}

export function parseMode(args) {
  const dryRun = args.includes('--dry-run');
  const confirmed = args.includes(`--confirm=${RECONCILE_CONFIRMATION}`);
  const validArgs = ['--dry-run', `--confirm=${RECONCILE_CONFIRMATION}`];

  if (args.some((arg) => !validArgs.includes(arg))) usageError('Argumento no reconocido');
  if (dryRun === confirmed) usageError('Debe indicarse exactamente un modo');
  return { dryRun, confirmed };
}

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) fail('DATABASE_URL es obligatoria para reconciliar checksums');
  return value;
}

function sslConfig(url) {
  if (process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(url)) return false;
  return { rejectUnauthorized: false };
}

export function legacyCrlfChecksum(sql) {
  const crlf = normalizeSql(sql).replace(/\n/g, '\r\n');
  return crypto.createHash('sha256').update(crlf, 'utf8').digest('hex');
}

export function baselineMigrations(migrations) {
  const throughIndex = migrations.indexOf(BASELINE_THROUGH);
  if (throughIndex < 0) fail(`No existe ${BASELINE_THROUGH} en el repositorio`);

  const target = migrations.slice(0, throughIndex + 1);
  if (target.includes('039_add_stripe_webhook_events.sql')) {
    fail('La migración 039 está fuera del alcance del reconciliador');
  }
  if (target.length !== BASELINE_COUNT) {
    fail(`Se esperaban ${BASELINE_COUNT} migraciones 001–038, pero hay ${target.length}`);
  }
  return target;
}

export function validateBaselineRows(rows, target) {
  if (rows.some((row) => row.filename === '039_add_stripe_webhook_events.sql')) {
    fail('La migración 039 está registrada y bloquea la reconciliación');
  }
  if (rows.length !== BASELINE_COUNT) {
    fail(`Se esperaban exactamente ${BASELINE_COUNT} filas baseline 001–038, pero hay ${rows.length}`);
  }
  if (new Set(rows.map((row) => row.filename)).size !== rows.length) {
    fail('schema_migrations contiene filenames duplicados');
  }

  for (const row of rows) {
    if (!target.includes(row.filename)) fail(`Filename desconocido o fuera de 001–038: ${row.filename}`);
    if (row.status !== 'applied') fail(`La fila ${row.filename} no tiene status=applied`);
    if (row.source !== 'baseline') fail(`La fila ${row.filename} no tiene source=baseline`);
  }

  const found = new Set(rows.map((row) => row.filename));
  const missing = target.filter((filename) => !found.has(filename));
  if (missing.length) fail(`Faltan filas baseline: ${missing.join(', ')}`);
}

export function buildPlan(rows, migrations, sqlByFilename) {
  const target = baselineMigrations(migrations);
  validateBaselineRows(rows, target);

  const byFilename = new Map(rows.map((row) => [row.filename, row]));
  const entries = [];
  const updates = [];
  const canonicalChecksums = new Map();

  for (const filename of target) {
    const sql = sqlByFilename.get(filename);
    if (typeof sql !== 'string') fail(`No se pudo leer ${filename}`);

    const row = byFilename.get(filename);
    const canonicalChecksum = checksum(sql);
    const legacyChecksum = legacyCrlfChecksum(sql);
    canonicalChecksums.set(filename, canonicalChecksum);

    let action = 'already-canonical';
    if (row.checksum !== canonicalChecksum) {
      if (row.checksum !== legacyChecksum) {
        fail(`Checksum incompatible para ${filename}`);
      }
      action = 'update';
      updates.push({
        filename,
        oldChecksum: row.checksum,
        newChecksum: canonicalChecksum,
      });
    }

    entries.push({
      filename,
      action,
      storedChecksum: row.checksum,
      canonicalChecksum,
    });
  }

  return { target, entries, updates, canonicalChecksums };
}

export function verifyCanonicalRows(rows, target, canonicalChecksums) {
  validateBaselineRows(rows, target);
  for (const row of rows) {
    if (row.checksum !== canonicalChecksums.get(row.filename)) {
      fail(`Checksum no canónico después de reconciliar ${row.filename}`);
    }
  }
}

export function abbreviatedChecksum(value) {
  return `${value.slice(0, 12)}…`;
}

export function dryRunReport(plan) {
  return {
    mode: 'dry-run',
    targetCount: plan.target.length,
    updates: plan.entries.map((entry) => ({
      filename: entry.filename,
      action: entry.action,
      storedChecksum: abbreviatedChecksum(entry.storedChecksum),
      canonicalChecksum: abbreviatedChecksum(entry.canonicalChecksum),
    })),
  };
}

export async function applyPlan(client, plan) {
  await client.query('BEGIN');
  try {
    for (const item of plan.updates) {
      const result = await client.query(`
        UPDATE schema_migrations
        SET checksum = $2
        WHERE filename = $1
          AND checksum = $3
          AND status = 'applied'
          AND source = 'baseline'
      `, [item.filename, item.newChecksum, item.oldChecksum]);

      if (result.rowCount !== 1) fail(`La fila ${item.filename} cambió durante la reconciliación`);
    }

    const verification = await client.query(`
      SELECT filename, checksum, status, source
      FROM schema_migrations
      ORDER BY filename
    `);
    verifyCanonicalRows(verification.rows, plan.target, plan.canonicalChecksums);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function readPlan(client) {
  const registry = await client.query("SELECT to_regclass('public.schema_migrations') AS relation");
  if (!registry.rows[0]?.relation) fail('schema_migrations no existe; no se reconciliará nada');

  const result = await client.query(`
    SELECT filename, checksum, status, source
    FROM schema_migrations
    ORDER BY filename
  `);
  const migrations = await discoverMigrations(MIGRATIONS_DIR);
  const sqlByFilename = new Map();
  for (const filename of migrations) {
    sqlByFilename.set(filename, await fs.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8'));
  }
  return buildPlan(result.rows, migrations, sqlByFilename);
}

async function main() {
  const { dryRun } = parseMode(process.argv.slice(2));
  const url = databaseUrl();
  const client = new Client({ connectionString: url, ssl: sslConfig(url) });

  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    const plan = await readPlan(client);

    if (dryRun) {
      console.log(JSON.stringify(dryRunReport(plan), null, 2));
      return;
    }

    await applyPlan(client, plan);
    console.log(JSON.stringify({ mode: 'confirm', reconciled: plan.updates.length }, null, 2));
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

if (path.resolve(process.argv[1] ?? '') === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
