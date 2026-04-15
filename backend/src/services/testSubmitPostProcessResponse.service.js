export const testSubmitPostProcessResponseService = {
  buildSubmitResponse({ testId, aciertos, errores, blancos, nota, tiempoSegundos, respuestasEvaluadas = [] }) {
    const preguntasErroneas = respuestasEvaluadas
      .filter((r) => !r.correcta && r.respuestaId !== null && r.respuestaId !== undefined)
      .map((r) => ({ preguntaId: r.preguntaId, respuestaId: r.respuestaId }));

    return {
      testId,
      aciertos,
      errores,
      blancos,
      nota,
      tiempoSegundos,
      preguntasErroneas,
    };
  },
};