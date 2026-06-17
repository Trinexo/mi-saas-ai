import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { testSubmitScoringNotaService } from '../../src/services/testSubmitScoringNota.service.js';
import { testSubmitScoringEvaluacionService } from '../../src/services/testSubmitScoringEvaluacion.service.js';

describe('testSubmitScoringNotaService', () => {
  it('calcula la penalizacion por fallo segun el numero de opciones', () => {
    assert.equal(testSubmitScoringNotaService.getPenalizacionPorOpciones(3), 0.5);
    assert.equal(testSubmitScoringNotaService.getPenalizacionPorOpciones(4), 1 / 3);
    assert.equal(testSubmitScoringNotaService.getPenalizacionPorOpciones(5), 0.25);
  });

  it('mantiene compatibilidad con penalizacion fija si no recibe detalle por pregunta', () => {
    assert.equal(testSubmitScoringNotaService.calcNota({
      aciertos: 7,
      errores: 3,
      total: 10,
    }), 6.01);
  });
});

describe('testSubmitScoringEvaluacionService', () => {
  it('descuenta 0.5 por error en preguntas de 3 opciones', () => {
    const resultado = testSubmitScoringEvaluacionService.evaluateRespuestas({
      mapaRespuestasCorrectas: new Map([
        [1, { opcionId: 10, totalOpciones: 3 }],
        [2, { opcionId: 20, totalOpciones: 3 }],
      ]),
      respuestas: [
        { preguntaId: 1, respuestaId: 10 },
        { preguntaId: 2, respuestaId: 21 },
      ],
    });

    assert.equal(resultado.aciertos, 1);
    assert.equal(resultado.errores, 1);
    assert.equal(resultado.nota, 2.5);
  });

  it('descuenta 0.25 por error en preguntas de 5 opciones', () => {
    const resultado = testSubmitScoringEvaluacionService.evaluateRespuestas({
      mapaRespuestasCorrectas: new Map([
        [1, { opcionId: 10, totalOpciones: 5 }],
        [2, { opcionId: 20, totalOpciones: 5 }],
      ]),
      respuestas: [
        { preguntaId: 1, respuestaId: 10 },
        { preguntaId: 2, respuestaId: 21 },
      ],
    });

    assert.equal(resultado.nota, 3.75);
  });

  it('mantiene el descuento historico si el mapa de respuestas no trae total de opciones', () => {
    const resultado = testSubmitScoringEvaluacionService.evaluateRespuestas({
      mapaRespuestasCorrectas: new Map([
        [1, 10],
        [2, 20],
      ]),
      respuestas: [
        { preguntaId: 1, respuestaId: 10 },
        { preguntaId: 2, respuestaId: 21 },
      ],
    });

    assert.equal(resultado.nota, 3.35);
  });
});
