/**
 * Aplica las migraciones de backend/database/migrations/ a Railway.
 * Uso: $env:DATABASE_URL="postgresql://..."; node scripts/apply-backend-migrations.mjs
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
const MIGRATIONS_DIR = path.resolve(__dirname, '../database/migrations');

function parseSql(raw) {
  // Eliminar comentarios de bloque
  let sql = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  // Eliminar comentarios de línea
  sql = sql.replace(/--[^\n]*/g, '');

  // Extraer bloques DO $$ ... $$ ; como un solo statement
  const statements = [];
  let current = '';
  let inDollar = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    current += ch;

    // Detectar inicio/fin de bloque $$
    if (sql.slice(i, i + 2) === '$$') {
      inDollar = !inDollar;
      current += '$';
      i++;
      continue;
    }

    if (!inDollar && ch === ';') {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }

  const remaining = current.trim();
  if (remaining) statements.push(remaining);

  return statements.filter(s => s.length > 1);
}

async function runMigration(client, filePath) {
  const name = path.basename(filePath);
  console.log(`\n📄 Aplicando: ${name}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const statements = parseSql(raw);
  console.log(`   ${statements.length} sentencias encontradas`);

  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (err) {
      console.error(`   ❌ Error en statement:\n   ${stmt.slice(0, 120)}...\n   ${err.message}`);
      throw err;
    }
  }

  console.log(`   ✅ ${name} aplicada correctamente`);
}

async function main() {
  const client = new Client({
    connectionString: DB_URL,
    ssl: DB_URL.includes('railway.internal')
      ? false
      : { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Conectado a Railway PostgreSQL');

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\nMigraciones a aplicar: ${files.join(', ')}`);

  for (const file of files) {
    await runMigration(client, path.join(MIGRATIONS_DIR, file));
  }

  await client.end();
  console.log('\n✅ Todas las migraciones aplicadas.');
}

main().catch(err => {
  console.error('ERROR FATAL:', err.message);
  process.exit(1);
});
