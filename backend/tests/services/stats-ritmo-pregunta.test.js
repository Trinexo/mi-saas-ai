import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getRitmoPregunta', () => {
  it('getRitmoPregunta está exportado', () => {
    assert.equal(typeof statsRepository.getRitmoPregunta, 'function');
  });
});

describe('statsService — getRitmoPregunta', () => {
  it('getRitmoPregunta está exportado', () => {
    assert.equal(typeof statsService.getRitmoPregunta, 'function');
  });
});
