import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testGenerationRefuerzoService = {
  async generateRefuerzo({ userId, temaId, numeroPreguntas = 10 }) {
    let preguntas = await testRepository.pickRefuerzoQuestions({ userId, numeroPreguntas, temaId: temaId || null });

    // Completar con preguntas adaptativas si no hay suficientes falladas
    if (preguntas.length < numeroPreguntas && temaId) {
      const excludeIds = preguntas.map((p) => p.id);
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

    const test = await testRepository.createTest({
      userId,
      temaId: temaId || null,
      oposicionId: null,
      tipoTest: 'refuerzo',
      numeroPreguntas: preguntas.length,
      duracionSegundos: null,
    });
    await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id));

    return {
      testId: test.id,
      temaId: temaId || null,
      numeroPreguntas: preguntas.length,
      modo: 'refuerzo',
      dificultad: 'mixto',
      duracionSegundos: null,
      preguntas,
    };
  },
};
