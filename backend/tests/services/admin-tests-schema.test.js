import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPreguntasTestSchema,
  createTestSchema,
  listTestsQuerySchema,
  setDemoTestSchema,
  testPreguntaParamSchema,
  updateTestSchema,
} from '../../src/schemas/adminTests.schema.js';

test('listTestsQuerySchema normaliza filtros paginados', () => {
  const result = listTestsQuerySchema.parse({
    q: ' demo ',
    estado: 'publicado',
    oposicion_id: '4',
    page: '2',
    page_size: '50',
  });

  assert.equal(result.q, 'demo');
  assert.equal(result.estado, 'publicado');
  assert.equal(result.oposicion_id, 4);
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
});

test('createTestSchema normaliza numeros de formulario', () => {
  const result = createTestSchema.parse({
    nombre: 'Test demo',
    oposicion_id: '10',
    tema_id: '20',
    tema_ids: ['20', '21'],
    duracion_minutos: '45',
    pts_acierto: '1',
    pts_fallo: '-0.25',
    pts_blanco: '0',
  });

  assert.equal(result.oposicion_id, 10);
  assert.equal(result.tema_id, 20);
  assert.deepEqual(result.tema_ids, [20, 21]);
  assert.equal(result.duracion_minutos, 45);
  assert.equal(result.pts_acierto, 1);
  assert.equal(result.pts_fallo, -0.25);
  assert.equal(result.pts_blanco, 0);
  assert.equal(result.estado, 'borrador');
});

test('updateTestSchema permite payload parcial y normaliza campos', () => {
  const result = updateTestSchema.parse({
    oposicion_id: '8',
    tema_ids: ['30'],
    duracion_minutos: '20',
    tipo_puntuacion: 'personalizada',
    pts_fallo: '-0.5',
  });

  assert.equal(result.oposicion_id, 8);
  assert.deepEqual(result.tema_ids, [30]);
  assert.equal(result.duracion_minutos, 20);
  assert.equal(result.tipo_puntuacion, 'personalizada');
  assert.equal(result.pts_fallo, -0.5);
});

test('updateTestSchema rechaza payload vacio', () => {
  assert.equal(updateTestSchema.safeParse({}).success, false);
});

test('addPreguntasTestSchema normaliza ids de preguntas', () => {
  const result = addPreguntasTestSchema.parse({ pregunta_ids: ['1', '2', 3] });
  assert.deepEqual(result.pregunta_ids, [1, 2, 3]);
});

test('params de test admin normalizan ids', () => {
  const result = testPreguntaParamSchema.parse({ id: '5', preguntaId: '6' });
  assert.deepEqual(result, { id: 5, preguntaId: 6 });
});

test('setDemoTestSchema exige boolean real', () => {
  assert.deepEqual(setDemoTestSchema.parse({ es_demo: true }), { es_demo: true });
  assert.equal(setDemoTestSchema.safeParse({ es_demo: 'true' }).success, false);
});

test('schemas de test admin rechazan valores invalidos', () => {
  assert.equal(listTestsQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(createTestSchema.safeParse({ nombre: '', oposicion_id: '1' }).success, false);
  assert.equal(addPreguntasTestSchema.safeParse({ pregunta_ids: [] }).success, false);
  assert.equal(testPreguntaParamSchema.safeParse({ id: 'abc', preguntaId: '1' }).success, false);
});
