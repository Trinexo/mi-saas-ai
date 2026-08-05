import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { after, before } from 'node:test';
import pool from '../../src/config/db.js';
import { createAccessModeService } from '../../src/services/accessMode.service.js';
import { accesoOposicionHistorialRepository } from '../../src/repositories/accesoOposicionHistorial.repository.js';

const MAX_BIGINT = '9223372036854775807';
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
const configuredUrl = process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL;
let guard = { ok: false, reason: 'URL ausente o distinta' };
try {
  const parsed = new URL(process.env.DATABASE_URL ?? '');
  const database = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  guard = {
    ok: process.env.DATABASE_URL === configuredUrl
      && process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM === 'ISOLATED'
      && process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED === 'true'
      && ['postgres:', 'postgresql:'].includes(parsed.protocol.toLowerCase())
      && localHosts.has(parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase())
      && /(?:test|ci|e2e)/i.test(database),
    reason: 'configuración PostgreSQL no aislada',
  };
} catch {
  // La suite queda omitida cuando no hay una URL aislada configurada.
}
const options = { skip: !guard.ok, concurrency: false };
const marker = `access_mode_${crypto.randomUUID()}`;
const NOW = new Date('2026-08-05T12:00:00.000Z');

function savepointClient(client) {
  return {
    async query(sql, params) {
      if (sql === 'BEGIN') return client.query('SAVEPOINT access_mode_service');
      if (sql === 'COMMIT') return client.query('RELEASE SAVEPOINT access_mode_service');
      if (sql === 'ROLLBACK') return client.query('ROLLBACK TO SAVEPOINT access_mode_service');
      return client.query(sql, params);
    },
    release() {},
  };
}

async function fixture(client, suffix, fixtureOptions = {}) {
  const {
    estado = 'activo',
    modoActivo = estado === 'pendiente_modo' ? null : 'experto',
    modoPreparacion = estado === 'pendiente_modo'
      ? 'experto'
      : modoActivo === 'guiado' ? 'albacer' : 'experto',
    modelos = ['experto', 'guiado'],
  } = fixtureOptions;
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
  const access = await client.query(
    `INSERT INTO accesos_oposicion
      (usuario_id, oposicion_id, estado, modo_activo, modo_preparacion,
       fecha_inicio, fecha_fin, precio_pagado, notas)
     VALUES ($1, $2, $3, $4, $5, '2026-01-01', $6, 29.95, 'conservar')
     RETURNING id`,
    [user.rows[0].id, opposition.rows[0].id, estado, modoActivo, modoPreparacion,
      estado === 'expirado' ? '2020-01-01' : '2099-01-01'],
  );
  if (estado === 'pendiente_modo') assert.equal(modoPreparacion, 'experto');
  for (const modelo of modelos) {
    await client.query(
      'INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)',
      [access.rows[0].id, modelo],
    );
  }
  return { usuarioId: user.rows[0].id, accesoId: access.rows[0].id, oposicionId: opposition.rows[0].id };
}

async function withTransaction(suffix, callback, fixtureOptions = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const data = await fixture(client, suffix, fixtureOptions);
    const transactionalDb = {
      async connect() {
        return savepointClient(client);
      },
    };
    const service = createAccessModeService({
      db: transactionalDb,
      clock: () => NOW,
    });
    return await callback({ client, service, data });
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

before(options, async () => pool.query('SELECT 1'));
after(options, async () => pool.end());

test('cambia experto a guiado y registra snapshot completo', options, async () => withTransaction('expert-guiado', async ({ client, service, data }) => {
  const result = await service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' });
  assert.equal(result.modo_activo, 'guiado');
  const row = await client.query('SELECT estado, modo_activo, modo_preparacion, precio_pagado, notas FROM accesos_oposicion WHERE id = $1', [data.accesoId]);
  assert.equal(row.rows[0].modo_preparacion, 'albacer');
  assert.equal(row.rows[0].precio_pagado, '29.95');
  const events = await client.query('SELECT tipo_evento, actor_usuario_id, motivo, metadata, estado_anterior, estado_nuevo, modo_activo_anterior, modo_activo_nuevo, modelos_anteriores, modelos_nuevos FROM accesos_oposicion_historial WHERE acceso_id = $1', [data.accesoId]);
  assert.deepEqual(events.rows.map((event) => event.tipo_evento), ['modo_activo_cambiado']);
  assert.equal(events.rows[0].actor_usuario_id, String(data.usuarioId));
  assert.equal(events.rows[0].motivo, null);
  assert.equal(typeof events.rows[0].metadata, 'object');
  assert.deepEqual(Object.keys(events.rows[0].metadata), ['vigencia']);
  assert.equal(events.rows[0].metadata.vigencia.anterior.fechaInicio, '2026-01-01T00:00:00.000Z');
  assert.equal(events.rows[0].metadata.vigencia.anterior.fechaFin, '2099-01-01T00:00:00.000Z');
  assert.equal(events.rows[0].metadata.vigencia.nuevo.fechaInicio, '2026-01-01T00:00:00.000Z');
  assert.equal(events.rows[0].metadata.vigencia.nuevo.fechaFin, '2099-01-01T00:00:00.000Z');
  assert.equal(events.rows[0].estado_anterior, 'activo');
  assert.equal(events.rows[0].estado_nuevo, 'activo');
  assert.equal(events.rows[0].modo_activo_anterior, 'experto');
  assert.equal(events.rows[0].modo_activo_nuevo, 'guiado');
  assert.deepEqual(events.rows[0].modelos_anteriores, ['experto', 'guiado']);
  assert.deepEqual(events.rows[0].modelos_nuevos, ['experto', 'guiado']);
  const listed = await accesoOposicionHistorialRepository.listarPorAcceso(data.accesoId, client);
  assert.equal(listed.length, 1);
  assert.deepEqual(listed[0].metadata, {});
  assert.deepEqual(listed[0].anterior.vigencia, {
    fechaInicio: '2026-01-01T00:00:00.000Z',
    fechaFin: '2099-01-01T00:00:00.000Z',
  });
  assert.deepEqual(listed[0].nuevo.vigencia, listed[0].anterior.vigencia);
}));

test('cambia guiado a experto', options, async () => withTransaction('guiado-expert', async ({ service, data }) => {
  const result = await service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'experto' });
  assert.equal(result.modo_activo, 'experto');
}, { modoActivo: 'guiado', modoPreparacion: 'albacer' }));

test('pendiente_modo pasa a activo con un único evento', options, async () => withTransaction('pending', async ({ client, service, data }) => {
  const result = await service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' });
  assert.equal(result.estado, 'activo');
  const events = await client.query('SELECT tipo_evento, estado_anterior, estado_nuevo FROM accesos_oposicion_historial WHERE acceso_id = $1', [data.accesoId]);
  assert.deepEqual(events.rows, [{ tipo_evento: 'modo_activo_cambiado', estado_anterior: 'pendiente_modo', estado_nuevo: 'activo' }]);
}, { estado: 'pendiente_modo', modoActivo: null }));

test('repetir el modo activo no duplica UPDATE ni historial', options, async () => withTransaction('idempotent', async ({ client, service, data }) => {
  const result = await service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'experto' });
  assert.equal(result.modo_activo, 'experto');
  const events = await client.query('SELECT COUNT(*) FROM accesos_oposicion_historial WHERE acceso_id = $1', [data.accesoId]);
  assert.equal(events.rows[0].count, '0');
}));

test('rechaza expirado, revocado, cancelado, ajeno y modelo no incluido', options, async () => {
  await withTransaction('expired', async ({ service, data }) => {
    await assert.rejects(() => service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' }), { code: 'ACCESS_MODE_STATE_FORBIDDEN' });
  }, { estado: 'expirado' });
  for (const estado of ['revocado', 'cancelado']) {
    await withTransaction(estado, async ({ service, data }) => {
      await assert.rejects(() => service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' }), { code: 'ACCESS_MODE_STATE_FORBIDDEN' });
    }, { estado });
  }
  await withTransaction('not-owner', async ({ service, data }) => {
    await assert.rejects(() => service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: MAX_BIGINT, modo: 'guiado' }), { code: 'ACCESS_MODE_FORBIDDEN' });
  }, { modelos: ['experto'] });
  await withTransaction('not-included', async ({ service, data }) => {
    await assert.rejects(() => service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' }), { code: 'ACCESS_MODE_NOT_INCLUDED' });
  }, { modelos: ['experto'] });
});

test('admite BIGINT máximo como string y rechaza el siguiente', options, async () => withTransaction('bigint', async ({ service, data }) => {
  await service.cambiarModoActivo({ accesoId: data.accesoId, usuarioId: data.usuarioId, modo: 'guiado' });
  await assert.rejects(() => service.cambiarModoActivo({ accesoId: '9223372036854775808', usuarioId: data.usuarioId, modo: 'guiado' }), { code: 'ACCESS_MODE_INVALID_IDENTIFIER' });
}));
