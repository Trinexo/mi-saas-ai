import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accesoOposicionParamSchema,
  accesoUsuarioOposicionParamsSchema,
  accesosListQuerySchema,
  asignarAccesoBodySchema,
  editarAccesoBodySchema,
  preparacionAccesoBodySchema,
} from '../../src/schemas/accesoOposicion.schema.js';

test('accesoOposicionParamSchema normaliza oposicionId', () => {
  const parsed = accesoOposicionParamSchema.safeParse({ oposicionId: '7' });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.oposicionId, 7);
  assert.equal(accesoOposicionParamSchema.safeParse({ oposicionId: '0' }).success, false);
});

test('accesoUsuarioOposicionParamsSchema normaliza userId y oposicionId', () => {
  const parsed = accesoUsuarioOposicionParamsSchema.safeParse({ userId: '3', oposicionId: '9' });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, { userId: 3, oposicionId: 9 });
});

test('accesosListQuerySchema aplica defaults y valida filtros', () => {
  const parsed = accesosListQuerySchema.safeParse({ oposicion_id: '4' });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.page, 1);
  assert.equal(parsed.data.page_size, 20);
  assert.equal(parsed.data.oposicion_id, 4);
  assert.equal(accesosListQuerySchema.safeParse({ page_size: '500' }).success, false);
});

test('asignarAccesoBodySchema valida tipo de alumno y modo', () => {
  const parsed = asignarAccesoBodySchema.safeParse({
    email: 'alumno@test.com',
    oposicionId: '5',
    tipoAlumno: 'albacer',
    modoPreparacion: 'experto',
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.oposicionId, 5);
  assert.equal(parsed.data.tipoAlumno, 'albacer');
  assert.equal(parsed.data.modoPreparacion, 'experto');
  assert.equal(asignarAccesoBodySchema.safeParse({ email: 'mal', oposicionId: 5 }).success, false);
});

test('editarAccesoBodySchema rechaza estados y modos no soportados', () => {
  assert.equal(editarAccesoBodySchema.safeParse({ estado: 'cancelado' }).success, true);
  assert.equal(editarAccesoBodySchema.safeParse({ estado: 'borrado' }).success, false);
  assert.equal(editarAccesoBodySchema.safeParse({ tipoAlumno: 'vip' }).success, false);
  assert.equal(editarAccesoBodySchema.safeParse({ modoPreparacion: 'libre' }).success, false);
});

test('preparacionAccesoBodySchema exige modo o ranking publico', () => {
  assert.equal(preparacionAccesoBodySchema.safeParse({}).success, false);
  assert.equal(preparacionAccesoBodySchema.safeParse({ modo_preparacion: 'albacer' }).success, true);
  assert.deepEqual(preparacionAccesoBodySchema.parse({ ranking_publico: '1' }), { ranking_publico: true });
  assert.deepEqual(preparacionAccesoBodySchema.parse({ rankingPublico: 'false' }), { rankingPublico: false });
  assert.equal(preparacionAccesoBodySchema.safeParse({ rankingPublico: 'si' }).success, false);
});
