import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listNotificacionesQuerySchema,
  notificacionIdParamSchema,
} from '../../src/schemas/notificaciones.schema.js';

test('listNotificacionesQuerySchema normaliza paginacion y booleanos', () => {
  assert.deepEqual(listNotificacionesQuerySchema.parse({}), {
    page: 1,
    page_size: 20,
    solo_no_leidas: false,
  });

  assert.deepEqual(listNotificacionesQuerySchema.parse({
    page: '2',
    page_size: '50',
    solo_no_leidas: 'true',
  }), {
    page: 2,
    page_size: 50,
    solo_no_leidas: true,
  });
});

test('schemas de notificaciones rechazan valores invalidos', () => {
  assert.equal(listNotificacionesQuerySchema.safeParse({ page: '0' }).success, false);
  assert.equal(listNotificacionesQuerySchema.safeParse({ page_size: '101' }).success, false);
  assert.equal(listNotificacionesQuerySchema.safeParse({ solo_no_leidas: 'si' }).success, false);
  assert.equal(notificacionIdParamSchema.safeParse({ id: '0' }).success, false);
});

test('notificacionIdParamSchema normaliza id', () => {
  assert.deepEqual(notificacionIdParamSchema.parse({ id: '12' }), { id: 12 });
});
