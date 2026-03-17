import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getInsightMensual', () => {
  it('getInsightMensual está exportado', () => {
    assert.equal(typeof statsRepository.getInsightMensual, 'function');
  });
});

describe('statsService — getInsightMensual', () => {
  it('getInsightMensual está exportado', () => {
    assert.equal(typeof statsService.getInsightMensual, 'function');
  });
});
