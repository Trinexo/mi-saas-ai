import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getProgresoSemanal', () => {
  it('getProgresoSemanal está exportado', () => {
    assert.equal(typeof statsRepository.getProgresoSemanal, 'function');
  });
});

describe('statsService — getProgresoSemanal', () => {
  it('getProgresoSemanal está exportado', () => {
    assert.equal(typeof statsService.getProgresoSemanal, 'function');
  });
});
