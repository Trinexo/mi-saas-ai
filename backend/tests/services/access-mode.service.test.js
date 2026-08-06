import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccessModeService } from '../../src/services/accessMode.service.js';

const baseAccess = (overrides = {}) => ({
  id: '9223372036854775807',
  usuario_id: '9007199254740993',
  oposicion_id: '42',
  estado: 'activo',
  modo_activo: 'experto',
  modo_preparacion: 'experto',
  fecha_inicio: '2026-01-01 00:00:00',
  fecha_fin: '2099-01-01 00:00:00',
  precio_pagado: '19.95',
  notas: 'nota',
  ...overrides,
});

function harness({ access = baseAccess(), models = ['experto', 'guiado'], historyError = null } = {}) {
  const queries = [];
  const client = {
    async query(sql, params = []) {
      queries.push({ sql, params });
      return { rows: [], rowCount: 0 };
    },
    release() {},
  };
  const history = [];
  const contexto = {
    estado_efectivo: access.estado,
    acceso_id: access.id,
    modo_activo: access.modo_activo,
    vigencia: { esta_vigente: access.estado === 'activo' },
  };
  const service = createAccessModeService({
    db: { connect: async () => client },
    accesoRepository: { obtenerParaCambioModo: async () => access },
    modelosRepository: { listarPorAcceso: async () => models.map((modelo) => ({ modelo })) },
    historialRepository: {
      async insertarEvento(event) {
        if (historyError) throw historyError;
        history.push(event);
      },
    },
    contextoService: { obtenerContextoUsuario: async () => contexto },
    clock: () => new Date('2026-08-04T12:00:00.000Z'),
  });
  return { service, client, queries, history };
}

test('cambia experto a guiado y sincroniza legacy', async () => {
  const h = harness();
  const result = await h.service.cambiarModoActivo({
    accesoId: baseAccess().id, usuarioId: baseAccess().usuario_id, modo: 'guiado',
  });
  assert.equal(result.estado_efectivo, 'activo');
  assert.equal(h.history.length, 1);
  assert.equal(h.history[0].tipoEvento, 'modo_activo_cambiado');
  assert.equal(h.history[0].nuevo.modoActivo, 'guiado');
  assert.equal(h.history[0].nuevo.estado, 'activo');
  assert.equal(h.history[0].motivo, null);
  assert.equal(h.history[0].metadata, null);
  assert.deepEqual(h.history[0].anterior.modelos, ['experto', 'guiado']);
  assert.deepEqual(h.history[0].nuevo.modelos, ['experto', 'guiado']);
  assert.equal(h.queries.filter(({ sql }) => sql.startsWith('UPDATE')).length, 1);
});

test('cambia guiado a experto', async () => {
  const access = baseAccess({ modo_activo: 'guiado', modo_preparacion: 'albacer' });
  const h = harness({ access });
  await h.service.cambiarModoActivo({ accesoId: access.id, usuarioId: access.usuario_id, modo: 'experto' });
  assert.equal(h.history[0].anterior.modoActivo, 'guiado');
  assert.equal(h.history[0].nuevo.modoActivo, 'experto');
  assert.equal(h.history[0].motivo, null);
  assert.equal(h.history[0].metadata, null);
});

test('resuelve pendiente_modo y lo activa en el mismo evento', async () => {
  const access = baseAccess({ estado: 'pendiente_modo', modo_activo: null, modo_preparacion: null });
  const h = harness({ access });
  await h.service.cambiarModoActivo({ accesoId: access.id, usuarioId: access.usuario_id, modo: 'guiado' });
  assert.equal(h.history[0].anterior.estado, 'pendiente_modo');
  assert.equal(h.history[0].nuevo.estado, 'activo');
  assert.equal(h.history[0].motivo, null);
  assert.equal(h.history[0].metadata, null);
});

test('modo ya activo es idempotente y no escribe historial', async () => {
  const access = baseAccess({ modo_activo: 'experto' });
  const h = harness({ access });
  await h.service.cambiarModoActivo({ accesoId: access.id, usuarioId: access.usuario_id, modo: 'experto' });
  assert.equal(h.history.length, 0);
  assert.equal(h.queries.filter(({ sql }) => sql.startsWith('UPDATE')).length, 0);
});

test('rechaza modo no incluido', async () => {
  const h = harness({ models: ['experto'] });
  await assert.rejects(
    () => h.service.cambiarModoActivo({ accesoId: baseAccess().id, usuarioId: baseAccess().usuario_id, modo: 'guiado' }),
    { code: 'ACCESS_MODE_NOT_INCLUDED' },
  );
});

test('rechaza acceso ajeno y estados no elegibles', async () => {
  const h = harness({ access: baseAccess({ usuario_id: '7' }) });
  await assert.rejects(() => h.service.cambiarModoActivo({ accesoId: baseAccess().id, usuarioId: '8', modo: 'guiado' }), { code: 'ACCESS_MODE_FORBIDDEN' });
  for (const estado of ['revocado', 'cancelado', 'expirado']) {
    const state = harness({ access: baseAccess({ estado }) });
    await assert.rejects(() => state.service.cambiarModoActivo({ accesoId: baseAccess().id, usuarioId: baseAccess().usuario_id, modo: 'guiado' }), { code: 'ACCESS_MODE_STATE_FORBIDDEN' });
  }
});

test('rechaza acceso incoherente y conserva el error de historial para rollback', async () => {
  const inconsistent = harness({ access: baseAccess({ modo_activo: null }) });
  await assert.rejects(() => inconsistent.service.cambiarModoActivo({ accesoId: baseAccess().id, usuarioId: baseAccess().usuario_id, modo: 'guiado' }), { code: 'ACCESS_MODE_INCONSISTENT' });
  const h = harness({ historyError: new Error('historial falló') });
  await assert.rejects(() => h.service.cambiarModoActivo({ accesoId: baseAccess().id, usuarioId: baseAccess().usuario_id, modo: 'guiado' }), /historial falló/);
  assert.ok(h.queries.some(({ sql }) => sql === 'ROLLBACK'));
});

test('admite BIGINT máximo y rechaza IDs inválidos', async () => {
  const h = harness();
  await h.service.cambiarModoActivo({ accesoId: '9223372036854775807', usuarioId: baseAccess().usuario_id, modo: 'guiado' });
  for (const accesoId of ['0', '-1', '1.5', '1e3', '9223372036854775808', ' 1']) {
    await assert.rejects(() => h.service.cambiarModoActivo({ accesoId, usuarioId: baseAccess().usuario_id, modo: 'guiado' }), { code: 'ACCESS_MODE_INVALID_IDENTIFIER' });
  }
});
