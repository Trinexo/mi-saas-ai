import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getBalancePrecision', () => {
  it('getBalancePrecision está exportado', () => {
    assert.equal(typeof statsRepository.getBalancePrecision, 'function');
  });
});

describe('statsService — getBalancePrecision', () => {
  it('getBalancePrecision está exportado', () => {
    assert.equal(typeof statsService.getBalancePrecision, 'function');
  });
});
