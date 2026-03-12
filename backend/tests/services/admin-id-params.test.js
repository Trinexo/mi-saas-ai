import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { idParamSchema } from '../../src/schemas/admin.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

test('admin params id: rechaza id no numérico', () => {
  const middleware = validate(idParamSchema, 'params');
  const req = { params: { id: 'abc' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Parámetros inválidos');
});

test('admin params id: rechaza id no positivo', () => {
  const middleware = validate(idParamSchema, 'params');
  const req = { params: { id: '0' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Parámetros inválidos');
});

test('admin params id: acepta y normaliza id válido', () => {
  const middleware = validate(idParamSchema, 'params');
  const req = { params: { id: '42' } };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.params.id, 42);
});
