import { ApiError } from '../utils/api-error.js';

export const testSubmitValidationService = {
  assertTestExistsAndOwner(test, userId) {
    if (!test || test.usuario_id !== userId) {
      throw new ApiError(404, 'Test no encontrado');
    }
  },

  assertTestNotFinalized(test) {
    if (test.estado === 'finalizado') {
      throw new ApiError(409, 'El test ya fue enviado');
    }
  },

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
