/**
 * Runner oficial de migraciones del esquema.
 *
 * Fuente única: database/migrations/
 * No ejecuta schema.sql ni seeds.
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

export async function discoverMigrations(directory = MIGRATIONS_DIR) {
  const names = await fs.readdir(directory);
  return names.filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
}

export function checksum(sql) {
  return crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
}

function sslConfig(url) {
  if (process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(url)) return false;
  return { rejectUnauthorized: false };
}

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let quote = null;
  let dollarTag = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];
    current += ch;

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }
    if (dollarTag) {
      if (current.endsWith(dollarTag)) dollarTag = null;
      continue;
    }
    if (quote) {
      if (ch === quote && next === quote) {
        current += next;
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '-' && next === '-') {
      current += next;
      i += 1;
      lineComment = true;
      continue;
    }
    if (ch === '/' && next === '*') {
      current += next;
      i += 1;
      blockComment = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '$') {
      const match = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarTag = match[0];
        current += match[0].slice(1);
        i += match[0].length - 1;
        continue;
      }
    }
    if (ch === ';') {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements.filter(Boolean);
}

export function withoutTopLevelTransactionStatements(sql) {
  return splitSqlStatements(sql)
    .filter((statement) => {
      const withoutComments = statement
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*--.*$/gm, '')
        .trim();
      return !/^(BEGIN|START\s+TRANSACTION|COMMIT|ROLLBACK)\s*;?\s*$/i.test(withoutComments);
    })
    .join(';\n');
}

async function ensureRegistry(client) {
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
      'filename TEXT PRIMARY KEY, ' +
      'checksum TEXT NOT NULL, ' +
      "status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applying', 'applied', 'failed')), " +
      "source TEXT NOT NULL DEFAULT 'runner', " +
      'started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ' +
      'applied_at TIMESTAMPTZ, ' +
      'error_message TEXT' +
    ')',
  );
  await client.query(
    "ALTER TABLE schema_migrations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'runner'",
  );
}

async function assertRegistryIsConsistent(client, migrations) {
  const known = new Set(migrations);
  const result = await client.query(
    'SELECT filename, status FROM schema_migrations ORDER BY filename',
  );
  for (const row of result.rows) {
    if (!known.has(row.filename)) {
      throw new Error('Registro incompatible: archivo ausente ' + row.filename);
    }
    if (row.status !== 'applied') {
      throw new Error(row.filename + ' quedó en estado ' + row.status + '; requiere revisión manual');
    }
  }
}

async function applyMigration(client, directory, filename) {
  const sql = await fs.readFile(path.join(directory, filename), 'utf8');
  const digest = checksum(sql);
  const result = await client.query(
    'SELECT checksum, status FROM schema_migrations WHERE filename = $1',
    [filename],
  );
  const applied = result.rows[0];

  if (applied && applied.checksum !== digest) {
    throw new Error('Checksum incompatible para ' + filename);
  }
  if (applied?.status === 'applied') {
    console.log('✓ ' + filename + ' ya aplicada');
    return;
  }
  if (applied) {
    throw new Error(filename + ' quedó en estado ' + applied.status + '; requiere revisión manual');
  }

  await client.query('BEGIN');
  try {
    await client.query(withoutTopLevelTransactionStatements(sql));
    await client.query(
      "INSERT INTO schema_migrations (filename, checksum, status, source, applied_at) " +
      "VALUES ($1, $2, 'applied', 'runner', NOW())",
      [filename, digest],
    );
    await client.query('COMMIT');
    console.log('✓ ' + filename + ' aplicada');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export async function run({ migrationsDir = MIGRATIONS_DIR } = {}) {
  const url = databaseUrl();
  const client = new Client({ connectionString: url, ssl: sslConfig(url) });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await ensureRegistry(client);
    const migrations = await discoverMigrations(migrationsDir);
    await assertRegistryIsConsistent(client, migrations);
    for (const filename of migrations) {
      await applyMigration(client, migrationsDir, filename);
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
    } finally {
      await client.end();
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  run().catch((error) => {
    console.error('ERROR FATAL: ' + error.message);
    process.exitCode = 1;
  });
}
