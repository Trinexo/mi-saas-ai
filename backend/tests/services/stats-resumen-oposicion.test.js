import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getResumenOposicion', () => {
  it('getResumenOposicion está exportado', () => {
    assert.equal(typeof statsRepository.getResumenOposicion, 'function');
  });
});

describe('statsService — getResumenOposicion', () => {
  it('getResumenOposicion está exportado', () => {
    assert.equal(typeof statsService.getResumenOposicion, 'function');
  });

  it('lanza error si oposicion_id no es entero positivo', async () => {
    await assert.rejects(
      () => statsService.getResumenOposicion(1, 0),
      (err) => {
        assert.equal(err.status, 400);
        return true;
      },
    );
  });

  it('lanza error si oposicion_id es negativo', async () => {
    await assert.rejects(
      () => statsService.getResumenOposicion(1, -5),
      (err) => {
        assert.equal(err.status, 400);
        return true;
      },
    );
  });
});
