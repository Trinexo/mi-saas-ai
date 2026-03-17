/**
 * Sprint 11 PR 02 — evolucionQuerySchema + statsRepository.getEvolucion + statsService.getEvolucion
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evolucionQuerySchema } from '../../src/schemas/stats.schema.js';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('evolucionQuerySchema', () => {
  it('aplica default 30 si limit no está presente', () => {
    const r = evolucionQuerySchema.safeParse({});
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 30);
  });

  it('acepta limit numérico válido desde string', () => {
    const r = evolucionQuerySchema.safeParse({ limit: '10' });
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 10);
  });

  it('rechaza limit cero', () => {
    const r = evolucionQuerySchema.safeParse({ limit: '0' });
    assert.equal(r.success, false);
  });

  it('rechaza limit mayor de 100', () => {
    const r = evolucionQuerySchema.safeParse({ limit: '101' });
    assert.equal(r.success, false);
  });

  it('acepta limit exactamente 100', () => {
    const r = evolucionQuerySchema.safeParse({ limit: '100' });
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 100);
  });
});

describe('statsRepository', () => {
  it('getEvolucion está exportado', () => {
    assert.equal(typeof statsRepository.getEvolucion, 'function');
  });
});

describe('statsService', () => {
  it('getEvolucion está exportado', () => {
    assert.equal(typeof statsService.getEvolucion, 'function');
  });
});
