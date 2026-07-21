import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import bcrypt from 'bcryptjs';
import pkg from 'pg';

const { Pool } = pkg;

const ACTION = process.argv[2] || 'setup';
const RUN_ID = process.env.ALUMNO_E2E_RUN_ID || 'alumno_test_flow_local';
const PASSWORD = process.env.ALUMNO_E2E_PASSWORD || 'alumno-e2e-2026';
const ALUMNO_EMAIL = process.env.ALUMNO_E2E_EMAIL || `e2e_alumno_test_${RUN_ID}@test.local`;
const MANIFEST_PATH = process.env.ALUMNO_E2E_MANIFEST || join(tmpdir(), `alumno-test-flow-${RUN_ID}.json`);
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const BLOCKED_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i, /rds/i, /production/i];

const marker = {
  alumnoNombre: `E2E Alumno Test Flow ${RUN_ID}`,
  oposicionNombre: `E2E Oposicion Test Alumno ${RUN_ID}`,
  oposicionSlug: `e2e-oposicion-test-alumno-${RUN_ID}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
  temaNombre: `E2E Tema Test Alumno ${RUN_ID}`,
  bloqueNombre: `E2E Bloque Test Alumno ${RUN_ID}`,
  preguntaPrefix: `E2E Pregunta Test Alumno ${RUN_ID}`,
  explicacionPrefix: `E2E Explicacion Test Alumno ${RUN_ID}`,
};

const pool = new Pool({ connectionString: E2E_DATABASE_URL, ssl: false });

function redactUrl(value) {
  const parsed = new URL(value);
  return `${parsed.protocol}//${parsed.hostname}:${parsed.port}${parsed.pathname}`;
}

function assertLocalUrl(value, label, { requireApi = false } = {}) {
  assert.ok(value, `${label} requerido`);
  const parsed = new URL(value);
  assert.ok(LOCAL_DB_HOSTS.has(parsed.hostname), `${label} debe apuntar a host local: ${parsed.hostname}`);
  assert.equal(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname)), false, `${label} apunta a host remoto o productivo`);
  if (requireApi) {
    assert.ok(parsed.pathname.startsWith('/api'), `${label} debe estar bajo /api`);
  }
  return parsed;
}

function assertSameDbBase(left, right) {
  const a = new URL(left);
  const b = new URL(right);
  assert.deepEqual(
    [a.protocol, a.hostname, a.port, a.pathname],
    [b.protocol, b.hostname, b.port, b.pathname],
    'DATABASE_URL y E2E_DATABASE_URL deben apuntar a la misma base aislada',
  );
}

function assertSafeEnvironment() {
  assert.equal(process.env.NODE_ENV, 'test', 'Alumno test flow requiere NODE_ENV=test');
  assert.equal(process.env.ALLOW_E2E_WRITES, 'true', 'Alumno test flow requiere ALLOW_E2E_WRITES=true');
  assert.equal(process.env.E2E_DB_ISOLATED, 'true', 'Alumno test flow requiere E2E_DB_ISOLATED=true');
  assert.ok(E2E_DATABASE_URL, 'Alumno test flow requiere E2E_DATABASE_URL');
  assert.ok(DATABASE_URL, 'Alumno test flow requiere DATABASE_URL');
  assertSameDbBase(E2E_DATABASE_URL, DATABASE_URL);

  const dbUrl = assertLocalUrl(E2E_DATABASE_URL, 'E2E_DATABASE_URL');
  assert.ok(
    /(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')),
    'Alumno test flow requiere nombre de base claramente de test',
  );

  if (process.env.E2E_API_BASE) assertLocalUrl(process.env.E2E_API_BASE, 'E2E_API_BASE', { requireApi: true });
  if (process.env.PLAYWRIGHT_BASE_URL) assertLocalUrl(process.env.PLAYWRIGHT_BASE_URL, 'PLAYWRIGHT_BASE_URL');
  if (process.env.FRONTEND_URL) assertLocalUrl(process.env.FRONTEND_URL, 'FRONTEND_URL');
  assert.match(ALUMNO_EMAIL, /^e2e_alumno_test_[A-Za-z0-9_.+-]+@test\.local$/i);

  for (const value of Object.values(process.env)) {
    if (!value || typeof value !== 'string') continue;
    assert.equal(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(value)), false, 'Entorno E2E contiene referencia remota/productiva bloqueada');
  }
}

async function query(sql, params = []) {
  return pool.query(sql, params);
}

function loadManifest() {
  assert.ok(existsSync(MANIFEST_PATH), `No existe manifest E2E: ${MANIFEST_PATH}`);
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function saveManifest(manifest) {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeOutputs(manifest) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = [
    `run_id=${manifest.runId}`,
    `manifest_path=${manifest.manifestPath}`,
    `alumno_email=${manifest.alumno.email}`,
    `oposicion_name=${manifest.oposicion.nombre}`,
    `tema_name=${manifest.tema.nombre}`,
    `bloque_name=${manifest.bloque.nombre}`,
  ];
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

async function tableExists(tableName) {
  const { rows } = await query('SELECT to_regclass($1) AS table_name', [`public.${tableName}`]);
  return Boolean(rows[0]?.table_name);
}

async function cleanupFromMarkers() {
  const { rows: userRows } = await query('SELECT id FROM usuarios WHERE email = $1', [ALUMNO_EMAIL]);
  const userId = userRows[0]?.id ? Number(userRows[0].id) : null;
  const { rows: opRows } = await query('SELECT id FROM oposiciones WHERE slug = $1 OR nombre = $2', [marker.oposicionSlug, marker.oposicionNombre]);
  const oposicionIds = opRows.map((row) => Number(row.id));
  const { rows: temaRows } = await query('SELECT id FROM temas WHERE nombre = $1', [marker.temaNombre]);
  const temaIds = temaRows.map((row) => Number(row.id));

  let testIds = [];
  if (userId) {
    const result = await query(
      `SELECT id FROM tests
       WHERE usuario_id = $1
          OR oposicion_id = ANY($2::bigint[])
          OR tema_id = ANY($3::bigint[])`,
      [userId, oposicionIds, temaIds],
    );
    testIds = result.rows.map((row) => Number(row.id));
  }

  if (testIds.length) {
    await query('DELETE FROM respuestas_usuario WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM resultados_test WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM tests_preguntas WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM tests WHERE id = ANY($1::bigint[])', [testIds]);
  }

  if (userId) {
    await query('DELETE FROM notificaciones WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM password_resets WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM accesos_oposicion WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM suscripciones WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM progreso_usuario WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM preguntas_marcadas WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM reportes_preguntas WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM repeticion_espaciada WHERE usuario_id = $1', [userId]);
    await query('UPDATE actividad_global SET usuario_id = NULL WHERE usuario_id = $1', [userId]);
    await query('DELETE FROM usuarios WHERE id = $1', [userId]);
  }

  await query(
    `DELETE FROM opciones_respuesta
     WHERE pregunta_id IN (SELECT id FROM preguntas WHERE enunciado LIKE $1)`,
    [`${marker.preguntaPrefix}%`],
  );
  await query('DELETE FROM preguntas WHERE enunciado LIKE $1', [`${marker.preguntaPrefix}%`]);
  await query('DELETE FROM bloques WHERE nombre = $1', [marker.bloqueNombre]);
  await query('DELETE FROM temas WHERE nombre = $1', [marker.temaNombre]);
  await query('DELETE FROM oposiciones WHERE slug = $1 OR nombre = $2', [marker.oposicionSlug, marker.oposicionNombre]);
}

async function cleanupFromManifest(manifest) {
  const testIds = await findRunTestIds(manifest);
  if (testIds.length) {
    await query('DELETE FROM respuestas_usuario WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM resultados_test WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM tests_preguntas WHERE test_id = ANY($1::bigint[])', [testIds]);
    await query('DELETE FROM tests WHERE id = ANY($1::bigint[])', [testIds]);
  }

  await query('DELETE FROM notificaciones WHERE usuario_id = $1', [manifest.alumno.id]);
  await query('DELETE FROM password_resets WHERE usuario_id = $1', [manifest.alumno.id]);
  await query('DELETE FROM accesos_oposicion WHERE id = $1 OR (usuario_id = $2 AND oposicion_id = $3)', [
    manifest.acceso.id,
    manifest.alumno.id,
    manifest.oposicion.id,
  ]);
  await query('DELETE FROM suscripciones WHERE usuario_id = $1', [manifest.alumno.id]);
  await query('DELETE FROM progreso_usuario WHERE usuario_id = $1', [manifest.alumno.id]);
  await query('DELETE FROM preguntas_marcadas WHERE usuario_id = $1 OR pregunta_id = ANY($2::bigint[])', [
    manifest.alumno.id,
    manifest.preguntas.map((item) => item.id),
  ]);
  await query('DELETE FROM reportes_preguntas WHERE usuario_id = $1 OR pregunta_id = ANY($2::bigint[])', [
    manifest.alumno.id,
    manifest.preguntas.map((item) => item.id),
  ]);
  await query('DELETE FROM repeticion_espaciada WHERE usuario_id = $1 OR pregunta_id = ANY($2::bigint[])', [
    manifest.alumno.id,
    manifest.preguntas.map((item) => item.id),
  ]);
  await query('UPDATE actividad_global SET usuario_id = NULL WHERE usuario_id = $1', [manifest.alumno.id]);
  await query('DELETE FROM opciones_respuesta WHERE pregunta_id = ANY($1::bigint[])', [manifest.preguntas.map((item) => item.id)]);
  await query('DELETE FROM preguntas WHERE id = ANY($1::bigint[])', [manifest.preguntas.map((item) => item.id)]);
  await query('DELETE FROM bloques WHERE id = $1', [manifest.bloque.id]);
  await query('DELETE FROM temas WHERE id = $1', [manifest.tema.id]);
  await query('DELETE FROM oposiciones WHERE id = $1', [manifest.oposicion.id]);
  await query('DELETE FROM usuarios WHERE id = $1', [manifest.alumno.id]);
}

async function bumpSequence(client, tableName) {
  const { rows } = await client.query('SELECT pg_get_serial_sequence($1, $2) AS seq_name', [`public.${tableName}`, 'id']);
  const seqName = rows[0]?.seq_name;
  if (!seqName) return;
  await client.query(`SELECT setval($1::regclass, GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.${tableName}), 1000), true)`, [seqName]);
}

async function bumpE2ESequences(client) {
  const tables = [
    'usuarios',
    'oposiciones',
    'temas',
    'bloques',
    'preguntas',
    'opciones_respuesta',
    'accesos_oposicion',
    'tests',
    'tests_preguntas',
    'respuestas_usuario',
    'resultados_test',
    'progreso_usuario',
  ];
  for (const table of tables) {
    await bumpSequence(client, table);
  }
}

async function setup() {
  await cleanupFromMarkers();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await bumpE2ESequences(client);

    const { rows: userRows } = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, role)
       VALUES ($1, $2, $3, 'alumno')
       RETURNING id`,
      [marker.alumnoNombre, ALUMNO_EMAIL, passwordHash],
    );
    const alumnoId = Number(userRows[0].id);

    const { rows: oposicionRows } = await client.query(
      `INSERT INTO oposiciones (nombre, descripcion, categoria, estado, slug, precio_mensual_cents)
       VALUES ($1, 'Fixture E2E BL-006A', 'e2e', 'activa', $2, 990)
       RETURNING id`,
      [marker.oposicionNombre, marker.oposicionSlug],
    );
    const oposicionId = Number(oposicionRows[0].id);

    const { rows: temaRows } = await client.query(
      `INSERT INTO temas (oposicion_id, nombre)
       VALUES ($1, $2)
       RETURNING id`,
      [oposicionId, marker.temaNombre],
    );
    const temaId = Number(temaRows[0].id);

    const { rows: bloqueRows } = await client.query(
      `INSERT INTO bloques (tema_id, nombre)
       VALUES ($1, $2)
       RETURNING id`,
      [temaId, marker.bloqueNombre],
    );
    const bloqueId = Number(bloqueRows[0].id);

    const preguntas = [];
    for (let index = 1; index <= 8; index += 1) {
      const { rows: preguntaRows } = await client.query(
        `INSERT INTO preguntas (tema_id, bloque_id, enunciado, explicacion, nivel_dificultad, estado)
         VALUES ($1, $2, $3, $4, 'media', 'aprobada')
         RETURNING id`,
        [temaId, bloqueId, `${marker.preguntaPrefix} ${index}`, `${marker.explicacionPrefix} ${index}`],
      );
      const preguntaId = Number(preguntaRows[0].id);
      const correctIndex = ((index - 1) % 4) + 1;
      const opciones = [];
      for (let optionIndex = 1; optionIndex <= 4; optionIndex += 1) {
        const { rows: optionRows } = await client.query(
          `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [preguntaId, `E2E Opcion ${RUN_ID} P${index} O${optionIndex}`, optionIndex === correctIndex],
        );
        opciones.push({
          id: Number(optionRows[0].id),
          texto: `E2E Opcion ${RUN_ID} P${index} O${optionIndex}`,
          correcta: optionIndex === correctIndex,
        });
      }
      preguntas.push({
        id: preguntaId,
        enunciado: `${marker.preguntaPrefix} ${index}`,
        explicacion: `${marker.explicacionPrefix} ${index}`,
        opciones,
      });
    }

    const { rows: accesoRows } = await client.query(
      `INSERT INTO accesos_oposicion (usuario_id, oposicion_id, estado, tipo_alumno, modo_preparacion, notas)
       VALUES ($1, $2, 'activo', 'libre', 'experto', 'Fixture E2E BL-006A')
       RETURNING id`,
      [alumnoId, oposicionId],
    );
    const accesoId = Number(accesoRows[0].id);

    await client.query('COMMIT');

    const manifest = {
      runId: RUN_ID,
      manifestPath: MANIFEST_PATH,
      database: redactUrl(E2E_DATABASE_URL),
      alumno: { id: alumnoId, nombre: marker.alumnoNombre, email: ALUMNO_EMAIL },
      oposicion: { id: oposicionId, nombre: marker.oposicionNombre, slug: marker.oposicionSlug },
      tema: { id: temaId, nombre: marker.temaNombre },
      bloque: { id: bloqueId, nombre: marker.bloqueNombre },
      acceso: { id: accesoId, modoPreparacion: 'experto' },
      preguntas,
      createdByBrowser: { testId: null, resultadoId: null },
      createdAt: new Date().toISOString(),
    };
    saveManifest(manifest);
    writeOutputs(manifest);
    console.log(JSON.stringify({
      runId: RUN_ID,
      alumnoId,
      alumnoEmail: ALUMNO_EMAIL,
      oposicionId,
      temaId,
      bloqueId,
      preguntaIds: preguntas.map((item) => item.id),
      manifestPath: MANIFEST_PATH,
    }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function findRunTestIds(manifest) {
  const { rows } = await query(
    `SELECT id
     FROM tests
     WHERE usuario_id = $1
       AND (oposicion_id = $2 OR tema_id = $3)`,
    [manifest.alumno.id, manifest.oposicion.id, manifest.tema.id],
  );
  return rows.map((row) => Number(row.id));
}

async function assertInitial() {
  const manifest = loadManifest();
  const testIds = await findRunTestIds(manifest);
  assert.equal(testIds.length, 0, 'El navegador debe crear el test; fixture inicial no debe dejar tests');

  const { rows: baseRows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM usuarios WHERE id = $1 AND email = $2 AND role = 'alumno') AS usuarios,
       (SELECT COUNT(*)::int FROM oposiciones WHERE id = $3 AND slug = $4 AND estado = 'activa') AS oposiciones,
       (SELECT COUNT(*)::int FROM temas WHERE id = $5 AND oposicion_id = $3) AS temas,
       (SELECT COUNT(*)::int FROM bloques WHERE id = $6 AND tema_id = $5) AS bloques,
       (SELECT COUNT(*)::int FROM accesos_oposicion WHERE id = $7 AND usuario_id = $1 AND oposicion_id = $3 AND estado = 'activo' AND modo_preparacion = 'experto') AS accesos,
       (SELECT COUNT(*)::int FROM preguntas WHERE id = ANY($8::bigint[]) AND tema_id = $5 AND bloque_id = $6 AND estado = 'aprobada') AS preguntas,
       (SELECT COUNT(*)::int FROM opciones_respuesta WHERE pregunta_id = ANY($8::bigint[])) AS opciones,
       (SELECT COUNT(*)::int FROM suscripciones WHERE usuario_id = $1) AS suscripciones`,
    [
      manifest.alumno.id,
      manifest.alumno.email,
      manifest.oposicion.id,
      manifest.oposicion.slug,
      manifest.tema.id,
      manifest.bloque.id,
      manifest.acceso.id,
      manifest.preguntas.map((item) => item.id),
    ],
  );
  const counts = baseRows[0];
  assert.equal(counts.usuarios, 1, 'Debe existir exactamente un alumno fixture');
  assert.equal(counts.oposiciones, 1, 'Debe existir exactamente una oposicion fixture');
  assert.equal(counts.temas, 1, 'Debe existir exactamente un tema fixture');
  assert.equal(counts.bloques, 1, 'Debe existir exactamente un bloque fixture');
  assert.equal(counts.accesos, 1, 'Debe existir exactamente un acceso activo experto');
  assert.equal(counts.preguntas, 8, 'La fixture debe crear 8 preguntas aprobadas');
  assert.equal(counts.opciones, 32, 'La fixture debe crear 4 opciones por pregunta');
  assert.equal(counts.suscripciones, 0, 'BL-006A no necesita suscripcion fixture');

  for (const id of [
    manifest.alumno.id,
    manifest.oposicion.id,
    manifest.tema.id,
    manifest.bloque.id,
    manifest.acceso.id,
    ...manifest.preguntas.flatMap((pregunta) => [pregunta.id, ...pregunta.opciones.map((opcion) => opcion.id)]),
  ]) {
    assert.ok(Number(id) > 1, 'La fixture no debe depender de IDs 1');
  }
}

async function assertResult() {
  const manifest = loadManifest();
  const testIds = await findRunTestIds(manifest);
  assert.equal(testIds.length, 1, 'El navegador debe haber creado exactamente un test');
  const testId = testIds[0];

  const { rows: testRows } = await query(
    `SELECT id, usuario_id, tema_id, oposicion_id, tipo_test, numero_preguntas, estado, fecha_fin, modo_preparacion
     FROM tests
     WHERE id = $1`,
    [testId],
  );
  assert.equal(testRows.length, 1, 'Debe existir el test generado por navegador');
  assert.equal(Number(testRows[0].usuario_id), manifest.alumno.id);
  assert.equal(Number(testRows[0].tema_id), manifest.tema.id);
  assert.equal(Number(testRows[0].oposicion_id), manifest.oposicion.id);
  assert.equal(testRows[0].tipo_test, 'normal');
  assert.equal(Number(testRows[0].numero_preguntas), 5);
  assert.equal(testRows[0].estado, 'finalizado');
  assert.ok(testRows[0].fecha_fin, 'El test debe tener fecha_fin');
  assert.equal(testRows[0].modo_preparacion, 'experto');

  const preguntaIds = manifest.preguntas.map((item) => item.id);
  const { rows: tpRows } = await query(
    'SELECT pregunta_id FROM tests_preguntas WHERE test_id = $1 ORDER BY orden',
    [testId],
  );
  assert.equal(tpRows.length, 5, 'El test debe contener 5 preguntas');
  for (const row of tpRows) {
    assert.ok(preguntaIds.includes(Number(row.pregunta_id)), 'El test solo debe usar preguntas de la fixture');
  }

  const { rows: respuestaRows } = await query(
    `SELECT ru.id, ru.pregunta_id, ru.respuesta_id, ru.correcta
     FROM respuestas_usuario ru
     WHERE ru.test_id = $1
     ORDER BY ru.id`,
    [testId],
  );
  assert.equal(respuestaRows.length, 5, 'Debe haber 5 respuestas de usuario');
  assert.equal(respuestaRows.filter((row) => row.correcta === true).length, 3, 'Debe haber 3 aciertos');
  assert.equal(respuestaRows.filter((row) => row.correcta === false).length, 2, 'Debe haber 2 errores');
  assert.equal(respuestaRows.filter((row) => row.respuesta_id === null).length, 0, 'No debe haber respuestas en blanco');

  const { rows: resultRows } = await query(
    'SELECT id, aciertos, errores, blancos, nota, tiempo_segundos FROM resultados_test WHERE test_id = $1',
    [testId],
  );
  assert.equal(resultRows.length, 1, 'Debe existir un resultado para el test');
  assert.equal(Number(resultRows[0].aciertos), 3);
  assert.equal(Number(resultRows[0].errores), 2);
  assert.equal(Number(resultRows[0].blancos), 0);
  assert.ok(Number(resultRows[0].nota) >= 0 && Number(resultRows[0].nota) <= 10, 'La nota debe estar en rango 0-10');

  const { rows: progressRows } = await query(
    `SELECT id, preguntas_vistas, aciertos, errores
     FROM progreso_usuario
     WHERE usuario_id = $1 AND tema_id = $2`,
    [manifest.alumno.id, manifest.tema.id],
  );
  assert.equal(progressRows.length, 1, 'Debe existir progreso del alumno para el tema fixture');
  assert.equal(Number(progressRows[0].preguntas_vistas), 5);
  assert.equal(Number(progressRows[0].aciertos), 3);
  assert.equal(Number(progressRows[0].errores), 2);

  if (await tableExists('stripe_webhook_events')) {
    const { rows: stripeRows } = await query('SELECT COUNT(*)::int AS total FROM stripe_webhook_events');
    assert.equal(stripeRows[0].total, 0, 'BL-006A no debe crear eventos Stripe');
  }

  manifest.createdByBrowser = {
    testId,
    resultadoId: Number(resultRows[0].id),
    respuestaIds: respuestaRows.map((row) => Number(row.id)),
    progressId: Number(progressRows[0].id),
    verifiedAt: new Date().toISOString(),
  };
  saveManifest(manifest);
}

async function cleanup() {
  if (existsSync(MANIFEST_PATH)) {
    await cleanupFromManifest(loadManifest());
  } else {
    await cleanupFromMarkers();
  }
}

async function assertNoResidues() {
  const manifest = loadManifest();
  await cleanupFromManifest(manifest);

  const { rows } = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM usuarios WHERE id = $1 OR email = $2) AS usuarios,
       (SELECT COUNT(*)::int FROM oposiciones WHERE id = $3 OR slug = $4 OR nombre = $5) AS oposiciones,
       (SELECT COUNT(*)::int FROM temas WHERE id = $6 OR nombre = $7) AS temas,
       (SELECT COUNT(*)::int FROM bloques WHERE id = $8 OR nombre = $9) AS bloques,
       (SELECT COUNT(*)::int FROM preguntas WHERE id = ANY($10::bigint[]) OR enunciado LIKE $11) AS preguntas,
       (SELECT COUNT(*)::int FROM opciones_respuesta WHERE pregunta_id = ANY($10::bigint[])) AS opciones,
       (SELECT COUNT(*)::int FROM tests WHERE usuario_id = $1 OR oposicion_id = $3 OR tema_id = $6) AS tests,
       (SELECT COUNT(*)::int FROM accesos_oposicion WHERE usuario_id = $1 OR oposicion_id = $3) AS accesos,
       (SELECT COUNT(*)::int FROM progreso_usuario WHERE usuario_id = $1) AS progreso`,
    [
      manifest.alumno.id,
      manifest.alumno.email,
      manifest.oposicion.id,
      manifest.oposicion.slug,
      manifest.oposicion.nombre,
      manifest.tema.id,
      manifest.tema.nombre,
      manifest.bloque.id,
      manifest.bloque.nombre,
      manifest.preguntas.map((item) => item.id),
      `${marker.preguntaPrefix}%`,
    ],
  );
  for (const [name, total] of Object.entries(rows[0])) {
    assert.equal(Number(total), 0, `Quedan residuos E2E en ${name}`);
  }
  unlinkSync(MANIFEST_PATH);
}

async function main() {
  assertSafeEnvironment();
  if (ACTION === 'setup') return setup();
  if (ACTION === 'assert-initial') return assertInitial();
  if (ACTION === 'assert-result') return assertResult();
  if (ACTION === 'cleanup') return cleanup();
  if (ACTION === 'assert-no-residues') return assertNoResidues();
  throw new Error(`Accion no soportada: ${ACTION}`);
}

main()
  .finally(() => pool.end())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
