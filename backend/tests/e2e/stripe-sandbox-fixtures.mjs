import assert from 'node:assert/strict';
import { appendFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import pkg from 'pg';

const { Pool } = pkg;

const ACTION = process.argv[2] || 'setup';
const RUN_ID = process.env.STRIPE_E2E_RUN_ID || process.env.STRIPE_SANDBOX_RUN_ID || 'stripe_sandbox_local';
const PASSWORD = process.env.STRIPE_SANDBOX_PASSWORD || 'stripe-sandbox-2026';
const ALUMNO_EMAIL = process.env.STRIPE_SANDBOX_ALUMNO_EMAIL || `e2e_stripe_alumno_${RUN_ID}@test.local`;
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const BLOCKED_DB_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i];

const marker = {
  successNombre: `E2E Stripe Sandbox BL-022 Success ${RUN_ID}`,
  cancelNombre: `E2E Stripe Sandbox BL-022 Cancel ${RUN_ID}`,
  successSlug: `e2e-stripe-sandbox-success-${RUN_ID}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
  cancelSlug: `e2e-stripe-sandbox-cancel-${RUN_ID}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
  temaNombre: `E2E Stripe Sandbox Tema ${RUN_ID}`,
  bloqueNombre: `E2E Stripe Sandbox Bloque ${RUN_ID}`,
};

const pool = new Pool({ connectionString: E2E_DATABASE_URL, ssl: false });

function assertSafeDatabase() {
  assert.equal(process.env.NODE_ENV, 'test', 'Stripe sandbox requiere NODE_ENV=test');
  assert.equal(process.env.ALLOW_E2E_WRITES, 'true', 'Stripe sandbox requiere ALLOW_E2E_WRITES=true');
  assert.equal(process.env.ALLOW_STRIPE_E2E, 'true', 'Stripe sandbox requiere ALLOW_STRIPE_E2E=true');
  assert.equal(process.env.STRIPE_E2E_MODE, 'sandbox', 'Stripe sandbox requiere STRIPE_E2E_MODE=sandbox');
  assert.equal(process.env.E2E_DB_ISOLATED, 'true', 'Stripe sandbox requiere E2E_DB_ISOLATED=true');
  assert.ok(E2E_DATABASE_URL, 'Stripe sandbox requiere E2E_DATABASE_URL');

  const dbUrl = new URL(E2E_DATABASE_URL);
  assert.ok(LOCAL_DB_HOSTS.has(dbUrl.hostname), `Stripe sandbox bloqueado fuera de DB local: ${dbUrl.hostname}`);
  assert.ok(
    /(^|[_-])(test|ci|e2e|sandbox)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')),
    'Stripe sandbox requiere nombre de base claramente de test/e2e',
  );
  assert.equal(
    BLOCKED_DB_HOST_PATTERNS.some((pattern) => pattern.test(dbUrl.hostname)),
    false,
    'Stripe sandbox bloqueado para host de base remoto o de produccion',
  );
  assert.match(ALUMNO_EMAIL, /^e2e_stripe_alumno_[A-Za-z0-9_.+-]+@test\.local$/i);
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function getFixtureUserId() {
  const { rows } = await query('SELECT id FROM usuarios WHERE email = $1', [ALUMNO_EMAIL]);
  return rows[0]?.id ? Number(rows[0].id) : null;
}

async function getFixtureOposiciones() {
  const { rows } = await query(
    `SELECT id, nombre
     FROM oposiciones
     WHERE slug = ANY($1::text[]) OR nombre = ANY($2::text[])`,
    [[marker.successSlug, marker.cancelSlug], [marker.successNombre, marker.cancelNombre]],
  );
  return rows.map((row) => ({ id: Number(row.id), nombre: row.nombre }));
}

async function cleanup() {
  const userId = await getFixtureUserId();
  const oposiciones = await getFixtureOposiciones();
  const oposicionIds = oposiciones.map((item) => item.id);

  if (userId && oposicionIds.length) {
    await query(
      `DELETE FROM stripe_webhook_events
       WHERE object_id IN (
         SELECT stripe_session_id
         FROM accesos_oposicion
         WHERE usuario_id = $1 AND oposicion_id = ANY($2::bigint[])
       )`,
      [userId, oposicionIds],
    );
    await query('DELETE FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = ANY($2::bigint[])', [userId, oposicionIds]);
  }
  if (userId) {
    await query('DELETE FROM notificaciones WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM password_resets WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM suscripciones WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM progreso_usuario WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM reportes_preguntas WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM repeticion_espaciada WHERE usuario_id = $1', [userId]);
    await query('UPDATE actividad_global SET usuario_id = NULL WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM usuarios WHERE id = $1', [userId]);
  }

  await query(
    `DELETE FROM opciones_respuesta
     WHERE pregunta_id IN (
       SELECT p.id
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       WHERE t.nombre = $1
     )`,
    [marker.temaNombre],
  );
  await query(
    `DELETE FROM preguntas
     WHERE tema_id IN (SELECT id FROM temas WHERE nombre = $1)`,
    [marker.temaNombre],
  );
  await query('DELETE FROM bloques WHERE nombre = $1', [marker.bloqueNombre]);
  await query('DELETE FROM temas WHERE nombre = $1', [marker.temaNombre]);
  await query('DELETE FROM oposiciones WHERE slug = ANY($1::text[]) OR nombre = ANY($2::text[])', [
    [marker.successSlug, marker.cancelSlug],
    [marker.successNombre, marker.cancelNombre],
  ]);
}

async function createOposicion(client, { nombre, slug }) {
  const { rows: oposicionRows } = await client.query(
    `INSERT INTO oposiciones (nombre, descripcion, categoria, estado, slug, precio_mensual_cents)
     VALUES ($1, 'Fixture sandbox BL-022', 'e2e', 'activa', $2, 990)
     RETURNING id`,
    [nombre, slug],
  );
  const oposicionId = Number(oposicionRows[0].id);

  const { rows: temaRows } = await client.query(
    `INSERT INTO temas (oposicion_id, nombre) VALUES ($1, $2) RETURNING id`,
    [oposicionId, marker.temaNombre],
  );
  const temaId = Number(temaRows[0].id);

  const { rows: bloqueRows } = await client.query(
    `INSERT INTO bloques (tema_id, nombre) VALUES ($1, $2) RETURNING id`,
    [temaId, marker.bloqueNombre],
  );
  const bloqueId = Number(bloqueRows[0].id);

  const { rows: preguntaRows } = await client.query(
    `INSERT INTO preguntas (tema_id, bloque_id, enunciado, explicacion, nivel_dificultad, estado)
     VALUES ($1, $2, $3, 'Fixture sandbox BL-022', 'media', 'aprobada')
     RETURNING id`,
    [temaId, bloqueId, `E2E Stripe Sandbox pregunta ${oposicionId}`],
  );
  await client.query(
    `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
     VALUES ($1, 'Respuesta correcta', TRUE), ($1, 'Respuesta incorrecta', FALSE)`,
    [Number(preguntaRows[0].id)],
  );

  return oposicionId;
}

async function setup() {
  await cleanup();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: userRows } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, role)
       VALUES ('E2E Stripe Alumno', $1, $2, 'alumno')
       RETURNING id`,
      [ALUMNO_EMAIL, passwordHash],
    );
    const alumnoId = Number(userRows[0].id);
    const successOposicionId = await createOposicion(client, {
      nombre: marker.successNombre,
      slug: marker.successSlug,
    });
    const cancelOposicionId = await createOposicion(client, {
      nombre: marker.cancelNombre,
      slug: marker.cancelSlug,
    });
    await client.query('COMMIT');

    const payload = {
      alumnoId,
      alumnoEmail: ALUMNO_EMAIL,
      successOposicionId,
      successOposicionName: marker.successNombre,
      cancelOposicionId,
      cancelOposicionName: marker.cancelNombre,
      runId: RUN_ID,
    };
    writeOutputs(payload);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function writeOutputs(payload) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = [
    `alumno_email=${payload.alumnoEmail}`,
    `success_oposicion_id=${payload.successOposicionId}`,
    `success_oposicion_name=${payload.successOposicionName}`,
    `cancel_oposicion_id=${payload.cancelOposicionId}`,
    `cancel_oposicion_name=${payload.cancelOposicionName}`,
    `run_id=${payload.runId}`,
  ];
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

async function assertSuccess() {
  const userId = await getFixtureUserId();
  assert.ok(userId, 'No existe alumno fixture Stripe sandbox');
  const oposiciones = await getFixtureOposiciones();
  const success = oposiciones.find((item) => item.nombre === marker.successNombre);
  assert.ok(success, 'No existe oposicion success fixture Stripe sandbox');

  const { rows } = await query(
    `SELECT ao.id, ao.stripe_session_id, swe.event_id, swe.livemode, swe.processed_at
     FROM accesos_oposicion ao
     LEFT JOIN stripe_webhook_events swe ON swe.object_id = ao.stripe_session_id
     WHERE ao.usuario_id = $1 AND ao.oposicion_id = $2`,
    [userId, success.id],
  );
  assert.equal(rows.length, 1, 'El checkout success debe crear un unico acceso');
  assert.ok(rows[0].stripe_session_id?.startsWith('cs_'), 'El acceso debe guardar stripe_session_id');
  assert.equal(rows[0].livemode, false, 'El evento Stripe debe ser livemode=false');
  assert.ok(rows[0].processed_at, 'El webhook success debe quedar procesado');
}

async function assertCancel() {
  const userId = await getFixtureUserId();
  assert.ok(userId, 'No existe alumno fixture Stripe sandbox');
  const oposiciones = await getFixtureOposiciones();
  const cancel = oposiciones.find((item) => item.nombre === marker.cancelNombre);
  assert.ok(cancel, 'No existe oposicion cancel fixture Stripe sandbox');

  const { rows } = await query(
    `SELECT id, stripe_session_id
     FROM accesos_oposicion
     WHERE usuario_id = $1 AND oposicion_id = $2`,
    [userId, cancel.id],
  );
  assert.equal(rows.length, 0, 'El flujo cancelado no debe conceder acceso');
}

async function main() {
  assertSafeDatabase();
  if (ACTION === 'setup') return setup();
  if (ACTION === 'cleanup') return cleanup();
  if (ACTION === 'assert-success') return assertSuccess();
  if (ACTION === 'assert-cancel') return assertCancel();
  throw new Error(`Accion no soportada: ${ACTION}`);
}

main()
  .finally(() => pool.end())
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
