import test from 'node:test';
import assert from 'node:assert/strict';
import { planEstudioIdParamSchema, planEstudioQuerySchema } from '../../src/schemas/planEstudio.schema.js';

test('planEstudioQuerySchema normaliza oposicion_id', () => {
  const result = planEstudioQuerySchema.parse({ oposicion_id: '12' });
  assert.deepEqual(result, { oposicion_id: 12 });
});

test('planEstudioIdParamSchema normaliza id', () => {
  const result = planEstudioIdParamSchema.parse({ id: '8' });
  assert.deepEqual(result, { id: 8 });
});

test('schemas de plan de estudio rechazan ids invalidos', () => {
  assert.equal(planEstudioQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(planEstudioIdParamSchema.safeParse({ id: 'abc' }).success, false);
});
