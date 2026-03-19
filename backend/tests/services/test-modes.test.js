/**
 * Sprint 9 PR 01 — Modos simulacro, marcadas y refuerzo
 * Cubre: schema, repository exports y service routing por modo
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema, generateRefuerzoSchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

// ── generateTestSchema — nuevos modos ────────────────────────────────────────

describe('generateTestSchema — modo simulacro', () => {
  it('simulacro + oposicionId es válido', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', oposicionId: 1, numeroPreguntas: 50 });
    assert.equal(r.success, true);
  });

  it('simulacro sin oposicionId falla', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', numeroPreguntas: 50 });
    assert.equal(r.success, false);
  });

  it('simulacro con duracionSegundos es válido', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', oposicionId: 1, numeroPreguntas: 60, duracionSegundos: 3600 });
    assert.equal(r.success, true);
    assert.equal(r.data.duracionSegundos, 3600);
  });

  it('simulacro sin temaId es válido (oposición lo reemplaza)', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', oposicionId: 2, numeroPreguntas: 30 });
    assert.equal(r.success, true);
    assert.equal(r.data.temaId, undefined);
  });
});

describe('generateTestSchema — modo marcadas', () => {
  it('marcadas sin temaId es válido', () => {
    const r = generateTestSchema.safeParse({ modo: 'marcadas', numeroPreguntas: 10 });
    assert.equal(r.success, true);
  });

  it('marcadas con temaId también es válido', () => {
    const r = generateTestSchema.safeParse({ modo: 'marcadas', temaId: 5, numeroPreguntas: 10 });
    assert.equal(r.success, true);
  });
});

describe('generateTestSchema — retrocompatibilidad', () => {
  it('adaptativo+temaId sigue funcionando', () => {
    const r = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 10 });
    assert.equal(r.success, true);
    assert.equal(r.data.modo, 'adaptativo');
  });

  it('normal sin temaId falla', () => {
    const r = generateTestSchema.safeParse({ modo: 'normal', numeroPreguntas: 10 });
    assert.equal(r.success, false);
  });

  it('acepta numeroPreguntas hasta 200', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', oposicionId: 1, numeroPreguntas: 200 });
    assert.equal(r.success, true);
  });

  it('rechaza numeroPreguntas 0', () => {
    const r = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 0 });
    assert.equal(r.success, false);
  });
});

// ── generateRefuerzoSchema ────────────────────────────────────────────────────

describe('generateRefuerzoSchema', () => {
  it('temaId es opcional', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 10 });
    assert.equal(r.success, true);
    assert.equal(r.data.temaId, undefined);
  });

  it('con temaId es válido', () => {
    const r = generateRefuerzoSchema.safeParse({ temaId: 3, numeroPreguntas: 10 });
    assert.equal(r.success, true);
    assert.equal(r.data.temaId, 3);
  });

  it('numeroPreguntas tiene default 10', () => {
    const r = generateRefuerzoSchema.safeParse({});
    assert.equal(r.success, true);
    assert.equal(r.data.numeroPreguntas, 10);
  });

  it('rechaza numeroPreguntas > 100', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 101 });
    assert.equal(r.success, false);
  });

  it('rechaza numeroPreguntas 0', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 0 });
    assert.equal(r.success, false);
  });
});

// ── testRepository — nuevos métodos ──────────────────────────────────────────

describe('testRepository — modos nuevos', () => {
  it('pickSimulacroQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickSimulacroQuestions, 'function');
  });

  it('pickMarcadasQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickMarcadasQuestions, 'function');
  });

  it('pickRefuerzoQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickRefuerzoQuestions, 'function');
  });

  it('createTest acepta tipoTest en su firma', () => {
    assert.ok(testRepository.createTest.toString().includes('tipoTest'));
  });

  it('getUserHistory está exportado', () => {
    assert.equal(typeof testRepository.getUserHistory, 'function');
  });
});

// ── testService — nuevos métodos ──────────────────────────────────────────────

describe('testService — nuevos métodos', () => {
  it('generateRefuerzo está exportado', () => {
    assert.equal(typeof testService.generateRefuerzo, 'function');
  });
});

// ── testService.generate — routing por modo ───────────────────────────────────

describe('testService.generate — modo simulacro', () => {
  it('usa pickSimulacroQuestions cuando modo es simulacro', async () => {
    const orig = {
      pickSimulacroQuestions: testRepository.pickSimulacroQuestions,
      createTest: testRepository.createTest,
      insertTestPreguntas: testRepository.insertTestPreguntas,
    };

    const llamadas = [];
    testRepository.pickSimulacroQuestions = async (params) => {
      llamadas.push(params);
      return [{ id: 1, enunciado: 'Q1', nivel_dificultad: 1, opciones: [{ id: 10, texto: 'A' }] }];
    };
    testRepository.createTest = async () => ({ id: 99 });
    testRepository.insertTestPreguntas = async () => {};

    await testService.generate({ userId: 1, oposicionId: 2, numeroPreguntas: 1, modo: 'simulacro' });

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].oposicionId, 2);

    Object.assign(testRepository, orig);
  });
});

describe('testService.generate — modo marcadas', () => {
  it('usa pickMarcadasQuestions cuando modo es marcadas', async () => {
    const orig = {
      pickMarcadasQuestions: testRepository.pickMarcadasQuestions,
      createTest: testRepository.createTest,
      insertTestPreguntas: testRepository.insertTestPreguntas,
    };

    const llamadas = [];
    testRepository.pickMarcadasQuestions = async (params) => {
      llamadas.push(params);
      return [{ id: 2, enunciado: 'Q2', nivel_dificultad: 2, opciones: [{ id: 20, texto: 'B' }] }];
    };
    testRepository.createTest = async () => ({ id: 88 });
    testRepository.insertTestPreguntas = async () => {};

    await testService.generate({ userId: 5, numeroPreguntas: 1, modo: 'marcadas' });

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].userId, 5);

    Object.assign(testRepository, orig);
  });
});

describe('testService.generateRefuerzo', () => {
  it('usa pickRefuerzoQuestions y crea un test con tipoTest refuerzo', async () => {
    const orig = {
      pickRefuerzoQuestions: testRepository.pickRefuerzoQuestions,
      createTest: testRepository.createTest,
      insertTestPreguntas: testRepository.insertTestPreguntas,
    };

    const createCalls = [];
    testRepository.pickRefuerzoQuestions = async () =>
      [{ id: 3, enunciado: 'Q3', nivel_dificultad: 1, opciones: [{ id: 30, texto: 'C' }] }];
    testRepository.createTest = async (params) => {
      createCalls.push(params);
      return { id: 77 };
    };
    testRepository.insertTestPreguntas = async () => {};

    const result = await testService.generateRefuerzo({ userId: 1, temaId: 2, numeroPreguntas: 1 });

    assert.equal(result.modo, 'refuerzo');
    assert.equal(result.testId, 77);
    assert.equal(createCalls[0].tipoTest, 'refuerzo');

    Object.assign(testRepository, orig);
  });
});
