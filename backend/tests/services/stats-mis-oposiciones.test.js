import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getMisOposiciones', () => {
  it('getMisOposiciones está exportado', () => {
    assert.equal(typeof statsRepository.getMisOposiciones, 'function');
  });
});

describe('statsService — getMisOposiciones', () => {
  it('getMisOposiciones está exportado', () => {
    assert.equal(typeof statsService.getMisOposiciones, 'function');
  });

  it('devuelve una promesa para userId válido', () => {
    const result = statsService.getMisOposiciones(1);
    assert.ok(result instanceof Promise);
    result.catch(() => {});
  });
});
