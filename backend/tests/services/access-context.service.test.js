import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccessContextService } from '../../src/services/accessContext.service.js';

const NOW = new Date('2026-08-04T12:00:00.000Z');
const base = (overrides = {}) => ({
  usuario_existe: true,
  oposicion_existe: true,
  acceso_id: '9007199254740993',
  estado: 'activo',
  modo_activo: 'experto',
  modo_preparacion: 'experto',
  fecha_inicio: '2026-08-01 00:00:00',
  fecha_fin: '2026-08-10 00:00:00',
  modelos: ['experto'],
  ...overrides,
});

test('resuelve varios contextos del usuario en una sola lectura bulk', async () => {
  let queries = 0;
  const rows = [
    base({
      oposicion_id: '10',
      acceso_id: '9223372036854775807',
      fecha_inicio: '2026-08-01 00:00:00',
      fecha_fin: '2026-08-10 00:00:00',
    }),
    base({
      oposicion_id: '11',
      acceso_id: '12',
      estado: 'activo',
      modo_activo: 'guiado',
      modo_preparacion: 'albacer',
      modelos: ['guiado'],
      fecha_fin: '2026-08-03 00:00:00',
    }),
  ];
  const result = await createAccessContextService({
    accesoRepository: {
      async obtenerLecturasContextoUsuario() {
        queries += 1;
        return rows;
      },
    },
    clock: () => NOW,
  }).obtenerContextosUsuario({ usuarioId: '7' });

  assert.equal(queries, 1);
  assert.equal(result.length, 2);
  assert.equal(result[0].acceso_id, '9223372036854775807');
  assert.equal(result[0].permisos.puede_acceder_contenido, true);
  assert.equal(result[1].estado_efectivo, 'expirado');
  assert.equal(result[1].permisos.puede_acceder_contenido, false);
});

test('el bulk falla cerrado ante una incoherencia y no mezcla usuarios', async () => {
  const serviceWithRows = (rows) => createAccessContextService({
    accesoRepository: { obtenerLecturasContextoUsuario: async () => rows },
    clock: () => NOW,
  });
  await assert.rejects(
    () => serviceWithRows([base({ usuario_id: '8', oposicion_id: '10', modo_activo: 'guiado' })])
      .obtenerContextosUsuario({ usuarioId: '7' }),
    { code: 'ACCESS_CONTEXT_INCONSISTENT' },
  );
  await assert.rejects(
    () => serviceWithRows([base({ oposicion_id: '10', modelos: ['experto'], modo_activo: null })])
      .obtenerContextosUsuario({ usuarioId: '7' }),
    { code: 'ACCESS_CONTEXT_INCONSISTENT' },
  );
});
function service(row) {
  return createAccessContextService({
    accesoRepository: { obtenerLecturaContexto: async () => [row] },
    clock: () => NOW,
  });
}

test('devuelve DTO estable sin acceso', async () => {
  const result = await service({ usuario_existe: true, oposicion_existe: true, acceso_id: null })
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(result.estado_efectivo, 'sin_acceso');
  assert.deepEqual(result.modelos_disponibles, []);
  assert.equal(result.acciones_administrativas.puede_reactivar, false);
});

test('normaliza fechas UTC, BIGINT y permisos de experto', async () => {
  const result = await service(base()).obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(result.acceso_id, '9007199254740993');
  assert.equal(result.vigencia.fecha_inicio, '2026-08-01T00:00:00.000Z');
  assert.equal(result.vigencia.fecha_fin, '2026-08-10T00:00:00.000Z');
  assert.equal(result.permisos.puede_usar_experto, true);
  assert.equal(result.permisos.puede_usar_guiado, false);
});

test('albacer es solo información legacy normalizada a guiado', async () => {
  const result = await service(base({ modo_activo: 'guiado', modo_preparacion: 'albacer', modelos: ['guiado'] }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(result.legacy.modo_preparacion_normalizado, 'guiado');
  assert.deepEqual(result.modelos_disponibles, ['guiado']);
});

test('calcula expiración, fecha futura y fecha fin abierta', async () => {
  const expired = await service(base({ fecha_fin: '2026-08-04 12:00:00' }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(expired.estado_efectivo, 'expirado');
  assert.equal(expired.permisos.puede_acceder_contenido, false);
  const future = await service(base({ fecha_inicio: '2026-08-04 12:00:00.001' }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(future.permisos.puede_acceder_contenido, false);
  const open = await service(base({ fecha_fin: null }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(open.vigencia.dias_restantes, null);
});

test('mantiene pendiente_modo, revocado y cancelado cerrados', async () => {
  const pending = await service(base({ estado: 'pendiente_modo', modo_activo: null, modelos: ['guiado', 'experto'] }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 });
  assert.equal(pending.estado_efectivo, 'pendiente_modo');
  assert.equal(pending.permisos.puede_acceder_contenido, false);
  const revoked = await service(base({ estado: 'revocado', modo_activo: null, modo_preparacion: null }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2, principal: { tipo: 'administrador' } });
  assert.equal(revoked.estado_efectivo, 'revocado');
  assert.equal(revoked.acciones_administrativas.puede_reactivar, true);
  const cancelled = await service(base({ estado: 'cancelado', modo_activo: null, modo_preparacion: null }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2, principal: { tipo: 'administrador' } });
  assert.equal(cancelled.estado_efectivo, 'cancelado');
  assert.equal(cancelled.acciones_administrativas.puede_reactivar, true);
});

test('admin y billing calculan únicamente acciones autorizadas', async () => {
  const admin = await service(base({ estado: 'activo' })).obtenerContextoUsuario({
    usuarioId: 1, oposicionId: 2, principal: { tipo: 'administrador' },
  });
  assert.equal(admin.acciones_administrativas.puede_cancelar, true);
  assert.equal(admin.permisos.puede_acceder_contenido, false);
  const billing = await service(base({ estado: 'expirado' })).obtenerContextoUsuario({
    usuarioId: 1, oposicionId: 2,
    principal: { tipo: 'billing', scopes: ['access:renew'] },
  });
  assert.equal(billing.acciones_administrativas.puede_renovar, true);
  assert.equal(billing.acciones_administrativas.puede_cancelar, false);
});

test('profesor no recibe permisos de contenido ni administrativos', async () => {
  const result = await service(base({ modelos: ['experto', 'guiado'], modo_activo: 'experto' }))
    .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2, principal: { tipo: 'profesor' } });
  assert.deepEqual(result.permisos, {
    puede_acceder_contenido: false,
    puede_usar_experto: false,
    puede_usar_guiado: false,
    puede_cambiar_modo: false,
  });
  assert.deepEqual(result.acciones_administrativas, {
    puede_renovar: false,
    puede_modificar_modelos: false,
    puede_modificar_vigencia: false,
    puede_revocar: false,
    puede_cancelar: false,
    puede_reactivar: false,
  });
});

test('rechaza inconsistencias sin conceder contenido', async () => {
  await assert.rejects(
    () => service(base({ modo_activo: null })).obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 }),
    { code: 'ACCESS_CONTEXT_INCONSISTENT' },
  );
  await assert.rejects(
    () => service(base({ modelos: ['experto', 'experto'] })).obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 }),
    { code: 'ACCESS_CONTEXT_INCONSISTENT' },
  );
});

test('distingue usuario y oposición inexistentes de sin acceso', async () => {
  await assert.rejects(
    () => service({ usuario_existe: false, oposicion_existe: true, acceso_id: null })
      .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 }),
    { code: 'ACCESS_CONTEXT_USER_NOT_FOUND' },
  );
  await assert.rejects(
    () => service({ usuario_existe: true, oposicion_existe: false, acceso_id: null })
      .obtenerContextoUsuario({ usuarioId: 1, oposicionId: 2 }),
    { code: 'ACCESS_CONTEXT_OPPOSITION_NOT_FOUND' },
  );
});

test('valida principal e identificadores BIGINT sin perder precisión', async () => {
  const result = await service(base({ acceso_id: '9223372036854775807' }))
    .obtenerContextoUsuario({
      usuarioId: '9223372036854775807',
      oposicionId: '9223372036854775807',
    });
  assert.equal(result.usuario_id, '9223372036854775807');
  assert.equal(result.acceso_id, '9223372036854775807');
  await assert.rejects(
    () => service(base()).obtenerContextoUsuario({ usuarioId: 0, oposicionId: 2 }),
    { code: 'ACCESS_CONTEXT_INVALID_IDENTIFIER' },
  );
  await assert.rejects(
    () => service(base()).obtenerContextoUsuario({
      usuarioId: 1,
      oposicionId: 2,
      principal: { tipo: 'alumno', usuarioId: 9 },
    }),
    { code: 'ACCESS_CONTEXT_INVALID_PRINCIPAL' },
  );
});
