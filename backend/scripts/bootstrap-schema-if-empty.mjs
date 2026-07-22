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

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
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
  const result = await client.query("SELECT to_regclass('public.usuarios') AS table_name");
  if (result.rows[0].table_name) {
    console.log('Esquema existente: no se carga schema.sql');
  } else {
    await client.query(await fs.readFile(schemaPath, 'utf8'));
    console.log('Esquema base creado');
  }
} finally {
  await client.end();
}
