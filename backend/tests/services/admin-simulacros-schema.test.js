import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asignarPreguntasSchema,
  bloqueIdParamSchema,
  createBloqueSchema,
  createSimulacroSchema,
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
