import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { after } from 'node:test';
import pool from '../../src/config/db.js';
import { createAccessAdminService } from '../../src/services/accessAdmin.service.js';
import { accesoOposicionModelosRepository } from '../../src/repositories/accesoOposicionModelos.repository.js';
import { accesoOposicionHistorialRepository } from '../../src/repositories/accesoOposicionHistorial.repository.js';

const configuredUrl = process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL;
const hasAnyConfiguration = Boolean(configuredUrl || databaseUrl);
const isCi = process.env.CI === 'true' || process.env.CI === '1';
const enabled = configuredUrl && databaseUrl && configuredUrl === databaseUrl
  && process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM === 'ISOLATED'
  && process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED === 'true';

if (hasAnyConfiguration && !enabled) throw new Error('Suite PostgreSQL administrativa no aislada');
if (!isCi && !hasAnyConfiguration) console.warn('[skip] Suite PostgreSQL administrativa: no hay configuración aislada');

const options = { concurrency: false, skip: !enabled };
const marker = `admin_access_${crypto.randomUUID().replaceAll('-', '_')}`;

function savepointClient(client) {
  let counter = 0;
  let active = false;
  return {
    async query(sql, params) {
      const normalized = String(sql).trim().toUpperCase();
      if (normalized === 'BEGIN') {
        counter += 1;
        await client.query(`SAVEPOINT admin_access_${counter}`);
        active = true;
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'COMMIT') {
        await client.query(`RELEASE SAVEPOINT admin_access_${counter}`);
        active = false;
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'ROLLBACK') {
        if (active) await client.query(`ROLLBACK TO SAVEPOINT admin_access_${counter}`);
        active = false;
        return { rows: [], rowCount: 0 };
      }
      return client.query(sql, params);
    },
    release() {},
  };
}

async function withTransaction(name, callback, { modelosRepository = accesoOposicionModelosRepository, historialRepository = accesoOposicionHistorialRepository } = {}) {
  if (!enabled) return;
  const client = await pool.connect();
  await client.query('BEGIN');
  const db = {
    query: (sql, params) => client.query(sql, params),
    async connect() { return savepointClient(client); },
  };
  const service = createAccessAdminService({ db, modelosRepository, historialRepository });
  try {
    await callback({ client, service });
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

async function fixture(client, suffix) {
  const user = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', 'alumno') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}@test.local`],
  );
  const admin = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', 'admin') RETURNING id`,
    [`${marker}_${suffix}_admin`, `${marker}_${suffix}_admin@test.local`],
  );
  const opposition = await client.query(
    `INSERT INTO oposiciones (nombre, slug, estado)
     VALUES ($1, $2, 'activa') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}`],
  );
  const usuarioId = user.rows[0].id;
  const adminId = admin.rows[0].id;
  assert.notEqual(adminId, usuarioId);
  assert.equal((await client.query('SELECT role FROM usuarios WHERE id = $1', [adminId])).rows[0].role, 'admin');
  return { usuarioId, adminId, oposicionId: opposition.rows[0].id };
}

async function access(client, id) {
  return (await client.query(
    `SELECT estado, modo_activo, modo_preparacion, fecha_inicio::TEXT AS fecha_inicio,
            fecha_fin::TEXT AS fecha_fin, precio_pagado, notas
       FROM accesos_oposicion WHERE id = $1`, [id],
  )).rows[0];
}

test('admin crea acceso experto de forma transaccional', options, async () => withTransaction('create', async ({ client, service }) => {
  const target = await fixture(client, 'create');
  const result = await service.crearAcceso({
    ...target, modelos: ['experto'], vigencia: { fechaInicio: '2026-01-01T00:00:00Z', fechaFin: null },
    actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta administrativa',
  });
  assert.equal(result.estado_efectivo, 'activo');
  assert.deepEqual((await client.query('SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1', [result.acceso_id])).rows.map((row) => row.modelo), ['experto']);
  assert.equal((await client.query("SELECT tipo_evento FROM accesos_oposicion_historial WHERE acceso_id = $1", [result.acceso_id])).rows[0].tipo_evento, 'creado');
  assert.equal((await client.query("SELECT actor_usuario_id FROM accesos_oposicion_historial WHERE acceso_id = $1", [result.acceso_id])).rows[0].actor_usuario_id, target.adminId);
}));

test('admin crea pendiente_modo con ambos modelos y legacy NOT NULL', options, async () => withTransaction('pending', async ({ client, service }) => {
  const target = await fixture(client, 'pending');
  const result = await service.crearAcceso({
    ...target, modelos: ['experto', 'guiado'], vigencia: { fechaInicio: '2026-01-01T00:00:00Z', fechaFin: null },
    actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta multi modelo',
  });
  assert.equal(result.estado, 'pendiente_modo');
  assert.equal((await access(client, result.acceso_id)).modo_preparacion, 'experto');
}));

test('admin modifica modelos sin reactivar un expirado', options, async () => withTransaction('models', async ({ client, service }) => {
  const target = await fixture(client, 'models');
  const created = await service.crearAcceso({ ...target, modelos: ['experto', 'guiado'], modoActivo: 'experto', vigencia: { fechaInicio: '2026-01-01', fechaFin: '2099-01-01' }, precioPagado: 18.5, notas: 'conservar', actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta' });
  const before = await access(client, created.acceso_id);
  await client.query("UPDATE accesos_oposicion SET estado = 'expirado' WHERE id = $1", [created.acceso_id]);
  const result = await service.modificarModelos({ accesoId: created.acceso_id, modelos: ['guiado'], actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'ajuste de modelos' });
  assert.equal(result.estado, 'expirado');
  assert.equal(result.estado_efectivo, 'expirado');
  assert.deepEqual(result.modelos_disponibles, ['guiado']);
  assert.equal(result.modo_activo, 'guiado');
  assert.equal(result.legacy.modo_preparacion, 'albacer');
  assert.notEqual(result.estado, 'activo');
  assert.notEqual(result.estado, 'pendiente_modo');

  const after = await access(client, created.acceso_id);
  assert.equal(after.estado, 'expirado');
  assert.equal(after.modo_activo, 'guiado');
  assert.equal(after.modo_preparacion, 'albacer');
  assert.equal(after.fecha_inicio, before.fecha_inicio);
  assert.equal(after.fecha_fin, before.fecha_fin);
  assert.equal(Number(after.precio_pagado), 18.5);
  assert.equal(after.notas, 'conservar');
  assert.deepEqual((await client.query('SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1', [created.acceso_id])).rows.map((row) => row.modelo), ['guiado']);

  const event = (await client.query(
    `SELECT tipo_evento, actor_usuario_id, motivo, estado_anterior, estado_nuevo,
            modo_activo_anterior, modo_activo_nuevo, modelos_anteriores, modelos_nuevos
       FROM accesos_oposicion_historial
      WHERE acceso_id = $1 AND tipo_evento = 'modelos_actualizados'`,
    [created.acceso_id],
  )).rows[0];
  assert.ok(event);
  assert.equal(event.actor_usuario_id, target.adminId);
  assert.equal(event.motivo, 'ajuste de modelos');
  assert.equal(event.estado_anterior, 'expirado');
  assert.equal(event.estado_nuevo, 'expirado');
  assert.equal(event.modo_activo_anterior, 'experto');
  assert.equal(event.modo_activo_nuevo, 'guiado');
  assert.deepEqual(event.modelos_anteriores, ['experto', 'guiado']);
  assert.deepEqual(event.modelos_nuevos, ['guiado']);
}));

test('admin modifica vigencia y conserva campos comerciales y modelos', options, async () => withTransaction('validity', async ({ client, service }) => {
  const target = await fixture(client, 'validity');
  const created = await service.crearAcceso({ ...target, modelos: ['guiado'], vigencia: { fechaInicio: '2026-01-01', fechaFin: '2027-01-01' }, precioPagado: 12.5, notas: 'nota', actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta' });
  await service.modificarVigencia({ accesoId: created.acceso_id, fechaFin: null, actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'vigencia abierta' });
  const row = await access(client, created.acceso_id);
  assert.equal(row.fecha_fin, null);
  assert.equal(Number(row.precio_pagado), 12.5);
  assert.equal(row.notas, 'nota');
  assert.deepEqual((await client.query('SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1', [created.acceso_id])).rows.map((item) => item.modelo), ['guiado']);
}));

test('historial administrativo devuelve eventos canónicos y ordenados', options, async () => withTransaction('history', async ({ client, service }) => {
  const target = await fixture(client, 'history');
  const created = await service.crearAcceso({ ...target, modelos: ['experto'], vigencia: { fechaInicio: '2026-01-01', fechaFin: null }, actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta' });
  const events = await service.listarHistorial({ accesoId: created.acceso_id, principal: { tipo: 'administrador', usuarioId: target.adminId } });
  assert.equal(events.length, 1);
  assert.equal(events[0].tipoEvento, 'acceso_creado');
  assert.equal(events[0].motivo, 'alta');
}));

test('rollback completo si falla historial', options, async () => {
  const historyFailure = { async insertarEvento() { throw new Error('fallo de historial simulado'); } };
  await withTransaction('rollback', async ({ client, service }) => {
    const target = await fixture(client, 'rollback');
    await assert.rejects(() => service.crearAcceso({ ...target, modelos: ['experto'], vigencia: { fechaInicio: '2026-01-01', fechaFin: null }, actorUsuarioId: target.adminId, principal: { tipo: 'administrador', usuarioId: target.adminId }, motivo: 'alta' }), /fallo de historial simulado/);
    assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2', [target.usuarioId, target.oposicionId])).rows[0].count, 0);
  }, { historialRepository: historyFailure });
});

after(async () => { await pool.end(); });
