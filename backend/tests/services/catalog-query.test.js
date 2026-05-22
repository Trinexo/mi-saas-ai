import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { materiasQuerySchema, preguntasQuerySchema, temasQuerySchema } from '../../src/schemas/catalog.schema.js';
import { ApiError } from '../../src/utils/api-error.js';
import { catalogHierarchyService } from '../../src/services/catalogHierarchy.service.js';
import { catalogRepository } from '../../src/repositories/catalog.repository.js';

const originalGetOposiciones = catalogRepository.getOposiciones;

test.afterEach(() => {
  catalogRepository.getOposiciones = originalGetOposiciones;
});

test('catalog materias query: rechaza oposicion_id inválido', () => {
  const middleware = validate(materiasQuerySchema, 'query');
  const req = { query: { oposicion_id: '0' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('catalog temas query: acepta materia_id válido', () => {
  const middleware = validate(temasQuerySchema, 'query');
  const req = { query: { materia_id: '3' } };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.materia_id, 3);
});

test('catalog preguntas query: rechaza page_size fuera de rango', () => {
  const middleware = validate(preguntasQuerySchema, 'query');
  const req = { query: { tema_id: '1', page_size: '101' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('catalog preguntas query: aplica defaults y coerción', () => {
  const middleware = validate(preguntasQuerySchema, 'query');
  const req = { query: { tema_id: '7' } };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.tema_id, 7);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.page_size, 20);
});

test('catalog oposiciones: admin y profesor incluyen oposiciones sin preguntas', async () => {
  const calls = [];
  catalogRepository.getOposiciones = async (params) => {
    calls.push(params);
    return [];
  };

  await catalogHierarchyService.getOposiciones({ user: { role: 'admin' } });
  await catalogHierarchyService.getOposiciones({ user: { role: 'profesor' } });

  assert.deepEqual(calls, [{ includeEmpty: true }, { includeEmpty: true }]);
});

test('catalog oposiciones: alumno y anonimo mantienen filtro de preguntas', async () => {
  const calls = [];
  catalogRepository.getOposiciones = async (params) => {
    calls.push(params);
    return [];
  };

  await catalogHierarchyService.getOposiciones({ user: { role: 'alumno' } });
  await catalogHierarchyService.getOposiciones();

  assert.deepEqual(calls, [{ includeEmpty: false }, { includeEmpty: false }]);
});
