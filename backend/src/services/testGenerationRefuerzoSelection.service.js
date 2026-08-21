import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testGenerationRefuerzoSelectionService = {
  async selectPreguntasRefuerzo({ userId, temaId, oposicionId, numeroPreguntas = 10, officialidad = 'all', anioExamen = null, anioIds = [], examenId = null }) {
    let preguntas = await testRepository.pickRefuerzoQuestions({
      userId,
      numeroPreguntas,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      officialidad, anio: anioExamen, anioIds, examenId,
    });

    if (preguntas.length < numeroPreguntas && temaId) {
      const excludeIds = preguntas.map((pregunta) => pregunta.id);
      const extra = await testRepository.pickAdaptiveQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
        officialidad, anio: anioExamen, anioIds, examenId,
      });
      preguntas = [...preguntas, ...extra];
    }

    if (preguntas.length === 0) {
      throw new ApiError(400, 'No hay preguntas disponibles para el refuerzo');
    }

    return preguntas;
  },
};
