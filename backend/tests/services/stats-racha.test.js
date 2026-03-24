import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getRacha', () => {
  it('getRacha está exportado', () => {
    assert.equal(typeof statsRepository.getRacha, 'function');
  });
});

describe('statsService — getRacha', () => {
  it('getRacha está exportado', () => {
    assert.equal(typeof statsService.getRacha, 'function');
  });
});

describe('statsRepository — getRachaTemas', () => {
  it('getRachaTemas está exportado', () => {
    assert.equal(typeof statsRepository.getRachaTemas, 'function');
  });
});

describe('statsService — getRachaTemas', () => {
  it('getRachaTemas está exportado', () => {
    assert.equal(typeof statsService.getRachaTemas, 'function');
  });
});
