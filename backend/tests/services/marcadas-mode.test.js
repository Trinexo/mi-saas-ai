/**
 * Sprint 10 PR 01 — modo 'marcadas' en generateTestSchema + pickMarcadasQuestions + testService
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

describe('generateTestSchema — modo marcadas', () => {
  it('acepta modo marcadas sin temaId', () => {
    const r = generateTestSchema.safeParse({ modo: 'marcadas', numeroPreguntas: 10 });
    assert.equal(r.success, true);
    assert.equal(r.data.modo, 'marcadas');
  });

  it('acepta modo marcadas con temaId (se ignora, no rompe)', () => {
    const r = generateTestSchema.safeParse({ modo: 'marcadas', temaId: 5, numeroPreguntas: 10 });
    assert.equal(r.success, true);
  });

  it('rechaza modo marcadas sin numeroPreguntas', () => {
    const r = generateTestSchema.safeParse({ modo: 'marcadas' });
    assert.equal(r.success, false);
  });

  it('sigue rechazando modo normal sin temaId', () => {
    const r = generateTestSchema.safeParse({ modo: 'normal', numeroPreguntas: 10 });
    assert.equal(r.success, false);
  });

  it('sigue rechazando modo adaptativo sin temaId', () => {
    const r = generateTestSchema.safeParse({ modo: 'adaptativo', numeroPreguntas: 10 });
    assert.equal(r.success, false);
  });

  it('sigue requiriendo oposicionId en modo simulacro', () => {
    const r = generateTestSchema.safeParse({ modo: 'simulacro', numeroPreguntas: 50 });
    assert.equal(r.success, false);
  });

  it('enum de modo incluye los 5 valores válidos', () => {
    const modos = ['normal', 'adaptativo', 'repaso', 'simulacro', 'marcadas'];
    for (const modo of modos) {
      const payload = modo === 'simulacro'
        ? { modo, oposicionId: 1, numeroPreguntas: 10 }
        : { modo, temaId: 1, numeroPreguntas: 10 };
      const r = generateTestSchema.safeParse(payload);
      assert.equal(r.success, true, `modo '${modo}' debería ser válido`);
    }
  });
});

describe('testRepository — pickMarcadasQuestions', () => {
  it('pickMarcadasQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickMarcadasQuestions, 'function');
  });
});

describe('testService — generate', () => {
  it('generate está exportado', () => {
    assert.equal(typeof testService.generate, 'function');
  });
});
