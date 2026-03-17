import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getRendimientoModos', () => {
  it('getRendimientoModos está exportado', () => {
    assert.equal(typeof statsRepository.getRendimientoModos, 'function');
  });
});

describe('statsService — getRendimientoModos', () => {
  it('getRendimientoModos está exportado', () => {
    assert.equal(typeof statsService.getRendimientoModos, 'function');
  });
});
