import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getActividad14Dias', () => {
  it('getActividad14Dias está exportado', () => {
    assert.equal(typeof statsRepository.getActividad14Dias, 'function');
  });
});

describe('statsService — getActividad14Dias', () => {
  it('getActividad14Dias está exportado', () => {
    assert.equal(typeof statsService.getActividad14Dias, 'function');
  });
});
