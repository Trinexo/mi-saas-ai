/**
 * Sprint 9 PR 01 — marcadaParamsSchema + marcadasRepository + marcadasService exportados
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { marcadaParamsSchema } from '../../src/schemas/marcadas.schema.js';
import { marcadasRepository } from '../../src/repositories/marcadas.repository.js';
import { marcadasService } from '../../src/services/marcadas.service.js';

describe('marcadaParamsSchema', () => {
  it('acepta preguntaId entero positivo desde string', () => {
    const result = marcadaParamsSchema.safeParse({ preguntaId: '7' });
    assert.equal(result.success, true);
    assert.equal(result.data.preguntaId, 7);
  });

  it('rechaza preguntaId cero', () => {
    const result = marcadaParamsSchema.safeParse({ preguntaId: '0' });
    assert.equal(result.success, false);
  });

  it('rechaza preguntaId negativo', () => {
    const result = marcadaParamsSchema.safeParse({ preguntaId: '-3' });
    assert.equal(result.success, false);
  });

  it('rechaza cuando falta preguntaId', () => {
    const result = marcadaParamsSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('marcadasRepository', () => {
  it('marcar está exportado', () => {
    assert.equal(typeof marcadasRepository.marcar, 'function');
  });

  it('desmarcar está exportado', () => {
    assert.equal(typeof marcadasRepository.desmarcar, 'function');
  });

  it('getMarcadas está exportado', () => {
    assert.equal(typeof marcadasRepository.getMarcadas, 'function');
  });
});

describe('marcadasService', () => {
  it('marcar está exportado', () => {
    assert.equal(typeof marcadasService.marcar, 'function');
  });

  it('desmarcar está exportado', () => {
    assert.equal(typeof marcadasService.desmarcar, 'function');
  });

  it('getMarcadas está exportado', () => {
    assert.equal(typeof marcadasService.getMarcadas, 'function');
  });
});
