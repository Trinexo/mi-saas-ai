import test from 'node:test';
import assert from 'node:assert/strict';
import {
  statsContextQuerySchema,
  statsOposicionContextQuerySchema,
  statsTemaContextQuerySchema,
} from '../../src/schemas/stats.schema.js';

test('statsContextQuerySchema normaliza contexto de oposicion y modo', () => {
  const result = statsContextQuerySchema.safeParse({
    oposicion_id: '21',
    modo_preparacion: 'albacer',
    albacer_modulo_id: '5',
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    oposicion_id: 21,
    modo_preparacion: 'albacer',
    albacer_modulo_id: 5,
  });
});

test('statsContextQuerySchema aplica Modo Experto por defecto', () => {
  const result = statsContextQuerySchema.safeParse({});

  assert.equal(result.success, true);
  assert.equal(result.data.modo_preparacion, 'experto');
});

test('statsContextQuerySchema rechaza ids invalidos antes de llegar a SQL', () => {
  assert.equal(statsContextQuerySchema.safeParse({ oposicion_id: 'abc' }).success, false);
  assert.equal(statsContextQuerySchema.safeParse({ albacer_modulo_id: '0' }).success, false);
  assert.equal(statsContextQuerySchema.safeParse({ modo_preparacion: 'libre' }).success, false);
});

test('statsOposicionContextQuerySchema exige oposicion_id', () => {
  assert.equal(statsOposicionContextQuerySchema.safeParse({}).success, false);
  assert.equal(statsOposicionContextQuerySchema.safeParse({ oposicion_id: '3' }).data.oposicion_id, 3);
});

test('statsTemaContextQuerySchema exige tema_id y conserva contexto', () => {
  const result = statsTemaContextQuerySchema.safeParse({
    tema_id: '8',
    oposicion_id: '2',
    modo_preparacion: 'albacer',
  });

  assert.equal(result.success, true);
  assert.equal(result.data.tema_id, 8);
  assert.equal(result.data.oposicion_id, 2);
  assert.equal(result.data.modo_preparacion, 'albacer');
});
