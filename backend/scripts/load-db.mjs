/**
 * Script temporal para cargar schema + seed + migraciones en Railway.
 * Uso: node scripts/load-db.mjs
 * Eliminar después de usar.
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('ERROR: Define DATABASE_URL como variable de entorno.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '../../database');

const FILES = [
  path.join(DB_DIR, 'schema.sql'),
  path.join(DB_DIR, 'seed.sql'),
  ...fs.readdirSync(path.join(DB_DIR, 'migrations'))
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => path.join(DB_DIR, 'migrations', f)),
];

function stripComments(sql) {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < sql.length) {
    if (!inString && sql[i] === "'") {
      inString = true;
      result += sql[i];
    } else if (inString && sql[i] === "'" && sql[i + 1] === "'") {
      result += "''"; i += 2; continue;
    } else if (inString && sql[i] === "'") {
      inString = false;
      result += sql[i];
    } else if (!inString && sql[i] === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      result += '\n'; continue;
    } else {
      result += sql[i];
    }
    i++;
  }
  return result;
}

async function applyFile(client, file) {
  const raw = fs.readFileSync(file, 'utf-8');
  const sql = stripComments(raw);
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let warnings = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (err) {
      if (
        err.message.includes('already exists') ||
        err.message.includes('duplicate') ||
        err.message.includes('does not exist') && stmt.toUpperCase().includes('DROP')
      ) {
        warnings++;
      } else {
        throw err;
      }
    }
  }
  if (warnings > 0) return `(${warnings} sentencias omitidas — ya aplicadas)`;
  return '';
}

async function run() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Conectado a Railway PostgreSQL\n');

  for (const file of FILES) {
    const name = path.relative(DB_DIR, file);
    try {
      const note = await applyFile(client, file);
      console.log(`✓ ${name} ${note}`);
    } catch (err) {
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  await client.end();
  console.log('\nBase de datos cargada correctamente.');
}

run().catch(err => { console.error(err); process.exit(1); });
