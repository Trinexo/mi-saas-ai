import test from 'node:test';
import assert from 'node:assert/strict';
import { marcadasQuerySchema } from '../../src/schemas/marcadas.schema.js';
import { misTestParamsSchema, misTestsQuerySchema } from '../../src/schemas/misTests.schema.js';
import { simulacroPublicadoParamsSchema, simulacrosPublicosQuerySchema } from '../../src/schemas/simulacrosPublicos.schema.js';
import { testIdParamsSchema, testOposicionQuerySchema, testPendientesQuerySchema } from '../../src/schemas/test.schema.js';

test('schemas de oposicion opcional normalizan oposicion_id', () => {
  assert.equal(marcadasQuerySchema.safeParse({ oposicion_id: '2' }).data.oposicion_id, 2);
  assert.equal(misTestsQuerySchema.safeParse({ oposicion_id: '3' }).data.oposicion_id, 3);
  assert.equal(simulacrosPublicosQuerySchema.safeParse({ oposicion_id: '4' }).data.oposicion_id, 4);
  assert.equal(testOposicionQuerySchema.safeParse({ oposicion_id: '5' }).data.oposicion_id, 5);
});

test('schemas de oposicion opcional rechazan ids invalidos', () => {
  assert.equal(marcadasQuerySchema.safeParse({ oposicion_id: 'abc' }).success, false);
  assert.equal(misTestsQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(simulacrosPublicosQuerySchema.safeParse({ oposicion_id: '-1' }).success, false);
  assert.equal(testOposicionQuerySchema.safeParse({ oposicion_id: '1.5' }).success, false);
});

test('testPendientesQuerySchema valida modo de preparacion', () => {
  const parsed = testPendientesQuerySchema.safeParse({
    oposicion_id: '7',
    modo_preparacion: 'albacer',
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.oposicion_id, 7);
  assert.equal(parsed.data.modo_preparacion, 'albacer');
  assert.equal(testPendientesQuerySchema.safeParse({ modo_preparacion: 'libre' }).success, false);
});

test('schemas de params de alumno normalizan ids', () => {
  assert.equal(misTestParamsSchema.safeParse({ id: '11' }).data.id, 11);
  assert.equal(simulacroPublicadoParamsSchema.safeParse({ id: '12' }).data.id, 12);
  assert.equal(testIdParamsSchema.safeParse({ testId: '13' }).data.testId, 13);
});

test('schemas de params de alumno rechazan ids invalidos', () => {
  assert.equal(misTestParamsSchema.safeParse({ id: 'abc' }).success, false);
  assert.equal(simulacroPublicadoParamsSchema.safeParse({ id: '0' }).success, false);
  assert.equal(testIdParamsSchema.safeParse({ testId: '-3' }).success, false);
});
