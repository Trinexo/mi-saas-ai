import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { listPreguntasQuerySchema } from '../../src/schemas/admin.schema.js';
import { ApiError } from '../../src/utils/api-error.js';

test('admin preguntas query: rechaza page_size fuera de rango', () => {
  const middleware = validate(listPreguntasQuerySchema, 'query');
  const req = { query: { page: '1', page_size: '0' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('admin preguntas query: rechaza nivel_dificultad inválido', () => {
  const middleware = validate(listPreguntasQuerySchema, 'query');
  const req = { query: { nivel_dificultad: '7' } };

  let capturedError;
  middleware(req, {}, (error) => {
    capturedError = error;
  });

  assert.ok(capturedError instanceof ApiError);
  assert.equal(capturedError.status, 400);
  assert.equal(capturedError.message, 'Query inválida');
});

test('admin preguntas query: acepta y normaliza filtros válidos', () => {
  const middleware = validate(listPreguntasQuerySchema, 'query');
  const req = {
    query: {
      page: '2',
      page_size: '30',
      oposicion_id: '1',
      materia_id: '2',
      tema_id: '3',
      nivel_dificultad: '4',
    },
  };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 2);
  assert.equal(req.query.page_size, 30);
  assert.equal(req.query.oposicion_id, 1);
  assert.equal(req.query.materia_id, 2);
  assert.equal(req.query.tema_id, 3);
  assert.equal(req.query.nivel_dificultad, 4);
});

test('admin preguntas query: aplica defaults en paginación', () => {
  const middleware = validate(listPreguntasQuerySchema, 'query');
  const req = { query: {} };

  let nextCalled = false;
  middleware(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.page_size, 20);
});
