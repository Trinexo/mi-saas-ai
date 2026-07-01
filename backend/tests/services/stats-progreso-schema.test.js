import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bloqueStatsQuerySchema,
  repasoStatsQuerySchema,
  simulacrosStatsQuerySchema,
  statsBloqueDetalleParamsSchema,
  statsOposicionContextQuerySchema,
  statsRankingQuerySchema,
  statsTemaContextQuerySchema,
} from '../../src/schemas/stats.schema.js';

test('schemas de progreso normalizan ids requeridos', () => {
  assert.deepEqual(statsOposicionContextQuerySchema.parse({ oposicion_id: '12' }), {
    oposicion_id: 12,
    modo_preparacion: 'experto',
  });
  assert.deepEqual(statsTemaContextQuerySchema.parse({ tema_id: '7' }), {
    tema_id: 7,
    modo_preparacion: 'experto',
  });
  assert.deepEqual(statsBloqueDetalleParamsSchema.parse({ id: '5' }), { id: 5 });
});

test('schemas de progreso normalizan consultas especificas', () => {
  assert.equal(simulacrosStatsQuerySchema.parse({ oposicion_id: '3' }).oposicion_id, 3);
  assert.equal(bloqueStatsQuerySchema.parse({ bloque_id: '4' }).bloque_id, 4);
  assert.equal(repasoStatsQuerySchema.parse({ bloque_id: '6' }).bloque_id, 6);
  assert.equal(statsRankingQuerySchema.parse({ oposicion_id: '9' }).oposicion_id, 9);
});

test('schemas de progreso rechazan ids invalidos', () => {
  assert.equal(statsOposicionContextQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(statsTemaContextQuerySchema.safeParse({ tema_id: 'abc' }).success, false);
  assert.equal(statsBloqueDetalleParamsSchema.safeParse({ id: '-1' }).success, false);
  assert.equal(simulacrosStatsQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(bloqueStatsQuerySchema.safeParse({ bloque_id: 'abc' }).success, false);
  assert.equal(repasoStatsQuerySchema.safeParse({ bloque_id: '0' }).success, false);
  assert.equal(statsRankingQuerySchema.safeParse({ oposicion_id: 'abc' }).success, false);
});
