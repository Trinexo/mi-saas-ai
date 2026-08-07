import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccessAdminService } from '../../src/services/accessAdmin.service.js';

const accessBase = () => ({
  id: '9007199254740993',
  usuario_id: '10000000000000001',
  oposicion_id: '10000000000000002',
  estado: 'activo',
  modo_preparacion: 'experto',
  modo_activo: 'experto',
  fecha_inicio: '2026-01-01 00:00:00',
  fecha_fin: '2099-01-01 00:00:00',
  tipo_alumno: 'libre',
  precio_pagado: null,
  notas: null,
});

function harness({ access = accessBase(), duplicate = false, models = ['experto'], context, historyError = null } = {}) {
  let current = { ...access };
  let committed = false;
  const history = [];
  const client = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
        if (normalized === 'COMMIT') committed = true;
        return { rows: [], rowCount: 0 };
      }
      if (normalized.startsWith('SELECT id FROM usuarios')) return { rows: [{ id: params[0] }], rowCount: 1 };
      if (normalized.startsWith('SELECT id FROM oposiciones')) return { rows: [{ id: params[0] }], rowCount: 1 };
      if (normalized.startsWith('SELECT id FROM accesos_oposicion WHERE usuario_id')) {
        return duplicate ? { rows: [{ id: current.id }], rowCount: 1 } : { rows: [], rowCount: 0 };
      }
      if (normalized.startsWith('SELECT id, usuario_id')) return { rows: [current], rowCount: 1 };
      if (normalized.startsWith('INSERT INTO accesos_oposicion')) {
        current = { ...current, estado: params[2], fecha_inicio: '2026-01-01 00:00:00', fecha_fin: params[4], modo_preparacion: params[8], modo_activo: params[9] };
        return { rows: [current], rowCount: 1 };
      }
      if (normalized.startsWith('UPDATE accesos_oposicion')) {
        if (normalized.includes('SET estado = $2, fecha_inicio')) {
          current = {
            ...current,
            estado: params[1],
            fecha_inicio: params[2],
            fecha_fin: params[3],
            modo_activo: params[4],
            modo_preparacion: params[5],
          };
        } else if (normalized.includes('SET fecha_inicio')) {
          current = { ...current, fecha_inicio: '2030-01-01 00:00:00', fecha_fin: params[2] };
        } else {
          current = { ...current, estado: params[1], modo_activo: params[2], modo_preparacion: params[3] };
        }
        return { rows: [current], rowCount: 1 };
      }
      throw new Error(`SQL inesperado en test: ${normalized}`);
    },
    release() {},
  };
  const db = { async connect() { return client; } };
  const modelosRepository = {
    async listarPorAcceso() { return models.map((modelo, index) => ({ id: index + 1, accesoId: access.id, modelo })); },
    async insertarModelo(_id, modelo) { models.push(modelo); return { modelo }; },
    async reemplazarModelos(_id, nuevos) { models = [...nuevos]; return { cambiado: true, modelos: models }; },
  };
  const historialRepository = {
    async insertarEvento(evento) {
      if (historyError) throw historyError;
      history.push(evento);
      return evento;
    },
    async listarPorAcceso() { return history; },
  };
  const service = createAccessAdminService({
    db,
    modelosRepository,
    historialRepository,
    contextService: { async obtenerContextoUsuario(args) { return context ?? { args, estado_efectivo: current.estado }; } },
  });
  return { service, history, client, get committed() { return committed; } };
}

const principal = { tipo: 'administrador', usuarioId: '7' };
const common = { actorUsuarioId: '7', principal, motivo: 'motivo válido' };

test('crea acceso experto y sincroniza el legacy', async () => {
  const h = harness({ models: [] });
  const result = await h.service.crearAcceso({
    ...common, usuarioId: '10000000000000001', oposicionId: '10000000000000002', modelos: ['experto'],
    vigencia: { fechaInicio: '2026-01-01T00:00:00Z', fechaFin: null },
  });
  assert.equal(result.estado_efectivo, 'activo');
  assert.equal(h.history[0].tipoEvento, 'acceso_creado');
  assert.equal(h.history[0].anterior, null);
  assert.equal(h.history[0].motivo, 'motivo válido');
});

test('crea acceso guiado y sincroniza albacer', async () => {
  const h = harness({ models: [] });
  await h.service.crearAcceso({
    ...common, usuarioId: '20', oposicionId: '21', modelos: ['guiado'],
    vigencia: { fechaInicio: '2026-01-01T00:00:00Z', fechaFin: null },
  });
  assert.equal(h.history[0].nuevo.modoActivo, 'guiado');
});

test('crea dos modelos sin selección en pendiente_modo', async () => {
  const h = harness({ models: [] });
  await h.service.crearAcceso({
    ...common, usuarioId: '10', oposicionId: '11', modelos: ['guiado', 'experto'],
    vigencia: { fechaInicio: '2026-01-01T00:00:00Z', fechaFin: null },
  });
  assert.equal(h.history[0].nuevo.estado, 'pendiente_modo');
  assert.equal(h.history[0].nuevo.modoActivo, null);
});

test('rechaza duplicados, motivo ausente e IDs fuera de BIGINT', async () => {
  await assert.rejects(() => harness({ duplicate: true }).service.crearAcceso({
    ...common, usuarioId: '1', oposicionId: '2', modelos: ['experto'],
    vigencia: { fechaInicio: '2026-01-01', fechaFin: null },
  }), (error) => error.code === 'ACCESS_ADMIN_DUPLICATE');
  await assert.rejects(() => harness().service.crearAcceso({
    actorUsuarioId: '7', principal, usuarioId: '9223372036854775808', oposicionId: '2', modelos: ['experto'],
    vigencia: { fechaInicio: '2026-01-01', fechaFin: null }, motivo: 'x',
  }), (error) => error.code === 'ACCESS_ADMIN_INVALID_IDENTIFIER');
  await assert.rejects(() => harness().service.crearAcceso({
    ...common, usuarioId: '1', oposicionId: '2', modelos: ['experto'],
    vigencia: { fechaInicio: '2026-01-01', fechaFin: null }, motivo: ' ',
  }), (error) => error.code === 'ACCESS_ADMIN_INVALID_MOTIVE');
});

test('reemplaza modelos y conserva modo incluido', async () => {
  const h = harness({ models: ['experto', 'guiado'] });
  await h.service.modificarModelos({ ...common, accesoId: accessBase().id, modelos: ['guiado'] });
  assert.equal(h.history[0].tipoEvento, 'modelos_modificados');
  assert.equal(h.history[0].nuevo.modoActivo, 'guiado');
});

test('modificar modelos es idempotente cuando el resultado no cambia', async () => {
  const h = harness({ models: ['experto'] });
  await h.service.modificarModelos({ ...common, accesoId: accessBase().id, modelos: ['experto'] });
  assert.equal(h.history.length, 0);
});

test('modifica vigencia sin tocar modelos y registra snapshot', async () => {
  const h = harness({ models: ['experto'] });
  await h.service.modificarVigencia({ ...common, accesoId: accessBase().id, fechaFin: null });
  assert.equal(h.history[0].tipoEvento, 'vigencia_modificada');
  assert.deepEqual(h.history[0].anterior.modelos, ['experto']);
});

test('rechaza vigencia sobre acceso expirado', async () => {
  const h = harness({ access: { ...accessBase(), estado: 'expirado' } });
  await assert.rejects(() => h.service.modificarVigencia({ ...common, accesoId: accessBase().id, fechaFin: null }),
    (error) => error.code === 'ACCESS_ADMIN_STATE');
});

test('revierte si falla la escritura del historial', async () => {
  const h = harness({ models: [], historyError: new Error('fallo controlado') });
  await assert.rejects(() => h.service.crearAcceso({
    ...common, usuarioId: '1', oposicionId: '2', modelos: ['experto'],
    vigencia: { fechaInicio: '2026-01-01', fechaFin: null },
  }), /fallo controlado/);
  assert.equal(h.committed, false);
});

test('renueva un expirado con nueva vigencia y un único evento', async () => {
  const h = harness({ access: { ...accessBase(), estado: 'expirado', fecha_fin: '2025-01-01 00:00:00' } });
  await h.service.renovarAcceso({ ...common, accesoId: accessBase().id, fechaInicio: '2026-01-01', fechaFin: '2027-01-01' });
  assert.equal(h.history.length, 1);
  assert.equal(h.history[0].tipoEvento, 'renovado');
});

test('renovación idéntica de activo vigente no actualiza ni registra historial', async () => {
  const h = harness({ models: ['experto'] });
  await h.service.renovarAcceso({ ...common, accesoId: accessBase().id });
  assert.equal(h.history.length, 0);
});

test('renovar estados terminales y reactivar estados no terminales son conflictos', async () => {
  for (const estado of ['revocado', 'cancelado']) {
    await assert.rejects(
      () => harness({ access: { ...accessBase(), estado } }).service.renovarAcceso({ ...common, accesoId: accessBase().id, fechaInicio: '2026-01-01', fechaFin: null }),
      (error) => error.code === 'ACCESS_ADMIN_STATE',
    );
  }
  await assert.rejects(
    () => harness().service.reactivarAcceso({ ...common, accesoId: accessBase().id }),
    (error) => error.code === 'ACCESS_ADMIN_STATE',
  );
});

test('revocar y cancelar son idempotentes y registran un solo evento', async () => {
  const revoked = harness();
  await revoked.service.revocarAcceso({ ...common, accesoId: accessBase().id });
  await revoked.service.revocarAcceso({ ...common, accesoId: accessBase().id });
  assert.equal(revoked.history.length, 1);
  assert.equal(revoked.history[0].tipoEvento, 'revocado');

  const cancelled = harness();
  await cancelled.service.cancelarAcceso({ ...common, accesoId: accessBase().id });
  await cancelled.service.cancelarAcceso({ ...common, accesoId: accessBase().id });
  assert.equal(cancelled.history.length, 1);
  assert.equal(cancelled.history[0].tipoEvento, 'cancelado');
});

test('reactiva un acceso terminal y sincroniza el legacy', async () => {
  const h = harness({ access: { ...accessBase(), estado: 'revocado', modo_activo: 'guiado', modo_preparacion: 'albacer' }, models: ['guiado'] });
  await h.service.reactivarAcceso({ ...common, accesoId: accessBase().id });
  assert.equal(h.history.length, 1);
  assert.equal(h.history[0].tipoEvento, 'reactivado');
  assert.equal(h.history[0].nuevo.modoActivo, 'guiado');
});

test('revocación y reactivación conservan los campos comerciales', async () => {
  const h = harness({ access: { ...accessBase(), precio_pagado: 19.5, notas: 'conservar' } });
  await h.service.revocarAcceso({ ...common, accesoId: accessBase().id });
  assert.equal(h.history[0].anterior.vigencia.fechaFin, accessBase().fecha_fin);
  assert.equal(h.history[0].nuevo.vigencia.fechaInicio, accessBase().fecha_inicio);
});
