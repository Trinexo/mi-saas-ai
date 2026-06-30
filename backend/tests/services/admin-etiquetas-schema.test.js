import test from 'node:test';
import assert from 'node:assert/strict';
import {
  etiquetaIdParamSchema,
  listEtiquetasQuerySchema,
  preguntaEtiquetasParamSchema,
  setEtiquetasDePreguntaSchema,
} from '../../src/schemas/adminEtiquetas.schema.js';

test('listEtiquetasQuerySchema normaliza paginacion', () => {
  const result = listEtiquetasQuerySchema.parse({
    q: 'constitucion',
    page: '2',
    page_size: '100',
  });

  assert.equal(result.q, 'constitucion');
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 100);
});

test('setEtiquetasDePreguntaSchema normaliza ids de etiquetas', () => {
  const result = setEtiquetasDePreguntaSchema.parse({ etiqueta_ids: ['1', '2', 3] });
  assert.deepEqual(result.etiqueta_ids, [1, 2, 3]);
});

test('params de etiquetas normalizan ids', () => {
  assert.deepEqual(etiquetaIdParamSchema.parse({ id: '4' }), { id: 4 });
  assert.deepEqual(preguntaEtiquetasParamSchema.parse({ preguntaId: '5' }), { preguntaId: 5 });
});

test('schemas de etiquetas rechazan valores invalidos', () => {
  assert.equal(listEtiquetasQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(setEtiquetasDePreguntaSchema.safeParse({ etiqueta_ids: ['abc'] }).success, false);
  assert.equal(etiquetaIdParamSchema.safeParse({ id: '0' }).success, false);
});
