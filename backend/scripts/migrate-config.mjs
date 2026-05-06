/**
 * Migra la configuración de sistema (SMTP + app) de local a Railway.
 * Descifra los valores secretos con el JWT_SECRET local y los recifra
 * con el JWT_SECRET de Railway antes de insertarlos.
 *
 * Uso:
 *   $env:LOCAL_DB_URL   = "postgres://postgres:postgres@localhost:5432/plataforma_test"
 *   $env:RAILWAY_DB_URL = "postgresql://postgres:...@monorail.proxy.rlwy.net:14080/railway"
 *   $env:LOCAL_JWT      = "change_this_secret_in_dev"
 *   $env:RAILWAY_JWT    = "de6507a12c306a0e020f9ce37ae71de2fea4e03bb3a1f2942887c0cf130d1acf1658d2426128ebaf4498fb7e9cbb57c167fe574437daebdac86c88e48206ff54"
 *   node scripts/migrate-config.mjs
 */
import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;

const LOCAL_URL   = process.env.LOCAL_DB_URL   || 'postgres://postgres:postgres@localhost:5432/plataforma_test';
const RAILWAY_URL = process.env.RAILWAY_DB_URL;
const LOCAL_JWT   = process.env.LOCAL_JWT       || 'change_this_secret_in_dev';
const RAILWAY_JWT = process.env.RAILWAY_JWT;

if (!RAILWAY_URL) { console.error('ERROR: Define RAILWAY_DB_URL'); process.exit(1); }
if (!RAILWAY_JWT) { console.error('ERROR: Define RAILWAY_JWT'); process.exit(1); }

// ── Cifrado AES-256-GCM (misma lógica que settings.service.js) ────────────────
const ALGORITHM = 'aes-256-gcm';
const SALT      = 'plataforma-settings-salt-v1';

function deriveKey(jwtSecret) {
  return crypto.scryptSync(jwtSecret, SALT, 32);
}

function decrypt(ciphertext, jwtSecret) {
  try {
    const buf  = Buffer.from(ciphertext, 'base64');
    const key  = deriveKey(jwtSecret);
    const iv   = buf.subarray(0, 12);
    const tag  = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const dec  = crypto.createDecipheriv(ALGORITHM, key, iv);
    dec.setAuthTag(tag);
    return dec.update(data, undefined, 'utf8') + dec.final('utf8');
  } catch {
    return null;
  }
}

function encrypt(plaintext, jwtSecret) {
  const key = deriveKey(jwtSecret);
  const iv  = crypto.randomBytes(12);
  const enc = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([enc.update(plaintext, 'utf8'), enc.final()]);
  const tag = enc.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const local   = new Client({ connectionString: LOCAL_URL });
  const railway = new Client({ connectionString: RAILWAY_URL, ssl: { rejectUnauthorized: false } });

  await local.connect();
  await railway.connect();
  console.log('✅ Conectado a ambas bases de datos\n');

  // Leer todos los valores de local
  const { rows } = await local.query(
    'SELECT clave, valor, es_secreto, descripcion FROM configuracion_sistema ORDER BY clave',
  );

  console.log(`📋 Claves encontradas en local: ${rows.length}\n`);

  let migradas = 0, omitidas = 0;

  for (const row of rows) {
    if (row.valor === null) {
      console.log(`  ⏭  ${row.clave}: sin valor, omitida`);
      omitidas++;
      continue;
    }

    let valorFinal = row.valor;

    if (row.es_secreto) {
      // Descifrar con JWT local → recifrar con JWT Railway
      const plaintext = decrypt(row.valor, LOCAL_JWT);
      if (plaintext === null) {
        console.warn(`  ⚠️  ${row.clave}: no se pudo descifrar (JWT_SECRET incorrecto?), omitida`);
        omitidas++;
        continue;
      }
      valorFinal = encrypt(plaintext, RAILWAY_JWT);
      console.log(`  🔐 ${row.clave}: descifrado y re-cifrado correctamente`);
    } else {
      console.log(`  📝 ${row.clave}: "${valorFinal}"`);
    }

    await railway.query(
      `INSERT INTO configuracion_sistema (clave, valor, es_secreto, descripcion, actualizado_en)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (clave) DO UPDATE SET
         valor          = EXCLUDED.valor,
         es_secreto     = EXCLUDED.es_secreto,
         descripcion    = EXCLUDED.descripcion,
         actualizado_en = NOW()`,
      [row.clave, valorFinal, row.es_secreto, row.descripcion],
    );
    migradas++;
  }

  await local.end();
  await railway.end();

  console.log(`\n✅ Migradas: ${migradas}  Omitidas: ${omitidas}`);
  console.log('🎉 Configuración de sistema migrada a Railway.');
}

main().catch(err => {
  console.error('ERROR FATAL:', err.message);
  process.exit(1);
});
