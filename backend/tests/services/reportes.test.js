/**
 * Sprint 11 PR 01 — reportarPreguntaParamsSchema + reportarPreguntaBodySchema
 *                 + reportesRepository + reportesService exportados
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reportarPreguntaParamsSchema, reportarPreguntaBodySchema } from '../../src/schemas/reportes.schema.js';
import { reportesRepository } from '../../src/repositories/reportes.repository.js';
import { reportesService } from '../../src/services/reportes.service.js';

describe('reportarPreguntaParamsSchema', () => {
  it('acepta preguntaId entero positivo desde string', () => {
    const r = reportarPreguntaParamsSchema.safeParse({ preguntaId: '12' });
    assert.equal(r.success, true);
    assert.equal(r.data.preguntaId, 12);
  });

  it('rechaza preguntaId cero', () => {
    const r = reportarPreguntaParamsSchema.safeParse({ preguntaId: '0' });
    assert.equal(r.success, false);
  });

  it('rechaza preguntaId negativo', () => {
    const r = reportarPreguntaParamsSchema.safeParse({ preguntaId: '-5' });
    assert.equal(r.success, false);
  });

  it('rechaza si falta preguntaId', () => {
    const r = reportarPreguntaParamsSchema.safeParse({});
    assert.equal(r.success, false);
  });
});

describe('reportarPreguntaBodySchema', () => {
  it('acepta motivo de 5 o más caracteres', () => {
    const r = reportarPreguntaBodySchema.safeParse({ motivo: 'La respuesta correcta está mal' });
    assert.equal(r.success, true);
  });

  it('rechaza motivo vacío', () => {
    const r = reportarPreguntaBodySchema.safeParse({ motivo: '' });
    assert.equal(r.success, false);
  });

  it('rechaza motivo menor de 5 caracteres', () => {
    const r = reportarPreguntaBodySchema.safeParse({ motivo: 'mal' });
    assert.equal(r.success, false);
  });

  it('rechaza motivo de más de 500 caracteres', () => {
    const r = reportarPreguntaBodySchema.safeParse({ motivo: 'a'.repeat(501) });
    assert.equal(r.success, false);
  });

  it('rechaza si falta motivo', () => {
    const r = reportarPreguntaBodySchema.safeParse({});
    assert.equal(r.success, false);
  });
});

describe('reportesRepository', () => {
  it('createReporte está exportado', () => {
    assert.equal(typeof reportesRepository.createReporte, 'function');
  });
});

describe('reportesService', () => {
  it('reportar está exportado', () => {
    assert.equal(typeof reportesService.reportar, 'function');
  });
});
