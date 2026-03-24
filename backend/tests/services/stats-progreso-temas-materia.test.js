import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getProgresoTemasByMateria', () => {
  it('getProgresoTemasByMateria está exportado', () => {
    assert.equal(typeof statsRepository.getProgresoTemasByMateria, 'function');
  });
});

describe('statsService — getProgresoTemasByMateria', () => {
  it('getProgresoTemasByMateria está exportado', () => {
    assert.equal(typeof statsService.getProgresoTemasByMateria, 'function');
  });

  it('lanza error si materia_id es 0', async () => {
    try {
      await statsService.getProgresoTemasByMateria(1, 0);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si materia_id es negativo', async () => {
    try {
      await statsService.getProgresoTemasByMateria(1, -3);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });

  it('lanza error si materia_id es decimal', async () => {
    try {
      await statsService.getProgresoTemasByMateria(1, 1.5);
      assert.fail('Debería haber lanzado error');
    } catch (err) {
      assert.equal(err.status, 400);
    }
  });
});
