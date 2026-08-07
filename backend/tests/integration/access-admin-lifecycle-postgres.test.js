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
const enabled = configuredUrl && databaseUrl && configuredUrl === databaseUrl
  && process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM === 'ISOLATED'
  && process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED === 'true';
if (hasAnyConfiguration && !enabled) throw new Error('Suite PostgreSQL de ciclo administrativo no aislada');
if (!process.env.CI && !hasAnyConfiguration) console.warn('[skip] Suite PostgreSQL de ciclo administrativo: no hay configuración aislada');
const options = { concurrency: false, skip: !enabled };
const marker = `admin_lifecycle_${crypto.randomUUID().replaceAll('-', '_')}`;

function savepointClient(client) {
  let counter = 0;
  let active = false;
  return {
    async query(sql, params) {
      const normalized = String(sql).trim().toUpperCase();
      if (normalized === 'BEGIN') {
        counter += 1;
        await client.query(`SAVEPOINT admin_lifecycle_${counter}`);
        active = true;
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'COMMIT') {
        await client.query(`RELEASE SAVEPOINT admin_lifecycle_${counter}`);
        active = false;
        return { rows: [], rowCount: 0 };
      }
      if (normalized === 'ROLLBACK') {
        if (active) await client.query(`ROLLBACK TO SAVEPOINT admin_lifecycle_${counter}`);
        active = false;
        return { rows: [], rowCount: 0 };
      }
      return client.query(sql, params);
    },
    release() {},
  };
}

async function withTransaction(callback, { historialRepository = accesoOposicionHistorialRepository } = {}) {
  if (!enabled) return;
  const client = await pool.connect();
  await client.query('BEGIN');
  const db = { query: (sql, params) => client.query(sql, params), async connect() { return savepointClient(client); } };
  const service = createAccessAdminService({
    db,
    modelosRepository: accesoOposicionModelosRepository,
    historialRepository,
    clock: () => new Date('2026-06-01T00:00:00.000Z'),
  });
  try {
    await callback({ client, service });
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

async function fixture(client, suffix, { estado = 'activo', modelos = ['experto'], fechaFin = '2027-01-01' } = {}) {
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
  const mode = modelos.length === 1 ? modelos[0] : null;
  const legacy = mode === 'guiado' ? 'albacer' : 'experto';
  const access = await client.query(
    `INSERT INTO accesos_oposicion
       (usuario_id, oposicion_id, estado, fecha_inicio, fecha_fin, precio_pagado, notas,
        tipo_alumno, modo_preparacion, modo_activo)
     VALUES ($1, $2, $3, '2026-01-01', $4, 25.50, 'preservar', 'libre', $5, $6)
     RETURNING id`,
    [user.rows[0].id, opposition.rows[0].id, estado, fechaFin, legacy, mode],
  );
  for (const modelo of modelos) {
    await client.query('INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)', [access.rows[0].id, modelo]);
  }
  return {
    usuarioId: user.rows[0].id,
    adminId: admin.rows[0].id,
    oposicionId: opposition.rows[0].id,
    accesoId: access.rows[0].id,
    principal: { tipo: 'administrador', usuarioId: admin.rows[0].id },
  };
}

test('renueva un acceso expirado y registra un único evento renovado', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'renew-expired', { estado: 'expirado', fechaFin: '2025-01-01' });
  const result = await service.renovarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, fechaInicio: '2026-01-01', fechaFin: '2027-01-01', motivo: 'renovación' });
  assert.equal(result.estado, 'activo');
  const events = (await client.query('SELECT tipo_evento FROM accesos_oposicion_historial WHERE acceso_id = $1', [target.accesoId])).rows;
  assert.deepEqual(events.map((row) => row.tipo_evento), ['renovado']);
}));

test('renovación idéntica de activo vigente no actualiza ni registra evento', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'renew-idempotent');
  const before = (await client.query('SELECT actualizada_en FROM accesos_oposicion WHERE id = $1', [target.accesoId])).rows[0].actualizada_en;
  const result = await service.renovarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'repetición' });
  const after = (await client.query('SELECT actualizada_en FROM accesos_oposicion WHERE id = $1', [target.accesoId])).rows[0].actualizada_en;
  assert.equal(result.estado, 'activo');
  assert.equal(after.toISOString(), before.toISOString());
  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM accesos_oposicion_historial WHERE acceso_id = $1', [target.accesoId])).rows[0].count, 0);
}));

test('revoca y repite de forma idempotente conservando modelos y campos comerciales', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'revoke');
  await service.revocarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'revocación' });
  await service.revocarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'repetición' });
  const row = (await client.query('SELECT estado, precio_pagado, notas FROM accesos_oposicion WHERE id = $1', [target.accesoId])).rows[0];
  assert.equal(row.estado, 'revocado');
  assert.equal(Number(row.precio_pagado), 25.5);
  assert.equal(row.notas, 'preservar');
  assert.equal((await client.query("SELECT COUNT(*)::int AS count FROM accesos_oposicion_historial WHERE acceso_id = $1 AND tipo_evento = 'revocado'", [target.accesoId])).rows[0].count, 1);
}));

test('cancela un acceso pendiente y rechaza la transición revocado a cancelado', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'cancel', { estado: 'pendiente_modo', modelos: ['experto', 'guiado'] });
  await service.cancelarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'cancelación' });
  assert.equal((await client.query('SELECT estado FROM accesos_oposicion WHERE id = $1', [target.accesoId])).rows[0].estado, 'cancelado');
  const revoked = await fixture(client, 'cancel-revoked');
  await service.revocarAcceso({ ...revoked, actorUsuarioId: revoked.adminId, principal: revoked.principal, motivo: 'revocación' });
  await assert.rejects(() => service.cancelarAcceso({ ...revoked, actorUsuarioId: revoked.adminId, principal: revoked.principal, motivo: 'cancelación posterior' }), (error) => error.code === 'ACCESS_ADMIN_STATE');
}));

test('reactiva revocado y conserva el modo incluido', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'reactivate-revoked', { modelos: ['guiado'] });
  await service.revocarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'revocación' });
  const result = await service.reactivarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'reactivación' });
  assert.equal(result.estado, 'activo');
  assert.equal(result.modo_activo, 'guiado');
  const events = (await client.query('SELECT tipo_evento FROM accesos_oposicion_historial WHERE acceso_id = $1 ORDER BY id', [target.accesoId])).rows;
  assert.deepEqual(events.map((row) => row.tipo_evento), ['revocado', 'reactivado']);
}));

test('reactiva cancelado con nuevos modelos y un único evento principal', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'reactivate-cancelled');
  await service.cancelarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'cancelación' });
  const result = await service.reactivarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, modelos: ['guiado'], modoActivo: 'guiado', fechaInicio: '2026-01-01', fechaFin: null, motivo: 'recuperación' });
  assert.equal(result.estado, 'activo');
  assert.deepEqual(result.modelos_disponibles, ['guiado']);
  const events = (await client.query('SELECT tipo_evento FROM accesos_oposicion_historial WHERE acceso_id = $1 ORDER BY id', [target.accesoId])).rows;
  assert.deepEqual(events.map((row) => row.tipo_evento), ['cancelado', 'reactivado']);
}));

test('reactivación con vigencia vencida exige fechas nuevas', options, async () => withTransaction(async ({ client, service }) => {
  const target = await fixture(client, 'reactivate-expired', { estado: 'cancelado', fechaFin: '2025-01-01' });
  await assert.rejects(() => service.reactivarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'sin fechas' }), (error) => error.code === 'ACCESS_ADMIN_INVALID_VALIDITY');
  await assert.rejects(() => service.reactivarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, fechaInicio: '2027-01-01', fechaFin: null, motivo: 'inicio futuro' }), (error) => error.code === 'ACCESS_ADMIN_INVALID_VALIDITY');
}));

test('revocación revierte completamente si falla historial', options, async () => {
  const historialRepository = { async insertarEvento() { throw new Error('fallo de historial simulado'); } };
  await withTransaction(async ({ client, service }) => {
    const target = await fixture(client, 'rollback');
    await assert.rejects(() => service.revocarAcceso({ ...target, actorUsuarioId: target.adminId, principal: target.principal, motivo: 'fallo' }), /fallo de historial simulado/);
    assert.equal((await client.query('SELECT estado FROM accesos_oposicion WHERE id = $1', [target.accesoId])).rows[0].estado, 'activo');
  }, { historialRepository });
});

after(async () => { await pool.end(); });
