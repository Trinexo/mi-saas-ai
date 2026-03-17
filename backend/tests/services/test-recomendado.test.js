import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

describe('testRepository — recomendación', () => {
  it('getRecommendationContext está exportado', () => {
    assert.equal(typeof testRepository.getRecommendationContext, 'function');
  });
});

describe('testService — recomendación', () => {
  it('getRecommended está exportado', () => {
    assert.equal(typeof testService.getRecommended, 'function');
  });
});
