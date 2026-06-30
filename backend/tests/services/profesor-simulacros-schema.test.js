import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asignarPreguntasProfesorSchema,
  bloqueIdParamSchema,
  createBloqueProfesorSchema,
  createSimulacroProfesorSchema,
  misSimulacrosQuerySchema,
  updateBloqueProfesorSchema,
} from '../../src/schemas/profesorSimulacros.schema.js';

test('misSimulacrosQuerySchema normaliza filtros paginados', () => {
  const result = misSimulacrosQuerySchema.parse({
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

test('createSimulacroProfesorSchema normaliza numeros de formulario', () => {
  const result = createSimulacroProfesorSchema.parse({
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

test('createBloqueProfesorSchema normaliza orden y numero de preguntas', () => {
  const result = createBloqueProfesorSchema.parse({
    nombre: 'Bloque 1',
    orden: '0',
    numero_preguntas: '25',
  });

  assert.equal(result.orden, 0);
  assert.equal(result.numero_preguntas, 25);
});

test('updateBloqueProfesorSchema rechaza payload vacio y normaliza parcial', () => {
  assert.equal(updateBloqueProfesorSchema.safeParse({}).success, false);

  const result = updateBloqueProfesorSchema.parse({ numero_preguntas: '30' });
  assert.equal(result.numero_preguntas, 30);
});

test('asignarPreguntasProfesorSchema normaliza ids de preguntas', () => {
  const result = asignarPreguntasProfesorSchema.parse({ pregunta_ids: ['1', '2'] });
  assert.deepEqual(result.pregunta_ids, [1, 2]);
});

test('params de simulacro profesor normalizan ids', () => {
  const result = bloqueIdParamSchema.parse({ id: '3', bloqueId: '4' });
  assert.deepEqual(result, { id: 3, bloqueId: 4 });
});

test('schemas de simulacro profesor rechazan valores invalidos', () => {
  assert.equal(misSimulacrosQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(createSimulacroProfesorSchema.safeParse({ nombre: 'Ok', penalizacion: '2' }).success, false);
  assert.equal(asignarPreguntasProfesorSchema.safeParse({ pregunta_ids: ['abc'] }).success, false);
});
