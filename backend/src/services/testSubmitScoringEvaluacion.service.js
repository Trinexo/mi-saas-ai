import { testSubmitScoringNotaService } from './testSubmitScoringNota.service.js';

export const testSubmitScoringEvaluacionService = {
  evaluateRespuestas({ respuestas, mapaRespuestasCorrectas }) {
    let aciertos = 0;
    let errores = 0;
    let blancos = 0;

    const respuestasEvaluadas = respuestas.map((respuesta) => {
      const correctaId = mapaRespuestasCorrectas.get(respuesta.preguntaId);
      let correcta = false;

      if (!respuesta.respuestaId) {
        blancos += 1;
      } else if (correctaId === respuesta.respuestaId) {
        aciertos += 1;
        correcta = true;
      } else {
        errores += 1;
      }

      return {
        preguntaId: respuesta.preguntaId,
        respuestaId: respuesta.respuestaId,
        correcta,
      };
    });

    const total = mapaRespuestasCorrectas.size;
    blancos = Math.max(blancos, total - (aciertos + errores));
    const nota = testSubmitScoringNotaService.calcNota({ aciertos, errores, total });

    return {
      aciertos,
      errores,
      blancos,
      nota,
      respuestasEvaluadas,
    };
  },
};