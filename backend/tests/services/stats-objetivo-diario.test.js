import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getObjetivoDiario', () => {
  it('getObjetivoDiario está exportado', () => {
    assert.equal(typeof statsRepository.getObjetivoDiario, 'function');
  });
});

describe('statsService — getObjetivoDiario', () => {
  it('getObjetivoDiario está exportado', () => {
    assert.equal(typeof statsService.getObjetivoDiario, 'function');
  });
});
