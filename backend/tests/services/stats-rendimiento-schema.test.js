import test from 'node:test';
import assert from 'node:assert/strict';
import { evolucionQuerySchema, statsContextQuerySchema } from '../../src/schemas/stats.schema.js';

test('statsContextQuerySchema normaliza contexto usado por rendimiento', () => {
  const result = statsContextQuerySchema.parse({
    oposicion_id: '12',
    modo_preparacion: 'albacer',
    albacer_modulo_id: '5',
  });

  assert.deepEqual(result, {
    oposicion_id: 12,
    modo_preparacion: 'albacer',
    albacer_modulo_id: 5,
  });
});

test('statsContextQuerySchema aplica modo experto por defecto', () => {
  const result = statsContextQuerySchema.parse({});
  assert.equal(result.modo_preparacion, 'experto');
});

test('evolucionQuerySchema normaliza limit y contexto', () => {
  const result = evolucionQuerySchema.parse({
    limit: '15',
    oposicion_id: '9',
    albacer_modulo_id: '2',
  });

  assert.equal(result.limit, 15);
  assert.equal(result.oposicion_id, 9);
  assert.equal(result.albacer_modulo_id, 2);
  assert.equal(result.modo_preparacion, 'experto');
});

test('schemas de rendimiento rechazan valores invalidos', () => {
  assert.equal(statsContextQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(statsContextQuerySchema.safeParse({ albacer_modulo_id: 'abc' }).success, false);
  assert.equal(statsContextQuerySchema.safeParse({ modo_preparacion: 'libre' }).success, false);
  assert.equal(evolucionQuerySchema.safeParse({ limit: '101' }).success, false);
});
