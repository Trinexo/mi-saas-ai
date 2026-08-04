import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { after, before } from 'node:test';
import pool from '../../src/config/db.js';
import { createAccessContextService } from '../../src/services/accessContext.service.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function validarBaseAislada({ databaseUrl, configuredDatabaseUrl, confirmation, isolated } = {}) {
  if (!databaseUrl || !configuredDatabaseUrl || databaseUrl !== configuredDatabaseUrl) {
    return { ok: false, reason: 'URL ausente o distinta' };
  }
  if (confirmation !== 'ISOLATED' || isolated !== 'true') {
    return { ok: false, reason: 'confirmación incorrecta' };
  }
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return { ok: false, reason: 'URL inválida' };
  }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol.toLowerCase())) {
    return { ok: false, reason: 'protocolo no permitido' };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!LOCAL_HOSTS.has(hostname)) return { ok: false, reason: 'host no local' };
  let databaseName;
  try {
    databaseName = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  } catch {
    return { ok: false, reason: 'nombre de base no aislado' };
  }
  if (!databaseName || !/(test|ci|e2e)/i.test(databaseName)) {
    return { ok: false, reason: 'nombre de base no aislado' };
  }
  return { ok: true, reason: null };
}

const databaseUrl = process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL;
const guard = validarBaseAislada({
  databaseUrl: process.env.DATABASE_URL,
  configuredDatabaseUrl: databaseUrl,
  confirmation: process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM,
  isolated: process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED,
});
const isCi = /^(true|1|yes)$/i.test(process.env.CI ?? '');
const configValues = [
  process.env.DATABASE_URL,
  process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL,
  process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM,
  process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED,
];
const hasAnyConfiguration = configValues.some((value) => typeof value === 'string' && value.length > 0);
if ((isCi || hasAnyConfiguration) && !guard.ok) {
  throw new Error(`Suite PostgreSQL de Access Context no aislada: ${guard.reason}`);
}
if (!isCi && !hasAnyConfiguration) {
  console.warn('[skip] Suite PostgreSQL de Access Context: no hay configuración aislada');
}
const options = { skip: !guard.ok, concurrency: false };
const marker = `access_context_${crypto.randomUUID()}`;
const TEST_NOW = new Date('2026-08-04T12:00:00.000Z');
const MAX_BIGINT = 9223372036854775807n;

async function createFixture(client, suffix, {
  crearAcceso = true,
  estado = 'activo',
  modoActivo = 'experto',
  modoPreparacion = modoActivo === 'guiado' ? 'albacer' : 'experto',
  modelos = ['experto'],
  fechaInicio = '2020-01-01 00:00:00',
  fechaFin = '2099-01-01 00:00:00',
} = {}) {
  const user = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', 'alumno') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}@test.local`],
  );
  const opposition = await client.query(
    `INSERT INTO oposiciones (nombre, slug, estado)
     VALUES ($1, $2, 'activa') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}`],
  );
  if (!crearAcceso) {
    return { usuarioId: user.rows[0].id, oposicionId: opposition.rows[0].id };
  }
  const access = await client.query(
    `INSERT INTO accesos_oposicion
       (usuario_id, oposicion_id, estado, fecha_inicio, modo_preparacion, modo_activo, fecha_fin)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [user.rows[0].id, opposition.rows[0].id, estado, fechaInicio, modoPreparacion, modoActivo, fechaFin],
  );
  for (const modelo of modelos) {
    await client.query(
      'INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)',
      [access.rows[0].id, modelo],
    );
  }
  return { usuarioId: user.rows[0].id, oposicionId: opposition.rows[0].id };
}

async function withTransaction(suffix, callback, fixtureOptions = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fixture = await createFixture(client, suffix, fixtureOptions);
    const service = createAccessContextService({ db: client, clock: () => TEST_NOW });
    return await callback({ client, fixture, service });
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

async function idInexistente(client, table) {
  if (!['usuarios', 'oposiciones'].includes(table)) throw new Error('Tabla no permitida en fixture');
  for (let candidate = MAX_BIGINT; candidate > 0n; candidate -= 1n) {
    const result = await client.query(`SELECT 1 FROM ${table} WHERE id = $1`, [candidate.toString()]);
    if (result.rowCount === 0) return candidate.toString();
  }
  throw new Error(`No se encontró un ID inexistente para ${table}`);
}

before(options, async () => {
  // pool usa la misma DATABASE_URL validada por la guarda anterior.
  await pool.query('SELECT 1');
});

after(options, async () => {
  await pool.end();
});

test('resuelve acceso experto sin escribir datos', options, async () => withTransaction('experto', async ({ client, fixture, service }) => {
  const beforeRow = await client.query(
    `SELECT estado, modo_activo, fecha_inicio, fecha_fin, precio_pagado, notas
       FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2`,
    [fixture.usuarioId, fixture.oposicionId],
  );
  const principal = { tipo: 'alumno', usuarioId: fixture.usuarioId };
  const result = await service.obtenerContextoUsuario({ ...fixture, principal });
  assert.equal(result.estado_efectivo, 'activo');
  assert.deepEqual(result.modelos_disponibles, ['experto']);
  assert.equal(result.permisos.puede_acceder_contenido, true, JSON.stringify({
    estadoPersistido: beforeRow.rows[0]?.estado,
    fechaInicio: beforeRow.rows[0]?.fecha_inicio,
    fechaFin: beforeRow.rows[0]?.fecha_fin,
    instanteReloj: TEST_NOW.toISOString(),
    modelos: result.modelos_disponibles,
    modoActivo: result.modo_activo,
    modoPreparacion: result.legacy.modo_preparacion,
    principal,
    campoFalso: 'permisos.puede_acceder_contenido',
  }));
  const afterRow = await client.query(
    `SELECT estado, modo_activo, fecha_inicio, fecha_fin, precio_pagado, notas
       FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2`,
    [fixture.usuarioId, fixture.oposicionId],
  );
  assert.deepEqual(afterRow.rows, beforeRow.rows);
  assert.equal((await client.query('SELECT COUNT(*) FROM accesos_oposicion_historial')).rows[0].count, '0');
}));

test('resuelve guiado, dos modelos y pendiente_modo sin conceder contenido', options, async () => withTransaction(
  'guiado-pending',
  async ({ service, fixture: guiado }) => {
    const guiadoResult = await service.obtenerContextoUsuario(guiado);
    assert.deepEqual(guiadoResult.modelos_disponibles, ['guiado']);
    assert.equal(guiadoResult.legacy.modo_preparacion_normalizado, 'guiado');
  },
  { modoActivo: 'guiado', modelos: ['guiado'] },
).then(async () => withTransaction(
  'pending',
  async ({ service, fixture }) => {
    const result = await service.obtenerContextoUsuario(fixture);
    assert.equal(result.estado_efectivo, 'pendiente_modo');
    assert.equal(result.permisos.puede_acceder_contenido, false);
  },
  { estado: 'pendiente_modo', modoActivo: null, modoPreparacion: 'experto', modelos: ['experto', 'guiado'] },
)));

test('respeta el vencimiento y no mezcla usuarios ni oposiciones', options, async () => withTransaction(
  'expired-isolation',
  async ({ client, service, fixture: expired }) => {
    const result = await service.obtenerContextoUsuario(expired);
    assert.equal(result.estado_efectivo, 'expirado');
    assert.equal(result.permisos.puede_acceder_contenido, false);
    const other = await createFixture(client, 'other');
    const absent = await service.obtenerContextoUsuario({
      usuarioId: expired.usuarioId,
      oposicionId: other.oposicionId,
    });
    assert.equal(absent.estado_efectivo, 'sin_acceso');
  },
  { fechaFin: '2020-01-01 00:00:00' },
));

test('sin acceso devuelve DTO negativo con usuario y oposición existentes', options, async () => withTransaction(
  'missing-access',
  async ({ client, service, fixture }) => {
    const existing = await client.query(
      `SELECT
         EXISTS (SELECT 1 FROM usuarios WHERE id = $1) AS usuario_existe,
         EXISTS (SELECT 1 FROM oposiciones WHERE id = $2) AS oposicion_existe,
         (SELECT COUNT(*) FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2) AS accesos
       `,
      [fixture.usuarioId, fixture.oposicionId],
    );
    const noAccess = await service.obtenerContextoUsuario({
      usuarioId: fixture.usuarioId,
      oposicionId: fixture.oposicionId,
    });
    const diagnostic = JSON.stringify({
      usuarioId: fixture.usuarioId,
      oposicionId: fixture.oposicionId,
      usuarioExiste: existing.rows[0].usuario_existe,
      oposicionExiste: existing.rows[0].oposicion_existe,
      accesos: existing.rows[0].accesos,
      crearAcceso: false,
    });
    assert.equal(noAccess.tiene_acceso, false, diagnostic);
    assert.equal(noAccess.acceso_id, null, diagnostic);
    assert.equal(noAccess.estado, null, diagnostic);
    assert.equal(noAccess.estado_efectivo, 'sin_acceso', diagnostic);
  },
  { crearAcceso: false },
));

test('usuario inexistente produce ACCESS_CONTEXT_USER_NOT_FOUND', options, async () => withTransaction(
  'missing-user',
  async ({ client, service, fixture }) => {
    const usuarioId = await idInexistente(client, 'usuarios');
    const existing = await client.query(
      'SELECT id, nombre FROM oposiciones WHERE id = $1',
      [fixture.oposicionId],
    );
    const diagnostic = JSON.stringify({
      usuarioId,
      oposicionId: fixture.oposicionId,
      usuarioExiste: false,
      oposicionExiste: existing.rowCount === 1,
      crearAcceso: false,
    });
    await assert.rejects(
      () => service.obtenerContextoUsuario({ usuarioId, oposicionId: fixture.oposicionId }),
      (error) => {
        assert.equal(error.code, 'ACCESS_CONTEXT_USER_NOT_FOUND', diagnostic);
        return true;
      },
    );
  },
  { crearAcceso: false },
));

test('oposición inexistente produce ACCESS_CONTEXT_OPPOSITION_NOT_FOUND', options, async () => withTransaction(
  'missing-opposition',
  async ({ client, service, fixture }) => {
    const oposicionId = await idInexistente(client, 'oposiciones');
    const existing = await client.query(
      'SELECT id, nombre FROM usuarios WHERE id = $1',
      [fixture.usuarioId],
    );
    const diagnostic = JSON.stringify({
      usuarioId: fixture.usuarioId,
      oposicionId,
      usuarioExiste: existing.rowCount === 1,
      oposicionExiste: false,
      crearAcceso: false,
    });
    await assert.rejects(
      () => service.obtenerContextoUsuario({
        usuarioId: fixture.usuarioId,
        oposicionId,
        principal: { tipo: 'administrador' },
      }),
      (error) => {
        assert.equal(error.code, 'ACCESS_CONTEXT_OPPOSITION_NOT_FOUND', diagnostic);
        return true;
      },
    );
  },
  { crearAcceso: false },
));
