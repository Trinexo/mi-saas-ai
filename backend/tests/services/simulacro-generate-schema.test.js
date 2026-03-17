/**
 * Sprint 7 PR 02 — generateTestSchema: modo 'simulacro' con validación refinada
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTestSchema } from '../../src/schemas/test.schema.js';

describe("generateTestSchema — modo 'simulacro'", () => {
  it("modo 'simulacro' con oposicionId es válido", () => {
    const result = generateTestSchema.safeParse({ oposicionId: 1, numeroPreguntas: 50, modo: 'simulacro' });
    assert.equal(result.success, true);
    assert.equal(result.data.modo, 'simulacro');
    assert.equal(result.data.oposicionId, 1);
  });

  it("modo 'simulacro' sin oposicionId falla con error en oposicionId", () => {
    const result = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 50, modo: 'simulacro' });
    assert.equal(result.success, false);
    const fields = result.error.issues.map((i) => i.path[0]);
    assert.ok(fields.includes('oposicionId'), 'Debe reportar error en oposicionId');
  });

  it("modo 'normal' sin temaId falla con error en temaId", () => {
    const result = generateTestSchema.safeParse({ oposicionId: 1, numeroPreguntas: 10, modo: 'normal' });
    assert.equal(result.success, false);
    const fields = result.error.issues.map((i) => i.path[0]);
    assert.ok(fields.includes('temaId'), 'Debe reportar error en temaId');
  });

  it("modo 'simulacro' acepta duracionSegundos opcional", () => {
    const result = generateTestSchema.safeParse({ oposicionId: 2, numeroPreguntas: 60, modo: 'simulacro', duracionSegundos: 3600 });
    assert.equal(result.success, true);
    assert.equal(result.data.duracionSegundos, 3600);
  });

  it('numeroPreguntas en simulacro acepta hasta 200', () => {
    const result = generateTestSchema.safeParse({ oposicionId: 1, numeroPreguntas: 200, modo: 'simulacro' });
    assert.equal(result.success, true);
  });

  it('modo con valor desconocido sigue fallando', () => {
    const result = generateTestSchema.safeParse({ temaId: 1, numeroPreguntas: 10, modo: 'examen' });
    assert.equal(result.success, false);
  });
});
