import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';
import { ApiError } from '../../src/utils/api-error.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const cloneRepo = () => ({
  pickFreshQuestions: testRepository.pickFreshQuestions,
  pickAdaptiveQuestions: testRepository.pickAdaptiveQuestions,
  pickAnyQuestions: testRepository.pickAnyQuestions,
  createTest: testRepository.createTest,
  insertTestPreguntas: testRepository.insertTestPreguntas,
});

const restoreRepo = (snap) => {
  Object.entries(snap).forEach(([k, v]) => { testRepository[k] = v; });
};

const pregunta = (id, nivel) => ({
  id,
  nivel_dificultad: nivel,
  enunciado: `Pregunta ${id}`,
  opciones: [{ id: id * 10, texto: 'A' }],
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('testRepository — filtro nivelDificultad', () => {
  it('pickFreshQuestions acepta parámetro nivelDificultad', () => {
    assert.equal(testRepository.pickFreshQuestions.toString().includes('nivelDificultad'), true);
  });

  it('pickAdaptiveQuestions acepta parámetro nivelDificultad', () => {
    assert.equal(testRepository.pickAdaptiveQuestions.toString().includes('nivelDificultad'), true);
  });

  it('pickAnyQuestions acepta parámetro nivelDificultad', () => {
    assert.equal(testRepository.pickAnyQuestions.toString().includes('nivelDificultad'), true);
  });
});

describe('testService.generate — dificultad específica', () => {
  it('en modo "facil" llama al picker con nivelDificultad = 1', async () => {
    const snap = cloneRepo();
    const llamadas = [];

    testRepository.pickAdaptiveQuestions = async (params) => {
      llamadas.push(params);
      return [pregunta(1, 1), pregunta(2, 1)];
    };
    testRepository.createTest = async () => ({ id: 99 });
    testRepository.insertTestPreguntas = async () => {};

    await testService.generate({ userId: 1, temaId: 1, numeroPreguntas: 2, dificultad: 'facil' });

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].nivelDificultad, 1);
    restoreRepo(snap);
  });

  it('en modo "dificil" llama al picker con nivelDificultad = 3', async () => {
    const snap = cloneRepo();
    const llamadas = [];

    testRepository.pickAdaptiveQuestions = async (params) => {
      llamadas.push(params);
      return [pregunta(1, 3), pregunta(2, 3)];
    };
    testRepository.createTest = async () => ({ id: 99 });
    testRepository.insertTestPreguntas = async () => {};

    await testService.generate({ userId: 1, temaId: 1, numeroPreguntas: 2, dificultad: 'dificil' });

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].nivelDificultad, 3);
    restoreRepo(snap);
  });
});

describe('testService.generate — dificultad mixto, distribución 40/30/30', () => {
  it('para 10 preguntas: 4 media, 3 fácil, 3 difícil', async () => {
    const snap = cloneRepo();
    const nivelesLlamados = [];

    testRepository.pickAdaptiveQuestions = async ({ numeroPreguntas, nivelDificultad }) => {
      nivelesLlamados.push({ nivelDificultad, cuota: numeroPreguntas });
      return Array.from({ length: numeroPreguntas }, (_, i) => pregunta(nivelDificultad * 10 + i, nivelDificultad));
    };
    testRepository.createTest = async () => ({ id: 99 });
    testRepository.insertTestPreguntas = async () => {};

    const result = await testService.generate({ userId: 1, temaId: 1, numeroPreguntas: 10 });

    assert.equal(result.numeroPreguntas, 10);
    assert.equal(nivelesLlamados.length, 3);

    const cuotaPorNivel = Object.fromEntries(nivelesLlamados.map((l) => [l.nivelDificultad, l.cuota]));
    assert.equal(cuotaPorNivel[2], 4, 'media debe ser 40% → 4');
    assert.equal(cuotaPorNivel[1], 3, 'facil debe ser 30% → 3');
    assert.equal(cuotaPorNivel[3], 3, 'dificil debe ser 30% → 3');
    restoreRepo(snap);
  });

  it('la respuesta incluye campo dificultad', async () => {
    const snap = cloneRepo();

    testRepository.pickAdaptiveQuestions = async ({ numeroPreguntas, nivelDificultad }) =>
      Array.from({ length: numeroPreguntas }, (_, i) => pregunta(nivelDificultad * 10 + i, nivelDificultad));
    testRepository.createTest = async () => ({ id: 99 });
    testRepository.insertTestPreguntas = async () => {};

    const result = await testService.generate({ userId: 1, temaId: 1, numeroPreguntas: 10, dificultad: 'mixto' });
    assert.equal(result.dificultad, 'mixto');
    restoreRepo(snap);
  });
});
