import { ApiError } from '../utils/api-error.js';

export const testSubmitValidationRespuestasService = {
  assertNoDuplicateRespuestas(respuestas) {
    const preguntaIds = respuestas.map((item) => item.preguntaId);
    const uniquePreguntaIds = new Set(preguntaIds);

    if (uniquePreguntaIds.size !== preguntaIds.length) {
      throw new ApiError(400, 'Respuestas duplicadas para la misma pregunta');
    }

    return uniquePreguntaIds;
  },

  assertPreguntasBelongToTest(uniquePreguntaIds, mapaRespuestasCorrectas) {
    for (const preguntaId of uniquePreguntaIds) {
      if (!mapaRespuestasCorrectas.has(preguntaId)) {
        throw new ApiError(400, 'Hay preguntas que no pertenecen al test');
      }
    }
  },
};