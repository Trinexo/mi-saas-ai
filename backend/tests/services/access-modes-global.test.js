import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveModes, normalizeModes, DEFAULT_OPPOSITION_MODES } from '../../src/services/accessModes.js';
import { createAccessContextService } from '../../src/services/accessContext.service.js';

test('las oposiciones existentes conservan ambos modos por defecto', () => {
  assert.deepEqual(normalizeModes(undefined), [...DEFAULT_OPPOSITION_MODES]);
});

test('los modos efectivos son la intersección oposición/acceso', () => {
  assert.deepEqual(effectiveModes(['experto'], ['experto', 'guiado']), ['experto']);
  assert.deepEqual(effectiveModes(['guiado'], ['experto', 'guiado']), ['guiado']);
  assert.deepEqual(effectiveModes(['experto', 'guiado'], ['guiado']), ['guiado']);
  assert.deepEqual(effectiveModes(['experto', 'guiado'], ['experto', 'guiado']), ['experto', 'guiado']);
});

test('no se aceptan listas globales vacías o con modos desconocidos', () => {
  assert.throws(() => normalizeModes([]));
  assert.throws(() => normalizeModes(['albacer']));
});

test('el contexto expone la oposición, el acceso y la intersección efectiva', async () => {
  const service = createAccessContextService({
    accesoRepository: {
      async obtenerLecturaContexto() {
        return [{
          usuario_existe: true,
          oposicion_existe: true,
          usuario_id: 7,
          oposicion_id: 9,
          acceso_id: 11,
          estado: 'activo',
          modo_activo: 'experto',
          modo_preparacion: 'experto',
          fecha_inicio: '2026-01-01 00:00:00',
          fecha_fin: null,
          modelos: ['experto', 'guiado'],
          modelos_disponibles_oposicion: ['experto'],
        }];
      },
    },
    clock: () => new Date('2026-08-19T00:00:00.000Z'),
  });
  const context = await service.obtenerContextoUsuario({ usuarioId: 7, oposicionId: 9 });
  assert.deepEqual(context.modelos_disponibles_acceso, ['experto', 'guiado']);
  assert.deepEqual(context.modelos_disponibles_oposicion, ['experto']);
  assert.deepEqual(context.modelos_efectivos, ['experto']);
  assert.equal(context.permisos.puede_usar_guiado, false);
});
