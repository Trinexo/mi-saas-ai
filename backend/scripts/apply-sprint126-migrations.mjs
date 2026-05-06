/**
 * Aplica las migraciones del catálogo raíz (database/migrations/) a Railway.
 *
 * Solo aplica las migraciones 014–019 que son nuevas en el sprint 126.
 * Cada migración es idempotente (IF NOT EXISTS / IF EXISTS) salvo la 019 (rename).
 * La 019 se protege comprobando si la tabla 'bloques' ya existe antes de ejecutar.
 *
 * Uso:
 *   $env:DATABASE_URL="postgresql://postgres:<pass>@<host>:<port>/railway"
 *   node scripts/apply-sprint126-migrations.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('ERROR: Define DATABASE_URL como variable de entorno antes de ejecutar.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS = [
  '014_add_categoria_estado_to_oposiciones.sql',
  '015_add_campos_editor_to_preguntas.sql',
  '016_add_etiquetas.sql',
  '017_add_simulacros.sql',
  '018_add_actividad_global.sql',
];

async function tableExists(client, name) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [name],
  );
  return rows.length > 0;
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('✅ Conectado a Railway PostgreSQL\n');

    // ── Migraciones 014-018 (idempotentes) ─────────────────────────────────
    for (const file of MIGRATIONS) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = readFileSync(filePath, 'utf8');
      process.stdout.write(`  Aplicando ${file} … `);
      try {
        await client.query(sql);
        console.log('OK');
      } catch (err) {
        console.log(`AVISO: ${err.message}`);
      }
    }

    // ── Migración 019: rename materias/temas → temas/bloques ───────────────
    const migration019 = '019_rename_materias_temas_to_temas_bloques.sql';
    process.stdout.write(`  Aplicando ${migration019} … `);

    const bloqueYaExiste = await tableExists(client, 'bloques');
    if (bloqueYaExiste) {
      console.log('OMITIDA (tabla "bloques" ya existe, rename ya fue aplicado)');
    } else {
      const sql019 = readFileSync(path.join(MIGRATIONS_DIR, migration019), 'utf8');
      try {
        await client.query(sql019);
        console.log('OK');
      } catch (err) {
        console.error(`ERROR: ${err.message}`);
        throw err;
      }
    }

    console.log('\n🎉 Migraciones del sprint 126 aplicadas correctamente.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
