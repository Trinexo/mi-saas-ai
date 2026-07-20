import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import pkg from 'pg';

const { Pool } = pkg;

const ACTION = process.argv[2] || 'setup';
const PASSWORD = process.env.ROLE_E2E_PASSWORD || 'role-e2e-2026';
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const BLOCKED_DB_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i];

const users = {
  admin: {
    nombre: 'E2E Role Admin',
    email: process.env.ROLE_E2E_ADMIN_EMAIL || 'e2e_role_admin@test.local',
    role: 'admin',
  },
  profesor: {
    nombre: 'E2E Role Profesor',
    email: process.env.ROLE_E2E_PROFESOR_EMAIL || 'e2e_role_profesor@test.local',
    role: 'profesor',
  },
  alumno: {
    nombre: 'E2E Role Alumno',
    email: process.env.ROLE_E2E_ALUMNO_EMAIL || 'e2e_role_alumno@test.local',
    role: 'alumno',
  },
};

const marker = {
  oposicionNombre: 'E2E Role Oposicion BL-021',
  oposicionSlug: 'e2e-role-oposicion-bl-021',
  temaNombre: 'E2E Role Tema BL-021',
  bloqueNombre: 'E2E Role Bloque BL-021',
  pregunta: 'E2E Role pregunta BL-021',
};

const pool = new Pool({ connectionString: E2E_DATABASE_URL, ssl: false });

function assertSafeDatabase() {
  assert.equal(process.env.NODE_ENV, 'test', 'Role E2E requiere NODE_ENV=test');
  assert.equal(process.env.ALLOW_E2E_WRITES, 'true', 'Role E2E requiere ALLOW_E2E_WRITES=true');
  assert.equal(process.env.E2E_DB_ISOLATED, 'true', 'Role E2E requiere E2E_DB_ISOLATED=true');
  assert.ok(E2E_DATABASE_URL, 'Role E2E requiere E2E_DATABASE_URL');

  const dbUrl = new URL(E2E_DATABASE_URL);
  assert.ok(LOCAL_DB_HOSTS.has(dbUrl.hostname), `Role E2E bloqueado fuera de DB local: ${dbUrl.hostname}`);
  assert.ok(
    /(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')),
    'Role E2E requiere nombre de base claramente de test',
  );
  assert.equal(
    BLOCKED_DB_HOST_PATTERNS.some((pattern) => pattern.test(dbUrl.hostname)),
    false,
    'Role E2E bloqueado para host de base remoto o de produccion',
  );
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

async function getUserIds() {
  const { rows } = await query(
    `SELECT id FROM usuarios WHERE email = ANY($1::text[])`,
    [[users.admin.email, users.profesor.email, users.alumno.email]],
  );
  return rows.map((row) => Number(row.id));
}

async function cleanup() {
  const userIds = await getUserIds();
  if (userIds.length) {
    await query('DELETE FROM notificaciones WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM password_resets WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM accesos_oposicion WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM profesores_oposiciones WHERE user_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM suscripciones WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM progreso_usuario WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM reportes_preguntas WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM repeticion_espaciada WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('UPDATE actividad_global SET usuario_id = NULL WHERE usuario_id = ANY($1::bigint[])', [userIds]);
    await query('DELETE FROM usuarios WHERE id = ANY($1::bigint[])', [userIds]);
  }

  await query(
    `DELETE FROM opciones_respuesta
     WHERE pregunta_id IN (SELECT id FROM preguntas WHERE enunciado = $1)`,
    [marker.pregunta],
  );
  await query('DELETE FROM preguntas WHERE enunciado = $1', [marker.pregunta]);
  await query('DELETE FROM bloques WHERE nombre = $1', [marker.bloqueNombre]);
  await query('DELETE FROM temas WHERE nombre = $1', [marker.temaNombre]);
  await query('DELETE FROM oposiciones WHERE slug = $1 OR nombre = $2', [marker.oposicionSlug, marker.oposicionNombre]);
}

async function createUser(client, { nombre, email, role }, passwordHash) {
  const { rows } = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [nombre, email, passwordHash, role],
  );
  return Number(rows[0].id);
}

async function setup() {
  await cleanup();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const adminId = await createUser(client, users.admin, passwordHash);
    const profesorId = await createUser(client, users.profesor, passwordHash);
    const alumnoId = await createUser(client, users.alumno, passwordHash);

    const oposicion = await client.query(
      `INSERT INTO oposiciones (nombre, descripcion, categoria, estado, slug, precio_mensual_cents)
       VALUES ($1, 'Fixture funcional BL-021', 'e2e', 'activa', $2, 990)
       RETURNING id`,
      [marker.oposicionNombre, marker.oposicionSlug],
    );
    const oposicionId = Number(oposicion.rows[0].id);

    const tema = await client.query(
      `INSERT INTO temas (oposicion_id, nombre) VALUES ($1, $2) RETURNING id`,
      [oposicionId, marker.temaNombre],
    );
    const temaId = Number(tema.rows[0].id);

    const bloque = await client.query(
      `INSERT INTO bloques (tema_id, nombre) VALUES ($1, $2) RETURNING id`,
      [temaId, marker.bloqueNombre],
    );
    const bloqueId = Number(bloque.rows[0].id);

    const pregunta = await client.query(
      `INSERT INTO preguntas (tema_id, bloque_id, enunciado, explicacion, nivel_dificultad, estado)
       VALUES ($1, $2, $3, 'Fixture BL-021', 'media', 'aprobada')
       RETURNING id`,
      [temaId, bloqueId, marker.pregunta],
    );
    const preguntaId = Number(pregunta.rows[0].id);

    await client.query(
      `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
       VALUES ($1, 'Respuesta correcta', TRUE), ($1, 'Respuesta incorrecta', FALSE)`,
      [preguntaId],
    );
    await client.query('INSERT INTO profesores_oposiciones (user_id, oposicion_id) VALUES ($1, $2)', [profesorId, oposicionId]);
    await client.query(
      `INSERT INTO accesos_oposicion (usuario_id, oposicion_id, estado, tipo_alumno, modo_preparacion, notas)
       VALUES ($1, $2, 'activo', 'libre', 'experto', 'Fixture funcional BL-021')`,
      [alumnoId, oposicionId],
    );
    await client.query(
      `INSERT INTO suscripciones (usuario_id, plan, estado, notas)
       VALUES ($1, 'pro', 'activa', 'Fixture funcional BL-021')`,
      [alumnoId],
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ adminId, profesorId, alumnoId, oposicionId, temaId, bloqueId, preguntaId }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  assertSafeDatabase();
  if (ACTION === 'setup') {
    await setup();
    return;
  }
  if (ACTION === 'cleanup') {
    await cleanup();
    return;
  }
  throw new Error(`Accion no soportada: ${ACTION}`);
}

main()
  .finally(() => pool.end())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
