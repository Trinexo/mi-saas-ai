import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getFocoHoy', () => {
  it('getFocoHoy está exportado', () => {
    assert.equal(typeof statsRepository.getFocoHoy, 'function');
  });
});

describe('statsService — getFocoHoy', () => {
  it('getFocoHoy está exportado', () => {
    assert.equal(typeof statsService.getFocoHoy, 'function');
  });
});
