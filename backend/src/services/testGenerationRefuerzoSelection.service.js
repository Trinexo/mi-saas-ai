import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testGenerationRefuerzoSelectionService = {
  async selectPreguntasRefuerzo({ userId, temaId, numeroPreguntas = 10 }) {
    let preguntas = await testRepository.pickRefuerzoQuestions({ userId, numeroPreguntas, temaId: temaId || null });

    if (preguntas.length < numeroPreguntas && temaId) {
      const excludeIds = preguntas.map((pregunta) => pregunta.id);
      const extra = await testRepository.pickAdaptiveQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
      });
      preguntas = [...preguntas, ...extra];
    }

    if (preguntas.length === 0) {
      throw new ApiError(400, 'No hay preguntas disponibles para el refuerzo');
    }

    return preguntas;
  },
};