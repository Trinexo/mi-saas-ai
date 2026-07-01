import test from 'node:test';
import assert from 'node:assert/strict';
import { idParamSchema } from '../../src/schemas/admin.schema.js';

test('media de preguntas usa idParamSchema para normalizar pregunta id', () => {
  const result = idParamSchema.parse({ id: '42' });
  assert.deepEqual(result, { id: 42 });
});

test('media de preguntas rechaza ids invalidos', () => {
  assert.equal(idParamSchema.safeParse({ id: '0' }).success, false);
  assert.equal(idParamSchema.safeParse({ id: 'abc' }).success, false);
});
