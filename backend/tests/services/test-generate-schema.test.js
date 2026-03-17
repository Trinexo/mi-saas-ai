import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema } from '../../src/schemas/test.schema.js';

describe('generateTestSchema — campo modo', () => {
  it('modo es opcional y toma "adaptativo" por defecto', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10 });
    assert.equal(result.modo, 'adaptativo');
  });

  it('modo "adaptativo" es válido', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, modo: 'adaptativo' });
    assert.equal(result.modo, 'adaptativo');
  });

  it('modo "normal" es válido', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, modo: 'normal' });
    assert.equal(result.modo, 'normal');
  });

  it('modo con valor desconocido lanza ZodError', () => {
    assert.throws(
      () => generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, modo: 'aleatorio' }),
      (err) => {
        assert.ok(err.constructor.name === 'ZodError', 'Debe ser ZodError');
        return true;
      },
    );
  });
});
