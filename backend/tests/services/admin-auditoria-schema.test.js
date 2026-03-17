import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { listAuditoriaQuerySchema } from '../../src/schemas/admin.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

test('auditoria query: acepta sin filtros (usa defaults)', () => {
  const middleware = validate(listAuditoriaQuerySchema, 'query');
  const req = { query: {} };

  let nextCalled = false;
  middleware(req, {}, () => { nextCalled = true; });

  assert.ok(nextCalled);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.page_size, 50);
});

test('auditoria query: acepta filtros válidos', () => {
  const middleware = validate(listAuditoriaQuerySchema, 'query');
  const req = { query: { pregunta_id: '42', accion: 'update', page: '2', page_size: '10' } };

  let nextCalled = false;
  middleware(req, {}, () => { nextCalled = true; });

  assert.ok(nextCalled);
  assert.equal(req.query.pregunta_id, 42);
  assert.equal(req.query.accion, 'update');
  assert.equal(req.query.page, 2);
  assert.equal(req.query.page_size, 10);
});

test('auditoria query: rechaza accion no permitida', () => {
  const middleware = validate(listAuditoriaQuerySchema, 'query');
  const req = { query: { accion: 'import' } };

  let capturedError;
  middleware(req, {}, (error) => { capturedError = error; });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('auditoria query: rechaza page_size fuera de rango', () => {
  const middleware = validate(listAuditoriaQuerySchema, 'query');
  const req = { query: { page_size: '200' } };

  let capturedError;
  middleware(req, {}, (error) => { capturedError = error; });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
});
