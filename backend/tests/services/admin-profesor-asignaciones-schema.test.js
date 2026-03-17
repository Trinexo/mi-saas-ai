import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import {
  profesorAsignacionesQuerySchema,
  profesorOposicionPayloadSchema,
} from '../../src/schemas/admin.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

test('profesor asignaciones query: rechaza email inválido', () => {
  const middleware = validate(profesorAsignacionesQuerySchema, 'query');
  const req = { query: { email: 'email-invalido' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('profesor payload: acepta y normaliza oposicionId', () => {
  const middleware = validate(profesorOposicionPayloadSchema, 'body');
  const req = { body: { email: 'profe@test.com', oposicionId: '2' } };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.email, 'profe@test.com');
  assert.equal(req.body.oposicionId, 2);
});

test('profesor payload: rechaza oposicionId no positivo', () => {
  const middleware = validate(profesorOposicionPayloadSchema, 'body');
  const req = { body: { email: 'profe@test.com', oposicionId: 0 } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Payload inválido');
});