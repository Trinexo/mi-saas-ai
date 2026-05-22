import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../../src/middleware/validate.middleware.js';
import { materiasQuerySchema, preguntasQuerySchema, temasQuerySchema } from '../../src/schemas/catalog.schema.js';
import { ApiError } from '../../src/utils/api-error.js';
import { catalogHierarchyService } from '../../src/services/catalogHierarchy.service.js';
import { catalogRepository } from '../../src/repositories/catalog.repository.js';
import { catalogAdminService } from '../../src/services/catalogAdmin.service.js';
import { catalogAdminRepository } from '../../src/repositories/catalogAdmin.repository.js';

const originalGetOposiciones = catalogRepository.getOposiciones;
const originalCreateTema = catalogAdminRepository.createTema;
const originalSyncTemaIdSequence = catalogAdminRepository.syncTemaIdSequence;

test.afterEach(() => {
  catalogRepository.getOposiciones = originalGetOposiciones;
  catalogAdminRepository.createTema = originalCreateTema;
  catalogAdminRepository.syncTemaIdSequence = originalSyncTemaIdSequence;
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

test('admin catalog temas: resincroniza secuencia y reintenta si choca temas_pkey', async () => {
  let createCalls = 0;
  let syncCalls = 0;

  catalogAdminRepository.createTema = async () => {
    createCalls += 1;
    if (createCalls === 1) {
      const error = new Error('duplicate key value violates unique constraint "temas_pkey"');
      error.code = '23505';
      error.constraint = 'temas_pkey';
      throw error;
    }
    return { id: 32, oposicion_id: 7, nombre: 'Tema nuevo' };
  };
  catalogAdminRepository.syncTemaIdSequence = async () => {
    syncCalls += 1;
  };

  const result = await catalogAdminService.createTema(7, 'Tema nuevo');

  assert.deepEqual(result, { id: 32, oposicion_id: 7, nombre: 'Tema nuevo' });
  assert.equal(createCalls, 2);
  assert.equal(syncCalls, 1);
});

test('admin catalog temas: resincroniza si la PK conserva nombre legacy materias_pkey', async () => {
  let createCalls = 0;
  let syncCalls = 0;

  catalogAdminRepository.createTema = async () => {
    createCalls += 1;
    if (createCalls === 1) {
      const error = new Error('duplicate key value violates unique constraint "materias_pkey"');
      error.code = '23505';
      error.constraint = 'materias_pkey';
      throw error;
    }
    return { id: 32, oposicion_id: 7, nombre: 'Tema nuevo' };
  };
  catalogAdminRepository.syncTemaIdSequence = async () => {
    syncCalls += 1;
  };

  const result = await catalogAdminService.createTema(7, 'Tema nuevo');

  assert.deepEqual(result, { id: 32, oposicion_id: 7, nombre: 'Tema nuevo' });
  assert.equal(createCalls, 2);
  assert.equal(syncCalls, 1);
});

test('admin catalog temas: resincroniza si postgres informa table=temas', async () => {
  let createCalls = 0;
  let syncCalls = 0;

  catalogAdminRepository.createTema = async () => {
    createCalls += 1;
    if (createCalls === 1) {
      const error = new Error('duplicate key value violates unique constraint "primary"');
      error.code = '23505';
      error.table = 'temas';
      throw error;
    }
    return { id: 33, oposicion_id: 7, nombre: 'Tema nuevo' };
  };
  catalogAdminRepository.syncTemaIdSequence = async () => {
    syncCalls += 1;
  };

  const result = await catalogAdminService.createTema(7, 'Tema nuevo');

  assert.deepEqual(result, { id: 33, oposicion_id: 7, nombre: 'Tema nuevo' });
  assert.equal(createCalls, 2);
  assert.equal(syncCalls, 1);
});

test('admin catalog temas: no reintenta duplicados que no son drift de secuencia', async () => {
  catalogAdminRepository.createTema = async () => {
    const error = new Error('duplicate topic name');
    error.code = '23505';
    error.constraint = 'temas_oposicion_id_nombre_key';
    throw error;
  };
  catalogAdminRepository.syncTemaIdSequence = async () => {
    throw new Error('no deberia sincronizar');
  };

  await assert.rejects(
    () => catalogAdminService.createTema(7, 'Tema repetido'),
    (error) => error.code === '23505' && error.constraint === 'temas_oposicion_id_nombre_key',
  );
});
