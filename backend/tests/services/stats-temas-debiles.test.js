import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getTemasDebiles', () => {
  it('getTemasDebiles está exportado', () => {
    assert.equal(typeof statsRepository.getTemasDebiles, 'function');
  });
});

describe('statsService — getTemasDebiles', () => {
  it('getTemasDebiles está exportado', () => {
    assert.equal(typeof statsService.getTemasDebiles, 'function');
  });
});
