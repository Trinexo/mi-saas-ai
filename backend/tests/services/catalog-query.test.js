import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { materiasQuerySchema, preguntasQuerySchema, temasQuerySchema } from '../../src/schemas/catalog.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

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
