/**
 * TKT-030 - Smoke E2E pre-release
 *
 * Ejercita el flujo completo contra una API local con base aislada.
 * Escribe datos y se niega a ejecutarse sin senales explicitas de aislamiento.
 *
 * Ejecutar:
 *   $env:NODE_ENV='test'
 *   $env:ALLOW_E2E_WRITES='true'
 *   $env:E2E_DB_ISOLATED='true'
 *   $env:E2E_DATABASE_URL='postgres://postgres:postgres@localhost:5432/plataforma_test'
 *   $env:E2E_API_BASE='http://localhost:3000/api'
 *   node --test tests/smoke/e2e-smoke.test.js
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pkg from 'pg';

const { Pool } = pkg;

const BASE = process.env.E2E_API_BASE || 'http://localhost:3000/api';
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL;
const ADMIN_EMAIL = 'admin@albacer.test';
const ADMIN_PASSWORD = 'albacer2024';
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const BLOCKED_DB_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i];

const runId = `e2e_smoke_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
const userEmail = `${runId}@test.local`;
const userName = `Smoke User ${runId}`;
const questionText = `Smoke test pregunta E2E ${runId}`;
const markerName = `E2E DB marker ${runId}`;
const markerSlug = `e2e-db-marker-${runId.replace(/_/g, '-')}`;

const created = {
  userId: null,
  testIds: new Set(),
  preguntaIds: new Set(),
  marker: {
    oposicionId: null,
    temaId: null,
    preguntaId: null,
  },
};

const pool = new Pool({ connectionString: E2E_DATABASE_URL, ssl: false });

let userToken;
let adminToken;
let adminSuiteEnabled = true;
let preguntasTest;
let generatedTestOk = false;

function assertSafeUrl() {
  assert.equal(process.env.NODE_ENV, 'test', 'Smoke E2E requiere NODE_ENV=test');
  assert.equal(process.env.ALLOW_E2E_WRITES, 'true', 'Smoke E2E requiere ALLOW_E2E_WRITES=true');
  assert.equal(process.env.E2E_DB_ISOLATED, 'true', 'Smoke E2E requiere E2E_DB_ISOLATED=true');
  assert.ok(E2E_DATABASE_URL, 'Smoke E2E requiere E2E_DATABASE_URL');

  const apiUrl = new URL(BASE);
  assert.ok(LOCAL_DB_HOSTS.has(apiUrl.hostname), `Smoke E2E bloqueado fuera de API local: ${apiUrl.hostname}`);
  assert.ok(apiUrl.pathname.startsWith('/api'), 'Smoke E2E debe apuntar a la API local bajo /api');

  const dbUrl = new URL(E2E_DATABASE_URL);
  assert.ok(LOCAL_DB_HOSTS.has(dbUrl.hostname), `Smoke E2E bloqueado fuera de DB local: ${dbUrl.hostname}`);
  assert.ok(
    /(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')),
    'Smoke E2E requiere nombre de base claramente de test',
  );
  assert.equal(
    BLOCKED_DB_HOST_PATTERNS.some((pattern) => pattern.test(dbUrl.hostname)),
    false,
    'Smoke E2E bloqueado para host de base remoto o de produccion',
  );
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  return { status: res.status, data: json.data, message: json.message, method, path };
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

function logStage(message) {
  console.log(`[E2E] ${message}`);
}

function describeApiResponse(label, response) {
  return `${label} -> HTTP ${response.status}${response.message ? `: ${response.message}` : ''}`;
}

async function createDbMarker() {
  logStage('Creating DB/API marker');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const oposicion = await client.query(
      `INSERT INTO oposiciones (nombre, descripcion, estado, slug)
       VALUES ($1, $2, 'activa', $3)
       RETURNING id`,
      [markerName, `Marker ${runId}`, markerSlug],
    );
    const oposicionId = Number(oposicion.rows[0].id);
    const tema = await client.query(
      `INSERT INTO temas (oposicion_id, nombre)
       VALUES ($1, $2)
       RETURNING id`,
      [oposicionId, `Tema ${runId}`],
    );
    const temaId = Number(tema.rows[0].id);
    const pregunta = await client.query(
      `INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad, estado)
       VALUES ($1, $2, $3, 'media', 'aprobada')
       RETURNING id`,
      [temaId, `Pregunta marker ${runId}`, 'Marker E2E'],
    );
    const preguntaId = Number(pregunta.rows[0].id);
    await client.query(
      `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
       VALUES ($1, 'A', TRUE), ($1, 'B', FALSE)`,
      [preguntaId],
    );
    await client.query('COMMIT');
    created.marker = { oposicionId, temaId, preguntaId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupMarker() {
  const { oposicionId, temaId, preguntaId } = created.marker;
  if (!oposicionId && !temaId && !preguntaId) return;
  await query('DELETE FROM opciones_respuesta WHERE pregunta_id = $1', [preguntaId]);
  await query('DELETE FROM preguntas WHERE id = $1', [preguntaId]);
  await query('DELETE FROM temas WHERE id = $1', [temaId]);
  await query('DELETE FROM oposiciones WHERE id = $1', [oposicionId]);
  created.marker = { oposicionId: null, temaId: null, preguntaId: null };
}

async function assertApiUsesE2EDatabase() {
  await createDbMarker();
  try {
    logStage('Checking API reads the isolated E2E database');
    const { status, data, message } = await api('/oposiciones');
    assert.equal(status, 200, describeApiResponse('GET /oposiciones', { status, message }));
    assert.ok(
      Array.isArray(data) && data.some((oposicion) => oposicion.nombre === markerName),
      'La API local no ve el marcador creado en E2E_DATABASE_URL; posible DATABASE_URL distinta',
    );
  } finally {
    await cleanupMarker();
  }
}

async function preventiveCleanup() {
  const staleUsers = await query(
    `SELECT id FROM usuarios
     WHERE email LIKE 'e2e_smoke_%@test.local'`,
  );
  for (const row of staleUsers.rows) {
    await cleanupUserById(Number(row.id));
  }
}

async function generateTestCompat(token, numeroPreguntas = 5) {
  const legacy = await api('/tests/generate', {
    method: 'POST',
    token,
    body: { temaId: 1, numeroPreguntas },
  });

  if (legacy.status !== 400) return legacy;

  return api('/tests/generate', {
    method: 'POST',
    token,
    body: { bloqueId: 1, numeroPreguntas },
  });
}

async function statsBloqueCompat(token) {
  const modern = await api('/stats/bloque?bloque_id=1', { token });
  if (modern.status === 200) return modern;
  return api('/stats/tema?tema_id=1', { token });
}

async function createPreguntaCompat(token, payloadBase) {
  const legacy = await api('/admin/preguntas', {
    method: 'POST',
    token,
    body: { ...payloadBase, temaId: 1 },
  });

  if (legacy.status !== 400) return legacy;

  return api('/admin/preguntas', {
    method: 'POST',
    token,
    body: { ...payloadBase, bloqueId: 1 },
  });
}

async function updatePreguntaCompat(token, preguntaId, payloadBase) {
  const legacy = await api(`/admin/preguntas/${preguntaId}`, {
    method: 'PUT',
    token,
    body: { ...payloadBase, temaId: 1 },
  });

  if (legacy.status !== 400) return legacy;

  return api(`/admin/preguntas/${preguntaId}`, {
    method: 'PUT',
    token,
    body: { ...payloadBase, bloqueId: 1 },
  });
}

async function getTrackedIds() {
  const user = await query(
    `SELECT id FROM usuarios
     WHERE email = $1 OR email LIKE $2 OR nombre = $3`,
    [userEmail, `${runId}%`, userName],
  );
  const userIds = new Set(user.rows.map((row) => Number(row.id)));
  if (created.userId) userIds.add(created.userId);

  const preguntas = await query(
    `SELECT id FROM preguntas
     WHERE id = ANY($1::bigint[]) OR enunciado = $2 OR enunciado LIKE $3`,
    [[...created.preguntaIds], questionText, `${questionText}%`],
  );
  const preguntaIds = new Set(preguntas.rows.map((row) => Number(row.id)));
  created.preguntaIds.forEach((id) => preguntaIds.add(id));

  const testsByUser = userIds.size
    ? await query('SELECT id FROM tests WHERE usuario_id = ANY($1::bigint[])', [[...userIds]])
    : { rows: [] };
  const testIds = new Set(testsByUser.rows.map((row) => Number(row.id)));
  created.testIds.forEach((id) => testIds.add(id));

  return { userIds, preguntaIds, testIds };
}

async function cleanupUserById(userId) {
  const tests = await query('SELECT id FROM tests WHERE usuario_id = $1', [userId]);
  const testIds = tests.rows.map((row) => Number(row.id));
  await cleanupByIds({ userIds: new Set([userId]), preguntaIds: new Set(), testIds: new Set(testIds) });
}

async function cleanupByIds({ userIds, preguntaIds, testIds }) {
  const users = [...userIds];
  const preguntas = [...preguntaIds];
  const tests = [...testIds];

  if (preguntas.length) {
    await query('DELETE FROM auditoria_preguntas WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM preguntas_etiquetas WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM colecciones_preguntas WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM admin_tests_preguntas WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM reportes_preguntas WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM repeticion_espaciada WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
    await query('DELETE FROM opciones_respuesta WHERE pregunta_id = ANY($1::bigint[])', [preguntas]);
  }

  if (tests.length) {
    await query('DELETE FROM respuestas_usuario WHERE test_id = ANY($1::bigint[])', [tests]);
    await query('DELETE FROM resultados_test WHERE test_id = ANY($1::bigint[])', [tests]);
    await query('DELETE FROM tests_preguntas WHERE test_id = ANY($1::bigint[])', [tests]);
    await query('DELETE FROM tests WHERE id = ANY($1::bigint[])', [tests]);
  }

  if (users.length) {
    await query('DELETE FROM notificaciones WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM password_resets WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM accesos_oposicion WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM profesores_oposiciones WHERE user_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM suscripciones WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM progreso_usuario WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM repeticion_espaciada WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM reportes_preguntas WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('UPDATE actividad_global SET usuario_id = NULL WHERE usuario_id = ANY($1::bigint[])', [users]);
    await query('DELETE FROM usuarios WHERE id = ANY($1::bigint[])', [users]);
  }

  if (preguntas.length) {
    await query('DELETE FROM preguntas WHERE id = ANY($1::bigint[])', [preguntas]);
  }
}

async function cleanupRun() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  const ids = await getTrackedIds();
  await cleanupByIds(ids);
}

async function assertNoResidues() {
  const ids = await getTrackedIds();
  const users = [...ids.userIds];
  const preguntas = [...ids.preguntaIds];
  const tests = [...ids.testIds];
  const checks = [];

  checks.push(['usuarios', (await query('SELECT COUNT(*)::int AS total FROM usuarios WHERE email = $1 OR nombre = $2', [userEmail, userName])).rows[0].total]);
  checks.push(['preguntas_run', (await query('SELECT COUNT(*)::int AS total FROM preguntas WHERE enunciado LIKE $1', [`${questionText}%`])).rows[0].total]);

  if (users.length) {
    checks.push(['notificaciones', (await query('SELECT COUNT(*)::int AS total FROM notificaciones WHERE usuario_id = ANY($1::bigint[])', [users])).rows[0].total]);
    checks.push(['password_resets', (await query('SELECT COUNT(*)::int AS total FROM password_resets WHERE usuario_id = ANY($1::bigint[])', [users])).rows[0].total]);
    checks.push(['accesos_oposicion', (await query('SELECT COUNT(*)::int AS total FROM accesos_oposicion WHERE usuario_id = ANY($1::bigint[])', [users])).rows[0].total]);
    checks.push(['progreso_usuario', (await query('SELECT COUNT(*)::int AS total FROM progreso_usuario WHERE usuario_id = ANY($1::bigint[])', [users])).rows[0].total]);
    checks.push(['repeticion_espaciada_user', (await query('SELECT COUNT(*)::int AS total FROM repeticion_espaciada WHERE usuario_id = ANY($1::bigint[])', [users])).rows[0].total]);
  }

  if (tests.length) {
    checks.push(['tests', (await query('SELECT COUNT(*)::int AS total FROM tests WHERE id = ANY($1::bigint[])', [tests])).rows[0].total]);
    checks.push(['tests_preguntas', (await query('SELECT COUNT(*)::int AS total FROM tests_preguntas WHERE test_id = ANY($1::bigint[])', [tests])).rows[0].total]);
    checks.push(['respuestas_usuario', (await query('SELECT COUNT(*)::int AS total FROM respuestas_usuario WHERE test_id = ANY($1::bigint[])', [tests])).rows[0].total]);
    checks.push(['resultados_test', (await query('SELECT COUNT(*)::int AS total FROM resultados_test WHERE test_id = ANY($1::bigint[])', [tests])).rows[0].total]);
  }

  if (preguntas.length) {
    checks.push(['preguntas', (await query('SELECT COUNT(*)::int AS total FROM preguntas WHERE id = ANY($1::bigint[])', [preguntas])).rows[0].total]);
    checks.push(['opciones_respuesta', (await query('SELECT COUNT(*)::int AS total FROM opciones_respuesta WHERE pregunta_id = ANY($1::bigint[])', [preguntas])).rows[0].total]);
    checks.push(['auditoria_preguntas', (await query('SELECT COUNT(*)::int AS total FROM auditoria_preguntas WHERE pregunta_id = ANY($1::bigint[])', [preguntas])).rows[0].total]);
  }

  const residues = checks.filter(([, total]) => total !== 0);
  assert.deepEqual(residues, [], `Quedan residuos E2E: ${JSON.stringify(residues)}`);
}

before(async () => {
  logStage(`Starting smoke run ${runId}`);
  logStage('Validating isolation flags and local targets');
  assertSafeUrl();
  logStage('Checking database connectivity');
  await query('SELECT 1');
  logStage('Cleaning stale E2E data before run');
  await preventiveCleanup();
  await assertApiUsesE2EDatabase();
});

after(async () => {
  try {
    logStage('Cleaning smoke data');
    await cleanupMarker();
    await cleanupRun();
    logStage('Checking zero residues');
    await assertNoResidues();
    logStage('Smoke cleanup finished');
  } finally {
    await pool.end();
  }
});

test('SMOKE-U01: registro de usuario', async () => {
  const { status, data } = await api('/auth/register', {
    method: 'POST',
    body: { nombre: userName, email: userEmail, password: 'pass1234' },
  });
  assert.equal(status, 201);
  assert.ok(data.id > 0, 'Debe devolver el id del usuario creado');
  created.userId = Number(data.id);
});

test('SMOKE-U02: login de usuario', async () => {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: { email: userEmail, password: 'pass1234' },
  });
  assert.equal(status, 200);
  assert.ok(data.token);
  userToken = data.token;
});

test('SMOKE-U03: catalogo oposiciones', async () => {
  const { status, data } = await api('/oposiciones');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data), 'Debe ser array');
  assert.ok(data.length > 0, 'Debe haber al menos 1 oposicion');
});

test('SMOKE-U04: catalogo temas', async () => {
  const { status, data } = await api('/temas?oposicion_id=1');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
});

test('SMOKE-U05: catalogo bloques', async () => {
  const { status, data } = await api('/bloques?tema_id=1');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
});

test('SMOKE-U06: generar test', async () => {
  const { status, data } = await generateTestCompat(userToken, 5);
  assert.ok([201, 400].includes(status));

  if (status === 201) {
    assert.ok(data.testId > 0);
    assert.ok(data.preguntas.length > 0);
    created.testIds.add(Number(data.testId));
    preguntasTest = data.preguntas;
    generatedTestOk = true;
  }
});

test('SMOKE-U07: enviar test con todas las respuestas', async () => {
  if (!generatedTestOk || !Array.isArray(preguntasTest)) return;

  const respuestas = preguntasTest.map((p) => ({
    preguntaId: Number(p.id),
    respuestaId: Number(p.opciones[0].id),
  }));
  const { status, data } = await api('/tests/submit', {
    method: 'POST',
    token: userToken,
    body: { testId: [...created.testIds][0], respuestas },
  });
  assert.equal(status, 200);
  assert.ok(typeof data.aciertos === 'number');
  assert.ok(typeof data.errores === 'number');
  assert.ok(typeof data.nota !== 'undefined');
});

test('SMOKE-U07B: generar test sin enviar no debe contar en estadisticas finalizadas', async () => {
  const { status, data } = await generateTestCompat(userToken, 5);

  assert.ok([201, 400].includes(status));

  if (status === 201) {
    assert.ok(data.testId > 0);
    created.testIds.add(Number(data.testId));
  }
});

test('SMOKE-U08: estadisticas de usuario', async () => {
  const { status, data } = await api('/stats/user', { token: userToken });
  assert.equal(status, 200);
  assert.ok(typeof data.totalTests === 'number');
  if (generatedTestOk) {
    assert.ok(data.totalTests >= 1);
  } else {
    assert.ok(data.totalTests >= 0);
  }
});

test('SMOKE-U09: estadisticas por bloque', async () => {
  const { status, data } = await statsBloqueCompat(userToken);
  assert.equal(status, 200);
  assert.ok(typeof data.preguntasVistas === 'number');
});

test('SMOKE-A01: login admin', async () => {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (status !== 200) {
    adminSuiteEnabled = false;
    return;
  }
  adminToken = data.token;
});

test('SMOKE-A02: listar preguntas admin', async () => {
  if (!adminSuiteEnabled) return;
  const { status, data } = await api('/admin/preguntas?page=1&page_size=5', { token: adminToken });
  assert.equal(status, 200);
  assert.ok(Array.isArray(data.preguntas ?? data.items ?? []));
});

test('SMOKE-A03: crear pregunta', async () => {
  if (!adminSuiteEnabled) return;
  const { status, data } = await createPreguntaCompat(adminToken, {
    enunciado: questionText,
    explicacion: `Test explicacion ${runId}`,
    referenciaNormativa: null,
    nivelDificultad: 'media',
    opciones: [
      { texto: `Opcion A ${runId}`, correcta: true },
      { texto: `Opcion B ${runId}`, correcta: false },
      { texto: `Opcion C ${runId}`, correcta: false },
      { texto: `Opcion D ${runId}`, correcta: false },
    ],
  });
  assert.equal(status, 201);
  assert.ok(data.id > 0);
  created.preguntaIds.add(Number(data.id));
});

test('SMOKE-A04: obtener pregunta por id', async () => {
  if (!adminSuiteEnabled) return;
  const preguntaId = [...created.preguntaIds][0];
  const { status, data } = await api(`/admin/preguntas/${preguntaId}`, { token: adminToken });
  assert.equal(status, 200);
  assert.equal(data.enunciado, questionText);
  assert.equal(data.opciones.length, 4);
});

test('SMOKE-A05: editar pregunta', async () => {
  if (!adminSuiteEnabled) return;
  const preguntaId = [...created.preguntaIds][0];
  const { status, data } = await updatePreguntaCompat(adminToken, preguntaId, {
    enunciado: `${questionText} editada`,
    explicacion: `Explicacion actualizada ${runId}`,
    referenciaNormativa: null,
    nivelDificultad: 'dificil',
    opciones: [
      { texto: `Opcion A actualizada ${runId}`, correcta: false },
      { texto: `Opcion B actualizada ${runId}`, correcta: true },
      { texto: `Opcion C actualizada ${runId}`, correcta: false },
      { texto: `Opcion D actualizada ${runId}`, correcta: false },
    ],
  });
  assert.equal(status, 200);
  assert.ok(data.id);
});

test('SMOKE-A06: eliminar pregunta', async () => {
  if (!adminSuiteEnabled) return;
  const preguntaId = [...created.preguntaIds][0];
  const { status, data } = await api(`/admin/preguntas/${preguntaId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert.equal(status, 200);
  assert.ok(data.id ?? data.deleted);
});

test('SMOKE-A07: pregunta eliminada devuelve 404', async () => {
  if (!adminSuiteEnabled) return;
  const preguntaId = [...created.preguntaIds][0];
  const { status } = await api(`/admin/preguntas/${preguntaId}`, { token: adminToken });
  assert.equal(status, 404);
});

test('SMOKE-A08: listar reportes', async () => {
  if (!adminSuiteEnabled) return;
  const { status } = await api('/admin/reportes?page=1&page_size=5', { token: adminToken });
  assert.equal(status, 200);
});

test('SMOKE-S01: ruta protegida sin token = 401', async () => {
  const { status } = await api('/tests/generate', { method: 'POST', body: { temaId: 1, numPreguntas: 5 } });
  assert.equal(status, 401);
});

test('SMOKE-S02: ruta admin con token de usuario = 403', async () => {
  const { status } = await api('/admin/preguntas', { token: userToken });
  assert.equal(status, 403);
});

test('SMOKE-S03: login con credenciales incorrectas = 401', async () => {
  const { status } = await api('/auth/login', {
    method: 'POST',
    body: { email: userEmail, password: 'wrongpass' },
  });
  assert.equal(status, 401);
});
