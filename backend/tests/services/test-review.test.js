/**
 * Sprint 8 PR 01 — reviewParamsSchema + getTestReview + getReview exportados
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reviewParamsSchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

describe('reviewParamsSchema', () => {
  it('acepta testId entero positivo y lo coerce desde string', () => {
    const result = reviewParamsSchema.safeParse({ testId: '42' });
    assert.equal(result.success, true);
    assert.equal(result.data.testId, 42);
  });

  it('rechaza testId cero', () => {
    const result = reviewParamsSchema.safeParse({ testId: '0' });
    assert.equal(result.success, false);
  });

  it('rechaza testId negativo', () => {
    const result = reviewParamsSchema.safeParse({ testId: '-5' });
    assert.equal(result.success, false);
  });

  it('rechaza cuando falta testId', () => {
    const result = reviewParamsSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('testRepository — review', () => {
  it('getTestReview está exportado', () => {
    assert.equal(typeof testRepository.getTestReview, 'function');
  });
});

describe('testService — review', () => {
  it('getReview está exportado', () => {
    assert.equal(typeof testService.getReview, 'function');
  });
});
