import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actividadRecienteQuerySchema,
  bloquesErroresQuerySchema,
  evolucionUsuariosQuerySchema,
  topOposicionesQuerySchema,
} from '../../src/schemas/admin.schema.js';

test('bloquesErroresQuerySchema normaliza limit y aplica default', () => {
  assert.equal(bloquesErroresQuerySchema.parse({}).limit, 10);
  assert.equal(bloquesErroresQuerySchema.parse({ limit: '25' }).limit, 25);
});

test('topOposicionesQuerySchema normaliza limit y aplica default', () => {
  assert.equal(topOposicionesQuerySchema.parse({}).limit, 5);
  assert.equal(topOposicionesQuerySchema.parse({ limit: '8' }).limit, 8);
});

test('evolucionUsuariosQuerySchema normaliza dias y aplica default', () => {
  assert.equal(evolucionUsuariosQuerySchema.parse({}).dias, 30);
  assert.equal(evolucionUsuariosQuerySchema.parse({ dias: '45' }).dias, 45);
});

test('actividadRecienteQuerySchema normaliza limit y aplica default', () => {
  assert.equal(actividadRecienteQuerySchema.parse({}).limit, 20);
  assert.equal(actividadRecienteQuerySchema.parse({ limit: '30' }).limit, 30);
});

test('schemas del panel admin rechazan valores fuera de rango', () => {
  assert.equal(bloquesErroresQuerySchema.safeParse({ limit: '0' }).success, false);
  assert.equal(bloquesErroresQuerySchema.safeParse({ limit: '51' }).success, false);
  assert.equal(topOposicionesQuerySchema.safeParse({ limit: '11' }).success, false);
  assert.equal(evolucionUsuariosQuerySchema.safeParse({ dias: '6' }).success, false);
  assert.equal(evolucionUsuariosQuerySchema.safeParse({ dias: '91' }).success, false);
  assert.equal(actividadRecienteQuerySchema.safeParse({ limit: '80' }).success, false);
});
