import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccessLegacyAdapter } from '../../src/services/accessLegacyAdapter.service.js';

function base({ estado = 'activo', fechaFin = '2099-01-01T00:00:00.000Z' } = {}) {
  return {
    usuario_existe: true,
    oposicion_existe: true,
    acceso_id: '42',
    usuario_id: '7',
    oposicion_id: '9',
    estado,
    fecha_fin: fechaFin,
  };
}

function harness(row = base()) {
  const calls = [];
  const repo = {
    async obtenerLecturaContexto() { return row ? [row] : []; },
  };
  const mode = {
    async cambiarModoActivo(input) { calls.push(['modo', input]); return { ok: true }; },
    async actualizarRankingPublico(input) { calls.push(['ranking', input]); return { ok: true }; },
  };
  const admin = {
    async crearAcceso(input) { calls.push(['crear', input]); return { ok: true }; },
    async cancelarAcceso(input) { calls.push(['cancelar', input]); return { ok: true }; },
    async revocarAcceso(input) { calls.push(['revocar', input]); return { ok: true }; },
    async renovarAcceso(input) { calls.push(['renovar', input]); return { ok: true }; },
    async reactivarAcceso(input) { calls.push(['reactivar', input]); return { ok: true }; },
    async modificarModelos(input) { calls.push(['modelos', input]); return { ok: true }; },
    async modificarVigencia(input) { calls.push(['vigencia', input]); return { ok: true }; },
    async actualizarAccesoLegacy(input) { calls.push(['legacy', input]); return { ok: true }; },
  };
  const context = {
    async obtenerContextoUsuario(input) { calls.push(['contexto', input]); return { ok: true }; },
  };
  return {
    adapter: createAccessLegacyAdapter({ accesoRepository: repo, modeService: mode, adminService: admin, contextService: context }),
    calls,
  };
}

test('preparación legacy delega experto/guiado y conserva ranking', async () => {
  const { adapter, calls } = harness();
  await adapter.actualizarPreparacion({ usuarioId: '7', oposicionId: '9', modoPreparacion: 'albacer', rankingPublico: false });
  assert.deepEqual(calls[0], ['modo', {
    accesoId: '42', usuarioId: '7', actorUsuarioId: '7', modo: 'guiado', rankingPublico: false,
  }]);
});

test('ranking legacy sin modo usa la operación transaccional específica', async () => {
  const { adapter, calls } = harness();
  await adapter.actualizarPreparacion({ usuarioId: '7', oposicionId: '9', rankingPublico: true });
  assert.deepEqual(calls[0], ['ranking', { usuarioId: '7', accesoId: '42', rankingPublico: true }]);
});

test('asignación legacy usa el servicio canónico y no el upsert repository', async () => {
  const { adapter, calls } = harness();
  await adapter.asignar({ usuarioId: '7', oposicionId: '9', fechaFin: null, tipoAlumno: 'libre', modoPreparacion: 'experto', actorUsuarioId: '3' });
  assert.equal(calls[0][0], 'crear');
  assert.deepEqual(calls[0][1].modelos, ['experto']);
  assert.equal(calls[0][1].modoActivo, 'experto');
  assert.equal(calls[0][1].motivo, 'Compatibilidad legacy: asignación administrativa');
  assert.deepEqual(calls[0][1].principal, { tipo: 'administrador', usuarioId: '3' });
});

test('cancelación legacy toma actor del servidor y genera motivo de compatibilidad', async () => {
  const { adapter, calls } = harness();
  await adapter.cancelar({ usuarioId: '7', oposicionId: '9', actorUsuarioId: '3' });
  assert.equal(calls[0][0], 'cancelar');
  assert.equal(calls[0][1].actorUsuarioId, '3');
  assert.equal(calls[0][1].motivo, 'Compatibilidad legacy: cancelación administrativa');
});

test('update legacy traduce estados y modelos a operaciones canónicas', async () => {
  const renewed = harness({ ...base(), estado: 'activo', fecha_fin: '2020-01-01T00:00:00.000Z' });
  await renewed.adapter.actualizar({ usuarioId: '7', oposicionId: '9', payload: { estado: 'activo' }, actorUsuarioId: '3' });
  assert.equal(renewed.calls[0][0], 'renovar');

  const model = harness();
  await model.adapter.actualizar({ usuarioId: '7', oposicionId: '9', payload: { modoPreparacion: 'albacer' }, actorUsuarioId: '3' });
  assert.equal(model.calls[0][0], 'modelos');
  assert.deepEqual(model.calls[0][1].modelos, ['guiado']);

  const mixed = harness();
  await mixed.adapter.actualizar({ usuarioId: '7', oposicionId: '9', payload: { estado: 'cancelado', notas: 'x' }, actorUsuarioId: '3' });
  assert.equal(mixed.calls[0][0], 'legacy');
  assert.equal(mixed.calls[0][1].motivo, 'Compatibilidad legacy: actualización administrativa');
});
