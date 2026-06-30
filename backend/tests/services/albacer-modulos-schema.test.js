import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAlbacerModuloItemSchema,
  createAlbacerModuloSchema,
  createAlbacerModuloTestSchema,
  generateAlbacerModuloAutoSchema,
  updateAlbacerModuloSchema,
} from '../../src/schemas/albacerModulos.schema.js';

test('createAlbacerModuloSchema normaliza ids y orden desde strings', () => {
  const result = createAlbacerModuloSchema.parse({
    oposicion_id: '10',
    nombre: 'Modulo inicial',
    orden: '2',
    tema_ids: ['100', '101'],
  });

  assert.equal(result.oposicion_id, 10);
  assert.equal(result.orden, 2);
  assert.deepEqual(result.tema_ids, [100, 101]);
});

test('updateAlbacerModuloSchema normaliza campos numericos parciales', () => {
  const result = updateAlbacerModuloSchema.parse({
    oposicion_id: '10',
    orden: '3',
    tema_ids: ['200'],
  });

  assert.equal(result.oposicion_id, 10);
  assert.equal(result.orden, 3);
  assert.deepEqual(result.tema_ids, [200]);
});

test('createAlbacerModuloItemSchema normaliza ids de item', () => {
  const result = createAlbacerModuloItemSchema.parse({
    tipo: 'test',
    titulo: 'Test del modulo',
    plantilla_test_id: '33',
    orden: '1',
  });

  assert.equal(result.plantilla_test_id, 33);
  assert.equal(result.orden, 1);
});

test('createAlbacerModuloTestSchema normaliza duracion y puntuacion', () => {
  const result = createAlbacerModuloTestSchema.parse({
    nombre: 'Test del modulo',
    duracion_minutos: '25',
    pts_acierto: '1',
    pts_fallo: '-0.5',
    pts_blanco: '0',
  });

  assert.equal(result.duracion_minutos, 25);
  assert.equal(result.pts_acierto, 1);
  assert.equal(result.pts_fallo, -0.5);
  assert.equal(result.pts_blanco, 0);
});

test('generateAlbacerModuloAutoSchema normaliza cantidades del formulario', () => {
  const result = generateAlbacerModuloAutoSchema.parse({
    numero_tests: '3',
    preguntas_por_test: '20',
    preguntas_simulacro_final: '50',
    duracion_minutos_test: '15',
    duracion_minutos_simulacro: '60',
  });

  assert.equal(result.numero_tests, 3);
  assert.equal(result.preguntas_por_test, 20);
  assert.equal(result.preguntas_simulacro_final, 50);
  assert.equal(result.duracion_minutos_test, 15);
  assert.equal(result.duracion_minutos_simulacro, 60);
});

test('schemas Albacer siguen rechazando ids invalidos', () => {
  assert.throws(
    () => createAlbacerModuloSchema.parse({
      oposicion_id: 'abc',
      nombre: 'Modulo inicial',
      tema_ids: ['1'],
    }),
    (error) => error.constructor.name === 'ZodError',
  );
});
