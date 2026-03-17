import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getResumenSemana', () => {
  it('getResumenSemana está exportado', () => {
    assert.equal(typeof statsRepository.getResumenSemana, 'function');
  });
});

describe('statsService — getResumenSemana', () => {
  it('getResumenSemana está exportado', () => {
    assert.equal(typeof statsService.getResumenSemana, 'function');
  });
});
