import test from 'node:test';
import assert from 'node:assert/strict';
import {
  testIdParamsSchema,
  testOposicionQuerySchema,
  testPendientesQuerySchema,
} from '../../src/schemas/test.schema.js';

test('testOposicionQuerySchema normaliza oposicion_id opcional', () => {
  assert.deepEqual(testOposicionQuerySchema.parse({}), {});
  assert.deepEqual(testOposicionQuerySchema.parse({ oposicion_id: '12' }), { oposicion_id: 12 });
});

test('testPendientesQuerySchema normaliza oposicion_id y modo', () => {
  const result = testPendientesQuerySchema.parse({
    oposicion_id: '7',
    modo_preparacion: 'albacer',
  });

  assert.deepEqual(result, { oposicion_id: 7, modo_preparacion: 'albacer' });
});

test('testIdParamsSchema normaliza testId', () => {
  const result = testIdParamsSchema.parse({ testId: '44' });
  assert.deepEqual(result, { testId: 44 });
});

test('schemas del controller de tests rechazan valores invalidos', () => {
  assert.equal(testOposicionQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(testPendientesQuerySchema.safeParse({ modo_preparacion: 'libre' }).success, false);
  assert.equal(testIdParamsSchema.safeParse({ testId: 'abc' }).success, false);
});
