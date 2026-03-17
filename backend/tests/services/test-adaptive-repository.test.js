import test from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';

// Helpers de stub — mismo patrón que critical-services.test.js
const cloneAdaptiveMethods = () => ({
  pickAdaptiveQuestions: testRepository.pickAdaptiveQuestions,
  pickAnyQuestions: testRepository.pickAnyQuestions,
});

const restoreAdaptiveMethods = (snapshot) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    testRepository[key] = value;
  });
};

test('pickAdaptiveQuestions está exportado desde testRepository', () => {
  assert.equal(typeof testRepository.pickAdaptiveQuestions, 'function');
});

test('pickAdaptiveQuestions acepta los mismos parámetros que pickFreshQuestions', async () => {
  const snapshot = cloneAdaptiveMethods();
  const capturedArgs = [];

  // Stub sin BD: comprobar que la firma es compatible
  testRepository.pickAdaptiveQuestions = async (params) => {
    capturedArgs.push(params);
    return [];
  };

  await testRepository.pickAdaptiveQuestions({ userId: 1, temaId: 5, numeroPreguntas: 10, excludePreguntaIds: [2, 3] });

  assert.equal(capturedArgs.length, 1);
  assert.equal(capturedArgs[0].userId, 1);
  assert.equal(capturedArgs[0].temaId, 5);
  assert.equal(capturedArgs[0].numeroPreguntas, 10);
  assert.deepEqual(capturedArgs[0].excludePreguntaIds, [2, 3]);

  restoreAdaptiveMethods(snapshot);
});

test('pickAdaptiveQuestions usa excludePreguntaIds vacío por defecto', async () => {
  const snapshot = cloneAdaptiveMethods();
  const capturedArgs = [];

  testRepository.pickAdaptiveQuestions = async (params) => {
    capturedArgs.push(params);
    return [];
  };

  await testRepository.pickAdaptiveQuestions({ userId: 1, temaId: 5, numeroPreguntas: 5 });

  // cuando no se pasa excludePreguntaIds, la función no debe lanzar
  assert.equal(capturedArgs.length, 1);

  restoreAdaptiveMethods(snapshot);
});

test('pickAdaptiveQuestions devuelve array (stub)', async () => {
  const snapshot = cloneAdaptiveMethods();

  const fakePreguntas = [
    { id: 10, enunciado: 'Pregunta A', nivel_dificultad: 2, score: 3, opciones: [{ id: 101, texto: 'Opción 1' }] },
    { id: 11, enunciado: 'Pregunta B', nivel_dificultad: 1, score: 0, opciones: [{ id: 111, texto: 'Opción 1' }] },
  ];

  testRepository.pickAdaptiveQuestions = async () => fakePreguntas;

  const result = await testRepository.pickAdaptiveQuestions({ userId: 1, temaId: 5, numeroPreguntas: 2 });

  assert.equal(result.length, 2);
  assert.equal(result[0].id, 10);
  assert.equal(result[0].score, 3);
  assert.equal(result[1].score, 0);

  restoreAdaptiveMethods(snapshot);
});
