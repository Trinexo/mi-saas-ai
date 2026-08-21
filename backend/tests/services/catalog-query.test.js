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
const originalCreateOposicion = catalogAdminRepository.createOposicion;
const originalSyncOposicionIdSequence = catalogAdminRepository.syncOposicionIdSequence;
const originalCreateTema = catalogAdminRepository.createTema;
const originalSyncTemaIdSequence = catalogAdminRepository.syncTemaIdSequence;
const originalDeleteTema = catalogAdminRepository.deleteTema;
const originalGetTemaDeleteDependencies = catalogAdminRepository.getTemaDeleteDependencies;

test.afterEach(() => {
  catalogRepository.getOposiciones = originalGetOposiciones;
  catalogAdminRepository.createOposicion = originalCreateOposicion;
  catalogAdminRepository.syncOposicionIdSequence = originalSyncOposicionIdSequence;
  catalogAdminRepository.createTema = originalCreateTema;
  catalogAdminRepository.syncTemaIdSequence = originalSyncTemaIdSequence;
  catalogAdminRepository.deleteTema = originalDeleteTema;
  catalogAdminRepository.getTemaDeleteDependencies = originalGetTemaDeleteDependencies;
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

test('admin catalog oposiciones: resincroniza secuencia y reintenta si choca oposiciones_pkey', async () => {
  let createCalls = 0;
  let syncCalls = 0;

  catalogAdminRepository.createOposicion = async () => {
    createCalls += 1;
    if (createCalls === 1) {
      const error = new Error('duplicate key value violates unique constraint "oposiciones_pkey"');
      error.code = '23505';
      error.constraint = 'oposiciones_pkey';
      throw error;
    }
    return { id: 5, nombre: 'Nueva oposicion', descripcion: null };
  };
  catalogAdminRepository.syncOposicionIdSequence = async () => {
    syncCalls += 1;
  };

  const result = await catalogAdminService.createOposicion('Nueva oposicion');

  assert.deepEqual(result, { id: 5, nombre: 'Nueva oposicion', descripcion: null });
  assert.equal(createCalls, 2);
  assert.equal(syncCalls, 1);
});

test('admin catalog oposiciones: genera slug al crear una oposicion', async () => {
  let receivedSlug = null;

  catalogAdminRepository.createOposicion = async (nombre, descripcion, slug) => {
    receivedSlug = slug;
    return { id: 5, nombre, descripcion, slug };
  };

  const result = await catalogAdminService.createOposicion(
    'Auxiliar Administrativo Castilla-La Mancha',
    'Descripcion',
  );

  assert.equal(receivedSlug, 'auxiliar-administrativo-castilla-la-mancha');
  assert.equal(result.slug, receivedSlug);
});

test('admin catalog oposiciones: genera un slug alternativo si ya existe', async () => {
  const receivedSlugs = [];

  catalogAdminRepository.createOposicion = async (nombre, descripcion, slug) => {
    receivedSlugs.push(slug);
    if (receivedSlugs.length === 1) {
      const error = new Error('duplicate key value violates unique constraint "oposiciones_slug_idx"');
      error.code = '23505';
      error.constraint = 'oposiciones_slug_idx';
      throw error;
    }
    return { id: 6, nombre, descripcion, slug };
  };

  const result = await catalogAdminService.createOposicion('Auxiliar Administrativo');

  assert.equal(receivedSlugs[0], 'auxiliar-administrativo');
  assert.match(receivedSlugs[1], /^auxiliar-administrativo-[a-z0-9]+$/);
  assert.equal(result.slug, receivedSlugs[1]);
});

test('admin catalog oposiciones: no reintenta duplicados ajenos a la clave primaria', async () => {
  catalogAdminRepository.createOposicion = async () => {
    const error = new Error('duplicate opposition name');
    error.code = '23505';
    error.constraint = 'oposiciones_nombre_key';
    throw error;
  };
  catalogAdminRepository.syncOposicionIdSequence = async () => {
    throw new Error('no deberia sincronizar');
  };

  await assert.rejects(
    () => catalogAdminService.createOposicion('Oposicion repetida'),
    (error) => error.code === '23505' && error.constraint === 'oposiciones_nombre_key',
  );
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

test('admin catalog temas: elimina un tema vacío', async () => {
  let deleted = false;
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 0, colecciones: 0 });
  catalogAdminRepository.deleteTema = async (id) => {
    deleted = id === 7;
    return { id };
  };

  await assert.doesNotReject(() => catalogAdminService.deleteTema(7));
  assert.equal(deleted, true);
});

test('admin catalog temas: bloquea borrado con preguntas y conserva el contenido', async () => {
  let deleteCalls = 0;
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 27, colecciones: 0 });
  catalogAdminRepository.deleteTema = async () => { deleteCalls += 1; };

  await assert.rejects(
    () => catalogAdminService.deleteTema(7),
    (error) => error instanceof ApiError
      && error.status === 409
      && error.message === 'No se puede eliminar este tema porque tiene 27 preguntas asociadas. Reasigna o elimina las preguntas antes de eliminarlo.',
  );
  assert.equal(deleteCalls, 0);
});

test('admin catalog temas: bloquea otras dependencias protegidas y traduce una carrera FK a 409', async () => {
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 0, colecciones: 2 });
  await assert.rejects(
    () => catalogAdminService.deleteTema(7),
    (error) => error instanceof ApiError && error.status === 409 && error.message.includes('2 colecciones asociadas'),
  );

  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 0, colecciones: 0 });
  catalogAdminRepository.deleteTema = async () => {
    const error = new Error('foreign key violation');
    error.code = '23503';
    throw error;
  };
  await assert.rejects(
    () => catalogAdminService.deleteTema(7),
    (error) => error instanceof ApiError && error.status === 409 && error.message.includes('contenido asociado'),
  );
});

test('admin catalog temas: bloquea configuraciones y relaciones protegidas aunque no haya preguntas', async () => {
  let deleteCalls = 0;
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({
    preguntas: 0,
    colecciones: 0,
    simulacros_configuracion_temas: 1,
  });
  catalogAdminRepository.deleteTema = async () => { deleteCalls += 1; };

  await assert.rejects(
    () => catalogAdminService.deleteTema(7),
    (error) => error instanceof ApiError
      && error.status === 409
      && error.message.includes('1 configuraciones de simulacros'),
  );
  assert.equal(deleteCalls, 0);
});

test('admin catalog temas: no convierte errores ajenos a integridad en 409', async () => {
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 0, colecciones: 0 });
  catalogAdminRepository.deleteTema = async () => {
    const error = new Error('database unavailable');
    error.code = '57P01';
    throw error;
  };

  await assert.rejects(
    () => catalogAdminService.deleteTema(7),
    (error) => error.code === '57P01' && error.status === undefined,
  );
});

test('admin catalog temas: mantiene 404 para un tema inexistente', async () => {
  catalogAdminRepository.getTemaDeleteDependencies = async () => ({ preguntas: 0, colecciones: 0 });
  catalogAdminRepository.deleteTema = async () => null;

  await assert.rejects(
    () => catalogAdminService.deleteTema(999),
    (error) => error instanceof ApiError && error.status === 404 && error.message === 'Tema no encontrado',
  );
});
