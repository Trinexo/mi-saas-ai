import test from 'node:test';
import assert from 'node:assert/strict';
import { userIdParamSchema } from '../../src/schemas/admin.schema.js';
import { assignPlanSchema, listSuscripcionesQuerySchema } from '../../src/schemas/subscription.schema.js';

test('listSuscripcionesQuerySchema normaliza paginacion', () => {
  const result = listSuscripcionesQuerySchema.parse({
    plan: 'pro',
    estado: 'activa',
    limit: '25',
    offset: '50',
  });

  assert.equal(result.plan, 'pro');
  assert.equal(result.estado, 'activa');
  assert.equal(result.limit, 25);
  assert.equal(result.offset, 50);
});

test('listSuscripcionesQuerySchema aplica defaults', () => {
  const result = listSuscripcionesQuerySchema.parse({});

  assert.equal(result.limit, 50);
  assert.equal(result.offset, 0);
});

test('userIdParamSchema normaliza userId', () => {
  const result = userIdParamSchema.parse({ userId: '12' });
  assert.deepEqual(result, { userId: 12 });
});

test('assignPlanSchema valida plan y fecha', () => {
  const result = assignPlanSchema.parse({
    plan: 'elite',
    fecha_fin: '2026-12-31',
    notas: 'Asignacion manual',
  });

  assert.equal(result.plan, 'elite');
  assert.equal(result.fecha_fin, '2026-12-31');
});

test('schemas de suscripcion rechazan valores invalidos', () => {
  assert.equal(listSuscripcionesQuerySchema.safeParse({ limit: '500' }).success, false);
  assert.equal(listSuscripcionesQuerySchema.safeParse({ offset: '-1' }).success, false);
  assert.equal(assignPlanSchema.safeParse({ plan: 'premium' }).success, false);
  assert.equal(userIdParamSchema.safeParse({ userId: '0' }).success, false);
});
