/**
 * Sprint 7 PR 02 — testRepository: pickSimulacroQuestions exportado
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';

describe('testRepository — simulacro', () => {
  it('pickSimulacroQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickSimulacroQuestions, 'function');
  });

  it('createTest sigue exportado', () => {
    assert.equal(typeof testRepository.createTest, 'function');
  });

  it('createTest y pickSimulacroQuestions coexisten con los demás métodos', () => {
    assert.equal(typeof testRepository.pickFreshQuestions, 'function');
    assert.equal(typeof testRepository.pickAdaptiveQuestions, 'function');
    assert.equal(typeof testRepository.pickDueQuestions, 'function');
    assert.equal(typeof testRepository.pickSimulacroQuestions, 'function');
  });
});
