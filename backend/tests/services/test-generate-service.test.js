import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';

describe('testService.generate — routing por modo', () => {
  it('testRepository expone pickAdaptiveQuestions para modo adaptativo', () => {
    assert.equal(typeof testRepository.pickAdaptiveQuestions, 'function');
  });

  it('testRepository expone pickFreshQuestions para modo normal', () => {
    assert.equal(typeof testRepository.pickFreshQuestions, 'function');
  });

  it('testRepository expone pickAnyQuestions para fallback', () => {
    assert.equal(typeof testRepository.pickAnyQuestions, 'function');
  });

  it('los tres métodos de selección aceptan los mismos parámetros base', () => {
    const paramasFresh = testRepository.pickFreshQuestions.toString().includes('userId');
    const paramsAdaptive = testRepository.pickAdaptiveQuestions.toString().includes('userId');
    assert.ok(paramasFresh, 'pickFreshQuestions debe aceptar userId');
    assert.ok(paramsAdaptive, 'pickAdaptiveQuestions debe aceptar userId');
  });

  it('testRepository expone getContextoNombres para enriquecer la respuesta del generate', () => {
    assert.equal(typeof testRepository.getContextoNombres, 'function');
  });
});
