/**
 * Script temporal: exporta usuarios de la BD local e importa en Railway.
 * Uso: node scripts/migrate-users.mjs
 */
import pg from 'pg';

const { Client } = pg;

const LOCAL_URL  = 'postgres://postgres:postgres@localhost:5432/plataforma_test';
const REMOTE_URL = 'postgresql://postgres:xaUbGIcQGmTrrRKmUSiVAmnrtNNqmcgE@monorail.proxy.rlwy.net:14080/railway';

async function run() {
  const local  = new Client({ connectionString: LOCAL_URL });
  const remote = new Client({ connectionString: REMOTE_URL, ssl: { rejectUnauthorized: false } });

  await local.connect();
  await remote.connect();
  console.log('Conectado a BD local y Railway\n');

  // Exportar usuarios locales
  const { rows: usuarios } = await local.query(`
    SELECT nombre, email, password_hash, role,
           oposicion_preferida_id, objetivo_diario_preguntas, fecha_registro
    FROM usuarios
    ORDER BY id
  `);

  console.log(`Usuarios encontrados en BD local: ${usuarios.length}`);

  let insertados = 0;
  let omitidos   = 0;

  for (const u of usuarios) {
    try {
      await remote.query(`
        INSERT INTO usuarios (nombre, email, password_hash, role, objetivo_diario_preguntas, fecha_registro)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [u.nombre, u.email, u.password_hash, u.role, u.objetivo_diario_preguntas, u.fecha_registro]);
      insertados++;
      console.log(`  ✓ ${u.email} (${u.role})`);
    } catch (err) {
      omitidos++;
      console.log(`  ~ ${u.email}: ${err.message}`);
    }
  }

  console.log(`\nResultado: ${insertados} migrados, ${omitidos} omitidos`);

  await local.end();
  await remote.end();
}

run().catch(err => { console.error(err); process.exit(1); });
