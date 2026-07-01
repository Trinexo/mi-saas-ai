import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actividadFeedQuerySchema,
  planificacionIdParamSchema,
  preguntasProblematicasQuerySchema,
  workspaceAlumnosQuerySchema,
  workspaceListQuerySchema,
} from '../../src/schemas/profesorWorkspace.schema.js';

test('workspaceListQuerySchema normaliza filtros paginados', () => {
  const result = workspaceListQuerySchema.parse({
    oposicion_id: '12',
    dias: '30',
    page: '2',
    page_size: '50',
  });

  assert.equal(result.oposicion_id, 12);
  assert.equal(result.dias, 30);
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
});

test('workspaceAlumnosQuerySchema mantiene filtros textuales y normaliza ids', () => {
  const result = workspaceAlumnosQuerySchema.parse({
    oposicion_id: '7',
    q: 'ana',
    estado: 'activo',
  });

  assert.equal(result.oposicion_id, 7);
  assert.equal(result.q, 'ana');
  assert.equal(result.estado, 'activo');
});

test('preguntasProblematicasQuerySchema normaliza tema_id', () => {
  const result = preguntasProblematicasQuerySchema.parse({
    oposicion_id: '3',
    tema_id: '9',
  });

  assert.equal(result.oposicion_id, 3);
  assert.equal(result.tema_id, 9);
});

test('actividadFeedQuerySchema normaliza alumno_id y valida tipo', () => {
  const result = actividadFeedQuerySchema.parse({
    alumno_id: '15',
    tipo: 'reporte',
  });

  assert.equal(result.alumno_id, 15);
  assert.equal(result.tipo, 'reporte');
});

test('planificacionIdParamSchema normaliza id', () => {
  const result = planificacionIdParamSchema.parse({ id: '8' });
  assert.deepEqual(result, { id: 8 });
});

test('schemas del workspace profesor rechazan valores invalidos', () => {
  assert.equal(workspaceListQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(workspaceListQuerySchema.safeParse({ dias: '3' }).success, false);
  assert.equal(workspaceListQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(actividadFeedQuerySchema.safeParse({ tipo: 'login' }).success, false);
  assert.equal(planificacionIdParamSchema.safeParse({ id: 'abc' }).success, false);
});
