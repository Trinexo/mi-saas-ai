import { testSubmitScoringNotaService } from './testSubmitScoringNota.service.js';

export const testSubmitScoringEvaluacionService = {
  evaluateRespuestas({ respuestas, mapaRespuestasCorrectas }) {
    let aciertos = 0;
    let errores = 0;
    let blancos = 0;
    const penalizacionErrores = [];

    const respuestasEvaluadas = respuestas.map((respuesta) => {
      const correctaConfig = mapaRespuestasCorrectas.get(respuesta.preguntaId);
      const correctaId = typeof correctaConfig === 'object'
        ? correctaConfig.opcionId
        : correctaConfig;
      let correcta = false;

      if (!respuesta.respuestaId) {
        blancos += 1;
      } else if (correctaId === respuesta.respuestaId) {
        aciertos += 1;
        correcta = true;
      } else {
        errores += 1;
        penalizacionErrores.push(typeof correctaConfig === 'object'
          ? testSubmitScoringNotaService.getPenalizacionPorOpciones(correctaConfig.totalOpciones)
          : 0.33);
      }

      return {
        preguntaId: respuesta.preguntaId,
        respuestaId: respuesta.respuestaId,
        correcta,
      };
    });

    const total = mapaRespuestasCorrectas.size;
    blancos = Math.max(blancos, total - (aciertos + errores));
    const nota = testSubmitScoringNotaService.calcNota({ aciertos, errores, total, penalizacionErrores });

    return {
      aciertos,
      errores,
      blancos,
      nota,
      respuestasEvaluadas,
    };
  },
};
