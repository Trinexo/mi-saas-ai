import { spacedRepetitionRepository } from '../repositories/spacedRepetition.repository.js';

export const testSubmitPostProcessSpacedService = {
  runSpacedRepetition({ userId, respuestasEvaluadas }) {
    respuestasEvaluadas.forEach((respuesta) => {
      spacedRepetitionRepository
        .upsertRepaso({ userId, preguntaId: respuesta.preguntaId, correcta: respuesta.correcta })
        .catch(() => {});
    });
  },
};