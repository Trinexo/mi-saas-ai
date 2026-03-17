/**
 * Sprint 6 PR 03 — generateTestSchema: campo modo con valor 'repaso'
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema } from '../../src/schemas/test.schema.js';

describe("generateTestSchema — modo 'repaso'", () => {
  it("modo 'repaso' es válido", () => {
    const result = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 10, modo: 'repaso' });
    assert.equal(result.success, true);
    assert.equal(result.data.modo, 'repaso');
  });

  it("en modo 'repaso' dificultad por defecto es 'mixto'", () => {
    const result = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 10, modo: 'repaso' });
    assert.equal(result.success, true);
    assert.equal(result.data.dificultad, 'mixto');
  });

  it("modo con valor desconocido sigue lanzando ZodError", () => {
    const result = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 5, modo: 'desconocido' });
    assert.equal(result.success, false);
  });
});
