import test from 'node:test';
import assert from 'node:assert/strict';
import {
  billingOposicionParamSchema,
  checkoutSessionBodySchema,
  patchPrecioBodySchema,
} from '../../src/schemas/billing.schema.js';

test('checkoutSessionBodySchema normaliza oposicionId', () => {
  const result = checkoutSessionBodySchema.parse({ oposicionId: '12' });
  assert.deepEqual(result, { oposicionId: 12 });
});

test('billingOposicionParamSchema normaliza oposicionId', () => {
  const result = billingOposicionParamSchema.parse({ oposicionId: '7' });
  assert.deepEqual(result, { oposicionId: 7 });
});

test('patchPrecioBodySchema normaliza precioEuros de formulario', () => {
  const result = patchPrecioBodySchema.parse({ precioEuros: '19.99' });
  assert.equal(result.precioEuros, 19.99);
});

test('schemas de billing rechazan valores invalidos', () => {
  assert.equal(checkoutSessionBodySchema.safeParse({ oposicionId: '0' }).success, false);
  assert.equal(billingOposicionParamSchema.safeParse({ oposicionId: 'abc' }).success, false);
  assert.equal(patchPrecioBodySchema.safeParse({ precioEuros: '0' }).success, false);
  assert.equal(patchPrecioBodySchema.safeParse({ precioEuros: '10000' }).success, false);
});
