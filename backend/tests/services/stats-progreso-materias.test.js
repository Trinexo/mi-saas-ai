import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getProgresoMaterias', () => {
  it('getProgresoMaterias está exportado', () => {
    assert.equal(typeof statsRepository.getProgresoMaterias, 'function');
  });
});

describe('statsService — getProgresoMaterias', () => {
  it('getProgresoMaterias está exportado', () => {
    assert.equal(typeof statsService.getProgresoMaterias, 'function');
  });

  it('lanza error si oposicion_id no es entero positivo', async () => {
    try {
      await statsService.getProgresoMaterias(1, 0);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si oposicion_id es negativo', async () => {
    try {
      await statsService.getProgresoMaterias(1, -5);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si oposicion_id es decimal', async () => {
    try {
      await statsService.getProgresoMaterias(1, 2.5);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });
});
