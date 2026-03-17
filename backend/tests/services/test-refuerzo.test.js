import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateRefuerzoSchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

describe('generateRefuerzoSchema', () => {
  it('valida payload mínimo', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 10 });
    assert.equal(r.success, true);
    assert.equal(r.data.numeroPreguntas, 10);
  });

  it('coacciona temaId string a number', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 20, temaId: '12' });
    assert.equal(r.success, true);
    assert.equal(r.data.temaId, 12);
  });

  it('rechaza numeroPreguntas fuera de rango', () => {
    const r = generateRefuerzoSchema.safeParse({ numeroPreguntas: 0 });
    assert.equal(r.success, false);
  });
});

describe('testRepository', () => {
  it('pickRefuerzoQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickRefuerzoQuestions, 'function');
  });
});

describe('testService', () => {
  it('generateRefuerzo está exportado', () => {
    assert.equal(typeof testService.generateRefuerzo, 'function');
  });
});
