import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { listReportesQuerySchema } from '../../src/schemas/admin.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

test('admin reportes query: rechaza page_size fuera de rango', () => {
  const middleware = validate(listReportesQuerySchema, 'query');
  const req = { query: { page: '1', page_size: '0' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('admin reportes query: acepta y normaliza valores válidos', () => {
  const middleware = validate(listReportesQuerySchema, 'query');
  const req = { query: { page: '2', page_size: '25', estado: 'abierto' } };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 2);
  assert.equal(req.query.page_size, 25);
  assert.equal(req.query.estado, 'abierto');
});

test('admin reportes query: aplica defaults', () => {
  const middleware = validate(listReportesQuerySchema, 'query');
  const req = { query: {} };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.page_size, 20);
  assert.equal(req.query.estado, undefined);
});
