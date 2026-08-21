import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asignarPreguntasSchema,
  bloqueIdParamSchema,
  createBloqueSchema,
  createSimulacroSchema,
  configuracionPreguntasSchema,
  listSimulacrosQuerySchema,
  updateBloqueSchema,
  updateSimulacroSchema,
} from '../../src/schemas/adminSimulacros.schema.js';

test('listSimulacrosQuerySchema normaliza filtros paginados', () => {
  const result = listSimulacrosQuerySchema.parse({
    oposicion_id: '7',
    page: '2',
    page_size: '50',
    estado: 'publicado',
  });

  assert.equal(result.oposicion_id, 7);
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
  assert.equal(result.estado, 'publicado');
});

test('createSimulacroSchema normaliza numeros de formulario', () => {
  const result = createSimulacroSchema.parse({
    nombre: 'Simulacro oficial',
    oposicion_id: '12',
    tiempo_limite_segundos: '3600',
    puntuacion_maxima: '100',
    penalizacion: '0.25',
  });

  assert.equal(result.oposicion_id, 12);
  assert.equal(result.tiempo_limite_segundos, 3600);
  assert.equal(result.puntuacion_maxima, 100);
  assert.equal(result.penalizacion, 0.25);
});

test('updateSimulacroSchema normaliza numeros parciales', () => {
  const result = updateSimulacroSchema.parse({
    oposicion_id: '12',
    tiempo_limite_segundos: '1800',
    puntuacion_maxima: '80',
    penalizacion: '0.5',
  });

  assert.equal(result.oposicion_id, 12);
  assert.equal(result.tiempo_limite_segundos, 1800);
  assert.equal(result.puntuacion_maxima, 80);
  assert.equal(result.penalizacion, 0.5);
});

test('createBloqueSchema normaliza orden y numero de preguntas', () => {
  const result = createBloqueSchema.parse({
    nombre: 'Bloque 1',
    orden: '0',
    numero_preguntas: '25',
  });

  assert.equal(result.orden, 0);
  assert.equal(result.numero_preguntas, 25);
});

test('updateBloqueSchema rechaza payload vacio y normaliza parcial', () => {
  assert.equal(updateBloqueSchema.safeParse({}).success, false);

  const result = updateBloqueSchema.parse({ numero_preguntas: '30' });
  assert.equal(result.numero_preguntas, 30);
});

test('asignarPreguntasSchema normaliza ids de preguntas', () => {
  const result = asignarPreguntasSchema.parse({ pregunta_ids: ['1', '2'] });
  assert.deepEqual(result.pregunta_ids, [1, 2]);
});

test('params de simulacro admin normalizan ids', () => {
  const result = bloqueIdParamSchema.parse({ id: '3', bloqueId: '4' });
  assert.deepEqual(result, { id: 3, bloqueId: 4 });
});

test('schemas de simulacro admin rechazan valores invalidos', () => {
  assert.equal(listSimulacrosQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(createSimulacroSchema.safeParse({ nombre: 'Ok', penalizacion: '-1' }).success, false);
  assert.equal(asignarPreguntasSchema.safeParse({ pregunta_ids: ['abc'] }).success, false);
});

test('configuracion simplificada exige temas y reparto exacto cuando procede', () => {
  const value = configuracionPreguntasSchema.parse({
    total_preguntas: '5', tema_ids: ['10', '11'], dificultad: null,
    officialidad: 'all', reparto_por_tema: true,
    reparto: [{ tema_id: '10', cantidad: 2 }, { tema_id: '11', cantidad: 3 }],
  });
  assert.deepEqual(value.tema_ids, [10, 11]);
  assert.equal(value.total_preguntas, 5);
  assert.equal(configuracionPreguntasSchema.safeParse({
    total_preguntas: 5, tema_ids: [10, 11], reparto_por_tema: true,
    reparto: [{ tema_id: 10, cantidad: 4 }],
  }).success, false);
  assert.equal(configuracionPreguntasSchema.safeParse({
    total_preguntas: 5, tema_ids: [10], officialidad: 'all', anio_ids: [2],
  }).success, false);
});

test('configuracion simplificada conserva varios exámenes oficiales', () => {
  const result = configuracionPreguntasSchema.parse({
    total_preguntas: 4,
    tema_ids: [10, 11],
    officialidad: 'official',
    anio_ids: [20],
    examen_ids: ['30', '31'],
  });
  assert.deepEqual(result.examen_ids, [30, 31]);
});

test('configuracion simplificada conserva IDs BIGINT fuera del rango seguro', () => {
  const result = configuracionPreguntasSchema.parse({
    total_preguntas: 1,
    tema_ids: ['9007199254740993'],
    officialidad: 'official',
    anio_ids: ['9007199254740994'],
    examen_ids: ['9007199254740995'],
  });
  assert.deepEqual(result.tema_ids, ['9007199254740993']);
  assert.deepEqual(result.anio_ids, ['9007199254740994']);
  assert.deepEqual(result.examen_ids, ['9007199254740995']);
});
