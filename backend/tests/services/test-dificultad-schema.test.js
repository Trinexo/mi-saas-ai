import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema } from '../../src/schemas/test.schema.js';

describe('generateTestSchema — campo dificultad', () => {
  it('dificultad es opcional y toma "mixto" por defecto', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10 });
    assert.equal(result.dificultad, 'mixto');
  });

  it('dificultad "facil" es válido', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, dificultad: 'facil' });
    assert.equal(result.dificultad, 'facil');
  });

  it('dificultad "media" es válido', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, dificultad: 'media' });
    assert.equal(result.dificultad, 'media');
  });

  it('dificultad "dificil" es válido', () => {
    const result = generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, dificultad: 'dificil' });
    assert.equal(result.dificultad, 'dificil');
  });

  it('dificultad con valor desconocido lanza ZodError', () => {
    assert.throws(
      () => generateTestSchema.parse({ temaId: 1, numeroPreguntas: 10, dificultad: 'extrema' }),
      (err) => {
        assert.ok(err.constructor.name === 'ZodError', 'Debe ser ZodError');
        return true;
      },
    );
  });
});
