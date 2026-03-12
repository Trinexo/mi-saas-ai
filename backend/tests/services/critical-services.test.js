import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { testService } from '../../src/services/test.service.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { statsService } from '../../src/services/stats.service.js';
import { ApiError } from '../../src/utils/api-error.js';

const cloneRepoMethods = () => {
  return {
    pickQuestions: testRepository.pickQuestions,
    createTest: testRepository.createTest,
    insertTestPreguntas: testRepository.insertTestPreguntas,
    getTestById: testRepository.getTestById,
    getCorrectAnswersByTest: testRepository.getCorrectAnswersByTest,
    insertRespuesta: testRepository.insertRespuesta,
    insertResultado: testRepository.insertResultado,
    markTestAsDone: testRepository.markTestAsDone,
    updateProgress: testRepository.updateProgress,
  };
};

const restoreRepoMethods = (snapshot) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    testRepository[key] = value;
  });
};

test('generate falla si no hay preguntas suficientes', async () => {
  const repoSnapshot = cloneRepoMethods();
  testRepository.pickQuestions = async () => [];

  await assert.rejects(
    () => testService.generate({ userId: 1, temaId: 999, numeroPreguntas: 5 }),
    (error) => error instanceof ApiError && error.status === 400,
  );

  restoreRepoMethods(repoSnapshot);
});

test('generate falla si el repositorio devuelve menos preguntas que las solicitadas', async () => {
  const repoSnapshot = cloneRepoMethods();
  testRepository.pickQuestions = async () => [{ id: 1 }, { id: 2 }, { id: 3 }];

  await assert.rejects(
    () => testService.generate({ userId: 1, temaId: 1, numeroPreguntas: 5 }),
    (error) => error instanceof ApiError && error.status === 400,
  );

  restoreRepoMethods(repoSnapshot);
});

test('submit falla en respuestas duplicadas por pregunta', async () => {
  const repoSnapshot = cloneRepoMethods();
  const originalConnect = pool.connect;

  const fakeClient = {
    query: async () => ({}),
    release: () => {},
  };

  pool.connect = async () => fakeClient;
  testRepository.getTestById = async () => ({ id: 10, usuario_id: 1, estado: 'generado' });
  testRepository.getCorrectAnswersByTest = async () => new Map([[11, 101], [12, 102]]);

  await assert.rejects(
    () =>
      testService.submit({
        userId: 1,
        testId: 10,
        tiempoSegundos: 50,
        respuestas: [
          { preguntaId: 11, respuestaId: 101 },
          { preguntaId: 11, respuestaId: 101 },
        ],
      }),
    (error) => error instanceof ApiError && error.status === 400,
  );

  pool.connect = originalConnect;
  restoreRepoMethods(repoSnapshot);
});

test('submit falla si hay pregunta que no pertenece al test', async () => {
  const repoSnapshot = cloneRepoMethods();
  const originalConnect = pool.connect;

  const fakeClient = {
    query: async () => ({}),
    release: () => {},
  };

  pool.connect = async () => fakeClient;
  testRepository.getTestById = async () => ({ id: 20, usuario_id: 1, estado: 'generado' });
  testRepository.getCorrectAnswersByTest = async () => new Map([[21, 201], [22, 202]]);

  await assert.rejects(
    () =>
      testService.submit({
        userId: 1,
        testId: 20,
        tiempoSegundos: 90,
        respuestas: [{ preguntaId: 9999, respuestaId: 202 }],
      }),
    (error) => error instanceof ApiError && error.status === 400,
  );

  pool.connect = originalConnect;
  restoreRepoMethods(repoSnapshot);
});

test('stats por tema exige temaId válido', async () => {
  await assert.rejects(
    () => statsService.getTemaStats(1, Number.NaN),
    (error) => error instanceof ApiError && error.status === 400,
  );
});

test('submit permite enviar el test completamente en blanco', async () => {
  const repoSnapshot = cloneRepoMethods();
  const originalConnect = pool.connect;

  const recorded = {
    resultado: null,
    progreso: null,
    testDone: null,
  };

  const fakeClient = {
    query: async () => ({}),
    release: () => {},
  };

  pool.connect = async () => fakeClient;
  testRepository.getTestById = async () => ({ id: 30, usuario_id: 1, estado: 'generado' });
  testRepository.getCorrectAnswersByTest = async () => new Map([[31, 301], [32, 302], [33, 303]]);
  testRepository.insertRespuesta = async () => {};
  testRepository.insertResultado = async (_client, payload) => {
    recorded.resultado = payload;
  };
  testRepository.markTestAsDone = async (_client, testId) => {
    recorded.testDone = testId;
  };
  testRepository.updateProgress = async (_client, payload) => {
    recorded.progreso = payload;
  };

  const result = await testService.submit({
    userId: 1,
    testId: 30,
    tiempoSegundos: 120,
    respuestas: [],
  });

  assert.equal(result.aciertos, 0);
  assert.equal(result.errores, 0);
  assert.equal(result.blancos, 3);
  assert.equal(result.nota, 0);
  assert.equal(recorded.resultado.blancos, 3);
  assert.equal(recorded.testDone, 30);
  assert.deepEqual(recorded.progreso, { userId: 1, testId: 30 });

  pool.connect = originalConnect;
  restoreRepoMethods(repoSnapshot);
});
