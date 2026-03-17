import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getGamificacion', () => {
  it('getGamificacion está exportado', () => {
    assert.equal(typeof statsRepository.getGamificacion, 'function');
  });
});

describe('statsService — getGamificacion', () => {
  it('getGamificacion está exportado', () => {
    assert.equal(typeof statsService.getGamificacion, 'function');
  });
});
