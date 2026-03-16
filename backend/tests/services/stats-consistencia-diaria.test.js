import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getConsistenciaDiaria', () => {
  it('getConsistenciaDiaria está exportado', () => {
    assert.equal(typeof statsRepository.getConsistenciaDiaria, 'function');
  });
});

describe('statsService — getConsistenciaDiaria', () => {
  it('getConsistenciaDiaria está exportado', () => {
    assert.equal(typeof statsService.getConsistenciaDiaria, 'function');
  });
});
