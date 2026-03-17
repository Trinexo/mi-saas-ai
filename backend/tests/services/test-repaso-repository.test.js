/**
 * Sprint 6 PR 03 — testRepository: pickDueQuestions y countDueQuestions exportados
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';

describe('testRepository — modo repaso', () => {
  it('pickDueQuestions está exportado', () => {
    assert.equal(typeof testRepository.pickDueQuestions, 'function');
  });

  it('countDueQuestions está exportado', () => {
    assert.equal(typeof testRepository.countDueQuestions, 'function');
  });

  it('pickDueQuestions y pickAnyQuestions coexisten en el mismo repositorio', () => {
    assert.equal(typeof testRepository.pickDueQuestions, 'function');
    assert.equal(typeof testRepository.pickAnyQuestions, 'function');
  });
});
