/**
 * Sprint 6 PR 03 — repasoStatsQuerySchema
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repasoStatsQuerySchema } from '../../src/schemas/stats.schema.js';

describe('repasoStatsQuerySchema', () => {
  it('acepta tema_id entero positivo', () => {
    const result = repasoStatsQuerySchema.safeParse({ tema_id: '5' });
    assert.equal(result.success, true);
    assert.equal(result.data.tema_id, 5);
  });

  it('rechaza tema_id no positivo', () => {
    const result = repasoStatsQuerySchema.safeParse({ tema_id: '0' });
    assert.equal(result.success, false);
  });

  it('rechaza cuando falta tema_id', () => {
    const result = repasoStatsQuerySchema.safeParse({});
    assert.equal(result.success, false);
  });
});
