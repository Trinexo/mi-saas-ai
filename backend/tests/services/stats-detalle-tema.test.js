import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getDetalleTema', () => {
  it('getDetalleTema está exportado', () => {
    assert.equal(typeof statsRepository.getDetalleTema, 'function');
  });
});

describe('statsService — getDetalleTema', () => {
  it('getDetalleTema está exportado', () => {
    assert.equal(typeof statsService.getDetalleTema, 'function');
  });

  it('lanza error si tema_id es 0', async () => {
    try {
      await statsService.getDetalleTema(1, 0);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si tema_id es negativo', async () => {
    try {
      await statsService.getDetalleTema(1, -1);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si tema_id es decimal', async () => {
    try {
      await statsService.getDetalleTema(1, 3.7);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });
});
