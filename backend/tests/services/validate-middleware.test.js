import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.middleware.js';
import { ApiError } from '../../src/utils/api-error.js';

test('validate usa mensaje de error para query inválida', () => {
  const middleware = validate(z.object({ tema_id: z.coerce.number().int().positive() }), 'query');
  const req = { query: { tema_id: 'abc' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
  assert.ok(capturedError.details);
});

test('validate usa mensaje de error para parámetros inválidos', () => {
  const middleware = validate(z.object({ id: z.coerce.number().int().positive() }), 'params');
  const req = { params: { id: '0' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Parámetros inválidos');
  assert.ok(capturedError.details);
});

test('validate mantiene payload inválido para body', () => {
  const middleware = validate(z.object({ email: z.string().email() }), 'body');
  const req = { body: { email: 'correo-invalido' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Payload inválido');
  assert.ok(capturedError.details);
});

test('validate parsea y sobrescribe request cuando es válido', () => {
  const middleware = validate(z.object({ tema_id: z.coerce.number().int().positive() }), 'query');
  const req = { query: { tema_id: '7' } };

  let wasNextCalled = false;
  middleware(req, {}, () => {
    wasNextCalled = true;
  });

  assert.equal(wasNextCalled, true);
  assert.equal(req.query.tema_id, 7);
});
