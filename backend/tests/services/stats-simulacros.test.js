/**
 * Sprint 7 PR 03 — simulacrosStatsQuerySchema + getSimulacrosStats exportado
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { simulacrosStatsQuerySchema } from '../../src/schemas/stats.schema.js';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('simulacrosStatsQuerySchema', () => {
  it('acepta oposicion_id entero positivo y lo coerce', () => {
    const result = simulacrosStatsQuerySchema.safeParse({ oposicion_id: '3' });
    assert.equal(result.success, true);
    assert.equal(result.data.oposicion_id, 3);
  });

  it('rechaza oposicion_id no positivo', () => {
    const result = simulacrosStatsQuerySchema.safeParse({ oposicion_id: '0' });
    assert.equal(result.success, false);
  });

  it('rechaza cuando falta oposicion_id', () => {
    const result = simulacrosStatsQuerySchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('statsRepository — simulacros', () => {
  it('getSimulacrosStats está exportado', () => {
    assert.equal(typeof statsRepository.getSimulacrosStats, 'function');
  });
});

describe('statsService — simulacros', () => {
  it('getSimulacrosStats está exportado', () => {
    assert.equal(typeof statsService.getSimulacrosStats, 'function');
  });
});
