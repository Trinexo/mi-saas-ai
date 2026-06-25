/**
 * Sprint 8 PR 01 - reviewParamsSchema + getTestReview + getReview exportados
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { reviewParamsSchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testSessionDetailReviewRepository } from '../../src/repositories/testSessionDetailReview.repository.js';
import { testService } from '../../src/services/test.service.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('reviewParamsSchema', () => {
  it('acepta testId entero positivo y lo coerce desde string', () => {
    const result = reviewParamsSchema.safeParse({ testId: '42' });
    assert.equal(result.success, true);
    assert.equal(result.data.testId, 42);
  });

  it('rechaza testId cero', () => {
    const result = reviewParamsSchema.safeParse({ testId: '0' });
    assert.equal(result.success, false);
  });

  it('rechaza testId negativo', () => {
    const result = reviewParamsSchema.safeParse({ testId: '-5' });
    assert.equal(result.success, false);
  });

  it('rechaza cuando falta testId', () => {
    const result = reviewParamsSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('testRepository - review', () => {
  it('getTestReview esta exportado', () => {
    assert.equal(typeof testRepository.getTestReview, 'function');
  });

  it('oculta soluciones y explicaciones de intentos Albacer antes de superar el modulo', async () => {
    let call = 0;
    pool.query = async () => {
      call += 1;
      if (call === 1) {
        return {
          rows: [{
            id: 10,
            tema_id: 2,
            tema_nombre: 'Tema 1',
            oposicion_id: 3,
            oposicion_nombre: 'Oposicion',
            numero_preguntas: 1,
            tipo_test: 'test',
            fecha_creacion: new Date('2026-01-01T00:00:00Z'),
            modo_preparacion: 'albacer',
            albacer_modulo_id: 5,
            albacer_modulo_estado: 'disponible',
            aciertos: 0,
            errores: 1,
            blancos: 0,
            nota: 0,
            tiempo_segundos: 30,
          }],
        };
      }
      return {
        rows: [{
          pregunta_id: 100,
          enunciado: 'Pregunta',
          explicacion: 'Explicacion secreta',
          imagen_url: null,
          audio_url: null,
          elegida_id: 1001,
          correcta: false,
          correcta_id: 1002,
          opciones: [
            { id: 1001, texto: 'Elegida', correcta: false },
            { id: 1002, texto: 'Correcta', correcta: true },
          ],
        }],
      };
    };

    const data = await testSessionDetailReviewRepository.getTestReview(7, 10);

    assert.equal(data.test.revisionLimitada, true);
    assert.equal(data.preguntas[0].explicacion, null);
    assert.equal(data.preguntas[0].correctaId, null);
    assert.deepEqual(data.preguntas[0].opciones.map((opcion) => opcion.correcta), [false, false]);
  });
});

describe('testService - review', () => {
  it('getReview esta exportado', () => {
    assert.equal(typeof testService.getReview, 'function');
  });
});
